export default function MealsLoading() {
  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto w-full animate-pulse">
      <div className="px-4 pt-6 pb-3 flex items-center justify-between">
        <div className="h-8 w-32 bg-muted rounded-xl" />
        <div className="flex gap-2">
          <div className="h-8 w-8 bg-muted rounded-xl" />
          <div className="h-8 w-8 bg-muted rounded-xl" />
        </div>
      </div>
      <div className="px-4 grid grid-cols-7 gap-1 mb-3">
        {[1,2,3,4,5,6,7].map(i => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="h-3 w-5 bg-muted rounded" />
            <div className="size-9 rounded-full bg-muted" />
          </div>
        ))}
      </div>
      <div className="flex-1 px-4 space-y-3">
        {[1,2,3].map(i => (
          <div key={i} className="bg-card border rounded-2xl p-3 space-y-2">
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-10 bg-muted rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  )
}
