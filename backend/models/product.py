from sqlalchemy import Column, Integer, String, Text, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    categoryId = Column(Integer, ForeignKey("categories.id"))
    productName = Column(String, index=True)
    sku = Column(String, unique=True, index=True)
    unit = Column(String)
    imageUrl = Column(String, nullable=True)
    supplierName = Column(String)
    description = Column(Text, nullable=True)
    defaultPrice = Column(Numeric(10, 2), nullable=True, default=0.00)

    category = relationship("Category", back_populates="products")
    batches = relationship("StockBatch", back_populates="product")