'use client'

/* ============================================================
   CustomSections — editor inline de secções (texto + foto)
   directamente na página, sem entrar em modo de edição global.

   Cada secção tem:
   - eyebrow (label dourada)
   - title (com palavra em itálico via *asterisco*)
   - paragraphs (texto em várias linhas)
   - photoUrl (opcional, full-width abaixo do texto)

   Admin vê controlos sobre cada secção (Editar/Mover/Eliminar)
   e um botão "+ Nova secção" no fim para criar mais.
   ============================================================ */

import { useState, useRef } from 'react'

export type PwSection = {
  id: string
  eyebrow?: string
  title?: string                // pode conter *palavra* → <em>
  paragraphs?: string[]          // separados por linha em branco
  photoUrl?: string | null
}

export type CustomSectionsProps = {
  sections: PwSection[]
  isAdmin: boolean
  uploadingSlot?: string | null
  onChange: (next: PwSection[]) => void | Promise<void>
  onUploadPhoto: (slot: string, file: File) => void | Promise<void>
  onRemovePhoto: (slot: string) => void | Promise<void>
}

export function CustomSections(props: CustomSectionsProps) {
  const [editingId, setEditingId] = useState<string | null>(null)

  const updateOne = async (id: string, patch: Partial<PwSection>) => {
    const next = props.sections.map(s => s.id === id ? { ...s, ...patch } : s)
    await props.onChange(next)
  }

  const move = async (id: string, dir: -1 | 1) => {
    const i = props.sections.findIndex(s => s.id === id)
    if (i < 0) return
    const j = i + dir
    if (j < 0 || j >= props.sections.length) return
    const next = [...props.sections]
    ;[next[i], next[j]] = [next[j], next[i]]
    await props.onChange(next)
  }

  const remove = async (id: string) => {
    if (!confirm('Eliminar esta secção?')) return
    await props.onChange(props.sections.filter(s => s.id !== id))
  }

  const add = async () => {
    // ID estável: timestamp em milissegundos como string base36
    const newId = 'sec_' + Math.floor(performance.now() * 1000).toString(36) + Math.floor(Math.random() * 1e6).toString(36)
    const next: PwSection[] = [...props.sections, {
      id: newId,
      eyebrow: 'Nova Secção',
      title: 'Título *editorial*',
      paragraphs: ['Clica em Editar para alterar este texto.'],
    }]
    await props.onChange(next)
    setEditingId(newId)
  }

  return (
    <>
      {props.sections.map((s, idx) => (
        <SectionItem
          key={s.id}
          section={s}
          isAdmin={props.isAdmin}
          isEditing={editingId === s.id}
          isFirst={idx === 0}
          isLast={idx === props.sections.length - 1}
          uploading={props.uploadingSlot === `custom-${s.id}`}
          onEdit={() => setEditingId(s.id)}
          onCancelEdit={() => setEditingId(null)}
          onSave={async (patch) => { await updateOne(s.id, patch); setEditingId(null) }}
          onMoveUp={() => move(s.id, -1)}
          onMoveDown={() => move(s.id, 1)}
          onRemove={() => remove(s.id)}
          onUploadPhoto={(f) => props.onUploadPhoto(`custom-${s.id}`, f)}
          onRemovePhoto={() => props.onRemovePhoto(`custom-${s.id}`)}
        />
      ))}

      {props.isAdmin && (
        <button type="button" className="pw-custom-add" onClick={add}>
          <span className="plus">+</span>
          <span>Nova secção</span>
        </button>
      )}
    </>
  )
}

function SectionItem(props: {
  section: PwSection
  isAdmin: boolean
  isEditing: boolean
  isFirst: boolean
  isLast: boolean
  uploading: boolean
  onEdit: () => void
  onCancelEdit: () => void
  onSave: (patch: Partial<PwSection>) => void | Promise<void>
  onMoveUp: () => void
  onMoveDown: () => void
  onRemove: () => void
  onUploadPhoto: (file: File) => void | Promise<void>
  onRemovePhoto: () => void | Promise<void>
}) {
  const s = props.section
  const [eyebrow, setEyebrow] = useState(s.eyebrow ?? '')
  const [title, setTitle] = useState(s.title ?? '')
  const [text, setText] = useState((s.paragraphs ?? []).join('\n\n'))
  const fileRef = useRef<HTMLInputElement>(null)

  // Re-sincroniza forms se a secção for alterada externamente (ex: reorder)
  // sem perder o estado actual de edição
  const lastIdRef = useRef(s.id)
  if (lastIdRef.current !== s.id) {
    lastIdRef.current = s.id
    setEyebrow(s.eyebrow ?? '')
    setTitle(s.title ?? '')
    setText((s.paragraphs ?? []).join('\n\n'))
  }

  const handleSave = async () => {
    const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)
    await props.onSave({ eyebrow: eyebrow.trim() || undefined, title: title.trim() || undefined, paragraphs })
  }

  return (
    <section className="pw-custom">
      {/* Toolbar admin */}
      {props.isAdmin && !props.isEditing && (
        <div className="pw-custom-toolbar">
          <button type="button" className="tbtn" onClick={props.onEdit} title="Editar texto">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 19l1-4L16 5l3 3L9 18l-4 1Z" /><path d="M14 7l3 3" />
            </svg>
            Editar
          </button>
          <button type="button" className="tbtn" disabled={props.isFirst} onClick={props.onMoveUp} title="Mover para cima">↑</button>
          <button type="button" className="tbtn" disabled={props.isLast} onClick={props.onMoveDown} title="Mover para baixo">↓</button>
          <button type="button" className="tbtn danger" onClick={props.onRemove} title="Eliminar secção">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      )}

      {/* Display mode */}
      {!props.isEditing && (
        <div className="pw-custom-body">
          {s.eyebrow && <div className="eyebrow">{s.eyebrow}</div>}
          {s.title && <h2 dangerouslySetInnerHTML={{ __html: renderTitle(s.title) }} />}
          {(s.paragraphs ?? []).map((p, i) => (
            <p key={i} dangerouslySetInnerHTML={{ __html: renderText(p) }} />
          ))}
        </div>
      )}

      {/* Edit mode */}
      {props.isEditing && (
        <div className="pw-custom-edit">
          <label>
            <span>Eyebrow (label dourada — opcional)</span>
            <input type="text" value={eyebrow} onChange={e => setEyebrow(e.target.value)} placeholder="Ex: Pré-Wedding" />
          </label>
          <label>
            <span>Título (usa *palavra* para itálico dourado)</span>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Para que serve a *sessão*" />
          </label>
          <label>
            <span>Texto (separa parágrafos com uma linha em branco; **palavra** = destaque)</span>
            <textarea value={text} onChange={e => setText(e.target.value)} rows={8} />
          </label>
          <div className="actions">
            <button type="button" className="btn ghost" onClick={props.onCancelEdit}>Cancelar</button>
            <button type="button" className="btn primary" onClick={handleSave}>Guardar</button>
          </div>
        </div>
      )}

      {/* Foto (full-width, opcional) */}
      {(props.isAdmin || s.photoUrl) && (
        <div className="pw-custom-photo">
          {s.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.photoUrl} alt="" />
          ) : (
            <div className="ph" />
          )}
          {props.isAdmin && (
            <div className="imgctrl">
              <label className="gbtn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8.5" cy="10" r="1.6" /><path d="M5 17l4.5-4 3 2.5L16 11l3 3" />
                </svg>
                {props.uploading ? 'A carregar…' : s.photoUrl ? 'Trocar' : 'Adicionar foto'}
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                  disabled={props.uploading}
                  onChange={e => {
                    const f = e.target.files?.[0]
                    if (f) props.onUploadPhoto(f)
                    e.currentTarget.value = ''
                  }} />
              </label>
              {s.photoUrl && (
                <button type="button" className="gbtn danger" onClick={() => props.onRemovePhoto()}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                  Remover
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

/** *palavra* → <em>palavra</em> (itálico dourado) */
function renderTitle(t: string): string {
  const safe = escapeHtml(t)
  return safe.replace(/\*([^*]+)\*/g, '<em>$1</em>')
}

/** **palavra** → <strong> · *palavra* → <em> · \n → <br> */
function renderText(t: string): string {
  const safe = escapeHtml(t)
  return safe
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')
}

function escapeHtml(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
