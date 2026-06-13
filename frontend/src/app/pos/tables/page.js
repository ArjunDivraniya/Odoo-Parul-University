// frontend/src/app/pos/tables/page.js
"use client";

import { useState, useEffect } from "react";
import { Users, ArrowLeft, Coffee, Shuffle, Check, X, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import CoffeeLoader from "@/components/ui/CoffeeLoader";
import { useCartStore } from "@/stores/cart-store";
import { getSocket } from "@/lib/socket";

export default function TablesPage() {
  const router = useRouter();
  const { loadOrder, clearCart } = useCartStore();

  const [floors, setFloors] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [loading, setLoading] = useState(true);

  // Table Transfer State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferSource, setTransferSource] = useState("");
  const [transferDest, setTransferDest] = useState("");

  // Notifications
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchFloors();

    // Socket.IO Integration
    const socket = getSocket();
    socket.emit('join', 'cashier');

    socket.on('table:status_updated', (data) => {
      console.log('📶 Table status updated via socket:', data);
      setFloors(prevFloors => 
        prevFloors.map(floor => ({
          ...floor,
          tables: floor.tables.map(table => 
            table.id === data.tableId ? { ...table, status: data.status } : table
          )
        }))
      );
    });

    socket.on('order:status_updated', (order) => {
      console.log('📶 Order status updated via socket:', order);
      if (order.status === 'COMPLETED' && order.table) {
        showToastNotification(`🔔 Order #${order.orderNumber?.slice(-3) || 'POS'} is READY for ${order.table.name}!`);
        // Refresh floors/tables to fetch updated status if needed
        fetchFloors();
      }
    });

    return () => {
      socket.off('table:status_updated');
      socket.off('order:status_updated');
    };
  }, []);

  const showToastNotification = (message) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const fetchFloors = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/floors`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setFloors(data);
        if (data.length > 0 && !selectedFloor) {
          setSelectedFloor(data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch floors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTableSelect = async (table) => {
    localStorage.setItem('selectedTable', JSON.stringify(table));
    
    if (table.status === 'OCCUPIED') {
      // Fetch the active order for this table
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/orders?tableId=${table.id}&active=true`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const activeOrders = await res.json();
          if (activeOrders.length > 0) {
            loadOrder(activeOrders[0]);
            router.push(`/pos/terminal?table=${table.id}`);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to load active order:", err);
      }
    }

    // Default: Clear cart and start new order
    clearCart();
    router.push(`/pos/terminal?table=${table.id}`);
  };

  // Process Table Transfer
  const handleTransfer = async () => {
    if (!transferSource || !transferDest) return;

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/tables/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sourceTableId: transferSource,
          destTableId: transferDest
        })
      });

      if (response.ok) {
        showToastNotification("✅ Table transfer completed successfully!");
        setShowTransferModal(false);
        setTransferSource("");
        setTransferDest("");
        fetchFloors();
      } else {
        const err = await response.json();
        alert(err.error || "Failed to transfer table");
      }
    } catch (error) {
      console.error('Failed to transfer table:', error);
      alert('Error transferring table');
    }
  };

  // Toggle Table Reserved status manually
  const toggleReservation = async (e, table) => {
    e.stopPropagation(); // Avoid triggering navigation
    const currentStatus = table.status;
    let newStatus = 'AVAILABLE';
    if (currentStatus === 'AVAILABLE') {
      newStatus = 'RESERVED';
    } else if (currentStatus === 'RESERVED') {
      newStatus = 'AVAILABLE';
    } else {
      alert("Occupied tables cannot be reserved directly.");
      return;
    }

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/tables/${table.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: table.name,
          seats: table.seats,
          status: newStatus
        })
      });

      if (response.ok) {
        // Optimistic update
        setFloors(prevFloors => 
          prevFloors.map(floor => ({
            ...floor,
            tables: floor.tables.map(t => 
              t.id === table.id ? { ...t, status: newStatus } : t
            )
          }))
        );
      }
    } catch (error) {
      console.error('Failed to toggle reservation:', error);
    }
  };

  const currentFloor = floors.find(f => f.id === selectedFloor);

  // Helpers for table styling
  const getTableStatusColor = (status) => {
    switch(status) {
      case 'OCCUPIED':
        return 'border-[#EF4444] text-[#EF4444] bg-[#FEF2F2] hover:border-[#EF4444]/80 shadow-[0_15px_30px_rgba(239,68,68,0.1)]';
      case 'RESERVED':
        return 'border-[#F59E0B] text-[#F59E0B] bg-[#FFFBEB] hover:border-[#F59E0B]/80 shadow-[0_15px_30px_rgba(245,158,11,0.1)]';
      case 'AVAILABLE':
      default:
        return 'border-[#10B981] text-[#10B981] bg-[#ECFDF5] hover:border-[#10B981]/80 shadow-[0_15px_30px_rgba(16,185,129,0.1)]';
    }
  };

  const getTableBadge = (status) => {
    switch(status) {
      case 'OCCUPIED':
        return '🔴 Occupied';
      case 'RESERVED':
        return '🟡 Reserved';
      case 'AVAILABLE':
      default:
        return '🟢 Available';
    }
  };

  return (
    <div className="h-full bg-[#FBFBF2] relative p-6">
      {/* Toast Notifications */}
      <div className="fixed top-6 right-6 z-50 space-y-3 max-w-sm">
        {notifications.map((n) => (
          <div key={n.id} className="bg-[#1A4D2E] text-[#FEFCE8] p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 border border-[#FEFCE8]/20 animate-bounce">
            <span className="font-bold text-sm">{n.message}</span>
            <button onClick={() => setNotifications(prev => prev.filter(x => x.id !== n.id))} className="text-white/70 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black text-[#1A4D2E] tracking-tight">
              Table Layout
            </h1>
            <p className="text-[#5F6F65] mt-1">Select a table to manage its cart or start order</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowTransferModal(true)}
              className="px-5 py-3 bg-white border-2 border-[#E8F5E9] text-[#1A4D2E] rounded-2xl font-bold flex items-center gap-2 hover:bg-[#E8F5E9] hover:border-[#1A4D2E] transition-all shadow-md"
            >
              <Shuffle className="h-5 w-5" />
              Transfer Order
            </button>
            <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-[#E8F5E9]">
              <Coffee className="h-8 w-8 text-[#1A4D2E]" />
            </div>
          </div>
        </div>

        {/* Floor Tabs */}
        <div className="bg-white rounded-[2rem] p-2 shadow-lg inline-flex gap-2 border border-[#E8F5E9]">
          {floors.map((floor) => (
            <button
              key={floor.id}
              onClick={() => setSelectedFloor(floor.id)}
              className={`px-8 py-4 rounded-[2rem] font-black transition-all duration-300 ${
                selectedFloor === floor.id
                  ? 'bg-[#1A4D2E] text-white shadow-lg transform scale-105'
                  : 'text-[#5F6F65] hover:bg-[#E8F5E9]'
              }`}
            >
              {floor.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tables Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <CoffeeLoader size="lg" text="Setting Tables..." />
        </div>
      ) : (
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {currentFloor?.tables?.map((table) => {
              const statusStyle = getTableStatusColor(table.status);
              const badgeText = getTableBadge(table.status);

              return (
                <div
                  key={table.id}
                  onClick={() => handleTableSelect(table)}
                  className={`group bg-white rounded-[2.5rem] p-6 shadow-md transition-all duration-300 hover:-translate-y-2 border-2 ${statusStyle} cursor-pointer flex flex-col justify-between h-72 relative`}
                >
                  <div>
                    {/* Header: Table Name & Seats */}
                    <div className="flex justify-between items-start">
                      <h3 className="text-2xl font-black">{table.name}</h3>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/60 backdrop-blur rounded-full text-xs font-bold border">
                        <Users className="h-3.5 w-3.5" />
                        <span>{table.seats}</span>
                      </div>
                    </div>
                    
                    {/* Status Badge */}
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider mt-4 bg-white/80 border">
                      {badgeText}
                    </span>
                  </div>

                  {/* Manual Reservation Button */}
                  <div className="flex justify-between items-center mt-6">
                    <button
                      onClick={(e) => toggleReservation(e, table)}
                      className={`text-xs font-bold px-4 py-2 rounded-xl border-2 transition-all ${
                        table.status === 'RESERVED'
                          ? 'bg-[#F59E0B] text-white border-transparent'
                          : table.status === 'AVAILABLE'
                          ? 'bg-white text-[#5F6F65] border-gray-200 hover:border-[#1A4D2E] hover:text-[#1A4D2E]'
                          : 'opacity-50 cursor-not-allowed text-gray-400 border-gray-100'
                      }`}
                      disabled={table.status === 'OCCUPIED'}
                    >
                      {table.status === 'RESERVED' ? 'Unreserve' : 'Reserve'}
                    </button>
                    {table.status === 'OCCUPIED' && table.orders?.[0] && (
                      <span className="text-sm font-black text-[#1A4D2E]">
                        ₹{Number(table.orders[0].totalAmount).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {(!currentFloor?.tables || currentFloor.tables.length === 0) && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🏪</div>
              <p className="text-[#5F6F65] text-lg">No tables available on this floor</p>
            </div>
          )}
        </div>
      )}

      {/* Table Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full p-8 border border-[#E8F5E9]">
            <div className="text-center mb-6">
              <div className="h-16 w-16 bg-[#E8F5E9] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Shuffle className="h-8 w-8 text-[#1A4D2E]" />
              </div>
              <h2 className="text-2xl font-black text-[#1A4D2E]">Transfer Order</h2>
              <p className="text-[#5F6F65]">Move active order to another table</p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-[#1A4D2E] mb-2">From Table (Occupied)</label>
                <select
                  value={transferSource}
                  onChange={(e) => setTransferSource(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-[#1A4D2E] focus:outline-none bg-white font-semibold"
                >
                  <option value="">Select source table</option>
                  {floors.flatMap(f => f.tables)
                    .filter(t => t.status === 'OCCUPIED')
                    .map(t => (
                      <option key={t.id} value={t.id}>{t.name} (Occupied)</option>
                    ))
                  }
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#1A4D2E] mb-2">To Table (Available)</label>
                <select
                  value={transferDest}
                  onChange={(e) => setTransferDest(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-[#1A4D2E] focus:outline-none bg-white font-semibold"
                >
                  <option value="">Select target table</option>
                  {floors.flatMap(f => f.tables)
                    .filter(t => t.status === 'AVAILABLE')
                    .map(t => (
                      <option key={t.id} value={t.id}>{t.name} (Available)</option>
                    ))
                  }
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => { setShowTransferModal(false); setTransferSource(""); setTransferDest(""); }}
                className="px-6 py-4 bg-[#FBFBF2] text-[#5F6F65] rounded-[2rem] font-bold hover:bg-[#E8F5E9] transition-colors border border-[#E8F5E9]"
              >
                Cancel
              </button>
              <button
                onClick={handleTransfer}
                disabled={!transferSource || !transferDest}
                className="px-6 py-4 bg-[#1A4D2E] text-white rounded-[2rem] font-bold hover:bg-[#143D24] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-lg"
              >
                Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
