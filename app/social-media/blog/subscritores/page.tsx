import Link from 'next/link'
import SubscritoresClient from './SubscritoresClient'
import '../blog.css'
import './subscritores.css'

/* ============================================================
   /social-media/blog/subscritores
   Página admin para gerir subscritores do blog.
   ============================================================ */

export default function BlogSubscritoresPage() {
  return (
    <main className="blg-page">
      {/* Voltar */}
      <div className="blg-back-row">
        <Link href="/social-media/blog" className="blg-back">
          <span className="chev">‹</span> Voltar ao Blog
        </Link>
      </div>

      {/* Hero */}
      <header className="blg-hero">
        <p className="blg-eyebrow">RL Photo · Video — Blog</p>
        <h1 className="blg-h1">SUBSCRITORES DO <em>blog</em></h1>
        <hr className="blg-rule" />
        <p className="blg-lede">
          Lista de quem subscreveu o blog. Cada subscrição guarda o
          <strong> email</strong> e a <strong>data exacta</strong>.
          Podes adicionar manualmente, exportar para CSV ou marcar como
          cancelado.
        </p>
      </header>

      <SubscritoresClient />
    </main>
  )
}
