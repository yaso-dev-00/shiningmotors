"use client";
import { Suspense } from "react";
import AdminLogin from "@/views/admin/adminLogin";

export default function Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <AdminLogin />
    </Suspense>
  );
}




