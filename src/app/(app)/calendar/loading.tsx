export default function CalendarLoading() {
  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto w-full animate-pulse">
      <div className="px-4 pt-6 pb-3 flex items-center justify-between">
        <div className="h-8 w-40 bg-muted rounded-xl" />
        <div className="flex gap-2">
          <div className="h-8 w-8 bg-muted rounded-xl" />
          <div className="h-8 w-8 bg-muted rounded-xl" />
        </div>
      </div>
      <div className="space-y-1 px-4">
        {[1,2,3,4,5].map(i => (
          <div key={i}>
            <div className="flex items-center gap-3 py-2">
              <div className="size-10 rounded-full bg-muted shrink-0" />
              <div className="h-3 w-16 bg-muted rounded" />
            </div>
            {i % 2 === 0 && (
              <div className="mb-1.5 mx-0 h-12 bg-card border rounded-2xl" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
