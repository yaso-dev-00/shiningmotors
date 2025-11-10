"use client";
import { Suspense } from "react";
import Vehicles from "@/views/Vehicles";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Vehicles />
    </Suspense>
  );
}


