import Link from 'next/link'
import BlogClient from './BlogClient'
import './blog.css'

/* ============================================================
   /social-media/blog
   Server page apenas com o frame; toda a interactividade
   (botão IA, modal, lista) está em BlogClient.
   ============================================================ */

export default function BlogIdeasPage() {
  return (
    <main className="blg-page">
      {/* Voltar + Subscritores */}
      <div className="blg-back-row blg-back-row--with-cta">
        <Link href="/social-media" className="blg-back">
          <span className="chev">‹</span> Voltar a Social Media
        </Link>
        <Link href="/social-media/blog/subscritores" className="blg-cta-subs">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
          Subscritores
        </Link>
      </div>

      {/* Hero */}
      <header className="blg-hero">
        <p className="blg-eyebrow">RL Photo · Video — Blog</p>
        <h1 className="blg-h1">CONTEÚDO PARA O <em>blog</em></h1>
        <hr className="blg-rule" />
        <p className="blg-lede">
          Modo grátis. O sistema gera-te um prompt pronto a copiar para
          pedires conteúdo ao Claude no chat. Tu colas a resposta de volta
          e fica tudo guardado aqui: artigo, caption Instagram, post Facebook.
          Clica no <strong>boneco</strong> em baixo à direita para começar.
        </p>
      </header>

      {/* Cliente: botão IA + lista + modal */}
      <BlogClient />
    </main>
  )
}
