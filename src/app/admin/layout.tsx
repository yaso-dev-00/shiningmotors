"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading, userRole } = useAuth();

  const isAuthorized = useMemo(() => {
    if (!user) return false;
    return userRole === "ADMIN";
  }, [user, userRole]);

  useEffect(() => {
    if (loading || (user && userRole == null)) return;
    if (!user) {
      router.replace("/admin/login" as Route);
      return;
    }
    if (!isAuthorized) {
      router.replace("/" as Route);
    }
  }, [loading, user, userRole, isAuthorized, router]);

  if (loading || (user && userRole == null)) return null;
  if (!user || !isAuthorized) return null;

  return <>{children}</>;
}


