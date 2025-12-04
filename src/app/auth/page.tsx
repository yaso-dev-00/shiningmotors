"use client";
import { Suspense } from "react";
import Auth from "@/views/Auth";

export default function Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <Auth />
    </Suspense>
  );
}



