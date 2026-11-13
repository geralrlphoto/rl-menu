'use client'

import { useMemo, useState } from 'react'

export type Anuncio = {
  id: string
  nome: string
  plataforma: string
  publicacao_url: string | null
  formato: string | null
  objetivo: string
  publico: string | null
  estado: string
  inicio: string | null
  fim: string | null
  orcamento_diario: number | null
  orcamento_total: number | null
  gasto: number
  visualizacoes: number
  alcance: number | null
  resultados: number
  notas: string | null
  atualizado_em: string
}

/* O "resultado" de cada anúncio depende do objetivo escolhido na Meta. */
const OBJETIVOS: Record<string, { label: string; resultado: string }> = {
  mensagens: { label: 'Mensagens', resultado: 'conversas' },
  perfil:    { label: 'Visitas ao perfil', resultado: 'visitas ao perfil' },
  site:      { label: 'Visitas ao site', resultado: 'visitas ao site' },
  mistura:   { label: 'Mistura de ações', resultado: 'resultados' },
}

const ESTADOS: Record<string, { label: string; cor: string }> = {
  revisao:   { label: 'Em revisão', cor: '#f0b429' },
  ativo:     { label: 'Ativo', cor: '#3ca374' },
  suspenso:  { label: 'Suspenso', cor: '#e08a4c' },
  concluido: { label: 'Concluído', cor: 'rgba(255,255,255,.4)' },
}

const eur = (n: number) => n.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })
const num = (n: number) => n.toLocaleString('pt-PT')
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
function data(d: string | null) {
  if (!d) return null
  const [a, m, dia] = d.split('-').map(Number)
  return `${dia} ${MESES[m - 1]} ${a}`
}
function custoPor(a: { gasto: number; resultados: number }) {
  return a.resultados > 0 ? eur(a.gasto / a.resultados) : null
}

const VAZIO = {
  nome: '', publicacao_url: '', formato: 'reel', objetivo: 'mensagens', publico: '', estado: 'ativo',
  inicio: '', fim: '', orcamento_diario: '', orcamento_total: '', gasto: '', visualizacoes: '', alcance: '', resultados: '', notas: '',
}
type Form = typeof VAZIO

function paraForm(a: Anuncio): Form {
  const s = (v: unknown) => (v === null || v === undefined ? '' : String(v))
  return {
    nome: a.nome, publicacao_url: s(a.publicacao_url), formato: s(a.formato), objetivo: a.objetivo, publico: s(a.publico),
    estado: a.estado, inicio: s(a.inicio), fim: s(a.fim), orcamento_diario: s(a.orcamento_diario), orcamento_total: s(a.orcamento_total),
    gasto: s(a.gasto), visualizacoes: s(a.visualizacoes), alcance: s(a.alcance), resultados: s(a.resultados), notas: s(a.notas),
  }
}

export default function AnunciosClient({ inicial }: { inicial: Anuncio[] }) {
  const [anuncios, setAnuncios] = useState(inicial)
  const [aEditar, setAEditar] = useState<string | 'novo' | null>(null)
  const [form, setForm] = useState<Form>(VAZIO)
  const [aGuardar, setAGuardar] = useState(false)
  const [erro, setErro] = useState('')

  const totais = useMemo(() => {
    const gasto = anuncios.reduce((s, a) => s + Number(a.gasto || 0), 0)
    const visualizacoes = anuncios.reduce((s, a) => s + (a.visualizacoes || 0), 0)
    const ativos = anuncios.filter(a => a.estado === 'ativo' || a.estado === 'revisao').length
    const porObjetivo = Object.keys(OBJETIVOS).map(k => {
      const lista = anuncios.filter(a => a.objetivo === k)
      return {
        k, n: lista.length,
        gasto: lista.reduce((s, a) => s + Number(a.gasto || 0), 0),
        resultados: lista.reduce((s, a) => s + (a.resultados || 0), 0),
        visualizacoes: lista.reduce((s, a) => s + (a.visualizacoes || 0), 0),
      }
    }).filter(o => o.n > 0)
    return { gasto, visualizacoes, ativos, porObjetivo }
  }, [anuncios])

  function abrir(a: Anuncio | 'novo') {
    setErro('')
    if (a === 'novo') { setForm(VAZIO); setAEditar('novo') }
    else { setForm(paraForm(a)); setAEditar(a.id) }
  }

  async function guardar() {
    if (!form.nome.trim()) { setErro('Escreve o nome do anúncio'); return }
    setAGuardar(true); setErro('')
    const novo = aEditar === 'novo'
    const r = await fetch('/api/social-anuncios', {
      method: novo ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novo ? form : { ...form, id: aEditar }),
    }).then(r => r.json()).catch(() => ({ ok: false, error: 'Sem ligação' }))
    setAGuardar(false)
    if (!r.ok) { setErro(r.error || 'Não foi possível guardar'); return }
    setAnuncios(lista => novo ? [r.anuncio, ...lista] : lista.map(a => a.id === r.anuncio.id ? r.anuncio : a))
    setAEditar(null)
  }

  async function apagar(id: string) {
    if (!window.confirm('Apagar este anúncio do registo? Não apaga nada no Instagram.')) return
    const r = await fetch(`/api/social-anuncios?id=${id}`, { method: 'DELETE' }).then(r => r.json()).catch(() => ({ ok: false }))
    if (r.ok) { setAnuncios(lista => lista.filter(a => a.id !== id)); setAEditar(null) }
  }

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="max-w-[1200px] mx-auto px-5 sm:px-10 lg:px-14 pt-10 pb-24">

      {/* ── Resumo ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { l: 'Total investido', v: eur(totais.gasto) },
          { l: 'Visualizações pagas', v: num(totais.visualizacoes) },
          { l: 'Anúncios', v: String(anuncios.length) },
          { l: 'A correr agora', v: String(totais.ativos), destaque: totais.ativos > 0 },
        ].map(c => (
          <div key={c.l} className="rounded-[16px] border border-white/[0.09] bg-white/[0.02] px-5 py-4">
            <p className="text-[10.5px] tracking-[0.22em] uppercase text-white/40">{c.l}</p>
            <p className={`font-semibold text-[28px] mt-1 ${c.destaque ? 'text-[#3ca374]' : 'text-white'}`}>{c.v}</p>
          </div>
        ))}
      </div>

      {/* ── Por objetivo: o que cada tipo de anúncio trouxe ─── */}
      <p className="mt-12 text-[11px] font-medium tracking-[0.2em] uppercase text-[#C9A84C]">Por objetivo</p>
      <h2 className="font-semibold text-[26px] leading-tight mt-1 mb-5">O que cada tipo de anúncio trouxe</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {totais.porObjetivo.map(o => {
          const zero = o.resultados === 0 && o.gasto > 0
          return (
            <div key={o.k} className={`rounded-[16px] border px-5 py-4 ${zero ? 'border-[#e05a4c]/40 bg-[#e05a4c]/[0.05]' : 'border-white/[0.09] bg-white/[0.02]'}`}>
              <p className="font-semibold text-[17px]">{OBJETIVOS[o.k].label}</p>
              <p className="text-[12.5px] text-white/45 mt-0.5">{o.n} {o.n === 1 ? 'anúncio' : 'anúncios'} · {eur(o.gasto)}</p>
              <p className="mt-3 text-[22px] font-semibold">{num(o.resultados)} <span className="text-[13px] font-normal text-white/50">{OBJETIVOS[o.k].resultado}</span></p>
              <p className={`text-[12.5px] mt-1 ${zero ? 'text-[#e88a7e]' : 'text-[#d8be93]'}`}>
                {o.resultados > 0 ? `${eur(o.gasto / o.resultados)} por resultado` : o.gasto > 0 ? 'Gastou e não trouxe resultados' : 'Ainda sem dados'}
              </p>
            </div>
          )
        })}
      </div>

      {/* ── Lista ────────────────────────────────────────────── */}
      <div className="mt-12 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#C9A84C]">Registo</p>
          <h2 className="font-semibold text-[26px] leading-tight mt-1">Todos os anúncios</h2>
        </div>
        <button onClick={() => abrir('novo')}
          className="rounded-full border border-[#d8be93]/50 px-5 py-2.5 text-[12px] tracking-[0.18em] uppercase text-[#d8be93] hover:bg-[#d8be93] hover:text-[#0b0b0b] transition-colors">
          + Novo anúncio
        </button>
      </div>

      {aEditar === 'novo' && <Formulario form={form} set={set} guardar={guardar} cancelar={() => setAEditar(null)} aGuardar={aGuardar} erro={erro} />}

      <div className="mt-5 flex flex-col gap-3">
        {anuncios.length === 0 && <p className="text-white/40 text-[14px]">Ainda não há anúncios registados.</p>}
        {anuncios.map(a => {
          const est = ESTADOS[a.estado] ?? ESTADOS.concluido
          const obj = OBJETIVOS[a.objetivo] ?? { label: a.objetivo, resultado: 'resultados' }
          const periodo = [data(a.inicio), data(a.fim)].filter(Boolean).join(' → ')
          return (
            <div key={a.id} className="rounded-[16px] border border-white/[0.09] bg-[#0e0e0e]/70 px-5 py-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-[0.16em] uppercase" style={{ color: est.cor, border: `1px solid ${est.cor}` }}>{est.label}</span>
                    <span className="text-[11px] tracking-[0.16em] uppercase text-white/40">{obj.label}{a.formato ? ` · ${a.formato}` : ''}</span>
                  </div>
                  <p className="font-semibold text-[19px] mt-1.5">
                    {a.publicacao_url
                      ? <a href={a.publicacao_url} target="_blank" rel="noreferrer" className="hover:text-[#d8be93]">{a.nome} ↗</a>
                      : a.nome}
                  </p>
                  <p className="text-[12.5px] text-white/45 mt-0.5">
                    {[periodo, a.publico, a.orcamento_diario ? `${eur(Number(a.orcamento_diario))}/dia` : null].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <button onClick={() => aEditar === a.id ? setAEditar(null) : abrir(a)}
                  className="text-[11px] tracking-[0.18em] uppercase text-white/45 hover:text-[#d8be93]">
                  {aEditar === a.id ? 'Fechar' : 'Atualizar números'}
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Numero l="Gasto" v={`${eur(Number(a.gasto))}${a.orcamento_total ? ` de ${eur(Number(a.orcamento_total))}` : ''}`} />
                <Numero l="Visualizações" v={num(a.visualizacoes)} />
                <Numero l={obj.resultado} v={num(a.resultados)} alerta={a.resultados === 0 && Number(a.gasto) > 0} />
                <Numero l="Custo por resultado" v={custoPor({ gasto: Number(a.gasto), resultados: a.resultados }) ?? '—'} />
              </div>
              {a.notas && <p className="mt-3 text-[13px] text-white/55 leading-relaxed">{a.notas}</p>}

              {aEditar === a.id && (
                <Formulario form={form} set={set} guardar={guardar} cancelar={() => setAEditar(null)} aGuardar={aGuardar} erro={erro} apagar={() => apagar(a.id)} />
              )}
            </div>
          )
        })}
      </div>

      <p className="mt-10 text-[12.5px] text-white/35 leading-relaxed max-w-2xl">
        Os números copiam-se das Ferramentas para anúncios do Instagram (Painel profissional › Ferramentas para anúncios › Ver estatísticas). O "resultado" de cada anúncio depende do objetivo: conversas, visitas ao perfil ou visitas ao site.
      </p>
    </div>
  )
}

function Numero({ l, v, alerta }: { l: string; v: string; alerta?: boolean }) {
  return (
    <div>
      <p className="text-[10px] tracking-[0.2em] uppercase text-white/35">{l}</p>
      <p className={`text-[17px] font-semibold mt-0.5 ${alerta ? 'text-[#e88a7e]' : 'text-white/90'}`}>{v}</p>
    </div>
  )
}

const CAMPO = 'w-full rounded-[10px] border border-white/[0.12] bg-black/40 px-3 py-2 text-[14px] text-white outline-none focus:border-[#d8be93]/60'

function Formulario({ form, set, guardar, cancelar, aGuardar, erro, apagar }: {
  form: Form
  set: (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  guardar: () => void; cancelar: () => void; aGuardar: boolean; erro: string; apagar?: () => void
}) {
  const r = (l: string, el: React.ReactNode, largo = false) => (
    <label className={largo ? 'sm:col-span-2 lg:col-span-4' : ''}>
      <span className="block text-[10px] tracking-[0.2em] uppercase text-white/40 mb-1">{l}</span>{el}
    </label>
  )
  return (
    <div className="mt-4 rounded-[14px] border border-[#d8be93]/25 bg-[#d8be93]/[0.03] p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {r('Nome', <input className={CAMPO} value={form.nome} onChange={set('nome')} placeholder="Ex.: Reel do casal X" />, true)}
        {r('Objetivo', <select className={CAMPO} value={form.objetivo} onChange={set('objetivo')}>
          {Object.entries(OBJETIVOS).map(([k, o]) => <option key={k} value={k}>{o.label}</option>)}</select>)}
        {r('Estado', <select className={CAMPO} value={form.estado} onChange={set('estado')}>
          {Object.entries(ESTADOS).map(([k, e]) => <option key={k} value={k}>{e.label}</option>)}</select>)}
        {r('Formato', <select className={CAMPO} value={form.formato} onChange={set('formato')}>
          <option value="">—</option><option value="reel">Reel</option><option value="carrossel">Carrossel</option><option value="foto">Foto</option></select>)}
        {r('Link da publicação', <input className={CAMPO} value={form.publicacao_url} onChange={set('publicacao_url')} placeholder="https://www.instagram.com/p/..." />)}
        {r('Início', <input type="date" className={CAMPO} value={form.inicio} onChange={set('inicio')} />)}
        {r('Fim', <input type="date" className={CAMPO} value={form.fim} onChange={set('fim')} />)}
        {r('€ por dia', <input inputMode="decimal" className={CAMPO} value={form.orcamento_diario} onChange={set('orcamento_diario')} />)}
        {r('Orçamento total €', <input inputMode="decimal" className={CAMPO} value={form.orcamento_total} onChange={set('orcamento_total')} />)}
        {r('Gasto €', <input inputMode="decimal" className={CAMPO} value={form.gasto} onChange={set('gasto')} />)}
        {r('Visualizações', <input inputMode="numeric" className={CAMPO} value={form.visualizacoes} onChange={set('visualizacoes')} />)}
        {r('Alcance', <input inputMode="numeric" className={CAMPO} value={form.alcance} onChange={set('alcance')} />)}
        {r('Resultados', <input inputMode="numeric" className={CAMPO} value={form.resultados} onChange={set('resultados')} placeholder="conversas / visitas" />)}
        {r('Público', <input className={CAMPO} value={form.publico} onChange={set('publico')} />, true)}
        {r('Notas', <textarea rows={2} className={CAMPO} value={form.notas} onChange={set('notas')} />, true)}
      </div>
      {erro && <p className="mt-3 text-[13px] text-[#e88a7e]">{erro}</p>}
      <div className="mt-4 flex items-center gap-3 flex-wrap">
        <button onClick={guardar} disabled={aGuardar}
          className="rounded-full bg-[#d8be93] px-5 py-2 text-[12px] font-semibold tracking-[0.16em] uppercase text-[#0b0b0b] disabled:opacity-50">
          {aGuardar ? 'A guardar…' : 'Guardar'}
        </button>
        <button onClick={cancelar} className="text-[12px] tracking-[0.16em] uppercase text-white/45 hover:text-white">Cancelar</button>
        {apagar && <button onClick={apagar} className="ml-auto text-[11px] tracking-[0.16em] uppercase text-[#e88a7e]/70 hover:text-[#e88a7e]">Apagar do registo</button>}
      </div>
    </div>
  )
}
