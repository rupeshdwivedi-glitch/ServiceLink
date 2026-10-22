from datetime import datetime
from typing import Literal

from pydantic import BaseModel

BookingStatus = Literal["pending", "confirmed", "completed", "cancelled"]


class BookingCreate(BaseModel):
    service_id: int
    booking_date: datetime


class BookingStatusUpdate(BaseModel):
    status: BookingStatus


class BookingOut(BaseModel):
    id: int
    customer_id: int
    service_id: int
    booking_date: datetime
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
