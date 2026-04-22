import React, { useEffect, useRef, useState } from "react";
import { api, BACKEND_URL, RANKS_BY_TYPE, STAFF_TYPE_LABELS } from "../lib/api";
import { L } from "../lib/i18n";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Plus, Upload, Download, Search, Pencil, Trash2, Camera, IdCard, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const TYPES = ["officer", "amaldar", "home_guard"];

export default function StaffManagement() {
  const [activeType, setActiveType] = useState("officer");
  const [staff, setStaff] = useState([]);
  const [search, setSearch] = useState("");
  const [rankFilter, setRankFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const fileRef = useRef(null);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    const params = { staff_type: activeType };
    if (rankFilter) params.rank = rankFilter;
    if (search) params.search = search;
    const { data } = await api.get("/staff", { params });
    setStaff(data);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [activeType, rankFilter]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this staff member?")) return;
    await api.delete(`/staff/${id}`);
    toast.success("Deleted");
    load();
  };

  const downloadTemplate = () => {
    window.open(`${BACKEND_URL}/api/staff-template/${activeType}`, "_blank");
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const { data } = await api.post(`/staff/import/${activeType}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(`Imported ${data.inserted}, skipped ${data.skipped}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Import failed");
    }
    e.target.value = "";
  };

  return (
    <div className="max-w-[1600px] mx-auto" data-testid="staff-page">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display font-black text-3xl sm:text-4xl tracking-tight">{L.staff}</h1>
          <p className="mt-1 text-sm text-[#6B7280]">Manage Officers, Amaldars and Home Guards</p>
        </div>
      </div>

      <Tabs value={activeType} onValueChange={(v) => { setActiveType(v); setRankFilter(""); }}>
        <TabsList className="bg-white border border-[#E5E7EB] p-1 h-auto rounded-md">
          {TYPES.map((t) => (
            <TabsTrigger
              key={t}
              value={t}
              className="data-[state=active]:bg-[#2E3192] data-[state=active]:text-white px-4 py-2 text-sm font-semibold rounded"
              data-testid={`tab-${t}`}
            >
              {STAFF_TYPE_LABELS[t].en} / {STAFF_TYPE_LABELS[t].mr}
            </TabsTrigger>
          ))}
        </TabsList>

        {TYPES.map((t) => (
          <TabsContent key={t} value={t} className="mt-5">
            <div className="bg-white border border-[#E5E7EB] rounded-md shadow-sm">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-3 p-4 border-b border-[#E5E7EB]">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                  <Input
                    placeholder={`${L.search} by name or Bakkal No`}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && load()}
                    className="pl-9"
                    data-testid="staff-search"
                  />
                </div>
                <Select value={rankFilter || "all"} onValueChange={(v) => setRankFilter(v === "all" ? "" : v)}>
                  <SelectTrigger className="w-[180px]" data-testid="rank-filter">
                    <SelectValue placeholder={L.allRanks} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{L.allRanks}</SelectItem>
                    {RANKS_BY_TYPE[activeType].map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={downloadTemplate} data-testid="download-template-btn">
                  <Download className="w-4 h-4 mr-2" /> Template
                </Button>
                <Button variant="outline" onClick={() => fileRef.current?.click()} data-testid="import-excel-btn">
                  <Upload className="w-4 h-4 mr-2" /> {L.importExcel}
                </Button>
                <input type="file" ref={fileRef} accept=".xlsx" className="hidden" onChange={handleImport} />
                <Button className="bg-[#2E3192] hover:bg-[#202266]" onClick={() => setAddOpen(true)} data-testid="add-staff-btn">
                  <Plus className="w-4 h-4 mr-2" /> {L.addStaff}
                </Button>
              </div>

              {/* Table */}
              <Table>
                <TableHeader className="bg-[#F9FAFB]">
                  <TableRow>
                    <TableHead className="w-12">Sr.</TableHead>
                    <TableHead>Photo</TableHead>
                    <TableHead>{L.rank}</TableHead>
                    <TableHead>{L.bakkalNo}</TableHead>
                    <TableHead>{L.name}</TableHead>
                    <TableHead>{L.posting}</TableHead>
                    <TableHead>{L.mobile}</TableHead>
                    <TableHead>{L.gender}</TableHead>
                    <TableHead>{L.district}</TableHead>
                    <TableHead>{L.category}</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && (
                    <TableRow><TableCell colSpan={11} className="text-center py-8 text-[#6B7280]">Loading...</TableCell></TableRow>
                  )}
                  {!loading && staff.length === 0 && (
                    <TableRow><TableCell colSpan={11} className="text-center py-8 text-[#6B7280]">No staff yet. Click "Add Staff" to begin.</TableCell></TableRow>
                  )}
                  {staff.map((s, idx) => (
                    <TableRow key={s.id} data-testid={`staff-row-${s.id}`}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>
                        {s.photo ? (
                          <img src={s.photo} alt={s.name} className="w-10 h-10 rounded-full object-cover border border-[#E5E7EB]" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#F3F4F6] flex items-center justify-center text-xs font-bold text-[#6B7280]">
                            {s.name?.[0]?.toUpperCase() || "?"}
                          </div>
                        )}
                      </TableCell>
                      <TableCell><Badge className="bg-[#2E3192]/10 text-[#2E3192] hover:bg-[#2E3192]/20">{s.rank}</Badge></TableCell>
                      <TableCell className="font-mono font-semibold">{s.bakkal_no}</TableCell>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.posting || "-"}</TableCell>
                      <TableCell className="font-mono text-xs">{s.mobile || "-"}</TableCell>
                      <TableCell>{s.gender}</TableCell>
                      <TableCell>{s.district}</TableCell>
                      <TableCell>{s.category || "-"}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-2 hover:bg-[#F3F4F6] rounded-md" data-testid={`staff-actions-${s.id}`}>
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditing(s)}>
                              <Pencil className="w-4 h-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/print/id-card/${s.id}`)}>
                              <IdCard className="w-4 h-4 mr-2" /> Print ID Card
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(s.id)} className="text-[#DC2626]">
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {(addOpen || editing) && (
        <StaffModal
          open={addOpen || !!editing}
          onClose={() => { setAddOpen(false); setEditing(null); }}
          staffType={activeType}
          editing={editing}
          onSaved={() => { setAddOpen(false); setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

function StaffModal({ open, onClose, staffType, editing, onSaved }) {
  const [form, setForm] = useState(
    editing || {
      staff_type: staffType,
      rank: RANKS_BY_TYPE[staffType][0],
      bakkal_no: "",
      name: "",
      posting: "",
      mobile: "",
      photo: "",
      gender: "Male",
      district: "Buldhana",
      category: "",
    }
  );
  const [saving, setSaving] = useState(false);
  const photoRef = useRef(null);

  const handleBakkalBlur = async () => {
    if (editing) return;
    if (!form.bakkal_no) return;
    try {
      const { data } = await api.get(`/staff/by-bakkal/${form.bakkal_no}`, { params: { staff_type: staffType } });
      if (data) {
        toast.info("Staff found — auto-filling");
        setForm({ ...form, ...data, staff_type: staffType });
      }
    } catch {
      // not found - ignore
    }
  };

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm({ ...form, photo: reader.result });
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!form.bakkal_no || !form.name || !form.rank) {
      toast.error("Rank, Bakkal No and Name are required");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/staff/${editing.id}`, form);
        toast.success("Updated");
      } else {
        await api.post("/staff", { ...form, staff_type: staffType });
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
      <DialogContent className="max-w-2xl" data-testid="staff-modal">
        <DialogHeader>
          <DialogTitle className="font-display">
            {editing ? "Edit" : L.addStaff} - {STAFF_TYPE_LABELS[staffType].en}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 flex items-center gap-4">
            {form.photo ? (
              <img src={form.photo} alt="" className="w-20 h-20 rounded-md object-cover border border-[#E5E7EB]" />
            ) : (
              <div className="w-20 h-20 rounded-md bg-[#F3F4F6] flex items-center justify-center text-[#6B7280]">
                <Camera className="w-6 h-6" />
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => photoRef.current?.click()} data-testid="upload-photo-btn">
                <Upload className="w-4 h-4 mr-2" /> Upload Photo
              </Button>
              <input type="file" accept="image/*" className="hidden" ref={photoRef} onChange={handlePhoto} />
              <Button variant="outline" size="sm" onClick={() => photoRef.current?.click()}>
                <Camera className="w-4 h-4 mr-2" /> Camera
              </Button>
            </div>
          </div>

          <div>
            <Label>{L.rank}*</Label>
            <Select value={form.rank} onValueChange={(v) => setForm({ ...form, rank: v })}>
              <SelectTrigger data-testid="form-rank"><SelectValue /></SelectTrigger>
              <SelectContent>
                {RANKS_BY_TYPE[staffType].map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{L.bakkalNo}*</Label>
            <Input value={form.bakkal_no} onChange={(e) => setForm({ ...form, bakkal_no: e.target.value })} onBlur={handleBakkalBlur} data-testid="form-bakkal" />
          </div>

          <div className="md:col-span-2">
            <Label>{L.name}*</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="form-name" />
          </div>

          <div>
            <Label>{L.posting}</Label>
            <Input value={form.posting} onChange={(e) => setForm({ ...form, posting: e.target.value })} />
          </div>

          <div>
            <Label>{L.mobile}</Label>
            <Input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
          </div>

          <div>
            <Label>{L.gender}</Label>
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
            <Label>{L.district}</Label>
            <Input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
          </div>

          <div>
            <Label>{L.category}</Label>
            <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Open / SC / ST / OBC" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{L.cancel}</Button>
          <Button className="bg-[#2E3192] hover:bg-[#202266]" onClick={save} disabled={saving} data-testid="form-save">
            {saving ? "Saving..." : L.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
