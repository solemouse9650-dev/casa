import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select } from '@/components/ui/Input'
import { useI18n } from '@/hooks/useI18n'
import { useAuth, logout } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { useUiStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { updateDisplayName } from '@/services/users'
import type { Locale } from '@/types'

export function SettingsPage() {
  const { t } = useI18n()
  const { profile, user } = useAuth()
  const setProfile = useAuthStore((s) => s.setProfile)
  const { theme, setTheme } = useTheme()
  const locale = useUiStore((s) => s.locale)
  const setLocale = useUiStore((s) => s.setLocale)
  const [name, setName] = useState(profile?.displayName || '')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (profile?.displayName) setName(profile.displayName)
  }, [profile?.displayName])

  const saveProfile = async () => {
    if (!user || !profile || !name.trim()) return
    await updateDisplayName(user.uid, name.trim())
    setProfile({ ...profile, displayName: name.trim() })
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={t('settings.title')} />

      <div className="space-y-4">
        <Card>
          <h2 className="mb-4 font-semibold">{t('settings.profile')}</h2>
          <div className="space-y-4">
            <Field label={t('settings.displayName')}>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label={t('auth.email')}>
              <Input value={profile?.email || ''} disabled />
            </Field>
            <Button onClick={saveProfile}>{saved ? 'Guardado' : t('common.save')}</Button>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold">{t('settings.theme')}</h2>
          <div className="flex gap-2">
            <Button
              variant={theme === 'light' ? 'primary' : 'secondary'}
              onClick={() => setTheme('light')}
            >
              {t('settings.light')}
            </Button>
            <Button
              variant={theme === 'dark' ? 'primary' : 'secondary'}
              onClick={() => setTheme('dark')}
            >
              {t('settings.dark')}
            </Button>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold">{t('settings.language')}</h2>
          <Select
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            className="max-w-xs"
          >
            <option value="es">Español</option>
            <option value="en">English</option>
          </Select>
        </Card>

        <Card>
          <Button variant="danger" onClick={() => logout()}>
            {t('auth.logout')}
          </Button>
        </Card>
      </div>
    </div>
  )
}
