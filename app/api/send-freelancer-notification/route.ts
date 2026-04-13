import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function POST(req: NextRequest) {
  const { nomes, tipo, referencia, data_evento, local, nome_noiva, nome_noivo } = await req.json().catch(() => ({}))

  if (!nomes?.length) return NextResponse.json({ error: 'nomes required' }, { status: 400 })

  // Fetch all freelancers and match by name case-insensitively
  const { data: allFreelancers, error } = await supabase()
    .from('freelancers')
    .select('nome, email')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const nomesLower = nomes.map((n: string) => n.toLowerCase().trim())
  const targets = (allFreelancers ?? []).filter(f =>
    f.email && nomesLower.includes((f.nome ?? '').toLowerCase().trim())
  )

  if (!targets.length) return NextResponse.json({
    error: 'Nenhum email encontrado para os freelancers selecionados',
    nomes_procurados: nomes,
    nomes_na_bd: (allFreelancers ?? []).map(f => f.nome)
  }, { status: 404 })

  const tipoLabel = tipo === 'fotografo' ? 'Fotógrafo(a)' : 'Videógrafo(a)'
  const nomesCasal = [nome_noiva, nome_noivo].filter(Boolean).join(' & ') || 'Noivos'
  const dataFormatada = data_evento
    ? new Date(data_evento).toLocaleDateString('pt-PT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : '—'

  const results = []
  for (const freelancer of targets) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'RL Photo.Video <geral@rlphotovideo.pt>',
        to: [freelancer.email!],
        subject: `Notificação de Serviço — ${referencia ?? 'Novo Evento'}`,
        html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0e0b06;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0b06;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;border:1px solid #7a6340;background:#110e08;">
          <tr>
            <td style="padding:56px 48px 48px;font-family:Georgia,'Times New Roman',serif;text-align:center;">

              <!-- Logo -->
              <div style="margin:0 0 28px;display:inline-block;width:64px;height:64px;border-radius:50%;border:1px solid #7a6340;line-height:64px;text-align:center;">
                <span style="font-size:20px;font-style:italic;color:#c9a96e;">RL</span>
              </div>

              <p style="margin:0 0 20px;font-size:9px;letter-spacing:0.4em;color:#8a7450;text-transform:uppercase;">
                NOTIFICAÇÃO DE SERVIÇO
              </p>

              <h1 style="margin:0;font-size:36px;font-weight:400;color:#ffffff;line-height:1.1;">
                Olá,
              </h1>
              <h1 style="margin:0 0 16px;font-size:36px;font-weight:400;font-style:italic;color:#c9a96e;line-height:1.2;">
                ${freelancer.nome.split(' ')[0]}
              </h1>
              <p style="margin:0 0 28px;font-size:15px;font-style:italic;color:#c9a96e;letter-spacing:0.02em;">
                tens um novo serviço atribuído.
              </p>

              <div style="margin:0 0 32px;color:#7a6340;font-size:14px;letter-spacing:0.3em;">
                &#8212;&nbsp;&nbsp;·&nbsp;◆&nbsp;·&nbsp;&nbsp;&#8212;
              </div>

              <!-- Details table -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;border:1px solid #7a6340;width:100%;max-width:380px;">
                <tr>
                  <td style="padding:24px 28px;">
                    ${referencia ? `
                    <p style="margin:0 0 16px;text-align:left;">
                      <span style="font-size:9px;letter-spacing:0.35em;color:#8a7450;text-transform:uppercase;display:block;margin-bottom:4px;">Referência</span>
                      <span style="font-size:15px;font-family:monospace;color:#c9a96e;letter-spacing:0.1em;">${referencia}</span>
                    </p>` : ''}
                    <p style="margin:0 0 16px;text-align:left;">
                      <span style="font-size:9px;letter-spacing:0.35em;color:#8a7450;text-transform:uppercase;display:block;margin-bottom:4px;">Casal</span>
                      <span style="font-size:15px;color:#ffffff;">${nomesCasal}</span>
                    </p>
                    <p style="margin:0 0 16px;text-align:left;">
                      <span style="font-size:9px;letter-spacing:0.35em;color:#8a7450;text-transform:uppercase;display:block;margin-bottom:4px;">Data do Evento</span>
                      <span style="font-size:14px;color:#d4c9b0;">${dataFormatada}</span>
                    </p>
                    ${local ? `
                    <p style="margin:0 0 16px;text-align:left;">
                      <span style="font-size:9px;letter-spacing:0.35em;color:#8a7450;text-transform:uppercase;display:block;margin-bottom:4px;">Local</span>
                      <span style="font-size:14px;color:#d4c9b0;">${local}</span>
                    </p>` : ''}
                    <p style="margin:0;text-align:left;">
                      <span style="font-size:9px;letter-spacing:0.35em;color:#8a7450;text-transform:uppercase;display:block;margin-bottom:4px;">Função</span>
                      <span style="font-size:14px;color:#c9a96e;font-style:italic;">${tipoLabel}</span>
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 32px;font-size:13px;color:#8a7450;line-height:1.7;text-align:center;">
                Mais detalhes serão partilhados em breve.<br>
                Qualquer dúvida, entra em contacto connosco.
              </p>

              <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.35em;color:#5a4f3a;text-transform:uppercase;">
                RL PHOTO &middot; VIDEO
              </p>
              <p style="margin:0;font-size:9px;letter-spacing:0.2em;color:#4a4030;text-transform:uppercase;">
                Wedding Moments
              </p>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
      }),
    })

    const data = await res.json()
    results.push({ nome: freelancer.nome, email: freelancer.email, status: res.status, ok: res.ok, id: data.id, resendError: res.ok ? undefined : (data.message ?? data.name ?? JSON.stringify(data)) })
  }

  const allOk = results.every(r => r.ok)
  return NextResponse.json({ ok: allOk, results })
}
