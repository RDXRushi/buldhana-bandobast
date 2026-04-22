import React from "react";
import { Check } from "lucide-react";

export default function Stepper({ steps, current }) {
  return (
    <div className="w-full mb-8" data-testid="wizard-stepper">
      <div className="relative flex items-start justify-between">
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-[#E5E7EB] z-0" />
        <div
          className="absolute top-5 left-0 h-0.5 bg-[#2E3192] z-0 stepper-line"
          style={{ width: `${(current / (steps.length - 1)) * 100}%` }}
        />
        {steps.map((s, i) => {
          const state = i < current ? "done" : i === current ? "active" : "todo";
          return (
            <div key={i} className="relative z-10 flex flex-col items-center gap-2 flex-1">
              <div
                data-testid={`step-${i}`}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-4 border-[#F4F5F7] shadow-sm ${
                  state === "done"
                    ? "bg-[#138808] text-white"
                    : state === "active"
                    ? "bg-[#2E3192] text-white"
                    : "bg-white text-[#9CA3AF] border-[#E5E7EB]"
                }`}
              >
                {state === "done" ? <Check className="w-5 h-5" /> : i + 1}
              </div>
              <div
                className={`text-xs font-semibold text-center max-w-[110px] ${
                  state === "todo" ? "text-[#9CA3AF]" : "text-[#2E3192]"
                }`}
              >
                {s}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
