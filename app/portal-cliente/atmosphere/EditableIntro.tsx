'use client'

/* ============================================================
   EditableIntro — secção introdutória editável directamente na
   página. Não depende do Notion. Persistência em
   portais.settings.pwIntro.
   ============================================================ */

import { useState, useRef } from 'react'

export type PwIntro = {
  eyebrow?: string
  title?: string                 // usa *palavra* → <em> dourado
  paragraphs: string[]
}

export function EditableIntro(props: {
  intro: PwIntro
  isAdmin: boolean
  onSave?: (next: PwIntro) => void | Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [eyebrow, setEyebrow] = useState(props.intro.eyebrow ?? '')
  const [title, setTitle] = useState(props.intro.title ?? '')
  const [text, setText] = useState((props.intro.paragraphs ?? []).join('\n\n'))
  const lastSig = useRef('')

  // Sincroniza form quando o intro muda externamente (ex: outro user)
  const sig = JSON.stringify(props.intro)
  if (lastSig.current !== sig && !editing) {
    lastSig.current = sig
    setEyebrow(props.intro.eyebrow ?? '')
    setTitle(props.intro.title ?? '')
    setText((props.intro.paragraphs ?? []).join('\n\n'))
  }

  const handleSave = async () => {
    if (!props.onSave) return
    const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)
    await props.onSave({
      eyebrow: eyebrow.trim() || undefined,
      title: title.trim() || undefined,
      paragraphs,
    })
    setEditing(false)
  }

  return (
    <section className="pw-intro pw-editable">
      {props.isAdmin && !editing && props.onSave && (
        <div className="pw-custom-toolbar">
          <button type="button" className="tbtn" onClick={() => setEditing(true)} title="Editar texto">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 19l1-4L16 5l3 3L9 18l-4 1Z" /><path d="M14 7l3 3" />
            </svg>
            Editar
          </button>
        </div>
      )}

      {!editing && (
        <div className="body">
          <div className="eyebrow">{props.intro.eyebrow || 'Pré-Wedding'}</div>
          <h2 dangerouslySetInnerHTML={{ __html: renderTitle(props.intro.title || 'Para que serve a *sessão*') }} />
          {(props.intro.paragraphs ?? []).map((p, i) => (
            <p key={i} dangerouslySetInnerHTML={{ __html: renderText(p) }} />
          ))}
        </div>
      )}

      {editing && (
        <div className="pw-custom-edit">
          <label>
            <span>Eyebrow (label dourada)</span>
            <input type="text" value={eyebrow} onChange={e => setEyebrow(e.target.value)} placeholder="Ex: Pré-Wedding" />
          </label>
          <label>
            <span>Título (usa *palavra* para itálico dourado)</span>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Para que serve a *sessão*" />
          </label>
          <label>
            <span>Texto (linha em branco separa parágrafos; **negrito** = destaque)</span>
            <textarea value={text} onChange={e => setText(e.target.value)} rows={10} />
          </label>
          <div className="actions">
            <button type="button" className="btn ghost" onClick={() => setEditing(false)}>Cancelar</button>
            <button type="button" className="btn primary" onClick={handleSave}>Guardar</button>
          </div>
        </div>
      )}
    </section>
  )
}

function renderTitle(t: string): string {
  return escapeHtml(t).replace(/\*([^*]+)\*/g, '<em>$1</em>')
}
function renderText(t: string): string {
  return escapeHtml(t)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')
}
function escapeHtml(s: string): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
