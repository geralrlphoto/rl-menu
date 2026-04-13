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
    .select('id, nome, email')

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
        subject: `Tens novidades no portal — ${referencia ?? 'Novo Evento'}`,
        html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#1a1510;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1510;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="540" cellpadding="0" cellspacing="0" style="max-width:540px;width:100%;border:1px solid #5a4a2a;background:#130f0a;">
          <tr>
            <td style="padding:56px 48px 52px;font-family:Georgia,'Times New Roman',serif;text-align:center;">

              <!-- Logo circular -->
              <div style="margin:0 auto 32px;width:72px;height:72px;border-radius:50%;border:1px solid #7a6340;display:table;text-align:center;">
                <div style="display:table-cell;vertical-align:middle;">
                  <span style="font-size:11px;letter-spacing:0.15em;color:#c9a96e;font-style:italic;">RL</span><br>
                  <span style="font-size:7px;letter-spacing:0.12em;color:#8a7450;text-transform:uppercase;">PHOTO<br>VIDEO</span>
                </div>
              </div>

              <!-- EQUIPA RL -->
              <p style="margin:0 0 28px;font-size:9px;letter-spacing:0.45em;color:#8a7450;text-transform:uppercase;">
                EQUIPA RL
              </p>

              <!-- Olá! -->
              <p style="margin:0;font-size:42px;font-weight:400;font-style:italic;color:#c9a96e;line-height:1.1;letter-spacing:-0.01em;">
                Olá!
              </p>

              <!-- Tens novidades no portal. -->
              <p style="margin:0 0 4px;font-size:38px;font-weight:700;color:#ffffff;line-height:1.15;letter-spacing:-0.01em;">
                Tens
              </p>
              <p style="margin:0;font-size:38px;font-weight:400;font-style:italic;color:#c9a96e;line-height:1.2;">
                novidades
              </p>
              <p style="margin:0 0 32px;font-size:38px;font-weight:400;font-style:italic;color:#c9a96e;line-height:1.2;">
                no portal.
              </p>

              <!-- Divider -->
              <div style="margin:0 0 32px;color:#7a6340;font-size:13px;letter-spacing:0.3em;">
                &#8212;&nbsp;&nbsp;·&nbsp;&#9670;&nbsp;·&nbsp;&nbsp;&#8212;
              </div>

              <!-- Body text -->
              <p style="margin:0 0 40px;font-size:15px;color:#c9b88a;line-height:1.75;text-align:center;font-family:Georgia,'Times New Roman',serif;">
                Existem <strong>atualizações importantes</strong><br>
                que precisam da tua atenção.<br>
                Consulta o teu portal para ficares<br>
                a par de <strong>tudo o que é necessário</strong>.
              </p>

              <!-- Button -->
              <a href="https://rl-menu-lake.vercel.app/freelancer-view/${freelancer.id}"
                style="display:inline-block;padding:16px 48px;border:1px solid #c9a96e;color:#c9a96e;font-family:Georgia,'Times New Roman',serif;font-size:16px;font-style:italic;letter-spacing:0.05em;text-decoration:none;">
                Consultar Portal
              </a>

              <!-- Footer -->
              <p style="margin:48px 0 0;font-size:9px;letter-spacing:0.4em;color:#5a4a30;text-transform:uppercase;">
                RL PHOTO &middot; VIDEO
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
