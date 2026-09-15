import { cn } from '../../lib/cn';

export const Skeleton = ({ className }) => (
  <div className={cn('animate-pulse rounded-lg bg-slate-200/70', className)} />
);

export const CardSkeleton = () => (
  <div className="rounded-2xl border border-slate-200 bg-white p-6">
    <Skeleton className="h-5 w-2/3" />
    <Skeleton className="mt-3 h-4 w-1/2" />
    <div className="mt-5 flex gap-2">
      <Skeleton className="h-6 w-16" />
      <Skeleton className="h-6 w-20" />
    </div>
  </div>
);

export const ListSkeleton = ({ count = 3 }) => (
  <div className="flex flex-col gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);
