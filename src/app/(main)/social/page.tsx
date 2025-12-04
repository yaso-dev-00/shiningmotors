"use client";
import { Suspense } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Social from "@/views/Social";

export default function Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <ProtectedRoute>
        <Social />
      </ProtectedRoute>
    </Suspense>
  );
}



