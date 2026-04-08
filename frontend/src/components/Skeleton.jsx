const Skeleton = ({ className = '' }) => (
  <div className={`skeleton-pulse ${className}`.trim()} aria-hidden="true" />
);

export const SkeletonText = ({ className = '' }) => (
  <Skeleton className={`h-3 rounded-md ${className}`.trim()} />
);

export const SkeletonCard = ({ className = '' }) => (
  <div className={`rounded-xl border border-slate-200/80 bg-white p-4 ${className}`.trim()}>
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-8 h-8 rounded-lg" />
        <div className="space-y-2">
          <SkeletonText className="w-28" />
          <SkeletonText className="w-24 h-2.5" />
        </div>
      </div>
      <SkeletonText className="w-12 h-4" />
    </div>
    <Skeleton className="w-full h-2 rounded-full" />
  </div>
);

export const SkeletonTableRows = ({ rows = 5, columns = 6 }) => (
  <div className="p-4 space-y-3">
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {Array.from({ length: columns }).map((__, colIndex) => (
          <Skeleton key={colIndex} className="h-10 rounded-lg" />
        ))}
      </div>
    ))}
  </div>
);

export default Skeleton;
