export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-elevated)]/60 px-6 py-16 text-center">
      <p className="font-[family-name:var(--font-display)] text-xl font-semibold">{title}</p>
      {description ? (
        <p className="mt-2 max-w-sm text-sm text-[var(--color-ink-muted)]">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}
