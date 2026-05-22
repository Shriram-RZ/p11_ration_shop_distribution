from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
from typing import Optional
import math

from app.database import get_db
from app.dependencies import get_current_active_user, require_manager_or_admin, log_audit, get_client_ip
from app.models.user import User
from app.models.beneficiary import RationCard, RationCardHolder, RationCardStatus, FamilyMember
from app.schemas.beneficiary import (
    RationCardCreate, RationCardUpdate, RationCardResponse,
    RationCardListResponse, RationCardStatusUpdate,
    FamilyMemberCreate, FamilyMemberResponse,
)

router = APIRouter(prefix="/ration-cards", tags=["Ration Cards"])


@router.get("", response_model=RationCardListResponse)
def list_ration_cards(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    shop_id: Optional[int] = Query(None),
    status: Optional[RationCardStatus] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    query = db.query(RationCard).options(
        joinedload(RationCard.holder),
        joinedload(RationCard.family_members),
    )

    if shop_id:
        query = query.filter(RationCard.shop_id == shop_id)
    if status:
        query = query.filter(RationCard.status == status)

    total = query.count()
    pages = math.ceil(total / size) if total > 0 else 1
    items = query.offset((page - 1) * size).limit(size).all()

    return RationCardListResponse(items=items, total=total, page=page, size=size, pages=pages)


@router.post("", response_model=RationCardResponse, status_code=status.HTTP_201_CREATED)
def create_ration_card(
    request: Request,
    payload: RationCardCreate,
    current_user: User = Depends(require_manager_or_admin),
    db: Session = Depends(get_db),
):
    existing = db.query(RationCard).filter(RationCard.card_number == payload.card_number).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ration card number '{payload.card_number}' already exists",
        )

    holder = db.query(RationCardHolder).filter(RationCardHolder.id == payload.holder_id).first()
    if not holder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Beneficiary with id {payload.holder_id} not found",
        )

    # Check if holder already has a card
    existing_card = db.query(RationCard).filter(RationCard.holder_id == payload.holder_id).first()
    if existing_card:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This beneficiary already has a ration card",
        )

    card = RationCard(**payload.model_dump())
    db.add(card)
    db.commit()
    db.refresh(card)

    log_audit(
        db=db,
        user_id=current_user.id,
        action="CREATE",
        resource="ration_cards",
        resource_id=card.id,
        details={"card_number": card.card_number},
        ip_address=get_client_ip(request),
    )

    return card


@router.get("/search/{card_number}", response_model=RationCardResponse)
def search_ration_card(
    card_number: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    card = (
        db.query(RationCard)
        .options(joinedload(RationCard.holder), joinedload(RationCard.family_members))
        .filter(RationCard.card_number == card_number)
        .first()
    )
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ration card not found")
    return card


@router.get("/{card_id}", response_model=RationCardResponse)
def get_ration_card(
    card_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    card = (
        db.query(RationCard)
        .options(joinedload(RationCard.holder), joinedload(RationCard.family_members))
        .filter(RationCard.id == card_id)
        .first()
    )
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ration card not found")
    return card


@router.put("/{card_id}", response_model=RationCardResponse)
def update_ration_card(
    card_id: int,
    request: Request,
    payload: RationCardUpdate,
    current_user: User = Depends(require_manager_or_admin),
    db: Session = Depends(get_db),
):
    card = db.query(RationCard).filter(RationCard.id == card_id).first()
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ration card not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(card, field, value)
    card.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(card)

    log_audit(
        db=db,
        user_id=current_user.id,
        action="UPDATE",
        resource="ration_cards",
        resource_id=card_id,
        details=update_data,
        ip_address=get_client_ip(request),
    )

    return card


@router.patch("/{card_id}/status", response_model=RationCardResponse)
def update_ration_card_status(
    card_id: int,
    request: Request,
    payload: RationCardStatusUpdate,
    current_user: User = Depends(require_manager_or_admin),
    db: Session = Depends(get_db),
):
    card = db.query(RationCard).filter(RationCard.id == card_id).first()
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ration card not found")

    card.status = payload.status
    card.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(card)

    log_audit(
        db=db,
        user_id=current_user.id,
        action="UPDATE_STATUS",
        resource="ration_cards",
        resource_id=card_id,
        details={"status": payload.status.value},
        ip_address=get_client_ip(request),
    )

    return card


@router.post("/{card_id}/family-members", response_model=FamilyMemberResponse, status_code=status.HTTP_201_CREATED)
def add_family_member(
    card_id: int,
    request: Request,
    payload: FamilyMemberCreate,
    current_user: User = Depends(require_manager_or_admin),
    db: Session = Depends(get_db),
):
    card = db.query(RationCard).filter(RationCard.id == card_id).first()
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ration card not found")

    member = FamilyMember(
        card_id=card_id,
        name=payload.name,
        aadhaar=payload.aadhaar,
        relation=payload.relation,
        age=payload.age,
    )
    db.add(member)
    db.commit()
    db.refresh(member)

    log_audit(
        db=db,
        user_id=current_user.id,
        action="ADD_FAMILY_MEMBER",
        resource="ration_cards",
        resource_id=card_id,
        details={"member_name": member.name},
        ip_address=get_client_ip(request),
    )

    return member


@router.delete("/{card_id}/family-members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_family_member(
    card_id: int,
    member_id: int,
    request: Request,
    current_user: User = Depends(require_manager_or_admin),
    db: Session = Depends(get_db),
):
    member = db.query(FamilyMember).filter(
        FamilyMember.id == member_id, FamilyMember.card_id == card_id
    ).first()
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family member not found")

    db.delete(member)
    db.commit()

    log_audit(
        db=db,
        user_id=current_user.id,
        action="REMOVE_FAMILY_MEMBER",
        resource="ration_cards",
        resource_id=card_id,
        details={"member_id": member_id},
        ip_address=get_client_ip(request),
    )
