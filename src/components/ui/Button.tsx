import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/utils/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft'

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: Variant
  size?: 'sm' | 'md' | 'lg'
}

const variants: Record<Variant, string> = {
  primary:
    'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-strong)] shadow-sm',
  secondary:
    'bg-[var(--color-surface-elevated)] text-[var(--color-ink)] border border-[var(--color-border)] hover:border-[var(--color-accent)]',
  ghost: 'bg-transparent text-[var(--color-ink-muted)] hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-ink)]',
  danger: 'bg-[var(--color-danger)] text-white hover:opacity-90',
  soft: 'bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)] hover:opacity-90',
}

const sizes = {
  sm: 'h-8 px-3 text-sm rounded-lg',
  md: 'h-10 px-4 text-sm rounded-xl',
  lg: 'h-12 px-5 text-base rounded-xl',
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.98 }}
      whileHover={disabled ? undefined : { y: -1 }}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  )
}
