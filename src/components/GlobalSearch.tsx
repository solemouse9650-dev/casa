import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useUiStore } from '@/stores/uiStore'
import { useI18n } from '@/hooks/useI18n'
import { useVisibleData } from '@/hooks/useVisibleData'
import { matchesQuery } from '@/utils/search'
import { Input } from '@/components/ui/Input'

export function GlobalSearch() {
  const open = useUiStore((s) => s.searchOpen)
  const setSearchOpen = useUiStore((s) => s.setSearchOpen)
  const { t } = useI18n()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const { shopping, tasks, notes, events, inventory } = useVisibleData()

  const results = useMemo(() => {
    if (!query.trim()) return []
    const items: { type: string; title: string; subtitle: string; to: string }[] = []
    shopping.forEach((s) => {
      if (matchesQuery(`${s.name} ${s.category} ${s.notes ?? ''}`, query)) {
        items.push({ type: 'Compra', title: s.name, subtitle: s.category, to: '/compras' })
      }
    })
    tasks.forEach((task) => {
      if (matchesQuery(`${task.title} ${task.description ?? ''} ${task.category}`, query)) {
        items.push({ type: 'Tarea', title: task.title, subtitle: task.category, to: '/tareas' })
      }
    })
    notes.forEach((n) => {
      if (matchesQuery(`${n.title} ${n.content} ${n.category}`, query)) {
        items.push({ type: 'Nota', title: n.title, subtitle: n.category, to: '/notas' })
      }
    })
    events.forEach((e) => {
      if (matchesQuery(`${e.title} ${e.description ?? ''}`, query)) {
        items.push({ type: 'Evento', title: e.title, subtitle: e.date, to: '/calendario' })
      }
    })
    inventory.forEach((i) => {
      if (matchesQuery(`${i.name} ${i.category}`, query)) {
        items.push({
          type: 'Inventario',
          title: i.name,
          subtitle: `${i.quantity} ${i.unit}`,
          to: '/inventario',
        })
      }
    })
    return items.slice(0, 20)
  }, [query, shopping, tasks, notes, events, inventory])

  const close = () => {
    setSearchOpen(false)
    setQuery('')
  }

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/35 p-4 pt-[12vh] backdrop-blur-[2px]">
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-lift)]"
          >
            <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-4">
              <Search className="h-4 w-4 text-[var(--color-ink-muted)]" />
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('search.placeholder')}
                className="border-0 px-0 shadow-none focus:ring-0"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') close()
                }}
              />
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {query && results.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-[var(--color-ink-muted)]">
                  {t('common.noResults')}
                </p>
              ) : (
                results.map((r, idx) => (
                  <button
                    key={`${r.type}-${r.title}-${idx}`}
                    className="flex w-full items-start justify-between rounded-xl px-3 py-2.5 text-left hover:bg-[var(--color-accent-soft)]"
                    onClick={() => {
                      navigate(r.to)
                      close()
                    }}
                  >
                    <div>
                      <p className="text-sm font-medium">{r.title}</p>
                      <p className="text-xs text-[var(--color-ink-muted)]">{r.subtitle}</p>
                    </div>
                    <span className="text-xs text-[var(--color-accent)]">{r.type}</span>
                  </button>
                ))
              )}
            </div>
            <button className="absolute inset-0 -z-10" onClick={close} aria-label="close" />
          </motion.div>
          <button className="absolute inset-0 -z-10" onClick={close} />
        </div>
      ) : null}
    </AnimatePresence>
  )
}
