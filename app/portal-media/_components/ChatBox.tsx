'use client'
import { useEffect, useRef, useState } from 'react'
import type { ChatMensagem } from '@/app/portal-media/_data/mockProject'

interface Props {
  projetoRef: string
  isAdmin: boolean
  clienteNome: string
}

const fmtHora = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
}

const fmtDia = (iso: string) => {
  const d = new Date(iso)
  const hoje = new Date()
  const ontem = new Date(hoje)
  ontem.setDate(ontem.getDate() - 1)

  if (d.toDateString() === hoje.toDateString()) return 'Hoje'
  if (d.toDateString() === ontem.toDateString()) return 'Ontem'
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })
}

export default function ChatBox({ projetoRef, isAdmin, clienteNome }: Props) {
  const [mensagens, setMensagens]   = useState<ChatMensagem[]>([])
  const [texto, setTexto]           = useState('')
  const [sending, setSending]       = useState(false)
  const [loading, setLoading]       = useState(true)
  const bottomRef                   = useRef<HTMLDivElement>(null)
  const inputRef                    = useRef<HTMLInputElement>(null)
  const scrollAfterSend             = useRef(false)

  const fetchMensagens = async (silent = false) => {
    try {
      const res  = await fetch(`/api/media-portal/${projetoRef}/chat`)
      const data = await res.json()
      setMensagens(data.mensagens ?? [])
    } catch {}
    if (!silent) setLoading(false)
  }

  useEffect(() => {
    fetchMensagens()
    const iv = setInterval(() => fetchMensagens(true), 5000)
    return () => clearInterval(iv)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* Só faz scroll quando o utilizador envia uma mensagem */
  useEffect(() => {
    if (scrollAfterSend.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      scrollAfterSend.current = false
    }
  }, [mensagens])

  const enviar = async () => {
    const txt = texto.trim()
    if (!txt || sending) return
    setSending(true)
    const autor = isAdmin ? 'RL Media' : clienteNome
    try {
      await fetch(`/api/media-portal/${projetoRef}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: txt, autor, isAdmin }),
      })
      setTexto('')
      scrollAfterSend.current = true
      await fetchMensagens(true)
    } catch {}
    setSending(false)
    inputRef.current?.focus()
  }

  /* agrupar por dia para separadores */
  const grupos: { dia: string; msgs: ChatMensagem[] }[] = []
  for (const m of mensagens) {
    const dia = fmtDia(m.criadoEm)
    const ultimo = grupos[grupos.length - 1]
    if (ultimo && ultimo.dia === dia) {
      ultimo.msgs.push(m)
    } else {
      grupos.push({ dia, msgs: [m] })
    }
  }

  return (
    <div className="flex flex-col border border-white/[0.07] bg-white/[0.01]" style={{ height: 520 }}>

      {/* ── Header ── */}
      <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center gap-3 shrink-0">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
        <div className="flex-1">
          <p className="text-sm tracking-[0.4em] text-white/45 uppercase">Chat do Projeto</p>
        </div>
        <span className="text-sm text-white/15 font-mono">{mensagens.length} msg{mensagens.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ── Mensagens ── */}
      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-1">
        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm tracking-[0.3em] text-white/15 uppercase">A carregar...</p>
          </div>
        )}

        {!loading && mensagens.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <span className="text-3xl opacity-20">💬</span>
            <p className="text-sm tracking-[0.3em] text-white/20 uppercase">Sem mensagens ainda</p>
            <p className="text-sm text-white/12 text-center">Inicia a conversa sobre o projeto</p>
          </div>
        )}

        {grupos.map(({ dia, msgs }) => (
          <div key={dia} className="flex flex-col gap-2">
            {/* Separador de dia */}
            <div className="flex items-center gap-3 my-2">
              <div className="h-px flex-1 bg-white/[0.05]" />
              <span className="text-sm tracking-[0.25em] text-white/18 uppercase shrink-0">{dia}</span>
              <div className="h-px flex-1 bg-white/[0.05]" />
            </div>

            {msgs.map((m, idx) => {
              const isMe       = m.isAdmin === isAdmin
              const sameSender = idx > 0 && msgs[idx - 1].isAdmin === m.isAdmin
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.isAdmin ? 'items-end' : 'items-start'} ${sameSender ? 'mt-0.5' : 'mt-2'}`}
                >
                  {/* Nome — só mostra quando muda de remetente */}
                  {!sameSender && (
                    <span className={`text-sm tracking-[0.2em] text-white/20 uppercase mb-1 ${m.isAdmin ? 'text-right' : 'text-left'}`}>
                      {m.autor}
                    </span>
                  )}

                  {/* Bolha */}
                  <div className={`max-w-[78%] px-4 py-2.5 ${
                    m.isAdmin
                      ? 'bg-white/[0.07] border border-white/[0.14]'
                      : 'bg-white/[0.025] border border-white/[0.06]'
                  }`}>
                    <p className="text-sm text-white/70 leading-relaxed">{m.texto}</p>
                  </div>

                  {/* Hora */}
                  <span className={`text-sm text-white/15 mt-0.5 ${m.isAdmin ? 'text-right' : 'text-left'}`}>
                    {fmtHora(m.criadoEm)}
                  </span>
                </div>
              )
            })}
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div className="shrink-0 border-t border-white/[0.06] px-4 py-3 flex items-center gap-3">
        <div className="flex-1 border border-white/[0.07] bg-white/[0.02] flex items-center px-4 py-2.5 gap-2 focus-within:border-white/20 transition-colors">
          <input
            ref={inputRef}
            value={texto}
            onChange={e => setTexto(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() } }}
            placeholder={isAdmin ? 'Mensagem para o cliente...' : 'Escreve a tua mensagem...'}
            className="flex-1 bg-transparent text-sm text-white/65 placeholder:text-white/15 focus:outline-none min-w-0"
          />
        </div>
        <button
          onClick={enviar}
          disabled={sending || !texto.trim()}
          className="border border-white/15 hover:border-white/35 bg-white/[0.03] hover:bg-white/[0.07]
                     px-5 py-2.5 text-sm tracking-[0.35em] text-white/40 hover:text-white/70
                     uppercase transition-colors disabled:opacity-25 disabled:cursor-not-allowed shrink-0"
        >
          {sending ? '⏳' : 'Enviar'}
        </button>
      </div>
    </div>
  )
}
