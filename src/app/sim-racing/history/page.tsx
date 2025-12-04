"use client";
import { Suspense } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import SimRacingHistory from "@/views/sim-racing/SimRacingHistory";

export default function Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <ProtectedRoute>
        <SimRacingHistory />
      </ProtectedRoute>
    </Suspense>
  );
}




