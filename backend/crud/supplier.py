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
            importanceLevel=row.get("ImportanceLevel", "Regular Supplier"),
            status=row.get("Status", "Active"),
            onTimeRate=float(row.get("OnTimeRate", 0) or 0),
        )
        # Parse comma-separated categories from CSV
        cat_names = [c.strip() for c in row.get("Categories", "").split(",") if c.strip()]
        _set_categories(db, supplier, cat_names)
        db.add(supplier)
        imported += 1
    db.commit()
    return imported


# ── Order CRUD

def _generate_order_number(db: Session) -> str:
    """Generate a unique PO number like PO-20260305-001."""
    from datetime import date as date_type
    today = date_type.today().strftime("%Y%m%d")
    prefix = f"PO-{today}-"
    # Find highest sequence for today
    last = (
        db.query(models.SupplierOrder)
        .filter(models.SupplierOrder.order_number.like(f"{prefix}%"))
        .order_by(models.SupplierOrder.order_number.desc())
        .first()
    )
    if last and last.order_number:
        try:
            seq = int(last.order_number.split("-")[-1]) + 1
        except ValueError:
            seq = 1
    else:
        seq = 1
    return f"{prefix}{seq:03d}"


def create_order(db: Session, order: schemas.SupplierOrderCreate):
    items_data = order.items
    order_data = order.model_dump(exclude={"items"})
    db_order = models.SupplierOrder(
        **order_data,
        order_number=_generate_order_number(db),
    )
    db.add(db_order)
    db.flush()  # get db_order.id before committing
    for item in items_data:
        db_item = models.SupplierOrderItem(order_id=db_order.id, **item.model_dump())
        db.add(db_item)
    db.commit()
    db.refresh(db_order)
    return db_order


def get_orders(db: Session, supplier_id: int = None):
    from sqlalchemy.orm import selectinload
    query = db.query(models.SupplierOrder).options(
        selectinload(models.SupplierOrder.items),
        selectinload(models.SupplierOrder.supplier)
    )
    if supplier_id:
        query = query.filter(models.SupplierOrder.supplier_id == supplier_id)
    return query.order_by(models.SupplierOrder.created_at.desc()).all()


def get_order(db: Session, order_id: int):
    from sqlalchemy.orm import selectinload
    return (
        db.query(models.SupplierOrder)
        .options(selectinload(models.SupplierOrder.items), selectinload(models.SupplierOrder.supplier))
        .filter(models.SupplierOrder.id == order_id)
        .first()
    )


def update_order_status(db: Session, order_id: int, status: str):
    order = db.query(models.SupplierOrder).filter(models.SupplierOrder.id == order_id).first()
    if order:
        order.status = status
        db.commit()
        db.refresh(order)
    return order


def delete_order(db: Session, order_id: int):
    order = db.query(models.SupplierOrder).filter(models.SupplierOrder.id == order_id).first()
    if order:
        db.delete(order)
        db.commit()
    return order


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
    """
    Auto-update totalOrders, lateDeliveries, onTimeRate, and reliabilityScore
    based on real delivery data.

    Score formula (0 – 10):
        on_time_factor = onTimeRate / 100               (0→1)
        volume_factor  = min(totalOrders / 20, 1.0)     (0→1, caps at 20 deliveries)
        late_ratio     = lateDeliveries / totalOrders   (0→1)

        reliabilityScore = 6×on_time_factor
                         + 2×volume_factor
                         - 2×late_ratio
                         clamped to [0, 10]

    Interpretation: ≥8 = Excellent, 6–8 = Good, 4–6 = Average, <4 = Poor
    """
    deliveries = db.query(models.SupplierDelivery).filter(
        models.SupplierDelivery.supplier_id == supplier_id
    ).all()
    supplier = db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()

    if not supplier:
        return

    # Only count completed deliveries towards the score
    completed_deliveries = [d for d in deliveries if d.delivery_date is not None]
    total = len(completed_deliveries)
    
    if total == 0:
        supplier.onTimeRate = 0.0
        supplier.reliabilityScore = 0.0
    else:
        late = sum(1 for d in completed_deliveries if not d.delivered_on_time)
        on_time = total - late

        supplier.onTimeRate = round((on_time / total) * 100, 2)

        # ── Scoring formula ───────────────────────────────────────────────
        on_time_factor = supplier.onTimeRate / 100          # 0.0 – 1.0
        volume_factor  = min(total / 20, 1.0)               # 0.0 – 1.0
        late_ratio     = late / total                        # 0.0 – 1.0

        raw_score = (
            6 * on_time_factor    # on-time delivery is the most important factor
          + 2 * volume_factor     # track-record bonus (more deliveries = more trusted)
          - 2 * late_ratio        # penalty for late deliveries
        )
        supplier.reliabilityScore = round(max(0.0, min(10.0, raw_score)), 2)

    db.commit()
