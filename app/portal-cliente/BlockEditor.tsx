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

function blocksToItems(blocks: Block[]): EditItem[] {
  return blocks.map((b) => {
    const isEditable = TEXT_TYPES.includes(b.type) || b.type === 'divider'
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
      rawBlock: isEditable ? undefined : b,
    }
  })
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

  function markDeleted(key: string) {
    setItems(prev => prev.map(it => it.key === key ? { ...it, isDeleted: true } : it))
  }

  async function handleSave() {
    setSaving(true)
    setSaveError('')
    try {
      for (const it of items) {
        if (it.rawBlock) continue
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

      {/* Blocks */}
      <div className="space-y-2">
        {visible.map((it) => {

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
              {/* Top row: type selector + delete */}
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

              {/* Content */}
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

              {/* Add below button */}
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
