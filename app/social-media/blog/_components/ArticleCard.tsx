'use client'

import { useState } from 'react'
import type { Article } from '../_data/articles'

/* ============================================================
   ArticleCard — cartão expansível com copy-to-clipboard.
   Estado fechado: header com título + meta + botão "Ver / Copiar".
   Estado aberto: corpo completo + botão "Copiar TÍTULO+TEXTO".
   ============================================================ */

export function ArticleCard({ article, idx }: { article: Article; idx: number }) {
  const [open, setOpen] = useState(false)
  const [copiedTitle, setCopiedTitle] = useState(false)
  const [copiedBody, setCopiedBody] = useState(false)
  const [copiedAll, setCopiedAll] = useState(false)

  function copy(text: string, kind: 'title' | 'body' | 'all') {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return
    navigator.clipboard.writeText(text).then(() => {
      if (kind === 'title') { setCopiedTitle(true); setTimeout(() => setCopiedTitle(false), 1500) }
      if (kind === 'body')  { setCopiedBody(true);  setTimeout(() => setCopiedBody(false),  1500) }
      if (kind === 'all')   { setCopiedAll(true);   setTimeout(() => setCopiedAll(false),   1500) }
    }).catch(() => {/* fallback silencioso */})
  }

  const fullText = [
    article.title,
    article.subtitle ? `\n${article.subtitle}\n` : '',
    article.body,
    `\n\n— Palavras-chave SEO: ${article.keywords}`,
  ].join('\n')

  return (
    <article className="blg-card">
      {/* Header sempre visível */}
      <button
        type="button"
        className="blg-head"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <span className="blg-num">{String(idx).padStart(2, '0')}</span>
        <div className="blg-head-body">
          <p className="blg-meta">
            <span className="blg-cat">{article.category.replace(/-/g, ' ')}</span>
            <span className="blg-dot">·</span>
            <span className="blg-read">{article.readingMin} min</span>
          </p>
          <h2 className="blg-title">{article.title}</h2>
          {article.subtitle && <p className="blg-subtitle">{article.subtitle}</p>}
        </div>
        <span className={`blg-chev ${open ? 'is-open' : ''}`}>›</span>
      </button>

      {/* Painel expansível */}
      <div className={`blg-panel ${open ? 'is-open' : ''}`}>
        <div className="blg-panel-in">
          {/* Acções rápidas */}
          <div className="blg-actions">
            <button type="button" className="blg-btn" onClick={(e) => { e.stopPropagation(); copy(article.title, 'title') }}>
              {copiedTitle ? '✓ Título copiado' : 'Copiar título'}
            </button>
            <button type="button" className="blg-btn" onClick={(e) => { e.stopPropagation(); copy(article.body, 'body') }}>
              {copiedBody ? '✓ Texto copiado' : 'Copiar texto'}
            </button>
            <button type="button" className="blg-btn blg-btn--primary" onClick={(e) => { e.stopPropagation(); copy(fullText, 'all') }}>
              {copiedAll ? '✓ Tudo copiado' : 'Copiar tudo'}
            </button>
          </div>

          {/* Corpo do artigo (markdown light: **bold**) */}
          <div className="blg-body">
            {article.body.split('\n\n').map((para, i) => (
              <p key={i} dangerouslySetInnerHTML={{ __html: renderInline(para) }} />
            ))}
          </div>

          {/* Footer SEO */}
          <div className="blg-foot">
            <p className="blg-keywords">
              <span>SEO ·</span> {article.keywords}
            </p>
          </div>
        </div>
      </div>
    </article>
  )
}

/* Render mínimo: **bold** → <strong>, conversão segura */
function renderInline(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
}
