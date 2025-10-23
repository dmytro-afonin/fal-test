import React from "react";

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse ${className}`}
    />
  );
}

export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Skeleton className="h-9 w-64 mx-auto mb-8" />

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <Skeleton className="h-6 w-56 mb-4" />
          <Skeleton className="h-40 w-full" />
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <Skeleton className="h-6 w-64 mb-4" />
          <Skeleton className="h-5 w-full mb-4" />
          <Skeleton className="h-12 w-full" />
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <Skeleton className="h-6 w-56 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}


