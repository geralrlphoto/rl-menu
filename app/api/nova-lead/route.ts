import { NextRequest, NextResponse } from 'next/server'
import { buildNovaLeadEmail } from '@/lib/emailsClientes'
import { createClient } from '@supabase/supabase-js'
import { qualificarLead } from '@/lib/crm'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      nome,
      email,
      contato,
      zona_residencia,
      data_casamento,
      local_casamento,
      como_chegou,
      servicos,
      tipo_cerimonia,
      tipo_evento,
      orcamento,
      num_convidados,
      motivo_contacto,
      estilo,
      visao_20anos,
      trabalho_favorito,
      mensagem,
    } = body

    if (!nome) {
      return NextResponse.json({ error: 'Nome em falta' }, { status: 400 })
    }

    const { error } = await supabase.from('crm_contacts').insert({
      nome:            nome ?? '',
      email:           email ?? '',
      contato:         contato ?? '',
      data_casamento:  data_casamento ?? '',
      local_casamento: local_casamento ?? '',
      como_chegou:     como_chegou ?? '',
      servicos:        Array.isArray(servicos) ? servicos.join(', ') : (servicos ?? ''),
      tipo_cerimonia:  Array.isArray(tipo_cerimonia) ? tipo_cerimonia.join(', ') : (tipo_cerimonia ?? ''),
      tipo_evento:     tipo_evento ?? '',
      orcamento:       orcamento ?? '',
      num_convidados:  num_convidados ?? '',
      mensagem:        [
        zona_residencia ? `Zona: ${zona_residencia}` : '',
        motivo_contacto ? `Motivo do contacto: ${motivo_contacto}` : '',
        mensagem ?? '',
      ].filter(Boolean).join('\n\n'),
      status:          'Por Contactar',
      lead_prioridade: qualificarLead(orcamento, data_casamento), // QUENTE / MORNA / FRIA
      data_entrada:    new Date().toISOString().slice(0, 10),
      consentimento_marketing: body.consentimento_marketing === true,
      consentimento_em: body.consentimento_marketing === true ? new Date().toISOString() : null,
    })

    if (error) throw new Error(error.message)

    // ── Data livre? Quantos eventos já há nessa data (para responder logo aos noivos) ──
    let disponibilidade = ''
    const dataISO = String(data_casamento ?? '').slice(0, 10)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dataISO)) {
      const { count } = await supabase.from('eventos_2026').select('id', { count: 'exact', head: true }).eq('data_evento', dataISO)
      disponibilidade = !count ? 'Data livre: nenhum evento marcado nesse dia' : `Já há ${count} ${count === 1 ? 'evento marcado' : 'eventos marcados'} nesse dia`
    }

    // ── Email de notificação ──────────────────────────────────────────────────
    const fields: [string, string][] = [
      ['Nome',              nome],
      ['Email',             email],
      ['Contacto',          contato],
      ['Zona de Residência', zona_residencia],
      ['Data do Casamento', data_casamento],
      ['Disponibilidade',   disponibilidade],
      ['Consentimento',     body.consentimento_marketing === true ? 'Aceita emails e mensagens' : 'Não aceitou emails de marketing'],
      ['Local',             local_casamento],
      ['Tipo de Evento',    tipo_evento],
      ['Tipo de Cerimónia', Array.isArray(tipo_cerimonia) ? tipo_cerimonia.join(', ') : tipo_cerimonia],
      ['Nº de Convidados',  num_convidados],
      ['Como nos Encontrou',como_chegou],
      ['Serviços',          Array.isArray(servicos) ? servicos.join(', ') : servicos],
      ['Orçamento',         orcamento],
      ['Motivo do contacto', motivo_contacto],
      ['Estilo',            estilo],
      ['Visão a 20 anos',   visao_20anos],
      ['Trabalho favorito', trabalho_favorito],
      ['Mensagem',          mensagem],
    ]

    const rows = fields
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([k, v]) => `
        <tr>
          <td style="padding:8px 12px;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#666;white-space:nowrap;border-bottom:1px solid #111;">${k}</td>
          <td style="padding:8px 12px;font-size:13px;color:#ccc;border-bottom:1px solid #111;">${v}</td>
        </tr>`).join('')

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'RL Photo.Video <geral@rlphotovideo.pt>',
        to: ['geral.rlphoto@gmail.com'],
        subject: `Nova Lead — ${nome}${data_casamento ? ' · ' + data_casamento : ''}`,
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:40px 24px;background:#000;color:#fff;">
            <p style="font-size:10px;letter-spacing:0.5em;color:#555;text-transform:uppercase;margin:0 0 28px;">RL PHOTO.VIDEO · NOVA LEAD</p>
            <h1 style="font-size:22px;font-weight:300;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 6px;color:#fff;">${nome}</h1>
            ${email ? `<p style="font-size:12px;color:#C9A84C;letter-spacing:0.2em;margin:0 0 28px;">${email}</p>` : ''}
            <table style="width:100%;border-collapse:collapse;margin-bottom:32px;">
              ${rows}
            </table>
            <p style="font-size:10px;color:#333;letter-spacing:0.3em;text-transform:uppercase;">RL Photo.Video · www.rlprod.pt</p>
          </div>
        `,
      }),
    }).catch(() => null)

    // ── Email para os noivos ─────────────────────────────────────────────────
    if (email) {
      const servicosList = (Array.isArray(servicos) ? servicos.join(', ') : (servicos ?? '')).trim()

      const emailHtml = buildNovaLeadEmail(nome, servicosList)

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'RL Photo.Video <geral@rlphotovideo.pt>',
          to: [email],
          subject: `Recebemos o vosso contacto — RL Photo.Video`,
          html: emailHtml,
        }),
      }).catch(() => null)
    }

    return NextResponse.json({ ok: true })

  } catch (err: any) {
    console.error('nova-lead error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
