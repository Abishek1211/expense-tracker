const shimmer = 'animate-pulse rounded-md bg-gray-200 dark:bg-gray-800';

export function SkeletonCards({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="glass rounded-2xl p-5">
          <div className={`h-4 w-24 ${shimmer}`} />
          <div className={`mt-3 h-7 w-32 ${shimmer}`} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="glass rounded-2xl p-5">
      <div className={`h-4 w-40 ${shimmer}`} />
      <div className={`mt-4 h-64 ${shimmer}`} />
    </div>
  );
}

export function SkeletonTable({ rows = 6 }: { rows?: number }) {
  return (
    <div className="glass overflow-hidden rounded-2xl">
      <div className="border-b border-gray-100 px-4 py-3 dark:border-white/10">
        <div className={`h-4 w-full max-w-md ${shimmer}`} />
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-6 border-b border-gray-100 px-4 py-3.5 last:border-0 dark:border-white/10">
          <div className={`h-4 w-20 ${shimmer}`} />
          <div className={`h-5 w-24 rounded-full ${shimmer}`} />
          <div className={`h-4 flex-1 ${shimmer}`} />
          <div className={`h-4 w-16 ${shimmer}`} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="glass rounded-2xl p-5">
          <div className={`h-5 w-1/3 ${shimmer}`} />
          <div className={`mt-3 h-3 w-full ${shimmer}`} />
        </div>
      ))}
    </div>
  );
}
