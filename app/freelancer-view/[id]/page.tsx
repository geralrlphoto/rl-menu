'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const DIAS  = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

function addDaysStr(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

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

type Freelancer = { id: string; nome: string; status: string | null; intro_casamentos: string | null; intro_home: string | null }
type Casamento  = { id: string; local: string; data_casamento: string | null; referencia?: string | null; equipa_foto: string[] | null; videografo: string | null; briefing_url: string | null; data_confirmada: boolean | null; indisponivel: boolean | null; data_confirmada_videografo: boolean | null; indisponivel_videografo: boolean | null }
type Edicao     = {
  id: string; nome: string; status: string; data_casamento: string | null
  data_entrega: string | null; data_final_entrega: string | null; local: string | null
  convidados: number | null; cerimonia: number | null; detalhes: number | null
  sala_animacao: number | null; fotos_album: number | null; bolo_bouquet: number | null
  sessao_noivos: number | null; fotos_noiva: number | null; fotos_noivo: number | null
}
type Alteracao  = { id: string; ref_evento: string; paginas_alterar: string | null; tipos_alteracao: string[] | null; observacoes: string | null; foto_url: string | null; created_at: string }
type Album      = { id: string; nome: string; status: string; data_casamento: string | null; referencia_album: string | null; data_entrega_fotos?: string | null; alteracao?: Alteracao | null }

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

// ── Album Status Select ───────────────────────────────────────────────────────
const ALBUM_STATUS_OPTIONS  = ['AGUARDAR','EM EDIÇÃO','EM APROVAÇÃO'] // freelancer não pode selecionar APROVADO nem ENTREGUE
const ALBUM_STATUS_SECTIONS = ['AGUARDAR','EM EDIÇÃO','EM APROVAÇÃO','APROVADO','ENTREGUE']
const ALBUM_STATUS_SELECT_STYLE: Record<string, string> = {
  'AGUARDAR':      'bg-white/10 text-white/50 border-white/20',
  'EM EDIÇÃO':     'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  'EM APROVAÇÃO':  'bg-blue-500/15 text-blue-400 border-blue-500/30',
  'APROVADO':      'bg-purple-500/15 text-purple-400 border-purple-500/30',
  'ENTREGUE':      'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
}
function AlbumStatusSelect({ albumId, status, onChanged }: { albumId: string; status: string; onChanged: (s: string) => void }) {
  const [saving, setSaving] = useState(false)
  const cls = ALBUM_STATUS_SELECT_STYLE[status] ?? 'bg-white/5 text-white/30 border-white/10'

  async function handleChange(v: string) {
    setSaving(true)
    await fetch('/api/freelancer-album', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: albumId, status: v }),
    })
    onChanged(v)
    setSaving(false)
  }

  // APROVADO e ENTREGUE só podem ser definidos pelo cliente/admin — mostra badge fixo
  if (status === 'APROVADO') {
    return (
      <span className={`text-[9px] px-2.5 py-1 rounded-full border tracking-widest uppercase font-medium ${cls}`}>
        APROVADO ✓
      </span>
    )
  }
  if (status === 'ENTREGUE') {
    return (
      <span className={`text-[9px] px-2.5 py-1 rounded-full border tracking-widest uppercase font-medium ${cls}`}>
        ENTREGUE ✓
      </span>
    )
  }

  return (
    <select
      value={status}
      onChange={e => handleChange(e.target.value)}
      disabled={saving}
      className={`text-[9px] px-2.5 py-1 rounded-full border tracking-widest uppercase font-medium appearance-none cursor-pointer focus:outline-none transition-all disabled:opacity-50 ${cls} [color-scheme:dark]`}
      style={{ backgroundColor: 'transparent' }}
    >
      {ALBUM_STATUS_OPTIONS.map(o => (
        <option key={o} value={o} style={{ backgroundColor: '#1a1a1a', color: 'white' }}>{o}</option>
      ))}
    </select>
  )
}

// ── Album Info Modal ──────────────────────────────────────────────────────────
function albumStatusCfg(s: string | null) {
  switch (s) {
    case 'EM EDIÇÃO':      return { bg: 'bg-blue-500/15',    border: 'border-blue-500/40',    text: 'text-blue-300',    dot: 'bg-blue-400',    bar: 'bg-blue-500' }
    case 'PARA APROVAÇÃO': return { bg: 'bg-amber-500/15',   border: 'border-amber-500/40',   text: 'text-amber-300',   dot: 'bg-amber-400',   bar: 'bg-amber-500' }
    case 'ALTERAÇÕES':     return { bg: 'bg-red-500/15',     border: 'border-red-500/40',     text: 'text-red-300',     dot: 'bg-red-400',     bar: 'bg-red-500' }
    case 'APROVADO':       return { bg: 'bg-emerald-500/15', border: 'border-emerald-500/40', text: 'text-emerald-300', dot: 'bg-emerald-400', bar: 'bg-emerald-500' }
    case 'ENTREGUE':       return { bg: 'bg-purple-500/15',  border: 'border-purple-500/40',  text: 'text-purple-300',  dot: 'bg-purple-400',  bar: 'bg-purple-500' }
    default:               return { bg: 'bg-white/5',        border: 'border-white/15',       text: 'text-white/40',    dot: 'bg-white/25',    bar: 'bg-white/20' }
  }
}

function AlbumInfoModal({ refEvento, nome, dataCasamento, onClose }: { refEvento: string | null; nome: string; dataCasamento: string | null; onClose: () => void }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/albuns-casamento').then(r => r.json())
        const rows = res.rows ?? []
        const match = rows.find((r: any) =>
          (refEvento && r.ref_evento === refEvento) ||
          r.nome?.toLowerCase().trim() === nome?.toLowerCase().trim()
        )
        setData(match ?? null)
      } catch { setData(null) }
      setLoading(false)
    }
    load()
  }, [refEvento, nome])

  const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  function fmt(d: string | null) {
    if (!d) return '—'
    const dt = new Date(d.split('T')[0] + 'T00:00:00')
    if (isNaN(dt.getTime())) return '—'
    return `${String(dt.getDate()).padStart(2,'0')} ${MESES[dt.getMonth()]} ${dt.getFullYear()}`
  }

  const cfg = albumStatusCfg(data?.status)

  function DateBox({ label, value }: { label: string; value: string | null }) {
    return (
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3">
        <span className="text-[8px] tracking-[0.3em] text-white/25 uppercase block mb-1">{label}</span>
        <span className="text-sm text-white/80">{fmt(value)}</span>
      </div>
    )
  }

  function Field({ label, value }: { label: string; value: string | null }) {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-[9px] tracking-[0.35em] text-white/25 uppercase">{label}</span>
        <span className="text-sm text-white/80">{value || '—'}</span>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />
      <div className="relative z-10 bg-[#111] border border-white/[0.08] rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}>

        {/* Barra de cor no topo */}
        <div className={`h-0.5 w-full ${data ? cfg.bar : 'bg-gold/60'}`} />

        {/* Header */}
        <div className="px-8 pt-7 pb-5 border-b border-white/[0.05]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[9px] tracking-[0.5em] text-white/20 uppercase mb-2">Álbum de Casamento</p>
              <h2 className="text-2xl font-light tracking-[0.15em] text-white uppercase">{data?.nome || nome || '—'}</h2>
              {data?.ref_album && <p className="text-xs text-white/30 mt-1 tracking-widest">{data.ref_album}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {data?.status && (
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${cfg.bg} ${cfg.border}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  <span className={`text-xs font-semibold tracking-widest uppercase ${cfg.text}`}>{data.status}</span>
                </div>
              )}
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 text-white/30 hover:text-white hover:border-white/30 transition-all text-sm">✕</button>
            </div>
          </div>
        </div>

        {/* Corpo */}
        <div className="px-8 py-6 flex flex-col gap-6 max-h-[60vh] overflow-y-auto">

          {/* Nome dos Noivos — always visible */}
          <div className="bg-gold/5 border border-gold/20 rounded-2xl p-4">
            <span className="text-[9px] tracking-[0.4em] text-gold/40 uppercase block mb-1.5">Nome dos Noivos</span>
            <span className="text-sm text-white/80">{data?.nome || nome || '—'}</span>
          </div>

          {/* Datas principais — always visible */}
          <div className="grid grid-cols-3 gap-3">
            <DateBox label="Data do Evento"         value={dataCasamento} />
            <DateBox label="Data de Entrada"        value={data?.data_entrega_fotos ?? null} />
            <DateBox label="Data Limite p/ Entrega" value={data?.data_entrega_fotos ? addDaysStr(data.data_entrega_fotos, 35) : null} />
          </div>

          {loading ? (
            <p className="text-white/20 text-xs tracking-widest">A carregar...</p>
          ) : !data ? (
            <p className="text-white/20 text-xs tracking-widest">Sem informação adicional disponível.</p>
          ) : (<>

            {/* Fotos p/Álbum */}
            {data.num_fotografias && (
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 flex items-center justify-between">
                <span className="text-[9px] tracking-[0.35em] text-white/25 uppercase">Fotos p/ Álbum</span>
                <span className="text-2xl font-light text-white/80">{data.num_fotografias}</span>
              </div>
            )}

            {/* Datas álbum */}
            <div>
              <p className="text-[9px] tracking-[0.35em] text-white/20 uppercase mb-3">Datas Álbum</p>
              <div className="grid grid-cols-3 gap-3">
                <DateBox label="Data Aprovação"        value={data.data_aprovacao} />
                <DateBox label="Data Prevista Entrega" value={data.data_prevista_entrega} />
              </div>
            </div>

            {/* Opção + Design */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Opção (Caixa)" value={data.opcao} />
              <Field label="Design" value={data.design} />
            </div>

            {/* Textos */}
            {data.texto_album && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] tracking-[0.35em] text-white/25 uppercase">Texto para Álbum</span>
                <p className="text-sm text-white/80 leading-relaxed">{data.texto_album}</p>
              </div>
            )}
            {data.texto_caixa && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] tracking-[0.35em] text-white/25 uppercase">Texto para Caixa</span>
                <p className="text-sm text-white/80 leading-relaxed">{data.texto_caixa}</p>
              </div>
            )}
          </>)}
        </div>
      </div>
    </div>
  )
}

// ── Password Gate ─────────────────────────────────────────────────────────────
function PasswordGate({ id, onAuth }: { id: string; onAuth: () => void }) {
  const [pw, setPw]       = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw]   = useState(false)

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
      const msgs: Record<string, string> = {
        not_found:     'Freelancer não encontrado. Verifica o link.',
        no_password:   'Ainda não tens password definida. Contacta o administrador.',
        db_error:      'Erro de ligação. Tenta novamente.',
        missing_fields:'Preenche a password.',
      }
      setError(msgs[d.reason] ?? 'Password incorreta. Tenta novamente.')
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
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={pw}
                onChange={e => setPw(e.target.value)}
                autoFocus
                placeholder="••••••••"
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 pr-11 text-white text-sm outline-none focus:border-gold/40 transition-colors placeholder:text-white/15"
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors p-1"
              >
                {showPw ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
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
          {/* Nome dos Noivos — always visible */}
          <div className="bg-gold/5 border border-gold/20 rounded-2xl p-4 mb-4">
            <span className="text-[9px] tracking-[0.4em] text-gold/40 uppercase block mb-1.5">Nome dos Noivos</span>
            <span className="text-sm text-white/80">{record?.nome_noivos || '—'}</span>
          </div>

          {/* Datas — always visible */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3">
              <span className="text-[8px] tracking-[0.3em] text-white uppercase block mb-1">Data do Evento</span>
              <p className="text-sm text-white">{record ? fmtFull(record.date) : '—'}</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3">
              <span className="text-[8px] tracking-[0.3em] text-white uppercase block mb-1">Data de Entrada</span>
              <p className="text-sm text-white">{record ? fmtFull(record.data_entrada) : '—'}</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3">
              <span className="text-[8px] tracking-[0.3em] text-white uppercase block mb-1">Data Limite p/ Entrega</span>
              <p className="text-sm text-white">{record?.data_entrada ? fmtFull(addDaysStr(record.data_entrada, 35)) : '—'}</p>
            </div>
          </div>
          {notFound && (
            <p className="text-white/30 text-sm text-center py-8 tracking-widest">Seleção de fotos não encontrada.</p>
          )}
          {record && (
            <div className="space-y-6">
              {/* Contagens */}
              <div>
                <p className="text-[9px] tracking-[0.35em] text-white uppercase mb-3">Contagem de Fotos</p>
                <div className="grid grid-cols-4 gap-2">
                  {SELECAO_SECTIONS.map(({ label, field }) => (
                    <div key={field} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3">
                      <span className="text-[8px] tracking-[0.2em] text-white uppercase block mb-1">{label}</span>
                      <p className="text-xl font-light text-white">{record[field] || <span className="text-white/30 text-sm">—</span>}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* Detalhes */}
              {record.detalhes && (
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
                  <span className="text-[8px] tracking-[0.3em] text-white uppercase block mb-2">Detalhes</span>
                  <p className="text-sm text-white leading-relaxed">{record.detalhes}</p>
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
            <p className="text-[9px] tracking-[0.4em] text-white uppercase mb-1">Edição de Fotos</p>
            <h2 className="text-xl font-light tracking-[0.1em] text-white uppercase">{e.nome}</h2>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {e.data_casamento && <p className="text-xs text-white">{fmtDate(e.data_casamento).split(' · ')[0]}</p>}
              {e.local && <p className="text-xs text-white">📍 {e.local}</p>}
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
                  <p className="text-[8px] tracking-[0.3em] text-white uppercase mb-1">Data Entrega</p>
                  <p className="text-sm text-white">{fmtDate(e.data_entrega).split(' · ')[0]}</p>
                </div>
              )}
              {e.data_final_entrega && (
                <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl px-4 py-3">
                  <p className="text-[8px] tracking-[0.3em] text-white uppercase mb-1">Entrega Final</p>
                  <p className="text-sm text-white">{fmtDate(e.data_final_entrega).split(' · ')[0]}</p>
                </div>
              )}
            </div>
          )}
          {/* Contagem de fotos */}
          <div>
            <p className="text-[9px] tracking-[0.35em] text-white uppercase mb-3">Contagem de Fotos</p>
            <div className="grid grid-cols-3 gap-2">
              {FOTO_FIELDS.map(({ key, label }) => (
                <div key={key} className="bg-white/[0.03] border border-white/[0.05] rounded-xl px-3 py-2.5">
                  <p className="text-[8px] tracking-[0.2em] text-white uppercase mb-1">{label}</p>
                  <p className="text-xl font-light text-white">{e[key] != null ? String(e[key]) : <span className="text-white/30 text-sm">—</span>}</p>
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
function CasamentoFicha({ c, onClose, onConfirm, isVideografo, freelancerNome }: {
  c: Casamento; onClose: () => void; onConfirm: (id: string) => void; isVideografo: boolean; freelancerNome: string
}) {
  const dtu = daysUntil(c.data_casamento)
  const isUrgent = dtu !== null && dtu >= 0 && dtu <= 15
  const isPast   = dtu !== null && dtu < 0
  const confirmedField    = isVideografo ? 'data_confirmada_videografo' : 'data_confirmada'
  const indispField       = isVideografo ? 'indisponivel_videografo'    : 'indisponivel'
  const confirmedInit     = isVideografo ? (c.data_confirmada_videografo ?? false) : (c.data_confirmada ?? false)
  const indispInit        = isVideografo ? (c.indisponivel_videografo ?? false)    : (c.indisponivel ?? false)

  const [confirming, setConfirming]         = useState(false)
  const [confirmed, setConfirmed]           = useState(confirmedInit)
  const [indisponivel, setIndisponivel]     = useState(indispInit)
  const [markingIndisp, setMarkingIndisp]   = useState(false)
  const [briefingOpen, setBriefingOpen]     = useState(false)

  async function handleConfirmar() {
    setConfirming(true)
    const tsField = isVideografo ? 'confirmado_videografo_em' : 'confirmado_em'
    await fetch('/api/freelancer-casamentos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: c.id, [confirmedField]: true, [indispField]: false, [tsField]: new Date().toISOString() }),
    })
    setConfirmed(true)
    setIndisponivel(false)
    setConfirming(false)
    onConfirm(c.id)
    // Notificar admin
    fetch('/api/send-admin-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo: 'confirmou', freelancer_nome: freelancerNome, referencia: c.referencia ?? null, data_evento: c.data_casamento, local: c.local }),
    }).catch(() => {})
  }

  async function handleIndisponivel() {
    setMarkingIndisp(true)
    const tsField = isVideografo ? 'indisponivel_videografo_em' : 'indisponivel_em'
    await fetch('/api/freelancer-casamentos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: c.id, [indispField]: true, [confirmedField]: false, [tsField]: new Date().toISOString() }),
    })
    setIndisponivel(true)
    setConfirmed(false)
    setMarkingIndisp(false)
    onConfirm(c.id)
    // Notificar admin
    fetch('/api/send-admin-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo: 'indisponivel', freelancer_nome: freelancerNome, referencia: c.referencia ?? null, data_evento: c.data_casamento, local: c.local }),
    }).catch(() => {})
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
                  <p className={`text-xs mt-0.5 ${isUrgent ? 'text-red-400/70' : isPast ? 'text-white/50' : 'text-white'}`}>{fmtDate(c.data_casamento)}</p>
                )}
                {dtu !== null && dtu >= 0 && (
                  <span className={`inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full ${isUrgent ? 'bg-red-500/20 text-red-400' : 'bg-gold/10 text-gold border border-gold/25'}`}>
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
            <p className="text-[9px] tracking-[0.3em] text-white uppercase mb-2">Equipa Fotografia</p>
            {c.equipa_foto && c.equipa_foto.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {c.equipa_foto.map((name, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-white">{name}</span>
                ))}
              </div>
            ) : <p className="text-xs text-white/20 italic">Não definida</p>}
          </div>
          <div>
            <p className="text-[9px] tracking-[0.3em] text-white uppercase mb-2">Videógrafo</p>
            <p className="text-sm text-white">{c.videografo || <span className="text-white/40 italic">Não definido</span>}</p>
          </div>
          <div>
            <p className="text-[9px] tracking-[0.3em] text-white uppercase mb-2">Briefing</p>
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
              <p className="text-[9px] tracking-[0.3em] text-white uppercase mb-2">Relatório</p>
              <a href="https://tally.so/r/np88GE" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold tracking-widest uppercase hover:bg-emerald-500/20 transition-all">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                Relatório
              </a>
            </div>
          )}
        </div>

        {/* Footer — confirmar / indisponível */}
        {!isPast && (
          <div className="px-6 pb-5">
            {confirmed ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold tracking-widest uppercase cursor-default">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  Confirmado
                </div>
                <button disabled
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-white/20 text-xs font-semibold tracking-widest uppercase opacity-40 cursor-not-allowed">
                  Indisponível
                </button>
              </div>
            ) : indisponivel ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold tracking-widest uppercase cursor-default">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                  Indisponível
                </div>
                <button disabled
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-white/20 text-xs font-semibold tracking-widest uppercase opacity-40 cursor-not-allowed">
                  Confirmar
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button onClick={handleConfirmar} disabled={confirming}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold/10 border border-gold/30 text-gold text-xs font-semibold tracking-widest uppercase hover:bg-gold/20 transition-all disabled:opacity-50">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  {confirming ? 'A confirmar...' : 'Confirmar Data'}
                </button>
                <button onClick={handleIndisponivel} disabled={markingIndisp}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/20 text-red-400/60 text-xs font-semibold tracking-widest uppercase hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-400 transition-all disabled:opacity-50">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                  {markingIndisp ? 'A guardar...' : 'Indisponível'}
                </button>
              </div>
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
        <div className="pt-2 border-t border-white/[0.04]">
          <div className="relative">
            <select
              value={status === 'NOVO TRABALHO' ? 'EM EDIÇÃO' : status}
              onChange={ev => handleStatus(ev.target.value)}
              disabled={saving}
              style={{ boxShadow: '0 0 14px 2px rgba(255,255,255,0.10), 0 0 5px 1px rgba(255,255,255,0.12), inset 0 0 12px 0 rgba(255,255,255,0.03)' }}
              className="appearance-none w-full text-[11px] tracking-[0.2em] uppercase font-semibold px-3 py-2.5 pr-7 rounded-xl border border-white/20 bg-white/[0.05] text-white outline-none cursor-pointer transition-all disabled:opacity-40 hover:border-white/40 hover:bg-white/[0.08] [color-scheme:dark]"
            >
              <option value="EM EDIÇÃO" className="bg-zinc-900 text-white">EM EDIÇÃO</option>
              <option value="CONCLUÍDO" className="bg-zinc-900 text-white">CONCLUÍDO</option>
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-white/50">▾</span>
          </div>
        </div>
        <div>
          <button onClick={() => setOpenSelecao(true)}
            className="text-[9px] tracking-[0.15em] uppercase px-3 py-1.5 rounded-lg border border-gold/30 bg-gold/5 text-gold/70 hover:text-gold hover:border-gold/50 hover:bg-gold/10 transition-all">
            Ver Mais
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
  const [tab, setTab]               = useState<'casamentos'|'edicao'|'album'|null>(null)
  const [ficha, setFicha]           = useState<Casamento | null>(null)
  const [albumInfo, setAlbumInfo]   = useState<Album | null>(null)

  // Block browser back button
  useEffect(() => {
    history.pushState(null, '', window.location.href)
    const block = () => { history.pushState(null, '', window.location.href) }
    window.addEventListener('popstate', block)
    return () => window.removeEventListener('popstate', block)
  }, [])

  // Check session
  useEffect(() => {
    const ok = sessionStorage.getItem(`freelancerAuth_${id}`) === 'true'
    setAuthed(ok)
    setChecking(false)
  }, [id])

  const loadData = useCallback(async () => {
    setLoading(true)
    const [fRes, cRes, eRes, aRes, alRes] = await Promise.all([
      fetch(`/api/freelancers`).then(r => r.json()),
      fetch(`/api/freelancer-casamentos?freelancer_id=${id}`).then(r => r.json()),
      fetch(`/api/freelancer-edicao?freelancer_id=${id}`).then(r => r.json()),
      fetch(`/api/freelancer-album?freelancer_id=${id}`).then(r => r.json()),
      fetch(`/api/albuns-casamento`).then(r => r.json()).catch(() => ({ rows: [] })),
    ])
    const f = (fRes.freelancers ?? []).find((x: Freelancer) => x.id === id) ?? null
    setFreelancer(f)
    setCasamentos(cRes.casamentos ?? [])
    setEdicao(eRes.edicao ?? [])
    // Enrich album with data_entrega_fotos from albuns_casamento
    const alRows: any[] = alRes.rows ?? []
    const enriched = (aRes.album ?? []).map((a: Album) => {
      const match = alRows.find((r: any) =>
        (a.referencia_album && r.ref_evento === a.referencia_album) ||
        r.nome?.toLowerCase().trim() === a.nome?.toLowerCase().trim()
      )
      return { ...a, data_entrega_fotos: match?.data_entrega_fotos ?? null }
    })
    // Fetch alteration requests for albums that have referencia_album
    const refs = (aRes.album ?? [])
      .map((a: Album) => a.referencia_album)
      .filter(Boolean)
    let alteracaoMap: Record<string, Alteracao> = {}
    if (refs.length > 0) {
      const altRes = await fetch(`/api/album-alteracoes?refs=${refs.join(',')}`).then(r => r.json()).catch(() => ({ alteracoes: [] }))
      for (const alt of (altRes.alteracoes ?? [])) {
        alteracaoMap[alt.ref_evento] = alt
      }
    }

    const enrichedWithAlt = enriched.map((a: Album) => ({
      ...a,
      alteracao: a.referencia_album ? (alteracaoMap[a.referencia_album] ?? null) : null,
    }))
    setAlbum(enrichedWithAlt)
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
        <p className="text-[16px] text-white font-semibold mb-3">RL PHOTO.VIDEO · Área do Freelancer</p>
        {loading ? (
          <p className="text-white/20 text-xs tracking-widest uppercase">A carregar...</p>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-light tracking-[0.15em] text-white uppercase">{freelancer?.nome ?? '—'}</h1>
                {freelancer?.status && (
                  <span className="inline-block mt-2 text-[9px] px-2.5 py-1 rounded-full border tracking-widest uppercase font-semibold bg-gold/10 text-gold border-gold/30">
                    {freelancer.status}
                  </span>
                )}
              </div>
              {upcoming[0] && (() => {
                const next = upcoming[0]
                const dtu = daysUntil(next.data_casamento)
                const isUrgent = dtu !== null && dtu <= 15
                return (
                  <div className={`flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl border ${isUrgent ? 'border-red-500/30 bg-red-500/5' : 'border-gold/20 bg-gold/[0.04]'}`}>
                    <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl border ${isUrgent ? 'bg-red-500/15 border-red-500/30' : 'bg-gold/10 border-gold/25'}`}>
                      <span className={`text-lg font-bold leading-none ${isUrgent ? 'text-red-400' : 'text-gold'}`}>{dtu === 0 ? '!' : dtu}</span>
                      <span className={`text-[8px] uppercase tracking-wide ${isUrgent ? 'text-red-400/60' : 'text-gold/60'}`}>{dtu === 0 ? 'HOJE' : 'd'}</span>
                    </div>
                    <div>
                      <p className="text-[9px] text-white/25 uppercase tracking-widest mb-0.5">Próximo</p>
                      <p className="text-sm font-semibold text-white/80 max-w-[150px] truncate">{next.local}</p>
                      <p className="text-[10px] text-white/35">{fmtDate(next.data_casamento).split(' · ')[0]}</p>
                    </div>
                  </div>
                )
              })()}
            </div>
            <div className="mt-4 h-px w-12 bg-gold/50" />
          </>
        )}
      </div>

      {/* Tab Navigation */}
      {!loading && (
        <div className="flex items-center gap-1.5 mb-8 p-1.5 rounded-2xl border border-white/30 bg-black"
          style={{ boxShadow: '0 0 18px 3px rgba(255,255,255,0.10), 0 0 6px 1px rgba(255,255,255,0.15), inset 0 0 18px 0 rgba(255,255,255,0.03)' }}>
          <button
            onClick={() => setTab(null)}
            className={`flex items-center justify-center px-4 py-2.5 rounded-xl text-xl transition-all ${
              tab === null
                ? 'bg-white/10 text-white border border-white/20'
                : 'text-white/40 hover:text-white/70 border border-transparent'
            }`}
          >
            ⌂
          </button>
          {[
            { key: 'casamentos', label: 'Casamentos', count: casamentos.length },
            { key: 'edicao',     label: 'Edição de Fotos', count: edicao.length },
            ...(album.length > 0 ? [{ key: 'album', label: 'Edição de Álbum', count: album.length }] : []),
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as typeof tab)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[9px] tracking-[0.25em] uppercase font-semibold transition-all ${
                tab === t.key
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'text-white/30 hover:text-white/55 border border-transparent'
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold transition-all ${
                  tab === t.key ? 'bg-white/15 text-white/80' : 'bg-white/[0.06] text-white/25'
                }`}>{t.count}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {!loading && tab === null && (
        freelancer?.intro_home
          ? (
            <div className="max-w-xl mx-auto px-2 py-8">
              <p className="text-sm text-white/60 leading-relaxed whitespace-pre-wrap">{freelancer.intro_home}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
              <div className="h-px w-8 bg-white/10 mx-auto mb-2" />
              <p className="text-[9px] tracking-[0.4em] text-white/20 uppercase">Seleciona uma secção acima</p>
            </div>
          )
      )}

      {!loading && tab !== null && (
        <div>

          {/* ── Tab: Casamentos ── */}
          {tab === 'casamentos' && (
            <div className="space-y-10">

              {/* Intro */}
              {(freelancer?.intro_casamentos || true) && (
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] px-5 py-4 space-y-1">
                  <p className="text-[16px] text-white font-semibold">A Tua Agenda</p>
                  <p className="text-[15px] text-white/75 leading-relaxed whitespace-pre-wrap">
                    {freelancer?.intro_casamentos || `Aqui encontras todos os eventos que te foram atribuídos ao longo do ano. Sempre que um novo evento for adicionado, deverás confirmar a tua disponibilidade.\n\nA 3 dias do evento tens acesso ao briefing com toda a informação necessária para o dia — percurso, contactos, detalhes da cerimónia e muito mais.`}
                  </p>
                </div>
              )}

              {/* Próximos */}
              <section>
                <p className="text-[16px] text-white font-semibold mb-4">Próximos Casamentos ({upcoming.length})</p>
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
                                <p className="text-xs text-white mt-0.5">{fmtDate(c.data_casamento)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {days !== null && (
                                <span className={`text-[10px] px-2.5 py-1 rounded-full border tracking-widest font-medium ${days <= 7 ? 'bg-red-500/15 text-red-400 border-red-500/30' : days <= 30 ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' : 'bg-gold/10 text-gold border-gold/25'}`}>
                                  {days === 0 ? 'HOJE' : `${days}d`}
                                </span>
                              )}
                              {(freelancer?.status === 'VIDEOGRAFO' ? c.data_confirmada_videografo : c.data_confirmada) && (
                                <span className="text-[10px] px-2.5 py-1 rounded-full border bg-emerald-500/15 text-emerald-400 border-emerald-500/30 tracking-widest">
                                  ✓ Confirmado
                                </span>
                              )}
                              {(freelancer?.status === 'VIDEOGRAFO' ? (c.indisponivel_videografo && !c.data_confirmada_videografo) : (c.indisponivel && !c.data_confirmada)) && (
                                <span className="text-[10px] px-2.5 py-1 rounded-full border bg-red-500/15 text-red-400 border-red-500/30 tracking-widest">
                                  Indisponível
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
                <p className="text-[16px] text-white font-semibold mb-4">Casamentos Anteriores ({past.length})</p>
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
              freelancerNome={freelancer?.nome ?? ''}
              onClose={() => setFicha(null)}
              onConfirm={(id) => {
                const isVid = freelancer?.status === 'VIDEOGRAFO'
                setCasamentos(prev => prev.map(c => c.id === id
                  ? isVid ? { ...c, data_confirmada_videografo: true } : { ...c, data_confirmada: true }
                  : c))
                setFicha(prev => prev?.id === id
                  ? isVid ? { ...prev, data_confirmada_videografo: true } : { ...prev, data_confirmada: true }
                  : prev)
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
            <section className="space-y-4">
              {album.length === 0 ? (
                <p className="text-white/15 text-xs tracking-widest">Sem álbuns atribuídos.</p>
              ) : (
                ALBUM_STATUS_SECTIONS.map(statusLabel => {
                  const items = album.filter(a => a.status === statusLabel)
                  return (
                    <div key={statusLabel}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[9px] px-2 py-0.5 rounded border tracking-widest font-semibold uppercase ${STATUS_ALBUM_STYLE[statusLabel] ?? 'bg-white/5 text-white/30 border-white/10'}`}>
                          {statusLabel}
                        </span>
                        <span className="text-[9px] text-white/20">({items.length})</span>
                      </div>
                      {items.length === 0 ? (
                        <p className="text-[10px] text-white/10 italic pl-1">—</p>
                      ) : (
                        <div className="space-y-2">
                          {items.map(a => (
                            <div key={a.id} className={`rounded-xl border overflow-hidden ${a.alteracao ? 'border-orange-500/40 bg-orange-500/[0.04]' : 'border-white/[0.06] bg-white/[0.02]'}`}>
                              {/* Alteration banner */}
                              {a.alteracao && (
                                <div className="bg-orange-500/10 border-b border-orange-500/30">
                                  {/* Header row */}
                                  <div className="px-4 pt-3 pb-2 flex items-center gap-2">
                                    <span className="text-orange-400 text-xs">✎</span>
                                    <p className="text-[9px] tracking-[0.3em] uppercase font-semibold text-orange-400">Alterações Solicitadas pelo Cliente</p>
                                  </div>
                                  {/* Details */}
                                  <div className="px-4 pb-3 flex gap-3">
                                    {/* Photo thumbnail */}
                                    {a.alteracao.foto_url && (
                                      <a href={a.alteracao.foto_url} target="_blank" rel="noreferrer" className="flex-shrink-0">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                          src={a.alteracao.foto_url}
                                          alt="Referência do cliente"
                                          className="w-20 h-20 object-cover border border-orange-500/30 hover:border-orange-400/60 transition-colors"
                                        />
                                        <p className="text-[8px] text-orange-300/40 mt-1 text-center tracking-wide">ver foto</p>
                                      </a>
                                    )}
                                    {/* Text details */}
                                    <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                                      {a.alteracao.tipos_alteracao && a.alteracao.tipos_alteracao.length > 0 && (
                                        <div>
                                          <p className="text-[8px] text-orange-300/40 tracking-widest uppercase mb-0.5">Tipo</p>
                                          <p className="text-[9px] text-orange-300/80">{a.alteracao.tipos_alteracao.join(' · ')}</p>
                                        </div>
                                      )}
                                      {a.alteracao.paginas_alterar && (
                                        <div>
                                          <p className="text-[8px] text-orange-300/40 tracking-widest uppercase mb-0.5">Páginas</p>
                                          <p className="text-[9px] text-orange-300/80">{a.alteracao.paginas_alterar}</p>
                                        </div>
                                      )}
                                      {a.alteracao.observacoes && (
                                        <div>
                                          <p className="text-[8px] text-orange-300/40 tracking-widest uppercase mb-0.5">Observações</p>
                                          <p className="text-[9px] text-orange-300/70 leading-relaxed">{a.alteracao.observacoes}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                              <div className="flex items-center justify-between gap-3 px-4 py-3">
                              <div>
                                <p className="text-sm text-white/80">{a.nome}</p>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  {a.data_casamento && <p className="text-[10px] text-white/30">{fmtDate(a.data_casamento).split(' · ')[0]}</p>}
                                  {a.referencia_album && <span className="text-[9px] text-gold/50 font-mono">{a.referencia_album}</span>}
                                </div>
                                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                  {a.data_entrega_fotos && (
                                    <span className="text-[9px] text-white/30">Entrada: {fmtDate(a.data_entrega_fotos).split(' · ')[0]}</span>
                                  )}
                                  {a.data_entrega_fotos && (
                                    <span className="text-[9px] text-white/30">Limite: {fmtDate(addDaysStr(a.data_entrega_fotos, 35)).split(' · ')[0]}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <button onClick={() => setAlbumInfo(a)}
                                  className="text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 rounded-xl border border-gold/30 bg-gold/5 text-gold/70 hover:text-gold hover:border-gold/60 hover:bg-gold/10 transition-all">
                                  Ver Mais
                                </button>
                                <AlbumStatusSelect albumId={a.id} status={a.status} onChanged={s => setAlbum(prev => prev.map(x => x.id === a.id ? { ...x, status: s } : x))} />
                              </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </section>
          )}

        </div>
      )}

      {albumInfo && (
        <AlbumInfoModal
          refEvento={albumInfo.referencia_album}
          nome={albumInfo.nome}
          dataCasamento={albumInfo.data_casamento}
          onClose={() => setAlbumInfo(null)}
        />
      )}
    </main>
  )
}
