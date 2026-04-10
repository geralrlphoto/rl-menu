'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const DIAS  = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

function fmtDate(d: string | null) {
  if (!d) return '—'
  const [y,m,dd] = d.split('-').map(Number)
  const dt = new Date(y, m-1, dd)
  return `${String(dd).padStart(2,'0')} ${MESES[m-1]} ${y} · ${DIAS[dt.getDay()]}`
}
function daysUntil(d: string | null) {
  if (!d) return null
  const today = new Date(); today.setHours(0,0,0,0)
  return Math.round((new Date(d+'T00:00:00').getTime() - today.getTime()) / 86400000)
}

type Freelancer = { id: string; nome: string; status: string | null }
type Casamento  = { id: string; local: string; data_casamento: string | null; equipa_foto: string[] | null; videografo: string | null; briefing_url: string | null; data_confirmada: boolean | null }
type Edicao     = {
  id: string; nome: string; status: string; data_casamento: string | null
  data_entrega: string | null; data_final_entrega: string | null; local: string | null
  convidados: number | null; cerimonia: number | null; detalhes: number | null
  sala_animacao: number | null; fotos_album: number | null; bolo_bouquet: number | null
  sessao_noivos: number | null; fotos_noiva: number | null; fotos_noivo: number | null
}
type Album      = { id: string; nome: string; status: string; data_casamento: string | null; referencia_album: string | null }

const STATUS_EDICAO_STYLE: Record<string, string> = {
  'NOVO TRABALHO': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  'EM EDIÇÃO':     'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  'CONCLUÍDO':     'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
}
const STATUS_ALBUM_STYLE: Record<string, string> = {
  'AGUARDAR':      'bg-white/10 text-white/40 border-white/20',
  'EM EDIÇÃO':     'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  'EM APROVAÇÃO':  'bg-blue-500/15 text-blue-400 border-blue-500/30',
  'APROVADO':      'bg-purple-500/15 text-purple-400 border-purple-500/30',
  'ENTREGUE':      'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
}

// ── Password Gate ─────────────────────────────────────────────────────────────
function PasswordGate({ id, onAuth }: { id: string; onAuth: () => void }) {
  const [pw, setPw]       = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!pw.trim()) return
    setLoading(true); setError('')
    const d = await fetch('/api/freelancer-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, password: pw.trim() }),
    }).then(r => r.json())
    setLoading(false)
    if (d.ok) {
      sessionStorage.setItem(`freelancerAuth_${id}`, 'true')
      onAuth()
    } else {
      setError('Password incorreta. Tenta novamente.')
      setPw('')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0a0a0a]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-[9px] tracking-[0.5em] text-white/20 uppercase mb-3">RL PHOTO.VIDEO</p>
          <h1 className="text-2xl font-light tracking-[0.2em] text-white uppercase">Área do Freelancer</h1>
          <div className="mt-4 h-px w-8 bg-gold/50 mx-auto" />
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[9px] tracking-[0.3em] text-white/30 uppercase mb-2">Password de Acesso</label>
            <input
              type="password"
              value={pw}
              onChange={e => setPw(e.target.value)}
              autoFocus
              placeholder="••••••••"
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-gold/40 transition-colors placeholder:text-white/15"
            />
          </div>
          {error && <p className="text-xs text-red-400/80">{error}</p>}
          <button
            type="submit"
            disabled={loading || !pw.trim()}
            className="w-full py-3 rounded-xl bg-gold text-black font-bold text-sm tracking-widest hover:bg-gold/80 transition-all disabled:opacity-40 uppercase"
          >
            {loading ? 'A verificar...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}

const MESES_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
function fmtFull(d: string | null) {
  if (!d) return '—'
  try { const dt = new Date(d+'T00:00:00'); return `${String(dt.getDate()).padStart(2,'0')} de ${MESES_FULL[dt.getMonth()]} de ${dt.getFullYear()}` } catch { return d }
}

type FotoSelecao = {
  id: string; nome_noivos: string; referencia: string; date: string | null
  data_entrada: string | null; sessao_noivos: string; fotos_noiva: string
  fotos_noivo: string; convidados: string; cerimonia: string
  bolo_bouquet: string; sala_animacao: string; fotos_album: string; detalhes: string
}

const SELECAO_SECTIONS = [
  { label: 'Sessão Noivos',   field: 'sessao_noivos'  as keyof FotoSelecao },
  { label: 'Fotos da Noiva',  field: 'fotos_noiva'    as keyof FotoSelecao },
  { label: 'Fotos do Noivo',  field: 'fotos_noivo'    as keyof FotoSelecao },
  { label: 'Convidados',      field: 'convidados'     as keyof FotoSelecao },
  { label: 'Cerimónia',       field: 'cerimonia'      as keyof FotoSelecao },
  { label: 'Bolo e Bouquet',  field: 'bolo_bouquet'   as keyof FotoSelecao },
  { label: 'Sala e Animação', field: 'sala_animacao'  as keyof FotoSelecao },
  { label: 'Fotos p/Álbum',   field: 'fotos_album'    as keyof FotoSelecao },
]

// ── Seleção Modal (read-only) ─────────────────────────────────────────────────
function SelecaoModal({ nome, onClose }: { nome: string; onClose: () => void }) {
  const [record, setRecord] = useState<FotoSelecao | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch('/api/fotos-selecao')
      .then(r => r.json())
      .then(d => {
        const rows: FotoSelecao[] = d.rows ?? []
        const match = rows.find(r =>
          r.nome_noivos?.toLowerCase().trim() === nome.toLowerCase().trim()
        )
        if (match) setRecord(match)
        else setNotFound(true)
        setLoading(false)
      })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [nome])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />
      <div className="relative z-10 bg-[#111] border border-white/[0.08] rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}>
        <div className="h-0.5 w-full bg-gold/60" />
        {/* Header */}
        <div className="px-8 pt-7 pb-5 border-b border-white/[0.05] flex items-start justify-between gap-4">
          <div>
            <p className="text-[9px] tracking-[0.5em] text-white/20 uppercase mb-2">Seleção de Fotos</p>
            <h2 className="text-2xl font-light tracking-[0.15em] text-white uppercase">{nome}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 text-white/30 hover:text-white hover:border-white/30 transition-all text-sm mt-1">✕</button>
        </div>
        {/* Body */}
        <div className="px-8 py-6 max-h-[65vh] overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="w-5 h-5 border border-gold/30 border-t-gold/80 rounded-full animate-spin" />
            </div>
          )}
          {notFound && (
            <p className="text-white/30 text-sm text-center py-12 tracking-widest">Seleção de fotos não encontrada.</p>
          )}
          {record && (
            <div className="space-y-6">
              {/* Datas */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3">
                  <span className="text-[8px] tracking-[0.3em] text-white/25 uppercase block mb-1">Data do Evento</span>
                  <p className="text-sm text-white/70">{fmtFull(record.date)}</p>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3">
                  <span className="text-[8px] tracking-[0.3em] text-white/25 uppercase block mb-1">Data de Entrada</span>
                  <p className="text-sm text-white/70">{fmtFull(record.data_entrada)}</p>
                </div>
              </div>
              {/* Contagens */}
              <div>
                <p className="text-[9px] tracking-[0.35em] text-white/20 uppercase mb-3">Contagem de Fotos</p>
                <div className="grid grid-cols-4 gap-2">
                  {SELECAO_SECTIONS.map(({ label, field }) => (
                    <div key={field} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3">
                      <span className="text-[8px] tracking-[0.2em] text-white/25 uppercase block mb-1">{label}</span>
                      <p className="text-xl font-light text-white/80">{record[field] || <span className="text-white/20 text-sm">—</span>}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* Detalhes */}
              {record.detalhes && (
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
                  <span className="text-[8px] tracking-[0.3em] text-white/25 uppercase block mb-2">Detalhes</span>
                  <p className="text-sm text-white/60 leading-relaxed">{record.detalhes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Edicao Modal ──────────────────────────────────────────────────────────────
const FOTO_FIELDS: { key: keyof Edicao; label: string }[] = [
  { key: 'convidados',    label: 'Convidados' },
  { key: 'cerimonia',     label: 'Cerimónia' },
  { key: 'detalhes',      label: 'Detalhes' },
  { key: 'sala_animacao', label: 'Sala/Animação' },
  { key: 'fotos_album',   label: 'Álbum' },
  { key: 'bolo_bouquet',  label: 'Bolo/Bouquet' },
  { key: 'sessao_noivos', label: 'Sessão Noivos' },
  { key: 'fotos_noiva',   label: 'Fotos Noiva' },
  { key: 'fotos_noivo',   label: 'Fotos Noivo' },
]

function EdicaoModal({ e, onClose }: { e: Edicao; onClose: () => void }) {
  const hasCounts = FOTO_FIELDS.some(f => e[f.key] != null)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />
      <div className="relative z-10 bg-[#111] border border-white/[0.08] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}>
        <div className="h-0.5 w-full bg-gold/60" />
        {/* Header */}
        <div className="px-7 pt-6 pb-5 border-b border-white/[0.05] flex items-start justify-between gap-4">
          <div>
            <p className="text-[9px] tracking-[0.4em] text-white/20 uppercase mb-1">Edição de Fotos</p>
            <h2 className="text-xl font-light tracking-[0.1em] text-white uppercase">{e.nome}</h2>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {e.data_casamento && <p className="text-xs text-white/35">{fmtDate(e.data_casamento).split(' · ')[0]}</p>}
              {e.local && <p className="text-xs text-white/25">📍 {e.local}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[9px] px-2.5 py-1 rounded-full border tracking-widest uppercase font-medium ${STATUS_EDICAO_STYLE[e.status] ?? 'bg-white/5 text-white/30 border-white/10'}`}>
              {e.status}
            </span>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full border border-white/10 text-white/30 hover:text-white hover:border-white/30 transition-all text-sm">✕</button>
          </div>
        </div>
        {/* Body */}
        <div className="px-7 py-5 space-y-5">
          {/* Datas */}
          {(e.data_entrega || e.data_final_entrega) && (
            <div className="grid grid-cols-2 gap-3">
              {e.data_entrega && (
                <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl px-4 py-3">
                  <p className="text-[8px] tracking-[0.3em] text-white/20 uppercase mb-1">Data Entrega</p>
                  <p className="text-sm text-white/70">{fmtDate(e.data_entrega).split(' · ')[0]}</p>
                </div>
              )}
              {e.data_final_entrega && (
                <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl px-4 py-3">
                  <p className="text-[8px] tracking-[0.3em] text-white/20 uppercase mb-1">Entrega Final</p>
                  <p className="text-sm text-white/70">{fmtDate(e.data_final_entrega).split(' · ')[0]}</p>
                </div>
              )}
            </div>
          )}
          {/* Contagem de fotos */}
          <div>
            <p className="text-[9px] tracking-[0.35em] text-white/20 uppercase mb-3">Contagem de Fotos</p>
            <div className="grid grid-cols-3 gap-2">
              {FOTO_FIELDS.map(({ key, label }) => (
                <div key={key} className="bg-white/[0.03] border border-white/[0.05] rounded-xl px-3 py-2.5">
                  <p className="text-[8px] tracking-[0.2em] text-white/20 uppercase mb-1">{label}</p>
                  <p className="text-xl font-light text-white/80">{e[key] != null ? String(e[key]) : <span className="text-white/15 text-sm">—</span>}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Briefing Modal ────────────────────────────────────────────────────────────
function BriefingModal({ url, onClose }: { url: string; onClose: () => void }) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError]   = useState(false)

  return (
    <div className="fixed inset-0 z-[60] flex flex-col" onClick={onClose}>
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />
      {/* Header bar */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3 bg-[#0e0e0e] border-b border-white/[0.07] flex-shrink-0" onClick={e => e.stopPropagation()}>
        <p className="text-[9px] tracking-[0.4em] text-white/30 uppercase">Briefing</p>
        <div className="flex items-center gap-2">
          <a href={url} target="_blank" rel="noopener noreferrer"
            className="text-[9px] px-3 py-1.5 rounded-lg border border-white/10 text-white/30 hover:text-white/60 hover:border-white/25 transition-all tracking-widest uppercase">
            Abrir no Browser ↗
          </a>
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-all">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      </div>
      {/* iframe */}
      <div className="relative z-10 flex-1 overflow-hidden" onClick={e => e.stopPropagation()}>
        {!loaded && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 border border-gold/30 border-t-gold/80 rounded-full animate-spin" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-4 text-center">
            <p className="text-white/30 text-sm tracking-widest">Não foi possível carregar o briefing aqui.</p>
            <a href={url} target="_blank" rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl bg-gold/10 border border-gold/30 text-gold text-xs font-semibold tracking-widest uppercase hover:bg-gold/20 transition-all">
              Abrir no Browser ↗
            </a>
          </div>
        )}
        <iframe
          src={url}
          className={`w-full h-full border-none transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          title="Briefing"
        />
      </div>
    </div>
  )
}

// ── Casamento Ficha (read-only) ───────────────────────────────────────────────
function CasamentoFicha({ c, onClose, onConfirm, isVideografo }: {
  c: Casamento; onClose: () => void; onConfirm: (id: string) => void; isVideografo: boolean
}) {
  const dtu = daysUntil(c.data_casamento)
  const isUrgent = dtu !== null && dtu >= 0 && dtu <= 15
  const isPast   = dtu !== null && dtu < 0
  const [confirming, setConfirming]   = useState(false)
  const [confirmed, setConfirmed]     = useState(c.data_confirmada ?? false)
  const [briefingOpen, setBriefingOpen] = useState(false)

  async function handleConfirmar() {
    setConfirming(true)
    await fetch('/api/freelancer-casamentos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: c.id, data_confirmada: true }),
    })
    setConfirmed(true)
    setConfirming(false)
    onConfirm(c.id)
  }

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-[#0e0e0e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={`px-6 py-5 border-b border-white/[0.06] ${isUrgent ? 'bg-red-500/8' : isPast ? 'bg-white/[0.02]' : 'bg-gold/[0.04]'}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`flex-shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-xl border ${isUrgent ? 'bg-red-500/15 border-red-500/30' : isPast ? 'bg-white/[0.04] border-white/[0.08]' : 'bg-gold/10 border-gold/25'}`}>
                {c.data_casamento ? (
                  <>
                    <span className={`text-xl font-bold leading-none ${isUrgent ? 'text-red-400' : isPast ? 'text-white/30' : 'text-gold'}`}>
                      {c.data_casamento.split('-')[2]}
                    </span>
                    <span className={`text-[9px] uppercase tracking-wide font-semibold ${isUrgent ? 'text-red-400/60' : isPast ? 'text-white/20' : 'text-gold/60'}`}>
                      {MESES[parseInt(c.data_casamento.split('-')[1])-1]}
                    </span>
                  </>
                ) : <span className="text-white/20 text-sm">—</span>}
              </div>
              <div>
                <h2 className="text-base font-bold text-white uppercase tracking-wide leading-tight">{c.local || '—'}</h2>
                {c.data_casamento && (
                  <p className={`text-xs mt-0.5 ${isUrgent ? 'text-red-400/70' : isPast ? 'text-white/30' : 'text-white/45'}`}>{fmtDate(c.data_casamento)}</p>
                )}
                {dtu !== null && dtu >= 0 && (
                  <span className={`inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full ${isUrgent ? 'bg-red-500/20 text-red-400' : 'bg-white/[0.08] text-white/40'}`}>
                    {dtu === 0 ? 'HOJE' : `${dtu} dias`}
                  </span>
                )}
              </div>
            </div>
            <button onClick={onClose} className="flex-shrink-0 p-1.5 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/[0.06] transition-all">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div>
            <p className="text-[9px] tracking-[0.3em] text-white/25 uppercase mb-2">Equipa Fotografia</p>
            {c.equipa_foto && c.equipa_foto.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {c.equipa_foto.map((name, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-white/70">{name}</span>
                ))}
              </div>
            ) : <p className="text-xs text-white/20 italic">Não definida</p>}
          </div>
          <div>
            <p className="text-[9px] tracking-[0.3em] text-white/25 uppercase mb-2">Videógrafo</p>
            <p className="text-sm text-white/70">{c.videografo || <span className="text-white/20 italic">Não definido</span>}</p>
          </div>
          <div>
            <p className="text-[9px] tracking-[0.3em] text-white/25 uppercase mb-2">Briefing</p>
            {c.briefing_url ? (
              <button onClick={() => setBriefingOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs text-gold/70 hover:text-gold transition-colors border border-gold/20 px-3 py-1.5 rounded-lg hover:bg-gold/5">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                Ver Briefing
              </button>
            ) : <p className="text-xs text-white/20 italic">Sem briefing</p>}
          </div>
          {isVideografo && (
            <div>
              <p className="text-[9px] tracking-[0.3em] text-white/25 uppercase mb-2">Relatório</p>
              <a href="https://tally.so/r/np88GE" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold tracking-widest uppercase hover:bg-emerald-500/20 transition-all">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                Relatório
              </a>
            </div>
          )}
        </div>

        {/* Footer — só confirmar, sem editar */}
        {!isPast && (
          <div className="px-6 pb-5">
            {confirmed ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold tracking-widest uppercase cursor-default">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Data Confirmada
              </div>
            ) : (
              <button onClick={handleConfirmar} disabled={confirming}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold/10 border border-gold/30 text-gold text-xs font-semibold tracking-widest uppercase hover:bg-gold/20 transition-all disabled:opacity-50">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                {confirming ? 'A confirmar...' : 'Confirmar Data'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
    {briefingOpen && c.briefing_url && (
      <BriefingModal url={c.briefing_url} onClose={() => setBriefingOpen(false)} />
    )}
    </>
  )
}

const STATUS_EDICAO_ORDER = ['NOVO TRABALHO', 'EM EDIÇÃO', 'CONCLUÍDO']

function EdicaoCard({ e, onStatusChange }: { e: Edicao; onStatusChange: (id: string, status: string) => void }) {
  const [openSelecao, setOpenSelecao] = useState(false)
  const [status, setStatus]           = useState(e.status)
  const [saving, setSaving]           = useState(false)
  const hasCounts = FOTO_FIELDS.some(f => e[f.key] != null)

  async function handleStatus(newStatus: string) {
    if (newStatus === status) return
    setSaving(true)
    await fetch('/api/freelancer-edicao', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: e.id, status: newStatus }),
    })
    setStatus(newStatus)
    onStatusChange(e.id, newStatus)
    setSaving(false)
  }

  const statusStyle = STATUS_EDICAO_STYLE[status] ?? 'bg-white/5 text-white/30 border-white/10'

  return (
    <>
      <div className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] space-y-2">
        <p className="text-xs font-semibold text-white/80 leading-tight">{e.nome}</p>
        {e.data_casamento && <p className="text-[10px] text-white/30">{fmtDate(e.data_casamento).split(' · ')[0]}</p>}
        {e.local && <p className="text-[10px] text-white/25">📍 {e.local}</p>}
        {e.data_entrega && <p className="text-[10px] text-white/25">Entrega: {fmtDate(e.data_entrega).split(' · ')[0]}</p>}
        {hasCounts && (
          <div className="flex flex-wrap gap-1 pt-1 border-t border-white/[0.04]">
            {FOTO_FIELDS.filter(f => e[f.key] != null).map(({ key, label }) => (
              <span key={key} className="text-[9px] bg-white/[0.04] text-white/35 px-1.5 py-0.5 rounded">
                {label.split('/')[0].trim().slice(0,3)}: {e[key] as number}
              </span>
            ))}
          </div>
        )}
        {/* Estado dropdown */}
        <div className="pt-1 border-t border-white/[0.04]">
          <select
            value={status}
            onChange={e => handleStatus(e.target.value)}
            disabled={saving}
            className={`w-full text-[9px] tracking-widest uppercase font-bold px-2.5 py-1.5 rounded-lg border outline-none cursor-pointer transition-all disabled:opacity-40 [color-scheme:dark] ${statusStyle}`}
          >
            {STATUS_EDICAO_ORDER.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <button onClick={() => setOpenSelecao(true)}
            className="text-[9px] tracking-[0.15em] uppercase px-3 py-1.5 rounded-lg border border-gold/30 bg-gold/5 text-gold/70 hover:text-gold hover:border-gold/50 hover:bg-gold/10 transition-all">
            Ver Seleção
          </button>
        </div>
      </div>
      {openSelecao && <SelecaoModal nome={e.nome} onClose={() => setOpenSelecao(false)} />}
    </>
  )
}

// ── Main View ─────────────────────────────────────────────────────────────────
export default function FreelancerViewPage() {
  const { id } = useParams<{ id: string }>()
  const [authed, setAuthed]         = useState(false)
  const [checkingAuth, setChecking] = useState(true)
  const [freelancer, setFreelancer] = useState<Freelancer | null>(null)
  const [casamentos, setCasamentos] = useState<Casamento[]>([])
  const [edicao, setEdicao]         = useState<Edicao[]>([])
  const [album, setAlbum]           = useState<Album[]>([])
  const [loading, setLoading]       = useState(false)
  const [tab, setTab]               = useState<'casamentos'|'edicao'|'album'>('casamentos')
  const [ficha, setFicha]           = useState<Casamento | null>(null)

  // Check session
  useEffect(() => {
    const ok = sessionStorage.getItem(`freelancerAuth_${id}`) === 'true'
    setAuthed(ok)
    setChecking(false)
  }, [id])

  const loadData = useCallback(async () => {
    setLoading(true)
    const [fRes, cRes, eRes, aRes] = await Promise.all([
      fetch(`/api/freelancers`).then(r => r.json()),
      fetch(`/api/freelancer-casamentos?freelancer_id=${id}`).then(r => r.json()),
      fetch(`/api/freelancer-edicao?freelancer_id=${id}`).then(r => r.json()),
      fetch(`/api/freelancer-album?freelancer_id=${id}`).then(r => r.json()),
    ])
    const f = (fRes.freelancers ?? []).find((x: Freelancer) => x.id === id) ?? null
    setFreelancer(f)
    setCasamentos(cRes.casamentos ?? [])
    setEdicao(eRes.edicao ?? [])
    setAlbum(aRes.album ?? [])
    setLoading(false)
  }, [id])

  useEffect(() => { if (authed) loadData() }, [authed, loadData])

  if (checkingAuth) return null
  if (!authed) return <PasswordGate id={id} onAuth={() => { setAuthed(true) }} />

  const isFotografo = freelancer?.status === 'FOTOGRAFO'
  const upcoming = casamentos
    .filter(c => c.data_casamento && (daysUntil(c.data_casamento) ?? -1) >= 0)
    .sort((a,b) => (a.data_casamento ?? '') < (b.data_casamento ?? '') ? -1 : 1)
  const past = casamentos
    .filter(c => !c.data_casamento || (daysUntil(c.data_casamento) ?? 1) < 0)
    .sort((a,b) => (a.data_casamento ?? '') > (b.data_casamento ?? '') ? -1 : 1)

  return (
    <main className="min-h-screen px-4 py-10 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[9px] tracking-[0.5em] text-white/20 uppercase mb-3">RL PHOTO.VIDEO · Área do Freelancer</p>
        {loading ? (
          <p className="text-white/20 text-xs tracking-widest uppercase">A carregar...</p>
        ) : (
          <>
            <h1 className="text-3xl font-light tracking-[0.15em] text-white uppercase">{freelancer?.nome ?? '—'}</h1>
            {freelancer?.status && (
              <span className="inline-block mt-2 text-[9px] px-2.5 py-1 rounded-full border tracking-widest uppercase font-semibold bg-gold/10 text-gold border-gold/30">
                {freelancer.status}
              </span>
            )}
            <div className="mt-4 h-px w-12 bg-gold/50" />
          </>
        )}
      </div>

      {/* Tab Navigation */}
      {!loading && (
        <div className="flex items-center gap-2 mb-8 border-b border-white/[0.06] pb-0">
          {[
            { key: 'casamentos', label: 'Casamentos', count: casamentos.length },
            { key: 'edicao',     label: 'Edição de Fotos', count: edicao.length },
            ...(isFotografo ? [{ key: 'album', label: 'Edição de Álbum', count: album.length }] : []),
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as typeof tab)}
              className={`relative pb-3 text-[9px] tracking-[0.3em] uppercase font-semibold transition-all flex items-center gap-1.5 ${
                tab === t.key
                  ? 'text-gold'
                  : 'text-white/25 hover:text-white/50'
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold transition-all ${
                  tab === t.key ? 'bg-gold/20 text-gold' : 'bg-white/[0.06] text-white/25'
                }`}>{t.count}</span>
              )}
              {tab === t.key && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gold rounded-full" />
              )}
            </button>
          ))}
        </div>
      )}

      {!loading && (
        <div>

          {/* ── Tab: Casamentos ── */}
          {tab === 'casamentos' && (
            <div className="space-y-10">
              {/* Próximos */}
              <section>
                <p className="text-[9px] tracking-[0.4em] text-white/25 uppercase mb-4">Próximos Casamentos ({upcoming.length})</p>
                {upcoming.length === 0 ? (
                  <p className="text-white/15 text-xs tracking-widest">Sem casamentos futuros.</p>
                ) : (
                  <div className="space-y-3">
                    {upcoming.map(c => {
                      const days = daysUntil(c.data_casamento)
                      const isUrgent = days !== null && days <= 7
                      return (
                        <div key={c.id} onClick={() => setFicha(c)}
                          className={`cursor-pointer bg-white/[0.02] border rounded-2xl p-5 space-y-3 hover:border-white/20 transition-all ${isUrgent ? 'border-red-500/25' : 'border-white/[0.07]'}`}>
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-3">
                              <div className={`flex-shrink-0 flex flex-col items-center justify-center w-12 h-12 rounded-xl border text-center ${isUrgent ? 'bg-red-500/15 border-red-500/30' : 'bg-gold/10 border-gold/25'}`}>
                                {c.data_casamento ? (
                                  <>
                                    <span className={`text-base font-bold leading-none ${isUrgent ? 'text-red-400' : 'text-gold'}`}>{c.data_casamento.split('-')[2]}</span>
                                    <span className={`text-[8px] uppercase tracking-wide font-semibold ${isUrgent ? 'text-red-400/60' : 'text-gold/60'}`}>{MESES[parseInt(c.data_casamento.split('-')[1])-1]}</span>
                                  </>
                                ) : <span className="text-white/20 text-xs">—</span>}
                              </div>
                              <div>
                                <p className="text-base font-light tracking-wider text-white uppercase">{c.local || '—'}</p>
                                <p className="text-xs text-white/40 mt-0.5">{fmtDate(c.data_casamento)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {days !== null && (
                                <span className={`text-[10px] px-2.5 py-1 rounded-full border tracking-widest font-medium ${days <= 7 ? 'bg-red-500/15 text-red-400 border-red-500/30' : days <= 30 ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' : 'bg-white/5 text-white/30 border-white/10'}`}>
                                  {days === 0 ? 'HOJE' : `${days}d`}
                                </span>
                              )}
                              {c.data_confirmada && (
                                <span className="text-[10px] px-2.5 py-1 rounded-full border bg-emerald-500/15 text-emerald-400 border-emerald-500/30 tracking-widest">
                                  ✓ Confirmado
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>

              {/* Casamentos Passados */}
              <section>
                <p className="text-[9px] tracking-[0.4em] text-white/25 uppercase mb-4">Casamentos Anteriores ({past.length})</p>
                {past.length === 0 ? (
                  <p className="text-white/15 text-xs tracking-widest">Sem casamentos anteriores.</p>
                ) : (
                  <div className="space-y-2">
                    {past.map(c => (
                      <div key={c.id} onClick={() => setFicha(c)}
                        className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-white/[0.04] bg-white/[0.01] opacity-60 cursor-pointer hover:opacity-80 hover:border-white/[0.10] transition-all">
                        <div>
                          <p className="text-sm text-white/60">{c.local || '—'}</p>
                          <p className="text-[10px] text-white/25 mt-0.5">{fmtDate(c.data_casamento).split(' · ')[0]}</p>
                        </div>
                        {c.data_confirmada && (
                          <span className="text-[9px] text-emerald-400/50">✓</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* Ficha modal */}
          {ficha && (
            <CasamentoFicha
              c={ficha}
              isVideografo={freelancer?.status === 'VIDEOGRAFO'}
              onClose={() => setFicha(null)}
              onConfirm={(id) => {
                setCasamentos(prev => prev.map(c => c.id === id ? { ...c, data_confirmada: true } : c))
                setFicha(prev => prev?.id === id ? { ...prev, data_confirmada: true } : prev)
              }}
            />
          )}

          {/* ── Tab: Edição de Fotos ── */}
          {tab === 'edicao' && (
            <section>
              {edicao.length === 0 ? (
                <p className="text-white/15 text-xs tracking-widest">Sem trabalhos de edição atribuídos.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {STATUS_EDICAO_ORDER.map(status => {
                    const jobs = edicao.filter(e => e.status === status)
                    return (
                      <div key={status} className="space-y-2">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[9px] font-bold tracking-widest uppercase ${STATUS_EDICAO_STYLE[status] ?? 'bg-white/5 text-white/30 border-white/10'}`}>
                          <span>{status}</span>
                          <span className="ml-auto opacity-60">({jobs.length})</span>
                        </div>
                        {jobs.map(e => <EdicaoCard key={e.id} e={e} onStatusChange={(id, s) => setEdicao(prev => prev.map(x => x.id === id ? { ...x, status: s } : x))} />)}
                        {jobs.length === 0 && (
                          <p className="text-[9px] text-white/15 text-center py-4 tracking-widest">—</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          )}

          {/* ── Tab: Edição de Álbum ── */}
          {tab === 'album' && (
            <section>
              {album.length === 0 ? (
                <p className="text-white/15 text-xs tracking-widest">Sem álbuns atribuídos.</p>
              ) : (
                <div className="space-y-2">
                  {album.map(a => (
                    <div key={a.id} className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                      <div>
                        <p className="text-sm text-white/80">{a.nome}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {a.data_casamento && <p className="text-[10px] text-white/30">{fmtDate(a.data_casamento).split(' · ')[0]}</p>}
                          {a.referencia_album && <span className="text-[9px] text-gold/50 font-mono">{a.referencia_album}</span>}
                        </div>
                      </div>
                      <span className={`text-[9px] px-2.5 py-1 rounded-full border tracking-widest uppercase font-medium shrink-0 ${STATUS_ALBUM_STYLE[a.status] ?? 'bg-white/5 text-white/30 border-white/10'}`}>
                        {a.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

        </div>
      )}
    </main>
  )
}
