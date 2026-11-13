from enum import Enum
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class UserRole(str, Enum):
    OFFICER = "OFFICER"
    ADMIN = "ADMIN"


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=2, max_length=50, description="Login username")
    password: str = Field(..., min_length=4, description="Raw login password")


class RegisterRequest(BaseModel):
    """Self-service sign-up. New accounts always start with the OFFICER role."""

    model_config = ConfigDict(str_strip_whitespace=True)

    username: str = Field(
        ...,
        min_length=3,
        max_length=32,
        pattern=r"^[A-Za-z0-9._-]+$",
        description="Unique login handle (letters, digits, dot, underscore, hyphen)",
    )
    full_name: str = Field(..., min_length=2, max_length=80, description="Display name")
    email: str = Field(
        ...,
        min_length=5,
        max_length=120,
        pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$",
        description="Work email address",
    )
    password: str = Field(..., min_length=8, max_length=128, description="Plaintext password")


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

