"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { Route } from "next";
import { useAuth } from "@/contexts/AuthContext";
import { storeRedirectPath } from "@/lib/utils/routeRemember";

export default function VendorDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      // Store the current route before redirecting
      if (pathname && pathname !== "/auth") {
        storeRedirectPath(pathname);
      }
      router.replace("/auth" as Route);
      return;
    }
  }, [loading, user, router, pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-red-600"></div>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}





