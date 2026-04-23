import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { L } from "../lib/i18n";
import StatCard from "../components/StatCard";
import {
  ShieldPlus,
  Users,
  ShieldCheck,
  Calendar as CalIcon,
  Trash2,
  FolderOpen,
  Pencil,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";

function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d) { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function Dashboard() {
  const [bandobasts, setBandobasts] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(new Date());
  const [renameBid, setRenameBid] = useState(null);
  const [renameName, setRenameName] = useState("");
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    const [b, s] = await Promise.all([
      api.get("/bandobasts"),
      api.get("/staff"),
    ]);
    setBandobasts(b.data);
    setStaff(s.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Move this bandobast to Deleted Bandobasts? You can restore it later.")) return;
    await api.delete(`/bandobasts/${id}`);
    toast.success("Moved to Deleted Bandobasts");
    load();
  };

  const handleRename = async () => {
    if (!renameName.trim()) return;
    await api.patch(`/bandobasts/${renameBid}`, { name: renameName });
    toast.success("Renamed");
    setRenameBid(null);
    load();
  };

  // Calendar cells
  const calCells = useMemo(() => {
    const som = startOfMonth(cursor);
    const eom = endOfMonth(cursor);
    const firstDayIdx = som.getDay();
    const days = eom.getDate();
    const cells = [];
    for (let i = 0; i < firstDayIdx; i++) cells.push(null);
    for (let d = 1; d <= days; d++) cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [cursor]);

  const eventsByDate = useMemo(() => {
    const map = {};
    for (const b of bandobasts) {
      const d = new Date(b.date);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      map[key] = map[key] || [];
      map[key].push(b);
    }
    return map;
  }, [bandobasts]);

  const monthName = cursor.toLocaleString("en-US", { month: "long", year: "numeric" });
  const officerCount = staff.filter((s) => s.staff_type === "officer").length;
  const amaldarCount = staff.filter((s) => s.staff_type === "amaldar").length;
  const hgCount = staff.filter((s) => s.staff_type === "home_guard").length;

  return (
    <div className="max-w-[1600px] mx-auto" data-testid="dashboard-page">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display font-black text-3xl sm:text-4xl tracking-tight text-[#0A0A0A]">{L.dashboard}</h1>
          <p className="mt-1 text-sm text-[#6B7280]">Overview of active deployments and personnel</p>
        </div>
        <Button
          onClick={() => navigate("/bandobast/new")}
          className="bg-[#2E3192] hover:bg-[#202266] text-white font-semibold"
          data-testid="dashboard-create-bandobast"
        >
          <Plus className="w-4 h-4 mr-2" /> {L.newBandobast}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Bandobasts" value={bandobasts.length} icon={ShieldPlus} accent="#2E3192" />
        <StatCard label="Officers" value={officerCount} icon={ShieldCheck} accent="#FF9933" sublabel="ASP, Dy.SP, PI, API, PSI" />
        <StatCard label="Amaldars" value={amaldarCount} icon={Users} accent="#138808" sublabel="ASI, HC, NPC, PC, LPC" />
        <StatCard label="Home Guards" value={hgCount} icon={Users} accent="#2563EB" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-1 bg-white border border-[#E5E7EB] rounded-md p-5 shadow-sm" data-testid="dashboard-calendar">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalIcon className="w-5 h-5 text-[#2E3192]" />
              <h3 className="font-display font-bold text-lg">{monthName}</h3>
            </div>
            <div className="flex gap-1">
              <button
                className="p-1.5 hover:bg-[#F3F4F6] rounded-md"
                onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
                data-testid="cal-prev"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                className="p-1.5 hover:bg-[#F3F4F6] rounded-md"
                onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
                data-testid="cal-next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-[10px] font-bold uppercase text-[#6B7280] mb-2">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div key={i} className="text-center py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calCells.map((d, i) => {
              if (!d) return <div key={i} className="aspect-square" />;
              const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
              const events = eventsByDate[key] || [];
              const today = sameDay(d, new Date());
              return (
                <div
                  key={i}
                  title={events.map((e) => e.name).join(", ")}
                  className={`aspect-square flex flex-col items-center justify-center rounded-md text-sm relative ${
                    today ? "bg-[#2E3192] text-white font-bold" : "hover:bg-[#F3F4F6] text-[#0A0A0A]"
                  } ${events.length > 0 && !today ? "bg-[#FF9933]/10 font-semibold" : ""}`}
                >
                  <span>{d.getDate()}</span>
                  {events.length > 0 && <span className="cal-event-dot" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bandobast Table */}
        <div className="lg:col-span-2 bg-white border border-[#E5E7EB] rounded-md shadow-sm overflow-hidden" data-testid="bandobast-table-wrap">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
            <h3 className="font-display font-bold text-lg">{L.bandobast} List</h3>
            <span className="text-xs text-[#6B7280]">{bandobasts.length} total</span>
          </div>
          <Table>
            <TableHeader className="bg-[#F9FAFB]">
              <TableRow>
                <TableHead>{L.year}</TableHead>
                <TableHead>{L.date}</TableHead>
                <TableHead>{L.bandobast} Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-[#6B7280]">Loading...</TableCell>
                </TableRow>
              ) : bandobasts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-[#6B7280]">
                    No bandobasts yet. <Link to="/bandobast/new" className="text-[#2E3192] font-semibold underline">Create one</Link>
                  </TableCell>
                </TableRow>
              ) : bandobasts.map((b) => (
                <TableRow key={b.id} data-testid={`bandobast-row-${b.id}`}>
                  <TableCell className="font-semibold">{b.year}</TableCell>
                  <TableCell>{new Date(b.date).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{b.name}</TableCell>
                  <TableCell>
                    <Badge className={b.status === "deployed" ? "bg-[#138808]/15 text-[#0E6306] hover:bg-[#138808]/20" : "bg-gray-100 text-gray-800 hover:bg-gray-200"}>
                      {b.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1">
                      <button
                        className="p-2 hover:bg-[#F3F4F6] rounded-md text-[#2E3192]"
                        onClick={() => navigate(`/bandobast/${b.id}`)}
                        title="Open"
                        data-testid={`bandobast-open-${b.id}`}
                      >
                        <FolderOpen className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 hover:bg-[#F3F4F6] rounded-md text-[#FF9933]"
                        onClick={() => { setRenameBid(b.id); setRenameName(b.name); }}
                        title="Rename"
                        data-testid={`bandobast-rename-${b.id}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 hover:bg-[#FEE2E2] rounded-md text-[#DC2626]"
                        onClick={() => handleDelete(b.id)}
                        title="Delete"
                        data-testid={`bandobast-delete-${b.id}`}
                      >
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

      <Dialog open={!!renameBid} onOpenChange={(o) => !o && setRenameBid(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rename Bandobast</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={renameName} onChange={(e) => setRenameName(e.target.value)} data-testid="rename-input" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameBid(null)}>Cancel</Button>
            <Button className="bg-[#2E3192] hover:bg-[#202266]" onClick={handleRename} data-testid="rename-save">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
