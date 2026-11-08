// Card "Novo no blog" enviado às noivas (layout bilhete, lib/bilheteNoivos.ts).
// Usado na pré-visualização em /social-media/blog e no envio (/api/blog-enviar-noivas).
// {{CANCELAR}} é trocado pelo link de cancelamento de cada noiva no envio.

import { buildBilheteNoivos } from './bilheteNoivos'
import { fotosParaArtigo } from '@/app/social-media/blog/_data/bancoFotos'

// TODO: trocar pelo endereço da página do blog no site quando o Rui o indicar
export const URL_BLOG = 'https://rlphotovideo.pt'

export function buildCardBlogNoivas(a: { title: string; subtitle?: string | null; body: string }): string {
  const frase = (a.subtitle ?? '').trim()
    || a.body.split(/\n\s*\n/).map(s => s.trim()).find(s => s && !s.startsWith('[') && !s.startsWith('**')) || ''
  return buildBilheteNoivos({
    pill: 'Novo no blog',
    nomes: a.title,
    frase,
    cta: { label: 'Ler o artigo', url: URL_BLOG },
    nota: 'Recebe este email por ser noiva da RL Photo Video.<br><a href="{{CANCELAR}}" style="color:rgba(255,255,255,.55);text-decoration:underline;">Não quero receber mais</a>',
    preheader: a.title,
    fundo: fotosParaArtigo(a.title)[0],
  })
}
