from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.dependencies import get_current_active_user, log_audit, get_client_ip
from app.models.user import User
from app.schemas.auth import Token, LoginRequest, ChangePasswordRequest, RegisterRequest
from app.schemas.user import UserResponse
from app.models.user import UserRole

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(
    request: Request,
    payload: RegisterRequest,
    db: Session = Depends(get_db),
):
    """Public self sign-up for customers (storefront shoppers)."""
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists.",
        )

    user = User(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=get_password_hash(payload.password),
        role=UserRole.customer,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(data={"sub": str(user.id)})

    log_audit(
        db=db,
        user_id=user.id,
        action="REGISTER",
        resource="auth",
        details={"email": user.email},
        ip_address=get_client_ip(request),
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role.value,
    )


@router.post("/login", response_model=Token)
def login(
    request: Request,
    login_data: LoginRequest,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is inactive. Contact administrator.",
        )

    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()

    access_token = create_access_token(data={"sub": str(user.id)})

    log_audit(
        db=db,
        user_id=user.id,
        action="LOGIN",
        resource="auth",
        details={"email": user.email},
        ip_address=get_client_ip(request),
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role.value,
    )


@router.post("/login/form", response_model=Token, include_in_schema=False)
def login_form(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """OAuth2 form-compatible login endpoint for Swagger UI"""
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is inactive.",
        )

    user.last_login = datetime.utcnow()
    db.commit()

    access_token = create_access_token(data={"sub": str(user.id)})

    return Token(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role.value,
    )


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
