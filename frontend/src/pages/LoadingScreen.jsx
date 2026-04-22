import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const LOADING_IMG = "https://customer-assets.emergentagent.com/job_duty-points-mgmt/artifacts/tze8x55k_04.jpg.jpeg";
const DURATION_MS = 5000;

export default function LoadingScreen() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const tick = setInterval(() => {
      const p = Math.min(100, ((Date.now() - start) / DURATION_MS) * 100);
      setProgress(p);
      if (p >= 100) clearInterval(tick);
    }, 50);
    const t = setTimeout(() => navigate("/", { replace: true }), DURATION_MS);
    return () => {
      clearInterval(tick);
      clearTimeout(t);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen w-full bg-[#E6F7FF] flex flex-col items-center justify-center relative overflow-hidden" data-testid="loading-page">
      <div className="w-full max-w-2xl px-4">
        <div className="rounded-lg overflow-hidden shadow-2xl border-4 border-white">
          <img
            src={LOADING_IMG}
            alt="Buldhana Jilha Police"
            className="w-full h-auto object-contain"
          />
        </div>

        <div className="mt-8 text-center">
          <h2 className="font-display font-black text-2xl sm:text-3xl tracking-tight text-[#2E3192]">
            डिजिटल पोलीस बंदोबस्त
          </h2>
          <p className="mt-1 text-sm text-[#4B5563] font-semibold">
            Loading your dashboard... / आपला डॅशबोर्ड लोड होत आहे...
          </p>
        </div>

        {/* Progress bar */}
        <div className="mt-6 w-full max-w-md mx-auto">
          <div className="h-2 w-full bg-white/70 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-[#FF9933] via-white to-[#138808] transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
              data-testid="loading-progress"
            />
          </div>
          <div className="mt-2 text-xs text-[#6B7280] font-mono text-center">
            {Math.round(progress)}%
          </div>
        </div>
      </div>
    </div>
  );
}
