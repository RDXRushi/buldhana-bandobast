import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, BACKEND_URL } from "../lib/api";
import PointQR from "../components/PointQR";
import { Printer } from "lucide-react";
import BrandLogo from "../components/BrandLogo";

export default function PrintDutyPass() {
  const { bid, pid, sid } = useParams();
  const [b, setB] = useState(null);
  const [s, setS] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [bRes, sRes] = await Promise.all([
          api.get(`/bandobasts/${bid}`),
          api.get(`/bandobasts/${bid}/staff/${sid}`),
        ]);
        setB(bRes.data);
        setS(sRes.data);
      } catch {
        setError(true);
      }
    };
    load();
  }, [bid, sid]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#F4F5F7]">
        <div className="max-w-md w-full bg-white border border-[#E5E7EB] rounded-md shadow p-6 text-center">
          <div className="text-4xl font-display font-black text-[#FF9933]">404</div>
          <h2 className="mt-2 font-display font-bold text-lg">Duty pass record not found</h2>
          <p className="mt-1 text-sm text-[#6B7280]">Either the bandobast or staff record is missing.</p>
          <button onClick={() => window.close()} className="mt-4 bg-[#2E3192] hover:bg-[#202266] text-white font-semibold rounded-md px-4 py-2">Close</button>
        </div>
      </div>
    );
  }
  if (!b || !s) return <div className="min-h-screen flex items-center justify-center text-[#6B7280]">Loading...</div>;
  const point = b.points?.find((p) => p.id === pid);

  return (
    <div className="min-h-screen bg-[#F4F5F7] p-8 flex flex-col items-center">
      <button onClick={() => window.print()} className="no-print mb-4 bg-[#2E3192] text-white px-4 py-2 rounded-md font-semibold">
        <Printer className="w-4 h-4 inline mr-2" /> Print
      </button>

      <div className="bg-white border-2 border-[#2E3192] rounded-lg overflow-hidden w-[500px] shadow-xl print-page" data-testid="duty-pass">
        <div className="bg-[#2E3192] text-white px-5 py-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-md bg-white flex items-center justify-center overflow-hidden">
            <BrandLogo size={44} bg={null} />
          </div>
          <div className="flex-1">
            <div className="font-display font-black text-lg leading-none">DUTY PASS</div>
            <div className="text-xs uppercase tracking-wider text-white/80">Buldhana District Police</div>
          </div>
          <div className="text-right text-xs">
            <div className="text-white/70">Valid</div>
            <div className="font-bold">{new Date(b.date).toLocaleDateString()}{b.reporting_time ? ` · ${b.reporting_time}` : ""}</div>
          </div>
        </div>

        <div className="p-5">
          <div className="text-xs uppercase tracking-wider text-[#6B7280] mb-1">Bandobast</div>
          <div className="font-display font-bold text-lg text-[#0A0A0A]">{b.name}</div>
          <div className="text-xs text-[#6B7280] mt-1">{b.spot} · {b.ps_name}</div>

          <div className="mt-4 grid grid-cols-[1fr_auto] gap-4 items-start">
            <div className="border border-[#E5E7EB] rounded-md p-3 text-sm">
              <div className="text-xs uppercase tracking-wider text-[#6B7280] mb-1">Personnel</div>
              <div className="font-bold text-base">{s.name}</div>
              <div className="text-xs mt-1">
                {s.rank}{s.staff_type !== "officer" && s.bakkal_no ? ` · Bakkal ${s.bakkal_no}` : ""}
              </div>
              <div className="text-xs text-[#6B7280]">{s.posting}</div>

              <div className="mt-3 pt-3 border-t border-[#E5E7EB]">
                <div className="text-xs uppercase tracking-wider text-[#6B7280] mb-1">Duty Point</div>
                <div className="font-semibold">{point?.point_name || "-"}</div>
                {point?.sector && <div className="text-xs">Sector: {point.sector}</div>}
                {point?.latitude && (
                  <div className="text-xs font-mono text-[#6B7280]">{point.latitude}, {point.longitude}</div>
                )}
              </div>

              {(() => {
                const eq = (b.equipment_assignments || {})[pid]?.[sid];
                return eq ? (
                  <div className="mt-3 pt-3 border-t border-[#E5E7EB]">
                    <div className="text-xs uppercase tracking-wider text-[#6B7280] mb-1">Equipment Assigned</div>
                    <div className="inline-block bg-[#FF9933]/15 text-[#B36B22] px-2 py-0.5 rounded text-sm font-bold">
                      {eq}
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
            <div className="flex flex-col items-center gap-1">
              <PointQR
                bid={bid}
                pid={pid}
                alt="QR"
                className="w-28 h-28 border border-[#E5E7EB] rounded"
              />
              <div className="text-[9px] text-[#6B7280] text-center max-w-[120px] leading-tight">
                Scan to open<br />{point?.point_name} on Map
              </div>
            </div>
          </div>

          {point?.suchana && (
            <div className="mt-4 text-xs p-3 bg-[#FF9933]/5 border-l-2 border-[#FF9933] rounded">
              <div className="font-bold text-[#B36B22] mb-1">Instructions / सूचना</div>
              {point.suchana}
            </div>
          )}
        </div>

        <div className="bg-[#F9FAFB] px-5 py-3 text-[10px] text-[#6B7280] text-center border-t border-[#E5E7EB]">
          Issued by {b.in_charge || "District Police HQ"} · Please report 30 min prior to duty.
        </div>
      </div>
    </div>
  );
}
