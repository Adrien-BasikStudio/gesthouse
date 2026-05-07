export default function SettingsLoading() {
  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto w-full animate-pulse px-4 pt-6 space-y-5">
      <div className="h-8 w-24 bg-muted rounded-xl" />
      <div className="bg-card border rounded-2xl divide-y">
        {[1,2,3,4].map(i => (
          <div key={i} className="flex items-center gap-3 px-4 py-4">
            <div className="size-9 rounded-xl bg-muted shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
            <div className="h-4 w-4 bg-muted rounded" />
          </div>
        ))}
      </div>
      <div className="bg-card border rounded-2xl divide-y">
        {[1,2,3].map(i => (
          <div key={i} className="flex items-center gap-3 px-4 py-4">
            <div className="size-9 rounded-xl bg-muted shrink-0" />
            <div className="flex-1 h-4 bg-muted rounded w-2/5" />
            <div className="h-4 w-4 bg-muted rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
