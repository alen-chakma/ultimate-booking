import { cn } from "@/lib/utils/cn";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gray-200",
        className
      )}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <Skeleton className="mb-4 h-48 w-full rounded-lg" />
      <Skeleton className="mb-2 h-6 w-3/4" />
      <Skeleton className="mb-4 h-4 w-1/2" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}
