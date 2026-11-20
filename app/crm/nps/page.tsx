'use client'

// Pasta NPS do CRM: todas as respostas ao /nps (só noivos que fecharam), com a nota,
// as 8 respostas e os noivos indicados. Cada resposta liga à ficha da lead.
// Mesmo branding do /crm: fundo #070707, capa com a foto do CRM, dourado #C9A84C.

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { PERGUNTAS_NPS, tituloSimplesNps, respostaTextoNps, type RespostasNps } from '@/lib/nps'

type Nps = {
  id: string
  contact_id: string
  nota: number
  respostas: RespostasNps | null
  indicacao_nome: string | null
  indicacao_contacto: string | null
  created_at: string
}
type Lead = { id: string; nome: string | null }

// Dourado em intensidades, como as colunas do /crm (nota mais alta = ouro mais forte)
const ouro = (a: number) => `rgba(201,168,76,${a})`
const intensidadeNota = (n: number) => (n >= 9 ? 0.95 : n >= 7 ? 0.65 : 0.32)
const fmtData = (s: string) => new Date(s).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })

export default function NpsPage() {
  const [lista, setLista] = useState<Nps[]>([])
  const [leads, setLeads] = useState<Record<string, Lead>>({})
  const [indicadas, setIndicadas] = useState<Record<string, string>>({}) // nome indicado -> id da lead nova
  const [loading, setLoading] = useState(true)
  const [aberto, setAberto] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('crm_nps')
        .select('id, contact_id, nota, respostas, indicacao_nome, indicacao_contacto, created_at')
        .order('created_at', { ascending: false }).limit(500)
      const l = (data ?? []) as Nps[]
      const ids = Array.from(new Set(l.map(n => n.contact_id)))
      if (ids.length) {
        const { data: ls } = await supabase.from('crm_contacts').select('id, nome').in('id', ids)
        setLeads(Object.fromEntries((ls ?? []).map(x => [x.id, x])))
      }
      if (l.some(n => n.indicacao_nome)) {
        const { data: novas } = await supabase.from('crm_contacts').select('id, nome').eq('como_chegou', 'Indicação')
        setIndicadas(Object.fromEntries((novas ?? []).map(x => [String(x.nome ?? '').trim().toLowerCase(), x.id])))
      }
      setLista(l)
      setLoading(false)
    })()
  }, [])

  const kpis = useMemo(() => {
    const n = lista.length
    const prom = lista.filter(x => x.nota >= 9).length
    const detr = lista.filter(x => x.nota <= 6).length
    return {
      n, prom, detr,
      nps: n ? Math.round(((prom - detr) / n) * 100) : null,
      media: n ? Math.round((lista.reduce((s, x) => s + x.nota, 0) / n) * 10) / 10 : null,
      ind: lista.filter(x => x.indicacao_nome).length,
    }
  }, [lista])

  return (
    <main className="min-h-screen overflow-x-clip font-cond bg-[#070707]">

      {/* ── CAPA (igual ao /crm) ── */}
      <section className="relative min-h-[520px] lg:min-h-[70vh] flex flex-col overflow-hidden">
        <div className="absolute inset-y-0 right-0 w-full lg:w-[64%]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/crm-hero.webp" alt="" className="absolute inset-0 w-full h-full object-cover object-[center_35%] grayscale opacity-40 lg:opacity-55" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, #070707 0%, rgba(7,7,7,0.75) 30%, rgba(7,7,7,0.15) 70%, rgba(7,7,7,0.5) 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(0deg, #070707 0%, transparent 35%, transparent 75%, rgba(7,7,7,0.6) 100%)' }} />
        </div>
        <div className="absolute top-0 bottom-0 left-6 sm:left-10 lg:left-14 w-px bg-[#C9A84C]/45" />
        <p className="hidden md:block absolute right-6 top-1/2 -translate-y-1/2 text-[11px] tracking-[0.4em] uppercase text-white/30 [writing-mode:vertical-rl]">
          Satisfação dos noivos · {new Date().getFullYear()}
        </p>

        <div className="relative flex-1 grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_340px] gap-10 items-end pl-11 sm:pl-16 lg:pl-24 pr-5 sm:pr-16 pt-16 lg:pt-8 pb-12 lg:pb-16">
          <div className="min-w-0 flex flex-col h-full">
            <Link href="/crm" className="text-[14px] text-white/45 hover:text-[#C9A84C] transition-colors">‹ CRM</Link>
            <div className="mt-auto pt-16">
              <p className="text-[13px] sm:text-[18px] font-bold tracking-[0.55em] uppercase text-[#C9A84C]">RL Photo.Video</p>
              <h1 className="font-bold uppercase text-white leading-[0.88] text-[72px] sm:text-[130px] lg:text-[160px] mt-2">NPS</h1>
              <div className="flex items-center gap-4 mt-5">
                <span className="hidden sm:block w-12 h-px bg-[#C9A84C]" />
                <p className="text-[13px] sm:text-[17px] tracking-[0.22em] uppercase text-white/70">
                  Contacto · Reunião · Portal · <span className="text-[#C9A84C]">Proposta</span>
                </p>
              </div>
              <p className="font-light text-white/50 text-[15px] sm:text-[17px] leading-relaxed mt-5 max-w-xl">
                {loading ? 'A carregar respostas…' : `${kpis.n} ${kpis.n === 1 ? 'resposta' : 'respostas'} de noivos que fecharam · ${kpis.ind} ${kpis.ind === 1 ? 'indicação' : 'indicações'}`}
              </p>
            </div>
          </div>

          {/* Números do NPS (mesmo painel do Pipeline do /crm) */}
          {!loading && (
            <aside className="rounded-[22px] border border-[#C9A84C]/30 bg-[#111111]/80 backdrop-blur-xl p-5 shadow-[0_0_48px_-22px_rgba(201,168,76,0.5)]">
              <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.12em] uppercase text-white/85">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] shadow-[0_0_8px_#C9A84C]" />
                Resultados
              </p>
              <div className="grid grid-cols-2 mt-3">
                {[
                  { l: 'NPS', v: kpis.nps !== null ? String(kpis.nps) : '-', s: `${kpis.prom} promotores · ${kpis.detr} detratores`, ouro: true },
                  { l: 'Nota média', v: kpis.media !== null ? kpis.media.toLocaleString('pt-PT') : '-', s: 'de 0 a 10' },
                  { l: 'Respostas', v: String(kpis.n), s: 'noivos que fecharam' },
                  { l: 'Indicações', v: String(kpis.ind), s: 'noivos indicados', ouro: true },
                ].map((x, i) => (
                  <div key={x.l} className={`py-3 min-w-0 ${i % 2 === 0 ? 'pr-3 border-r border-white/[0.07]' : 'pl-3'} ${i < 2 ? 'border-b border-white/[0.07]' : ''}`}>
                    <p className="text-[11px] text-white/50 truncate">{x.l}</p>
                    <p className={`font-semibold text-[21px] leading-none mt-1.5 truncate ${x.ouro ? 'text-[#C9A84C]' : 'text-white'}`}>{x.v}</p>
                    <p className="text-[10.5px] text-white/30 mt-1 truncate">{x.s}</p>
                  </div>
                ))}
              </div>
            </aside>
          )}
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-3 sm:px-6 pt-10 pb-12">
        <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#C9A84C]">Respostas</p>
        <h2 className="font-semibold text-white text-[28px] leading-tight mt-1 mb-4">O que os noivos disseram</h2>

        {loading ? (
          <div className="text-center py-16 text-white/25 text-[13px]">A carregar…</div>
        ) : lista.length === 0 ? (
          <div className="rounded-[22px] border border-[#C9A84C]/[0.12] bg-[#111111]/80 text-center py-16 px-4 text-white/35 text-[14px]" style={{ borderTop: `2px solid ${ouro(0.5)}` }}>
            Ainda não há respostas ao NPS. Aparecem aqui assim que os noivos responderem.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {lista.map(n => {
              const lead = leads[n.contact_id]
              const abrir = aberto === n.id
              const novaId = n.indicacao_nome ? indicadas[n.indicacao_nome.trim().toLowerCase()] : undefined
              const a = intensidadeNota(n.nota)
              return (
                <section key={n.id} className="rounded-[22px] border border-[#C9A84C]/[0.12] bg-[#111111]/80" style={{ borderTop: `2px solid ${ouro(a)}` }}>
                  <button type="button" onClick={() => setAberto(abrir ? null : n.id)} className="w-full flex items-center gap-4 px-4 sm:px-6 py-4 text-left">
                    <span className="w-12 h-12 shrink-0 rounded-full flex items-center justify-center font-semibold text-[19px]"
                      style={{ color: ouro(Math.max(a, 0.6)), background: ouro(0.12), boxShadow: `0 0 14px -4px ${ouro(a)}` }}>{n.nota}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] tracking-[0.12em] uppercase font-semibold text-white truncate">{lead?.nome?.trim() || 'Lead apagada'}</p>
                      <p className="text-[12px] text-white/40 truncate">
                        {fmtData(n.created_at)}{n.indicacao_nome ? <> · <span className="text-[#C9A84C]">indicaram {n.indicacao_nome}</span></> : null}
                      </p>
                    </div>
                    <span className="w-8 h-8 shrink-0 rounded-full border border-white/10 flex items-center justify-center text-white/40">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 transition-transform duration-300" style={{ transform: abrir ? 'rotate(180deg)' : 'none' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                      </svg>
                    </span>
                  </button>
                  {abrir && (
                    <div className="px-4 sm:px-6 pb-5 flex flex-col gap-4 border-t border-white/[0.06] pt-4">
                      <dl className="grid sm:grid-cols-2 gap-3">
                        {PERGUNTAS_NPS.map(p => (
                          <div key={p.id} className="rounded-[14px] border border-white/[0.07] bg-black/30 px-3.5 py-2.5">
                            <dt className="text-[11px] text-white/45">{tituloSimplesNps(p.titulo)}</dt>
                            <dd className="text-[14px] text-white/90 whitespace-pre-wrap mt-0.5">{respostaTextoNps(p, n.respostas?.[p.id])}</dd>
                          </div>
                        ))}
                      </dl>
                      {n.indicacao_nome && (
                        <div className="rounded-[14px] border border-[#C9A84C]/40 bg-[#C9A84C]/10 px-4 py-3">
                          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#C9A84C] mb-1">Noivos indicados</p>
                          <p className="text-[14px] text-white/90">{n.indicacao_nome}{n.indicacao_contacto ? ` · ${n.indicacao_contacto}` : ''}</p>
                          <p className="text-[12px] text-white/50 mt-1">Se fecharem, oferecer um serviço a {lead?.nome?.trim() || 'quem indicou'}.</p>
                          {novaId && <Link href={`/crm/${novaId}`} className="inline-block mt-2 text-[12px] tracking-[0.15em] uppercase text-[#C9A84C] hover:underline">Abrir lead dos indicados ›</Link>}
                        </div>
                      )}
                      {lead && (
                        <Link href={`/crm/${lead.id}`}
                          className="self-start inline-flex items-center gap-2 border border-[#C9A84C]/70 bg-[#C9A84C]/15 hover:bg-[#C9A84C]/30 px-5 py-2.5 text-[13px] font-semibold tracking-[0.18em] uppercase text-white transition-all">
                          Abrir ficha
                        </Link>
                      )}
                    </div>
                  )}
                </section>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
