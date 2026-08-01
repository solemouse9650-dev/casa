import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  Bell,
  Check,
  MessageCircle,
  MoreVertical,
  Pencil,
  SendHorizontal,
  Trash2,
  Users,
} from 'lucide-react'
import { format, isToday, isYesterday, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useActor, useAuth } from '@/hooks/useAuth'
import { useDataStore } from '@/stores/dataStore'
import {
  clearChat,
  deleteMessage,
  dmChatId,
  editMessage,
  ensureDmChat,
  ensureFamilyChat,
  sendTextMessage,
  subscribeChats,
  subscribeMessages,
} from '@/services/chat'
import { requestPushPermission } from '@/services/push'
import type { ChatMessage, ChatThread, UserProfile } from '@/types'
import { getFirestoreErrorMessage } from '@/utils/firestore'
import { cn } from '@/utils/cn'

function dayLabel(iso: string) {
  const d = parseISO(iso)
  if (isToday(d)) return 'Hoy'
  if (isYesterday(d)) return 'Ayer'
  return format(d, "d 'de' MMMM", { locale: es })
}

function formatTime(iso: string) {
  return format(parseISO(iso), 'HH:mm')
}

export function ChatPage() {
  const actor = useActor()
  const { user } = useAuth()
  const uid = user?.uid ?? ''
  const users = useDataStore((s) => s.users)
  const [params, setParams] = useSearchParams()
  const [chats, setChats] = useState<ChatThread[]>([])
  const [chatId, setChatId] = useState(params.get('c') || 'family')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [menuId, setMenuId] = useState<string | null>(null)
  const [editing, setEditing] = useState<ChatMessage | null>(null)
  const [editText, setEditText] = useState('')
  const [headerOpen, setHeaderOpen] = useState(false)
  const [clearOpen, setClearOpen] = useState(false)
  const [mobileList, setMobileList] = useState(!params.get('c'))
  const [notifState, setNotifState] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default',
  )
  const bottomRef = useRef<HTMLDivElement>(null)

  const others = useMemo(
    () => users.filter((u) => u.uid !== uid).sort((a, b) => a.displayName.localeCompare(b.displayName)),
    [users, uid],
  )

  useEffect(() => {
    if (!uid) return
    void ensureFamilyChat()
    return subscribeChats(uid, setChats)
  }, [uid])

  useEffect(() => {
    if (!chatId) return
    return subscribeMessages(chatId, setMessages)
  }, [chatId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, chatId])

  useEffect(() => {
    const c = params.get('c')
    if (c) {
      setChatId(c)
      setMobileList(false)
    }
  }, [params])

  const activeChat = useMemo(() => {
    if (chatId === 'family') {
      return (
        chats.find((c) => c.id === 'family') || {
          id: 'family',
          type: 'family' as const,
          memberIds: [],
          title: 'Familiar',
          updatedAt: '',
        }
      )
    }
    return chats.find((c) => c.id === chatId)
  }, [chats, chatId])

  const activeTitle = useMemo(() => {
    if (chatId === 'family') return 'Familiar'
    const otherUid = chatId.replace(/^dm_/, '').split('_').find((id) => id !== uid)
    return (
      users.find((u) => u.uid === otherUid)?.displayName ||
      activeChat?.title ||
      'Chat'
    )
  }, [chatId, uid, users, activeChat])

  const grouped = useMemo(() => {
    const days: { label: string; items: ChatMessage[] }[] = []
    messages.forEach((m) => {
      const label = dayLabel(m.createdAt)
      const last = days[days.length - 1]
      if (!last || last.label !== label) days.push({ label, items: [m] })
      else last.items.push(m)
    })
    return days
  }, [messages])

  const openFamily = () => {
    setChatId('family')
    setParams({ c: 'family' })
    setMobileList(false)
  }

  const openDm = async (person: UserProfile) => {
    try {
      const id = await ensureDmChat(actor, person)
      setChatId(id)
      setParams({ c: id })
      setMobileList(false)
    } catch (error) {
      window.alert(getFirestoreErrorMessage(error))
    }
  }

  const recipientIds = useMemo(() => {
    if (chatId === 'family') return others.map((u) => u.uid)
    return activeChat?.memberIds?.filter((id) => id !== uid) || []
  }, [chatId, others, activeChat, uid])

  const sendText = async () => {
    if (!text.trim() || sending || !chatId) return
    setSending(true)
    try {
      await sendTextMessage(chatId, text, actor, {
        recipientIds,
        chatTitle: chatId === 'family' ? 'Chat familiar' : activeTitle,
      })
      setText('')
    } catch (error) {
      window.alert(getFirestoreErrorMessage(error))
    } finally {
      setSending(false)
    }
  }

  const enableNotifs = async () => {
    if (!uid) return
    const result = await requestPushPermission(uid)
    setNotifState(typeof Notification !== 'undefined' ? Notification.permission : result)
    if (result === 'granted') {
      window.alert('Notificaciones activadas. Te van a llegar con la sesión iniciada.')
    } else if (result === 'denied') {
      window.alert('Las notificaciones están bloqueadas. Activalas en la configuración del navegador.')
    }
  }

  const conversationList = (
    <div className="flex h-full flex-col border-r border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
      <div className="border-b border-[var(--color-border)] px-4 py-3">
        <h1 className="font-[family-name:var(--font-display)] text-xl font-semibold">Chats</h1>
        <p className="text-xs text-[var(--color-ink-muted)]">Familiar o privado</p>
        {notifState !== 'granted' ? (
          <Button variant="soft" size="sm" className="mt-3 w-full" onClick={() => void enableNotifs()}>
            <Bell className="h-4 w-4" />
            Activar notificaciones
          </Button>
        ) : (
          <p className="mt-2 flex items-center gap-1 text-xs text-[var(--color-success)]">
            <Bell className="h-3.5 w-3.5" /> Notificaciones activas
          </p>
        )}
        <p className="mt-2 text-[11px] leading-snug text-[var(--color-ink-muted)]">
          Push al celular usa FCM HTTP v1 (cuenta de servicio en Vercel), no la API heredada.
        </p>
      </div>

      <button
        onClick={openFamily}
        className={cn(
          'flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-3 text-left hover:bg-[var(--color-surface)]',
          chatId === 'family' && !mobileList && 'bg-[var(--color-accent-soft)]',
        )}
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-accent)] text-white">
          <Users className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Familiar</p>
          <p className="truncate text-xs text-[var(--color-ink-muted)]">
            {chats.find((c) => c.id === 'family')?.lastText || 'Chat de toda la casa'}
          </p>
        </div>
      </button>

      <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">
        Personas
      </div>
      <div className="flex-1 overflow-y-auto">
        {others.length === 0 ? (
          <p className="px-4 text-sm text-[var(--color-ink-muted)]">
            Cuando la familia inicie sesión, vas a poder chatear en privado.
          </p>
        ) : (
          others.map((person) => {
            const id = dmChatId(uid, person.uid)
            const preview = chats.find((c) => c.id === id)
            return (
              <button
                key={person.uid}
                onClick={() => void openDm(person)}
                className={cn(
                  'flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[var(--color-surface)]',
                  chatId === id && !mobileList && 'bg-[var(--color-accent-soft)]',
                )}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-warm-soft)] font-semibold text-[var(--color-warm)]">
                  {person.displayName.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{person.displayName}</p>
                  <p className="truncate text-xs text-[var(--color-ink-muted)]">
                    {preview?.lastText || 'Chat privado'}
                  </p>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )

  return (
    <div className="-mx-4 -my-5 flex h-[calc(100dvh-7.5rem)] overflow-hidden sm:-mx-6 lg:h-[calc(100dvh-5.5rem)]">
      <aside className={cn('w-full lg:w-[320px] lg:shrink-0', mobileList ? 'block' : 'hidden lg:block')}>
        {conversationList}
      </aside>

      <section className={cn('flex min-w-0 flex-1 flex-col', mobileList ? 'hidden lg:flex' : 'flex')}>
        <header className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setMobileList(true)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
              {chatId === 'family' ? <Users className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
            </div>
            <div>
              <p className="font-semibold leading-tight">{activeTitle}</p>
              <p className="text-[11px] text-[var(--color-ink-muted)]">
                {chatId === 'family' ? 'Todos en la casa' : 'Chat privado · solo texto'}
              </p>
            </div>
          </div>
          <div className="relative">
            <Button variant="ghost" size="sm" onClick={() => setHeaderOpen((v) => !v)}>
              <MoreVertical className="h-4 w-4" />
            </Button>
            {headerOpen ? (
              <div className="absolute right-0 top-10 z-20 w-44 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-1 shadow-[var(--shadow-lift)]">
                <button
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--color-danger)] hover:bg-[var(--color-surface)]"
                  onClick={() => {
                    setHeaderOpen(false)
                    setClearOpen(true)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Vaciar chat
                </button>
              </div>
            ) : null}
          </div>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto bg-[linear-gradient(180deg,rgb(27_122_110/0.04),transparent_180px)] px-3 py-4">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center px-6 text-center">
              <p className="max-w-xs text-sm text-[var(--color-ink-muted)]">
                No hay mensajes todavía. Escribí el primero.
              </p>
            </div>
          ) : (
            grouped.map((group) => (
              <div key={group.label}>
                <div className="sticky top-1 z-10 mb-3 flex justify-center">
                  <span className="rounded-full bg-[var(--color-surface-elevated)] px-3 py-1 text-xs text-[var(--color-ink-muted)] shadow-sm">
                    {group.label}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {group.items.map((msg) => {
                    const mine = msg.createdBy === uid
                    return (
                      <div key={msg.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                        <motion.div
                          layout
                          className={cn(
                            'relative max-w-[85%] rounded-2xl px-3 py-2 shadow-sm sm:max-w-[70%]',
                            mine
                              ? 'rounded-br-md bg-[var(--color-accent)] text-white'
                              : 'rounded-bl-md border border-[var(--color-border)] bg-[var(--color-surface-elevated)]',
                          )}
                        >
                          {!mine && chatId === 'family' ? (
                            <p className="mb-1 text-xs font-semibold text-[var(--color-accent)]">
                              {msg.createdByName}
                            </p>
                          ) : null}

                          {msg.deleted ? (
                            <p className={cn('text-sm italic', mine ? 'text-white/80' : 'text-[var(--color-ink-muted)]')}>
                              Este mensaje fue eliminado
                            </p>
                          ) : (
                            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                              {msg.text}
                            </p>
                          )}

                          <div
                            className={cn(
                              'mt-1 flex items-center justify-end gap-1 text-[10px]',
                              mine ? 'text-white/70' : 'text-[var(--color-ink-muted)]',
                            )}
                          >
                            {msg.edited && !msg.deleted ? <span>editado</span> : null}
                            <span>{formatTime(msg.createdAt)}</span>
                            {mine && !msg.deleted ? (
                              <button
                                className="ml-1 rounded p-0.5 hover:bg-black/10"
                                onClick={() => setMenuId(menuId === msg.id ? null : msg.id)}
                              >
                                <MoreVertical className="h-3 w-3" />
                              </button>
                            ) : null}
                          </div>

                          <AnimatePresence>
                            {menuId === msg.id ? (
                              <motion.div
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 4 }}
                                className="absolute right-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-[var(--color-ink)] shadow-[var(--shadow-lift)]"
                              >
                                <button
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--color-surface)]"
                                  onClick={() => {
                                    setEditing(msg)
                                    setEditText(msg.text || '')
                                    setMenuId(null)
                                  }}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                  Editar
                                </button>
                                <button
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--color-danger)] hover:bg-[var(--color-surface)]"
                                  onClick={async () => {
                                    if (!window.confirm('¿Eliminar este mensaje?')) return
                                    try {
                                      await deleteMessage(chatId, msg, uid)
                                      setMenuId(null)
                                    } catch (error) {
                                      window.alert(getFirestoreErrorMessage(error))
                                    }
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Eliminar
                                </button>
                              </motion.div>
                            ) : null}
                          </AnimatePresence>
                        </motion.div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-3">
          <div className="flex items-end gap-2">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escribí un mensaje…"
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void sendText()
                }
              }}
            />
            <Button size="sm" onClick={() => void sendText()} disabled={sending || !text.trim()}>
              <SendHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar mensaje">
        <div className="space-y-4">
          <Input value={editText} onChange={(e) => setEditText(e.target.value)} autoFocus />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                if (!editing) return
                try {
                  await editMessage(chatId, editing.id, editText, uid)
                  setEditing(null)
                } catch (error) {
                  window.alert(getFirestoreErrorMessage(error))
                }
              }}
            >
              <Check className="h-4 w-4" />
              Guardar
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={clearOpen} onClose={() => setClearOpen(false)} title="Vaciar chat">
        <p className="text-sm text-[var(--color-ink-muted)]">
          Se borran todos los mensajes de esta conversación para todos los participantes.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setClearOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              try {
                await clearChat(chatId, actor)
                setClearOpen(false)
              } catch (error) {
                window.alert(getFirestoreErrorMessage(error))
              }
            }}
          >
            Vaciar
          </Button>
        </div>
      </Modal>
    </div>
  )
}
