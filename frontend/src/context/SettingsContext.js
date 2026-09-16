
"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getSocket } from "@/lib/socket";

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    cafeName: "",
    receiptFooter: "Thank you for your visit!",
    currency: "₹",
    cashEnabled: true,
    digitalEnabled: true,
    upiEnabled: true,
    upiId: "",
  });
  const [loading, setLoading] = useState(true);

  // Synchronously load cached settings on initial mount for 0ms instant display
  useEffect(() => {
    try {
      const cached = localStorage.getItem("app_settings");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.cafeName) {
          setSettings(parsed);
          setLoading(false);
        }
      }
    } catch (e) {
      console.error("Error reading cached settings:", e);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api";
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(`${API_URL}/settings`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data && data.cafeName) {
          setSettings(data);
          try {
            localStorage.setItem("app_settings", JSON.stringify(data));
          } catch (e) {}
        }
      }
    } catch (err) {
      console.error("Failed to fetch settings in SettingsContext:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Real-time socket listener for settings update across system
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleSettingsUpdate = (updatedSettings) => {
      if (updatedSettings && updatedSettings.cafeName) {
        setSettings(updatedSettings);
        try {
          localStorage.setItem("app_settings", JSON.stringify(updatedSettings));
        } catch (e) {}
      } else {
        fetchSettings();
      }
    };

    socket.on("settings_updated", handleSettingsUpdate);
    socket.on("dashboard_updated", fetchSettings);

    return () => {
      socket.off("settings_updated", handleSettingsUpdate);
      socket.off("dashboard_updated", fetchSettings);
    };
  }, [fetchSettings]);

  // Dynamically update document title if present
  useEffect(() => {
    if (typeof document !== "undefined" && settings.cafeName) {
      document.title = `${settings.cafeName} POS | Smart Point-of-Sale`;
    }
  }, [settings.cafeName]);

  const cafeName = settings.cafeName || "";
  const currency = settings.currency || "₹";
  const receiptFooter = settings.receiptFooter || "Thank you for your visit!";

  const updateSettingsState = useCallback((newSettings) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem("app_settings", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        cafeName,
        currency,
        receiptFooter,
        loading,
        fetchSettings,
        updateSettingsState,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    // Provide a fallback so components don't crash if rendered outside provider
    return {
      settings: { cafeName: "", currency: "₹" },
      cafeName: "",
      currency: "₹",
      receiptFooter: "Thank you for your visit!",
      loading: false,
      fetchSettings: () => {},
      updateSettingsState: () => {},
    };
  }
  return context;
};
