# backend/APIs/routers.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import crud, schemas, database

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
    return crud.get_categories(db, skip=skip, limit=limit)

@router.post("/categories/", response_model=schemas.Category, status_code=status.HTTP_201_CREATED)
def create_category(category: schemas.CategoryCreate, db: Session = Depends(get_db)):
    return crud.create_category(db=db, category=category)

# --- Products ---
@router.get("/products/", response_model=List[schemas.Product])
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_products(db, skip=skip, limit=limit)

@router.post("/products/", response_model=schemas.Product, status_code=status.HTTP_201_CREATED)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    return crud.create_product(db=db, product=product)

@router.put("/products/{product_id}", response_model=schemas.Product)
def update_product(product_id: int, product: schemas.ProductUpdate, db: Session = Depends(get_db)):
    db_product = crud.update_product(db, product_id, product)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product

@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    try:
        success = crud.delete_product(db, product_id)
        if not success:
            raise HTTPException(status_code=404, detail="Product not found")
        return None
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- Batches ---
@router.get("/batches/", response_model=List[schemas.StockBatch])
def read_batches(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_batches(db, skip=skip, limit=limit)

@router.post("/batches/", response_model=schemas.StockBatch, status_code=status.HTTP_201_CREATED)
def create_batch(batch: schemas.StockBatchCreate, db: Session = Depends(get_db)):
    return crud.create_batch(db=db, batch=batch)

# --- Transactions ---
@router.get("/transactions/", response_model=List[schemas.StockTransaction])
def read_transactions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_transactions(db, skip=skip, limit=limit)

@router.post("/transactions/", response_model=schemas.StockTransaction, status_code=status.HTTP_201_CREATED)
def create_transaction(transaction: schemas.StockTransactionCreate, db: Session = Depends(get_db)):
    try:
        return crud.create_transaction(db=db, transaction=transaction)
    except ValueError as e:
        # Handles ValidationErrors (Insufficient Stock) from crud.py
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/transactions/{transaction_id}", response_model=schemas.StockTransaction)
def update_transaction(transaction_id: int, transaction: schemas.StockTransactionUpdate, db: Session = Depends(get_db)):
    try:
        db_transaction = crud.update_transaction(db, transaction_id, transaction)
        if db_transaction is None:
            raise HTTPException(status_code=404, detail="Transaction not found")
        return db_transaction
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/transactions/{transaction_id}", status_code=status.HTTP_405_METHOD_NOT_ALLOWED)
def delete_transaction(transaction_id: int, db: Session = Depends(get_db)):
    raise HTTPException(status_code=405, detail="Direct deletion of stock transactions is disabled for audit integrity. Please use the Void/Adjust feature.")
