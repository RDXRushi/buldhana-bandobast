import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { Shield, Printer } from "lucide-react";

export default function PrintIDCard() {
  const { staffId } = useParams();
  const [params] = useSearchParams();
  const bid = params.get("bid");
  const [s, setS] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        if (bid) {
          const { data } = await api.get(`/bandobasts/${bid}/staff/${staffId}`);
          setS(data);
        } else {
          const { data } = await api.get(`/staff/${staffId}`);
          setS(data);
        }
      } catch {
        setError(true);
      }
    };
    load();
  }, [staffId, bid]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#F4F5F7]">
        <div className="max-w-md w-full bg-white border border-[#E5E7EB] rounded-md shadow p-6 text-center">
          <div className="text-4xl font-display font-black text-[#FF9933]">404</div>
          <h2 className="mt-2 font-display font-bold text-lg">Staff not found</h2>
          <p className="mt-1 text-sm text-[#6B7280]">This staff record does not exist or was removed.</p>
          <button onClick={() => window.close()} className="mt-4 bg-[#2E3192] hover:bg-[#202266] text-white font-semibold rounded-md px-4 py-2">Close</button>
        </div>
      </div>
    );
  }
  if (!s) return <div className="min-h-screen flex items-center justify-center text-[#6B7280]">Loading...</div>;

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
