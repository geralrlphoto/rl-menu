import Link from 'next/link'
import { ARTICLES } from './_data/articles'
import { ArticleCard } from './_components/ArticleCard'
import './blog.css'

/* ============================================================
   /social-media/blog
   Lista de artigos pré-escritos para copiar p/ o blog.
   Server component que lê do catálogo estático em _data/articles.ts.
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
          Artigos prontos a copiar. Cada um foi escrito em português europeu premium,
          parágrafos curtos, foco em casamentos · fotografia · vídeo. Click no cartão
          para expandir, depois copia título, texto ou tudo.
        </p>
        <div className="blg-stats">
          <div className="blg-stat">
            <span className="blg-stat-n">{ARTICLES.length}</span>
            <span className="blg-stat-l">Artigos prontos</span>
          </div>
          <div className="blg-stat">
            <span className="blg-stat-n">{ARTICLES.reduce((s, a) => s + a.readingMin, 0)}</span>
            <span className="blg-stat-l">Min de leitura</span>
          </div>
          <div className="blg-stat">
            <span className="blg-stat-n">5</span>
            <span className="blg-stat-l">Categorias</span>
          </div>
        </div>
      </header>

      {/* Lista de artigos */}
      <section className="blg-list">
        {ARTICLES.map((article, i) => (
          <ArticleCard key={article.id} article={article} idx={i + 1} />
        ))}
      </section>

      {/* Footer — pedido de mais conteúdo */}
      <footer className="blg-foot-cta">
        <p className="blg-foot-eyebrow">Quero mais</p>
        <h2 className="blg-foot-title">Mais artigos quando precisares</h2>
        <p className="blg-foot-desc">
          Pede no chat &mdash; <em>"mais 5 artigos"</em>, <em>"5 sobre fotografia de pormenores"</em>,
          <em>"versões mais curtas"</em> &mdash; e adiciono à lista. Podes especificar tom (premium /
          próximo / técnico), comprimento ou tema. Os textos ficam disponíveis aqui no momento
          seguinte.
        </p>
      </footer>
    </main>
  )
}
