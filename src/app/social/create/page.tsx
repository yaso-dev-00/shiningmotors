"use client";
import { Suspense } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import CreatePost from "@/views/CreatePost";

export default function Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <ProtectedRoute>
        <CreatePost />
      </ProtectedRoute>
    </Suspense>
  );
}






