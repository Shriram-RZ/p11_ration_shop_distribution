from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
from typing import Optional
import math

from app.database import get_db
from app.dependencies import get_current_active_user, require_manager_or_admin, log_audit, get_client_ip
from app.models.user import User
from app.models.beneficiary import RationCardHolder, RationCard, RationCardCategory
from app.models.distribution import Distribution
from app.schemas.beneficiary import (
    RationCardHolderCreate, RationCardHolderUpdate, RationCardHolderResponse,
    RationCardHolderListResponse, RationCardResponse, FamilyMemberResponse,
)
from app.schemas.distribution import DistributionResponse, DistributionListResponse

router = APIRouter(prefix="/beneficiaries", tags=["Beneficiaries"])


@router.get("", response_model=RationCardHolderListResponse)
def list_beneficiaries(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    category: Optional[RationCardCategory] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    query = db.query(RationCardHolder)

    if search:
        term = f"%{search}%"
        query = query.filter(
            (RationCardHolder.full_name.ilike(term))
            | (RationCardHolder.aadhaar_number.ilike(term))
            | (RationCardHolder.phone.ilike(term))
        )
    if district:
        query = query.filter(RationCardHolder.district.ilike(f"%{district}%"))
    if state:
        query = query.filter(RationCardHolder.state.ilike(f"%{state}%"))
    if category:
        query = query.filter(RationCardHolder.category == category)
    if is_active is not None:
        query = query.filter(RationCardHolder.is_active == is_active)

    total = query.count()
    pages = math.ceil(total / size) if total > 0 else 1
    items = query.offset((page - 1) * size).limit(size).all()

    return RationCardHolderListResponse(items=items, total=total, page=page, size=size, pages=pages)


@router.post("", response_model=RationCardHolderResponse, status_code=status.HTTP_201_CREATED)
def create_beneficiary(
    request: Request,
    payload: RationCardHolderCreate,
    current_user: User = Depends(require_manager_or_admin),
    db: Session = Depends(get_db),
):
    existing = db.query(RationCardHolder).filter(
        RationCardHolder.aadhaar_number == payload.aadhaar_number
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Beneficiary with Aadhaar '{payload.aadhaar_number}' already exists",
        )

    holder = RationCardHolder(**payload.model_dump())
    db.add(holder)
    db.commit()
    db.refresh(holder)

    log_audit(
        db=db,
        user_id=current_user.id,
        action="CREATE",
        resource="beneficiaries",
        resource_id=holder.id,
        details={"name": holder.full_name, "aadhaar": holder.aadhaar_number},
        ip_address=get_client_ip(request),
    )

    return holder


@router.get("/{beneficiary_id}", response_model=RationCardHolderResponse)
def get_beneficiary(
    beneficiary_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    holder = db.query(RationCardHolder).filter(RationCardHolder.id == beneficiary_id).first()
    if not holder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Beneficiary not found")
    return holder


@router.put("/{beneficiary_id}", response_model=RationCardHolderResponse)
def update_beneficiary(
    beneficiary_id: int,
    request: Request,
    payload: RationCardHolderUpdate,
    current_user: User = Depends(require_manager_or_admin),
    db: Session = Depends(get_db),
):
    holder = db.query(RationCardHolder).filter(RationCardHolder.id == beneficiary_id).first()
    if not holder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Beneficiary not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(holder, field, value)
    holder.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(holder)

    log_audit(
        db=db,
        user_id=current_user.id,
        action="UPDATE",
        resource="beneficiaries",
        resource_id=beneficiary_id,
        details=update_data,
        ip_address=get_client_ip(request),
    )

    return holder


@router.delete("/{beneficiary_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_beneficiary(
    beneficiary_id: int,
    request: Request,
    current_user: User = Depends(require_manager_or_admin),
    db: Session = Depends(get_db),
):
    holder = db.query(RationCardHolder).filter(RationCardHolder.id == beneficiary_id).first()
    if not holder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Beneficiary not found")

    holder.is_active = False
    holder.updated_at = datetime.utcnow()
    db.commit()

    log_audit(
        db=db,
        user_id=current_user.id,
        action="DELETE",
        resource="beneficiaries",
        resource_id=beneficiary_id,
        ip_address=get_client_ip(request),
    )


@router.get("/{beneficiary_id}/ration-card", response_model=RationCardResponse)
def get_beneficiary_ration_card(
    beneficiary_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    holder = db.query(RationCardHolder).filter(RationCardHolder.id == beneficiary_id).first()
    if not holder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Beneficiary not found")

    card = (
        db.query(RationCard)
        .options(joinedload(RationCard.family_members))
        .filter(RationCard.holder_id == beneficiary_id)
        .first()
    )
    if not card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No ration card found for this beneficiary",
        )
    return card


@router.get("/{beneficiary_id}/distribution-history")
def get_distribution_history(
    beneficiary_id: int,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    holder = db.query(RationCardHolder).filter(RationCardHolder.id == beneficiary_id).first()
    if not holder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Beneficiary not found")

    card = db.query(RationCard).filter(RationCard.holder_id == beneficiary_id).first()
    if not card:
        return {"items": [], "total": 0, "page": page, "size": size, "pages": 0}

    query = db.query(Distribution).filter(Distribution.card_id == card.id).order_by(
        Distribution.distribution_year.desc(), Distribution.distribution_month.desc()
    )
    total = query.count()
    pages = math.ceil(total / size) if total > 0 else 1
    items = query.offset((page - 1) * size).limit(size).all()

    return {"items": [DistributionResponse.model_validate(d) for d in items], "total": total, "page": page, "size": size, "pages": pages}
