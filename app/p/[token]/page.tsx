import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { verificarPartilha } from '@/lib/partilha-token'
import PartilhaClient from './PartilhaClient'

export const dynamic = 'force-dynamic'

/** A página partilhada não deve aparecer em motores de busca. */
export const metadata = {
  robots: { index: false, follow: false },
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

  return <PartilhaClient id={p.id} titulo={p.titulo} videos={videos} casal={casal} />
}
