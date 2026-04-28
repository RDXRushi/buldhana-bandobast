import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import { Printer, Download } from "lucide-react";
import BrandLogo from "../components/BrandLogo";

export default function PrintGoshwara() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    api.get(`/bandobasts/${id}/goshwara`).then((r) => setData(r.data)).catch(() => setError(true));
  }, [id]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-white">
        <div className="max-w-md w-full bg-white border border-[#E5E7EB] rounded-md shadow p-6 text-center">
          <div className="text-4xl font-display font-black text-[#FF9933]">404</div>
          <h2 className="mt-2 font-display font-bold text-lg">Bandobast not found</h2>
          <button onClick={() => window.close()} className="mt-4 bg-[#2E3192] hover:bg-[#202266] text-white font-semibold rounded-md px-4 py-2">Close</button>
        </div>
      </div>
    );
  }
  if (!data) return <div className="min-h-screen flex items-center justify-center text-[#6B7280]">Loading...</div>;
  const b = data.bandobast;

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="no-print mb-4 flex gap-2">
        <button onClick={() => window.print()} className="bg-[#2E3192] text-white px-4 py-2 rounded-md font-semibold">
          <Printer className="w-4 h-4 inline mr-2" /> Print
        </button>
      </div>

      <div className="max-w-5xl mx-auto">
        <div className="border-b-4 border-[#2E3192] pb-4 mb-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-md bg-white border border-[#E5E7EB] flex items-center justify-center overflow-hidden">
            <BrandLogo size={52} bg={null} />
          </div>
          <div>
            <h1 className="font-display font-black text-2xl text-[#0A0A0A]">Buldhana District Police</h1>
            <div className="text-sm text-[#6B7280]">Point-wise Goshwara / पॉईंटनिहाय गोषवारा</div>
          </div>
        </div>

        <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-md p-4 mb-6">
          <div className="text-xl font-display font-bold">{b.name}</div>
          <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-[#6B7280]">Date:</span> <strong>{new Date(b.date).toLocaleDateString()}</strong>{b.reporting_time ? <> &nbsp;<span className="text-[#6B7280]">Reporting:</span> <strong>{b.reporting_time}</strong></> : null}</div>
            <div><span className="text-[#6B7280]">Year:</span> <strong>{b.year}</strong></div>
            <div><span className="text-[#6B7280]">Spot:</span> <strong>{b.spot || "-"}</strong></div>
            <div><span className="text-[#6B7280]">PS:</span> <strong>{b.ps_name || "-"}</strong></div>
          </div>
        </div>

        {data.point_wise.map(({ point: p, staff: ps }, idx) => (
          <div key={p.id} className="mb-6 break-inside-avoid">
            <div className="bg-[#2E3192] text-white px-4 py-2 font-bold rounded-t">
              {idx + 1}. {p.point_name} {p.is_reserved && "(Reserved)"}
            </div>
            <div className="border border-[#E5E7EB] border-t-0 rounded-b p-3 text-xs">
              <div className="grid grid-cols-3 gap-2 mb-2 text-[#6B7280]">
                <div>Sector: <strong className="text-[#0A0A0A]">{p.sector || "-"}</strong></div>
                <div>Location: <strong className="text-[#0A0A0A]">{p.latitude && p.longitude ? `${p.latitude}, ${p.longitude}` : "-"}</strong></div>
                <div>Equipment: <strong className="text-[#0A0A0A]">{(p.equipment || []).join(", ") || "-"}</strong></div>
              </div>
              {p.suchana && <div className="mb-2 p-2 bg-[#FF9933]/10 border-l-2 border-[#FF9933]">Suchana: {p.suchana}</div>}
              <table className="w-full text-xs border-collapse">
                <thead className="bg-[#F9FAFB]">
                  <tr>
                    <th className="border border-[#E5E7EB] px-2 py-1 text-left">Sr.</th>
                    <th className="border border-[#E5E7EB] px-2 py-1 text-left">Rank</th>
                    <th className="border border-[#E5E7EB] px-2 py-1 text-left">Bakkal</th>
                    <th className="border border-[#E5E7EB] px-2 py-1 text-left">Name</th>
                    <th className="border border-[#E5E7EB] px-2 py-1 text-left">Mobile</th>
                    <th className="border border-[#E5E7EB] px-2 py-1 text-left">Sign</th>
                  </tr>
                </thead>
                <tbody>
                  {ps.map((s, i) => (
                    <tr key={s.id}>
                      <td className="border border-[#E5E7EB] px-2 py-1">{i + 1}</td>
                      <td className="border border-[#E5E7EB] px-2 py-1">{s.rank}</td>
                      <td className="border border-[#E5E7EB] px-2 py-1 font-mono">{s.bakkal_no}</td>
                      <td className="border border-[#E5E7EB] px-2 py-1 font-semibold">{s.name}</td>
                      <td className="border border-[#E5E7EB] px-2 py-1 font-mono">{s.mobile || "-"}</td>
                      <td className="border border-[#E5E7EB] px-2 py-1 w-20"></td>
                    </tr>
                  ))}
                  {ps.length === 0 && (
                    <tr><td colSpan={6} className="border border-[#E5E7EB] px-2 py-2 text-center text-[#6B7280]">No staff</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        <div className="mt-10 pt-4 border-t border-[#E5E7EB] text-xs text-[#6B7280] flex justify-between">
          <div>Prepared by: _______________________</div>
          <div>Approved by: {b.in_charge || "_______________________"}</div>
        </div>
      </div>
    </div>
  );
}
