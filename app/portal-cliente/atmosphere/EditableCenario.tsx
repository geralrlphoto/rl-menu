'use client'

/* ============================================================
   EditableCenario — cenário (Cidade/Campo/Praia) editável
   directamente na página. Não depende do Notion.
   Persistência em portais.settings.pwCenarios[idx].
   ============================================================ */

import { useState, useRef } from 'react'

export type PwCenario = {
  num: string
  title: string
  titleAccent?: string
  paragraphs: string[]
  bullets: string[]
  outfit?: { noivo?: string; noiva?: string }
  dica?: string
}

export function EditableCenario(props: {
  cenario: PwCenario
  slotKey: string                          // ex: 'cen-0' para a foto
  photoUrl?: string | null
  isAdmin: boolean
  uploadingPhoto: boolean
  onSave?: (next: PwCenario) => void | Promise<void>
  onUploadPhoto?: (file: File) => void | Promise<void>
  onRemovePhoto?: () => void | Promise<void>
}) {
  const c = props.cenario
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(c.title ?? '')
  const [titleAccent, setTitleAccent] = useState(c.titleAccent ?? '')
  const [paragraphs, setParagraphs] = useState((c.paragraphs ?? []).join('\n\n'))
  const [bullets, setBullets] = useState((c.bullets ?? []).join('\n'))
  const [noivo, setNoivo] = useState(c.outfit?.noivo ?? '')
  const [noiva, setNoiva] = useState(c.outfit?.noiva ?? '')
  const [dica, setDica] = useState(c.dica ?? '')
  const fileRef = useRef<HTMLInputElement>(null)
  const lastSig = useRef('')

  const sig = JSON.stringify(c)
  if (lastSig.current !== sig && !editing) {
    lastSig.current = sig
    setTitle(c.title ?? '')
    setTitleAccent(c.titleAccent ?? '')
    setParagraphs((c.paragraphs ?? []).join('\n\n'))
    setBullets((c.bullets ?? []).join('\n'))
    setNoivo(c.outfit?.noivo ?? '')
    setNoiva(c.outfit?.noiva ?? '')
    setDica(c.dica ?? '')
  }

  const handleSave = async () => {
    if (!props.onSave) return
    const ps = paragraphs.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)
    const bs = bullets.split(/\n/).map(b => b.trim()).filter(Boolean)
    await props.onSave({
      num: c.num,
      title: title.trim() || c.title,
      titleAccent: titleAccent.trim() || undefined,
      paragraphs: ps,
      bullets: bs,
      outfit: (noivo.trim() || noiva.trim())
        ? { noivo: noivo.trim() || undefined, noiva: noiva.trim() || undefined }
        : undefined,
      dica: dica.trim() || undefined,
    })
    setEditing(false)
  }

  return (
    <section className="pw-cenario pw-editable">
      {props.isAdmin && !editing && props.onSave && (
        <div className="pw-custom-toolbar">
          <button type="button" className="tbtn" onClick={() => setEditing(true)} title="Editar cenário">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 19l1-4L16 5l3 3L9 18l-4 1Z" /><path d="M14 7l3 3" />
            </svg>
            Editar
          </button>
        </div>
      )}

      {!editing && (
        <>
          <div className="num">{c.num}</div>
          <h3>
            {c.titleAccent ? (
              <>{c.title.replace(c.titleAccent, '').trim()}{' '}
                <em>{c.titleAccent}</em></>
            ) : c.title}
          </h3>
          <hr className="gold-rule" />

          <div className="body">
            {c.paragraphs.map((p, j) => (
              <p key={j} dangerouslySetInnerHTML={{ __html: renderText(p) }} />
            ))}

            {c.bullets && c.bullets.length > 0 && (
              <ul className="cen-list">
                {c.bullets.map((b, j) => <li key={j}>{b}</li>)}
              </ul>
            )}

            {(c.outfit?.noivo || c.outfit?.noiva) && (
              <div className="pw-outfit">
                <div className="card">
                  <h4>Noivo</h4>
                  <p>{c.outfit.noivo ?? '—'}</p>
                </div>
                <div className="card">
                  <h4>Noiva</h4>
                  <p>{c.outfit.noiva ?? '—'}</p>
                </div>
              </div>
            )}

            {c.dica && (
              <div className="pw-dica">
                <span className="ic">✦</span>
                <div className="txt" dangerouslySetInnerHTML={{ __html: renderText(c.dica) }} />
              </div>
            )}
          </div>
        </>
      )}

      {editing && (
        <div className="pw-custom-edit">
          <label>
            <span>Título</span>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Na Cidade" />
          </label>
          <label>
            <span>Palavra em itálico dourado (ex: 'Cidade')</span>
            <input type="text" value={titleAccent} onChange={e => setTitleAccent(e.target.value)} placeholder="Cidade" />
          </label>
          <label>
            <span>Parágrafos (linha em branco separa; **negrito**)</span>
            <textarea value={paragraphs} onChange={e => setParagraphs(e.target.value)} rows={5} />
          </label>
          <label>
            <span>Lista de tópicos (um por linha)</span>
            <textarea value={bullets} onChange={e => setBullets(e.target.value)} rows={4} />
          </label>
          <label>
            <span>O que vestir — Noivo</span>
            <input type="text" value={noivo} onChange={e => setNoivo(e.target.value)} placeholder="Camisa de linho, calças leves..." />
          </label>
          <label>
            <span>O que vestir — Noiva</span>
            <input type="text" value={noiva} onChange={e => setNoiva(e.target.value)} placeholder="Vestido fluido, tons neutros..." />
          </label>
          <label>
            <span>Dica</span>
            <textarea value={dica} onChange={e => setDica(e.target.value)} rows={3} placeholder="Manhãs a meio da semana têm **menos tráfego**..." />
          </label>
          <div className="actions">
            <button type="button" className="btn ghost" onClick={() => setEditing(false)}>Cancelar</button>
            <button type="button" className="btn primary" onClick={handleSave}>Guardar</button>
          </div>
        </div>
      )}

      {/* Foto do cenário (managed in app via slot) */}
      {(props.isAdmin || props.photoUrl) && (
        <div className="pw-cenario-photo">
          {props.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={props.photoUrl} alt="" />
          ) : (
            <div className="ph" />
          )}
          {props.isAdmin && props.onUploadPhoto && (
            <div className="imgctrl">
              <label className="gbtn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8.5" cy="10" r="1.6" /><path d="M5 17l4.5-4 3 2.5L16 11l3 3" />
                </svg>
                {props.uploadingPhoto ? 'A carregar…' : props.photoUrl ? 'Trocar' : 'Adicionar'}
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                  disabled={props.uploadingPhoto}
                  onChange={e => {
                    const f = e.target.files?.[0]
                    if (f) props.onUploadPhoto?.(f)
                    e.currentTarget.value = ''
                  }} />
              </label>
              {props.photoUrl && props.onRemovePhoto && (
                <button type="button" className="gbtn danger" onClick={() => props.onRemovePhoto?.()}>
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

function renderText(t: string): string {
  return String(t ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')
}
