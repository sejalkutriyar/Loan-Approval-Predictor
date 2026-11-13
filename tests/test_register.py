import pytest
from fastapi.testclient import TestClient

from app.core.security import decode_access_token, verify_password
from app.main import app
from app.services import auth_service

client = TestClient(app)

VALID_SIGNUP = {
    "username": "new.officer",
    "full_name": "New Credit Officer",
    "email": "new.officer@bank.internal",
    "password": "StrongPass123",
}


class FakeUsersCollection:
    def __init__(self):
        self.docs = {}

    def find_one(self, query):
        return self.docs.get(query.get("username"))

    def insert_one(self, doc):
        if doc["username"] in self.docs:
            from pymongo.errors import DuplicateKeyError

            raise DuplicateKeyError("duplicate username")
        self.docs[doc["username"]] = doc


class FakeDB:
    def __init__(self, users):
        self._users = users

    def __getitem__(self, name):
        assert name == "users"
        return self._users


@pytest.fixture
def fake_users(monkeypatch):
    users = FakeUsersCollection()
    monkeypatch.setattr(auth_service, "get_sync_db", lambda: FakeDB(users))
    return users


def test_register_creates_officer_and_returns_token(fake_users):
    response = client.post("/api/v1/auth/register", json=VALID_SIGNUP)
    assert response.status_code == 201

    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["user"] == {
        "username": "new.officer",
        "role": "OFFICER",
        "full_name": "New Credit Officer",
        "email": "new.officer@bank.internal",
    }

    payload = decode_access_token(body["access_token"])
    assert payload["sub"] == "new.officer"
    assert payload["role"] == "OFFICER"

    stored = fake_users.docs["new.officer"]
    assert stored["role"] == "OFFICER"
    assert stored["hashed_password"] != VALID_SIGNUP["password"]
    assert verify_password(VALID_SIGNUP["password"], stored["hashed_password"])
    assert stored["created_at"]


def test_register_rejects_duplicate_username(fake_users):
    assert client.post("/api/v1/auth/register", json=VALID_SIGNUP).status_code == 201

    duplicate = {**VALID_SIGNUP, "email": "other@bank.internal"}
    response = client.post("/api/v1/auth/register", json=duplicate)
    assert response.status_code == 409
    assert "already taken" in response.json()["detail"]


def test_register_rejects_seeded_username(fake_users):
    response = client.post(
        "/api/v1/auth/register",
        json={**VALID_SIGNUP, "username": "Sejal", "email": "x@bank.internal"},
    )
    assert response.status_code == 409


def test_register_normalizes_username_and_email(fake_users):
    response = client.post(
        "/api/v1/auth/register",
        json={**VALID_SIGNUP, "username": "  Mixed.Case ", "email": "Mixed@Bank.Internal"},
    )
    assert response.status_code == 201
    stored = fake_users.docs["mixed.case"]
    assert stored["email"] == "mixed@bank.internal"


@pytest.mark.parametrize(
    "override",
    [
        {"password": "short"},
        {"username": "ab"},
        {"username": "bad name!"},
        {"email": "not-an-email"},
        {"full_name": ""},
    ],
)
def test_register_validates_input(fake_users, override):
    response = client.post("/api/v1/auth/register", json={**VALID_SIGNUP, **override})
    assert response.status_code == 422


def test_registered_account_can_log_in(fake_users):
    client.post("/api/v1/auth/register", json=VALID_SIGNUP)

    response = client.post(
        "/api/v1/auth/login",
        json={"username": "new.officer", "password": VALID_SIGNUP["password"]},
    )
    assert response.status_code == 200
    assert response.json()["user"]["role"] == "OFFICER"


def test_register_returns_503_when_user_store_is_down(monkeypatch):
    def explode():
        raise RuntimeError("mongo unreachable")

    monkeypatch.setattr(auth_service, "get_sync_db", explode)

    response = client.post("/api/v1/auth/register", json=VALID_SIGNUP)
    assert response.status_code == 503
    assert "temporarily unavailable" in response.json()["detail"]
