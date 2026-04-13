from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / '.env')

from fastapi import FastAPI, APIRouter, Request, Response, HTTPException, UploadFile, File, Form
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
import bcrypt
import jwt
import base64
import uuid
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
from typing import Optional
from fastapi.responses import StreamingResponse

from ml_model import StrokeDetectionModel
from pdf_generator import generate_pdf_report

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_ALGORITHM = "HS256"


def get_jwt_secret():
    return os.environ["JWT_SECRET"]


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id, "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=15),
        "type": "access"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


stroke_model = StrokeDetectionModel()

app = FastAPI()
api_router = APIRouter(prefix="/api")


# --- Pydantic Models ---
class RegisterInput(BaseModel):
    email: str
    password: str
    name: str


class LoginInput(BaseModel):
    email: str
    password: str


class PatientCreate(BaseModel):
    name: str
    age: int
    gender: str
    medical_history: Optional[str] = ""


class PatientUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    medical_history: Optional[str] = None


# --- Auth Routes ---
@api_router.post("/auth/register")
async def register(input_data: RegisterInput, response: Response):
    email = input_data.email.lower().strip()
    if len(input_data.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed = hash_password(input_data.password)
    user_doc = {
        "email": email,
        "password_hash": hashed,
        "name": input_data.name,
        "role": "user",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)

    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)

    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=900, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")

    return {"id": user_id, "email": email, "name": input_data.name, "role": "user"}


@api_router.post("/auth/login")
async def login(input_data: LoginInput, request: Request, response: Response):
    email = input_data.email.lower().strip()

    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"
    attempts = await db.login_attempts.find_one({"identifier": identifier})
    if attempts and attempts.get("count", 0) >= 5:
        lockout_time = attempts.get("last_attempt")
        if lockout_time:
            if isinstance(lockout_time, str):
                lockout_time = datetime.fromisoformat(lockout_time)
            if datetime.now(timezone.utc) - lockout_time < timedelta(minutes=15):
                raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in 15 minutes.")
            else:
                await db.login_attempts.delete_one({"identifier": identifier})

    user = await db.users.find_one({"email": email})
    if not user or not verify_password(input_data.password, user["password_hash"]):
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$inc": {"count": 1}, "$set": {"last_attempt": datetime.now(timezone.utc).isoformat()}},
            upsert=True
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")

    await db.login_attempts.delete_one({"identifier": identifier})

    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)

    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=900, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")

    return {"id": user_id, "email": email, "name": user.get("name", ""), "role": user.get("role", "user")}


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out"}


@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user


@api_router.post("/auth/refresh")
async def refresh_token_endpoint(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user_id = str(user["_id"])
        access_token = create_access_token(user_id, user["email"])
        response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=900, path="/")
        return {"message": "Token refreshed"}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")


# --- Patient Routes ---
@api_router.get("/patients")
async def list_patients(request: Request):
    user = await get_current_user(request)
    patients = await db.patients.find({"user_id": user["_id"]}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return patients


@api_router.post("/patients")
async def create_patient(input_data: PatientCreate, request: Request):
    user = await get_current_user(request)
    patient_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["_id"],
        "name": input_data.name,
        "age": input_data.age,
        "gender": input_data.gender,
        "medical_history": input_data.medical_history or "",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.patients.insert_one(patient_doc)
    patient_doc.pop("_id", None)
    return patient_doc


@api_router.get("/patients/{patient_id}")
async def get_patient(patient_id: str, request: Request):
    user = await get_current_user(request)
    patient = await db.patients.find_one({"id": patient_id, "user_id": user["_id"]}, {"_id": 0})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@api_router.put("/patients/{patient_id}")
async def update_patient(patient_id: str, input_data: PatientUpdate, request: Request):
    user = await get_current_user(request)
    update_data = {k: v for k, v in input_data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    result = await db.patients.update_one(
        {"id": patient_id, "user_id": user["_id"]},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Patient not found")
    patient = await db.patients.find_one({"id": patient_id}, {"_id": 0})
    return patient


@api_router.delete("/patients/{patient_id}")
async def delete_patient(patient_id: str, request: Request):
    user = await get_current_user(request)
    result = await db.patients.delete_one({"id": patient_id, "user_id": user["_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Patient not found")
    # Also delete associated scans
    await db.scans.delete_many({"patient_id": patient_id, "user_id": user["_id"]})
    return {"message": "Patient deleted"}


# --- Scan Routes ---
@api_router.post("/scans/analyze")
async def analyze_scan(
    request: Request,
    file: UploadFile = File(...),
    patient_id: str = Form(None),
    patient_name: str = Form(None)
):
    user = await get_current_user(request)

    image_bytes = await file.read()
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum 10MB.")

    patient_data = None
    if patient_id:
        patient_data = await db.patients.find_one({"id": patient_id, "user_id": user["_id"]}, {"_id": 0})

    result = stroke_model.predict(image_bytes)

    image_b64 = base64.b64encode(image_bytes).decode('utf-8')
    content_type = file.content_type or "image/png"

    scan_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["_id"],
        "patient_id": patient_id,
        "patient_name": patient_name or (patient_data.get("name") if patient_data else "Unknown"),
        "filename": file.filename,
        "content_type": content_type,
        "image_data": image_b64,
        "classification": result["classification"],
        "confidence": result["confidence"],
        "probabilities": result["probabilities"],
        "features": result["features"],
        "stroke_info": result["stroke_info"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.scans.insert_one(scan_doc)
    scan_doc.pop("_id", None)

    response_doc = {k: v for k, v in scan_doc.items() if k != "image_data"}
    response_doc["has_image"] = True
    return response_doc


@api_router.get("/scans")
async def list_scans(request: Request):
    user = await get_current_user(request)
    scans = await db.scans.find(
        {"user_id": user["_id"]},
        {"_id": 0, "image_data": 0}
    ).sort("created_at", -1).to_list(1000)
    return scans


@api_router.get("/scans/{scan_id}")
async def get_scan(scan_id: str, request: Request):
    user = await get_current_user(request)
    scan = await db.scans.find_one({"id": scan_id, "user_id": user["_id"]}, {"_id": 0})
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return scan


@api_router.delete("/scans/{scan_id}")
async def delete_scan(scan_id: str, request: Request):
    user = await get_current_user(request)
    result = await db.scans.delete_one({"id": scan_id, "user_id": user["_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Scan not found")
    return {"message": "Scan deleted"}


@api_router.get("/scans/{scan_id}/pdf")
async def get_scan_pdf(scan_id: str, request: Request):
    user = await get_current_user(request)
    scan = await db.scans.find_one({"id": scan_id, "user_id": user["_id"]}, {"_id": 0})
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    patient_data = None
    if scan.get("patient_id"):
        patient_data = await db.patients.find_one({"id": scan["patient_id"]}, {"_id": 0})

    pdf_buffer = generate_pdf_report(scan, patient_data)

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=stroke_report_{scan_id[:8]}.pdf"}
    )


# --- Dashboard ---
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(request: Request):
    user = await get_current_user(request)
    user_id = user["_id"]

    total_scans = await db.scans.count_documents({"user_id": user_id})
    total_patients = await db.patients.count_documents({"user_id": user_id})
    hemorrhagic_count = await db.scans.count_documents({"user_id": user_id, "classification": "hemorrhagic"})
    ischemic_count = await db.scans.count_documents({"user_id": user_id, "classification": "ischemic"})
    normal_count = await db.scans.count_documents({"user_id": user_id, "classification": "normal"})

    recent_scans = await db.scans.find(
        {"user_id": user_id},
        {"_id": 0, "image_data": 0}
    ).sort("created_at", -1).limit(5).to_list(5)

    return {
        "total_scans": total_scans,
        "total_patients": total_patients,
        "hemorrhagic_count": hemorrhagic_count,
        "ischemic_count": ischemic_count,
        "normal_count": normal_count,
        "recent_scans": recent_scans
    }


@api_router.get("/")
async def root():
    return {"message": "NeuroScan AI API"}


app.include_router(api_router)

frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@example.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        hashed = hash_password(admin_password)
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hashed,
            "name": "Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info(f"Admin user seeded: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}}
        )
        logger.info(f"Admin password updated: {admin_email}")

    # Write credentials
    os.makedirs("/app/memory", exist_ok=True)
    with open("/app/memory/test_credentials.md", "w") as f:
        f.write(f"# Test Credentials\n\n")
        f.write(f"## Admin\n- Email: {admin_email}\n- Password: {admin_password}\n- Role: admin\n\n")
        f.write(f"## Auth Endpoints\n- POST /api/auth/register\n- POST /api/auth/login\n- POST /api/auth/logout\n- GET /api/auth/me\n- POST /api/auth/refresh\n")


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.scans.create_index("user_id")
    await db.patients.create_index("user_id")
    await seed_admin()
    logger.info("NeuroScan AI started successfully")


@app.on_event("shutdown")
async def shutdown():
    client.close()
