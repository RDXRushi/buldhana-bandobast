import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api, BACKEND_URL, downloadStaffWiseExcel } from "../lib/api";
import PointQR, { downloadPointQR } from "../components/PointQR";
import { L } from "../lib/i18n";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { ChevronLeft, Download, Printer, QrCode, MapPin, IdCard, FileBarChart, Send, Pencil, Files, Bell } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { toast } from "sonner";

export default function BandobastDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [qrPoint, setQrPoint] = useState(null);
  const [alertStatus, setAlertStatus] = useState(null);
  const [alerting, setAlerting] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get(`/bandobasts/${id}/goshwara`);
      setData(data);
      try {
        const r = await api.get(`/bandobasts/${id}/alert-status`);
        setAlertStatus(r.data);
      } catch (_) { /* not fatal */ }
    } catch {
      setError(true);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const sendAlert = async () => {
    if (!window.confirm("Send Bandobast Alert to all allotted staff with a valid mobile number?")) return;
    setAlerting(true);
    try {
      const { data: r } = await api.post(`/bandobasts/${id}/alert`);
      const msg = `Alerts queued: ${r.sent}` + (r.skipped_no_mobile ? ` · ${r.skipped_no_mobile} skipped (no mobile)` : "");
      toast.success(msg);
      const r2 = await api.get(`/bandobasts/${id}/alert-status`);
      setAlertStatus(r2.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Alert failed");
    } finally {
      setAlerting(false);
    }
  };

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-12 bg-white border border-[#E5E7EB] rounded-md shadow p-6 text-center">
        <div className="text-3xl font-display font-black text-[#FF9933]">404</div>
        <h2 className="mt-2 font-display font-bold text-lg">Bandobast not found</h2>
        <button onClick={() => navigate("/")} className="mt-4 bg-[#2E3192] hover:bg-[#202266] text-white font-semibold rounded-md px-4 py-2">Back to Dashboard</button>
      </div>
    );
  }
  if (!data) return <div className="p-8 text-[#6B7280]">Loading...</div>;
  const b = data.bandobast;

  const deploy = async () => {
    await api.post(`/bandobasts/${id}/deploy`);
    toast.success("Deployed!");
    load();
  };

  const printReport = () => {
    window.open(`/print/goshwara/${id}`, "_blank");
  };

  return (
    <div className="max-w-[1600px] mx-auto" data-testid="detail-page">
      <button onClick={() => navigate("/")} className="text-sm text-[#6B7280] hover:text-[#2E3192] flex items-center gap-1 mb-2">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>

      <div className="bg-white border border-[#E5E7EB] rounded-md p-6 shadow-sm mb-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-black text-3xl tracking-tight">{b.name}</h1>
              <Badge className={b.status === "deployed" ? "bg-[#138808]/15 text-[#0E6306]" : "bg-gray-100 text-gray-800"}>
                {b.status}
              </Badge>
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-[#6B7280]">
              <span><strong>{L.year}:</strong> {b.year}</span>
              <span><strong>{L.date}:</strong> {new Date(b.date).toLocaleDateString()}{b.reporting_time ? ` · ${b.reporting_time}` : ""}</span>
              <span><strong>{L.spot}:</strong> {b.spot || "-"}</span>
              <span><strong>{L.psName}:</strong> {b.ps_name || "-"}</span>
              <span><strong>{L.inCharge}:</strong> {b.in_charge || "-"}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate(`/bandobast/edit/${id}`)}>
              <Pencil className="w-4 h-4 mr-2" /> Edit
            </Button>
            <Button variant="outline" onClick={printReport} data-testid="print-goshwara-btn">
              <Printer className="w-4 h-4 mr-2" /> Print Goshwara
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open(`/print/bulk/id-cards/${id}`, "_blank")}
              data-testid="bulk-id-cards-btn"
            >
              <Files className="w-4 h-4 mr-2" /> All ID Cards
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open(`/print/bulk/duty-passes/${id}`, "_blank")}
              data-testid="bulk-duty-passes-btn"
            >
              <Files className="w-4 h-4 mr-2" /> All Duty Passes
            </Button>
            <Button
              variant="outline"
              onClick={() => downloadStaffWiseExcel(id)}
              data-testid="export-staff-wise-btn"
            >
              <Download className="w-4 h-4 mr-2" /> Excel Roster
            </Button>
            <Button
              className="bg-[#FF9933] hover:bg-[#E68A2E] text-white"
              onClick={deploy}
              data-testid="deploy-btn-detail"
            >
              <Send className="w-4 h-4 mr-2" /> {b.status === "deployed" ? "Re-deploy" : L.deploy}
            </Button>
          </div>
        </div>
      </div>

      {/* Bandobast Alert section */}
      <div className="bg-white border border-[#E5E7EB] rounded-md p-5 shadow-sm mb-6" data-testid="bandobast-alert-section">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-start gap-3">
            <div className="bg-[#FF9933]/15 text-[#FF9933] p-2 rounded">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg">Bandobast Alert / बंदोबस्त सूचना</h2>
              <p className="text-sm text-[#6B7280] mt-1 max-w-xl">
                Push this bandobast to every allotted staff member's phone (via the Buldhana
                Bandobast Staff app). They receive their point details, duty pass, ID card,
                co-staff list and a Google Maps link for their point.
              </p>
              {alertStatus && (
                <div className="mt-2 text-xs text-[#6B7280]">
                  {alertStatus.last_alerted_at ? (
                    <>Last sent: <strong>{new Date(alertStatus.last_alerted_at).toLocaleString()}</strong> · {alertStatus.seen}/{alertStatus.total} seen</>
                  ) : (
                    <>Not sent yet</>
                  )}
                </div>
              )}
            </div>
          </div>
          <Button
            className="bg-[#FF9933] hover:bg-[#E68A2E] text-white"
            onClick={sendAlert}
            disabled={alerting || b.status !== "deployed"}
            data-testid="send-alert-btn"
          >
            <Bell className="w-4 h-4 mr-2" />
            {alerting ? "Sending…" : alertStatus?.last_alerted_at ? "Re-send Alert" : "Send Alert"}
          </Button>
        </div>
        {b.status !== "deployed" && (
          <div className="mt-3 text-xs bg-yellow-50 border border-yellow-200 text-yellow-800 rounded px-3 py-2">
            Deploy this bandobast first to enable alerts.
          </div>
        )}
      </div>

      {/* Points with goshwara */}
      <div className="space-y-4">
        {data.point_wise.map(({ point: p, staff: ps }) => {
          const eqMap = (b.equipment_assignments || {})[p.id] || {};
          return (
            <div key={p.id} className="bg-white border border-[#E5E7EB] rounded-md shadow-sm">
              {/* 1. Point name + info */}
              <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-lg">{p.point_name}</h3>
                    {p.is_reserved && <Badge className="bg-[#FF9933]/15 text-[#B36B22]">Reserved</Badge>}
                  </div>
                  <div className="text-xs text-[#6B7280] mt-1">
                    {p.sector && `Sector: ${p.sector} · `}
                    {p.latitude && p.longitude && `${p.latitude}, ${p.longitude}`}
                    {p.equipment?.length > 0 && ` · Equipment: ${p.equipment.join(", ")}`}
                  </div>
                </div>
                <div className="flex gap-2">
                  {p.latitude && p.longitude && (
                    <a
                      href={`https://www.google.com/maps?q=${p.latitude},${p.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-[#2E3192] hover:underline"
                      data-testid={`map-${p.id}`}
                    >
                      <MapPin className="w-4 h-4" /> Map
                    </a>
                  )}
                  <button onClick={() => setQrPoint(p)} className="inline-flex items-center gap-1 text-sm text-[#2E3192] hover:underline" data-testid={`qr-${p.id}`}>
                    <QrCode className="w-4 h-4" /> QR
                  </button>
                </div>
              </div>
              {/* 2. Staff */}
              <Table>
                <TableHeader className="bg-[#F9FAFB]">
                  <TableRow>
                    <TableHead className="w-12">Sr.</TableHead>
                    <TableHead>Rank</TableHead>
                    <TableHead>Bakkal</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Duty Pass / ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ps.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center py-4 text-[#6B7280]">No staff allotted</TableCell></TableRow>
                  )}
                  {ps.map((s, i) => (
                    <TableRow key={s.id}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>{s.rank}</TableCell>
                      <TableCell className="font-mono">{s.staff_type === "officer" ? "—" : (s.bakkal_no || "-")}</TableCell>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="font-mono text-xs">{s.mobile || "-"}</TableCell>
                      <TableCell>
                        {eqMap[s.id] ? (
                          <Badge className="bg-[#FF9933]/15 text-[#B36B22]">{eqMap[s.id]}</Badge>
                        ) : <span className="text-xs text-[#6B7280]">—</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link to={`/print/duty-pass/${id}/${p.id}/${s.id}`} className="text-xs text-[#2E3192] hover:underline inline-flex items-center gap-1" data-testid={`pass-${s.id}`}>
                            <IdCard className="w-3 h-3" /> Pass
                          </Link>
                          <Link to={`/print/id-card/${s.id}?bid=${id}`} className="text-xs text-[#FF9933] hover:underline inline-flex items-center gap-1" data-testid={`idcard-${s.id}`}>
                            <IdCard className="w-3 h-3" /> ID
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {/* 3. Suchana last */}
              {p.suchana && (
                <div className="px-5 py-3 border-t border-[#E5E7EB] bg-[#FF9933]/5 text-xs">
                  <span className="font-bold text-[#B36B22] uppercase tracking-wider">Suchana / सूचना: </span>
                  <span className="text-[#0A0A0A]">{p.suchana}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* QR Modal */}
      <Dialog open={!!qrPoint} onOpenChange={(o) => !o && setQrPoint(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code - {qrPoint?.point_name}</DialogTitle>
          </DialogHeader>
          {qrPoint && (
            <div className="flex flex-col items-center gap-3">
              <PointQR
                bid={id}
                pid={qrPoint.id}
                alt="QR"
                className="w-64 h-64 border border-[#E5E7EB] rounded"
              />
              <Button variant="outline" onClick={() => downloadPointQR(id, qrPoint.id, `${qrPoint.point_name}.png`)}>
                <Download className="w-4 h-4 mr-2" /> Download
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
