import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, BACKEND_URL, EQUIPMENT_OPTIONS, RANKS_BY_TYPE, STAFF_TYPE_LABELS } from "../lib/api";
import { L } from "../lib/i18n";
import Stepper from "../components/Stepper";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Checkbox } from "../components/ui/checkbox";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Plus, Trash2, ChevronLeft, ChevronRight, MapPin, Save, Send, Users, Shield, Upload, Download, Pencil } from "lucide-react";
import { toast } from "sonner";

const STEPS = [
  "Create Bandobast",
  "Create Points",
  "Select Staff",
  "Allotment",
  "Deploy",
];

export default function NewBandobast() {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [bid, setBid] = useState(routeId || null);
  const [bandobast, setBandobast] = useState(null);
  const [form, setForm] = useState({
    year: new Date().getFullYear(),
    date: new Date().toISOString().slice(0, 10),
    name: "",
    spot: "",
    ps_name: "",
    in_charge: "",
    has_other_district: false,
  });
  const [staff, setStaff] = useState([]);
  // Registered save functions from step components (for Save+Next behavior)
  const saveFnRef = React.useRef({});
  const setSaveFn = React.useCallback((stepIdx, fn) => {
    saveFnRef.current[stepIdx] = fn;
  }, []);

  // Merged staff (home + out-district from this bandobast)
  const allStaff = React.useMemo(
    () => [...staff, ...((bandobast && bandobast.other_district_staff) || [])],
    [staff, bandobast]
  );

  // Load existing
  useEffect(() => {
    const loadBandobast = async () => {
      if (routeId) {
        const { data } = await api.get(`/bandobasts/${routeId}`);
        setBandobast(data);
        setForm({
          year: data.year,
          date: data.date?.slice(0, 10) || "",
          name: data.name,
          spot: data.spot || "",
          ps_name: data.ps_name || "",
          in_charge: data.in_charge || "",
          has_other_district: !!data.has_other_district,
        });
        setBid(data.id);
        if (data.points?.length) setStep(1);
      }
    };
    loadBandobast();
  }, [routeId]);

  useEffect(() => {
    api.get("/staff").then((r) => setStaff(r.data));
  }, []);

  const refresh = async () => {
    if (!bid) return;
    const { data } = await api.get(`/bandobasts/${bid}`);
    setBandobast(data);
  };

  const saveStep1 = async () => {
    if (!form.name) { toast.error("Name is required"); return; }
    try {
      if (bid) {
        const { data } = await api.patch(`/bandobasts/${bid}`, form);
        setBandobast(data);
      } else {
        const { data } = await api.post("/bandobasts", form);
        setBandobast(data);
        setBid(data.id);
      }
      toast.success("Saved");
      setStep(1);
    } catch {
      toast.error("Failed to save");
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto" data-testid="wizard-page">
      <div className="mb-6">
        <button onClick={() => navigate("/")} className="text-sm text-[#6B7280] hover:text-[#2E3192] flex items-center gap-1" data-testid="wizard-back">
          <ChevronLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <h1 className="mt-2 font-display font-black text-3xl sm:text-4xl tracking-tight">{L.newBandobast}</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          {bandobast?.name ? `Editing: ${bandobast.name}` : "Follow the 5-step wizard to deploy a new bandobast"}
        </p>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-md p-6 shadow-sm">
        <Stepper steps={STEPS} current={step} />

        {step === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
            <div>
              <Label>{L.year}*</Label>
              <Input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} data-testid="bd-year" />
            </div>
            <div>
              <Label>{L.date}*</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} data-testid="bd-date" />
            </div>
            <div className="md:col-span-2">
              <Label>{L.bandobast} Name*</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ganesh Festival 2026" data-testid="bd-name" />
            </div>
            <div>
              <Label>{L.spot}</Label>
              <Input value={form.spot} onChange={(e) => setForm({ ...form, spot: e.target.value })} data-testid="bd-spot" />
            </div>
            <div>
              <Label>{L.psName}</Label>
              <Input value={form.ps_name} onChange={(e) => setForm({ ...form, ps_name: e.target.value })} data-testid="bd-ps" />
            </div>
            <div className="md:col-span-2">
              <Label>{L.inCharge}</Label>
              <Input value={form.in_charge} onChange={(e) => setForm({ ...form, in_charge: e.target.value })} data-testid="bd-incharge" />
            </div>
            <div className="md:col-span-2 bg-[#FF9933]/5 border border-[#FF9933]/30 rounded-md p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!form.has_other_district}
                  onChange={(e) => setForm({ ...form, has_other_district: e.target.checked })}
                  className="mt-1 w-4 h-4 accent-[#FF9933]"
                  data-testid="bd-has-other-district"
                />
                <div>
                  <div className="font-semibold text-sm text-[#0A0A0A]">
                    Other District Bandobast? / इतर जिल्हा बंदोबस्त आहे का?
                  </div>
                  <div className="text-xs text-[#6B7280] mt-0.5">
                    Check this if staff from other districts will participate. A separate "Out of District" import section will appear in Select Staff step. This data stays within this bandobast only.
                  </div>
                </div>
              </label>
            </div>
          </div>
        )}

        {step === 1 && <PointsStep bandobast={bandobast} bid={bid} onRefresh={refresh} />}
        {step === 2 && <SelectStaffStep bandobast={bandobast} bid={bid} staff={staff} allStaff={allStaff} onRefresh={refresh} registerSave={(fn) => setSaveFn(2, fn)} />}
        {step === 3 && <AllotmentStep bandobast={bandobast} bid={bid} staff={allStaff} onRefresh={refresh} registerSave={(fn) => setSaveFn(3, fn)} />}
        {step === 4 && <DeployStep bandobast={bandobast} bid={bid} staff={allStaff} onRefresh={refresh} navigate={navigate} />}

        {/* Footer nav */}
        <div className="mt-8 pt-5 border-t border-[#E5E7EB] flex justify-between">
          <Button variant="outline" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} data-testid="wizard-prev">
            <ChevronLeft className="w-4 h-4 mr-1" /> {L.previous}
          </Button>
          {step === 0 ? (
            <Button className="bg-[#2E3192] hover:bg-[#202266]" onClick={saveStep1} data-testid="wizard-save-next">
              <Save className="w-4 h-4 mr-2" /> {L.save} & {L.next}
            </Button>
          ) : step < 4 ? (
            <Button
              className="bg-[#2E3192] hover:bg-[#202266]"
              onClick={async () => {
                // For steps 2 & 3, auto-save before navigating
                const fn = saveFnRef.current[step];
                if (fn) {
                  try { await fn(); } catch { return; }
                }
                setStep(step + 1);
              }}
              disabled={!bid}
              data-testid="wizard-next"
            >
              {step === 2 || step === 3 ? (
                <><Save className="w-4 h-4 mr-2" /> {L.save} & {L.next}</>
              ) : (
                <>{L.next} <ChevronRight className="w-4 h-4 ml-1" /></>
              )}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function PointsStep({ bandobast, bid, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyPoint());
  const fileRef = React.useRef(null);
  function emptyPoint() {
    return {
      point_name: "",
      req_officer: 0,
      req_amaldar: 0,
      req_female_amaldar: 0,
      req_home_guard: 0,
      equipment: [],
      sector: "",
      latitude: "",
      longitude: "",
      suchana: "",
    };
  }
  const visiblePoints = (bandobast?.points || []).filter((p) => !p.is_reserved);

  const addPoint = async () => {
    if (!form.point_name) { toast.error("Point name required"); return; }
    const payload = {
      ...form,
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
    };
    await api.post(`/bandobasts/${bid}/points`, payload);
    toast.success("Point added");
    setForm(emptyPoint());
    setShowForm(false);
    onRefresh();
  };

  const deletePoint = async (pid) => {
    await api.delete(`/bandobasts/${bid}/points/${pid}`);
    toast.success("Point deleted");
    onRefresh();
  };

  const toggleEquip = (eq) => {
    setForm({
      ...form,
      equipment: form.equipment.includes(eq)
        ? form.equipment.filter((x) => x !== eq)
        : [...form.equipment, eq],
    });
  };

  const downloadTemplate = () => {
    window.open(`${BACKEND_URL}/api/bandobast-point-template`, "_blank");
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const { data } = await api.post(`/bandobasts/${bid}/points/import`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(`Imported ${data.inserted} point(s)`);
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Import failed");
    }
    e.target.value = "";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="font-display font-bold text-xl">Security Points</h3>
          <p className="text-sm text-[#6B7280]">Define all security locations</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={downloadTemplate} data-testid="point-template-btn">
            <Download className="w-4 h-4 mr-2" /> Template
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()} data-testid="point-import-btn">
            <Upload className="w-4 h-4 mr-2" /> Import Excel
          </Button>
          <input type="file" accept=".xlsx" className="hidden" ref={fileRef} onChange={handleImport} />
          <Button className="bg-[#2E3192] hover:bg-[#202266]" onClick={() => setShowForm((s) => !s)} data-testid="add-point-btn">
            <Plus className="w-4 h-4 mr-2" /> Add Point
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-md p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>{L.pointName}*</Label>
              <Input value={form.point_name} onChange={(e) => setForm({ ...form, point_name: e.target.value })} data-testid="point-name" />
            </div>
            <div>
              <Label>Req. Officer</Label>
              <Input type="number" min={0} value={form.req_officer} onChange={(e) => setForm({ ...form, req_officer: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Req. Amaldar</Label>
              <Input type="number" min={0} value={form.req_amaldar} onChange={(e) => setForm({ ...form, req_amaldar: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Req. Female Amaldar</Label>
              <Input type="number" min={0} value={form.req_female_amaldar} onChange={(e) => setForm({ ...form, req_female_amaldar: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Req. Home Guard</Label>
              <Input type="number" min={0} value={form.req_home_guard} onChange={(e) => setForm({ ...form, req_home_guard: Number(e.target.value) })} />
            </div>
            <div className="md:col-span-2">
              <Label>{L.equipment}</Label>
              <div className="flex flex-wrap gap-3 mt-2">
                {EQUIPMENT_OPTIONS.map((eq) => (
                  <label key={eq} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={form.equipment.includes(eq)} onCheckedChange={() => toggleEquip(eq)} />
                    {eq}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label>{L.sector}</Label>
              <Input value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>{L.latitude}</Label>
                <Input value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} placeholder="20.53" />
              </div>
              <div>
                <Label>{L.longitude}</Label>
                <Input value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} placeholder="76.18" />
              </div>
            </div>
            <div className="md:col-span-2">
              <Label>{L.suchana}</Label>
              <Textarea rows={3} value={form.suchana} onChange={(e) => setForm({ ...form, suchana: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button className="bg-[#2E3192] hover:bg-[#202266]" onClick={addPoint} data-testid="save-point-btn">Save Point</Button>
          </div>
        </div>
      )}

      <Table>
        <TableHeader className="bg-[#F9FAFB]">
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>{L.pointName}</TableHead>
            <TableHead>Officer</TableHead>
            <TableHead>Amaldar</TableHead>
            <TableHead>F.Amaldar</TableHead>
            <TableHead>H.Guard</TableHead>
            <TableHead>{L.equipment}</TableHead>
            <TableHead>Location</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visiblePoints.length === 0 && (
            <TableRow><TableCell colSpan={9} className="text-center py-6 text-[#6B7280]">No points yet.</TableCell></TableRow>
          )}
          {visiblePoints.map((p, i) => (
            <TableRow key={p.id} data-testid={`point-row-${p.id}`}>
              <TableCell>{i + 1}</TableCell>
              <TableCell className="font-medium">{p.point_name}</TableCell>
              <TableCell>{p.req_officer}</TableCell>
              <TableCell>{p.req_amaldar}</TableCell>
              <TableCell>{p.req_female_amaldar}</TableCell>
              <TableCell>{p.req_home_guard}</TableCell>
              <TableCell><div className="text-xs">{(p.equipment || []).join(", ")}</div></TableCell>
              <TableCell>
                {p.latitude && p.longitude ? (
                  <a
                    href={`https://www.google.com/maps?q=${p.latitude},${p.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#2E3192] font-medium inline-flex items-center gap-1"
                  >
                    <MapPin className="w-3 h-3" /> Map
                  </a>
                ) : "-"}
              </TableCell>
              <TableCell>
                <button className="p-1.5 text-[#DC2626] hover:bg-[#FEE2E2] rounded" onClick={() => deletePoint(p.id)}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function SelectStaffStep({ bandobast, bid, staff, allStaff, onRefresh, registerSave }) {
  const [selected, setSelected] = useState(new Set(bandobast?.selected_staff_ids || []));
  const [typeFilter, setTypeFilter] = useState("all");
  const [rankFilter, setRankFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [odModal, setOdModal] = useState(null); // { mode: 'add'|'edit', data?}
  const outFileRef = React.useRef({});

  useEffect(() => {
    setSelected(new Set(bandobast?.selected_staff_ids || []));
  }, [bandobast]);

  // Register save function for Save+Next button
  useEffect(() => {
    if (registerSave) {
      registerSave(async () => {
        await api.put(`/bandobasts/${bid}/selected-staff`, { staff_ids: [...selected] });
        toast.success("Selection saved");
        onRefresh();
      });
    }
    // eslint-disable-next-line
  }, [selected, bid]);

  const totals = (bandobast?.points || []).reduce(
    (acc, p) => {
      if (p.is_reserved) return acc;
      acc.officer += p.req_officer || 0;
      acc.amaldar += (p.req_amaldar || 0) + (p.req_female_amaldar || 0);
      acc.home_guard += p.req_home_guard || 0;
      return acc;
    },
    { officer: 0, amaldar: 0, home_guard: 0 }
  );

  const pool = allStaff || staff;
  const selectedByType = (type) => [...selected].filter((id) => pool.find((s) => s.id === id)?.staff_type === type).length;

  const homeFiltered = staff.filter((s) => {
    if (typeFilter !== "all" && s.staff_type !== typeFilter) return false;
    if (rankFilter !== "all" && s.rank !== rankFilter) return false;
    return true;
  });

  const toggle = (id) => {
    const n = new Set(selected);
    if (n.has(id)) n.delete(id); else n.add(id);
    setSelected(n);
  };

  const selectAllHome = () => {
    const n = new Set(selected);
    for (const s of homeFiltered) n.add(s.id);
    setSelected(n);
  };
  const clearAllHome = () => {
    const n = new Set(selected);
    for (const s of homeFiltered) n.delete(s.id);
    setSelected(n);
  };

  const save = async () => {
    setSaving(true);
    await api.put(`/bandobasts/${bid}/selected-staff`, { staff_ids: [...selected] });
    toast.success("Selection saved");
    onRefresh();
    setSaving(false);
  };

  // Out-of-district helpers
  const outStaff = bandobast?.other_district_staff || [];
  const downloadOutTemplate = (type) => {
    window.open(`${BACKEND_URL}/api/staff-template/${type}`, "_blank");
  };
  const handleOutImport = async (type, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const { data } = await api.post(`/bandobasts/${bid}/out-staff/import/${type}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const parts = [`Imported ${data.inserted}`];
      if (data.skipped_duplicate) parts.push(`${data.skipped_duplicate} duplicates`);
      if (data.skipped_missing) parts.push(`${data.skipped_missing} missing fields`);
      toast.success(parts.join(" · "));
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Import failed");
    }
    e.target.value = "";
  };
  const removeOut = async (sid) => {
    if (!window.confirm("Remove this staff from this bandobast?")) return;
    await api.delete(`/bandobasts/${bid}/out-staff/${sid}`);
    setSelected((prev) => { const n = new Set(prev); n.delete(sid); return n; });
    onRefresh();
  };
  const selectAllOut = () => {
    const n = new Set(selected);
    for (const s of outStaff) n.add(s.id);
    setSelected(n);
  };
  const clearAllOut = () => {
    const n = new Set(selected);
    for (const s of outStaff) n.delete(s.id);
    setSelected(n);
  };

  return (
    <div>
      <h3 className="font-display font-bold text-xl mb-4">Select Staff</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {["officer", "amaldar", "home_guard"].map((type) => (
          <div key={type} className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-md p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">{STAFF_TYPE_LABELS[type].en}</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black font-display text-[#2E3192]">{selectedByType(type)}</span>
              <span className="text-sm text-[#6B7280]">{L.selected}</span>
              <span className="ml-auto text-sm"><span className="font-bold">{totals[type]}</span> {L.required}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-3">
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setRankFilter("all"); }}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="officer">Officer</SelectItem>
            <SelectItem value="amaldar">Amaldar</SelectItem>
            <SelectItem value="home_guard">Home Guard</SelectItem>
          </SelectContent>
        </Select>
        <Select value={rankFilter} onValueChange={setRankFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ranks</SelectItem>
            {(typeFilter !== "all" ? RANKS_BY_TYPE[typeFilter] : [...RANKS_BY_TYPE.officer, ...RANKS_BY_TYPE.amaldar, ...RANKS_BY_TYPE.home_guard]).map((r) => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={selectAllHome} data-testid="select-all-home">Select All (filtered)</Button>
        <Button variant="outline" size="sm" onClick={clearAllHome} data-testid="clear-all-home">Clear</Button>
        <div className="ml-auto">
          <Button className="bg-[#138808] hover:bg-[#0E6306] text-white" onClick={save} disabled={saving} data-testid="save-selection-btn">
            <Save className="w-4 h-4 mr-2" /> Save Selection
          </Button>
        </div>
      </div>

      <div className="max-h-[420px] overflow-auto border border-[#E5E7EB] rounded-md">
        <Table>
          <TableHeader className="bg-[#F9FAFB] sticky top-0">
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Rank</TableHead>
              <TableHead>Bakkal</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Posting</TableHead>
              <TableHead>Gender</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {homeFiltered.map((s) => (
              <TableRow key={s.id} className={selected.has(s.id) ? "bg-[#2E3192]/5" : ""}>
                <TableCell>
                  <Checkbox checked={selected.has(s.id)} onCheckedChange={() => toggle(s.id)} data-testid={`select-${s.id}`} />
                </TableCell>
                <TableCell><Badge className="bg-[#2E3192]/10 text-[#2E3192]">{STAFF_TYPE_LABELS[s.staff_type].en}</Badge></TableCell>
                <TableCell className="font-semibold">{s.rank}</TableCell>
                <TableCell className="font-mono">{s.bakkal_no}</TableCell>
                <TableCell>{s.name}</TableCell>
                <TableCell>{s.posting || "-"}</TableCell>
                <TableCell>{s.gender}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Out of District Bandobast section */}
      {bandobast?.has_other_district && (
        <div className="mt-8 border-2 border-dashed border-[#FF9933] rounded-md p-4 bg-[#FF9933]/5" data-testid="out-district-section">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div>
              <h3 className="font-display font-bold text-lg text-[#B36B22]">
                Out of District Bandobast / इतर जिल्हा बंदोबस्त
              </h3>
              <p className="text-xs text-[#6B7280]">Specific to this bandobast only — does not modify your home district Staff Management.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setOdModal({ mode: "add" })} data-testid="od-add-btn">
                <Plus className="w-3 h-3 mr-1" /> Add Staff
              </Button>
              <Button variant="outline" size="sm" onClick={selectAllOut} data-testid="select-all-out">Select All</Button>
              <Button variant="outline" size="sm" onClick={clearAllOut} data-testid="clear-all-out">Clear</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {["officer", "amaldar", "home_guard"].map((type) => (
              <div key={type} className="bg-white border border-[#E5E7EB] rounded-md p-3">
                <div className="text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-2">
                  {STAFF_TYPE_LABELS[type].en}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => downloadOutTemplate(type)} data-testid={`out-tmpl-${type}`}>
                    <Download className="w-3 h-3 mr-1" /> Template
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => outFileRef.current[type]?.click()} data-testid={`out-import-${type}`}>
                    <Upload className="w-3 h-3 mr-1" /> Import
                  </Button>
                  <input
                    type="file"
                    accept=".xlsx"
                    className="hidden"
                    ref={(r) => (outFileRef.current[type] = r)}
                    onChange={(e) => handleOutImport(type, e)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="max-h-[360px] overflow-auto border border-[#E5E7EB] rounded-md bg-white">
            <Table>
              <TableHeader className="bg-[#F9FAFB] sticky top-0">
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Rank</TableHead>
                  <TableHead>Bakkal</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Posting</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outStaff.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-sm text-[#6B7280] py-6">
                      No out-of-district staff yet. Use Import or Add Staff above.
                    </TableCell>
                  </TableRow>
                )}
                {outStaff.map((s) => (
                  <TableRow key={s.id} className={selected.has(s.id) ? "bg-[#FF9933]/5" : ""}>
                    <TableCell>
                      <Checkbox checked={selected.has(s.id)} onCheckedChange={() => toggle(s.id)} data-testid={`out-select-${s.id}`} />
                    </TableCell>
                    <TableCell><Badge className="bg-[#FF9933]/15 text-[#B36B22]">{STAFF_TYPE_LABELS[s.staff_type].en}</Badge></TableCell>
                    <TableCell className="font-semibold">{s.rank}</TableCell>
                    <TableCell className="font-mono">{s.staff_type === "officer" ? "—" : (s.bakkal_no || "-")}</TableCell>
                    <TableCell>{s.name}</TableCell>
                    <TableCell>{s.posting || "-"}</TableCell>
                    <TableCell className="font-mono text-xs">{s.mobile || "-"}</TableCell>
                    <TableCell>{s.gender}</TableCell>
                    <TableCell>{s.district}</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1">
                        <button className="p-1.5 text-[#2E3192] hover:bg-[#2E3192]/10 rounded" onClick={() => setOdModal({ mode: "edit", data: s })} data-testid={`out-edit-${s.id}`}>
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-[#DC2626] hover:bg-[#FEE2E2] rounded" onClick={() => removeOut(s.id)} data-testid={`out-remove-${s.id}`}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {odModal && (
        <OutDistrictModal
          open={!!odModal}
          mode={odModal.mode}
          data={odModal.data}
          bid={bid}
          onClose={() => setOdModal(null)}
          onSaved={() => { setOdModal(null); onRefresh(); }}
        />
      )}
    </div>
  );
}

function OutDistrictModal({ open, mode, data, bid, onClose, onSaved }) {
  const [form, setForm] = useState(
    data || {
      staff_type: "officer",
      rank: RANKS_BY_TYPE.officer[0],
      bakkal_no: "",
      name: "",
      posting: "",
      mobile: "",
      gender: "Male",
      district: "Other",
      category: "",
    }
  );
  const [saving, setSaving] = useState(false);
  const isOfficer = form.staff_type === "officer";

  const onTypeChange = (v) => {
    setForm({ ...form, staff_type: v, rank: RANKS_BY_TYPE[v][0] });
  };

  const save = async () => {
    if (!form.rank || !form.name) { toast.error("Rank and Name are required"); return; }
    if (!isOfficer && !form.bakkal_no) { toast.error("Bakkal No is required"); return; }
    setSaving(true);
    try {
      if (mode === "edit") {
        await api.patch(`/bandobasts/${bid}/out-staff/${data.id}`, {
          rank: form.rank,
          bakkal_no: isOfficer ? "" : (form.bakkal_no || ""),
          name: form.name,
          posting: form.posting || "",
          mobile: form.mobile || "",
          gender: form.gender,
          district: form.district,
          category: form.category || "",
        });
        toast.success("Updated");
      } else {
        await api.post(`/bandobasts/${bid}/out-staff`, {
          ...form,
          bakkal_no: isOfficer ? "" : (form.bakkal_no || ""),
        });
        toast.success("Added");
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl" data-testid="od-staff-modal">
        <DialogHeader>
          <DialogTitle className="font-display">
            {mode === "edit" ? "Edit" : "Add"} Out-of-District Staff
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Type*</Label>
            <Select value={form.staff_type} onValueChange={onTypeChange} disabled={mode === "edit"}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="officer">Officer</SelectItem>
                <SelectItem value="amaldar">Amaldar</SelectItem>
                <SelectItem value="home_guard">Home Guard</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Rank*</Label>
            <Select value={form.rank} onValueChange={(v) => setForm({ ...form, rank: v })}>
              <SelectTrigger data-testid="od-form-rank"><SelectValue /></SelectTrigger>
              <SelectContent>
                {RANKS_BY_TYPE[form.staff_type].map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!isOfficer && (
            <div>
              <Label>Bakkal No*</Label>
              <Input value={form.bakkal_no} onChange={(e) => setForm({ ...form, bakkal_no: e.target.value })} data-testid="od-form-bakkal" />
            </div>
          )}
          <div className={isOfficer ? "md:col-span-2" : ""}>
            <Label>Name*</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="od-form-name" />
          </div>

          <div>
            <Label>Posting</Label>
            <Input value={form.posting} onChange={(e) => setForm({ ...form, posting: e.target.value })} />
          </div>
          <div>
            <Label>Mobile{isOfficer ? "*" : ""}</Label>
            <Input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} data-testid="od-form-mobile" />
          </div>

          <div>
            <Label>Gender</Label>
            <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>District</Label>
            <Input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>Category</Label>
            <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Open / SC / ST / OBC" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-[#FF9933] hover:bg-[#E68A2E] text-white" onClick={save} disabled={saving} data-testid="od-form-save">
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AllotmentStep({ bandobast, bid, staff, onRefresh }) {
  const [allot, setAllot] = useState(bandobast?.allotments || {});
  const [activePoint, setActivePoint] = useState(null);
  const [saving, setSaving] = useState(false);
  const [seqDraft, setSeqDraft] = useState({}); // pointId -> string
  const [filters, setFilters] = useState({
    officer: "", amaldar_m: "", amaldar_f: "", home_guard: "",
    od_officer: "", od_amaldar_m: "", od_amaldar_f: "", od_home_guard: "",
  });

  useEffect(() => {
    setAllot(bandobast?.allotments || {});
    const firstPoint = (bandobast?.points || []).find((p) => !p.is_reserved);
    if (firstPoint) setActivePoint(firstPoint.id);
  }, [bandobast]);

  const selectedIds = bandobast?.selected_staff_ids || [];
  const allottedSet = new Set(Object.values(allot).flat());
  // sort points by seq (reserved always last)
  const allPoints = [...(bandobast?.points || [])].sort((a, b) => {
    if (a.is_reserved && !b.is_reserved) return 1;
    if (!a.is_reserved && b.is_reserved) return -1;
    return (a.seq || 0) - (b.seq || 0);
  });

  // Group by sector
  const grouped = [];
  let currentGroup = null;
  for (const p of allPoints) {
    const key = p.is_reserved ? "__reserved__" : (p.sector || "__none__");
    if (!currentGroup || currentGroup.key !== key) {
      currentGroup = { key, sector: p.is_reserved ? "" : (p.sector || ""), points: [] };
      grouped.push(currentGroup);
    }
    currentGroup.points.push(p);
  }

  const odIds = new Set((bandobast?.other_district_staff || []).map((s) => s.id));
  const availableAll = staff.filter((s) => selectedIds.includes(s.id) && !allottedSet.has(s.id));
  const availableHome = availableAll.filter((s) => !odIds.has(s.id));
  const availableOut = availableAll.filter((s) => odIds.has(s.id));

  const buildPartitions = (list) => ({
    officer: list.filter((s) => s.staff_type === "officer"),
    amaldar_m: list.filter((s) => s.staff_type === "amaldar" && s.gender !== "Female"),
    amaldar_f: list.filter((s) => s.staff_type === "amaldar" && s.gender === "Female"),
    home_guard: list.filter((s) => s.staff_type === "home_guard"),
  });
  const partitions = buildPartitions(availableHome);
  const outPartitions = buildPartitions(availableOut);

  const applyFilter = (list, q) => {
    if (!q) return list;
    const needle = q.toLowerCase().trim();
    return list.filter(
      (s) =>
        (s.bakkal_no || "").toLowerCase().includes(needle) ||
        (s.name || "").toLowerCase().includes(needle) ||
        (s.posting || "").toLowerCase().includes(needle) ||
        (s.mobile || "").toLowerCase().includes(needle)
    );
  };

  const currentPt = allPoints.find((p) => p.id === activePoint);
  const current = activePoint ? (allot[activePoint] || []) : [];

  // Count how many of each role are already allotted to a point
  const rolesAllotted = (pt) => {
    const sids = allot[pt.id] || [];
    const assigned = sids.map((id) => staff.find((s) => s.id === id)).filter(Boolean);
    return {
      officer: assigned.filter((s) => s.staff_type === "officer").length,
      amaldar: assigned.filter((s) => s.staff_type === "amaldar" && s.gender !== "Female").length,
      amaldar_f: assigned.filter((s) => s.staff_type === "amaldar" && s.gender === "Female").length,
      home_guard: assigned.filter((s) => s.staff_type === "home_guard").length,
    };
  };

  const addToPoint = (sid) => {
    if (!activePoint) { toast.error("Select a point first"); return; }
    setAllot({ ...allot, [activePoint]: [...(allot[activePoint] || []), sid] });
  };
  const removeFromPoint = (sid) => {
    setAllot({ ...allot, [activePoint]: (allot[activePoint] || []).filter((x) => x !== sid) });
    // Also remove any equipment assignment for this staff at this point
    if (eqAssign[activePoint] && eqAssign[activePoint][sid]) {
      const next = { ...eqAssign };
      const pmap = { ...next[activePoint] };
      delete pmap[sid];
      next[activePoint] = pmap;
      setEqAssign(next);
    }
  };
  const assignEquipment = (sid, equipment) => {
    if (!activePoint) return;
    const pmap = { ...(eqAssign[activePoint] || {}) };
    // Ensure 1:1 — remove this equipment from any other staff at this point
    if (equipment) {
      for (const k of Object.keys(pmap)) {
        if (pmap[k] === equipment && k !== sid) delete pmap[k];
      }
      pmap[sid] = equipment;
    } else {
      delete pmap[sid];
    }
    setEqAssign({ ...eqAssign, [activePoint]: pmap });
  };

  const save = async () => {
    setSaving(true);
    await Promise.all([
      api.put(`/bandobasts/${bid}/allotments`, { allotments: allot }),
      api.put(`/bandobasts/${bid}/equipment-assignments`, { equipment_assignments: eqAssign }),
    ]);
    toast.success("Allotment saved");
    onRefresh();
    setSaving(false);
  };

  useEffect(() => {
    if (registerSave) {
      registerSave(save);
    }
    // eslint-disable-next-line
  }, [allot, eqAssign, bid]);

  const commitSeq = async (pid, currentSeq) => {
    const raw = seqDraft[pid];
    if (raw === undefined || raw === "") return;
    const n = parseInt(raw, 10);
    if (isNaN(n) || n === currentSeq) {
      setSeqDraft((d) => ({ ...d, [pid]: undefined }));
      return;
    }
    try {
      await api.patch(`/bandobasts/${bid}/points/${pid}/seq`, { seq: n });
      onRefresh();
    } catch {
      toast.error("Failed to update sequence");
    }
    setSeqDraft((d) => ({ ...d, [pid]: undefined }));
  };

  const getStaff = (id) => staff.find((s) => s.id === id);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="font-display font-bold text-xl">Allot Staff to Points</h3>
          <p className="text-sm text-[#6B7280]">Edit sequence by typing. Unallocated staff will move to Reserved on Deploy.</p>
        </div>
        <Button className="bg-[#138808] hover:bg-[#0E6306] text-white" onClick={save} disabled={saving} data-testid="save-allotment-btn">
          <Save className="w-4 h-4 mr-2" /> Save Allotment
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr_320px] gap-4">
        {/* Points list (grouped by sector) */}
        <div className="bg-white border border-[#E5E7EB] rounded-md p-4 max-h-[720px] overflow-auto">
          <h4 className="font-bold text-sm uppercase tracking-wider text-[#6B7280] mb-3">Points</h4>
          <div className="space-y-4">
            {grouped.map((g, gi) => {
              const multi = g.points.length > 1 && !g.points[0].is_reserved && g.sector;
              return (
                <div key={gi} className={multi ? "relative pl-3 border-l-4 border-[#FF9933] rounded" : ""}>
                  {multi && (
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#B36B22] mb-1 -ml-3 pl-3">
                      Sector: {g.sector}
                    </div>
                  )}
                  <div className="space-y-2">
                    {g.points.map((p) => {
                      const active = activePoint === p.id;
                      const alr = rolesAllotted(p);
                      const chip = (label, done, req, color) => (
                        <div className={`flex items-center justify-between px-1.5 py-0.5 rounded ${active ? "bg-white/10" : `bg-[${color}]/5`}`}>
                          <span className={active ? "text-white/80" : "text-[#6B7280]"}>{label}</span>
                          <span className={`font-mono font-bold ${active ? "text-white" : ""}`} style={{ color: active ? "#fff" : color }}>
                            {done}/{req}
                          </span>
                        </div>
                      );
                      return (
                        <div
                          key={p.id}
                          className={`rounded-md border ${active ? "bg-[#2E3192] text-white border-[#2E3192]" : "border-[#E5E7EB] bg-white hover:bg-[#F9FAFB]"}`}
                        >
                          <div className="flex items-center gap-2 px-2 py-2">
                            {/* Seq input */}
                            {!p.is_reserved ? (
                              <input
                                type="number"
                                value={seqDraft[p.id] !== undefined ? seqDraft[p.id] : (p.seq || 0)}
                                onChange={(e) => setSeqDraft((d) => ({ ...d, [p.id]: e.target.value }))}
                                onBlur={() => commitSeq(p.id, p.seq || 0)}
                                onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
                                data-testid={`seq-input-${p.id}`}
                                className={`w-10 text-center text-xs font-mono font-bold rounded border ${active ? "bg-white/10 border-white/30 text-white" : "bg-white border-[#E5E7EB] text-[#0A0A0A]"} focus:outline-none focus:ring-1 focus:ring-[#FF9933]`}
                              />
                            ) : (
                              <div className="w-10 text-center text-xs font-mono font-bold text-[#FF9933]">R</div>
                            )}
                            <button
                              className="flex-1 text-left"
                              onClick={() => setActivePoint(p.id)}
                              data-testid={`point-tab-${p.id}`}
                            >
                              <div className="font-semibold text-sm truncate">
                                {p.point_name}
                                {p.is_reserved && <Badge className="ml-2 bg-[#FF9933]/15 text-[#B36B22]">Reserved</Badge>}
                              </div>
                            </button>
                          </div>
                          <div className="px-2 pb-2 grid grid-cols-2 gap-1 text-[10px]">
                            {chip("Officer", alr.officer, p.req_officer || 0, "#2E3192")}
                            {chip("Amaldar", alr.amaldar, p.req_amaldar || 0, "#138808")}
                            {chip("F. Amaldar", alr.amaldar_f, p.req_female_amaldar || 0, "#B36B22")}
                            {chip("H. Guard", alr.home_guard, p.req_home_guard || 0, "#2563EB")}
                          </div>
                          {p.equipment && p.equipment.length > 0 && (
                            <div className="px-2 pb-2 flex flex-wrap gap-1">
                              {p.equipment.map((eq) => (
                                <span
                                  key={eq}
                                  className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${active ? "bg-white/20 text-white" : "bg-[#F3F4F6] text-[#4B5563]"}`}
                                >
                                  {eq}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {grouped.length === 0 && <div className="text-sm text-[#6B7280] text-center py-6">No points.</div>}
          </div>
        </div>

        {/* Available - 4 partitions + OD section */}
        <div className="bg-white border border-[#E5E7EB] rounded-md p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-sm uppercase tracking-wider text-[#6B7280]">
              Available — Home District ({availableHome.length})
            </h4>
            {!activePoint && <span className="text-xs text-[#DC2626]">Select a point to allot</span>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-auto">
            {[
              { key: "officer", title: "Officers", color: "#2E3192", data: partitions.officer },
              { key: "amaldar_m", title: "Amaldar (M)", color: "#138808", data: partitions.amaldar_m },
              { key: "amaldar_f", title: "Female Amaldar", color: "#B36B22", data: partitions.amaldar_f },
              { key: "home_guard", title: "Home Guards", color: "#2563EB", data: partitions.home_guard },
            ].map((part) => {
              const filtered = applyFilter(part.data, filters[part.key]);
              return (
                <div key={part.key} className="border border-[#E5E7EB] rounded-md overflow-hidden flex flex-col">
                  <div
                    className="px-2.5 py-1.5 flex items-center justify-between border-b border-[#E5E7EB]"
                    style={{ background: `${part.color}10`, color: part.color }}
                  >
                    <div className="font-bold text-xs uppercase tracking-wider">{part.title}</div>
                    <div className="font-mono font-bold text-xs">{filtered.length}/{part.data.length}</div>
                  </div>
                  <div className="p-2 border-b border-[#E5E7EB]">
                    <input
                      value={filters[part.key]}
                      onChange={(e) => setFilters({ ...filters, [part.key]: e.target.value })}
                      placeholder={part.key === "officer" ? "Name / Mobile / Posting" : "Bakkal / Name / Posting"}
                      className="w-full text-xs border border-[#E5E7EB] rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#2E3192]"
                      data-testid={`filter-${part.key}`}
                    />
                  </div>
                  <div className="flex-1 overflow-auto max-h-[220px] space-y-1 p-2">
                    {filtered.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-1.5 border border-[#E5E7EB] rounded hover:bg-[#F9FAFB]"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-semibold truncate">{s.name}</div>
                          <div className="text-[10px] text-[#6B7280] truncate">
                            {s.rank}
                            {s.staff_type !== "officer" && s.bakkal_no ? ` · ${s.bakkal_no}` : ""}
                            {s.mobile ? ` · ${s.mobile}` : ""}
                            {s.posting ? ` · ${s.posting}` : ""}
                          </div>
                        </div>
                        <button
                          className="text-[#2E3192] hover:bg-[#2E3192]/10 rounded p-1 flex-shrink-0"
                          onClick={() => addToPoint(s.id)}
                          disabled={!activePoint}
                          data-testid={`allot-add-${s.id}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    {filtered.length === 0 && (
                      <div className="text-[10px] text-[#6B7280] text-center py-3">None</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Out of District section */}
          {bandobast?.has_other_district && (
            <div className="mt-4 pt-4 border-t-2 border-dashed border-[#FF9933]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-sm uppercase tracking-wider text-[#B36B22]">
                  Available — Out of District ({availableOut.length})
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-auto">
                {[
                  { key: "od_officer", title: "OD Officers", color: "#B36B22", data: outPartitions.officer },
                  { key: "od_amaldar_m", title: "OD Amaldar (M)", color: "#B36B22", data: outPartitions.amaldar_m },
                  { key: "od_amaldar_f", title: "OD Female Amaldar", color: "#B36B22", data: outPartitions.amaldar_f },
                  { key: "od_home_guard", title: "OD Home Guards", color: "#B36B22", data: outPartitions.home_guard },
                ].map((part) => {
                  const filtered = applyFilter(part.data, filters[part.key]);
                  return (
                    <div key={part.key} className="border border-[#FF9933]/50 rounded-md overflow-hidden flex flex-col bg-[#FF9933]/5">
                      <div
                        className="px-2.5 py-1.5 flex items-center justify-between border-b border-[#FF9933]/30"
                        style={{ background: "rgba(255,153,51,0.15)", color: "#B36B22" }}
                      >
                        <div className="font-bold text-xs uppercase tracking-wider">{part.title}</div>
                        <div className="font-mono font-bold text-xs">{filtered.length}/{part.data.length}</div>
                      </div>
                      <div className="p-2 border-b border-[#FF9933]/20 bg-white">
                        <input
                          value={filters[part.key]}
                          onChange={(e) => setFilters({ ...filters, [part.key]: e.target.value })}
                          placeholder={part.key === "od_officer" ? "Name / Mobile / Posting" : "Bakkal / Name / Posting"}
                          className="w-full text-xs border border-[#E5E7EB] rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#FF9933]"
                          data-testid={`filter-${part.key}`}
                        />
                      </div>
                      <div className="flex-1 overflow-auto max-h-[220px] space-y-1 p-2 bg-white">
                        {filtered.map((s) => (
                          <div
                            key={s.id}
                            className="flex items-center justify-between p-1.5 border border-[#FF9933]/30 rounded hover:bg-[#FF9933]/5"
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-semibold truncate">{s.name}</div>
                              <div className="text-[10px] text-[#6B7280] truncate">
                                {s.rank}
                                {s.staff_type !== "officer" && s.bakkal_no ? ` · ${s.bakkal_no}` : ""}
                                {s.mobile ? ` · ${s.mobile}` : ""}
                                {s.district ? ` · ${s.district}` : ""}
                              </div>
                            </div>
                            <button
                              className="text-[#B36B22] hover:bg-[#FF9933]/20 rounded p-1 flex-shrink-0"
                              onClick={() => addToPoint(s.id)}
                              disabled={!activePoint}
                              data-testid={`allot-add-${s.id}`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                        {filtered.length === 0 && (
                          <div className="text-[10px] text-[#6B7280] text-center py-3">None</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Current point allottees */}
        <div className="bg-white border border-[#E5E7EB] rounded-md p-4 max-h-[720px] overflow-auto">
          <h4 className="font-bold text-sm uppercase tracking-wider text-[#6B7280] mb-3">
            {currentPt ? currentPt.point_name : "Select a point"} ({current.length})
          </h4>
          {currentPt && currentPt.equipment && currentPt.equipment.length > 0 && (
            <div className="mb-3 p-2 bg-[#FF9933]/5 border border-[#FF9933]/30 rounded text-[10px]">
              <div className="font-bold text-[#B36B22] uppercase tracking-wider mb-1">Equipment at this point</div>
              <div className="flex flex-wrap gap-1">
                {currentPt.equipment.map((eq) => {
                  const assignedTo = Object.entries(eqAssign[activePoint] || {}).find(([, v]) => v === eq)?.[0];
                  const assignedStaff = assignedTo ? getStaff(assignedTo) : null;
                  return (
                    <span
                      key={eq}
                      className={`px-1.5 py-0.5 rounded font-semibold ${
                        assignedStaff ? "bg-[#138808]/15 text-[#0E6306]" : "bg-[#DC2626]/10 text-[#DC2626]"
                      }`}
                    >
                      {eq}{assignedStaff ? ` → ${assignedStaff.name}` : " (unassigned)"}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
          <div className="space-y-1">
            {current.map((sid) => {
              const s = getStaff(sid);
              if (!s) return null;
              const assigned = (eqAssign[activePoint] || {})[sid] || "";
              const ptEquip = currentPt?.equipment || [];
              // Available = not assigned to anyone else at this point
              const takenByOthers = new Set(
                Object.entries(eqAssign[activePoint] || {})
                  .filter(([k]) => k !== sid)
                  .map(([, v]) => v)
              );
              return (
                <div key={sid} className="p-2 border border-[#E5E7EB] rounded bg-[#F9FAFB]">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{s.name}</div>
                      <div className="text-xs text-[#6B7280] truncate">
                        {s.rank}
                        {s.staff_type !== "officer" && s.bakkal_no ? ` · ${s.bakkal_no}` : ""}
                        {s.mobile ? ` · ${s.mobile}` : ""}
                      </div>
                    </div>
                    <button className="text-[#DC2626] hover:bg-[#FEE2E2] rounded p-1 flex-shrink-0" onClick={() => removeFromPoint(sid)} data-testid={`allot-remove-${sid}`}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {ptEquip.length > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px] text-[#6B7280] font-semibold uppercase">Equipment:</span>
                      <select
                        value={assigned}
                        onChange={(e) => assignEquipment(sid, e.target.value)}
                        className="flex-1 text-xs border border-[#E5E7EB] rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-[#2E3192]"
                        data-testid={`eq-assign-${sid}`}
                      >
                        <option value="">— none —</option>
                        {ptEquip.map((eq) => (
                          <option key={eq} value={eq} disabled={takenByOthers.has(eq)}>
                            {eq}{takenByOthers.has(eq) ? " (taken)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              );
            })}
            {current.length === 0 && <div className="text-sm text-[#6B7280] text-center py-6">No staff allotted.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function DeployStep({ bandobast, bid, staff, onRefresh, navigate }) {
  const [view, setView] = useState("point");
  const [deploying, setDeploying] = useState(false);

  const deploy = async () => {
    if (!window.confirm("Deploy this bandobast? All unallocated selected staff will be moved to Reserved.")) return;
    setDeploying(true);
    const { data } = await api.post(`/bandobasts/${bid}/deploy`);
    toast.success(`Deployed! ${data.reserved_count || 0} staff reserved.`);
    onRefresh();
    setDeploying(false);
  };

  const getStaff = (id) => staff.find((s) => s.id === id);
  const points = bandobast?.points || [];
  const allot = bandobast?.allotments || {};

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display font-bold text-xl">Review & Deploy</h3>
          <p className="text-sm text-[#6B7280]">Final summary before deployment</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate(`/bandobast/${bid}`)} data-testid="view-detail-btn">
            Open Full View
          </Button>
          <Button className="bg-[#FF9933] hover:bg-[#E68A2E] text-white" onClick={deploy} disabled={deploying || bandobast?.status === "deployed"} data-testid="deploy-btn">
            <Send className="w-4 h-4 mr-2" />
            {bandobast?.status === "deployed" ? "Deployed" : L.deploy}
          </Button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          className={`px-4 py-2 text-sm font-semibold rounded-md ${view === "point" ? "bg-[#2E3192] text-white" : "bg-white border border-[#E5E7EB]"}`}
          onClick={() => setView("point")}
          data-testid="view-point-wise"
        >
          {L.pointWise}
        </button>
        <button
          className={`px-4 py-2 text-sm font-semibold rounded-md ${view === "staff" ? "bg-[#2E3192] text-white" : "bg-white border border-[#E5E7EB]"}`}
          onClick={() => setView("staff")}
          data-testid="view-staff-wise"
        >
          {L.amaldarWise}
        </button>
      </div>

      {view === "point" ? (
        <div className="space-y-4">
          {points.map((p) => {
            const eqMap = (bandobast?.equipment_assignments || {})[p.id] || {};
            return (
              <div key={p.id} className="bg-white border border-[#E5E7EB] rounded-md p-4">
                {/* 1. Point name + info */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-lg">{p.point_name} {p.is_reserved && <Badge className="ml-2 bg-[#FF9933]/15 text-[#B36B22]">Reserved</Badge>}</h4>
                    <div className="text-xs text-[#6B7280]">
                      {p.sector && `Sector: ${p.sector}`}
                      {p.latitude && ` · ${p.latitude}, ${p.longitude}`}
                      {p.equipment?.length > 0 && ` · Equipment: ${p.equipment.join(", ")}`}
                    </div>
                  </div>
                  <Badge className="bg-[#138808]/15 text-[#0E6306]">{(allot[p.id] || []).length} personnel</Badge>
                </div>
                {/* 2. Staff */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {(allot[p.id] || []).map((sid) => {
                    const s = getStaff(sid);
                    if (!s) return null;
                    const eq = eqMap[sid];
                    return (
                      <div key={sid} className="text-xs bg-[#F9FAFB] border border-[#E5E7EB] rounded p-2">
                        <div className="font-semibold">{s.name}</div>
                        <div className="text-[#6B7280]">
                          {s.rank}
                          {s.staff_type !== "officer" && s.bakkal_no ? ` · ${s.bakkal_no}` : ""}
                        </div>
                        {eq && (
                          <div className="mt-1 inline-block bg-[#FF9933]/15 text-[#B36B22] px-1.5 py-0.5 rounded text-[10px] font-semibold">
                            {eq}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {(allot[p.id] || []).length === 0 && <div className="text-xs text-[#6B7280]">None allotted</div>}
                </div>
                {/* 3. Suchana (last) */}
                {p.suchana && (
                  <div className="mt-3 p-2 bg-[#FF9933]/5 border-l-2 border-[#FF9933] rounded text-xs">
                    <span className="font-bold text-[#B36B22]">Suchana: </span>{p.suchana}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-[#E5E7EB] rounded-md">
          <div className="flex items-center justify-between p-3 border-b border-[#E5E7EB]">
            <div className="text-sm text-[#6B7280]">
              Showing {(bandobast?.selected_staff_ids || []).length} amaldar with allotment details
            </div>
            <Button
              variant="outline"
              onClick={() => window.open(`${BACKEND_URL}/api/bandobasts/${bid}/export/staff-wise`, "_blank")}
              data-testid="download-staff-wise-btn"
            >
              <Download className="w-4 h-4 mr-2" /> Download Excel
            </Button>
          </div>
          <div className="overflow-auto">
            <Table>
              <TableHeader className="bg-[#F9FAFB]">
                <TableRow>
                  <TableHead>Sr.</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Rank</TableHead>
                  <TableHead>Bakkal</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Posting</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(bandobast?.selected_staff_ids || []).map((sid, idx) => {
                  const s = getStaff(sid);
                  if (!s) return null;
                  const assignedPoints = points.filter((p) => (allot[p.id] || []).includes(sid));
                  const equipList = assignedPoints
                    .map((p) => ((bandobast?.equipment_assignments || {})[p.id] || {})[sid])
                    .filter(Boolean);
                  return (
                    <TableRow key={sid}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell><Badge className="bg-[#2E3192]/10 text-[#2E3192]">{s.staff_type}</Badge></TableCell>
                      <TableCell>{s.rank}</TableCell>
                      <TableCell className="font-mono">{s.staff_type === "officer" ? "—" : (s.bakkal_no || "-")}</TableCell>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="text-xs">{s.posting || "-"}</TableCell>
                      <TableCell className="font-mono text-xs">{s.mobile || "-"}</TableCell>
                      <TableCell>{s.gender}</TableCell>
                      <TableCell>{s.district}</TableCell>
                      <TableCell>{s.category || "-"}</TableCell>
                      <TableCell>
                        {equipList.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {equipList.map((e, i) => (
                              <Badge key={i} className="bg-[#FF9933]/15 text-[#B36B22]">{e}</Badge>
                            ))}
                          </div>
                        ) : <span className="text-xs text-[#6B7280]">—</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {assignedPoints.map((p) => (
                            <Badge key={p.id} className={p.is_reserved ? "bg-[#FF9933]/15 text-[#B36B22]" : "bg-[#2E3192]/10 text-[#2E3192]"}>
                              {p.point_name}
                            </Badge>
                          ))}
                          {assignedPoints.length === 0 && <span className="text-xs text-[#6B7280]">Unallotted</span>}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
