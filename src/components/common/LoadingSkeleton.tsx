import React from 'react';

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="w-full bg-white rounded-lg border border-slate-200 overflow-hidden animate-pulse">
      <div className="h-10 bg-slate-100 border-b border-slate-200" />
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex items-center justify-between gap-4">
            <div className="h-4 bg-slate-200 rounded w-1/4" />
            <div className="h-4 bg-slate-200 rounded w-1/3" />
            <div className="h-4 bg-slate-200 rounded w-1/6" />
            <div className="h-4 bg-slate-200 rounded w-16" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-28 bg-white rounded-lg border border-slate-200 p-5 animate-pulse flex flex-col justify-between">
          <div className="h-4 bg-slate-200 rounded w-1/2" />
          <div className="h-7 bg-slate-200 rounded w-1/3" />
        </div>
      ))}
    </div>
  );
};

export const DetailSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-slate-200 rounded w-1/3" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="h-40 bg-white rounded-lg border border-slate-200 p-6" />
          <div className="h-60 bg-white rounded-lg border border-slate-200 p-6" />
        </div>
        <div className="space-y-4">
          <div className="h-60 bg-white rounded-lg border border-slate-200 p-6" />
          <div className="h-40 bg-white rounded-lg border border-slate-200 p-6" />
        </div>
      </div>
    </div>
  );
};
