import React from "react";

export function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      <div className="mb-6 rounded-lg bg-white shadow overflow-hidden">
        {/* Cover Skeleton */}
        <div className="relative h-48 md:h-64 w-full bg-gradient-to-r from-gray-200 to-gray-300 rounded-t-lg">
          {/* Avatar Skeleton - overlaps by half its height */}
          <div
            className="absolute left-1/2 md:left-16 -translate-x-1/2 md:translate-x-0"
            style={{ bottom: "-72px", width: "144px", height: "144px" }}
          >
            <div className="overflow-hidden rounded-full border-4 border-white shadow-2xl bg-white w-full h-full flex items-center justify-center">
              <div className="h-36 w-36 bg-gray-200 rounded-full" />
            </div>
          </div>
        </div>
        {/* Profile Content Skeleton */}
        <div className="relative px-6 pb-6 pt-24 md:pt-8 flex flex-col md:flex-row md:items-end">
          {/* Spacer for avatar on desktop */}
          <div className="hidden md:block md:w-48 lg:w-56 xl:w-64" />
          {/* Info Skeleton */}
          <div className="flex-1">
            <div className="h-6 w-40 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-24 bg-gray-100 rounded mb-4" />
            <div className="h-4 w-3/4 bg-gray-100 rounded mb-2" />
            <div className="flex gap-2 mt-4 mb-4">
              <div className="h-6 w-16 bg-gray-200 rounded-full" />
              <div className="h-6 w-16 bg-gray-200 rounded-full" />
              <div className="h-6 w-16 bg-gray-200 rounded-full" />
            </div>
            <div className="flex gap-6 mt-4">
              <div className="h-4 w-16 bg-gray-100 rounded" />
              <div className="h-4 w-16 bg-gray-100 rounded" />
              <div className="h-4 w-16 bg-gray-100 rounded" />
            </div>
          </div>
        </div>
      </div>
      {/* Tabs Skeleton */}
      <div className="container mx-auto px-4 pb-20 pt-6">
        <div className="w-full bg-white rounded-lg shadow p-4 flex gap-4 mb-6">
          <div className="h-8 w-20 bg-gray-200 rounded" />
          <div className="h-8 w-20 bg-gray-200 rounded" />
          <div className="h-8 w-20 bg-gray-200 rounded" />
        </div>
        {/* Posts grid skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square w-full bg-gray-200 rounded-md"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
