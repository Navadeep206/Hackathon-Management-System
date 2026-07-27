import React from 'react';

export const Spinner = ({ size = 'h-8 w-8', color = 'border-indigo-600' }) => (
  <div className={`animate-spin rounded-full ${size} border-t-2 border-b-2 ${color}`}></div>
);

export const SkeletonCard = () => (
  <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4 animate-pulse">
    <div className="h-40 bg-gray-100 rounded-xl w-full"></div>
    <div className="h-6 bg-gray-100 rounded-md w-3/4"></div>
    <div className="h-4 bg-gray-100 rounded-md w-1/2"></div>
    <div className="h-4 bg-gray-100 rounded-md w-full"></div>
  </div>
);

export const SkeletonGrid = ({ count = 3 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export const SkeletonTable = ({ rows = 5, cols = 4 }) => (
  <div className="border border-gray-150 rounded-2xl overflow-hidden animate-pulse w-full">
    <div className="h-12 bg-gray-50 border-b border-gray-150"></div>
    <div className="p-4 space-y-3 bg-white">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-8 bg-gray-100 rounded-md flex-grow"></div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

const Loader = ({ fullScreen = false }) => {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/70 backdrop-blur-xs z-50 flex items-center justify-center">
        <Spinner size="h-12 w-12" color="border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8">
      <Spinner size="h-10 w-10" color="border-indigo-600" />
    </div>
  );
};

export default Loader;
