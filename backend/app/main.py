from fastapi import Depends, FastAPI
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.session import get_db

app = FastAPI(title="ServiceLink API")


@app.get("/")
def read_root():
    return {"message": "ServiceLink API is running"}


@app.get("/db-check")
def db_check(db: Session = Depends(get_db)):
    """Temporary route to confirm the SQL Server connection works. Remove once auth/services routes exist."""
    db.execute(text("SELECT 1"))
    return {"database": "connected"}
