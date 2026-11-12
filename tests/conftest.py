import pytest
from app.main import app
from app.core.dependencies import get_current_user
from app.schemas.auth_schema import UserProfile, UserRole


@pytest.fixture(autouse=True)
def override_auth_for_general_tests():
    """
    Automatically provides an authenticated OFFICER mock for existing business logic tests.
    Dedicated auth tests in test_auth.py will explicitly test real tokens.
    """
    mock_officer = UserProfile(
        username="sejal",
        role=UserRole.OFFICER,
        full_name="Officer: Sejal Kumari",
        email="sejal@bank.internal",
    )
    app.dependency_overrides[get_current_user] = lambda: mock_officer
    yield
    app.dependency_overrides.clear()

