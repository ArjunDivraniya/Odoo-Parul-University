"use client";

import { useState, useEffect } from "react";
import { Users, ArrowLeft, Coffee } from "lucide-react";
import { useRouter } from "next/navigation";
import CoffeeLoader from "@/components/ui/CoffeeLoader";

export default function TablesPage() {
  const router = useRouter();
  const [floors, setFloors] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFloors();
  }, []);

  const fetchFloors = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/floors`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFloors(data);
        if (data.length > 0) {
          setSelectedFloor(data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch floors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTableSelect = (table) => {
    // Store selected table in localStorage
    localStorage.setItem('selectedTable', JSON.stringify(table));
    // Navigate to terminal with table context
    router.push(`/pos/terminal?table=${table.id}`);
  };

  const currentFloor = floors.find(f => f.id === selectedFloor);

  return (
    <div className="h-full bg-[#FBFBF2]">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#1A4D2E] tracking-tight">
                Select Table
              </h1>
              <p className="text-[#5F6F65] mt-1">Choose a table to start taking orders</p>
            </div>
          </div>
          <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-[#E8F5E9]">
            <Coffee className="h-8 w-8 text-[#1A4D2E]" />
          </div>
        </div>

        {/* Floor Tabs */}
        <div className="bg-white rounded-[2rem] p-2 shadow-lg inline-flex gap-2 border border-[#E8F5E9]">
          {floors.map((floor) => (
            <button
              key={floor.id}
              onClick={() => setSelectedFloor(floor.id)}
              className={`px-8 py-4 rounded-[2rem] font-bold transition-all duration-300 ${
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
          <div className="flex items-center justify-center h-full">
            <CoffeeLoader size="lg" text="Setting Tables..." />
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {currentFloor?.tables?.map((table) => (
              <button
                key={table.id}
                onClick={() => handleTableSelect(table)}
                className="group bg-white rounded-[2rem] p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 border-[#E8F5E9] hover:border-[#1A4D2E]"
              >
                {/* Table Image */}
                <div className="h-40 w-full rounded-2xl mb-6 overflow-hidden relative">
                  <img 
                    src={
                      table.seats <= 2 
                        ? 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop&q=80' 
                        : table.seats <= 4 
                        ? 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop&q=80'
                        : 'https://images.unsplash.com/photo-1582037928769-181f2644ecb7?w=400&h=300&fit=crop&q=80'
                    }
                    alt={`${table.name} - ${table.seats} seats`}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1A4D2E]/80 to-transparent group-hover:from-[#1A4D2E]/90 transition-all" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <span className="text-white font-bold text-lg">{table.name}</span>
                    <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                      <Users className="h-4 w-4 text-white inline mr-1" />
                      <span className="text-white text-sm font-semibold">{table.seats}</span>
                    </div>
                  </div>
                </div>

                {/* Table Info */}
                <div className="text-center">
                  {/* Status Badge */}
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-[#E8F5E9] text-[#1A4D2E] shadow-sm">
                    ✓ Available
                  </span>
                </div>
              </button>
            ))}
          </div>

          {(!currentFloor?.tables || currentFloor.tables.length === 0) && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🏪</div>
              <p className="text-[#5F6F65] text-lg">No tables available on this floor</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
