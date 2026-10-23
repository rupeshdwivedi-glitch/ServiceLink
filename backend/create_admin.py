"""
One-off CLI script to create (or promote) an admin user.

Interactive:
    python create_admin.py

Non-interactive (e.g. for scripting/deployment):
    python create_admin.py --name "Site Admin" --email admin@example.com --password "..."

Deliberately NOT an API endpoint: admin accounts should only ever be created
by someone with direct access to the server/database, never through a public
HTTP request.
"""

import argparse
from getpass import getpass

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.user import User


def main():
    parser = argparse.ArgumentParser(description="Create or promote an admin user.")
    parser.add_argument("--name")
    parser.add_argument("--email")
    parser.add_argument("--password")
    args = parser.parse_args()

    name = args.name or input("Admin name: ").strip()
    email = (args.email or input("Admin email: ").strip()).lower()
    password = args.password or getpass("Admin password: ")

    if not name or not email or not password:
        print("Name, email, and password are all required.")
        return

    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            existing.role = "admin"
            existing.password_hash = hash_password(password)
            existing.name = name
            db.commit()
            print(f"Existing user '{email}' promoted to admin.")
        else:
            user = User(name=name, email=email, password_hash=hash_password(password), role="admin")
            db.add(user)
            db.commit()
            print(f"Admin user '{email}' created.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
