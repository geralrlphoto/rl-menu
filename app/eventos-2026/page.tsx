'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import './eventos-topo.css'

type Evento = {
  id: string
  notion_id?: string
  referencia: string
  cliente: string
  data_evento: string
  local: string
  tipo_evento: string[]
  tipo_servico: string[]
  servicos_dia?: string[]
  servico_extra: string[]
  status: string
  fotografo: string[]
  videografo: string[]
  editor_fotos?: string | null
  valor_liquido: number | null
  valor_foto: number | null
  valor_real_foto: number | null
  valor_video: number | null
  data_entrega: string | null
  fotos_enviadas: boolean
  sel_fotos_estado:    string | null
  video_estado:        string | null
  fotos_edicao_estado: string | null
  album_estado:        string | null
}

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const MESES_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function daysUntil(d: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const event = new Date(d + 'T00:00:00')
  return Math.round((event.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

const tipoColor: Record<string, string> = {
  'CASAMENTO': 'bg-gold/15 text-gold border-gold/30',
  'BATIZADO': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  'ANIVERSÁRIO': 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  'SESSÃO FOTO': 'bg-pink-500/15 text-pink-400 border-pink-500/30',
  'CORPORATIVO': 'bg-gray-500/15 text-gray-400 border-gray-500/30',
}

function formatDate(d: string) {
  if (!d) return '—'
  const dt = new Date(d + 'T00:00:00')
  return `${String(dt.getDate()).padStart(2,'0')} ${MESES[dt.getMonth()]}`
}

function getDayOfWeek(d: string) {
  if (!d) return ''
  const days = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
  return days[new Date(d + 'T00:00:00').getDay()]
}

function groupByMonth(events: Evento[]) {
  const groups: Record<string, Evento[]> = {}
  events.forEach(e => {
    if (!e.data_evento) return
    const key = e.data_evento.slice(0, 7)
    if (!groups[key]) groups[key] = []
    groups[key].push(e)
  })
  return groups
}

const TIPOS_EVENTO   = ['CASAMENTO','BATIZADO','ANIVERSÁRIO','SESSÃO FOTO','CORPORATIVO']
const TIPOS_SERVICO  = ['FOTOGRAFIA','VÍDEO','FOTOGRAFIA + VÍDEO']
const SERVICOS_DIA   = [
  'Making Off Noiva',
  'Making Off Noivo',
  'Cerimónia Civil',
  'Cerimónia Igreja',
  'Cocktail',
  'Banquete',
  'Corte do Bolo',
  'Dança dos Noivos',
  'Festa',
  'Sessão Noivos',
  'Foto Lembrança',
  'Sneak Peak',
] as const

type NovoEventoForm = {
  referencia: string; cliente: string; data_evento: string; local: string
  tipo_evento: string[]; tipo_servico: string[]; servicos_dia: string[]
  fotografo: string; videografo: string
  valor_foto: string; valor_video: string; valor_liquido: string
}

function NovoEventoModal({ onClose, onCreated, anoFiltro, totalEventos }: { onClose: () => void; onCreated: () => void; anoFiltro: number; totalEventos: number }) {
  const anoSufixo = String(anoFiltro).slice(2) // "26" ou "27"
  const proximoNum = String(totalEventos + 1).padStart(3, '0')
  const refSugerida = `CAS_${proximoNum}_${anoSufixo}_RL`

  const [form, setForm] = useState<NovoEventoForm>({
    referencia: refSugerida, cliente: '', data_evento: '', local: '',
    tipo_evento: [], tipo_servico: [], servicos_dia: [],
    fotografo: '', videografo: '',
    valor_foto: '', valor_video: '', valor_liquido: '',
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  function set(k: keyof NovoEventoForm, v: string | string[]) {
    setForm(f => ({ ...f, [k]: v }))
  }
  function toggleArr(k: 'tipo_evento' | 'tipo_servico' | 'servicos_dia', val: string) {
    setForm(f => {
      const arr = f[k] as string[]
      return { ...f, [k]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] }
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.referencia.trim()) { setErr('Referência obrigatória'); return }
    if (!form.data_evento) { setErr('Data do evento obrigatória'); return }
    setSaving(true); setErr('')
    try {
      const body: any = {
        referencia: form.referencia.trim(),
        cliente:    form.cliente.trim(),
        data_evento: form.data_evento,
        local:       form.local.trim(),
        tipo_evento: form.tipo_evento,
        tipo_servico: form.tipo_servico,
        servicos_dia: form.servicos_dia,
        fotografo:  form.fotografo ? [form.fotografo] : [],
        videografo: form.videografo ? [form.videografo] : [],
      }
      if (form.valor_foto)    body.valor_foto    = parseFloat(form.valor_foto)
      if (form.valor_video)   body.valor_video   = parseFloat(form.valor_video)
      if (form.valor_liquido) body.valor_liquido = parseFloat(form.valor_liquido)

      const res = await fetch('/api/eventos-notion', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      }).then(r => r.json())
      if (res.error) { setErr(res.error); return }
      onCreated()
      onClose()
    } finally { setSaving(false) }
  }

  const inp = "w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 outline-none focus:border-gold/40 transition-colors placeholder:text-white/20"
  const lbl = "block text-[9px] text-white/30 tracking-widest uppercase mb-1"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-[#111] border border-white/[0.1] rounded-2xl p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-bold tracking-[0.2em] text-gold uppercase">Novo Evento</h2>
          <button onClick={onClose} className="text-white/30 hover:text-white/70 text-xl transition-colors">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Referência *</label>
              <input value={form.referencia} onChange={e => set('referencia', e.target.value)}
                placeholder={refSugerida} className={inp} />
            </div>
            <div>
              <label className={lbl}>Data do Evento *</label>
              <input type="date" value={form.data_evento} onChange={e => set('data_evento', e.target.value)} className={inp} />
            </div>
          </div>
          <div>
            <label className={lbl}>Cliente</label>
            <input value={form.cliente} onChange={e => set('cliente', e.target.value)}
              placeholder="Nome do cliente" className={inp} />
          </div>
          <div>
            <label className={lbl}>Local</label>
            <input value={form.local} onChange={e => set('local', e.target.value)}
              placeholder="Local do evento" className={inp} />
          </div>
          <div>
            <label className={lbl}>Tipo de Evento</label>
            <div className="flex flex-wrap gap-2">
              {TIPOS_EVENTO.map(t => (
                <button type="button" key={t} onClick={() => toggleArr('tipo_evento', t)}
                  className={`px-3 py-1 rounded-full text-[10px] font-medium tracking-wide border transition-all
                    ${form.tipo_evento.includes(t) ? 'bg-gold/20 border-gold/50 text-gold' : 'bg-white/[0.03] border-white/10 text-white/40 hover:border-white/25'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={lbl}>Tipo de Serviço</label>
            <div className="flex flex-wrap gap-2">
              {TIPOS_SERVICO.map(t => (
                <button type="button" key={t} onClick={() => toggleArr('tipo_servico', t)}
                  className={`px-3 py-1 rounded-full text-[10px] font-medium tracking-wide border transition-all
                    ${form.tipo_servico.includes(t) ? 'bg-gold/20 border-gold/50 text-gold' : 'bg-white/[0.03] border-white/10 text-white/40 hover:border-white/25'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={lbl}>Serviços do Dia</label>
            <p className="text-[10px] text-white/30 mb-2 italic">Selecciona o que vai ser fotografado/filmado neste evento. Aparecerá na ficha do freelancer.</p>
            <div className="flex flex-wrap gap-2">
              {SERVICOS_DIA.map(t => (
                <button type="button" key={t} onClick={() => toggleArr('servicos_dia', t)}
                  className={`px-3 py-1 rounded-full text-[10px] font-medium tracking-wide border transition-all
                    ${form.servicos_dia.includes(t) ? 'bg-gold/20 border-gold/50 text-gold' : 'bg-white/[0.03] border-white/10 text-white/40 hover:border-white/25'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Fotógrafo</label>
              <input value={form.fotografo} onChange={e => set('fotografo', e.target.value)}
                placeholder="Nome" className={inp} />
            </div>
            <div>
              <label className={lbl}>Videógrafo</label>
              <input value={form.videografo} onChange={e => set('videografo', e.target.value)}
                placeholder="Nome" className={inp} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={lbl}>Valor Foto (€)</label>
              <input type="number" value={form.valor_foto} onChange={e => set('valor_foto', e.target.value)}
                placeholder="0" className={inp} />
            </div>
            <div>
              <label className={lbl}>Valor Vídeo (€)</label>
              <input type="number" value={form.valor_video} onChange={e => set('valor_video', e.target.value)}
                placeholder="0" className={inp} />
            </div>
            <div>
              <label className={lbl}>Valor Líquido (€)</label>
              <input type="number" value={form.valor_liquido} onChange={e => set('valor_liquido', e.target.value)}
                placeholder="0" className={inp} />
            </div>
          </div>
          {err && <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{err}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs border border-white/10 text-white/40 hover:text-white/70 transition-all">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="px-6 py-2 rounded-xl text-xs bg-gold text-black font-bold tracking-wide hover:bg-gold/80 transition-all disabled:opacity-50">
              {saving ? 'A criar...' : 'Criar Evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Dropdown referências (usadas / pendentes / livres) ─────────────────────
function ReferenciasDropdown({ events, anoFiltro }: { events: Evento[]; anoFiltro: number }) {
  const [open, setOpen]   = useState(false)
  const [prefix, setPrefix] = useState<'CAS_RL' | 'CAS_KP' | 'BAT_RL' | 'BAT_KP'>('CAS_RL')
  const [copied, setCopied] = useState<string | null>(null)
  const [pendentes, setPendentes] = useState<Map<string, string>>(new Map()) // ref → nota
  const anoSufixo = String(anoFiltro).slice(2) // "26" / "27"

  // Carrega pendentes do Supabase
  useEffect(() => {
    if (!open) return
    fetch('/api/referencias-pendentes')
      .then(r => r.json())
      .then(d => {
        const map = new Map<string, string>()
        ;(d.pendentes ?? []).forEach((p: any) => map.set(p.referencia, p.nota ?? ''))
        setPendentes(map)
      })
      .catch(() => {/* tabela ainda não criada — silencioso */})
  }, [open])

  // Mapa: referência → cliente (para mostrar a quem está atribuída)
  const usedMap = (() => {
    const m = new Map<string, string>()
    events.forEach(e => { if (e.referencia) m.set(e.referencia.toUpperCase(), e.cliente || '—') })
    return m
  })()

  const PREFIX_LABEL: Record<string, string> = {
    CAS_RL: 'CASAMENTO · RL',
    CAS_KP: 'CASAMENTO · KP',
    BAT_RL: 'BATIZADO · RL',
    BAT_KP: 'BATIZADO · KP',
  }

  type Estado = 'usada' | 'pendente' | 'livre'

  // Gera lista de referências: 001..max(usadas)+10 (mínimo 30)
  const refsList = (() => {
    const [tipo, suf] = prefix.split('_')
    const filterPrefix = `${tipo}_`
    const filterSuffix = `_${anoSufixo}_${suf}`
    const usedNums = Array.from(usedMap.keys())
      .filter(r => r.startsWith(filterPrefix) && r.endsWith(filterSuffix))
      .map(r => {
        const m = r.match(/^[A-Z]+_(\d+)_/)
        return m ? parseInt(m[1], 10) : NaN
      })
      .filter(n => !isNaN(n))
    const maxNum = usedNums.length > 0 ? Math.max(...usedNums) : 0
    const end = Math.max(maxNum + 10, 30)
    const out: Array<{ ref: string; estado: Estado; label: string }> = []
    for (let n = 1; n <= end; n++) {
      const ref = `${tipo}_${String(n).padStart(3, '0')}_${anoSufixo}_${suf}`
      const cliente = usedMap.get(ref)
      const nota = pendentes.get(ref)
      let estado: Estado = 'livre'
      let label = 'Livre'
      if (cliente) { estado = 'usada'; label = cliente }
      else if (nota !== undefined) { estado = 'pendente'; label = nota || 'Pendente' }
      out.push({ ref, estado, label })
    }
    return out
  })()

  const totalUsadas    = refsList.filter(r => r.estado === 'usada').length
  const totalPendentes = refsList.filter(r => r.estado === 'pendente').length
  const totalLivres    = refsList.filter(r => r.estado === 'livre').length

  async function copiar(ref: string) {
    try {
      await navigator.clipboard.writeText(ref)
      setCopied(ref)
      setTimeout(() => setCopied(null), 1500)
    } catch {/* ignore */}
  }

  async function togglePendente(ref: string, currentEstado: Estado) {
    if (currentEstado === 'usada') return
    if (currentEstado === 'pendente') {
      // Unmark: remove
      const next = new Map(pendentes); next.delete(ref); setPendentes(next)
      await fetch(`/api/referencias-pendentes?ref=${encodeURIComponent(ref)}`, { method: 'DELETE' }).catch(() => {})
    } else {
      // Mark: pede nota opcional
      const nota = window.prompt(`Marcar ${ref} como PENDENTE.\n\nNota opcional (ex.: nome do potencial cliente):`, '')
      if (nota === null) return // cancelou
      const next = new Map(pendentes); next.set(ref, nota.trim()); setPendentes(next)
      await fetch('/api/referencias-pendentes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referencia: ref, nota: nota.trim() || null }),
      }).catch(() => {})
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/15 text-white/70 font-bold text-xs tracking-widest hover:bg-white/[0.04] hover:border-white/30 transition-all uppercase"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        Referências
        <span className="text-[10px] text-white/30 normal-case tracking-normal">({totalUsadas}/{refsList.length})</span>
      </button>

      {open && (
        <>
          {/* Backdrop para fechar ao clicar fora */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          {/* Painel */}
          <div className="absolute right-0 mt-2 w-[min(95vw,460px)] max-h-[70vh] overflow-hidden z-50 rounded-2xl border border-white/15 bg-[#0d0d0e] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]">
            {/* Tabs */}
            <div className="flex border-b border-white/10 text-[10px] tracking-widest uppercase font-bold">
              {(['CAS_RL', 'CAS_KP', 'BAT_RL', 'BAT_KP'] as const).map(p => (
                <button key={p} onClick={() => setPrefix(p)}
                  className={`flex-1 px-2 py-3 transition-colors ${prefix === p ? 'text-gold bg-white/[0.03] border-b-2 border-gold' : 'text-white/40 hover:text-white/70'}`}>
                  {PREFIX_LABEL[p]}
                </button>
              ))}
            </div>
            {/* Legenda */}
            <div className="flex items-center justify-between px-4 py-2 text-[10px] tracking-widest text-white/40 uppercase border-b border-white/[0.05]">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500/70" /> Usada {totalUsadas}</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-400/80" /> Pendente {totalPendentes}</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500/70" /> Livre {totalLivres}</span>
              </div>
              <span className="text-white/25">Ano {anoFiltro}</span>
            </div>
            {/* Lista */}
            <div className="overflow-y-auto max-h-[55vh] py-2">
              {refsList.map(r => {
                const styles = {
                  usada:    { dot: 'bg-red-500/70',     text: 'text-red-300/85',     hover: 'hover:bg-red-500/[0.07]',     label: 'text-red-300/50' },
                  pendente: { dot: 'bg-yellow-400/80',  text: 'text-yellow-300/85',  hover: 'hover:bg-yellow-500/[0.07]',  label: 'text-yellow-300/55' },
                  livre:    { dot: 'bg-emerald-500/70', text: 'text-emerald-300/85', hover: 'hover:bg-emerald-500/[0.07]', label: 'text-emerald-300/40' },
                }[r.estado]
                return (
                  <div key={r.ref}
                    className={`flex items-center justify-between gap-2 px-4 py-2 transition-colors ${styles.hover}`}>
                    <button onClick={() => copiar(r.ref)}
                      title={r.estado === 'usada' ? `Atribuída a: ${r.label}` : (r.estado === 'pendente' ? 'Pendente — clica para copiar' : 'Livre — clica para copiar')}
                      className={`flex-1 min-w-0 flex items-center gap-2.5 font-mono text-xs text-left ${styles.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${styles.dot}`} />
                      <span className="truncate">{r.ref}</span>
                    </button>
                    <span className={`text-[10px] tracking-wide truncate max-w-[140px] ${styles.label}`}>
                      {copied === r.ref ? '✓ Copiado' : r.label}
                    </span>
                    {r.estado !== 'usada' && (
                      <button
                        onClick={() => togglePendente(r.ref, r.estado)}
                        title={r.estado === 'pendente' ? 'Remover pendente' : 'Marcar como pendente'}
                        className={`shrink-0 text-[9px] tracking-widest uppercase font-bold px-2 py-1 rounded border transition-all ${
                          r.estado === 'pendente'
                            ? 'border-yellow-400/40 text-yellow-300/80 bg-yellow-400/10 hover:bg-yellow-400/20'
                            : 'border-white/15 text-white/40 hover:border-yellow-400/40 hover:text-yellow-300/70'
                        }`}>
                        {r.estado === 'pendente' ? '× Pend' : '+ Pend'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Ações Fotografia mostradas na lista por ícones 📷 (ver ACOES_FOTO)
type AcoesFoto = {
  galerias: string | null
  selecao:  string | null
  finais:   string | null
}

// 1 📷 Galerias Online · 2 📷 Fotos p/ Seleção · 3 📷 Fotos Finais
const ACOES_FOTO: Array<{ chave: keyof AcoesFoto; icones: number; label: string }> = [
  { chave: 'galerias', icones: 1, label: 'Galerias Online' },
  { chave: 'selecao',  icones: 2, label: 'Fotos p/ Seleção' },
  { chave: 'finais',   icones: 3, label: 'Fotos Finais' },
]

// Tinge o emoji 📷 de verde quando o serviço de foto está concluído
const FILTRO_VERDE = 'grayscale(1) sepia(1) hue-rotate(75deg) saturate(5) brightness(1.05)'
// Tinge o emoji 🎬 conforme o estado do vídeo
const FILTRO_LARANJA  = 'grayscale(1) sepia(1) hue-rotate(-12deg) saturate(7) brightness(1.05) drop-shadow(0 0 3px rgba(251, 146, 60, 0.85))'
const FILTRO_VERMELHO = 'grayscale(1) sepia(1) hue-rotate(-45deg) saturate(9) brightness(0.95) drop-shadow(0 0 3px rgba(248, 113, 113, 0.85))'

// Aguardar (ou sem estado) → vermelho · Entregue/S-SERVIÇO → verde · restantes (em curso) → laranja
function filtroVideo(estado: string | null): string {
  if (estado === 'Entregue' || estado === 'S/SERVIÇO') return FILTRO_VERDE + ' drop-shadow(0 0 3px rgba(74, 222, 128, 0.85))'
  if (!estado || estado === 'Aguardar') return FILTRO_VERMELHO
  return FILTRO_LARANJA
}

function dataCurta(v: string) {
  const dt = new Date(v.split('T')[0] + 'T00:00:00')
  if (isNaN(dt.getTime())) return v
  return dt.toLocaleDateString('pt-PT')
}

// Ticket médio = (foto real + vídeo) por evento, só conta eventos com valor
function valorEvento(e: Evento) {
  return (e.valor_real_foto ?? 0) + (e.valor_liquido ?? 0)
}

function ticketMedio(evs: Evento[]) {
  const comValor = evs.filter(e => valorEvento(e) > 0)
  return comValor.length ? Math.round(comValor.reduce((s, e) => s + valorEvento(e), 0) / comValor.length) : 0
}

function TicketEvolucao({ events, anoFiltro, ticketAno }: { events: Evento[]; anoFiltro: number; ticketAno: number }) {
  const [ticketAnterior, setTicketAnterior] = useState<number | null>(null)

  // Ano anterior só é pedido quando o painel abre
  useEffect(() => {
    fetch(`/api/eventos-supabase?ano=${anoFiltro - 1}`)
      .then(r => r.json())
      .then(d => setTicketAnterior(ticketMedio(d.events ?? [])))
      .catch(() => setTicketAnterior(0))
  }, [anoFiltro])

  let acumSoma = 0, acumN = 0
  const meses = MESES.map((m, i) => {
    const doMes = events.filter(e => e.data_evento && new Date(e.data_evento + 'T00:00:00').getMonth() === i && valorEvento(e) > 0)
    doMes.forEach(e => { acumSoma += valorEvento(e); acumN++ })
    return {
      mes: m,
      n: doMes.length,
      ticket: ticketMedio(doMes),
      acumulado: acumN ? Math.round(acumSoma / acumN) : 0,
    }
  })
  const max = Math.max(...meses.map(m => m.ticket), 1)
  const delta = ticketAnterior ? Math.round(((ticketAno - ticketAnterior) / ticketAnterior) * 100) : null

  return (
    <div className="mt-3 rounded-2xl border border-gold/25 bg-black/55 backdrop-blur-md px-4 sm:px-6 py-4 sm:py-5">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-5">
        <div>
          <p className="text-gold/80 text-[9px] sm:text-[10px] tracking-[0.25em] uppercase">Evolução do ticket médio</p>
          <p className="text-white/45 text-[10px] sm:text-[11px] mt-1">Média por mês do evento · linha dourada = média acumulada no ano</p>
        </div>
        <div className="flex items-center gap-4 text-right">
          <div>
            <p className="text-white/40 text-[9px] tracking-[0.2em] uppercase">{anoFiltro - 1}</p>
            <p className="text-white/70 text-sm font-light">{ticketAnterior === null ? '…' : ticketAnterior ? `${ticketAnterior.toLocaleString('pt-PT')} €` : 'sem dados'}</p>
          </div>
          <div>
            <p className="text-gold/70 text-[9px] tracking-[0.2em] uppercase">{anoFiltro}</p>
            <p className="text-gold text-sm font-light">{ticketAno.toLocaleString('pt-PT')} €</p>
          </div>
          {delta !== null && (
            <span className={`text-xs px-2 py-1 rounded-full border ${delta >= 0 ? 'text-green-300 border-green-400/30 bg-green-500/10' : 'text-red-300 border-red-400/30 bg-red-500/10'}`}>
              {delta >= 0 ? '+' : ''}{delta}%
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-1 sm:gap-2 items-end h-40">
        {meses.map(m => (
          <div key={m.mes} className="relative h-full flex flex-col justify-end items-center group">
            {m.acumulado > 0 && (
              <div className="absolute left-0 right-0 border-t border-gold/70 pointer-events-none" style={{ bottom: `${(m.acumulado / max) * 80}%` }} />
            )}
            {m.ticket > 0 && (
              <span className="text-[8px] sm:text-[10px] text-white/60 mb-1 whitespace-nowrap">{Math.round(m.ticket / 100) / 10}k</span>
            )}
            <div className={`w-full rounded-t-md ${m.ticket > 0 ? 'bg-white/20 group-hover:bg-gold/40' : 'bg-white/5'} transition-colors`}
              style={{ height: m.ticket > 0 ? `${(m.ticket / max) * 80}%` : '2px' }}
              title={m.ticket > 0 ? `${m.mes}: ${m.ticket.toLocaleString('pt-PT')} € (${m.n} eventos) · acumulado ${m.acumulado.toLocaleString('pt-PT')} €` : `${m.mes}: sem eventos`} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-12 gap-1 sm:gap-2 mt-2">
        {meses.map(m => (
          <div key={m.mes} className="text-center">
            <p className="text-[8px] sm:text-[10px] text-white/50 uppercase tracking-wider">{m.mes}</p>
            <p className="text-[8px] sm:text-[9px] text-white/30">{m.n || ''}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function Eventos2026Inner() {
  const [events, setEvents] = useState<Evento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [tipoFilter, setTipoFilter] = useState('Todos')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showNovoEvento, setShowNovoEvento] = useState(false)
  const [showTicketEvolucao, setShowTicketEvolucao] = useState(false)
  // Set de referencias com portal ativo (existe row em `portais`)
  const [portaisAtivos, setPortaisAtivos] = useState<Set<string>>(new Set())
  // Map ref(upper) → ISO timestamp do backup confirmado em /eventos-2026/[id]
  const [backupsFeitos, setBackupsFeitos] = useState<Map<string, string>>(new Map())
  // Map ref(upper) → datas de envio das Ações Fotografia (portal settings)
  const [acoesFoto, setAcoesFoto] = useState<Map<string, AcoesFoto>>(new Map())
  const router = useRouter()
  const searchParams = useSearchParams()
  const anoFiltro = parseInt(searchParams.get('ano') ?? '2026')

  async function handleDelete(e: React.MouseEvent, supabaseId: string, notionId: string | undefined, referencia?: string) {
    e.preventDefault(); e.stopPropagation()
    if (!confirm('Eliminar este evento? Esta ação não pode ser desfeita.')) return
    setDeletingId(supabaseId)
    const notionPageId = notionId ?? supabaseId
    const qs = new URLSearchParams()
    if (referencia) qs.set('referencia', referencia)
    qs.set('supabaseId', supabaseId)
    await fetch(`/api/eventos-notion/${notionPageId}?${qs}`, { method: 'DELETE' })
    setEvents(prev => prev.filter(ev => ev.id !== supabaseId))
    setDeletingId(null)
  }

  function loadEvents() {
    setLoading(true)
    fetch(`/api/eventos-supabase?ano=${anoFiltro}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setEvents(d.events ?? [])
        setLoading(false)
      })
      .catch(() => { setError('Erro de ligação'); setLoading(false) })
  }

  function loadPortais() {
    fetch('/api/portais?compact=1')
      .then(r => r.json())
      .then(d => {
        const list = (d.portais ?? d.rows ?? []) as Array<{ referencia?: string | null; settings?: any }>
        const s = new Set<string>()
        const bk = new Map<string, string>()
        const af = new Map<string, AcoesFoto>()
        list.forEach(p => {
          if (p.referencia) {
            const ref = p.referencia.toUpperCase()
            s.add(ref)
            const ts = p.settings?.armazenamento_backup
            if (ts && typeof ts === 'string') bk.set(ref, ts)
            af.set(ref, {
              galerias: p.settings?.galerias_enviada ?? null,
              selecao:  p.settings?.selecao_enviada ?? null,
              finais:   p.settings?.fotos_finais_enviada ?? null,
            })
          }
        })
        setPortaisAtivos(s)
        setBackupsFeitos(bk)
        setAcoesFoto(af)
      })
      .catch(() => {/* silencioso */})
  }

  useEffect(() => { loadEvents(); loadPortais() }, [anoFiltro])

  const filtered = events.filter(e => {
    const matchAno = !e.data_evento || e.data_evento.startsWith(String(anoFiltro))
    const matchSearch = !search ||
      e.cliente?.toLowerCase().includes(search.toLowerCase()) ||
      e.local?.toLowerCase().includes(search.toLowerCase()) ||
      e.referencia?.toLowerCase().includes(search.toLowerCase())
    const matchTipo = tipoFilter === 'Todos' || e.tipo_evento?.includes(tipoFilter)
    return matchAno && matchSearch && matchTipo
  })

  const grouped = groupByMonth(filtered)
  const totalValor = events.reduce((s, e) => s + (e.valor_liquido ?? 0), 0)
  const totalFoto = events.reduce((s, e) => s + (e.valor_real_foto ?? 0), 0)
  const totalVideo = events.reduce((s, e) => s + (e.valor_liquido ?? 0), 0)
  const totalGeral = totalFoto + totalVideo
  const ticketAno = ticketMedio(events)
  const eventosComValor = events.filter(e => valorEvento(e) > 0).length
  const casamentosCount = events.filter(e => (e.tipo_evento ?? []).includes('CASAMENTO')).length

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const upcoming = events
    .filter(e => e.data_evento && new Date(e.data_evento + 'T00:00:00') >= today)
    .slice(0, 3)
  const realizados = events.filter(e => e.data_evento && new Date(e.data_evento + 'T00:00:00') < today).length
  const heroSrc = [2026, 2027, 2028].includes(anoFiltro) ? `/eventos-hero-${anoFiltro}.webp` : '/eventos-hero-2026.webp'

  return (
    <main className="min-h-screen px-3 sm:px-6 py-6 sm:py-10 max-w-[1200px] mx-auto">

      {/* ── CABEÇALHO (banner com foto) ── */}
      <section className="relative rounded-3xl border border-white/10 mb-8 min-h-[460px] sm:min-h-[420px] flex flex-col">
        <div className="absolute inset-0 rounded-3xl overflow-hidden">
          <img src={heroSrc} alt="" className="absolute inset-0 w-full h-full object-cover object-[center_40%]" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/30" />
        </div>

        <div className="relative flex-1 flex flex-col px-5 sm:px-10 pt-5 sm:pt-7 pb-5 sm:pb-7">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <Link href="/casamentos" className="text-xs tracking-[0.3em] text-white/50 hover:text-gold transition-colors uppercase pt-2">
              ‹ Casamentos
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="[&>div>button]:bg-black/40 [&>div>button]:backdrop-blur-md [&>div>button]:border-white/20">
                <ReferenciasDropdown events={events} anoFiltro={anoFiltro} />
              </div>
              <button onClick={() => setShowNovoEvento(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold text-black font-bold text-xs tracking-widest hover:bg-[#d8b85a] hover:shadow-[0_8px_30px_-8px_rgba(201,168,76,0.6)] transition-all uppercase">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                </svg>
                Novo Evento
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center py-8 max-w-2xl">
            <p className="text-[10px] tracking-[0.45em] uppercase text-white/45">RL Photo.Video · Temporada {anoFiltro}</p>
            <h1 className="font-cormorant font-light text-gold text-5xl sm:text-7xl tracking-[0.08em] leading-none mt-3">
              Casamentos <span className="italic">{anoFiltro}</span>
            </h1>
            <div className="w-20 h-px bg-gold/70 my-5" />
            <p className="font-cormorant italic text-white/80 text-lg sm:text-xl leading-snug">
              {loading ? 'A carregar eventos…' : `${casamentosCount} casamentos · ${events.length} eventos no total · ${realizados} já realizados`}
            </p>
          </div>

          {!loading && !error && events.length > 0 && (
            <>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md px-4 sm:px-5 py-3 sm:py-4">
                <p className="text-white/50 text-[9px] sm:text-[10px] tracking-[0.25em] uppercase mb-1.5 sm:mb-2">Fotografia</p>
                <p className="text-xl sm:text-2xl font-light text-white">{totalFoto.toLocaleString('pt-PT')} <span className="text-white/40 text-base">€</span></p>
                <p className="text-white/45 text-[10px] sm:text-[11px] mt-1">Valor total</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md px-4 sm:px-5 py-3 sm:py-4">
                <p className="text-white/50 text-[9px] sm:text-[10px] tracking-[0.25em] uppercase mb-1.5 sm:mb-2">Vídeo</p>
                <p className="text-xl sm:text-2xl font-light text-white">{totalVideo.toLocaleString('pt-PT')} <span className="text-white/40 text-base">€</span></p>
                <p className="text-white/45 text-[10px] sm:text-[11px] mt-1">Valor total</p>
              </div>
              <div className="rounded-2xl border border-gold/40 bg-black/45 backdrop-blur-md px-4 sm:px-5 py-3 sm:py-4">
                <p className="text-gold/80 text-[9px] sm:text-[10px] tracking-[0.25em] uppercase mb-1.5 sm:mb-2">Total Geral</p>
                <p className="text-xl sm:text-2xl font-light text-gold">{totalGeral.toLocaleString('pt-PT')} <span className="text-gold/60 text-base">€</span></p>
                <p className="text-gold/55 text-[10px] sm:text-[11px] mt-1">Foto + vídeo</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md px-4 sm:px-5 py-3 sm:py-4">
                <p className="text-white/50 text-[9px] sm:text-[10px] tracking-[0.25em] uppercase mb-1.5 sm:mb-2">Realizados</p>
                <p className="text-xl sm:text-2xl font-light text-white">{realizados} <span className="text-white/40 text-base">de {events.length}</span></p>
                <div className="h-1 rounded-full bg-white/10 mt-2 overflow-hidden">
                  <div className="h-full bg-gold/80 rounded-full" style={{ width: `${events.length ? (realizados / events.length) * 100 : 0}%` }} />
                </div>
              </div>
              <div className="relative col-span-2 lg:col-span-1 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md px-4 sm:px-5 py-3 sm:py-4">
                <button onClick={() => setShowTicketEvolucao(v => !v)}
                  aria-label={showTicketEvolucao ? 'Fechar evolução do ticket médio' : 'Ver evolução do ticket médio'}
                  title="Evolução do ticket médio"
                  className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full border flex items-center justify-center transition-all ${showTicketEvolucao ? 'border-gold bg-gold text-black' : 'border-gold/50 text-gold hover:bg-gold/15'}`}>
                  <svg className={`w-3.5 h-3.5 transition-transform ${showTicketEvolucao ? 'rotate-45' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                  </svg>
                </button>
                <p className="text-white/50 text-[9px] sm:text-[10px] tracking-[0.25em] uppercase mb-1.5 sm:mb-2">Ticket Médio</p>
                <p className="text-xl sm:text-2xl font-light text-white">{ticketAno.toLocaleString('pt-PT')} <span className="text-white/40 text-base">€</span></p>
                <p className="text-white/45 text-[10px] sm:text-[11px] mt-1">Por evento · {eventosComValor} com valor</p>
              </div>
            </div>
            {showTicketEvolucao && <TicketEvolucao events={events} anoFiltro={anoFiltro} ticketAno={ticketAno} />}
            </>
          )}
        </div>
      </section>
      {showNovoEvento && (
        <NovoEventoModal onClose={() => setShowNovoEvento(false)} onCreated={loadEvents} anoFiltro={anoFiltro} totalEventos={events.length} />
      )}

      {/* Próximos eventos */}
      {!loading && !error && upcoming.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-[10px] tracking-[0.4em] uppercase text-white/35">Próximos eventos</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {upcoming.map((e, i) => {
              const days = daysUntil(e.data_evento)
              const dt = new Date(e.data_evento + 'T00:00:00')
              const isToday = days === 0
              return (
                <Link key={e.id} href={`/eventos-2026/${e.notion_id ?? e.id}`} className={`ev-next${i === 0 ? ' is-first' : ''}`}>
                  <span className="ev-next-sweep" />
                  <div className="ev-next-top">
                    <div className="ev-next-count">
                      <span className="ev-next-num">{isToday ? 'Hoje' : days}</span>
                      {!isToday && <span className="ev-next-unit">{days === 1 ? 'dia' : 'dias'}</span>}
                    </div>
                    {i === 0 && <span className="ev-next-badge">{isToday ? 'Hoje' : 'Próximo'}</span>}
                  </div>
                  <div className="ev-next-rule" />
                  <div className="ev-next-body">
                    <p className="ev-next-name">{e.cliente || e.referencia}</p>
                    <p className="ev-next-ref">{e.referencia || 's/referência'}</p>
                    <p className="ev-next-meta">{String(dt.getDate()).padStart(2, '0')} {MESES_FULL[dt.getMonth()]} · {e.local || '—'}</p>
                  </div>
                  <div className="ev-next-foot">
                    <div className="ev-next-tags">
                      {(e.tipo_evento ?? []).map(t => <span key={t} className="ev-next-tag">{t}</span>)}
                    </div>
                    <span className="ev-next-arrow">→</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}


      {/* Filtros */}
      <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-10">
        <input
          type="text"
          placeholder="Pesquisar cliente ou local..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-gold/40 w-full sm:w-72"
        />
        <select
          value={tipoFilter}
          onChange={e => setTipoFilter(e.target.value)}
          className="bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white/70 focus:outline-none focus:border-gold/40"
        >
          {['Todos','CASAMENTO','BATIZADO','ANIVERSÁRIO','SESSÃO FOTO','CORPORATIVO'].map(t => (
            <option key={t} value={t} className="bg-zinc-900">{t}</option>
          ))}
        </select>
        {(search || tipoFilter !== 'Todos') && (
          <button onClick={() => { setSearch(''); setTipoFilter('Todos') }}
            className="px-4 py-2.5 text-xs text-white/30 hover:text-white/60 tracking-widest uppercase transition-colors">
            Limpar
          </button>
        )}
      </div>

      {loading && <div className="text-center py-32 text-white/20 tracking-widest text-xs uppercase">A carregar eventos...</div>}
      {error && <div className="text-center py-20 text-red-400/60 text-sm">{error}<br/><span className="text-white/20 text-xs mt-2 block">Partilha a base de dados EVENTOS 2026 com a integração RL Sync no Notion.</span></div>}

      {!loading && !error && (
        <div className="flex flex-col gap-12">
          {Object.entries(grouped).map(([monthKey, monthEvents]) => {
            const [year, month] = monthKey.split('-')
            const mesNome = MESES[parseInt(month) - 1]

            return (
              <section key={monthKey}>
                {/* Cabeçalho do mês */}
                <div className="flex items-baseline gap-4 mb-5 pt-4">
                  <span className="text-4xl font-bold text-white uppercase">{mesNome}</span>
                  <span className="text-white/20 text-lg">{year}</span>
                  <span className="text-white/15 text-sm">{monthEvents.length} eventos</span>
                  <div className="flex-1 h-px bg-white/8 ml-2" />
                </div>

                {/* Lista de eventos do mês */}
                <div className="flex flex-col gap-2">
                  {monthEvents.map(e => {
                    const backupTs = e.referencia ? backupsFeitos.get(e.referencia.toUpperCase()) : null
                    const hasBackup = !!backupTs
                    return (
                    <Link
                      key={e.id}
                      href={`/eventos-2026/${e.notion_id ?? e.id}`}
                      className={`group flex items-center gap-3 sm:gap-5 px-3 sm:px-5 py-3 sm:py-4 border rounded-xl transition-all cursor-pointer relative ${
                        hasBackup
                          ? 'bg-amber-500/[0.06] hover:bg-amber-500/[0.10] border-amber-400/30 hover:border-amber-400/55'
                          : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/[0.06] hover:border-gold/20'
                      }`}
                      style={hasBackup ? { boxShadow: '0 0 18px -8px rgba(251, 191, 36, 0.25)' } : undefined}
                    >

                      {/* Data */}
                      <div className="w-16 shrink-0 text-center">
                        <div className="text-2xl font-bold text-white leading-none">{new Date(e.data_evento + 'T00:00:00').getDate()}</div>
                        <div className="text-[10px] tracking-widest text-white/30 uppercase mt-0.5">{getDayOfWeek(e.data_evento)}</div>
                      </div>

                      <div className="w-px h-10 bg-white/8 shrink-0" />

                      {/* Cliente */}
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium text-sm truncate">{e.cliente || e.referencia || '—'}</div>
                        <div className="text-white/30 text-xs truncate mt-0.5 flex items-center gap-2">
                          <span className={`font-mono shrink-0 ${e.referencia ? 'text-gold/60' : 'text-white/20 italic'}`}>
                            {e.referencia || 's/referência'}
                          </span>
                          {(() => {
                            const ativo = e.referencia && portaisAtivos.has(e.referencia.toUpperCase())
                            return (
                              <span className={`shrink-0 text-[9px] tracking-widest uppercase font-bold ${ativo ? 'text-emerald-400/80' : 'text-white/25'}`}>
                                · Portal: {ativo ? 'Ativo' : 'Inativo'}
                              </span>
                            )
                          })()}
                          {e.local && <><span className="text-white/15 shrink-0">·</span><span className="truncate">{e.local}</span></>}
                        </div>
                      </div>

                      {/* Tipo */}
                      <div className="hidden sm:flex gap-1.5 shrink-0">
                        {(e.tipo_evento ?? []).map(t => (
                          <span key={t} className={`text-[10px] px-2 py-0.5 rounded-full border ${tipoColor[t] ?? 'bg-white/10 text-white/40 border-white/20'}`}>
                            {t}
                          </span>
                        ))}
                      </div>

                      {/* Backup OK — só quando armazenamento_backup está confirmado */}
                      {hasBackup && (
                        <span
                          className="inline-flex items-center gap-1.5 shrink-0 text-[10px] px-2.5 py-0.5 rounded-full border tracking-widest uppercase font-bold text-amber-300 bg-amber-400/15 border-amber-400/45"
                          title={`Backup confirmado em ${backupTs ? new Date(backupTs).toLocaleString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}`}
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          Backup OK
                        </span>
                      )}

                      {/* Equipa: Fotografo · Videografo · Editor */}
                      {(e.fotografo?.length > 0 || e.videografo?.length > 0 || e.editor_fotos) && (
                        <div className="hidden md:flex flex-col gap-0.5 shrink-0 max-w-[200px] text-[10px]">
                          {e.fotografo?.length > 0 && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-blue-400/40 tracking-widest uppercase text-[8px] shrink-0">F</span>
                              <span className="text-white/50 truncate">{e.fotografo.join(', ')}</span>
                            </div>
                          )}
                          {e.videografo?.length > 0 && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-pink-400/40 tracking-widest uppercase text-[8px] shrink-0">V</span>
                              <span className="text-white/50 truncate">{e.videografo.join(', ')}</span>
                            </div>
                          )}
                          {e.editor_fotos && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-emerald-400/40 tracking-widest uppercase text-[8px] shrink-0">E</span>
                              <span className="text-white/50 truncate">{e.editor_fotos}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Ações Fotografia — ícone por cada ação já enviada */}
                      {(() => {
                        const acoes = e.referencia ? acoesFoto.get(e.referencia.toUpperCase()) : undefined
                        const feitas = ACOES_FOTO.filter(a => acoes?.[a.chave])
                        if (feitas.length === 0) return null
                        // Tudo enviado → um só ícone a verde
                        if (feitas.length === ACOES_FOTO.length) {
                          const datas = ACOES_FOTO.map(a => `${a.label}: ${dataCurta(acoes![a.chave]!)}`).join(' · ')
                          return (
                            <div className="shrink-0 hidden sm:flex items-center gap-1"
                              title={`Serviço de foto concluído — ${datas}`}>
                              <span className="text-[11px] leading-none cursor-default" style={{ filter: FILTRO_VERDE }}>📷</span>
                              <span className="text-[10px] leading-none text-green-400 font-bold cursor-default">✓</span>
                            </div>
                          )
                        }
                        return (
                          <div className="shrink-0 hidden sm:flex items-center gap-2">
                            {feitas.map(a => (
                              <span
                                key={a.chave}
                                title={`${a.label} · enviado em ${dataCurta(acoes![a.chave]!)}`}
                                className="flex items-center gap-[1px] text-[11px] leading-none cursor-default opacity-90 hover:opacity-100 transition-opacity"
                              >
                                {Array.from({ length: a.icones }).map((_, n) => <span key={n}>📷</span>)}
                              </span>
                            ))}
                          </div>
                        )
                      })()}

                      {/* Estado das entregas */}
                      <div className="shrink-0 hidden sm:flex items-center gap-1 sm:pl-2 sm:border-l sm:border-white/8">
                        {(() => {
                          const isE = (v: string | null) => v === 'Entregue' || v === 'S/SERVIÇO'
                          const items = [
                            { label: '📷', val: e.fotos_edicao_estado, title: 'Fotos', colorir: false },
                            { label: '🎬', val: e.video_estado,        title: 'Vídeo', colorir: true },
                            { label: '📚', val: e.album_estado,        title: 'Álbum', colorir: false },
                          ]
                          // Sem colunas Supabase: fotos/álbum caem no boolean legado,
                          // mas o vídeo é sempre mostrado (null conta como "Aguardar")
                          const semColunas = items.every(i => i.val === null)
                          return (
                            <>
                              {semColunas && (e.fotos_enviadas
                                ? <span className="text-[10px] text-green-400/70 tracking-wider">✓ Entregue</span>
                                : <span className="text-[10px] text-white/15 tracking-wider">Pendente</span>)}
                              {items.map(({ label, val, title, colorir }) => {
                                if (semColunas && !colorir) return null
                                const filtro = colorir ? filtroVideo(val) : null
                                return (
                                  <span
                                    key={title}
                                    title={`${title}: ${val ?? 'Aguardar'}`}
                                    className={`text-[11px] ${filtro ? 'opacity-95' : isE(val) ? 'opacity-90' : 'opacity-20 grayscale'}`}
                                    style={filtro ? { filter: filtro } : undefined}
                                  >{label}</span>
                                )
                              })}
                            </>
                          )
                        })()}
                      </div>

                      {/* Valor */}
                      {e.valor_liquido && (
                        <div className="hidden sm:block text-gold text-sm font-semibold shrink-0 w-20 text-right">
                          {e.valor_liquido.toLocaleString('pt-PT')} €
                        </div>
                      )}

                      {/* Botão eliminar */}
                      <button
                        onClick={ev => handleDelete(ev, e.id, e.notion_id, e.referencia)}
                        disabled={deletingId === e.id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-1.5 rounded-lg hover:bg-red-500/15 text-white/20 hover:text-red-400 shrink-0"
                      >
                        {deletingId === e.id
                          ? <span className="text-[10px] text-white/30">...</span>
                          : <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                        }
                      </button>
                    </Link>
                    )
                  })}
                </div>

                {/* Total do mês */}
                <div className="flex justify-end mt-3">
                  <span className="text-xs text-white/20 tracking-widest">
                    Total: <span className="text-white/40 font-medium">
                      {monthEvents.reduce((s, e) => s + (e.valor_liquido ?? 0), 0).toLocaleString('pt-PT')} €
                    </span>
                  </span>
                </div>
              </section>
            )
          })}
        </div>
      )}
    </main>
  )
}

export default function Eventos2026() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white/20 tracking-widest text-xs uppercase">A carregar...</div>}>
      <Eventos2026Inner />
    </Suspense>
  )
}