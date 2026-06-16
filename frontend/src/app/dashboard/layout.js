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
  Ticket,
  Users,
} from "lucide-react";
import { useState } from "react";
import Image from "next/image";

/* ✅ Sidebar Items FIXED */
const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: ShoppingBag, label: "Orders", href: "/dashboard/orders" },
  { icon: Coffee, label: "Products", href: "/dashboard/products" },
  { icon: Users, label: "Customers", href: "/dashboard/customers" },
  { icon: Ticket, label: "Coupons", href: "/dashboard/coupons" },
  { icon: Settings, label: "Manage Cafe", href: "/dashboard/settings" },
];

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-beige-50 font-sans">
      {/* ✅ Sidebar */}
      <aside
        className={`${isSidebarOpen ? "w-64" : "w-20"
          } relative bg-coffee-dark text-white shadow-[10px_0_40px_rgba(62,43,33,0.1)] 
        transition-all duration-500 flex flex-col h-screen overflow-hidden shrink-0`}
      >
        {/* Logo + Toggle */}
        <div className="px-5 py-8 flex items-center justify-between relative z-10">
          {isSidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-md shrink-0">
                <Coffee className="h-6 w-6 text-coffee-dark" />
              </div>
              <div className="flex flex-col">
                <p className="text-[15px] font-bold tracking-wider uppercase text-white leading-tight">
                  Odoo Cafe
                </p>
                <p className="text-[10px] text-white/70 font-medium tracking-widest">
                  Smart Point
                </p>
              </div>
            </div>
          )}

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-2 rounded-2xl border border-white/30 backdrop-blur ${isSidebarOpen
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
                className={`flex items-center p-3.5 rounded-[20px] transition-all duration-300 group ${isActive
                  ? "bg-beige-100 text-coffee-dark shadow-sm"
                  : "bg-transparent text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
              >
                <item.icon
                  className={`h-5 w-5 ${isActive
                    ? "text-coffee-dark"
                    : "text-white/60 group-hover:text-white"
                    }`}
                />

                {isSidebarOpen && (
                  <span className={`ml-4 text-[15px] ${isActive ? "font-semibold" : "font-medium"}`}>{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-5 mt-auto relative z-10">
          <button
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              localStorage.removeItem('activeSession');
              window.location.href = '/login';
            }}
            className="flex items-center w-full p-3.5 rounded-[20px] text-white/70 hover:bg-white/5 hover:text-white transition-colors border border-white/10"
          >
            <LogOut className="h-5 w-5" />
            {isSidebarOpen && <span className="ml-4 font-medium text-[15px]">Logout</span>}
          </button>
        </div>
      </aside>

      {/* ✅ Main Content */}
      <main className="flex-1 overflow-y-auto bg-beige-50 p-8 h-screen">
        <div className="max-w-[1400px] mx-auto">{children}</div>
      </main>
    </div>
  );
}
