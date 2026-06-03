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
      </header>

      {/* Lista de artigos OU empty state */}
      {ARTICLES.length > 0 ? (
        <section className="blg-list">
          {ARTICLES.map((article, i) => (
            <ArticleCard key={article.id} article={article} idx={i + 1} />
          ))}
        </section>
      ) : (
        <section className="blg-empty">
          <div className="blg-empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              <line x1="9" y1="9" x2="16" y2="9" />
              <line x1="9" y1="13" x2="16" y2="13" />
            </svg>
          </div>
          <p className="blg-empty-tag">Sem artigos ainda</p>
          <p className="blg-empty-text">
            Pede no chat &mdash; <em>"gera 5 artigos sobre fotografia"</em>,
            <em>"1 artigo sobre pormenores do dia"</em>, <em>"3 artigos curtos sobre vídeo"</em>
            &mdash; e eu acrescento-os aqui. Cada artigo fica pronto a copiar.
          </p>
        </section>
      )}

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
