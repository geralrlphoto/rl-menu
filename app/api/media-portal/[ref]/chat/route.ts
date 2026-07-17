import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type Params = { params: Promise<{ ref: string }> }

const BASE_URL = 'https://rl-menu-lake.vercel.app'
const EMAIL_FROM = 'RL PROD <geral@rlphotovideo.pt>'
const ADMIN_FALLBACK_EMAIL = 'geral.rlmedia@gmail.com'

/* ── GET — buscar mensagens ── */
export async function GET(_req: NextRequest, { params }: Params) {
  const { ref } = await params
  const { data } = await supabase
    .from('media_portais')
    .select('dados')
    .eq('ref', ref.toUpperCase())
    .single()

  const mensagens = data?.dados?.chatMensagens ?? []
  return NextResponse.json({ mensagens })
}

/* ── POST — enviar mensagem ── */
export async function POST(req: NextRequest, { params }: Params) {
  const { ref } = await params
  const body = await req.json()
  const { texto, autor, isAdmin } = body

  if (!texto?.trim()) {
    return NextResponse.json({ error: 'Texto vazio' }, { status: 400 })
  }

  /* verificar se isAdmin bate certo com o cookie */
  const cookieStore = await cookies()
  const authOk = cookieStore.get('rl_auth')?.value === process.env.AUTH_SECRET
  const adminReal = isAdmin && authOk

  const novaMensagem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    texto: texto.trim(),
    autor: adminReal ? (autor || 'RL PROD') : (autor || 'Cliente'),
    isAdmin: adminReal,
    criadoEm: new Date().toISOString(),
  }

  /* buscar dados actuais e fazer append */
  const { data: existing } = await supabase
    .from('media_portais')
    .select('dados')
    .eq('ref', ref.toUpperCase())
    .single()

  const mensagens = [...(existing?.dados?.chatMensagens ?? []), novaMensagem]

  const merged = { ...(existing?.dados ?? {}), chatMensagens: mensagens }

  const { error } = await supabase
    .from('media_portais')
    .upsert(
      { ref: ref.toUpperCase(), dados: merged, updated_at: new Date().toISOString() },
      { onConflict: 'ref' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // ── Aviso por email (substitui o polling ao vivo) ──────────────────────
  //   · Mensagem do cliente  → email para o gestor (admin)
  //   · Mensagem do admin    → email para o cliente
  //   Não bloqueia a resposta: se o email falhar, a mensagem já foi gravada.
  let emailSent = false
  try {
    emailSent = await notifyByEmail({
      ref: ref.toUpperCase(),
      dados: existing?.dados ?? {},
      fromAdmin: adminReal,
      texto: novaMensagem.texto,
      autor: novaMensagem.autor,
    })
  } catch (e) {
    console.error('[chat] falha no email de aviso:', e)
  }

  return NextResponse.json({ ok: true, mensagem: novaMensagem, emailSent })
}

/**
 * Envia o email de aviso de nova mensagem para o destinatário certo, com o
 * texto e um botão "Responder no portal". Devolve true se o email foi aceite
 * pela Resend. Nunca lança para fora — devolve false em caso de configuração
 * em falta (sem RESEND_API_KEY ou sem email do destinatário).
 */
async function notifyByEmail(opts: {
  ref: string
  dados: Record<string, any>
  fromAdmin: boolean
  texto: string
  autor: string
}): Promise<boolean> {
  const { ref, dados, fromAdmin, texto, autor } = opts

  if (!process.env.RESEND_API_KEY) return false

  const projetoNome: string = dados?.nome || dados?.cliente || ref
  const clienteEmail: string | undefined = dados?.fichaCliente?.email || undefined
  const adminEmail: string = dados?.gestorEmail || ADMIN_FALLBACK_EMAIL

  // Destinatário e cópia de contexto conforme a direção da mensagem
  const to = fromAdmin ? clienteEmail : adminEmail
  if (!to) return false

  const portalUrl = `${BASE_URL}/portal-media/${encodeURIComponent(ref)}/atendimento`
  const subject = fromAdmin
    ? `Nova mensagem — ${projetoNome}`
    : `Nova mensagem no portal — ${projetoNome}`

  const intro = fromAdmin
    ? 'Tens uma nova mensagem da RL PROD sobre o teu projeto.'
    : `${autor} enviou uma nova mensagem no portal do projeto.`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: [to],
      subject,
      html: buildEmailHtml({ projetoNome, intro, autor, texto, portalUrl }),
    }),
  })
  return res.ok
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildEmailHtml(opts: {
  projetoNome: string
  intro: string
  autor: string
  texto: string
  portalUrl: string
}): string {
  const { projetoNome, intro, autor, texto, portalUrl } = opts
  const safeTexto = escapeHtml(texto).replace(/\n/g, '<br/>')
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0d0901;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0901;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#141009;border:1px solid rgba(201,164,92,0.25);border-radius:14px;overflow:hidden;">
          <tr>
            <td style="height:3px;background:linear-gradient(90deg,transparent,#C9A84C,transparent);"></td>
          </tr>
          <tr>
            <td style="padding:28px 30px 8px 30px;">
              <p style="margin:0;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#C9A84C;">Portal do Projeto</p>
              <p style="margin:6px 0 0 0;font-size:20px;color:#f5f0e6;">${escapeHtml(projetoNome)}</p>
              <p style="margin:14px 0 0 0;font-size:14px;line-height:1.6;color:rgba(245,240,230,0.65);">${escapeHtml(intro)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 30px 4px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:10px;">
                <tr>
                  <td style="padding:14px 16px;">
                    <p style="margin:0 0 6px 0;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.35);">${escapeHtml(autor)}</p>
                    <p style="margin:0;font-size:15px;line-height:1.6;color:rgba(245,240,230,0.9);">${safeTexto}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:22px 30px 30px 30px;">
              <a href="${portalUrl}" style="display:inline-block;text-decoration:none;background:#C9A84C;color:#1F1608;font-size:13px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;padding:13px 30px;border-radius:8px;">
                Responder no portal
              </a>
              <p style="margin:16px 0 0 0;font-size:12px;color:rgba(255,255,255,0.28);">
                Responde diretamente no portal para a conversa ficar registada.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
