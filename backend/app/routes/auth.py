from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field

from ..auth import create_access_token, get_current_user, hash_password, public_user, verify_password
from ..database import get_db

router = APIRouter(prefix="/api/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    fullName: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    phone: str = Field(min_length=5, max_length=30)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest):
    db = get_db()
    email = body.email.lower().strip()

    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Пользователь с таким email уже существует")

    user_doc = {
        "fullName": body.fullName.strip(),
        "email": email,
        "phone": body.phone.strip(),
        "password": hash_password(body.password),
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }

    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    token = create_access_token(str(result.inserted_id))
    return {"token": token, "user": public_user(user_doc)}


@router.post("/login")
async def login(body: LoginRequest):
    db = get_db()
    user = await db.users.find_one({"email": body.email.lower().strip()})

    if not user or not verify_password(body.password, user["password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Неверный email или пароль")

    token = create_access_token(str(user["_id"]))
    return {"token": token, "user": public_user(user)}


@router.get("/me")
async def me(user=Depends(get_current_user)):
    return {"user": public_user(user)}
