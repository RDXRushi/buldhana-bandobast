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
    unique_suffix = uuid.uuid4().hex[:6]
    ws.append(["PSI", bakkal, f"Imported Officer {unique_suffix}", "PS Test",
               f"9{uuid.uuid4().int % 1000000000:09d}", "Male", "Buldhana", "Open"])
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    files = {"file": ("staff.xlsx", buf.getvalue(),
             "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
    r = s.post(f"{API}/staff/import/officer", files=files)
    assert r.status_code == 200, r.text
    j = r.json()
    assert j["inserted"] == 1
    # officers have bakkal_no stripped to "" in create_staff code path; verify by name search
    rg = s.get(f"{API}/staff", params={"search": f"Imported Officer {unique_suffix}"})
    assert rg.status_code == 200
    assert any("Imported Officer" in x.get("name", "") for x in rg.json())


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

    # Allotments - allot only first 2; 3rd will auto-go to reserved on deploy
    ra = s.put(f"{API}/bandobasts/{bid}/allotments",
               json={"allotments": {pid: staff_ids[:2]}})
    assert ra.status_code == 200, ra.text

    # Verify bandobast state (pre-deploy - no reserved point yet)
    bd = s.get(f"{API}/bandobasts/{bid}").json()
    assert bd["allotments"][pid] == staff_ids[:2]

    # QR
    rq = s.get(f"{API}/bandobasts/{bid}/points/{pid}/qr")
    assert rq.status_code == 200
    assert rq.headers.get("content-type") == "image/png"
    assert rq.content[:8] == b"\x89PNG\r\n\x1a\n"

    # Goshwara pre-deploy (only allotted staff show up, not reserved yet)
    rg = s.get(f"{API}/bandobasts/{bid}/goshwara")
    assert rg.status_code == 200
    g = rg.json()
    assert "point_wise" in g and "staff_wise" in g
    assert len(g["staff_wise"]) == 2  # Only the 2 allotted; 3rd is selected but not allotted yet

    # Deploy - should auto-reserve unallotted staff
    rd = s.post(f"{API}/bandobasts/{bid}/deploy")
    assert rd.status_code == 200 and rd.json()["status"] == "deployed"
    assert rd.json()["reserved_count"] == 1
    assert s.get(f"{API}/bandobasts/{bid}").json()["status"] == "deployed"

    # Verify reserved point created after deploy
    bd_after = s.get(f"{API}/bandobasts/{bid}").json()
    reserved = [p for p in bd_after["points"] if p.get("is_reserved")]
    assert len(reserved) == 1
    assert staff_ids[2] in bd_after["allotments"][reserved[0]["id"]]

    # Delete point
    rdp = s.delete(f"{API}/bandobasts/{bid}/points/{pid}")
    assert rdp.status_code == 200
    bd2 = s.get(f"{API}/bandobasts/{bid}").json()
    assert not any(p["id"] == pid for p in bd2["points"])

    # Soft-delete bandobast -> should move to deleted list
    rdb = s.delete(f"{API}/bandobasts/{bid}")
    assert rdb.status_code == 200
    # GET still works but appears in deleted list; not in main list
    assert bid not in [b["id"] for b in s.get(f"{API}/bandobasts").json()]
    assert bid in [b["id"] for b in s.get(f"{API}/bandobasts/deleted").json()]

    # Restore
    rr = s.post(f"{API}/bandobasts/{bid}/restore")
    assert rr.status_code == 200
    assert bid in [b["id"] for b in s.get(f"{API}/bandobasts").json()]

    # Permanent delete
    rp2 = s.delete(f"{API}/bandobasts/{bid}/permanent")
    assert rp2.status_code == 200
    assert s.get(f"{API}/bandobasts/{bid}").status_code == 404

    # Cleanup staff
    for sid in staff_ids:
        s.delete(f"{API}/staff/{sid}")


def test_404s(s):
    assert s.get(f"{API}/bandobasts/nonexistent").status_code == 404
    assert s.get(f"{API}/staff/nonexistent").status_code == 404
    assert s.delete(f"{API}/staff/nonexistent").status_code == 404


# -------- Re-deploy (deploy twice on same bandobast) --------
def test_redeploy(s):
    r = s.post(f"{API}/bandobasts", json={"year": 2026, "date": "2026-02-01",
               "name": "TEST_Redeploy", "spot": "X"})
    bid = r.json()["id"]
    # First deploy (no staff, no points) - should still succeed
    r1 = s.post(f"{API}/bandobasts/{bid}/deploy")
    assert r1.status_code == 200 and r1.json()["status"] == "deployed"
    # Re-deploy should also succeed, not revert status
    r2 = s.post(f"{API}/bandobasts/{bid}/deploy")
    assert r2.status_code == 200 and r2.json()["status"] == "deployed"
    assert s.get(f"{API}/bandobasts/{bid}").json()["status"] == "deployed"
    # Status should not revert to draft on edits
    s.patch(f"{API}/bandobasts/{bid}", json={"spot": "Changed"})
    assert s.get(f"{API}/bandobasts/{bid}").json()["status"] == "deployed"
    s.delete(f"{API}/bandobasts/{bid}/permanent")


# -------- Out-of-District Staff CRUD (bandobast-scoped) --------
def test_out_district_staff_flow(s):
    r = s.post(f"{API}/bandobasts", json={"year": 2026, "date": "2026-03-01",
               "name": "TEST_OD", "has_other_district": True})
    bid = r.json()["id"]

    # Add officer (no bakkal)
    ro = s.post(f"{API}/bandobasts/{bid}/out-staff",
                json={"staff_type": "officer", "rank": "PI", "bakkal_no": "",
                      "name": "OD Officer", "mobile": "9000000001"})
    assert ro.status_code == 200
    oid = ro.json()["id"]
    # Duplicate officer (same name+mobile) -> 409
    rdup = s.post(f"{API}/bandobasts/{bid}/out-staff",
                  json={"staff_type": "officer", "rank": "PI", "bakkal_no": "",
                        "name": "OD Officer", "mobile": "9000000001"})
    assert rdup.status_code == 409

    # Add amaldar (bakkal required)
    ra = s.post(f"{API}/bandobasts/{bid}/out-staff",
                json={"staff_type": "amaldar", "rank": "HC",
                      "bakkal_no": f"OD{uuid.uuid4().hex[:6]}", "name": "OD Amaldar"})
    assert ra.status_code == 200
    aid = ra.json()["id"]

    # Amaldar without bakkal -> 400
    rbad = s.post(f"{API}/bandobasts/{bid}/out-staff",
                  json={"staff_type": "amaldar", "rank": "HC",
                        "bakkal_no": "", "name": "No Bakkal"})
    assert rbad.status_code == 400

    # Verify in bandobast
    bd = s.get(f"{API}/bandobasts/{bid}").json()
    assert len(bd["other_district_staff"]) == 2

    # Patch
    rp = s.patch(f"{API}/bandobasts/{bid}/out-staff/{oid}", json={"posting": "Updated"})
    assert rp.status_code == 200
    bd2 = s.get(f"{API}/bandobasts/{bid}").json()
    found = next(x for x in bd2["other_district_staff"] if x["id"] == oid)
    assert found["posting"] == "Updated"

    # Resolve OD staff via combined endpoint
    rr = s.get(f"{API}/bandobasts/{bid}/staff/{oid}")
    assert rr.status_code == 200 and rr.json()["name"] == "OD Officer"

    # Delete OD
    rd = s.delete(f"{API}/bandobasts/{bid}/out-staff/{aid}")
    assert rd.status_code == 200
    bd3 = s.get(f"{API}/bandobasts/{bid}").json()
    assert len(bd3["other_district_staff"]) == 1

    s.delete(f"{API}/bandobasts/{bid}/permanent")


# -------- Officer: no bakkal required / uniqueness by name+mobile --------
def test_officer_no_bakkal(s):
    uniq = uuid.uuid4().hex[:6]
    # Officer should be creatable without bakkal_no
    r1 = s.post(f"{API}/staff", json={"staff_type": "officer", "rank": "PI",
                                       "name": f"TEST_Off_{uniq}", "mobile": "9000000099"})
    assert r1.status_code == 200, r1.text
    sid = r1.json()["id"]
    created_staff_ids.append(sid)
    # Duplicate by name+mobile -> 409
    r2 = s.post(f"{API}/staff", json={"staff_type": "officer", "rank": "PI",
                                       "name": f"TEST_Off_{uniq}", "mobile": "9000000099"})
    assert r2.status_code == 409
    # Different mobile same name -> should pass
    r3 = s.post(f"{API}/staff", json={"staff_type": "officer", "rank": "PI",
                                       "name": f"TEST_Off_{uniq}", "mobile": "9000000100"})
    assert r3.status_code == 200
    created_staff_ids.append(r3.json()["id"])


# -------- Amaldar MUST have bakkal -> 400 --------
def test_amaldar_requires_bakkal(s):
    r = s.post(f"{API}/staff", json={"staff_type": "amaldar", "rank": "HC", "name": "NoBak"})
    assert r.status_code == 400


# -------- Points template + import + reorder --------
def test_points_template_and_import(s):
    r = s.get(f"{API}/bandobast-point-template")
    assert r.status_code == 200
    assert "spreadsheet" in r.headers.get("content-type", "")

    rb = s.post(f"{API}/bandobasts", json={"year": 2026, "date": "2026-04-01", "name": "TEST_Pts"})
    bid = rb.json()["id"]

    import openpyxl
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.append(["point_name", "req_officer", "req_amaldar", "req_female_amaldar",
               "req_home_guard", "equipment", "sector", "latitude", "longitude", "suchana"])
    ws.append(["Gate 1", 1, 2, 0, 1, "Lathi,Wireless", "A", 20.5, 76.1, "note"])
    ws.append(["Gate 2", 0, 3, 1, 0, "Barricade", "B", 20.6, 76.2, "note2"])
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    rimp = s.post(f"{API}/bandobasts/{bid}/points/import",
                  files={"file": ("p.xlsx", buf.getvalue(),
                                  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")})
    assert rimp.status_code == 200
    assert rimp.json()["inserted"] == 2

    bd = s.get(f"{API}/bandobasts/{bid}").json()
    assert len(bd["points"]) == 2
    pid = bd["points"][0]["id"]

    # Reorder
    r_seq = s.patch(f"{API}/bandobasts/{bid}/points/{pid}/seq", json={"seq": 5})
    assert r_seq.status_code == 200
    bd2 = s.get(f"{API}/bandobasts/{bid}").json()
    assert next(p for p in bd2["points"] if p["id"] == pid)["seq"] == 5

    s.delete(f"{API}/bandobasts/{bid}/permanent")


# -------- Equipment assignments --------
def test_equipment_assignments(s):
    rb = s.post(f"{API}/bandobasts", json={"year": 2026, "date": "2026-05-01", "name": "TEST_Eq"})
    bid = rb.json()["id"]
    rpt = s.post(f"{API}/bandobasts/{bid}/points",
                 json={"point_name": "Gate", "req_amaldar": 1, "equipment": ["Lathi", "Wireless"]})
    pid = rpt.json()["id"]
    rst = s.post(f"{API}/staff", json={"staff_type": "amaldar", "rank": "HC",
                                        "bakkal_no": f"EQ{uuid.uuid4().hex[:6]}", "name": "Eq Staff"})
    sid = rst.json()["id"]
    created_staff_ids.append(sid)

    assigns = {pid: {sid: "Lathi"}}
    r = s.put(f"{API}/bandobasts/{bid}/equipment-assignments",
              json={"equipment_assignments": assigns})
    assert r.status_code == 200
    bd = s.get(f"{API}/bandobasts/{bid}").json()
    assert bd["equipment_assignments"][pid][sid] == "Lathi"

    s.delete(f"{API}/bandobasts/{bid}/permanent")


# -------- Staff-wise Excel export --------
def test_staff_wise_export(s):
    rb = s.post(f"{API}/bandobasts", json={"year": 2026, "date": "2026-06-01", "name": "TEST_Exp"})
    bid = rb.json()["id"]
    r = s.get(f"{API}/bandobasts/{bid}/export/staff-wise")
    assert r.status_code == 200
    assert "spreadsheet" in r.headers.get("content-type", "")
    assert len(r.content) > 100
    s.delete(f"{API}/bandobasts/{bid}/permanent")


def teardown_module(module):
    sess = requests.Session()
    for sid in created_staff_ids:
        try:
            sess.delete(f"{API}/staff/{sid}")
        except Exception:
            pass
