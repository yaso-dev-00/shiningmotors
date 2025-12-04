"use client";
import { Suspense } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import PostDetail from "@/views/PostDetail";

export default function Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <ProtectedRoute>
        <PostDetail />
      </ProtectedRoute>
    </Suspense>
  );
}






