"use client";

import { useState, useEffect } from "react";
import { X, MapPin, Package, Users, Check, Coffee, RefreshCw } from "lucide-react";
import CoffeeLoader from "@/components/ui/CoffeeLoader";
import { useCartStore } from "@/stores/cart-store";
import { usePopup } from "@/context/PopupContext";

export default function TableSelectModal({ isOpen, onClose, onSelectTable, currentTable }) {
  const [floors, setFloors] = useState([]);
  const [selectedFloorId, setSelectedFloorId] = useState(null);
  const [loading, setLoading] = useState(false);
  const { loadOrder, clearCart } = useCartStore();
  const { showToast, showAlert } = usePopup();

  useEffect(() => {
    if (isOpen) {
      fetchFloors();
    }
  }, [isOpen]);

  const fetchFloors = async () => {
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/floors`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setFloors(data);
        if (data.length > 0 && !selectedFloorId) {
          setSelectedFloorId(data[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch floors for modal:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChooseTakeaway = () => {
    localStorage.removeItem('selectedTable');
    onSelectTable(null);
    showToast("Order type set to Takeaway", "info");
    onClose();
  };

  const handleChooseTable = async (table) => {
    localStorage.setItem('selectedTable', JSON.stringify(table));
    onSelectTable(table);

    if (table.status === 'OCCUPIED') {
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
            showToast(`Loaded active order for ${table.name}`, "success");
            onClose();
            return;
          }
        }
      } catch (err) {
        console.error("Failed to fetch active table order:", err);
      }
    }

    showToast(`Assigned to ${table.name}`, "success");
    onClose();
  };

  if (!isOpen) return null;

  const activeFloor = floors.find(f => f.id === selectedFloorId) || floors[0];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-3xl w-full border border-[#E8F5E9] overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-6 bg-[#FBFBF2] border-b border-[#E8F5E9] flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-2xl font-black text-[#1A4D2E] tracking-tight flex items-center gap-2">
              <MapPin className="h-6 w-6 text-[#1A4D2E]" />
              Select Order Service & Table
            </h2>
            <p className="text-xs text-[#5F6F65] font-semibold mt-0.5">
              Choose Dine-In Table or switch to Takeaway
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-10 w-10 rounded-full bg-white border border-[#E8F5E9] flex items-center justify-center text-[#5F6F65] hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Quick Option: Takeaway Switch */}
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-4 border border-orange-200 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-md">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-black text-orange-950 text-base">Takeaway / Walk-in</h4>
                <p className="text-xs text-orange-800 font-medium">No table assignment needed</p>
              </div>
            </div>
            <button
              onClick={handleChooseTakeaway}
              className={`px-5 py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md ${
                !currentTable
                  ? 'bg-orange-600 text-white ring-2 ring-orange-400'
                  : 'bg-white text-orange-700 hover:bg-orange-600 hover:text-white border border-orange-200'
              }`}
            >
              {!currentTable && <Check className="h-4 w-4" />}
              {!currentTable ? 'Selected Takeaway' : 'Set as Takeaway'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-px bg-gray-200 flex-1"></div>
            <span className="text-xs font-bold text-[#5F6F65] uppercase tracking-wider">or Select Floor Table</span>
            <div className="h-px bg-gray-200 flex-1"></div>
          </div>

          {/* Floor Selection Tabs */}
          {floors.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {floors.map((floor) => (
                <button
                  key={floor.id}
                  onClick={() => setSelectedFloorId(floor.id)}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border ${
                    selectedFloorId === floor.id
                      ? 'bg-[#1A4D2E] text-white border-[#1A4D2E] shadow-md'
                      : 'bg-white text-[#5F6F65] hover:bg-[#FBFBF2] border-[#E8F5E9]'
                  }`}
                >
                  {floor.name} ({floor.tables?.length || 0})
                </button>
              ))}
            </div>
          )}

          {/* Tables Grid */}
          {loading ? (
            <div className="py-12 flex justify-center">
              <CoffeeLoader size="md" text="Loading tables..." />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {activeFloor?.tables?.map((table) => {
                const isCurrent = currentTable?.id === table.id;
                const isOccupied = table.status === 'OCCUPIED';
                const isReserved = table.status === 'RESERVED';

                let cardBg = 'bg-white border-emerald-200 hover:border-emerald-500 text-emerald-900';
                let badgeClass = 'bg-emerald-100 text-emerald-800';
                let badgeText = 'Available';

                if (isOccupied) {
                  cardBg = 'bg-red-50/50 border-red-200 hover:border-red-400 text-red-900';
                  badgeClass = 'bg-red-100 text-red-700';
                  badgeText = 'Occupied';
                } else if (isReserved) {
                  cardBg = 'bg-amber-50/50 border-amber-200 hover:border-amber-400 text-amber-900';
                  badgeClass = 'bg-amber-100 text-amber-800';
                  badgeText = 'Reserved';
                }

                return (
                  <button
                    key={table.id}
                    onClick={() => handleChooseTable(table)}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between text-left relative group hover:shadow-md ${cardBg} ${
                      isCurrent ? 'ring-4 ring-[#1A4D2E] border-[#1A4D2E] shadow-lg' : ''
                    }`}
                  >
                    {isCurrent && (
                      <div className="absolute top-2 right-2 h-6 w-6 bg-[#1A4D2E] text-white rounded-full flex items-center justify-center text-xs shadow-md">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                    )}

                    <div>
                      <h4 className="font-black text-lg leading-tight">{table.name}</h4>
                      <div className="flex items-center gap-1 text-xs text-gray-500 font-bold mt-1">
                        <Users className="h-3.5 w-3.5" />
                        <span>{table.seats} Seats</span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between pt-2 border-t border-gray-100">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${badgeClass}`}>
                        {badgeText}
                      </span>
                      {isOccupied && table.orders?.[0] && (
                        <span className="text-xs font-bold text-red-700">
                          ₹{Number(table.orders[0].totalAmount).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {(!activeFloor?.tables || activeFloor.tables.length === 0) && !loading && (
            <div className="text-center py-8 text-[#5F6F65]">
              <p className="font-bold">No tables on this floor.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#FBFBF2] border-t border-[#E8F5E9] flex justify-between items-center text-xs text-[#5F6F65] font-semibold">
          <p>Click any table to switch order service to Dine-In.</p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold transition-colors"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}
