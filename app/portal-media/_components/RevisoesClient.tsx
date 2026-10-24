'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { Projeto } from '@/app/portal-media/_data/mockProject'
import AdminBar from './AdminBar'
import EditableField from './EditableField'
import HeroUploadBlock from './HeroUploadBlock'

interface Props { projeto: Projeto; isAdmin: boolean }

export default function RevisoesClient({ projeto: initial, isAdmin }: Props) {
  const [projeto, setProjeto] = useState(initial)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [heroUrl, setHeroUrl] = useState(initial.revisoesImageUrl ?? '')

  const save = async () => {
    setSaving(true)
    try {
      await fetch(`/api/media-portal/${projeto.ref}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revisoes: projeto.revisoes, revisoesImageUrl: heroUrl }),
      })
    } catch {}
    setSaving(false)
    setIsEditing(false)
  }

  const cancel = () => { setProjeto(initial); setHeroUrl(initial.revisoesImageUrl ?? ''); setIsEditing(false) }

  const setRevisoes = (field: 'usadas' | 'total', value: string) =>
    setProjeto(p => ({ ...p, revisoes: { ...p.revisoes, [field]: Number(value) || 0 } }))

  const { usadas, total } = projeto.revisoes
  const restantes = total - usadas
  const pct = total > 0 ? Math.min(100, Math.round((usadas / total) * 100)) : 0
  const excedidas = total > 0 && usadas > total

  const CARD = 'rounded-2xl border border-white/[0.1] bg-[#00141f]/70'
  const TILE = 'rounded-xl border border-white/[0.08] bg-[#0c2236]/70'
  const CAMPO = '!rounded-md !border-white/[0.12] !bg-[#00141f]/70 text-center focus:!border-[#2e6cf6]'

  return (
    <>
      <HeroUploadBlock url={heroUrl} isEditing={isEditing} onChange={setHeroUrl} />

      <div className="rlp relative z-10 max-w-3xl mx-auto px-4 sm:px-8 py-8 sm:py-12">

        <Link href={`/portal-media/${projeto.ref}`}
          className="rlp-m inline-flex items-center gap-2 text-[11px] text-white/45 hover:text-white/80 transition-colors mb-10 group">
          <span className="group-hover:-translate-x-1 transition-transform duration-200">‹</span>
          Portal {projeto.nome}
        </Link>

        <header className="mb-8">
          <p className="rlp-m traco text-[11px] text-[#5a8bff] mb-3">RL PROD · {projeto.nome}</p>
          <h1 className="rlp-t text-4xl sm:text-5xl text-white leading-none">Revisões</h1>
          <p className="mt-4 text-[15px] text-white/60 leading-relaxed max-w-xl">
            Acompanha as rondas de revisão incluídas no teu projeto.
          </p>
        </header>

        {/* Progresso */}
        <section className={`${CARD} px-5 sm:px-6 py-6 mb-6`}>
          <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
            <p className="rlp-t text-3xl sm:text-4xl text-white leading-none">
              {usadas} <span className="text-white/40">de {total}</span>
            </p>
            <p className={`rlp-m text-[10px] ${excedidas ? 'text-[#ff4747]' : 'text-white/50'}`}>
              {excedidas ? 'Limite de revisões ultrapassado' : `${total === 1 ? 'revisão usada' : 'revisões usadas'}`}
            </p>
          </div>
          <div className="h-2 w-full rounded-full bg-[#0c2236] overflow-hidden border border-white/[0.06]">
            <div className={`h-full rounded-full transition-all duration-500 ${excedidas ? 'bg-[#ff4747]' : 'bg-[#2e6cf6]'}`}
              style={{ width: `${excedidas ? 100 : pct}%` }} />
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-5">
            <div className={`${TILE} px-3 sm:px-4 py-4 text-center`}>
              <p className="rlp-m text-[9px] sm:text-[10px] text-white/45 mb-2">Incluídas</p>
              {isEditing ? (
                <EditableField value={String(total)} isEditing={true} type="number"
                  onChange={v => setRevisoes('total', v)} className={CAMPO} />
              ) : (
                <p className="rlp-t text-3xl text-white leading-none">{total}</p>
              )}
            </div>
            <div className={`${TILE} px-3 sm:px-4 py-4 text-center`}>
              <p className="rlp-m text-[9px] sm:text-[10px] text-white/45 mb-2">Usadas</p>
              {isEditing ? (
                <EditableField value={String(usadas)} isEditing={true} type="number"
                  onChange={v => setRevisoes('usadas', v)} className={CAMPO} />
              ) : (
                <p className="rlp-t text-3xl text-[#5a8bff] leading-none">{usadas}</p>
              )}
            </div>
            <div className={`${TILE} px-3 sm:px-4 py-4 text-center`}>
              <p className="rlp-m text-[9px] sm:text-[10px] text-white/45 mb-2">Restantes</p>
              <p className={`rlp-t text-3xl leading-none ${restantes < 0 ? 'text-[#ff4747]' : 'text-white'}`}>{restantes}</p>
            </div>
          </div>
        </section>

        {/* Rondas */}
        {total === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/[0.14] bg-[#00141f]/50 px-6 py-12 text-center mb-6">
            <p className="rlp-t text-2xl text-white/80 mb-2">Sem revisões incluídas</p>
            <p className="text-[15px] text-white/50 max-w-sm mx-auto leading-relaxed">
              Este projeto não tem rondas de revisão definidas. Fala connosco se precisares de ajustes.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 mb-6">
            {Array.from({ length: total }).map((_, i) => {
              const feita = i < usadas
              return (
                <div key={i} className={`flex items-center gap-4 rounded-xl border px-4 sm:px-5 py-4
                  ${feita ? 'border-[#2e6cf6]/40 bg-[#2e6cf6]/[0.08]' : 'border-white/[0.08] bg-[#0c2236]/70'}`}>
                  <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center rlp-m text-[10px] tracking-[0.1em]
                    ${feita ? 'bg-[#2e6cf6] text-white' : 'border border-white/[0.14] text-white/45'}`}>
                    {feita ? '✓' : i + 1}
                  </span>
                  <p className={`rlp-t text-lg ${feita ? 'text-white' : 'text-white/60'}`}>Revisão {i + 1}</p>
                  <span className={`rlp-m ml-auto shrink-0 rounded-full border px-3 py-1 text-[9px]
                    ${feita ? 'border-[#2e6cf6] bg-[#2e6cf6] text-white' : 'border-[#7c8893]/50 text-[#7c8893]'}`}>
                    {feita ? 'Concluída' : 'Disponível'}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* CTA */}
        <div className={`${CARD} px-5 sm:px-6 py-6`}>
          <p className="rlp-m traco text-[11px] text-white/50 mb-3">Dar feedback</p>
          <p className="text-[15px] text-white/60 leading-relaxed mb-4">
            Quando receberes o link do vídeo para revisão, usa o botão abaixo para enviar os teus comentários.
          </p>
          <button disabled
            className="rlp-m w-full sm:w-auto rounded-md border border-white/[0.1] bg-[#0c2236]/60 px-5 py-3 text-[11px] text-[#7c8893] cursor-not-allowed">
            Aguardar vídeo
          </button>
        </div>
      </div>

      {isAdmin && (
        <AdminBar isEditing={isEditing} saving={saving}
          onToggle={() => setIsEditing(true)} onSave={save} onCancel={cancel} />
      )}
    </>
  )
}
