from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class StockBatch(Base):
    __tablename__ = "stock_batches"

    id = Column(Integer, primary_key=True, index=True)
    productId = Column(Integer, ForeignKey("products.id"))
    batchNumber = Column(String, index=True)
    manufactureDate = Column(DateTime, nullable=True)
    expiryDate = Column(DateTime)
    retailPrice = Column(Numeric(10, 2))
    currentQuantity = Column(Integer, default=0)

    product = relationship("Product", back_populates="batches")
    transactions = relationship("StockTransaction", back_populates="batch")