"use client";

import AuthGuard from "@/components/auth/AuthGuard";

export default function KitchenLayout({ children }) {
  return (
    <AuthGuard allowedRoles={["KITCHEN", "ADMIN"]}>
      <div className="h-screen bg-[#F8F9FA] overflow-hidden">
        {children}
      </div>
    </AuthGuard>
  );
}

