export default function Skeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4" aria-busy="true" aria-label="Loading results">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[4/3] w-full rounded bg-gray-100" />
          <div className="mt-2 h-3 w-full rounded bg-gray-100" />
          <div className="mt-1 h-3 w-2/3 rounded bg-gray-100" />
          <div className="mt-2 h-8 w-full rounded bg-gray-100" />
        </div>
      ))}
    </div>
  );
}
