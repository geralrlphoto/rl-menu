'use client'

/* ============================================================
   AtendimentoThread — histórico de mensagens dos noivos e
   respostas da RL, mostrado na página Atendimento do portal.
   Lê portais.settings.noivos_messages via /api/portais.
   ============================================================ */

import { useEffect, useState } from 'react'

type Resposta = { id: string; texto: string; ts: string }
type Msg = {
  id: string; titulo?: string | null; mensagem: string; ts?: string
  respostas?: Resposta[]
}

export function AtendimentoThread({ referencia }: { referencia: string }) {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancel = false
    fetch(`/api/portais?ref=${encodeURIComponent(referencia)}`)
      .then(r => r.json())
      .then(d => {
        if (cancel) return
        const lista = (d.portal?.settings?.noivos_messages ?? []) as Msg[]
        setMsgs([...lista].sort((a, b) => (b.ts ?? '').localeCompare(a.ts ?? '')))
      })
      .catch(() => {})
      .finally(() => { if (!cancel) setLoading(false) })
    return () => { cancel = true }
  }, [referencia])

  const fmt = (ts?: string) => {
    if (!ts) return ''
    try { return new Date(ts).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' }) }
    catch { return '' }
  }

  if (loading) return null
  if (msgs.length === 0) return null

  // Constrói uma lista linear de mensagens em ordem cronológica (chat).
  type ChatMsg = { id: string; from: 'vocs' | 'rl'; titulo?: string | null; texto: string; ts: string }
  const chat: ChatMsg[] = []
  for (const m of [...msgs].sort((a, b) => (a.ts || '').localeCompare(b.ts || ''))) {
    chat.push({ id: m.id, from: 'vocs', titulo: m.titulo, texto: m.mensagem, ts: m.ts ?? '' })
    for (const r of (m.respostas ?? [])) chat.push({ id: r.id, from: 'rl', texto: r.texto, ts: r.ts })
  }
  chat.sort((a, b) => (a.ts || '').localeCompare(b.ts || ''))

  return (
    <div className="atend-chat">
      <div className="chat-head">
        <span className="dot" /> Conversa · Atendimento
      </div>
      <div className="chat-body">
        {chat.map(c => (
          <div key={c.id} className={`row ${c.from}`}>
            <div className={`bubble ${c.from}`}>
              <div className="who">{c.from === 'vocs' ? 'Vocês' : 'RL Photo·Video'}</div>
              {c.titulo && <p className="tit">{c.titulo}</p>}
              <p className="txt">{c.texto}</p>
              <div className="when">{fmt(c.ts)}</div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .atend-chat {
          margin: 22px 0 6px; max-width: 100%; width: 100%;
          border: 1px solid rgba(200,168,102,.18); border-radius: 16px;
          background: rgba(0,0,0,.22); overflow: hidden;
        }
        .chat-head {
          display: flex; align-items: center; gap: 8px;
          padding: 11px 16px; border-bottom: 1px solid rgba(200,168,102,.14);
          font-family: 'Hanken Grotesk', sans-serif; font-size: 9px;
          letter-spacing: .38em; text-transform: uppercase; color: #c8a866; font-weight: 600;
          background: rgba(200,168,102,.04);
        }
        .chat-head .dot { width: 6px; height: 6px; border-radius: 50%; background: #84c896; box-shadow: 0 0 6px rgba(132,200,150,.8); }
        .chat-body {
          display: flex; flex-direction: column; gap: 5px;
          padding: 10px; max-height: 260px; overflow-y: auto;
        }
        .row { display: flex; }
        .row.vocs { justify-content: flex-end; }
        .row.rl   { justify-content: flex-start; }
        .bubble {
          max-width: 48%; padding: 4px 8px; border-radius: 8px;
          font-family: 'Hanken Grotesk', sans-serif;
        }
        .bubble.vocs {
          background: rgba(200,168,102,.14); border: 1px solid rgba(200,168,102,.25);
          border-bottom-right-radius: 2px;
        }
        .bubble.rl {
          background: rgba(40,60,45,.4); border: 1px solid rgba(120,200,140,.25);
          border-bottom-left-radius: 2px;
        }
        .who { font-size: 6px; letter-spacing: .15em; text-transform: uppercase; font-weight: 700; margin-bottom: 1px; }
        .bubble.vocs .who { color: #d7bd87; }
        .bubble.rl .who { color: #84c896; }
        .tit { margin: 0 0 1px; font-family: 'Cormorant Garamond', serif; font-size: 9.5px; color: #e9dcc2; }
        .txt { margin: 0; font-size: 8.5px; line-height: 1.3; color: #cfc6b6; white-space: pre-wrap; }
        .when { font-size: 6px; color: #7a6f5e; margin-top: 1px; text-align: right; }
      `}</style>
    </div>
  )
}
