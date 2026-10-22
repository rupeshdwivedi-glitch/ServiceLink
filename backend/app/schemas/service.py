from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class ServiceCreate(BaseModel):
    title: str
    category: str
    description: str | None = None
    price: Decimal


class ServiceUpdate(BaseModel):
    title: str | None = None
    category: str | None = None
    description: str | None = None
    price: Decimal | None = None


class ServiceOut(BaseModel):
    id: int
    provider_id: int
    title: str
    category: str
    description: str | None
    price: Decimal
    created_at: datetime

    class Config:
        from_attributes = True
