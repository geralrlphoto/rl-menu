'use client'

// Produção → Departamento de Fotografia › Álbuns.
// Quadro dos álbuns por estado (lib/albumEstado.ts): nomear o editor do álbum,
// rever a maqueta antes dos noivos (Revisão RL), ver os pedidos de alterações,
// marcar entregue, e a ficha do álbum. Substitui a antiga página /albuns-casamento.
// Dados: /api/edicao-fotografia/albuns. Estado: POST na mesma rota.
// Editor do álbum: /api/edicao-fotografia/album. Ficha: PATCH /api/albuns-casamento/[id].

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { whatsappLink } from '@/lib/crm'
import { JanelaWhatsApp, comNotaAutomatica } from '@/app/components/WhatsAppMembro'

const OURO = '#C9A84C'
type Coluna = 'nomear' | 'edicao' | 'revisao' | 'noivos' | 'alteracoes' | 'aprovado' | 'entregue'
const COLUNAS: { k: Coluna; titulo: string; cor: string; quem: string; texto: string }[] = [
  { k: 'nomear', titulo: 'Por nomear', cor: '#f87171', quem: 'RL', texto: 'Seleção recebida. Escolhe o editor do álbum: recebe o trabalho no portal e o email.' },
  { k: 'edicao', titulo: 'Em edição', cor: '#fb923c', quem: 'Editor', texto: 'Logo ao nomear. O editor entrega o álbum no portal dele (link). Prazo: 30 dias depois da seleção.' },
  { k: 'revisao', titulo: 'Em revisão', cor: '#fbbf24', quem: 'RL', texto: 'Recebes um email. Vês o álbum do editor, crias o teu link e envias aos noivos, ou pedes alterações ao editor.' },
  { k: 'noivos', titulo: 'Entregue aos noivos', cor: '#93c5fd', quem: 'Noivos', texto: 'Recebem o email com o teu link e veem-no no portal, com Aprovar ou Pedir alterações.' },
  { k: 'alteracoes', titulo: 'Alterações', cor: '#f472b6', quem: 'Editor', texto: 'Os noivos pediram alterações: o editor e tu são avisados. Volta a Em revisão quando o editor reentregar.' },
  { k: 'aprovado', titulo: 'Em elaboração', cor: '#c4b5fd', quem: 'RL', texto: 'Os noivos aprovaram: o álbum entra em produção (30 dias). Marca concluído quando seguir.' },
  { k: 'entregue', titulo: 'Concluído', cor: '#4ade80', quem: 'RL', texto: 'Os noivos recebem o aviso no portal e por email.' },
]
const COR = Object.fromEntries(COLUNAS.map(c => [c.k, c.cor])) as Record<Coluna, string>

type Membro = { id: string; nome: string; foto_url: string | null; status: string; contato: string | null }
type Album = {
  id: string; referencia: string; refAlbum: string; refErrada: string | null; nome: string; cliente: string | null; data: string | null; fichaId: string | null
  estado: string; editores: string[]; editorIds: (string | null)[]; numFotos: string | number | null
  entradaFotos: string | null; prazo: string | null; diasPrazo: number | null; fotosAlbum: string | null
  maqueteUrl: string | null; maqueteEnviada: string | null; maqueteEditorUrl: string | null
  alteracao: { paginas_alterar?: string | null; tipos_alteracao?: string[] | null; observacoes?: string | null; foto_url?: string | null; created_at?: string } | null
  historico: { etapa: string; origem: string | null; em: string }[]
  entregueEm: string | null; aprovadoEm: string | null
  ficha: Record<string, string | number>
}
type PorNomear = { referencia: string; cliente: string | null; data: string | null; fichaId: string | null; recebida: string | null; numFotos: number | null; fotosAlbum: string | null }

const fmt = (iso: string | null) => iso ? new Date(String(iso).slice(0, 10) + 'T12:00:00Z').toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '—'
const primeiro = (n: string) => n.trim().split(/\s+/)[0]
const dias = (n: number) => `${n} ${n === 1 ? 'dia' : 'dias'}`
const colunaDe = (a: Album): Coluna =>
  !a.editores.length && (a.estado === 'NOVO ÁLBUM' || a.estado === 'EM EDIÇÃO') ? 'nomear'
    : a.estado === 'REVISÃO RL' ? 'revisao' : a.estado === 'PARA APROVAÇÃO' ? 'noivos' : a.estado === 'ALTERAÇÕES' ? 'alteracoes'
      : a.estado === 'APROVADO' ? 'aprovado' : a.estado === 'ENTREGUE' ? 'entregue' : 'edicao'

/* As fotos que os noivos escolheram para o álbum: ver e copiar (é isto que vai para o editor) */
function FotosAlbum({ texto }: { texto: string | null }) {
  const [copiado, setCopiado] = useState(false)
  const lista = String(texto ?? '').split(/[\s,;]+/).filter(x => /\d/.test(x))
  if (!lista.length) return <p className="text-[11px] text-amber-300/80">Sem lista de fotos para o álbum na seleção.</p>
  return (
    <details className="group/f rounded-xl border border-white/[0.08] bg-black/25 p-2.5">
      <summary className="cursor-pointer list-none flex items-center justify-between gap-2 text-[11px] font-semibold tracking-[0.12em] uppercase text-white/70">
        <span>Fotos para o álbum · <b style={{ color: OURO }}>{lista.length}</b></span>
        <span className="text-white/40 group-open/f:hidden">Ver</span><span className="text-white/40 hidden group-open/f:inline">Fechar</span>
      </summary>
      <p className="mt-2 text-[11px] text-white/60 font-mono leading-relaxed break-words">{lista.join('; ')}</p>
      <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(lista.join('; ')); setCopiado(true); setTimeout(() => setCopiado(false), 2000) } catch {} }}
        className="mt-2 text-[10px] font-semibold tracking-[0.15em] uppercase text-white/50 hover:text-white">{copiado ? 'Copiado ✓' : 'Copiar a lista'}</button>
    </details>
  )
}

function FichaAlbum({ a, onFechar, onGuardado }: { a: Album; onFechar: () => void; onGuardado: () => void }) {
  const [f, setF] = useState<Record<string, string | number>>(a.ficha)
  const [aGuardar, setAGuardar] = useState(false)
  const campo = (k: string, label: string, area = false) => (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-white/40">{label}</span>
      {area
        ? <textarea rows={3} value={String(f[k] ?? '')} onChange={e => setF(x => ({ ...x, [k]: e.target.value }))} className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[13px] text-white outline-none focus:border-[#C9A84C]/60" />
        : <input value={String(f[k] ?? '')} onChange={e => setF(x => ({ ...x, [k]: e.target.value }))} className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[13px] text-white outline-none focus:border-[#C9A84C]/60" />}
    </label>
  )
  async function guardar() {
    setAGuardar(true)
    const r = await fetch(`/api/albuns-casamento/${a.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) }).catch(() => null)
    setAGuardar(false)
    if (!r?.ok) { alert('Não foi possível guardar a ficha do álbum.'); return }
    onGuardado()
  }
  return (
    <div role="dialog" aria-modal="true" onClick={onFechar} className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div onClick={e => e.stopPropagation()} className="w-full max-w-xl max-h-[88vh] overflow-y-auto rounded-[22px] border border-[#C9A84C]/35 bg-[#0e0e0e] p-6" style={{ borderLeft: `2px solid ${OURO}` }}>
        <p className="text-[11px] font-semibold tracking-[0.3em] uppercase" style={{ color: OURO }}>Ficha do álbum</p>
        <h3 className="mt-1 text-2xl font-semibold">{a.cliente || a.nome}</h3>
        <div className="mt-5 grid sm:grid-cols-2 gap-3">
          {campo('ref_album', 'Referência do álbum')}
          {campo('num_fotografias', 'Nº de fotografias')}
          {campo('design', 'Design')}
          {campo('opcao', 'Opção (sem / com caixa)')}
        </div>
        <div className="mt-3 flex flex-col gap-3">
          {campo('texto_album', 'Texto do álbum', true)}
          {campo('texto_caixa', 'Texto da caixa', true)}
        </div>
        {a.refErrada && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300/30 bg-amber-300/[0.06] px-3 py-2 text-[12px] text-amber-200/90">
            <span>Este álbum foi criado com a referência “{a.refErrada}”. Ligámo-lo a {a.referencia} pelos nomes.</span>
          </div>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={async () => {
            if (!window.confirm(`Apagar o álbum de ${a.cliente || a.nome}? Não dá para desfazer.`)) return
            const r = await fetch(`/api/albuns-casamento/${a.id}`, { method: 'DELETE' }).catch(() => null)
            if (!r?.ok) { alert('Não foi possível apagar.'); return }
            onGuardado()
          }} className="mr-auto rounded-full border border-red-400/30 px-4 py-2 text-[11px] font-semibold tracking-[0.12em] uppercase text-red-300/80 hover:text-red-300">Apagar álbum</button>
          <button type="button" onClick={onFechar} className="rounded-full border border-white/15 px-4 py-2 text-[11px] font-semibold tracking-[0.12em] uppercase text-white/55 hover:text-white">Fechar</button>
          <button type="button" disabled={aGuardar} onClick={guardar} className="rounded-full border border-[#4ade80]/50 bg-[#4ade80]/10 px-4 py-2 text-[11px] font-semibold tracking-[0.12em] uppercase text-[#4ade80] hover:bg-[#4ade80]/20 disabled:opacity-40">{aGuardar ? 'A guardar…' : 'Guardar'}</button>
        </div>
      </div>
    </div>
  )
}

export default function AlbunsPage() {
  const [dados, setDados] = useState<{ albuns: Album[]; porNomear: PorNomear[]; equipa: Membro[] } | null>(null)
  const [erro, setErro] = useState(false)
  const [aGravar, setAGravar] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<Coluna | 'todos'>('todos')
  const [ficha, setFicha] = useState<Album | null>(null)
  const [avisoSem, setAvisoSem] = useState<Album | null>(null)

  const carregar = () => {
    fetch('/api/edicao-fotografia/albuns').then(r => r.json())
      .then(d => { if (d.ok) setDados({ albuns: d.albuns, porNomear: d.porNomear, equipa: d.equipa }); else setErro(true) })
      .catch(() => setErro(true))
  }
  useEffect(carregar, [])

  const nomear = async (ref: string, cliente: string | null, nome: string, atual?: string, fotos?: string | null) => {
    if (!nome || nome === atual) return
    if (!window.confirm(atual ? `Trocar o editor do álbum de ${cliente || ref} de ${atual} para ${nome}?` : `Nomear ${nome} para o álbum de ${cliente || ref}? Recebe o trabalho no portal e o email.`)) return
    setAGravar(ref)
    const r = await fetch('/api/edicao-fotografia/album', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ referencia: ref, editor: nome, fotos: fotos ?? null }) }).catch(() => null)
    const d = r ? await r.json().catch(() => ({})) : {}
    setAGravar(null)
    if (!r?.ok) alert((d as any).error || 'Não foi possível guardar.')
    carregar()
  }
  const [linksNoivos, setLinksNoivos] = useState<Record<string, string>>({})
  const mudar = async (a: Album, estado: string, confirmar: string, pedirNota = false, url?: string) => {
    let nota: string | null = null
    if (pedirNota) {
      nota = window.prompt('O que é preciso alterar na maqueta? (vai para o editor)')?.trim() || null
      if (!nota) return
    } else if (!window.confirm(confirmar)) return
    setAGravar(a.referencia)
    const r = await fetch('/api/edicao-fotografia/albuns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ referencia: a.refAlbum, estado, nota, url }) }).catch(() => null)
    const d = r ? await r.json().catch(() => ({})) : {}
    setAGravar(null)
    if (!r?.ok) alert((d as any).error || 'Não foi possível guardar.')
    carregar()
  }

  // Editor atrasado com a maqueta ou a produção: WhatsApp direto, com a nota automática
  const responsavel = (a: Album) => (dados?.equipa ?? []).find(m => a.editorIds[0] && m.id === a.editorIds[0]) ?? null
  const mensagemAtraso = (a: Album, m: Membro | null) => {
    const nome = m ? primeiro(m.nome).charAt(0).toUpperCase() + primeiro(m.nome).slice(1).toLowerCase() : ''
    const o = a.estado === 'APROVADO' ? 'a elaboração do álbum' : 'a entrega do álbum'
    return comNotaAutomatica(`Olá${nome ? ` ${nome}` : ''}! Tudo bem?\n\n${o.charAt(0).toUpperCase() + o.slice(1)} de ${a.cliente || a.nome} está atrasada ${dias(-(a.diasPrazo ?? 0))}: o prazo era ${fmt(a.prazo)}.\n\nConsegues dar-me uma previsão? Obrigado!\nRui`)
  }
  const avisar = (a: Album) => {
    const m = responsavel(a)
    const link = m ? whatsappLink(m.contato, mensagemAtraso(a, m)) : null
    if (link) window.open(link, '_blank'); else setAvisoSem(a)
  }

  const albuns = dados?.albuns ?? []
  const porColuna = useMemo(() => {
    const m = new Map<Coluna, Album[]>(COLUNAS.map(c => [c.k, []]))
    for (const a of albuns) m.get(colunaDe(a))?.push(a)
    for (const [, l] of m) l.sort((x, y) => (x.diasPrazo ?? 9999) - (y.diasPrazo ?? 9999))
    return m
  }, [albuns])
  const contar = (k: Coluna) => (porColuna.get(k)?.length ?? 0) + (k === 'nomear' ? (dados?.porNomear.length ?? 0) : 0)
  const atrasados = albuns.filter(a => a.diasPrazo !== null && a.diasPrazo < 0 && ['edicao', 'alteracoes', 'aprovado'].includes(colunaDe(a))).length
  const nomesEquipa = (dados?.equipa ?? []).map(e => e.nome)
  const select = (valor: string, onChange: (v: string) => void, disabled: boolean) => (
    <select disabled={disabled} value={valor} onChange={e => onChange(e.target.value)}
      className={`w-full rounded-xl border bg-black/40 px-3 py-2 text-sm outline-none focus:border-[#C9A84C] ${valor ? 'border-white/10 text-white' : 'border-[#C9A84C]/40 text-white/60'}`}>
      <option value="" disabled>{disabled ? 'A guardar…' : 'Nomear editor do álbum…'}</option>
      {valor && !nomesEquipa.includes(valor) && <option value={valor}>{valor}</option>}
      {nomesEquipa.map(n => <option key={n} value={n}>{n}</option>)}
    </select>
  )
  const nomeEquipa = (a: Album) => (dados?.equipa ?? []).find(m => a.editorIds[0] && m.id === a.editorIds[0])?.nome ?? a.editores[0] ?? ''

  return (
    <main className="min-h-screen bg-[#070707] text-white font-cond overflow-x-clip">
      <section className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 70% at 85% 10%, rgba(201,168,76,0.12), transparent 70%)' }} />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-24 pb-12">
          <Link href="/edicao-fotografia" className="text-sm text-white/45 hover:text-white">‹ Departamento de Fotografia</Link>
          <p className="mt-6 text-[13px] font-bold tracking-[0.5em] uppercase" style={{ color: OURO }}>Fotografia · Álbuns</p>
          <h1 className="mt-3 font-bold uppercase leading-[0.9] text-[52px] sm:text-[88px] lg:text-[110px]">Álbuns</h1>
          <div className="mt-5 flex items-center gap-4">
            <span className="w-12 h-px" style={{ background: OURO }} />
            <span className="text-sm tracking-[0.22em] uppercase text-white/60">Do editor à RL, da RL aos noivos, tudo automático</span>
          </div>
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {[...COLUNAS.filter(c => c.k !== 'entregue').map(c => ({ label: c.titulo, valor: contar(c.k), cor: c.cor })), { label: 'Atrasados', valor: atrasados, cor: '#ef4444' }].map(k => (
              <div key={k.label} className="rounded-[18px] border border-white/[0.08] bg-[#111111]/85 px-4 py-3.5" style={{ borderLeft: `2px solid ${k.cor}` }}>
                <p className="text-[10px] tracking-[0.22em] uppercase text-white/45">{k.label}</p>
                <p className="mt-1 text-[32px] font-thin leading-none tabular-nums" style={{ color: k.valor ? k.cor : 'rgba(255,255,255,.35)' }}>{dados ? k.valor : '–'}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-12 flex flex-col gap-14">
        {erro && <p className="text-red-400 text-sm">Não foi possível carregar os álbuns. Atualiza a página.</p>}

        <section>
          <p className="text-[11px] font-semibold tracking-[0.3em] uppercase" style={{ color: OURO }}>Como funciona</p>
          <h2 className="mt-1 text-3xl sm:text-[34px] font-semibold">Os passos do álbum: quem faz o quê</h2>
          <p className="mt-2 text-sm text-white/45">O editor do álbum pode ser outra pessoa que não quem editou as fotos. Cada passo avisa sozinho quem tem de agir.</p>
          <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {COLUNAS.map((c, i) => (
              <li key={c.k} className="rounded-[20px] border border-white/[0.08] bg-[#111111]/85 p-4" style={{ borderLeft: `2px solid ${c.cor}` }}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-thin text-white/40">{String(i + 1).padStart(2, '0')}</span>
                  <span className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-[0.2em] uppercase" style={{ color: c.cor, background: `${c.cor}1f`, border: `1px solid ${c.cor}55` }}>{c.quem}</span>
                </div>
                <p className="mt-2 text-[19px] font-semibold">{c.titulo}</p>
                <p className="mt-1 text-[12.5px] text-white/60 leading-snug">{c.texto}</p>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <p className="text-[11px] font-semibold tracking-[0.3em] uppercase" style={{ color: OURO }}>Quadro de trabalho</p>
          <h2 className="mt-1 text-3xl sm:text-[34px] font-semibold">Álbuns por estado</h2>
          <div className="mt-6 flex flex-wrap gap-2">
            {([{ k: 'todos' as const, titulo: 'Todos', cor: OURO }, ...COLUNAS]).map(c => {
              const n = c.k === 'todos' ? albuns.length + (dados?.porNomear.length ?? 0) : contar(c.k)
              const ativo = filtro === c.k
              return (
                <button key={c.k} type="button" onClick={() => setFiltro(c.k)}
                  className={`flex items-center gap-2 rounded-full border px-4 py-2 text-[12px] font-semibold tracking-[0.15em] uppercase ${ativo ? 'text-white' : 'text-white/55 hover:text-white border-white/10 bg-white/[0.02]'}`}
                  style={ativo ? { borderColor: c.cor, background: `${c.cor}22` } : undefined}>
                  <i className="w-2 h-2 rounded-full" style={{ background: c.cor }} />{c.titulo}
                  <span className="rounded-full bg-white/[0.06] px-2 py-px text-[11px] tabular-nums">{dados ? n : '–'}</span>
                </button>
              )
            })}
          </div>

          <div className={filtro === 'todos' ? 'mt-6 flex gap-4 overflow-x-auto pb-4 snap-x' : 'mt-6'}>
            {COLUNAS.filter(c => filtro === 'todos' || c.k === filtro).map(c => {
              const lista = porColuna.get(c.k) ?? []
              const extra = c.k === 'nomear' ? (dados?.porNomear ?? []) : []
              return (
                <div key={c.k} className={filtro === 'todos' ? 'snap-start flex-none w-[290px] flex flex-col gap-3' : 'grid gap-3 sm:grid-cols-2 lg:grid-cols-4 items-start'}>
                  <div className="flex items-center justify-between px-1 col-span-full">
                    <span className="flex items-center gap-2 text-[12px] font-semibold tracking-[0.2em] uppercase text-white/75">
                      <i className="w-2 h-2 rounded-full" style={{ background: c.cor, boxShadow: `0 0 8px ${c.cor}` }} />{c.titulo}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[12px] font-semibold text-white/70">{lista.length + extra.length}</span>
                  </div>
                  {!dados && <div className="h-28 rounded-[18px] bg-white/[0.03] animate-pulse" />}
                  {dados && !lista.length && !extra.length && <p className="text-xs text-white/25 px-1">Nada aqui.</p>}

                  {extra.map(p => (
                    <div key={p.referencia} className="rounded-[18px] border border-white/[0.08] bg-[#111111]/90 p-4 flex flex-col gap-3" style={{ borderLeft: `2px solid ${c.cor}` }}>
                      <div>
                        <p className="font-semibold leading-snug">{p.cliente || p.referencia}</p>
                        <p className="text-[11px] text-white/40 mt-0.5">{fmt(p.data)}{p.recebida ? ` · seleção a ${fmt(p.recebida)}` : ''}</p>
                      </div>
                      <FotosAlbum texto={p.fotosAlbum} />
                      {select('', v => nomear(p.referencia, p.cliente, v, undefined, p.fotosAlbum), aGravar === p.referencia)}
                      {p.fichaId && <Link href={`/eventos-2026/${p.fichaId}`} className="text-[11px] font-semibold tracking-[0.15em] uppercase text-[#C9A84C]/80 hover:text-[#C9A84C]">Ficha →</Link>}
                    </div>
                  ))}

                  {lista.map(a => {
                    const k = colunaDe(a)
                    const atraso = a.diasPrazo !== null && a.diasPrazo < 0 && ['edicao', 'alteracoes', 'aprovado'].includes(k)
                    return (
                      <div key={a.id} className="rounded-[18px] border border-white/[0.08] bg-[#111111]/90 p-4 flex flex-col gap-3" style={{ borderLeft: `2px solid ${COR[k]}` }}>
                        <div>
                          <p className="font-semibold leading-snug">{a.cliente || a.nome}</p>
                          <p className="text-[11px] text-white/40 mt-0.5">{fmt(a.data)}</p>
                        </div>
                        {a.prazo && a.diasPrazo !== null && (
                          <p className={`text-[12px] font-semibold tracking-[0.08em] ${a.diasPrazo < 0 ? 'text-red-400' : a.diasPrazo <= 5 ? 'text-amber-300' : 'text-white/55'}`}>
                            {k === 'aprovado' ? 'Elaboração' : 'Entrega do editor'} · {a.diasPrazo < 0 ? `atrasada ${dias(-a.diasPrazo)}` : a.diasPrazo === 0 ? 'termina hoje' : `em ${dias(a.diasPrazo)}`} · {fmt(a.prazo)}
                          </p>
                        )}
                        {k === 'noivos' && a.maqueteEnviada && <p className="text-[12px] text-white/55">Entregue aos noivos a {fmt(a.maqueteEnviada)}</p>}
                        {k !== 'entregue' && <FotosAlbum texto={a.fotosAlbum} />}
                        {atraso && (
                          <button type="button" onClick={() => avisar(a)}
                            className="rounded-full border border-[#25D366]/45 bg-[#25D366]/10 px-3 py-1.5 text-[11px] font-semibold tracking-[0.1em] uppercase text-[#25D366] hover:bg-[#25D366]/20">
                            Avisar {responsavel(a) ? primeiro(responsavel(a)!.nome) : 'o editor'} por WhatsApp
                          </button>
                        )}
                        {k !== 'entregue' && (
                          <label className="flex flex-col gap-1">
                            <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-white/40">Editor do álbum</span>
                            {select(nomeEquipa(a), v => nomear(a.refAlbum, a.cliente, v, nomeEquipa(a), a.fotosAlbum), aGravar === a.referencia)}
                          </label>
                        )}
                        {a.maqueteEditorUrl && ['revisao', 'alteracoes'].includes(k) && (
                          <a href={a.maqueteEditorUrl} target="_blank" rel="noopener noreferrer" className="text-[12px] font-semibold text-[#fbbf24] hover:underline">▶ Ver o álbum do editor</a>
                        )}
                        {a.maqueteUrl && ['noivos', 'alteracoes'].includes(k) && (
                          <a href={a.maqueteUrl} target="_blank" rel="noopener noreferrer" className="text-[12px] font-semibold text-[#93c5fd] hover:underline">▶ Ver o link enviado aos noivos</a>
                        )}
                        {k === 'revisao' && (
                          <div className="flex flex-col gap-2 rounded-xl border border-[#fbbf24]/25 bg-[#fbbf24]/[0.05] p-3">
                            <input type="url" placeholder="O teu link para os noivos" value={linksNoivos[a.id] ?? ''}
                              onChange={e => setLinksNoivos(l => ({ ...l, [a.id]: e.target.value }))}
                              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[12px] text-white outline-none focus:border-[#C9A84C]/60" />
                            <button type="button" disabled={aGravar === a.referencia}
                              onClick={() => {
                                const url = (linksNoivos[a.id] ?? '').trim()
                                if (!/^https?:\/\//i.test(url)) { alert('Cola o link do álbum que vais enviar aos noivos (https://…).'); return }
                                mudar(a, 'PARA APROVAÇÃO', `Enviar o álbum a ${a.cliente || a.nome}? Recebem o email com este link e veem-no no portal, com Aprovar ou Pedir alterações.`, false, url)
                              }}
                              className="rounded-full border border-[#4ade80]/50 bg-[#4ade80]/10 px-3 py-1.5 text-[11px] font-semibold tracking-[0.1em] uppercase text-[#4ade80] hover:bg-[#4ade80]/20 disabled:opacity-40">✓ Enviar aos noivos →</button>
                            <button type="button" disabled={aGravar === a.referencia} onClick={() => mudar(a, 'EM EDIÇÃO', '', true)}
                              className="rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1.5 text-[11px] font-semibold tracking-[0.1em] uppercase text-amber-300 hover:bg-amber-300/20 disabled:opacity-40">✎ Pedir alterações ao editor</button>
                          </div>
                        )}
                        {k === 'alteracoes' && a.alteracao && (
                          <div className="rounded-xl border border-[#f472b6]/25 bg-[#f472b6]/[0.05] p-3 text-[12px] text-white/70 flex flex-col gap-1">
                            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#f472b6]">Pedido dos noivos</p>
                            {a.alteracao.paginas_alterar && <p>Páginas: {a.alteracao.paginas_alterar}</p>}
                            {a.alteracao.tipos_alteracao?.length ? <p>O que mudar: {a.alteracao.tipos_alteracao.join(', ')}</p> : null}
                            {a.alteracao.observacoes && <p className="whitespace-pre-line">{a.alteracao.observacoes}</p>}
                            {a.alteracao.foto_url && <a href={a.alteracao.foto_url} target="_blank" rel="noopener noreferrer" className="text-[#93c5fd] hover:underline">Ver foto de referência</a>}
                          </div>
                        )}
                        {k === 'aprovado' && (
                          <button type="button" disabled={aGravar === a.referencia}
                            onClick={() => mudar(a, 'ENTREGUE', `Marcar o álbum de ${a.cliente || a.nome} como concluído? Os noivos recebem o aviso.`)}
                            className="rounded-full border border-[#4ade80]/50 bg-[#4ade80]/10 px-3 py-2 text-[11px] font-semibold tracking-[0.15em] uppercase text-[#4ade80] hover:bg-[#4ade80]/20 disabled:opacity-40">Marcar concluído →</button>
                        )}
                        {k === 'entregue' && <p className="text-[12px] text-[#4ade80]">✓ Concluído{a.entregueEm ? ` a ${fmt(a.entregueEm)}` : ''}</p>}
                        {a.historico.length > 0 && (
                          <details className="group/h">
                            <summary className="cursor-pointer list-none text-[10px] font-semibold tracking-[0.2em] uppercase text-white/40 hover:text-white/70">
                              <span className="group-open/h:hidden">+ Histórico</span><span className="hidden group-open/h:inline">− Histórico</span>
                            </summary>
                            <ol className="mt-2 ml-1 border-l border-white/10 pl-3 flex flex-col gap-1.5">
                              {a.historico.map((h, i) => (
                                <li key={i} className="text-[11px]"><span className="text-white/80">{h.etapa.replace(/^Álbum: /, '')}</span><span className="text-white/40"> · {h.origem} · {fmt(h.em)}</span></li>
                              ))}
                            </ol>
                          </details>
                        )}
                        <div className="flex gap-3 text-[11px] font-semibold tracking-[0.15em] uppercase">
                          <button type="button" onClick={() => setFicha(a)} className="text-white/60 hover:text-white uppercase tracking-[0.15em]">Ficha do álbum</button>
                          {a.fichaId && <Link href={`/eventos-2026/${a.fichaId}`} className="text-[#C9A84C]/80 hover:text-[#C9A84C]">Evento →</Link>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </section>
      </div>

      {ficha && <FichaAlbum a={ficha} onFechar={() => setFicha(null)} onGuardado={() => { setFicha(null); carregar() }} />}
      <JanelaWhatsApp aberto={!!avisoSem} onFechar={() => setAvisoSem(null)}
        titulo={avisoSem ? `Álbum · ${avisoSem.cliente ?? avisoSem.nome}` : 'Álbum'}
        mensagem={avisoSem ? mensagemAtraso(avisoSem, null) : ''} />
    </main>
  )
}
