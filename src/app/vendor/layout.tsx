"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { Route } from "next";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { vendorApi } from "@/integrations/supabase/modules/vendors";
import { storeRedirectPath } from "@/lib/utils/routeRemember";

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  const { data: vendorData, isLoading: vendorLoading } = useQuery({
    queryKey: ["vendor-registration", user?.id],
    queryFn: () => vendorApi.getByUserId(user!.id),
    enabled: !!user,
  });

  useEffect(() => {
    if (loading || vendorLoading) return;
    if (!user) {
      // Store the current route before redirecting
      if (pathname && pathname !== "/auth") {
        storeRedirectPath(pathname);
      }
      router.replace("/auth" as Route);
      return;
    }
    if (vendorData?.data?.status !== "approved" && vendorData?.data?.is_verified_by_admin !== true) {
      router.replace("/settings" as Route);
      return;
    }
    if (!vendorData?.data) {
      router.replace("/vendor-dashboard" as Route);
      return;
    }
  }, [loading, vendorLoading, vendorData, user, router]);

  if (loading || vendorLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!user || !vendorData?.data) return null;

  return <>{children}</>;
}


