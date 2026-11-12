from enum import Enum
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class UserRole(str, Enum):
    OFFICER = "OFFICER"
    ADMIN = "ADMIN"


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=2, max_length=50, description="Login username")
    password: str = Field(..., min_length=4, description="Raw login password")


class UserProfile(BaseModel):
    username: str
    role: UserRole
    full_name: str
    email: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile


class TokenPayload(BaseModel):
    sub: str  # username
    role: UserRole
    full_name: Optional[str] = None
    exp: Optional[int] = None

