'use client'

import { useState, useRef, useEffect } from 'react'
import { NotionBlocks, plainText, type Block } from './NotionRenderer'

type EditItem = {
  key: string
  id: string
  type: string
  text: string
  checked: boolean
  isNew: boolean
  isDeleted: boolean
  originalText: string
  originalChecked: boolean
  rawBlock?: Block
  // Image blocks extracted from column_list children
  imageUrl?: string
  originalImageUrl?: string
  // Merged text: extra block IDs to delete when text changes
  extraIds?: string[]
}

const TEXT_TYPES = ['paragraph', 'heading_1', 'heading_2', 'heading_3',
  'bulleted_list_item', 'numbered_list_item', 'to_do', 'quote', 'callout']

const TYPE_LABELS: Record<string, string> = {
  paragraph:           'Parágrafo',
  heading_1:           'Título 1',
  heading_2:           'Título 2',
  heading_3:           'Título 3',
  bulleted_list_item:  'Lista •',
  numbered_list_item:  'Lista 1.',
  to_do:               'Tarefa',
  quote:               'Citação',
  callout:             'Aviso',
  divider:             'Separador',
}

function extractText(b: Block): string {
  const data = b[b.type] ?? {}
  if (b.type === 'divider') return ''
  return plainText(data.rich_text ?? [])
}

function getImageUrl(b: Block): string {
  if (b.type !== 'image') return ''
  return b.image?.type === 'external'
    ? (b.image.external?.url ?? '')
    : (b.image?.file?.url ?? '')
}

function blocksToItems(blocks: Block[]): EditItem[] {
  const items: EditItem[] = []
  for (const b of blocks) {
    if (b.type === 'column_list') {
      // Separate images and text from all column children
      const colImages: EditItem[] = []
      const colTexts: Array<{ id: string; text: string }> = []

      for (const col of (b.children ?? []) as Block[]) {
        for (const child of (col.children ?? []) as Block[]) {
          if (child.type === 'image') {
            const url = getImageUrl(child)
            colImages.push({
              key: child.id,
              id: child.id,
              type: 'image',
              text: '',
              checked: false,
              isNew: false,
              isDeleted: false,
              originalText: '',
              originalChecked: false,
              imageUrl: url,
              originalImageUrl: url,
            })
          } else if (TEXT_TYPES.includes(child.type) || child.type === 'divider') {
            colTexts.push({ id: child.id, text: extractText(child) })
          } else {
            // Non-text, non-image → non-editable placeholder
            items.push({
              key: child.id,
              id: child.id,
              type: child.type,
              text: '',
              checked: false,
              isNew: false,
              isDeleted: false,
              originalText: '',
              originalChecked: false,
              rawBlock: child,
            })
          }
        }
      }

      // Images: each gets its own card
      items.push(...colImages)

      // Text: merge ALL column text into ONE editable area
      if (colTexts.length > 0) {
        const combined = colTexts.map(t => t.text).join('\n')
        items.push({
          key: colTexts[0].id,
          id: colTexts[0].id,
          type: 'paragraph',
          text: combined,
          checked: false,
          isNew: false,
          isDeleted: false,
          originalText: combined,
          originalChecked: false,
          extraIds: colTexts.slice(1).map(t => t.id),
        })
      }
    } else {
      const isEditable = TEXT_TYPES.includes(b.type) || b.type === 'divider'
      const text = extractText(b)
      const checked = b.to_do?.checked ?? false
      items.push({
        key: b.id,
        id: b.id,
        type: b.type,
        text,
        checked,
        isNew: false,
        isDeleted: false,
        originalText: text,
        originalChecked: checked,
        rawBlock: isEditable ? undefined : b,
      })
    }
  }
  return items
}

let newCounter = 0
function newItem(): EditItem {
  const key = `new-${++newCounter}`
  return { key, id: '', type: 'paragraph', text: '', checked: false, isNew: true, isDeleted: false, originalText: '', originalChecked: false }
}

function AutoTextarea({ value, onChange, placeholder, className }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto'
      ref.current.style.height = ref.current.scrollHeight + 'px'
    }
  }, [value])
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder || 'Escreve aqui...'}
      rows={1}
      className={`w-full resize-none bg-white/[0.04] border border-white/15 rounded-lg px-3 py-2 outline-none focus:border-gold/40 focus:bg-white/[0.07] transition-colors placeholder:text-white/20 ${className ?? ''}`}
    />
  )
}

function textClass(type: string) {
  if (type === 'heading_1') return 'text-xl font-bold text-white'
  if (type === 'heading_2') return 'text-lg font-semibold text-white/90'
  if (type === 'heading_3') return 'text-base font-semibold text-white/80'
  if (type === 'quote')     return 'text-sm italic text-white/50'
  if (type === 'callout')   return 'text-sm font-semibold text-white/85'
  return 'text-sm text-white/70'
}

// Recursively find all child_page blocks
function findNavPages(blocks: Block[]): Array<{ id: string; title: string }> {
  const pages: Array<{ id: string; title: string }> = []
  for (const b of blocks) {
    if (b.type === 'child_page') {
      pages.push({ id: b.id, title: b.child_page?.title ?? b.id })
    }
    if (b.children) pages.push(...findNavPages(b.children))
  }
  return pages
}

function uploadWithProgress(file: File, onProgress: (pct: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const fd = new FormData()
    fd.append('file', file)
    xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)) }
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText)
        if (data.url) resolve(data.url)
        else reject(new Error(data.error ?? 'Upload falhou'))
      } catch { reject(new Error('Resposta inválida')) }
    }
    xhr.onerror = () => reject(new Error('Erro de rede'))
    xhr.open('POST', '/api/upload-image')
    xhr.send(fd)
  })
}

export default function BlockEditor({
  blocks,
  pageId,
  settings,
  settingsBlockId,
  onSaved,
}: {
  blocks: Block[]
  pageId: string
  settings: { hiddenNav: string[] }
  settingsBlockId: string | null
  onSaved: () => void
}) {
  const [items, setItems] = useState<EditItem[]>(() => blocksToItems(blocks))
  const [hiddenNav, setHiddenNav] = useState<string[]>(settings.hiddenNav ?? [])
  const [currentSettingsBlockId, setCurrentSettingsBlockId] = useState(settingsBlockId)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [uploadingImages, setUploadingImages] = useState<Record<string, boolean>>({})

  const navPages = findNavPages(blocks)

  function update(key: string, patch: Partial<EditItem>) {
    setItems(prev => prev.map(it => it.key === key ? { ...it, ...patch } : it))
  }

  function addAfter(key: string) {
    setItems(prev => {
      const idx = prev.findIndex(it => it.key === key)
      const next = [...prev]
      next.splice(idx + 1, 0, newItem())
      return next
    })
  }

  function markDeleted(key: string) {
    setItems(prev => prev.map(it => it.key === key ? { ...it, isDeleted: true } : it))
  }

  function toggleNav(id: string) {
    setHiddenNav(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  async function handleUploadImage(key: string, file: File) {
    setUploadingImages(prev => ({ ...prev, [key]: true }))
    try {
      const url = await uploadWithProgress(file, () => {})
      setItems(prev => prev.map(it => it.key === key ? { ...it, imageUrl: url } : it))
    } catch {
      setSaveError('Erro ao carregar foto. Tenta novamente.')
    } finally {
      setUploadingImages(prev => ({ ...prev, [key]: false }))
    }
  }

  async function handleSave() {
    setSaving(true)
    setSaveError('')
    try {
      // Save content blocks
      for (const it of items) {
        if (it.rawBlock) continue

        if (it.isDeleted && !it.isNew) {
          await fetch('/api/notion-block', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: it.id }) })
          continue
        }
        if (it.isDeleted && it.isNew) continue

        // Image blocks from columns — PATCH if URL changed
        if (it.type === 'image') {
          if (!it.isNew && it.imageUrl && it.imageUrl !== it.originalImageUrl) {
            await fetch('/api/notion-block', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: it.id, type: 'image', imageUrl: it.imageUrl }),
            })
          }
          continue
        }

        if (it.isNew) {
          await fetch('/api/notion-block', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ parentId: pageId, type: it.type, text: it.text, checked: it.checked }) })
          continue
        }

        const changed = it.text !== it.originalText || it.checked !== it.originalChecked
        if (changed) {
          await fetch('/api/notion-block', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: it.id, type: it.type, text: it.text, checked: it.checked }) })
          // For merged column text: delete the now-redundant extra blocks
          if (it.extraIds && it.extraIds.length > 0) {
            await Promise.all(it.extraIds.map(eid =>
              fetch('/api/notion-block', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: eid }) })
            ))
          }
        }
      }
      // Save nav settings
      const navRes = await fetch('/api/portal-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId, settings: { hiddenNav }, settingsBlockId: currentSettingsBlockId }),
      }).then(r => r.json())
      if (navRes.settingsBlockId) setCurrentSettingsBlockId(navRes.settingsBlockId)

      await fetch(`/api/portais-clientes?id=${pageId}&bust=1`)
      onSaved()
    } catch {
      setSaveError('Erro ao guardar. Tenta novamente.')
    } finally {
      setSaving(false)
    }
  }

  const visible = items.filter(it => !it.isDeleted)

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gold/20 flex-wrap">
        <div className="flex items-center gap-2 mr-auto">
          <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
          <span className="text-xs text-gold/70 tracking-widest uppercase">A editar</span>
        </div>
        {saveError && <span className="text-xs text-red-400">{saveError}</span>}
        <button
          onClick={onSaved}
          className="px-3 py-1.5 text-xs border border-white/15 rounded-lg text-white/40 hover:text-white/70 transition-all"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-1.5 text-xs bg-gold/20 border border-gold/40 rounded-lg text-gold hover:bg-gold/30 transition-all disabled:opacity-50 font-medium"
        >
          {saving ? 'A guardar...' : '✓ Guardar'}
        </button>
      </div>

      {/* Navigation toggles */}
      {navPages.length > 0 && (
        <div className="mb-6 rounded-xl border border-white/10 overflow-hidden">
          <div className="px-4 py-2.5 bg-white/[0.03] border-b border-white/[0.06]">
            <span className="text-xs text-white/50 tracking-widest uppercase">Gerir Menu de Navegação</span>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {navPages.map(page => {
              const isHidden = hiddenNav.includes(page.id)
              return (
                <div key={page.id} className="flex items-center justify-between px-4 py-3">
                  <span className={`text-sm tracking-wide uppercase ${isHidden ? 'text-white/25 line-through' : 'text-white/70'}`}>
                    {page.title}
                  </span>
                  <button
                    onClick={() => toggleNav(page.id)}
                    className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${isHidden ? 'bg-white/10' : 'bg-gold/50'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${isHidden ? 'left-0.5' : 'left-5'}`} />
                  </button>
                </div>
              )
            })}
          </div>
          <div className="px-4 py-2 bg-white/[0.01]">
            <p className="text-[10px] text-white/25">Desactivar oculta o botão para o cliente. Guardar para aplicar.</p>
          </div>
        </div>
      )}

      {/* Blocks */}
      <div className="space-y-2">
        {visible.map((it) => {

          /* ── Image block from column ── */
          if (it.type === 'image') {
            const uploading = !!uploadingImages[it.key]
            return (
              <div key={it.key} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[9px] text-white/25 tracking-widest uppercase">📷 Fotografia</p>
                  <button
                    onClick={() => markDeleted(it.key)}
                    className="text-[9px] text-white/20 hover:text-red-400 transition-colors px-2 py-0.5 rounded hover:bg-red-400/10"
                  >
                    × eliminar
                  </button>
                </div>
                {it.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.imageUrl} alt="" className="w-full rounded-lg object-cover max-h-48 mb-3" />
                ) : (
                  <div className="h-16 bg-white/[0.03] rounded-lg mb-3 flex items-center justify-center">
                    <span className="text-white/20 text-xs">sem imagem</span>
                  </div>
                )}
                <label className={`flex items-center justify-center gap-2 py-2.5 w-full border border-dashed rounded-lg transition-all text-xs
                  ${uploading ? 'border-gold/30 text-gold/50 cursor-wait' : 'border-gold/20 text-gold/40 hover:border-gold/50 hover:text-gold hover:bg-gold/5 cursor-pointer'}`}>
                  {uploading ? '⏳ A carregar...' : '🔁 Trocar foto'}
                  <input type="file" accept="image/*" className="hidden" disabled={uploading}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadImage(it.key, f); e.target.value = '' }} />
                </label>
              </div>
            )
          }

          /* ── Merged text block from column ── */
          if (it.extraIds !== undefined) {
            return (
              <div key={it.key} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3">
                <p className="text-[9px] text-white/25 tracking-widest uppercase mb-2">✏️ Texto</p>
                <AutoTextarea
                  value={it.text}
                  onChange={v => update(it.key, { text: v })}
                  placeholder="Escreve aqui o texto..."
                  className="text-sm text-white/70"
                />
              </div>
            )
          }

          /* ── Non-editable block ── */
          if (it.rawBlock) {
            return (
              <div key={it.key} className="relative rounded-xl border border-dashed border-white/10 p-3 opacity-50">
                <div className="absolute top-1.5 right-2 text-[9px] text-white/30 uppercase tracking-widest bg-black/40 px-1.5 py-0.5 rounded">
                  imagem / tabela / link
                </div>
                <div className="pointer-events-none">
                  <NotionBlocks blocks={[it.rawBlock]} />
                </div>
              </div>
            )
          }

          /* ── Editable block ── */
          return (
            <div key={it.key} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3">
              <div className="flex items-center gap-2 mb-2">
                <select
                  value={it.type}
                  onChange={e => update(it.key, { type: e.target.value })}
                  className="text-[10px] bg-white/5 border border-white/10 rounded px-1.5 py-1 text-white/40 cursor-pointer focus:outline-none focus:border-gold/30 transition-colors"
                >
                  {Object.entries(TYPE_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
                <span className="flex-1" />
                <button
                  onClick={() => markDeleted(it.key)}
                  className="flex items-center gap-1 text-[10px] text-white/25 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-red-400/10"
                >
                  <span>×</span> apagar
                </button>
              </div>

              {it.type === 'divider' ? (
                <div className="border-t border-white/20 my-1" />
              ) : it.type === 'to_do' ? (
                <div className="flex gap-2 items-start">
                  <button
                    onClick={() => update(it.key, { checked: !it.checked })}
                    className={`mt-2 shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${it.checked ? 'bg-gold/30 border-gold/50' : 'border-white/25 hover:border-white/40'}`}
                  >
                    {it.checked && <span className="text-gold text-[9px] font-bold">✓</span>}
                  </button>
                  <AutoTextarea
                    value={it.text}
                    onChange={v => update(it.key, { text: v })}
                    className={`flex-1 ${textClass(it.type)} ${it.checked ? 'line-through opacity-40' : ''}`}
                  />
                </div>
              ) : (
                <AutoTextarea
                  value={it.text}
                  onChange={v => update(it.key, { text: v })}
                  className={`w-full ${textClass(it.type)}`}
                />
              )}

              <button
                onClick={() => addAfter(it.key)}
                className="mt-2 w-full py-1 text-[10px] text-white/20 hover:text-gold/50 hover:bg-gold/5 rounded transition-all border border-transparent hover:border-gold/10"
              >
                + adicionar bloco abaixo
              </button>
            </div>
          )
        })}
      </div>

      {/* Add block at end */}
      <button
        onClick={() => setItems(prev => [...prev, newItem()])}
        className="mt-3 w-full py-3 border border-dashed border-white/10 hover:border-gold/30 rounded-xl text-xs text-white/25 hover:text-gold/60 transition-all"
      >
        + Adicionar novo bloco
      </button>
    </div>
  )
}
