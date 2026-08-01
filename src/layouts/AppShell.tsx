import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity,
  BarChart3,
  Bell,
  Calendar,
  CheckSquare,
  Home,
  Menu,
  Package,
  Search,
  Settings,
  ShoppingCart,
  StickyNote,
  Wallet,
  X,
} from 'lucide-react'
import { NAV_ITEMS } from '@/constants'
import { useI18n } from '@/hooks/useI18n'
import { useUiStore } from '@/stores/uiStore'
import { useDataStore } from '@/stores/dataStore'
import { useAuth } from '@/hooks/useAuth'
import { useHomeData } from '@/hooks/useHomeData'
import { useTheme } from '@/hooks/useTheme'
import { NotificationsPanel } from '@/components/NotificationsPanel'
import { GlobalSearch } from '@/components/GlobalSearch'
import { useEffect, useState } from 'react'
import type { TranslationKey } from '@/i18n/translations'
import { cn } from '@/utils/cn'

const icons = {
  Home,
  ShoppingCart,
  CheckSquare,
  Calendar,
  Bell,
  StickyNote,
  Package,
  Wallet,
  BarChart3,
  Activity,
  Settings,
} as const

export function AppShell() {
  useHomeData()
  useTheme()
  const { t } = useI18n()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const sidebarOpen = useUiStore((s) => s.sidebarOpen)
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen)
  const setSearchOpen = useUiStore((s) => s.setSearchOpen)
  const notifications = useDataStore((s) => s.notifications)
  const [notifOpen, setNotifOpen] = useState(false)
  const unread = notifications.filter((n) => profile && !n.readBy.includes(profile.uid)).length

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setSearchOpen])

  const NavList = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex flex-col gap-1 p-3">
      {NAV_ITEMS.map((item) => {
        const Icon = icons[item.icon]
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                isActive
                  ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)]'
                  : 'text-[var(--color-ink-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]',
              )
            }
          >
            <Icon className="h-4 w-4" />
            {t(item.labelKey as TranslationKey)}
          </NavLink>
        )
      })}
    </nav>
  )

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-[var(--color-border)] bg-[var(--color-surface-elevated)]/80 backdrop-blur lg:flex">
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-accent)] text-white">
            <span className="font-[family-name:var(--font-display)] text-lg font-bold">C</span>
          </div>
          <div>
            <p className="font-[family-name:var(--font-display)] text-lg font-semibold leading-none">
              {t('app.name')}
            </p>
            <p className="mt-1 text-xs text-[var(--color-ink-muted)]">{profile?.displayName}</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <NavList />
        </div>
      </aside>

      <AnimatePresence>
        {sidebarOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-black/35"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="absolute inset-y-0 left-0 w-[280px] border-r border-[var(--color-border)] bg-[var(--color-surface-elevated)]"
            >
              <div className="flex items-center justify-between px-4 py-4">
                <p className="font-[family-name:var(--font-display)] text-lg font-semibold">
                  {t('app.name')}
                </p>
                <button onClick={() => setSidebarOpen(false)} className="rounded-lg p-2">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <NavList onNavigate={() => setSidebarOpen(false)} />
            </motion.aside>
          </div>
        ) : null}
      </AnimatePresence>

      <div className="flex min-h-dvh flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)]/85 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex items-center gap-2">
            <button
              className="rounded-xl p-2 text-[var(--color-ink-muted)] hover:bg-[var(--color-accent-soft)] lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm text-[var(--color-ink-muted)] hover:border-[var(--color-accent)]"
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">{t('search.placeholder')}</span>
              <kbd className="ml-2 hidden rounded-md border border-[var(--color-border)] px-1.5 py-0.5 text-[10px] sm:inline">
                {t('search.shortcut')}
              </kbd>
            </button>
          </div>
          <div className="relative flex items-center gap-2">
            <button
              onClick={() => setNotifOpen((v) => !v)}
              className="relative rounded-xl p-2 text-[var(--color-ink-muted)] hover:bg-[var(--color-accent-soft)]"
            >
              <Bell className="h-5 w-5" />
              {unread > 0 ? (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-warm)] px-1 text-[10px] font-bold text-white">
                  {unread}
                </span>
              ) : null}
            </button>
            <button
              onClick={() => navigate('/configuracion')}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-sm font-semibold text-[var(--color-accent-strong)]"
            >
              {(profile?.displayName || 'U').slice(0, 1).toUpperCase()}
            </button>
            <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
          </div>
        </header>

        <main className="flex-1 px-4 py-5 pb-24 sm:px-6 lg:pb-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Outlet />
          </motion.div>
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-[var(--color-border)] bg-[var(--color-surface-elevated)]/95 px-1 py-2 backdrop-blur lg:hidden">
          {[
            { to: '/', icon: Home, label: t('nav.dashboard') },
            { to: '/compras', icon: ShoppingCart, label: t('nav.shopping') },
            { to: '/tareas', icon: CheckSquare, label: t('nav.tasks') },
            { to: '/calendario', icon: Calendar, label: t('nav.calendar') },
            { to: '/configuracion', icon: Menu, label: 'Más' },
          ].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => {
                if (item.to === '/configuracion') setSidebarOpen(true)
              }}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 rounded-xl px-1 py-1 text-[10px]',
                  isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-ink-muted)]',
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <GlobalSearch />
    </div>
  )
}
