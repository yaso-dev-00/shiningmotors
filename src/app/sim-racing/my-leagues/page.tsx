"use client";
import { Suspense } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import SimRacingMyLeagues from "@/views/sim-racing/SimRacingMyLeagues";

export default function Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <ProtectedRoute>
        <SimRacingMyLeagues />
      </ProtectedRoute>
    </Suspense>
  );
}




