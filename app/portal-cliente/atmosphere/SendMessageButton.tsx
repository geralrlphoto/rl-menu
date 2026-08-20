'use client'

/* ============================================================
   SendMessageButton — botão "Enviar Mensagem" + modal
   para noivos enviarem uma tarefa/mensagem ao admin.
   Faz POST /api/noivos-message.
   ============================================================ */

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export function SendMessageButton({
  referencia,
  nomeNoivos,
  emailNoiva,
}: {
  referencia: string
  nomeNoivos?: string | null
  emailNoiva?: string | null
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" className="send-msg-btn" onClick={() => setOpen(true)}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 2L11 13" />
          <path d="M22 2l-7 20-4-9-9-4z" />
        </svg>
        Enviar Mensagem
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <SendMessageModal
          referencia={referencia}
          nomeNoivos={nomeNoivos}
          emailNoiva={emailNoiva}
          onClose={() => setOpen(false)}
        />,
        document.body
      )}

      <style jsx>{`
        .send-msg-btn {
          display: inline-flex; align-items: center; justify-content: center;
          gap: 12px;
          font-family: 'Hanken Grotesk', sans-serif;
          font-size: 12px; font-weight: 600; letter-spacing: .22em;
          text-transform: uppercase;
          color: #f3ede2;
          padding: 14px 30px; border-radius: 4px;
          border: 1px solid rgba(216,190,147,.45);
          background: transparent;
          cursor: pointer;
          transition: border-color .25s, color .25s, background .25s;
          margin: 22px 0 6px;
        }
        .send-msg-btn :global(svg) { stroke: #d8be93; transition: stroke .25s; }
        .send-msg-btn:hover {
          color: #fff;
          border-color: #d8be93;
          background: rgba(216,190,147,.06);
        }
        .send-msg-btn:hover :global(svg) { stroke: #d7bd87; }
      `}</style>
    </>
  )
}

function SendMessageModal({
  referencia, nomeNoivos, emailNoiva, onClose,
}: {
  referencia: string
  nomeNoivos?: string | null
  emailNoiva?: string | null
  onClose: () => void
}) {
  const [titulo, setTitulo]     = useState('')
  const [mensagem, setMensagem] = useState('')
  const [sending, setSending]   = useState(false)
  const [done, setDone]         = useState(false)
  const [err, setErr]           = useState<string | null>(null)
  const titRef = useRef<HTMLInputElement>(null)

  useEffect(() => { titRef.current?.focus() }, [])

  async function send() {
    const t = titulo.trim()
    const m = mensagem.trim()
    if (!t) { setErr('Escrevam um assunto antes de enviar.'); return }
    if (!m) { setErr('Escrevam uma mensagem antes de enviar.'); return }
    setSending(true); setErr(null)
    try {
      const res = await fetch('/api/noivos-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referencia, titulo: t, mensagem: m, nome_noivos: nomeNoivos, email_noiva: emailNoiva }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok || !j?.ok) {
        setErr(j?.error ?? 'Não foi possível enviar. Tentem novamente.')
        setSending(false)
        return
      }
      setDone(true)
      setSending(false)
      setTimeout(() => onClose(), 2200)
    } catch {
      setErr('Erro de ligação. Tentem novamente.')
      setSending(false)
    }
  }

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="x" onClick={onClose}>✕</button>

        {done ? (
          <div className="done">
            <div className="check">✓</div>
            <h3>Mensagem enviada</h3>
            <p>A nossa equipa irá responder em breve.</p>
          </div>
        ) : (
          <>
            <p className="eyebrow">Atendimento aos Noivos</p>
            <h3>Escreva-nos a vossa mensagem</h3>
            <p className="sub">Recebemos no mesmo dia útil. Podem usar este canal para pedir ajustes, partilhar ideias ou esclarecer dúvidas.</p>

            <label className="fld-lab">Assunto</label>
            <input
              ref={titRef}
              type="text"
              value={titulo}
              onChange={e => { setTitulo(e.target.value); setErr(null) }}
              placeholder="Ex.: Ajuste à proposta · Pedido de reunião"
              maxLength={120}
              disabled={sending}
            />

            <label className="fld-lab">Mensagem</label>
            <textarea
              value={mensagem}
              onChange={e => { setMensagem(e.target.value); setErr(null) }}
              placeholder="A vossa mensagem…"
              maxLength={2000}
              rows={6}
              disabled={sending}
            />
            <div className="count">{mensagem.length}/2000</div>

            {err && <p className="err">{err}</p>}

            <div className="actions">
              <button className="cancel" onClick={onClose} disabled={sending}>Cancelar</button>
              <button className="send" onClick={send} disabled={sending || !mensagem.trim()}>
                {sending ? 'A enviar…' : 'Enviar →'}
              </button>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .modal-bg {
          position: fixed; inset: 0; z-index: 9999;
          background: rgba(8,5,2,.75);
          backdrop-filter: blur(10px);
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
          animation: fadeIn .25s ease-out;
        }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        .modal {
          position: relative;
          width: 100%; max-width: 520px;
          border: 1px solid rgba(216,190,147,.30);
          border-radius: 22px;
          background: linear-gradient(180deg, #1e1812, #14110c);
          color: #f3ede2;
          padding: 36px 36px 30px;
          font-family: 'Hanken Grotesk', sans-serif;
          box-shadow: 0 60px 120px -40px rgba(0,0,0,.85);
          animation: slideUp .35s cubic-bezier(.2,.85,.25,1);
        }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
        .x {
          position: absolute; top: 14px; right: 14px;
          width: 32px; height: 32px; border-radius: 50%;
          border: 1px solid rgba(243,237,226,.15);
          background: transparent;
          color: rgba(243,237,226,.55);
          font-size: 14px; cursor: pointer;
          transition: .2s;
        }
        .x:hover { color: #fff; border-color: rgba(216,190,147,.6) }
        .eyebrow {
          font-size: 10px; letter-spacing: .42em; text-transform: uppercase;
          color: #d8be93; font-weight: 600; margin: 0 0 8px;
        }
        h3 {
          font-family: var(--fd); font-weight: 300;
          font-size: 30px; line-height: 1.15;
          color: #f3ede2; margin: 0 0 10px;
        }
        .sub {
          font-size: 13px; color: #8b877f; line-height: 1.65;
          margin: 0 0 22px;
        }
        .fld-lab {
          display: block;
          font-size: 10px; letter-spacing: .32em; text-transform: uppercase;
          color: #8b877f; font-weight: 600;
          margin: 0 0 8px;
        }
        input[type="text"] {
          width: 100%;
          padding: 12px 16px;
          background: rgba(0,0,0,.35);
          border: 1px solid rgba(216,190,147,.25);
          border-radius: 4px;
          color: #f3ede2;
          font-family: 'Hanken Grotesk', sans-serif;
          font-size: 14.5px; line-height: 1.5;
          outline: none;
          margin-bottom: 18px;
          transition: border-color .2s;
        }
        input[type="text"]:focus { border-color: #d8be93 }
        input[type="text"]:disabled { opacity: .5 }
        input[type="text"]::placeholder { color: #5d5a55 }
        textarea {
          width: 100%;
          padding: 16px 18px;
          background: rgba(0,0,0,.35);
          border: 1px solid rgba(216,190,147,.25);
          border-radius: 4px;
          color: #f3ede2;
          font-family: 'Hanken Grotesk', sans-serif;
          font-size: 15px; line-height: 1.7;
          resize: vertical; min-height: 130px;
          outline: none;
          transition: border-color .2s;
        }
        textarea:focus { border-color: #d8be93 }
        textarea:disabled { opacity: .5 }
        textarea::placeholder { color: #5d5a55 }
        .count {
          font-size: 11px; color: #5d5a55;
          text-align: right; margin-top: 6px;
          letter-spacing: .04em;
        }
        .err {
          margin: 12px 0 0;
          font-size: 12px; color: #d8a59b;
          padding: 8px 12px;
          background: rgba(216,165,155,.08);
          border: 1px solid rgba(216,165,155,.25);
          border-radius: 8px;
        }
        .actions {
          display: flex; justify-content: flex-end; gap: 10px;
          margin-top: 22px;
        }
        .cancel, .send {
          font-family: 'Hanken Grotesk', sans-serif;
          font-size: 12px; font-weight: 600; letter-spacing: .18em;
          text-transform: uppercase;
          padding: 11px 22px; border-radius: 999px;
          cursor: pointer; transition: .2s;
        }
        .cancel {
          color: #8b877f; background: transparent;
          border: 1px solid rgba(243,237,226,.1);
        }
        .cancel:hover { color: #f3ede2; border-color: rgba(243,237,226,.3) }
        .send {
          color: #0b0a08; border: 0;
          background: #d8be93;
          box-shadow: 0 8px 18px -6px rgba(216,190,147,.6);
        }
        .send:hover:not(:disabled) {
          background: #e4d3b3;
          transform: translateY(-1px);
        }
        .send:disabled { opacity: .4; cursor: not-allowed }
        .done {
          text-align: center;
          padding: 8px 0;
        }
        .done .check {
          width: 64px; height: 64px; margin: 0 auto 18px;
          border-radius: 50%;
          background: rgba(216,190,147,.12);
          border: 1.5px solid #d8be93;
          color: #d7bd87;
          font-size: 28px;
          display: flex; align-items: center; justify-content: center;
        }
        .done h3 { font-size: 26px; margin-bottom: 8px }
        .done p { font-size: 14px; color: #8b877f }

        @media (max-width: 560px) {
          .modal { padding: 28px 22px 24px }
          h3 { font-size: 24px }
        }
      `}</style>
    </div>
  )
}
