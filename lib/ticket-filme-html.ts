// "Ticket do Filme": o email que os noivos recebem a cada passo da edição do vídeo
// (Departamento de Edição de Vídeo, via lib/videoEstado.ts) e quando a estreia é
// marcada (/api/edicao-video/entregar). Layout do bilhete dos noivos (lib/bilheteNoivos.ts).

import { SITE_URL } from '@/lib/site-url'
import { portalPathFor } from '@/lib/noivos-session'
import { buildBilheteNoivos, blocoDestaque, blocoPassos, nomesBilhete } from '@/lib/bilheteNoivos'

export type PassoFilme = 'Aguardar' | 'Em Edição' | 'Em Revisão' | 'Finalizado' | 'Estreia'

const PASSOS: { k: PassoFilme; rotulo: string }[] = [
  { k: 'Aguardar', rotulo: 'Editor' },
  { k: 'Em Edição', rotulo: 'Edição' },
  { k: 'Em Revisão', rotulo: 'Revisão' },
  { k: 'Finalizado', rotulo: 'Pronto' },
  { k: 'Estreia', rotulo: 'Estreia' },
]

/** Título e texto de cada passo (o que os noivos leem). */
export const MENSAGEM_PASSO: Record<PassoFilme, { titulo: string; texto: string }> = {
  'Aguardar': {
    titulo: 'O vosso filme já tem editor',
    texto: 'O vosso dia já está nas mãos de quem o vai contar. O editor recebeu todas as imagens e vai começar a escolher os momentos que ficam para sempre.',
  },
  'Em Edição': {
    titulo: 'O vosso filme começou a ganhar forma',
    texto: 'Neste momento estamos a rever cada plano do vosso dia: os olhares na cerimónia, os votos, as gargalhadas da festa. É aqui que a vossa história começa a nascer.',
  },
  'Em Revisão': {
    titulo: 'Estamos a ver o vosso filme pela primeira vez',
    texto: 'A primeira versão está pronta e estamos a vê-la do princípio ao fim, com atenção ao ritmo, à cor e ao som. Só sai daqui quando nos arrepiar.',
  },
  'Finalizado': {
    titulo: 'O vosso filme está pronto',
    texto: 'Está terminado. Falta só prepararmos a entrega: em breve fica no vosso portal, para o verem pela primeira vez.',
  },
  'Estreia': {
    titulo: 'A estreia do vosso filme está marcada',
    texto: 'Escolhemos um momento especial para o verem pela primeira vez. À hora marcada, o filme aparece no vosso portal. Preparem o sofá, chamem quem quiserem e vejam juntos.',
  },
}

/** "sábado, 25 de outubro às 21h00" (hora de Lisboa) */
export function dataEstreia(iso: string): string {
  const d = new Date(iso)
  const dia = d.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Lisbon' })
  const hora = d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Lisbon' }).replace(':', 'h')
  return `${dia} às ${hora}`
}

export function buildTicketFilmeHtml(t: {
  passo: PassoFilme
  referencia: string
  noivos: string
  estreia?: string | null      // ISO, só no passo Estreia
  batizado?: boolean
  data?: string | null         // data do evento, para o bilhete
}): string {
  const m = MENSAGEM_PASSO[t.passo]
  const atual = PASSOS.findIndex(p => p.k === t.passo)
  const portal = `${SITE_URL}${portalPathFor(t.referencia, t.batizado ? 'batizado' : 'casamento')}`
  const estreia = t.passo === 'Estreia' && t.estreia ? blocoDestaque('Estreia', dataEstreia(t.estreia)) : ''
  return buildBilheteNoivos({
    pill: 'Ticket do Filme',
    nomes: nomesBilhete(t.noivos) || t.noivos,
    data: t.data,
    tipo: t.batizado ? 'batizado' : 'casamento',
    frase: m.titulo,
    texto: m.texto,
    campos: [
      { k: 'Nº do ticket', v: `FL-${t.referencia}`, mono: true },
      { k: 'Passo', v: `${atual + 1} de ${PASSOS.length} · ${PASSOS[atual].rotulo}`, mono: true },
    ],
    extra: estreia + (estreia ? '<div style="height:22px;font-size:0;line-height:0;">&nbsp;</div>' : '') + blocoPassos(PASSOS.map(p => p.rotulo), atual),
    cta: { label: 'Abrir o nosso portal', url: portal },
    nota: 'Acompanhem o vosso filme no portal, em O Nosso Filme.',
    preheader: m.titulo,
  })
}
