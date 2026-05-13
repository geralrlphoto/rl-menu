import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Form interno — Dados para Contrato CPS
// Substitui o Tally https://tally.so/r/3XXZlV
//
// Ao receber o submit:
//   1. Guarda em Supabase → tabela dados_contrato_cps
//   2. Guarda em Notion   → base de dados EVENTOS (ano correto)
//   3. Cria registo em eventos_YYYY (referência automática)
//   4. Envia email de confirmação ao CLIENTE (gold card)
//   5. Envia notificação ao ADMIN

const NOTION_TOKEN = process.env.NOTION_TOKEN!
const RESEND_KEY   = process.env.RESEND_API_KEY!
const ADMIN_EMAIL  = 'geral.rlphoto@gmail.com'

const DB_BY_YEAR: Record<number, string> = {
  2026: '1ad220116d8a804b839ddc36f1e7ecf1',
  2027: '2a6220116d8a80b4b439fe091b2ac804',
}

// Prefixo de referência por tipo de evento (CAS_001_26_RL, BAT_001_26_RL, ...)
const PREFIX_BY_TIPO: Record<string, string> = {
  casamento: 'CAS',
  batizado:  'BAT',
}

const LABEL_BY_TIPO: Record<string, string> = {
  casamento: 'CASAMENTO',
  batizado:  'BATIZADO',
}

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ─── Notion ───────────────────────────────────────────────────────────────────
async function saveToNotion(data: Record<string, any>) {
  try {
    const rt = (v: string | null) => ({ rich_text: [{ text: { content: v ?? '' } }] })

    const anoEvento = data.data_casamento ? parseInt(data.data_casamento.slice(0, 4)) : 2026
    const EVENTOS_DB = DB_BY_YEAR[anoEvento] ?? DB_BY_YEAR[2026]

    const tipo_evento = data.tipo_evento ?? 'casamento'
    const labelTipo = LABEL_BY_TIPO[tipo_evento] ?? 'CASAMENTO'

    const refTitle = (data.referencia_evento ?? '').trim() || `AGUARDAR — ${data.nome_noivos ?? ''}`

    // CORE: propriedades obrigatórias (sempre existem na BD do Notion)
    const coreProperties: Record<string, any> = {
      'REFERÊNCIA DO EVENTO': { title: [{ text: { content: refTitle } }] },
      'CLIENTE':              rt(data.nome_noivos),
    }

    // EXTRAS: propriedades que podem não existir na BD do Notion (versões antigas)
    // Se Notion rejeitar, tenta novamente sem estas.
    const extraProperties: Record<string, any> = {}

    extraProperties['TIPO DE EVENTO'] = { select: { name: labelTipo } }

    if (tipo_evento === 'batizado') {
      if (data.nome_crianca)  extraProperties['NOME DA CRIANÇA']  = rt(data.nome_crianca)
      if (data.idade_crianca) extraProperties['IDADE DA CRIANÇA'] = rt(data.idade_crianca)
    }

    if (data.data_casamento)  extraProperties['DATA DO EVENTO']          = { date: { start: data.data_casamento } }
    if (data.local_cerimonia) extraProperties['LOCAL']                   = rt(data.local_cerimonia)
    if (data.proposta)        extraProperties['PROPOSTA ESCOLHIDA']      = { select: { name: data.proposta } }
    if (data.nome_noiva)      extraProperties['Nome da Noiva']           = rt(data.nome_noiva)
    if (data.email_noiva)     extraProperties['E-mail da noiva']         = { email: data.email_noiva }
    if (data.tel_noiva)       extraProperties['Telefone da noiva']       = { phone_number: data.tel_noiva }
    if (data.morada_noiva)    extraProperties['Morada da Noiva']         = rt(data.morada_noiva)
    if (data.cc_noiva)        extraProperties['N.º C.Cidadão da noiva']  = rt(data.cc_noiva)
    if (data.nif_noiva)       extraProperties['N.º Iden.Fiscal Noiva']   = rt(data.nif_noiva)
    if (data.nome_noivo)      extraProperties['nome do noivo']           = rt(data.nome_noivo)
    if (data.email_noivo)     extraProperties['E-mail do noivo']         = { email: data.email_noivo }
    if (data.tel_noivo)       extraProperties['Telefone do noivo']       = { phone_number: data.tel_noivo }
    if (data.morada_noivo)    extraProperties['Morada do noivo']         = rt(data.morada_noivo)
    if (data.cc_noivo)        extraProperties['N.ºC.Cidadao Noivo']      = rt(data.cc_noivo)
    if (data.nif_noivo)       extraProperties['N.º Iden. Fiscal Noivo']  = rt(data.nif_noivo)

    // Função auxiliar para fazer o POST ao Notion
    async function postNotion(props: Record<string, any>) {
      return fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NOTION_TOKEN}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ parent: { database_id: EVENTOS_DB }, properties: props }),
      })
    }

    // Tentativa 1: payload completo (core + extras)
    let res = await postNotion({ ...coreProperties, ...extraProperties })

    if (!res.ok) {
      const errText = await res.text()
      console.warn('[contrato-cps] Notion full payload failed, retrying with core only:', errText)
      // Tentativa 2: só core (caso a BD do Notion não tenha algumas propriedades)
      res = await postNotion(coreProperties)
      if (!res.ok) {
        const err2 = await res.text()
        console.error('[contrato-cps] Notion core payload also failed:', err2)
        return { ok: false, error: err2 }
      }
    }

    const page = await res.json()
    return { ok: true, id: page.id }
  } catch (e: any) {
    console.error('[contrato-cps] Notion exception:', e)
    return { ok: false, error: e.message }
  }
}

// ─── Supabase ─────────────────────────────────────────────────────────────────
async function saveToSupabase(data: Record<string, any>) {
  try {
    const { data: saved, error } = await db()
      .from('dados_contrato_cps')
      .insert(data)
      .select()
      .single()

    if (error) {
      console.error('[contrato-cps] Supabase error:', error)
      return { ok: false, error: error.message }
    }
    return { ok: true, id: saved?.id }
  } catch (e: any) {
    console.error('[contrato-cps] Supabase exception:', e)
    return { ok: false, error: e.message }
  }
}

// ─── Email cliente: gold card de confirmação ─────────────────────────────────
function buildClienteEmail(data: { nome_noivos: string; data_casamento: string | null; tipo_evento?: string }): string {
  const isBatizado = data.tipo_evento === 'batizado'
  const dataFormatada = data.data_casamento
    ? (() => {
        try {
          return new Date(data.data_casamento + 'T12:00:00').toLocaleDateString('pt-PT', {
            day: '2-digit', month: 'long', year: 'numeric'
          })
        } catch { return data.data_casamento ?? '' }
      })()
    : ''

  const primeiroNome = data.nome_noivos.split(/[\s&]/)[0]

  // Labels condicionais por tipo de evento
  const labelNomes  = isBatizado ? 'Pais'              : 'Noivos'
  const labelData   = isBatizado ? 'Data do Batizado'  : 'Data do Casamento'

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0e0b07;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0b07;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#120e09;border:0.5px solid #4a3a1e;">

        <tr><td style="padding:0;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="width:50px;height:50px;border-top:0.5px solid #3a2a12;border-left:0.5px solid #3a2a12;"></td>
            <td></td>
            <td style="width:50px;height:50px;border-top:0.5px solid #3a2a12;border-right:0.5px solid #3a2a12;"></td>
          </tr></table>
        </td></tr>

        <tr><td style="padding:8px 56px 56px;font-family:Georgia,'Times New Roman',serif;text-align:center;">

          <img src="https://awwbkmprgtwmnejeuiak.supabase.co/storage/v1/object/public/portal-images/logo_rl_gold.png"
            width="80" alt="RL Photo Video"
            style="display:block;margin:0 auto 24px;width:80px;height:auto;opacity:0.9;" />

          <table cellpadding="0" cellspacing="0" style="margin:0 auto 20px;width:52px;height:52px;border-radius:50%;border:1.5px solid #c9a96e;"><tr><td align="center" valign="middle">
            <span style="font-size:22px;color:#c9a96e;">&#10003;</span>
          </td></tr></table>

          <p style="margin:0 0 4px;font-size:28px;font-style:italic;font-weight:300;color:#c9a96e;line-height:1.2;">Olá, ${primeiroNome}!</p>
          <p style="margin:0;font-size:38px;font-weight:400;color:#f0e8d8;line-height:1.1;">Dados</p>
          <p style="margin:0 0 24px;font-size:38px;font-weight:400;font-style:italic;color:#c9a96e;line-height:1.2;">recebidos.</p>

          <div style="margin:0 0 24px;color:#6a5430;font-size:12px;letter-spacing:0.35em;">&#8212;&nbsp;·&nbsp;&#9670;&nbsp;·&nbsp;&#8212;</div>

          <p style="margin:0 0 24px;font-size:15px;color:#a09070;line-height:1.8;">
            Recebemos os vossos dados para o contrato.<br>
            <strong style="color:#c9b88a;font-weight:500;">Em breve entraremos em contacto.</strong>
          </p>

          <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;border:0.5px solid #6a5430;width:100%;max-width:400px;background:rgba(201,169,110,0.04);">
            <tr><td style="padding:24px 32px;text-align:center;">
              <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.5em;color:#7a6340;text-transform:uppercase;">${labelNomes}</p>
              <p style="margin:0 0 20px;font-size:22px;font-style:italic;font-weight:400;color:#c9a96e;line-height:1.2;">${data.nome_noivos}</p>
              ${dataFormatada ? `
              <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.4em;color:#7a6340;text-transform:uppercase;">${labelData}</p>
              <p style="margin:0;font-size:14px;color:#d4c9b0;">${dataFormatada}</p>
              ` : ''}
            </td></tr>
          </table>

          <p style="margin:0 0 8px;font-size:14px;color:#7a6a50;line-height:1.8;">Para qualquer questão estamos sempre disponíveis.</p>
          <p style="margin:0;font-size:14px;color:#7a6a50;line-height:1.8;">
            <a href="mailto:${ADMIN_EMAIL}" style="color:#c9a96e;text-decoration:none;">${ADMIN_EMAIL}</a>
          </p>

        </td></tr>

        <tr><td style="padding:0;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="width:50px;height:50px;border-bottom:0.5px solid #3a2a12;border-left:0.5px solid #3a2a12;"></td>
            <td style="text-align:center;vertical-align:bottom;padding-bottom:20px;">
              <p style="margin:0;font-size:9px;letter-spacing:0.4em;color:#3a2a12;text-transform:uppercase;">RL PHOTO &middot; VIDEO</p>
            </td>
            <td style="width:50px;height:50px;border-bottom:0.5px solid #3a2a12;border-right:0.5px solid #3a2a12;"></td>
          </tr></table>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`
}

// ─── Email admin: notificação completa com TODOS os campos do formulário ─────
function buildAdminEmail(data: Record<string, any>): string {
  const isBatizado = data.tipo_evento === 'batizado'
  const tipoLabel = isBatizado ? 'Batizado.' : 'para CPS.'
  const noivosPaisLabel = isBatizado ? 'Pais' : 'Noivos / Pais'

  // Helpers
  const field = (label: string, value: any) => value
    ? `<tr><td style="padding:8px 0;border-bottom:1px solid #2a1f10;"><p style="margin:0 0 3px;font-size:8px;letter-spacing:0.4em;color:#7a6340;text-transform:uppercase;">${label}</p><p style="margin:0;font-size:13px;color:#d4c9b0;line-height:1.5;">${String(value).replace(/\n/g, '<br>')}</p></td></tr>`
    : ''

  const sectionTitle = (label: string) => `<tr><td style="padding:24px 0 12px;"><p style="margin:0;font-size:9px;letter-spacing:0.5em;color:#c9a96e;text-transform:uppercase;border-bottom:1px solid #6a5430;padding-bottom:8px;">${label}</p></td></tr>`

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0e0b07;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0b07;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#120e09;border:0.5px solid #4a3a1e;">

        <tr><td style="padding:0;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="width:50px;height:50px;border-top:0.5px solid #3a2a12;border-left:0.5px solid #3a2a12;"></td>
            <td></td>
            <td style="width:50px;height:50px;border-top:0.5px solid #3a2a12;border-right:0.5px solid #3a2a12;"></td>
          </tr></table>
        </td></tr>

        <tr><td style="padding:8px 48px 48px;font-family:Georgia,'Times New Roman',serif;">

          <div style="text-align:center;">
            <img src="https://awwbkmprgtwmnejeuiak.supabase.co/storage/v1/object/public/portal-images/logo_rl_gold.png"
              width="80" alt="RL" style="display:block;margin:0 auto 24px;width:80px;height:auto;opacity:0.9;" />

            <table cellpadding="0" cellspacing="0" style="margin:0 auto 20px;width:52px;height:52px;border-radius:50%;border:1.5px solid #c9a96e;"><tr><td align="center" valign="middle">
              <span style="font-size:22px;color:#c9a96e;">&#10003;</span>
            </td></tr></table>

            <p style="margin:0 0 4px;font-size:28px;font-style:italic;font-weight:300;color:#c9a96e;line-height:1.2;">Olá, Rui!</p>
            <p style="margin:0;font-size:38px;font-weight:400;color:#f0e8d8;line-height:1.1;">Novos dados</p>
            <p style="margin:0 0 16px;font-size:38px;font-weight:400;font-style:italic;color:#c9a96e;line-height:1.2;">${tipoLabel}</p>

            ${data.referencia_evento ? `<p style="margin:8px 0 0;font-size:13px;color:#c9b88a;font-family:'Courier New',monospace;letter-spacing:0.15em;">${data.referencia_evento}</p>` : ''}

            <div style="margin:24px 0;color:#6a5430;font-size:12px;letter-spacing:0.35em;">&#8212;&nbsp;·&nbsp;&#9670;&nbsp;·&nbsp;&#8212;</div>
          </div>

          <table cellpadding="0" cellspacing="0" width="100%">

            ${sectionTitle('Secção 01 — Dados Gerais')}
            ${field('Referência do Evento', data.referencia_evento)}
            ${field(noivosPaisLabel, data.nome_noivos)}
            ${field(isBatizado ? 'Data do Batizado' : 'Data do Casamento', data.data_casamento)}
            ${field('Local da Cerimónia', data.local_cerimonia)}
            ${field('Proposta Escolhida', data.proposta)}
            ${data.servico ? field('Serviço', data.servico) : ''}

            ${isBatizado ? `
              ${sectionTitle('Secção 02 — Dados da Criança')}
              ${field('Nome da Criança', data.nome_crianca)}
              ${field('Idade da Criança', data.idade_crianca)}
            ` : ''}

            ${sectionTitle(isBatizado ? 'Secção 03 — Dados da Mãe' : 'Secção 02 — Dados da Noiva')}
            ${field(isBatizado ? 'Nome da Mãe' : 'Nome da Noiva', data.nome_noiva)}
            ${field('Morada Completa', data.morada_noiva)}
            ${field('Contacto', data.tel_noiva)}
            ${field('Cartão de Cidadão', data.cc_noiva)}
            ${field('NIF', data.nif_noiva)}
            ${field('Email', data.email_noiva)}

            ${sectionTitle(isBatizado ? 'Secção 04 — Dados do Pai' : 'Secção 03 — Dados do Noivo')}
            ${field(isBatizado ? 'Nome do Pai' : 'Nome do Noivo', data.nome_noivo)}
            ${field('Morada Completa', data.morada_noivo)}
            ${field('Contacto', data.tel_noivo)}
            ${field('Cartão de Cidadão', data.cc_noivo)}
            ${field('NIF', data.nif_noivo)}
            ${field('Email', data.email_noivo)}

          </table>

          <div style="margin-top:32px;text-align:center;">
            <p style="margin:0;font-size:13px;color:#a09070;line-height:1.8;">
              Aprova o contrato em <strong style="color:#c9b88a;font-weight:500;">/eventos-2026/[id]</strong> para criar o portal.
            </p>
          </div>

        </td></tr>

        <tr><td style="padding:0;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="width:50px;height:50px;border-bottom:0.5px solid #3a2a12;border-left:0.5px solid #3a2a12;"></td>
            <td style="text-align:center;vertical-align:bottom;padding-bottom:20px;">
              <p style="margin:0;font-size:9px;letter-spacing:0.4em;color:#3a2a12;text-transform:uppercase;">RL PHOTO &middot; VIDEO</p>
            </td>
            <td style="width:50px;height:50px;border-bottom:0.5px solid #3a2a12;border-right:0.5px solid #3a2a12;"></td>
          </tr></table>
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
    if (!res.ok) { console.error('[contrato-cps] Resend error:', await res.text()); return false }
    return true
  } catch (e) {
    console.error('[contrato-cps] Resend exception:', e)
    return false
  }
}

// ─── POST handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Tipo de evento (default 'casamento' para retrocompatibilidade)
    const tipo_evento = body.tipo_evento === 'batizado' ? 'batizado' : 'casamento'

    const data = {
      tipo_evento,
      referencia_evento: body.referencia_evento ?? null,
      nome_noivos:     body.nome_noivos     ?? null,
      data_casamento:  body.data_casamento  ?? null,
      local_cerimonia: body.local_cerimonia ?? null,
      proposta:        body.proposta        ?? null,
      // Noiva/Mãe
      nome_noiva:      body.nome_noiva   ?? null,
      morada_noiva:    body.morada_noiva ?? null,
      tel_noiva:       body.tel_noiva    ?? null,
      cc_noiva:        body.cc_noiva     ?? null,
      nif_noiva:       body.nif_noiva    ?? null,
      email_noiva:     body.email_noiva  ?? null,
      // Noivo/Pai
      nome_noivo:      body.nome_noivo   ?? null,
      morada_noivo:    body.morada_noivo ?? null,
      tel_noivo:       body.tel_noivo    ?? null,
      cc_noivo:        body.cc_noivo     ?? null,
      nif_noivo:       body.nif_noivo    ?? null,
      email_noivo:     body.email_noivo  ?? null,
      // Serviço
      servico:         body.servico ?? null,
      // Criança (só usado se batizado)
      nome_crianca:    body.nome_crianca  ?? null,
      idade_crianca:   body.idade_crianca ?? null,
    }

    if (!data.nome_noivos) {
      const labelObrigatorio = tipo_evento === 'batizado' ? 'NOME DOS PAIS' : 'NOME DOS NOIVOS'
      return NextResponse.json({ error: `${labelObrigatorio} é obrigatório` }, { status: 400 })
    }

    // ── Guardar em paralelo ──────────────────────────────────────────────────
    const [supabaseResult, notionResult] = await Promise.allSettled([
      saveToSupabase(data),
      saveToNotion(data),
    ])

    const notionVal = notionResult.status === 'fulfilled' ? notionResult.value : null

    // ── Cria registo em evento_equipa ────────────────────────────────────────
    if (notionVal?.ok && notionVal?.id) {
      await db().from('evento_equipa').upsert({
        evento_id:      notionVal.id,
        referencia:     `AGUARDAR — ${data.nome_noivos ?? ''}`,
        cliente:        data.nome_noivos ?? null,
        data_casamento: data.data_casamento ?? null,
        local:          data.local_cerimonia ?? null,
      }, { onConflict: 'evento_id' })
    }

    // ── Cria/atualiza registo em eventos_YYYY ────────────────────────────────
    // Se o cliente preencheu referencia_evento, usa-a (admin já criou o evento
    // e enviou a ref ao cliente). Se não, auto-gera nova (fallback).
    try {
      const ano = data.data_casamento ? parseInt(data.data_casamento.slice(0, 4)) : 2026
      const TABLE_BY_YEAR: Record<number, string> = { 2026: 'eventos_2026', 2027: 'eventos_2027' }
      const table = TABLE_BY_YEAR[ano]
      if (table) {
        const sb = db()
        const prefix = PREFIX_BY_TIPO[tipo_evento]
        const anoSufixo = String(ano).slice(2)

        let referencia = (data.referencia_evento ?? '').trim()

        if (!referencia) {
          // Fallback: auto-gera se o cliente não forneceu
          const { count } = await sb
            .from(table)
            .select('*', { count: 'exact', head: true })
            .ilike('referencia', `${prefix}_%`)
          const proximoNum = String((count ?? 0) + 1).padStart(3, '0')
          referencia = `${prefix}_${proximoNum}_${anoSufixo}_RL`
        }

        // Verifica se já existe um registo com esta referência (caso o admin
        // o tenha criado antes do envio do formulário)
        const { data: existing } = await sb
          .from(table)
          .select('id')
          .eq('referencia', referencia)
          .maybeSingle()

        const payload = {
          notion_id: notionVal?.ok ? notionVal.id : null,
          referencia,
          cliente: data.nome_noivos ?? '',
          data_evento: data.data_casamento ?? null,
          local: data.local_cerimonia ?? '',
          tipo_evento: JSON.stringify([LABEL_BY_TIPO[tipo_evento]]),
          tipo_servico: data.servico ? [data.servico] : null,
          nome_crianca:  data.nome_crianca  ?? null,
          idade_crianca: data.idade_crianca ?? null,
        }

        if (existing?.id) {
          // Atualiza registo existente (preserva fotografo/valores definidos pelo admin)
          await sb.from(table).update(payload).eq('id', existing.id)
        } else {
          // Cria novo com defaults
          await sb.from(table).insert({
            ...payload,
            status: 'Não iniciada',
            fotos_enviadas: false,
            fotografo: JSON.stringify([]),
            valor_foto: null,
            valor_liquido: null,
          })
        }
      }
    } catch (e) {
      console.error('[contrato-cps] eventos insert/update exception:', e)
    }

    // ── Email confirmação cliente (se tiver email) ───────────────────────────
    const clienteEmail = data.email_noiva || data.email_noivo
    if (clienteEmail) {
      await sendEmail(
        clienteEmail,
        '✓ Dados recebidos — RL Photo Video',
        buildClienteEmail({
          nome_noivos: data.nome_noivos!,
          data_casamento: data.data_casamento,
          tipo_evento: tipo_evento,
        })
      )
    }

    // ── Email admin ──────────────────────────────────────────────────────────
    const emojiTipo = tipo_evento === 'batizado' ? '👶' : '💍'
    const labelTipoMaiusculo = LABEL_BY_TIPO[tipo_evento] ?? 'CASAMENTO'
    await sendEmail(
      ADMIN_EMAIL,
      `${emojiTipo} Novo ${labelTipoMaiusculo.toLowerCase()} — ${data.nome_noivos}`,
      buildAdminEmail(data)
    )

    return NextResponse.json({
      ok: true,
      supabase: supabaseResult.status === 'fulfilled' ? supabaseResult.value : { ok: false },
      notion:   notionVal ?? { ok: false },
    })
  } catch (err: any) {
    console.error('[contrato-cps] Erro:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
