"use client";
import { Suspense } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import SimRacingEvents from "@/views/sim-racing/SimRacingEvents";

export default function Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <ProtectedRoute>
        <SimRacingEvents />
      </ProtectedRoute>
    </Suspense>
  );
}




