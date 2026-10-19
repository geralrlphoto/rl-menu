// POST /api/convidados/<id do portal> — comentários dos convidados sobre o filme e
// indicações de próximos noivos (página pública /convidados/<id>/filme).
// Guarda na tabela e avisa o admin por email. Rota pública: valida tudo e tem
// um campo-isco contra robôs.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'geral.rlphoto@gmail.com'
const corta = (v: unknown, n: number) => String(v ?? '').trim().slice(0, n)
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Página inválida' }, { status: 400 })
  const body = await req.json().catch(() => ({}))
  if (body.site) return NextResponse.json({ ok: true }) // campo-isco preenchido: robô

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: portal } = await sb.from('portais').select('referencia, noiva, noivo').eq('id', id).maybeSingle()
  if (!portal) return NextResponse.json({ error: 'Página não encontrada' }, { status: 404 })
  const casal = [portal.noiva, portal.noivo].filter(Boolean).join(' & ') || portal.referencia

  let assunto = '', html = ''
  if (body.tipo === 'comentario') {
    const nome = corta(body.nome, 80), mensagem = corta(body.mensagem, 2000)
    if (!nome || mensagem.length < 2) return NextResponse.json({ error: 'Escrevam o vosso nome e o comentário.' }, { status: 400 })
    const { error } = await sb.from('convidados_comentarios').insert({ portal_id: id, referencia: portal.referencia, nome, mensagem })
    if (error) return NextResponse.json({ error: 'Não foi possível enviar. Tentem de novo.' }, { status: 500 })
    assunto = `💬 Comentário ao filme de ${casal}`
    html = `<p style="font-family:Georgia,serif;font-size:16px"><strong>${esc(nome)}</strong> deixou um comentário ao filme de <strong>${esc(casal)}</strong>:</p>
<blockquote style="font-family:Georgia,serif;font-size:15px;border-left:3px solid #d8be93;margin:12px 0;padding:6px 14px;color:#333">${esc(mensagem).replace(/\n/g, '<br>')}</blockquote>`
  } else if (body.tipo === 'indicacao') {
    const nome = corta(body.nome, 80), noivos = corta(body.noivos, 120), contacto = corta(body.contacto, 120)
    const data = corta(body.data, 40), notas = corta(body.notas, 1000)
    if (!nome || !noivos || contacto.length < 6) return NextResponse.json({ error: 'Preencham o vosso nome, o nome dos noivos e um contacto.' }, { status: 400 })
    if (!body.consentimento) return NextResponse.json({ error: 'Confirmem que os noivos aceitam ser contactados.' }, { status: 400 })
    const { error } = await sb.from('convidados_indicacoes').insert({
      portal_id: id, referencia: portal.referencia, nome_convidado: nome, noivos, contacto, data_casamento: data || null, notas: notas || null,
    })
    if (error) return NextResponse.json({ error: 'Não foi possível enviar. Tentem de novo.' }, { status: 500 })
    assunto = `💍 Nova indicação de noivos: ${noivos}`
    html = `<p style="font-family:Georgia,serif;font-size:16px">Indicação deixada por <strong>${esc(nome)}</strong>, convidado do casamento de <strong>${esc(casal)}</strong>.</p>
<p style="font-family:Georgia,serif;font-size:15px;line-height:1.7">Noivos: <strong>${esc(noivos)}</strong><br>Contacto: <strong>${esc(contacto)}</strong>${data ? `<br>Data prevista: ${esc(data)}` : ''}${notas ? `<br>Notas: ${esc(notas)}` : ''}</p>
<p style="font-family:Georgia,serif;font-size:13px;color:#777">O convidado confirmou que os noivos aceitam ser contactados.</p>`
  } else {
    return NextResponse.json({ error: 'Pedido inválido' }, { status: 400 })
  }

  // Aviso ao admin (não falha o pedido se o email não sair)
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'RL Photo.Video <geral@rlphotovideo.pt>', to: [ADMIN_EMAIL], subject: assunto, html }),
  }).catch(() => null)

  return NextResponse.json({ ok: true })
}
