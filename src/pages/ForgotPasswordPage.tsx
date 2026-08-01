import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { resetPassword } from '@/hooks/useAuth'
import { useI18n } from '@/hooks/useI18n'
import { useTheme } from '@/hooks/useTheme'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Input'

const schema = z.object({ email: z.string().email() })
type FormData = z.infer<typeof schema>

export function ForgotPasswordPage() {
  useTheme()
  const { t } = useI18n()
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setError('')
    try {
      await resetPassword(data.email.trim())
      setSent(true)
    } catch {
      setError('No pudimos enviar el enlace. Verificá el correo.')
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-8 shadow-[var(--shadow-lift)]"
      >
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold">
          {t('auth.reset')}
        </h1>
        <p className="mt-2 text-sm text-[var(--color-ink-muted)]">{t('auth.resetHint')}</p>

        {sent ? (
          <p className="mt-6 rounded-xl bg-[var(--color-accent-soft)] px-4 py-3 text-sm text-[var(--color-accent-strong)]">
            Revisá tu correo. Te enviamos el enlace para restablecer la contraseña.
          </p>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <Field label={t('auth.email')} error={errors.email?.message}>
              <Input type="email" {...register('email')} />
            </Field>
            {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {t('auth.sendLink')}
            </Button>
          </form>
        )}

        <Link
          to="/login"
          className="mt-5 block text-center text-sm text-[var(--color-accent)] hover:underline"
        >
          {t('auth.backLogin')}
        </Link>
      </motion.div>
    </div>
  )
}
