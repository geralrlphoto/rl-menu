'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { Projeto } from '@/app/portal-media/_data/mockProject'
import AdminBar from './AdminBar'
import EditableField from './EditableField'

interface ContratoGerado {
  gerado: boolean
  geradoEm?: string
  ref?: string
  estado?: string
  url?: string
}

interface Props {
  projeto: Projeto
  isAdmin: boolean
  contratoGerado?: ContratoGerado | null
}

export default function ContratoClient({ projeto: initial, isAdmin, contratoGerado }: Props) {
  const [projeto, setProjeto] = useState(initial)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await fetch(`/api/media-portal/${projeto.ref}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contratoUrl: projeto.contratoUrl, cpsFormUrl: projeto.cpsFormUrl }),
      })
    } catch {}
    setSaving(false)
    setIsEditing(false)
  }

  const cancel = () => { setProjeto(initial); setIsEditing(false) }
  const set = (field: keyof Projeto, value: string) =>
    setProjeto(p => ({ ...p, [field]: value }))

  const temContratoGerado = contratoGerado?.gerado && contratoGerado?.url

  return (
    <>
      <div className="relative z-10 max-w-3xl mx-auto px-6 sm:px-10 py-10">

        <Link href={`/portal-media/${projeto.ref}`}
          className="inline-flex items-center gap-2 text-xs tracking-[0.4em] text-white/25 hover:text-white/55 transition-colors uppercase mb-12 group">
          <span className="group-hover:-translate-x-1 transition-transform duration-200">‹</span>
          Portal {projeto.nome}
        </Link>

        <div className="mb-10">
          <p className="text-xs tracking-[0.6em] text-white/20 uppercase mb-2">RL Media · {projeto.nome}</p>
          <h1 className="text-3xl font-extralight tracking-[0.3em] text-white/80 uppercase">Contrato & CPS</h1>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-px w-12 bg-white/25" />
            <div className="h-px flex-1 bg-white/[0.04]" />
          </div>
        </div>

        <div className="flex flex-col gap-3 mb-8">

          {/* Contrato gerado — destaque */}
          {temContratoGerado ? (
            <div className="border border-white/[0.12] bg-white/[0.03] px-6 py-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[8px] tracking-[0.5em] text-white/25 uppercase mb-1">Contrato de Prestação de Serviços</p>
                  <p className="text-[13px] tracking-[0.2em] text-white/75 font-light mb-1">{contratoGerado?.ref}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`text-[8px] tracking-[0.35em] uppercase px-2 py-0.5 border ${
                      contratoGerado?.estado === 'Assinado'
                        ? 'border-emerald-400/30 text-emerald-400/60'
                        : contratoGerado?.estado === 'Enviado ao Cliente'
                        ? 'border-blue-400/30 text-blue-400/60'
                        : 'border-white/10 text-white/25'
                    }`}>{contratoGerado?.estado}</span>
                    {contratoGerado?.geradoEm && (
                      <span className="text-[8px] text-white/15 tracking-[0.2em]">Gerado em {contratoGerado.geradoEm}</span>
                    )}
                  </div>
                </div>
                <a
                  href={contratoGerado!.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 border border-white/15 bg-white/[0.04] hover:bg-white/[0.09] hover:border-white/30
                             px-5 py-3 text-[9px] tracking-[0.4em] text-white/45 hover:text-white/75 uppercase
                             transition-all duration-300 flex items-center gap-2"
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0121 9.414V19a2 2 0 01-2 2z"/>
                  </svg>
                  Ver Contrato
                </a>
              </div>
              {isEditing && (
                <div className="mt-4">
                  <EditableField
                    value={projeto.contratoUrl ?? ''}
                    isEditing={true}
                    onChange={v => set('contratoUrl', v)}
                    placeholder="URL externo do contrato (opcional)"
                    className="text-xs text-white/40"
                  />
                </div>
              )}
            </div>
          ) : (
            /* Contrato sem gerar */
            <div className={`border px-6 py-5
              ${projeto.contratoUrl ? 'border-emerald-400/20 bg-emerald-400/5' : 'border-white/[0.07] bg-white/[0.02]'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-xs tracking-[0.25em] text-white/60 uppercase font-medium mb-1">
                    Contrato de Prestação de Serviços
                  </p>
                  <p className={`text-xs tracking-[0.3em] uppercase mb-3 ${projeto.contratoUrl ? 'text-emerald-400/60' : 'text-white/20'}`}>
                    {projeto.contratoUrl ? 'Assinado' : 'A aguardar geração'}
                  </p>
                  {isEditing && (
                    <EditableField
                      value={projeto.contratoUrl ?? ''}
                      isEditing={true}
                      onChange={v => set('contratoUrl', v)}
                      placeholder="URL do contrato (Google Drive, etc.)"
                      className="text-xs text-white/40"
                    />
                  )}
                </div>
                <div className="shrink-0">
                  {!isEditing && (
                    projeto.contratoUrl ? (
                      <a href={projeto.contratoUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs tracking-[0.3em] text-white/35 hover:text-white/60 uppercase transition-colors">Ver →</a>
                    ) : (
                      <span className="text-xs tracking-[0.3em] text-white/15 uppercase">Em breve</span>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {/* CPS form */}
          <div className="border border-white/[0.07] bg-white/[0.02] px-6 py-6">
            <p className="text-xs tracking-[0.4em] text-white/25 uppercase mb-2">Dados para CPS</p>
            <p className="text-xs text-white/30 leading-relaxed mb-4">
              Para emissão do contrato precisamos dos dados fiscais da tua empresa. Preenche o formulário abaixo.
            </p>
            {isEditing && (
              <div className="mb-4">
                <p className="text-xs text-white/30 mb-1">URL do formulário CPS</p>
                <EditableField
                  value={projeto.cpsFormUrl ?? ''}
                  isEditing={true}
                  onChange={v => set('cpsFormUrl', v)}
                  placeholder="https://tally.so/... ou outro link"
                  className="text-xs text-white/40"
                />
              </div>
            )}
            {!isEditing && projeto.cpsFormUrl ? (
              <a href={projeto.cpsFormUrl} target="_blank" rel="noopener noreferrer"
                className="inline-block border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] px-5 py-2.5
                           text-xs tracking-[0.4em] text-white/45 hover:text-white/70 uppercase transition-all">
                Preencher Formulário →
              </a>
            ) : !isEditing ? (
              <button disabled
                className="border border-white/15 bg-white/[0.04] px-5 py-2.5
                           text-xs tracking-[0.4em] text-white/25 uppercase cursor-not-allowed">
                Preencher Formulário →
              </button>
            ) : null}
          </div>
        </div>

        <div className="border border-white/[0.05] bg-white/[0.01] px-5 py-4">
          <p className="text-xs tracking-[0.2em] text-white/20 leading-relaxed">
            Dúvidas sobre o contrato? Contacta <span className="text-white/35">rl@rlmedia.pt</span>
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
