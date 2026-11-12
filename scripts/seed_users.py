"""
Seed script to create default Officer and Admin user accounts in MongoDB Atlas.
Run with: python scripts/seed_users.py
"""
import sys
from pathlib import Path

# Add project root to sys.path
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from app.services.auth_service import seed_default_users, DEFAULT_USERS

if __name__ == "__main__":
    print("Seeding default authentication accounts into MongoDB Atlas...")
    print(f"Users to seed: {list(DEFAULT_USERS.keys())}")
    count = seed_default_users()
    print(f"Successfully processed {len(DEFAULT_USERS)} users (newly inserted or updated: {count}).")
    print("Officer login: username='sejal', password='Sejal800', role='OFFICER'")
    print("Admin login:   username='admin', password='Admin@123', role='ADMIN'")

