'use client'

/* ============================================================
   Enviar às noivas — card (layout bilhete) com o tema do artigo
   e botão para o ler no site. Vai para as noivas com email no
   contrato, em lotes diários de até 30 para não passar o limite
   de emails (/api/blog-enviar-noivas). Cada noiva recebe 1 vez.
   ============================================================ */

import { useEffect, useMemo, useState } from 'react'
import { buildCardBlogNoivas } from '@/lib/blogCardNoivas'

type Props = {
  id: string
  title: string
  subtitle?: string | null
  body: string
  onClose: () => void
  onEnviado?: () => void
}

export default function EnviarNoivas({ id, title, subtitle, body, onClose, onEnviado }: Props) {
  const html = useMemo(
    () => buildCardBlogNoivas({ title, subtitle, body }).replace(/\{\{CANCELAR\}\}/g, '#'),
    [title, subtitle, body],
  )
  const [estado, setEstado] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [sit, setSit] = useState<{ total: number; enviados: number; faltam: number; hoje: number; lote: number; abertos: number; cliques: number } | null>(null)

  async function carregar() {
    try {
      const r = await fetch(`/api/blog-enviar-noivas?article_id=${id}`, { cache: 'no-store' })
      const d = await r.json()
      if (d?.ok) setSit(d)
    } catch {/* */}
  }
  useEffect(() => { carregar() }, [id])

  async function enviar(teste: boolean) {
    const n = sit ? Math.min(sit.faltam, Math.max(0, sit.lote - sit.hoje)) : 0
    if (!teste && !confirm(`Enviar o card a ${n} noivas agora? As restantes ficam para os próximos dias.`)) return
    setBusy(true); setEstado(teste ? 'A enviar o teste…' : 'A enviar às noivas…')
    try {
      const r = await fetch('/api/blog-enviar-noivas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_id: id, teste }),
      })
      const d = await r.json().catch(() => ({}))
      if (d?.error) setEstado(`Erro: ${d.error}`)
      else if (teste) setEstado('✓ Teste enviado para geral.rlphoto@gmail.com')
      else { setEstado(`✓ Enviado a ${d.enviados} noivas.${d.faltam ? ` Faltam ${d.faltam}, que ficam para os próximos dias.` : ' Já todas receberam.'}`); carregar(); onEnviado?.() }
    } catch { setEstado('Erro de rede.') }
    setBusy(false)
  }

  const livresHoje = sit ? Math.max(0, sit.lote - sit.hoje) : 0
  const proximo = sit ? Math.min(sit.faltam, livresHoje) : 0

  return (
    <div className="ai-photos-box" style={{ marginTop: 14 }}>
      <p className="ai-photos-title">
        <span className="ai-photos-tag">Noivas</span>
        Card para enviar às noivas
      </p>
      <p className="ai-photos-hint">
        É isto que as noivas com email no contrato recebem. O botão leva ao artigo no site.
        {sit && <><br />Enviado a <strong>{sit.enviados}</strong> de <strong>{sit.total}</strong> noivas · faltam <strong>{sit.faltam}</strong>.
          Saem no máximo {sit.lote} cards por dia para não passar o limite de emails{sit.hoje ? ` (hoje já saíram ${sit.hoje})` : ''}.
          {sit.enviados > 0 && <><br />Abriram <strong>{sit.abertos}</strong> ({Math.round(100 * sit.abertos / sit.enviados)}%) · foram ler o artigo <strong>{sit.cliques}</strong> ({Math.round(100 * sit.cliques / sit.enviados)}%).</>}</>}
      </p>
      <iframe
        title="Card do email"
        srcDoc={html}
        sandbox=""
        style={{ width: '100%', height: 720, marginTop: 10, border: '1px solid rgba(200,168,102,0.25)', borderRadius: 4, background: '#0b0b0b' }}
      />
      <div className="ai-step-actions" style={{ marginTop: 12, flexWrap: 'wrap' }}>
        <button type="button" className="ai-btn-ghost" disabled={busy} onClick={() => enviar(true)}>✉ Enviar teste para mim</button>
        {sit && sit.faltam > 0 && (
          <button type="button" className="ai-btn-primary" disabled={busy || !proximo} onClick={() => enviar(false)}>
            {proximo ? `✉ Enviar a ${proximo} noivas hoje` : 'Próximo lote amanhã'}
          </button>
        )}
        <button type="button" className="ai-btn-ghost" onClick={onClose}>Fechar</button>
      </div>
      {estado && <p className="ai-photos-hint" style={{ marginTop: 10 }}>{estado}</p>}
    </div>
  )
}
