"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChefHat, Clock, CheckCircle, LogOut, Flame, Package, Bell, RefreshCw, AlertCircle, Utensils } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

import CoffeeLoader from "@/components/ui/CoffeeLoader";



export default function KitchenPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [lastError, setLastError] = useState(null);
  const { logout } = useAuthStore();

  const fetchOrders = async () => {
    setLastError(null);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 sec timeout

      const response = await fetch(`${API_URL}/kitchen/active`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        // Check for new orders to play sound (simplified logic)
        if (data.length > orders.length && orders.length > 0) {
          playSound();
        }
        setOrders(data);
      } else if (response.status === 401) {
        logout();
        window.location.href = '/login';
      } else if (response.status === 403) {
        setLastError("Access Denied: You do not have permission (KITCHEN/ADMIN only).");
      } else {
        const text = await response.text();
        setLastError(`Server Error: ${response.status} ${text.slice(0, 50)}`);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setLastError(`Connection Error: ${error.message}`);
    } finally {
      console.log('Fetch finally block reached');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Poll for new orders every 5 seconds
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const playSound = () => {
    // Optional: Implement actual sound notification
    console.log('New order received!');
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/kitchen/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        // Optimistic UI update
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order.id === orderId ? { ...order, status: newStatus } : order
          )
        );
        // Also refresh from server
        setTimeout(() => fetchOrders(), 500);
      } else {
        console.error('Failed to update status');
        alert('Failed to update order status');
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update order status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FBFBF2]">
        <CoffeeLoader size="xl" text="Checking Orders..." />
      </div>
    );
  }

  const getElapsedTime = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMinutes = Math.floor((now - created) / 60000);
    return diffMinutes;
  };

  const getTimeColor = (minutes) => {
    if (minutes > 20) return 'text-red-700 bg-red-50 border-red-200';
    if (minutes > 10) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-[#1A4D2E] bg-emerald-50 border-emerald-200';
  };

  // Categorize orders by status
  const toCookOrders = orders.filter(o => o.status === 'SENT');
  const preparingOrders = orders.filter(o => o.status === 'PREPARING');
  const completedOrders = orders.filter(o => o.status === 'COMPLETED');

  const KitchenColumn = ({ title, orders, icon: Icon, colorClass, nextStatus, emptyText }) => (
    <div className="flex-1 flex flex-col min-w-0 bg-white/40 backdrop-blur-xl rounded-[2.5rem] border border-white/60 shadow-[0_10px_30px_rgba(0,0,0,0.02)] overflow-hidden h-full">
      {/* Column Header */}
      <div className={`p-6 border-b border-white/50 ${colorClass}`}>
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center">
            <Icon className="h-6 w-6 text-[#1A4D2E]" />
          </div>
          <div>
            <h2 className="text-xl font-black text-[#1A4D2E] tracking-tight">{title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`h-2 w-2 rounded-full ${orders.length > 0 ? 'bg-[#1A4D2E] animate-pulse' : 'bg-gray-300'}`}></span>
              <p className="text-sm font-semibold text-gray-500">{orders.length} ACTIVE</p>
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-[#1A4D2E]/20 scrollbar-track-transparent">
        {orders.length === 0 ? (
          <div className="text-center py-24 flex flex-col items-center justify-center h-full opacity-60">
            <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
              <Icon className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-bold">{emptyText}</p>
          </div>
        ) : (
          orders.map((order) => {
            const elapsedTime = getElapsedTime(order.createdAt);

            return (
              <div
                key={order.id}
                onClick={() => nextStatus && updateOrderStatus(order.id, nextStatus)}
                className={`bg-white rounded-[2rem] p-5 shadow-sm hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-300 cursor-pointer border border-transparent hover:border-[#1A4D2E]/20 hover:-translate-y-1 group relative overflow-hidden`}
              >
                {/* Status Bar */}
                <div className={`absolute top-0 left-0 w-1.5 h-full ${nextStatus === 'PREPARING' ? 'bg-orange-400' : 'bg-blue-400'} opacity-0 group-hover:opacity-100 transition-opacity`}></div>

                {/* Order Header */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-dashed border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xl font-black text-[#1A4D2E]">
                      #{order.orderNumber?.slice(-3) || order.id.slice(0, 3)}
                    </span>
                    {order.table ? (
                      <span className="px-3 py-1 rounded-full bg-[#1A4D2E]/5 text-[#1A4D2E] text-xs font-bold uppercase tracking-wider border border-[#1A4D2E]/10">
                        {order.table.name}
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-bold uppercase tracking-wider border border-orange-100">
                        Takeaway
                      </span>
                    )}
                  </div>

                  <div className={`px-3 py-1 rounded-full flex items-center gap-1.5 border leading-none ${getTimeColor(elapsedTime)}`}>
                    <Clock className="h-3.5 w-3.5" />
                    <span className="font-bold text-xs">{elapsedTime}m</span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="space-y-3">
                  {order.items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-4 p-2 rounded-xl group-hover:bg-[#FBFBF2] transition-colors"
                    >
                      <div className="h-8 w-8 bg-[#1A4D2E] text-white rounded-lg flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                        {item.quantity}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-800 leading-snug">{item.productName}</p>
                        {item.variantName && (
                          <p className="text-xs text-gray-500 font-medium">+ {item.variantName}</p>
                        )}
                        {item.notes && (
                          <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-wide rounded border border-amber-100">
                            <AlertCircle className="h-3 w-3" />
                            {item.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Hint */}
                {nextStatus && (
                  <div className="mt-4 pt-3 flex items-center justify-center border-t border-gray-50 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                    <span className="text-xs font-bold text-[#1A4D2E] uppercase tracking-widest flex items-center gap-2">
                      {nextStatus === 'PREPARING' ? (
                        <>Start Cooking <Flame className="h-4 w-4" /></>
                      ) : nextStatus === 'PAID' ? (
                        <>Serve Order <CheckCircle className="h-4 w-4" /></>
                      ) : (
                        <>Mark Ready <CheckCircle className="h-4 w-4" /></>
                      )}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-[#FBFBF2] overflow-hidden font-sans">
      {lastError && (
        <div className="bg-red-500 text-white px-6 py-3 text-center font-bold flex items-center justify-center gap-2 shadow-lg z-50">
          <AlertCircle className="h-5 w-5" />
          {lastError}
        </div>
      )}

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.03)] border-b border-gray-100 z-20 px-8 py-5">
        <div className="flex items-center justify-between max-w-[1920px] mx-auto w-full">
          <div className="flex items-center gap-6">
            <div className="h-16 w-16 relative bg-white rounded-[1.2rem] flex items-center justify-center shadow-lg shadow-[#1A4D2E]/10 transform hover:rotate-6 transition-transform duration-300 cursor-pointer overflow-hidden border border-gray-100">
               <Image 
                  src="/odoo_cafe_logo.png" 
                  alt="Odoo Cafe Logo" 
                  fill
                  className="object-contain p-2"
                  priority
               />
            </div>
            <div>
              <h1 className="text-3xl font-black text-[#1A4D2E] tracking-tight">
                Kitchen Display
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                <p className="text-gray-500 font-medium text-sm">Live Feed • {toCookOrders.length + preparingOrders.length} Active</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Stats Pills */}
            <div className="hidden lg:flex items-center gap-4 mr-8">
              <div className="px-5 py-2.5 bg-orange-50 rounded-2xl border border-orange-100 flex flex-col items-center min-w-[100px]">
                <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Pending</span>
                <span className="text-2xl font-black text-orange-600 leading-none mt-1">{toCookOrders.length}</span>
              </div>
              <div className="px-5 py-2.5 bg-blue-50 rounded-2xl border border-blue-100 flex flex-col items-center min-w-[100px]">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Cooking</span>
                <span className="text-2xl font-black text-blue-600 leading-none mt-1">{preparingOrders.length}</span>
              </div>
            </div>

            <div className="h-10 w-px bg-gray-200 mx-2"></div>

            <button
              onClick={() => fetchOrders()}
              className="h-12 w-12 bg-white border-2 border-gray-100 text-gray-500 rounded-2xl hover:border-[#1A4D2E] hover:text-[#1A4D2E] transition-all flex items-center justify-center group"
              title="Refresh"
            >
              <RefreshCw className="h-5 w-5 group-hover:rotate-180 transition-transform duration-500" />
            </button>

            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 bg-[#1A4D2E] text-white rounded-2xl font-bold hover:bg-[#143D24] shadow-lg shadow-[#1A4D2E]/20 hover:shadow-xl transition-all flex items-center gap-2 transform active:scale-95"
            >
              <LogOut className="h-5 w-5" />
              Exit KDS
            </button>
          </div>
        </div>
      </header>

      {/* Board */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <CoffeeLoader size="xl" text="Connecting to Kitchen..." />
        </div>
      ) : (
        <div className="flex-1 p-8 overflow-hidden">
          <div className="flex gap-8 h-full max-w-[1920px] mx-auto w-full">
            <KitchenColumn
              title="To Cook"
              orders={toCookOrders}
              icon={Package}
              colorClass="bg-gradient-to-r from-orange-50 to-transparent"
              nextStatus="PREPARING"
              emptyText="All caught up! No pending orders"
            />
            <KitchenColumn
              title="On The Grill"
              orders={preparingOrders}
              icon={Flame}
              colorClass="bg-gradient-to-r from-blue-50 to-transparent"
              nextStatus="COMPLETED"
              emptyText="Kitchen is clear"
            />
            <KitchenColumn
              title="Ready to Serve"
              orders={completedOrders}
              icon={CheckCircle}
              colorClass="bg-gradient-to-r from-green-50 to-transparent"
              nextStatus="PAID"
              emptyText="No orders waiting for pickup"
            />
          </div>
        </div>
      )}
    </div>
  );
}
