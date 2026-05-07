export default function NotesLoading() {
  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto w-full animate-pulse">
      <div className="px-4 pt-6 pb-3 flex items-center justify-between">
        <div className="h-8 w-28 bg-muted rounded-xl" />
        <div className="h-8 w-24 bg-muted rounded-xl" />
      </div>
      <div className="px-4 grid grid-cols-7 gap-1 mb-3">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-lg bg-muted/50" />
        ))}
      </div>
      <div className="flex-1 px-4 space-y-2">
        {[1,2,3].map(i => (
          <div key={i} className="bg-card border rounded-2xl p-4 space-y-2" style={{ borderLeftWidth: 3, borderLeftColor: '#e5e7eb' }}>
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-3.5 bg-muted rounded w-3/4" />
            <div className="h-3.5 bg-muted rounded w-2/3" />
          </div>
        ))}
      </div>
    </div>
  )
}
