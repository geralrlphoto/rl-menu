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

  return (
    <div className="atend-thread">
      <div className="th-label">As Vossas Mensagens</div>
      {msgs.map(m => (
        <div key={m.id} className="th-item">
          <div className="th-bubble vocs">
            <div className="th-head">
              <span className="who">Vocês</span>
              <span className="when">{fmt(m.ts)}</span>
            </div>
            {m.titulo && <p className="th-tit">{m.titulo}</p>}
            <p className="th-txt">{m.mensagem}</p>
          </div>
          {(m.respostas ?? []).map(r => (
            <div key={r.id} className="th-bubble rl">
              <div className="th-head">
                <span className="who rl-who">RL Photo·Video</span>
                <span className="when">{fmt(r.ts)}</span>
              </div>
              <p className="th-txt">{r.texto}</p>
            </div>
          ))}
          {(m.respostas ?? []).length === 0 && (
            <p className="th-aguarda">A aguardar resposta da nossa equipa…</p>
          )}
        </div>
      ))}

      <style jsx>{`
        .atend-thread { margin: 30px 0 6px; display: flex; flex-direction: column; gap: 22px; }
        .th-label {
          font-family: 'Hanken Grotesk', sans-serif; font-size: 10px;
          letter-spacing: .42em; text-transform: uppercase; color: #c8a866; font-weight: 600;
        }
        .th-item { display: flex; flex-direction: column; gap: 10px; }
        .th-bubble {
          border-radius: 12px; padding: 14px 18px;
          border: 1px solid rgba(200,168,102,.18);
          background: rgba(0,0,0,.25);
        }
        .th-bubble.rl {
          border-left: 2px solid rgba(120,200,140,.5);
          background: rgba(40,60,45,.18);
          margin-left: 22px;
        }
        .th-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 6px; }
        .who { font-size: 10px; letter-spacing: .2em; text-transform: uppercase; color: #c8a866; font-weight: 600; }
        .rl-who { color: #84c896; }
        .when { font-size: 10px; color: #7a6f5e; }
        .th-tit { margin: 0 0 4px; font-family: 'Cormorant Garamond', serif; font-size: 17px; color: #e9dcc2; }
        .th-txt { margin: 0; font-size: 14px; line-height: 1.65; color: #c3b8a3; white-space: pre-wrap; }
        .th-aguarda { margin: 0 0 0 22px; font-size: 11px; font-style: italic; color: #6f6557; }
      `}</style>
    </div>
  )
}
