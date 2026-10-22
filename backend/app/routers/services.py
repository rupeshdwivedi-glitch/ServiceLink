from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.service import Service
from app.models.user import User
from app.schemas.service import ServiceCreate, ServiceOut, ServiceUpdate

router = APIRouter(prefix="/services", tags=["services"])


def require_provider(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "provider":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only providers can do this")
    return current_user


def get_own_service(service_id: int, db: Session, current_user: User) -> Service:
    service = db.query(Service).filter(Service.id == service_id).first()
    if service is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    if service.provider_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You don't own this service")
    return service


@router.get("", response_model=list[ServiceOut])
def list_services(category: str | None = None, db: Session = Depends(get_db)):
    query = db.query(Service)
    if category:
        query = query.filter(Service.category == category)
    return query.order_by(Service.created_at.desc()).all()


@router.get("/{service_id}", response_model=ServiceOut)
def get_service(service_id: int, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.id == service_id).first()
    if service is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    return service


@router.post("", response_model=ServiceOut, status_code=status.HTTP_201_CREATED)
def create_service(
    service_in: ServiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_provider),
):
    service = Service(**service_in.model_dump(), provider_id=current_user.id)
    db.add(service)
    db.commit()
    db.refresh(service)
    return service


@router.put("/{service_id}", response_model=ServiceOut)
def update_service(
    service_id: int,
    service_in: ServiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_provider),
):
    service = get_own_service(service_id, db, current_user)
    for field, value in service_in.model_dump(exclude_unset=True).items():
        setattr(service, field, value)
    db.commit()
    db.refresh(service)
    return service


@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_service(
    service_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_provider),
):
    service = get_own_service(service_id, db, current_user)
    db.delete(service)
    db.commit()
