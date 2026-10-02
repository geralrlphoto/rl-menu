import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { verificarPartilha } from '@/lib/partilha-token'
import PartilhaClient from './PartilhaClient'
import BriefingPartilha from './BriefingPartilha'

export const dynamic = 'force-dynamic'

/** A página partilhada não deve aparecer em motores de busca. */
export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const p = await verificarPartilha(token)
  return {
    title: p?.titulo ? `${p.titulo} · RL Photo Video` : 'RL Photo Video',
    robots: { index: false, follow: false },
  }
}

/**
 * Página partilhada por token assinado.
 *
 * O token diz qual é a página e até quando é válido; sem assinatura válida
 * responde 404. Os URLs dos vídeos são resolvidos aqui, no servidor, para o
 * cliente nunca precisar de chamar /api/portais, que devolveria as
 * definições do portal inteiro, incluindo ids de outras sub-páginas.
 */
export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const p = await verificarPartilha(token)
  if (!p) notFound()
  if ((p.titulo ?? '').toUpperCase().includes('BRIEFING') && p.ref) return briefingPartilhado(p.id, p.ref)

  const videos: Record<string, string> = {}
  // Só o necessário para o cabeçalho. Nada de emails, telefones ou valores:
  // isto viaja para quem quer que receba o link.
  let casal: { cliente: string; data_evento: string | null; local: string } | null = null

  if (p.ref) {
    try {
      const db = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )
      const { data: portal } = await db.from('portais').select('settings').ilike('referencia', p.ref).maybeSingle()
      const st = (portal?.settings ?? {}) as Record<string, unknown>
      for (const k of ['wedding_film_url', 'same_day_edit_url', 'video_prewedding_url', 'teaser_url']) {
        const v = st[k]
        if (typeof v === 'string' && v.trim()) videos[k] = v.trim()
      }

      const { data: ev } = await db.from('eventos_2026')
        .select('cliente, data_evento, local')
        .ilike('referencia', p.ref).maybeSingle()
      if (ev) casal = { cliente: ev.cliente ?? '', data_evento: ev.data_evento ?? null, local: ev.local ?? '' }
    } catch { /* sem dados: a página mostra os painéis em espera */ }
  }

  return <PartilhaClient id={p.id} videos={videos} casal={casal} />
}

/**
 * Briefing partilhado: lido no servidor e filtrado antes de ir para o browser.
 * Sai o que a equipa e os fornecedores precisam no dia; ficam de fora as notas
 * privadas e o histórico de alterações.
 */
async function briefingPartilhado(id: string, ref: string) {
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const [{ data: portal }, { data: ev }, { data: eq }] = await Promise.all([
    db.from('portais').select('settings').ilike('referencia', ref).maybeSingle(),
    db.from('eventos_2026').select('cliente, data_evento, local').ilike('referencia', ref).maybeSingle(),
    db.from('evento_equipa').select('fotografo, videografo').eq('referencia', ref).maybeSingle(),
  ])
  const st = (portal?.settings ?? {}) as Record<string, any>
  const { notasPrivadas: _np, historico: _h, ...info } = (st.briefingInfo?.[id] ?? {}) as Record<string, any>

  const bonito = (n: string) => n.toLowerCase().replace(/(^|[\s-])\S/g, c => c.toUpperCase())
  const nome = (v: unknown) => (typeof v === 'string' && v.trim() ? bonito(v.trim()) : '')
  const daFicha = [
    ...((eq?.fotografo ?? []) as string[]).map(n => ({ role: 'Fotógrafo', name: bonito(n) })),
    ...((eq?.videografo ?? []) as string[]).map(n => ({ role: 'Videógrafo', name: bonito(n) })),
  ]
  const manual = ((info.equipa ?? []) as Array<{ role: string; name: string }>).filter(e => e?.name)
  const jaTem = new Set(manual.map(e => e.name.toLowerCase()))
  const equipa = [...manual, ...daFicha.filter(e => !jaTem.has(e.name.toLowerCase()))]

  return (
    <BriefingPartilha
      info={{ ...info, equipa }}
      fichas={(st.briefingFichas ?? {}) as Record<string, Array<{ id: string; label: string; value: string }>>}
      equipa={equipa}
      nomes={{ noiva: nome(st.noiva), noivo: nome(st.noivo) }}
      casal={ev ? { cliente: ev.cliente ?? '', data_evento: ev.data_evento ?? null, local: ev.local ?? '' } : null}
    />
  )
}
