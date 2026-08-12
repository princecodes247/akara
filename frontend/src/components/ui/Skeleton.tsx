"use client";

import { motion } from "framer-motion";

// Base skeleton block with shimmer animation
export function Skeleton({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-surface/50 ${className}`}
      style={style}
    >
      <motion.div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%)",
        }}
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

// --- Page-level skeletons ---

/** Dashboard project list skeleton */
export function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="card p-6 flex flex-col gap-5">
          <Skeleton className="h-5 w-2/5 rounded-md" />
          <div className="space-y-4">
            <div>
              <Skeleton className="h-3 w-20 mb-2 rounded" />
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-8 w-3/4 rounded-lg" />
                <Skeleton className="h-8 w-1/2 rounded-lg" />
              </div>
            </div>
            <div>
              <Skeleton className="h-3 w-16 mb-2 rounded" />
              <Skeleton className="h-8 w-2/5 rounded-lg" />
            </div>
          </div>
          <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
            <Skeleton className="h-3 w-28 rounded" />
            <Skeleton className="h-3 w-3 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Project detail page skeleton */
export function ProjectDetailSkeleton() {
  return (
    <div className="animate-in fade-in duration-500 flex flex-col h-full bg-background min-h-screen">
      {/* Header */}
      <div className="px-6 md:px-10 pt-8 pb-6 border-b border-border">
        <Skeleton className="h-3 w-24 mb-4 rounded" />
        <Skeleton className="h-8 w-64 mb-4 rounded-lg" />
        <div className="flex gap-4 mt-4">
          <Skeleton className="h-6 w-40 rounded-md" />
          <Skeleton className="h-6 w-32 rounded-md" />
        </div>
      </div>

      {/* Tab bar */}
      <div className="px-6 md:px-10 pt-5 pb-3">
        <div className="flex gap-1 bg-surface/60 p-1 rounded-xl w-fit border border-border">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </div>

      {/* Content */}
      <div className="px-6 md:px-10 pb-12 flex-1 max-w-7xl mx-auto w-full space-y-4 pt-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-20 rounded-md" />
                <Skeleton className="h-4 w-14 rounded-full" />
              </div>
              <Skeleton className="h-3 w-36 rounded" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-20 rounded-lg" />
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Settings page skeleton */
export function SettingsSkeleton() {
  return (
    <div className="animate-in fade-in duration-500 flex flex-col h-full bg-background text-foreground">
      <div className="px-6 md:px-10 pt-10 pb-8 border-b border-border">
        <Skeleton className="h-3 w-28 mb-4 rounded" />
        <Skeleton className="h-8 w-40 rounded-lg" />
        <Skeleton className="h-3 w-32 mt-2 rounded" />
      </div>
      <div className="p-6 md:p-10 max-w-3xl mx-auto w-full space-y-8">
        <div className="card-lg p-6 md:p-8 space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-11 w-full rounded-lg" />
          </div>
          <div className="space-y-2 pt-8 border-t border-border">
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-11 w-full rounded-lg" />
          </div>
          <div className="space-y-2 pt-8 border-t border-border">
            <Skeleton className="h-3 w-28 rounded" />
            <Skeleton className="h-11 w-full rounded-lg" />
            <Skeleton className="h-11 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Edit release page skeleton */
export function EditReleaseSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-surface/30 px-4 md:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-20 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Skeleton className="w-9 h-9 rounded-xl" />
          <div className="border-l border-border h-5 hidden md:block mx-1" />
          <div>
            <Skeleton className="h-4 w-32 mb-1 rounded" />
            <Skeleton className="h-3 w-20 rounded" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-16 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="card-lg p-6 md:p-8">
              <Skeleton className="h-4 w-32 mb-5 rounded" />
              <div className="space-y-5">
                <div>
                  <Skeleton className="h-3 w-20 mb-2 rounded" />
                  <Skeleton className="h-11 w-full rounded-lg" />
                </div>
                <div>
                  <Skeleton className="h-3 w-24 mb-2 rounded" />
                  <Skeleton className="h-48 w-full rounded-lg" />
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="card-lg p-6 md:p-8">
              <Skeleton className="h-4 w-28 mb-5 rounded" />
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                    <Skeleton className="w-4 h-4 rounded" />
                    <Skeleton className="h-3 w-3/4 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Dashboard layout auth skeleton */
export function AuthSkeleton() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
      <Skeleton className="w-10 h-10 rounded-full" />
      <Skeleton className="h-3 w-40 rounded" />
    </div>
  );
}
