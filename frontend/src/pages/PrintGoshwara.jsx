import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, BACKEND_URL } from "../lib/api";
import { Printer, Download, FileText } from "lucide-react";
import BrandLogo from "../components/BrandLogo";

const OFFICER_RANKS = ["ASP", "Dy.SP", "PI", "API", "PSI"];
const AMALDAR_RANKS = ["ASI", "HC", "NPC", "PC", "LPC"];

function computeSummary(b, pointWise) {
  const points_count = (b.points || []).filter((p) => !p.is_reserved).length;
  const counts = {};
  [...OFFICER_RANKS, ...AMALDAR_RANKS, "female_amaldar", "hg"].forEach((k) => (counts[k] = 0));
  const seen = new Set();
  pointWise.forEach(({ staff }) => {
    staff.forEach((s) => {
      if (seen.has(s.id)) return;
      seen.add(s.id);
      const rank = (s.rank || "").trim();
      const gender = (s.gender || "").toLowerCase();
      if (s.staff_type === "officer") {
        if (OFFICER_RANKS.includes(rank)) counts[rank]++;
      } else if (s.staff_type === "amaldar") {
        if (gender === "female") counts.female_amaldar++;
        else if (AMALDAR_RANKS.includes(rank)) counts[rank]++;
      } else if (s.staff_type === "home_guard") {
        counts.hg++;
      }
    });
  });
  let total = 0;
  [...OFFICER_RANKS, ...AMALDAR_RANKS].forEach((r) => (total += counts[r]));
  total += counts.female_amaldar + counts.hg;
  return { points_count, counts, total };
}

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
  const summary = computeSummary(b, data.point_wise);

  // Equipment lookup helper for a (point, staff) pair
  const equipmentFor = (pid, sid) =>
    ((b.equipment_assignments || {})[pid] || {})[sid] || "";

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="no-print mb-4 flex flex-wrap gap-2">
        <button onClick={() => window.print()} className="bg-[#2E3192] text-white px-4 py-2 rounded-md font-semibold">
          <Printer className="w-4 h-4 inline mr-2" /> Print
        </button>
        <a
          href={`${BACKEND_URL}/api/bandobasts/${id}/goshwara.pdf`}
          target="_blank" rel="noopener noreferrer"
          className="bg-[#138808] hover:bg-[#0F6906] text-white px-4 py-2 rounded-md font-semibold inline-flex items-center"
          data-testid="download-pdf-btn"
        >
          <Download className="w-4 h-4 mr-2" /> Download PDF
        </a>
        <a
          href={`${BACKEND_URL}/api/bandobasts/${id}/goshwara.docx`}
          target="_blank" rel="noopener noreferrer"
          className="bg-[#1E40AF] hover:bg-[#172E7C] text-white px-4 py-2 rounded-md font-semibold inline-flex items-center"
          data-testid="download-word-btn"
        >
          <FileText className="w-4 h-4 mr-2" /> Download Word
        </a>
      </div>

      <div className="max-w-5xl mx-auto" id="goshwara-print">
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
              <table className="w-full text-xs border-collapse">
                <thead className="bg-[#F9FAFB]">
                  <tr>
                    <th className="border border-[#E5E7EB] px-2 py-1 text-left">Sr.</th>
                    <th className="border border-[#E5E7EB] px-2 py-1 text-left">Rank</th>
                    <th className="border border-[#E5E7EB] px-2 py-1 text-left">Bakkal</th>
                    <th className="border border-[#E5E7EB] px-2 py-1 text-left">Name</th>
                    <th className="border border-[#E5E7EB] px-2 py-1 text-left">Mobile</th>
                    <th className="border border-[#E5E7EB] px-2 py-1 text-left">Equipment</th>
                  </tr>
                </thead>
                <tbody>
                  {ps.map((s, i) => (
                    <tr key={s.id}>
                      <td className="border border-[#E5E7EB] px-2 py-1">{i + 1}</td>
                      <td className="border border-[#E5E7EB] px-2 py-1">{s.rank}</td>
                      <td className="border border-[#E5E7EB] px-2 py-1 font-mono">{s.bakkal_no || "-"}</td>
                      <td className="border border-[#E5E7EB] px-2 py-1 font-semibold">{s.name}</td>
                      <td className="border border-[#E5E7EB] px-2 py-1 font-mono">{s.mobile || "-"}</td>
                      <td className="border border-[#E5E7EB] px-2 py-1">{equipmentFor(p.id, s.id) || "-"}</td>
                    </tr>
                  ))}
                  {ps.length === 0 && (
                    <tr><td colSpan={6} className="border border-[#E5E7EB] px-2 py-2 text-center text-[#6B7280]">No staff</td></tr>
                  )}
                </tbody>
              </table>
              {p.suchana && (
                <div className="mt-3 p-2 bg-[#FF9933]/10 border-l-4 border-[#FF9933] text-[#92400E] italic">
                  <strong>Suchana / सूचना:</strong> {p.suchana}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* ----- Bottom summary table ----- */}
        <div className="mt-8 break-inside-avoid">
          <div className="font-display font-bold text-base mb-2 text-[#2E3192]">Summary / सारांश</div>
          <table className="w-full text-xs border-collapse text-center" data-testid="summary-table">
            <thead>
              <tr className="bg-[#F3F4F6]">
                <th className="border border-[#374151] px-2 py-1 align-middle" rowSpan={2}>Number of points</th>
                <th className="border border-[#374151] px-2 py-1" colSpan={OFFICER_RANKS.length}>Officer</th>
                <th className="border border-[#374151] px-2 py-1" colSpan={AMALDAR_RANKS.length}>Amaldar</th>
                <th className="border border-[#374151] px-2 py-1 align-middle" rowSpan={2}>Female Amaldar</th>
                <th className="border border-[#374151] px-2 py-1 align-middle" rowSpan={2}>HG</th>
                <th className="border border-[#374151] px-2 py-1 align-middle" rowSpan={2}>TOTAL</th>
              </tr>
              <tr className="bg-[#F9FAFB]">
                {OFFICER_RANKS.map((r) => <th key={r} className="border border-[#374151] px-2 py-1">{r}</th>)}
                {AMALDAR_RANKS.map((r) => <th key={r} className="border border-[#374151] px-2 py-1">{r}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr className="font-bold text-sm">
                <td className="border border-[#374151] px-2 py-2">{summary.points_count}</td>
                {OFFICER_RANKS.map((r) => <td key={r} className="border border-[#374151] px-2 py-2">{summary.counts[r]}</td>)}
                {AMALDAR_RANKS.map((r) => <td key={r} className="border border-[#374151] px-2 py-2">{summary.counts[r]}</td>)}
                <td className="border border-[#374151] px-2 py-2">{summary.counts.female_amaldar}</td>
                <td className="border border-[#374151] px-2 py-2">{summary.counts.hg}</td>
                <td className="border border-[#374151] px-2 py-2 bg-[#F9FAFB]">{summary.total}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ----- Signature block ----- */}
        <div className="mt-16 grid grid-cols-2 gap-12 break-inside-avoid">
          <div className="text-center">
            <div className="border-t border-[#374151] pt-2 mt-12 text-xs text-[#6B7280]">Prepared by</div>
          </div>
          <div className="text-center">
            <div className="border-t border-[#374151] pt-2 mt-12 text-xs">
              <div className="font-bold text-[#0A0A0A]">{b.in_charge || "_______________________"}</div>
              <div className="text-[#6B7280] italic">(In-charge Officer / प्रभारी अधिकारी)</div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-[10px] text-[#9CA3AF]">
          Generated on {new Date().toLocaleString()} · Buldhana District Police
        </div>
      </div>
    </div>
  );
}
