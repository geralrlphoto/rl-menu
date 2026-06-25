'use client'

import { useEffect, useMemo, useState } from 'react'

type Pedido = {
  id: string; pedido: string; nome: string; email: string; telefone: string
  noivos: string | null; data_casamento: string | null; morada: string | null
  formato: string; quantidade: number; subtotal: number; portes: number; total: number
  mensagem: string | null; fotografias: string | null; comprovativo_url: string | null
  referencia: string | null; created_at: string
}

const GOLD = '#c8a866'
const eur = (n: any) => `${Number(n || 0).toFixed(2)} €`

// "DD/MM/AAAA" (com ou sem espaços) → timestamp; inválido → +infinito (fica no fim)
function weddingTs(s: string | null): number {
  if (!s) return Number.MAX_SAFE_INTEGER
  const p = s.replace(/\s/g, '').split('/').map(Number)
  if (p.length < 3 || !p[0] || !p[1] || !p[2]) return Number.MAX_SAFE_INTEGER
  return new Date(p[2], p[1] - 1, p[0]).getTime()
}

export default function PedidosFotos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [refs, setRefs] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('pedido_recente')

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

  async function guardarRef(id: string) {
    setSaving(id)
    try {
      await fetch('/api/pedidos-fotos', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, referencia: refs[id] ?? '' }),
      })
      setPedidos(prev => prev.map(p => p.id === id ? { ...p, referencia: (refs[id] ?? '').trim() || null } : p))
    } catch {}
    setSaving(null)
  }

  // Referências já atribuídas (distintas) — para o autocompletar
  const refsAtribuidas = useMemo(
    () => Array.from(new Set(pedidos.map(p => p.referencia).filter(Boolean) as string[])).sort(),
    [pedidos],
  )

  const visiveis = useMemo(() => {
    const q = search.trim().toLowerCase()
    let arr = pedidos
    if (q) {
      arr = arr.filter(p => [p.pedido, p.nome, p.noivos, p.email, p.telefone, p.referencia, p.data_casamento]
        .filter(Boolean).some(v => String(v).toLowerCase().includes(q)))
    }
    arr = [...arr]
    if (sort === 'pedido_recente') arr.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
    else if (sort === 'pedido_antigo') arr.sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''))
    else if (sort === 'casamento') arr.sort((a, b) => weddingTs(a.data_casamento) - weddingTs(b.data_casamento))
    else if (sort === 'cliente') arr.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''))
    return arr
  }, [pedidos, search, sort])

  const fmtDate = (iso: string) => { try { return new Date(iso).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) } catch { return iso } }
  const inputCls = 'bg-black/30 border border-white/[0.1] rounded-lg px-3 py-2 text-[12px] text-white/90 placeholder:text-white/25 focus:outline-none focus:border-[#c8a866]/40'

  return (
    <div>
      <datalist id="refs-atribuidas">
        {refsAtribuidas.map(r => <option key={r} value={r} />)}
      </datalist>

      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <p className="text-[11px] tracking-[0.3em] uppercase font-bold" style={{ color: GOLD }}>
          Pedidos de Fotos {!loading && <span className="text-white/35">· {visiveis.length}{visiveis.length !== pedidos.length ? `/${pedidos.length}` : ''}</span>}
        </p>
        <button onClick={load} className="text-[11px] tracking-widest uppercase text-white/45 hover:text-[#c8a866] transition-colors">↻ Atualizar</button>
      </div>

      {/* Pesquisa + ordenação */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-[13px]">⌕</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Pesquisar por cliente, noivos, email, referência, pedido…"
            className={inputCls + ' w-full pl-9'} />
          {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white text-[14px]">✕</button>}
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)} className={inputCls + ' [color-scheme:dark] cursor-pointer'}>
          <option value="pedido_recente">Pedido · mais recentes</option>
          <option value="pedido_antigo">Pedido · mais antigos</option>
          <option value="casamento">Data do casamento</option>
          <option value="cliente">Cliente (A–Z)</option>
        </select>
      </div>

      {loading ? (
        <p className="text-[13px] text-white/35">A carregar…</p>
      ) : visiveis.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/[0.1] py-16 text-center">
          <p className="text-[13px] text-white/35">{pedidos.length === 0 ? 'Ainda não há pedidos de fotografias.' : 'Sem resultados para esta pesquisa.'}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {visiveis.map(p => {
            const fotos = (p.fotografias ?? '').split(/\r?\n/).map(s => s.trim()).filter(Boolean)
            const dirty = (refs[p.id] ?? '') !== (p.referencia ?? '')
            return (
              <div key={p.id} className="rounded-2xl border border-white/[0.08] p-5"
                style={{ background: 'linear-gradient(158deg, rgba(255,255,255,0.025), rgba(200,168,102,0.02))' }}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-[14px] font-semibold" style={{ color: GOLD }}>{p.pedido}</p>
                    <p className="text-[12px] text-white/45">{fmtDate(p.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.referencia && <span className="text-[10px] px-2 py-0.5 rounded-full border tracking-widest uppercase font-bold bg-emerald-500/10 text-emerald-300 border-emerald-500/25 font-mono">{p.referencia}</span>}
                    <span className="text-[10px] px-2 py-0.5 rounded-full border tracking-widest uppercase font-bold bg-white/5 text-white/70 border-white/15">{p.formato}</span>
                    <span className="text-[13px] font-bold" style={{ color: GOLD }}>{eur(p.total)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 mt-4 text-[12px]">
                  <Info k="Cliente" v={p.nome} />
                  <Info k="Noivos" v={p.noivos} />
                  <Info k="Email" v={p.email} />
                  <Info k="Data casamento" v={p.data_casamento} />
                  <Info k="Telefone" v={p.telefone} />
                  <Info k="Quantidade" v={`${p.quantidade} foto(s) · ${eur(p.subtotal)} + portes ${p.portes > 0 ? eur(p.portes) : 'grátis'}`} />
                  {p.morada && <Info k="Morada" v={p.morada} />}
                  {fotos.length > 0 && <Info k="Nº fotografias" v={fotos.join(', ')} />}
                  {p.mensagem && <Info k="Mensagem" v={p.mensagem} />}
                </div>

                <div className="flex flex-wrap items-end gap-3 mt-4 pt-4 border-t border-white/[0.06]">
                  {p.comprovativo_url && (
                    <a href={p.comprovativo_url} target="_blank" rel="noopener noreferrer"
                      className="text-[11px] px-3 py-2 rounded-lg border border-white/10 text-white/65 hover:text-[#c8a866] hover:border-[#c8a866]/30 transition-all">
                      ↗ Ver comprovativo
                    </a>
                  )}
                  <div className="flex-1 min-w-[220px]">
                    <label className="block text-[10px] tracking-[0.2em] uppercase text-white/45 mb-1.5">Referência do casamento</label>
                    <div className="flex items-center gap-2">
                      <input list="refs-atribuidas" value={refs[p.id] ?? ''} onChange={e => setRefs(r => ({ ...r, [p.id]: e.target.value }))}
                        placeholder="ex: CAS_150_26_RL"
                        className="flex-1 bg-black/30 border border-white/[0.1] rounded-lg px-3 py-2 text-[12px] text-white/90 placeholder:text-white/25 focus:outline-none focus:border-[#c8a866]/40 font-mono" />
                      <button onClick={() => guardarRef(p.id)} disabled={!dirty || saving === p.id}
                        className="text-[11px] px-4 py-2 rounded-lg font-bold tracking-wider uppercase transition-all disabled:opacity-40"
                        style={{ background: dirty ? GOLD : 'rgba(255,255,255,0.06)', color: dirty ? '#0b0a08' : 'rgba(255,255,255,0.5)' }}>
                        {saving === p.id ? '…' : 'Guardar'}
                      </button>
                    </div>
                    {p.referencia && !dirty && <p className="text-[10px] text-emerald-300/70 mt-1.5">Associado a {p.referencia} — aparece na ficha dos noivos.</p>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Info({ k, v }: { k: string; v: any }) {
  if (!v) return null
  return (
    <p className="text-white/70"><span className="text-white/40">{k}: </span>{v}</p>
  )
}
