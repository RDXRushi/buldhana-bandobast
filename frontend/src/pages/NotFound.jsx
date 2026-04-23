import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F4F5F7]">
      <div className="max-w-md w-full bg-white border border-[#E5E7EB] rounded-md shadow p-8 text-center">
        <div className="text-6xl font-display font-black text-[#2E3192]">404</div>
        <h2 className="mt-2 font-display font-bold text-xl text-[#0A0A0A]">Page not found</h2>
        <p className="mt-2 text-sm text-[#6B7280]">The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/" className="mt-4 inline-block bg-[#2E3192] hover:bg-[#202266] text-white font-semibold rounded-md px-4 py-2">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
