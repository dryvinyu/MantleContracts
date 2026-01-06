const DashboardLoading = () => {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="animate-pulse space-y-6">
        <div className="h-10 w-64 rounded bg-muted" />
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <div className="space-y-4">
            <div className="h-24 rounded bg-muted" />
            <div className="h-24 rounded bg-muted" />
            <div className="h-24 rounded bg-muted" />
          </div>
          <div className="space-y-4">
            <div className="h-10 rounded bg-muted" />
            <div className="h-64 rounded bg-muted" />
            <div className="h-64 rounded bg-muted" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardLoading
