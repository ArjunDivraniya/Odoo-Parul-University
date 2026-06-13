"use client";

import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Users, Monitor, CreditCard, List, Save, Plus, Trash2, Edit2, X, Check, Eye, EyeOff } from "lucide-react";
import CoffeeLoader from "@/components/ui/CoffeeLoader";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  // Modal States
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showTerminalModal, setShowTerminalModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

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

      const [settingsRes, usersRes, terminalsRes, catsRes] = await Promise.all([
        fetch(`${API_URL}/settings`, { headers }),
        fetch(`${API_URL}/users`, { headers }),
        fetch(`${API_URL}/terminals`, { headers }),
        fetch(`${API_URL}/products/categories`, { headers })
      ]);

      if (settingsRes.ok) setSettings(await settingsRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
      if (terminalsRes.ok) setTerminals(await terminalsRes.json());
      if (catsRes.ok) setCategories(await catsRes.json());

    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- Actions ---

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
        // Success feedback?
        // Maybe toast? For now native alert or just simple UI feedback
        // alert("Settings saved!");
      }
    } catch (error) {
      console.error("Save failed:", error);
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  // Users
  const handleSaveUser = async (userData) => {
    const payload = { ...userData };

    if (editingUser) {
      // When editing, remove empty password to avoid overwriting
      if (!payload.password) delete payload.password;
    } else {
      // When creating, password is required
      if (!payload.password || payload.password.length < 6) {
        alert('Password is required (at least 6 characters) when creating a new user.');
        return;
      }
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
    const token = localStorage.getItem('token');
    const method = editingUser ? 'PUT' : 'POST';
    const url = editingUser ? `${API_URL}/users/${editingUser.id}` : `${API_URL}/users`;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const result = await res.json();
        fetchData();
        setShowUserModal(false);
        setEditingUser(null);

        // Show credentials confirmation for newly created users
        if (!editingUser) {
          alert(`✅ User created successfully!\n\nName: ${userData.name}\nEmail: ${userData.email}\nPassword: ${userData.password}\nRole: ${userData.role}\n\nShare these credentials with the employee.`);
        }
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save user');
      }
    } catch (e) { alert(e.message); }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm("Delete this user?")) return;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
    const token = localStorage.getItem('token');
    await fetch(`${API_URL}/users/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    fetchData();
  };

  // Terminals
  const handleSaveTerminal = async (name) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/terminals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        fetchData();
        setShowTerminalModal(false);
      }
    } catch (e) { alert(e.message); }
  };

  const handleDeleteTerminal = async (id) => {
    if (!confirm("Delete this terminal?")) return;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
    const token = localStorage.getItem('token');
    await fetch(`${API_URL}/terminals/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    fetchData();
  };

  // Categories
  const handleSaveCategory = async (name) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/products/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        fetchData();
        setShowCategoryModal(false);
      }
    } catch (e) { alert(e.message); }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm("Delete this category?")) return;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/products/categories/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) {
      const err = await res.json();
      alert(err.error);
    } else {
      fetchData();
    }
  };


  const tabs = [
    { id: "general", label: "General", icon: SettingsIcon },
    { id: "users", label: "Users", icon: Users },
    { id: "terminals", label: "Terminals", icon: Monitor },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "categories", label: "Categories", icon: List },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <CoffeeLoader size="lg" text="Loading Settings..." />
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <section className="relative overflow-hidden rounded-[36px] bg-gradient-to-r from-[#0F291C] via-[#175236] to-[#1F5D3E] text-white p-8 shadow-[0_30px_70px_rgba(10,46,29,0.35)] border border-white/10">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3 max-w-2xl">
            <p className="text-xs uppercase tracking-[0.4em] text-white/70">Odoo Cafe · Control Room</p>
            <h2 className="text-4xl font-black leading-tight">System Settings</h2>
            <p className="text-white/80 text-lg">Configure your cafe ecosystem.</p>
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
          <div className="rounded-[30px] bg-white border border-[#E4E0D1] shadow-[0_20px_45px_rgba(26,77,46,0.08)] p-3 space-y-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition ${isActive ? "bg-[#1A4D2E] text-white shadow" : "text-[#1A4D2E] hover:bg-[#F3EEE2]"
                    }`}
                >
                  <span className="flex items-center gap-3">
                    <span className={`h-10 w-10 rounded-2xl flex items-center justify-center border ${isActive ? "border-white/40 bg-white/10" : "border-[#E4E0D1] bg-[#F7F4EB]"}`}>
                      <tab.icon className="h-5 w-5" />
                    </span>
                    {tab.label}
                  </span>
                  {isActive && <span className="h-2 w-2 rounded-full bg-white" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="rounded-[32px] bg-white border border-[#EFE8D8] shadow-[0_25px_60px_rgba(26,77,46,0.08)] p-8">

            {/* General */}
            {activeTab === "general" && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-coffee-800">General Identity</h3>
                <div className="space-y-4">
                  <div>
                    <label className="label">Cafe Name</label>
                    <input className="input-field" value={settings.cafeName || ""} onChange={e => setSettings({ ...settings, cafeName: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Receipt Footer</label>
                    <textarea className="input-field" rows={3} value={settings.receiptFooter || ""} onChange={e => setSettings({ ...settings, receiptFooter: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Currency Symbol</label>
                    <input className="input-field w-32" value={settings.currency || ""} onChange={e => setSettings({ ...settings, currency: e.target.value })} />
                  </div>
                </div>
              </div>
            )}

            {/* Users */}
            {activeTab === "users" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-coffee-800">Staff Members</h3>
                  <button onClick={() => { setEditingUser(null); setShowUserModal(true); }} className="btn-primary-sm"><Plus className="h-4 w-4" /> Add User</button>
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
                  <h3 className="text-2xl font-bold text-coffee-800">POS Terminals</h3>
                  <button onClick={() => setShowTerminalModal(true)} className="btn-primary-sm"><Plus className="h-4 w-4" /> Add Terminal</button>
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

            {/* Categories */}
            {activeTab === "categories" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-coffee-800">Product Categories</h3>
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
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-coffee-800">Payment Configuration</h3>
                <div className="space-y-3">
                  <label className="toggle-card">
                    <div className="flex items-center gap-3">
                      <div className="icon-box">💵</div>
                      <div>
                        <p className="font-bold">Cash</p>
                        <p className="text-sm text-gray-500">Physical currency</p>
                      </div>
                    </div>
                    <input type="checkbox" checked={settings.cashEnabled} onChange={e => setSettings({ ...settings, cashEnabled: e.target.checked })} className="toggle" />
                  </label>
                  <label className="toggle-card">
                    <div className="flex items-center gap-3">
                      <div className="icon-box"><CreditCard className="h-5 w-5" /></div>
                      <div>
                        <p className="font-bold">Card</p>
                        <p className="text-sm text-gray-500">Credit/Debit terminals</p>
                      </div>
                    </div>
                    <input type="checkbox" checked={settings.digitalEnabled} onChange={e => setSettings({ ...settings, digitalEnabled: e.target.checked })} className="toggle" />
                  </label>
                  <label className="toggle-card">
                    <div className="flex items-center gap-3">
                      <div className="icon-box">📱</div>
                      <div>
                        <p className="font-bold">UPI</p>
                        <p className="text-sm text-gray-500">QR Code payments</p>
                      </div>
                    </div>
                    <input type="checkbox" checked={settings.upiEnabled} onChange={e => setSettings({ ...settings, upiEnabled: e.target.checked })} className="toggle" />
                  </label>
                </div>
                {settings.upiEnabled && (
                  <div className="pt-4 border-t border-gray-100">
                    <label className="label">Default UPI ID</label>
                    <input className="input-field" placeholder="merchant@upi" value={settings.upiId || ""} onChange={e => setSettings({ ...settings, upiId: e.target.value })} />
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
          onClose={() => setShowUserModal(false)}
          onSave={handleSaveUser}
        />
      )}
      {showTerminalModal && (
        <InputModal
          title="Add Terminal"
          label="Terminal Name"
          onClose={() => setShowTerminalModal(false)}
          onSave={handleSaveTerminal}
        />
      )}
      {showCategoryModal && (
        <InputModal
          title="Add Category"
          label="Category Name"
          onClose={() => setShowCategoryModal(false)}
          onSave={handleSaveCategory}
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

function InputModal({ title, label, onClose, onSave }) {
  const [val, setVal] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-coffee-800">{title}</h3>
        <div>
          <label className="block text-sm font-bold text-gray-600 mb-2">{label}</label>
          <input autoFocus className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-coffee-600 outline-none" value={val} onChange={e => setVal(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 font-bold text-gray-500 bg-gray-100 rounded-xl">Cancel</button>
          <button onClick={() => onSave(val)} disabled={!val} className="flex-1 py-3 font-bold text-white bg-[#1A4D2E] rounded-xl">Save</button>
        </div>
      </div>
    </div>
  );
}

function UserModal({ user, onClose, onSave }) {
  const [data, setData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    role: user?.role || "EMPLOYEE",
    password: ""
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-md p-8 space-y-5" onClick={e => e.stopPropagation()}>
        <h3 className="text-2xl font-bold text-coffee-800">{user ? "Edit User" : "Add New User"}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1">Full Name</label>
            <input className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-coffee-600 outline-none" value={data.name} onChange={e => setData({ ...data, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1">Email</label>
            <input type="email" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-coffee-600 outline-none" value={data.email} onChange={e => setData({ ...data, email: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1">Role</label>
            <select className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-coffee-600 outline-none bg-white" value={data.role} onChange={e => setData({ ...data, role: e.target.value })}>
              <option value="EMPLOYEE">Cashier</option>
              <option value="KITCHEN">Kitchen</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1">{user ? "New Password (Optional)" : "Password"}</label>
            <input type="password" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-coffee-600 outline-none" value={data.password} onChange={e => setData({ ...data, password: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-3 font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">Cancel</button>
          <button onClick={() => onSave(data)} className="flex-1 py-3 font-bold text-white bg-[#1A4D2E] rounded-xl hover:bg-[#143D24]">Save User</button>
        </div>
      </div>
    </div>
  );
}
