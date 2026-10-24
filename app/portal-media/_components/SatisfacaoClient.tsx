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
      <div className="rlp relative z-10 max-w-3xl mx-auto px-4 sm:px-8 py-8 sm:py-10">

        <Link href={`/portal-media/${projeto.ref}`}
          className="rlp-m inline-flex items-center gap-2 text-[10px] text-white/45 hover:text-white transition-colors mb-8 group">
          <span className="group-hover:-translate-x-1 transition-transform duration-200">‹</span>
          Portal {projeto.nome}
        </Link>

        <header className="mb-8">
          <p className="rlp-m traco text-[10px] text-[#5a8bff] mb-3">RL PROD · {projeto.nome}</p>
          <h1 className="rlp-t text-[clamp(32px,7vw,48px)] leading-none text-white">Satisfação</h1>
        </header>

        {/* Já submetido */}
        {(jaSubmeteu || enviado) ? (
          <section className="rounded-2xl border border-white/[0.1] bg-[#00141f]/70 px-5 sm:px-8 py-8 sm:py-10 flex flex-col items-center text-center gap-6">

            <div className="w-14 h-14 rounded-full bg-[#2e6cf6]/20 border border-[#2e6cf6]/50 flex items-center justify-center">
              {isAdmin ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="#a9c1ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                  <path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7Z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="#a9c1ff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              )}
            </div>

            <div>
              {isAdmin ? (
                <>
                  <p className="rlp-m text-[10px] text-[#5a8bff] mb-2">Avaliação do cliente</p>
                  <p className="text-[15px] text-white/60 leading-relaxed">
                    Submetida em{' '}
                    {dataFinal
                      ? new Date(dataFinal).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })
                      : '—'}
                  </p>
                </>
              ) : (
                <>
                  <p className="rlp-t text-[24px] text-white mb-2">Obrigado pelo teu feedback</p>
                  <p className="text-[15px] text-white/60 leading-relaxed max-w-sm">
                    A tua avaliação foi registada. A equipa RL PROD agradece a confiança.
                  </p>
                </>
              )}
            </div>

            {/* Nota */}
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map(i => (
                <span key={i}
                  className={`w-10 h-10 rounded-md flex items-center justify-center rlp-t text-[18px] ${
                    i <= notaFinal ? 'bg-[#2e6cf6] text-white' : 'bg-[#0c2236]/70 border border-white/[0.1] text-white/30'
                  }`}>
                  {i}
                </span>
              ))}
            </div>

            {notaFinal > 0 && (
              <p className="rlp-m text-[11px] text-[#a9c1ff] -mt-2">{LABELS[notaFinal]}</p>
            )}

            {comentarioFinal && (
              <div className="rounded-xl bg-[#0c2236]/70 px-5 py-4 max-w-md w-full text-left">
                <p className="rlp-m text-[9px] text-[#7c8893] mb-2">Comentário</p>
                <p className="text-[15px] text-white/80 leading-relaxed italic">
                  &quot;{comentarioFinal}&quot;
                </p>
              </div>
            )}
          </section>

        /* Formulário (admin e cliente) */
        ) : (
          <section className="rounded-2xl border border-white/[0.1] bg-[#00141f]/70 px-5 sm:px-8 py-8 flex flex-col gap-7">

            <div>
              <p className="rlp-m traco text-[10px] text-[#5a8bff] mb-3">Avaliação do projeto</p>
              <p className="rlp-t text-[24px] leading-tight text-white mb-1">Como correu a experiência?</p>
              <p className="text-[15px] text-white/60 leading-relaxed">
                A tua opinião é importante para nós. Avalia a tua experiência com a RL PROD.
              </p>
            </div>

            {/* Classificação */}
            <div>
              <p className="rlp-m text-[9px] text-[#7c8893] mb-3">Classificação</p>
              <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label="Classificação de 1 a 5">
                {[1, 2, 3, 4, 5].map(i => {
                  const ativo = i <= displayNota
                  return (
                    <button key={i}
                      type="button"
                      role="radio"
                      aria-checked={i === nota}
                      onClick={() => setNota(i)}
                      onMouseEnter={() => setHoverNota(i)}
                      onMouseLeave={() => setHoverNota(0)}
                      className={`flex flex-col items-center justify-center gap-1 rounded-xl py-4 sm:py-5 min-h-[76px] border transition-colors ${
                        ativo
                          ? 'bg-[#2e6cf6] border-[#2e6cf6] text-white'
                          : 'bg-[#0c2236]/70 border-white/[0.1] text-white/70 hover:border-[#2e6cf6]'
                      }`}
                    >
                      <span className="rlp-t text-[26px] leading-none">{i}</span>
                      <span className={`hidden sm:block text-[11px] ${ativo ? 'text-white/85' : 'text-[#7c8893]'}`}>{LABELS[i]}</span>
                    </button>
                  )
                })}
              </div>
              <p className={`rlp-m mt-3 text-[11px] text-[#a9c1ff] transition-opacity ${displayNota > 0 ? 'opacity-100' : 'opacity-0'}`}>
                {LABELS[displayNota] || '·'}
              </p>
            </div>

            {/* Comentário */}
            <div>
              <p className="rlp-m text-[9px] text-[#7c8893] mb-3">
                Comentário <span className="normal-case tracking-normal text-white/40">(opcional)</span>
              </p>
              <textarea
                value={comentario}
                onChange={e => setComentario(e.target.value)}
                placeholder="Partilha a tua experiência com a RL PROD…"
                rows={4}
                className="w-full rounded-md border border-white/[0.12] bg-[#00141f]/70 px-4 py-3 text-[15px] text-white placeholder:text-white/35 focus:outline-none focus:border-[#2e6cf6] resize-none leading-relaxed transition-colors"
              />
            </div>

            {erro && (
              <p className="text-[14px] text-[#ff4747] -mt-3">{erro}</p>
            )}

            <button
              onClick={submeter}
              disabled={enviando || nota === 0}
              className="rlp-m w-full sm:w-auto sm:self-start rounded-md bg-[#2e6cf6] hover:bg-[#5a8bff] px-8 py-4 text-[11px] tracking-[0.25em] text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {enviando ? 'A enviar…' : 'Submeter avaliação'}
            </button>
          </section>
        )}

      </div>

      {isAdmin && (
        <AdminBar isEditing={isEditing} saving={saving}
          onToggle={() => setIsEditing(true)} onSave={save} onCancel={cancel} />
      )}
    </>
  )
}
