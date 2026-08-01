export type Visibility = 'family' | 'private'

type VisibleEntity = {
  visibility?: Visibility | string | null
  createdBy?: string
  assigneeId?: string
}

/** Default: familiar (compartido con todos). */
export function getVisibility(item: VisibleEntity): Visibility {
  return item.visibility === 'private' ? 'private' : 'family'
}

/**
 * Quién puede ver el ítem en listas:
 * - family: toda la familia
 * - private: creador + responsable asignado (si hay)
 */
export function canViewEntity(item: VisibleEntity, uid: string | undefined | null) {
  if (!uid) return false
  if (getVisibility(item) === 'family') return true
  if (item.createdBy === uid) return true
  if (item.assigneeId && item.assigneeId === uid) return true
  return false
}

/**
 * Calendario: lo mío siempre; lo de otros solo si lo marcaron como familiar.
 */
export function canViewOnCalendar(item: VisibleEntity, uid: string | undefined | null) {
  if (!uid) return false
  if (item.createdBy === uid) return true
  if (item.assigneeId && item.assigneeId === uid) return true
  return getVisibility(item) === 'family'
}

export function filterVisible<T extends VisibleEntity>(items: T[], uid: string | undefined | null) {
  return items.filter((item) => canViewEntity(item, uid))
}

export function filterCalendarVisible<T extends VisibleEntity>(
  items: T[],
  uid: string | undefined | null,
) {
  return items.filter((item) => canViewOnCalendar(item, uid))
}
