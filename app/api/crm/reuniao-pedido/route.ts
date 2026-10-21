import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { exigeAdmin } from '@/lib/api-guard'
import { sbAdmin, fmtDataLonga, UUID_RE } from '@/lib/preparacao'
import { MEET_LINK, mensagemReuniaoConfirmada } from '@/lib/crm'
import { camposPublicar, gerarPassword, MAPS_LINK } from '@/lib/portalReuniao'
import { linkPublico } from '@/lib/site-url'

/* Pedido de reunião (feito em /reuniao) aceite no calendário do /photo.
   POST { id, data, hora, tipo }: a opção pedida ("Aceitar") ou outro horário ("Agendar").
   Preenche a Marcação de Reunião da ficha, publica o portal da reunião com password nas
   propostas e devolve a mensagem de WhatsApp pronta para os noivos. */

type Opcao = { data: string; hora: string }

export async function POST(req: NextRequest) {
  const negado = exigeAdmin(req)
  if (negado) return negado

  const b = await req.json().catch(() => ({}))
  const id = typeof b.id === 'string' && UUID_RE.test(b.id) ? b.id : null
  const data = /^\d{4}-\d{2}-\d{2}$/.test(b.data ?? '') ? b.data as string : null
  const hora = /^\d{2}:\d{2}$/.test(b.hora ?? '') ? b.hora as string : null
  const tipo = b.tipo === 'Presencial' ? 'Presencial' : 'Videochamada'
  if (!id || !data || !hora) return NextResponse.json({ error: 'Falta o dia ou a hora.' }, { status: 400 })

  const sb = sbAdmin()
  const { data: c } = await sb.from('crm_contacts')
    .select('nome, contato, status, reuniao_pedido, page_content').eq('id', id).maybeSingle()
  if (!c) return NextResponse.json({ error: 'Lead não encontrada.' }, { status: 404 })

  // O horário que o pedido tinha reservado volta à disponibilidade se a reunião ficar noutro
  const pedido = c.reuniao_pedido as { opcoes?: Opcao[]; slot?: boolean } | null
  const reservado = pedido?.slot ? pedido.opcoes?.[0] : null
  if (reservado && (reservado.data !== data || reservado.hora !== hora)) {
    await sb.from('preparacao_slots').upsert({ tipo: 'preparacao', data: reservado.data, hora: reservado.hora }, { onConflict: 'tipo,data,hora', ignoreDuplicates: true })
  }
  // O horário escolhido sai da disponibilidade, para mais ninguém o marcar
  await sb.from('preparacao_slots').delete().eq('tipo', 'preparacao').eq('data', data).eq('hora', hora).is('evento_id', null)

  const password = (c.page_content as any)?.proposta?.password || gerarPassword()
  const { token, campos } = await camposPublicar(sb, id, true, password)
  const agora = new Date().toISOString()
  const { error } = await sb.from('crm_contacts').update({
    ...campos,
    reuniao_data:   data,
    reuniao_hora:   hora,
    reuniao_tipo:   tipo,
    reuniao_link:   tipo === 'Videochamada' ? MEET_LINK : MAPS_LINK,
    reuniao_pedido: null,
    reuniao_enviada_at: agora,
    ...(c.status !== 'Reunião Agendada' ? { status: 'Reunião Agendada', status_updated_at: agora } : {}),
  }).eq('id', id)
  if (error) return NextResponse.json({ error: 'Não foi possível guardar a reunião.' }, { status: 500 })

  await sb.from('crm_status_history').insert({ contact_id: id, evento: `Reunião confirmada (${fmtDataLonga(data)} às ${hora})` })
  revalidateTag('photo-dashboard', { expire: 0 })
  revalidateTag('photo-whatsapp', { expire: 0 })

  const portalUrl = linkPublico(`/r/${token}`)
  const quando = `${fmtDataLonga(data)}, às ${hora}`
  return NextResponse.json({
    ok: true, nome: c.nome ?? '', contato: c.contato ?? '', data, hora, tipo, portalUrl, password,
    mensagem: mensagemReuniaoConfirmada(c.nome, quando, tipo, portalUrl, password),
  })
}
