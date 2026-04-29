import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/relatorios-video?referencia=CAS_036_26_RL
export async function GET(req: NextRequest) {
  const referencia = req.nextUrl.searchParams.get('referencia')

  if (!referencia) {
    return NextResponse.json({ relatorios: [] })
  }

  const { data, error } = await supabase
    .from('relatorios_video')
    .select('*')
    .eq('referencia', referencia)
    .order('criado_em', { ascending: false })

  if (error) {
    console.error('Supabase error:', error)
    return NextResponse.json({ relatorios: [], error: error.message }, { status: 500 })
  }

  return NextResponse.json({ relatorios: data ?? [] })
}

// POST /api/relatorios-video — submissão do formulário in-site
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { referencia, nome_operador, dados } = body

  if (!referencia) {
    return NextResponse.json({ error: 'referencia obrigatória' }, { status: 400 })
  }

  const { error } = await supabase.from('relatorios_video').insert({
    referencia,
    nome_operador: nome_operador || null,
    dados: dados ?? {},
  })

  if (error) {
    console.error('Supabase error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // ── Email de notificação ────────────────────────────────────────────────────
  const d = dados ?? {}
  const rows = Object.entries(d)
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
      subject: `Relatório Vídeo — ${referencia}${nome_operador ? ' · ' + nome_operador : ''}`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:40px 24px;background:#000;color:#fff;">
          <p style="font-size:10px;letter-spacing:0.5em;color:#555;text-transform:uppercase;margin:0 0 28px;">RL PHOTO.VIDEO · RELATÓRIO VÍDEO</p>
          <h1 style="font-size:20px;font-weight:300;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 6px;color:#fff;">${referencia}</h1>
          ${nome_operador ? `<p style="font-size:12px;color:#888;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 28px;">${nome_operador}</p>` : ''}
          <table style="width:100%;border-collapse:collapse;margin-bottom:32px;">
            ${rows}
          </table>
          <p style="font-size:10px;color:#333;letter-spacing:0.3em;text-transform:uppercase;">RL Photo.Video · rlphotovideo.pt</p>
        </div>
      `,
    }),
  }).catch(() => null) // não bloqueia a resposta se o email falhar

  return NextResponse.json({ ok: true })
}

// DELETE /api/relatorios-video?id=UUID — admin reset
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const { error } = await supabase.from('relatorios_video').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
