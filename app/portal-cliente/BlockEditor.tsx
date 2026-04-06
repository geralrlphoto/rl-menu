'use client'

import { useState, useRef, useEffect } from 'react'
import { NotionBlocks, plainText, type Block } from './NotionRenderer'

type EditItem = {
  key: string       // unique key (block id or 'new-N')
  id: string        // notion block id (empty for new)
  type: string
  text: string
  checked: boolean
  isNew: boolean
  isDeleted: boolean
  originalText: string
  originalChecked: boolean
  // non-editable blocks kept as-is
  rawBlock?: Block
}

const TEXT_TYPES = ['paragraph', 'heading_1', 'heading_2', 'heading_3', 'bulleted_list_item', 'numbered_list_item', 'to_do', 'quote', 'callout']
const TYPE_LABELS: Record<string, string> = {
  paragraph: 'Parágrafo',
  heading_1: 'Título 1',
  heading_2: 'Título 2',
  heading_3: 'Título 3',
  bulleted_list_item: 'Lista •',
  numbered_list_item: 'Lista 1.',
  to_do: 'Tarefa ✓',
  quote: 'Citação',
  callout: 'Aviso',
  divider: 'Separador',
}

function extractText(b: Block): string {
  const data = b[b.type] ?? {}
  if (b.type === 'divider') return ''
  return plainText(data.rich_text ?? [])
}

function blocksToItems(blocks: Block[]): EditItem[] {
  return blocks.map((b) => {
    const isText = TEXT_TYPES.includes(b.type) || b.type === 'divider'
    const text = extractText(b)
    const checked = b.to_do?.checked ?? false
    return {
      key: b.id,
      id: b.id,
      type: b.type,
      text,
      checked,
      isNew: false,
      isDeleted: false,
      originalText: text,
      originalChecked: checked,
      rawBlock: isText ? undefined : b,
    }
  })
}

let newCounter = 0
function newItem(): EditItem {
  const key = `new-${++newCounter}`
  return { key, id: '', type: 'paragraph', text: '', checked: false, isNew: true, isDeleted: false, originalText: '', originalChecked: false }
}

// Auto-resize textarea
function AutoTextarea({ value, onChange, className }: { value: string; onChange: (v: string) => void; className?: string }) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    if (ref.current) { ref.current.style.height = 'auto'; ref.current.style.height = ref.current.scrollHeight + 'px' }
  }, [value])
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={e => onChange(e.target.value)}
      rows={1}
      className={`w-full resize-none bg-transparent outline-none ${className}`}
    />
  )
}

function typeClass(type: string) {
  if (type === 'heading_1') return 'text-xl font-bold text-white'
  if (type === 'heading_2') return 'text-lg font-semibold text-white/90'
  if (type === 'heading_3') return 'text-base font-semibold text-white/80'
  if (type === 'quote') return 'text-sm italic text-white/50'
  if (type === 'callout') return 'text-sm font-semibold text-white/85'
  return 'text-sm text-white/60'
}

export default function BlockEditor({
  blocks,
  pageId,
  onSaved,
}: {
  blocks: Block[]
  pageId: string
  onSaved: () => void
}) {
  const [items, setItems] = useState<EditItem[]>(() => blocksToItems(blocks))
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

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

  function addAtEnd() {
    setItems(prev => [...prev, newItem()])
  }

  function markDeleted(key: string) {
    setItems(prev => prev.map(it => it.key === key ? { ...it, isDeleted: true } : it))
  }

  async function handleSave() {
    setSaving(true)
    setSaveError('')
    try {
      for (const it of items) {
        if (it.rawBlock) continue // non-editable, skip

        if (it.isDeleted && !it.isNew) {
          await fetch('/api/notion-block', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: it.id }) })
          continue
        }
        if (it.isDeleted && it.isNew) continue

        if (it.isNew) {
          await fetch('/api/notion-block', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ parentId: pageId, type: it.type, text: it.text, checked: it.checked }) })
          continue
        }

        const changed = it.text !== it.originalText || it.checked !== it.originalChecked
        if (changed) {
          await fetch('/api/notion-block', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: it.id, type: it.type, text: it.text, checked: it.checked }) })
        }
      }
      // bust cache
      await fetch(`/api/portais-clientes?id=${pageId}&bust=1`)
      onSaved()
    } catch (e: any) {
      setSaveError('Erro ao guardar. Tenta novamente.')
    } finally {
      setSaving(false)
    }
  }

  const visible = items.filter(it => !it.isDeleted)

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <span className="text-xs text-gold/60 tracking-widest uppercase mr-auto">Modo de edição</span>
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
          className="px-4 py-1.5 text-xs bg-gold/20 border border-gold/40 rounded-lg text-gold hover:bg-gold/30 transition-all disabled:opacity-50"
        >
          {saving ? 'A guardar...' : 'Guardar'}
        </button>
      </div>

      {/* Blocks */}
      <div className="space-y-1">
        {visible.map((it) => {
          // Non-editable block (image, table, child_page, etc.)
          if (it.rawBlock) {
            return (
              <div key={it.key} className="relative group">
                <div className="opacity-60 pointer-events-none">
                  <NotionBlocks blocks={[it.rawBlock]} />
                </div>
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-[10px] text-white/30 bg-black/60 px-2 py-0.5 rounded">
                  não editável
                </div>
              </div>
            )
          }

          return (
            <div key={it.key} className="group relative flex gap-2 items-start rounded-lg hover:bg-white/[0.03] px-2 py-1 transition-colors">
              {/* Type selector */}
              <select
                value={it.type}
                onChange={e => update(it.key, { type: e.target.value })}
                className="shrink-0 mt-0.5 text-[10px] bg-white/5 border border-white/10 rounded px-1 py-0.5 text-white/30 cursor-pointer focus:outline-none focus:border-gold/30 transition-colors"
              >
                {Object.entries(TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>

              {/* Checkbox for to_do */}
              {it.type === 'to_do' && (
                <button
                  onClick={() => update(it.key, { checked: !it.checked })}
                  className={`mt-1 shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${it.checked ? 'bg-gold/30 border-gold/50' : 'border-white/25'}`}
                >
                  {it.checked && <span className="text-gold text-[9px] font-bold">✓</span>}
                </button>
              )}

              {/* Divider preview */}
              {it.type === 'divider' ? (
                <div className="flex-1 border-t border-white/20 mt-2.5" />
              ) : (
                <AutoTextarea
                  value={it.text}
                  onChange={v => update(it.key, { text: v })}
                  className={`flex-1 leading-relaxed ${typeClass(it.type)} ${it.type === 'to_do' && it.checked ? 'line-through opacity-40' : ''}`}
                />
              )}

              {/* Actions */}
              <div className="shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
                <button
                  onClick={() => addAfter(it.key)}
                  title="Adicionar bloco abaixo"
                  className="w-5 h-5 flex items-center justify-center rounded text-white/30 hover:text-gold hover:bg-gold/10 transition-colors text-xs"
                >+</button>
                <button
                  onClick={() => markDeleted(it.key)}
                  title="Apagar bloco"
                  className="w-5 h-5 flex items-center justify-center rounded text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-colors text-xs"
                >×</button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add block at end */}
      <button
        onClick={addAtEnd}
        className="mt-4 w-full py-2 border border-dashed border-white/10 hover:border-gold/30 rounded-xl text-xs text-white/20 hover:text-gold/60 transition-all"
      >
        + Adicionar bloco
      </button>
    </div>
  )
}
