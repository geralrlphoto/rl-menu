import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { assinaturaStaff, cookieStaff } from '@/lib/staffRlprod'

// Envio de material pelo staff RL PROD (portal /equipa-rlprod/<token>).
// O membro cola o link da transferência (WeTransfer, Drive, Dropbox...) na ficha
// do trabalho. Fica em media_equipa_projeto.envios, avisa no sino do admin
// (notify_log do portal) e por email.
// Acesso: o token secreto do membro tem de ser o dono do trabalho.

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({})) as { token?: string; trabalho?: string; link?: string; nota?: string; apagar?: string }
  if (!b.token || !/^[0-9a-f]{32}$/.test(b.token) || !b.trabalho) return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 })

  const { data: m } = await supabase.from('media_equipa').select('id, nome, ativo, senha').eq('acesso_token', b.token).maybeSingle()
  if (!m || !m.ativo) return NextResponse.json({ error: 'Sem acesso.' }, { status: 401 })
  // Tem de ter entrado com a senha (ou ser a RL PROD)
  const admin = req.cookies.get('rl_auth')?.value === process.env.AUTH_SECRET
  if (!admin && req.cookies.get(cookieStaff(m.id))?.value !== assinaturaStaff(b.token, m.senha)) return NextResponse.json({ error: 'Sessão terminada. Volta a entrar com a senha.' }, { status: 401 })
  const { data: t } = await supabase.from('media_equipa_projeto').select('id, projeto_ref, funcao, envios').eq('id', b.trabalho).eq('membro_id', m.id).maybeSingle()
  if (!t) return NextResponse.json({ error: 'Trabalho não encontrado.' }, { status: 404 })
  const envios: { id: string; link: string; nota: string | null; enviadoEm: string }[] = Array.isArray(t.envios) ? t.envios : []

  // Apagar um envio próprio (link errado)
  if (b.apagar) {
    const resto = envios.filter(e => e.id !== b.apagar)
    await supabase.from('media_equipa_projeto').update({ envios: resto }).eq('id', t.id)
    return NextResponse.json({ ok: true, envios: resto })
  }

  const link = String(b.link ?? '').trim()
  if (!/^https?:\/\/\S+\.\S+/.test(link) || link.length > 1000) return NextResponse.json({ error: 'Cola um link válido (começa por https://).' }, { status: 400 })
  const nota = String(b.nota ?? '').trim().slice(0, 500) || null
  const agora = new Date().toISOString()
  const novo = { id: crypto.randomUUID(), link, nota, enviadoEm: agora }
  const lista = [...envios, novo]
  const { error } = await supabase.from('media_equipa_projeto').update({ envios: lista }).eq('id', t.id)
  if (error) return NextResponse.json({ error: 'Não foi possível guardar.' }, { status: 500 })

  // Aviso no sino do admin (via notify_log do portal do projeto)
  const { data: portal } = await supabase.from('media_portais').select('dados').eq('ref', t.projeto_ref).maybeSingle()
  const dados = (portal?.dados ?? {}) as Record<string, unknown>
  const projetoNome = String(dados.nome ?? t.projeto_ref)
  if (portal) {
    const log = Array.isArray(dados.notify_log) ? [...dados.notify_log as unknown[]] : []
    log.push({ type: 'material-staff', title: 'Material enviado pela equipa', body: `${m.nome} enviou material de ${projetoNome}.`, at: agora, meta: { link } })
    while (log.length > 100) log.shift()
    await supabase.from('media_portais').update({ dados: { ...dados, notify_log: log } }).eq('ref', t.projeto_ref)
  }

  if (process.env.RESEND_API_KEY) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'RL PROD <geral@rlphotovideo.pt>',
        to: ['geral.rlmedia@gmail.com'],
        subject: `Material enviado · ${projetoNome} · ${m.nome}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#00141f;color:#fff;padding:28px">
          <p style="margin:0;font-size:11px;letter-spacing:.3em;color:#5a8bff;text-transform:uppercase">RL PROD · Portal da equipa</p>
          <h1 style="margin:10px 0 16px;font-size:22px">Material enviado</h1>
          <p style="font-size:14px;color:rgba(255,255,255,.75)">${esc(m.nome)} (${esc(t.funcao || 'equipa')}) enviou o material de <b>${esc(projetoNome)}</b>.</p>
          ${nota ? `<p style="font-size:14px;color:rgba(255,255,255,.75)">Nota: ${esc(nota)}</p>` : ''}
          <p style="margin:22px 0"><a href="${esc(link)}" style="background:#2e6cf6;color:#fff;padding:12px 22px;border-radius:6px;text-decoration:none">Abrir transferência</a></p>
          <p style="font-size:12px;color:rgba(255,255,255,.45)">Equipa do projeto: https://portal.rlphotovideo.pt/portal-media/${t.projeto_ref}/equipa</p>
        </div>`,
      }),
    }).catch(() => {})
  }

  return NextResponse.json({ ok: true, envios: lista })
}
