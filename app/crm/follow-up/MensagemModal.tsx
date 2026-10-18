'use client'

import { useEffect, useState } from 'react'
import type { Email, Mensagem } from '@/lib/jornada'

export type AlvoModal = { tipo: 'wa'; m: Mensagem } | { tipo: 'mail'; e: Email } | null

export function Copiar({ texto }: { texto: string }) {
  const [ok, setOk] = useState(false)
  return (
    <button type="button" className={`copiar${ok ? ' ok' : ''}`}
      onClick={async e => {
        e.stopPropagation()
        try { await navigator.clipboard.writeText(texto); setOk(true); setTimeout(() => setOk(false), 2000) } catch { /* sem clipboard */ }
      }}>
      {ok ? '✓ Copiado' : 'Copiar'}
    </button>
  )
}

const ROTULO = { crm: 'WhatsApp · botão no CRM', copiar: 'WhatsApp · copiar e enviar', nova: 'Mensagem nova · ainda sem botão' }

function comLinks(t: string) {
  return t.split(/(https?:\/\/[^\s]+)/g).map((p, i) => /^https?:\/\//.test(p) ? <span key={i} className="lnk">{p}</span> : p)
}

export default function MensagemModal({ alvo, onClose }: { alvo: AlvoModal; onClose: () => void }) {
  useEffect(() => {
    if (!alvo) return
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [alvo, onClose])

  if (!alvo) return null
  const titulo = alvo.tipo === 'wa' ? alvo.m.titulo : alvo.e.assunto
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="jr-mtitle" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={`mbox${alvo.tipo === 'wa' ? ' wab' : ''}`}>
        <div className="mhead">
          <div>
            <div className="ey">{alvo.tipo === 'wa' ? ROTULO[alvo.m.tipo] : 'Email ao cliente · exemplo com dados fictícios'}</div>
            <h3 id="jr-mtitle">{titulo}</h3>
          </div>
          <button type="button" className="x" onClick={onClose} aria-label="Fechar">×</button>
        </div>
        <div className="mbody">
          {alvo.tipo === 'wa' ? (
            <div className="wachat">
              <div className="bubble">{comLinks(alvo.m.texto)}<span className="tm">21:04 ✓✓</span></div>
            </div>
          ) : alvo.e.preview ? (
            <iframe title={alvo.e.assunto} src={`/api/jornada/email?k=${encodeURIComponent(alvo.e.preview)}`} sandbox="allow-same-origin" />
          ) : (
            <p className="mload">Ainda não há pré-visualização deste email. O HTML vive dentro da rota de envio e tem de passar para lib/ para aparecer aqui.</p>
          )}
        </div>
        {alvo.tipo === 'wa' && (
          <div className="mfoot">
            <span>{alvo.m.tipo === 'copiar' ? 'Substitui [nome], [data] e [hora] antes de enviar' : 'No CRM sai já com os nomes, as datas e os links da lead'}</span>
            <Copiar texto={alvo.m.texto} />
          </div>
        )}
      </div>
    </div>
  )
}
