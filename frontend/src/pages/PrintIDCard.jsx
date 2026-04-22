import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import { Shield, Printer } from "lucide-react";

export default function PrintIDCard() {
  const { staffId } = useParams();
  const [s, setS] = useState(null);
  useEffect(() => {
    api.get(`/staff/${staffId}`).then((r) => setS(r.data));
  }, [staffId]);

  if (!s) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#F4F5F7] p-8 flex flex-col items-center">
      <button onClick={() => window.print()} className="no-print mb-4 bg-[#2E3192] text-white px-4 py-2 rounded-md font-semibold">
        <Printer className="w-4 h-4 inline mr-2" /> Print
      </button>

      <div className="bg-white border-2 border-[#2E3192] rounded-lg overflow-hidden w-[380px] shadow-xl print-page" data-testid="id-card">
        <div className="bg-[#2E3192] text-white px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-[#FF9933] flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="font-display font-black text-sm leading-none">BULDHANA POLICE</div>
            <div className="text-[10px] uppercase tracking-wider text-white/80">District Police HQ</div>
          </div>
        </div>
        <div className="p-5">
          <div className="flex items-start gap-4">
            {s.photo ? (
              <img src={s.photo} alt="" className="w-24 h-28 object-cover border-2 border-[#2E3192] rounded" />
            ) : (
              <div className="w-24 h-28 bg-[#F3F4F6] border-2 border-[#2E3192] rounded flex items-center justify-center text-3xl font-bold text-[#9CA3AF]">
                {s.name?.[0]?.toUpperCase()}
              </div>
            )}
            <div className="flex-1 text-sm">
              <div className="text-xs text-[#6B7280] uppercase tracking-wider">Rank</div>
              <div className="font-bold">{s.rank}</div>
              <div className="mt-1 text-xs text-[#6B7280] uppercase tracking-wider">Bakkal No</div>
              <div className="font-mono font-bold">{s.bakkal_no}</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-[#E5E7EB] text-sm">
            <div className="text-lg font-display font-bold text-[#0A0A0A]">{s.name}</div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div><div className="text-[#6B7280]">Posting</div><div className="font-semibold">{s.posting || "-"}</div></div>
              <div><div className="text-[#6B7280]">Mobile</div><div className="font-mono">{s.mobile || "-"}</div></div>
              <div><div className="text-[#6B7280]">Gender</div><div>{s.gender}</div></div>
              <div><div className="text-[#6B7280]">District</div><div>{s.district}</div></div>
            </div>
          </div>
        </div>
        <div className="bg-[#F9FAFB] px-5 py-2 text-[10px] text-[#6B7280] text-center border-t border-[#E5E7EB]">
          This card is property of Buldhana District Police. If found, please return.
        </div>
      </div>
    </div>
  );
}
