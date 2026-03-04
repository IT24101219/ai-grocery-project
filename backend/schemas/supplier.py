from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime, date
import re


class SupplierCreate(BaseModel):
    supplierCode: str = ""
    name: str = ""
    companyName: str
    contactPerson: str = ""
    email: str = ""
    phone: str = ""
    address: str = ""
    categories: List[str] = []          # list of category names (e.g. ["Dairy", "Frozen"])
    paymentTerms: str = ""
    importanceLevel: str = "Normal"
    status: str = "Active"
    delivery_day: int = 0
    onTimeRate: float = 0.0
    totalOrders: int = 0
    lateDeliveries: int = 0
    updated_by: str = "system"

    @field_validator("email")
    @classmethod
    def validate_email(cls, v):
        if v and not re.match(r"^[^@]+@[^@]+\.[^@]+$", v):
            raise ValueError("Invalid email format")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v):
        if v and not re.match(r"^[\d\s\+\-\(\)]{7,20}$", v):
            raise ValueError("Phone must be numeric (7-20 digits)")
        return v

    @field_validator("onTimeRate")
    @classmethod
    def validate_on_time_rate(cls, v):
        if v < 0 or v > 100:
            raise ValueError("onTimeRate must be between 0 and 100")
        return v

class SupplierCategoryBase(BaseModel):
    name: str

class SupplierCategoryOut(SupplierCategoryBase):
    id: int

    class Config:
        from_attributes = True

class SupplierOrderCreate(BaseModel):
    supplier_id: int
    order_date: date
    amount: float
    status: str = "Pending"

class SupplierOrderOut(SupplierOrderCreate):
    id: int

    class Config:
        from_attributes = True

class SupplierDeliveryCreate(BaseModel):
    supplier_id: int
    order_id: Optional[int] = None       # links this delivery to the specific order it fulfils
    delivery_date: Optional[date] = None
    expected_date: date
    delivered_on_time: bool = True
    rating: Optional[float] = None

class SupplierDeliveryOut(SupplierDeliveryCreate):
    id: int

    class Config:
        from_attributes = True


class SupplierOut(BaseModel):
    id: int
    supplierCode: str = ""
    name: str = ""
    companyName: str
    contactPerson: str = ""
    email: str = ""
    phone: str = ""
    address: str = ""
    categories: List[str] = []          # serialized as list of category name strings
    paymentTerms: str = ""
    importanceLevel: str = "Normal"
    status: str = "Active"
    delivery_day: int = 0
    onTimeRate: float = 0.0
    totalOrders: int = 0
    lateDeliveries: int = 0
    reliabilityScore: float = 0.0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    updated_by: str = "system"

    @field_validator("categories", mode="before")
    @classmethod
    def serialize_categories(cls, v):
        """Convert list of SupplierCategory ORM objects → list of name strings."""
        if v and hasattr(v[0], "name"):
            return [cat.name for cat in v]
        return v or []

    class Config:
        from_attributes = True


