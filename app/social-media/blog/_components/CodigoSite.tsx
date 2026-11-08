'use client'

/* ============================================================
   Código para o site — o post sai logo pronto a colar na Hostinger
   (elemento de código incorporado). As fotos vêm do banco de fotos
   do site (escolha fixa por artigo) e podem ser trocadas.
   Usado no modal do agente e em cada rascunho guardado.
   ============================================================ */

import { useEffect, useMemo, useState } from 'react'
import { buildPostHtml } from '../_data/postHtml'
import { fotosParaArtigo } from '../_data/bancoFotos'

const STORAGE_NUM_KEY = 'rl-blog-ultimo-post'
const MAX_FOTOS = 9

type Props = {
  title: string
  subtitle?: string | null
  body: string
  category?: string | null
  readingMin?: number | null
}

export default function CodigoSite({ title, subtitle, body, category, readingMin }: Props) {
  const [urls, setUrls] = useState<string[]>(() => {
    const auto = fotosParaArtigo(title)
    return [...auto, ...Array(Math.max(0, 5 - auto.length)).fill('')]
  })
  const [coverIndex, setCoverIndex] = useState(0)
  const [num, setNum] = useState(36)
  const [trocar, setTrocar] = useState(false)
  const [preview, setPreview] = useState(false)
  const [copiado, setCopiado] = useState(false)

  // Número do post: o último copiado + 1 (os posts 34 e 35 já estão no site)
  useEffect(() => {
    try {
      const ultimo = Number(localStorage.getItem(STORAGE_NUM_KEY))
      if (ultimo >= 35) setNum(ultimo + 1)
    } catch {/* */}
  }, [])

  const html = useMemo(() => buildPostHtml({
    num,
    title,
    subtitle,
    body,
    category: category ?? '',
    readingMin: readingMin ?? 4,
    coverUrl: urls[coverIndex] ?? '',
    bodyUrls: urls.filter((_, i) => i !== coverIndex),
  }), [num, title, subtitle, body, category, readingMin, urls, coverIndex])

  async function copiar() {
    try {
      await navigator.clipboard.writeText(html)
      localStorage.setItem(STORAGE_NUM_KEY, String(num))
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {/* */}
  }

  return (
    <div className="ai-photos-box">
      <p className="ai-photos-title">
        <span className="ai-photos-tag">Site</span>
        Código pronto para o blog
      </p>
      <p className="ai-photos-hint">
        É só copiar e colar num elemento de código na Hostinger. Post n.º <strong>{num}</strong>, com fotos do site já escolhidas.
      </p>

      <div className="ai-step-actions" style={{ marginTop: 12, flexWrap: 'wrap' }}>
        <button type="button" className="ai-btn-primary" onClick={copiar}>
          {copiado ? '✓ Código copiado' : '📋 Copiar código'}
        </button>
        <button type="button" className="ai-btn-ghost" onClick={() => setPreview(p => !p)}>
          {preview ? '▾ Esconder' : '👁 Ver como fica'}
        </button>
        <button type="button" className="ai-btn-ghost" onClick={() => setTrocar(t => !t)}>
          {trocar ? '▾ Fechar fotos' : '🖼 Trocar fotos'}
        </button>
      </div>

      {trocar && (
        <>
          <p className="ai-photos-hint" style={{ marginTop: 14 }}>
            Cola links da Hostinger (<strong>assets.zyrosite.com</strong>) e marca a <strong>CAPA</strong> com ★.
            As restantes entram no artigo pela ordem. Linhas vazias não entram.
          </p>
          <div className="ai-photos-grid">
            {urls.map((u, i) => {
              const isCover = i === coverIndex
              return (
                <div key={i} className={`ai-photo-row ${isCover ? 'is-cover' : ''}`}>
                  <button
                    type="button"
                    className={`ai-photo-star ${isCover ? 'is-on' : ''}`}
                    onClick={() => setCoverIndex(i)}
                    title={isCover ? 'Esta é a CAPA' : 'Marcar como CAPA'}
                    aria-label={isCover ? 'Foto de capa' : 'Marcar como capa'}
                  >
                    {isCover ? '★' : '☆'}
                  </button>
                  <span className="ai-photo-num">
                    {String(i + 1).padStart(2, '0')}
                    {isCover && <span className="ai-photo-cover-tag">CAPA</span>}
                  </span>
                  <input
                    type="url"
                    inputMode="url"
                    placeholder="https://assets.zyrosite.com/…"
                    value={u}
                    onChange={e => setUrls(prev => prev.map((x, j) => (j === i ? e.target.value : x)))}
                    className="ai-photo-input"
                  />
                </div>
              )
            })}
          </div>
          <div className="ai-step-actions" style={{ marginTop: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            {urls.length < MAX_FOTOS && (
              <button type="button" className="ai-btn-ghost" onClick={() => setUrls(prev => [...prev, ''])}>+ Foto</button>
            )}
            <label className="ai-photos-hint" style={{ margin: 0, display: 'inline-flex', gap: 8, alignItems: 'center' }}>
              N.º do post
              <input
                type="number"
                min={1}
                value={num}
                onChange={e => setNum(Math.max(1, Number(e.target.value) || 1))}
                className="ai-photo-input"
                style={{ width: 72 }}
              />
            </label>
          </div>
        </>
      )}

      {preview && (
        <iframe
          title="Pré-visualização do post"
          srcDoc={`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;background:#0b0a08}</style></head><body>${html}</body></html>`}
          sandbox="allow-scripts"
          style={{ width: '100%', height: 640, marginTop: 14, border: '1px solid rgba(200,168,102,0.25)', borderRadius: 4, background: '#0b0a08' }}
        />
      )}
    </div>
  )
}
