"use client";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { storeRedirectPath } from "@/lib/utils/routeRemember";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    // Store the current route BEFORE redirecting
    if (pathname && pathname !== "/auth") {
      storeRedirectPath(pathname);
    }
    router.replace("/auth");
    return null;
  }
  
  return <>{children}</>;
};
