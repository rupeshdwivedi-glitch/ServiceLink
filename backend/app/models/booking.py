from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.database import Base


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False, index=True)
    booking_date = Column(DateTime(timezone=True), nullable=False)
    status = Column(String(20), nullable=False, default="pending")  # pending, confirmed, completed, cancelled
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    customer = relationship("User")
    service = relationship("Service")
