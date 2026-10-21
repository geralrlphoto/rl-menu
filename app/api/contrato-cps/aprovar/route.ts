import { NextRequest, NextResponse } from 'next/server'
import { exigeAdmin } from '@/lib/api-guard'
import { ADMIN_EMAIL, SITE_BASE, db, portalCompleto, criarPortalCasamento, criarPortalBatizado, buildPortalEmail, sendEmail } from '@/lib/portalCriar'

// Gerar a animação do email demora alguns segundos
export const maxDuration = 60

// POST /api/contrato-cps/aprovar
// Body: { referencia: string }
//
// Ação do admin: marca o contrato como aprovado e cria o portal do cliente.
//   - Casamento → row em `portais` (URL: /portal-cliente/ref/{referencia})
//   - Batizado  → row em `portal_template_settings` page_id `batizado_{referencia}`
//                  copiando o conteúdo do master `batizado_batizado-maquete`
//                  (URL: /b/{referencia})
//   - Marca `dados_contrato_cps.aprovado_em` = now()
//   - Envia email ao cliente com o link do portal
//
// Auth: cookie rl_auth obrigatório.



// ─── POST handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // Auth admin
    const auth = req.cookies.get('rl_auth')?.value
    if (!auth || auth !== process.env.AUTH_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const referencia = String(body.referencia ?? '').trim()
    const password = String(body.password ?? '').trim()
    // resend=true: reenvia o email ao cliente mesmo se o portal já estiver
    // aprovado (idempotente). Usado pelo botão "📧 Reenviar Email".
    const resendOnly: boolean = !!body.resend
    // skipEmail=true: cria o portal mas NÃO envia o email ao cliente. Permite ao
    // admin rever o portal todo e só depois enviar (botão "Enviar ao Cliente").
    const skipEmail: boolean = !!body.skipEmail
    if (!referencia) {
      return NextResponse.json({ error: 'referencia obrigatória' }, { status: 400 })
    }
    if (!password && !resendOnly) {
      return NextResponse.json({ error: 'password obrigatória' }, { status: 400 })
    }

    const sb = db()

    // Busca os dados do contrato
    const { data: contratoOrig, error: fetchErr } = await sb
      .from('dados_contrato_cps')
      .select('*')
      .eq('referencia_evento', referencia)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 })
    }

    // A ficha do cliente (eventos_YYYY) é a fonte autoritativa para tipo_evento.
    // Por isso buscamos SEMPRE a row, mesmo quando o CPS já tem nome/email/data.
    // (Antes, só carregávamos quando faltava algo — e isso permitia que um valor
    // antigo de 'casamento' no CPS sobrevivesse mesmo depois de o admin ter
    // mudado para batizado na ficha.)
    let contrato: any = contratoOrig ?? { referencia_evento: referencia, id: null }
    const semNome = !contrato.nome_noivos && !contrato.nome_noiva && !contrato.nome_noivo && !contrato.nome_crianca
    const semEmail = !contrato.email_noiva && !contrato.email_noivo
    const semData = !contrato.data_casamento

    let eventoRow: any = null
    for (const t of ['eventos_2026', 'eventos_2027']) {
      const { data } = await sb.from(t).select('*').eq('referencia', referencia).maybeSingle()
      if (data) { eventoRow = data; break }
    }

    // Resolve tipo_evento a partir da ficha (Supabase). Aceita: array directo,
    // string JSON ('["BATIZADO"]') ou string simples.
    let tipoFromEvento: 'casamento' | 'batizado' | null = null
    {
      const teRaw: any = eventoRow?.tipo_evento
      let arr: string[] = []
      if (Array.isArray(teRaw)) arr = teRaw
      else if (typeof teRaw === 'string' && teRaw.trim()) {
        try { arr = JSON.parse(teRaw) } catch { arr = [teRaw] }
      }
      if (arr.some(t => /batizado/i.test(String(t)))) tipoFromEvento = 'batizado'
      else if (arr.length > 0) tipoFromEvento = 'casamento'
    }

    // tipo_evento da ficha SOBREPÕE o do CPS (que pode estar com valor antigo).
    // Só usa o do CPS se a ficha não tiver nada.
    if (tipoFromEvento) {
      contrato.tipo_evento = tipoFromEvento
    } else if (!contrato.tipo_evento) {
      contrato.tipo_evento = 'casamento'
    }

    // Preenche os outros campos só quando faltarem (mantém comportamento antigo).
    if (semNome || semEmail || semData) {
      const nNoiva = contrato.nome_noiva || eventoRow?.nome_noiva || null
      const nNoivo = contrato.nome_noivo || eventoRow?.nome_noivo || null
      const clienteFicha = eventoRow?.cliente || null

      contrato = {
        ...contrato,
        nome_noiva:     nNoiva,
        nome_noivo:     nNoivo,
        nome_noivos:    contrato.nome_noivos
                        || [nNoiva, nNoivo].filter(Boolean).join(' & ')
                        || clienteFicha             // ← fallback: campo CLIENTE da ficha
                        || referencia,
        email_noiva:    contrato.email_noiva  || eventoRow?.email_noiva  || null,
        email_noivo:    contrato.email_noivo  || eventoRow?.email_noivo  || null,
        data_casamento: contrato.data_casamento  || eventoRow?.data_evento || null,
        local_cerimonia:contrato.local_cerimonia || eventoRow?.local      || null,
      }
    }

    // Garante que contrato tem id (cria row se admin nunca aprovou via CPS)
    if (!contrato.id) {
      const { data: inserted, error: insErr } = await sb
        .from('dados_contrato_cps')
        .insert({
          referencia_evento: referencia,
          nome_noivos: contrato.nome_noivos,
          nome_noiva: contrato.nome_noiva,
          nome_noivo: contrato.nome_noivo,
          email_noiva: contrato.email_noiva,
          email_noivo: contrato.email_noivo,
          data_casamento: contrato.data_casamento,
          local_cerimonia: contrato.local_cerimonia,
          tipo_evento: contrato.tipo_evento,
          contrato_aprovado_em: new Date().toISOString(),
        })
        .select('id')
        .single()
      if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })
      contrato.id = inserted?.id
    } else if (semNome || semEmail || semData) {
      // Persiste os dados resolvidos no row existente (para futuras consultas
      // não precisarem do fallback)
      await sb.from('dados_contrato_cps').update({
        nome_noivos: contrato.nome_noivos,
        nome_noiva: contrato.nome_noiva,
        nome_noivo: contrato.nome_noivo,
        email_noiva: contrato.email_noiva,
        email_noivo: contrato.email_noivo,
        data_casamento: contrato.data_casamento,
        local_cerimonia: contrato.local_cerimonia,
        tipo_evento: contrato.tipo_evento,
      }).eq('id', contrato.id).then(() => {/* sync */})
    }

    // O contrato pode estar marcado como aprovado e mesmo assim o portal estar
    // vazio (row criada por um PATCH de settings, ou apagada à mão na BD). Nesse
    // caso este pedido tem de recriar o portal, não devolver o link nem enviar
    // email de um portal que os noivos abririam sem nomes nem data.
    // Email do cliente em falta no CPS/ficha → usa o do contacto do CRM
    if (!contrato.email_noiva && !contrato.email_noivo && eventoRow?.crm_contact_id) {
      const { data: crm } = await sb.from('crm_contacts').select('email').eq('id', eventoRow.crm_contact_id).maybeSingle()
      if (crm?.email) contrato.email_noiva = crm.email
    }

    // Portal com nomes mas sem data (criado antes de a ficha ter data) → completa
    // com a data do contrato em vez de o tratar como inexistente.
    if (contrato.data_casamento) {
      await sb.from('portais').update({ data: contrato.data_casamento })
        .ilike('referencia', referencia).is('data', null)
    }

    const temPortalCompleto = await portalCompleto(sb, referencia)

    // Idempotente: se já foi aprovado e o portal está completo, devolve o link
    // (envia o email novamente se resend=true OU a password foi passada)
    if (contrato.aprovado_em && temPortalCompleto && !resendOnly && !password) {
      const tipo = contrato.tipo_evento === 'batizado' ? 'batizado' : 'casamento'
      const url = tipo === 'batizado'
        ? `${SITE_BASE}/portal-batizado/ref/${encodeURIComponent(referencia)}`
        : `${SITE_BASE}/portal-cliente/ref/${encodeURIComponent(referencia)}`
      return NextResponse.json({
        ok: true,
        alreadyApproved: true,
        approvedAt: contrato.aprovado_em,
        portalUrl: url,
      })
    }

    // Caso especial: resend=true ou portal já aprovado E completo mas com
    // password → só envia email (não recria portal nem altera aprovado_em)
    // Portal completo criado por outro caminho (sem aprovado_em) também conta:
    // senão o resend caía na criação abaixo com password vazia e apagava a atual.
    if ((resendOnly && (contrato.aprovado_em || temPortalCompleto)) || (contrato.aprovado_em && temPortalCompleto && password)) {
      const tipo = contrato.tipo_evento === 'batizado' ? 'batizado' : 'casamento'
      const portalUrlExisting = tipo === 'batizado'
        ? `${SITE_BASE}/portal-batizado/ref/${encodeURIComponent(referencia)}`
        : `${SITE_BASE}/portal-cliente/ref/${encodeURIComponent(referencia)}`
      // Recolhe password atual do portal (se não foi passada)
      let pwd = password
      if (!pwd) {
        const { data: portalRow } = await sb.from('portais').select('settings').eq('referencia', referencia).maybeSingle()
        pwd = portalRow?.settings?.portalPassword || ''
      }
      if (!pwd) {
        return NextResponse.json({ error: 'O portal não tem password. Define-a no campo PASSWORD e carrega em Guardar antes de enviar.' }, { status: 400 })
      }
      const clienteEmail = contrato.email_noiva || contrato.email_noivo
      let emailSent = false
      let emailError: string | null = null
      if (clienteEmail) {
        emailSent = await sendEmail(
          clienteEmail,
          tipo === 'batizado' ? '👶 O portal do batizado está pronto' : '💍 O portal do casamento está pronto',
          await buildPortalEmail({ contrato, referencia, tipo, password: pwd, emailCliente: clienteEmail }),
        )
        if (!emailSent) emailError = 'Resend rejeitou o envio'
      } else {
        emailError = 'Email do cliente não foi encontrado (CPS / ficha do cliente)'
      }
      return NextResponse.json({
        ok: emailSent,
        resent: true,
        emailSentTo: clienteEmail ?? null,
        portalUrl: portalUrlExisting,
        error: emailError,
      })
    }

    // Reenviar nunca cria portal (viria sem password)
    if (resendOnly) {
      return NextResponse.json({ error: 'Ainda não há portal criado para este evento.' }, { status: 400 })
    }

    // Cria o portal conforme tipo
    const tipo = contrato.tipo_evento === 'batizado' ? 'batizado' : 'casamento'
    const portalUrl = tipo === 'batizado'
      ? await criarPortalBatizado(referencia, contrato, password)
      : await criarPortalCasamento(referencia, contrato, password)

    // Marca como aprovado
    const aprovado_em = new Date().toISOString()
    await sb.from('dados_contrato_cps')
      .update({ aprovado_em })
      .eq('id', contrato.id)

    // Email ao cliente (se tiver email) — a menos que o admin tenha optado por
    // criar sem enviar (skipEmail), para rever o portal antes de enviar.
    const clienteEmail = contrato.email_noiva || contrato.email_noivo
    if (clienteEmail && !skipEmail) {
      await sendEmail(
        clienteEmail,
        tipo === 'batizado'
          ? '👶 O portal do batizado está pronto'
          : '💍 O portal do casamento está pronto',
        await buildPortalEmail({ contrato, referencia, tipo, password, emailCliente: clienteEmail })
      )
    }

    // Confirmação ao admin com botão (mesmo estilo do email cliente)
    await sendEmail(
      ADMIN_EMAIL,
      `✓ Portal criado — ${referencia}`,
      `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0e0b07;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0b07;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#120e09;border:0.5px solid #4a3a1e;">
        <tr><td style="padding:40px 48px;font-family:Georgia,'Times New Roman',serif;text-align:center;">
          <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.5em;color:#c9a96e;text-transform:uppercase;">✓ Portal criado</p>
          <p style="margin:0 0 24px;font-size:30px;color:#f0e8d8;font-style:italic;">${contrato.nome_noivos || referencia}</p>
          <div style="margin:0 0 24px;color:#6a5430;font-size:12px;letter-spacing:0.35em;">— · ◆ · —</div>
          <p style="margin:0 0 8px;font-size:9px;letter-spacing:0.5em;color:#7a6340;text-transform:uppercase;">Referência</p>
          <p style="margin:0 0 20px;font-size:18px;font-family:'Courier New',monospace;color:#c9b88a;">${referencia}</p>
          <p style="margin:0 0 8px;font-size:9px;letter-spacing:0.5em;color:#7a6340;text-transform:uppercase;">Password ${skipEmail ? '(ainda por enviar ao cliente)' : 'enviada ao cliente'}</p>
          <p style="margin:0 0 28px;font-size:18px;font-family:'Courier New',monospace;color:#c9b88a;letter-spacing:0.1em;">${password}</p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
            <tr><td align="center" style="border-radius:8px;background:#c9a96e;">
              <a href="${portalUrl}" target="_blank"
                style="display:inline-block;padding:16px 40px;background:#c9a96e;color:#0e0b07;text-decoration:none;font-size:12px;letter-spacing:0.4em;font-weight:700;border-radius:8px;">
                VER PORTAL &nbsp;→
              </a>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
    )

    return NextResponse.json({ ok: true, portalUrl, aprovado_em })
  } catch (err: any) {
    console.error('[contrato-cps/aprovar]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ─── GET handler ──────────────────────────────────────────────────────────────
// GET ?ref=CAS_011_26_RL → estado do contrato + url do portal (se aprovado)
export async function GET(req: NextRequest) {
  const bloqueio = exigeAdmin(req) // só admin
  if (bloqueio) return bloqueio
  try {
    const referencia = req.nextUrl.searchParams.get('ref')
    if (!referencia) return NextResponse.json({ error: 'ref required' }, { status: 400 })

    const sb = db()
    const { data: contrato } = await sb
      .from('dados_contrato_cps')
      .select('id, nome_noivos, tipo_evento, aprovado_em, contrato_aprovado_em, created_at, email_noiva, email_noivo, referencia_evento')
      .eq('referencia_evento', referencia)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!contrato) return NextResponse.json({ exists: false })

    const tipo = contrato.tipo_evento === 'batizado' ? 'batizado' : 'casamento'
    const portalUrl = contrato.aprovado_em
      ? (tipo === 'batizado'
          ? `${SITE_BASE}/portal-batizado/ref/${encodeURIComponent(referencia)}`
          : `${SITE_BASE}/portal-cliente/ref/${encodeURIComponent(referencia)}`)
      : null

    return NextResponse.json({
      exists: true,
      contrato,
      portalUrl,
      // A ficha usa isto para voltar a mostrar "Criar Portal" quando o contrato
      // está aprovado mas o portal ficou sem os dados dos noivos.
      portalCompleto: await portalCompleto(sb, referencia),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
