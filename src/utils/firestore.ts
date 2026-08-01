import type { FirestoreError } from 'firebase/firestore'

/** Firestore no acepta `undefined` ni `NaN`. */
export function cleanData<T extends Record<string, unknown>>(data: T): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue
    if (typeof value === 'number' && Number.isNaN(value)) continue
    if (typeof value === 'string' && value.trim() === '' && key !== 'content') {
      // strings vacías opcionales → omitir (salvo contenido de notas)
      if (
        [
          'notes',
          'description',
          'imageUrl',
          'scheduledFor',
          'dueDate',
          'dueTime',
          'time',
          'endTime',
          'assigneeId',
          'assigneeName',
        ].includes(key)
      ) {
        continue
      }
    }
    out[key] = value
  }
  return out
}

export function getFirestoreErrorMessage(error: unknown): string {
  const code =
    typeof error === 'object' && error && 'code' in error
      ? String((error as FirestoreError).code)
      : ''
  const message =
    typeof error === 'object' && error && 'message' in error
      ? String((error as { message: string }).message)
      : String(error)

  if (code === 'permission-denied') {
    return 'Firebase denegó el acceso. Desplegá las reglas de Firestore (firebase deploy --only firestore:rules).'
  }
  if (code === 'unavailable') {
    return 'Firestore no disponible. Revisá internet o que la base esté creada en el proyecto.'
  }
  if (code === 'failed-precondition') {
    return 'Falta un índice en Firestore. Abrí el link del error en la consola del navegador.'
  }
  if (message.includes('undefined') || message.includes('Unsupported field value')) {
    return 'Hay un campo inválido al guardar. Intentá de nuevo.'
  }
  return message || 'Error al guardar en Firebase.'
}
