"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Route } from "next";
import { useAuth } from "@/contexts/AuthContext";
import { storeRedirectPath } from "@/lib/utils/routeRemember";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, userRole } = useAuth();

  const isLoginPage = pathname === "/admin/login";

  const isAuthorized = useMemo(() => {
    if (!user) return false;
    return userRole === "ADMIN";
  }, [user, userRole]);

  useEffect(() => {
    // Allow the login page to be accessed without any guard
    if (isLoginPage) return;

    if (loading || (user && userRole == null)) return;
    if (!user) {
      // Store the current route before redirecting
      if (pathname && pathname !== "/admin/login") {
        storeRedirectPath(pathname);
      }
      router.replace("/admin/login" as Route);
      return;
    }
    if (!isAuthorized) {
      router.replace("/" as Route);
    }
  }, [loading, user, userRole, isAuthorized, router, isLoginPage, pathname]);

  // For the login page, just render children (no auth required)
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading || (user && userRole == null)) return null;
  if (!user || !isAuthorized) return null;

  return <>{children}</>;
}


