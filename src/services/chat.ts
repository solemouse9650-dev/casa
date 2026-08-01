import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  writeBatch,
  limit,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import { HOME_ID } from '@/constants'
import { notifyAndLog } from './activity'
import type { ChatMessage, ChatThread, UserProfile } from '@/types'
import { nowIso } from '@/utils/dates'
import { cleanData } from '@/utils/firestore'

const chatsCol = () => collection(db, 'homes', HOME_ID, 'chats')
const chatRef = (chatId: string) => doc(db, 'homes', HOME_ID, 'chats', chatId)
const messagesCol = (chatId: string) =>
  collection(db, 'homes', HOME_ID, 'chats', chatId, 'messages')
const messageRef = (chatId: string, messageId: string) =>
  doc(db, 'homes', HOME_ID, 'chats', chatId, 'messages', messageId)

export function dmChatId(uidA: string, uidB: string) {
  return `dm_${[uidA, uidB].sort().join('_')}`
}

export async function ensureFamilyChat() {
  const ref = chatRef('family')
  const snap = await getDoc(ref)
  if (snap.exists()) return
  await setDoc(
    ref,
    cleanData({
      type: 'family',
      memberIds: [],
      title: 'Familiar',
      updatedAt: nowIso(),
    }),
  )
}

export async function ensureDmChat(me: { id: string; name: string }, other: UserProfile) {
  const id = dmChatId(me.id, other.uid)
  const ref = chatRef(id)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await setDoc(
      ref,
      cleanData({
        type: 'dm',
        memberIds: [me.id, other.uid].sort(),
        title: other.displayName,
        updatedAt: nowIso(),
      }),
    )
  }
  return id
}

export function subscribeChats(uid: string, cb: (chats: ChatThread[]) => void): Unsubscribe {
  void ensureFamilyChat()
  const q = query(chatsCol(), orderBy('updatedAt', 'desc'), limit(50))
  return onSnapshot(
    q,
    (snap) => {
      const chats = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<ChatThread, 'id'>) }))
        .filter((c) => c.type === 'family' || c.memberIds?.includes(uid))
      chats.sort((a, b) => {
        if (a.id === 'family') return -1
        if (b.id === 'family') return 1
        return (b.updatedAt || '').localeCompare(a.updatedAt || '')
      })
      cb(chats)
    },
    (error) => console.error('[Casa] chats snapshot', error),
  )
}

export function subscribeMessages(
  chatId: string,
  cb: (messages: ChatMessage[]) => void,
): Unsubscribe {
  const q = query(messagesCol(chatId), orderBy('createdAt', 'asc'), limit(300))
  return onSnapshot(
    q,
    (snap) => {
      cb(
        snap.docs.map((d) => ({
          id: d.id,
          chatId,
          ...(d.data() as Omit<ChatMessage, 'id' | 'chatId'>),
        })),
      )
    },
    (error) => console.error('[Casa] messages snapshot', error),
  )
}

/** Escucha actividad de chats para notificaciones en el dispositivo. */
export function subscribeChatActivity(
  uid: string,
  cb: (event: { chatId: string; message: ChatMessage; title: string }) => void,
): Unsubscribe {
  const q = query(chatsCol(), orderBy('updatedAt', 'desc'), limit(30))
  const lastSeen = new Map<string, string>()
  let ready = false

  return onSnapshot(
    q,
    (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type !== 'modified' && change.type !== 'added') return
        const data = change.doc.data() as ChatThread
        const chatId = change.doc.id
        if (data.type === 'dm' && !data.memberIds?.includes(uid)) return
        if (!data.lastAt || !data.lastBy || data.lastBy === uid) return

        const prev = lastSeen.get(chatId)
        lastSeen.set(chatId, data.lastAt)
        if (!ready) return
        if (prev === data.lastAt) return

        cb({
          chatId,
          title: data.type === 'family' ? 'Chat familiar' : data.title || 'Mensaje',
          message: {
            id: 'preview',
            chatId,
            type: 'text',
            text: data.lastText || 'Nuevo mensaje',
            createdBy: data.lastBy,
            createdByName: data.lastByName || 'Alguien',
            createdAt: data.lastAt,
          },
        })
      })
      ready = true
    },
    (error) => console.error('[Casa] chat activity', error),
  )
}

export async function sendTextMessage(
  chatId: string,
  text: string,
  actor: { id: string; name: string },
  opts?: { recipientIds?: string[]; chatTitle?: string },
) {
  const trimmed = text.trim()
  if (!trimmed) throw new Error('Mensaje vacío')
  const createdAt = nowIso()

  const refDoc = await addDoc(
    messagesCol(chatId),
    cleanData({
      type: 'text',
      text: trimmed,
      createdBy: actor.id,
      createdByName: actor.name,
      createdAt,
      edited: false,
      deleted: false,
    }),
  )

  await setDoc(
    chatRef(chatId),
    cleanData({
      lastText: trimmed.slice(0, 140),
      lastAt: createdAt,
      lastBy: actor.id,
      lastByName: actor.name,
      updatedAt: createdAt,
    }),
    { merge: true },
  )

  void notifyAndLog({
    actorId: actor.id,
    actorName: actor.name,
    action: 'create',
    entityType: 'chat',
    entityId: refDoc.id,
    message: `${actor.name}: ${trimmed.slice(0, 80)}`,
    notificationTitle: opts?.chatTitle || 'Nuevo mensaje',
  })

  if (opts?.recipientIds?.length) {
    void (async () => {
      try {
        const tokens: string[] = []
        await Promise.all(
          opts.recipientIds!.map(async (uid) => {
            const snap = await getDoc(doc(db, 'users', uid))
            const data = snap.data() as { fcmTokens?: string[] } | undefined
            if (data?.fcmTokens?.length) tokens.push(...data.fcmTokens)
          }),
        )
        if (!tokens.length) return
        await fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tokens,
            title: opts.chatTitle || 'Casa',
            body: `${actor.name}: ${trimmed.slice(0, 100)}`,
            url: `/chat?c=${encodeURIComponent(chatId)}`,
          }),
        })
      } catch (err) {
        console.warn('[Casa] push notify', err)
      }
    })()
  }

  return refDoc.id
}

export async function editMessage(chatId: string, id: string, text: string, uid: string) {
  const trimmed = text.trim()
  if (!trimmed) throw new Error('Mensaje vacío')
  await updateDoc(
    messageRef(chatId, id),
    cleanData({
      text: trimmed,
      edited: true,
      updatedAt: nowIso(),
      editedBy: uid,
    }),
  )
}

export async function deleteMessage(chatId: string, message: ChatMessage, uid: string) {
  if (message.createdBy !== uid) {
    throw new Error('Solo podés eliminar tus propios mensajes')
  }
  await updateDoc(
    messageRef(chatId, message.id),
    cleanData({
      deleted: true,
      text: '',
      updatedAt: nowIso(),
    }),
  )
}

export async function clearChat(chatId: string, actor: { id: string; name: string }) {
  const snap = await getDocs(query(messagesCol(chatId), limit(500)))
  const batch = writeBatch(db)
  snap.docs.forEach((d) => batch.delete(d.ref))
  await batch.commit()
  await setDoc(
    chatRef(chatId),
    cleanData({
      lastText: '',
      lastAt: nowIso(),
      updatedAt: nowIso(),
    }),
    { merge: true },
  )
  void notifyAndLog({
    actorId: actor.id,
    actorName: actor.name,
    action: 'delete',
    entityType: 'chat',
    entityId: chatId,
    message: `${actor.name} vació un chat.`,
    notificationTitle: 'Chat vaciado',
  })
}
