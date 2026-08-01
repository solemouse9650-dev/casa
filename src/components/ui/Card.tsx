import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

export function Card({
  children,
  className,
  interactive = false,
  onClick,
}: {
  children: React.ReactNode
  className?: string
  interactive?: boolean
  onClick?: () => void
}) {
  return (
    <motion.div
      whileHover={interactive ? { y: -2 } : undefined}
      onClick={onClick}
      className={cn(
        'rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 shadow-[var(--shadow-soft)]',
        interactive && 'cursor-pointer hover:shadow-[var(--shadow-lift)]',
        className,
      )}
    >
      {children}
    </motion.div>
  )
}

export function StatCard({
  label,
  value,
  accent,
  onClick,
}: {
  label: string
  value: string | number
  accent?: string
  onClick?: () => void
}) {
  return (
    <Card interactive={!!onClick} onClick={onClick} className="relative overflow-hidden">
      <div
        className="absolute inset-y-0 left-0 w-1 rounded-l-2xl"
        style={{ background: accent ?? 'var(--color-accent)' }}
      />
      <p className="text-sm text-[var(--color-ink-muted)]">{label}</p>
      <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
        {value}
      </p>
    </Card>
  )
}
