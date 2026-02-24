# backend/crud.py
from sqlalchemy.orm import Session
import models, schemas
from datetime import datetime, timezone

# --- Categories ---
def get_categories(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Category).offset(skip).limit(limit).all()

def create_category(db: Session, category: schemas.CategoryCreate):
    db_category = models.Category(**category.model_dump())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

# --- Products ---
def get_products(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Product).offset(skip).limit(limit).all()

def create_product(db: Session, product: schemas.ProductCreate):
    db_product = models.Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def update_product(db: Session, product_id: int, product: schemas.ProductUpdate):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if db_product:
        for key, value in product.model_dump(exclude_unset=True).items():
            setattr(db_product, key, value)
        db.commit()
        db.refresh(db_product)
    return db_product

def delete_product(db: Session, product_id: int):
    # 1. Enforce RESTRICT constraint programmatically
    # Check if any active batches exist for this product.
    active_batches = db.query(models.StockBatch).filter(models.StockBatch.productId == product_id).first()
    if active_batches:
        raise ValueError("Cannot delete Product: It is actively linked to stock batches. Please void or delete related batches first.")

    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if db_product:
        db.delete(db_product)
        db.commit()
        return True
    return False

# --- Batches ---
def get_batches(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.StockBatch).offset(skip).limit(limit).all()

def create_batch(db: Session, batch: schemas.StockBatchCreate):
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

# --- Transactions (Includes the Custom Auto-Stock Adjustment Logic) ---
def get_transactions(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.StockTransaction).order_by(models.StockTransaction.timestamp.desc()).offset(skip).limit(limit).all()

def create_transaction(db: Session, transaction: schemas.StockTransactionCreate):
    # Retrieve linked Batch securely
    db_batch = db.query(models.StockBatch).filter(models.StockBatch.id == transaction.batchId).first()
    if not db_batch:
        raise ValueError("Linked Batch not found.")

    # Calculate quantity mutation rule
    if transaction.transactionType in ['stock_in', 'return']:
        db_batch.currentQuantity += transaction.quantity
        
    elif transaction.transactionType == 'sale':
        if db_batch.currentQuantity < transaction.quantity:
            raise ValueError(f"Insufficient stock processing sale. Only {db_batch.currentQuantity} remaining.")
        db_batch.currentQuantity -= transaction.quantity
        
    elif transaction.transactionType == 'adjustment':
        # Adjustment quantity handles both positive and negative direct additions
        db_batch.currentQuantity += transaction.quantity
        
    else:
        raise ValueError("Invalid transactionType. Expected: stock_in, sale, adjustment, return.")

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

def update_transaction(db: Session, transaction_id: int, transaction_update: schemas.StockTransactionUpdate):
    db_transaction = db.query(models.StockTransaction).filter(models.StockTransaction.id == transaction_id).first()
    if not db_transaction:
        return None

    db_batch = db.query(models.StockBatch).filter(models.StockBatch.id == db_transaction.batchId).first()
    if not db_batch:
        raise ValueError("Linked Batch not found.")

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

def delete_transaction(db: Session, transaction_id: int):
    db_transaction = db.query(models.StockTransaction).filter(models.StockTransaction.id == transaction_id).first()
    if not db_transaction:
        return False

    db_batch = db.query(models.StockBatch).filter(models.StockBatch.id == db_transaction.batchId).first()
    if db_batch:
        # Reverse the original quantity effect before deleting
        if db_transaction.transactionType in ['stock_in', 'return']:
            db_batch.currentQuantity -= db_transaction.quantity
        elif db_transaction.transactionType == 'sale':
            db_batch.currentQuantity += db_transaction.quantity
        elif db_transaction.transactionType == 'adjustment':
            db_batch.currentQuantity -= db_transaction.quantity
            
        db.add(db_batch)

    db.delete(db_transaction)
    db.commit()
    return True
