from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
import math

from app.database import get_db
from app.dependencies import get_current_active_user, require_manager_or_admin, log_audit, get_client_ip
from app.models.user import User
from app.models.distribution import Distribution, DistributionStatus
from app.models.beneficiary import RationCard, RationCardStatus
from app.schemas.distribution import (
    DistributionCreate, DistributionUpdate, DistributionResponse,
    DistributionListResponse, DistributionStatusUpdate, MonthlySummary,
)

router = APIRouter(prefix="/distributions", tags=["Distributions"])


@router.get("", response_model=DistributionListResponse)
def list_distributions(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    shop_id: Optional[int] = Query(None),
    card_id: Optional[int] = Query(None),
    status: Optional[DistributionStatus] = Query(None),
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2000),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    query = db.query(Distribution).order_by(
        Distribution.distribution_year.desc(),
        Distribution.distribution_month.desc(),
    )

    if shop_id:
        query = query.filter(Distribution.shop_id == shop_id)
    if card_id:
        query = query.filter(Distribution.card_id == card_id)
    if status:
        query = query.filter(Distribution.status == status)
    if month:
        query = query.filter(Distribution.distribution_month == month)
    if year:
        query = query.filter(Distribution.distribution_year == year)

    total = query.count()
    pages = math.ceil(total / size) if total > 0 else 1
    items = query.offset((page - 1) * size).limit(size).all()

    return DistributionListResponse(items=items, total=total, page=page, size=size, pages=pages)


@router.post("", response_model=DistributionResponse, status_code=status.HTTP_201_CREATED)
def create_distribution(
    request: Request,
    payload: DistributionCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    # Check ration card exists and is active
    card = db.query(RationCard).filter(RationCard.id == payload.card_id).first()
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ration card not found")
    if card.status != RationCardStatus.active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ration card is {card.status.value}. Only active cards can receive distribution.",
        )

    # Check for duplicate distribution in same month/year
    existing = db.query(Distribution).filter(
        Distribution.card_id == payload.card_id,
        Distribution.distribution_month == payload.distribution_month,
        Distribution.distribution_year == payload.distribution_year,
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Distribution already recorded for card {payload.card_id} in {payload.distribution_month}/{payload.distribution_year}",
        )

    distribution = Distribution(
        card_id=payload.card_id,
        shop_id=payload.shop_id,
        distributed_by=current_user.id,
        distribution_month=payload.distribution_month,
        distribution_year=payload.distribution_year,
        rice_quantity=payload.rice_quantity,
        wheat_quantity=payload.wheat_quantity,
        sugar_quantity=payload.sugar_quantity,
        oil_quantity=payload.oil_quantity,
        status=payload.status,
        notes=payload.notes,
    )
    db.add(distribution)
    db.commit()
    db.refresh(distribution)

    log_audit(
        db=db,
        user_id=current_user.id,
        action="CREATE",
        resource="distributions",
        resource_id=distribution.id,
        details={
            "card_id": distribution.card_id,
            "month": distribution.distribution_month,
            "year": distribution.distribution_year,
        },
        ip_address=get_client_ip(request),
    )

    return distribution


@router.get("/monthly-summary", response_model=MonthlySummary)
def get_monthly_summary(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2000),
    shop_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    query = db.query(Distribution).filter(
        Distribution.distribution_month == month,
        Distribution.distribution_year == year,
    )
    if shop_id:
        query = query.filter(Distribution.shop_id == shop_id)

    distributions = query.all()
    total_rice = sum(d.rice_quantity for d in distributions)
    total_wheat = sum(d.wheat_quantity for d in distributions)
    total_sugar = sum(d.sugar_quantity for d in distributions)
    total_oil = sum(d.oil_quantity for d in distributions)
    completed = sum(1 for d in distributions if d.status == DistributionStatus.completed)
    pending = sum(1 for d in distributions if d.status == DistributionStatus.pending)
    partial = sum(1 for d in distributions if d.status == DistributionStatus.partial)

    return MonthlySummary(
        month=month,
        year=year,
        total_distributions=len(distributions),
        total_rice=total_rice,
        total_wheat=total_wheat,
        total_sugar=total_sugar,
        total_oil=total_oil,
        completed=completed,
        pending=pending,
        partial=partial,
    )


@router.get("/card/{card_id}", response_model=DistributionListResponse)
def get_card_distributions(
    card_id: int,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    card = db.query(RationCard).filter(RationCard.id == card_id).first()
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ration card not found")

    query = db.query(Distribution).filter(Distribution.card_id == card_id).order_by(
        Distribution.distribution_year.desc(), Distribution.distribution_month.desc()
    )
    total = query.count()
    pages = math.ceil(total / size) if total > 0 else 1
    items = query.offset((page - 1) * size).limit(size).all()

    return DistributionListResponse(items=items, total=total, page=page, size=size, pages=pages)


@router.get("/{distribution_id}", response_model=DistributionResponse)
def get_distribution(
    distribution_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    dist = db.query(Distribution).filter(Distribution.id == distribution_id).first()
    if not dist:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Distribution not found")
    return dist


@router.patch("/{distribution_id}/status", response_model=DistributionResponse)
def update_distribution_status(
    distribution_id: int,
    request: Request,
    payload: DistributionStatusUpdate,
    current_user: User = Depends(require_manager_or_admin),
    db: Session = Depends(get_db),
):
    dist = db.query(Distribution).filter(Distribution.id == distribution_id).first()
    if not dist:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Distribution not found")

    dist.status = payload.status
    dist.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(dist)

    log_audit(
        db=db,
        user_id=current_user.id,
        action="UPDATE_STATUS",
        resource="distributions",
        resource_id=distribution_id,
        details={"status": payload.status.value},
        ip_address=get_client_ip(request),
    )

    return dist


@router.put("/{distribution_id}", response_model=DistributionResponse)
def update_distribution(
    distribution_id: int,
    request: Request,
    payload: DistributionUpdate,
    current_user: User = Depends(require_manager_or_admin),
    db: Session = Depends(get_db),
):
    dist = db.query(Distribution).filter(Distribution.id == distribution_id).first()
    if not dist:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Distribution not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(dist, field, value)
    dist.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(dist)

    log_audit(
        db=db,
        user_id=current_user.id,
        action="UPDATE",
        resource="distributions",
        resource_id=distribution_id,
        details=update_data,
        ip_address=get_client_ip(request),
    )

    return dist
