'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { Projeto, BriefingItem } from '@/app/portal-media/_data/mockProject'
import AdminBar from './AdminBar'
import EditableField from './EditableField'

const DEFAULT_ITEMS: BriefingItem[] = [
  { label: 'Objetivos do Projeto', desc: '' },
]

interface Props { projeto: Projeto; isAdmin: boolean }

export default function BriefingClient({ projeto: initial, isAdmin }: Props) {
  const [projeto, setProjeto] = useState({
    ...initial,
    briefingItems: initial.briefingItems ?? DEFAULT_ITEMS,
  })
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await fetch(`/api/media-portal/${projeto.ref}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ briefingUrl: projeto.briefingUrl, briefingItems: projeto.briefingItems }),
      })
    } catch {}
    setSaving(false)
    setIsEditing(false)
  }

  const cancel = () => {
    setProjeto({ ...initial, briefingItems: initial.briefingItems ?? DEFAULT_ITEMS })
    setIsEditing(false)
  }

  const updateItem = (idx: number, field: keyof BriefingItem, value: string) =>
    setProjeto(p => ({
      ...p,
      briefingItems: (p.briefingItems ?? []).map((item, i) => i === idx ? { ...item, [field]: value } : item),
    }))

  const addItem = () =>
    setProjeto(p => ({
      ...p,
      briefingItems: [...(p.briefingItems ?? []), { label: 'Novo Item', desc: '' }],
    }))

  const removeItem = (idx: number) =>
    setProjeto(p => ({
      ...p,
      briefingItems: (p.briefingItems ?? []).filter((_, i) => i !== idx),
    }))

  const items = projeto.briefingItems ?? []

  return (
    <>
      <div className="relative z-10 max-w-3xl mx-auto px-6 sm:px-10 py-10">

        <Link href={`/portal-media/${projeto.ref}`}
          className="inline-flex items-center gap-2 text-sm tracking-[0.4em] text-white/25 hover:text-white/55 transition-colors uppercase mb-12 group">
          <span className="group-hover:-translate-x-1 transition-transform duration-200">‹</span>
          Portal {projeto.nome}
        </Link>

        <div className="mb-10">
          <p className="text-sm tracking-[0.6em] text-white/20 uppercase mb-2">RL Media · {projeto.nome}</p>
          <h1 className="text-3xl font-extralight tracking-[0.3em] text-white/80 uppercase">Briefing</h1>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-px w-12 bg-emerald-400/40" />
            <span className="text-sm tracking-[0.4em] text-emerald-400/60 uppercase">Concluído</span>
            <div className="h-px flex-1 bg-white/[0.04]" />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {items.map((item, i) => (
            <div key={i} className="border border-emerald-400/12 bg-emerald-400/[0.02] px-6 py-5">
              <div className="flex items-start gap-4">
                <span className="text-sm font-mono text-white/15 shrink-0 mt-0.5">{String(i + 1).padStart(2, '0')}</span>
                <div className="flex-1 min-w-0">
                  <EditableField
                    value={item.label}
                    isEditing={isEditing}
                    onChange={v => updateItem(i, 'label', v)}
                    className="text-sm tracking-[0.25em] text-white/55 uppercase font-medium mb-1.5 block"
                    placeholder="Título do item"
                  />
                  <EditableField
                    value={item.desc}
                    isEditing={isEditing}
                    onChange={v => updateItem(i, 'desc', v)}
                    className="text-sm text-white/30 leading-relaxed block"
                    placeholder="Descrição..."
                    multiline
                  />
                  {isEditing && (
                    <button onClick={() => removeItem(i)}
                      className="mt-2 text-sm tracking-[0.3em] text-red-400/50 hover:text-red-400/80 uppercase transition-colors">
                      — Remover
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {isEditing && (
          <button onClick={addItem}
            className="mt-3 w-full border border-dashed border-white/15 hover:border-white/30 bg-white/[0.01] hover:bg-white/[0.03] py-3
                       text-sm tracking-[0.4em] text-white/30 uppercase transition-colors">
            + Adicionar Item
          </button>
        )}

        {/* Briefing URL */}
        <div className="mt-6">
          {isEditing ? (
            <div>
              <p className="text-sm text-white/30 mb-1">URL do Briefing Completo</p>
              <EditableField
                value={projeto.briefingUrl ?? ''}
                isEditing={true}
                onChange={v => setProjeto(p => ({ ...p, briefingUrl: v }))}
                placeholder="https://..."
                className="text-sm text-white/50"
              />
            </div>
          ) : projeto.briefingUrl ? (
            <a href={projeto.briefingUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] px-6 py-4 transition-colors group">
              <span className="text-sm tracking-[0.3em] text-white/40 uppercase">Ver Briefing Completo</span>
              <span className="text-white/20 group-hover:text-white/50 transition-colors">↗</span>
            </a>
          ) : null}
        </div>
      </div>

      {isAdmin && (
        <AdminBar isEditing={isEditing} saving={saving}
          onToggle={() => setIsEditing(true)} onSave={save} onCancel={cancel} />
      )}
    </>
  )
}
