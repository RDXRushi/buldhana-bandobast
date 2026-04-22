import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, BACKEND_URL } from "../lib/api";
import { Shield, Printer } from "lucide-react";

export default function PrintBulkDutyPasses() {
  const { bid } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(`/bandobasts/${bid}/goshwara`).then((r) => setData(r.data));
  }, [bid]);

  if (!data) return <div className="p-8">Loading...</div>;
  const b = data.bandobast;

  // Flatten: one pass per (point, staff)
  const passes = [];
  for (const pw of data.point_wise) {
    for (const s of pw.staff) {
      passes.push({ point: pw.point, staff: s });
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F5F7] p-6">
      <div className="no-print mb-4 flex items-center justify-between max-w-[900px] mx-auto">
        <div>
          <h1 className="font-display font-bold text-xl">Bulk Duty Passes — {b.name}</h1>
          <p className="text-sm text-[#6B7280]">{passes.length} duty passes · Use browser Print → "Save as PDF"</p>
        </div>
        <button onClick={() => window.print()} className="bg-[#2E3192] text-white px-4 py-2 rounded-md font-semibold">
          <Printer className="w-4 h-4 inline mr-2" /> Print / Save as PDF
        </button>
      </div>

      <div className="max-w-[900px] mx-auto space-y-4">
        {passes.map(({ point, staff: s }, idx) => (
          <div
            key={`${point.id}-${s.id}-${idx}`}
            className="bg-white border-2 border-[#2E3192] rounded-lg overflow-hidden shadow print:shadow-none break-inside-avoid print-page"
            data-testid={`bulk-pass-${idx}`}
          >
            <div className="bg-[#2E3192] text-white px-5 py-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-[#FF9933] flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-display font-black text-base leading-none">DUTY PASS</div>
                <div className="text-[10px] uppercase tracking-wider text-white/80">Buldhana District Police</div>
              </div>
              <div className="text-right text-xs">
                <div className="text-white/70">Valid</div>
                <div className="font-bold">{new Date(b.date).toLocaleDateString()}</div>
              </div>
            </div>

            <div className="p-4">
              <div className="text-[10px] uppercase tracking-wider text-[#6B7280] mb-1">Bandobast</div>
              <div className="font-display font-bold text-base">{b.name}</div>
              <div className="text-[10px] text-[#6B7280]">{b.spot} · {b.ps_name}</div>

              <div className="mt-3 grid grid-cols-[1fr_auto] gap-3 items-start">
                <div className="border border-[#E5E7EB] rounded-md p-2.5 text-xs">
                  <div className="text-[10px] uppercase tracking-wider text-[#6B7280]">Personnel</div>
                  <div className="font-bold text-sm">{s.name}</div>
                  <div className="text-[10px] mt-0.5">{s.rank} · Bakkal {s.bakkal_no}</div>
                  <div className="text-[10px] text-[#6B7280]">{s.posting}</div>
                  <div className="mt-2 pt-2 border-t border-[#E5E7EB]">
                    <div className="text-[10px] uppercase tracking-wider text-[#6B7280]">Duty Point</div>
                    <div className="font-semibold text-sm">{point.point_name}</div>
                    {point.sector && <div className="text-[10px]">Sector: {point.sector}</div>}
                  </div>
                </div>
                <img
                  src={`${BACKEND_URL}/api/bandobasts/${bid}/points/${point.id}/qr`}
                  alt="QR"
                  className="w-24 h-24 border border-[#E5E7EB] rounded"
                />
              </div>

              {point.suchana && (
                <div className="mt-3 text-[10px] p-2 bg-[#FF9933]/5 border-l-2 border-[#FF9933] rounded">
                  <span className="font-bold text-[#B36B22]">Suchana: </span>{point.suchana}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @media print {
          body { background: white !important; }
          .print-page { page-break-after: always; }
        }
      `}</style>
    </div>
  );
}
