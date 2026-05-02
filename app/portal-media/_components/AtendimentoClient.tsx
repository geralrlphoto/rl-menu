'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { Projeto } from '@/app/portal-media/_data/mockProject'
import AdminBar from './AdminBar'
import EditableField from './EditableField'

interface Props { projeto: Projeto; isAdmin: boolean }

export default function AtendimentoClient({ projeto: initial, isAdmin }: Props) {
  const [projeto, setProjeto] = useState(initial)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await fetch(`/api/media-portal/${projeto.ref}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gestorNome: projeto.gestorNome,
          gestorEmail: projeto.gestorEmail,
          gestorTelefone: projeto.gestorTelefone,
        }),
      })
    } catch {}
    setSaving(false)
    setIsEditing(false)
  }

  const cancel = () => { setProjeto(initial); setIsEditing(false) }
  const set = (field: keyof Projeto, value: string) =>
    setProjeto(p => ({ ...p, [field]: value }))

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
          <h1 className="text-3xl font-extralight tracking-[0.3em] text-white/80 uppercase">Atendimento</h1>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-px w-12 bg-white/25" />
            <div className="h-px flex-1 bg-white/[0.04]" />
          </div>
        </div>

        {/* Gestor de conta */}
        <div className="border border-white/[0.08] bg-white/[0.02] p-7 mb-4">
          <p className="text-sm tracking-[0.5em] text-white/20 uppercase mb-5">Gestor de Conta</p>
          <div className="flex items-center gap-5 mb-6">
            <div className="w-12 h-12 border border-white/10 flex items-center justify-center shrink-0"
              style={{ boxShadow: '0 0 20px rgba(180,200,255,0.06)' }}>
              <span className="text-lg text-white/20 select-none">◈</span>
            </div>
            <div className="flex-1">
              <EditableField
                value={projeto.gestorNome}
                isEditing={isEditing}
                onChange={v => set('gestorNome', v)}
                className="text-sm tracking-[0.2em] text-white/65 uppercase font-light block"
                placeholder="Nome do gestor"
              />
              <p className="text-sm tracking-[0.2em] text-white/25 mt-0.5">RL Media · Audiovisual</p>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {/* Email */}
            <div className={`flex items-center gap-4 border border-white/[0.06] px-5 py-3
              ${!isEditing ? 'bg-white/[0.01] hover:bg-white/[0.04] transition-colors' : 'bg-white/[0.02]'}`}>
              <span className="text-sm tracking-[0.4em] text-white/20 uppercase w-14 shrink-0">Email</span>
              {isEditing ? (
                <EditableField
                  value={projeto.gestorEmail}
                  isEditing={true}
                  onChange={v => set('gestorEmail', v)}
                  className="text-sm tracking-[0.15em] text-white/45"
                  placeholder="email@rlmedia.pt"
                  type="email"
                />
              ) : (
                <a href={`mailto:${projeto.gestorEmail}`}
                  className="text-sm tracking-[0.15em] text-white/45 hover:text-white/65 transition-colors flex-1">
                  {projeto.gestorEmail}
                </a>
              )}
              {!isEditing && <span className="ml-auto text-white/15">→</span>}
            </div>
            {/* Telefone */}
            <div className={`flex items-center gap-4 border border-white/[0.06] px-5 py-3
              ${!isEditing ? 'bg-white/[0.01] hover:bg-white/[0.04] transition-colors' : 'bg-white/[0.02]'}`}>
              <span className="text-sm tracking-[0.4em] text-white/20 uppercase w-14 shrink-0">Tel.</span>
              {isEditing ? (
                <EditableField
                  value={projeto.gestorTelefone}
                  isEditing={true}
                  onChange={v => set('gestorTelefone', v)}
                  className="text-sm tracking-[0.15em] text-white/45"
                  placeholder="+351 900 000 000"
                  type="tel"
                />
              ) : (
                <a href={`tel:${projeto.gestorTelefone}`}
                  className="text-sm tracking-[0.15em] text-white/45 hover:text-white/65 transition-colors flex-1">
                  {projeto.gestorTelefone}
                </a>
              )}
              {!isEditing && <span className="ml-auto text-white/15">→</span>}
            </div>
          </div>
        </div>

        {/* Site */}
        <a href="https://www.rlmedia.pt" target="_blank" rel="noopener noreferrer"
          className="group flex items-center justify-between border border-white/[0.06] bg-white/[0.01] hover:bg-white/[0.04] hover:border-white/15 px-6 py-4 transition-all">
          <div>
            <p className="text-sm tracking-[0.3em] text-white/40 uppercase group-hover:text-white/60 transition-colors">RL Media · Audiovisual</p>
            <p className="text-sm tracking-[0.15em] text-white/20 mt-0.5">www.rlmedia.pt</p>
          </div>
          <span className="text-white/15 group-hover:text-white/40 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all">↗</span>
        </a>
      </div>

      {isAdmin && (
        <AdminBar isEditing={isEditing} saving={saving}
          onToggle={() => setIsEditing(true)} onSave={save} onCancel={cancel} />
      )}
    </>
  )
}
