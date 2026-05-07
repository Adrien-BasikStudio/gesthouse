export default function StockLoading() {
  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto w-full animate-pulse">
      <div className="px-4 pt-6 pb-3 flex items-center justify-between">
        <div className="h-8 w-28 bg-muted rounded-xl" />
        <div className="h-8 w-8 bg-muted rounded-xl" />
      </div>
      <div className="px-4 mb-3">
        <div className="h-10 bg-muted rounded-2xl" />
      </div>
      <div className="flex-1 px-4 space-y-1.5">
        {[1,2,3,4,5,6,7,8].map(i => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 bg-card border rounded-2xl">
            <div className="flex-1 space-y-1">
              <div className="h-4 bg-muted rounded" style={{ width: `${40 + (i * 9) % 40}%` }} />
            </div>
            <div className="h-5 w-14 bg-muted rounded" />
            <div className="size-7 bg-muted rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}
