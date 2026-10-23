from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.booking import Booking
from app.models.service import Service
from app.models.user import User
from app.schemas.booking import BookingOut
from app.schemas.service import ServiceOut
from app.schemas.user import UserOut

router = APIRouter(prefix="/admin", tags=["admin"])


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user


@router.get("/users", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    return db.query(User).order_by(User.created_at.desc()).all()


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    if user_id == admin.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You can't delete your own account")

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    db.delete(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can't delete this user: they still have services or bookings linked to them",
        )


@router.get("/services", response_model=list[ServiceOut])
def list_all_services(db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    return db.query(Service).order_by(Service.created_at.desc()).all()


@router.delete("/services/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_any_service(service_id: int, db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    service = db.query(Service).filter(Service.id == service_id).first()
    if service is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")

    db.delete(service)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can't delete this service: it still has bookings linked to it",
        )


@router.get("/bookings", response_model=list[BookingOut])
def list_all_bookings(db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    return db.query(Booking).order_by(Booking.created_at.desc()).all()
