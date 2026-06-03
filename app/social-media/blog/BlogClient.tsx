'use client'

/* ============================================================
   BlogClient — UI principal do blog AI
   - Botão flutuante "agente" (boneco)
   - Modal com prompt editável + Gerar 3 temas + escolher + gerar artigo
   - Lista de artigos guardados (drafts + usados)
   - Marcar como utilizado / eliminar
   ============================================================ */

import { useEffect, useState } from 'react'
import { DEFAULT_SYSTEM_PROMPT } from './_data/system-prompt'

type Topic = {
  title: string
  angle: string
  category: string
  readingMin: number
}

type Article = {
  id: string
  title: string
  subtitle?: string | null
  body: string
  seo_keywords?: string | null
  category?: string | null
  reading_min?: number | null
  instagram_feed?: { caption?: string; hashtags?: string }
  instagram_stories?: Array<{ title: string; kind: string }>
  facebook_post?: string | null
  status: 'draft' | 'used'
  used_at?: string | null
  created_at: string
}

type GenArticle = {
  title: string
  subtitle: string
  body: string
  seoKeywords: string
  instagramFeed: { caption: string; hashtags: string }
  instagramStories: Array<{ title: string; kind: string }>
  facebookPost: string
}

const STORAGE_PROMPT_KEY = 'rl-blog-ai-system-prompt'

export default function BlogClient() {
  const [articles, setArticles] = useState<Article[]>([])
  const [showAgent, setShowAgent] = useState(false)
  const [setupHint, setSetupHint] = useState<string | null>(null)

  async function loadArticles() {
    try {
      const r = await fetch('/api/blog-articles', { cache: 'no-store' })
      const d = await r.json()
      setArticles(Array.isArray(d?.articles) ? d.articles : [])
      if (d?.setup) setSetupHint(d.setup)
    } catch {/* ignore */}
  }

  useEffect(() => { loadArticles() }, [])

  return (
    <>
      {/* Botão flutuante do agente */}
      <button
        type="button"
        className="ai-fab"
        onClick={() => setShowAgent(true)}
        title="Agente IA · Gerar conteúdo para o blog"
        aria-label="Abrir agente IA"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 22a8 8 0 0 1 16 0" />
        </svg>
        <span className="ai-fab-pulse" aria-hidden="true" />
      </button>

      {/* Lista de artigos guardados OU empty state */}
      {articles.length > 0 ? (
        <section className="blg-list">
          {articles.map((a, i) => (
            <SavedArticleCard
              key={a.id}
              article={a}
              idx={i + 1}
              onChange={loadArticles}
            />
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
            Clica no <strong>boneco dourado</strong> no canto inferior direito
            para chamar o agente IA. Ele dá-te 3 temas, escolhes um, e gera
            artigo + posts para Instagram e Facebook. Tu copias e usas.
          </p>
          {setupHint && (
            <p className="blg-empty-setup">
              <strong>Setup DB:</strong> {setupHint.slice(0, 200)}
            </p>
          )}
        </section>
      )}

      {/* Modal do agente */}
      {showAgent && (
        <AgentModal
          onClose={() => setShowAgent(false)}
          onSaved={() => { loadArticles() }}
        />
      )}
    </>
  )
}

/* ============================================================
   Modal — Agente IA
   ============================================================ */
function AgentModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [systemPrompt, setSystemPrompt] = useState<string>(DEFAULT_SYSTEM_PROMPT)
  const [showPrompt, setShowPrompt] = useState(false)

  const [topics, setTopics] = useState<Topic[]>([])
  const [loadingTopics, setLoadingTopics] = useState(false)
  const [chosen, setChosen] = useState<Topic | null>(null)

  const [article, setArticle] = useState<GenArticle | null>(null)
  const [loadingArticle, setLoadingArticle] = useState(false)

  const [savedId, setSavedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<'article' | 'instagram' | 'facebook'>('article')

  // Carrega prompt do localStorage se houver
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_PROMPT_KEY)
      if (stored && stored.length > 100) setSystemPrompt(stored)
    } catch {/* */}
  }, [])

  function savePromptLocally() {
    try { localStorage.setItem(STORAGE_PROMPT_KEY, systemPrompt) } catch {}
  }
  function resetPrompt() {
    setSystemPrompt(DEFAULT_SYSTEM_PROMPT)
    try { localStorage.removeItem(STORAGE_PROMPT_KEY) } catch {}
  }

  async function generateTopics() {
    setLoadingTopics(true)
    setError(null)
    setTopics([])
    setArticle(null)
    setChosen(null)
    try {
      const r = await fetch('/api/blog-ai/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemPrompt }),
      })
      const d = await r.json()
      if (!d.ok) {
        setError(d.setup ?? d.error ?? 'Erro a gerar temas')
      } else {
        setTopics(d.topics ?? [])
      }
    } catch (e: any) {
      setError(e?.message ?? 'Erro de rede')
    }
    setLoadingTopics(false)
  }

  async function generateArticle(topic: Topic) {
    setChosen(topic)
    setLoadingArticle(true)
    setError(null)
    setArticle(null)
    try {
      const r = await fetch('/api/blog-ai/article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemPrompt, topic }),
      })
      const d = await r.json()
      if (!d.ok) {
        setError(d.setup ?? d.error ?? 'Erro a gerar artigo')
      } else {
        setArticle(d.article)
      }
    } catch (e: any) {
      setError(e?.message ?? 'Erro de rede')
    }
    setLoadingArticle(false)
  }

  async function saveArticle() {
    if (!article) return
    setSaving(true)
    try {
      const r = await fetch('/api/blog-articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article: {
            ...article,
            category: chosen?.category,
            readingMin: chosen?.readingMin,
          },
        }),
      })
      const d = await r.json()
      if (d.ok) {
        setSavedId(d.article?.id ?? 'ok')
        onSaved()
      }
    } catch {/* */}
    setSaving(false)
  }

  function copyAll() {
    if (!article) return
    const parts = [
      `# ${article.title}`,
      article.subtitle ? `_${article.subtitle}_\n` : '',
      article.body,
      `\n---\n\n## Palavras-chave SEO\n${article.seoKeywords}`,
      `\n---\n\n## Instagram — Feed\n${article.instagramFeed?.caption}\n\n${article.instagramFeed?.hashtags}`,
      `\n---\n\n## Instagram — Stories\n${(article.instagramStories ?? []).map((s, i) => `${i + 1}. ${s.title} (${s.kind})`).join('\n')}`,
      `\n---\n\n## Facebook\n${article.facebookPost}`,
    ].join('\n')
    navigator.clipboard?.writeText(parts).catch(() => {})
  }

  function copyText(t: string) { navigator.clipboard?.writeText(t).catch(() => {}) }

  return (
    <div className="ai-backdrop" onClick={onClose}>
      <div className="ai-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="ai-header">
          <div>
            <p className="ai-eyebrow">Agente IA · Conteúdo Blog</p>
            <h2 className="ai-title">Gerar conteúdo</h2>
          </div>
          <button type="button" className="ai-close" onClick={onClose} aria-label="Fechar">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Prompt expansível */}
        <div className="ai-section">
          <button
            type="button"
            onClick={() => setShowPrompt(p => !p)}
            className="ai-row-btn"
          >
            <span className="ai-row-label">Prompt do agente (system)</span>
            <span className="ai-row-meta">{showPrompt ? '▾ Esconder' : '▸ Ver / Editar'}</span>
          </button>
          {showPrompt && (
            <div className="ai-prompt-edit">
              <textarea
                value={systemPrompt}
                onChange={e => setSystemPrompt(e.target.value)}
                rows={14}
                className="ai-textarea"
              />
              <div className="ai-prompt-actions">
                <button type="button" className="ai-btn-ghost" onClick={resetPrompt}>↻ Reset</button>
                <button type="button" className="ai-btn-ghost" onClick={savePromptLocally}>✓ Guardar este prompt</button>
              </div>
            </div>
          )}
        </div>

        {/* Acção principal — Gerar 3 temas */}
        <div className="ai-section">
          <button
            type="button"
            onClick={generateTopics}
            disabled={loadingTopics}
            className="ai-btn-primary"
          >
            {loadingTopics ? '⌛ A gerar 3 ideias…' : '✨ Gerar 3 ideias de artigo'}
          </button>
        </div>

        {/* Erro */}
        {error && <div className="ai-error">⚠ {error}</div>}

        {/* 3 ideias */}
        {topics.length > 0 && !article && (
          <div className="ai-section">
            <p className="ai-section-label">Escolhe 1 das 3</p>
            <div className="ai-topics">
              {topics.map((t, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => generateArticle(t)}
                  className={`ai-topic ${chosen?.title === t.title ? 'is-active' : ''}`}
                  disabled={loadingArticle}
                >
                  <span className="ai-topic-num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="ai-topic-body">
                    <span className="ai-topic-meta">{t.category} · {t.readingMin} min</span>
                    <span className="ai-topic-title">{t.title}</span>
                    <span className="ai-topic-angle">{t.angle}</span>
                  </span>
                  <span className="ai-topic-arrow">›</span>
                </button>
              ))}
            </div>
            {loadingArticle && <p className="ai-loading">⌛ A escrever o artigo… (15-30s)</p>}
          </div>
        )}

        {/* Artigo gerado */}
        {article && (
          <div className="ai-section ai-article">
            {/* Tabs */}
            <div className="ai-tabs">
              <button type="button" onClick={() => setView('article')} className={`ai-tab ${view === 'article' ? 'is-on' : ''}`}>Artigo</button>
              <button type="button" onClick={() => setView('instagram')} className={`ai-tab ${view === 'instagram' ? 'is-on' : ''}`}>Instagram</button>
              <button type="button" onClick={() => setView('facebook')} className={`ai-tab ${view === 'facebook' ? 'is-on' : ''}`}>Facebook</button>
            </div>

            {view === 'article' && (
              <div className="ai-article-view">
                <p className="ai-article-meta">{chosen?.category} · {chosen?.readingMin} min</p>
                <h3 className="ai-article-title">{article.title}</h3>
                {article.subtitle && <p className="ai-article-subtitle">{article.subtitle}</p>}
                <div className="ai-article-body">
                  {article.body.split('\n\n').map((p, i) => (
                    <p key={i} dangerouslySetInnerHTML={{ __html: inlineBold(p) }} />
                  ))}
                </div>
                <p className="ai-article-seo">
                  <strong>SEO:</strong> {article.seoKeywords}
                </p>
                <button type="button" className="ai-btn-ghost" onClick={() => copyText(article.body)}>
                  Copiar texto do artigo
                </button>
              </div>
            )}

            {view === 'instagram' && (
              <div className="ai-social-view">
                <p className="ai-social-label">Caption do Feed</p>
                <pre className="ai-social-text">{article.instagramFeed?.caption}</pre>
                <button type="button" className="ai-btn-ghost" onClick={() => copyText(article.instagramFeed?.caption ?? '')}>Copiar caption</button>

                <p className="ai-social-label">Hashtags</p>
                <pre className="ai-social-text">{article.instagramFeed?.hashtags}</pre>
                <button type="button" className="ai-btn-ghost" onClick={() => copyText(article.instagramFeed?.hashtags ?? '')}>Copiar hashtags</button>

                <p className="ai-social-label">Stories ({article.instagramStories?.length ?? 0})</p>
                <ol className="ai-stories">
                  {(article.instagramStories ?? []).map((s, i) => (
                    <li key={i}>
                      <span className="ai-story-kind">{s.kind}</span> {s.title}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {view === 'facebook' && (
              <div className="ai-social-view">
                <p className="ai-social-label">Post Facebook</p>
                <pre className="ai-social-text">{article.facebookPost}</pre>
                <button type="button" className="ai-btn-ghost" onClick={() => copyText(article.facebookPost ?? '')}>Copiar post</button>
              </div>
            )}

            {/* Footer */}
            <div className="ai-foot">
              <button type="button" className="ai-btn-ghost" onClick={copyAll}>Copiar tudo</button>
              <button type="button" onClick={saveArticle} disabled={saving || !!savedId} className="ai-btn-primary">
                {savedId ? '✓ Guardado no Blog' : saving ? 'A guardar…' : '✓ Guardar como Rascunho'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ============================================================
   Card de artigo guardado
   ============================================================ */
function SavedArticleCard({
  article, idx, onChange,
}: { article: Article; idx: number; onChange: () => void }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  async function setStatus(status: 'draft' | 'used') {
    setBusy(true)
    try {
      await fetch(`/api/blog-articles/${article.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      onChange()
    } catch {/* */}
    setBusy(false)
  }

  async function remove() {
    if (!confirm('Eliminar este artigo?')) return
    setBusy(true)
    try {
      await fetch(`/api/blog-articles/${article.id}`, { method: 'DELETE' })
      onChange()
    } catch {/* */}
    setBusy(false)
  }

  function copyText(t: string) { navigator.clipboard?.writeText(t).catch(() => {}) }

  const isUsed = article.status === 'used'

  return (
    <article className={`blg-card ${isUsed ? 'is-used' : ''}`}>
      <button type="button" className="blg-head" onClick={() => setOpen(o => !o)}>
        <span className="blg-num">{String(idx).padStart(2, '0')}</span>
        <div className="blg-head-body">
          <p className="blg-meta">
            <span className={`blg-status blg-status--${article.status}`}>
              {isUsed ? '✓ Utilizado' : '○ Rascunho'}
            </span>
            <span className="blg-dot">·</span>
            {article.category && <span className="blg-cat">{article.category.replace(/-/g, ' ')}</span>}
            {article.reading_min && <><span className="blg-dot">·</span><span className="blg-read">{article.reading_min} min</span></>}
          </p>
          <h2 className="blg-title">{article.title}</h2>
          {article.subtitle && <p className="blg-subtitle">{article.subtitle}</p>}
        </div>
        <span className={`blg-chev ${open ? 'is-open' : ''}`}>›</span>
      </button>

      <div className={`blg-panel ${open ? 'is-open' : ''}`}>
        <div className="blg-panel-in">
          {/* Acções */}
          <div className="blg-actions">
            <button type="button" className="blg-btn" onClick={(e) => { e.stopPropagation(); copyText(article.title) }}>Copiar título</button>
            <button type="button" className="blg-btn" onClick={(e) => { e.stopPropagation(); copyText(article.body) }}>Copiar texto</button>
            {article.instagram_feed?.caption && (
              <button type="button" className="blg-btn" onClick={(e) => { e.stopPropagation(); copyText(article.instagram_feed!.caption!) }}>Copiar Instagram</button>
            )}
            {article.facebook_post && (
              <button type="button" className="blg-btn" onClick={(e) => { e.stopPropagation(); copyText(article.facebook_post!) }}>Copiar Facebook</button>
            )}
            {!isUsed ? (
              <button type="button" className="blg-btn blg-btn--primary" disabled={busy} onClick={(e) => { e.stopPropagation(); setStatus('used') }}>
                ✓ Marcar como Utilizado
              </button>
            ) : (
              <button type="button" className="blg-btn" disabled={busy} onClick={(e) => { e.stopPropagation(); setStatus('draft') }}>
                ↻ Voltar a Rascunho
              </button>
            )}
            <button type="button" className="blg-btn blg-btn--danger" disabled={busy} onClick={(e) => { e.stopPropagation(); remove() }}>
              ✕ Eliminar
            </button>
          </div>

          {/* Body */}
          <div className="blg-body">
            {article.body.split('\n\n').map((p, i) => (
              <p key={i} dangerouslySetInnerHTML={{ __html: inlineBold(p) }} />
            ))}
          </div>

          {/* Social preview */}
          {(article.instagram_feed?.caption || article.facebook_post) && (
            <div className="blg-social">
              {article.instagram_feed?.caption && (
                <div>
                  <p className="blg-social-label">Instagram (Feed)</p>
                  <pre className="blg-social-text">{article.instagram_feed.caption}</pre>
                  {article.instagram_feed.hashtags && (
                    <p className="blg-social-hashtags">{article.instagram_feed.hashtags}</p>
                  )}
                </div>
              )}
              {article.facebook_post && (
                <div>
                  <p className="blg-social-label">Facebook</p>
                  <pre className="blg-social-text">{article.facebook_post}</pre>
                </div>
              )}
            </div>
          )}

          {article.seo_keywords && (
            <div className="blg-foot">
              <p className="blg-keywords"><span>SEO ·</span> {article.seo_keywords}</p>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

function inlineBold(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
}
