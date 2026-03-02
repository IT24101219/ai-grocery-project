# backend/APIs/routers.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import schemas, database, models

router = APIRouter(
    prefix="/api",
    tags=["Inventory Management"]
)

# Dependency
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Categories ---
@router.get("/categories/", response_model=List[schemas.Category])
def read_categories(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Category).offset(skip).limit(limit).all()

@router.post("/categories/", response_model=schemas.Category, status_code=status.HTTP_201_CREATED)
def create_category(category: schemas.CategoryCreate, db: Session = Depends(get_db)):
    db_category = models.Category(**category.model_dump())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

# --- Products ---
@router.get("/products/", response_model=List[schemas.Product])
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Product).offset(skip).limit(limit).all()

@router.post("/products/", response_model=schemas.Product, status_code=status.HTTP_201_CREATED)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    db_product = models.Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@router.put("/products/{product_id}", response_model=schemas.Product)
def update_product(product_id: int, product: schemas.ProductUpdate, db: Session = Depends(get_db)):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
        
    for key, value in product.model_dump(exclude_unset=True).items():
        setattr(db_product, key, value)
    db.commit()
    db.refresh(db_product)
    return db_product

@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    # 1. Enforce RESTRICT constraint programmatically
    # Check if any active batches exist for this product.
    active_batches = db.query(models.StockBatch).filter(models.StockBatch.productId == product_id).first()
    if active_batches:
        raise HTTPException(status_code=400, detail="Cannot delete Product: It is actively linked to stock batches. Please void or delete related batches first.")

    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    db.delete(db_product)
    db.commit()
    return None

# --- Batches ---
@router.get("/batches/", response_model=List[schemas.StockBatch])
def read_batches(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.StockBatch).offset(skip).limit(limit).all()

@router.post("/batches/", response_model=schemas.StockBatch, status_code=status.HTTP_201_CREATED)
def create_batch(batch: schemas.StockBatchCreate, db: Session = Depends(get_db)):
    db_batch = models.StockBatch(**batch.model_dump())
    db.add(db_batch)
    db.commit()
    db.refresh(db_batch)
    
    # Automatically log the initial stock delivery to the Transaction Audit Trail
    if db_batch.currentQuantity > 0:
        initial_transaction = models.StockTransaction(
            batchId=db_batch.id,
            transactionType='stock_in',
            quantity=db_batch.currentQuantity,
            recordedBy='System Auto-Log (Delivery)',
            timestamp=datetime.now(timezone.utc)
        )
        db.add(initial_transaction)
        db.commit()
        
    return db_batch

# --- Transactions ---
@router.get("/transactions/", response_model=List[schemas.StockTransaction])
def read_transactions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.StockTransaction).order_by(models.StockTransaction.timestamp.desc()).offset(skip).limit(limit).all()

@router.post("/transactions/", response_model=schemas.StockTransaction, status_code=status.HTTP_201_CREATED)
def create_transaction(transaction: schemas.StockTransactionCreate, db: Session = Depends(get_db)):
    # Retrieve linked Batch securely
    db_batch = db.query(models.StockBatch).filter(models.StockBatch.id == transaction.batchId).first()
    if not db_batch:
        raise HTTPException(status_code=400, detail="Linked Batch not found.")

    # Calculate quantity mutation rule
    if transaction.transactionType in ['stock_in', 'return']:
        db_batch.currentQuantity += transaction.quantity
        
    elif transaction.transactionType == 'sale':
        if db_batch.currentQuantity < transaction.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock processing sale. Only {db_batch.currentQuantity} remaining.")
        db_batch.currentQuantity -= transaction.quantity
        
    elif transaction.transactionType == 'adjustment':
        # Adjustment quantity handles both positive and negative direct additions
        db_batch.currentQuantity += transaction.quantity
        
    else:
        raise HTTPException(status_code=400, detail="Invalid transactionType. Expected: stock_in, sale, adjustment, return.")

    # Construct the actual transaction object, stamping it with UTC time
    db_transaction = models.StockTransaction(
        **transaction.model_dump(),
        timestamp=datetime.now(timezone.utc)
    )
    
    # Push both modifications atomically
    db.add(db_transaction)
    db.add(db_batch)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

@router.put("/transactions/{transaction_id}", response_model=schemas.StockTransaction)
def update_transaction(transaction_id: int, transaction_update: schemas.StockTransactionUpdate, db: Session = Depends(get_db)):
    db_transaction = db.query(models.StockTransaction).filter(models.StockTransaction.id == transaction_id).first()
    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    db_batch = db.query(models.StockBatch).filter(models.StockBatch.id == db_transaction.batchId).first()
    if not db_batch:
        raise HTTPException(status_code=400, detail="Linked Batch not found.")

    update_data = transaction_update.model_dump(exclude_unset=True)
    
    new_type = update_data.get('transactionType', db_transaction.transactionType)
    new_quantity = update_data.get('quantity', db_transaction.quantity)

    # 1. Reverse the effect of the ORIGINAL transaction
    if db_transaction.transactionType in ['stock_in', 'return']:
        db_batch.currentQuantity -= db_transaction.quantity
    elif db_transaction.transactionType == 'sale':
        db_batch.currentQuantity += db_transaction.quantity
    elif db_transaction.transactionType == 'adjustment':
        db_batch.currentQuantity -= db_transaction.quantity

    # 2. Apply the effect of the NEW transaction
    if new_type in ['stock_in', 'return']:
        db_batch.currentQuantity += new_quantity
    elif new_type == 'sale':
        db_batch.currentQuantity -= new_quantity
    elif new_type == 'adjustment':
        db_batch.currentQuantity += new_quantity

    for key, value in update_data.items():
        setattr(db_transaction, key, value)

    db.add(db_transaction)
    db.add(db_batch)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

@router.delete("/transactions/{transaction_id}", status_code=status.HTTP_405_METHOD_NOT_ALLOWED)
def delete_transaction(transaction_id: int, db: Session = Depends(get_db)):
    raise HTTPException(status_code=405, detail="Direct deletion of stock transactions is disabled for audit integrity. Please use the Void/Adjust feature.")
