# backend/schemas.py
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from decimal import Decimal

# --- Category Schemas ---
class CategoryBase(BaseModel):
    name: str

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: int

    class Config:
        from_attributes = True

# --- Product Schemas ---
class ProductBase(BaseModel):
    productName: str
    sku: str
    unit: str
    imageUrl: Optional[str] = None
    supplierName: str
    description: Optional[str] = None
    categoryId: int
    defaultPrice: Decimal = Decimal('0.00')

class ProductCreate(ProductBase):
    pass

class ProductUpdate(ProductBase):
    pass

class Product(ProductBase):
    id: int
    category: Optional[Category] = None  # Populated via SQLAlchemy relationships if defined

    class Config:
        from_attributes = True

# --- Stock Batch Schemas ---
class StockBatchBase(BaseModel):
    batchNumber: str
    manufactureDate: Optional[datetime] = None
    expiryDate: datetime
    retailPrice: Decimal
    currentQuantity: Optional[int] = 0
    productId: int

class StockBatchCreate(StockBatchBase):
    pass

class StockBatch(StockBatchBase):
    id: int
    product: Optional[Product] = None

    class Config:
        from_attributes = True

# --- Stock Transaction Schemas ---
class StockTransactionBase(BaseModel):
    transactionType: str  # 'stock_in', 'sale', 'adjustment', 'return'
    quantity: int
    recordedBy: str

class StockTransactionCreate(StockTransactionBase):
    batchId: int

class StockTransactionUpdate(BaseModel):
    transactionType: Optional[str] = None
    quantity: Optional[int] = None
    recordedBy: Optional[str] = None

class StockTransaction(StockTransactionBase):
    id: int
    batchId: int
    timestamp: datetime

    class Config:
        from_attributes = True
