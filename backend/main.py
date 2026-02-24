from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session
from database import engine, get_db, Base
from models import * 
from APIs import cart, orders

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Ransara Supermarket API")

app.include_router(cart.router)
app.include_router(orders.router)

@app.get("/")
def root():
    return {"message": "Welcome to the Ransara Supermarket API backend!"}

@app.get("/test-db")
def test_database_connection(db: Session = Depends(get_db)):
    try:
        result = db.execute(text("SELECT 1"))
        return {"status": "success", "message": "Successfully connected to PostgreSQL!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")

# new

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
import io, csv, time

import models, schemas, crud  # keep models imported so tables are registered
from database import SessionLocal, engine, Base


def wait_for_db(max_retries: int = 30, delay_seconds: float = 1.0):
    """
    In Docker, backend may start before Postgres is ready.
    This retries a simple query until DB is reachable.
    """
    last_err = None
    for _ in range(max_retries):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return
        except Exception as e:
            last_err = e
            time.sleep(delay_seconds)
    raise RuntimeError(f"Database not ready after retries: {last_err}")


app = FastAPI(title="Supplier Management API", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    # Wait for DB, then create tables
    wait_for_db()
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

#  SUPPLIERS  CRUD

@app.post("/suppliers", response_model=schemas.SupplierOut, status_code=201, tags=["Suppliers"])
def create_supplier(supplier: schemas.SupplierCreate, db: Session = Depends(get_db)):
    try:
        return crud.create_supplier(db, supplier)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/suppliers", response_model=List[schemas.SupplierOut], tags=["Suppliers"])
def get_suppliers(
        search: Optional[str] = Query(None),
        category: Optional[str] = Query(None),
        status: Optional[str] = Query(None),
        sort: Optional[str] = Query("name-asc"),
        db: Session = Depends(get_db),
):
    return crud.get_suppliers(db, search=search, category=category, status=status, sort=sort)


@app.get("/suppliers/export/csv", tags=["Suppliers"])
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


@app.post("/suppliers/import/csv", tags=["Suppliers"])
async def import_suppliers_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        content = await file.read()
        text_content = content.decode("utf-8")
        count = crud.import_suppliers_from_csv(db, text_content)
        return {"imported": count, "message": f"Successfully imported {count} suppliers"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Import failed: {str(e)}")


@app.get("/suppliers/{supplier_id}", response_model=schemas.SupplierOut, tags=["Suppliers"])
def get_supplier(supplier_id: int, db: Session = Depends(get_db)):
    supplier = crud.get_supplier(db, supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier


@app.put("/suppliers/{supplier_id}", response_model=schemas.SupplierOut, tags=["Suppliers"])
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


@app.delete("/suppliers/{supplier_id}", response_model=schemas.SupplierOut, tags=["Suppliers"])
def delete_supplier(supplier_id: int, db: Session = Depends(get_db)):
    result = crud.delete_supplier(db, supplier_id)
    if not result:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return result


#  ANALYTICS

@app.get("/analytics")
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

@app.post("/ai/train", tags=["AI"])
def train_ai_model():
    return {"status": "not_implemented", "message": "AI model training will be connected in a future release."}


@app.get("/ai/predict/{supplier_id}")
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


@app.post("/ai/predict-all", tags=["AI"])
def predict_all_suppliers(db: Session = Depends(get_db)):
    suppliers = crud.get_suppliers(db)
    return {
        "updated": 0,
        "total": len(suppliers),
        "message": "AI model not yet implemented. Scores will be calculated once the model is connected.",
    }


@app.get("/ai/recommendations", tags=["AI"])
def get_recommendations(db: Session = Depends(get_db)):
    return {"message": "AI recommendations will be available once the model is connected.", "data": {}}