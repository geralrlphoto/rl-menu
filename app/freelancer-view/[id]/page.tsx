'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import { TasksWidget, MiniCalendar, NotesWidget } from '@/app/components/FreelancerWidgets'

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

type Freelancer = { id: string; nome: string; status: string | null; intro_casamentos: string | null; intro_home: string | null; intro_home_title: string | null; is_template?: boolean | null; foto_url?: string | null; guia_trabalho?: string | null }
type Casamento  = { id: string; local: string; data_casamento: string | null; referencia?: string | null; equipa_foto: string[] | null; videografo: string | null; briefing_url: string | null; data_confirmada: boolean | null; indisponivel: boolean | null; data_confirmada_videografo: boolean | null; indisponivel_videografo: boolean | null; servicos_dia?: string[] | null; local_cerimonia?: string | null; hora_inicio?: string | null }
type Edicao     = {
  id: string; nome: string; status: string; data_casamento: string | null
  data_entrega: string | null; data_final_entrega: string | null; local: string | null
  convidados: number | null; cerimonia: number | null; detalhes: number | null
  sala_animacao: number | null; fotos_album: number | null; bolo_bouquet: number | null
  sessao_noivos: number | null; fotos_noiva: number | null; fotos_noivo: number | null
}
type Alteracao  = { id: string; ref_evento: string; paginas_alterar: string | null; tipos_alteracao: string[] | null; observacoes: string | null; foto_url: string | null; created_at: string }
type Album      = { id: string; nome: string; status: string; data_casamento: string | null; referencia_album: string | null; data_entrega_fotos?: string | null; alteracao?: Alteracao | null }
type Pagamento   = { id: string; freelancer_id: string; casamento_id: string | null; descricao: string; valor: number | null; data_prevista: string | null; data_pago: string | null; status: string; notas: string | null; created_at: string }
type Disponib    = { id: string; freelancer_id: string; data_inicio: string; data_fim: string | null; motivo: string | null }
type Notificacao = { id: string; freelancer_id: string; titulo: string; mensagem: string | null; tipo: string; lida: boolean; created_at: string }
type Mensagem    = { id: string; freelancer_id: string; casamento_id: string | null; mensagem: string; remetente: string; lida_admin: boolean; lida_freelancer: boolean; created_at: string }

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
      <span className={`text-[14px] px-2.5 py-1 rounded-full border tracking-widest uppercase font-medium ${cls}`}>
        APROVADO ✓
      </span>
    )
  }
  if (status === 'ENTREGUE') {
    return (
      <span className={`text-[14px] px-2.5 py-1 rounded-full border tracking-widest uppercase font-medium ${cls}`}>
        ENTREGUE ✓
      </span>
    )
  }

  return (
    <select
      value={status}
      onChange={e => handleChange(e.target.value)}
      disabled={saving}
      className={`text-[14px] px-2.5 py-1 rounded-full border tracking-widest uppercase font-medium appearance-none cursor-pointer focus:outline-none transition-all disabled:opacity-50 ${cls} [color-scheme:dark]`}
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
        <span className="text-[14px] tracking-[0.3em] text-white/25 uppercase block mb-1">{label}</span>
        <span className="text-[14px] text-white/80">{fmt(value)}</span>
      </div>
    )
  }

  function Field({ label, value }: { label: string; value: string | null }) {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-[14px] tracking-[0.35em] text-white/25 uppercase">{label}</span>
        <span className="text-[14px] text-white/80">{value || '—'}</span>
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
              <p className="text-[14px] tracking-[0.5em] text-white/20 uppercase mb-2">Álbum de Casamento</p>
              <h2 className="text-2xl font-light tracking-[0.15em] text-white uppercase">{data?.nome || nome || '—'}</h2>
              {data?.ref_album && <p className="text-[14px] text-white/30 mt-1 tracking-widest">{data.ref_album}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {data?.status && (
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${cfg.bg} ${cfg.border}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  <span className={`text-[14px] font-semibold tracking-widest uppercase ${cfg.text}`}>{data.status}</span>
                </div>
              )}
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 text-white/30 hover:text-white hover:border-white/30 transition-all text-[14px]">✕</button>
            </div>
          </div>
        </div>

        {/* Corpo */}
        <div className="px-8 py-6 flex flex-col gap-6 max-h-[60vh] overflow-y-auto">

          {/* Nome dos Noivos — always visible */}
          <div className="bg-gold/5 border border-gold/20 rounded-2xl p-4">
            <span className="text-[14px] tracking-[0.4em] text-gold/40 uppercase block mb-1.5">Nome dos Noivos</span>
            <span className="text-[14px] text-white/80">{data?.nome || nome || '—'}</span>
          </div>

          {/* Datas principais — always visible */}
          <div className="grid grid-cols-3 gap-3">
            <DateBox label="Data do Evento"         value={dataCasamento} />
            <DateBox label="Data de Entrada"        value={data?.data_entrega_fotos ?? null} />
            <DateBox label="Data Limite p/ Entrega" value={data?.data_entrega_fotos ? addDaysStr(data.data_entrega_fotos, 35) : null} />
          </div>

          {loading ? (
            <p className="text-white/20 text-[14px] tracking-widest">A carregar...</p>
          ) : !data ? (
            <p className="text-white/20 text-[14px] tracking-widest">Sem informação adicional disponível.</p>
          ) : (<>

            {/* Fotos p/Álbum */}
            {data.num_fotografias && (
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 flex items-center justify-between">
                <span className="text-[14px] tracking-[0.35em] text-white/25 uppercase">Fotos p/ Álbum</span>
                <span className="text-2xl font-light text-white/80">{data.num_fotografias}</span>
              </div>
            )}

            {/* Datas álbum */}
            <div>
              <p className="text-[14px] tracking-[0.35em] text-white/20 uppercase mb-3">Datas Álbum</p>
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
                <span className="text-[14px] tracking-[0.35em] text-white/25 uppercase">Texto para Álbum</span>
                <p className="text-[14px] text-white/80 leading-relaxed">{data.texto_album}</p>
              </div>
            )}
            {data.texto_caixa && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[14px] tracking-[0.35em] text-white/25 uppercase">Texto para Caixa</span>
                <p className="text-[14px] text-white/80 leading-relaxed">{data.texto_caixa}</p>
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
    <div className="min-h-screen flex items-center justify-center px-4 relative" style={{ background: '#0A0A0A' }}>
      {/* Atmosfera */}
      <div className="pointer-events-none fixed inset-0 z-0"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 80% 15%, rgba(201,164,92,0.07), transparent 65%)' }} />
      <div className="pointer-events-none fixed inset-0 z-0"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 15% 85%, rgba(201,164,92,0.05), transparent 70%)' }} />

      <div className="relative z-10 w-full max-w-sm">
        {/* Card editorial */}
        <div className="rounded-3xl border border-white/[0.08] p-8 backdrop-blur-md"
          style={{
            background: 'linear-gradient(135deg, rgba(20,15,8,0.5), rgba(11,11,11,0.85))',
            boxShadow: '0 30px 60px -20px rgba(0,0,0,0.6)',
          }}>
          <div className="text-center mb-8">
            <p className="text-[11px] tracking-[0.5em] text-gold/70 uppercase mb-3">RL Photo.Video</p>
            <h1 className="text-2xl sm:text-3xl font-light text-white tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
              Área do <span className="italic text-gold">Freelancer</span>
            </h1>
            <div className="mt-4 h-px w-12 bg-gradient-to-r from-transparent via-gold/60 to-transparent mx-auto" />
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] tracking-[0.35em] text-white/40 uppercase font-medium mb-2">Password de Acesso</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={pw}
                  onChange={e => setPw(e.target.value)}
                  autoFocus
                  placeholder="••••••••"
                  className="w-full bg-black/30 border border-white/[0.08] rounded-xl px-4 py-3 pr-11 text-white text-[14px] outline-none focus:border-gold/40 transition-colors placeholder:text-white/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-gold transition-colors p-1"
                >
                  {showPw ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>
            {error && (
              <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30">
                <p className="text-[12px] text-red-300">{error}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={loading || !pw.trim()}
              className="w-full h-11 rounded-xl bg-gold text-black font-semibold text-[13px] tracking-widest uppercase hover:bg-gold/90 transition-all disabled:opacity-40"
              style={!loading && pw.trim() ? { boxShadow: '0 0 24px -4px rgba(201,164,92,0.5)' } : {}}
            >
              {loading ? 'A verificar…' : 'Entrar'}
            </button>
          </form>
        </div>
        <p className="text-center text-[10px] tracking-[0.4em] uppercase text-white/15 mt-6">RL Photo.Video · Wedding Moments Films</p>
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
            <p className="text-[14px] tracking-[0.5em] text-white/20 uppercase mb-2">Seleção de Fotos</p>
            <h2 className="text-2xl font-light tracking-[0.15em] text-white uppercase">{nome}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 text-white/30 hover:text-white hover:border-white/30 transition-all text-[14px] mt-1">✕</button>
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
            <span className="text-[14px] tracking-[0.4em] text-gold/40 uppercase block mb-1.5">Nome dos Noivos</span>
            <span className="text-[14px] text-white/80">{record?.nome_noivos || '—'}</span>
          </div>

          {/* Datas — always visible */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3">
              <span className="text-[14px] tracking-[0.3em] text-white uppercase block mb-1">Data do Evento</span>
              <p className="text-[14px] text-white">{record ? fmtFull(record.date) : '—'}</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3">
              <span className="text-[14px] tracking-[0.3em] text-white uppercase block mb-1">Data de Entrada</span>
              <p className="text-[14px] text-white">{record ? fmtFull(record.data_entrada) : '—'}</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3">
              <span className="text-[14px] tracking-[0.3em] text-white uppercase block mb-1">Data Limite p/ Entrega</span>
              <p className="text-[14px] text-white">{record?.data_entrada ? fmtFull(addDaysStr(record.data_entrada, 35)) : '—'}</p>
            </div>
          </div>
          {notFound && (
            <p className="text-white/30 text-[14px] text-center py-8 tracking-widest">Seleção de fotos não encontrada.</p>
          )}
          {record && (
            <div className="space-y-6">
              {/* Contagens */}
              <div>
                <p className="text-[14px] tracking-[0.35em] text-white uppercase mb-3">Contagem de Fotos</p>
                <div className="grid grid-cols-4 gap-2">
                  {SELECAO_SECTIONS.map(({ label, field }) => (
                    <div key={field} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3">
                      <span className="text-[14px] tracking-[0.2em] text-white uppercase block mb-1">{label}</span>
                      <p className="text-xl font-light text-white">{record[field] || <span className="text-white/30 text-[14px]">—</span>}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* Detalhes */}
              {record.detalhes && (
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
                  <span className="text-[14px] tracking-[0.3em] text-white uppercase block mb-2">Detalhes</span>
                  <p className="text-[14px] text-white leading-relaxed">{record.detalhes}</p>
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
            <p className="text-[14px] tracking-[0.4em] text-white uppercase mb-1">Edição de Fotos</p>
            <h2 className="text-xl font-light tracking-[0.1em] text-white uppercase">{e.nome}</h2>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {e.data_casamento && <p className="text-[14px] text-white">{fmtDate(e.data_casamento).split(' · ')[0]}</p>}
              {e.local && <p className="text-[14px] text-white">📍 {e.local}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[14px] px-2.5 py-1 rounded-full border tracking-widest uppercase font-medium ${STATUS_EDICAO_STYLE[e.status] ?? 'bg-white/5 text-white/30 border-white/10'}`}>
              {e.status}
            </span>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full border border-white/10 text-white/30 hover:text-white hover:border-white/30 transition-all text-[14px]">✕</button>
          </div>
        </div>
        {/* Body */}
        <div className="px-7 py-5 space-y-5">
          {/* Datas */}
          {(e.data_entrega || e.data_final_entrega) && (
            <div className="grid grid-cols-2 gap-3">
              {e.data_entrega && (
                <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl px-4 py-3">
                  <p className="text-[14px] tracking-[0.3em] text-white uppercase mb-1">Data Entrega</p>
                  <p className="text-[14px] text-white">{fmtDate(e.data_entrega).split(' · ')[0]}</p>
                </div>
              )}
              {e.data_final_entrega && (
                <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl px-4 py-3">
                  <p className="text-[14px] tracking-[0.3em] text-white uppercase mb-1">Entrega Final</p>
                  <p className="text-[14px] text-white">{fmtDate(e.data_final_entrega).split(' · ')[0]}</p>
                </div>
              )}
            </div>
          )}
          {/* Contagem de fotos */}
          <div>
            <p className="text-[14px] tracking-[0.35em] text-white uppercase mb-3">Contagem de Fotos</p>
            <div className="grid grid-cols-3 gap-2">
              {FOTO_FIELDS.map(({ key, label }) => (
                <div key={key} className="bg-white/[0.03] border border-white/[0.05] rounded-xl px-3 py-2.5">
                  <p className="text-[14px] tracking-[0.2em] text-white uppercase mb-1">{label}</p>
                  <p className="text-xl font-light text-white">{e[key] != null ? String(e[key]) : <span className="text-white/30 text-[14px]">—</span>}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Acrescenta ?freelancer=1 ao URL do briefing → portal dos noivos abre em modo
// bloqueado (só o briefing, sem navegação para o resto do portal).
function withBriefingLock(url: string): string {
  if (!url) return ''
  try {
    const u = new URL(url)
    u.searchParams.set('freelancer', '1')
    return u.toString()
  } catch {
    return url + (url.includes('?') ? '&' : '?') + 'freelancer=1'
  }
}

// ── Briefing Modal ────────────────────────────────────────────────────────────
function BriefingModal({ url, onClose }: { url: string; onClose: () => void }) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError]   = useState(false)
  const lockedUrl = withBriefingLock(url)

  return (
    <div className="fixed inset-0 z-[60] flex flex-col" onClick={onClose}>
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />
      {/* Header bar */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3 bg-[#0e0e0e] border-b border-white/[0.07] flex-shrink-0" onClick={e => e.stopPropagation()}>
        <p className="text-[14px] tracking-[0.4em] text-white/30 uppercase">Briefing</p>
        <div className="flex items-center gap-2">
          <a href={lockedUrl} target="_blank" rel="noopener noreferrer"
            className="text-[14px] px-3 py-1.5 rounded-lg border border-white/10 text-white/30 hover:text-white/60 hover:border-white/25 transition-all tracking-widest uppercase">
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
            <p className="text-white/30 text-[14px] tracking-widest">Não foi possível carregar o briefing aqui.</p>
            <a href={lockedUrl} target="_blank" rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl bg-gold/10 border border-gold/30 text-gold text-[14px] font-semibold tracking-widest uppercase hover:bg-gold/20 transition-all">
              Abrir no Browser ↗
            </a>
          </div>
        )}
        <iframe
          src={lockedUrl}
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

// ── Relatório Vídeo — helpers ─────────────────────────────────────────────────
function RSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-[14px] tracking-[0.4em] uppercase font-semibold shrink-0"
          style={{ color: 'rgba(6,182,212,0.55)' }}>{label}</span>
        <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(6,182,212,0.2), transparent)' }} />
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function RField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[14px] tracking-[0.35em] uppercase font-medium" style={{ color: 'rgba(255,255,255,0.25)' }}>{label}</p>
      {children}
    </div>
  )
}

function RInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full bg-transparent outline-none text-[14px] text-white placeholder-white/10 py-3 px-4 rounded-xl transition-all duration-200"
      style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}
      onFocus={e => { e.currentTarget.style.borderColor = 'rgba(6,182,212,0.45)'; e.currentTarget.style.boxShadow = '0 0 16px rgba(6,182,212,0.08)' }}
      onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.boxShadow = 'none' }}
    />
  )
}

function RTextarea({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3}
      className="w-full bg-transparent outline-none text-[14px] text-white placeholder-white/10 py-3 px-4 rounded-xl transition-all duration-200 resize-none"
      style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}
      onFocus={e => { e.currentTarget.style.borderColor = 'rgba(6,182,212,0.45)'; e.currentTarget.style.boxShadow = '0 0 16px rgba(6,182,212,0.08)' }}
      onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.boxShadow = 'none' }}
    />
  )
}

function RSegmented({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map(opt => (
        <button key={opt} type="button" onClick={() => onChange(value === opt ? '' : opt)}
          className="px-4 py-2 rounded-lg text-[14px] font-semibold tracking-widest uppercase transition-all duration-150"
          style={value === opt ? {
            background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.4)',
            color: 'rgba(6,182,212,0.9)', boxShadow: '0 0 14px rgba(6,182,212,0.1)',
          } : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.28)' }}>
          {opt}
        </button>
      ))}
    </div>
  )
}

function RMulti({ options, value, onChange }: { options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (opt: string) =>
    onChange(value.includes(opt) ? value.filter(x => x !== opt) : [...value, opt])
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map(opt => {
        const active = value.includes(opt)
        return (
          <button key={opt} type="button" onClick={() => toggle(opt)}
            className="px-4 py-2 rounded-lg text-[14px] font-semibold tracking-widest uppercase transition-all duration-150"
            style={active ? {
              background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.4)',
              color: 'rgba(6,182,212,0.9)', boxShadow: '0 0 14px rgba(6,182,212,0.1)',
            } : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.28)' }}>
            {opt}
          </button>
        )
      })}
    </div>
  )
}

function RToggle({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <div className="flex gap-2">
      {([true, false] as const).map(v => (
        <button key={String(v)} type="button" onClick={() => onChange(v)}
          className="flex-1 py-2.5 rounded-xl text-[14px] font-semibold tracking-widest uppercase transition-all duration-150"
          style={value === v ? {
            background: v ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.08)',
            border: `1px solid ${v ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.3)'}`,
            color: v ? 'rgba(52,211,153,0.9)' : 'rgba(252,165,165,0.85)',
            boxShadow: v ? '0 0 12px rgba(16,185,129,0.1)' : '0 0 10px rgba(239,68,68,0.07)',
          } : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.22)' }}>
          {v ? 'Sim' : 'Não'}
        </button>
      ))}
    </div>
  )
}

// ── Relatório Vídeo — Modal ───────────────────────────────────────────────────
function RelatorioVideoModal({ c, freelancerNome, onClose, onSubmitted }: { c: Casamento; freelancerNome: string; onClose: () => void; onSubmitted: () => void }) {
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]             = useState(false)
  const [error, setError]           = useState('')
  const [form, setForm] = useState({
    nomeNoivos:      '',
    tipoCerimonia:   [] as string[],
    maquina:         '',
    cartao:          '',
    caixa:           '',
    drone:           null as boolean | null,
    audio:           [] as string[],
    corteBolo:       [] as string[],
    animacao:        '',
    duranteRefeicao: [] as string[],
    notas:           '',
  })

  function set<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm(p => ({ ...p, [k]: v }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/relatorios-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referencia:    c.referencia,
          nome_operador: freelancerNome,
          dados: {
            'NOME DOS NOIVOS':                          form.nomeNoivos        || null,
            'LOCAL DO CASAMENTO (QUINTA)':              c.local                || null,
            'DATA DO CASAMENTO':                        c.data_casamento       || null,
            'TIPO DE CERIMÓNIA':                        form.tipoCerimonia.length ? form.tipoCerimonia.join(', ') : null,
            'MAQUINA UTLIZADA (MARCA/MODELO)':          form.maquina           || null,
            'QUAL O N.º DO CARTÃO UTILIZADO':           form.cartao            || null,
            'N.º DA CAIXA UTILIZADA':                   form.caixa             || null,
            'DRONE UTILIZADO':                          form.drone === null ? null : form.drone ? 'Sim' : 'Não',
            'AUDIO':                                    form.audio.length ? form.audio.join(', ') : null,
            'CORTE DO BOLO':                            form.corteBolo.length ? form.corteBolo.join(', ') : null,
            'EQUIPA DE ANIMAÇÃO':                       form.animacao          || null,
            'DURANTE A REFEIÇAO E FESTA':               form.duranteRefeicao.length ? form.duranteRefeicao.join(', ') : null,
            'ALGUMA INFORMAÇÃO RELEVANTE COLOCA AQUI':  form.notas             || null,
          },
        }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Erro ao enviar'); return }
      setDone(true)
      onSubmitted()
    } catch { setError('Erro de ligação') } finally { setSubmitting(false) }
  }

  // ── Success ──────────────────────────────────────────────────────────────────
  if (done) return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-8" style={{ background: 'rgba(0,4,10,0.98)' }}>
      <div className="text-center space-y-7 max-w-[340px]">
        <div className="relative mx-auto w-20 h-20">
          <div className="absolute inset-0 rounded-full animate-ping" style={{ background: 'rgba(16,185,129,0.1)', animationDuration: '1.4s' }} />
          <div className="relative w-20 h-20 rounded-full border flex items-center justify-center"
            style={{ borderColor: 'rgba(16,185,129,0.45)', background: 'rgba(16,185,129,0.07)', boxShadow: '0 0 40px rgba(16,185,129,0.15)' }}>
            <svg className="w-9 h-9" style={{ color: 'rgba(52,211,153,0.85)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
        </div>
        <div className="space-y-3">
          <p className="text-xl font-light tracking-[0.2em] uppercase" style={{ color: 'rgba(52,211,153,0.9)' }}>Obrigado!</p>
          <p className="text-[14px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
            O teu relatório foi recebido com sucesso. A equipa RL fica a par de tudo.
          </p>
        </div>
        <button onClick={onClose}
          className="w-full py-3 rounded-xl text-[14px] font-semibold tracking-[0.3em] uppercase transition-all"
          style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.02)' }}>
          Fechar
        </button>
      </div>
    </div>
  )

  // ── Form ─────────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto" style={{ background: 'rgba(0,4,10,0.98)' }}>
      {/* Grid bg */}
      <div className="fixed inset-0 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(6,182,212,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(6,182,212,0.025) 1px,transparent 1px)', backgroundSize: '44px 44px' }} />

      <div className="relative min-h-screen px-4 py-8 max-w-[500px] mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-7">
          <div>
            <p className="text-[14px] tracking-[0.45em] uppercase mb-1.5" style={{ color: 'rgba(6,182,212,0.5)' }}>
              Relatório Pós-Evento
            </p>
            <h2 className="text-2xl font-light tracking-[0.12em] text-white uppercase leading-tight">
              {c.local || '—'}
            </h2>
          </div>
          <button onClick={onClose} type="button"
            className="mt-1 w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.35)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Info pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          {c.referencia && (
            <span className="text-[14px] px-3 py-1.5 rounded-full font-semibold tracking-widest uppercase"
              style={{ border: '1px solid rgba(6,182,212,0.3)', color: 'rgba(6,182,212,0.75)', background: 'rgba(6,182,212,0.06)' }}>
              {c.referencia}
            </span>
          )}
          <span className="text-[14px] px-3 py-1.5 rounded-full font-medium tracking-widest uppercase"
            style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.02)' }}>
            {freelancerNome}
          </span>
          {c.data_casamento && (
            <span className="text-[14px] px-3 py-1.5 rounded-full font-medium tracking-widest uppercase"
              style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.02)' }}>
              {fmtDate(c.data_casamento).split(' · ')[0]}
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-9">

          {/* CERIMÓNIA */}
          <RSection label="Cerimónia">
            <RField label="Nome dos Noivos">
              <RInput value={form.nomeNoivos} onChange={v => set('nomeNoivos', v)} placeholder="Ex: Ana & João Silva" />
            </RField>
            <RField label="Tipo de Cerimónia">
              <RMulti options={['Religiosa', 'Civil', 'Com Celebrente', 'Com Votos', 'Com Discursos', 'Com Rituais']} value={form.tipoCerimonia} onChange={v => set('tipoCerimonia', v)} />
            </RField>
          </RSection>

          {/* EQUIPAMENTO */}
          <RSection label="Equipamento">
            <RField label="Máquina Utilizada (Marca / Modelo)">
              <RInput value={form.maquina} onChange={v => set('maquina', v)} placeholder="Ex: Sony FX3 + Lumix GH7" />
            </RField>
            <div className="grid grid-cols-2 gap-3">
              <RField label="N.º do Cartão">
                <RInput value={form.cartao} onChange={v => set('cartao', v)} placeholder="Ex: 4" />
              </RField>
              <RField label="N.º da Caixa">
                <RInput value={form.caixa} onChange={v => set('caixa', v)} placeholder="Ex: 2" />
              </RField>
            </div>
            <RField label="Drone Utilizado">
              <RToggle value={form.drone} onChange={v => set('drone', v)} />
            </RField>
          </RSection>

          {/* COBERTURA */}
          <RSection label="Cobertura">
            <RField label="Áudio">
              <RMulti options={['Áudio Lapela', 'Áudio Mesa']} value={form.audio} onChange={v => set('audio', v)} />
            </RField>
            <RField label="Corte do Bolo">
              <RMulti options={['Sparkles', 'Fogo de Artifício', 'Fogo Preso', 'Outro', 'Nada / Tudo Normal']} value={form.corteBolo} onChange={v => set('corteBolo', v)} />
            </RField>
            <RField label="Equipa de Animação / DJ">
              <RInput value={form.animacao} onChange={v => set('animacao', v)} placeholder="Nome da equipa ou DJ" />
            </RField>
            <RField label="Durante Refeição e Festa">
              <RMulti
                options={['Houve Discursos', 'Jogos (Quiz, Óscares, Batalha...)', 'Música ao Vivo', 'Bouquet', 'Bomba', 'Dança dos Noivos', 'Nada / Tudo Normal']}
                value={form.duranteRefeicao}
                onChange={v => set('duranteRefeicao', v)}
              />
            </RField>
          </RSection>

          {/* OBSERVAÇÕES */}
          <RSection label="Observações">
            <RField label="Informação Relevante">
              <RTextarea value={form.notas} onChange={v => set('notas', v)} placeholder="Qualquer detalhe importante sobre o evento..." />
            </RField>
          </RSection>

          {/* Error */}
          {error && (
            <p className="text-[14px] text-red-400/70 text-center">{error}</p>
          )}

          {/* Submit */}
          <button type="submit" disabled={submitting}
            className="w-full py-4 rounded-xl text-[14px] font-semibold tracking-[0.3em] uppercase transition-all duration-200"
            style={submitting ? {
              background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.15)', color: 'rgba(6,182,212,0.4)',
            } : {
              background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.35)', color: 'rgba(6,182,212,0.85)',
              boxShadow: '0 0 24px rgba(6,182,212,0.1), 0 0 48px rgba(6,182,212,0.04)',
            }}>
            {submitting ? 'A enviar...' : 'Submeter Relatório'}
          </button>

          <div className="h-6" />
        </form>
      </div>
    </div>
  )
}

// ── Casamento Ficha (read-only) ───────────────────────────────────────────────
function CasamentoFicha({ c, onClose, onConfirm, isVideografo, freelancerNome, notificacoes, onRefreshNotifs }: {
  c: Casamento; onClose: () => void; onConfirm: (id: string) => void; isVideografo: boolean; freelancerNome: string
  notificacoes?: Notificacao[]
  onRefreshNotifs?: () => void
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
  const [showRelatorio, setShowRelatorio]   = useState(false)
  const [jaEnviou, setJaEnviou]             = useState<string | null | 'loading'>('loading')
  const [relatorioExterno, setRelatorioExterno] = useState<any | null>('loading')

  useEffect(() => {
    if (!c.referencia) { setJaEnviou(null); setRelatorioExterno(null); return }
    fetch(`/api/relatorios-video?referencia=${encodeURIComponent(c.referencia)}`)
      .then(r => r.json())
      .then(d => {
        const lista = d.relatorios ?? []
        if (isVideografo) {
          const meu = lista.find((r: any) => r.nome_operador === freelancerNome)
          setJaEnviou(meu ? meu.criado_em : null)
          setRelatorioExterno(null)
        } else {
          setJaEnviou(null)
          setRelatorioExterno(lista[0] ?? null)
        }
      })
      .catch(() => { setJaEnviou(null); setRelatorioExterno(null) })
  }, [isVideografo, c.referencia, freelancerNome])

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
                    <span className={`text-[14px] uppercase tracking-wide font-semibold ${isUrgent ? 'text-red-400/60' : isPast ? 'text-white/20' : 'text-gold/60'}`}>
                      {MESES[parseInt(c.data_casamento.split('-')[1])-1]}
                    </span>
                  </>
                ) : <span className="text-white/20 text-[14px]">—</span>}
              </div>
              <div>
                <h2 className="text-base font-bold text-white uppercase tracking-wide leading-tight">{c.local || '—'}</h2>
                {c.data_casamento && (
                  <p className={`text-[14px] mt-0.5 ${isUrgent ? 'text-red-400/70' : isPast ? 'text-white/50' : 'text-white'}`}>{fmtDate(c.data_casamento)}</p>
                )}
                {dtu !== null && dtu >= 0 && (
                  <span className={`inline-block mt-1 text-[14px] font-bold px-2 py-0.5 rounded-full ${isUrgent ? 'bg-red-500/20 text-red-400' : 'bg-gold/10 text-gold border border-gold/25'}`}>
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
          {/* Hora + Local da Cerimónia */}
          {(c.hora_inicio || c.local_cerimonia) && (
            <div className="grid grid-cols-2 gap-3">
              {c.hora_inicio && (
                <div>
                  <p className="text-[14px] tracking-[0.3em] text-white uppercase mb-2">Hora Início</p>
                  <p className="text-[14px] text-white">⏱ {c.hora_inicio}</p>
                </div>
              )}
              {c.local_cerimonia && (
                <div>
                  <p className="text-[14px] tracking-[0.3em] text-white uppercase mb-2">Cerimónia</p>
                  <p className="text-[14px] text-white">⛪ {c.local_cerimonia}</p>
                </div>
              )}
            </div>
          )}
          <div>
            <p className="text-[14px] tracking-[0.3em] text-white uppercase mb-2">Equipa Fotografia</p>
            {c.equipa_foto && c.equipa_foto.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {c.equipa_foto.map((name, i) => (
                  <span key={i} className="text-[14px] px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-white">{name}</span>
                ))}
              </div>
            ) : <p className="text-[14px] text-white/20 italic">Não definida</p>}
          </div>
          <div>
            <p className="text-[14px] tracking-[0.3em] text-white uppercase mb-2">Videógrafo</p>
            <p className="text-[14px] text-white">{c.videografo || <span className="text-white/40 italic">Não definido</span>}</p>
          </div>
          {/* Serviços do Dia */}
          {c.servicos_dia && c.servicos_dia.length > 0 && (
            <div>
              <p className="text-[14px] tracking-[0.3em] text-white uppercase mb-2">Serviços do Dia</p>
              <div className="flex flex-wrap gap-1.5">
                {c.servicos_dia.map((s, i) => (
                  <span key={i} className="text-[12px] px-2.5 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold tracking-wide">{s}</span>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="text-[14px] tracking-[0.3em] text-white uppercase mb-2">Briefing</p>
            {c.briefing_url ? (() => {
              // Detecta notificação 'briefing_enviado' não lida para esta referência → glow gold pulsante
              const briefingNotif = (notificacoes ?? []).find(n =>
                n.tipo === 'briefing_enviado' &&
                !n.lida &&
                (!c.referencia || (n.mensagem ?? '').includes(`"referencia":"${c.referencia}"`))
              )
              const hasUnread = !!briefingNotif
              return (
                <>
                  <style jsx>{`
                    @keyframes briefingPulse {
                      0%, 100% { box-shadow: 0 0 0 rgba(201,164,92,0.0), 0 0 18px -4px rgba(201,164,92,0.45); }
                      50%      { box-shadow: 0 0 0 rgba(201,164,92,0.0), 0 0 32px 4px rgba(201,164,92,0.85); }
                    }
                    .briefing-glow { animation: briefingPulse 1.6s ease-in-out infinite; }
                  `}</style>
                  <button
                    onClick={async () => {
                      // Marca a notif briefing_enviado como lida (se houver)
                      if (briefingNotif) {
                        try {
                          await fetch('/api/freelancer-notificacoes', {
                            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: briefingNotif.id, lida: true }),
                          })
                          onRefreshNotifs?.()
                        } catch { /* não bloqueia abertura do modal */ }
                      }
                      setBriefingOpen(true)
                    }}
                    className={`inline-flex items-center gap-1.5 text-[14px] transition-all px-3 py-1.5 rounded-lg ${
                      hasUnread
                        ? 'briefing-glow bg-gold text-black font-bold tracking-wide hover:bg-gold/90'
                        : 'text-gold/70 hover:text-gold border border-gold/20 hover:bg-gold/5'
                    }`}>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    {hasUnread ? '✨ Novo Briefing!' : 'Ver Briefing'}
                  </button>
                </>
              )
            })() : <p className="text-[14px] text-white/20 italic">Sem briefing</p>}
          </div>
          {isVideografo && (
            <div>
              <p className="text-[14px] tracking-[0.3em] text-white uppercase mb-2">Relatório Pós-Evento</p>
              {c.referencia ? (
                jaEnviou === 'loading' ? (
                  <p className="text-[14px] text-white/20 italic">...</p>
                ) : jaEnviou ? (
                  <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl"
                    style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.25)' }}>
                    <svg className="w-3.5 h-3.5 shrink-0" style={{ color: 'rgba(52,211,153,0.7)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    <div>
                      <p className="text-[14px] font-semibold tracking-widest uppercase" style={{ color: 'rgba(52,211,153,0.8)' }}>Relatório Enviado</p>
                      <p className="text-[14px] mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
                        {new Date(jaEnviou).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowRelatorio(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[14px] font-semibold tracking-widest uppercase transition-all"
                    style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.3)', color: 'rgba(6,182,212,0.8)' }}>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    Preencher Relatório
                  </button>
                )
              ) : (
                <p className="text-[14px] text-white/20 italic">Referência não disponível</p>
              )}
            </div>
          )}
          {!isVideografo && c.referencia && (
            <div>
              <p className="text-[14px] tracking-[0.3em] text-white uppercase mb-2">Relatório do Videógrafo</p>
              {relatorioExterno === 'loading' ? (
                <p className="text-[14px] text-white/20 italic">...</p>
              ) : relatorioExterno ? (() => {
                const d = relatorioExterno.dados ?? {}
                const SKIP = ['LOCAL DO CASAMENTO (QUINTA)', 'DATA DO CASAMENTO']
                const LABEL: Record<string, string> = {
                  'NOME DOS NOIVOS': 'Noivos',
                  'TIPO DE CERIMÓNIA': 'Cerimónia',
                  'MAQUINA UTLIZADA (MARCA/MODELO)': 'Máquina',
                  'QUAL O N.º DO CARTÃO UTILIZADO': 'Cartão',
                  'N.º DA CAIXA UTILIZADA': 'Caixa',
                  'DRONE UTILIZADO': 'Drone',
                  'AUDIO': 'Áudio',
                  'CORTE DO BOLO': 'Corte do Bolo',
                  'EQUIPA DE ANIMAÇÃO': 'Animação',
                  'DURANTE A REFEIÇAO E FESTA': 'Durante Festa',
                  'ALGUMA INFORMAÇÃO RELEVANTE COLOCA AQUI': 'Notas',
                }
                const campos = Object.entries(d).filter(([k, v]) => !SKIP.includes(k) && v !== null && v !== undefined && String(v).trim() !== '')
                return (
                  <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
                    {/* Header do relatório */}
                    <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                        <span className="text-[14px] font-medium text-white/70">{relatorioExterno.nome_operador || '—'}</span>
                      </div>
                      <span className="text-[14px] text-white/25">
                        {new Date(relatorioExterno.criado_em).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </span>
                    </div>
                    {/* Campos */}
                    <div className="px-4 py-3 flex flex-col gap-2.5">
                      {campos.map(([key, val]) => (
                        <div key={key} className="flex items-baseline justify-between gap-3">
                          <span className="text-[14px] tracking-widest uppercase shrink-0" style={{ color: 'rgba(255,255,255,0.25)' }}>
                            {LABEL[key] ?? key}
                          </span>
                          <span className="text-[14px] text-right" style={{ color: 'rgba(255,255,255,0.6)' }}>{String(val)}</span>
                        </div>
                      ))}
                      {campos.length === 0 && <p className="text-[14px] text-white/20 italic">Sem dados preenchidos.</p>}
                    </div>
                  </div>
                )
              })() : (
                <p className="text-[14px] text-white/20 italic">Sem relatório ainda.</p>
              )}
            </div>
          )}
        </div>

        {/* Footer — confirmar / indisponível */}
        {!isPast && (
          <div className="px-6 pb-5">
            {confirmed ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[14px] font-semibold tracking-widest uppercase cursor-default">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  Confirmado
                </div>
                <button disabled
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-white/20 text-[14px] font-semibold tracking-widest uppercase opacity-40 cursor-not-allowed">
                  Indisponível
                </button>
              </div>
            ) : indisponivel ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-[14px] font-semibold tracking-widest uppercase cursor-default">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                  Indisponível
                </div>
                <button disabled
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-white/20 text-[14px] font-semibold tracking-widest uppercase opacity-40 cursor-not-allowed">
                  Confirmar
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button onClick={handleConfirmar} disabled={confirming}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold/10 border border-gold/30 text-gold text-[14px] font-semibold tracking-widest uppercase hover:bg-gold/20 transition-all disabled:opacity-50">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  {confirming ? 'A confirmar...' : 'Confirmar Data'}
                </button>
                <button onClick={handleIndisponivel} disabled={markingIndisp}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/20 text-red-400/60 text-[14px] font-semibold tracking-widest uppercase hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-400 transition-all disabled:opacity-50">
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
    {showRelatorio && (
      <RelatorioVideoModal c={c} freelancerNome={freelancerNome}
        onClose={() => setShowRelatorio(false)}
        onSubmitted={() => setJaEnviou(new Date().toISOString())}
      />
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
        <p className="text-[14px] font-semibold text-white/80 leading-tight">{e.nome}</p>
        {e.data_casamento && <p className="text-[14px] text-white/30">{fmtDate(e.data_casamento).split(' · ')[0]}</p>}
        {e.local && <p className="text-[14px] text-white/25">📍 {e.local}</p>}
        {e.data_entrega && <p className="text-[14px] text-white/25">Entrega: {fmtDate(e.data_entrega).split(' · ')[0]}</p>}
        {hasCounts && (
          <div className="flex flex-wrap gap-1 pt-1 border-t border-white/[0.04]">
            {FOTO_FIELDS.filter(f => e[f.key] != null).map(({ key, label }) => (
              <span key={key} className="text-[14px] bg-white/[0.04] text-white/35 px-1.5 py-0.5 rounded">
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
              className="appearance-none w-full text-[14px] tracking-[0.2em] uppercase font-semibold px-3 py-2.5 pr-7 rounded-xl border border-white/20 bg-white/[0.05] text-white outline-none cursor-pointer transition-all disabled:opacity-40 hover:border-white/40 hover:bg-white/[0.08] [color-scheme:dark]"
            >
              <option value="EM EDIÇÃO" className="bg-zinc-900 text-white">EM EDIÇÃO</option>
              <option value="CONCLUÍDO" className="bg-zinc-900 text-white">CONCLUÍDO</option>
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[14px] text-white/50">▾</span>
          </div>
        </div>
        <div>
          <button onClick={() => setOpenSelecao(true)}
            className="text-[14px] tracking-[0.15em] uppercase px-3 py-1.5 rounded-lg border border-gold/30 bg-gold/5 text-gold/70 hover:text-gold hover:border-gold/50 hover:bg-gold/10 transition-all">
            Ver Mais
          </button>
        </div>
      </div>
      {openSelecao && <SelecaoModal nome={e.nome} onClose={() => setOpenSelecao(false)} />}
    </>
  )
}

// ── Pagamentos Tab ────────────────────────────────────────────────────────────
const PAGA_STATUS_STYLE: Record<string, string> = {
  'PENDENTE': 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  'PAGO':     'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'PARCIAL':  'bg-blue-500/15 text-blue-400 border-blue-500/30',
}

function PagamentosTab({ pagamentos, casamentos }: { pagamentos: Pagamento[]; casamentos: Casamento[] }) {
  const totalPago     = pagamentos.filter(p => p.status === 'PAGO').reduce((s, p) => s + (p.valor ?? 0), 0)
  const totalPendente = pagamentos.filter(p => p.status !== 'PAGO').reduce((s, p) => s + (p.valor ?? 0), 0)

  function fmtEuro(v: number | null) {
    if (v == null) return '—'
    return `€ ${v.toFixed(2).replace('.', ',')}`
  }

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 space-y-1">
          <p className="text-[14px] tracking-[0.35em] text-emerald-400/60 uppercase">Total Pago</p>
          <p className="text-xl font-light text-emerald-400 truncate">{fmtEuro(totalPago)}</p>
        </div>
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4 space-y-1">
          <p className="text-[14px] tracking-[0.35em] text-yellow-400/60 uppercase">Pendente</p>
          <p className="text-xl font-light text-yellow-400 truncate">{fmtEuro(totalPendente)}</p>
        </div>
      </div>

      {pagamentos.length === 0 ? (
        <p className="text-center py-10 text-white/15 text-[14px] tracking-widest">Sem pagamentos registados.</p>
      ) : (
        <div className="space-y-2">
          {pagamentos.map(p => {
            const casamento = p.casamento_id ? casamentos.find(c => c.id === p.casamento_id) ?? null : null
            return (
              <div key={p.id} className="bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3">
                {casamento && (
                  <p className="text-[14px] tracking-[0.25em] text-gold/50 uppercase mb-1.5">
                    📍 {casamento.local}{casamento.data_casamento ? ` · ${fmtDate(casamento.data_casamento).split(' · ')[0]}` : ''}
                  </p>
                )}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] text-white/80 font-medium leading-tight">{p.descricao}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                      {p.data_prevista && (
                        <span className="text-[14px] text-white/30">Previsto: {fmtDate(p.data_prevista).split(' · ')[0]}</span>
                      )}
                      {p.data_pago && (
                        <span className="text-[14px] text-emerald-400/70">Pago em: {fmtDate(p.data_pago).split(' · ')[0]}</span>
                      )}
                    </div>
                    {p.notas && <p className="text-[14px] text-white/25 mt-1 italic">{p.notas}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-base font-light text-white/80">{fmtEuro(p.valor)}</span>
                    <span className={`text-[14px] px-2.5 py-0.5 rounded-full border tracking-widest uppercase font-medium ${PAGA_STATUS_STYLE[p.status] ?? 'bg-white/5 text-white/30 border-white/10'}`}>
                      {p.status}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

// ── Disponibilidade Tab ───────────────────────────────────────────────────────
function DisponibilidadeTab({ freelancerId, disponibilidade, casamentos, onRefresh }: {
  freelancerId: string; disponibilidade: Disponib[]; casamentos: Casamento[]; onRefresh: () => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState({ data_inicio: '', data_fim: '', motivo: '' })
  const [saving, setSaving]     = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleAdd() {
    if (!form.data_inicio) return
    setSaving(true)
    await fetch('/api/freelancer-disponibilidade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        freelancer_id: freelancerId,
        data_inicio: form.data_inicio,
        data_fim: form.data_fim || null,
        motivo: form.motivo || null,
      }),
    })
    setSaving(false)
    setShowForm(false)
    setForm({ data_inicio: '', data_fim: '', motivo: '' })
    onRefresh()
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    await fetch(`/api/freelancer-disponibilidade?id=${id}`, { method: 'DELETE' })
    setDeleting(null)
    onRefresh()
  }

  const upcoming = casamentos
    .filter(c => c.data_casamento && (daysUntil(c.data_casamento) ?? -1) >= 0)
    .sort((a,b) => (a.data_casamento ?? '') < (b.data_casamento ?? '') ? -1 : 1)

  return (
    <section className="space-y-6">

      {/* Hero da secção */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] px-8 py-7"
        style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.6), rgba(11,11,11,0.85))', boxShadow: '0 20px 50px -20px rgba(0,0,0,0.5)' }}>
        <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(201,164,92,0.12), transparent 70%)' }} />
        <p className="text-[11px] tracking-[0.5em] text-gold/70 uppercase mb-2">Editorial Workspace</p>
        <h2 className="text-3xl sm:text-4xl font-light text-white tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
          A tua <span className="italic text-gold">Agenda</span>
        </h2>
        <div className="mt-3 h-px w-16 bg-gradient-to-r from-gold/70 to-transparent" />
        <p className="text-[14px] text-white/55 mt-4 leading-relaxed max-w-2xl">
          Aqui podes ver de forma simples todos os eventos atribuídos e gerir a tua disponibilidade. Marca os períodos em que estás indisponível — só recebes notificação de um novo evento se estiveres disponível.
        </p>
      </div>

      {upcoming.length > 0 && (
        <div className="bg-gold/[0.03] border border-gold/15 rounded-2xl p-5">
          <p className="text-[14px] tracking-[0.35em] text-gold/40 uppercase mb-3">Eventos Atribuídos</p>
          <div className="space-y-2">
            {upcoming.map(c => (
              <div key={c.id} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-gold/50 flex-shrink-0" />
                <span className="text-[14px] text-white/70 flex-1">{c.local}</span>
                <span className="text-[14px] text-white/30">{c.data_casamento ? fmtDate(c.data_casamento).split(' · ')[0] : '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[14px] font-semibold text-white">Indisponibilidades</p>
          <button onClick={() => setShowForm(v => !v)}
            className="px-3 py-1.5 rounded-xl bg-gold/10 border border-gold/30 text-gold text-[14px] font-semibold tracking-widest uppercase hover:bg-gold/20 transition-all">
            + Marcar
          </button>
        </div>

        {showForm && (
          <div className="mb-4 bg-white/[0.02] border border-white/10 rounded-2xl p-5 space-y-3">
            <p className="text-[14px] tracking-[0.3em] text-white/25 uppercase">Novo Período</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-[14px] text-white/25 tracking-widest uppercase mb-1.5">Data Início *</label>
                <input type="date" value={form.data_inicio}
                  onChange={e => setForm(v => ({ ...v, data_inicio: e.target.value }))}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-[14px] text-white/80 outline-none focus:border-gold/40 [color-scheme:dark]" />
              </div>
              <div>
                <label className="block text-[14px] text-white/25 tracking-widest uppercase mb-1.5">Data Fim</label>
                <input type="date" value={form.data_fim}
                  onChange={e => setForm(v => ({ ...v, data_fim: e.target.value }))}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-[14px] text-white/80 outline-none focus:border-gold/40 [color-scheme:dark]" />
              </div>
            </div>
            <div>
              <label className="block text-[14px] text-white/25 tracking-widest uppercase mb-1.5">Motivo (opcional)</label>
              <input value={form.motivo}
                onChange={e => setForm(v => ({ ...v, motivo: e.target.value }))}
                placeholder="Ex: férias, compromisso..."
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-[14px] text-white/80 outline-none focus:border-gold/40 transition-colors placeholder:text-white/15" />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setShowForm(false); setForm({ data_inicio: '', data_fim: '', motivo: '' }) }}
                className="px-3 py-1.5 rounded-xl text-[14px] border border-white/10 text-white/40 hover:text-white/70 transition-all">Cancelar</button>
              <button onClick={handleAdd} disabled={saving || !form.data_inicio}
                className="px-4 py-1.5 rounded-xl text-[14px] bg-gold text-black font-semibold hover:bg-gold/80 transition-all disabled:opacity-40">
                {saving ? 'A guardar...' : 'Guardar'}
              </button>
            </div>
          </div>
        )}

        {disponibilidade.length === 0 && !showForm ? (
          <p className="text-center py-8 text-white/15 text-[14px] tracking-widest">Sem indisponibilidades marcadas.</p>
        ) : (
          <div className="space-y-2">
            {disponibilidade.map(d => (
              <div key={d.id} className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/[0.03]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] text-white/80">{fmtDate(d.data_inicio).split(' · ')[0]}</span>
                    {d.data_fim && d.data_fim !== d.data_inicio && (
                      <>
                        <span className="text-white/30 text-[14px]">→</span>
                        <span className="text-[14px] text-white/80">{fmtDate(d.data_fim).split(' · ')[0]}</span>
                      </>
                    )}
                  </div>
                  {d.motivo && <p className="text-[14px] text-white/30 mt-0.5 italic">{d.motivo}</p>}
                </div>
                <button onClick={() => handleDelete(d.id)} disabled={deleting === d.id}
                  className="text-white/20 hover:text-red-400 transition-colors text-[14px] px-2 py-0.5 disabled:opacity-30">
                  {deleting === d.id ? '...' : '✕'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

// ── Notificações Tab ──────────────────────────────────────────────────────────
const NOTIF_STYLE: Record<string, { card: string; dot: string }> = {
  'alerta':    { card: 'border-yellow-500/25 bg-yellow-500/[0.04]',   dot: 'bg-yellow-400'  },
  'pagamento': { card: 'border-emerald-500/25 bg-emerald-500/[0.04]', dot: 'bg-emerald-400' },
  'briefing':  { card: 'border-purple-500/25 bg-purple-500/[0.04]',   dot: 'bg-purple-400'  },
}

// Parse __META__{...}__/META__ block from notification message
function parseAtribuicaoMeta(msg: string | null) {
  if (!msg) return { meta: null as any, clean: '' }
  const m = msg.match(/__META__(.*?)__\/META__/s)
  if (!m) return { meta: null, clean: msg }
  try {
    const parsed = JSON.parse(m[1])
    return { meta: parsed, clean: msg.replace(/__META__.*?__\/META__\n?/s, '').trim() }
  } catch {
    return { meta: null, clean: msg.replace(/__META__.*?__\/META__\n?/s, '').trim() }
  }
}

function NotificacoesTab({ notificacoes, onRefresh }: { notificacoes: Notificacao[]; onRefresh: () => void }) {
  const [submitting, setSubmitting] = useState<string | null>(null)

  async function markLida(id: string) {
    await fetch('/api/freelancer-notificacoes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, lida: true }),
    })
    onRefresh()
  }

  // Resposta à atribuição: cria notificação para o admin + marca lida + opcionalmente atualiza
  // o casamento (data_confirmada=true ou indisponivel=true).
  async function responderAtribuicao(n: Notificacao, resposta: 'confirmar' | 'indisponivel') {
    const { meta } = parseAtribuicaoMeta(n.mensagem)
    const referencia = meta?.atribuicao?.referencia ?? null
    const role = meta?.atribuicao?.role ?? ''
    const local = meta?.atribuicao?.local ?? ''
    const data_casamento = meta?.atribuicao?.data_casamento ?? null
    const freelancerNome = meta?.freelancerNome ?? ''
    setSubmitting(n.id)
    try {
      // 1) Atualizar casamento (se houver) — só para fotografo/videografo (roles do dia)
      const roleLower = (role || '').toLowerCase()
      const isDayRole = roleLower.includes('fot') || roleLower.includes('vid')
      if (isDayRole && referencia) {
        const patch = resposta === 'confirmar'
          ? { data_confirmada: true, indisponivel: false }
          : { indisponivel: true, data_confirmada: false }
        // Atualiza o casamento por referencia + freelancer_id (no META)
        try {
          // Procura o casamento deste freelancer com esta referência
          const r = await fetch(`/api/freelancer-casamentos?freelancer_id=${encodeURIComponent(n.freelancer_id)}`).then(r => r.json())
          const c = (r.casamentos ?? []).find((c: any) => c.referencia === referencia)
          if (c?.id) {
            await fetch('/api/freelancer-casamentos', {
              method: 'PATCH', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: c.id, ...patch }),
            })
          }
        } catch { /* não bloqueia */ }
      }

      // 2) Notificar o admin via email (o endpoint suporta tipo='confirmou' ou
      //    qualquer outro — o template muda automaticamente entre 'confirmou
      //    a data' e 'está indisponível')
      try {
        await fetch('/api/send-admin-notification', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tipo: resposta === 'confirmar' ? 'confirmou' : 'indisponivel',
            freelancer_nome: freelancerNome,
            referencia,
            data_evento: data_casamento,
            local,
          }),
        })
      } catch { /* não bloqueia */ }

      // 3) Cria notificação para o admin ver no /freelancers/[id]?tab=notificacoes
      try {
        const nome = freelancerNome || 'O membro'
        const tituloResp = resposta === 'confirmar'
          ? `✓ ${nome} confirmou · ${role}`
          : `✕ ${nome} marcou-se indisponível · ${role}`
        const corpoResp = resposta === 'confirmar'
          ? `Confirmou a disponibilidade para o evento${local ? ` em ${local}` : ''}.`
          : `Está indisponível para o evento${local ? ` em ${local}` : ''}.`
        await fetch('/api/freelancer-notificacoes', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            freelancer_id: n.freelancer_id,
            titulo: tituloResp,
            mensagem: corpoResp,
            tipo: resposta === 'confirmar' ? 'atribuicao_confirmada' : 'atribuicao_indisponivel',
            lida: false,
          }),
        })
      } catch { /* não bloqueia */ }

      // 4) Marca a notificação original como lida
      await fetch('/api/freelancer-notificacoes', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: n.id, lida: true }),
      })

      onRefresh()
    } finally { setSubmitting(null) }
  }

  function fmtRelative(dateStr: string) {
    try {
      const d = new Date(dateStr)
      const diff = Math.floor((Date.now() - d.getTime()) / 86400000)
      if (diff === 0) return 'hoje'
      if (diff === 1) return 'ontem'
      if (diff < 7) return `há ${diff} dias`
      return `${String(d.getDate()).padStart(2,'0')} ${MESES[d.getMonth()]}`
    } catch { return '' }
  }

  return (
    <section className="space-y-3">
      {notificacoes.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-white/20 text-5xl">🔔</p>
          <p className="text-white/15 text-[14px] tracking-widest">Sem notificações.</p>
        </div>
      ) : (
        notificacoes.map(n => {
          const isAtribuicao = n.tipo === 'atribuicao_equipa'
          const { clean } = parseAtribuicaoMeta(n.mensagem)
          const display = clean || n.mensagem
          const isSubmitting = submitting === n.id
          return (
            <div key={n.id} className={`rounded-2xl border p-4 transition-all ${
              n.lida
                ? 'border-emerald-500/35 bg-emerald-500/[0.06]'
                : isAtribuicao
                  ? 'border-gold/45 bg-gold/[0.06]'
                  : 'border-red-500/45 bg-red-500/[0.07]'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`w-2.5 h-2.5 rounded-full mt-2 flex-shrink-0 ${
                  n.lida ? 'bg-emerald-400' : isAtribuicao ? 'bg-gold' : 'bg-red-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-base font-semibold text-white leading-tight">{n.titulo}</p>
                    <span className="text-[14px] text-white/30 whitespace-nowrap flex-shrink-0 mt-0.5">{fmtRelative(n.created_at)}</span>
                  </div>
                  {display && (
                    <p className="text-base text-white leading-relaxed mt-1">{display}</p>
                  )}
                  {/* ── Atribuição equipa: Confirmar / Indisponível ── */}
                  {isAtribuicao && !n.lida && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => responderAtribuicao(n, 'confirmar')}
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold text-black text-[13px] font-bold tracking-[0.15em] uppercase hover:bg-gold/90 disabled:opacity-50 transition-all"
                        style={!isSubmitting ? { boxShadow: '0 0 14px -4px rgba(201,164,92,0.55)' } : undefined}>
                        ✓ Confirmar
                      </button>
                      <button
                        onClick={() => responderAtribuicao(n, 'indisponivel')}
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-rose-500/45 bg-rose-500/10 text-rose-200 text-[13px] font-bold tracking-[0.15em] uppercase hover:bg-rose-500/20 hover:border-rose-400/65 disabled:opacity-50 transition-all">
                        ✕ Indisponível
                      </button>
                      {isSubmitting && <span className="text-[12px] text-white/45 italic self-center">A enviar resposta…</span>}
                    </div>
                  )}
                  {/* ── Botão genérico 'Lida' para notificações não-atribuição ── */}
                  {!isAtribuicao && !n.lida && (
                    <button
                      onClick={() => markLida(n.id)}
                      className="mt-3 text-[14px] tracking-[0.2em] uppercase px-3 py-1.5 rounded-full border border-emerald-500/35 text-emerald-400/80 hover:bg-emerald-500/10 hover:text-emerald-300 hover:border-emerald-400/50 transition-all font-semibold"
                    >
                      ✓ Lida
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })
      )}
    </section>
  )
}

// ── Mensagens Tab ─────────────────────────────────────────────────────────────
function MensagensTab({ freelancerId, casamentos, mensagens, onRefresh }: {
  freelancerId: string; casamentos: Casamento[]; mensagens: Mensagem[]; onRefresh: () => void
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [texto, setTexto]           = useState('')
  const [sending, setSending]       = useState(false)
  const bottomRef                   = useRef<HTMLDivElement>(null)
  const doneReadRef                 = useRef<string | null>(null)

  useEffect(() => {
    if (!selectedId || doneReadRef.current === selectedId) return
    doneReadRef.current = selectedId
    const unread = mensagens.filter(m => m.casamento_id === selectedId && m.remetente === 'admin' && !m.lida_freelancer)
    if (!unread.length) return
    Promise.all(unread.map(m => fetch('/api/freelancer-mensagens', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: m.id, lida_freelancer: true }),
    }))).then(() => onRefresh())
  }, [selectedId, mensagens, onRefresh])

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [mensagens, selectedId])

  async function handleSend() {
    if (!texto.trim() || !selectedId) return
    setSending(true)
    await fetch('/api/freelancer-mensagens', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ freelancer_id: freelancerId, casamento_id: selectedId, mensagem: texto.trim(), remetente: 'freelancer' }),
    })
    setTexto('')
    setSending(false)
    onRefresh()
  }

  function fmtHora(s: string) {
    try {
      const d = new Date(s)
      const hoje = new Date()
      const ontem = new Date(hoje); ontem.setDate(hoje.getDate() - 1)
      const hh = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
      if (d.toDateString() === hoje.toDateString()) return hh
      if (d.toDateString() === ontem.toDateString()) return `ontem ${hh}`
      return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')} ${hh}`
    } catch { return '' }
  }

  const selected = casamentos.find(c => c.id === selectedId)
  const thread   = mensagens.filter(m => m.casamento_id === selectedId)

  return (
    <section className="space-y-4">
      {!selectedId ? (
        <>
          {/* Hero da secção */}
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] px-8 py-7 mb-2"
            style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.6), rgba(11,11,11,0.85))', boxShadow: '0 20px 50px -20px rgba(0,0,0,0.5)' }}>
            <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(201,164,92,0.12), transparent 70%)' }} />
            <p className="text-[11px] tracking-[0.5em] text-gold/70 uppercase mb-2">Editorial Workspace</p>
            <h2 className="text-3xl sm:text-4xl font-light text-white tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
              Mensagens por <span className="italic text-gold">Evento</span>
            </h2>
            <div className="mt-3 h-px w-16 bg-gradient-to-r from-gold/70 to-transparent" />
            <p className="text-[14px] text-white/55 mt-4 leading-relaxed max-w-2xl">
              Conversa direta com a equipa RL sobre cada evento atribuído. Imprevistos, notas importantes, questões de entrega — todas as mensagens ficam associadas ao evento certo e nada se perde.
            </p>
          </div>
          <p className="text-[11px] tracking-[0.4em] text-gold/70 uppercase font-bold mt-4">Seleciona um Evento</p>
          {casamentos.length === 0 ? (
            <p className="text-center py-10 text-white/15 text-[14px] tracking-widest">Sem eventos disponíveis.</p>
          ) : (
            <div className="space-y-2">
              {casamentos.map(c => {
                const msgs    = mensagens.filter(m => m.casamento_id === c.id)
                const unread  = msgs.filter(m => m.remetente === 'admin' && !m.lida_freelancer).length
                const last    = msgs[msgs.length - 1]
                return (
                  <button key={c.id} onClick={() => setSelectedId(c.id)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-white/[0.07] bg-white/[0.02] hover:border-gold/30 hover:bg-gold/[0.03] text-left transition-all group">
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium text-white/85 truncate">{c.local || '—'}</p>
                      {last ? (
                        <p className="text-[14px] text-white/30 mt-0.5 truncate">
                          {last.remetente === 'admin' ? '← ' : '→ '}{last.mensagem}
                        </p>
                      ) : (
                        <p className="text-[14px] text-white/15 mt-0.5 italic">Iniciar conversa</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {unread > 0 && (
                        <span className="text-[14px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/35 font-bold">{unread}</span>
                      )}
                      {msgs.length > 0 && (
                        <span className="text-[14px] text-white/20">💬 {msgs.length}</span>
                      )}
                      <span className="text-white/15 group-hover:text-white/40 transition-colors text-base">›</span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-3">
          {/* Back */}
          <button onClick={() => { setSelectedId(null); doneReadRef.current = null }}
            className="flex items-center gap-1.5 text-[14px] text-white/30 hover:text-white/60 transition-colors">
            ← Voltar aos eventos
          </button>

          {/* Chat box */}
          <div className="rounded-2xl border border-white/[0.08] bg-black/20 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
              <p className="text-[14px] font-semibold text-white/80 truncate">{selected?.local || '—'}</p>
              {selected?.data_casamento && <p className="text-[14px] text-white/30 mt-0.5">{selected.data_casamento}</p>}
            </div>

            {/* Messages */}
            <div className="px-4 py-4 space-y-3 min-h-[220px] max-h-[380px] overflow-y-auto">
              {thread.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <p className="text-3xl opacity-20">💬</p>
                  <p className="text-[14px] text-white/20 tracking-widest">Sem mensagens. Inicia a conversa!</p>
                </div>
              ) : (
                thread.map(m => (
                  <div key={m.id} className={`flex ${m.remetente === 'freelancer' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-4 py-2.5 space-y-1 ${
                      m.remetente === 'freelancer'
                        ? 'bg-gold/15 border border-gold/25 rounded-2xl rounded-br-sm'
                        : 'bg-white/[0.06] border border-white/[0.09] rounded-2xl rounded-bl-sm'
                    }`}>
                      <p className="text-[14px] text-white leading-relaxed">{m.mensagem}</p>
                      <p className="text-[14px] text-white/25 text-right">{fmtHora(m.created_at)}</p>
                    </div>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-3 py-3 border-t border-white/[0.06] flex gap-2">
              <input
                value={texto}
                onChange={e => setTexto(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                placeholder="Escreve uma mensagem..."
                className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-[14px] text-white/85 outline-none focus:border-gold/40 transition-colors placeholder:text-white/15"
              />
              <button onClick={handleSend} disabled={sending || !texto.trim()}
                className="px-4 py-2.5 rounded-xl bg-gold/10 border border-gold/30 text-gold text-base font-bold hover:bg-gold/20 disabled:opacity-30 transition-all shrink-0">
                ↑
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
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
  const [tab, setTab]               = useState<'casamentos'|'edicao'|'album'|'pagamentos'|'disponibilidade'|'guia'|'notificacoes'|'mensagens'|null>(null)
  const [ficha, setFicha]           = useState<Casamento | null>(null)
  const [albumInfo, setAlbumInfo]   = useState<Album | null>(null)
  const [pagamentos, setPagamentos]           = useState<Pagamento[]>([])
  const [disponibilidade, setDisponibilidade] = useState<Disponib[]>([])
  const [notificacoes, setNotificacoes]       = useState<Notificacao[]>([])
  const [mensagens, setMensagens]             = useState<Mensagem[]>([])

  // Block browser back button
  useEffect(() => {
    history.pushState(null, '', window.location.href)
    const block = () => { history.pushState(null, '', window.location.href) }
    window.addEventListener('popstate', block)
    return () => window.removeEventListener('popstate', block)
  }, [])

  // Check session
  //   1) Se existir cookie fl_session válido para este id (set pelo /login),
  //      o middleware já permitiu — autentica automaticamente.
  //   2) Se for admin (rl_auth), também passa diretamente.
  //   3) Fallback: gate antigo via sessionStorage.
  useEffect(() => {
    let canceled = false
    ;(async () => {
      const ssOk = sessionStorage.getItem(`freelancerAuth_${id}`) === 'true'
      if (ssOk) {
        if (!canceled) { setAuthed(true); setChecking(false) }
        return
      }
      try {
        const r = await fetch('/api/freelancer-auth', { cache: 'no-store' })
        const j = await r.json().catch(() => ({}))
        if (!canceled && j?.ok && j?.session?.id === id) {
          sessionStorage.setItem(`freelancerAuth_${id}`, 'true')
          setAuthed(true)
          setChecking(false)
          return
        }
      } catch { /* ignore */ }
      if (!canceled) { setAuthed(false); setChecking(false) }
    })()
    return () => { canceled = true }
  }, [id])

  const loadData = useCallback(async () => {
    setLoading(true)
    const TEMPLATE_ID = '8694241a-7530-4dfd-8619-a8bf15b9e15e'
    const [fRes, cRes, eRes, aRes, alRes, pRes, dRes, nRes, mRes] = await Promise.all([
      fetch(`/api/freelancers`).then(r => r.json()),
      fetch(`/api/freelancer-casamentos?freelancer_id=${id}`).then(r => r.json()),
      fetch(`/api/freelancer-edicao?freelancer_id=${id}`).then(r => r.json()),
      fetch(`/api/freelancer-album?freelancer_id=${id}`).then(r => r.json()),
      fetch(`/api/albuns-casamento`).then(r => r.json()).catch(() => ({ rows: [] })),
      fetch(`/api/freelancer-pagamentos?freelancer_id=${id}`).then(r => r.json()).catch(() => ({ pagamentos: [] })),
      fetch(`/api/freelancer-disponibilidade?freelancer_id=${id}`).then(r => r.json()).catch(() => ({ periodos: [] })),
      fetch(`/api/freelancer-notificacoes?freelancer_id=${id}`).then(r => r.json()).catch(() => ({ notificacoes: [] })),
      fetch(`/api/freelancer-mensagens?freelancer_id=${id}`).then(r => r.json()).catch(() => ({ mensagens: [] })),
    ])
    const allFreelancers: Freelancer[] = fRes.freelancers ?? []
    const f = allFreelancers.find((x: Freelancer) => x.id === id) ?? null
    const template: Freelancer | null = allFreelancers.find((x: Freelancer) => x.id === TEMPLATE_ID) ?? null
    // Herdar textos do template global se o freelancer não tiver os seus próprios
    const merged: Freelancer | null = f ? {
      ...f,
      intro_home:       f.id === TEMPLATE_ID ? f.intro_home       : (f.intro_home       || template?.intro_home       || null),
      intro_home_title: f.id === TEMPLATE_ID ? f.intro_home_title : (f.intro_home_title || template?.intro_home_title || null),
      intro_casamentos: f.id === TEMPLATE_ID ? f.intro_casamentos : (f.intro_casamentos || template?.intro_casamentos || null),
      guia_trabalho:    f.id === TEMPLATE_ID ? f.guia_trabalho    : (f.guia_trabalho    || template?.guia_trabalho    || null),
    } : null
    setFreelancer(merged)
    setCasamentos(cRes.casamentos ?? [])
    setEdicao(eRes.edicao ?? [])
    setPagamentos(pRes.pagamentos ?? [])
    setDisponibilidade(dRes.periodos ?? [])
    setNotificacoes(nRes.notificacoes ?? [])
    setMensagens(mRes.mensagens ?? [])
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
    <div className="min-h-screen text-white relative" style={{ background: '#0B0B0B' }}>
      {/* Animação gold pulse para items novos não-abertos + alert red pulse para alertas críticos */}
      <style jsx global>{`
        @keyframes unseenGlow {
          0%, 100% { box-shadow: 0 0 0 rgba(201,164,92,0), 0 0 16px -4px rgba(201,164,92,0.25); }
          50%      { box-shadow: 0 0 0 rgba(201,164,92,0), 0 0 32px 0 rgba(201,164,92,0.55); }
        }
        .unseen-glow { animation: unseenGlow 2.4s ease-in-out infinite; }
        @keyframes alertPulse {
          0%, 100% { box-shadow: 0 0 0 rgba(239,68,68,0), 0 0 24px -4px rgba(239,68,68,0.35), inset 0 0 0 1px rgba(239,68,68,0.15); }
          50%      { box-shadow: 0 0 0 rgba(239,68,68,0), 0 0 48px 0 rgba(239,68,68,0.7), inset 0 0 0 1px rgba(239,68,68,0.45); }
        }
        .alert-glow { animation: alertPulse 1.8s ease-in-out infinite; }
      `}</style>
      {/* ── Background atmosférico (radial gold + grid sutil) ─────────────── */}
      <div className="pointer-events-none fixed inset-0 z-0"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 80% 20%, rgba(201,164,92,0.06), transparent 65%)' }} />
      <div className="pointer-events-none fixed inset-0 z-0"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 20% 80%, rgba(201,164,92,0.04), transparent 70%)' }} />

      {/* ── Sidebar lateral (desktop) ──────────────────────────────────── */}
      <SidebarNav
        freelancer={freelancer}
        tab={tab}
        setTab={setTab}
        counts={{
          casamentos: casamentos.length,
          edicao: edicao.length,
          album: album.length,
          mensagens: mensagens.filter(m => m.remetente === 'admin' && !m.lida_freelancer).length,
          notificacoes: notificacoes.filter(n => !n.lida).length,
        }}
        isFotografo={isFotografo}
        onLogout={async () => {
          if (!confirm('Tens a certeza que queres sair?')) return
          sessionStorage.removeItem(`freelancerAuth_${id}`)
          try { await fetch('/api/freelancer-auth', { method: 'DELETE' }) } catch { /* ignore */ }
          setAuthed(false)
          setTab(null)
          window.location.href = '/login'
        }}
      />

    <main className={`relative z-10 min-h-screen px-6 sm:px-8 py-6 mx-auto lg:pl-[254px] lg:pr-8 ${tab === null ? 'max-w-[1500px]' : 'max-w-3xl'}`}>
      {/* Tab Navigation — horizontal (apenas mobile; desktop usa sidebar) */}
      {!loading && (
        <div className="mb-6 relative lg:hidden">
          {/* Left arrow */}
          <button
            onClick={() => { const el = document.getElementById('tab-scroll'); if (el) el.scrollBy({ left: -160, behavior: 'smooth' }) }}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-black border border-gold/30 text-white/60 hover:text-gold hover:border-gold/60 transition-all -translate-x-1"
            style={{ boxShadow: '0 0 12px 2px rgba(0,0,0,0.8)' }}
          >‹</button>
          {/* Right arrow */}
          <button
            onClick={() => { const el = document.getElementById('tab-scroll'); if (el) el.scrollBy({ left: 160, behavior: 'smooth' }) }}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-black border border-gold/30 text-white/60 hover:text-gold hover:border-gold/60 transition-all translate-x-1"
            style={{ boxShadow: '0 0 12px 2px rgba(0,0,0,0.8)' }}
          >›</button>
          <div id="tab-scroll" className="-mx-4 px-4 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <div className="flex items-center gap-1 p-1.5 rounded-2xl border border-white/[0.08] backdrop-blur-md w-max min-w-full"
            style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.4), rgba(11,11,11,0.5))' }}>
            <button
              onClick={() => setTab(null)}
              className={`flex-shrink-0 flex items-center justify-center px-4 py-2 rounded-xl text-lg transition-all ${
                tab === null
                  ? 'bg-gold/15 text-gold border border-gold/35'
                  : 'text-white/45 hover:text-white/80 border border-transparent'
              }`}
            >
              ⌂
            </button>
            {[
              { key: 'casamentos', label: 'Casamentos', count: casamentos.length },
              { key: 'edicao', label: freelancer?.status === 'VIDEOGRAFO' ? 'Edição Video' : 'Edição Fotos', count: edicao.length },
              ...(album.length > 0 ? [{ key: 'album', label: 'Álbum', count: album.length }] : []),
              { key: 'pagamentos',      label: 'Pagamentos', count: 0 },
              { key: 'disponibilidade', label: 'Agenda',     count: 0 },
              { key: 'guia',            label: 'Workflow',   count: 0 },
              { key: 'mensagens',        label: '💬',         count: mensagens.filter(m => m.remetente === 'admin' && !m.lida_freelancer).length },
              { key: 'notificacoes',    label: '🔔',         count: notificacoes.filter(n => !n.lida).length },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key as typeof tab)}
                className={`flex-shrink-0 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl transition-all ${
                  t.key === 'notificacoes' || t.key === 'mensagens'
                    ? 'text-xl'
                    : 'text-[11px] tracking-[0.25em] uppercase font-semibold'
                } ${
                  tab === t.key
                    ? 'bg-gold/15 text-gold border border-gold/35'
                    : 'text-white/45 hover:text-white/80 border border-transparent'
                }`}
              >
                <span className={t.key === 'notificacoes' && t.count > 0 ? 'animate-bell-shake inline-block' : ''}>
                  {t.label}
                </span>
                {t.count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold transition-all ${
                    t.key === 'notificacoes' || t.key === 'mensagens'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                      : tab === t.key ? 'bg-gold/20 text-gold' : 'bg-white/[0.06] text-white/40'
                  }`}>{t.count}</span>
                )}
              </button>
            ))}
          </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-3 text-white/40">
            <div className="w-4 h-4 border border-gold/30 border-t-gold/80 rounded-full animate-spin" />
            <span className="text-[11px] tracking-[0.35em] uppercase">A carregar…</span>
          </div>
        </div>
      )}

      {!loading && tab === null && (() => {
        // Estatísticas para o dashboard
        const proximoCasamento = upcoming[0] ?? null
        const dtuProximo = proximoCasamento ? daysUntil(proximoCasamento.data_casamento) : null

        const edicoesEmCurso = edicao.filter(e => e.status === 'EM EDIÇÃO').length
        const edicoesPendentes = edicao.filter(e => e.status === 'NOVO TRABALHO').length
        const albumsEmCurso  = album.filter(a => ['EM EDIÇÃO','EM APROVAÇÃO'].includes(a.status)).length

        const pagPendentes = pagamentos.filter(p => p.status !== 'PAGO').length
        const valorPendente = pagamentos
          .filter(p => p.status !== 'PAGO')
          .reduce((s, p) => s + (Number(p.valor) || 0), 0)

        const mensagensNaoLidas = mensagens.filter(m => m.remetente === 'admin' && !m.lida_freelancer).length
        const notificacoesNaoLidas = notificacoes.filter(n => !n.lida).length

        // Saudação por hora
        const hora = new Date().getHours()
        const saudacao = hora < 6 ? 'Boa madrugada' : hora < 12 ? 'Bom dia' : hora < 19 ? 'Boa tarde' : 'Boa noite'
        const primeiroNome = (freelancer?.nome ?? '').split(' ')[0] || ''

        // Atividade recente (combina mensagens + notificações ordenadas por data)
        const atividades: Array<{ tipo: string; texto: string; data: string }> = []
        mensagens.slice(0, 10).forEach(m => {
          if (m.remetente === 'admin') {
            atividades.push({ tipo: 'msg', texto: `Mensagem: ${(m.mensagem ?? '').slice(0, 60)}${(m.mensagem ?? '').length > 60 ? '…' : ''}`, data: m.created_at })
          }
        })
        notificacoes.slice(0, 10).forEach(n => {
          atividades.push({ tipo: 'notif', texto: n.titulo, data: n.created_at })
        })
        pagamentos.filter(p => p.data_pago).slice(0, 5).forEach(p => {
          atividades.push({ tipo: 'pag', texto: `Pagamento recebido: ${p.descricao}`, data: p.data_pago! })
        })
        atividades.sort((a, b) => (b.data || '') > (a.data || '') ? 1 : -1)
        const atividadesRecentes = atividades.slice(0, 6)

        const tempoRelativo = (d: string) => {
          const diff = Date.now() - new Date(d).getTime()
          const h = Math.floor(diff / 36e5)
          if (h < 1) return 'agora'
          if (h < 24) return `há ${h}h`
          const dias = Math.floor(h / 24)
          if (dias < 7) return `há ${dias}d`
          return new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })
        }

        const totalCasamentos = casamentos.length
        const totalEmEdicao = edicao.filter(e => e.status === 'EM EDIÇÃO').length
        const totalConcluidos = edicao.filter(e => e.status === 'CONCLUÍDO').length
        const totalAguardando = edicao.filter(e => e.status === 'NOVO TRABALHO').length

        return (
          <>
          {/* ── HERO editorial ─────────────────────────────────────── */}
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] mb-6"
            style={{ boxShadow: '0 30px 60px -20px rgba(0,0,0,0.5)' }}>
            <div className="absolute inset-0 z-0">
              <img
                src="https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=1600&h=400&fit=crop"
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute inset-0 z-[1]"
              style={{ background: 'linear-gradient(90deg, rgba(11,11,11,0.96) 0%, rgba(11,11,11,0.85) 35%, rgba(11,11,11,0.45) 65%, rgba(11,11,11,0.1) 100%)' }} />
            <div className="relative z-10 flex items-start justify-between gap-6 px-8 sm:px-12 py-12 sm:py-16">
              <div className="max-w-xl flex items-center gap-5">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gold/50 shrink-0"
                  style={{ boxShadow: '0 0 28px -4px rgba(201,164,92,0.4)' }}>
                  {freelancer?.foto_url ? (
                    <img src={freelancer.foto_url} alt={freelancer.nome} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gold/30 to-gold/10 flex items-center justify-center text-gold text-2xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>
                      {primeiroNome.charAt(0) || '?'}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-[11px] tracking-[0.5em] text-gold/70 uppercase mb-2">{saudacao}</p>
                  <h1 className="text-4xl sm:text-5xl font-light text-white tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
                    Bem-vindo, <span className="italic text-gold">{primeiroNome || '—'}</span>
                  </h1>
                  <p className="text-[15px] text-white/65 mt-3 leading-relaxed font-light max-w-md">
                    Continua a criar histórias inesquecíveis — acompanha<br className="hidden sm:inline" /> todos os teus eventos, edições e pagamentos.
                  </p>
                  <div className="mt-5 h-px w-20 bg-gradient-to-r from-gold/70 via-gold/30 to-transparent" />
                  <p className="text-[11px] tracking-[0.45em] text-gold/70 uppercase mt-4">Editorial Workspace · Área do Freelancer</p>
                </div>
              </div>

              {/* Top-right: notif + profile + logout */}
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => setTab('notificacoes')}
                  className="relative w-10 h-10 rounded-xl border border-white/15 bg-black/40 backdrop-blur-md hover:border-gold/40 transition-all flex items-center justify-center text-white/65 hover:text-gold"
                  title="Notificações"
                >
                  <span className="text-base">◉</span>
                  {notificacoesNaoLidas > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border border-black">
                      {notificacoesNaoLidas}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setTab('mensagens')}
                  className="relative w-10 h-10 rounded-xl border border-white/15 bg-black/40 backdrop-blur-md hover:border-gold/40 transition-all flex items-center justify-center text-white/65 hover:text-gold"
                  title="Mensagens"
                >
                  <span className="text-base">✉</span>
                  {mensagensNaoLidas > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border border-black">
                      {mensagensNaoLidas}
                    </span>
                  )}
                </button>
                <div className="hidden sm:flex items-center gap-3 px-3 py-2 rounded-2xl border border-white/15 bg-black/40 backdrop-blur-md">
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-gold/40 shrink-0">
                    {freelancer?.foto_url ? (
                      <img src={freelancer.foto_url} alt={freelancer.nome} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gold/30 to-gold/10 flex items-center justify-center text-gold text-sm font-bold">{primeiroNome.charAt(0) || '?'}</div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-white truncate max-w-[140px]">{primeiroNome}</p>
                    <p className="text-[10px] text-white/40 tracking-wide truncate max-w-[140px]">{freelancer?.status ?? 'Freelancer'}</p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    if (!confirm('Tens a certeza que queres sair?')) return
                    sessionStorage.removeItem(`freelancerAuth_${id}`)
                    try { await fetch('/api/freelancer-auth', { method: 'DELETE' }) } catch { /* ignore */ }
                    setAuthed(false)
                    setTab(null)
                    window.location.href = '/login'
                  }}
                  className="w-10 h-10 rounded-xl border border-white/15 bg-black/40 backdrop-blur-md hover:border-red-500/40 hover:bg-red-500/[0.06] transition-all flex items-center justify-center text-white/65 hover:text-red-400"
                  title="Sair"
                >
                  <span className="text-base">⎋</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── KPI CARDS (clicáveis e dinâmicos) ───────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {([
              { label: 'Casamentos', value: totalCasamentos.toString(), sub: `${upcoming.length} próximos`,           icon: '◫', tab: 'casamentos' as const },
              { label: 'Em Edição',  value: totalEmEdicao.toString(),   sub: `${totalAguardando} aguardando`,         icon: '✎', tab: 'edicao' as const },
              { label: 'Concluídos', value: totalConcluidos.toString(), sub: 'Edições finalizadas',                   icon: '✓', tab: 'edicao' as const },
              { label: 'Pagamentos', value: pagPendentes.toString(),    sub: pagPendentes === 0 ? 'Tudo em dia' : `${valorPendente.toLocaleString('pt-PT')} € pendente`, icon: '€', tab: 'pagamentos' as const },
            ]).map((k, i) => (
              <button key={i} onClick={() => setTab(k.tab)}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.08] p-5 hover:border-gold/30 transition-all cursor-pointer text-left"
                style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.6), rgba(11,11,11,0.85))', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}
              >
                <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'radial-gradient(circle, rgba(201,164,92,0.18), transparent 70%)' }} />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl border border-gold/30 flex items-center justify-center text-2xl text-gold"
                      style={{ background: 'radial-gradient(circle at 30% 30%, rgba(201,164,92,0.15), rgba(201,164,92,0.04))', boxShadow: '0 0 22px -4px rgba(201,164,92,0.25)' }}>
                      {k.icon}
                    </div>
                    <div>
                      <p className="text-[11px] tracking-[0.3em] uppercase text-white/45 font-medium mb-1">{k.label}</p>
                      <p className="text-3xl font-bold text-white leading-none">{k.value}</p>
                      <p className="text-[11px] text-white/35 mt-1.5">{k.sub}</p>
                    </div>
                  </div>
                  <span className="w-9 h-9 rounded-full border border-gold/30 flex items-center justify-center text-gold/60 group-hover:text-gold group-hover:bg-gold/10 transition-all">›</span>
                </div>
              </button>
            ))}
          </div>

          {/* CTAs principais */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <button onClick={() => setTab('casamentos')}
              className="inline-flex items-center gap-2 px-5 h-10 rounded-xl bg-gold text-black text-[13px] font-semibold tracking-wider hover:bg-gold/90 transition-all"
              style={{ boxShadow: '0 0 24px -4px rgba(201,164,92,0.5)' }}>
              <span className="text-lg leading-none">+</span> Ver Casamentos
            </button>
            <button onClick={() => setTab('disponibilidade')}
              className="inline-flex items-center gap-2 px-5 h-10 rounded-xl border border-white/15 bg-black/40 backdrop-blur-md text-white/85 text-[13px] font-medium tracking-wider hover:bg-white/[0.05] hover:border-gold/40 transition-all">
              <span className="text-base leading-none">◷</span> Confirmar Disponibilidade
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* ── COLUNA PRINCIPAL (2/3) ────────────────────────────── */}
            <div className="lg:col-span-2 flex flex-col gap-5">

              {/* Próximo Casamento — destaque */}
              {proximoCasamento && (
                <div onClick={() => setTab('casamentos')}
                  className="group cursor-pointer relative overflow-hidden bg-gradient-to-br from-gold/[0.08] to-gold/[0.02] border border-gold/30 rounded-2xl p-6 sm:p-7 hover:border-gold/50 transition-all"
                  style={{ boxShadow: '0 20px 50px -20px rgba(0,0,0,0.5), 0 0 24px -8px rgba(201,164,92,0.25)' }}>
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-gold/0 via-gold/[0.06] to-gold/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                  <p className="text-[11px] tracking-[0.4em] text-gold/70 uppercase font-bold mb-3">Próximo Casamento</p>
                  <div className="relative flex items-end justify-between gap-4 flex-wrap">
                    <div>
                      <h2 className="text-2xl font-light text-white tracking-tight mb-1" style={{ fontFamily: 'Georgia, serif' }}>{proximoCasamento.local}</h2>
                      <p className="text-[13px] text-white/55">{fmtDate(proximoCasamento.data_casamento)}</p>
                    </div>
                    <div className={`text-right ${dtuProximo !== null && dtuProximo <= 15 ? 'text-red-400' : 'text-gold'}`}>
                      <p className="text-4xl font-bold leading-none">{dtuProximo === 0 ? 'HOJE' : dtuProximo}</p>
                      <p className="text-[11px] tracking-[0.35em] uppercase mt-1">{dtuProximo === 0 ? '' : dtuProximo === 1 ? 'dia' : 'dias'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions — 4 cards */}
              <div>
                <h3 className="text-[11px] tracking-[0.4em] text-gold/70 uppercase font-bold mb-3">Atalhos</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { key: 'casamentos', icon: '💍', label: 'Casamentos', count: upcoming.length, sub: upcoming.length === 0 ? 'Sem próximos' : `${upcoming.length} próximos` },
                    { key: 'edicao',     icon: isFotografo ? '📷' : '🎬', label: isFotografo ? 'Edição Fotos' : 'Edição Vídeo', count: edicoesEmCurso, sub: `${edicoesPendentes} novos · ${edicoesEmCurso} em curso` },
                    ...(album.length > 0 ? [{ key: 'album', icon: '📚', label: 'Álbuns', count: albumsEmCurso, sub: `${album.length} total · ${albumsEmCurso} em curso` }] : []),
                    { key: 'pagamentos', icon: '💰', label: 'Pagamentos', count: pagPendentes, sub: pagPendentes === 0 ? 'Tudo em dia' : `${valorPendente.toLocaleString('pt-PT')} € pendente` },
                  ].slice(0, 4).map(c => (
                    <button key={c.key} onClick={() => setTab(c.key as any)}
                      className="bg-white/[0.02] border border-white/[0.08] hover:border-gold/30 hover:bg-white/[0.04] rounded-2xl p-4 text-left transition-all group">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-2xl">{c.icon}</span>
                        {c.count > 0 && (
                          <span className="text-[14px] tracking-widest uppercase font-bold px-2 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/30">{c.count}</span>
                        )}
                      </div>
                      <p className="text-[14px] tracking-widest uppercase font-bold text-white/85 mb-1">{c.label}</p>
                      <p className="text-[14px] text-white/35 leading-tight">{c.sub}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Próximos Casamentos (lista) */}
              {upcoming.length > 1 && (
                <div className="rounded-2xl border border-white/[0.08] p-5 sm:p-6 backdrop-blur-md"
                  style={{ background: 'linear-gradient(180deg, rgba(20,15,8,0.4), rgba(11,11,11,0.7))', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[15px] font-semibold text-white">Próximos Casamentos</h3>
                    <button onClick={() => setTab('casamentos')} className="text-[11px] tracking-widest uppercase text-gold/70 hover:text-gold transition-colors">Ver todos →</button>
                  </div>
                  <div className="space-y-2">
                    {upcoming.slice(0, 4).map(c => {
                      const dtu = daysUntil(c.data_casamento)
                      return (
                        <div key={c.id} onClick={() => setTab('casamentos')}
                          className="cursor-pointer flex items-center gap-4 px-4 py-3 rounded-xl border border-white/[0.05] hover:border-gold/25 hover:bg-white/[0.03] transition-all">
                          <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center border ${dtu !== null && dtu <= 15 ? 'border-red-500/30 bg-red-500/5 text-red-400' : 'border-gold/20 bg-gold/[0.04] text-gold'}`}>
                            <span className="text-base font-black leading-none">{dtu === 0 ? '!' : dtu}</span>
                            <span className="text-[14px] uppercase tracking-wide opacity-60">{dtu === 0 ? 'HOJE' : 'd'}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-semibold text-white truncate">{c.local}</p>
                            <p className="text-[14px] text-white/35 mt-0.5">{fmtDate(c.data_casamento).split(' · ')[0]}</p>
                          </div>
                          {c.data_confirmada && (
                            <span className="text-[14px] tracking-widest uppercase font-bold px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">✓</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Atividade Recente */}
              {atividadesRecentes.length > 0 && (
                <div className="rounded-2xl border border-white/[0.08] p-5 sm:p-6 backdrop-blur-md"
                  style={{ background: 'linear-gradient(180deg, rgba(20,15,8,0.4), rgba(11,11,11,0.7))', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}>
                  <h3 className="text-[15px] font-semibold text-white mb-4">Atividade Recente</h3>
                  <div className="space-y-2.5">
                    {atividadesRecentes.map((a, i) => (
                      <div key={i} className="flex items-start gap-3 text-[14px]">
                        <span className="w-7 h-7 rounded-full border border-white/10 bg-white/[0.02] flex items-center justify-center shrink-0 text-base">
                          {a.tipo === 'msg' ? '💬' : a.tipo === 'pag' ? '💰' : '🔔'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-white/75 leading-snug">{a.texto}</p>
                          <p className="text-[14px] text-white/30 mt-0.5">{tempoRelativo(a.data)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── COLUNA LATERAL (1/3) — Tarefas + Calendário + Notas ── */}
            <aside className="lg:col-span-1 flex flex-col gap-4">
              <TasksWidget freelancerId={id} />
              <MiniCalendar casamentos={casamentos} onClickDate={() => setTab('casamentos')} />
              <NotesWidget freelancerId={id} />

              {/* Alerta mensagens não lidas */}
              {mensagensNaoLidas > 0 && (
                <button onClick={() => setTab('mensagens')}
                  className="bg-blue-500/[0.06] border border-blue-500/25 hover:bg-blue-500/[0.1] rounded-2xl p-4 text-left transition-all flex items-center gap-3">
                  <span className="text-2xl">💬</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] tracking-widest uppercase font-bold text-blue-300/85">Mensagens</p>
                    <p className="text-[14px] text-white/40 mt-0.5">{mensagensNaoLidas} {mensagensNaoLidas === 1 ? 'nova' : 'novas'}</p>
                  </div>
                  <span className="text-[14px] tracking-widest uppercase font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40">{mensagensNaoLidas}</span>
                </button>
              )}
            </aside>
          </div>
          </>
        )
      })()}

      {!loading && tab !== null && (
        <div>

          {/* ── Tab: Casamentos ── */}
          {tab === 'casamentos' && (
            <div className="space-y-10">

              {/* Hero da secção */}
              <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] px-8 py-7"
                style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.6), rgba(11,11,11,0.85))', boxShadow: '0 20px 50px -20px rgba(0,0,0,0.5)' }}>
                <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full"
                  style={{ background: 'radial-gradient(circle, rgba(201,164,92,0.15), transparent 70%)' }} />
                <p className="text-[11px] tracking-[0.5em] text-gold/70 uppercase mb-2">Editorial Workspace</p>
                <h2 className="text-3xl sm:text-4xl font-light text-white tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
                  A tua <span className="italic text-gold">Agenda</span>
                </h2>
                <div className="mt-3 h-px w-16 bg-gradient-to-r from-gold/70 to-transparent" />
                <p className="text-[14px] text-white/55 mt-4 leading-relaxed whitespace-pre-wrap max-w-2xl">
                  {freelancer?.intro_casamentos || `Aqui encontras todos os eventos que te foram atribuídos ao longo do ano. Sempre que um novo evento for adicionado, deverás confirmar a tua disponibilidade.\n\nA 3 dias do evento tens acesso ao briefing com toda a informação necessária para o dia — percurso, contactos, detalhes da cerimónia e muito mais.`}
                </p>
              </div>

              {/* Próximos */}
              <section>
                <div className="flex items-center gap-3 mb-5">
                  <p className="text-[11px] tracking-[0.4em] text-gold/70 uppercase font-bold">Próximos Casamentos</p>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-gold/10 border border-gold/25 text-gold font-bold">{upcoming.length}</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-gold/20 to-transparent" />
                </div>
                {upcoming.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/[0.08] text-center py-16">
                    <p className="text-gold/40 text-4xl font-serif leading-none mb-3">∅</p>
                    <p className="text-[12px] text-white/35 tracking-widest uppercase">Sem casamentos futuros</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {upcoming.map(c => {
                      const days = daysUntil(c.data_casamento)
                      const isUrgent = days !== null && days <= 7
                      const isConfirmed = freelancer?.status === 'VIDEOGRAFO' ? c.data_confirmada_videografo : c.data_confirmada
                      const isIndisp = freelancer?.status === 'VIDEOGRAFO' ? (c.indisponivel_videografo && !c.data_confirmada_videografo) : (c.indisponivel && !c.data_confirmada)
                      const progress = days === null ? 0 : Math.max(5, Math.min(100, 100 - Math.min(days, 180) / 180 * 95))
                      const badge = isConfirmed
                        ? { label: 'Confirmado', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' }
                        : isIndisp
                        ? { label: 'Indisponível', cls: 'bg-red-500/15 text-red-300 border-red-500/30' }
                        : isUrgent
                        ? { label: 'Urgente', cls: 'bg-red-500/15 text-red-300 border-red-500/30' }
                        : { label: 'Por Confirmar', cls: 'bg-gold/15 text-gold border-gold/30' }
                      return (
                        <div
                          key={c.id}
                          onClick={() => setFicha(c)}
                          className="group cursor-pointer relative overflow-hidden rounded-2xl border transition-all"
                          style={{
                            background: 'linear-gradient(135deg, rgba(20,15,8,0.5), rgba(11,11,11,0.85))',
                            borderColor: isUrgent ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.06)',
                            boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)',
                          }}
                        >
                          {/* Gold sweep hover */}
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-gold/0 via-gold/[0.06] to-gold/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />

                          <div className="relative grid grid-cols-1 lg:grid-cols-[160px_1fr_auto] gap-5 p-5">
                            {/* Date tile */}
                            <div className="relative">
                              <div className={`aspect-[16/10] rounded-xl border flex flex-col items-center justify-center text-center overflow-hidden ${isUrgent ? 'bg-red-500/10 border-red-500/30' : 'bg-gold/[0.06] border-gold/25'}`}
                                style={{ background: isUrgent
                                  ? 'linear-gradient(135deg, rgba(239,68,68,0.18), rgba(60,15,15,0.6))'
                                  : 'linear-gradient(135deg, rgba(201,164,92,0.18), rgba(35,25,8,0.7))' }}>
                                {c.data_casamento ? (
                                  <>
                                    <span className={`text-3xl font-bold leading-none ${isUrgent ? 'text-red-400' : 'text-gold'}`}>{c.data_casamento.split('-')[2]}</span>
                                    <span className={`text-[10px] uppercase tracking-[0.3em] font-semibold mt-1 ${isUrgent ? 'text-red-400/70' : 'text-gold/70'}`}>{MESES[parseInt(c.data_casamento.split('-')[1])-1]} {c.data_casamento.split('-')[0]}</span>
                                  </>
                                ) : <span className="text-white/20 text-[14px]">—</span>}
                              </div>
                              <span className={`absolute top-2 left-2 text-[9px] px-2 py-0.5 rounded-full border tracking-[0.2em] uppercase font-bold ${badge.cls}`}>
                                {badge.label}
                              </span>
                            </div>

                            {/* Info */}
                            <div className="flex flex-col gap-2 min-w-0">
                              <div>
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  {c.referencia && (
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-gold/10 border border-gold/30 text-gold tracking-widest font-bold">
                                      {c.referencia}
                                    </span>
                                  )}
                                </div>
                                <h2 className="text-2xl font-light text-white tracking-tight truncate" style={{ fontFamily: 'Georgia, serif' }}>{c.local || '—'}</h2>
                                <p className="text-[12px] text-white/55 mt-0.5">{fmtDate(c.data_casamento)}</p>
                              </div>

                              <div className="grid grid-cols-3 gap-3 mt-1">
                                <div className="min-w-0">
                                  <p className="text-[9px] tracking-[0.3em] uppercase text-white/35 mb-0.5">Equipa Foto</p>
                                  <p className="text-[12px] font-medium text-white/85 truncate">{c.equipa_foto && c.equipa_foto.length ? c.equipa_foto.join(' · ') : '—'}</p>
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[9px] tracking-[0.3em] uppercase text-white/35 mb-0.5">Videógrafo</p>
                                  <p className="text-[12px] font-medium text-white/85 truncate">{c.videografo || '—'}</p>
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[9px] tracking-[0.3em] uppercase text-white/35 mb-0.5">Briefing</p>
                                  <p className="text-[12px] font-medium text-white/85 truncate">{c.briefing_url ? 'Disponível' : 'Sem briefing'}</p>
                                </div>
                              </div>

                              {/* Progress bar */}
                              <div className="mt-2">
                                <div className="flex items-center justify-between mb-1.5">
                                  <p className="text-[9px] tracking-[0.3em] uppercase text-white/40">
                                    {days === null ? 'Sem data' : days < 0 ? 'Passado' : days === 0 ? 'HOJE' : `${days} ${days === 1 ? 'dia' : 'dias'} restantes`}
                                  </p>
                                  <p className={`text-[11px] font-bold ${isUrgent ? 'text-red-400' : 'text-gold'}`}>{Math.round(progress)}%</p>
                                </div>
                                <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                                  <div className="h-full rounded-full transition-all duration-700"
                                    style={{
                                      width: `${progress}%`,
                                      background: isUrgent
                                        ? 'linear-gradient(90deg, #ef4444, #f87171, #ef4444)'
                                        : 'linear-gradient(90deg, #C9A45C, #E8C76D, #C9A45C)',
                                      boxShadow: isUrgent ? '0 0 12px rgba(239,68,68,0.5)' : '0 0 12px rgba(201,164,92,0.5)',
                                    }} />
                                </div>
                              </div>
                            </div>

                            {/* Right CTA */}
                            <div className="flex flex-col items-end justify-between gap-3">
                              {days !== null && (
                                <div className={`text-right ${isUrgent ? 'text-red-400' : 'text-gold'}`}>
                                  <p className="text-3xl font-bold leading-none">{days === 0 ? '!' : days}</p>
                                  <p className="text-[10px] tracking-[0.3em] uppercase mt-1">{days === 0 ? 'HOJE' : days === 1 ? 'dia' : 'dias'}</p>
                                </div>
                              )}
                              <button onClick={e => { e.stopPropagation(); setFicha(c) }}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gold/30 text-gold text-[11px] tracking-wider uppercase font-semibold hover:bg-gold/10 transition-all whitespace-nowrap">
                                Abrir Ficha <span>›</span>
                              </button>
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
                <div className="flex items-center gap-3 mb-5">
                  <p className="text-[11px] tracking-[0.4em] text-white/40 uppercase font-bold">Casamentos Anteriores</p>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-white/40 font-bold">{past.length}</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
                </div>
                {past.length === 0 ? (
                  <p className="text-white/15 text-[14px] tracking-widest">Sem casamentos anteriores.</p>
                ) : (
                  <div className="space-y-2">
                    {past.map(c => (
                      <div key={c.id} onClick={() => setFicha(c)}
                        className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-white/[0.04] bg-white/[0.01] opacity-60 cursor-pointer hover:opacity-80 hover:border-white/[0.10] transition-all">
                        <div>
                          <p className="text-[14px] text-white/60">{c.local || '—'}</p>
                          <p className="text-[14px] text-white/25 mt-0.5">{fmtDate(c.data_casamento).split(' · ')[0]}</p>
                        </div>
                        {c.data_confirmada && (
                          <span className="text-[14px] text-emerald-400/50">✓</span>
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
              notificacoes={notificacoes}
              onRefreshNotifs={loadData}
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
            <section className="space-y-6">
              <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] px-8 py-7"
                style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.6), rgba(11,11,11,0.85))', boxShadow: '0 20px 50px -20px rgba(0,0,0,0.5)' }}>
                <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full"
                  style={{ background: 'radial-gradient(circle, rgba(201,164,92,0.12), transparent 70%)' }} />
                <p className="text-[11px] tracking-[0.5em] text-gold/70 uppercase mb-2">Editorial Workspace</p>
                <h2 className="text-3xl sm:text-4xl font-light text-white tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
                  Estado da <span className="italic text-gold">Edição</span>
                </h2>
                <div className="mt-3 h-px w-16 bg-gradient-to-r from-gold/70 to-transparent" />
                <p className="text-[14px] text-white/55 mt-4 leading-relaxed max-w-2xl">
                  É importante manteres o estado de cada trabalho sempre atualizado. Os noivos têm acesso a esta informação em tempo real através do portal — um estado atualizado transmite profissionalismo e mantém-nos tranquilos ao longo de todo o processo.
                </p>
              </div>
              {edicao.length === 0 ? (
                <p className="text-white/15 text-[14px] tracking-widest">Sem trabalhos de edição atribuídos.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {STATUS_EDICAO_ORDER.map(status => {
                    const jobs = edicao.filter(e => e.status === status)
                    return (
                      <div key={status} className="space-y-2">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[14px] font-bold tracking-widest uppercase ${STATUS_EDICAO_STYLE[status] ?? 'bg-white/5 text-white/30 border-white/10'}`}>
                          <span>{status}</span>
                          <span className="ml-auto opacity-60">({jobs.length})</span>
                        </div>
                        {jobs.map(e => <EdicaoCard key={e.id} e={e} onStatusChange={(id, s) => setEdicao(prev => prev.map(x => x.id === id ? { ...x, status: s } : x))} />)}
                        {jobs.length === 0 && (
                          <p className="text-[14px] text-white/15 text-center py-4 tracking-widest">—</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          )}

          {/* ── Tab: Pagamentos ── */}
          {tab === 'pagamentos' && (
            <PagamentosTab pagamentos={pagamentos} casamentos={casamentos} />
          )}

          {/* ── Tab: Disponibilidade ── */}
          {tab === 'disponibilidade' && (
            <DisponibilidadeTab
              freelancerId={id}
              disponibilidade={disponibilidade}
              casamentos={casamentos}
              onRefresh={loadData}
            />
          )}

          {/* ── Tab: Workflow ── */}
          {tab === 'guia' && (
            <section className="space-y-6">
              <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] px-8 py-7"
                style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.6), rgba(11,11,11,0.85))', boxShadow: '0 20px 50px -20px rgba(0,0,0,0.5)' }}>
                <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full"
                  style={{ background: 'radial-gradient(circle, rgba(201,164,92,0.12), transparent 70%)' }} />
                <p className="text-[11px] tracking-[0.5em] text-gold/70 uppercase mb-2">Editorial Workspace</p>
                <h2 className="text-3xl sm:text-4xl font-light text-white tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
                  O nosso <span className="italic text-gold">Workflow</span>
                </h2>
                <div className="mt-3 h-px w-16 bg-gradient-to-r from-gold/70 to-transparent" />
                <p className="text-[14px] text-white/55 mt-4 leading-relaxed max-w-2xl">
                  Lê com atenção para que nada falhe. O nosso fluxo de trabalho está desenhado para garantir que cada projeto é executado com a máxima qualidade e organização.
                </p>
              </div>
              {freelancer?.guia_trabalho ? (
                <div className="rounded-2xl border border-white/[0.06] p-6 sm:p-8"
                  style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.4), rgba(11,11,11,0.6))' }}>
                  <p className="text-[11px] tracking-[0.4em] text-gold/70 uppercase font-bold mb-5">Guia de Trabalho</p>
                  <p className="text-[14px] text-white/80 leading-relaxed whitespace-pre-wrap">{freelancer.guia_trabalho}</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/[0.08] text-center py-20">
                  <p className="text-gold/40 text-4xl font-serif leading-none mb-3">∅</p>
                  <p className="text-[12px] text-white/35 tracking-widest uppercase">Workflow não disponível</p>
                </div>
              )}
            </section>
          )}

          {/* ── Tab: Mensagens ── */}
          {tab === 'mensagens' && (
            <MensagensTab freelancerId={id} casamentos={casamentos} mensagens={mensagens} onRefresh={loadData} />
          )}

          {/* ── Tab: Notificações ── */}
          {tab === 'notificacoes' && (
            <NotificacoesTab notificacoes={notificacoes} onRefresh={loadData} />
          )}

          {/* ── Tab: Edição de Álbum ── */}
          {tab === 'album' && (
            <section className="space-y-4">
              {album.length === 0 ? (
                <p className="text-white/15 text-[14px] tracking-widest">Sem álbuns atribuídos.</p>
              ) : (
                ALBUM_STATUS_SECTIONS.map(statusLabel => {
                  const items = album.filter(a => a.status === statusLabel)
                  return (
                    <div key={statusLabel}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[14px] px-2 py-0.5 rounded border tracking-widest font-semibold uppercase ${STATUS_ALBUM_STYLE[statusLabel] ?? 'bg-white/5 text-white/30 border-white/10'}`}>
                          {statusLabel}
                        </span>
                        <span className="text-[14px] text-white/20">({items.length})</span>
                      </div>
                      {items.length === 0 ? (
                        <p className="text-[14px] text-white/10 italic pl-1">—</p>
                      ) : (
                        <div className="space-y-2">
                          {items.map(a => (
                            <div key={a.id} className={`rounded-xl border overflow-hidden ${a.alteracao ? 'border-orange-500/40 bg-orange-500/[0.04]' : 'border-white/[0.06] bg-white/[0.02]'}`}>
                              {/* Alteration banner */}
                              {a.alteracao && (
                                <div className="bg-orange-500/10 border-b border-orange-500/30">
                                  {/* Header row */}
                                  <div className="px-4 pt-3 pb-2 flex items-center gap-2">
                                    <span className="text-orange-400 text-[14px]">✎</span>
                                    <p className="text-[14px] tracking-[0.3em] uppercase font-semibold text-orange-400">Alterações Solicitadas pelo Cliente</p>
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
                                        <p className="text-[14px] text-orange-300/40 mt-1 text-center tracking-wide">ver foto</p>
                                      </a>
                                    )}
                                    {/* Text details */}
                                    <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                                      {a.alteracao.tipos_alteracao && a.alteracao.tipos_alteracao.length > 0 && (
                                        <div>
                                          <p className="text-[14px] text-orange-300/40 tracking-widest uppercase mb-0.5">Tipo</p>
                                          <p className="text-[14px] text-orange-300/80">{a.alteracao.tipos_alteracao.join(' · ')}</p>
                                        </div>
                                      )}
                                      {a.alteracao.paginas_alterar && (
                                        <div>
                                          <p className="text-[14px] text-orange-300/40 tracking-widest uppercase mb-0.5">Páginas</p>
                                          <p className="text-[14px] text-orange-300/80">{a.alteracao.paginas_alterar}</p>
                                        </div>
                                      )}
                                      {a.alteracao.observacoes && (
                                        <div>
                                          <p className="text-[14px] text-orange-300/40 tracking-widest uppercase mb-0.5">Observações</p>
                                          <p className="text-[14px] text-orange-300/70 leading-relaxed">{a.alteracao.observacoes}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                              <div className="px-4 py-3 space-y-2">
                                <div className="flex items-start justify-between gap-3 flex-wrap">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[14px] text-white/80">{a.nome}</p>
                                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                      {a.data_casamento && <p className="text-[14px] text-white/30">{fmtDate(a.data_casamento).split(' · ')[0]}</p>}
                                      {a.referencia_album && <span className="text-[14px] text-gold/50 font-mono">{a.referencia_album}</span>}
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                                      {a.data_entrega_fotos && (
                                        <span className="text-[14px] text-white/30">Entrada: {fmtDate(a.data_entrega_fotos).split(' · ')[0]}</span>
                                      )}
                                      {a.data_entrega_fotos && (
                                        <span className="text-[14px] text-white/30">Limite: {fmtDate(addDaysStr(a.data_entrega_fotos, 35)).split(' · ')[0]}</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <button onClick={() => setAlbumInfo(a)}
                                      className="text-[14px] tracking-[0.15em] uppercase px-3 py-1.5 rounded-xl border border-gold/30 bg-gold/5 text-gold/70 hover:text-gold hover:border-gold/60 hover:bg-gold/10 transition-all">
                                      Ver Mais
                                    </button>
                                    <AlbumStatusSelect albumId={a.id} status={a.status} onChanged={s => setAlbum(prev => prev.map(x => x.id === a.id ? { ...x, status: s } : x))} />
                                  </div>
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

      {/* Rodapé editorial */}
      <div className="mt-10 mb-4 flex items-center justify-between">
        <p className="text-[10px] tracking-[0.4em] uppercase text-white/20">RL Photo.Video · Área do Freelancer</p>
        <p className="text-[11px] tracking-widest uppercase text-white/30">Wedding Moments Films</p>
      </div>
      <div className="-mx-6 sm:-mx-8 px-0">
        <img src="/banner_footer.png" alt="RL Photo.Video" className="w-full object-cover opacity-70" />
      </div>
    </main>
    </div>
  )
}

// ─── Componente Stat (mini-card de estatística no dashboard) ────────────────
function Stat({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="bg-black/30 border border-white/[0.06] rounded-xl px-3 py-3">
      <p className="text-[14px] tracking-[0.3em] uppercase text-white/35 mb-1">{label}</p>
      <p className="text-2xl font-bold text-white/90 leading-none">{value}</p>
      {sub && <p className="text-[14px] text-white/30 mt-1">{sub}</p>}
    </div>
  )
}

// ─── SidebarNav ────────────────────────────────────────────────────────────
type TabKey = 'casamentos'|'edicao'|'album'|'pagamentos'|'disponibilidade'|'guia'|'notificacoes'|'mensagens'|null

function SidebarNav({
  freelancer,
  tab,
  setTab,
  counts,
  isFotografo,
  onLogout,
}: {
  freelancer: Freelancer | null
  tab: TabKey
  setTab: (t: TabKey) => void
  counts: { casamentos: number; edicao: number; album: number; mensagens: number; notificacoes: number }
  isFotografo: boolean
  onLogout: () => void
}) {
  const items: Array<{ key: TabKey; label: string; icon: string; count?: number }> = [
    { key: null,             label: 'Início',         icon: '⌂' },
    { key: 'casamentos',     label: 'Casamentos',     icon: '◆', count: counts.casamentos },
    { key: 'edicao',         label: isFotografo ? 'Edição Fotos' : 'Edição Vídeo', icon: '✎', count: counts.edicao },
    ...(counts.album > 0 ? [{ key: 'album' as TabKey, label: 'Álbuns', icon: '◫', count: counts.album }] : []),
    { key: 'pagamentos',     label: 'Pagamentos',     icon: '€' },
    { key: 'disponibilidade',label: 'Agenda',         icon: '☉' },
    { key: 'guia',           label: 'Workflow',       icon: '☰' },
    { key: 'mensagens',      label: 'Mensagens',      icon: '✉', count: counts.mensagens },
    { key: 'notificacoes',   label: 'Notificações',   icon: '◉', count: counts.notificacoes },
  ]

  return (
    <aside
      className="hidden lg:flex fixed top-0 left-0 bottom-0 w-[230px] z-30 flex-col"
      style={{
        background: 'linear-gradient(180deg, rgba(15,12,8,0.95) 0%, rgba(11,9,5,0.98) 100%)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(201,164,92,0.12)',
      }}
    >
      {/* Logo editorial */}
      <div className="px-6 pt-8 pb-8 flex flex-col items-center border-b border-white/[0.04]">
        <div className="w-14 h-14 rounded-2xl border border-gold/40 flex items-center justify-center mb-2 overflow-hidden"
          style={{ background: 'radial-gradient(circle at 30% 30%, rgba(201,164,92,0.18), rgba(201,164,92,0.04))', boxShadow: '0 0 20px rgba(201,164,92,0.15)' }}>
          <img src="/logo_rl_gold.png" alt="RL" className="w-10 h-10 object-contain" />
        </div>
        <p className="text-[10px] tracking-[0.4em] text-gold/70 font-light uppercase mt-1">{freelancer?.status === 'VIDEOGRAFO' ? 'Videógrafo' : freelancer?.status === 'FOTOGRAFO' ? 'Fotógrafo' : 'Freelancer'}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-0.5">
        {items.map((it, i) => {
          const active = tab === it.key
          return (
            <button
              key={i}
              onClick={() => setTab(it.key)}
              className={`w-full group flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                active
                  ? 'bg-gold/10 border border-gold/30 text-gold'
                  : 'border border-transparent text-white/45 hover:text-white/90 hover:bg-white/[0.03]'
              }`}
              style={active ? { boxShadow: '0 0 18px -4px rgba(201,164,92,0.35)' } : {}}
            >
              <span className={`w-5 text-center text-base ${active ? 'text-gold' : 'text-white/35 group-hover:text-white/70'}`}>{it.icon}</span>
              <span className="flex-1 text-[13px] font-medium tracking-wide">{it.label}</span>
              {it.count && it.count > 0 ? (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  active ? 'bg-gold/20 text-gold' : 'bg-white/[0.06] text-white/40'
                }`}>{it.count}</span>
              ) : null}
            </button>
          )
        })}
      </nav>

      {/* Profile + Quote (estilo editorial) */}
      <div className="px-5 py-4 border-t border-white/[0.04]">
        {freelancer && (
          <div className="flex items-center gap-3 mb-4 p-2 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            {freelancer.foto_url ? (
              <img src={freelancer.foto_url} alt={freelancer.nome} className="w-9 h-9 rounded-full object-cover border border-gold/40" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold/30 to-gold/10 border border-gold/40 flex items-center justify-center text-gold font-bold">
                {(freelancer.nome ?? '?').charAt(0)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-white truncate">{freelancer.nome}</p>
              {freelancer.status && (
                <p className="text-[10px] tracking-[0.25em] uppercase text-white/35 truncate">{freelancer.status}</p>
              )}
            </div>
          </div>
        )}

        <div className="p-3 rounded-xl border border-gold/15 mb-3"
          style={{ background: 'linear-gradient(135deg, rgba(201,164,92,0.05), transparent)' }}>
          <p className="text-gold/40 text-2xl font-serif leading-none mb-1">&ldquo;</p>
          <p className="text-[11px] text-white/55 italic leading-relaxed font-light">Cada momento é uma história única.</p>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl border border-white/[0.06] hover:border-red-500/30 hover:bg-red-500/[0.06] transition-all text-white/55 hover:text-red-400"
        >
          <span className="text-base">⎋</span>
          <span className="flex-1 text-left text-[11px] tracking-[0.25em] uppercase font-medium">Sair</span>
        </button>
      </div>
    </aside>
  )
}

