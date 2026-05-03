'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { Projeto } from '@/app/portal-media/_data/mockProject'
import AdminBar from './AdminBar'
import EditableField from './EditableField'
import EditableSelect from './EditableSelect'
import HeroUploadBlock from './HeroUploadBlock'

const ESTADO_OPTIONS = [
  { value: 'pendente',   label: 'Pendente'    },
  { value: 'disponivel', label: 'Disponível'  },
]

interface Props { projeto: Projeto; isAdmin: boolean }

export default function EntregasClient({ projeto: initial, isAdmin }: Props) {
  const [projeto, setProjeto] = useState(initial)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [heroUrl, setHeroUrl] = useState(initial.entregasImageUrl ?? '')

  const save = async () => {
    setSaving(true)
    try {
      await fetch(`/api/media-portal/${projeto.ref}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entregas: projeto.entregas, entregasImageUrl: heroUrl }),
      })
    } catch {}
    setSaving(false)
    setIsEditing(false)
  }

  const cancel = () => { setProjeto(initial); setIsEditing(false) }

  const updateEntrega = (idx: number, field: string, value: string) =>
    setProjeto(p => ({
      ...p,
      entregas: p.entregas.map((e, i) => i === idx ? { ...e, [field]: value } : e),
    }))

  const addEntrega = () =>
    setProjeto(p => ({
      ...p,
      entregas: [...p.entregas, { titulo: 'Nova Entrega', formato: '', duracao: '', estado: 'pendente' as const }],
    }))

  const removeEntrega = (idx: number) =>
    setProjeto(p => ({ ...p, entregas: p.entregas.filter((_, i) => i !== idx) }))

  return (
    <>
      <HeroUploadBlock url={heroUrl} isEditing={isEditing} onChange={setHeroUrl} />
      <div className="relative z-10 max-w-3xl mx-auto px-6 sm:px-10 py-10">

        <Link href={`/portal-media/${projeto.ref}`}
          className="inline-flex items-center gap-2 text-sm tracking-[0.4em] text-white/25 hover:text-white/55 transition-colors uppercase mb-12 group">
          <span className="group-hover:-translate-x-1 transition-transform duration-200">‹</span>
          Portal {projeto.nome}
        </Link>

        <div className="mb-10">
          <p className="text-sm tracking-[0.6em] text-white/20 uppercase mb-2">RL Media · {projeto.nome}</p>
          <h1 className="text-3xl font-extralight tracking-[0.3em] text-white/80 uppercase">Entregas</h1>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-px w-12 bg-white/25" />
            <div className="h-px flex-1 bg-white/[0.04]" />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {projeto.entregas.map((e, i) => (
            <div key={i}
              className={`border px-6 py-5
                ${e.estado === 'disponivel' ? 'border-emerald-400/25 bg-emerald-400/5' : 'border-white/[0.06] bg-white/[0.015]'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <span className="text-sm font-mono text-white/15 mt-0.5 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                  <div className="flex-1 min-w-0">
                    <EditableField
                      value={e.titulo}
                      isEditing={isEditing}
                      onChange={v => updateEntrega(i, 'titulo', v)}
                      className="text-sm tracking-[0.25em] text-white/65 uppercase font-medium block"
                      placeholder="Título"
                    />
                    <div className="flex items-center gap-2 mt-1">
                      <EditableField
                        value={e.formato}
                        isEditing={isEditing}
                        onChange={v => updateEntrega(i, 'formato', v)}
                        className="text-sm tracking-[0.15em] text-white/25 block"
                        placeholder="Formato (ex: MP4 · 16:9 · 4K)"
                      />
                      {!isEditing && e.duracao && <span className="text-white/15">·</span>}
                      <EditableField
                        value={e.duracao}
                        isEditing={isEditing}
                        onChange={v => updateEntrega(i, 'duracao', v)}
                        className="text-sm tracking-[0.15em] text-white/25 block"
                        placeholder="Duração (ex: 2–3 min)"
                      />
                    </div>
                    {isEditing && (
                      <EditableField
                        value={e.linkUrl ?? ''}
                        isEditing={isEditing}
                        onChange={v => updateEntrega(i, 'linkUrl', v)}
                        className="text-sm text-white/30 block mt-2"
                        placeholder="URL de download (opcional)"
                      />
                    )}
                  </div>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-2">
                  {!isEditing ? (
                    e.estado === 'disponivel' && e.linkUrl ? (
                      <a href={e.linkUrl} target="_blank" rel="noopener noreferrer"
                        className="border border-white/20 bg-white/5 hover:bg-white/10 px-4 py-2 text-sm tracking-[0.3em] text-white/60 uppercase transition-colors">
                        Descarregar →
                      </a>
                    ) : (
                      <span className="text-sm tracking-[0.35em] text-white/20 uppercase">Pendente</span>
                    )
                  ) : (
                    <>
                      <EditableSelect
                        value={e.estado}
                        options={ESTADO_OPTIONS}
                        isEditing={isEditing}
                        onChange={v => updateEntrega(i, 'estado', v)}
                        className="text-sm tracking-[0.3em] text-white/50 uppercase"
                      />
                      <button onClick={() => removeEntrega(i)}
                        className="text-sm tracking-[0.3em] text-red-400/50 hover:text-red-400/80 uppercase transition-colors">
                        — Remover
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {isEditing && (
          <button onClick={addEntrega}
            className="mt-4 w-full border border-dashed border-white/15 hover:border-white/30 bg-white/[0.01] hover:bg-white/[0.03] py-3
                       text-sm tracking-[0.4em] text-white/30 uppercase transition-colors">
            + Adicionar Entrega
          </button>
        )}

        <div className="mt-8 border border-white/[0.05] bg-white/[0.01] px-5 py-4">
          <p className="text-sm tracking-[0.2em] text-white/20 leading-relaxed">
            Os ficheiros ficarão disponíveis após a aprovação da entrega final. Os links expiram 30 dias após disponibilização.
          </p>
        </div>
      </div>

      {isAdmin && (
        <AdminBar isEditing={isEditing} saving={saving}
          onToggle={() => setIsEditing(true)} onSave={save} onCancel={cancel} />
      )}
    </>
  )
}
