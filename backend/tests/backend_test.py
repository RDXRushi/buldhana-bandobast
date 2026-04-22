"""Backend API tests for Buldhana Police Bandobast Management System."""
import os
import io
import uuid
import pytest
import requests

BASE = os.environ.get("REACT_APP_BACKEND_URL")
if not BASE:
    # fallback to frontend env
    from pathlib import Path
    for line in Path("/app/frontend/.env").read_text().splitlines():
        if line.startswith("REACT_APP_BACKEND_URL="):
            BASE = line.split("=", 1)[1].strip()
BASE = BASE.rstrip("/")
API = f"{BASE}/api"


@pytest.fixture(scope="session")
def s():
    return requests.Session()


# -------- Root --------
def test_root(s):
    r = s.get(f"{API}/")
    assert r.status_code == 200
    assert "Buldhana" in r.json().get("message", "")


# -------- Staff CRUD --------
created_staff_ids = []


@pytest.mark.parametrize("stype,rank", [("officer", "PI"), ("amaldar", "HC"), ("home_guard", "Home Guard")])
def test_staff_create_get_filter(s, stype, rank):
    bakkal = f"TEST{uuid.uuid4().hex[:8]}"
    payload = {"staff_type": stype, "rank": rank, "bakkal_no": bakkal,
               "name": f"TEST_{stype}", "posting": "PS Buldhana", "mobile": "9999999999"}
    r = s.post(f"{API}/staff", json=payload)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["bakkal_no"] == bakkal
    assert data["staff_type"] == stype
    sid = data["id"]
    created_staff_ids.append(sid)

    # by-bakkal
    r2 = s.get(f"{API}/staff/by-bakkal/{bakkal}")
    assert r2.status_code == 200
    assert r2.json()["id"] == sid

    # list filter
    r3 = s.get(f"{API}/staff", params={"staff_type": stype, "rank": rank})
    assert r3.status_code == 200
    assert any(x["id"] == sid for x in r3.json())

    # search
    r4 = s.get(f"{API}/staff", params={"search": bakkal})
    assert r4.status_code == 200
    assert any(x["id"] == sid for x in r4.json())


def test_staff_duplicate_bakkal(s):
    bakkal = f"DUP{uuid.uuid4().hex[:8]}"
    payload = {"staff_type": "officer", "rank": "PI", "bakkal_no": bakkal, "name": "Dup1"}
    r1 = s.post(f"{API}/staff", json=payload)
    assert r1.status_code == 200
    created_staff_ids.append(r1.json()["id"])
    r2 = s.post(f"{API}/staff", json=payload)
    assert r2.status_code == 409


def test_staff_update_delete(s):
    bakkal = f"UPD{uuid.uuid4().hex[:8]}"
    r = s.post(f"{API}/staff", json={"staff_type": "amaldar", "rank": "HC",
               "bakkal_no": bakkal, "name": "Old"})
    sid = r.json()["id"]
    r2 = s.patch(f"{API}/staff/{sid}", json={"name": "New Name"})
    assert r2.status_code == 200
    assert r2.json()["name"] == "New Name"
    # GET verify persistence
    r3 = s.get(f"{API}/staff/{sid}")
    assert r3.json()["name"] == "New Name"
    # delete
    rd = s.delete(f"{API}/staff/{sid}")
    assert rd.status_code == 200
    assert s.get(f"{API}/staff/{sid}").status_code == 404


# -------- Excel template & import --------
@pytest.mark.parametrize("stype", ["officer", "amaldar", "home_guard"])
def test_staff_template_download(s, stype):
    r = s.get(f"{API}/staff-template/{stype}")
    assert r.status_code == 200
    assert "spreadsheet" in r.headers.get("content-type", "")
    assert len(r.content) > 100


def test_staff_import(s):
    import openpyxl
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.append(["rank", "bakkal_no", "name", "posting", "mobile", "gender", "district", "category"])
    bakkal = f"IMP{uuid.uuid4().hex[:8]}"
    ws.append(["PSI", bakkal, "Imported Officer", "PS Test", "9888888888", "Male", "Buldhana", "Open"])
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    files = {"file": ("staff.xlsx", buf.getvalue(),
             "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
    r = s.post(f"{API}/staff/import/officer", files=files)
    assert r.status_code == 200, r.text
    j = r.json()
    assert j["inserted"] == 1
    # verify
    rg = s.get(f"{API}/staff/by-bakkal/{bakkal}")
    assert rg.status_code == 200


# -------- Bandobast Full Flow --------
def test_full_bandobast_flow(s):
    # Create staff for selection
    staff_ids = []
    for i in range(3):
        r = s.post(f"{API}/staff", json={"staff_type": "amaldar", "rank": "HC",
                   "bakkal_no": f"BFLOW{uuid.uuid4().hex[:6]}{i}", "name": f"Flow {i}"})
        assert r.status_code == 200
        staff_ids.append(r.json()["id"])

    # Create bandobast
    r = s.post(f"{API}/bandobasts", json={"year": 2026, "date": "2026-01-15",
               "name": "TEST_Bandobast", "spot": "Buldhana", "ps_name": "PS-1", "in_charge": "PI X"})
    assert r.status_code == 200
    bid = r.json()["id"]
    assert r.json()["status"] == "draft"

    # Get + List
    assert s.get(f"{API}/bandobasts/{bid}").status_code == 200
    assert any(b["id"] == bid for b in s.get(f"{API}/bandobasts").json())

    # Patch
    rp = s.patch(f"{API}/bandobasts/{bid}", json={"spot": "Updated Spot"})
    assert rp.status_code == 200 and rp.json()["spot"] == "Updated Spot"

    # Add point
    pt_payload = {"point_name": "Main Gate", "req_officer": 1, "req_amaldar": 2,
                  "req_home_guard": 0, "equipment": ["Lathi", "Helmet"],
                  "sector": "A", "latitude": 20.53, "longitude": 76.18}
    rpt = s.post(f"{API}/bandobasts/{bid}/points", json=pt_payload)
    assert rpt.status_code == 200, rpt.text
    pid = rpt.json()["id"]

    # Selected staff
    rs2 = s.put(f"{API}/bandobasts/{bid}/selected-staff",
                json={"staff_ids": staff_ids})
    assert rs2.status_code == 200

    # Allotments - allot only first 2; 3rd should auto-go to reserved
    ra = s.put(f"{API}/bandobasts/{bid}/allotments",
               json={"allotments": {pid: staff_ids[:2]}})
    assert ra.status_code == 200, ra.text
    j = ra.json()
    assert j["reserved_count"] == 1
    assert j["reserved_point_id"] is not None

    # Verify bandobast state
    bd = s.get(f"{API}/bandobasts/{bid}").json()
    reserved = [p for p in bd["points"] if p.get("is_reserved")]
    assert len(reserved) == 1
    assert staff_ids[2] in bd["allotments"][reserved[0]["id"]]

    # QR
    rq = s.get(f"{API}/bandobasts/{bid}/points/{pid}/qr")
    assert rq.status_code == 200
    assert rq.headers.get("content-type") == "image/png"
    assert rq.content[:8] == b"\x89PNG\r\n\x1a\n"

    # Goshwara
    rg = s.get(f"{API}/bandobasts/{bid}/goshwara")
    assert rg.status_code == 200
    g = rg.json()
    assert "point_wise" in g and "staff_wise" in g
    assert len(g["staff_wise"]) == 3

    # Deploy
    rd = s.post(f"{API}/bandobasts/{bid}/deploy")
    assert rd.status_code == 200 and rd.json()["status"] == "deployed"
    assert s.get(f"{API}/bandobasts/{bid}").json()["status"] == "deployed"

    # Delete point
    rdp = s.delete(f"{API}/bandobasts/{bid}/points/{pid}")
    assert rdp.status_code == 200
    bd2 = s.get(f"{API}/bandobasts/{bid}").json()
    assert not any(p["id"] == pid for p in bd2["points"])

    # Delete bandobast
    rdb = s.delete(f"{API}/bandobasts/{bid}")
    assert rdb.status_code == 200
    assert s.get(f"{API}/bandobasts/{bid}").status_code == 404

    # Cleanup staff
    for sid in staff_ids:
        s.delete(f"{API}/staff/{sid}")


def test_404s(s):
    assert s.get(f"{API}/bandobasts/nonexistent").status_code == 404
    assert s.get(f"{API}/staff/nonexistent").status_code == 404
    assert s.delete(f"{API}/staff/nonexistent").status_code == 404


def teardown_module(module):
    sess = requests.Session()
    for sid in created_staff_ids:
        try:
            sess.delete(f"{API}/staff/{sid}")
        except Exception:
            pass
