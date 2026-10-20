// Ticket das Fotografias: os emails aos noivos do Departamento de Fotografia no
// layout do bilhete (lib/bilheteNoivos.ts), com os passos das fotografias.
//   sneakpeek, galerias, selecao, entregue → entregas (com o link)
//   recebida   → a seleção chegou, estamos a editar
//   lembrete30 / lembrete60 → os noivos ainda não escolheram (30 e 60 dias depois do envio)
//   download   → as fotos editadas deixam de poder ser descarregadas daqui a 7 dias
// Mensagens aos noivos: sem emojis e sem "(Mensagem automática)".

import { createClient } from '@supabase/supabase-js'
import { buildBilheteNoivos, blocoPassos, nomesBilhete } from '@/lib/bilheteNoivos'
import { resolveEmailNoiva } from '@/app/api/_lib/emailNoiva'

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://portal.rlphotovideo.pt').replace(/\/+$/, '')
export const PASSOS_FOTOS = ['Sneak peek', 'Galeria', 'Seleção', 'Edição', 'Entregue']
export const DIAS_DOWNLOAD = 30

export type TicketFoto = 'sneakpeek' | 'galerias' | 'selecao' | 'recebida' | 'entregue' | 'lembrete30' | 'lembrete60' | 'download'

export const TICKETS_FOTO: Record<TicketFoto, { assunto: string; pill: string; frase: string; texto?: string; cta: string; passo: number; link: boolean }> = {
  sneakpeek: {
    assunto: 'As primeiras fotografias do vosso casamento', pill: 'As primeiras fotografias',
    frase: 'Não conseguimos esperar. Escolhemos algumas fotografias do vosso dia para as verem já, enquanto tudo ainda está tão perto.',
    texto: 'A galeria completa chega nos próximos dias.', cta: 'Ver o sneak peek', passo: 0, link: true,
  },
  galerias: {
    assunto: 'As fotos do dia já estão disponíveis', pill: 'As fotos do dia',
    frase: 'O vosso dia, de volta. A galeria completa já está à vossa espera, para partilharem com quem mais gostam.',
    cta: 'Ver a galeria', passo: 1, link: true,
  },
  selecao: {
    assunto: 'As vossas fotos estão prontas para seleção', pill: 'As fotos para seleção',
    frase: 'Chegou a parte mais bonita: escolher. Com calma, escolham as fotos que contam a vossa história e as do vosso álbum.',
    texto: 'Quando terminarem, enviem a seleção no portal, na página Fotografias.', cta: 'Escolher as fotos', passo: 2, link: true,
  },
  recebida: {
    assunto: 'Recebemos a vossa seleção', pill: 'Seleção recebida',
    frase: 'Obrigado pela vossa escolha. A partir de agora é connosco: cada fotografia vai ser editada uma a uma.',
    texto: 'Avisamos assim que as fotos editadas estiverem prontas.', cta: 'Abrir o portal', passo: 3, link: false,
  },
  entregue: {
    assunto: 'As vossas fotos já estão editadas', pill: 'As fotos finais',
    frase: 'Cada fotografia foi editada com cuidado. Estão prontas para serem vossas para sempre.',
    texto: `Têm ${DIAS_DOWNLOAD} dias para as descarregar. Guardem-nas em mais do que um sítio.`, cta: 'Ver as fotos', passo: 4, link: true,
  },
  lembrete30: {
    assunto: 'As vossas fotos estão à espera da vossa escolha', pill: 'A vossa seleção',
    frase: 'Já passou um mês desde que vos enviámos as fotos para seleção. Sabemos que escolher não é fácil, por isso fica aqui um lembrete com carinho.',
    texto: 'Quando tiverem a escolha feita, enviem a seleção no portal, na página Fotografias. Se precisarem de ajuda, é só dizer.', cta: 'Escolher as fotos', passo: 2, link: true,
  },
  lembrete60: {
    assunto: 'Falta só a vossa escolha', pill: 'A vossa seleção',
    frase: 'Já passaram dois meses e as vossas fotos continuam à espera da vossa escolha. Sem ela não conseguimos começar a edição nem o vosso álbum.',
    texto: 'Se preferirem, marcamos uma conversa rápida e ajudamos a escolher. Respondam a este email ou falem connosco no portal.', cta: 'Escolher as fotos', passo: 2, link: true,
  },
  download: {
    assunto: 'O download das vossas fotos termina em breve', pill: 'Último aviso de download',
    frase: 'Daqui a 7 dias as vossas fotos editadas deixam de estar disponíveis para descarregar.',
    texto: 'Descarreguem-nas já e guardem uma cópia em mais do que um sítio. Se quiserem uma pen ou uma caixa com as fotos, ou impressões, falem connosco.', cta: 'Descarregar as fotos', passo: 4, link: true,
  },
}

const db = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export function buildTicketFotosHtml(t: TicketFoto, o: {
  nomes: string; data?: string | null; local?: string | null; referencia?: string | null; url?: string | null; batizado?: boolean; prazo?: string | null
}): string {
  const c = TICKETS_FOTO[t]
  const portal = `${SITE}/${o.batizado ? 'login-batizado' : 'login-noivos'}`
  const url = (c.link && o.url) ? o.url : portal
  const campos = [
    { k: 'Local', v: o.local ?? '' },
    { k: 'No portal', v: 'Fotografias' },
    ...(o.prazo ? [{ k: t === 'download' ? 'Download até' : 'Desde', v: o.prazo }] : []),
    { k: 'Referência', v: o.referencia ?? '', mono: true },
  ].filter(x => x.v)
  return buildBilheteNoivos({
    pill: c.pill,
    nomes: o.nomes,
    data: o.data,
    tipo: o.batizado ? 'batizado' : 'casamento',
    frase: c.frase,
    texto: c.texto,
    campos: campos.slice(0, 4),
    extra: blocoPassos(PASSOS_FOTOS, c.passo),
    cta: { label: c.cta, url },
    preheader: `${o.nomes.replace(' | ', ' e ')}, ${c.assunto.charAt(0).toLowerCase()}${c.assunto.slice(1)}.`,
  })
}

/** Envia o Ticket das Fotografias à noiva (email da ficha). Devolve se saiu. */
export async function enviarTicketFotos(t: TicketFoto, referencia: string, o: { url?: string | null; prazo?: string | null } = {}): Promise<{ ok: boolean; erro?: string }> {
  if (!process.env.RESEND_API_KEY) return { ok: false, erro: 'Sem RESEND_API_KEY' }
  const sb = db()
  const email = await resolveEmailNoiva(null, referencia)
  if (!email) return { ok: false, erro: 'Email da noiva não encontrado. Preenche o email na ficha do evento.' }
  const { data: pt } = await sb.from('portais').select('noiva, noivo').eq('referencia', referencia).maybeSingle()
  let ev: any = null
  for (const tb of ['eventos_2026', 'eventos_2027']) {
    const { data } = await sb.from(tb).select('data_evento, local, cliente').eq('referencia', referencia).maybeSingle()
    if (data) { ev = data; break }
  }
  const nomes = nomesBilhete(pt?.noiva, pt?.noivo) || nomesBilhete(ev?.cliente) || 'Para vocês'
  const html = buildTicketFotosHtml(t, { nomes, data: ev?.data_evento ?? null, local: ev?.local ?? null, referencia, url: o.url, batizado: /^BAT/i.test(referencia), prazo: o.prazo })
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.FROM_EMAIL ?? 'RL Photo.Video <geral@rlphotovideo.pt>', to: [email], reply_to: 'geral.rlphoto@gmail.com', subject: TICKETS_FOTO[t].assunto, html }),
  }).catch(() => null)
  return r?.ok ? { ok: true } : { ok: false, erro: 'Não foi possível enviar o email aos noivos.' }
}
