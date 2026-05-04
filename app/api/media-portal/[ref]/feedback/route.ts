import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { getProjeto } from '@/app/portal-media/_data/mockProject'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type Params = { params: Promise<{ ref: string }> }

/* ─────────────────── helpers de email ─────────────────── */

function neonCard(badge: string, badgeColor: string, title: string, body: string, btnLabel: string, btnUrl: string, nomeProjeto: string, cliente: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#020810;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#020810;min-height:100vh;">
<tr><td align="center" style="padding:0;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#020810;padding:56px 16px;">
<tr><td align="center">

<table width="460" cellpadding="0" cellspacing="0" border="0"
  style="max-width:460px;width:100%;background-color:#07101f;
         background-image:linear-gradient(rgba(30,80,220,0.13) 1px,transparent 1px),linear-gradient(90deg,rgba(30,80,220,0.13) 1px,transparent 1px);
         background-size:44px 44px;border:1px solid rgba(40,100,255,0.22);border-top:none;">

  <tr><td height="3" style="background:linear-gradient(90deg,#020810,#2563eb,#020810);font-size:0;line-height:0;">&nbsp;</td></tr>

  <tr><td style="padding:52px 44px 44px;text-align:center;">

    <table cellpadding="0" cellspacing="0" style="margin:0 auto 36px;">
      <tr><td style="width:90px;height:90px;border-radius:50%;border:1px solid rgba(255,255,255,0.22);
                     box-shadow:0 0 18px rgba(255,255,255,0.1),inset 0 0 12px rgba(255,255,255,0.04);
                     background:rgba(255,255,255,0.04);text-align:center;vertical-align:middle;padding:0;">
        <img src="https://rl-menu-lake.vercel.app/logo-rl-media-branco.png" width="58" alt="RL Media"
          style="display:block;margin:16px auto;width:58px;height:auto;mix-blend-mode:screen;opacity:0.95;" />
      </td></tr>
    </table>

    <table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 28px;">
      <tr><td height="1" style="background:linear-gradient(90deg,transparent,rgba(37,99,235,0.4),transparent);font-size:0;">&nbsp;</td></tr>
    </table>

    <table cellpadding="0" cellspacing="0" style="margin:0 auto 30px;">
      <tr><td style="border:1px solid ${badgeColor};background:${badgeColor}22;padding:8px 24px;text-align:center;">
        <p style="margin:0;font-size:8px;letter-spacing:7px;color:${badgeColor};text-transform:uppercase;">${badge}</p>
      </td></tr>
    </table>

    <p style="margin:0 0 3px;font-size:9px;letter-spacing:5px;color:rgba(255,255,255,0.18);text-transform:uppercase;">Projeto</p>
    <p style="margin:0 0 5px;font-size:26px;font-weight:200;letter-spacing:5px;color:rgba(255,255,255,0.88);text-transform:uppercase;">${nomeProjeto}</p>
    <p style="margin:0 0 36px;font-size:10px;letter-spacing:3px;color:rgba(255,255,255,0.22);text-transform:uppercase;">${cliente}</p>

    <table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 32px;text-align:left;">
      <tr><td style="border:1px solid rgba(37,99,235,0.2);background:rgba(37,99,235,0.04);padding:18px 22px;">
        <p style="margin:0 0 10px;font-size:8px;letter-spacing:5px;color:rgba(96,165,250,0.6);text-transform:uppercase;">${title}</p>
        <p style="margin:0;font-size:14px;font-weight:300;color:rgba(255,255,255,0.65);line-height:1.8;">${body.replace(/\n/g, '<br>')}</p>
      </td></tr>
    </table>

    <a href="${btnUrl}" target="_blank"
      style="display:inline-block;border:1px solid rgba(37,99,235,0.5);background:rgba(37,99,235,0.1);
             padding:12px 28px;font-size:9px;letter-spacing:5px;color:rgba(147,197,253,0.9);
             text-transform:uppercase;text-decoration:none;">
      ${btnLabel}
    </a>

  </td></tr>

  <tr><td height="1" style="background:linear-gradient(90deg,transparent,rgba(37,99,235,0.35),transparent);font-size:0;line-height:0;">&nbsp;</td></tr>
  <tr><td style="padding:18px 44px;text-align:center;background:#040c1c;">
    <p style="margin:0;font-size:8px;letter-spacing:5px;color:rgba(255,255,255,0.1);text-transform:uppercase;">
      RL Media &middot; Audiovisual &middot; rlmedia.pt
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

async function sendEmail(to: string, subject: string, html: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: 'RL Media <geral@rlphotovideo.pt>', to: [to], subject, html }),
    })
    const data = await res.json()
    if (!res.ok) {
      console.error('[feedback] Resend error:', data)
      return { ok: false, error: data?.message ?? 'Resend error' }
    }
    console.log('[feedback] Email enviado para', to, '| id:', data.id)
    return { ok: true }
  } catch (e: any) {
    console.error('[feedback] sendEmail exception:', e?.message)
    return { ok: false, error: e?.message }
  }
}

/* ─────────────────── POST ─────────────────── */

export async function POST(req: NextRequest, { params }: Params) {
  const { ref } = await params
  const body = await req.json()
  const {
    action,          // 'feedback' | 'resposta' | 'remover-feedback' | 'remover-resposta'
    entregaIndex,
    feedbackId,
    texto,
  } = body

  if ((action === 'feedback' || action === 'resposta') && !texto?.trim())
    return NextResponse.json({ error: 'Texto vazio' }, { status: 400 })

  /* ── ler dados actuais ── */
  const { data: existing } = await supabase
    .from('media_portais')
    .select('dados')
    .eq('ref', ref.toUpperCase())
    .single()

  if (!existing?.dados) return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 })

  /* ── dados brutos do Supabase (para gravar) ── */
  const rawDados = existing.dados

  /* ── merge mock + supabase para ter todos os campos (leitura) ── */
  const mock = getProjeto(ref)
  const dados = mock ? { ...mock, ...rawDados } : rawDados

  const entregas: any[] = [...(dados.entregas ?? [])]
  const entrega = entregas[entregaIndex]
  if (!entrega) return NextResponse.json({ error: 'Entrega não encontrada' }, { status: 404 })

  /* ── campos do projecto resolvidos no servidor ── */
  const nomeProjeto   = dados.nome     ?? ref
  const cliente       = dados.cliente  ?? ''
  const entregaTitulo = entrega.titulo ?? `Entrega ${entregaIndex + 1}`
  const adminEmail    = dados.gestorEmail ?? process.env.ADMIN_EMAIL ?? ''
  const clienteEmail  = dados.fichaCliente?.email ?? ''

  const portalUrl = `https://rl-menu-lake.vercel.app/portal-media/${ref.toUpperCase()}/entregas`

  console.log('[feedback] action:', action, '| adminEmail:', adminEmail, '| clienteEmail:', clienteEmail)

  /* ── FEEDBACK do cliente ── */
  if (action === 'feedback') {
    const novoFeedback = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      texto: texto.trim(),
      criadoEm: new Date().toISOString(),
    }
    entregas[entregaIndex] = {
      ...entrega,
      feedbacks: [...(entrega.feedbacks ?? []), novoFeedback],
    }

    const { error } = await supabase
      .from('media_portais')
      .upsert(
        { ref: ref.toUpperCase(), dados: { ...rawDados, entregas }, updated_at: new Date().toISOString() },
        { onConflict: 'ref' }
      )

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    /* notificar admin */
    let emailResult = { ok: false, error: 'adminEmail vazio' }
    if (adminEmail) {
      const html = neonCard(
        'Novo Feedback',
        'rgba(251,191,36,0.9)',
        `Entrega · ${entregaTitulo}`,
        texto.trim(),
        'Ver no Portal',
        portalUrl,
        nomeProjeto,
        cliente
      )
      emailResult = await sendEmail(
        adminEmail,
        `${nomeProjeto} · Novo feedback do cliente — RL Media`,
        html
      )
    }

    return NextResponse.json({ ok: true, feedback: novoFeedback, emailAdmin: emailResult })
  }

  /* ── RESPOSTA do admin ── */
  if (action === 'resposta') {
    const resposta = { texto: texto.trim(), criadoEm: new Date().toISOString() }
    entregas[entregaIndex] = {
      ...entrega,
      feedbacks: (entrega.feedbacks ?? []).map((f: any) =>
        f.id === feedbackId ? { ...f, resposta } : f
      ),
    }

    const { error } = await supabase
      .from('media_portais')
      .upsert(
        { ref: ref.toUpperCase(), dados: { ...rawDados, entregas }, updated_at: new Date().toISOString() },
        { onConflict: 'ref' }
      )

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    /* notificar cliente */
    let emailResult = { ok: false, error: 'clienteEmail vazio' }
    if (clienteEmail) {
      const html = neonCard(
        'Resposta da RL Media',
        'rgba(96,165,250,0.9)',
        `Entrega · ${entregaTitulo}`,
        texto.trim(),
        'Ver no Portal',
        portalUrl,
        nomeProjeto,
        cliente
      )
      emailResult = await sendEmail(
        clienteEmail,
        `${nomeProjeto} · A RL Media respondeu ao teu feedback — RL Media`,
        html
      )
    }

    return NextResponse.json({ ok: true, emailCliente: emailResult })
  }

  /* ── REMOVER feedback completo (admin) ── */
  if (action === 'remover-feedback') {
    entregas[entregaIndex] = {
      ...entrega,
      feedbacks: (entrega.feedbacks ?? []).filter((f: any) => f.id !== feedbackId),
    }

    const { error } = await supabase
      .from('media_portais')
      .upsert(
        { ref: ref.toUpperCase(), dados: { ...rawDados, entregas }, updated_at: new Date().toISOString() },
        { onConflict: 'ref' }
      )

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  /* ── REMOVER resposta do admin ── */
  if (action === 'remover-resposta') {
    entregas[entregaIndex] = {
      ...entrega,
      feedbacks: (entrega.feedbacks ?? []).map((f: any) =>
        f.id === feedbackId ? { ...f, resposta: undefined } : f
      ),
    }

    const { error } = await supabase
      .from('media_portais')
      .upsert(
        { ref: ref.toUpperCase(), dados: { ...rawDados, entregas }, updated_at: new Date().toISOString() },
        { onConflict: 'ref' }
      )

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Acção inválida' }, { status: 400 })
}
