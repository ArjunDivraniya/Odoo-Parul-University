"use client";

import POSSidebar from "@/components/pos/POSSidebar";
import AuthGuard from "@/components/auth/AuthGuard";

export default function POSLayout({ children }) {
  return (
    <AuthGuard allowedRoles={["EMPLOYEE", "CASHIER", "ADMIN"]}>
      <div className="flex h-screen bg-beige-100 overflow-hidden">
        <POSSidebar />
        <main className="flex-1 h-screen overflow-hidden bg-beige-100 p-6 flex flex-col">
          <div className="w-full flex-1 min-h-0 flex flex-col">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}

