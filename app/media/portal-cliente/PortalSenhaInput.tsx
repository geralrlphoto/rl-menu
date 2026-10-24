'use client'
import { useState } from 'react'

interface Props {
  portalRef: string
  senhaInicial?: string
  portalEnviadoEm?: string
}

export default function PortalSenhaInput({ portalRef, senhaInicial, portalEnviadoEm: enviadoEmInicial }: Props) {
  const [senha, setSenha]       = useState(senhaInicial ?? '')
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [editing, setEditing]   = useState(false)

  const [sending, setSending]   = useState(false)
  const [sendMsg, setSendMsg]   = useState<{ ok: boolean; text: string } | null>(null)
  const [enviadoEm, setEnviadoEm] = useState<string | null>(
    enviadoEmInicial
      ? new Date(enviadoEmInicial).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : null
  )

  const temSenha = !!senhaInicial

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch(`/api/media-portal/${portalRef}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha: senha.trim() || null }),
      })
      setSaved(true)
      setEditing(false)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async () => {
    setSaving(true)
    try {
      await fetch(`/api/media-portal/${portalRef}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha: null }),
      })
      setSenha('')
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const handleEnviarPortal = async () => {
    setSending(true)
    setSendMsg(null)
    try {
      const res = await fetch('/api/media-portal/send-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref: portalRef }),
      })
      const data = await res.json()
      if (data.ok) {
        setSendMsg({ ok: true, text: '✓ Portal enviado' })
        if (data.portalEnviadoEm) {
          setEnviadoEm(new Date(data.portalEnviadoEm).toLocaleString('pt-PT', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
          }))
        }
      } else {
        setSendMsg({ ok: false, text: data.error ?? 'Erro ao enviar' })
      }
    } catch {
      setSendMsg({ ok: false, text: 'Erro de ligação' })
    } finally {
      setSending(false)
      setTimeout(() => setSendMsg(null), 4000)
    }
  }

  const BTN = 'rounded-full border px-3.5 py-1.5 text-[12px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed'

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {!editing ? (
        <>
          {/* Estado da senha */}
          <span className={`inline-flex items-center gap-1.5 text-[12px] mr-1 ${temSenha || senha ? 'text-[#a9c1ff]' : 'text-[#7c8893]'}`}>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d={temSenha || senha ? 'M7 11V7a5 5 0 0 1 10 0v4' : 'M7 11V7a5 5 0 0 1 9.9-1'} />
            </svg>
            {temSenha || senha ? 'Senha ativa' : 'Acesso livre'}
          </span>

          {/* Alterar senha */}
          <button
            onClick={() => setEditing(true)}
            className={`${BTN} border-white/[0.15] text-white/65 hover:text-white hover:border-white/40`}
          >
            {temSenha || senha ? 'Alterar senha' : 'Definir senha'}
          </button>

          {/* Enviar portal */}
          <button
            onClick={handleEnviarPortal}
            disabled={sending}
            className={`${BTN} inline-flex items-center gap-1.5 border-[#2e6cf6]/60 bg-[#2e6cf6]/[0.12] text-[#a9c1ff] hover:bg-[#2e6cf6]/25 hover:text-white`}
          >
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
            {sending ? 'A enviar…' : 'Enviar portal'}
          </button>

          {saved && <span className="text-[12px] text-[#5a8bff]">✓ Guardado</span>}

          {sendMsg && (
            <span className={`text-[12px] ${sendMsg.ok ? 'text-[#5a8bff]' : 'text-[#ff4747]'}`}>{sendMsg.text}</span>
          )}

          {enviadoEm && !sendMsg && (
            <span className="rlp-m text-[9px] text-white/40 tracking-[0.15em]">Enviado {enviadoEm}</span>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 rounded-full border border-white/[0.15] bg-[#00141f]/70 px-3.5 focus-within:border-[#2e6cf6]/70">
            <svg className="w-3.5 h-3.5 text-[#5a8bff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="15" r="4" /><path d="M10.8 12.2L20 3m-3 3l3 3m-6 0l2 2" />
            </svg>
            <input
              type="text"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false) }}
              placeholder="Senha..."
              autoFocus
              className="bg-transparent py-1.5 text-[13px] text-white/90 placeholder:text-white/30 focus:outline-none w-32"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className={`${BTN} border-[#2e6cf6] bg-[#2e6cf6] text-white hover:bg-[#3d79ff]`}
          >
            {saving ? '...' : 'Guardar'}
          </button>

          {(temSenha || senha) && (
            <button
              onClick={handleRemove}
              disabled={saving}
              className={`${BTN} border-[#ff4747]/30 text-[#ff4747]/80 hover:text-[#ff4747] hover:border-[#ff4747]/60`}
            >
              Remover
            </button>
          )}

          <button
            onClick={() => { setEditing(false); setSenha(senhaInicial ?? '') }}
            className="px-2 text-[12px] text-white/45 hover:text-white transition-colors"
          >
            Cancelar
          </button>
        </>
      )}
    </div>
  )
}
