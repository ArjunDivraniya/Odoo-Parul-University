"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Coffee,
  Settings,
  LogOut,
  Menu,
} from "lucide-react";
import { useState } from "react";
import Image from "next/image";

/* ✅ Sidebar Items FIXED */
const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: ShoppingBag, label: "Orders", href: "/dashboard/orders" },
  { icon: Coffee, label: "Products", href: "/dashboard/products" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-beige-100">
      {/* ✅ Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? "w-64" : "w-20"
        } relative sidebar-aurora text-white shadow-[0_20px_50px_rgba(9,22,15,0.45)] 
        transition-all duration-500 flex flex-col rounded-[26px] my-4 ml-4 
        h-[calc(100vh-2rem)] overflow-hidden border border-white/10`}
      >
        {/* Decorative Orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <span className="floating-orb absolute -right-6 top-24 h-24 w-24 rounded-full bg-white/10 blur-3xl" />
          <span className="floating-orb absolute left-6 bottom-10 h-32 w-32 rounded-full bg-[#F4B860]/20 blur-3xl delay-150" />
        </div>

        {/* Logo + Toggle */}
        <div className="px-5 py-4 flex items-center justify-between relative z-10">
          {isSidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-white border border-white/40 flex items-center justify-center shadow-lg">
                <Image
                  src="/odoo_cafe_logo.png"
                  alt="Odoo Cafe Logo"
                  width={48}
                  height={48}
                  className="object-contain"
                />
              </div>
              <p className="text-sm font-bold tracking-[0.2em] uppercase text-white">
                Odoo Cafe
              </p>
            </div>
          )}

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-2 rounded-2xl border border-white/30 backdrop-blur ${
              isSidebarOpen
                ? "bg-white/10 hover:bg-white/20"
                : "bg-white/20 hover:bg-white/30 mx-auto"
            }`}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-2 relative z-10">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center p-3 rounded-2xl transition-all duration-300 group backdrop-blur ${
                  isActive
                    ? "bg-white text-[#1A4D2E] shadow-[0_20px_40px_rgba(0,0,0,0.25)] border border-white/80"
                    : "bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <item.icon
                  className={`h-6 w-6 ${
                    isActive
                      ? "text-[#1A4D2E]"
                      : "text-white/70 group-hover:text-white"
                  }`}
                />

                {isSidebarOpen && (
                  <span className="ml-4 text-base">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/20 mx-3 mb-4 relative z-10">
          <button 
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              localStorage.removeItem('activeSession');
              window.location.href = '/login';
            }}
            className="flex items-center w-full p-3 rounded-2xl text-red-200 hover:bg-white/10 hover:text-red-100 transition-colors border border-white/10"
          >
            <LogOut className="h-6 w-6" />
            {isSidebarOpen && <span className="ml-4 font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* ✅ Main Content */}
      <main className="flex-1 overflow-y-auto bg-beige-100 p-8">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
