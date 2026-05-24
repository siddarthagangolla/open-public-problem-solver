from fastapi import APIRouter, HTTPException
from database import get_db
from models import AdminLogin
from datetime import datetime, timedelta
from jose import jwt
from dotenv import load_dotenv
import bcrypt
import os

load_dotenv()

router = APIRouter()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 1440))

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_password(plain_password: str, hashed_password: str):
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8")
    )

@router.post("/admin/login")
def admin_login(credentials: AdminLogin):
    try:
        db = get_db()

        # Find admin by email
        response = db.table("admins")\
            .select("*")\
            .eq("email", credentials.email)\
            .execute()

        if not response.data:
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )

        admin = response.data[0]

        # Verify password
        if not verify_password(credentials.password, admin["password_hash"]):
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )

        # Create JWT token
        token = create_access_token({
            "sub": admin["email"],
            "role": "admin",
            "name": admin["full_name"]
        })

        return {
            "success": True,
            "access_token": token,
            "token_type": "bearer",
            "admin": {
                "email": admin["email"],
                "full_name": admin["full_name"]
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/admin/verify-token/{token}")
def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return {
            "success": True,
            "valid": True,
            "email": payload.get("sub"),
            "role": payload.get("role")
        }
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")