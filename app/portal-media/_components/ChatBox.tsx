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
    // Sem polling — poupa egress do Supabase. As mensagens novas são
    // avisadas por email; aqui só recarregamos quando voltas à aba
    // (foco / visibilidade) e logo após enviares uma mensagem.
    const onBack = () => { if (!document.hidden) fetchMensagens(true) }
    document.addEventListener('visibilitychange', onBack)
    window.addEventListener('focus', onBack)
    return () => {
      document.removeEventListener('visibilitychange', onBack)
      window.removeEventListener('focus', onBack)
    }
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
    const autor = isAdmin ? 'RL PROD' : clienteNome
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
    <div className="rlp flex flex-col rounded-2xl border border-white/[0.1] bg-[#00141f]/70 overflow-hidden h-[70vh] min-h-[420px] max-h-[600px]">

      {/* Cabeçalho */}
      <div className="px-4 sm:px-5 py-3.5 border-b border-white/[0.08] flex items-center gap-3 shrink-0">
        <span className="w-2 h-2 rounded-full bg-[#2e6cf6] shrink-0" />
        <p className="rlp-m flex-1 text-[10px] text-white/80">Mensagens do projeto</p>
        <span className="rlp-m text-[9px] text-[#7c8893] tracking-[0.15em]">{mensagens.length} msg{mensagens.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 flex flex-col gap-1">
        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <p className="rlp-m text-[10px] text-[#7c8893]">A carregar…</p>
          </div>
        )}

        {!loading && mensagens.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
            <svg viewBox="0 0 24 24" fill="none" stroke="#5a8bff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9 opacity-70">
              <path d="M4 5h16v10a1.5 1.5 0 0 1-1.5 1.5H8l-4 3.5V5Z" />
            </svg>
            <p className="rlp-t text-[18px] text-white">Sem mensagens ainda</p>
            <p className="text-[14px] text-white/55">Inicia a conversa sobre o projeto.</p>
          </div>
        )}

        {grupos.map(({ dia, msgs }) => (
          <div key={dia} className="flex flex-col gap-1">
            {/* Separador de dia */}
            <div className="flex items-center gap-3 my-3">
              <div className="h-px flex-1 bg-white/[0.08]" />
              <span className="rlp-m text-[9px] text-[#7c8893] shrink-0">{dia}</span>
              <div className="h-px flex-1 bg-white/[0.08]" />
            </div>

            {msgs.map((m, idx) => {
              const isMe       = m.isAdmin === isAdmin
              const sameSender = idx > 0 && msgs[idx - 1].isAdmin === m.isAdmin
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${sameSender ? 'mt-0.5' : 'mt-3'}`}
                >
                  {/* Nome: só quando muda de remetente */}
                  {!sameSender && (
                    <span className={`flex items-center gap-2 mb-1 px-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <span className={`rlp-m text-[9px] tracking-[0.18em] ${m.isAdmin ? 'text-[#5a8bff]' : 'text-[#a9c1ff]'}`}>
                        {m.autor}
                      </span>
                      <span className={`rlp-m text-[8px] tracking-[0.15em] rounded-full px-2 py-0.5 ${
                        m.isAdmin ? 'bg-[#2e6cf6]/20 text-[#a9c1ff]' : 'bg-white/[0.06] text-white/50'
                      }`}>
                        {m.isAdmin ? 'Equipa' : 'Cliente'}
                      </span>
                    </span>
                  )}

                  {/* Bolha */}
                  <div className={`max-w-[85%] sm:max-w-[75%] px-4 py-2.5 rounded-2xl ${
                    isMe
                      ? 'bg-[#2e6cf6] text-white rounded-br-md'
                      : 'bg-[#0c2236] border border-white/[0.1] text-white/90 rounded-bl-md'
                  }`}>
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">{m.texto}</p>
                  </div>

                  {/* Hora */}
                  <span className="text-[11px] text-[#7c8893] mt-1 px-1">
                    {fmtHora(m.criadoEm)}
                  </span>
                </div>
              )
            })}
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Aviso: entrega por email */}
      <div className="shrink-0 border-t border-white/[0.08] px-4 sm:px-5 pt-2.5">
        <p className="text-[12px] text-[#7c8893]">
          {isAdmin
            ? 'O cliente é avisado por email quando envias.'
            : 'A resposta chega também ao teu email.'}
        </p>
      </div>

      {/* Campo de escrita */}
      <div className="shrink-0 px-3 sm:px-4 py-3 flex items-center gap-2">
        <input
          ref={inputRef}
          value={texto}
          onChange={e => setTexto(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() } }}
          placeholder={isAdmin ? 'Mensagem para o cliente…' : 'Escreve a tua mensagem…'}
          className="flex-1 min-w-0 rounded-md border border-white/[0.12] bg-[#00141f]/70 px-4 py-3 text-[15px] text-white placeholder:text-white/35 focus:outline-none focus:border-[#2e6cf6] transition-colors"
        />
        <button
          onClick={enviar}
          disabled={sending || !texto.trim()}
          className="rlp-m shrink-0 rounded-md bg-[#2e6cf6] hover:bg-[#5a8bff] px-4 sm:px-5 py-3 text-[11px] tracking-[0.2em] text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {sending ? 'A enviar' : 'Enviar'}
        </button>
      </div>
    </div>
  )
}
