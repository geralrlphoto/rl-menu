'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { Projeto } from '@/app/portal-media/_data/mockProject'
import AdminBar from './AdminBar'
import HeroUploadBlock from './HeroUploadBlock'

interface Props { projeto: Projeto; isAdmin: boolean }

const LABELS = ['', 'Fraco', 'Razoável', 'Bom', 'Muito Bom', 'Excelente']

export default function SatisfacaoClient({ projeto: initial, isAdmin }: Props) {
  const [projeto, setProjeto]   = useState(initial)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [heroUrl, setHeroUrl]   = useState(initial.satisfacaoImageUrl ?? '')

  /* ── form state ── */
  const [nota, setNota]           = useState(0)
  const [hoverNota, setHoverNota] = useState(0)
  const [comentario, setComentario] = useState('')
  const [enviando, setEnviando]   = useState(false)
  const [enviado, setEnviado]     = useState(false)
  const [erro, setErro]           = useState<string | null>(null)

  const satisfacao  = projeto.satisfacao
  const jaSubmeteu  = !!satisfacao
  const displayNota = hoverNota || nota

  /* ── save hero image (admin edit) ── */
  const save = async () => {
    setSaving(true)
    try {
      await fetch(`/api/media-portal/${projeto.ref}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ satisfacaoImageUrl: heroUrl }),
      })
    } catch {}
    setSaving(false)
    setIsEditing(false)
  }
  const cancel = () => { setProjeto(initial); setIsEditing(false) }

  /* ── submit satisfaction ── */
  const submeter = async () => {
    if (nota === 0) { setErro('Seleciona uma classificação.'); return }
    setEnviando(true)
    setErro(null)
    try {
      const resposta = {
        nota,
        comentario: comentario.trim(),
        submetidoEm: new Date().toISOString(),
      }
      const res = await fetch(`/api/media-portal/${projeto.ref}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ satisfacao: resposta }),
      })
      if (!res.ok) throw new Error()

      // Notificar admin
      fetch('/api/media-portal/notify-satisfacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomeProjeto: projeto.nome,
          cliente:     projeto.cliente,
          ref:         projeto.ref,
          nota,
          comentario:  comentario.trim(),
        }),
      }).catch(() => {})

      setProjeto(p => ({ ...p, satisfacao: resposta }))
      setEnviado(true)
    } catch {
      setErro('Erro ao enviar. Tenta novamente.')
    }
    setEnviando(false)
  }

  /* ── helpers ── */
  const notaFinal = satisfacao?.nota ?? (enviado ? nota : 0)
  const comentarioFinal = satisfacao?.comentario ?? (enviado ? comentario.trim() : '')
  const dataFinal = satisfacao?.submetidoEm

  return (
    <>
      <HeroUploadBlock url={heroUrl} isEditing={isEditing} onChange={setHeroUrl} />
      <div className="relative z-10 max-w-3xl mx-auto px-6 sm:px-10 py-10">

        <Link href={`/portal-media/${projeto.ref}`}
          className="inline-flex items-center gap-2 text-[11px] tracking-[0.4em] text-white/25 hover:text-white/55 transition-colors uppercase mb-12 group">
          <span className="group-hover:-translate-x-1 transition-transform duration-200">‹</span>
          Portal {projeto.nome}
        </Link>

        <div className="mb-10">
          <p className="text-[8px] tracking-[0.6em] text-white/20 uppercase mb-2">RL PROD · {projeto.nome}</p>
          <h1 className="text-3xl font-extralight tracking-[0.3em] text-white/80 uppercase">Satisfação</h1>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-px w-12 bg-white/25" />
            <div className="h-px flex-1 bg-white/[0.04]" />
          </div>
        </div>

        {/* ── Já submetido ── */}
        {(jaSubmeteu || enviado) ? (
          <div className={`border px-8 py-10 flex flex-col items-center text-center gap-6 ${
            isAdmin
              ? 'border-white/[0.10] bg-white/[0.02]'
              : 'border-emerald-400/20 bg-emerald-400/[0.03]'
          }`}>

            {/* Ícone */}
            <div className={`w-14 h-14 border flex items-center justify-center ${
              isAdmin ? 'border-white/[0.08]' : 'border-emerald-400/25'
            }`}>
              <span className={`text-2xl select-none ${isAdmin ? 'text-white/20' : 'text-emerald-400/50'}`}>
                {isAdmin ? '◒' : '✓'}
              </span>
            </div>

            <div>
              {isAdmin ? (
                <>
                  <p className="text-[11px] tracking-[0.5em] text-white/30 uppercase mb-2">Avaliação do Cliente</p>
                  <p className="text-[14px] font-light text-white/20 leading-relaxed">
                    Submetida em{' '}
                    {dataFinal
                      ? new Date(dataFinal).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })
                      : '—'}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[11px] tracking-[0.5em] text-emerald-400/60 uppercase mb-2">Obrigado pelo teu feedback</p>
                  <p className="text-[15px] font-light text-white/35 leading-relaxed max-w-sm">
                    A tua avaliação foi registada. A equipa RL PROD agradece a confiança.
                  </p>
                </>
              )}
            </div>

            {/* Estrelas */}
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map(i => (
                <span key={i} className="text-3xl leading-none select-none"
                  style={{ color: i <= notaFinal ? '#f59e0b' : 'rgba(255,255,255,0.08)' }}>
                  ★
                </span>
              ))}
            </div>

            {/* Label nota */}
            {notaFinal > 0 && (
              <p className="text-[12px] tracking-[0.4em] text-amber-400/50 uppercase -mt-2">
                {LABELS[notaFinal]}
              </p>
            )}

            {/* Comentário */}
            {comentarioFinal && (
              <div className="border border-white/[0.08] bg-white/[0.02] px-6 py-5 max-w-sm w-full text-left">
                <p className="text-[11px] tracking-[0.4em] text-white/20 uppercase mb-3">Comentário</p>
                <p className="text-[15px] font-light text-white/50 leading-relaxed italic">
                  &quot;{comentarioFinal}&quot;
                </p>
              </div>
            )}
          </div>

        /* ── Formulário (admin e cliente) ── */
        ) : (
          <div className="border border-white/[0.07] bg-white/[0.02] px-8 py-10 flex flex-col items-center text-center gap-8">

            <div className="w-14 h-14 border border-white/[0.08] flex items-center justify-center"
              style={{ boxShadow: '0 0 30px rgba(180,200,255,0.05)' }}>
              <span className="text-2xl text-white/15 select-none">◒</span>
            </div>

            <div>
              <p className="text-[11px] tracking-[0.3em] text-white/50 uppercase mb-2">Avaliação do Projeto</p>
              <p className="text-[15px] font-light text-white/25 leading-relaxed max-w-sm">
                A tua opinião é importante para nós.<br />
                Avalia a tua experiência com a RL PROD.
              </p>
            </div>

            {/* ── Estrelas ── */}
            <div className="flex flex-col items-center gap-3">
              <p className="text-[11px] tracking-[0.4em] text-white/20 uppercase">Classificação</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <button key={i}
                    onClick={() => setNota(i)}
                    onMouseEnter={() => setHoverNota(i)}
                    onMouseLeave={() => setHoverNota(0)}
                    className="text-4xl leading-none transition-all duration-100"
                    style={{ color: i <= displayNota ? '#f59e0b' : 'rgba(255,255,255,0.10)' }}
                  >★</button>
                ))}
              </div>
              <p className={`text-[12px] tracking-[0.35em] uppercase transition-all duration-150 ${
                displayNota > 0 ? 'text-amber-400/55 opacity-100' : 'opacity-0'
              }`}>
                {LABELS[displayNota] ?? ''}
              </p>
            </div>

            {/* ── Comentário ── */}
            <div className="w-full max-w-md text-left">
              <p className="text-[11px] tracking-[0.4em] text-white/20 uppercase mb-3">
                Comentário <span className="text-white/12 normal-case tracking-normal">(opcional)</span>
              </p>
              <textarea
                value={comentario}
                onChange={e => setComentario(e.target.value)}
                placeholder="Partilha a tua experiência com a RL PROD..."
                rows={4}
                className="w-full bg-white/[0.03] border border-white/[0.08] px-4 py-3 text-[15px] font-light
                           text-white/60 placeholder:text-white/12 focus:outline-none focus:border-white/20
                           resize-none leading-relaxed transition-colors"
              />
            </div>

            {erro && (
              <p className="text-[13px] text-red-400/70 -mt-4">⚠ {erro}</p>
            )}

            <button
              onClick={submeter}
              disabled={enviando || nota === 0}
              className="border border-white/30 bg-white/[0.04] hover:bg-white/[0.10] px-10 py-4
                         text-[11px] tracking-[0.5em] text-white/70 hover:text-white uppercase
                         transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ boxShadow: nota > 0 ? '0 0 18px rgba(255,255,255,0.06)' : 'none' }}
            >
              {enviando ? '⏳ A enviar...' : 'Submeter Avaliação'}
            </button>
          </div>
        )}

      </div>

      {isAdmin && (
        <AdminBar isEditing={isEditing} saving={saving}
          onToggle={() => setIsEditing(true)} onSave={save} onCancel={cancel} />
      )}
    </>
  )
}

