import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, EQUIPMENT_OPTIONS, RANKS_BY_TYPE, STAFF_TYPE_LABELS } from "../lib/api";
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
import { Plus, Trash2, ChevronLeft, ChevronRight, MapPin, Save, Send, Users, Shield } from "lucide-react";
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
  });
  const [staff, setStaff] = useState([]);

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
          </div>
        )}

        {step === 1 && <PointsStep bandobast={bandobast} bid={bid} onRefresh={refresh} />}
        {step === 2 && <SelectStaffStep bandobast={bandobast} bid={bid} staff={staff} onRefresh={refresh} />}
        {step === 3 && <AllotmentStep bandobast={bandobast} bid={bid} staff={staff} onRefresh={refresh} />}
        {step === 4 && <DeployStep bandobast={bandobast} bid={bid} staff={staff} onRefresh={refresh} navigate={navigate} />}

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
            <Button className="bg-[#2E3192] hover:bg-[#202266]" onClick={() => setStep(step + 1)} disabled={!bid} data-testid="wizard-next">
              {L.next} <ChevronRight className="w-4 h-4 ml-1" />
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

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display font-bold text-xl">Security Points</h3>
          <p className="text-sm text-[#6B7280]">Define all security locations</p>
        </div>
        <Button className="bg-[#2E3192] hover:bg-[#202266]" onClick={() => setShowForm((s) => !s)} data-testid="add-point-btn">
          <Plus className="w-4 h-4 mr-2" /> Add Point
        </Button>
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

function SelectStaffStep({ bandobast, bid, staff, onRefresh }) {
  const [selected, setSelected] = useState(new Set(bandobast?.selected_staff_ids || []));
  const [typeFilter, setTypeFilter] = useState("all");
  const [rankFilter, setRankFilter] = useState("all");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelected(new Set(bandobast?.selected_staff_ids || []));
  }, [bandobast]);

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

  const selectedByType = (type) => [...selected].filter((id) => staff.find((s) => s.id === id)?.staff_type === type).length;

  const filtered = staff.filter((s) => {
    if (typeFilter !== "all" && s.staff_type !== typeFilter) return false;
    if (rankFilter !== "all" && s.rank !== rankFilter) return false;
    return true;
  });

  const toggle = (id) => {
    const n = new Set(selected);
    if (n.has(id)) n.delete(id); else n.add(id);
    setSelected(n);
  };

  const save = async () => {
    setSaving(true);
    await api.put(`/bandobasts/${bid}/selected-staff`, { staff_ids: [...selected] });
    toast.success("Selection saved");
    onRefresh();
    setSaving(false);
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
        <div className="ml-auto">
          <Button className="bg-[#138808] hover:bg-[#0E6306] text-white" onClick={save} disabled={saving} data-testid="save-selection-btn">
            <Save className="w-4 h-4 mr-2" /> Save Selection
          </Button>
        </div>
      </div>

      <div className="max-h-[500px] overflow-auto border border-[#E5E7EB] rounded-md">
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
            {filtered.map((s) => (
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
    </div>
  );
}

function AllotmentStep({ bandobast, bid, staff, onRefresh }) {
  const [allot, setAllot] = useState(bandobast?.allotments || {});
  const [activePoint, setActivePoint] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAllot(bandobast?.allotments || {});
    const firstPoint = (bandobast?.points || []).find((p) => !p.is_reserved);
    if (firstPoint) setActivePoint(firstPoint.id);
  }, [bandobast]);

  const selectedIds = bandobast?.selected_staff_ids || [];
  const allottedSet = new Set(Object.values(allot).flat());
  const points = (bandobast?.points || []).filter((p) => !p.is_reserved);

  const available = staff.filter((s) => selectedIds.includes(s.id) && !allottedSet.has(s.id));
  const current = activePoint ? (allot[activePoint] || []) : [];
  const currentPt = points.find((p) => p.id === activePoint);

  const addToPoint = (sid) => {
    if (!activePoint) return;
    setAllot({ ...allot, [activePoint]: [...(allot[activePoint] || []), sid] });
  };
  const removeFromPoint = (sid) => {
    setAllot({ ...allot, [activePoint]: (allot[activePoint] || []).filter((x) => x !== sid) });
  };

  const save = async () => {
    setSaving(true);
    await api.put(`/bandobasts/${bid}/allotments`, { allotments: allot });
    toast.success("Allotment saved. Unallocated staff moved to Reserved.");
    onRefresh();
    setSaving(false);
  };

  const getStaff = (id) => staff.find((s) => s.id === id);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display font-bold text-xl">Allot Staff to Points</h3>
          <p className="text-sm text-[#6B7280]">Unallocated staff will auto-reserve.</p>
        </div>
        <Button className="bg-[#138808] hover:bg-[#0E6306] text-white" onClick={save} disabled={saving} data-testid="save-allotment-btn">
          <Save className="w-4 h-4 mr-2" /> Save Allotment
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Points list */}
        <div className="bg-white border border-[#E5E7EB] rounded-md p-4">
          <h4 className="font-bold text-sm uppercase tracking-wider text-[#6B7280] mb-3">Points</h4>
          <div className="space-y-1">
            {points.map((p) => {
              const total = (p.req_officer || 0) + (p.req_amaldar || 0) + (p.req_female_amaldar || 0) + (p.req_home_guard || 0);
              const done = (allot[p.id] || []).length;
              return (
                <button
                  key={p.id}
                  onClick={() => setActivePoint(p.id)}
                  data-testid={`point-tab-${p.id}`}
                  className={`w-full text-left px-3 py-2 rounded-md border transition ${
                    activePoint === p.id ? "bg-[#2E3192] text-white border-[#2E3192]" : "border-[#E5E7EB] hover:bg-[#F9FAFB]"
                  }`}
                >
                  <div className="font-semibold text-sm">{p.point_name}</div>
                  <div className={`text-xs ${activePoint === p.id ? "text-white/80" : "text-[#6B7280]"}`}>
                    {done} / {total} allotted
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Available */}
        <div className="bg-white border border-[#E5E7EB] rounded-md p-4">
          <h4 className="font-bold text-sm uppercase tracking-wider text-[#6B7280] mb-3">
            Available ({available.length})
          </h4>
          <div className="max-h-[500px] overflow-auto space-y-1">
            {available.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-2 border border-[#E5E7EB] rounded hover:bg-[#F9FAFB]">
                <div>
                  <div className="text-sm font-semibold">{s.name}</div>
                  <div className="text-xs text-[#6B7280]">{s.rank} · {s.bakkal_no}</div>
                </div>
                <button
                  className="text-[#2E3192] hover:bg-[#2E3192]/10 rounded p-1"
                  onClick={() => addToPoint(s.id)}
                  disabled={!activePoint}
                  data-testid={`allot-add-${s.id}`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ))}
            {available.length === 0 && <div className="text-sm text-[#6B7280] text-center py-6">All selected staff allotted.</div>}
          </div>
        </div>

        {/* Current point allottees */}
        <div className="bg-white border border-[#E5E7EB] rounded-md p-4">
          <h4 className="font-bold text-sm uppercase tracking-wider text-[#6B7280] mb-3">
            {currentPt ? currentPt.point_name : "Select a point"} ({current.length})
          </h4>
          <div className="max-h-[500px] overflow-auto space-y-1">
            {current.map((sid) => {
              const s = getStaff(sid);
              if (!s) return null;
              return (
                <div key={sid} className="flex items-center justify-between p-2 border border-[#E5E7EB] rounded bg-[#F9FAFB]">
                  <div>
                    <div className="text-sm font-semibold">{s.name}</div>
                    <div className="text-xs text-[#6B7280]">{s.rank} · {s.bakkal_no}</div>
                  </div>
                  <button className="text-[#DC2626] hover:bg-[#FEE2E2] rounded p-1" onClick={() => removeFromPoint(sid)} data-testid={`allot-remove-${sid}`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
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
    setDeploying(true);
    await api.post(`/bandobasts/${bid}/deploy`);
    toast.success("Bandobast Deployed!");
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
          {points.map((p) => (
            <div key={p.id} className="bg-white border border-[#E5E7EB] rounded-md p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-bold text-lg">{p.point_name} {p.is_reserved && <Badge className="ml-2 bg-[#FF9933]/15 text-[#B36B22]">Reserved</Badge>}</h4>
                  <div className="text-xs text-[#6B7280]">{p.sector} {p.latitude && `· ${p.latitude}, ${p.longitude}`}</div>
                </div>
                <Badge className="bg-[#138808]/15 text-[#0E6306]">{(allot[p.id] || []).length} personnel</Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {(allot[p.id] || []).map((sid) => {
                  const s = getStaff(sid);
                  if (!s) return null;
                  return (
                    <div key={sid} className="text-xs bg-[#F9FAFB] border border-[#E5E7EB] rounded p-2">
                      <div className="font-semibold">{s.name}</div>
                      <div className="text-[#6B7280]">{s.rank} · {s.bakkal_no}</div>
                    </div>
                  );
                })}
                {(allot[p.id] || []).length === 0 && <div className="text-xs text-[#6B7280]">None allotted</div>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-[#E5E7EB] rounded-md">
          <Table>
            <TableHeader className="bg-[#F9FAFB]">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Rank</TableHead>
                <TableHead>Bakkal</TableHead>
                <TableHead>Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(bandobast?.selected_staff_ids || []).map((sid) => {
                const s = getStaff(sid);
                if (!s) return null;
                const assignedPoints = points.filter((p) => (allot[p.id] || []).includes(sid));
                return (
                  <TableRow key={sid}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.rank}</TableCell>
                    <TableCell className="font-mono">{s.bakkal_no}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {assignedPoints.map((p) => (
                          <Badge key={p.id} className="bg-[#2E3192]/10 text-[#2E3192]">{p.point_name}</Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
