"use client";
import React, { Suspense } from "react";
import PaymentSuccess from "@/views/PaymentSuccess";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PaymentSuccess />
    </Suspense>
  );
}
