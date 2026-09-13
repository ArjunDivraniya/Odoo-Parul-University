// frontend/src/app/kitchen/page.js
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChefHat, Clock, CheckCircle, LogOut, Flame, Package, Bell, RefreshCw, AlertCircle, Utensils, X, Coffee } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import CoffeeLoader from "@/components/ui/CoffeeLoader";
import { getSocket } from "@/lib/socket";
import { usePopup } from "@/context/PopupContext";
import { useSettings } from "@/context/SettingsContext";

export default function KitchenPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastError, setLastError] = useState(null);
  const { logout } = useAuthStore();
  const { showToast, showAlert } = usePopup();
  const { cafeName } = useSettings();

  const fetchOrders = async () => {
    setLastError(null);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${API_URL}/kitchen/active`, {
        headers: { 'Authorization': `Bearer ${token}` },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Socket.IO Integration
    const socket = getSocket();
    socket.emit('join', 'kitchen-room');

    socket.on('order_sent_to_kitchen', (newOrder) => {
      console.log('📶 New order received via socket in KDS:', newOrder);
      setOrders(prevOrders => {
        if (prevOrders.some(o => o.id === newOrder.id)) return prevOrders;
        return [...prevOrders, newOrder];
      });
      showToast(`New Order #${newOrder.orderNumber?.slice(-3) || 'POS'} sent to kitchen for ${newOrder.table ? newOrder.table.name : 'Takeaway'}!`, 'info');
      
      try {
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-120.wav");
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch(e){}
    });

    const handleUpdate = (updatedOrder) => {
      console.log('📶 Kitchen status update via socket:', updatedOrder);
      setOrders(prevOrders => 
        prevOrders.map(o => o.id === updatedOrder.id ? { ...o, status: updatedOrder.status } : o)
      );
    };

    socket.on('kitchen_preparing', handleUpdate);
    socket.on('kitchen_completed', handleUpdate);

    socket.on('table_released', (data) => {
      console.log('📶 Table released via socket, removing order:', data);
      setOrders(prevOrders => prevOrders.filter(o => o.id !== data.orderId));
    });

    // Fallback polling every 30 seconds
    const interval = setInterval(fetchOrders, 30000);

    return () => {
      socket.off('order_sent_to_kitchen');
      socket.off('kitchen_preparing');
      socket.off('kitchen_completed');
      socket.off('table_released');
      clearInterval(interval);
    };
  }, []);

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
        // Local optimistic update
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order.id === orderId ? { ...order, status: newStatus } : order
          )
        );
        showToast(`Order status updated to ${newStatus}`, "success");
      } else {
        showAlert('Failed to update order status', 'Kitchen Status', 'error');
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      showAlert('Failed to update order status', 'Kitchen Status', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FDFCF7]">
        <CoffeeLoader size="xl" text="Connecting to Kitchen..." />
      </div>
    );
  }

  const getElapsedTime = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMinutes = Math.floor((now - created) / 60000);
    return Math.max(0, diffMinutes);
  };

  const getTimeColor = (minutes) => {
    if (minutes > 20) return 'text-red-700 bg-red-50 border-red-200';
    if (minutes > 10) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-[#1A4D2E] bg-[#E8F5E9] border-[#4ADE80]/30';
  };

  // Filter columns based on order status
  const toCookOrders = orders.filter(o => o.status === 'TO_COOK');
  const preparingOrders = orders.filter(o => o.status === 'PREPARING');
  const completedOrders = orders.filter(o => o.status === 'COMPLETED');

  const KitchenColumn = ({ title, activeOrders, icon: Icon, colorClass, nextStatus, emptyText, btnText, btnBg }) => (
    <div className="flex-1 flex flex-col min-w-0 bg-[#FDFCF7] rounded-[32px] border border-[#F0EBE1] shadow-[0_2px_15px_rgba(0,0,0,0.02)] overflow-hidden h-full">
      {/* Column Header */}
      <div className={`p-6 border-b border-[#F0EBE1] ${colorClass}`}>
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-white shadow-xs flex items-center justify-center border border-[#F0EBE1]">
            <Icon className="h-6 w-6 text-[#1A4D2E]" />
          </div>
          <div>
            <h2 className="text-xl font-black text-[#3E2B21] font-serif tracking-tight">{title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`h-2.5 w-2.5 rounded-full ${activeOrders.length > 0 ? 'bg-[#1A4D2E] animate-pulse' : 'bg-gray-300'}`}></span>
              <p className="text-xs font-bold text-[#8C8775] uppercase tracking-wider">{activeOrders.length} ACTIVE</p>
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeOrders.length === 0 ? (
          <div className="text-center py-24 flex flex-col items-center justify-center h-full opacity-60">
            <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center mb-4 border border-[#F0EBE1] shadow-xs">
              <Icon className="h-8 w-8 text-[#A8A396]" />
            </div>
            <p className="text-[#8C8775] font-bold text-sm">{emptyText}</p>
          </div>
        ) : (
          activeOrders.map((order) => {
            const elapsedTime = getElapsedTime(order.createdAt);

            return (
              <div
                key={order.id}
                className="bg-white rounded-[28px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-300 border border-[#F0EBE1] hover:border-[#1A4D2E]/30 relative overflow-hidden group"
              >
                {/* Order Header */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-dashed border-[#F0EBE1]">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xl font-black text-[#1A4D2E]">
                      {order.orderNumber || `#${order.id.slice(0, 6)}`}
                    </span>
                    {order.table ? (
                      <span className="px-3.5 py-1 rounded-full bg-[#1A4D2E]/10 text-[#1A4D2E] text-xs font-black uppercase tracking-wider border border-[#1A4D2E]/20">
                        {order.table.name}
                      </span>
                    ) : (
                      <span className="px-3.5 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-black uppercase tracking-wider border border-amber-200">
                        Takeaway
                      </span>
                    )}
                  </div>

                  <div className={`px-3.5 py-1 rounded-full flex items-center gap-1.5 border leading-none font-bold text-xs ${getTimeColor(elapsedTime)}`}>
                    <Clock className="h-3.5 w-3.5" />
                    <span>{elapsedTime}m</span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="space-y-3">
                  {order.items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 p-3 rounded-[18px] bg-[#FDFCF7] border border-[#F0EBE1]"
                    >
                      <div className="h-8 w-8 bg-[#1A4D2E] text-white rounded-full flex items-center justify-center font-black text-xs shadow-xs flex-shrink-0">
                        {item.quantity}×
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#3E2B21] leading-snug text-sm">{item.productName}</p>
                        {item.variantName && (
                          <p className="text-xs text-[#8C8775] font-semibold mt-0.5">+ {item.variantName}</p>
                        )}
                        {item.notes && (
                          <div className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 text-[11px] font-bold rounded-full border border-amber-200">
                            <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                            <span>{item.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Interactive Theme Action Button */}
                {nextStatus && (
                  <div className="mt-5 pt-3 border-t border-[#F0EBE1]">
                    <button
                      onClick={() => updateOrderStatus(order.id, nextStatus)}
                      className={`w-full py-3.5 rounded-full font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all transform active:scale-95 text-white ${btnBg}`}
                    >
                      {btnText}
                    </button>
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
    <div className="h-screen flex flex-col bg-[#FDFCF7] overflow-hidden font-sans">
      {lastError && (
        <div className="bg-red-600 text-white px-6 py-3 text-center font-bold flex items-center justify-center gap-2 shadow-lg z-50">
          <AlertCircle className="h-5 w-5" />
          {lastError}
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-[#F0EBE1] shadow-[0_2px_15px_rgba(0,0,0,0.02)] z-20 px-8 py-5">
        <div className="flex items-center justify-between max-w-[1920px] mx-auto w-full">
          <div className="flex items-center gap-5">
            <div className="h-14 w-14 relative bg-white rounded-full flex items-center justify-center shadow-md border border-[#F0EBE1] overflow-hidden p-1">
               <Image 
                  src="/the_coffee_concept_logo.png" 
                  alt={`${cafeName} Logo`} 
                  fill
                  className="object-contain p-1.5"
                  priority
               />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#3E2B21] font-serif tracking-tight">
                {cafeName} Kitchen KDS
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <p className="text-[#8C8775] font-bold text-xs">Live Kitchen Feed • {toCookOrders.length + preparingOrders.length} Active Tickets</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Stats Pills matching POS style */}
            <div className="hidden lg:flex items-center gap-3 mr-6">
              <div className="px-5 py-2 rounded-full bg-[#FFF4E5] border border-[#FFE0A3] flex items-center gap-3">
                <span className="text-xs font-bold text-[#B8700A] uppercase tracking-wider">To Cook</span>
                <span className="text-lg font-black text-[#E68A00] leading-none">{toCookOrders.length}</span>
              </div>
              <div className="px-5 py-2 rounded-full bg-[#E8F4FD] border border-[#B8DCF0] flex items-center gap-3">
                <span className="text-xs font-bold text-[#1E6FA0] uppercase tracking-wider">Cooking</span>
                <span className="text-lg font-black text-[#1E6FA0] leading-none">{preparingOrders.length}</span>
              </div>
              <div className="px-5 py-2 rounded-full bg-[#E8F5E9] border border-[#A5D6A7] flex items-center gap-3">
                <span className="text-xs font-bold text-[#2E7D32] uppercase tracking-wider">Ready</span>
                <span className="text-lg font-black text-[#2E7D32] leading-none">{completedOrders.length}</span>
              </div>
            </div>

            <button
              onClick={() => fetchOrders()}
              className="h-12 w-12 bg-[#FDFCF7] border border-[#F0EBE1] text-[#3E2B21] rounded-full hover:border-[#1A4D2E] hover:text-[#1A4D2E] transition-all flex items-center justify-center group shadow-xs"
              title="Refresh Queue"
            >
              <RefreshCw className="h-5 w-5 group-hover:rotate-180 transition-transform duration-500" />
            </button>

            <button
              onClick={() => window.location.href = '/pos/terminal'}
              className="px-6 py-3 bg-[#1A4D2E] text-white rounded-full font-bold hover:bg-[#143D24] shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-sm transform active:scale-95"
            >
              <LogOut className="h-4.5 w-4.5" />
              Exit KDS
            </button>
          </div>
        </div>
      </header>

      {/* Main KDS Board */}
      <div className="flex-1 p-8 overflow-hidden">
        <div className="flex gap-8 h-full max-w-[1920px] mx-auto w-full">
          <KitchenColumn
            title="To Cook"
            activeOrders={toCookOrders}
            icon={Package}
            colorClass="bg-[#FDFCF7]"
            nextStatus="PREPARING"
            emptyText="All caught up! No pending orders"
            btnText="Start Cooking 🔥"
            btnBg="bg-[#1A4D2E] hover:bg-[#143D24]"
          />
          <KitchenColumn
            title="On The Grill"
            activeOrders={preparingOrders}
            icon={Flame}
            colorClass="bg-[#FDFCF7]"
            nextStatus="COMPLETED"
            emptyText="Kitchen is clear"
            btnText="Mark Ready ⏱️"
            btnBg="bg-[#1E6FA0] hover:bg-[#15537A]"
          />
          <KitchenColumn
            title="Ready to Serve"
            activeOrders={completedOrders}
            icon={CheckCircle}
            colorClass="bg-[#FDFCF7]"
            nextStatus="SERVED"
            emptyText="No orders waiting for pickup"
            btnText="Mark Served 🍽️"
            btnBg="bg-[#2E7D32] hover:bg-[#1E5621]"
          />
        </div>
      </div>
    </div>
  );
}