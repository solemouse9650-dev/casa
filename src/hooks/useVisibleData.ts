import { useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useDataStore } from '@/stores/dataStore'
import { filterCalendarVisible, filterVisible } from '@/utils/visibility'

/** Datos filtrados según visibilidad familiar / privada del usuario actual. */
export function useVisibleData() {
  const { user } = useAuth()
  const uid = user?.uid
  const shopping = useDataStore((s) => s.shopping)
  const tasks = useDataStore((s) => s.tasks)
  const notes = useDataStore((s) => s.notes)
  const reminders = useDataStore((s) => s.reminders)
  const events = useDataStore((s) => s.events)
  const inventory = useDataStore((s) => s.inventory)
  const expenses = useDataStore((s) => s.expenses)
  const activity = useDataStore((s) => s.activity)
  const users = useDataStore((s) => s.users)

  return useMemo(
    () => ({
      uid,
      users,
      shopping: filterVisible(shopping, uid),
      tasks: filterVisible(tasks, uid),
      notes: filterVisible(notes, uid),
      reminders: filterVisible(reminders, uid),
      events: filterVisible(events, uid),
      inventory,
      expenses,
      activity,
      calendarTasks: filterCalendarVisible(tasks, uid),
      calendarShopping: filterCalendarVisible(shopping, uid),
      calendarReminders: filterCalendarVisible(reminders, uid),
      calendarEvents: filterCalendarVisible(events, uid),
    }),
    [uid, users, shopping, tasks, notes, reminders, events, inventory, expenses, activity],
  )
}
