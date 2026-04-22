from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Response
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import io
import uuid
import base64
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Literal
from datetime import datetime, timezone
import openpyxl
from openpyxl import Workbook
import qrcode


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Buldhana Police Bandobast API")
api_router = APIRouter(prefix="/api")


# ========================= MODELS =========================

StaffType = Literal["officer", "amaldar", "home_guard"]

OFFICER_RANKS = ["ASP", "Dy.SP", "PI", "API", "PSI"]
AMALDAR_RANKS = ["ASI", "HC", "NPC", "PC", "LPC"]
HOME_GUARD_RANKS = ["Home Guard"]


class Staff(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    staff_type: StaffType
    rank: str
    bakkal_no: str
    name: str
    posting: str = ""
    mobile: str = ""
    photo: str = ""  # base64 data url or URL
    gender: Literal["Male", "Female", "Other"] = "Male"
    district: str = "Buldhana"
    category: str = ""
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class StaffCreate(BaseModel):
    staff_type: StaffType
    rank: str
    bakkal_no: str
    name: str
    posting: Optional[str] = ""
    mobile: Optional[str] = ""
    photo: Optional[str] = ""
    gender: Optional[str] = "Male"
    district: Optional[str] = "Buldhana"
    category: Optional[str] = ""


class StaffUpdate(BaseModel):
    rank: Optional[str] = None
    name: Optional[str] = None
    posting: Optional[str] = None
    mobile: Optional[str] = None
    photo: Optional[str] = None
    gender: Optional[str] = None
    district: Optional[str] = None
    category: Optional[str] = None


class BandobastPoint(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    point_name: str
    req_officer: int = 0
    req_amaldar: int = 0
    req_female_amaldar: int = 0
    req_home_guard: int = 0
    equipment: List[str] = []
    sector: str = ""
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    suchana: str = ""
    is_reserved: bool = False


class Bandobast(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    year: int
    date: str  # ISO
    name: str
    spot: str = ""
    ps_name: str = ""
    in_charge: str = ""
    points: List[BandobastPoint] = []
    selected_staff_ids: List[str] = []
    allotments: dict = {}  # point_id -> [staff_id,...]
    status: Literal["draft", "deployed"] = "draft"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class BandobastCreate(BaseModel):
    year: int
    date: str
    name: str
    spot: Optional[str] = ""
    ps_name: Optional[str] = ""
    in_charge: Optional[str] = ""


class BandobastUpdate(BaseModel):
    year: Optional[int] = None
    date: Optional[str] = None
    name: Optional[str] = None
    spot: Optional[str] = None
    ps_name: Optional[str] = None
    in_charge: Optional[str] = None


# ========================= STAFF ENDPOINTS =========================

@api_router.get("/")
async def root():
    return {"message": "Buldhana Police Bandobast API"}


@api_router.get("/staff", response_model=List[Staff])
async def list_staff(staff_type: Optional[StaffType] = None, rank: Optional[str] = None, search: Optional[str] = None):
    query = {}
    if staff_type:
        query["staff_type"] = staff_type
    if rank:
        query["rank"] = rank
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"bakkal_no": {"$regex": search, "$options": "i"}},
        ]
    items = await db.staff.find(query, {"_id": 0}).sort("created_at", -1).to_list(5000)
    return items


@api_router.post("/staff", response_model=Staff)
async def create_staff(payload: StaffCreate):
    # check duplicate bakkal for same type
    existing = await db.staff.find_one({"bakkal_no": payload.bakkal_no, "staff_type": payload.staff_type}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=409, detail="Staff with this Bakkal No already exists")
    obj = Staff(**payload.model_dump())
    await db.staff.insert_one(obj.model_dump())
    return obj


@api_router.get("/staff/by-bakkal/{bakkal_no}")
async def get_staff_by_bakkal(bakkal_no: str, staff_type: Optional[StaffType] = None):
    query = {"bakkal_no": bakkal_no}
    if staff_type:
        query["staff_type"] = staff_type
    item = await db.staff.find_one(query, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item


@api_router.get("/staff/{staff_id}", response_model=Staff)
async def get_staff(staff_id: str):
    item = await db.staff.find_one({"id": staff_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Staff not found")
    return item


@api_router.patch("/staff/{staff_id}", response_model=Staff)
async def update_staff(staff_id: str, payload: StaffUpdate):
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    res = await db.staff.update_one({"id": staff_id}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    item = await db.staff.find_one({"id": staff_id}, {"_id": 0})
    return item


@api_router.delete("/staff/{staff_id}")
async def delete_staff(staff_id: str):
    res = await db.staff.delete_one({"id": staff_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}


@api_router.get("/staff-template/{staff_type}")
async def staff_template(staff_type: StaffType):
    wb = Workbook()
    ws = wb.active
    ws.title = staff_type.upper()
    headers = ["rank", "bakkal_no", "name", "posting", "mobile", "gender", "district", "category"]
    ws.append(headers)
    # example row
    example_rank = {
        "officer": "PI",
        "amaldar": "HC",
        "home_guard": "Home Guard",
    }[staff_type]
    ws.append([example_rank, "12345", "Example Name", "PS Buldhana", "9999999999", "Male", "Buldhana", "Open"])
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    filename = f"{staff_type}_template.xlsx"
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@api_router.post("/staff/import/{staff_type}")
async def import_staff(staff_type: StaffType, file: UploadFile = File(...)):
    content = await file.read()
    try:
        wb = openpyxl.load_workbook(io.BytesIO(content), data_only=True)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid Excel file: {e}")
    ws = wb.active
    rows = list(ws.iter_rows(values_only=True))
    if len(rows) < 2:
        return {"inserted": 0, "skipped": 0, "errors": []}
    headers = [str(h).strip().lower() if h else "" for h in rows[0]]
    required = ["rank", "bakkal_no", "name"]
    for r in required:
        if r not in headers:
            raise HTTPException(status_code=400, detail=f"Missing required column: {r}")
    inserted = 0
    skipped = 0
    errors = []
    for i, row in enumerate(rows[1:], start=2):
        data = {headers[j]: (str(v).strip() if v is not None else "") for j, v in enumerate(row) if j < len(headers)}
        if not data.get("bakkal_no") or not data.get("name") or not data.get("rank"):
            continue
        existing = await db.staff.find_one({"bakkal_no": data["bakkal_no"], "staff_type": staff_type}, {"_id": 0})
        if existing:
            skipped += 1
            continue
        try:
            obj = Staff(
                staff_type=staff_type,
                rank=data.get("rank", ""),
                bakkal_no=data.get("bakkal_no", ""),
                name=data.get("name", ""),
                posting=data.get("posting", ""),
                mobile=data.get("mobile", ""),
                gender=data.get("gender", "Male") or "Male",
                district=data.get("district", "Buldhana") or "Buldhana",
                category=data.get("category", ""),
            )
            await db.staff.insert_one(obj.model_dump())
            inserted += 1
        except Exception as e:
            errors.append({"row": i, "error": str(e)})
    return {"inserted": inserted, "skipped": skipped, "errors": errors}


# ========================= BANDOBAST ENDPOINTS =========================

@api_router.get("/bandobasts", response_model=List[Bandobast])
async def list_bandobasts():
    items = await db.bandobasts.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return items


@api_router.post("/bandobasts", response_model=Bandobast)
async def create_bandobast(payload: BandobastCreate):
    obj = Bandobast(**payload.model_dump())
    await db.bandobasts.insert_one(obj.model_dump())
    return obj


@api_router.get("/bandobasts/{bid}", response_model=Bandobast)
async def get_bandobast(bid: str):
    item = await db.bandobasts.find_one({"id": bid}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item


@api_router.patch("/bandobasts/{bid}", response_model=Bandobast)
async def update_bandobast(bid: str, payload: BandobastUpdate):
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    res = await db.bandobasts.update_one({"id": bid}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    item = await db.bandobasts.find_one({"id": bid}, {"_id": 0})
    return item


@api_router.delete("/bandobasts/{bid}")
async def delete_bandobast(bid: str):
    res = await db.bandobasts.delete_one({"id": bid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}


# ---- Points ----
@api_router.post("/bandobasts/{bid}/points", response_model=BandobastPoint)
async def add_point(bid: str, point: BandobastPoint):
    bandobast = await db.bandobasts.find_one({"id": bid}, {"_id": 0})
    if not bandobast:
        raise HTTPException(status_code=404, detail="Not found")
    if not point.id:
        point.id = str(uuid.uuid4())
    await db.bandobasts.update_one({"id": bid}, {"$push": {"points": point.model_dump()}})
    return point


@api_router.patch("/bandobasts/{bid}/points/{pid}", response_model=BandobastPoint)
async def update_point(bid: str, pid: str, point: BandobastPoint):
    point.id = pid
    res = await db.bandobasts.update_one(
        {"id": bid, "points.id": pid},
        {"$set": {"points.$": point.model_dump()}},
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return point


@api_router.delete("/bandobasts/{bid}/points/{pid}")
async def delete_point(bid: str, pid: str):
    await db.bandobasts.update_one({"id": bid}, {"$pull": {"points": {"id": pid}}})
    # also remove allotments for this point
    await db.bandobasts.update_one({"id": bid}, {"$unset": {f"allotments.{pid}": ""}})
    return {"ok": True}


# ---- Selected Staff ----
class SelectedStaffPayload(BaseModel):
    staff_ids: List[str]


@api_router.put("/bandobasts/{bid}/selected-staff")
async def set_selected_staff(bid: str, payload: SelectedStaffPayload):
    res = await db.bandobasts.update_one({"id": bid}, {"$set": {"selected_staff_ids": payload.staff_ids}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True, "count": len(payload.staff_ids)}


# ---- Allotment ----
class AllotmentPayload(BaseModel):
    allotments: dict  # point_id -> [staff_id]


@api_router.put("/bandobasts/{bid}/allotments")
async def set_allotments(bid: str, payload: AllotmentPayload):
    bandobast = await db.bandobasts.find_one({"id": bid}, {"_id": 0})
    if not bandobast:
        raise HTTPException(status_code=404, detail="Not found")
    allot = payload.allotments
    # Auto-reserve remaining
    selected = set(bandobast.get("selected_staff_ids", []))
    allotted = set()
    for sids in allot.values():
        allotted.update(sids)
    remaining = list(selected - allotted)
    reserved_point_id = None
    # find reserved point
    for p in bandobast.get("points", []):
        if p.get("is_reserved"):
            reserved_point_id = p["id"]
            break
    if remaining:
        if not reserved_point_id:
            reserved_point_id = str(uuid.uuid4())
            reserved_point = BandobastPoint(
                id=reserved_point_id,
                point_name="Reserved / राखीव",
                is_reserved=True,
            ).model_dump()
            await db.bandobasts.update_one({"id": bid}, {"$push": {"points": reserved_point}})
        allot[reserved_point_id] = list(set(allot.get(reserved_point_id, []) + remaining))
    await db.bandobasts.update_one({"id": bid}, {"$set": {"allotments": allot}})
    return {"ok": True, "reserved_point_id": reserved_point_id, "reserved_count": len(remaining)}


# ---- Deploy ----
@api_router.post("/bandobasts/{bid}/deploy")
async def deploy_bandobast(bid: str):
    res = await db.bandobasts.update_one({"id": bid}, {"$set": {"status": "deployed"}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True, "status": "deployed"}


# ---- QR Code ----
@api_router.get("/bandobasts/{bid}/points/{pid}/qr")
async def point_qr(bid: str, pid: str):
    bandobast = await db.bandobasts.find_one({"id": bid}, {"_id": 0})
    if not bandobast:
        raise HTTPException(status_code=404, detail="Not found")
    point = next((p for p in bandobast.get("points", []) if p["id"] == pid), None)
    if not point:
        raise HTTPException(status_code=404, detail="Point not found")
    data = {
        "bandobast": bandobast.get("name"),
        "date": bandobast.get("date"),
        "point": point.get("point_name"),
        "lat": point.get("latitude"),
        "lng": point.get("longitude"),
    }
    text = " | ".join([f"{k}:{v}" for k, v in data.items() if v is not None])
    img = qrcode.make(text)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return Response(content=buf.getvalue(), media_type="image/png")


# ---- Goshwara (Summary) ----
@api_router.get("/bandobasts/{bid}/goshwara")
async def goshwara(bid: str):
    bandobast = await db.bandobasts.find_one({"id": bid}, {"_id": 0})
    if not bandobast:
        raise HTTPException(status_code=404, detail="Not found")
    all_staff_ids = list({sid for sids in bandobast.get("allotments", {}).values() for sid in sids})
    staff_list = await db.staff.find({"id": {"$in": all_staff_ids}}, {"_id": 0}).to_list(5000)
    staff_map = {s["id"]: s for s in staff_list}
    point_wise = []
    for p in bandobast.get("points", []):
        assigned = bandobast.get("allotments", {}).get(p["id"], [])
        point_wise.append({
            "point": p,
            "staff": [staff_map[s] for s in assigned if s in staff_map],
        })
    # staff-wise
    staff_wise = []
    for sid, staff in staff_map.items():
        points = []
        for p in bandobast.get("points", []):
            if sid in bandobast.get("allotments", {}).get(p["id"], []):
                points.append(p)
        staff_wise.append({"staff": staff, "points": points})
    return {
        "bandobast": bandobast,
        "point_wise": point_wise,
        "staff_wise": staff_wise,
    }


# ========================= APP SETUP =========================

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
