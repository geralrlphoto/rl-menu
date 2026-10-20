import { NextRequest, NextResponse } from 'next/server'
import { emailNovaTarefa } from '@/lib/emailsFreelancers'
import { exigeSessao, destinoDaEquipa, naoAutorizado } from '@/lib/api-guard'

type Body = {
  to: string                // email do freelancer (destinatário)
  freelancerNome?: string
  titulo: string
  descricao?: string
  projeto?: string          // nome do casal/projeto (opcional)
  prazo: string             // dd/mm/yyyy
  hora?: string             // HH:mm
  prioridade: 'Alta' | 'Média' | 'Baixa'
  status?: string
  adminEmail?: string       // email do admin para onde voltam as respostas
}

export async function POST(req: NextRequest) {
  let body: Body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const { to, freelancerNome, titulo, descricao, projeto, prazo, hora, prioridade, status, adminEmail } = body

  // Só com sessão (admin ou equipa) e só para alguém da equipa / email geral da RL
  const bloqueio = await exigeSessao(req)
  if (bloqueio) return bloqueio
  if (!(await destinoDaEquipa(to))) return naoAutorizado('destinatario_invalido')
  if (!to || !titulo || !prazo || !prioridade) {
    return NextResponse.json({ ok: false, error: 'Faltam campos obrigatórios (to, titulo, prazo, prioridade)' }, { status: 400 })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: false, error: 'RESEND_API_KEY não configurada' }, { status: 500 })
  }

  const html = emailNovaTarefa({ url: 'https://portal.rlphotovideo.pt/painel-editor', nome: freelancerNome, titulo, descricao, projeto, prazo, hora, prioridade, editor: true })

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'RL Photo.Video <geral@rlphotovideo.pt>',
      to: [to],
      subject: `Nova tarefa atribuída · RL Photo.Video`,
      html,
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    return NextResponse.json({ ok: false, error: data?.message ?? 'Erro ao enviar email' }, { status: 500 })
  }
  return NextResponse.json({ ok: true, id: data.id })
}

