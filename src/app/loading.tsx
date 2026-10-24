import { SkeletonCard, SkeletonLines } from "@/components/ui";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6" aria-busy="true" aria-label="Loading">
      <div className="skeleton h-8 w-64 rounded" />
      <div className="mt-3 max-w-md">
        <SkeletonLines n={2} />
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
