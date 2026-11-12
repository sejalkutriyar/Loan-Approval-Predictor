from fastapi import APIRouter, HTTPException, Depends, status
from app.schemas.auth_schema import (
    LoginRequest,
    TokenResponse,
    UserProfile,
)
from app.services.auth_service import authenticate_user
from app.core.security import create_access_token
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication & RBAC"])


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

    # Issue JWT token
    token_data = {
        "sub": user["username"],
        "role": user["role"],
        "full_name": user.get("full_name", user["username"]),
    }
    access_token = create_access_token(data=token_data)

    user_profile = UserProfile(
        username=user["username"],
        role=user["role"],
        full_name=user.get("full_name", user["username"]),
        email=user.get("email"),
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_profile,
    )


@router.get("/me", response_model=UserProfile)
def read_current_user(current_user: UserProfile = Depends(get_current_user)):
    """Returns the authenticated user's profile and RBAC role."""
    return current_user

