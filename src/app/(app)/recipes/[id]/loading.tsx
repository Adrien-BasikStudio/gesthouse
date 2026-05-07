export default function RecipeDetailLoading() {
  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto w-full animate-pulse">
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-20 bg-muted rounded-lg" />
          <div className="flex gap-2">
            <div className="size-8 bg-muted rounded-xl" />
            <div className="size-8 bg-muted rounded-xl" />
            <div className="size-8 bg-muted rounded-xl" />
          </div>
        </div>
        <div className="h-7 bg-muted rounded-xl w-3/4 mb-2" />
        <div className="flex gap-4">
          <div className="h-4 w-28 bg-muted rounded" />
          <div className="h-4 w-20 bg-muted rounded" />
        </div>
      </div>
      <div className="flex-1 px-4 space-y-5">
        <div>
          <div className="h-5 w-28 bg-muted rounded-lg mb-2" />
          <div className="bg-card border rounded-2xl divide-y">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                <div className="size-4 rounded-full bg-muted" />
                <div className="flex-1 h-4 bg-muted rounded" style={{ width: `${45 + (i * 13) % 30}%` }} />
                <div className="h-4 w-14 bg-muted rounded" />
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="h-5 w-24 bg-muted rounded-lg mb-2" />
          <div className="bg-card border rounded-2xl px-4 py-3 space-y-2">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-3.5 bg-muted rounded" style={{ width: `${60 + (i * 11) % 35}%` }} />)}
          </div>
        </div>
      </div>
    </div>
  )
}
