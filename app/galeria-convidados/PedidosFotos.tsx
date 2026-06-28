'use client'

import { useEffect, useMemo, useState } from 'react'

type Pedido = {
  id: string; pedido: string; nome: string; email: string; telefone: string
  noivos: string | null; data_casamento: string | null; morada: string | null
  formato: string; quantidade: number; subtotal: number; portes: number; total: number
  mensagem: string | null; fotografias: string | null; comprovativo_url: string | null
  referencia: string | null; estado: string | null; created_at: string
  origem: string | null; responsavel: string | null; metodo_pagamento: string | null; mbway_conta: string | null
}
type Evento = { referencia: string; cliente: string; data_evento: string }
type Grupo = { key: string; noivos: string; data: string | null; ts: number; itens: Pedido[] }

const GOLD = '#c8a866'
const PER_PAGE = 12
const eur = (n: any) => `${Number(n || 0).toFixed(2)} €`

function weddingTs(s: string | null): number {
  if (!s) return Number.MAX_SAFE_INTEGER
  const p = s.replace(/\s/g, '').split('/').map(Number)
  if (p.length < 3 || !p[0] || !p[1] || !p[2]) return Number.MAX_SAFE_INTEGER
  return new Date(p[2], p[1] - 1, p[0]).getTime()
}
function maxCreated(g: Grupo): number {
  return g.itens.reduce((m, p) => Math.max(m, new Date(p.created_at).getTime() || 0), 0)
}
// Capitaliza o nome dos noivos para apresentação (mantém "e"/"&" de ligação
// em minúscula): "rui e maria" → "Rui e Maria".
function capNoivos(s: string): string {
  return s.replace(/\S+/g, w => (w === 'e' || w === '&' || w === 'E') ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1))
}
// Normaliza o nome dos noivos para agrupar tolerante a variações de escrita:
// minúsculas, sem pontuação, sem o "e"/"&" de ligação e por ordem alfabética.
// "Ana e Rui", "Ana Rui", "Ana.Rui", "Rui e Ana" → "ana rui".
function normNoivos(s: string): string {
  return s.toLowerCase().replace(/[.&/_,\-]+/g, ' ').replace(/\s+/g, ' ').trim()
    .split(' ').filter(w => w && w !== 'e').sort().join(' ')
}
// Escolhe a melhor variante escrita do nome (prefere as que têm ligação "e"/"&",
// depois a mais comprida) para mostrar no cabeçalho do casamento.
function bestNoivos(itens: Pedido[]): string {
  const names = itens.map(p => (p.noivos || '').trim()).filter(Boolean)
  if (!names.length) return ''
  const comLigacao = names.filter(n => /(^|\s)(e|&)(\s|$)/i.test(n) || n.includes('&'))
  const pool = comLigacao.length ? comLigacao : names
  return pool.sort((a, b) => b.length - a.length)[0]
}

export default function PedidosFotos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [eventos, setEventos] = useState<Evento[]>([])
  const [loading, setLoading] = useState(true)
  const [refs, setRefs] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('casamento')
  const [formato, setFormato] = useState<'todas' | 'digital' | 'papel'>('todas')
  const [page, setPage] = useState(1)
  const [aberto, setAberto] = useState<string | null>(null)
  const [gruposAbertos, setGruposAbertos] = useState<Set<string>>(new Set())

  async function load() {
    setLoading(true)
    try {
      const d = await fetch('/api/pedidos-fotos').then(r => r.json())
      const list: Pedido[] = Array.isArray(d?.pedidos) ? d.pedidos : []
      setPedidos(list)
      const r: Record<string, string> = {}
      list.forEach(p => { r[p.id] = p.referencia ?? '' })
      setRefs(r)
    } catch {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  useEffect(() => {
    Promise.all([2025, 2026, 2027].map(a => fetch(`/api/eventos-supabase?ano=${a}`).then(r => r.json()).catch(() => ({}))))
      .then(results => {
        const byRef = new Map<string, Evento>()
        results.forEach(res => (res?.events ?? []).forEach((e: any) => {
          if (e.referencia && !byRef.has(e.referencia)) byRef.set(e.referencia, { referencia: e.referencia, cliente: e.cliente ?? '', data_evento: e.data_evento ?? '' })
        }))
        setEventos(Array.from(byRef.values()).sort((a, b) => (a.data_evento || '').localeCompare(b.data_evento || '')))
      }).catch(() => {})
  }, [])

  async function guardarRef(id: string, val: string) {
    const ref = (val ?? '').trim()
    setRefs(r => ({ ...r, [id]: ref }))
    setSaving(id)
    try {
      await fetch('/api/pedidos-fotos', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, referencia: ref }) })
      setPedidos(prev => prev.map(p => p.id === id ? { ...p, referencia: ref || null } : p))
    } catch {}
    setSaving(null)
  }

  async function guardarEstado(id: string, estado: string) {
    setPedidos(prev => prev.map(p => p.id === id ? { ...p, estado } : p))
    setSaving(id)
    try {
      await fetch('/api/pedidos-fotos', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, estado }) })
    } catch {}
    setSaving(null)
  }

  // Pesquisa
  const pesquisados = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return pedidos
    return pedidos.filter(p => [p.pedido, p.nome, p.noivos, p.email, p.telefone, p.referencia, p.data_casamento]
      .filter(Boolean).some(v => String(v).toLowerCase().includes(q)))
  }, [pedidos, search])

  // Contagens para os filtros de formato
  const fmtCounts = useMemo(() => ({
    todas: pesquisados.length,
    digital: pesquisados.filter(p => (p.formato || '').toLowerCase() === 'digital').length,
    papel: pesquisados.filter(p => (p.formato || '').toLowerCase() === 'papel').length,
  }), [pesquisados])

  // Filtro por formato (Ver todas / Só digital / Só papel)
  const filtrados = useMemo(() => {
    if (formato === 'todas') return pesquisados
    return pesquisados.filter(p => (p.formato || '').toLowerCase() === formato)
  }, [pesquisados, formato])

  // Agrupa por casamento (nome dos noivos + data)
  const grupos = useMemo(() => {
    const map = new Map<string, Grupo>()
    for (const p of filtrados) {
      const noivosRaw = (p.noivos || '').trim()
      const dataRaw = (p.data_casamento || '').trim()
      const noivosKey = normNoivos(noivosRaw)
      const dataKey = dataRaw.replace(/\s/g, '')
      const key = (noivosKey || dataKey) ? `${noivosKey}__${dataKey}` : '__sem__'
      if (!map.has(key)) map.set(key, { key, noivos: noivosRaw, data: dataRaw || null, ts: weddingTs(dataRaw || null), itens: [] })
      map.get(key)!.itens.push(p)
    }
    const arr = Array.from(map.values())
    arr.forEach(g => {
      g.itens.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
      g.noivos = bestNoivos(g.itens) // melhor variante escrita para o título
    })
    if (sort === 'casamento') arr.sort((a, b) => a.ts - b.ts)
    else if (sort === 'casamento_desc') arr.sort((a, b) => b.ts - a.ts)
    else if (sort === 'nome') arr.sort((a, b) => a.noivos.localeCompare(b.noivos))
    else arr.sort((a, b) => maxCreated(b) - maxCreated(a)) // recente
    return arr
  }, [filtrados, sort])

  useEffect(() => { setPage(1) }, [search, sort, formato])
  const totalPages = Math.max(1, Math.ceil(grupos.length / PER_PAGE))
  const pageGrupos = grupos.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  function toggleGrupo(key: string) {
    setGruposAbertos(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n })
  }

  const fmtDate = (iso: string) => { try { return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' }) } catch { return iso } }
  const optLabel = (e: Evento) => `${e.referencia}${e.cliente ? ` · ${e.cliente}` : ''}`
  const inputCls = 'bg-black/30 border border-white/[0.1] rounded-lg px-3 py-2 text-[12px] text-white/90 placeholder:text-white/25 focus:outline-none focus:border-[#c8a866]/40'

  const FmtBtn = ({ id, label, n }: { id: 'todas' | 'digital' | 'papel'; label: string; n: number }) => (
    <button onClick={() => setFormato(id)}
      className={`text-[12px] px-3 py-1.5 rounded-lg border tracking-wide transition-all ${formato === id ? 'bg-gold/15 border-gold/40 text-gold' : 'border-white/[0.08] text-white/45 hover:text-white/80'}`}
      style={formato === id ? { color: GOLD, borderColor: 'rgba(200,168,102,0.4)' } : {}}>
      {label} <span className="opacity-50">{n}</span>
    </button>
  )

  // Linha de uma encomenda (dentro de um grupo de casamento)
  const PedidoRow = (p: Pedido) => {
    const fotos = (p.fotografias ?? '').split(/\r?\n/).map(s => s.trim()).filter(Boolean)
    const cur = refs[p.id] ?? ''
    const refInList = !cur || eventos.some(e => e.referencia === cur)
    const open = aberto === p.id
    return (
      <div key={p.id} className="border-b border-white/[0.06] last:border-0">
        {/* Linha compacta */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 flex-wrap">
          <button onClick={() => setAberto(open ? null : p.id)} className="flex items-center gap-2.5 min-w-0 text-left flex-1">
            <span className="text-white/30 text-[12px] w-3 shrink-0">{open ? '▾' : '▸'}</span>
            <span className="min-w-0">
              <span className="text-[13px] font-semibold" style={{ color: GOLD }}>{p.pedido}</span>
              {p.origem === 'ticket' && <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full border tracking-widest uppercase font-bold align-middle" style={{ background: 'rgba(147,112,219,0.12)', borderColor: 'rgba(147,112,219,0.3)', color: '#c4b5fd' }}>Ticket</span>}
              <span className="text-[13px] text-white/80"> · {p.nome}</span>
              <span className="block text-[11px] text-white/40 mt-0.5 truncate">
                {p.quantidade} foto(s) · {eur(p.total)} · {p.formato}
              </span>
            </span>
          </button>
          <div className="flex items-center gap-2 shrink-0">
            <select value={p.estado === 'Entregue' ? 'Entregue' : 'Aguardar'} onChange={e => guardarEstado(p.id, e.target.value)} title="Estado do pedido"
              className="border rounded-lg px-2.5 py-1.5 text-[11px] font-semibold tracking-wide focus:outline-none cursor-pointer [color-scheme:dark]"
              style={p.estado === 'Entregue'
                ? { background: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.35)', color: '#6ee7b7' }
                : { background: 'rgba(234,179,8,0.10)', borderColor: 'rgba(234,179,8,0.30)', color: '#fcd34d' }}>
              <option value="Aguardar" className="bg-[#0e0c08] text-white">Aguardar</option>
              <option value="Entregue" className="bg-[#0e0c08] text-white">Entregue</option>
            </select>
            <select value={cur} onChange={e => guardarRef(p.id, e.target.value)} title="Referência do casamento"
              className="bg-black/30 border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-[11px] text-white/90 focus:outline-none focus:border-[#c8a866]/40 cursor-pointer [color-scheme:dark] font-mono max-w-[200px]"
              style={p.referencia ? { borderColor: 'rgba(110,200,140,0.35)' } : {}}>
              <option value="">— Atribuir referência —</option>
              {!refInList && cur && <option value={cur}>{cur} (atual)</option>}
              {eventos.map(e => <option key={e.referencia} value={e.referencia}>{optLabel(e)}</option>)}
            </select>
            {saving === p.id && <span className="text-[10px] text-[#c8a866]">…</span>}
          </div>
        </div>

        {/* Detalhes (expandido) */}
        {open && (
          <div className="px-4 pb-4 pt-1 ml-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-[12px] rounded-xl border border-white/[0.06] bg-black/20 p-4">
              <Info k="Email" v={p.email} />
              <Info k="Telefone" v={p.telefone} />
              <Info k="Noivos" v={p.noivos} />
              <Info k="Data casamento" v={p.data_casamento} />
              <Info k="Subtotal / portes" v={`${eur(p.subtotal)} + ${p.portes > 0 ? eur(p.portes) : 'grátis'}`} />
              <Info k="Recebido em" v={fmtDate(p.created_at)} />
              {p.responsavel && <Info k="Responsável" v={p.responsavel} />}
              {p.metodo_pagamento && <Info k="Pagamento" v={p.metodo_pagamento + (p.metodo_pagamento === 'MBWay' && p.mbway_conta ? ` · ${p.mbway_conta}` : '')} />}
              {p.morada && <Info k="Morada" v={p.morada} />}
              {fotos.length > 0 && <Info k="Nº fotografias" v={fotos.join(', ')} />}
              {p.mensagem && <Info k="Mensagem" v={p.mensagem} />}
            </div>
            {p.comprovativo_url && (
              <a href={p.comprovativo_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] mt-3 px-3 py-1.5 rounded-lg border border-gold/30 text-gold hover:bg-gold/10 transition-all">↗ Ver comprovativo</a>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <p className="text-[11px] tracking-[0.3em] uppercase font-bold" style={{ color: GOLD }}>
          Pedidos de Fotos {!loading && <span className="text-white/35">· {pedidos.length}</span>}
        </p>
        <button onClick={load} className="text-[11px] tracking-widest uppercase text-white/45 hover:text-[#c8a866] transition-colors">↻ Atualizar</button>
      </div>

      {/* Pesquisa + ordenação */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-[13px]">⌕</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar por noivos, cliente, email, referência, pedido…" className={inputCls + ' w-full pl-9'} />
          {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white text-[14px]">✕</button>}
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)} className={inputCls + ' [color-scheme:dark] cursor-pointer'}>
          <option value="casamento">Casamento · próximos</option>
          <option value="casamento_desc">Casamento · mais recentes</option>
          <option value="nome">Noivos (A–Z)</option>
          <option value="recente">Pedido mais recente</option>
        </select>
      </div>

      {/* Filtro por formato */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <FmtBtn id="todas" label="Ver todas" n={fmtCounts.todas} />
        <FmtBtn id="digital" label="Só digital" n={fmtCounts.digital} />
        <FmtBtn id="papel" label="Só papel" n={fmtCounts.papel} />
      </div>

      {loading ? (
        <p className="text-[13px] text-white/35">A carregar…</p>
      ) : pageGrupos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/[0.1] py-14 text-center">
          <p className="text-[13px] text-white/35">{pedidos.length === 0 ? 'Ainda não há pedidos de fotografias.' : 'Sem casamentos nesta vista.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pageGrupos.map(g => {
            const gOpen = gruposAbertos.has(g.key)
            const totalGrupo = g.itens.reduce((s, p) => s + Number(p.total || 0), 0)
            const nDigital = g.itens.filter(p => (p.formato || '').toLowerCase() === 'digital').length
            const nPapel = g.itens.filter(p => (p.formato || '').toLowerCase() === 'papel').length
            return (
              <div key={g.key} className="rounded-2xl border border-white/[0.07] overflow-hidden" style={{ background: 'rgba(255,255,255,0.015)' }}>
                {/* Cabeçalho do casamento */}
                <button onClick={() => toggleGrupo(g.key)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-white/[0.025] transition-colors">
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span className="text-white/30 text-[12px] w-3 shrink-0">{gOpen ? '▾' : '▸'}</span>
                    <span className="min-w-0">
                      <span className="text-[15px] font-light text-white/95" style={{ fontFamily: 'Georgia, serif' }}>
                        {g.noivos ? <>Casamento <span className="italic" style={{ color: GOLD }}>{capNoivos(g.noivos)}</span></> : <span className="text-white/55">Sem casamento definido</span>}
                      </span>
                      {g.data && <span className="text-[13px] text-white/55"> · {g.data}</span>}
                      <span className="block text-[11px] text-white/40 mt-0.5">
                        {g.itens.length} encomenda(s) · {eur(totalGrupo)}{nDigital ? ` · ${nDigital} digital` : ''}{nPapel ? ` · ${nPapel} papel` : ''}
                      </span>
                    </span>
                  </span>
                  <span className="text-[12px] px-2.5 py-1 rounded-full border shrink-0 font-semibold" style={{ borderColor: 'rgba(200,168,102,0.3)', color: GOLD }}>{g.itens.length}</span>
                </button>

                {/* Encomendas do casamento */}
                {gOpen && (
                  <div className="border-t border-white/[0.06]">
                    {g.itens.map(p => PedidoRow(p))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Paginação (casamentos) */}
      {!loading && grupos.length > 0 && (
        <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
          <span className="text-[11px] text-white/35">{(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, grupos.length)} de {grupos.length} casamento(s)</span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <PgBtn label="‹" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} />
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <PgBtn key={n} label={String(n)} active={n === page} onClick={() => setPage(n)} />
              ))}
              <PgBtn label="›" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PgBtn({ label, onClick, active, disabled }: { label: string; onClick: () => void; active?: boolean; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`min-w-[30px] h-8 px-2 rounded-lg text-[12px] border transition-all disabled:opacity-30 ${active ? 'bg-gold/20 border-gold/45 text-gold font-bold' : 'border-white/10 text-white/55 hover:text-gold hover:border-gold/30'}`}
      style={active ? { color: '#c8a866', borderColor: 'rgba(200,168,102,0.45)' } : {}}>{label}</button>
  )
}

function Info({ k, v }: { k: string; v: any }) {
  if (!v) return null
  return <p className="text-white/70"><span className="text-white/40">{k}: </span>{v}</p>
}
