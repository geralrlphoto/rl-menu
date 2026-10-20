// Emails à equipa (freelancers, editores, candidatos), todos no card da equipa
// (lib/cardEquipa.ts) com a informação de cada envio. Partilhados entre as rotas de
// envio e a pré-visualização da página Tickets (/api/jornada/email).
import { buildCardEquipa, blocoTexto, blocoDestaque, camposEvento, funcaoDe } from './cardEquipa'
import { dataBilhete } from './bilheteNoivos'

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://portal.rlphotovideo.pt').replace(/\/+$/, '')
const portalFreelancer = (id: string) => `${SITE}/freelancers/${id}?view=freelancer`

type Membro = { nome?: string | null; status?: string | null }
type Evento = { referencia?: string | null; noivos?: string | null; data?: string | null; local?: string | null }

/** "Tens novidades no portal": novo evento na ficha do freelancer (send-freelancer-notification). */
export function emailNovidadesFreelancer(o: Membro & Evento & { freelancerId: string }): string {
  return buildCardEquipa({
    pill: 'Novo evento', nome: o.nome ?? '', funcao: funcaoDe(o.status), contexto: 'Casamento',
    frase: o.noivos ? `Estás escalado para o casamento da ${o.noivos}. Tudo o que precisas para o dia está no teu portal.` : 'Tens um novo evento no teu portal.',
    campos: camposEvento(o),
    cta: { label: 'Abrir o meu portal', url: portalFreelancer(o.freelancerId) },
    preheader: `Novo evento${o.referencia ? ` · ${o.referencia}` : ''}`,
  })
}

/** "Briefing disponível": briefing enviado à equipa do evento (briefing-equipa). */
export function emailNovoBriefing(o: Membro & Evento & { freelancerId: string; briefingUrl?: string | null }): string {
  return buildCardEquipa({
    pill: 'Briefing disponível', nome: o.nome ?? '', funcao: funcaoDe(o.status), contexto: 'Casamento',
    frase: `O briefing do ${o.noivos ? `casamento da ${o.noivos}` : 'teu próximo evento'} está disponível. Lê com calma antes do dia.`,
    campos: [...camposEvento(o), { k: 'Briefing', v: 'Disponível' }],
    cta: { label: 'Ver o briefing', url: o.briefingUrl || portalFreelancer(o.freelancerId) },
    preheader: 'Briefing disponível',
  })
}

/** "Trabalho de edição": trabalho enviado aos editores de vídeo (relatorio-editores). */
export function emailTrabalhoEdicao(o: Membro & Evento & { editorId: string; downloads?: string[] }): string {
  const links = o.downloads ?? []
  return buildCardEquipa({
    pill: 'Trabalho de edição', nome: o.nome ?? '', funcao: 'Editor', contexto: 'Vídeo',
    frase: `Tens um novo trabalho de edição${o.noivos ? `: o casamento da ${o.noivos}` : ''}. Os ficheiros estão no teu painel.`,
    campos: [...camposEvento(o), { k: 'Downloads', v: links.length ? `${links.length} ${links.length === 1 ? 'link' : 'links'}` : 'A adicionar' }],
    extra: links.length ? blocoTexto('Link(s) de download', links.join('\n')) : '',
    cta: { label: 'Abrir o meu painel', url: `${SITE}/painel-editor?freelancer=${o.editorId}` },
    preheader: 'Novo trabalho de edição',
  })
}

/** "Nova edição de fotos": edição de fotos atribuída a um freelancer (send-edicao-fotos-email). */
export function emailEdicaoFotos(o: Membro & Evento & { portalUrl: string }): string {
  return buildCardEquipa({
    pill: 'Nova edição de fotos', nome: o.nome ?? '', funcao: 'Editor', contexto: 'Fotografia',
    frase: `Foi-te atribuída a edição das fotografias${o.noivos ? ` do casamento da ${o.noivos}` : ''}.`,
    campos: camposEvento(o),
    cta: { label: 'Abrir o meu portal', url: o.portalUrl },
    preheader: 'Nova edição de fotos',
  })
}

/** "Nova edição de álbum": com a lista das fotos escolhidas pelos noivos (send-edicao-album-email). */
export function emailEdicaoAlbum(o: Membro & Evento & { portalUrl: string; fotos?: string[] }): string {
  const fotos = o.fotos ?? []
  return buildCardEquipa({
    pill: 'Nova edição de álbum', nome: o.nome ?? '', funcao: 'Editor', contexto: 'Álbum',
    frase: `Foi-te atribuída a edição do álbum${o.noivos ? ` do casamento da ${o.noivos}` : ''}.`,
    campos: [...camposEvento(o), { k: 'Fotos do álbum', v: fotos.length ? String(fotos.length) : '', mono: true }],
    extra: fotos.length ? blocoTexto(`Fotos para o álbum · ${fotos.length}`, fotos.join('; ')) : '',
    cta: { label: 'Abrir o meu portal', url: o.portalUrl },
    preheader: 'Nova edição de álbum',
  })
}

/** "Tens uma nova notificação": título escrito pelo admin (send-notif-freelancer-email). */
export function emailNotificacaoFreelancer(o: Membro & { portalUrl: string; titulo: string }): string {
  return buildCardEquipa({
    pill: 'Nova notificação', nome: o.nome ?? '', funcao: funcaoDe(o.status),
    frase: o.titulo,
    cta: { label: 'Ver no portal', url: o.portalUrl },
    nota: 'Fica também no sino do teu portal.',
    preheader: o.titulo,
  })
}

/** "Tens uma nova mensagem no portal": mensagem do admin ao freelancer (freelancer-mensagens). */
export function emailMensagemFreelancer(o: Membro & { portalUrl: string; mensagem?: string | null }): string {
  return buildCardEquipa({
    pill: 'Nova mensagem', nome: o.nome ?? '', funcao: funcaoDe(o.status),
    frase: 'Tens uma nova mensagem da RL no teu portal.',
    extra: o.mensagem ? blocoTexto('Mensagem', o.mensagem) : '',
    cta: { label: 'Responder no portal', url: o.portalUrl },
    preheader: 'Tens uma nova mensagem no portal',
  })
}

/** "Nova tarefa atribuída" ao freelancer (send-nova-tarefa-email) e ao editor (painel-editor/notify-nova-tarefa). */
export function emailNovaTarefa(o: Membro & { url: string; titulo?: string | null; descricao?: string | null; projeto?: string | null; prazo?: string | null; hora?: string | null; prioridade?: string | null; editor?: boolean }): string {
  return buildCardEquipa({
    pill: 'Nova tarefa', nome: o.nome ?? '', funcao: o.editor ? 'Editor' : funcaoDe(o.status), contexto: o.editor ? 'Vídeo' : null,
    frase: o.titulo ? `Tens uma nova tarefa: ${o.titulo}.` : 'Tens uma nova tarefa atribuída.',
    campos: [
      { k: 'Projeto', v: o.projeto ?? '' },
      { k: 'Prazo', v: [dataBilhete(o.prazo) || o.prazo || '', o.hora ?? ''].filter(Boolean).join(' · '), mono: true },
      { k: 'Prioridade', v: o.prioridade ?? '' },
    ],
    extra: o.descricao ? blocoTexto('Descrição', o.descricao) : '',
    cta: { label: o.editor ? 'Abrir o meu painel' : 'Abrir o meu portal', url: o.url },
    preheader: `Nova tarefa${o.titulo ? ` · ${o.titulo}` : ''}`,
  })
}

/** "Novo projeto atribuído" ao editor (painel-editor/notify-novo-projeto). */
export function emailNovoProjeto(o: Membro & Evento & { url: string }): string {
  return buildCardEquipa({
    pill: 'Novo projeto', nome: o.nome ?? '', funcao: 'Editor', contexto: 'Vídeo',
    frase: `Tens um novo projeto no teu painel${o.noivos ? `: o casamento da ${o.noivos}` : ''}.`,
    campos: camposEvento(o),
    cta: { label: 'Abrir o meu painel', url: o.url },
    preheader: 'Novo projeto atribuído',
  })
}

/** "⚠ Projeto atrasado": entrega prevista passou (painel-editor/notify-projeto-atrasado). */
export function emailProjetoAtrasado(o: Membro & Evento & { url: string; entregaPrevista: string; diasAtraso: number }): string {
  return buildCardEquipa({
    pill: 'Projeto atrasado', nome: o.nome ?? '', funcao: 'Editor', contexto: 'Vídeo',
    frase: 'Um dos teus projetos passou a data de entrega prevista e ainda não foi marcado como entregue.',
    campos: [...camposEvento(o), { k: 'Entrega prevista', v: o.entregaPrevista, mono: true }],
    extra: blocoDestaque('Atraso', `${o.diasAtraso} ${o.diasAtraso === 1 ? 'dia' : 'dias'}`, true),
    cta: { label: 'Abrir o projeto', url: o.url },
    nota: 'Marca como Entregue para parar este alerta.',
    preheader: `Projeto atrasado · ${o.diasAtraso} dias`,
  })
}

/** Avisos do álbum ao editor (lib/albumEstado.ts → avisarEditorAlbum). */
export function emailAvisoAlbum(o: Membro & Evento & { url: string; titulo: string; texto: string }): string {
  return buildCardEquipa({
    pill: 'Álbum', nome: o.nome ?? '', funcao: 'Editor', contexto: 'Álbum',
    frase: o.titulo,
    campos: camposEvento(o),
    extra: blocoTexto('Mensagem', o.texto),
    cta: { label: 'Abrir o meu portal', url: o.url },
    preheader: o.titulo,
  })
}

/** "Recebemos a tua candidatura": confirmação ao candidato (send-admin-notification e webhook-tally-freelancer). */
export function emailCandidatura(_site?: string, nome?: string | null): string {
  return buildCardEquipa({
    pill: 'Candidatura recebida', nome: nome || 'Obrigado', contexto: 'Candidatura',
    frase: 'Obrigado pelo teu interesse em fazer parte da equipa RL Photo.Video. Recebemos a tua candidatura.',
    texto: 'Vamos analisar com atenção e entramos em contacto contigo em breve.',
    cta: { label: 'Conhecer o nosso trabalho', url: 'https://www.rlphotovideo.pt' },
    preheader: 'Recebemos a tua candidatura',
  })
}

