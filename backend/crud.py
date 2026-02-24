from sqlalchemy.orm import Session
from datetime import datetime
import models, schemas
import io, csv


def create_supplier(db: Session, supplier: schemas.SupplierCreate):
    db_supplier = models.Supplier(**supplier.model_dump())
    db_supplier.created_at = datetime.utcnow()
    db_supplier.updated_at = datetime.utcnow()
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier


def get_suppliers(db: Session, search: str = None, category: str = None, status: str = None, sort: str = "name-asc"):
    query = db.query(models.Supplier)

    if search:
        q = f"%{search.lower()}%"
        query = query.filter(
            models.Supplier.companyName.ilike(q) |
            models.Supplier.name.ilike(q) |
            models.Supplier.supplierCode.ilike(q) |
            models.Supplier.phone.ilike(q) |
            models.Supplier.contactPerson.ilike(q)
        )

    if category and category != "All":
        query = query.filter(models.Supplier.category.ilike(f"%{category}%"))

    if status and status != "All":
        query = query.filter(models.Supplier.status == status)

    results = query.all()

    # Sort
    reverse = False
    key = "companyName"
    if sort == "name-desc":
        key, reverse = "companyName", True
    elif sort == "reliability-desc":
        key, reverse = "reliabilityScore", True
    elif sort == "lead-asc":
        key, reverse = "delivery_day", False
    elif sort == "lead-desc":
        key, reverse = "delivery_day", True
    elif sort == "status":
        key, reverse = "status", False

    results.sort(key=lambda s: (getattr(s, key) or 0) if isinstance(getattr(s, key), (int, float)) else (getattr(s, key) or ""), reverse=reverse)
    return results


def get_supplier(db: Session, supplier_id: int):
    return db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()


def update_supplier(db: Session, supplier_id: int, data: schemas.SupplierCreate):
    supplier = get_supplier(db, supplier_id)
    if supplier:
        update_data = data.model_dump()
        for key, value in update_data.items():
            setattr(supplier, key, value)
        supplier.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(supplier)
    return supplier


def delete_supplier(db: Session, supplier_id: int):
    supplier = get_supplier(db, supplier_id)
    if supplier:
        supplier.status = "Inactive"
        supplier.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(supplier)
    return supplier


def get_suppliers_for_export(db: Session):
    suppliers = db.query(models.Supplier).all()
    rows = []
    for s in suppliers:
        rows.append({
            "ID": s.id,
            "SupplierCode": s.supplierCode,
            "Name": s.name,
            "CompanyName": s.companyName,
            "ContactPerson": s.contactPerson,
            "Email": s.email,
            "Phone": s.phone,
            "Address": s.address,
            "Category": s.category,
            "PaymentTerms": s.paymentTerms,
            "ImportanceLevel": s.importanceLevel,
            "Status": s.status,
            "DeliveryDay": s.delivery_day,
            "OnTimeRate": s.onTimeRate,
            "TotalOrders": s.totalOrders,
            "LateDeliveries": s.lateDeliveries,
            "ReliabilityScore": s.reliabilityScore,
            "CreatedAt": s.created_at,
            "UpdatedAt": s.updated_at,
            "UpdatedBy": s.updated_by,
        })
    return rows


def import_suppliers_from_csv(db: Session, file_content: str):
    reader = csv.DictReader(io.StringIO(file_content))
    imported = 0
    for row in reader:
        supplier = models.Supplier(
            supplierCode=row.get("SupplierCode", ""),
            name=row.get("Name", ""),
            companyName=row.get("CompanyName", ""),
            contactPerson=row.get("ContactPerson", ""),
            email=row.get("Email", ""),
            phone=row.get("Phone", ""),
            address=row.get("Address", ""),
            category=row.get("Category", ""),
            paymentTerms=row.get("PaymentTerms", ""),
            importanceLevel=row.get("ImportanceLevel", "Normal"),
            status=row.get("Status", "Active"),
            delivery_day=int(row.get("DeliveryDay", 0) or 0),
            onTimeRate=float(row.get("OnTimeRate", 0) or 0),
            totalOrders=int(row.get("TotalOrders", 0) or 0),
            lateDeliveries=int(row.get("LateDeliveries", 0) or 0),
        )
        db.add(supplier)
        imported += 1
    db.commit()
    return imported