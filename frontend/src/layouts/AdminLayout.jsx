import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ShieldPlus,
  Shield,
  LogOut,
  UserCircle2,
} from "lucide-react";
import { L } from "../lib/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Toaster } from "../components/ui/sonner";

const navItems = [
  { to: "/", label: L.dashboard, icon: LayoutDashboard, end: true },
  { to: "/staff", label: L.staff, icon: Users },
  { to: "/bandobast/new", label: L.newBandobast, icon: ShieldPlus },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#F4F5F7]">
      {/* Sidebar */}
      <aside className="w-64 fixed h-screen bg-[#2E3192] text-white flex flex-col border-r border-[#202266] z-50" data-testid="app-sidebar">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-[#202266]">
          <div className="w-10 h-10 rounded-md bg-[#FF9933] flex items-center justify-center shadow-sm">
            <Shield className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <div className="font-display font-black text-lg tracking-tight">Buldhana</div>
            <div className="text-xs text-white/70 font-medium">Police Bandobast</div>
          </div>
        </div>
        <nav className="flex-1 py-4">
          {navItems.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              data-testid={`nav-${n.to.replace(/\//g, "-") || "home"}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 mx-2 text-sm font-semibold transition-all rounded-md ${
                  isActive
                    ? "bg-[#202266] border-l-4 border-[#FF9933] pl-3"
                    : "hover:bg-[#202266]/60"
                }`
              }
            >
              <n.icon className="w-5 h-5" />
              <span>{n.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="px-6 py-4 border-t border-[#202266] text-xs text-white/60">
          <div>District Police HQ</div>
          <div className="mt-1">© {new Date().getFullYear()} Buldhana</div>
        </div>
      </aside>

      {/* Header */}
      <header className="h-16 ml-64 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-6 sticky top-0 z-40" data-testid="app-header">
        <div>
          <h1 className="font-display font-black text-xl tracking-tight text-[#0A0A0A]">
            Buldhana Police <span className="text-[#2E3192]">ADMIN</span>
          </h1>
          <div className="text-xs text-[#6B7280] font-medium">
            Digital Bandobast Management / डिजिटल बंदोबस्त व्यवस्थापन
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-xs text-[#6B7280]">
            <div className="w-2 h-2 rounded-full bg-[#138808]" /> Online
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#E5E7EB] rounded-md px-3 py-2" data-testid="profile-btn">
                <UserCircle2 className="w-6 h-6 text-[#2E3192]" />
                <div className="text-left hidden sm:block">
                  <div className="text-sm font-semibold text-[#0A0A0A]">{L.admin}</div>
                  <div className="text-xs text-[#6B7280]">Super Admin</div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem data-testid="profile-menu-profile">
                <UserCircle2 className="w-4 h-4 mr-2" /> {L.profile}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate("/")} data-testid="profile-menu-logout">
                <LogOut className="w-4 h-4 mr-2" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main */}
      <main className="ml-64 px-6 py-8 min-h-[calc(100vh-4rem)]" data-testid="app-main">
        <Outlet />
      </main>
      <Toaster position="top-right" richColors />
    </div>
  );
}
