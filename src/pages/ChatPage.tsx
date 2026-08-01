import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Check,
  Mic,
  MoreVertical,
  Pencil,
  SendHorizontal,
  Square,
  Trash2,
  X,
} from 'lucide-react'
import { format, isToday, isYesterday, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useActor, useAuth } from '@/hooks/useAuth'
import {
  clearChat,
  deleteMessage,
  editMessage,
  sendAudioMessage,
  sendTextMessage,
  subscribeChat,
} from '@/services/chat'
import type { ChatMessage } from '@/types'
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

function formatDuration(sec?: number) {
  const s = Math.max(0, sec ?? 0)
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}

export function ChatPage() {
  const actor = useActor()
  const { user } = useAuth()
  const uid = user?.uid ?? ''
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [menuId, setMenuId] = useState<string | null>(null)
  const [editing, setEditing] = useState<ChatMessage | null>(null)
  const [editText, setEditText] = useState('')
  const [headerOpen, setHeaderOpen] = useState(false)
  const [clearOpen, setClearOpen] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recordSecs, setRecordSecs] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startedAtRef = useRef(0)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    const unsub = subscribeChat(setMessages)
    return unsub
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

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

  const sendText = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    try {
      await sendTextMessage(text, actor)
      setText('')
    } catch (error) {
      window.alert(getFirestoreErrorMessage(error))
    } finally {
      setSending(false)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : 'audio/webm'
      const recorder = new MediaRecorder(stream, { mimeType: mime })
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = async () => {
        streamRef.current?.getTracks().forEach((t) => t.stop())
        streamRef.current = null
        if (timerRef.current) window.clearInterval(timerRef.current)
        const duration = (Date.now() - startedAtRef.current) / 1000
        const blob = new Blob(chunksRef.current, { type: mime })
        if (blob.size < 500) {
          setRecording(false)
          setRecordSecs(0)
          return
        }
        setSending(true)
        try {
          await sendAudioMessage(blob, duration, actor)
        } catch (error) {
          window.alert(getFirestoreErrorMessage(error))
        } finally {
          setSending(false)
          setRecording(false)
          setRecordSecs(0)
        }
      }
      mediaRef.current = recorder
      startedAtRef.current = Date.now()
      recorder.start()
      setRecording(true)
      setRecordSecs(0)
      timerRef.current = window.setInterval(() => {
        setRecordSecs(Math.floor((Date.now() - startedAtRef.current) / 1000))
      }, 250)
    } catch {
      window.alert('No se pudo acceder al micrófono. Revisá los permisos del navegador.')
    }
  }

  const stopRecording = () => {
    if (mediaRef.current && mediaRef.current.state !== 'inactive') {
      mediaRef.current.stop()
    }
    mediaRef.current = null
  }

  const cancelRecording = () => {
    if (mediaRef.current && mediaRef.current.state !== 'inactive') {
      mediaRef.current.ondataavailable = null
      mediaRef.current.onstop = () => {
        streamRef.current?.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
      mediaRef.current.stop()
    } else {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (timerRef.current) window.clearInterval(timerRef.current)
    mediaRef.current = null
    setRecording(false)
    setRecordSecs(0)
  }

  const onEdit = async () => {
    if (!editing) return
    try {
      await editMessage(editing.id, editText, uid)
      setEditing(null)
    } catch (error) {
      window.alert(getFirestoreErrorMessage(error))
    }
  }

  const onDelete = async (msg: ChatMessage) => {
    if (!window.confirm('¿Eliminar este mensaje para todos?')) return
    try {
      await deleteMessage(msg, uid)
      setMenuId(null)
    } catch (error) {
      window.alert(getFirestoreErrorMessage(error))
    }
  }

  const onClear = async () => {
    try {
      await clearChat(actor)
      setClearOpen(false)
      setHeaderOpen(false)
    } catch (error) {
      window.alert(getFirestoreErrorMessage(error))
    }
  }

  return (
    <div className="-mx-4 -my-5 flex h-[calc(100dvh-7.5rem)] flex-col sm:-mx-6 lg:h-[calc(100dvh-5.5rem)] lg:pb-0">
      <header className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-semibold">
            Chat familiar
          </h1>
          <p className="text-xs text-[var(--color-ink-muted)]">
            Texto y audios · sin imágenes
          </p>
        </div>
        <div className="relative">
          <Button variant="ghost" size="sm" onClick={() => setHeaderOpen((v) => !v)}>
            <MoreVertical className="h-4 w-4" />
          </Button>
          {headerOpen ? (
            <div className="absolute right-0 top-10 z-20 w-48 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-1 shadow-[var(--shadow-lift)]">
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

      <div
        ref={listRef}
        className="flex-1 space-y-4 overflow-y-auto bg-[linear-gradient(180deg,rgb(27_122_110/0.04),transparent_180px)] px-3 py-4"
      >
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6 text-center">
            <p className="max-w-xs text-sm text-[var(--color-ink-muted)]">
              Todavía no hay mensajes. Escribí algo o mandá un audio para empezar.
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
                    <div
                      key={msg.id}
                      className={cn('flex', mine ? 'justify-end' : 'justify-start')}
                    >
                      <motion.div
                        layout
                        className={cn(
                          'relative max-w-[85%] rounded-2xl px-3 py-2 shadow-sm sm:max-w-[70%]',
                          mine
                            ? 'rounded-br-md bg-[var(--color-accent)] text-white'
                            : 'rounded-bl-md border border-[var(--color-border)] bg-[var(--color-surface-elevated)]',
                        )}
                      >
                        {!mine ? (
                          <p
                            className={cn(
                              'mb-1 text-xs font-semibold',
                              mine ? 'text-white/80' : 'text-[var(--color-accent)]',
                            )}
                          >
                            {msg.createdByName}
                          </p>
                        ) : null}

                        {msg.deleted ? (
                          <p className={cn('text-sm italic', mine ? 'text-white/80' : 'text-[var(--color-ink-muted)]')}>
                            Este mensaje fue eliminado
                          </p>
                        ) : msg.type === 'audio' && msg.audioUrl ? (
                          <div className="min-w-[200px]">
                            <audio controls preload="metadata" src={msg.audioUrl} className="w-full max-w-xs" />
                            <p className={cn('mt-1 text-[10px]', mine ? 'text-white/70' : 'text-[var(--color-ink-muted)]')}>
                              Audio · {formatDuration(msg.audioDuration)}
                            </p>
                          </div>
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
                              {msg.type === 'text' ? (
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
                              ) : null}
                              <button
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--color-danger)] hover:bg-[var(--color-surface)]"
                                onClick={() => onDelete(msg)}
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

      <div className="border-t border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {recording ? (
          <div className="flex items-center gap-3">
            <span className="flex h-2.5 w-2.5 animate-pulse rounded-full bg-[var(--color-danger)]" />
            <p className="flex-1 text-sm font-medium">Grabando… {formatDuration(recordSecs)}</p>
            <Button variant="ghost" size="sm" onClick={cancelRecording}>
              <X className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={stopRecording} disabled={sending}>
              <Square className="h-4 w-4" />
              Enviar
            </Button>
          </div>
        ) : (
          <div className="flex items-end gap-2">
            <Button
              variant="soft"
              size="sm"
              className="shrink-0"
              onClick={startRecording}
              disabled={sending}
              aria-label="Grabar audio"
            >
              <Mic className="h-4 w-4" />
            </Button>
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
            <Button
              size="sm"
              className="shrink-0"
              onClick={() => void sendText()}
              disabled={sending || !text.trim()}
              aria-label="Enviar"
            >
              <SendHorizontal className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar mensaje">
        <div className="space-y-4">
          <Input value={editText} onChange={(e) => setEditText(e.target.value)} autoFocus />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button onClick={() => void onEdit()}>
              <Check className="h-4 w-4" />
              Guardar
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={clearOpen} onClose={() => setClearOpen(false)} title="Vaciar chat">
        <p className="text-sm text-[var(--color-ink-muted)]">
          Se van a borrar todos los mensajes (texto y audios) para toda la familia. Esta acción no se
          puede deshacer.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setClearOpen(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={() => void onClear()}>
            Vaciar chat
          </Button>
        </div>
      </Modal>
    </div>
  )
}
