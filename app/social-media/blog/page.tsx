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
      {/* Voltar */}
      <div className="blg-back-row">
        <Link href="/social-media" className="blg-back">
          <span className="chev">‹</span> Voltar a Social Media
        </Link>
      </div>

      {/* Hero */}
      <header className="blg-hero">
        <p className="blg-eyebrow">RL Photo · Video — Blog</p>
        <h1 className="blg-h1">CONTEÚDO PARA O <em>blog</em></h1>
        <hr className="blg-rule" />
        <p className="blg-lede">
          O agente IA gera-te 3 temas. Escolhes 1. Recebes artigo + caption
          para Instagram + post para Facebook. Tu copias e usas.
          Clica no <strong>boneco</strong> em baixo à direita para começar.
        </p>
      </header>

      {/* Cliente: botão IA + lista + modal */}
      <BlogClient />
    </main>
  )
}
