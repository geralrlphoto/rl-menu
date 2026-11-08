/* ============================================================
   /api/blog-enviar-noivas  (GET, POST, admin)
   Envia o card "Novo no blog" às noivas com email no contrato
   (dados_contrato_cps.email_noiva), em LOTES DIÁRIOS para não
   passar o limite de emails do Resend (os emails da app aos
   noivos, equipa e newsletter usam a mesma quota).
   Cada envio fica em blog_envios (artigo + email), por isso
   ninguém recebe o mesmo artigo duas vezes e cada lote continua
   onde o anterior parou.

   GET  ?article_id=…            → { total, enviados, faltam, hoje, abertos, cliques }
   POST { article_id }           → envia o próximo lote (até LOTE_DIA hoje)
   POST { article_id, teste }    → só para o email da RL
   Quem cancelou (blog_noivas_removidas) ou está bounced/unsubscribed
   na newsletter fica de fora.
   ============================================================ */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { buildCardBlogNoivas } from '@/lib/blogCardNoivas'
import { assinaturaCancelar } from '@/lib/blogCancelar'

export const maxDuration = 60

/** Máximo de cards do blog por dia (deixa margem para os outros emails da app). */
const LOTE_DIA = 30
const EMAIL_TESTE = 'geral.rlphoto@gmail.com'
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://portal.rlphotovideo.pt').replace(/\/+$/, '')

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

function linkCancelar(email: string): string {
  return `${SITE}/api/blog-cancelar?e=${encodeURIComponent(email)}&t=${assinaturaCancelar(email)}`
}

function inicioDoDia(): string {
  const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString()
}

/** Noivas que devem receber (sem as que cancelaram) e o que já foi enviado deste artigo. */
async function situacao(sb: SupabaseClient, articleId: string) {
  const [{ data: contratos }, { data: removidas }, { data: fora }, { data: envios }, { count: hoje }] = await Promise.all([
    sb.from('dados_contrato_cps').select('email_noiva').like('email_noiva', '%@%'),
    sb.from('blog_noivas_removidas').select('email'),
    sb.from('newsletter_subscribers').select('email').in('status', ['unsubscribed', 'bounced']),
    sb.from('blog_envios').select('email, aberto_at, clicado_at').eq('article_id', articleId),
    sb.from('blog_envios').select('email', { count: 'exact', head: true }).gte('enviado_at', inicioDoDia()),
  ])
  const excluir = new Set([...(removidas ?? []), ...(fora ?? [])].map((r: any) => String(r.email).toLowerCase().trim()))
  const todas = Array.from(new Set((contratos ?? []).map((c: any) => String(c.email_noiva).toLowerCase().trim())))
    .filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && !excluir.has(e))
  const jaRecebeu = new Set((envios ?? []).map((r: any) => String(r.email)))
  const faltam = todas.filter(e => !jaRecebeu.has(e))
  const abertos = (envios ?? []).filter((r: any) => r.aberto_at).length
  const cliques = (envios ?? []).filter((r: any) => r.clicado_at).length
  return { total: todas.length, enviados: todas.length - faltam.length, faltam, hoje: hoje ?? 0, abertos, cliques }
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('article_id')
  if (!id) return NextResponse.json({ ok: false, error: 'article_id em falta' }, { status: 400 })
  try {
    const s = await situacao(db(), id)
    return NextResponse.json({ ok: true, total: s.total, enviados: s.enviados, faltam: s.faltam.length, hoje: s.hoje, lote: LOTE_DIA, abertos: s.abertos, cliques: s.cliques })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'erro' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { article_id, teste } = await req.json().catch(() => ({}))
  if (!article_id) return NextResponse.json({ ok: false, error: 'article_id em falta' }, { status: 400 })
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ ok: false, error: 'RESEND_API_KEY em falta' }, { status: 500 })

  const sb = db()
  const { data: art } = await sb.from('blog_articles').select('*').eq('id', article_id).maybeSingle()
  if (!art) return NextResponse.json({ ok: false, error: 'Artigo não encontrado' }, { status: 404 })

  let emails: string[]
  if (teste) {
    emails = [EMAIL_TESTE]
  } else {
    const s = await situacao(sb, article_id)
    const livres = Math.max(0, LOTE_DIA - s.hoje)
    if (!s.faltam.length) return NextResponse.json({ ok: false, error: 'Todas as noivas já receberam este artigo' }, { status: 400 })
    if (!livres) return NextResponse.json({ ok: false, error: `Já saíram ${LOTE_DIA} cards hoje. O próximo lote fica para amanhã.` }, { status: 400 })
    emails = s.faltam.slice(0, livres)
  }

  const html = buildCardBlogNoivas(art)
  const lote = emails.map(to => ({
    from: process.env.FROM_EMAIL ?? 'RL Photo.Video <geral@rlphotovideo.pt>',
    to: [to],
    reply_to: 'geral.rlphoto@gmail.com',
    subject: `Novo no blog: ${art.title}`,
    html: html.replace(/\{\{CANCELAR\}\}/g, linkCancelar(to)),
  }))

  const r = await fetch('https://api.resend.com/emails/batch', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(lote),
  }).catch(() => null)
  const d = r ? await r.json().catch(() => ({})) : {}
  if (!r?.ok || !Array.isArray(d?.data)) {
    console.error('[blog-enviar-noivas] lote falhou:', d)
    return NextResponse.json({ ok: false, error: d?.message ?? 'O Resend recusou o envio (limite diário?)' }, { status: 502 })
  }

  if (!teste) {
    // resend_id liga cada envio às aberturas e cliques que chegam pelo webhook (/api/newsletter-webhook)
    await sb.from('blog_envios').insert(emails.map((email, i) => ({ article_id, email, resend_id: d.data[i]?.id ?? null })))
  }
  const s = teste ? null : await situacao(sb, article_id)
  return NextResponse.json({ ok: true, enviados: emails.length, faltam: s?.faltam.length ?? 0, total: s?.total ?? 1 })
}
