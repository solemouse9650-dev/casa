import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { login } from '@/hooks/useAuth'
import { useI18n } from '@/hooks/useI18n'
import { useTheme } from '@/hooks/useTheme'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Input'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

type FormData = z.infer<typeof schema>

export function LoginPage() {
  useTheme()
  const { t } = useI18n()
  const [error, setError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setError('')
    try {
      await login(data.email.trim(), data.password)
    } catch {
      setError('No pudimos iniciar sesión. Revisá correo y contraseña.')
    }
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-[var(--color-accent)]/15 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[var(--color-warm)]/15 blur-3xl" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-8 shadow-[var(--shadow-lift)]"
      >
        <div className="mb-8">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-accent)] text-white">
            <span className="font-[family-name:var(--font-display)] text-xl font-bold">C</span>
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold">
            {t('auth.welcome')}
          </h1>
          <p className="mt-2 text-sm text-[var(--color-ink-muted)]">{t('auth.private')}</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Field label={t('auth.email')} error={errors.email?.message}>
            <Input type="email" autoComplete="email" {...register('email')} />
          </Field>
          <Field label={t('auth.password')} error={errors.password?.message}>
            <Input type="password" autoComplete="current-password" {...register('password')} />
          </Field>
          {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? t('common.loading') : t('auth.login')}
          </Button>
        </form>

        <Link
          to="/forgot-password"
          className="mt-5 block text-center text-sm text-[var(--color-accent)] hover:underline"
        >
          {t('auth.forgot')}
        </Link>
      </motion.div>
    </div>
  )
}
