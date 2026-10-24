/* ============================================================
   /api/media-portal/[ref]/contrato-assinado (POST)

   O cliente devolve o contrato assinado a partir da página Contrato & Dados
   do portal. O ficheiro vai direto para o Storage (bucket privado
   "contratos-assinados", só abre com links temporários)
   por um link de envio temporário, para não esbarrar no limite de
   tamanho das funções do Vercel.

     { acao: 'preparar', nome, tipo }  → { path, token }
     { acao: 'confirmar', path, nome } → grava dados.contratoAssinado,
                                         aviso no sino do admin + email

   Acesso: admin, ou quem tem a senha do portal (cookie pm_REF),
   ou portal sem senha.
   ============================================================ */

import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const BUCKET = 'contratos-assinados'
const TIPOS: Record<string, string> = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png' }

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ ref: string }> }) {
  const { ref: refRaw } = await params
  const ref = refRaw.toUpperCase()
  const sb = db()

  const { data: row } = await sb.from('media_portais').select('dados').eq('ref', ref).maybeSingle()
  if (!row) return NextResponse.json({ error: 'Portal não encontrado.' }, { status: 404 })
  const dados = (row.dados ?? {}) as Record<string, any>

  // Mesmo controlo de acesso do layout do portal
  const jar = await cookies()
  const isAdmin = jar.get('rl_auth')?.value === process.env.AUTH_SECRET
  const senha = dados.senha as string | undefined
  if (senha && !isAdmin && jar.get(`pm_${ref}`)?.value !== senha) {
    return NextResponse.json({ error: 'Sem acesso a este portal.' }, { status: 401 })
  }

  const body = await req.json() as { acao: string; nome?: string; tipo?: string; path?: string }

  if (body.acao === 'preparar') {
    const ext = TIPOS[body.tipo ?? '']
    if (!ext) return NextResponse.json({ error: 'Envia o contrato em PDF, JPG ou PNG.' }, { status: 400 })
    const path = `assinados/${ref}-${Date.now()}.${ext}`
    const { data, error } = await sb.storage.from(BUCKET).createSignedUploadUrl(path)
    if (error || !data) return NextResponse.json({ error: error?.message ?? 'Não foi possível preparar o envio.' }, { status: 500 })
    return NextResponse.json({ path: data.path, token: data.token })
  }

  if (body.acao === 'confirmar') {
    const path = body.path ?? ''
    if (!path.startsWith(`assinados/${ref}-`)) return NextResponse.json({ error: 'Ficheiro inválido.' }, { status: 400 })
    const agora = new Date().toISOString()
    const contratoAssinado = { path, nome: body.nome || 'Contrato assinado', enviadoEm: agora, porAdmin: isAdmin }
    // Links temporários: 1 h para a página, 7 dias para o email à equipa
    const { data: link } = await sb.storage.from(BUCKET).createSignedUrl(path, 3600)
    const { data: linkEmail } = await sb.storage.from(BUCKET).createSignedUrl(path, 7 * 24 * 3600)
    const url = linkEmail?.signedUrl ?? ''

    const log: any[] = Array.isArray(dados.notify_log) ? dados.notify_log : []
    if (!isAdmin) {
      log.push({ type: 'contrato-assinado', title: 'Contrato assinado recebido', body: `${dados.nome ?? ref} devolveu o contrato assinado.`, at: agora, meta: { path } })
      while (log.length > 100) log.shift()
    }
    const { error } = await sb.from('media_portais').update({ dados: { ...dados, contratoAssinado, notify_log: log } }).eq('ref', ref)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Email à RL PROD (o mesmo endereço dos avisos de leads)
    if (!isAdmin && process.env.RESEND_API_KEY) {
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'RL PROD <geral@rlphotovideo.pt>',
          to: ['geral.rlmedia@gmail.com'],
          subject: `Contrato assinado · ${dados.nome ?? ref}`,
          html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#00141f;color:#fff;padding:28px">
            <p style="margin:0;font-size:11px;letter-spacing:.3em;color:#5a8bff;text-transform:uppercase">RL PROD · Portal do cliente</p>
            <h1 style="margin:10px 0 16px;font-size:22px">Contrato assinado recebido</h1>
            <p style="font-size:14px;color:rgba(255,255,255,.75)">${dados.nome ?? ref} devolveu o contrato assinado pelo portal.</p>
            <p style="margin:22px 0"><a href="${url}" style="background:#2e6cf6;color:#fff;padding:12px 22px;border-radius:6px;text-decoration:none">Ver contrato assinado</a></p>
            <p style="font-size:12px;color:rgba(255,255,255,.45)">Portal: https://portal.rlphotovideo.pt/portal-media/${ref}/contrato</p>
          </div>`,
        }),
      }).catch(() => {})
    }

    return NextResponse.json({ ok: true, contratoAssinado: { ...contratoAssinado, url: link?.signedUrl ?? null } })
  }

  return NextResponse.json({ error: 'Ação desconhecida.' }, { status: 400 })
}
