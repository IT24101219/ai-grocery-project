from sqlalchemy.orm import Session, selectinload
from datetime import datetime
import models, schemas
import io, csv


def _set_categories(db: Session, supplier: models.Supplier, category_names: list):
    """Resolve category names to SupplierCategory rows and link them to the supplier."""
    cats = []
    for name in category_names:
        name = name.strip()
        if not name:
            continue
        cat = db.query(models.SupplierCategory).filter_by(name=name).first()
        if not cat:
            cat = models.SupplierCategory(name=name)
            db.add(cat)
        cats.append(cat)
    supplier.categories = cats


def create_supplier(db: Session, supplier: schemas.SupplierCreate):
    category_names = supplier.categories
    data = supplier.model_dump(exclude={"categories"})
    db_supplier = models.Supplier(**data)
    db_supplier.created_at = datetime.utcnow()
    db_supplier.updated_at = datetime.utcnow()
    _set_categories(db, db_supplier, category_names)
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier


def get_suppliers(db: Session, search: str = None, category: str = None, status: str = None, sort: str = "name-asc"):
    query = db.query(models.Supplier).options(selectinload(models.Supplier.categories))

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
        query = query.filter(
            models.Supplier.categories.any(models.SupplierCategory.name == category)
        )

    if status and status != "All":
        query = query.filter(models.Supplier.status == status)

    results = query.all()

    # Sort in memory
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

    results.sort(
        key=lambda s: (getattr(s, key) or 0) if isinstance(getattr(s, key), (int, float))
        else (getattr(s, key) or ""),
        reverse=reverse
    )
    return results


def get_supplier(db: Session, supplier_id: int):
    return (
        db.query(models.Supplier)
        .options(selectinload(models.Supplier.categories))
        .filter(models.Supplier.id == supplier_id)
        .first()
    )


def update_supplier(db: Session, supplier_id: int, data: schemas.SupplierCreate):
    supplier = get_supplier(db, supplier_id)
    if supplier:
        category_names = data.categories
        update_data = data.model_dump(exclude={"categories"})
        for key, value in update_data.items():
            setattr(supplier, key, value)
        supplier.updated_at = datetime.utcnow()
        _set_categories(db, supplier, category_names)
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
    suppliers = db.query(models.Supplier).options(selectinload(models.Supplier.categories)).all()
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
            "Categories": ", ".join(cat.name for cat in s.categories),
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
            paymentTerms=row.get("PaymentTerms", ""),
            importanceLevel=row.get("ImportanceLevel", "Normal"),
            status=row.get("Status", "Active"),
            delivery_day=int(row.get("DeliveryDay", 0) or 0),
            onTimeRate=float(row.get("OnTimeRate", 0) or 0),
            totalOrders=int(row.get("TotalOrders", 0) or 0),
            lateDeliveries=int(row.get("LateDeliveries", 0) or 0),
        )
        # Parse comma-separated categories from CSV
        cat_names = [c.strip() for c in row.get("Categories", "").split(",") if c.strip()]
        _set_categories(db, supplier, cat_names)
        db.add(supplier)
        imported += 1
    db.commit()
    return imported


# ── Delivery CRUD ────────────────────────────────────────────────────────────

def create_delivery(db: Session, delivery: schemas.SupplierDeliveryCreate):
    db_delivery = models.SupplierDelivery(**delivery.model_dump())
    db.add(db_delivery)
    db.commit()
    db.refresh(db_delivery)
    _recompute_supplier_performance(db, delivery.supplier_id)
    return db_delivery


def get_deliveries(db: Session, supplier_id: int):
    return db.query(models.SupplierDelivery).filter(
        models.SupplierDelivery.supplier_id == supplier_id
    ).order_by(models.SupplierDelivery.expected_date.desc()).all()


def update_delivery(db: Session, delivery_id: int, data: schemas.SupplierDeliveryCreate):
    delivery = db.query(models.SupplierDelivery).filter(models.SupplierDelivery.id == delivery_id).first()
    if delivery:
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(delivery, key, value)
        db.commit()
        db.refresh(delivery)
        _recompute_supplier_performance(db, delivery.supplier_id)
    return delivery


def delete_delivery(db: Session, delivery_id: int):
    delivery = db.query(models.SupplierDelivery).filter(models.SupplierDelivery.id == delivery_id).first()
    if delivery:
        supplier_id = delivery.supplier_id
        db.delete(delivery)
        db.commit()
        _recompute_supplier_performance(db, supplier_id)
    return delivery


def _recompute_supplier_performance(db: Session, supplier_id: int):
    """Auto-update totalOrders, lateDeliveries, and onTimeRate based on real delivery data."""
    deliveries = db.query(models.SupplierDelivery).filter(
        models.SupplierDelivery.supplier_id == supplier_id
    ).all()
    supplier = db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()
    
    if not supplier:
        return

    total = len(deliveries)
    if total == 0:
        supplier.totalOrders = 0
        supplier.lateDeliveries = 0
        supplier.onTimeRate = 0.0
    else:
        # Assuming a delivery record roughly corresponds to a fulfilled order for performance tracking
        late = sum(1 for d in deliveries if not d.delivered_on_time)
        on_time = total - late
        
        supplier.totalOrders = total
        supplier.lateDeliveries = late
        supplier.onTimeRate = round((on_time / total) * 100, 2)
    
    db.commit()