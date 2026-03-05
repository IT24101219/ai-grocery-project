# backend/APIs/suppliers.py

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel as _BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional
import io
import csv

import models
import schemas
import crud
from database import get_db

router = APIRouter(
    tags=["Suppliers"],
)

#  SUPPLIERS  CRUD
@router.post("/suppliers", response_model=schemas.SupplierOut, status_code=201, tags=["Suppliers"])
def create_supplier(supplier: schemas.SupplierCreate, db: Session = Depends(get_db)):
    try:
        return crud.create_supplier(db, supplier)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/suppliers", response_model=List[schemas.SupplierOut], tags=["Suppliers"])
def get_suppliers(
        search: Optional[str] = Query(None),
        category: Optional[str] = Query(None),
        status: Optional[str] = Query(None),
        sort: Optional[str] = Query("name-asc"),
        db: Session = Depends(get_db),
):
    return crud.get_suppliers(db, search=search, category=category, status=status, sort=sort)


@router.get("/suppliers/export/csv", tags=["Suppliers"])
def export_suppliers_csv(db: Session = Depends(get_db)):
    rows = crud.get_suppliers_for_export(db)
    if not rows:
        raise HTTPException(status_code=404, detail="No suppliers to export")

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=rows[0].keys())
    writer.writeheader()
    writer.writerows(rows)
    output.seek(0)

    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=suppliers.csv"},
    )


@router.post("/suppliers/import/csv", tags=["Suppliers"])
async def import_suppliers_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        content = await file.read()
        text_content = content.decode("utf-8")
        count = crud.import_suppliers_from_csv(db, text_content)
        return {"imported": count, "message": f"Successfully imported {count} suppliers"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Import failed: {str(e)}")


@router.get("/suppliers/{supplier_id}", response_model=schemas.SupplierOut, tags=["Suppliers"])
def get_supplier(supplier_id: int, db: Session = Depends(get_db)):
    supplier = crud.get_supplier(db, supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier


@router.put("/suppliers/{supplier_id}", response_model=schemas.SupplierOut, tags=["Suppliers"])
def update_supplier(supplier_id: int, supplier: schemas.SupplierCreate, db: Session = Depends(get_db)):
    try:
        result = crud.update_supplier(db, supplier_id, supplier)
        if not result:
            raise HTTPException(status_code=404, detail="Supplier not found")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/suppliers/{supplier_id}", response_model=schemas.SupplierOut, tags=["Suppliers"])
def delete_supplier(supplier_id: int, db: Session = Depends(get_db)):
    result = crud.delete_supplier(db, supplier_id)
    if not result:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return result


#  CATEGORIES
@router.get("/categories", response_model=List[schemas.SupplierCategoryOut], tags=["Suppliers"])
def list_categories(db: Session = Depends(get_db)):
    """Return all available supplier categories"""
    return db.query(models.SupplierCategory).order_by(models.SupplierCategory.name).all()


#  ANALYTICS
@router.get("/analytics", tags=["Suppliers"])
def analytics(db: Session = Depends(get_db)):
    suppliers = crud.get_suppliers(db)

    total = len(suppliers)
    active_list = [s for s in suppliers if s.status == "Active"]
    inactive_list = [s for s in suppliers if s.status == "Inactive"]
    active = len(active_list)
    inactive = len(inactive_list)

    by_importance = {}
    mapping = {
        "Normal": "Regular Supplier",
        "Preferred": "Trusted Supplier",
        "Critical": "Important Supplier"
    }
    for s in suppliers:
        raw_key = s.importanceLevel or "Regular Supplier"
        key = mapping.get(raw_key, raw_key)
        by_importance[key] = by_importance.get(key, 0) + 1
    priority_chart = [{"label": k, "value": v} for k, v in by_importance.items()]

    by_category = {}
    for s in suppliers:
        for cat in s.categories:             
            by_category[cat.name] = by_category.get(cat.name, 0) + 1
    category_chart = [{"label": k, "value": v} for k, v in sorted(by_category.items(), key=lambda x: -x[1])]

    sorted_active = sorted(active_list, key=lambda s: s.reliabilityScore or 0, reverse=True)
    top5    = [{"id": s.id, "label": s.companyName, "value": round(s.reliabilityScore or 0, 2), "reliabilityScore": round(s.reliabilityScore or 0, 2)} for s in sorted_active[:5]]
    bottom5 = [{"id": s.id, "label": s.companyName, "value": round(s.reliabilityScore or 0, 2), "reliabilityScore": round(s.reliabilityScore or 0, 2)} for s in sorted_active[-5:][::-1]]



    otr = [s.onTimeRate for s in active_list if s.onTimeRate > 0]
    avg_on_time_rate = round(sum(otr) / len(otr), 1) if otr else 0

    return {
        "total": total,
        "active": active,
        "inactive": inactive,
        "avg_lead_time": 0,
        "avg_on_time_rate": avg_on_time_rate,
        "chart": priority_chart,
        "category_chart": category_chart,
        "top5": top5,
        "bottom5": bottom5,
    }


# ── SUPPLIER RANKINGS ─────────────────────────────────────────────────────────

@router.get("/suppliers/rankings", tags=["Suppliers"])
def get_supplier_rankings(db: Session = Depends(get_db)):

    def tier(score: float) -> str:
        if score >= 8:   return "Excellent"
        if score >= 6:   return "Good"
        if score >= 4:   return "Average"
        if score > 0:    return "Poor"
        return "New / Unrated"

    suppliers = (
        db.query(models.Supplier)
        .filter(models.Supplier.status == "Active")
        .order_by(models.Supplier.reliabilityScore.desc())
        .all()
    )

    return [
        {
            "rank":             idx + 1,
            "id":               s.id,
            "name":             s.companyName,
            "score":            round(s.reliabilityScore or 0, 2),
            "tier":             tier(s.reliabilityScore or 0),
            "onTimeRate":       round(s.onTimeRate or 0, 1),
        }
        for idx, s in enumerate(suppliers)
    ]


# ── DELIVERIES ────────────────────────────────────────────────────────────────

@router.get("/deliveries", tags=["Deliveries"])
def get_all_deliveries(db: Session = Depends(get_db)):
    from sqlalchemy.orm import selectinload

    def score_tier(score: float) -> str:
        if score >= 8: return "Excellent"
        if score >= 6: return "Good"
        if score >= 4: return "Average"
        if score > 0: return "Poor"
        return "New / Unrated"

    deliveries = (
        db.query(models.SupplierDelivery)
        .options(selectinload(models.SupplierDelivery.supplier))
        .order_by(models.SupplierDelivery.expected_date.desc())
        .all()
    )
    result = []
    for d in deliveries:
        # Days variance: positive = late, negative = early, None = not yet delivered
        variance = None
        if d.delivery_date and d.expected_date:
            variance = (d.delivery_date - d.expected_date).days

        s = d.supplier
        result.append({
            "id":                d.id,
            "supplier_id":       d.supplier_id,
            "supplier_name":     s.companyName if s else f"Supplier #{d.supplier_id}",
            "expected_date":     str(d.expected_date) if d.expected_date else None,
            "delivery_date":     str(d.delivery_date) if d.delivery_date else None,
            "delivered_on_time": d.delivered_on_time,
            "days_variance":     variance,   # + = late days, - = early days, None = pending
            "rating":            d.rating,
            # ── Supplier formula snapshot ──────────────────────────────────
            "supplier_score":      round(s.reliabilityScore or 0, 2) if s else 0,
            "supplier_tier":       score_tier(s.reliabilityScore or 0) if s else "—",
            "supplier_on_time_pct": round(s.onTimeRate or 0, 1) if s else 0,
        })
    return result


@router.get("/suppliers/{supplier_id}/deliveries", response_model=List[schemas.SupplierDeliveryOut], tags=["Deliveries"])
def get_deliveries(supplier_id: int, db: Session = Depends(get_db)):
    return crud.get_deliveries(db, supplier_id)


@router.post("/deliveries", response_model=schemas.SupplierDeliveryOut, status_code=201, tags=["Deliveries"])
def create_delivery(delivery: schemas.SupplierDeliveryCreate, db: Session = Depends(get_db)):
    try:
        return crud.create_delivery(db, delivery)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/deliveries/{delivery_id}", response_model=schemas.SupplierDeliveryOut, tags=["Deliveries"])
def update_delivery(delivery_id: int, delivery: schemas.SupplierDeliveryCreate, db: Session = Depends(get_db)):
    result = crud.update_delivery(db, delivery_id, delivery)
    if not result:
        raise HTTPException(status_code=404, detail="Delivery not found")
    return result


@router.delete("/deliveries/{delivery_id}", tags=["Deliveries"])
def delete_delivery(delivery_id: int, db: Session = Depends(get_db)):
    result = crud.delete_delivery(db, delivery_id)
    if not result:
        raise HTTPException(status_code=404, detail="Delivery not found")
    return {"message": "Delivery deleted"}

