import React from "react";

export default function StatCard({ label, value, icon: Icon, accent = "#2E3192", sublabel }) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-md p-5 shadow-sm hover:-translate-y-0.5 transition-transform" data-testid={`stat-${label}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-bold tracking-wider uppercase text-[#6B7280]">{label}</div>
          <div className="mt-2 text-3xl font-black font-display text-[#0A0A0A]">{value}</div>
          {sublabel && <div className="mt-1 text-xs text-[#6B7280]">{sublabel}</div>}
        </div>
        <div
          className="w-10 h-10 rounded-md flex items-center justify-center"
          style={{ background: `${accent}15`, color: accent }}
        >
          {Icon && <Icon className="w-5 h-5" />}
        </div>
      </div>
    </div>
  );
}
