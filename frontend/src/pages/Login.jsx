import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Lock, User } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "../components/ui/sonner";

const LOGIN_IMG = "https://customer-assets.emergentagent.com/job_duty-points-mgmt/artifacts/pvp903f4_03.jpg.jpeg";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error("Please enter username and password");
      return;
    }
    setSubmitting(true);
    localStorage.setItem("bdpol_auth", JSON.stringify({ username, ts: Date.now() }));
    setTimeout(() => navigate("/loading"), 300);
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-[#CFF4D2]" data-testid="login-page">
      {/* Left: Brand visual */}
      <div className="relative hidden lg:flex items-center justify-center p-8 bg-[#CFF4D2]">
        <img
          src={LOGIN_IMG}
          alt="Buldhana Jilha Police - Digital Police Bandobast"
          className="w-full max-w-[640px] object-contain drop-shadow-xl"
        />
      </div>

      {/* Right: Form */}
      <div className="flex items-center justify-center p-6 sm:p-10 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="lg:hidden flex justify-center mb-6">
            <img src={LOGIN_IMG} alt="" className="w-48 object-contain" />
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-md bg-[#2E3192] flex items-center justify-center shadow-sm">
              <Shield className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="font-display font-black text-2xl tracking-tight text-[#0A0A0A]">
                Buldhana Police <span className="text-[#2E3192]">ADMIN</span>
              </h1>
              <div className="text-xs text-[#6B7280] font-medium">
                डिजिटल पोलीस बंदोबस्त / Digital Police Bandobast
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="font-display font-bold text-xl text-[#0A0A0A]">Sign in to your account</h2>
            <p className="text-sm text-[#6B7280] mt-1">आपल्या खात्यात साइन इन करा</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" data-testid="login-form">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-1.5">
                Username / वापरकर्ता नाव
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full border border-[#D1D5DB] rounded-md pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E3192] focus:border-transparent"
                  data-testid="login-username"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-1.5">
                Password / पासवर्ड
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-[#D1D5DB] rounded-md pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E3192] focus:border-transparent"
                  data-testid="login-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#138808] hover:bg-[#0E6306] text-white font-bold py-2.5 rounded-md transition-colors shadow-sm disabled:opacity-60"
              data-testid="login-submit"
            >
              {submitting ? "Signing in..." : "LOGIN"}
            </button>

            <div className="text-center text-xs text-[#6B7280] pt-2">
              Demo credentials: <span className="font-mono font-semibold">admin / admin</span>
            </div>
          </form>

          <div className="mt-10 pt-6 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#6B7280]">
            <span>© {new Date().getFullYear()} Buldhana District Police</span>
            <span className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#138808]" /> Secure
            </span>
          </div>
        </div>
      </div>
      <Toaster position="top-right" richColors />
    </div>
  );
}
