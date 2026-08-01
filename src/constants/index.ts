import type { PaymentMethod, Priority, ReminderType, TaskStatus } from '@/types'

export const HOME_ID = import.meta.env.VITE_HOME_ID || 'familia'

export const SHOPPING_CATEGORIES = [
  'Supermercado',
  'Verdulería',
  'Carnicería',
  'Farmacia',
  'Ferretería',
  'Limpieza',
  'Mascotas',
  'Electrodomésticos',
  'Otros',
] as const

export const TASK_CATEGORIES = [
  'Limpieza',
  'Cocina',
  'Baño',
  'Lavadero',
  'Patio',
  'Mascotas',
  'Compras',
  'Reparaciones',
  'Administración',
  'Otros',
] as const

export const NOTE_CATEGORIES = [
  'WiFi',
  'Teléfonos',
  'Recetas',
  'Importante',
  'Otros',
] as const

export const INVENTORY_CATEGORIES = [
  'Alimentos',
  'Bebidas',
  'Limpieza',
  'Higiene',
  'Mascotas',
  'Otros',
] as const

export const EXPENSE_CATEGORIES = [
  'Supermercado',
  'Servicios',
  'Transporte',
  'Salud',
  'Hogar',
  'Ocio',
  'Otros',
] as const

export const UNITS = [
  'u',
  'kg',
  'g',
  'l',
  'ml',
  'pack',
  'caja',
  'bolsa',
] as const

export const PRIORITIES: { value: Priority; labelKey: string; color: string }[] = [
  { value: 'low', labelKey: 'priority.low', color: '#5c6b66' },
  { value: 'medium', labelKey: 'priority.medium', color: '#1b7a6e' },
  { value: 'high', labelKey: 'priority.high', color: '#c96b3c' },
  { value: 'urgent', labelKey: 'priority.urgent', color: '#c23b3b' },
]

export const TASK_STATUSES: { value: TaskStatus; labelKey: string }[] = [
  { value: 'pending', labelKey: 'status.pending' },
  { value: 'in_progress', labelKey: 'status.in_progress' },
  { value: 'done', labelKey: 'status.done' },
  { value: 'cancelled', labelKey: 'status.cancelled' },
]

export const REMINDER_TYPES: { value: ReminderType; labelKey: string }[] = [
  { value: 'general', labelKey: 'reminderType.general' },
  { value: 'task', labelKey: 'reminderType.task' },
  { value: 'shopping', labelKey: 'reminderType.shopping' },
  { value: 'bill', labelKey: 'reminderType.bill' },
  { value: 'other', labelKey: 'reminderType.other' },
]

export const PAYMENT_METHODS: { value: PaymentMethod; labelKey: string }[] = [
  { value: 'cash', labelKey: 'payment.cash' },
  { value: 'debit', labelKey: 'payment.debit' },
  { value: 'credit', labelKey: 'payment.credit' },
  { value: 'transfer', labelKey: 'payment.transfer' },
  { value: 'other', labelKey: 'payment.other' },
]

export const NOTE_COLORS = [
  '#d8efe9',
  '#f6e5da',
  '#e8e4f5',
  '#f5e8d4',
  '#dce8f5',
  '#f5dce4',
  '#e4f0d8',
  '#f0f0f0',
]

export const KNOWN_USERS: Record<string, string> = {
  tHS9kPGShFfIQbrBla2dbTW8qiR2: 'Papá',
  RN1I0ZDFrAhZhl05TFppGonB5X22: 'Mamá',
  GrxignhHKobunFQgDozIa4NQB4H2: 'Abril',
  gj6CJsmuBIPBb806ezUmDBGwfGO2: 'Ale',
}

export const NAV_ITEMS = [
  { to: '/inicio', labelKey: 'nav.dashboard', icon: 'Home' },
  { to: '/compras', labelKey: 'nav.shopping', icon: 'ShoppingCart' },
  { to: '/tareas', labelKey: 'nav.tasks', icon: 'CheckSquare' },
  { to: '/calendario', labelKey: 'nav.calendar', icon: 'Calendar' },
  { to: '/recordatorios', labelKey: 'nav.reminders', icon: 'Bell' },
  { to: '/notas', labelKey: 'nav.notes', icon: 'StickyNote' },
  { to: '/inventario', labelKey: 'nav.inventory', icon: 'Package' },
  { to: '/gastos', labelKey: 'nav.expenses', icon: 'Wallet' },
  { to: '/estadisticas', labelKey: 'nav.stats', icon: 'BarChart3' },
  { to: '/actividad', labelKey: 'nav.activity', icon: 'Activity' },
  { to: '/configuracion', labelKey: 'nav.settings', icon: 'Settings' },
] as const
