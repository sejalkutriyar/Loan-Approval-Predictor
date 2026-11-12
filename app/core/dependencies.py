from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from app.core.security import decode_access_token
from app.services.auth_service import get_user_by_username
from app.schemas.auth_schema import UserProfile, UserRole

http_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(http_bearer),
) -> UserProfile:
    """Dependency that extracts, verifies the JWT bearer token, and returns the UserProfile."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a valid Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    try:
        payload = decode_access_token(token)
        username: str = payload.get("sub")
        if not username:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token payload is missing subject (username).",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = get_user_by_username(username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account no longer exists or is inactive.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return UserProfile(
        username=user["username"],
        role=UserRole(user["role"]),
        full_name=user.get("full_name", user["username"]),
        email=user.get("email"),
    )


def require_role(required_role: UserRole | str):
    """Enforces Role-Based Access Control (RBAC). E.g. require_role(UserRole.ADMIN)."""
    target = required_role.value if isinstance(required_role, UserRole) else str(required_role).upper()

    def role_dependency(current_user: UserProfile = Depends(get_current_user)) -> UserProfile:
        if current_user.role.value != target and current_user.role.value != "ADMIN":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Requires [{target}] role, current role: [{current_user.role.value}].",
            )
        return current_user

    return role_dependency

