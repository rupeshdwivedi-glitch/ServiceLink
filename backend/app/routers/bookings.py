from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.booking import Booking
from app.models.service import Service
from app.models.user import User
from app.schemas.booking import BookingCreate, BookingOut, BookingStatusUpdate

router = APIRouter(prefix="/bookings", tags=["bookings"])


def require_customer(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "customer":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only customers can do this")
    return current_user


def require_provider(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "provider":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only providers can do this")
    return current_user


@router.post("", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
def create_booking(
    booking_in: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
):
    service = db.query(Service).filter(Service.id == booking_in.service_id).first()
    if service is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")

    booking = Booking(
        customer_id=current_user.id,
        service_id=booking_in.service_id,
        booking_date=booking_in.booking_date,
        status="pending",
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


@router.get("/me", response_model=list[BookingOut])
def list_my_bookings(db: Session = Depends(get_db), current_user: User = Depends(require_customer)):
    return (
        db.query(Booking)
        .filter(Booking.customer_id == current_user.id)
        .order_by(Booking.created_at.desc())
        .all()
    )


@router.get("/provider", response_model=list[BookingOut])
def list_provider_bookings(db: Session = Depends(get_db), current_user: User = Depends(require_provider)):
    return (
        db.query(Booking)
        .join(Service, Booking.service_id == Service.id)
        .filter(Service.provider_id == current_user.id)
        .order_by(Booking.created_at.desc())
        .all()
    )


@router.put("/{booking_id}/status", response_model=BookingOut)
def update_booking_status(
    booking_id: int,
    status_in: BookingStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_provider),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if booking is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    service = db.query(Service).filter(Service.id == booking.service_id).first()
    if service.provider_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This booking isn't for one of your services")

    booking.status = status_in.status
    db.commit()
    db.refresh(booking)
    return booking
