'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { Projeto } from '@/app/portal-media/_data/mockProject'
import AdminBar from './AdminBar'
import EditableField from './EditableField'
import HeroUploadBlock from './HeroUploadBlock'

interface Props { projeto: Projeto; isAdmin: boolean }

export default function SatisfacaoClient({ projeto: initial, isAdmin }: Props) {
  const [projeto, setProjeto] = useState(initial)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [heroUrl, setHeroUrl] = useState(initial.satisfacaoImageUrl ?? '')

  const save = async () => {
    setSaving(true)
    try {
      await fetch(`/api/media-portal/${projeto.ref}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ satisfacaoUrl: projeto.satisfacaoUrl, satisfacaoImageUrl: heroUrl }),
      })
    } catch {}
    setSaving(false)
    setIsEditing(false)
  }

  const cancel = () => { setProjeto(initial); setIsEditing(false) }

  return (
    <>
      <HeroUploadBlock url={heroUrl} isEditing={isEditing} onChange={setHeroUrl} />
      <div className="relative z-10 max-w-3xl mx-auto px-6 sm:px-10 py-10">

        <Link href={`/portal-media/${projeto.ref}`}
          className="inline-flex items-center gap-2 text-[9px] tracking-[0.4em] text-white/25 hover:text-white/55 transition-colors uppercase mb-12 group">
          <span className="group-hover:-translate-x-1 transition-transform duration-200">‹</span>
          Portal {projeto.nome}
        </Link>

        <div className="mb-10">
          <p className="text-[8px] tracking-[0.6em] text-white/20 uppercase mb-2">RL Media · {projeto.nome}</p>
          <h1 className="text-3xl font-extralight tracking-[0.3em] text-white/80 uppercase">Satisfação</h1>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-px w-12 bg-white/25" />
            <div className="h-px flex-1 bg-white/[0.04]" />
          </div>
        </div>

        <div className="border border-white/[0.07] bg-white/[0.02] p-8 flex flex-col items-center text-center gap-6">
          <div className="w-14 h-14 border border-white/[0.08] flex items-center justify-center"
            style={{ boxShadow: '0 0 30px rgba(180,200,255,0.05)' }}>
            <span className="text-2xl text-white/15 select-none">◒</span>
          </div>
          <div>
            <p className="text-[9px] tracking-[0.3em] text-white/50 uppercase mb-2">Avaliação do Projeto</p>
            <p className="text-[13px] font-light text-white/25 leading-relaxed max-w-sm">
              No final do projeto pedimos que avalies a tua experiência com a RL Media.
              A tua opinião ajuda-nos a melhorar continuamente.
            </p>
          </div>

          {isEditing ? (
            <div className="w-full max-w-sm text-left">
              <p className="text-[12px] font-light text-white/30 mb-1">URL do formulário de satisfação (opcional)</p>
              <EditableField
                value={projeto.satisfacaoUrl ?? ''}
                isEditing={true}
                onChange={v => setProjeto(p => ({ ...p, satisfacaoUrl: v }))}
                placeholder="https://tally.so/r/pbKJry"
                className="text-[13px] font-light text-white/40"
              />
              <p className="text-[10px] text-white/20 mt-2">
                Deixa vazio para usar o link padrão (tally.so/r/pbKJry).
              </p>
            </div>
          ) : (
            <a
              href={projeto.satisfacaoUrl ?? 'https://tally.so/r/pbKJry'}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-white/30 bg-white/[0.04] hover:bg-white/[0.10] px-8 py-4
                         text-[9px] tracking-[0.5em] text-white/70 hover:text-white uppercase transition-all duration-200"
              style={{ boxShadow: '0 0 18px rgba(255,255,255,0.06)' }}
            >
              Dar Satisfação →
            </a>
          )}
        </div>
      </div>

      {isAdmin && (
        <AdminBar isEditing={isEditing} saving={saving}
          onToggle={() => setIsEditing(true)} onSave={save} onCancel={cancel} />
      )}
    </>
  )
}
