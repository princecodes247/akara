"use client";

import { motion } from "framer-motion";

// Base skeleton block with shimmer animation
export function Skeleton({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-surface/40 ${className}`}
      style={style}
    >
      <motion.div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)",
        }}
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

// --- Page-level skeletons ---

/** Dashboard project list skeleton */
export function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="glass-card p-6 flex flex-col gap-6">
          {/* Project name */}
          <Skeleton className="h-6 w-2/5 rounded-md" />

          <div className="space-y-5">
            {/* Source repos label + pills */}
            <div>
              <Skeleton className="h-3 w-24 mb-2 rounded-sm" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-9 w-3/4 rounded-md" />
                <Skeleton className="h-9 w-1/2 rounded-md" />
              </div>
            </div>
            {/* Target repo label + pill */}
            <div>
              <Skeleton className="h-3 w-20 mb-2 rounded-sm" />
              <Skeleton className="h-9 w-2/5 rounded-md" />
            </div>
          </div>

          {/* Footer bar */}
          <div className="mt-auto pt-4 border-t border-border/30 flex items-center justify-between">
            <Skeleton className="h-4 w-32 rounded-sm" />
            <Skeleton className="h-4 w-4 rounded-sm" />
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
      {/* Header grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 border-b border-border/50 bg-surface/10">
        {/* Back button */}
        <div className="md:col-span-3 flex items-center justify-center p-5 sm:p-8 md:p-12 border-b md:border-b-0 md:border-r border-border/50 bg-surface/30">
          <Skeleton className="h-4 w-36 rounded-sm" />
        </div>
        {/* Title area */}
        <div className="md:col-span-4 p-5 sm:p-8 md:p-12 border-b md:border-b-0 md:border-r border-border/50 flex flex-col justify-center bg-surface/10">
          <Skeleton className="h-9 w-3/4 rounded-md" />
        </div>
        {/* Metadata area */}
        <div className="md:col-span-5 p-5 sm:p-8 md:p-12 flex flex-col justify-center">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <Skeleton className="h-3 w-16 mt-1 rounded-sm shrink-0" />
              <div className="flex gap-2">
                <Skeleton className="h-7 w-36 rounded-md" />
                <Skeleton className="h-7 w-28 rounded-md" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-3 w-24 rounded-sm shrink-0" />
              <Skeleton className="h-7 w-40 rounded-md" />
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-4 max-w-7xl mx-auto w-full">
        <div className="flex gap-2 bg-surface/30 p-1.5 rounded-xl w-fit border border-border/50">
          <Skeleton className="h-10 w-32 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
          <Skeleton className="h-10 w-36 rounded-lg" />
        </div>
      </div>

      {/* Release list */}
      <div className="px-5 sm:px-8 pb-12 flex-1 max-w-7xl mx-auto w-full space-y-4 pt-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="border border-border/50 bg-surface/20 rounded-xl p-4 sm:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
          >
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-20 rounded-md" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-3 w-36 rounded-sm" />
                <Skeleton className="h-3 w-20 rounded-sm" />
              </div>
            </div>
            <div className="flex items-center gap-3">
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
      {/* Header */}
      <div className="grid grid-cols-1 md:grid-cols-12 border-b border-border">
        <div className="md:col-span-4 p-8 md:p-12 border-b md:border-b-0 md:border-r border-border flex flex-col justify-center bg-surface/30">
          <Skeleton className="h-10 w-52 rounded-md" />
          <Skeleton className="h-3 w-32 mt-2 rounded-sm" />
        </div>
        <div className="md:col-span-5 p-8 md:p-12 border-b md:border-b-0 md:border-r border-border flex flex-col justify-center">
          <Skeleton className="h-4 w-4/5 rounded-sm" />
        </div>
        <div className="md:col-span-3 flex items-center justify-center p-8 md:p-12 bg-surface">
          <Skeleton className="h-4 w-32 rounded-sm" />
        </div>
      </div>

      {/* Form body */}
      <div className="p-8 md:p-12 max-w-4xl mx-auto w-full space-y-10">
        {/* Project name field */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-24 rounded-sm" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
        {/* Source repos */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-28 rounded-sm" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
        {/* Target repo */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-20 rounded-sm" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/** Edit release page skeleton */
export function EditReleaseSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Editor header */}
      <header className="border-b border-border/50 bg-surface/10 px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-20 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="border-l border-border/50 h-6 hidden md:block mx-2" />
          <div>
            <Skeleton className="h-5 w-36 rounded-md mb-1" />
            <Skeleton className="h-3 w-24 rounded-sm" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-20 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </header>

      {/* Editor body */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
          {/* Left column */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            <div className="bg-surface/10 border border-border/50 rounded-2xl p-8">
              <Skeleton className="h-4 w-32 mb-6 rounded-sm" />
              <div className="space-y-6">
                <div>
                  <Skeleton className="h-3 w-20 mb-2 rounded-sm" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
                <div>
                  <Skeleton className="h-3 w-24 mb-2 rounded-sm" />
                  <Skeleton className="h-48 w-full rounded-lg" />
                </div>
              </div>
            </div>
          </div>
          {/* Right column */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            <div className="bg-surface/10 border border-border/50 rounded-2xl p-8">
              <Skeleton className="h-4 w-28 mb-6 rounded-sm" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 border border-border/30 rounded-lg">
                    <Skeleton className="w-5 h-5 rounded" />
                    <Skeleton className="h-4 w-3/4 rounded-sm" />
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
      <Skeleton className="w-12 h-12 rounded-full" />
      <Skeleton className="h-3 w-48 rounded-sm" />
    </div>
  );
}
