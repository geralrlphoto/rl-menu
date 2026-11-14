import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exigeAdmin } from '@/lib/api-guard'
import { emailAcessoPortal } from '@/lib/emailsFreelancers'

// Botão "Email acesso" no card do membro em /freelancers: envia por email o link do portal,
// o email de login e a password (card da equipa). Só admin.
export async function POST(req: Request) {
  const bloqueio = exigeAdmin(req); if (bloqueio) return bloqueio
  const { id } = await req.json().catch(() => ({})) as { id?: string }
  if (!id) return NextResponse.json({ error: 'Falta o membro.' }, { status: 400 })

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: f } = await db.from('freelancers').select('id, nome, email, status, password').eq('id', id).maybeSingle()
  if (!f) return NextResponse.json({ error: 'Membro não encontrado.' }, { status: 404 })
  if (!f.email) return NextResponse.json({ error: 'Este membro não tem email na ficha.' }, { status: 400 })
  if (!f.password) return NextResponse.json({ error: 'Este membro ainda não tem password.' }, { status: 400 })

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'RL Photo.Video <geral@rlphotovideo.pt>',
      to: [f.email],
      subject: 'O teu acesso ao portal da RL Photo.Video',
      html: emailAcessoPortal({ freelancerId: f.id, nome: f.nome, status: f.status, email: f.email, password: f.password }),
    }),
  })
  const d = await res.json().catch(() => ({}))
  if (!res.ok) return NextResponse.json({ error: d?.message ?? 'Não foi possível enviar o email.' }, { status: 500 })
  return NextResponse.json({ ok: true, para: f.email })
}
