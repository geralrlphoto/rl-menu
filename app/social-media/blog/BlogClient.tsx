'use client'

/* ============================================================
   BlogClient — UI principal do blog (modo grátis · copy-paste)

   FLUXO sem custos de API:
   1. Click no boneco → modal
   2. Modal mostra um PROMPT pronto a copiar para pedir 3 temas
      ao Claude no chat
   3. User cola a resposta JSON num textarea
   4. Parseia e mostra os 3 temas
   5. Click num tema → mostra PROMPT pronto a copiar para pedir
      o artigo completo
   6. User cola a resposta JSON
   7. Parseia → guarda como rascunho na DB
   ============================================================ */

import { useEffect, useState } from 'react'
import { DEFAULT_SYSTEM_PROMPT, TOPICS_USER_PROMPT, ARTICLE_USER_PROMPT_TEMPLATE } from './_data/system-prompt'
import { DEFAULT_VIDEO_SYSTEM_PROMPT } from './_data/video-prompt'
import CodigoSite from './_components/CodigoSite'
import TemasFila from './_components/TemasFila'
import EnviarNoivas from './_components/EnviarNoivas'

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
  subtitle?: string
  body: string
  seoKeywords: string
  instagramFeed: { caption: string; hashtags: string }
  instagramStories: Array<{ title: string; kind: string }>
  facebookPost: string
}

const STORAGE_PROMPT_KEY = 'rl-blog-ai-system-prompt'
const STORAGE_VIDEO_PROMPT_KEY = 'rl-blog-ai-video-prompt'

/** Temas pré-definidos para filtrar as 3 ideias geradas. */
const THEMES: Array<{ key: string; label: string; desc: string }> = [
  {
    key: 'casamentos',
    label: 'CASAMENTOS',
    desc: 'Tudo o que envolve casar: cerimónia, copo-de-água, tradições, organização do dia, momentos chave do casamento.',
  },
  {
    key: 'dicas',
    label: 'DICAS',
    desc: 'Conselhos práticos e accionáveis para os noivos: como escolher fornecedores, etiqueta, gestão de tempo, evitar erros comuns.',
  },
  {
    key: 'bastidores',
    label: 'BASTIDORES',
    desc: 'Vida de estúdio, processos de trabalho, decisões de produção, equipamento sem ser nerd, histórias reais (anonimizadas).',
  },
  {
    key: 'fotografia',
    label: 'FOTOGRAFIA',
    desc: 'Foco específico em fotografia de casamento: luz, lentes, composição, momentos a captar, retrato dos noivos, álbum final. Sem ser demasiado técnico para os noivos.',
  },
  {
    key: 'video',
    label: 'VÍDEO',
    desc: 'Foco específico em vídeo de casamento: narrativa, edição, escolha do videógrafo, diferenças entre registo e filme, som, música, entrega final.',
  },
  {
    key: 'inspiracao',
    label: 'INSPIRAÇÃO',
    desc: 'Mood, estética, referências visuais, ideias para o vosso dia, paletas, ambientes, exemplos com noivos reais.',
  },
]

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
        title="Pedir conteúdo ao Claude (grátis)"
        aria-label="Abrir agente IA"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 22a8 8 0 0 1 16 0" />
        </svg>
        <span className="ai-fab-pulse" aria-hidden="true" />
      </button>

      {/* Fila de temas: o Rui escolhe, o Claude escreve */}
      <TemasFila themes={THEMES} />

      {/* Lista de artigos guardados OU empty state */}
      {articles.length > 0 ? (
        <section className="blg-list">
          {articles.map((a, i) => (
            <SavedArticleCard key={a.id} article={a} idx={i + 1} onChange={loadArticles} />
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
            Clica no <strong>boneco dourado</strong> no canto inferior direito.
            O sistema gera-te um prompt para pedires ao Claude no chat
            &mdash; copias, colas, ele responde, tu colas a resposta de volta
            e guarda-se aqui. Tudo de graça.
          </p>
          {setupHint && <p className="blg-empty-text" style={{ opacity: 0.6 }}>{setupHint}</p>}
        </section>
      )}

      {/* Modal */}
      {showAgent && (
        <AgentModal onClose={() => setShowAgent(false)} onSaved={loadArticles} />
      )}
    </>
  )
}

/* ============================================================
   Modal — modo copy-paste com o Claude no chat
   ============================================================ */
function AgentModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [systemPrompt, setSystemPrompt] = useState<string>(DEFAULT_SYSTEM_PROMPT)
  const [videoPrompt, setVideoPrompt] = useState<string>(DEFAULT_VIDEO_SYSTEM_PROMPT)
  const [showPrompt, setShowPrompt] = useState(false)
  const [showVideoPromptUI, setShowVideoPromptUI] = useState(false)
  const [showHowItWorks, setShowHowItWorks] = useState(false)

  type Step = 'idle' | 'topics-ask' | 'topics-paste' | 'topics-list' | 'article-ask' | 'article-paste' | 'article-view'
  const [step, setStep] = useState<Step>('idle')

  const [topics, setTopics] = useState<Topic[]>([])
  const [topicsPaste, setTopicsPaste] = useState('')
  const [topicsErr, setTopicsErr] = useState<string | null>(null)
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null)

  const [chosen, setChosen] = useState<Topic | null>(null)
  const [article, setArticle] = useState<GenArticle | null>(null)
  const [articlePaste, setArticlePaste] = useState('')
  const [articleErr, setArticleErr] = useState<string | null>(null)

  const [savedAs, setSavedAs] = useState<'draft' | 'used' | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState<string | null>(null)
  const [view, setView] = useState<'article' | 'instagram' | 'facebook'>('article')

  // Histórico de títulos já gerados (qualquer status) — para o Claude não repetir
  const [usedTitles, setUsedTitles] = useState<string[]>([])


  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_PROMPT_KEY)
      if (stored && stored.length > 100) setSystemPrompt(stored)
      const storedVideo = localStorage.getItem(STORAGE_VIDEO_PROMPT_KEY)
      if (storedVideo && storedVideo.length > 100) setVideoPrompt(storedVideo)
    } catch {/* */}
  }, [])

  // Carrega títulos já gerados (qualquer status) para o "não repetir"
  useEffect(() => {
    fetch('/api/blog-articles', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d?.articles)) {
          setUsedTitles(d.articles.map((a: any) => String(a.title ?? '')).filter(Boolean))
        }
      })
      .catch(() => {/* ignora */})
  }, [])

  function savePromptLocally() {
    try { localStorage.setItem(STORAGE_PROMPT_KEY, systemPrompt) } catch {}
  }
  function resetPrompt() {
    setSystemPrompt(DEFAULT_SYSTEM_PROMPT)
    try { localStorage.removeItem(STORAGE_PROMPT_KEY) } catch {}
  }
  function saveVideoPromptLocally() {
    try { localStorage.setItem(STORAGE_VIDEO_PROMPT_KEY, videoPrompt) } catch {}
  }
  function resetVideoPrompt() {
    setVideoPrompt(DEFAULT_VIDEO_SYSTEM_PROMPT)
    try { localStorage.removeItem(STORAGE_VIDEO_PROMPT_KEY) } catch {}
  }

  function copy(text: string) {
    navigator.clipboard?.writeText(text).catch(() => {})
  }

  // Prompts prontos a copiar
  const themeObj = THEMES.find(t => t.key === selectedTheme) ?? null
  // Se o tema seleccionado tem prompt dedicado (ex: VÍDEO), usa-o em vez do base.
  // O themeBlock também é omitido — o prompt dedicado já define o tema.
  const usingVideoPrompt = selectedTheme === 'video'
  const activeSystemPrompt = usingVideoPrompt ? videoPrompt : systemPrompt
  const themeBlock = !usingVideoPrompt && themeObj
    ? `\n\n# Tema obrigatório das 3 ideias\n\nAs 3 ideias têm de pertencer ao tema "${themeObj.label}".\nDefinição: ${themeObj.desc}\nNão saiam deste âmbito.\n`
    : ''
  const usedBlock = usedTitles.length > 0
    ? `\n\n# Ideias já geradas (histórico — NUNCA podes repetir nem reformular)\n\nEstes títulos já foram gerados anteriormente. As 3 novas ideias têm de ser TODAS distintas em tema, ângulo e formulação. Não basta mudar palavras: o ângulo central tem de ser diferente.\n\nHistórico:\n${usedTitles.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n\nSe o tema seleccionado já tem ideias no histórico, encontra ângulos NOVOS dentro desse tema (sub-tópicos não cobertos, perspectivas opostas, casos específicos não tratados).`
    : ''
  const topicsFullPrompt = `${activeSystemPrompt}${themeBlock}${usedBlock}\n\n---\n\n${TOPICS_USER_PROMPT}`
  const articleFullPrompt = chosen ? `${activeSystemPrompt}\n\n---\n\n${ARTICLE_USER_PROMPT_TEMPLATE
    .replace('{{TITLE}}', chosen.title)
    .replace('{{ANGLE}}', chosen.angle)
    .replace('{{CATEGORY}}', chosen.category)
    .replace('{{READING_MIN}}', String(chosen.readingMin))
    .replace('{{TARGET_WORDS}}', String(chosen.readingMin * 200))}` : ''

  function parseTopics() {
    setTopicsErr(null)
    const parsed = extractJson(topicsPaste)
    if (!parsed?.topics || !Array.isArray(parsed.topics)) {
      setTopicsErr('Não consegui ler o JSON. Verifica que colaste a resposta completa do Claude.')
      return
    }
    // Avisa se algum dos títulos já está no histórico (não bloqueia, só avisa)
    const usedLower = new Set(usedTitles.map(t => t.toLowerCase().trim()))
    const repeated = (parsed.topics as Topic[]).filter(
      t => t?.title && usedLower.has(String(t.title).toLowerCase().trim()),
    )
    if (repeated.length) {
      setTopicsErr(
        `⚠ ${repeated.length} ${repeated.length === 1 ? 'tema repete' : 'temas repetem'} o histórico. ` +
        `Tens duas opções: continuar mesmo assim (escolhes um dos outros) ou voltar atrás e pedir novamente ao Claude.`,
      )
    }
    setTopics(parsed.topics)
    setStep('topics-list')
  }
  function parseArticle() {
    setArticleErr(null)
    const parsed = extractJson(articlePaste)
    if (!parsed?.title || !parsed?.body) {
      setArticleErr('Não consegui ler o JSON. Verifica que colaste a resposta completa do Claude.')
      return
    }
    setArticle(parsed)
    setStep('article-view')
  }

  async function saveArticle(asUsed: boolean = false) {
    if (!article) return
    setSaving(true)
    setSaveErr(null)
    try {
      const r = await fetch('/api/blog-articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article: { ...article, category: chosen?.category, readingMin: chosen?.readingMin },
        }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d?.ok || !d?.article?.id) {
        const msg =
          d?.error ||
          d?.details ||
          (r.status === 404 ? 'Endpoint não encontrado' : `Falha (${r.status})`)
        setSaveErr(
          /relation .* does not exist|blog_articles/i.test(String(msg))
            ? 'A tabela blog_articles ainda não existe no Supabase. Vai ao SQL Editor e corre o script (na página inicial, debaixo do empty state).'
            : `Erro ao guardar: ${msg}`,
        )
        setSaving(false)
        return
      }
      if (asUsed) {
        await fetch(`/api/blog-articles/${d.article.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'used' }),
        })
      }
      setUsedTitles(prev =>
        prev.includes(article.title) ? prev : [...prev, article.title],
      )
      setSavedAs(asUsed ? 'used' : 'draft')
      onSaved()
    } catch (e: any) {
      setSaveErr(`Erro de rede: ${e?.message ?? 'desconhecido'}`)
    }
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

  function startOver() {
    setStep('idle')
    setTopics([]); setTopicsPaste(''); setTopicsErr(null)
    setChosen(null); setArticle(null); setArticlePaste(''); setArticleErr(null)
    setSavedAs(null); setView('article')
    setSelectedTheme(null)
  }


  return (
    <div className="ai-backdrop" onClick={onClose}>
      <div className="ai-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="ai-header">
          <div>
            <p className="ai-eyebrow">Agente · Conteúdo Blog (grátis)</p>
            <h2 className="ai-title">Pedir ao Claude</h2>
          </div>
          <button type="button" className="ai-close" onClick={onClose} aria-label="Fechar">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Como funciona (sempre visível no topo) */}
        <div className="ai-section">
          <button type="button" onClick={() => setShowHowItWorks(s => !s)} className="ai-row-btn">
            <span className="ai-row-label">💡 Como funciona (modo grátis)</span>
            <span className="ai-row-meta">{showHowItWorks ? '▾ Esconder' : '▸ Ver'}</span>
          </button>
          {showHowItWorks && (
            <div className="ai-howto">
              <p><strong>1.</strong> Click em <em>"Gerar prompt para 3 ideias"</em> &mdash; aparece um texto pronto a copiar.</p>
              <p><strong>2.</strong> Cola esse texto na nossa conversa de chat com o Claude.</p>
              <p><strong>3.</strong> O Claude responde com 3 ideias em JSON.</p>
              <p><strong>4.</strong> Copia a resposta dele e cola no campo abaixo. Click "Processar".</p>
              <p><strong>5.</strong> Aparecem 3 cartões. Escolhes um.</p>
              <p><strong>6.</strong> Repetes o mesmo para o artigo completo. Click "Guardar" → entra na lista.</p>
              <p className="ai-howto-note">💰 Zero custos. O Claude do chat é o mesmo que escreve.</p>
            </div>
          )}
        </div>

        {/* Prompt do sistema editável */}
        <div className="ai-section">
          <button type="button" onClick={() => setShowPrompt(p => !p)} className="ai-row-btn">
            <span className="ai-row-label">Prompt do sistema (regras do agente)</span>
            <span className="ai-row-meta">{showPrompt ? '▾ Esconder' : '▸ Ver / Editar'}</span>
          </button>
          {showPrompt && (
            <div className="ai-prompt-edit">
              <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} rows={14} className="ai-textarea" />
              <div className="ai-prompt-actions">
                <button type="button" className="ai-btn-ghost" onClick={resetPrompt}>↻ Reset</button>
                <button type="button" className="ai-btn-ghost" onClick={savePromptLocally}>✓ Guardar localmente</button>
              </div>
            </div>
          )}
        </div>

        {/* PASSO INICIAL */}
        {step === 'idle' && (
          <div className="ai-section">
            <p className="ai-section-label" style={{ marginBottom: 12 }}>
              Tema (opcional — afina as 3 ideias)
            </p>
            <div className="ai-themes-row">
              {THEMES.map((t) => {
                const on = selectedTheme === t.key
                return (
                  <button
                    key={t.key}
                    type="button"
                    className={`ai-theme-pill ${on ? 'is-on' : ''}`}
                    onClick={() => setSelectedTheme(on ? null : t.key)}
                    title={t.desc}
                  >
                    {t.label}
                  </button>
                )
              })}
            </div>
            {selectedTheme && (
              <p className="ai-photos-hint" style={{ marginTop: 8 }}>
                {usingVideoPrompt ? (
                  <>🎬 Tema VÍDEO seleccionado — vai usar o <strong>prompt dedicado de vídeo</strong> (regras específicas RL Photo Video).</>
                ) : (
                  <>As 3 ideias vão focar-se exclusivamente em <strong>{themeObj?.label}</strong>.</>
                )}
              </p>
            )}
            {usedTitles.length > 0 && (
              <p className="ai-photos-hint" style={{ marginTop: 8 }}>
                📚 <strong>{usedTitles.length}</strong> {usedTitles.length === 1 ? 'tema' : 'temas'} no histórico — o prompt instrui o Claude a não os repetir nem reformular.
              </p>
            )}

            {/* PROMPT VÍDEO — botão dedicado (só visível na linha porque o prompt
                é específico do tema VÍDEO) */}
            <div style={{ marginTop: 16 }}>
              <button
                type="button"
                onClick={() => setShowVideoPromptUI(s => !s)}
                className={`ai-row-btn ${usingVideoPrompt ? 'ai-row-btn--video-active' : ''}`}
              >
                <span className="ai-row-label">
                  📹 Prompt Vídeo {usingVideoPrompt && <span style={{ color: 'var(--gold, #c8a866)', marginLeft: 6 }}>· ACTIVO</span>}
                </span>
                <span className="ai-row-meta">{showVideoPromptUI ? '▾ Esconder' : '▸ Ver / Editar'}</span>
              </button>
              {showVideoPromptUI && (
                <div className="ai-prompt-edit">
                  <p className="ai-photos-hint" style={{ marginBottom: 8 }}>
                    Este prompt é usado quando a pill <strong>VÍDEO</strong> está seleccionada.
                    Editas, guardas localmente, e o agente passa a usar a tua versão.
                  </p>
                  <textarea
                    value={videoPrompt}
                    onChange={e => setVideoPrompt(e.target.value)}
                    rows={16}
                    className="ai-textarea"
                  />
                  <div className="ai-prompt-actions">
                    <button type="button" className="ai-btn-ghost" onClick={resetVideoPrompt}>↻ Reset ao default</button>
                    <button type="button" className="ai-btn-ghost" onClick={saveVideoPromptLocally}>✓ Guardar localmente</button>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setStep('topics-ask')}
              className="ai-btn-primary"
              style={{ marginTop: 14 }}
            >
              ✨ Gerar prompt para 3 ideias
            </button>
          </div>
        )}

        {/* PASSO 1 · prompt dos 3 temas pronto a copiar */}
        {step === 'topics-ask' && (
          <div className="ai-section">
            <p className="ai-section-label">Passo 1 · Copia este prompt e cola no chat</p>
            <textarea readOnly className="ai-textarea ai-prompt-show" value={topicsFullPrompt} rows={8} onFocus={e => e.currentTarget.select()} />
            <div className="ai-step-actions">
              <button type="button" className="ai-btn-ghost" onClick={() => copy(topicsFullPrompt)}>📋 Copiar prompt</button>
              <button type="button" className="ai-btn-primary" onClick={() => setStep('topics-paste')}>Já pedi → Próximo</button>
            </div>
          </div>
        )}

        {/* PASSO 2 · colar a resposta JSON */}
        {step === 'topics-paste' && (
          <div className="ai-section">
            <p className="ai-section-label">Passo 2 · Cola aqui a resposta JSON do Claude</p>
            <textarea
              className="ai-textarea"
              rows={8}
              value={topicsPaste}
              onChange={e => setTopicsPaste(e.target.value)}
              placeholder={`{\n  "topics": [\n    { "title": "...", "angle": "...", "category": "fotografia", "readingMin": 4 },\n    ...\n  ]\n}`}
            />
            {topicsErr && <div className="ai-error">⚠ {topicsErr}</div>}
            <div className="ai-step-actions">
              <button type="button" className="ai-btn-ghost" onClick={() => setStep('topics-ask')}>‹ Voltar</button>
              <button type="button" className="ai-btn-primary" onClick={parseTopics} disabled={!topicsPaste.trim()}>Processar →</button>
            </div>
          </div>
        )}

        {/* PASSO 3 · escolher um dos 3 */}
        {step === 'topics-list' && topics.length > 0 && (
          <div className="ai-section">
            <p className="ai-section-label">Passo 3 · Escolhe 1 das 3</p>
            <div className="ai-topics">
              {topics.map((t, i) => (
                <button key={i} type="button" onClick={() => { setChosen(t); setStep('article-ask') }} className="ai-topic">
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
            <div className="ai-step-actions">
              <button type="button" className="ai-btn-ghost" onClick={() => setStep('topics-paste')}>‹ Voltar a colar</button>
              <button
                type="button"
                className="ai-btn-primary"
                onClick={() => {
                  setTopics([])
                  setTopicsPaste('')
                  setTopicsErr(null)
                  setStep('topics-ask')
                }}
              >
                ✨ Outros 3 Temas
              </button>
              <button type="button" className="ai-btn-ghost" onClick={startOver}>↻ Recomeçar</button>
            </div>
          </div>
        )}

        {/* PASSO 4 · prompt do artigo pronto a copiar */}
        {step === 'article-ask' && chosen && (
          <div className="ai-section">
            <p className="ai-section-label">Passo 4 · Tema escolhido</p>
            <div className="ai-chosen">
              <p className="ai-chosen-meta">{chosen.category} · {chosen.readingMin} min</p>
              <p className="ai-chosen-title">{chosen.title}</p>
            </div>
            <p className="ai-section-label" style={{ marginTop: 18 }}>Copia este prompt e cola no chat</p>
            <textarea readOnly className="ai-textarea ai-prompt-show" value={articleFullPrompt} rows={8} onFocus={e => e.currentTarget.select()} />
            <div className="ai-step-actions">
              <button type="button" className="ai-btn-ghost" onClick={() => setStep('topics-list')}>‹ Outra escolha</button>
              <button type="button" className="ai-btn-ghost" onClick={() => copy(articleFullPrompt)}>📋 Copiar prompt</button>
              <button type="button" className="ai-btn-primary" onClick={() => setStep('article-paste')}>Já pedi → Próximo</button>
            </div>
          </div>
        )}

        {/* PASSO 5 · colar resposta do artigo */}
        {step === 'article-paste' && (
          <div className="ai-section">
            <p className="ai-section-label">Passo 5 · Cola aqui a resposta JSON do artigo</p>
            <textarea
              className="ai-textarea"
              rows={12}
              value={articlePaste}
              onChange={e => setArticlePaste(e.target.value)}
              placeholder='{ "title": "...", "body": "...", "seoKeywords": "...", "instagramFeed": { "caption": "...", "hashtags": "..." }, ... }'
            />
            {articleErr && <div className="ai-error">⚠ {articleErr}</div>}
            <div className="ai-step-actions">
              <button type="button" className="ai-btn-ghost" onClick={() => setStep('article-ask')}>‹ Voltar</button>
              <button type="button" className="ai-btn-primary" onClick={parseArticle} disabled={!articlePaste.trim()}>Processar →</button>
            </div>
          </div>
        )}

        {/* PASSO 6 · ver artigo + guardar */}
        {step === 'article-view' && article && (
          <div className="ai-section ai-article">
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
                  <BodyRenderer body={article.body} />
                </div>
                <p className="ai-article-seo"><strong>SEO:</strong> {article.seoKeywords}</p>
                <button type="button" className="ai-btn-ghost" onClick={() => copy(article.body)}>Copiar texto do artigo</button>

                <CodigoSite
                  title={article.title}
                  subtitle={article.subtitle}
                  body={article.body}
                  category={chosen?.category}
                  readingMin={chosen?.readingMin}
                />
              </div>
            )}

            {view === 'instagram' && (
              <div className="ai-social-view">
                <p className="ai-social-label">Caption do Feed</p>
                <pre className="ai-social-text">{article.instagramFeed?.caption}</pre>
                <button type="button" className="ai-btn-ghost" onClick={() => copy(article.instagramFeed?.caption ?? '')}>Copiar caption</button>
                <p className="ai-social-label">Hashtags</p>
                <pre className="ai-social-text">{article.instagramFeed?.hashtags}</pre>
                <button type="button" className="ai-btn-ghost" onClick={() => copy(article.instagramFeed?.hashtags ?? '')}>Copiar hashtags</button>
                <p className="ai-social-label">Stories ({article.instagramStories?.length ?? 0})</p>
                <ol className="ai-stories">
                  {(article.instagramStories ?? []).map((s, i) => (
                    <li key={i}><span className="ai-story-kind">{s.kind}</span> {s.title}</li>
                  ))}
                </ol>
              </div>
            )}

            {view === 'facebook' && (
              <div className="ai-social-view">
                <p className="ai-social-label">Post Facebook</p>
                <pre className="ai-social-text">{article.facebookPost}</pre>
                <button type="button" className="ai-btn-ghost" onClick={() => copy(article.facebookPost ?? '')}>Copiar post</button>
              </div>
            )}

            <div className="ai-foot ai-foot-3">
              <button type="button" className="ai-btn-ghost" onClick={copyAll}>Copiar tudo</button>
              <button
                type="button"
                onClick={() => saveArticle(false)}
                disabled={saving || !!savedAs}
                className="ai-btn-ghost"
              >
                {savedAs === 'draft' ? '✓ Em Rascunho' : saving && !savedAs ? 'A guardar…' : '✓ Guardar como Rascunho'}
              </button>
              <button
                type="button"
                onClick={() => saveArticle(true)}
                disabled={saving || !!savedAs}
                className="ai-btn-primary ai-btn-used"
              >
                {savedAs === 'used' ? '★ Tema no Histórico' : saving && !savedAs ? 'A guardar…' : '★ Tema Usado'}
              </button>
            </div>
            {savedAs && (
              <div className="ai-step-actions" style={{ marginTop: 12, justifyContent: 'space-between' }}>
                <p className="ai-photos-hint" style={{ margin: 0 }}>
                  {savedAs === 'used'
                    ? '✓ Este tema entrou no histórico. O Claude não o vai sugerir novamente.'
                    : '✓ Guardado como rascunho. Já consta no histórico para não ser repetido.'}
                </p>
                <button type="button" className="ai-btn-ghost" onClick={startOver}>↻ Gerar outro</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ============================================================
   Card de artigo guardado (mantido igual ao anterior)
   ============================================================ */
function SavedArticleCard({ article, idx, onChange }: { article: Article; idx: number; onChange: () => void }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [noivas, setNoivas] = useState(false)

  // "Abrir artigo ↓" na caixa de temas: #artigo-<id> abre e mostra este artigo
  useEffect(() => {
    function verHash() {
      if (window.location.hash === `#artigo-${article.id}`) {
        setOpen(true)
        setTimeout(() => document.getElementById(`artigo-${article.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
      }
    }
    verHash()
    window.addEventListener('hashchange', verHash)
    return () => window.removeEventListener('hashchange', verHash)
  }, [article.id])

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
    <article id={`artigo-${article.id}`} className={`blg-card ${isUsed ? 'is-used' : ''}`} style={{ scrollMarginTop: 80 }}>
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
          <div className="blg-actions">
            <button type="button" className="blg-btn" onClick={(e) => { e.stopPropagation(); copyText(article.title) }}>Copiar título</button>
            <button type="button" className="blg-btn" onClick={(e) => { e.stopPropagation(); copyText(article.body) }}>Copiar texto</button>
            {article.instagram_feed?.caption && (
              <button type="button" className="blg-btn" onClick={(e) => { e.stopPropagation(); copyText(article.instagram_feed!.caption!) }}>Copiar Instagram</button>
            )}
            {article.facebook_post && (
              <button type="button" className="blg-btn" onClick={(e) => { e.stopPropagation(); copyText(article.facebook_post!) }}>Copiar Facebook</button>
            )}
            <button type="button" className="blg-btn blg-btn--primary" onClick={(e) => { e.stopPropagation(); setNoivas(n => !n) }}>
              ✉ Enviar às noivas
            </button>
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

          {noivas && (
            <EnviarNoivas id={article.id} title={article.title} subtitle={article.subtitle} body={article.body} onClose={() => setNoivas(false)} onEnviado={onChange} />
          )}

          <CodigoSite
            title={article.title}
            subtitle={article.subtitle}
            body={article.body}
            category={article.category}
            readingMin={article.reading_min}
          />

          <div className="blg-body">
            <BodyRenderer body={article.body} />
          </div>

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

/* Util — extrair JSON tolerante */
function extractJson(text: string): any | null {
  if (!text) return null
  const t = text.trim()
  try { return JSON.parse(t) } catch {}
  const fenced = t.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (fenced?.[1]) {
    try { return JSON.parse(fenced[1]) } catch {}
  }
  const first = t.indexOf('{')
  const last = t.lastIndexOf('}')
  if (first >= 0 && last > first) {
    try { return JSON.parse(t.slice(first, last + 1)) } catch {}
  }
  return null
}

function inlineBold(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
}

/* Detecta marcadores de foto: [FOTO — TIPO: descrição]
 * Aceita também [FOTO - TIPO: descrição] (hífen normal) e [FOTO: descrição]. */
const PHOTO_RE = /^\[FOTO(?:\s*[—\-:]\s*([^:\]]+?))?\s*:\s*([^\]]+)\]\s*$/i

function parsePhotoMarker(p: string): { kind: string; desc: string } | null {
  const m = p.trim().match(PHOTO_RE)
  if (!m) return null
  const kind = (m[1] ?? 'foto').trim()
  const desc = m[2].trim()
  return { kind, desc }
}

/** Renderer do body — converte parágrafos normais em <p> e marcadores
 *  de foto em cartões dourados. Partilhado entre o modal e o saved card. */
function BodyRenderer({ body }: { body: string }) {
  const paras = body.split('\n\n')
  return (
    <>
      {paras.map((p, i) => {
        const photo = parsePhotoMarker(p)
        if (photo) {
          return (
            <div key={i} className="blg-photo-card" role="note" aria-label="Sugestão de fotografia">
              <span className="blg-photo-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </span>
              <span className="blg-photo-meta">{photo.kind}</span>
              <span className="blg-photo-desc">{photo.desc}</span>
            </div>
          )
        }
        return <p key={i} dangerouslySetInnerHTML={{ __html: inlineBold(p) }} />
      })}
    </>
  )
}
