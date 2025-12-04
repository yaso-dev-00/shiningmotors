"use client";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { storeRedirectPath } from "@/lib/utils/routeRemember";

const AdminProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading, userRole } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (loading || (user && userRole === null)) return null;

  if (!user) {
    // Store the current route BEFORE redirecting
    if (pathname && pathname !== "/admin/login") {
      console.log("Storing redirect path:", pathname);
      storeRedirectPath(pathname);
    }
    router.replace("/admin/login");
    return null;
  }

  if (userRole !== "ADMIN") {
    router.replace("/");
    return null;
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;
