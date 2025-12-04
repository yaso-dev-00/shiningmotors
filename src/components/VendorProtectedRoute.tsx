import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { vendorApi } from "@/integrations/supabase/modules/vendors";
import { useQuery } from "@tanstack/react-query";
import { storeRedirectPath } from "@/lib/utils/routeRemember";

interface VendorProtectedRouteProps {
  children: React.ReactNode;
  requiredCategory: string;
}

export const VendorProtectedRoute: React.FC<VendorProtectedRouteProps> = ({
  children,
  requiredCategory,
}) => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const { data: vendorData, isLoading: vendorLoading } = useQuery({
    queryKey: ["vendor-registration", user?.id],
    queryFn: () => vendorApi.getByUserId(user!.id),
    enabled: !!user,
  });

  if (loading || vendorLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }
  if (
    vendorData?.data?.status !== "approved" &&
    vendorData?.data?.is_verified_by_admin !== true
  ) {
    router.replace("/settings");
    return null;
  }
  if (!user) {
    // Store the current route BEFORE redirecting
    if (pathname && pathname !== "/auth") {
      storeRedirectPath(pathname);
    }
    router.replace("/auth");
    return null;
  }
  if (!vendorData?.data && requiredCategory === "vendor") {
    router.replace("/");
    return null;
  }

  if (!vendorData?.data) {
    router.replace("/vendor-dashboard");
    return null;
  }

  const vendor = vendorData.data;
  if (vendorData?.data && requiredCategory === "vendor") {
    return <>{children}</>;
  }
  if (!vendor.is_verified_by_admin) {
    router.replace("/vendor-dashboard");
    return null;
  }
    
  if (!Array.isArray(vendor.categories) || !vendor.categories.includes(requiredCategory)) {
    router.replace("/vendor-dashboard");
    return null;
  }

  return <>{children}</>;
};
