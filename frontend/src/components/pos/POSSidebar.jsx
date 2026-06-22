"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  ShoppingBag,
  Map,
  LogOut,
  Menu,
  Timer,
  LayoutDashboard,
  Receipt,
  Settings,
  ShoppingCart
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import CloseSessionModal from "@/components/pos/CloseSessionModal";

const posSidebarItems = [
  { icon: ShoppingBag, label: "Register", href: "/pos/terminal" },
  { icon: ShoppingCart, label: "Cart", href: "/pos/cart" },
  { icon: Map, label: "Tables", href: "/pos/tables" },
  { icon: Receipt, label: "Orders", href: "/pos/orders" },
  { icon: Timer, label: "Session", href: "/pos/session" },
];

export default function POSSidebar() {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showCloseSessionModal, setShowCloseSessionModal] = useState(false);

  // Use session from localStorage strictly for display if needed

  const [shiftSales, setShiftSales] = useState(0);

  useEffect(() => {
    fetchShiftStats();
    // Poll every minute
    const interval = setInterval(fetchShiftStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchShiftStats = async () => {
    try {
      const activeSession = JSON.parse(localStorage.getItem('activeSession') || '{}');
      if (!activeSession.id) return;

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/orders?sessionId=${activeSession.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const orders = await response.json();
        const total = orders
          .filter(o => o.status !== 'CANCELLED')
          .reduce((sum, o) => sum + Number(o.totalAmount), 0);
        setShiftSales(total);
      }
    } catch (error) {
      console.error("Failed to fetch stats", error);
    }
  };

  const handleCloseSession = (closingCash) => {
  };

  return (
    <aside
      className={`${isSidebarOpen ? "w-64" : "w-20"
        } relative bg-gradient-to-br from-[#1A4D2E] via-[#153e26] to-[#0e2c1a] text-white shadow-[0_20px_50px_rgba(9,22,15,0.45)] transition-all duration-500 flex flex-col rounded-[26px] my-4 ml-4 h-[calc(100vh-2rem)] overflow-hidden border border-white/10 shrink-0 z-50`}
    >
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
                alt="Logo"
                width={48}
                height={48}
                className="object-contain"
              />
            </div>
            <p className="text-sm font-bold tracking-[0.2em] uppercase text-white">
              POS Terminal
            </p>
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
      <nav className="flex-1 px-3 space-y-2 relative z-10 mt-4">
        {posSidebarItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center p-3 rounded-2xl transition-all duration-300 group backdrop-blur ${isActive
                  ? "bg-white text-[#1A4D2E] shadow-[0_20px_40px_rgba(0,0,0,0.25)] border border-white/80"
                  : "bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white"
                }`}
            >
              <item.icon
                className={`h-6 w-6 ${isActive
                  ? "text-[#1A4D2E]"
                  : "text-white/70 group-hover:text-white"
                  }`}
              />

              {isSidebarOpen && (
                <span className="ml-4 text-base font-medium">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Shift Summary Widget */}
      {isSidebarOpen && (
        <div className="mx-3 mb-2 p-4 rounded-3xl bg-white/10 border border-white/20 backdrop-blur-sm relative z-10">
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-xs text-white/60 font-semibold uppercase tracking-wider">Shift Sales</p>
              <p className="text-2xl font-bold text-white">₹{shiftSales.toFixed(2)}</p>
            </div>
            <div className="h-8 w-8 bg-green-400/20 rounded-full flex items-center justify-center">
              <ShoppingBag className="h-4 w-4 text-green-300" />
            </div>
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-green-400 w-3/4"></div>
          </div>
          <p className="text-[10px] text-white/50 mt-2 text-right">Target: ₹1,500</p>
        </div>
      )}

      {/* Identity */}
      <div className="p-4 border-t border-white/20 mx-3 mb-4 relative z-10">
        <div className={`flex items-center ${!isSidebarOpen && "justify-center"}`}>
          <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
            <div className="h-3 w-3 rounded-full bg-green-400 animate-pulse"></div>
          </div>
          {isSidebarOpen && (
            <div className="ml-3">
              <p className="text-sm font-bold text-white">Active Session</p>
              <p className="text-xs text-white/60">Online</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
