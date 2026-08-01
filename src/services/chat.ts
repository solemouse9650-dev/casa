import {
  addDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  writeBatch,
  limit,
  type Unsubscribe,
} from 'firebase/firestore'
import { deleteObject, ref } from 'firebase/storage'
import { db, storage } from '@/firebase/config'
import { HOME_ID } from '@/constants'
import { homeCol, homeDoc } from './paths'
import { notifyAndLog } from './activity'
import type { ChatMessage } from '@/types'
import { nowIso } from '@/utils/dates'
import { cleanData } from '@/utils/firestore'
import { uploadHomeFile } from './storage'

export function subscribeChat(cb: (messages: ChatMessage[]) => void): Unsubscribe {
  const q = query(homeCol('messages'), orderBy('createdAt', 'asc'), limit(300))
  return onSnapshot(
    q,
    (snap) => {
      cb(
        snap.docs.map((d) => {
          const data = d.data() as Omit<ChatMessage, 'id'>
          return { id: d.id, ...data }
        }),
      )
    },
    (error) => console.error('[Casa] chat snapshot error', error),
  )
}

export async function sendTextMessage(
  text: string,
  actor: { id: string; name: string },
) {
  const trimmed = text.trim()
  if (!trimmed) throw new Error('Mensaje vacío')

  const refDoc = await addDoc(
    homeCol('messages'),
    cleanData({
      type: 'text',
      text: trimmed,
      createdBy: actor.id,
      createdByName: actor.name,
      createdAt: nowIso(),
      edited: false,
      deleted: false,
    }),
  )

  void notifyAndLog({
    actorId: actor.id,
    actorName: actor.name,
    action: 'create',
    entityType: 'chat',
    entityId: refDoc.id,
    message: `${actor.name} envió un mensaje.`,
    notificationTitle: 'Nuevo mensaje',
  })

  return refDoc.id
}

export async function sendAudioMessage(
  blob: Blob,
  durationSec: number,
  actor: { id: string; name: string },
) {
  const ext = blob.type.includes('mp4') ? 'mp4' : blob.type.includes('ogg') ? 'ogg' : 'webm'
  const file = new File([blob], `audio-${Date.now()}.${ext}`, {
    type: blob.type || 'audio/webm',
  })
  const audioUrl = await uploadHomeFile(`chat/audio/${actor.id}-${Date.now()}.${ext}`, file)

  const refDoc = await addDoc(
    homeCol('messages'),
    cleanData({
      type: 'audio',
      audioUrl,
      audioDuration: Math.max(1, Math.round(durationSec)),
      createdBy: actor.id,
      createdByName: actor.name,
      createdAt: nowIso(),
      edited: false,
      deleted: false,
    }),
  )

  void notifyAndLog({
    actorId: actor.id,
    actorName: actor.name,
    action: 'create',
    entityType: 'chat',
    entityId: refDoc.id,
    message: `${actor.name} envió un audio.`,
    notificationTitle: 'Nuevo audio',
  })

  return refDoc.id
}

export async function editMessage(id: string, text: string, uid: string) {
  const trimmed = text.trim()
  if (!trimmed) throw new Error('Mensaje vacío')

  await updateDoc(
    homeDoc('messages', id),
    cleanData({
      text: trimmed,
      edited: true,
      updatedAt: nowIso(),
      editedBy: uid,
    }),
  )
}

/** Soft-delete estilo WhatsApp: queda “Este mensaje fue eliminado”. */
export async function deleteMessage(message: ChatMessage, uid: string) {
  if (message.createdBy !== uid) {
    throw new Error('Solo podés eliminar tus propios mensajes')
  }

  await updateDoc(
    homeDoc('messages', message.id),
    cleanData({
      deleted: true,
      text: '',
      updatedAt: nowIso(),
    }),
  )

  if (message.audioUrl) {
    try {
      const path = decodeURIComponent(
        message.audioUrl.split('/o/')[1]?.split('?')[0] ?? '',
      )
      if (path) await deleteObject(ref(storage, path))
    } catch {
      // el audio puede no existir
    }
    await updateDoc(homeDoc('messages', message.id), { audioUrl: null, type: 'text' })
  }
}

/** Borra todo el chat de la familia. */
export async function clearChat(actor: { id: string; name: string }) {
  const snap = await getDocs(query(homeCol('messages'), limit(500)))
  const batch = writeBatch(db)
  const audioPaths: string[] = []

  snap.docs.forEach((d) => {
    const data = d.data() as ChatMessage
    if (data.audioUrl) {
      const path = decodeURIComponent(data.audioUrl.split('/o/')[1]?.split('?')[0] ?? '')
      if (path) audioPaths.push(path)
    }
    batch.delete(d.ref)
  })

  await batch.commit()

  await Promise.all(
    audioPaths.map(async (path) => {
      try {
        await deleteObject(ref(storage, path))
      } catch {
        /* ignore */
      }
    }),
  )

  void notifyAndLog({
    actorId: actor.id,
    actorName: actor.name,
    action: 'delete',
    entityType: 'chat',
    entityId: HOME_ID,
    message: `${actor.name} vació el chat familiar.`,
    notificationTitle: 'Chat vaciado',
  })
}
