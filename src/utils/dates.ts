import {
  format,
  formatDistanceToNow,
  isToday,
  isTomorrow,
  parseISO,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
} from 'date-fns'
import { es, enUS } from 'date-fns/locale'
import type { Locale } from '@/types'

const locales = { es, en: enUS }

export function formatDate(date: string | Date, pattern = 'dd MMM yyyy', locale: Locale = 'es') {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, pattern, { locale: locales[locale] })
}

export function formatDateTime(date: string | Date, locale: Locale = 'es') {
  return formatDate(date, "dd MMM yyyy · HH:mm", locale)
}

export function formatRelative(date: string | Date, locale: Locale = 'es') {
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(d, { addSuffix: true, locale: locales[locale] })
}

export function friendlyDay(date: string, locale: Locale = 'es') {
  const d = parseISO(date)
  if (isToday(d)) return locale === 'es' ? 'Hoy' : 'Today'
  if (isTomorrow(d)) return locale === 'es' ? 'Mañana' : 'Tomorrow'
  return formatDate(d, 'EEE d MMM', locale)
}

export function nowIso() {
  return new Date().toISOString()
}

export function todayKey() {
  return format(new Date(), 'yyyy-MM-dd')
}

export function isInCurrentWeek(dateStr: string) {
  const date = parseISO(dateStr)
  const now = new Date()
  return isWithinInterval(date, {
    start: startOfWeek(now, { weekStartsOn: 1 }),
    end: endOfWeek(now, { weekStartsOn: 1 }),
  })
}

export function isInCurrentMonth(dateStr: string) {
  const date = parseISO(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`)
  const now = new Date()
  return isWithinInterval(date, {
    start: startOfMonth(now),
    end: endOfMonth(now),
  })
}
