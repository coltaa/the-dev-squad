'use client';

import clsx from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: boolean;
}

export function Card({ children, className, hover = false, padding = true }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-xl border border-border bg-surface-1 transition-colors',
        hover && 'hover:border-border-hover cursor-pointer',
        padding && 'p-6',
        className
      )}
    >
      {children}
    </div>
  );
}
