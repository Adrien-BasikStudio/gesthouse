export default function ShoppingLoading() {
  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto w-full animate-pulse">
      <div className="px-4 pt-6 pb-3">
        <div className="h-8 w-36 bg-muted rounded-xl mb-4" />
        <div className="space-y-2">
          {[1,2,3].map(i => (
            <div key={i} className="flex items-center gap-3 px-4 py-4 bg-card border rounded-2xl">
              <div className="size-9 rounded-xl bg-muted shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-3 bg-muted rounded w-1/4" />
              </div>
              <div className="h-4 w-4 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
