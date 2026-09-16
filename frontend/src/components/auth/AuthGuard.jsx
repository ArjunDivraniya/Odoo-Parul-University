"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { Loader2 } from "lucide-react";

export default function AuthGuard({ children, allowedRoles = [] }) {
  const { user, token, isInitializing } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isInitializing) return;

    if (!token && !user) {
      router.replace("/login");
      return;
    }

    if (user && allowedRoles.length > 0) {
      const userRole = (user.role || "").toUpperCase();
      const isAllowed = allowedRoles.some((r) => r.toUpperCase() === userRole);

      if (!isAllowed) {
        if (userRole === "KITCHEN") {
          router.replace("/kitchen");
        } else if (userRole === "EMPLOYEE" || userRole === "CASHIER") {
          router.replace("/pos/session");
        } else if (userRole === "ADMIN") {
          router.replace("/dashboard");
        } else {
          router.replace("/login");
        }
      }
    }
  }, [user, token, isInitializing, allowedRoles, router, pathname]);

  if (isInitializing) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-beige-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-coffee-dark" />
          <p className="text-sm font-medium text-coffee-dark/70">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!user || (allowedRoles.length > 0 && !allowedRoles.map((r) => r.toUpperCase()).includes((user.role || "").toUpperCase()))) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-beige-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-coffee-dark" />
          <p className="text-sm font-medium text-coffee-dark/70">Redirecting...</p>
        </div>
      </div>
    );
  }

  return children;
}
