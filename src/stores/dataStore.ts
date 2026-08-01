import { create } from 'zustand'
import type {
  ActivityItem,
  CalendarEvent,
  ExpenseItem,
  InventoryItem,
  NoteItem,
  NotificationItem,
  ReminderItem,
  ShoppingItem,
  TaskItem,
  UserProfile,
} from '@/types'

interface DataState {
  users: UserProfile[]
  shopping: ShoppingItem[]
  tasks: TaskItem[]
  events: CalendarEvent[]
  reminders: ReminderItem[]
  notes: NoteItem[]
  inventory: InventoryItem[]
  expenses: ExpenseItem[]
  activity: ActivityItem[]
  notifications: NotificationItem[]
  ready: boolean
  setUsers: (users: UserProfile[]) => void
  setShopping: (shopping: ShoppingItem[]) => void
  setTasks: (tasks: TaskItem[]) => void
  setEvents: (events: CalendarEvent[]) => void
  setReminders: (reminders: ReminderItem[]) => void
  setNotes: (notes: NoteItem[]) => void
  setInventory: (inventory: InventoryItem[]) => void
  setExpenses: (expenses: ExpenseItem[]) => void
  setActivity: (activity: ActivityItem[]) => void
  setNotifications: (notifications: NotificationItem[]) => void
  setReady: (ready: boolean) => void
}

export const useDataStore = create<DataState>((set) => ({
  users: [],
  shopping: [],
  tasks: [],
  events: [],
  reminders: [],
  notes: [],
  inventory: [],
  expenses: [],
  activity: [],
  notifications: [],
  ready: false,
  setUsers: (users) => set({ users }),
  setShopping: (shopping) => set({ shopping }),
  setTasks: (tasks) => set({ tasks }),
  setEvents: (events) => set({ events }),
  setReminders: (reminders) => set({ reminders }),
  setNotes: (notes) => set({ notes }),
  setInventory: (inventory) => set({ inventory }),
  setExpenses: (expenses) => set({ expenses }),
  setActivity: (activity) => set({ activity }),
  setNotifications: (notifications) => set({ notifications }),
  setReady: (ready) => set({ ready }),
}))
