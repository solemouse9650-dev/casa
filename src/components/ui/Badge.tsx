import { cn } from '@/utils/cn'
import type { Priority } from '@/types'

const priorityStyles: Record<Priority, string> = {
  low: 'bg-[var(--color-border)] text-[var(--color-ink-muted)]',
  medium: 'bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)]',
  high: 'bg-[var(--color-warm-soft)] text-[var(--color-warm)]',
  urgent: 'bg-red-100 text-[var(--color-danger)] dark:bg-red-950/40',
}

export function Badge({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium',
        className,
      )}
    >
      {children}
    </span>
  )
}

export function PriorityBadge({ priority, label }: { priority: Priority; label: string }) {
  return <Badge className={priorityStyles[priority]}>{label}</Badge>
}
