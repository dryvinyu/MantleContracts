const CopilotLoading = () => {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="animate-pulse space-y-6">
        <div className="h-10 w-64 rounded bg-muted" />
        <div className="grid gap-4 lg:grid-cols-[260px_1fr_280px]">
          <div className="space-y-4">
            <div className="h-10 rounded bg-muted" />
            <div className="h-20 rounded bg-muted" />
            <div className="h-24 rounded bg-muted" />
          </div>
          <div className="space-y-4">
            <div className="h-24 rounded bg-muted" />
            <div className="h-24 rounded bg-muted" />
            <div className="h-24 rounded bg-muted" />
          </div>
          <div className="space-y-4">
            <div className="h-24 rounded bg-muted" />
            <div className="h-24 rounded bg-muted" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default CopilotLoading
