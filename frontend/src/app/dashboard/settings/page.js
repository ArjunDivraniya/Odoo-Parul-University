"use client";

import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Users, Monitor, CreditCard, List, Save, Plus, Trash2, Edit2, X, Check, MapPin } from "lucide-react";
import CoffeeLoader from "@/components/ui/CoffeeLoader";
import { usePopup } from "@/context/PopupContext";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast, showAlert, showConfirm } = usePopup();

  // Data States
  const [settings, setSettings] = useState({
    cafeName: "",
    receiptFooter: "",
    currency: "₹",
    cashEnabled: true,
    digitalEnabled: true,
    upiEnabled: true,
    upiId: "",
  });
  const [users, setUsers] = useState([]);
  const [terminals, setTerminals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [floors, setFloors] = useState([]);

  // Modal States
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showTerminalModal, setShowTerminalModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showFloorModal, setShowFloorModal] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [selectedFloorForTable, setSelectedFloorForTable] = useState(null);

  // Initial Fetch
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [settingsRes, usersRes, terminalsRes, catsRes, floorsRes] = await Promise.all([
        fetch(`${API_URL}/settings`, { headers }),
        fetch(`${API_URL}/users`, { headers }),
        fetch(`${API_URL}/terminals`, { headers }),
        fetch(`${API_URL}/products/categories`, { headers }),
        fetch(`${API_URL}/floors`, { headers })
      ]);

      if (settingsRes.ok) setSettings(await settingsRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
      if (terminalsRes.ok) setTerminals(await terminalsRes.json());
      if (catsRes.ok) setCategories(await catsRes.json());
      if (floorsRes.ok) setFloors(await floorsRes.json());

    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- Actions ---

  const formatErrorMessage = (err) => {
    if (!err) return "An unknown error occurred.";
    if (typeof err === "string") return err;
    if (typeof err.error === "string") return err.error;
    if (Array.isArray(err.error)) {
      return err.error.map(e => {
        const fieldName = e.path && e.path.length > 0 ? e.path[e.path.length - 1] : "";
        return `${fieldName ? fieldName + ": " : ""}${e.message}`;
      }).join("\n");
    }
    if (err.message) return err.message;
    return JSON.stringify(err);
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        showToast("Settings saved successfully!", "success");
      } else {
        const err = await response.json();
        showAlert(formatErrorMessage(err), "Save Settings", "error");
      }
    } catch (error) {
      console.error("Save failed:", error);
      showAlert(error.message, "Save Settings", "error");
    } finally {
      setSaving(false);
    }
  };

  // Users
  const handleSaveUser = async (userData) => {
    const payload = { ...userData };
    if (!payload.password) delete payload.password;

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
    const token = localStorage.getItem('token');
    const method = editingUser ? 'PUT' : 'POST';
    const url = editingUser ? `${API_URL}/users/${editingUser.id}` : `${API_URL}/users`;

    setSaving(true);
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await fetchData();
        setShowUserModal(false);
        setEditingUser(null);
        showToast(`User ${editingUser ? "updated" : "created"} successfully!`, "success");
      } else {
        const err = await res.json();
        showAlert(formatErrorMessage(err), "User Settings", "error");
      }
    } catch (e) { 
      showAlert(e.message, "User Settings", "error"); 
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (id) => {
    const confirmed = await showConfirm("Are you sure you want to delete this user?", "Delete User");
    if (!confirmed) return;
    setSaving(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/users/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        showToast("User deleted successfully", "success");
        await fetchData();
      } else {
        const err = await res.json();
        showAlert(formatErrorMessage(err), "Delete User", "error");
      }
    } catch (e) {
      showAlert(e.message, "Delete User", "error");
    } finally {
      setSaving(false);
    }
  };

  // Terminals
  const handleSaveTerminal = async (name) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
    const token = localStorage.getItem('token');
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/terminals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        await fetchData();
        setShowTerminalModal(false);
        showToast("Terminal created successfully", "success");
      } else {
        const err = await res.json();
        showAlert(formatErrorMessage(err), "Terminal Settings", "error");
      }
    } catch (e) { 
      showAlert(e.message, "Terminal Settings", "error"); 
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTerminal = async (id) => {
    const confirmed = await showConfirm("Are you sure you want to delete this terminal?", "Delete Terminal");
    if (!confirmed) return;
    setSaving(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/terminals/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        showToast("Terminal deleted successfully", "success");
        await fetchData();
      } else {
        const err = await res.json();
        showAlert(formatErrorMessage(err), "Delete Terminal", "error");
      }
    } catch (e) {
      showAlert(e.message, "Delete Terminal", "error");
    } finally {
      setSaving(false);
    }
  };

  // Categories
  const handleSaveCategory = async (name) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
    const token = localStorage.getItem('token');
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/products/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        await fetchData();
        setShowCategoryModal(false);
        showToast("Category created successfully", "success");
      } else {
        const err = await res.json();
        showAlert(formatErrorMessage(err), "Category Settings", "error");
      }
    } catch (e) { 
      showAlert(e.message, "Category Settings", "error"); 
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    const confirmed = await showConfirm("Are you sure you want to delete this category?", "Delete Category");
    if (!confirmed) return;
    setSaving(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/products/categories/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) {
        const err = await res.json();
        showAlert(formatErrorMessage(err), "Category Settings", "error");
      } else {
        showToast("Category deleted successfully", "success");
        await fetchData();
      }
    } catch (e) {
      showAlert(e.message, "Category Settings", "error");
    } finally {
      setSaving(false);
    }
  };

  // Floors
  const handleSaveFloor = async (name) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
    const token = localStorage.getItem('token');
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/floors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        await fetchData();
        setShowFloorModal(false);
        showToast("Floor created successfully", "success");
      } else {
        const err = await res.json();
        showAlert(formatErrorMessage(err), "Floor Settings", "error");
      }
    } catch (e) { 
      showAlert(e.message, "Floor Settings", "error"); 
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFloor = async (id) => {
    const confirmed = await showConfirm("Are you sure you want to delete this floor and all its tables?", "Delete Floor");
    if (!confirmed) return;
    setSaving(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/floors/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        showToast("Floor deleted successfully", "success");
        await fetchData();
      } else {
        const err = await res.json();
        showAlert(formatErrorMessage(err), "Floor Settings", "error");
      }
    } catch (e) {
      showAlert(e.message, "Floor Settings", "error");
    } finally {
      setSaving(false);
    }
  };

  // Tables
  const handleSaveTable = async (name, seats) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
    const token = localStorage.getItem('token');
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/floors/${selectedFloorForTable}/tables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name, seats })
      });
      if (res.ok) {
        await fetchData();
        setShowTableModal(false);
        setSelectedFloorForTable(null);
        showToast("Table created successfully", "success");
      } else {
        const err = await res.json();
        showAlert(formatErrorMessage(err), "Table Settings", "error");
      }
    } catch (e) { 
      showAlert(e.message, "Table Settings", "error"); 
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTable = async (id) => {
    const confirmed = await showConfirm("Are you sure you want to delete this table?", "Delete Table");
    if (!confirmed) return;
    setSaving(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/tables/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        showToast("Table deleted successfully", "success");
        await fetchData();
      } else {
        const err = await res.json();
        showAlert(formatErrorMessage(err), "Table Settings", "error");
      }
    } catch (e) {
      showAlert(e.message, "Table Settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "general", label: "My Cafe", icon: SettingsIcon, desc: "Name, currency & receipts" },
    { id: "users", label: "Team", icon: Users, desc: "Staff & roles" },
    { id: "terminals", label: "POS Devices", icon: Monitor, desc: "Order terminals" },
    { id: "tables", label: "Dine-In Layout", icon: MapPin, desc: "Floors & tables" },
    { id: "payments", label: "Billing", icon: CreditCard, desc: "Payment methods" },
    { id: "categories", label: "Menu Groups", icon: List, desc: "Product categories" },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <CoffeeLoader size="lg" text="Loading Settings..." />
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <section className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-[#0F291C] via-[#175236] to-[#1F5D3E] text-white p-8 shadow-[0_16px_48px_rgba(10,46,29,0.30)] border border-white/10">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Odoo Cafe · Settings</p>
            <h2 className="text-3xl font-extrabold leading-tight">Cafe Settings</h2>
            <p className="text-white/70 text-base">Manage everything about your cafe — from branding to billing.</p>
          </div>
          {(activeTab === "general" || activeTab === "payments") && (
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-[#1A4D2E] font-semibold shadow-[0_20px_45px_rgba(0,0,0,0.2)] hover:bg-gray-100 transition-colors"
            >
              <Save className="h-5 w-5" /> {saving ? "Saving..." : "Save Changes"}
            </button>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="rounded-[24px] bg-white border border-[#e8e5d8] shadow-sm p-2.5 space-y-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all ${isActive ? "bg-[#1A4D2E] text-white shadow-md" : "text-[#1A4D2E] hover:bg-[#f5f3ea]"
                    }`}
                >
                  <span className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isActive ? "bg-white/15" : "bg-[#f5f3ea] border border-[#e8e5d8]"}`}>
                    <tab.icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold leading-tight ${isActive ? "text-white" : "text-[#1A4D2E]"}`}>{tab.label}</p>
                    <p className={`text-[10px] leading-tight mt-0.5 ${isActive ? "text-white/60" : "text-[#8a8778]"}`}>{tab.desc}</p>
                  </div>
                  {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="rounded-[24px] bg-white border border-[#e8e5d8] shadow-sm p-6 lg:p-8">

            {/* General */}
            {activeTab === "general" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-4 border-b border-[#F3EEE2] pb-6">
                  <div className="h-14 w-14 rounded-2xl bg-[#F7F4EB] flex items-center justify-center border border-[#E4E0D1] shadow-sm">
                    <SettingsIcon className="h-7 w-7 text-[#1A4D2E]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#1A4D2E]">Cafe Details</h3>
                    <p className="text-[#5F6F65] text-sm">Your cafe's name, currency, and what appears on receipts.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="group">
                      <label className="flex items-center gap-2 text-sm font-bold text-[#1A4D2E] mb-2 group-focus-within:text-[#175236] transition-colors">
                        <Monitor className="h-4 w-4" />
                        Cafe Name
                      </label>
                      <input 
                        className="w-full px-5 py-4 rounded-[20px] border-2 border-[#EFE8D8] bg-[#FDFCF7] focus:border-[#1A4D2E] focus:bg-white focus:outline-none transition-all shadow-sm placeholder-[#A39E8D]"
                        placeholder="e.g. Odoo Cafe"
                        value={settings.cafeName || ""} 
                        onChange={e => setSettings({ ...settings, cafeName: e.target.value })} 
                      />
                      <p className="mt-2 text-[11px] text-[#8C8775] px-1 font-medium italic">This name will appear on your dashboard and customer receipts.</p>
                    </div>

                    <div className="group">
                      <label className="flex items-center gap-2 text-sm font-bold text-[#1A4D2E] mb-2">
                        <span className="text-lg">₹</span>
                        Currency Symbol
                      </label>
                      <input 
                        className="w-32 px-5 py-4 rounded-[20px] border-2 border-[#EFE8D8] bg-[#FDFCF7] focus:border-[#1A4D2E] focus:bg-white focus:outline-none transition-all shadow-sm text-center font-bold text-lg"
                        placeholder="₹"
                        value={settings.currency || ""} 
                        onChange={e => setSettings({ ...settings, currency: e.target.value })} 
                      />
                    </div>
                  </div>

                  <div className="group">
                    <label className="flex items-center gap-2 text-sm font-bold text-[#1A4D2E] mb-2">
                      <List className="h-4 w-4" />
                      Receipt Footer Message
                    </label>
                    <textarea 
                      className="w-full px-5 py-4 rounded-[24px] border-2 border-[#EFE8D8] bg-[#FDFCF7] focus:border-[#1A4D2E] focus:bg-white focus:outline-none transition-all shadow-sm min-h-[160px] resize-none"
                      placeholder="e.g. Thank you for visiting! Please visit again."
                      rows={5} 
                      value={settings.receiptFooter || ""} 
                      onChange={e => setSettings({ ...settings, receiptFooter: e.target.value })} 
                    />
                    <div className="flex justify-between mt-2 px-1">
                      <p className="text-[11px] text-[#8C8775] font-medium italic">A personal note for your customers at the end of their bill.</p>
                      <p className="text-[10px] font-bold text-[#1A4D2E]/40 uppercase tracking-widest">{settings.receiptFooter?.length || 0}/200</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Users */}
            {activeTab === "users" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-[#1A4D2E]">Your Team</h3>
                  <button onClick={() => { setEditingUser(null); setShowUserModal(true); }} className="btn-primary-sm"><Plus className="h-4 w-4" /> Add Staff</button>
                </div>
                <div className="overflow-hidden rounded-2xl border border-gray-100">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-bold">
                      <tr>
                        <th className="p-4">Name</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Role</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-gray-50">
                          <td className="p-4 font-semibold text-coffee-800">{u.name}</td>
                          <td className="p-4 text-gray-500">{u.email}</td>
                          <td className="p-4"><span className="badge">{u.role}</span></td>
                          <td className="p-4 text-right flex justify-end gap-2">
                            <button onClick={() => { setEditingUser(u); setShowUserModal(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="h-4 w-4" /></button>
                            <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Terminals */}
            {activeTab === "terminals" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-[#1A4D2E]">Order Devices</h3>
                  <button onClick={() => setShowTerminalModal(true)} className="btn-primary-sm"><Plus className="h-4 w-4" /> Add Device</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {terminals.map(t => (
                    <div key={t.id} className="p-5 rounded-2xl border border-gray-200 flex justify-between items-center bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                          <Monitor className="h-5 w-5 text-coffee-600" />
                        </div>
                        <span className="font-bold text-coffee-800">{t.name}</span>
                      </div>
                      <button onClick={() => handleDeleteTerminal(t.id)} className="text-red-400 hover:text-red-600"><Trash2 className="h-5 w-5" /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tables & Floors */}
            {activeTab === "tables" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-[#1A4D2E]">Your Cafe Layout</h3>
                  <button onClick={() => setShowFloorModal(true)} className="btn-primary-sm"><Plus className="h-4 w-4" /> Add Floor</button>
                </div>

                <div className="space-y-8">
                  {floors.map(floor => (
                    <div key={floor.id} className="p-6 rounded-[2rem] border border-gray-200 bg-gray-50/50 space-y-4">
                      <div className="flex justify-between items-center border-b pb-3 border-gray-100">
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold text-[#1A4D2E]">{floor.name}</span>
                          <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">{floor.tables?.length || 0} tables</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setSelectedFloorForTable(floor.id); setShowTableModal(true); }}
                            className="px-3 py-1.5 bg-[#1A4D2E] hover:bg-[#143d24] text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
                          >
                            <Plus className="h-3.5 w-3.5" /> Add Table
                          </button>
                          <button onClick={() => handleDeleteFloor(floor.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {floor.tables?.map(table => (
                          <div key={table.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center shadow-sm">
                            <div>
                              <p className="font-bold text-coffee-800">{table.name}</p>
                              <p className="text-xs text-gray-500">{table.seats} Seats • {table.status || 'AVAILABLE'}</p>
                            </div>
                            <button onClick={() => handleDeleteTable(table.id)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        ))}
                        {(!floor.tables || floor.tables.length === 0) && (
                          <p className="text-xs text-gray-400 italic py-2 col-span-full">No tables on this floor yet.</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {floors.length === 0 && (
                    <p className="text-center text-gray-400 italic py-8">No floors created yet. Add a floor to get started!</p>
                  )}
                </div>
              </div>
            )}

            {/* Categories */}
            {activeTab === "categories" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-[#1A4D2E]">Menu Categories</h3>
                  <button onClick={() => setShowCategoryModal(true)} className="btn-primary-sm"><Plus className="h-4 w-4" /> Add Category</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map(c => (
                    <div key={c.id} className="p-4 rounded-2xl border border-gray-100 flex justify-between items-center hover:shadow-md transition bg-white">
                      <span className="font-semibold text-coffee-700">{c.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">{c._count?.products || 0} items</span>
                        <button onClick={() => handleDeleteCategory(c.id)} className="text-red-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payments */}
            {activeTab === "payments" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-4 border-b border-[#F3EEE2] pb-6">
                  <div className="h-14 w-14 rounded-2xl bg-[#F7F4EB] flex items-center justify-center border border-[#E4E0D1] shadow-sm">
                    <CreditCard className="h-7 w-7 text-[#1A4D2E]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#1A4D2E]">How Customers Pay</h3>
                    <p className="text-[#5F6F65] text-sm">Toggle payment methods your cafe accepts.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Cash Method */}
                  <div 
                    onClick={() => setSettings({ ...settings, cashEnabled: !settings.cashEnabled })}
                    className={`relative overflow-hidden cursor-pointer group p-6 rounded-[28px] border-2 transition-all duration-300 ${
                      settings.cashEnabled 
                        ? "border-[#1A4D2E] bg-[#F7FBF9] shadow-[0_15px_35px_rgba(26,77,46,0.1)]" 
                        : "border-[#EFE8D8] bg-white hover:border-[#D1C9B0] grayscale"
                    }`}
                  >
                    <div className="flex flex-col gap-4 relative z-10">
                      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-colors ${
                        settings.cashEnabled ? "bg-[#1A4D2E] text-white" : "bg-[#F3EEE2] text-[#8C8775]"
                      }`}>
                        <span className="text-2xl">💵</span>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-bold text-[#1A4D2E]">Cash Payment</h4>
                          <div className={`h-5 w-10 rounded-full flex items-center px-1 transition-colors ${
                            settings.cashEnabled ? "bg-[#1A4D2E]" : "bg-[#D1C9B0]"
                          }`}>
                            <div className={`h-3 w-3 rounded-full bg-white transition-transform ${
                              settings.cashEnabled ? "translate-x-5" : "translate-x-0"
                            }`} />
                          </div>
                        </div>
                        <p className="text-[11px] font-medium text-[#5F6F65] leading-relaxed">Accept physical currency directly at the counter.</p>
                      </div>
                    </div>
                    {settings.cashEnabled && (
                      <div className="absolute -right-4 -bottom-4 h-24 w-24 bg-[#1A4D2E]/5 rounded-full blur-2xl" />
                    )}
                  </div>

                  {/* Card Method */}
                  <div 
                    onClick={() => setSettings({ ...settings, digitalEnabled: !settings.digitalEnabled })}
                    className={`relative overflow-hidden cursor-pointer group p-6 rounded-[28px] border-2 transition-all duration-300 ${
                      settings.digitalEnabled 
                        ? "border-[#1A4D2E] bg-[#F7FBF9] shadow-[0_15px_35px_rgba(26,77,46,0.1)]" 
                        : "border-[#EFE8D8] bg-white hover:border-[#D1C9B0] grayscale"
                    }`}
                  >
                    <div className="flex flex-col gap-4 relative z-10">
                      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-colors ${
                        settings.digitalEnabled ? "bg-[#1A4D2E] text-white" : "bg-[#F3EEE2] text-[#8C8775]"
                      }`}>
                        <CreditCard className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-bold text-[#1A4D2E]">Card / POS</h4>
                          <div className={`h-5 w-10 rounded-full flex items-center px-1 transition-colors ${
                            settings.digitalEnabled ? "bg-[#1A4D2E]" : "bg-[#D1C9B0]"
                          }`}>
                            <div className={`h-3 w-3 rounded-full bg-white transition-transform ${
                              settings.digitalEnabled ? "translate-x-5" : "translate-x-0"
                            }`} />
                          </div>
                        </div>
                        <p className="text-[11px] font-medium text-[#5F6F65] leading-relaxed">Enable card swipes via external machine or integrated POS.</p>
                      </div>
                    </div>
                    {settings.digitalEnabled && (
                      <div className="absolute -right-4 -bottom-4 h-24 w-24 bg-[#1A4D2E]/5 rounded-full blur-2xl" />
                    )}
                  </div>

                  {/* UPI Method */}
                  <div 
                    onClick={() => setSettings({ ...settings, upiEnabled: !settings.upiEnabled })}
                    className={`relative overflow-hidden cursor-pointer group p-6 rounded-[28px] border-2 transition-all duration-300 ${
                      settings.upiEnabled 
                        ? "border-[#1A4D2E] bg-[#F7FBF9] shadow-[0_15px_35px_rgba(26,77,46,0.1)]" 
                        : "border-[#EFE8D8] bg-white hover:border-[#D1C9B0] grayscale"
                    }`}
                  >
                    <div className="flex flex-col gap-4 relative z-10">
                      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-colors ${
                        settings.upiEnabled ? "bg-[#1A4D2E] text-white" : "bg-[#F3EEE2] text-[#8C8775]"
                      }`}>
                        <span className="text-2xl">📱</span>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-bold text-[#1A4D2E]">UPI / QR</h4>
                          <div className={`h-5 w-10 rounded-full flex items-center px-1 transition-colors ${
                            settings.upiEnabled ? "bg-[#1A4D2E]" : "bg-[#D1C9B0]"
                          }`}>
                            <div className={`h-3 w-3 rounded-full bg-white transition-transform ${
                              settings.upiEnabled ? "translate-x-5" : "translate-x-0"
                            }`} />
                          </div>
                        </div>
                        <p className="text-[11px] font-medium text-[#5F6F65] leading-relaxed">Customers can scan QR to pay via any UPI app (PhonePe, GPay, etc.)</p>
                      </div>
                    </div>
                    {settings.upiEnabled && (
                      <div className="absolute -right-4 -bottom-4 h-24 w-24 bg-[#1A4D2E]/5 rounded-full blur-2xl" />
                    )}
                  </div>
                </div>

                {settings.upiEnabled && (
                  <div className="p-8 rounded-[32px] border-2 border-dashed border-[#E4E0D1] bg-[#FDFCF7] animate-in zoom-in-95 duration-300">
                    <div className="max-w-md">
                      <label className="flex items-center gap-2 text-sm font-bold text-[#1A4D2E] mb-3">
                        <span className="h-6 w-6 rounded-lg bg-[#1A4D2E] text-white flex items-center justify-center text-[10px]">QR</span>
                        Default Merchant UPI ID
                      </label>
                      <div className="relative">
                        <input 
                          className="w-full px-6 py-4 rounded-2xl border-2 border-[#EFE8D8] focus:border-[#1A4D2E] focus:outline-none bg-white font-mono text-sm tracking-wider" 
                          placeholder="merchant@upi" 
                          value={settings.upiId || ""} 
                          onChange={e => setSettings({ ...settings, upiId: e.target.value })} 
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                           {settings.upiId && <Check className="h-4 w-4 text-[#1A4D2E]" />}
                        </div>
                      </div>
                      <p className="mt-3 text-[11px] text-[#8C8775] font-medium">This ID will be used to generate dynamic QR codes for customers at checkout.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Modals */}
      {showUserModal && (
        <UserModal
          user={editingUser}
          saving={saving}
          onClose={() => setShowUserModal(false)}
          onSave={handleSaveUser}
        />
      )}
      {showTerminalModal && (
        <InputModal
          title="Add Terminal"
          label="Terminal Name"
          saving={saving}
          onClose={() => setShowTerminalModal(false)}
          onSave={handleSaveTerminal}
        />
      )}
      {showCategoryModal && (
        <InputModal
          title="Add Category"
          label="Category Name"
          saving={saving}
          onClose={() => setShowCategoryModal(false)}
          onSave={handleSaveCategory}
        />
      )}
      {showFloorModal && (
        <InputModal
          title="Add Floor"
          label="Floor Name"
          saving={saving}
          onClose={() => setShowFloorModal(false)}
          onSave={handleSaveFloor}
        />
      )}
      {showTableModal && (
        <TableModal
          saving={saving}
          onClose={() => setShowTableModal(false)}
          onSave={handleSaveTable}
        />
      )}

      {/* Styles */}
      <style jsx>{`
        .label { @apply block text-sm font-bold text-coffee-700 mb-2; }
        .input-field { @apply w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-coffee-600 focus:outline-none transition-colors; }
        .btn-primary-sm { @apply px-4 py-2 bg-[#1A4D2E] text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-[#143D24]; }
        .badge { @apply px-2 py-1 rounded-md bg-gray-100 text-xs font-bold text-gray-600 uppercase; }
        .toggle-card { @apply flex items-center justify-between p-4 bg-gray-50 rounded-2xl cursor-pointer hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all; }
        .icon-box { @apply h-10 w-10 bg-white rounded-xl flex items-center justify-center text-coffee-700 shadow-sm; }
        .toggle { @apply w-6 h-6 accent-[#1A4D2E]; }
      `}</style>
    </div>
  );
}

// --- Sub Components ---

function InputModal({ title, label, onClose, onSave, saving }) {
  const [val, setVal] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={saving ? undefined : onClose}>
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-coffee-800">{title}</h3>
        <div>
          <label className="block text-sm font-bold text-gray-600 mb-2">{label}</label>
          <input 
            autoFocus 
            disabled={saving}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-coffee-600 outline-none disabled:opacity-50" 
            value={val} 
            onChange={e => setVal(e.target.value)} 
          />
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} disabled={saving} className="flex-1 py-3 font-bold text-gray-500 bg-gray-100 rounded-xl disabled:opacity-50">Cancel</button>
          <button onClick={() => onSave(val)} disabled={!val || saving} className="flex-1 py-3 font-bold text-white bg-[#1A4D2E] rounded-xl disabled:opacity-50">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TableModal({ onClose, onSave, saving }) {
  const [name, setName] = useState("");
  const [seats, setSeats] = useState("4");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={saving ? undefined : onClose}>
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-coffee-800">Add Table</h3>
        <div>
          <label className="block text-sm font-bold text-gray-600 mb-2">Table Name</label>
          <input 
            autoFocus 
            disabled={saving}
            placeholder="e.g. Table 1" 
            className="w-full px-4 py-2 border rounded-xl outline-none focus:border-[#1A4D2E] disabled:opacity-50" 
            value={name} 
            onChange={e => setName(e.target.value)} 
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-600 mb-1">Seats Count</label>
          <input 
            type="number" 
            disabled={saving}
            className="w-full px-4 py-2 border rounded-xl outline-none focus:border-[#1A4D2E] disabled:opacity-50" 
            value={seats} 
            onChange={e => setSeats(e.target.value)} 
          />
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} disabled={saving} className="flex-1 py-3 font-bold text-gray-500 bg-gray-100 rounded-xl disabled:opacity-50">Cancel</button>
          <button onClick={() => onSave(name, Number(seats))} disabled={!name || !seats || saving} className="flex-1 py-3 font-bold text-white bg-[#1A4D2E] rounded-xl disabled:opacity-50">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function UserModal({ user, onClose, onSave, saving }) {
  const [data, setData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    role: user?.role || "EMPLOYEE",
    password: ""
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={saving ? undefined : onClose}>
      <div className="bg-white rounded-3xl w-full max-w-md p-8 space-y-5" onClick={e => e.stopPropagation()}>
        <h3 className="text-2xl font-bold text-coffee-800">{user ? "Edit User" : "Add New User"}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1">Full Name</label>
            <input 
              disabled={saving}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-coffee-600 outline-none disabled:opacity-50" 
              value={data.name} 
              onChange={e => setData({ ...data, name: e.target.value })} 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1">Email</label>
            <input 
              type="email" 
              disabled={saving}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-coffee-600 outline-none disabled:opacity-50" 
              value={data.email} 
              onChange={e => setData({ ...data, email: e.target.value })} 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1">Role</label>
            <select 
              disabled={saving}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-coffee-600 outline-none bg-white disabled:opacity-50" 
              value={data.role} 
              onChange={e => setData({ ...data, role: e.target.value })}
            >
              <option value="EMPLOYEE">Cashier</option>
              <option value="KITCHEN">Kitchen</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1">{user ? "New Password (Optional)" : "Password"}</label>
            <input 
              type="password" 
              disabled={saving}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-coffee-600 outline-none disabled:opacity-50" 
              value={data.password} 
              onChange={e => setData({ ...data, password: e.target.value })} 
            />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} disabled={saving} className="flex-1 py-3 font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 disabled:opacity-50">Cancel</button>
          <button onClick={() => onSave(data)} disabled={saving} className="flex-1 py-3 font-bold text-white bg-[#1A4D2E] rounded-xl hover:bg-[#143D24] disabled:opacity-50">
            {saving ? "Saving..." : "Save User"}
          </button>
        </div>
      </div>
    </div>
  );
}
