'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { VideosDrawer } from './VideosDrawer'

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

  const inp = "w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 font-cond text-[15px] text-white/80 outline-none focus:border-gold/40 transition-colors placeholder:text-white/20"
  const lbl = "block font-cond text-[11px] text-white/40 tracking-[0.12em] uppercase mb-1"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-[#111111] border border-[#C9A84C]/25 rounded-[24px] p-6 max-h-[90vh] overflow-y-auto shadow-[0_0_80px_-24px_rgba(201,168,76,0.45)]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div><p className="font-cond text-[11px] font-medium tracking-[0.2em] uppercase text-[#C9A84C]">Temporada {anoFiltro}</p><h2 className="font-cond font-bold text-[30px] leading-none text-white mt-1.5">Novo evento</h2></div>
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
              className="px-4 py-2.5 rounded-full font-cond text-[15px] border border-white/10 text-white/50 hover:text-white transition-all">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="px-6 py-2.5 rounded-full border border-[#C9A84C]/55 bg-[#C9A84C]/15 font-cond text-[15px] font-semibold text-white hover:bg-[#C9A84C]/25 transition-all disabled:opacity-50">
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
        className="inline-flex items-center gap-2 rounded-full border border-white/[0.14] hover:border-white/30 bg-[#0e0e0e]/90 backdrop-blur-md px-5 py-2.5 font-cond font-semibold text-[15px] text-white transition-all"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        Referências
        <span className="font-cond text-[12px] font-normal text-[#C9A84C]/70">{totalUsadas}/{refsList.length}</span>
      </button>

      {open && (
        <>
          {/* Backdrop para fechar ao clicar fora */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          {/* Painel */}
          <div className="absolute right-0 mt-2 w-[min(95vw,460px)] max-h-[70vh] overflow-hidden z-50 rounded-[20px] border border-[#C9A84C]/25 bg-[#111111] shadow-[0_24px_60px_-18px_rgba(0,0,0,0.9),0_0_30px_-14px_rgba(201,168,76,0.5)]">
            {/* Tabs */}
            <div className="flex border-b border-white/[0.08] font-cond text-[12px] font-semibold">
              {(['CAS_RL', 'CAS_KP', 'BAT_RL', 'BAT_KP'] as const).map(p => (
                <button key={p} onClick={() => setPrefix(p)}
                  className={`flex-1 px-2 py-3 transition-colors ${prefix === p ? 'text-[#C9A84C] bg-[#C9A84C]/[0.06] border-b-2 border-[#C9A84C]' : 'text-white/40 hover:text-white/75'}`}>
                  {PREFIX_LABEL[p]}
                </button>
              ))}
            </div>
            {/* Legenda */}
            <div className="flex items-center justify-between px-4 py-2 font-cond text-[12px] text-white/45 border-b border-white/[0.06]">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#C9A84C]" /> Usada {totalUsadas}</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full border border-[#C9A84C]" /> Pendente {totalPendentes}</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-white/20" /> Livre {totalLivres}</span>
              </div>
              <span className="text-white/25">Ano {anoFiltro}</span>
            </div>
            {/* Lista */}
            <div className="overflow-y-auto max-h-[55vh] py-2">
              {refsList.map(r => {
                const styles = {
                  usada:    { dot: 'bg-[#C9A84C]',                text: 'text-white/80',       hover: 'hover:bg-[#C9A84C]/[0.06]', label: 'text-[#C9A84C]/70' },
                  pendente: { dot: 'border border-[#C9A84C]',     text: 'text-[#C9A84C]',      hover: 'hover:bg-[#C9A84C]/[0.06]', label: 'text-[#C9A84C]/60' },
                  livre:    { dot: 'bg-white/20',                 text: 'text-white/45',       hover: 'hover:bg-white/[0.04]',     label: 'text-white/30' },
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
                            ? 'border-[#C9A84C]/45 text-[#C9A84C] bg-[#C9A84C]/10 hover:bg-[#C9A84C]/20'
                            : 'border-white/15 text-white/40 hover:border-[#C9A84C]/45 hover:text-[#C9A84C]'
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

// Mesma regra da API (/api/eventos-supabase):
// FOTO = valor_real_foto ?? valor_foto · VÍDEO = valor_video ?? valor_liquido
function valorFoto(e: Evento) {
  return Number(e.valor_real_foto ?? e.valor_foto) || 0
}
function valorVideo(e: Evento) {
  return Number(e.valor_video ?? e.valor_liquido) || 0
}

// Ticket médio = só o valor do vídeo por evento, só conta eventos com valor
function valorEvento(e: Evento) {
  return valorVideo(e)
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
    <div className="mt-6 rounded-[22px] border border-[#C9A84C]/25 bg-[#111111]/80 backdrop-blur-md px-4 sm:px-6 py-4 sm:py-5">
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
            <span className={`font-cond text-[13px] px-2.5 py-1 rounded-full border ${delta >= 0 ? 'text-[#C9A84C] border-[#C9A84C]/40 bg-[#C9A84C]/15' : 'text-[#C9A84C]/60 border-[#C9A84C]/20 bg-transparent'}`}>
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
            <div className={`w-full rounded-t-md ${m.ticket > 0 ? 'bg-[#C9A84C]/25 group-hover:bg-[#C9A84C]/55' : 'bg-white/5'} transition-colors`}
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
  // Meses recolhidos (clicar no cabeçalho do mês)
  const [recolhidos, setRecolhidos] = useState<Set<string>>(new Set())
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
  const totalFoto = events.reduce((s, e) => s + valorFoto(e), 0)
  const totalVideo = events.reduce((s, e) => s + valorVideo(e), 0)
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

  // ── Interação: anos, saltar para o mês, recolher meses ───────────────────
  const ANOS = Array.from(new Set([2025, 2026, 2027, 2028, anoFiltro])).sort()
  const mesesComEventos = Object.keys(grouped)
  const contagemTipo = (t: string) => t === 'Todos' ? events.length : events.filter(e => (e.tipo_evento ?? []).includes(t)).length
  const alternarMes = (k: string) => setRecolhidos(prev => {
    const n = new Set(prev); if (n.has(k)) n.delete(k); else n.add(k); return n
  })
  const irParaMes = (k: string) => {
    setRecolhidos(prev => { const n = new Set(prev); n.delete(k); return n })
    document.getElementById(`mes-${k}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const pilula = (ativo: boolean) =>
    `shrink-0 rounded-full border px-3.5 py-1.5 font-cond text-[13.5px] font-medium transition-all ${ativo
      ? 'border-[#C9A84C]/60 bg-[#C9A84C]/15 text-[#C9A84C]'
      : 'border-white/[0.10] text-white/55 hover:border-[#C9A84C]/35 hover:text-white'}`
  const botaoTopo = 'inline-flex items-center gap-2 rounded-full bg-[#0e0e0e]/90 backdrop-blur-md font-cond font-semibold text-[15px] text-white px-5 py-2.5 transition-all'

  return (
    <main className="min-h-screen px-3 sm:px-6 py-6 sm:py-8 max-w-[1200px] mx-auto">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-[28px] border border-[#C9A84C]/20 mb-6">
        <img src={heroSrc} alt="" className="absolute inset-0 w-full h-full object-cover object-[center_40%] grayscale opacity-25" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(100deg, rgba(11,11,11,0.97) 0%, rgba(11,11,11,0.8) 50%, rgba(11,11,11,0.55) 100%)' }} />
        <div className="absolute inset-0 opacity-40" style={{
          backgroundImage: 'radial-gradient(rgba(201,168,76,0.18) 1px, transparent 1px)', backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(ellipse 60% 70% at 70% 40%, #000 20%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 60% 70% at 70% 40%, #000 20%, transparent 75%)',
        }} />

        <div className="relative px-5 sm:px-10 pt-5 sm:pt-6 pb-7 sm:pb-9">
          {/* Topo: voltar + ações */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <Link href="/casamentos" className="font-cond text-[14px] text-white/50 hover:text-[#C9A84C] transition-colors">
              ‹ Casamentos
            </Link>
            <div className="flex items-center gap-2.5 flex-wrap">
              <ReferenciasDropdown events={events} anoFiltro={anoFiltro} />
              <VideosDrawer />
              <button onClick={() => setShowNovoEvento(true)}
                className={`${botaoTopo} border border-[#C9A84C]/50 hover:border-[#C9A84C]/85 shadow-[0_0_28px_-12px_rgba(201,168,76,0.6)]`}>
                <svg className="w-3.5 h-3.5 text-[#C9A84C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Novo evento
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_300px] gap-8 lg:gap-14 items-center mt-10 sm:mt-14">
            {/* Título + ano */}
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <p className="font-cond text-[11px] font-medium tracking-[0.2em] uppercase text-[#C9A84C]">RL Photo.Video · Temporada</p>
                <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1">
                  {ANOS.map(a => (
                    <button key={a} onClick={() => router.push(`/eventos-2026?ano=${a}`)}
                      className={`rounded-full px-3 py-1 font-cond text-[13px] font-medium transition-all ${a === anoFiltro ? 'bg-[#C9A84C]/20 text-[#C9A84C]' : 'text-white/45 hover:text-white'}`}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              <h1 className="font-cond font-bold text-white text-[44px] sm:text-[66px] leading-[1.02] mt-4">
                Casamentos <span className="text-[#C9A84C]">{anoFiltro}</span>
              </h1>
              <p className="font-cond font-light text-white/60 text-lg sm:text-xl mt-3">
                {loading ? 'A carregar eventos…' : `${casamentosCount} casamentos · ${events.length} eventos no total · ${realizados} já realizados`}
              </p>
              {!loading && events.length > 0 && (
                <div className="mt-6 max-w-md">
                  <div className="flex items-center justify-between font-cond text-[12px] text-white/45 mb-1.5">
                    <span>Temporada realizada</span>
                    <span className="text-[#C9A84C]">{Math.round((realizados / events.length) * 100)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#C9A84C]/50 to-[#C9A84C] transition-all duration-700"
                      style={{ width: `${(realizados / events.length) * 100}%` }} />
                  </div>
                </div>
              )}
            </div>

            {/* Números da temporada */}
            {!loading && !error && events.length > 0 && (
              <aside className="rounded-[22px] border border-[#C9A84C]/30 bg-[#111111]/80 backdrop-blur-xl p-5 shadow-[0_0_48px_-22px_rgba(201,168,76,0.5)]">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-2 font-cond text-[11px] font-semibold tracking-[0.12em] uppercase text-white/85">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] shadow-[0_0_8px_#C9A84C]" />
                    Temporada em números
                  </p>
                  <button onClick={() => setShowTicketEvolucao(v => !v)}
                    title="Evolução do ticket médio"
                    aria-label={showTicketEvolucao ? 'Fechar evolução do ticket médio' : 'Ver evolução do ticket médio'}
                    className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all ${showTicketEvolucao ? 'border-[#C9A84C] bg-[#C9A84C]/25 text-[#C9A84C]' : 'border-[#C9A84C]/40 text-[#C9A84C] hover:bg-[#C9A84C]/15'}`}>
                    <svg className={`w-3.5 h-3.5 transition-transform ${showTicketEvolucao ? 'rotate-45' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
                <div className="grid grid-cols-2 mt-3">
                  {[
                    { rotulo: 'Fotografia', valor: totalFoto, sub: 'valor total' },
                    { rotulo: 'Vídeo', valor: totalVideo, sub: 'valor total' },
                    { rotulo: 'Total geral', valor: totalGeral, sub: 'foto + vídeo', destaque: true },
                    { rotulo: 'Ticket médio', valor: ticketAno, sub: `${eventosComValor} com valor` },
                  ].map((s, i) => (
                    <div key={s.rotulo}
                      className={`py-3 ${i % 2 === 0 ? 'pr-4 border-r border-white/[0.07]' : 'pl-4'} ${i < 2 ? 'border-b border-white/[0.07]' : ''}`}>
                      <p className="font-cond text-[11px] text-white/50">{s.rotulo}</p>
                      <p className={`font-cond font-semibold text-[21px] leading-none mt-1.5 ${s.destaque ? 'text-[#C9A84C]' : 'text-white'}`}>
                        {s.valor.toLocaleString('pt-PT')} <span className="text-[13px] font-normal text-white/40">€</span>
                      </p>
                      <p className="font-cond text-[10.5px] text-white/30 mt-1">{s.sub}</p>
                    </div>
                  ))}
                </div>
              </aside>
            )}
          </div>

          {showTicketEvolucao && <TicketEvolucao events={events} anoFiltro={anoFiltro} ticketAno={ticketAno} />}
        </div>
      </section>

      {showNovoEvento && (
        <NovoEventoModal onClose={() => setShowNovoEvento(false)} onCreated={loadEvents} anoFiltro={anoFiltro} totalEventos={events.length} />
      )}

      {/* ── PRÓXIMOS EVENTOS ─────────────────────────────────────────────── */}
      {!loading && !error && upcoming.length > 0 && (
        <section className="mb-8">
          <p className="font-cond text-[11px] font-medium tracking-[0.2em] uppercase text-[#C9A84C]">Agenda</p>
          <h2 className="font-cond font-semibold text-white text-[28px] leading-tight mt-1 mb-4">Próximos eventos</h2>
          <div className="relative">
            <div className="hidden sm:block absolute left-0 right-0 top-1/2 h-px bg-[#C9A84C]/10" />
            <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-4">
              {upcoming.map((e, i) => {
                const days = daysUntil(e.data_evento)
                const dt = new Date(e.data_evento + 'T00:00:00')
                const isToday = days === 0
                return (
                  <Link key={e.id} href={`/eventos-2026/${e.notion_id ?? e.id}`}
                    className="group relative block rounded-[22px] border border-[#C9A84C]/20 bg-[#111111]/95 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#C9A84C]/50 hover:shadow-[0_0_40px_-18px_rgba(201,168,76,0.6)]"
                    style={{ borderLeft: `2px solid rgba(201,168,76,${i === 0 ? 0.85 : 0.4})` }}>
                    <div className="flex items-center gap-3.5">
                      <span className="w-12 h-12 shrink-0 rounded-full flex flex-col items-center justify-center bg-[#C9A84C]/12 text-[#C9A84C]"
                        style={{ background: 'rgba(201,168,76,0.12)' }}>
                        <span className="font-cond font-semibold text-[18px] leading-none">{isToday ? 'Hoje' : days}</span>
                        {!isToday && <span className="font-cond text-[9px] text-[#C9A84C]/70 mt-0.5">{days === 1 ? 'dia' : 'dias'}</span>}
                      </span>
                      <div className="min-w-0">
                        <p className="font-cond text-[10.5px] font-medium tracking-[0.18em] uppercase text-[#C9A84C]/80">
                          {i === 0 ? (isToday ? 'Hoje' : 'Próximo') : 'A seguir'}
                        </p>
                        <p className="font-cond font-semibold text-[18px] leading-tight text-white truncate mt-0.5">{e.cliente || e.referencia}</p>
                      </div>
                    </div>
                    <p className="font-cond text-[13px] text-white/45 mt-3 truncate">
                      {String(dt.getDate()).padStart(2, '0')} {MESES_FULL[dt.getMonth()]} · {e.local || '—'}
                    </p>
                    <div className="flex items-center justify-between gap-2 mt-3">
                      <span className="font-cond text-[12px] text-[#C9A84C]/60">{e.referencia || 's/referência'}</span>
                      <span className="text-white/25 group-hover:text-[#C9A84C] group-hover:translate-x-0.5 transition-all">→</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── FILTROS (ficam presos no topo ao descer) ───────────────────────── */}
      <div className="sticky top-0 z-20 -mx-3 sm:-mx-6 px-3 sm:px-6 py-3 mb-6 bg-[#0b0b0b]/90 backdrop-blur-md border-b border-[#C9A84C]/10">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <svg viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" aria-hidden>
              <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
            </svg>
            <input type="text" placeholder="Procurar cliente, local ou referência…" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full rounded-full border border-white/[0.10] bg-white/[0.03] pl-10 pr-4 py-2 font-cond text-[14px] text-white placeholder-white/30 focus:outline-none focus:border-[#C9A84C]/45" />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {['Todos', ...TIPOS_EVENTO].map(t => {
              const n = contagemTipo(t)
              if (t !== 'Todos' && n === 0) return null
              return (
                <button key={t} onClick={() => setTipoFilter(t)} className={pilula(tipoFilter === t)}>
                  {t === 'Todos' ? 'Todos' : t.charAt(0) + t.slice(1).toLowerCase()} <span className="opacity-60">{n}</span>
                </button>
              )
            })}
          </div>
          {(search || tipoFilter !== 'Todos') && (
            <button onClick={() => { setSearch(''); setTipoFilter('Todos') }}
              className="font-cond text-[13px] text-white/40 hover:text-[#C9A84C] px-2 transition-colors">
              Limpar
            </button>
          )}
        </div>
        {/* Saltar para o mês */}
        {mesesComEventos.length > 1 && (
          <div className="flex items-center gap-1.5 mt-2 overflow-x-auto">
            <span className="font-cond text-[11px] tracking-[0.15em] uppercase text-white/30 mr-1 shrink-0">Ir para</span>
            {mesesComEventos.map(k => (
              <button key={k} onClick={() => irParaMes(k)}
                className="shrink-0 rounded-full px-2.5 py-1 font-cond text-[12.5px] text-white/50 hover:text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-colors">
                {MESES[parseInt(k.slice(5, 7)) - 1]} <span className="text-white/25">{grouped[k].length}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && <div className="text-center py-32 font-cond text-[15px] text-white/30">A carregar eventos…</div>}
      {error && <div className="text-center py-20 font-cond text-[15px] text-white/50">{error}<br /><span className="text-white/25 text-[13px] mt-2 block">Partilha a base de dados EVENTOS 2026 com a integração RL Sync no Notion.</span></div>}
      {!loading && !error && mesesComEventos.length === 0 && (
        <div className="text-center py-24 font-cond text-[16px] text-white/35">Nenhum evento com estes filtros.</div>
      )}

      {/* ── MESES ────────────────────────────────────────────────────────── */}
      {!loading && !error && (
        <div className="flex flex-col gap-10">
          {Object.entries(grouped).map(([monthKey, monthEvents]) => {
            const [year, month] = monthKey.split('-')
            const fechado = recolhidos.has(monthKey)
            const totalMes = monthEvents.reduce((s, e) => s + (e.valor_liquido ?? 0), 0)
            return (
              <section key={monthKey} id={`mes-${monthKey}`} className="scroll-mt-32">
                {/* Cabeçalho do mês: clica para recolher */}
                <button onClick={() => alternarMes(monthKey)} className="group w-full flex items-end gap-3 sm:gap-4 mb-4 text-left">
                  <div>
                    <p className="font-cond text-[11px] font-medium tracking-[0.2em] uppercase text-[#C9A84C]/80">{year}</p>
                    <h2 className="font-cond font-bold text-white text-[30px] sm:text-[34px] leading-none mt-1">{MESES_FULL[parseInt(month) - 1]}</h2>
                  </div>
                  <span className="mb-1 rounded-full border border-[#C9A84C]/25 bg-[#C9A84C]/10 px-2.5 py-0.5 font-cond text-[12.5px] text-[#C9A84C]">
                    {monthEvents.length} {monthEvents.length === 1 ? 'evento' : 'eventos'}
                  </span>
                  {totalMes > 0 && (
                    <span className="mb-1 hidden sm:inline font-cond text-[13px] text-white/40">{totalMes.toLocaleString('pt-PT')} €</span>
                  )}
                  <div className="flex-1 h-px bg-[#C9A84C]/12 mb-3" />
                  <span className="mb-1.5 w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/40 group-hover:text-[#C9A84C] group-hover:border-[#C9A84C]/40 transition-all">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 transition-transform duration-300" style={{ transform: fechado ? 'rotate(-90deg)' : 'none' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                    </svg>
                  </span>
                </button>

                {!fechado && (
                  <div className="flex flex-col gap-2.5">
                    {monthEvents.map(e => {
                      const backupTs = e.referencia ? backupsFeitos.get(e.referencia.toUpperCase()) : null
                      const hasBackup = !!backupTs
                      const passado = daysUntil(e.data_evento) < 0
                      const portalAtivo = !!e.referencia && portaisAtivos.has(e.referencia.toUpperCase())
                      const acoes = e.referencia ? acoesFoto.get(e.referencia.toUpperCase()) : undefined
                      const isE = (v: string | null) => v === 'Entregue' || v === 'S/SERVIÇO'
                      const nivel = (v: string | null) => isE(v) ? 1 : (!v || v === 'Aguardar') ? 0.18 : 0.55
                      const entregas = [
                        { t: 'Fotos', v: e.fotos_edicao_estado, d: 'M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2zM12 17a4 4 0 100-8 4 4 0 000 8z' },
                        { t: 'Vídeo', v: e.video_estado, d: 'M15 10l4.55-2.28A1 1 0 0121 8.62v6.76a1 1 0 01-1.45.9L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
                        { t: 'Álbum', v: e.album_estado, d: 'M4 19.5A2.5 2.5 0 016.5 17H20V3H6.5A2.5 2.5 0 004 5.5v14zM20 17v4H6.5A2.5 2.5 0 014 18.5' },
                      ]
                      const equipa = [
                        ...(e.fotografo ?? []).map(n => ({ l: 'F', n, papel: 'Fotógrafo' })),
                        ...(e.videografo ?? []).map(n => ({ l: 'V', n, papel: 'Videógrafo' })),
                        ...(e.editor_fotos ? [{ l: 'E', n: e.editor_fotos, papel: 'Editor de fotos' }] : []),
                      ]
                      return (
                        <Link key={e.id} href={`/eventos-2026/${e.notion_id ?? e.id}`}
                          className="group relative flex items-center gap-3 sm:gap-4 rounded-[18px] border border-[#C9A84C]/[0.14] bg-[#111111]/90 px-3 sm:px-4 py-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#C9A84C]/45 hover:bg-[#141414] hover:shadow-[0_0_32px_-18px_rgba(201,168,76,0.6)]"
                          style={{ borderLeft: `2px solid rgba(201,168,76,${hasBackup ? 0.9 : passado ? 0.25 : 0.5})` }}>

                          {/* Data em círculo */}
                          <div className="w-12 h-12 shrink-0 rounded-full flex flex-col items-center justify-center"
                            style={{ background: `rgba(201,168,76,${passado ? 0.06 : 0.13})` }}>
                            <span className="font-cond font-semibold text-[18px] leading-none" style={{ color: `rgba(201,168,76,${passado ? 0.55 : 1})` }}>
                              {new Date(e.data_evento + 'T00:00:00').getDate()}
                            </span>
                            <span className="font-cond text-[9.5px] uppercase text-[#C9A84C]/55 mt-0.5">{getDayOfWeek(e.data_evento)}</span>
                          </div>

                          {/* Cliente */}
                          <div className="flex-1 min-w-0">
                            <p className="font-cond font-semibold text-[16.5px] text-white truncate">{e.cliente || e.referencia || '—'}</p>
                            <p className="font-cond text-[12.5px] text-white/40 truncate mt-0.5">
                              <span className={e.referencia ? 'text-[#C9A84C]/70' : 'italic'}>{e.referencia || 's/referência'}</span>
                              {e.local && <> · {e.local}</>}
                            </p>
                          </div>

                          {/* Tipo */}
                          <div className="hidden lg:flex gap-1.5 shrink-0">
                            {(e.tipo_evento ?? []).map(t => (
                              <span key={t} className="rounded-full border border-[#C9A84C]/25 px-2.5 py-0.5 font-cond text-[11.5px] text-[#C9A84C]/85">
                                {t.charAt(0) + t.slice(1).toLowerCase()}
                              </span>
                            ))}
                          </div>

                          {/* Portal e backup */}
                          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                            <span title={portalAtivo ? 'Portal ativo' : 'Sem portal'}
                              className={`rounded-full border px-2.5 py-0.5 font-cond text-[11.5px] ${portalAtivo ? 'border-[#C9A84C]/40 bg-[#C9A84C]/12 text-[#C9A84C]' : 'border-white/[0.08] text-white/30'}`}>
                              Portal
                            </span>
                            {hasBackup && (
                              <span title={`Backup confirmado em ${new Date(backupTs!).toLocaleString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
                                className="inline-flex items-center gap-1 rounded-full bg-[#C9A84C] px-2.5 py-0.5 font-cond text-[11.5px] font-semibold text-[#0b0b0b]">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                Backup
                              </span>
                            )}
                          </div>

                          {/* Equipa: iniciais em círculo, o nome aparece ao passar o rato */}
                          {equipa.length > 0 && (
                            <div className="hidden md:flex items-center -space-x-1.5 shrink-0">
                              {equipa.slice(0, 4).map((p, i) => (
                                <span key={i} title={`${p.papel}: ${p.n}`}
                                  className="w-7 h-7 rounded-full border border-[#0b0b0b] bg-[#1d1a14] flex items-center justify-center font-cond text-[11px] font-semibold text-[#C9A84C] transition-transform hover:-translate-y-0.5 hover:z-10">
                                  {p.l}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Ações Fotografia: 3 segmentos (galerias, seleção, finais) */}
                          <div className="hidden sm:flex items-center gap-[3px] shrink-0"
                            title={ACOES_FOTO.map(a => `${a.label}: ${acoes?.[a.chave] ? dataCurta(acoes[a.chave]!) : 'por enviar'}`).join(' · ')}>
                            {ACOES_FOTO.map(a => (
                              <span key={a.chave} className="w-2.5 h-1.5 rounded-full" style={{ background: acoes?.[a.chave] ? '#C9A84C' : 'rgba(201,168,76,0.15)' }} />
                            ))}
                          </div>

                          {/* Estado das entregas: ícones a dourado (cheio = entregue) */}
                          <div className="hidden sm:flex items-center gap-1.5 shrink-0 pl-3 border-l border-white/[0.07]">
                            {entregas.map(x => (
                              <svg key={x.t} viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
                                className="w-4 h-4" style={{ opacity: nivel(x.v) }} aria-label={`${x.t}: ${x.v ?? 'Aguardar'}`}>
                                <title>{`${x.t}: ${x.v ?? 'Aguardar'}`}</title>
                                <path d={x.d} />
                              </svg>
                            ))}
                          </div>

                          {/* Valor */}
                          {e.valor_liquido ? (
                            <div className="hidden sm:block font-cond font-semibold text-[15px] text-[#C9A84C] shrink-0 w-20 text-right">
                              {e.valor_liquido.toLocaleString('pt-PT')} €
                            </div>
                          ) : null}

                          {/* Eliminar (aparece ao passar o rato) */}
                          <button
                            onClick={ev => handleDelete(ev, e.id, e.notion_id, e.referencia)}
                            disabled={deletingId === e.id}
                            title="Eliminar evento"
                            className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 rounded-full flex items-center justify-center text-white/25 hover:text-[#C9A84C] hover:bg-[#C9A84C]/10 shrink-0">
                            {deletingId === e.id
                              ? <span className="font-cond text-[12px] text-white/40">…</span>
                              : <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" /></svg>}
                          </button>
                        </Link>
                      )
                    })}
                  </div>
                )}
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