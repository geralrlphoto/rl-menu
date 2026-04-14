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
<body style="margin:0;padding:0;background:#0e0a05;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0a05;padding:32px 16px 40px;">
    <tr>
      <td align="center">

        <!-- Imagem principal -->
        <a href="https://rl-menu-lake.vercel.app/freelancer-view/${freelancer.id}" style="display:block;text-decoration:none;">
          <img src="https://rl-menu-lake.vercel.app/card_novo_evento.png"
            width="560" alt="Tens novidades no portal"
            style="display:block;width:100%;max-width:560px;border:0;" />
        </a>

        <!-- Bloco evento -->
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#120e09;border-left:0.5px solid #4a3a1e;border-right:0.5px solid #4a3a1e;border-bottom:0.5px solid #4a3a1e;">
          <tr><td style="padding:28px 40px 32px;font-family:Georgia,'Times New Roman',serif;text-align:center;">
            <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.45em;color:#7a6340;text-transform:uppercase;">Novo Evento</p>
            <p style="margin:0;font-size:26px;font-weight:400;font-style:italic;color:#c9a96e;line-height:1.2;">${nomesCasal}</p>
          </td></tr>
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
