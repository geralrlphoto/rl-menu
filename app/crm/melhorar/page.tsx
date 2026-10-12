'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { DIMENSOES, corNota } from '../analises/RelatorioReuniao'

// "O Que Melhorar": plano de melhoria escrito pelo Claude a partir de todas as
// análises de reuniões (tabela crm_planos_melhoria, usa-se a linha mais recente).
// Os números do topo são calculados em direto a partir de crm_analises_reuniao.

type Prioridade = {
  titulo: string; porque: string; evidencia: string; como_fazer: string[]
  diz_assim: string; nao_digas: string; metrica: string
}
type Plano = {
  id: string; created_at: string; baseado_em: number; titulo: string; diagnostico: string; regra_de_ouro: string
  prioridades: Prioridade[]; guiao: { tempo: string; fase: string; objetivo: string; fazer: string }[]
  situacoes: { quando: string; responde: string }[]; o_que_manter: string[]
}
type Linha = { nota: number | null; scores: Record<string, number>; contact_id: string }

function media(ns: number[]) {
  return ns.length ? Math.round((ns.reduce((s, n) => s + n, 0) / ns.length) * 10) / 10 : null
}
const fmt = (n: number | null) => (n == null ? '—' : n.toLocaleString('pt-PT'))

function KPI({ label, value, sub, color = 'text-white' }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md px-4 sm:px-5 py-3 sm:py-4">
      <p className="text-white/50 text-[9px] sm:text-[10px] tracking-[0.25em] uppercase mb-1.5 sm:mb-2">{label}</p>
      <p className={`text-xl sm:text-2xl font-light ${color}`}>{value}</p>
      {sub && <p className="text-white/45 text-[10px] sm:text-[11px] mt-1">{sub}</p>}
    </div>
  )
}

function Titulo({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-xs tracking-[0.3em] text-gold uppercase">{children}</h2>
      {sub && <p className="text-[12px] text-white/35 mt-1">{sub}</p>}
    </div>
  )
}

function CartaoPrioridade({ p, n, aberto, onToggle }: { p: Prioridade; n: number; aberto: boolean; onToggle: () => void }) {
  return (
    <div className={`rounded-2xl border transition-colors ${aberto ? 'border-gold/40 bg-gold/[0.05]' : 'border-white/8 bg-white/3 hover:border-white/20'}`}>
      <button onClick={onToggle} className="w-full text-left flex items-start gap-4 px-5 py-4">
        <span className="font-cormorant text-gold text-3xl leading-none w-8 shrink-0">{n}</span>
        <div className="flex-1 min-w-0">
          <p className="text-white text-[15px] leading-snug">{p.titulo}</p>
          {!aberto && <p className="text-white/40 text-[12px] mt-1 line-clamp-1">{p.porque}</p>}
        </div>
        <span className={`text-white/40 text-sm mt-1 transition-transform ${aberto ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {aberto && (
        <div className="px-5 pb-5 sm:pl-[68px] flex flex-col gap-4">
          <p className="text-[13.5px] leading-relaxed text-white/70">{p.porque}</p>
          <div className="rounded-xl bg-white/[0.03] border border-white/8 px-4 py-3">
            <p className="text-[10px] tracking-[0.25em] uppercase text-white/35 mb-1.5">Nas tuas reuniões</p>
            <p className="text-[13px] leading-relaxed text-white/60">{p.evidencia}</p>
          </div>
          <div>
            <p className="text-[10px] tracking-[0.25em] uppercase text-gold/80 mb-2">Como proceder</p>
            <ol className="flex flex-col gap-2">
              {p.como_fazer.map((c, i) => (
                <li key={i} className="flex gap-3 text-[13.5px] leading-relaxed text-white/75">
                  <span className="text-gold/70 font-mono text-xs mt-0.5 shrink-0">{String(i + 1).padStart(2, '0')}</span>{c}
                </li>
              ))}
            </ol>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3">
              <p className="text-[10px] tracking-[0.25em] uppercase text-green-300/80 mb-1.5">Diz assim</p>
              <p className="font-cormorant italic text-[17px] leading-snug text-green-100/90">{p.diz_assim}</p>
            </div>
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
              <p className="text-[10px] tracking-[0.25em] uppercase text-red-300/80 mb-1.5">Evita</p>
              <p className="font-cormorant italic text-[17px] leading-snug text-red-100/80 line-through decoration-red-400/40">{p.nao_digas}</p>
            </div>
          </div>
          <p className="text-[12px] text-white/45"><span className="text-white/30 uppercase tracking-[0.2em] text-[10px] mr-2">Mede-te por</span>{p.metrica}</p>
        </div>
      )}
    </div>
  )
}

export default function MelhorarPage() {
  const [plano, setPlano] = useState<Plano | null>(null)
  const [linhas, setLinhas] = useState<Linha[]>([])
  const [estados, setEstados] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [aberta, setAberta] = useState<number | null>(0)
  const [situacao, setSituacao] = useState<number | null>(null)

  useEffect(() => {
    (async () => {
      const [{ data: p }, { data: a }] = await Promise.all([
        supabase.from('crm_planos_melhoria').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('crm_analises_reuniao').select('nota,scores,contact_id'),
      ])
      const lista = (a ?? []) as Linha[]
      const ids = Array.from(new Set(lista.map(l => l.contact_id)))
      if (ids.length) {
        const { data: ls } = await supabase.from('crm_contacts').select('id,status').in('id', ids)
        setEstados(Object.fromEntries((ls ?? []).map(l => [l.id, l.status])))
      }
      setPlano(p as Plano | null)
      setLinhas(lista)
      setLoading(false)
    })()
  }, [])

  if (loading) return <main className="min-h-screen flex items-center justify-center text-white/30 text-sm tracking-widest">A preparar o plano…</main>

  const notaMedia = media(linhas.map(l => Number(l.nota)).filter(n => !isNaN(n)))
  const medias = DIMENSOES.map(d => ({ ...d, v: media(linhas.map(l => l.scores?.[d.key]).filter((n): n is number => typeof n === 'number')) }))
  const ordenadas = medias.filter(d => d.v != null).sort((x, y) => (x.v ?? 0) - (y.v ?? 0))
  const pior = ordenadas[0], melhor = ordenadas[ordenadas.length - 1]
  const encerradas = linhas.filter(l => estados[l.contact_id] === 'Fechou' || ['NÃO FECHOU', 'Encerrado', 'Cancelado', 'Sem resposta'].includes(estados[l.contact_id]))
  const fecharam = encerradas.filter(l => estados[l.contact_id] === 'Fechou').length
  const novas = plano ? linhas.length - plano.baseado_em : 0

  return (
    <main className="min-h-screen px-3 sm:px-6 py-6 sm:py-10 max-w-[1100px] mx-auto">
      {/* ── CAPA ── */}
      <section className="relative rounded-3xl overflow-hidden border border-white/10 mb-6 min-h-[440px] flex flex-col">
        <img src="/boas-vindas-camera.webp" alt="" className="absolute inset-0 w-full h-full object-cover object-[75%_center]" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/70 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
        <div className="relative flex-1 flex flex-col px-5 sm:px-10 pt-5 sm:pt-7 pb-5 sm:pb-7">
          <div className="flex items-start justify-between gap-3">
            <Link href="/crm/analises" className="text-xs tracking-[0.3em] text-white/50 hover:text-gold transition-colors uppercase">‹ Análises</Link>
          </div>
          <div className="flex-1 flex flex-col justify-center py-8 max-w-xl">
            <p className="text-[10px] tracking-[0.45em] uppercase text-white/45">RL Photo.Video · Plano de Vendas</p>
            <h1 className="font-cormorant font-light text-gold text-5xl sm:text-7xl tracking-[0.06em] leading-none mt-3">O Que Melhorar</h1>
            <div className="w-20 h-px bg-gold/70 my-5" />
            <p className="font-cormorant italic text-white/85 text-xl sm:text-2xl leading-snug">
              {plano?.titulo ?? 'Ainda não há plano. Analisa algumas reuniões primeiro.'}
            </p>
            {plano && (
              <p className="text-[11px] tracking-[0.2em] uppercase text-white/45 mt-4">
                Baseado em {plano.baseado_em} {plano.baseado_em === 1 ? 'reunião' : 'reuniões'} · atualizado a {new Date(plano.created_at).toLocaleDateString('pt-PT')}
              </p>
            )}
          </div>
          {linhas.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              <KPI label="Nota média" value={fmt(notaMedia)} sub="de 0 a 10" color={notaMedia != null && notaMedia >= 7.5 ? 'text-green-400' : notaMedia != null && notaMedia >= 5 ? 'text-yellow-300' : 'text-red-400'} />
              <KPI label="Taxa de fecho" value={encerradas.length ? `${Math.round((fecharam / encerradas.length) * 100)}%` : '—'} sub={`${fecharam} de ${encerradas.length} reuniões analisadas`} color="text-gold" />
              <KPI label="Ponto forte" value={melhor?.label ?? '—'} sub={melhor ? `média ${fmt(melhor.v)}` : undefined} color="text-green-400" />
              <KPI label="A trabalhar" value={pior?.label ?? '—'} sub={pior ? `média ${fmt(pior.v)}` : undefined} color="text-red-400" />
            </div>
          )}
        </div>
      </section>

      {plano && novas > 0 && (
        <p className="mb-6 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-[13px] text-yellow-100/80">
          Há {novas} {novas === 1 ? 'análise nova' : 'análises novas'} desde este plano. Pede ao Claude para atualizar o plano de melhoria.
        </p>
      )}

      {plano && (<>
        {/* Regra de ouro */}
        <div className="rounded-2xl border border-gold/40 bg-gradient-to-br from-gold/15 to-transparent px-6 py-6 mb-6">
          <p className="text-[10px] tracking-[0.35em] uppercase text-gold/80 mb-2">Regra de ouro</p>
          <p className="font-cormorant text-white text-2xl sm:text-3xl leading-snug">{plano.regra_de_ouro}</p>
        </div>

        {/* Diagnóstico + barras */}
        <div className="grid md:grid-cols-[1fr_300px] gap-4 mb-10">
          <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
            <Titulo>Diagnóstico</Titulo>
            <p className="text-[14px] leading-relaxed text-white/70">{plano.diagnostico}</p>
          </div>
          <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
            <Titulo sub="Média de todas as reuniões">As 5 áreas</Titulo>
            <div className="flex flex-col gap-3">
              {medias.map(d => (
                <div key={d.key} className="flex items-center gap-3">
                  <span className="w-24 text-[10px] tracking-[0.2em] uppercase text-white/45 shrink-0">{d.label}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/8 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(d.v ?? 0) * 10}%`, background: corNota(d.v), transition: 'width .8s ease' }} />
                  </div>
                  <span className="w-7 text-right text-xs text-white/70">{fmt(d.v)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Prioridades */}
        <section className="mb-10">
          <Titulo sub="Por ordem de impacto nas vendas. Abre cada uma para ver como proceder.">As tuas prioridades</Titulo>
          <div className="flex flex-col gap-2.5">
            {plano.prioridades.map((p, i) => (
              <CartaoPrioridade key={i} p={p} n={i + 1} aberto={aberta === i} onToggle={() => setAberta(aberta === i ? null : i)} />
            ))}
          </div>
        </section>

        {/* Guião */}
        <section className="mb-10">
          <Titulo sub="A estrutura que deves seguir em cada reunião de 60 minutos">Guião da reunião ideal</Titulo>
          <ol className="relative border-l border-gold/25 ml-2 flex flex-col gap-5">
            {plano.guiao.map((g, i) => (
              <li key={i} className="pl-6 relative">
                <span className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-gold" />
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-mono text-[11px] text-gold/80">{g.tempo}</span>
                  <span className="text-white text-[15px]">{g.fase}</span>
                  <span className="text-white/35 text-[12px] italic">{g.objetivo}</span>
                </div>
                <p className="text-[13px] text-white/60 leading-relaxed mt-1">{g.fazer}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Situações difíceis */}
        <section className="mb-10">
          <Titulo sub="Clica numa frase para ver como responder">Quando ouvires…</Titulo>
          <div className="grid sm:grid-cols-2 gap-2.5">
            {plano.situacoes.map((s, i) => (
              <button key={i} onClick={() => setSituacao(situacao === i ? null : i)}
                className={`text-left rounded-2xl border px-5 py-4 transition-colors ${situacao === i ? 'border-gold/40 bg-gold/[0.05]' : 'border-white/8 bg-white/3 hover:border-white/20'}`}>
                <p className="text-white/85 text-[14px]">{s.quando}</p>
                {situacao === i && <p className="font-cormorant italic text-gold/90 text-[17px] leading-snug mt-3">{s.responde}</p>}
              </button>
            ))}
          </div>
        </section>

        {/* O que manter */}
        <section className="mb-6">
          <Titulo sub="Já funciona: não mudes">O que manter</Titulo>
          <ul className="grid sm:grid-cols-2 gap-2.5">
            {plano.o_que_manter.map((m, i) => (
              <li key={i} className="flex gap-3 rounded-xl border border-green-500/20 bg-green-500/[0.06] px-4 py-3 text-[13px] text-white/70 leading-relaxed">
                <span className="text-green-400 shrink-0">+</span>{m}
              </li>
            ))}
          </ul>
        </section>
      </>)}
    </main>
  )
}
