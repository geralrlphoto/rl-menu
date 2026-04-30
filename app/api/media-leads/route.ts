import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET() {
  const { data, error } = await supabase
    .from('media_leads')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  const { data, error } = await supabase
    .from('media_leads')
    .insert([{
      nome:       body.nome,
      empresa:    body.empresa || null,
      email:      body.email || null,
      telefone:   body.telefone || null,
      tipo:       body.tipo || null,
      fonte:      body.fonte || null,
      mensagem:   body.mensagem || null,
      estado:     body.estado || 'Novo',
      created_at: new Date().toISOString(),
    }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Enviar email de notificação
  try {
    const linhas = [
      `<b>Nome:</b> ${body.nome}`,
      body.empresa ? `<b>Empresa:</b> ${body.empresa}` : null,
      body.email ? `<b>Email:</b> ${body.email}` : null,
      body.telefone ? `<b>Telefone:</b> ${body.telefone}` : null,
      body.tipo ? `<b>Tipo de Serviço:</b> ${body.tipo}` : null,
      body.fonte ? `<b>Como nos encontrou:</b> ${body.fonte}` : null,
      body.mensagem ? `<b>Mensagem:</b><br>${body.mensagem.replace(/\n/g, '<br>')}` : null,
    ].filter(Boolean).join('<br><br>')

    await resend.emails.send({
      from: 'RL Media <onboarding@resend.dev>',
      to: 'geral.rlmedia@gmail.com',
      subject: `Nova Lead — ${body.nome}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#222;">
          <div style="background:#0a0a0f;padding:24px 28px;margin-bottom:0;">
            <p style="margin:0;font-size:10px;letter-spacing:0.4em;color:#aaa;text-transform:uppercase;">RL Media · Audiovisual</p>
            <h1 style="margin:8px 0 0;font-size:20px;font-weight:300;letter-spacing:0.2em;color:#fff;text-transform:uppercase;">Nova Lead</h1>
          </div>
          <div style="background:#f9f9f9;padding:28px;">
            <p style="font-size:13px;line-height:1.8;color:#333;">${linhas}</p>
          </div>
          <div style="background:#0a0a0f;padding:14px 28px;">
            <p style="margin:0;font-size:10px;color:#555;letter-spacing:0.2em;">RL Media CRM · Notificação automática</p>
          </div>
        </div>
      `,
    })
  } catch (_) {
    // Email error não bloqueia a resposta
  }

  return NextResponse.json({ ok: true, lead: data })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, ...updates } = body

  const { error } = await supabase
    .from('media_leads')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
