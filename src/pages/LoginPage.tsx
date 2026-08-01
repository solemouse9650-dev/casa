import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { getAuthErrorMessage, login } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Input'

const schema = z.object({
  email: z.string().min(1, 'Ingresá tu correo').email('Correo inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

type FormData = z.infer<typeof schema>

export function LoginPage() {
  useTheme()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (data: FormData) => {
    setError('')
    try {
      await login(data.email, data.password)
      navigate('/inicio', { replace: true })
    } catch (err) {
      setError(getAuthErrorMessage(err))
    }
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-[#f7f4ef] px-4 py-10 text-[#1c2421]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-[#1b7a6e]/15 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[#c96b3c]/15 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md rounded-3xl border border-[#e4ddd3] bg-white p-8 shadow-lg"
      >
        <div className="mb-8">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1b7a6e] text-white">
            <span className="font-[family-name:var(--font-display)] text-xl font-bold">C</span>
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold">
            Bienvenido a Casa
          </h1>
          <p className="mt-2 text-sm text-[#5c6b66]">
            Ingresá con tu correo y contraseña para entrar al panel del hogar.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Field label="Correo electrónico" error={errors.email?.message}>
            <Input
              type="email"
              autoComplete="email"
              placeholder="tu@correo.com"
              {...register('email')}
            />
          </Field>
          <Field label="Contraseña" error={errors.password?.message}>
            <Input
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              {...register('password')}
            />
          </Field>

          {error ? (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-[#c23b3b]">{error}</p>
          ) : null}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Ingresando…' : 'Iniciar sesión'}
          </Button>
        </form>

        <Link
          to="/forgot-password"
          className="mt-5 block text-center text-sm text-[#1b7a6e] hover:underline"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </motion.div>
    </div>
  )
}
