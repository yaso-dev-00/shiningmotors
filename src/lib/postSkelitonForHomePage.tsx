import React from "react";

const PostSkeletonForHomePage: React.FC = () => {
  return (
    <div className="flex-shrink-0 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/5 bg-white shadow-md rounded-xl cursor-pointer overflow-hidden">
      <div className="overflow-hidden h-full max-h-[630px] relative shadow-sm hover:shadow-md transition-shadow border-gray-200 border rounded-lg mb-2 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center p-3 border-b">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gray-200 border" />
            <div>
              <div className="h-4 bg-gray-200 rounded w-24 mb-1" />
              <div className="h-3 bg-gray-100 rounded w-16" />
            </div>
          </div>
          <div className="h-6 w-6 bg-gray-200 rounded-full" />
        </div>
        {/* Media Skeleton (Swiper mimic) */}
        <div className="relative bg-gray-100 overflow-hidden flex justify-center">
          <div className="w-full h-[400px] md:h-[300px] bg-gray-200 relative flex items-center justify-center">
            {/* Desktop Swiper arrows */}
            <div className="hidden md:flex absolute top-1/2 left-3 -translate-y-1/2 w-10 h-10 rounded-full bg-gray-300 opacity-60 items-center justify-center z-10" />
            <div className="hidden md:flex absolute top-1/2 right-3 -translate-y-1/2 w-10 h-10 rounded-full bg-gray-300 opacity-60 items-center justify-center z-10" />
          </div>
        </div>
        {/* Caption and Action Icons Skeleton */}
        <div className="p-2 flex flex-col items-center justify-center overflow-y-scroll scrollbar-hide">
          <div className="h-4 bg-gray-200 rounded w-full mb-2" />
          <div className="h-4 bg-gray-200 rounded w-4/5 mb-3" />
        </div>
        {/* Action buttons */}
        <div className="px-4 py-2 flex justify-between">
          <div className="flex space-x-4">
            <div className="h-6 w-6 bg-gray-200 rounded-full" />
            <div className="h-6 w-6 bg-gray-200 rounded-full" />
            <div className="h-6 w-6 bg-gray-200 rounded-full" />
          </div>
          <div className="h-6 w-6 bg-gray-200 rounded-full" />
        </div>
        {/* Likes count */}
        <div className="px-4 pt-1 pb-2">
          <div className="h-4 w-16 bg-gray-200 rounded" />
        </div>
        {/* Comments link */}
        <div className="px-4 pb-3">
          <div className="h-4 w-32 bg-gray-100 rounded" />
        </div>
      </div>
    </div>
  );
};

export default PostSkeletonForHomePage;
