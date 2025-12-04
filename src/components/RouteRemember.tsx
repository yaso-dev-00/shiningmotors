"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { storeRedirectPath } from "@/lib/utils/routeRemember";

/**
 * Component that stores the current route when user is not authenticated
 * This allows users to be redirected back to the page after login
 * Use this for public routes that should remember the path after authentication
 */
export const RouteRemember = () => {
  const pathname = usePathname();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    // Only store route if user is not authenticated and not loading
    // Don't store auth pages or already stored routes
    if (!loading && !isAuthenticated && pathname) {
      const authPages = ["/auth", "/admin/login"];
      if (!authPages.includes(pathname)) {
        storeRedirectPath(pathname);
      }
    }
  }, [pathname, isAuthenticated, loading]);

  return null;
};


