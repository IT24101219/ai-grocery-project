from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session
from database import engine, get_db, Base
from models import * 
import importlib
import pkgutil
import APIs  
import time

Base.metadata.create_all(bind=engine)    # Create database tables

app = FastAPI(title="Ransara Supermarket API")

# To connect frontend with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Autoload all API routes
for _, module_name, _ in pkgutil.iter_modules(APIs.__path__):
    module = importlib.import_module(f"APIs.{module_name}")
    
    if hasattr(module, "router"):
        app.include_router(module.router)

@app.get("/")
def root():
    return {"message": "Welcome to the Ransara Supermarket API backend!"}    # welcome message

@app.get("/test-db")       #checks PostgreSQL connection
def test_database_connection(db: Session = Depends(get_db)):
    try:
        result = db.execute(text("SELECT 1"))
        return {"status": "success", "message": "Successfully connected to PostgreSQL!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")

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

# Wait for a database and then run app
@app.on_event("startup")
def on_startup():
    wait_for_db()
