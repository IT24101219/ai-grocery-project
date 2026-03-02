from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class StockTransaction(Base):
    __tablename__ = "stock_transactions"

    id = Column(Integer, primary_key=True, index=True)
    batchId = Column(Integer, ForeignKey("stock_batches.id"))
    transactionType = Column(String) # 'stock_in', 'sale', 'adjustment', 'return'
    quantity = Column(Integer)
    recordedBy = Column(String)
    timestamp = Column(DateTime)

    batch = relationship("StockBatch", back_populates="transactions")