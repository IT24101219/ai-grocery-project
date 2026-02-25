# backend/APIs/suppliers.py

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import StreamingResponse
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
    for s in suppliers:
        key = s.importanceLevel or "Normal"
        by_importance[key] = by_importance.get(key, 0) + 1
    priority_chart = [{"label": k, "value": v} for k, v in by_importance.items()]

    by_category = {}
    for s in suppliers:
        cats = [c.strip() for c in (s.category or "").split(",") if c.strip()]
        for cat in cats:
            by_category[cat] = by_category.get(cat, 0) + 1
    category_chart = [{"label": k, "value": v} for k, v in sorted(by_category.items(), key=lambda x: -x[1])]

    sorted_active = sorted(active_list, key=lambda s: s.reliabilityScore or 0, reverse=True)
    top5 = [{"id": s.id, "label": s.companyName, "value": round((s.reliabilityScore or 0) * 10, 1), "reliability": round((s.reliabilityScore or 0), 2)} for s in sorted_active[:5]]
    bottom5 = [{"id": s.id, "label": s.companyName, "value": round((s.reliabilityScore or 0) * 10, 1), "reliability": round((s.reliabilityScore or 0), 2)} for s in sorted_active[-5:][::-1]]

    delivery_days = [s.delivery_day for s in active_list if s.delivery_day and s.delivery_day > 0]
    avg_delivery_day = round(sum(delivery_days) / len(delivery_days), 1) if delivery_days else 0

    otr = [s.onTimeRate for s in active_list if s.onTimeRate > 0]
    avg_on_time_rate = round(sum(otr) / len(otr), 1) if otr else 0

    return {
        "total": total,
        "active": active,
        "inactive": inactive,
        "avg_lead_time": avg_delivery_day,
        "avg_on_time_rate": avg_on_time_rate,
        "chart": priority_chart,
        "category_chart": category_chart,
        "top5": top5,
        "bottom5": bottom5,
    }



#  AI / ML ENDPOINTS
@router.post("/ai/train", tags=["AI"])
def train_ai_model():
    return {"status": "not_implemented", "message": "AI model training will be connected in a future release."}


@router.get("/ai/predict/{supplier_id}", tags=["AI"])
def predict_supplier_reliability(supplier_id: int, db: Session = Depends(get_db)):
    supplier = crud.get_supplier(db, supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return {
        "supplier_id": supplier_id,
        "company_name": supplier.companyName,
        "predicted_reliability_score": 0,
        "rating": "N/A",
        "message": "AI model not yet implemented.",
    }


@router.post("/ai/predict-all", tags=["AI"])
def predict_all_suppliers(db: Session = Depends(get_db)):
    suppliers = crud.get_suppliers(db)
    return {
        "updated": 0,
        "total": len(suppliers),
        "message": "AI model not yet implemented. Scores will be calculated once the model is connected.",
    }


@router.get("/ai/recommendations", tags=["AI"])
def get_recommendations(db: Session = Depends(get_db)):
    return {"message": "AI recommendations will be available once the model is connected.", "data": {}}
