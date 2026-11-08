'use client'

/* ============================================================
   Temas para escrever — o Rui escolhe os temas, o Claude escreve.
   Cada tema fica "Por escrever" até o Claude criar o artigo
   (pedido "blog" no chat ou tarefa agendada), que aparece em
   rascunho na lista abaixo, já com o código pronto.
   ============================================================ */

import { useEffect, useState } from 'react'

const LI: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
  padding: '8px 12px', border: '1px solid rgba(200,168,102,0.18)', borderRadius: 4,
}

type Tema = {
  id: string
  tema: string
  categoria: string | null
  status: 'pendente' | 'escrito'
  article_id?: string | null
  artigo?: { title: string } | null
  created_at: string
}

type Props = {
  themes: Array<{ key: string; label: string }>
  onChange?: () => void
}

export default function TemasFila({ themes }: Props) {
  const [temas, setTemas] = useState<Tema[]>([])
  const [texto, setTexto] = useState('')
  const [categoria, setCategoria] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function carregar() {
    try {
      const r = await fetch('/api/blog-temas', { cache: 'no-store' })
      const d = await r.json()
      setTemas(Array.isArray(d?.temas) ? d.temas : [])
    } catch {/* */}
  }
  useEffect(() => { carregar() }, [])

  async function adicionar(e?: React.FormEvent) {
    e?.preventDefault()
    const tema = texto.trim() || (categoria ? `Tema livre: ${themes.find(t => t.key === categoria)?.label ?? categoria}` : '')
    if (!tema) { setErro('Escreve o tema ou escolhe uma categoria.'); return }
    setBusy(true); setErro(null)
    try {
      const r = await fetch('/api/blog-temas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tema, categoria }),
      })
      const d = await r.json()
      if (!d?.ok) setErro(d?.error ?? 'Não foi possível guardar.')
      else { setTexto(''); setCategoria(null); setTemas(prev => [d.tema, ...prev]) }
    } catch { setErro('Erro de rede.') }
    setBusy(false)
  }

  async function remover(id: string) {
    setTemas(prev => prev.filter(t => t.id !== id))
    await fetch(`/api/blog-temas?id=${id}`, { method: 'DELETE' }).catch(() => {})
  }

  const pendentes = temas.filter(t => t.status === 'pendente')
  const escritos = temas.filter(t => t.status === 'escrito').slice(0, 5)
  const label = (k: string | null) => (k ? themes.find(t => t.key === k)?.label ?? k : null)

  return (
    <section className="ai-photos-box" style={{ marginBottom: 28 }}>
      <p className="ai-photos-title">
        <span className="ai-photos-tag">Temas</span>
        Temas para escrever
      </p>
      <p className="ai-photos-hint">
        Escolhe os temas e o Claude escreve os artigos. Cada um aparece aqui em baixo como rascunho, já com o código pronto para o site.
        Para escrever agora, diz <strong>“blog”</strong> no chat do Claude.
      </p>

      <form onSubmit={adicionar}>
        <div className="ai-step-actions" style={{ flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          {themes.map(t => (
            <button
              key={t.key}
              type="button"
              className={categoria === t.key ? 'ai-btn-primary' : 'ai-btn-ghost'}
              onClick={() => setCategoria(c => (c === t.key ? null : t.key))}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'stretch' }}>
          <input
            className="ai-photo-input"
            style={{ flex: 1, minWidth: 0 }}
            value={texto}
            onChange={e => setTexto(e.target.value)}
            placeholder="Ex.: porque é que o first look acalma os noivos (ou deixa vazio e escolhe só a categoria)"
            maxLength={300}
          />
          <button type="submit" className="ai-btn-primary" disabled={busy} style={{ flex: '0 0 auto', width: 'auto' }}>
            {busy ? 'A guardar…' : '+ Adicionar'}
          </button>
        </div>
        {erro && <p className="ai-photos-hint" style={{ color: '#e08a7a', marginTop: 8 }}>{erro}</p>}
      </form>

      {(pendentes.length > 0 || escritos.length > 0) && (
        <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0 0', display: 'grid', gap: 6 }}>
          {pendentes.map(t => (
            <li key={t.id} style={LI}>
              <span className="ai-photos-hint" style={{ margin: 0 }}>
                <span className="ai-photo-cover-tag" style={{ marginRight: 8 }}>Por escrever</span>
                {label(t.categoria) && <strong style={{ marginRight: 6 }}>{label(t.categoria)} ·</strong>}
                {t.tema}
              </span>
              <button type="button" className="ai-btn-ghost" onClick={() => remover(t.id)} aria-label="Remover tema">✕</button>
            </li>
          ))}
          {escritos.map(t => (
            <li key={t.id} style={LI}>
              <span className="ai-photos-hint" style={{ margin: 0 }}>
                <span style={{ opacity: 0.55 }}>✓ Escrito · {t.tema}</span>
                {t.artigo?.title && <> → <strong style={{ color: '#d8be93' }}>{t.artigo.title}</strong></>}
              </span>
              {t.article_id && (
                <a href={`#artigo-${t.article_id}`} className="ai-btn-ghost" style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}>Abrir artigo ↓</a>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
