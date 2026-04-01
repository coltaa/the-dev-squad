'use client';

interface CardSkeletonProps {
  lines?: number;
  className?: string;
}

export function CardSkeleton({ lines = 3, className }: CardSkeletonProps) {
  return (
    <div className={`rounded-xl border border-border bg-surface-1 p-6 ${className}`}>
      <div className="animate-pulse space-y-3">
        <div className="h-3 w-24 rounded bg-surface-3" />
        <div className="h-8 w-40 rounded bg-surface-3" />
        {Array.from({ length: lines - 1 }).map((_, i) => (
          <div key={i} className="h-3 rounded bg-surface-3" style={{ width: `${60 + Math.random() * 30}%` }} />
        ))}
      </div>
    </div>
  );
}
