'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import TicketForm from './TicketForm'

const GOLD = '#c8a866'

export default function TicketAccess({ isAdmin, hasPassword, adminPassword }: { isAdmin: boolean; hasPassword: boolean; adminPassword: string }) {
  const [authed, setAuthed] = useState(isAdmin || !hasPassword)
  const [showForm, setShowForm] = useState(false)
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [checking, setChecking] = useState(false)

  useEffect(() => { if (!authed && typeof window !== 'undefined' && sessionStorage.getItem('ticketAuth') === 'true') setAuthed(true) }, [authed])

  async function entrar(e: React.FormEvent) {
    e.preventDefault()
    if (checking) return
    setChecking(true); setErr('')
    try {
      const d = await fetch('/api/ticket-auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'check', password: pw }) }).then(r => r.json())
      if (d?.ok) { try { sessionStorage.setItem('ticketAuth', 'true') } catch {}; setAuthed(true) }
      else setErr('Palavra-passe incorreta.')
    } catch { setErr('Erro. Tenta novamente.') }
    setChecking(false)
  }

  if (showForm) return <TicketForm />

  // ── Ecrã de acesso (não-admin sem sessão) ──
  if (!authed) {
    return (
      <main className="min-h-screen text-white flex items-center justify-center px-6" style={{ background: '#0b0a08' }}>
        <form onSubmit={entrar} className="w-full max-w-sm text-center">
          <p className="text-[10px] tracking-[0.4em] uppercase text-[#c8a866]/70 font-semibold">RL Photo · Video</p>
          <h1 className="text-3xl font-light mt-3" style={{ fontFamily: 'Georgia, serif' }}>
            Ticket <span className="italic" style={{ color: GOLD }}>Fotos/Dia</span>
          </h1>
          <p className="text-[13px] text-white/45 mt-3">Introduz a palavra-passe de acesso.</p>
          <input type="password" value={pw} onChange={e => setPw(e.target.value)} autoFocus placeholder="Palavra-passe"
            className="w-full mt-6 bg-black/30 border border-white/15 rounded-xl px-4 py-3 text-[14px] text-white text-center placeholder:text-white/30 focus:outline-none focus:border-[#c8a866]/50" />
          {err && <p className="text-[12px] text-red-300 mt-3">{err}</p>}
          <button type="submit" disabled={!pw || checking}
            className="w-full mt-5 py-3 rounded-xl text-[13px] font-bold tracking-wider uppercase transition-all disabled:opacity-40"
            style={{ background: GOLD, color: '#0b0a08' }}>
            {checking ? 'A verificar…' : 'Entrar'}
          </button>
        </form>
      </main>
    )
  }

  // ── Página (admin ou já autenticado) ──
  return (
    <main className="min-h-screen text-white" style={{ background: '#0b0a08' }}>
      <div className="max-w-3xl mx-auto px-6 py-10">
        <Link href="/secao/c3db95a8-67c5-4339-81c6-891af683f907"
          className="text-[12px] tracking-widest uppercase text-white/30 hover:text-[#c8a866] transition-colors">‹ Voltar</Link>

        <div className="mt-20 text-center">
          <p className="text-[10px] tracking-[0.4em] uppercase text-[#c8a866]/70 font-semibold">RL Photo · Video</p>
          <h1 className="text-4xl sm:text-5xl font-light mt-3" style={{ fontFamily: 'Georgia, serif' }}>
            Ticket <span className="italic" style={{ color: GOLD }}>Fotos/Dia</span>
          </h1>
          <p className="text-[14px] text-white/45 mt-4 max-w-md mx-auto leading-relaxed">Registo de venda de fotografias no dia do evento.</p>
          <button onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 mt-8 px-7 py-3.5 rounded-xl text-[13px] font-bold tracking-wider uppercase transition-all"
            style={{ background: GOLD, color: '#0b0a08', boxShadow: '0 0 28px -6px rgba(200,168,102,0.6)' }}>
            ＋ Abrir Ticket
          </button>
        </div>

        {isAdmin && <PasswordManager initial={adminPassword} />}
      </div>
    </main>
  )
}

function PasswordManager({ initial }: { initial: string }) {
  const [val, setVal] = useState(initial)
  const [stored, setStored] = useState(initial)
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function save() {
    if (!val.trim() || busy) return
    setBusy(true); setMsg('')
    try {
      const d = await fetch('/api/ticket-auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'save', password: val.trim() }) }).then(r => r.json())
      if (d?.ok) { setStored(val.trim()); setMsg('Palavra-passe guardada.') } else setMsg(d?.error || 'Erro ao guardar.')
    } catch { setMsg('Erro de rede.') }
    setBusy(false)
  }
  async function apagar() {
    if (busy) return
    setBusy(true); setMsg('')
    try {
      const d = await fetch('/api/ticket-auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete' }) }).then(r => r.json())
      if (d?.ok) { setVal(''); setStored(''); setMsg('Palavra-passe apagada — acesso livre.') } else setMsg('Erro ao apagar.')
    } catch { setMsg('Erro de rede.') }
    setBusy(false)
  }

  const dirty = val.trim() !== stored

  return (
    <div className="mt-16 max-w-md mx-auto rounded-2xl border border-white/[0.08] p-5"
      style={{ background: 'linear-gradient(158deg, rgba(255,255,255,0.025), rgba(200,168,102,0.02))' }}>
      <p className="text-[11px] tracking-[0.3em] uppercase font-bold mb-1" style={{ color: GOLD }}>Palavra-passe de acesso</p>
      <p className="text-[11px] text-white/40 mb-3">{stored ? 'Quem souber a palavra-passe acede a esta página.' : 'Sem palavra-passe — a página está de acesso livre.'}</p>
      <div className="flex items-center gap-2">
        <input type={show ? 'text' : 'password'} value={val} onChange={e => setVal(e.target.value)} placeholder="Definir palavra-passe"
          className="flex-1 bg-black/30 border border-white/[0.1] rounded-lg px-3 py-2 text-[13px] text-white/90 placeholder:text-white/25 focus:outline-none focus:border-[#c8a866]/40" />
        <button onClick={() => setShow(s => !s)} title={show ? 'Ocultar' : 'Ver'}
          className="px-3 py-2 rounded-lg border border-white/10 text-white/55 hover:text-[#c8a866] hover:border-[#c8a866]/30 transition-all text-[12px]">{show ? 'Ocultar' : 'Ver'}</button>
      </div>
      <div className="flex items-center gap-2 mt-3">
        <button onClick={save} disabled={!dirty || !val.trim() || busy}
          className="flex-1 py-2 rounded-lg text-[12px] font-bold tracking-wider uppercase transition-all disabled:opacity-40"
          style={{ background: GOLD, color: '#0b0a08' }}>Guardar</button>
        <button onClick={apagar} disabled={!stored || busy}
          className="py-2 px-4 rounded-lg text-[12px] font-bold tracking-wider uppercase border border-red-500/30 text-red-300/85 hover:bg-red-500/10 transition-all disabled:opacity-30">Apagar</button>
      </div>
      {msg && <p className="text-[11px] text-[#c8a866]/90 mt-3">{msg}</p>}
    </div>
  )
}
