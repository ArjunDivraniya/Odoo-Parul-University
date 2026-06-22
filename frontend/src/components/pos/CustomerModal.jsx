"use client";

import { useState, useEffect, useRef } from "react";
import { User, Phone, Mail, X, Save, Search, Calendar, ShoppingBag, DollarSign, Clock, Plus } from "lucide-react";
import { usePopup } from "@/context/PopupContext";

export default function CustomerModal({ isOpen, onClose, onSave, initialData }) {
  const { showToast, showAlert } = usePopup();
  const [activeTab, setActiveTab] = useState("search"); // "search" or "create"
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [recentCustomers, setRecentCustomers] = useState([]);
  const [searching, setSearching] = useState(false);
  
  // Create New Customer Form State
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    birthday: ""
  });
  
  // Smart detection state (matches exactly one phone number)
  const [smartDetectedCustomer, setSmartDetectedCustomer] = useState(null);
  
  const searchTimeoutRef = useRef(null);

  // Load recent customers on modal open
  useEffect(() => {
    if (isOpen) {
      fetchRecentCustomers();
      setSearchQuery("");
      setSearchResults([]);
      setSmartDetectedCustomer(null);
      setActiveTab("search");
      if (initialData) {
        setFormData({
          name: initialData.name || "",
          phone: initialData.phone || initialData.mobile || "",
          email: initialData.email || "",
          birthday: initialData.birthday ? new Date(initialData.birthday).toISOString().split('T')[0] : ""
        });
      } else {
        setFormData({ name: "", phone: "", email: "", birthday: "" });
      }
    }
  }, [isOpen, initialData]);

  // Handle instant search when query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSmartDetectedCustomer(null);
      return;
    }

    setSearching(true);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/customers/search?q=${encodeURIComponent(searchQuery)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);

          // Smart detection: if one of the results matches the query exactly by phone
          const exactPhoneMatch = data.find(c => c.phone === searchQuery.trim());
          if (exactPhoneMatch) {
            setSmartDetectedCustomer(exactPhoneMatch);
          } else {
            setSmartDetectedCustomer(null);
          }
        }
      } catch (err) {
        console.error("Failed to search customers:", err);
      } finally {
        setSearching(false);
      }
    }, 200); // 200ms debounce

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  const fetchRecentCustomers = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/customers/recent`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRecentCustomers(data);
      }
    } catch (err) {
      console.error("Failed to fetch recent customers:", err);
    }
  };

  const handleSelectCustomer = (customer) => {
    onSave(customer);
    showToast(`Linked customer: ${customer.name}`, "success");
    onClose();
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      showAlert("Name and Phone Number are required fields.", "Create Customer", "error");
      return;
    }

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');
      
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || null,
        birthday: formData.birthday || null
      };

      const res = await fetch(`${API_URL}/customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const savedCustomer = await res.json();
        onSave(savedCustomer);
        showToast(`Customer ${savedCustomer.name} created and linked successfully!`, "success");
        onClose();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to create customer", "error");
      }
    } catch (error) {
      console.error("Create customer error:", error);
      showToast("Server connection error. Please try again.", "error");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-[#FBFBF2] rounded-[2.5rem] w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200 border border-[#E8F5E9] overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-6 border-b border-[#E8F5E9] bg-white flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-2xl font-black text-[#1A4D2E] tracking-tight">Customer Panel</h2>
            <p className="text-xs text-[#5F6F65] font-semibold mt-0.5">Search or add customer for current order</p>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-gray-100 rounded-full transition-colors border border-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#E8F5E9] bg-white shrink-0">
          <button
            onClick={() => setActiveTab("search")}
            className={`flex-1 py-4 text-center font-bold text-sm border-b-2 transition-all flex items-center justify-center gap-2 ${
              activeTab === "search"
                ? "border-[#1A4D2E] text-[#1A4D2E] bg-[#E8F5E9]/10"
                : "border-transparent text-[#5F6F65] hover:text-[#1A4D2E] hover:bg-gray-50"
            }`}
          >
            <Search className="h-4 w-4" />
            Search / Recent Customers
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className={`flex-1 py-4 text-center font-bold text-sm border-b-2 transition-all flex items-center justify-center gap-2 ${
              activeTab === "create"
                ? "border-[#1A4D2E] text-[#1A4D2E] bg-[#E8F5E9]/10"
                : "border-transparent text-[#5F6F65] hover:text-[#1A4D2E] hover:bg-gray-50"
            }`}
          >
            <Plus className="h-4 w-4" />
            Create New Customer
          </button>
        </div>

        {/* Scrollable Content Pane */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === "search" ? (
            <>
              {/* Search bar */}
              <div className="space-y-2">
                <label className="text-xs font-black text-[#1A4D2E] uppercase tracking-wider ml-1">Search Database</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#5F6F65]" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter phone number or customer name..."
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-[#E8F5E9] focus:border-[#1A4D2E] focus:outline-none transition-colors bg-white font-semibold text-gray-800 shadow-sm"
                  />
                  {searching && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#1A4D2E] border-t-transparent"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Smart detected card */}
              {smartDetectedCustomer && (
                <div className="bg-emerald-50 rounded-3xl p-5 border border-[#4ADE80]/30 shadow-sm space-y-4 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-[#1A4D2E] rounded-md text-[10px] font-black uppercase tracking-wider">
                        ⚡ Smart Detected
                      </span>
                      <h4 className="text-lg font-black text-[#1A4D2E] mt-1">{smartDetectedCustomer.name}</h4>
                      <p className="text-xs font-semibold text-[#5F6F65]">{smartDetectedCustomer.phone}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      smartDetectedCustomer.membershipLevel === "PLATINUM" ? "bg-indigo-100 text-indigo-700" :
                      smartDetectedCustomer.membershipLevel === "GOLD" ? "bg-amber-100 text-amber-700" :
                      smartDetectedCustomer.membershipLevel === "SILVER" ? "bg-slate-200 text-slate-700" :
                      "bg-emerald-100 text-emerald-800"
                    }`}>
                      {smartDetectedCustomer.membershipLevel}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold text-[#1A4D2E]">
                    <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100/50">
                      <p className="text-[10px] uppercase text-[#5F6F65] font-bold">Orders</p>
                      <p className="text-base font-black mt-0.5">{smartDetectedCustomer.totalOrders}</p>
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100/50">
                      <p className="text-[10px] uppercase text-[#5F6F65] font-bold">Spent</p>
                      <p className="text-base font-black mt-0.5">₹{Number(smartDetectedCustomer.totalSpent).toLocaleString()}</p>
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100/50">
                      <p className="text-[10px] uppercase text-[#5F6F65] font-bold">Points</p>
                      <p className="text-base font-black mt-0.5">{smartDetectedCustomer.points}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectCustomer(smartDetectedCustomer)}
                    className="w-full py-3 bg-[#1A4D2E] text-white font-bold rounded-2xl hover:bg-[#143d24] transition-colors shadow-md text-sm"
                  >
                    Select Customer
                  </button>
                </div>
              )}

              {/* Search Results / Empty State */}
              {searchQuery && !smartDetectedCustomer && (
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-[#1A4D2E] uppercase tracking-wider ml-1">Search Results</h4>
                  {searchResults.length === 0 ? (
                    <div className="text-center py-8 bg-white border border-[#E8F5E9] rounded-3xl p-6">
                      <p className="text-sm font-bold text-gray-500">No matching customer found.</p>
                      <button
                        onClick={() => {
                          setFormData({ ...formData, phone: searchQuery.replace(/\D/g, "") });
                          setActiveTab("create");
                        }}
                        className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-[#E8F5E9] text-[#1A4D2E] text-xs font-bold rounded-xl hover:bg-[#4ADE80]/20 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Create New Customer
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {searchResults.map((cust) => (
                        <div
                          key={cust.id}
                          onClick={() => handleSelectCustomer(cust)}
                          className="flex justify-between items-center p-4 bg-white hover:bg-[#E8F5E9]/20 rounded-2xl border border-gray-100 hover:border-[#1A4D2E]/20 transition-all cursor-pointer group"
                        >
                          <div>
                            <h5 className="font-bold text-[#1A4D2E] group-hover:text-black transition-colors">{cust.name}</h5>
                            <div className="flex gap-3 text-xs text-[#5F6F65] font-semibold mt-0.5">
                              <span>📞 {cust.phone}</span>
                              {cust.email && <span>✉️ {cust.email}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black bg-gray-100 text-[#1A4D2E] px-2 py-0.5 rounded">
                              {cust.totalOrders} ord
                            </span>
                            <span className="text-xs font-bold text-[#1A4D2E]">
                              Select →
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Recent Customers (Last 10 Quick Select) */}
              {!searchQuery && (
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-[#1A4D2E] uppercase tracking-wider ml-1">Recent Customers (One-Click Select)</h4>
                  {recentCustomers.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No recent customers found.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {recentCustomers.map((cust) => (
                        <button
                          key={cust.id}
                          onClick={() => handleSelectCustomer(cust)}
                          className="p-3 text-left bg-white hover:bg-[#E8F5E9] border border-gray-100 hover:border-[#1A4D2E]/20 rounded-2xl transition-all shadow-sm flex flex-col justify-between group h-20"
                        >
                          <p className="font-bold text-[#1A4D2E] text-xs truncate w-full group-hover:text-[#1A4D2E]">{cust.name}</p>
                          <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{cust.phone}</p>
                          <div className="flex justify-between items-center w-full mt-1 border-t border-dashed border-gray-100 pt-1">
                            <span className="text-[9px] bg-gray-50 text-[#1A4D2E] px-1 rounded font-extrabold">{cust.membershipLevel}</span>
                            <span className="text-[9px] text-[#1A4D2E]/60 font-black">₹{Math.round(cust.totalSpent)}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            /* Create Customer Form */
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-[#1A4D2E] uppercase tracking-wider ml-1">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter name"
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-gray-100 focus:border-[#1A4D2E] focus:outline-none transition-colors bg-white font-semibold text-gray-800"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-[#1A4D2E] uppercase tracking-wider ml-1">Phone Number *</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    required
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter phone number"
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-gray-100 focus:border-[#1A4D2E] focus:outline-none transition-colors bg-white font-semibold text-gray-800"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-[#1A4D2E] uppercase tracking-wider ml-1">Email (Optional)</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email address"
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-gray-100 focus:border-[#1A4D2E] focus:outline-none transition-colors bg-white font-semibold text-gray-800"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-[#1A4D2E] uppercase tracking-wider ml-1">Birthday (Optional)</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    value={formData.birthday}
                    onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-gray-100 focus:border-[#1A4D2E] focus:outline-none transition-colors bg-white font-semibold text-gray-800"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("search")}
                  className="flex-1 py-3.5 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition-colors text-sm"
                >
                  Back to Search
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-[#1A4D2E] text-white font-bold rounded-2xl hover:bg-[#143d24] transition-colors flex items-center justify-center gap-2 text-sm shadow-md"
                >
                  <Save className="h-4 w-4" />
                  Save & Continue
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
