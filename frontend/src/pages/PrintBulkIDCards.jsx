import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import { Shield, Printer } from "lucide-react";

export default function PrintBulkIDCards() {
  const { bid } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(`/bandobasts/${bid}/goshwara`).then((r) => setData(r.data));
  }, [bid]);

  if (!data) return <div className="p-8">Loading...</div>;

  const b = data.bandobast;
  // Unique staff across all points
  const seen = new Set();
  const allStaff = [];
  for (const pw of data.point_wise) {
    for (const s of pw.staff) {
      if (!seen.has(s.id)) {
        seen.add(s.id);
        allStaff.push(s);
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F5F7] p-6">
      <div className="no-print mb-4 flex items-center justify-between max-w-[1100px] mx-auto">
        <div>
          <h1 className="font-display font-bold text-xl">Bulk ID Cards — {b.name}</h1>
          <p className="text-sm text-[#6B7280]">{allStaff.length} personnel · Use browser Print → "Save as PDF"</p>
        </div>
        <button onClick={() => window.print()} className="bg-[#2E3192] text-white px-4 py-2 rounded-md font-semibold">
          <Printer className="w-4 h-4 inline mr-2" /> Print / Save as PDF
        </button>
      </div>

      <div className="max-w-[1100px] mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 bulk-id-grid">
        {allStaff.map((s) => (
          <div
            key={s.id}
            className="bg-white border-2 border-[#2E3192] rounded-lg overflow-hidden shadow print:shadow-none break-inside-avoid"
            data-testid={`bulk-id-${s.id}`}
          >
            <div className="bg-[#2E3192] text-white px-3 py-2 flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-[#FF9933] flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-display font-black text-xs leading-none">BULDHANA POLICE</div>
                <div className="text-[9px] uppercase tracking-wider text-white/80">District Police HQ</div>
              </div>
            </div>
            <div className="p-3">
              <div className="flex items-start gap-3">
                {s.photo ? (
                  <img src={s.photo} alt="" className="w-20 h-24 object-cover border-2 border-[#2E3192] rounded" />
                ) : (
                  <div className="w-20 h-24 bg-[#F3F4F6] border-2 border-[#2E3192] rounded flex items-center justify-center text-2xl font-bold text-[#9CA3AF]">
                    {s.name?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1 text-xs">
                  <div className="text-[10px] text-[#6B7280] uppercase tracking-wider">Rank</div>
                  <div className="font-bold">{s.rank}</div>
                  <div className="mt-1 text-[10px] text-[#6B7280] uppercase tracking-wider">Bakkal No</div>
                  <div className="font-mono font-bold">{s.bakkal_no}</div>
                  <div className="mt-2 font-display font-bold text-[#0A0A0A]">{s.name}</div>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-[#E5E7EB] grid grid-cols-2 gap-1 text-[10px]">
                <div><span className="text-[#6B7280]">Posting:</span> <span className="font-semibold">{s.posting || "-"}</span></div>
                <div><span className="text-[#6B7280]">Mobile:</span> <span className="font-mono">{s.mobile || "-"}</span></div>
                <div><span className="text-[#6B7280]">Gender:</span> {s.gender}</div>
                <div><span className="text-[#6B7280]">District:</span> {s.district}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @media print {
          body { background: white !important; }
          .bulk-id-grid { gap: 8px !important; }
        }
      `}</style>
    </div>
  );
}
