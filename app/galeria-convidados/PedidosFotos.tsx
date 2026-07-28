'use client'

import { useEffect, useMemo, useState } from 'react'

type Pedido = {
  id: string; pedido: string; nome: string; email: string; telefone: string
  noivos: string | null; data_casamento: string | null; morada: string | null
  formato: string; quantidade: number; subtotal: number; portes: number; total: number
  mensagem: string | null; fotografias: string | null; comprovativo_url: string | null
  referencia: string | null; estado: string | null; created_at: string
  origem: string | null; responsavel: string | null; metodo_pagamento: string | null; mbway_conta: string | null
  enviado_para_id: string | null; enviado_para_ids?: string[] | null; enviado_para_nome: string | null; enviado_em: string | null
}
type Evento = { referencia: string; cliente: string; data_evento: string }
type Fotografo = { id: string; nome: string }
type Grupo = { key: string; noivos: string; data: string | null; ts: number; origem: 'ticket' | 'adquirir'; itens: Pedido[] }

const GOLD = '#c8a866'
const PER_PAGE = 12
const eur = (n: any) => `${Number(n || 0).toFixed(2)} €`

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
// Normaliza a data do casamento para "AAAAMMDD", tolerante ao formato escrito:
// "27/06/2026", "27 / 06 / 2026", "27-06-2026", "270626", "27062026",
// "2026-06-27" → "20260627". Formato desconhecido → devolve o original.
function canon(d: string, mo: string, y: string): string {
  const yy = y.length === 2 ? '20' + y : y.padStart(4, '0')
  return yy + mo.padStart(2, '0') + d.padStart(2, '0')
}
function normDate(s: string): string {
  const raw = (s || '').replace(/\s/g, '')
  let m = raw.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})$/)
  if (m) return canon(m[1], m[2], m[3])
  m = raw.match(/^(\d{4})[/.\-](\d{1,2})[/.\-](\d{1,2})$/)
  if (m) return canon(m[3], m[2], m[1])
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 6) return canon(digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 6))
  if (digits.length === 8) return canon(digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8))
  return raw.toLowerCase()
}
function tsFromNorm(c: string): number {
  if (!/^\d{8}$/.test(c)) return Number.MAX_SAFE_INTEGER
  return new Date(+c.slice(0, 4), +c.slice(4, 6) - 1, +c.slice(6, 8)).getTime()
}
// Apresentação: "270626" → "27/06/2026"; formato desconhecido fica como está.
function fmtDataCasamento(s: string | null): string {
  if (!s) return ''
  const c = normDate(s)
  return /^\d{8}$/.test(c) ? `${c.slice(6, 8)}/${c.slice(4, 6)}/${c.slice(0, 4)}` : s
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
  // Separa aquisições (link /adquirir-fotografias) dos tickets (origem='ticket').
  const [origemFiltro, setOrigemFiltro] = useState<'todas' | 'adquirir' | 'ticket'>('todas')
  const [page, setPage] = useState(1)
  const [aberto, setAberto] = useState<string | null>(null)
  const [gruposAbertos, setGruposAbertos] = useState<Set<string>>(new Set())
  const [fotografos, setFotografos] = useState<Fotografo[]>([])
  const [enviarSel, setEnviarSel] = useState<Record<string, string[]>>({})
  const [enviarFmt, setEnviarFmt] = useState<Record<string, 'todas' | 'digital' | 'papel'>>({})
  const [enviarOpen, setEnviarOpen] = useState<string | null>(null)
  // Encomendas excluídas do envio (por defeito envia-se tudo; o utilizador
  // desmarca as que NÃO quer enviar). Guarda os ids a excluir.
  const [naoEnviar, setNaoEnviar] = useState<Set<string>>(new Set())
  const toggleNaoEnviar = (id: string) => setNaoEnviar(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Record<string, any>>({})
  const [editSaving, setEditSaving] = useState(false)

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

  useEffect(() => {
    fetch('/api/freelancers').then(r => r.json()).then(d => {
      const fts = (d?.freelancers ?? []).filter((f: any) => String(f.status || '').toUpperCase() === 'FOTOGRAFO')
      setFotografos(fts.map((f: any) => ({ id: f.id, nome: f.nome })))
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

  async function apagarPedido(id: string, pedido: string) {
    if (!confirm(`Apagar a encomenda ${pedido}? Esta ação é irreversível.`)) return
    setSaving(id)
    try {
      await fetch('/api/pedidos-fotos', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
      setPedidos(prev => prev.filter(p => p.id !== id))
    } catch {}
    setSaving(null)
  }

  async function apagarGrupo(g: Grupo) {
    const ids = g.itens.map(p => p.id)
    const nome = g.noivos ? capNoivos(g.noivos) : 'sem casamento'
    if (!confirm(`Apagar TODAS as ${ids.length} encomenda(s) do casamento ${nome}${g.data ? ' · ' + g.data : ''}?\n\nEsta ação é irreversível.`)) return
    setSaving('grp:' + g.key)
    try {
      await fetch('/api/pedidos-fotos', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) })
      const idset = new Set(ids)
      setPedidos(prev => prev.filter(p => !idset.has(p.id)))
    } catch {}
    setSaving(null)
  }

  function iniciarEdicao(p: Pedido) {
    setEditandoId(p.id)
    setEditForm({
      nome: p.nome ?? '', email: p.email ?? '', telefone: p.telefone ?? '',
      noivos: p.noivos ?? '', data_casamento: p.data_casamento ?? '',
      formato: (p.formato || 'digital').toLowerCase(), quantidade: p.quantidade ?? 0,
      metodo_pagamento: p.metodo_pagamento ?? '', responsavel: p.responsavel ?? '',
      morada: p.morada ?? '', fotografias: p.fotografias ?? '', mensagem: p.mensagem ?? '',
    })
  }
  async function guardarEdicao(p: Pedido) {
    setEditSaving(true)
    const q = Math.max(0, parseInt(String(editForm.quantidade), 10) || 0)
    const fmt = String(editForm.formato).toLowerCase() === 'papel' ? 'papel' : 'digital'
    const subtotal = q * 5, portes = (fmt === 'papel' && q < 5) ? 4 : 0, total = subtotal + portes
    try {
      await fetch('/api/pedidos-fotos', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: p.id, fields: editForm }) })
      setPedidos(prev => prev.map(x => x.id === p.id ? { ...x, ...editForm, formato: fmt, quantidade: q, subtotal, portes, total } : x))
      setEditandoId(null)
    } catch {}
    setEditSaving(false)
  }

  async function enviarGrupo(g: Grupo) {
    const fids = enviarSel[g.key] ?? []
    if (fids.length === 0) { alert('Escolhe pelo menos um fotógrafo.'); return }
    const fmt = enviarFmt[g.key] ?? 'todas'
    const itens = g.itens.filter(p => (fmt === 'todas' ? true : (p.formato || '').toLowerCase() === fmt) && !naoEnviar.has(p.id))
    if (itens.length === 0) { alert('Não há encomendas selecionadas nesse formato para enviar.'); return }
    const nomes = fids.map(id => fotografos.find(x => x.id === id)?.nome).filter(Boolean) as string[]
    const nomeJoin = nomes.join(', ')
    const ids = itens.map(p => p.id)
    setSaving('env:' + g.key)
    try {
      await fetch('/api/pedidos-fotos', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids, enviado_para_ids: fids, enviado_para_nome: nomeJoin }) })
      const idset = new Set(ids)
      setPedidos(prev => prev.map(p => idset.has(p.id) ? { ...p, enviado_para_id: fids[0], enviado_para_ids: fids, enviado_para_nome: nomeJoin, enviado_em: new Date().toISOString() } : p))
      setEnviarOpen(null)
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

  // Contagens por origem (aquisição via link vs ticket)
  const origemCounts = useMemo(() => ({
    todas: pesquisados.length,
    ticket: pesquisados.filter(p => (p.origem || '') === 'ticket').length,
    adquirir: pesquisados.filter(p => (p.origem || '') !== 'ticket').length,
  }), [pesquisados])

  // Filtro por formato + por origem
  const filtrados = useMemo(() => {
    return pesquisados.filter(p => {
      const okFmt = formato === 'todas' || (p.formato || '').toLowerCase() === formato
      const isTicket = (p.origem || '') === 'ticket'
      const okOrigem = origemFiltro === 'todas' || (origemFiltro === 'ticket' ? isTicket : !isTicket)
      return okFmt && okOrigem
    })
  }, [pesquisados, formato, origemFiltro])

  // Agrupa por casamento (nome dos noivos + data) E por origem: as aquisições
  // por link nunca se misturam com os tickets, mesmo sendo do mesmo casamento.
  const grupos = useMemo(() => {
    const map = new Map<string, Grupo>()
    for (const p of filtrados) {
      const noivosRaw = (p.noivos || '').trim()
      const dataRaw = (p.data_casamento || '').trim()
      const noivosKey = normNoivos(noivosRaw)
      const dataKey = normDate(dataRaw)
      const origemCls: 'ticket' | 'adquirir' = (p.origem || '') === 'ticket' ? 'ticket' : 'adquirir'
      const baseKey = (noivosKey || dataKey) ? `${noivosKey}__${dataKey}` : '__sem__'
      const key = `${baseKey}__${origemCls}`
      if (!map.has(key)) map.set(key, { key, noivos: noivosRaw, data: dataRaw || null, ts: tsFromNorm(dataKey), origem: origemCls, itens: [] })
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

  useEffect(() => { setPage(1) }, [search, sort, formato, origemFiltro])
  const totalPages = Math.max(1, Math.ceil(grupos.length / PER_PAGE))
  const pageGrupos = grupos.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  function toggleGrupo(key: string) {
    setGruposAbertos(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n })
  }

  const fmtDate = (iso: string) => { try { return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' }) } catch { return iso } }
  const optLabel = (e: Evento) => `${e.referencia}${e.cliente ? ` · ${e.cliente}` : ''}`
  const inputCls = 'bg-black/30 border border-white/[0.1] rounded-lg px-3 py-2 text-[12px] text-white/90 placeholder:text-white/25 focus:outline-none focus:border-[#c8a866]/40'

  const editField = (label: string, key: string) => (
    <label className="block">
      <span className="text-[10px] tracking-widest uppercase text-white/40">{label}</span>
      <input value={editForm[key] ?? ''} onChange={e => setEditForm(s => ({ ...s, [key]: e.target.value }))} className={inputCls + ' w-full mt-1'} />
    </label>
  )

  const FmtBtn = ({ id, label, n }: { id: 'todas' | 'digital' | 'papel'; label: string; n: number }) => (
    <button onClick={() => setFormato(id)}
      className={`text-[12px] px-3 py-1.5 rounded-lg border tracking-wide transition-all ${formato === id ? 'bg-gold/15 border-gold/40 text-gold' : 'border-white/[0.08] text-white/45 hover:text-white/80'}`}
      style={formato === id ? { color: GOLD, borderColor: 'rgba(200,168,102,0.4)' } : {}}>
      {label} <span className="opacity-50">{n}</span>
    </button>
  )

  const OrigemBtn = ({ id, label, n }: { id: 'todas' | 'adquirir' | 'ticket'; label: string; n: number }) => (
    <button onClick={() => setOrigemFiltro(id)}
      className={`text-[12px] px-3 py-1.5 rounded-lg border tracking-wide transition-all ${origemFiltro === id ? 'bg-gold/15 border-gold/40 text-gold' : 'border-white/[0.08] text-white/45 hover:text-white/80'}`}
      style={origemFiltro === id ? { color: GOLD, borderColor: 'rgba(200,168,102,0.4)' } : {}}>
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
          <button onClick={() => toggleNaoEnviar(p.id)}
            title={naoEnviar.has(p.id) ? 'Excluída do envio — não vai para ninguém' : 'Será enviada'}
            className="shrink-0">
            <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] transition-all ${naoEnviar.has(p.id) ? 'border-white/20 text-transparent' : 'border-gold/50 bg-gold/15 text-gold'}`}>✓</span>
          </button>
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
            <button onClick={() => apagarPedido(p.id, p.pedido)} title="Apagar esta encomenda"
              className="w-7 h-7 rounded-lg border border-white/10 text-white/35 hover:text-red-400 hover:border-red-500/30 transition-all flex items-center justify-center shrink-0">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
            </button>
          </div>
        </div>

        {/* Detalhes (expandido) */}
        {open && (
          <div className="px-4 pb-4 pt-1 ml-6">
            {editandoId === p.id ? (
              /* Modo edição */
              <div className="rounded-xl border border-gold/20 bg-black/20 p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {editField('Cliente', 'nome')}
                  {editField('Email', 'email')}
                  {editField('Telefone', 'telefone')}
                  {editField('Nome dos noivos', 'noivos')}
                  {editField('Data casamento', 'data_casamento')}
                  <label className="block">
                    <span className="text-[10px] tracking-widest uppercase text-white/40">Formato</span>
                    <select value={editForm.formato} onChange={e => setEditForm(s => ({ ...s, formato: e.target.value }))} className={inputCls + ' w-full mt-1 [color-scheme:dark] cursor-pointer'}>
                      <option value="digital">Digital</option>
                      <option value="papel">Papel</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-[10px] tracking-widest uppercase text-white/40">Quantidade de fotos</span>
                    <input type="number" min={0} value={editForm.quantidade} onChange={e => setEditForm(s => ({ ...s, quantidade: e.target.value }))} className={inputCls + ' w-full mt-1'} />
                  </label>
                  <label className="block">
                    <span className="text-[10px] tracking-widest uppercase text-white/40">Pagamento</span>
                    <select value={editForm.metodo_pagamento} onChange={e => setEditForm(s => ({ ...s, metodo_pagamento: e.target.value }))} className={inputCls + ' w-full mt-1 [color-scheme:dark] cursor-pointer'}>
                      <option value="">—</option>
                      <option value="Numerário">Numerário</option>
                      <option value="MBWay">MBWay</option>
                      <option value="Multibanco">Multibanco</option>
                    </select>
                  </label>
                  {editField('Responsável', 'responsavel')}
                  {editField('Morada', 'morada')}
                  {editField('Nº fotografias', 'fotografias')}
                </div>
                <label className="block mt-3">
                  <span className="text-[10px] tracking-widest uppercase text-white/40">Mensagem</span>
                  <textarea value={editForm.mensagem} onChange={e => setEditForm(s => ({ ...s, mensagem: e.target.value }))} className={inputCls + ' w-full mt-1 min-h-[60px] resize-none'} />
                </label>
                <p className="text-[11px] text-white/45 mt-3">Total recalculado ao guardar: <b className="text-gold">{eur(Math.max(0, parseInt(String(editForm.quantidade), 10) || 0) * 5 + (String(editForm.formato).toLowerCase() === 'papel' && (parseInt(String(editForm.quantidade), 10) || 0) < 5 ? 4 : 0))}</b></p>
                <div className="flex items-center gap-2 mt-3">
                  <button onClick={() => guardarEdicao(p)} disabled={editSaving}
                    className="text-[11px] px-4 py-2 rounded-lg bg-gold text-black font-bold tracking-wider uppercase hover:bg-gold/90 transition-all disabled:opacity-50">
                    {editSaving ? 'A guardar…' : 'Guardar'}
                  </button>
                  <button onClick={() => setEditandoId(null)}
                    className="text-[11px] px-3 py-2 rounded-lg border border-white/15 text-white/55 tracking-wider uppercase hover:text-white/80 transition-all">
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              /* Modo leitura */
              <>
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
                <div className="flex items-center gap-2 mt-3">
                  <button onClick={() => iniciarEdicao(p)}
                    className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border border-gold/30 text-gold hover:bg-gold/10 transition-all">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    Editar
                  </button>
                  {p.comprovativo_url && (
                    <a href={p.comprovativo_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border border-gold/30 text-gold hover:bg-gold/10 transition-all">↗ Ver comprovativo</a>
                  )}
                </div>
              </>
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

      {/* Filtro por origem (aquisições via link vs tickets) */}
      <div className="flex items-center gap-2 mb-2.5 flex-wrap">
        <span className="text-[10px] tracking-[0.2em] uppercase text-white/30 mr-1">Origem</span>
        <OrigemBtn id="todas" label="Todas" n={origemCounts.todas} />
        <OrigemBtn id="adquirir" label="Aquisições (link)" n={origemCounts.adquirir} />
        <OrigemBtn id="ticket" label="Tickets" n={origemCounts.ticket} />
      </div>

      {/* Filtro por formato */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <span className="text-[10px] tracking-[0.2em] uppercase text-white/30 mr-1">Formato</span>
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
            // Nome do fotógrafo a quem o grupo foi enviado (só se todas as encomendas
            // estiverem enviadas para o mesmo).
            const enviadoNomes = new Set(g.itens.map(p => p.enviado_para_nome || ''))
            const enviadoNome = (enviadoNomes.size === 1 && !enviadoNomes.has('')) ? g.itens[0].enviado_para_nome : null
            return (
              <div key={g.key} className="rounded-2xl border border-white/[0.07] overflow-hidden" style={{ background: 'rgba(255,255,255,0.015)' }}>
                {/* Cabeçalho do casamento */}
                <div className="w-full flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-white/[0.025] transition-colors">
                  <button onClick={() => toggleGrupo(g.key)} className="flex items-center gap-2.5 min-w-0 text-left flex-1">
                    <span className="text-white/30 text-[12px] w-3 shrink-0">{gOpen ? '▾' : '▸'}</span>
                    <span className="min-w-0">
                      <span className="text-[15px] font-light text-white/95" style={{ fontFamily: 'Georgia, serif' }}>
                        {g.noivos ? <>Casamento <span className="italic" style={{ color: GOLD }}>{capNoivos(g.noivos)}</span></> : <span className="text-white/55">Sem casamento definido</span>}
                      </span>
                      <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded-full border tracking-widest uppercase font-bold align-middle"
                        style={g.origem === 'ticket'
                          ? { background: 'rgba(147,112,219,0.12)', borderColor: 'rgba(147,112,219,0.3)', color: '#c4b5fd' }
                          : { background: 'rgba(200,168,102,0.12)', borderColor: 'rgba(200,168,102,0.3)', color: '#e6c680' }}>
                        {g.origem === 'ticket' ? 'Tickets' : 'Aquisições'}
                      </span>
                      {g.data && <span className="text-[13px] text-white/55"> · {fmtDataCasamento(g.data)}</span>}
                      <span className="block text-[11px] text-white/40 mt-0.5">
                        {g.itens.length} encomenda(s) · {eur(totalGrupo)}{nDigital ? ` · ${nDigital} digital` : ''}{nPapel ? ` · ${nPapel} papel` : ''}
                        {enviadoNome && <span className="text-emerald-300/80"> · ✓ Enviado a {enviadoNome}</span>}
                      </span>
                    </span>
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Enviar a um ou vários fotógrafos (com escolha do formato) */}
                    <div className="relative">
                      <button
                        onClick={() => {
                          if (enviarOpen === g.key) { setEnviarOpen(null); return }
                          setEnviarSel(s => s[g.key] ? s : ({ ...s, [g.key]: (g.itens[0]?.enviado_para_ids ?? (g.itens[0]?.enviado_para_id ? [g.itens[0].enviado_para_id] : [])) }))
                          setEnviarOpen(g.key)
                        }}
                        title="Enviar estas encomendas a um ou vários fotógrafos"
                        className="text-[10px] px-2.5 py-1.5 rounded-lg border border-gold/35 text-gold hover:bg-gold/10 tracking-wide uppercase transition-all flex items-center gap-1">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                        {(enviarSel[g.key]?.length ?? 0) > 0 ? `Enviar · ${enviarSel[g.key].length}` : 'Enviar a…'}
                      </button>
                      {enviarOpen === g.key && (
                        <div className="absolute right-0 top-full mt-1.5 z-30 w-64 rounded-xl border border-white/12 bg-[#0e0c08] p-3 shadow-2xl" onClick={ev => ev.stopPropagation()}>
                          <p className="text-[9px] tracking-[0.2em] uppercase text-white/35 mb-1.5">Formato</p>
                          <div className="flex gap-1 mb-3">
                            {(['todas', 'digital', 'papel'] as const).map(fm => (
                              <button key={fm} onClick={() => setEnviarFmt(s => ({ ...s, [g.key]: fm }))}
                                className={`flex-1 text-[10px] px-2 py-1 rounded-md border transition-all ${(enviarFmt[g.key] ?? 'todas') === fm ? 'border-gold/60 bg-gold/10 text-gold' : 'border-white/10 text-white/50 hover:border-white/25'}`}>
                                {fm === 'todas' ? 'Todas' : fm === 'digital' ? 'Digital' : 'Papel'}
                              </button>
                            ))}
                          </div>
                          <p className="text-[9px] tracking-[0.2em] uppercase text-white/35 mb-1.5">Fotógrafos que veem</p>
                          <div className="max-h-40 overflow-y-auto flex flex-col gap-1 mb-3">
                            {fotografos.length === 0 && <p className="text-[11px] text-white/30 italic">Sem fotógrafos.</p>}
                            {fotografos.map(f => {
                              const sel = (enviarSel[g.key] ?? []).includes(f.id)
                              return (
                                <button key={f.id} onClick={() => setEnviarSel(s => { const cur = s[g.key] ?? []; return { ...s, [g.key]: sel ? cur.filter(x => x !== f.id) : [...cur, f.id] } })}
                                  className={`flex items-center gap-2 text-[11px] px-2 py-1.5 rounded-md border text-left transition-all ${sel ? 'border-gold/50 bg-gold/10 text-gold' : 'border-white/8 text-white/60 hover:border-white/20'}`}>
                                  <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[9px] shrink-0 ${sel ? 'border-gold bg-gold/20 text-gold' : 'border-white/25 text-transparent'}`}>✓</span>
                                  <span className="truncate">{f.nome}</span>
                                </button>
                              )
                            })}
                          </div>
                          {(() => {
                            const fmt = enviarFmt[g.key] ?? 'todas'
                            const n = g.itens.filter(p => (fmt === 'todas' ? true : (p.formato || '').toLowerCase() === fmt) && !naoEnviar.has(p.id)).length
                            return <p className="text-[10px] text-white/40 mb-2 text-center">{n} encomenda(s) serão enviadas{naoEnviar.size > 0 ? ' · algumas excluídas' : ''}</p>
                          })()}
                          <button onClick={() => enviarGrupo(g)} disabled={saving === 'env:' + g.key || (enviarSel[g.key]?.length ?? 0) === 0}
                            className="w-full text-[10px] px-2.5 py-2 rounded-lg border border-gold/40 bg-gold/5 text-gold hover:bg-gold/15 tracking-widest uppercase transition-all disabled:opacity-40">
                            {saving === 'env:' + g.key ? 'A enviar…' : 'Confirmar Envio'}
                          </button>
                        </div>
                      )}
                    </div>
                    <button onClick={() => apagarGrupo(g)} title="Apagar todas as encomendas deste casamento"
                      className="text-[10px] px-2.5 py-1.5 rounded-lg border border-red-500/25 text-red-300/80 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/40 tracking-wide uppercase transition-all flex items-center gap-1">
                      {saving === 'grp:' + g.key
                        ? 'A apagar…'
                        : <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg> Apagar todas</>}
                    </button>
                    <span className="text-[12px] px-2.5 py-1 rounded-full border font-semibold" style={{ borderColor: 'rgba(200,168,102,0.3)', color: GOLD }}>{g.itens.length}</span>
                  </div>
                </div>

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
