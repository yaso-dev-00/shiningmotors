"use client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const AdminProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading, userRole } = useAuth();
  const router = useRouter();

  if (loading || (user && userRole === null)) return null;

  if (!user) {
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
