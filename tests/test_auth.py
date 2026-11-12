import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token
from app.core.dependencies import get_current_user

client = TestClient(app)


def test_login_success_officer():
    """Valid officer credentials must issue signed JWT token with OFFICER role."""
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "sejal", "password": "Sejal800"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["username"] == "sejal"
    assert data["user"]["role"] == "OFFICER"
    assert "Officer: Sejal Kumari" in data["user"]["full_name"]


def test_login_success_admin():
    """Valid admin credentials must issue signed JWT token with ADMIN role."""
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "Admin@123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "ADMIN"


def test_login_invalid_password_401():
    """Invalid password must return HTTP 401 Unauthorized."""
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "sejal", "password": "WrongPassword999"},
    )
    assert response.status_code == 401
    assert "Incorrect username or password" in response.json()["detail"]


def test_login_nonexistent_user_401():
    """Non-existent username must return HTTP 401 Unauthorized."""
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "ghost_officer", "password": "Password123"},
    )
    assert response.status_code == 401


def test_auth_me_with_valid_jwt():
    """GET /auth/me with Bearer token must return authenticated user profile."""
    # Temporarily remove dependency override to test actual JWT verification
    app.dependency_overrides.pop(get_current_user, None)

    token = create_access_token(data={"sub": "sejal", "role": "OFFICER", "full_name": "Officer: Sejal Kumari"})
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "sejal"
    assert data["role"] == "OFFICER"


def test_auth_me_without_token_401():
    """GET /auth/me without token must return HTTP 401 Unauthorized."""
    app.dependency_overrides.pop(get_current_user, None)

    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
    assert "Authentication required" in response.json()["detail"]


def test_auth_me_with_tampered_token_401():
    """GET /auth/me with invalid or tampered token must return HTTP 401 Unauthorized."""
    app.dependency_overrides.pop(get_current_user, None)

    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid.tampered.token.here"},
    )
    assert response.status_code == 401


def test_rbac_admin_endpoint_forbidden_for_officer_403():
    """Officer attempting to access an Admin-only endpoint must receive HTTP 403 Forbidden."""
    app.dependency_overrides.pop(get_current_user, None)

    officer_token = create_access_token(data={"sub": "sejal", "role": "OFFICER", "full_name": "Officer: Sejal Kumari"})
    response = client.get(
        "/api/v1/applications/APP-TEST1234",
        headers={"Authorization": f"Bearer {officer_token}"},
    )
    assert response.status_code == 403
    assert "Access denied" in response.json()["detail"]


def test_rbac_admin_endpoint_allowed_for_admin():
    """Admin token must pass RBAC check on Admin-only endpoint."""
    app.dependency_overrides.pop(get_current_user, None)

    admin_token = create_access_token(data={"sub": "admin", "role": "ADMIN", "full_name": "Administrator"})
    response = client.get(
        "/api/v1/applications/APP-TEST-NONEXISTENT",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    # Passed 403 RBAC check, reached the DB lookup which returns 404 (record not found)
    assert response.status_code == 404

