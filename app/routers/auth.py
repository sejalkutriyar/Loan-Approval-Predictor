from typing import Any, Dict

from fastapi import APIRouter, HTTPException, Depends, status

from app.schemas.auth_schema import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserProfile,
)
from app.services.auth_service import (
    authenticate_user,
    create_user,
    RegistrationUnavailableError,
    UsernameTakenError,
)
from app.core.security import create_access_token
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication & RBAC"])


def _issue_token(user: Dict[str, Any]) -> TokenResponse:
    """Builds a signed JWT response for an authenticated user document."""
    profile = UserProfile(
        username=user["username"],
        role=user["role"],
        full_name=user.get("full_name", user["username"]),
        email=user.get("email"),
    )
    access_token = create_access_token(
        data={
            "sub": profile.username,
            "role": profile.role.value,
            "full_name": profile.full_name,
        }
    )
    return TokenResponse(access_token=access_token, user=profile)


@router.post("/login", response_model=TokenResponse)
def login(credentials: LoginRequest):
    """Authenticates loan officers and administrators, issuing a signed JWT access token."""
    user = authenticate_user(credentials.username, credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password. Please verify credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return _issue_token(user)


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest):
    """
    Self-service sign-up for credit officers. The new account is issued a JWT
    immediately so the officer lands in the workspace without a second login.
    """
    try:
        user = create_user(
            username=payload.username,
            full_name=payload.full_name,
            email=payload.email,
            password=payload.password,
        )
    except UsernameTakenError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="That username is already taken. Choose a different one.",
        )
    except RegistrationUnavailableError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Account creation is temporarily unavailable. Please try again in a moment.",
        )
    return _issue_token(user)


@router.get("/me", response_model=UserProfile)
def read_current_user(current_user: UserProfile = Depends(get_current_user)):
    """Returns the authenticated user's profile and RBAC role."""
    return current_user
