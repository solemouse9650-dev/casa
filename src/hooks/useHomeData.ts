import { useEffect } from 'react'
import { useDataStore } from '@/stores/dataStore'
import { useAuth } from '@/hooks/useAuth'
import { subscribeUsers } from '@/services/users'
import { subscribeShopping } from '@/services/shopping'
import { subscribeTasks } from '@/services/tasks'
import { subscribeEvents } from '@/services/events'
import { subscribeReminders } from '@/services/reminders'
import { subscribeNotes } from '@/services/notes'
import { subscribeInventory } from '@/services/inventory'
import { subscribeExpenses } from '@/services/expenses'
import { subscribeActivity, subscribeNotifications } from '@/services/notifications'

export function useHomeData() {
  const { user } = useAuth()
  const setUsers = useDataStore((s) => s.setUsers)
  const setShopping = useDataStore((s) => s.setShopping)
  const setTasks = useDataStore((s) => s.setTasks)
  const setEvents = useDataStore((s) => s.setEvents)
  const setReminders = useDataStore((s) => s.setReminders)
  const setNotes = useDataStore((s) => s.setNotes)
  const setInventory = useDataStore((s) => s.setInventory)
  const setExpenses = useDataStore((s) => s.setExpenses)
  const setActivity = useDataStore((s) => s.setActivity)
  const setNotifications = useDataStore((s) => s.setNotifications)
  const setReady = useDataStore((s) => s.setReady)

  useEffect(() => {
    if (!user) {
      setReady(false)
      return
    }

    const unsubs = [
      subscribeUsers(setUsers),
      subscribeShopping(setShopping),
      subscribeTasks(setTasks),
      subscribeEvents(setEvents),
      subscribeReminders(setReminders),
      subscribeNotes(setNotes),
      subscribeInventory(setInventory),
      subscribeExpenses(setExpenses),
      subscribeActivity(setActivity),
      subscribeNotifications(setNotifications),
    ]

    setReady(true)
    return () => unsubs.forEach((u) => u())
  }, [
    user,
    setUsers,
    setShopping,
    setTasks,
    setEvents,
    setReminders,
    setNotes,
    setInventory,
    setExpenses,
    setActivity,
    setNotifications,
    setReady,
  ])
}
