import type { Metadata } from 'next'

/* ============================================================
   Envolvente da secção do podcast.
   Guarda o estilo partilhado pelas três páginas públicas, para não
   estar repetido em cada uma. A paleta e a tipografia são as que o
   site já usa (Cormorant Garamond + Hanken Grotesk, dourado sobre
   fundo escuro): não se inventou linguagem visual nova.
   ============================================================ */

export const metadata: Metadata = {
  title: {
    default: 'Antes do Sim — Podcast RL Photo Video',
    template: '%s · Antes do Sim',
  },
  description:
    'Todos os meses, uma conversa com quem faz casamentos por dentro, para quem está a planear o seu.',
}

export default function PodcastLayout({ children }: { children: React.ReactNode }) {
  // Sem envolvente: a /podcast serve o design aprovado tal e qual. As páginas
  // de episódio e de convidados trazem a sua, pelo componente Envolvente.
  return <>{children}</>
}
