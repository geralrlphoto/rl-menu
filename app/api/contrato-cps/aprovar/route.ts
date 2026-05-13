import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

const RESEND_KEY = process.env.RESEND_API_KEY!
const ADMIN_EMAIL = 'geral.rlphoto@gmail.com'
const BATIZADO_MASTER_TOKEN = 'batizado-maquete'
const SITE_BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://rl-menu-lake.vercel.app'

// PAGE_ID da maquete batizado em Notion (a mesma usada por /portal-batizado/page.tsx)
// e ID da maquete casamento (para herdar pageTitles/hiddenNav nos novos portais)
const BATIZADO_TEMPLATE_PAGE_ID = '35b220116d8a811b99b7f6f26648c017'
const CASAMENTO_TEMPLATE_PAGE_ID = '311220116d8a80d29468e817ae7bb79f'
const NOTION_TOKEN = process.env.NOTION_TOKEN!

// Lê pageTitles + hiddenNav da maquete a partir de portal_template_settings
// (fonte autoritativa, igual ao /api/portais-clientes).
async function fetchMaqueteSettings(pageId: string): Promise<{
  pageTitles?: Record<string,string>
  hiddenNav?: string[]
  guiaLinks?: any
  pageHeaders?: any
  briefingLinks?: any
  briefingInfo?: any
}> {
  try {
    const sb = db()
    const { data } = await sb
      .from('portal_template_settings')
      .select('settings')
      .eq('page_id', pageId)
      .single()
    const s = data?.settings ?? {}
    return {
      pageTitles:    s.pageTitles,
      hiddenNav:     s.hiddenNav,
      guiaLinks:     s.guiaLinks,
      pageHeaders:   s.pageHeaders,
      briefingLinks: s.briefingLinks,
      briefingInfo:  s.briefingInfo,
    }
  } catch {
    return {}
  }
}

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

function fmtData(d: string | null | undefined): string {
  if (!d) return ''
  try {
    return new Date(d + 'T12:00:00').toLocaleDateString('pt-PT', {
      day: '2-digit', month: 'long', year: 'numeric',
    })
  } catch { return d ?? '' }
}

// ─── Cria portal de casamento (tabela `portais`) ─────────────────────────────
// Herda pageTitles/hiddenNav/etc. da maquete casamento para que sub-páginas
// renomeadas pelo admin e itens escondidos apareçam corretamente.
async function criarPortalCasamento(ref: string, dados: any) {
  const sb = db()
  const maquete = await fetchMaqueteSettings(CASAMENTO_TEMPLATE_PAGE_ID)
  const row = {
    referencia: ref,
    noiva: dados.nome_noiva ?? null,
    noivo: dados.nome_noivo ?? null,
    data: dados.data_casamento ?? null,
    data_formatada: fmtData(dados.data_casamento),
    local: dados.local_cerimonia ?? null,
    settings: {
      referencia: ref,
      noiva: dados.nome_noiva ?? '',
      noivo: dados.nome_noivo ?? '',
      data: dados.data_casamento ?? '',
      dataFormatada: fmtData(dados.data_casamento),
      local: dados.local_cerimonia ?? '',
      tipoPortal: 'casamento',
      pageTitles:    maquete.pageTitles ?? {},
      hiddenNav:     maquete.hiddenNav  ?? [],
      guiaLinks:     maquete.guiaLinks,
      pageHeaders:   maquete.pageHeaders,
      briefingLinks: maquete.briefingLinks,
      briefingInfo:  maquete.briefingInfo,
    },
    updated_at: new Date().toISOString(),
  }
  const { error } = await sb.from('portais').upsert(row, { onConflict: 'referencia' })
  if (error) throw new Error(`portal casamento: ${error.message}`)
  return `${SITE_BASE}/portal-cliente/ref/${encodeURIComponent(ref)}`
}

// ─── Cria portal de batizado (mesma tabela `portais` que casamento) ──────────
// Estrutura idêntica ao portal de casamento — só muda settings.tipoPortal
// e adiciona dados específicos da criança.
// Copia pageTitles/hiddenNav/guiaLinks/etc. da maquete batizado para que o
// novo portal apareça com a estrutura batizado (GUIA DOS PAIS, CRONOGRAMA
// BATIZADO, etc.) em vez do default casamento.
async function criarPortalBatizado(ref: string, dados: any) {
  const sb = db()
  const maquete = await fetchMaqueteSettings(BATIZADO_TEMPLATE_PAGE_ID)
  const row = {
    referencia: ref,
    noiva: dados.nome_noiva ?? null,  // mãe — reutiliza campo "noiva"
    noivo: dados.nome_noivo ?? null,  // pai — reutiliza campo "noivo"
    data: dados.data_casamento ?? null,
    data_formatada: fmtData(dados.data_casamento),
    local: dados.local_cerimonia ?? null,
    settings: {
      referencia: ref,
      noiva: dados.nome_noiva ?? '',
      noivo: dados.nome_noivo ?? '',
      data: dados.data_casamento ?? '',
      dataFormatada: fmtData(dados.data_casamento),
      local: dados.local_cerimonia ?? '',
      tipoPortal: 'batizado',
      nomeCrianca:  dados.nome_crianca  ?? '',
      idadeCrianca: dados.idade_crianca ?? '',
      // Herdado da maquete batizado
      pageTitles:    maquete.pageTitles ?? {},
      hiddenNav:     maquete.hiddenNav  ?? [],
      guiaLinks:     maquete.guiaLinks,
      pageHeaders:   maquete.pageHeaders,
      briefingLinks: maquete.briefingLinks,
      briefingInfo:  maquete.briefingInfo,
    },
    updated_at: new Date().toISOString(),
  }
  const { error } = await sb.from('portais').upsert(row, { onConflict: 'referencia' })
  if (error) throw new Error(`portal batizado: ${error.message}`)
  return `${SITE_BASE}/portal-batizado/ref/${encodeURIComponent(ref)}`
}

// ─── Email ao cliente com link do portal ──────────────────────────────────────
function buildPortalEmail(opts: {
  nome_noivos: string
  url: string
  tipo: 'casamento' | 'batizado'
  data?: string
}): string {
  const primeiroNome = opts.nome_noivos.split(/[\s&]/)[0]
  const tituloTipo = opts.tipo === 'batizado' ? 'O vosso espaço para o batizado' : 'O vosso espaço'
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0e0b07;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0b07;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#120e09;border:0.5px solid #4a3a1e;">
        <tr><td style="padding:48px 56px;font-family:Georgia,'Times New Roman',serif;text-align:center;">
          <img src="https://awwbkmprgtwmnejeuiak.supabase.co/storage/v1/object/public/portal-images/logo_rl_gold.png"
            width="80" alt="RL" style="display:block;margin:0 auto 24px;width:80px;opacity:0.9;" />
          <p style="margin:0 0 4px;font-size:28px;font-style:italic;font-weight:300;color:#c9a96e;">Olá, ${primeiroNome}!</p>
          <p style="margin:0;font-size:36px;font-weight:400;color:#f0e8d8;">${tituloTipo}</p>
          <p style="margin:0 0 24px;font-size:36px;font-weight:400;font-style:italic;color:#c9a96e;">está pronto.</p>
          <div style="margin:0 0 28px;color:#6a5430;font-size:12px;letter-spacing:0.35em;">— · ◆ · —</div>
          <p style="margin:0 0 28px;font-size:15px;color:#a09070;line-height:1.8;">
            Criámos um espaço dedicado a vocês onde podem acompanhar todas as etapas,<br>
            ${opts.tipo === 'casamento' ? 'desde a sessão pré-wedding até à entrega final' : 'desde a sessão até à entrega das fotos e do vídeo'}.
          </p>
          <a href="${opts.url}" style="display:inline-block;padding:16px 40px;background:#c9a96e;color:#0e0b07;text-decoration:none;font-size:12px;letter-spacing:0.4em;font-weight:600;">
            ABRIR PORTAL →
          </a>
          <p style="margin:32px 0 0;font-size:11px;color:#5a4a30;line-height:1.6;">
            ou copia: <span style="color:#a09070;">${opts.url}</span>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

async function sendEmail(to: string, subject: string, html: string) {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'RL Photo.Video <geral@rlphotovideo.pt>',
        to: [to], subject, html,
      }),
    })
    return res.ok
  } catch { return false }
}

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
    if (!referencia) {
      return NextResponse.json({ error: 'referencia obrigatória' }, { status: 400 })
    }

    const sb = db()

    // Busca os dados do contrato
    const { data: contrato, error: fetchErr } = await sb
      .from('dados_contrato_cps')
      .select('*')
      .eq('referencia_evento', referencia)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (fetchErr || !contrato) {
      return NextResponse.json({
        error: `Nenhum contrato encontrado para a referência ${referencia}`,
      }, { status: 404 })
    }

    // Idempotente: se já foi aprovado, devolve o link (sem recriar nada)
    if (contrato.aprovado_em) {
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

    // Cria o portal conforme tipo
    const tipo = contrato.tipo_evento === 'batizado' ? 'batizado' : 'casamento'
    const portalUrl = tipo === 'batizado'
      ? await criarPortalBatizado(referencia, contrato)
      : await criarPortalCasamento(referencia, contrato)

    // Marca como aprovado
    const aprovado_em = new Date().toISOString()
    await sb.from('dados_contrato_cps')
      .update({ aprovado_em })
      .eq('id', contrato.id)

    // Email ao cliente (se tiver email)
    const clienteEmail = contrato.email_noiva || contrato.email_noivo
    if (clienteEmail) {
      await sendEmail(
        clienteEmail,
        tipo === 'batizado'
          ? '👶 O portal do batizado está pronto'
          : '💍 O portal do casamento está pronto',
        buildPortalEmail({
          nome_noivos: contrato.nome_noivos,
          url: portalUrl,
          tipo,
          data: contrato.data_casamento,
        })
      )
    }

    // Confirmação ao admin (opcional)
    await sendEmail(
      ADMIN_EMAIL,
      `✓ Portal criado — ${referencia}`,
      `<p>Portal aprovado e enviado ao cliente <b>${contrato.nome_noivos}</b>.</p>
       <p>URL: <a href="${portalUrl}">${portalUrl}</a></p>`
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
  try {
    const referencia = req.nextUrl.searchParams.get('ref')
    if (!referencia) return NextResponse.json({ error: 'ref required' }, { status: 400 })

    const sb = db()
    const { data: contrato } = await sb
      .from('dados_contrato_cps')
      .select('id, nome_noivos, tipo_evento, aprovado_em, created_at, email_noiva, email_noivo, referencia_evento')
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
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
