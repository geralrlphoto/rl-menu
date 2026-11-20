'use client'

// Pasta NPS do CRM: todas as respostas ao /nps (só noivos que fecharam), com a nota,
// as 8 respostas e os noivos indicados. Cada resposta liga à ficha da lead.

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

const corNota = (n: number) => (n >= 9 ? 'text-green-400 border-green-500/40 bg-green-500/10' : n >= 7 ? 'text-[#C9A84C] border-[#C9A84C]/40 bg-[#C9A84C]/10' : 'text-red-400 border-red-500/40 bg-red-500/10')
const fmtData = (s: string) => new Date(s).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })

function KPI({ label, value, sub, color = 'text-white' }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md px-4 sm:px-5 py-3 sm:py-4">
      <p className="text-white/50 text-[9px] sm:text-[10px] tracking-[0.25em] uppercase mb-1.5 sm:mb-2">{label}</p>
      <p className={`text-xl sm:text-2xl font-light ${color}`}>{value}</p>
      {sub && <p className="text-white/45 text-[10px] sm:text-[11px] mt-1">{sub}</p>}
    </div>
  )
}

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
    if (!n) return null
    const prom = lista.filter(x => x.nota >= 9).length
    const detr = lista.filter(x => x.nota <= 6).length
    const media = Math.round((lista.reduce((s, x) => s + x.nota, 0) / n) * 10) / 10
    return { n, nps: Math.round(((prom - detr) / n) * 100), media, prom, detr, ind: lista.filter(x => x.indicacao_nome).length }
  }, [lista])

  if (loading) {
    return <main className="min-h-screen flex items-center justify-center text-white/30 text-sm tracking-widest">A carregar NPS…</main>
  }

  return (
    <main className="min-h-screen px-3 sm:px-6 py-6 sm:py-10 max-w-[1400px] mx-auto">
      {/* ── CAPA ── */}
      <section className="relative rounded-3xl overflow-hidden border border-white/10 mb-6 min-h-[380px] flex flex-col">
        <img src="/boas-vindas-camera.webp" alt="" className="absolute inset-0 w-full h-full object-cover object-[70%_center]" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/65 to-black/5" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
        <div className="relative flex-1 flex flex-col px-5 sm:px-10 pt-5 sm:pt-7 pb-5 sm:pb-7">
          <Link href="/crm" className="text-xs tracking-[0.3em] text-white/50 hover:text-gold transition-colors uppercase">‹ CRM</Link>
          <div className="flex-1 flex flex-col justify-center py-8 max-w-xl">
            <p className="text-[10px] tracking-[0.45em] uppercase text-white/45">RL Photo.Video · Noivos que fecharam</p>
            <h1 className="font-cormorant font-light text-gold text-5xl sm:text-7xl tracking-[0.08em] leading-none mt-3">NPS</h1>
            <div className="w-20 h-px bg-gold/70 my-5" />
            <p className="font-cormorant italic text-white/80 text-lg sm:text-xl leading-snug">
              O que os noivos acharam do caminho até ao sim: primeiro contacto, reunião, portal e proposta. E os noivos que nos indicaram.
            </p>
          </div>
          {kpis && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              <KPI label="Respostas" value={String(kpis.n)} />
              <KPI label="NPS" value={String(kpis.nps)} sub={`${kpis.prom} promotores · ${kpis.detr} detratores`} color={kpis.nps >= 50 ? 'text-green-400' : kpis.nps >= 0 ? 'text-gold' : 'text-red-400'} />
              <KPI label="Nota média" value={kpis.media.toLocaleString('pt-PT')} sub="de 0 a 10" color="text-gold" />
              <KPI label="Indicações" value={String(kpis.ind)} sub="noivos indicados" color="text-gold" />
            </div>
          )}
        </div>
      </section>

      {lista.length === 0 ? (
        <p className="text-center text-white/40 text-sm py-16">Ainda não há respostas ao NPS. Aparecem aqui assim que os noivos responderem.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {lista.map(n => {
            const lead = leads[n.contact_id]
            const abrir = aberto === n.id
            const novaId = n.indicacao_nome ? indicadas[n.indicacao_nome.trim().toLowerCase()] : undefined
            return (
              <div key={n.id} className="rounded-2xl border border-white/10 bg-[#111111]/80 backdrop-blur-xl">
                <button type="button" onClick={() => setAberto(abrir ? null : n.id)} className="w-full flex items-center gap-4 px-4 sm:px-6 py-4 text-left">
                  <span className={`w-12 h-12 shrink-0 rounded-full border flex items-center justify-center text-lg font-semibold ${corNota(n.nota)}`}>{n.nota}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-[15px] truncate">{lead?.nome?.trim() || 'Lead apagada'}</p>
                    <p className="text-white/40 text-xs">{fmtData(n.created_at)}{n.indicacao_nome ? ` · indicaram ${n.indicacao_nome}` : ''}</p>
                  </div>
                  <span className="text-white/40 text-sm">{abrir ? '−' : '+'}</span>
                </button>
                {abrir && (
                  <div className="px-4 sm:px-6 pb-5 flex flex-col gap-4 border-t border-white/[0.06] pt-4">
                    <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
                      {PERGUNTAS_NPS.map(p => (
                        <div key={p.id}>
                          <dt className="text-[11px] text-white/45">{tituloSimplesNps(p.titulo)}</dt>
                          <dd className="text-sm text-white/90 whitespace-pre-wrap">{respostaTextoNps(p, n.respostas?.[p.id])}</dd>
                        </div>
                      ))}
                    </dl>
                    {n.indicacao_nome && (
                      <div className="rounded-xl border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-4 py-3 text-sm">
                        <p className="text-[11px] tracking-[0.2em] uppercase text-[#C9A84C] mb-1">Noivos indicados</p>
                        <p className="text-white/90">{n.indicacao_nome}{n.indicacao_contacto ? ` · ${n.indicacao_contacto}` : ''}</p>
                        <p className="text-white/50 text-xs mt-1">Se fecharem, oferecer um serviço a {lead?.nome?.trim() || 'quem indicou'}.</p>
                        {novaId && <Link href={`/crm/${novaId}`} className="inline-block mt-2 text-xs text-[#C9A84C] hover:underline">Abrir lead dos indicados ›</Link>}
                      </div>
                    )}
                    {lead && <Link href={`/crm/${lead.id}`} className="self-start text-xs px-4 py-2 rounded-lg border border-white/20 text-white/80 hover:border-white/50">Abrir ficha</Link>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
