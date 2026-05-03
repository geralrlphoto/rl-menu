'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { Projeto, BriefingSessao } from '@/app/portal-media/_data/mockProject'
import AdminBar from './AdminBar'
import EditableField from './EditableField'
import EditableDateField from './EditableDateField'
import HeroUploadBlock from './HeroUploadBlock'

interface Props { projeto: Projeto; isAdmin: boolean }

export default function BriefingClient({ projeto: initial, isAdmin }: Props) {
  const [sessoes, setSessoes] = useState<BriefingSessao[]>(initial.briefingSessoes ?? [])
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [heroUrl, setHeroUrl] = useState(initial.briefingImageUrl ?? '')
  const [notifying, setNotifying] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const saveData = async (updatedSessoes?: BriefingSessao[]) => {
    await fetch(`/api/media-portal/${initial.ref}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        briefingSessoes: updatedSessoes ?? sessoes,
        briefingImageUrl: heroUrl,
      }),
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try { await saveData() } catch {}
    setSaving(false)
    setIsEditing(false)
  }

  const cancel = () => {
    setSessoes(initial.briefingSessoes ?? [])
    setHeroUrl(initial.briefingImageUrl ?? '')
    setIsEditing(false)
  }

  const addSessao = () => {
    const n = sessoes.length + 1
    setSessoes(s => [...s, {
      id: Date.now().toString(),
      titulo: `${n}º Briefing`,
      data: '',
      resumo: '',
    }])
    setIsEditing(true)
  }

  const update = (id: string, field: keyof BriefingSessao, value: string) =>
    setSessoes(s => s.map(ses => ses.id === id ? { ...ses, [field]: value } : ses))

  const remove = (id: string) =>
    setSessoes(s => s.filter(ses => ses.id !== id))

  const eliminar = async (id: string) => {
    const updated = sessoes.filter(ses => ses.id !== id)
    setSessoes(updated)
    setConfirmDelete(null)
    try { await saveData(updated) } catch {}
  }

  const notificar = async (id: string) => {
    const sessao = sessoes.find(s => s.id === id)
    if (!sessao) return

    const emailCliente = initial.fichaCliente?.email
    if (!emailCliente) {
      alert('Sem email do cliente definido. Adiciona o email na secção Contrato & CPS.')
      return
    }

    setNotifying(id)
    try {
      await fetch('/api/media-portal/notify-briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailCliente,
          ref: initial.ref,
          nomeProjeto: initial.nome,
          cliente: initial.cliente,
          sessaoTitulo: sessao.titulo,
          sessaoData: sessao.data,
        }),
      })
      const agora = new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })
      const updated = sessoes.map(ses => ses.id === id ? { ...ses, notificacaoEnviada: agora } : ses)
      setSessoes(updated)
      await saveData(updated)
    } catch {}
    setNotifying(null)
  }

  return (
    <>
      <HeroUploadBlock url={heroUrl} isEditing={isEditing} onChange={setHeroUrl} />

      <div className="relative z-10 max-w-3xl mx-auto px-6 sm:px-10 py-10">

        <Link href={`/portal-media/${initial.ref}`}
          className="inline-flex items-center gap-2 text-sm tracking-[0.4em] text-white/25 hover:text-white/55 transition-colors uppercase mb-12 group">
          <span className="group-hover:-translate-x-1 transition-transform duration-200">‹</span>
          Portal {initial.nome}
        </Link>

        {/* Title + add button */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-sm tracking-[0.6em] text-white/20 uppercase mb-2">RL Media · {initial.nome}</p>
            <h1 className="text-3xl font-extralight tracking-[0.3em] text-white/80 uppercase">Briefing</h1>
            <div className="mt-4 flex items-center gap-3">
              <div className="h-px w-12 bg-white/25" />
              <div className="h-px flex-1 bg-white/[0.04]" />
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={addSessao}
              className="border border-dashed border-white/20 hover:border-white/40 px-4 py-2 text-sm tracking-[0.3em] text-white/30 hover:text-white/60 uppercase transition-colors shrink-0"
            >
              + Sessão
            </button>
          )}
        </div>

        {/* Empty state */}
        {sessoes.length === 0 && (
          <div className="border border-dashed border-white/[0.07] px-6 py-14 text-center">
            <p className="text-sm tracking-[0.4em] text-white/20 uppercase mb-2">Sem briefings registados</p>
            {isAdmin && (
              <p className="text-sm text-white/15">Clica em "+ Sessão" para adicionar o primeiro briefing</p>
            )}
          </div>
        )}

        {/* Sessions */}
        <div className="flex flex-col gap-5">
          {sessoes.map((sessao, i) => (
            <div key={sessao.id} className="border border-white/[0.08] bg-white/[0.02]">

              {/* Session header */}
              <div className="flex items-center gap-4 px-6 py-4 border-b border-white/[0.06]">
                <span className="text-sm font-mono text-white/15 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                <EditableField
                  value={sessao.titulo}
                  isEditing={isEditing}
                  onChange={v => update(sessao.id, 'titulo', v)}
                  className="flex-1 text-sm tracking-[0.3em] text-white/65 uppercase font-medium"
                  placeholder="Título do briefing"
                />
                <EditableDateField
                  value={sessao.data}
                  isEditing={isEditing}
                  onChange={v => update(sessao.id, 'data', v)}
                  className="text-sm tracking-[0.2em] text-white/30 shrink-0"
                  placeholder="Data"
                />
              </div>

              {/* Resumo */}
              <div className="px-6 py-5">
                <p className="text-sm tracking-[0.4em] text-white/20 uppercase mb-3">Resumo</p>
                {isEditing ? (
                  <textarea
                    value={sessao.resumo}
                    onChange={e => update(sessao.id, 'resumo', e.target.value)}
                    placeholder="Escreve aqui o resumo do briefing com o cliente — objetivos, referências, decisões tomadas..."
                    rows={7}
                    className="w-full bg-white/[0.03] border border-white/[0.08] px-4 py-3 text-sm text-white/55 leading-relaxed resize-none focus:outline-none focus:border-white/20 placeholder:text-white/15"
                  />
                ) : sessao.resumo ? (
                  <p className="text-sm text-white/45 leading-relaxed whitespace-pre-wrap">{sessao.resumo}</p>
                ) : (
                  <p className="text-sm text-white/15 italic">Sem resumo registado.</p>
                )}
              </div>

              {/* Notification + delete footer */}
              {isAdmin && (
                <>
                  <div className="px-6 py-4 border-t border-white/[0.06] flex items-center justify-between gap-4">
                    <span className={`text-sm tracking-[0.25em] uppercase ${sessao.notificacaoEnviada ? 'text-emerald-400/60' : 'text-white/18'}`}>
                      {sessao.notificacaoEnviada
                        ? `✓ Notificado em ${sessao.notificacaoEnviada}`
                        : 'Cliente não notificado'}
                    </span>
                    <button
                      onClick={() => !sessao.notificacaoEnviada && notificar(sessao.id)}
                      disabled={!!sessao.notificacaoEnviada || notifying === sessao.id}
                      className={`px-5 py-2 text-sm tracking-[0.35em] uppercase border transition-colors shrink-0
                        ${sessao.notificacaoEnviada
                          ? 'border-emerald-400/20 text-emerald-400/40 cursor-default'
                          : 'border-white/25 text-white/50 hover:border-white/50 hover:text-white/80 cursor-pointer'}
                        disabled:opacity-50`}
                    >
                      {notifying === sessao.id ? '⏳ A enviar...' : sessao.notificacaoEnviada ? '✓ Enviado' : 'Notificar Cliente'}
                    </button>
                  </div>

                  {/* Delete row */}
                  <div className="px-6 py-3 border-t border-white/[0.04] flex items-center justify-end">
                    {confirmDelete === sessao.id ? (
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-white/35 tracking-[0.2em]">Tens a certeza?</span>
                        <button
                          onClick={() => eliminar(sessao.id)}
                          className="px-4 py-1.5 text-sm tracking-[0.3em] uppercase border border-red-400/40 text-red-400/70 hover:border-red-400/70 hover:text-red-400 transition-colors"
                        >
                          Eliminar
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="text-sm tracking-[0.3em] text-white/25 hover:text-white/50 uppercase transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(sessao.id)}
                        className="text-sm tracking-[0.3em] text-white/15 hover:text-red-400/50 uppercase transition-colors"
                      >
                        — Eliminar Sessão
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Briefing doc link */}
        {initial.briefingUrl && (
          <div className="mt-6">
            <a href={initial.briefingUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] px-6 py-4 transition-colors group">
              <span className="text-sm tracking-[0.3em] text-white/40 uppercase">Ver Briefing Completo</span>
              <span className="text-white/20 group-hover:text-white/50 transition-colors">↗</span>
            </a>
          </div>
        )}
      </div>

      {isAdmin && (
        <AdminBar isEditing={isEditing} saving={saving}
          onToggle={() => setIsEditing(true)} onSave={handleSave} onCancel={cancel} />
      )}
    </>
  )
}
