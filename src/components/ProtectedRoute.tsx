"use client";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { storeRedirectPath } from "@/lib/utils/routeRemember";
import { useEffect, useState } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, loading, session, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  
  useEffect(() => {
    // Wait for auth to finish loading
    if (!loading) {
      // Double-check session is actually valid
      if (!isAuthenticated || !session || !user) {
        setIsChecking(false);
      } else {
        // Verify session hasn't expired
        const now = Math.floor(Date.now() / 1000);
        if (session.expires_at && session.expires_at < now) {
          // Session expired
          setIsChecking(false);
        } else {
          setIsChecking(false);
        }
      }
    }
  }, [loading, isAuthenticated, session, user]);
  
  if (loading || isChecking) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  // Ensure we have a valid session and user
  if (!isAuthenticated || !session || !user) {
    // Store the current route BEFORE redirecting
    if (pathname && pathname !== "/auth") {
      storeRedirectPath(pathname);
    }
    router.replace("/auth");
    return null;
  }
  
  return <>{children}</>;
};
