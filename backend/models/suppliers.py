# backend/models/suppliers.py
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Table, Date, Boolean, CheckConstraint
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
    supplierCode = Column(String(50), nullable=True, unique=True, index=True)
    name = Column(String(150), nullable=False, default="")
    companyName = Column(String(200), nullable=False, default="")

    # Contact
    contactPerson = Column(String(100), default="")
    email = Column(String(100), default="", unique=True)
    phone = Column(String(50), default="")
    address = Column(Text, default="")

    # for future use for classification
    paymentTerms = Column(String(50), default="")
    importanceLevel = Column(String(50), default="Regular Supplier")
    status = Column(String(50), default="Active", index=True)

    # Performance
    onTimeRate = Column(Float, default=0.0)

    # Rule-Based Score
    reliabilityScore = Column(Float, default=0.0)

    # Audit
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = Column(String(100), default="system")

    # Constraints
    __table_args__ = (
        CheckConstraint("onTimeRate >= 0 AND onTimeRate <= 100", name="chk_on_time_rate"),
    )

    # Relationships
    categories = relationship("SupplierCategory", secondary=suppliers_categories, back_populates="suppliers")
    orders = relationship("SupplierOrder", back_populates="supplier", cascade="all, delete")
    deliveries = relationship("SupplierDelivery", back_populates="supplier", cascade="all, delete")


# order table
class SupplierOrder(Base):
    __tablename__ = "supplier_orders"
    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(30), unique=True, index=True)   # e.g. PO-20260305-001
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    order_date = Column(Date, nullable=False)
    expected_delivery_date = Column(Date, nullable=True)
    status = Column(String(50), default="Pending")               # Pending / Approved / Shipped / Delivered / Cancelled
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    supplier = relationship("Supplier", back_populates="orders")
    items = relationship("SupplierOrderItem", back_populates="order", cascade="all, delete")
    deliveries = relationship("SupplierDelivery", back_populates="order")


# order line-item table
class SupplierOrderItem(Base):
    __tablename__ = "supplier_order_items"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("supplier_orders.id"), nullable=False)
    item_name = Column(String(200), nullable=False)
    quantity = Column(Float, nullable=False, default=1)
    unit_price = Column(Float, nullable=False, default=0.0)

    order = relationship("SupplierOrder", back_populates="items")


# delivery table
class SupplierDelivery(Base):
    __tablename__ = "supplier_deliveries"
    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    order_id = Column(Integer, ForeignKey("supplier_orders.id"), nullable=True)
    delivery_date = Column(Date, nullable=True)
    expected_date = Column(Date, nullable=False)
    delivered_on_time = Column(Boolean, default=True)
    rating = Column(Float, nullable=True)

    supplier = relationship("Supplier", back_populates="deliveries")
    order = relationship("SupplierOrder", back_populates="deliveries")