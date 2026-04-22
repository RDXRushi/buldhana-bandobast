import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api, BACKEND_URL } from "../lib/api";
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
import { ChevronLeft, Download, Printer, QrCode, MapPin, IdCard, FileBarChart, Send, Pencil } from "lucide-react";
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
  const [qrPoint, setQrPoint] = useState(null);

  const load = async () => {
    const { data } = await api.get(`/bandobasts/${id}/goshwara`);
    setData(data);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

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
              <span><strong>{L.date}:</strong> {new Date(b.date).toLocaleDateString()}</span>
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
              className="bg-[#FF9933] hover:bg-[#E68A2E] text-white"
              onClick={deploy}
              disabled={b.status === "deployed"}
              data-testid="deploy-btn-detail"
            >
              <Send className="w-4 h-4 mr-2" /> {b.status === "deployed" ? "Deployed" : L.deploy}
            </Button>
          </div>
        </div>
      </div>

      {/* Points with goshwara */}
      <div className="space-y-4">
        {data.point_wise.map(({ point: p, staff: ps }) => (
          <div key={p.id} className="bg-white border border-[#E5E7EB] rounded-md shadow-sm">
            <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-lg">{p.point_name}</h3>
                  {p.is_reserved && <Badge className="bg-[#FF9933]/15 text-[#B36B22]">Reserved</Badge>}
                </div>
                <div className="text-xs text-[#6B7280] mt-1">
                  {p.sector && `Sector: ${p.sector} · `}
                  {p.latitude && p.longitude && `${p.latitude}, ${p.longitude}`}
                  {p.equipment?.length > 0 && ` · Equip: ${p.equipment.join(", ")}`}
                </div>
                {p.suchana && <div className="text-xs mt-2 p-2 bg-[#FF9933]/5 border-l-2 border-[#FF9933] rounded">{p.suchana}</div>}
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
            <Table>
              <TableHeader className="bg-[#F9FAFB]">
                <TableRow>
                  <TableHead className="w-12">Sr.</TableHead>
                  <TableHead>Rank</TableHead>
                  <TableHead>Bakkal</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Duty Pass</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ps.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center py-4 text-[#6B7280]">No staff allotted</TableCell></TableRow>
                )}
                {ps.map((s, i) => (
                  <TableRow key={s.id}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{s.rank}</TableCell>
                    <TableCell className="font-mono">{s.bakkal_no}</TableCell>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="font-mono text-xs">{s.mobile || "-"}</TableCell>
                    <TableCell>
                      <Link to={`/print/duty-pass/${id}/${p.id}/${s.id}`} className="text-sm text-[#2E3192] hover:underline inline-flex items-center gap-1">
                        <IdCard className="w-3 h-3" /> Pass
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))}
      </div>

      {/* QR Modal */}
      <Dialog open={!!qrPoint} onOpenChange={(o) => !o && setQrPoint(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code - {qrPoint?.point_name}</DialogTitle>
          </DialogHeader>
          {qrPoint && (
            <div className="flex flex-col items-center gap-3">
              <img
                src={`${BACKEND_URL}/api/bandobasts/${id}/points/${qrPoint.id}/qr`}
                alt="QR"
                className="w-64 h-64 border border-[#E5E7EB] rounded"
              />
              <Button variant="outline" onClick={() => window.open(`${BACKEND_URL}/api/bandobasts/${id}/points/${qrPoint.id}/qr`, "_blank")}>
                <Download className="w-4 h-4 mr-2" /> Download
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
