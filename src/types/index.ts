export type Priority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskStatus = 'pending' | 'in_progress' | 'done' | 'cancelled'
export type ShoppingStatus = 'pending' | 'purchased'
export type ReminderStatus = 'pending' | 'done' | 'dismissed'
export type ReminderType = 'general' | 'task' | 'shopping' | 'bill' | 'other'
export type Recurrence = 'none' | 'daily' | 'weekly' | 'monthly'
export type PaymentMethod = 'cash' | 'debit' | 'credit' | 'transfer' | 'other'
export type Locale = 'es' | 'en'
export type ThemeMode = 'light' | 'dark'
/** family = toda la casa; private = solo el creador (y assignee en tareas) */
export type Visibility = 'family' | 'private'

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  createdAt: string
  lastLoginAt: string
}

export interface Attachment {
  name: string
  url: string
  type: string
  size: number
}

export interface ShoppingItem {
  id: string
  name: string
  category: string
  quantity: number
  unit: string
  priority: Priority
  notes?: string
  estimatedPrice?: number
  finalPrice?: number
  status: ShoppingStatus
  imageUrl?: string
  visibility: Visibility
  createdBy: string
  createdByName: string
  purchasedBy?: string
  purchasedByName?: string
  createdAt: string
  purchasedAt?: string
  scheduledFor?: string
}

export interface TaskItem {
  id: string
  title: string
  description?: string
  category: string
  priority: Priority
  assigneeId?: string
  assigneeName?: string
  dueDate?: string
  dueTime?: string
  status: TaskStatus
  notes?: string
  attachments: Attachment[]
  recurrence: Recurrence
  visibility: Visibility
  createdBy: string
  createdByName: string
  completedBy?: string
  completedByName?: string
  createdAt: string
  completedAt?: string
}

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  date: string
  time?: string
  endTime?: string
  color?: string
  visibility: Visibility
  createdBy: string
  createdByName: string
  createdAt: string
}

export interface ReminderItem {
  id: string
  message: string
  date: string
  time: string
  type: ReminderType
  status: ReminderStatus
  visibility: Visibility
  createdBy: string
  createdByName: string
  createdAt: string
}

export interface NoteItem {
  id: string
  title: string
  content: string
  color: string
  category: string
  visibility: Visibility
  createdBy: string
  createdByName: string
  createdAt: string
  updatedAt: string
}

export interface InventoryItem {
  id: string
  name: string
  quantity: number
  minQuantity: number
  unit: string
  category: string
  notes?: string
  createdBy: string
  createdByName: string
  createdAt: string
  updatedAt: string
}

export interface ExpenseItem {
  id: string
  amount: number
  category: string
  description: string
  date: string
  paidBy: string
  paidByName: string
  paymentMethod: PaymentMethod
  createdBy: string
  createdByName: string
  createdAt: string
}

export type ChatType = 'family' | 'dm'

export interface ChatThread {
  id: string
  type: ChatType
  memberIds: string[]
  title: string
  lastText?: string
  lastAt?: string
  lastBy?: string
  lastByName?: string
  updatedAt: string
}

export interface ChatMessage {
  id: string
  chatId: string
  type: 'text'
  text: string
  createdBy: string
  createdByName: string
  createdAt: string
  updatedAt?: string
  edited?: boolean
  deleted?: boolean
}

export type EntityType =
  | 'shopping'
  | 'task'
  | 'event'
  | 'reminder'
  | 'note'
  | 'inventory'
  | 'expense'
  | 'chat'

export interface ActivityItem {
  id: string
  actorId: string
  actorName: string
  action: string
  entityType: EntityType
  entityId: string
  message: string
  createdAt: string
}

export interface NotificationItem {
  id: string
  title: string
  message: string
  entityType?: EntityType
  entityId?: string
  readBy: string[]
  createdAt: string
  createdBy: string
}

export interface HomeSettings {
  homeName: string
  currency: string
  updatedAt: string
}
