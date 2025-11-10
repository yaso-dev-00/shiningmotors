import React from "react";

const PostDetailSkeleton: React.FC = () => {
  return (
    <div className="border border-gray-200 rounded-lg shadow-sm overflow-hidden animate-pulse mb-2">
      {/* Header Skeleton */}
      <div className="flex items-center p-3 border-b border-gray-200">
        <div className="h-8 w-8 rounded-full bg-gray-200 mr-2 md:h-10 md:w-10"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-3/5 mb-1 md:w-2/5"></div>
          <div className="h-3 bg-gray-200 rounded w-2/5 md:w-1/5"></div>
        </div>
      </div>

      {/* Media Skeleton */}
      <div className="w-full bg-gray-200 h-[300px] md:h-[500px]"></div>

      {/* Caption and Action Icons Skeleton */}
      <div className="p-3">
        {/* Caption */}
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-4/5 mb-3"></div>

        {/* Action Icons */}
        <div className="flex justify-between items-center mt-2">
          <div className="flex space-x-4">
            <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
            <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
            <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
          </div>
          <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default PostDetailSkeleton;
