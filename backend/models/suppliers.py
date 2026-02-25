# backend/models/suppliers.py
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Table, Date, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

# Association table for Supplier <-> Category (many-to-many)
suppliers_categories = Table(
    "suppliers_categories",
    Base.metadata,
    Column("supplier_id", Integer, ForeignKey("suppliers.id"), primary_key=True),
    Column("category_id", Integer, ForeignKey("supplier_categories.id"), primary_key=True)
)

# category table
class SupplierCategory(Base):
    __tablename__ = "supplier_categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    
    suppliers = relationship("Supplier", secondary=suppliers_categories, back_populates="categories")

# supplier table
class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)

    # Identification
    supplierCode = Column(String(50), nullable=True)
    name = Column(String(150), nullable=False, default="")
    companyName = Column(String(200), nullable=False, default="")

    # Contact
    contactPerson = Column(String(100), default="")
    email = Column(String(100), default="")
    phone = Column(String(50), default="")
    address = Column(Text, default="")

    # Classification
    category = Column(String(500), default="")
    paymentTerms = Column(String(50), default="")
    importanceLevel = Column(String(50), default="Normal")
    status = Column(String(50), default="Active")

    # Performance
    delivery_day = Column(Integer, default=0)
    onTimeRate = Column(Float, default=0.0)
    totalOrders = Column(Integer, default=0)
    lateDeliveries = Column(Integer, default=0)
    score = Column(Integer, default=50)

    # AI/ML
    reliabilityScore = Column(Float, default=0.0)

    # Audit
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = Column(String(100), default="system")
    
    # Relationships
    categories = relationship("SupplierCategory", secondary=suppliers_categories, back_populates="suppliers")
    orders = relationship("SupplierOrder", back_populates="supplier", cascade="all, delete")
    deliveries = relationship("SupplierDelivery", back_populates="supplier", cascade="all, delete")

# order table
class SupplierOrder(Base):
    __tablename__ = "supplier_orders"
    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    order_date = Column(Date, nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String(50), default="Pending")
    
    supplier = relationship("Supplier", back_populates="orders")

# delivery table
class SupplierDelivery(Base):
    __tablename__ = "supplier_deliveries"
    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    delivery_date = Column(Date, nullable=True)
    expected_date = Column(Date, nullable=False)
    delivered_on_time = Column(Boolean, default=True)
    rating = Column(Float, nullable=True)
    
    supplier = relationship("Supplier", back_populates="deliveries")