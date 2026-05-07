export default function ShoppingListLoading() {
  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto w-full animate-pulse">
      <div className="px-4 pt-5 pb-3 flex items-center justify-between">
        <div className="h-5 w-24 bg-muted rounded-lg" />
        <div className="h-5 w-16 bg-muted rounded-lg" />
      </div>
      <div className="px-4 mb-3">
        <div className="h-12 bg-muted rounded-2xl" />
      </div>
      <div className="flex-1 px-4 space-y-1.5">
        {[1,2,3,4,5,6,7].map(i => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 bg-card border rounded-2xl">
            <div className="size-5 rounded-full bg-muted shrink-0" />
            <div className="flex-1 h-4 bg-muted rounded" style={{ width: `${50 + (i * 7) % 35}%` }} />
            <div className="h-4 w-12 bg-muted rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
