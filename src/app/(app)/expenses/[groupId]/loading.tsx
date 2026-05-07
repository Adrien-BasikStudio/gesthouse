export default function ExpenseGroupLoading() {
  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto w-full animate-pulse">
      <div className="px-4 pt-6 pb-3 space-y-3">
        <div className="h-8 w-44 bg-muted rounded-xl" />
        <div className="h-4 w-40 bg-muted rounded" />
      </div>
      <div className="h-9 mx-4 bg-muted rounded-xl mb-3" />
      <div className="flex-1 px-4 space-y-2 pt-2">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 bg-card border rounded-2xl">
            <div className="size-9 rounded-xl bg-muted shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 bg-muted rounded w-2/3" />
              <div className="h-3 bg-muted rounded w-1/3" />
            </div>
            <div className="h-5 w-16 bg-muted rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
