export default function HomeLoading() {
  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto w-full animate-pulse px-4 pt-6 space-y-4">
      <div className="space-y-1">
        <div className="h-7 w-48 bg-muted rounded-xl" />
        <div className="h-4 w-32 bg-muted rounded" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-card border rounded-2xl p-4 space-y-2">
            <div className="size-8 rounded-xl bg-muted" />
            <div className="h-6 w-12 bg-muted rounded" />
            <div className="h-3.5 w-20 bg-muted rounded" />
          </div>
        ))}
      </div>
      <div>
        <div className="h-5 w-28 bg-muted rounded mb-2" />
        <div className="space-y-1.5">
          {[1,2,3].map(i => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 bg-card border rounded-2xl">
              <div className="size-5 rounded-full bg-muted" />
              <div className="flex-1 h-4 bg-muted rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
