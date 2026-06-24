from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.dependencies import get_current_active_user, log_audit, get_client_ip
from app.models.user import User, UserRole
from app.models.beneficiary import RationCard, RationCardHolder, RationCardStatus
from app.schemas.auth import Token, LoginRequest, ChangePasswordRequest, RegisterRequest
from app.schemas.user import UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _token_for(user: User) -> Token:
    card = user.ration_card
    return Token(
        access_token=create_access_token(data={"sub": str(user.id)}),
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role.value,
        card_number=card.card_number if card else None,
        category=card.holder.category.value if card and card.holder else None,
    )


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(
    request: Request,
    payload: RegisterRequest,
    db: Session = Depends(get_db),
):
    """Customer sign-up — verified against the ration card database."""
    card = (
        db.query(RationCard)
        .join(RationCardHolder, RationCard.holder_id == RationCardHolder.id)
        .filter(RationCard.card_number == payload.card_number)
        .first()
    )
    if not card:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No ration card found with that number.")

    holder = card.holder
    if holder.aadhaar_number != payload.aadhaar_number:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Aadhaar number does not match this ration card.")
    if (holder.phone or "") != payload.phone:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Mobile number does not match this ration card.")
    if card.status != RationCardStatus.active or not holder.is_active:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This ration card is not active.")

    if db.query(User).filter(User.card_id == card.id).first():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "An account already exists for this ration card.")

    user = User(
        full_name=holder.full_name,
        hashed_password=get_password_hash(payload.password),
        role=UserRole.customer,
        is_active=True,
        card_id=card.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    log_audit(
        db=db, user_id=user.id, action="REGISTER", resource="auth",
        details={"card_number": card.card_number}, ip_address=get_client_ip(request),
    )
    return _token_for(user)


def _resolve_user(db: Session, identifier: str) -> User | None:
    """Look up a user by email (staff) or by linked ration card number (customer)."""
    user = db.query(User).filter(User.email == identifier).first()
    if user:
        return user
    card = db.query(RationCard).filter(RationCard.card_number == identifier).first()
    if card:
        return db.query(User).filter(User.card_id == card.id).first()
    return None


@router.post("/login", response_model=Token)
def login(
    request: Request,
    login_data: LoginRequest,
    db: Session = Depends(get_db),
):
    user = _resolve_user(db, login_data.identifier)
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is inactive. Contact administrator.",
        )

    user.last_login = datetime.utcnow()
    db.commit()

    log_audit(
        db=db, user_id=user.id, action="LOGIN", resource="auth",
        details={"identifier": login_data.identifier}, ip_address=get_client_ip(request),
    )
    return _token_for(user)


@router.post("/login/form", response_model=Token, include_in_schema=False)
def login_form(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """OAuth2 form-compatible login endpoint for Swagger UI"""
    user = _resolve_user(db, form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is inactive.",
        )

    user.last_login = datetime.utcnow()
    db.commit()
    return _token_for(user)


@router.post("/logout")
def logout(
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    log_audit(
        db=db,
        user_id=current_user.id,
        action="LOGOUT",
        resource="auth",
        details={"email": current_user.email},
        ip_address=get_client_ip(request),
    )
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_active_user)):
    return current_user


@router.post("/change-password")
def change_password(
    request: Request,
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )
    if len(payload.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="New password must be at least 8 characters",
        )

    current_user.hashed_password = get_password_hash(payload.new_password)
    current_user.updated_at = datetime.utcnow()
    db.commit()

    log_audit(
        db=db,
        user_id=current_user.id,
        action="CHANGE_PASSWORD",
        resource="auth",
        ip_address=get_client_ip(request),
    )

    return {"message": "Password changed successfully"}
