'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import CustomSelect from '@/app/components/CustomSelect'

const TIPOS = [
  'Produção Audiovisual',
  'Vídeo Institucional',
  'Vídeo Casamento',
  'Vídeo Evento',
  'Fotografia Comercial',
  'Fotografia Produto',
  'Fotografia Evento',
  'Outro',
]

const ESTADOS = [
  'Contacto Inicial',
  'Proposta Enviada',
  'Em Negociação',
  'Adjudicado',
  'Em Produção',
  'Concluído',
  'Cancelado',
]

const ESTADOS_CONTRATO = [
  'Por Elaborar',
  'Enviado ao Cliente',
  'Assinado',
  'Cancelado',
]

interface FormData {
  ref: string
  nome: string
  empresa: string
  nif: string
  morada: string
  email: string
  telefone: string
  representanteLegal: string
  tipo: string
  estado: string
  descricao: string
  orcamento: string
  dataFilmagem: string
  dataEntrega: string
  notas: string
  // Anexo I
  servicosList: string
  profissionaisList: string
  localAssinatura: string
  // Contrato
  contratoRef: string
  contratoEstado: string
  contratoDataEnvio: string
  contratoDataAssinatura: string
  contratoUrl: string
  contratoNotas: string
}

const EMPTY: FormData = {
  ref: '',
  nome: '',
  empresa: '',
  nif: '',
  morada: '',
  email: '',
  telefone: '',
  representanteLegal: '',
  tipo: '',
  estado: 'Contacto Inicial',
  descricao: '',
  orcamento: '',
  dataFilmagem: '',
  dataEntrega: '',
  notas: '',
  servicosList: '',
  profissionaisList: '',
  localAssinatura: 'Lisboa',
  contratoRef: '',
  contratoEstado: 'Por Elaborar',
  contratoDataEnvio: '',
  contratoDataAssinatura: '',
  contratoUrl: '',
  contratoNotas: '',
}

export default function FichaClientePage() {
  const [form, setForm] = useState<FormData>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [gerando, setGerando] = useState(false)
  const [contratoGerado, setContratoGerado] = useState<string | null>(null)
  const [error, setError] = useState('')
  const router = useRouter()

  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) { setError('Nome do cliente é obrigatório.'); return }
    setSaving(true)
    setError('')
    await new Promise(r => setTimeout(r, 900))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function handleGerarContrato() {
    if (!form.ref.trim()) { setError('Ref do portal é obrigatória para gerar o contrato.'); return }
    if (!form.nome.trim()) { setError('Nome do cliente é obrigatório.'); return }
    setGerando(true)
    setError('')
    try {
      const res = await fetch('/api/media-portal/gerar-contrato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setContratoGerado(data.contratoUrl)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar contrato.')
    } finally {
      setGerando(false)
    }
  }

  const labelCls = "block text-[8px] tracking-[0.5em] text-white/25 uppercase mb-2"
  const inputCls = "w-full bg-white/[0.03] border border-white/[0.08] focus:border-white/25 focus:outline-none px-4 py-3 text-[13px] text-white/75 placeholder:text-white/15 transition-colors duration-200"
  const selectCls = inputCls + " appearance-none cursor-pointer [color-scheme:dark]"

  return (
    <main className="min-h-screen bg-[#050507] relative">

      {/* Grid bg */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.016) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.016) 1px,transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        background: 'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(180,200,255,0.04) 0%, transparent 70%)',
      }} />

      <div className="relative z-10 max-w-2xl mx-auto px-6 sm:px-10 py-10">

        {/* Back */}
        <Link href="/media"
          className="inline-flex items-center gap-2 text-[9px] tracking-[0.4em] text-white/25 hover:text-white/55 transition-colors uppercase mb-12 group">
          <span className="group-hover:-translate-x-1 transition-transform duration-200">‹</span>
          Menu RL Media
        </Link>

        {/* Header */}
        <div className="mb-12">
          <p className="text-[8px] tracking-[0.6em] text-white/20 uppercase mb-2">RL Media · Audiovisual</p>
          <h1 className="text-3xl font-extralight tracking-[0.3em] text-white/80 uppercase">Ficha de Cliente</h1>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-px w-12 bg-white/25" />
            <div className="h-px flex-1 bg-white/[0.04]" />
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">

          {/* Secção — Identificação */}
          <div>
            <p className="text-[8px] tracking-[0.55em] text-white/20 uppercase mb-5 flex items-center gap-3">
              <span>01 — Identificação</span>
              <span className="flex-1 h-px bg-white/[0.05]" />
            </p>
            <div className="mb-4">
              <label className={labelCls}>Ref do Portal *</label>
              <input
                value={form.ref}
                onChange={e => setForm(f => ({ ...f, ref: e.target.value.toUpperCase() }))}
                placeholder="Ex: OLEOBIO"
                className={inputCls + ' uppercase tracking-widest'}
              />
              <p className="mt-1.5 text-[9px] text-white/15">Referência única do projeto — liga a ficha ao portal do cliente.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Nome *</label>
                <input value={form.nome} onChange={set('nome')} placeholder="Nome completo" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Empresa / Marca</label>
                <input value={form.empresa} onChange={set('empresa')} placeholder="Nome da empresa" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>NIF / NIPC</label>
                <input value={form.nif} onChange={set('nif')} placeholder="123 456 789" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Telefone</label>
                <input value={form.telefone} onChange={set('telefone')} placeholder="+351 9xx xxx xxx" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" value={form.email} onChange={set('email')} placeholder="email@exemplo.com" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Morada</label>
                <input value={form.morada} onChange={set('morada')} placeholder="Rua, cidade" className={inputCls} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Representante Legal</label>
                <input value={form.representanteLegal} onChange={set('representanteLegal')} placeholder="Nome completo do representante legal" className={inputCls} />
              </div>
            </div>
          </div>

          {/* Secção — Projeto */}
          <div>
            <p className="text-[8px] tracking-[0.55em] text-white/20 uppercase mb-5 flex items-center gap-3">
              <span>02 — Projeto</span>
              <span className="flex-1 h-px bg-white/[0.05]" />
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Tipo de Serviço</label>
                <CustomSelect value={form.tipo} onChange={v => setForm(f => ({ ...f, tipo: v }))} options={TIPOS} placeholder="Selecionar..." />
              </div>
              <div>
                <label className={labelCls}>Estado</label>
                <CustomSelect value={form.estado} onChange={v => setForm(f => ({ ...f, estado: v }))} options={ESTADOS} />
              </div>
              <div>
                <label className={labelCls}>Data de Filmagem</label>
                <input type="date" value={form.dataFilmagem} onChange={set('dataFilmagem')}
                  className={inputCls + ' [color-scheme:dark]'} />
              </div>
              <div>
                <label className={labelCls}>Data de Entrega</label>
                <input type="date" value={form.dataEntrega} onChange={set('dataEntrega')}
                  className={inputCls + ' [color-scheme:dark]'} />
              </div>
              <div>
                <label className={labelCls}>Valor do Serviço (€)</label>
                <input value={form.orcamento} onChange={set('orcamento')} placeholder="0.00" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Local de Assinatura</label>
                <input value={form.localAssinatura} onChange={set('localAssinatura')} placeholder="Lisboa" className={inputCls} />
              </div>
            </div>
            <div className="mt-4">
              <label className={labelCls}>Descrição do Projeto</label>
              <textarea value={form.descricao} onChange={set('descricao')}
                placeholder="Descrição breve do projeto e objetivos..." rows={4}
                className={inputCls + ' resize-none leading-relaxed'} />
            </div>
          </div>

          {/* Secção — Anexo I */}
          <div>
            <p className="text-[8px] tracking-[0.55em] text-white/20 uppercase mb-5 flex items-center gap-3">
              <span>03 — Anexo I · Serviços & Profissionais</span>
              <span className="flex-1 h-px bg-white/[0.05]" />
            </p>
            <div className="flex flex-col gap-4">
              <div>
                <label className={labelCls}>Serviços Contratados (um por linha)</label>
                <textarea value={form.servicosList} onChange={set('servicosList')}
                  placeholder={"2 REUNIÕES DE ARRANQUE\n1 A 2 DIAS DE FILMAGEM\nCORREÇÃO DE CORES\nDIREITOS DE MÚSICAS ILIMITADOS"}
                  rows={6} className={inputCls + ' resize-none leading-relaxed font-mono text-xs'} />
              </div>
              <div>
                <label className={labelCls}>Profissionais Envolvidos (um por linha)</label>
                <textarea value={form.profissionaisList} onChange={set('profissionaisList')}
                  placeholder={"1 VIDEÓGRAFO\n1 FOTÓGRAFO\n1 ASSISTENTE"}
                  rows={4} className={inputCls + ' resize-none leading-relaxed font-mono text-xs'} />
              </div>
            </div>
          </div>

          {/* Secção — Contrato */}
          <div>
            <p className="text-[8px] tracking-[0.55em] text-white/20 uppercase mb-5 flex items-center gap-3">
              <span>04 — Contrato</span>
              <span className="flex-1 h-px bg-white/[0.05]" />
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Referência do Contrato</label>
                <input value={form.contratoRef} onChange={set('contratoRef')} placeholder="Ex: CPS-2026-001" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Estado do Contrato</label>
                <CustomSelect value={form.contratoEstado} onChange={v => setForm(f => ({ ...f, contratoEstado: v }))} options={ESTADOS_CONTRATO} />
              </div>
              <div>
                <label className={labelCls}>Data de Envio</label>
                <input type="date" value={form.contratoDataEnvio} onChange={set('contratoDataEnvio')}
                  className={inputCls + ' [color-scheme:dark]'} />
              </div>
              <div>
                <label className={labelCls}>Data de Assinatura</label>
                <input type="date" value={form.contratoDataAssinatura} onChange={set('contratoDataAssinatura')}
                  className={inputCls + ' [color-scheme:dark]'} />
              </div>
            </div>
            <div className="mt-4">
              <label className={labelCls}>Link do Contrato (PDF / Drive)</label>
              <input value={form.contratoUrl} onChange={set('contratoUrl')} placeholder="https://..." className={inputCls} />
            </div>
            <div className="mt-4">
              <label className={labelCls}>Notas sobre o Contrato</label>
              <textarea value={form.contratoNotas} onChange={set('contratoNotas')}
                placeholder="Condições especiais, revisões, observações..." rows={3}
                className={inputCls + ' resize-none leading-relaxed'} />
            </div>
          </div>

          {/* Secção — Notas */}
          <div>
            <p className="text-[8px] tracking-[0.55em] text-white/20 uppercase mb-5 flex items-center gap-3">
              <span>05 — Notas Internas</span>
              <span className="flex-1 h-px bg-white/[0.05]" />
            </p>
            <textarea value={form.notas} onChange={set('notas')}
              placeholder="Notas internas, observações, contexto adicional..." rows={3}
              className={inputCls + ' resize-none leading-relaxed'} />
          </div>

          {/* Error */}
          {error && (
            <p className="text-[10px] tracking-[0.3em] text-red-400/70 uppercase">{error}</p>
          )}

          {/* Contrato gerado — banner */}
          {contratoGerado && (
            <div className="border border-emerald-400/20 bg-emerald-400/5 px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-[9px] tracking-[0.4em] text-emerald-400/70 uppercase mb-1">✓ Contrato Gerado</p>
                <p className="text-xs text-white/30">Disponível na ficha e no portal do cliente.</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={contratoGerado}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[9px] tracking-[0.4em] text-white/40 hover:text-white/70 border border-white/10
                             hover:border-white/25 px-4 py-2 uppercase transition-all duration-200"
                >
                  Ver Contrato →
                </a>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-white/[0.05]">
            <button type="button" onClick={() => { setForm(EMPTY); setContratoGerado(null) }}
              className="text-[9px] tracking-[0.4em] text-white/20 hover:text-white/45 uppercase transition-colors">
              Limpar
            </button>
            <div className="flex items-center gap-3">
              {/* Gerar Contrato */}
              <button
                type="button"
                onClick={handleGerarContrato}
                disabled={gerando}
                className="flex items-center gap-2 border border-white/15 bg-white/[0.03] hover:bg-white/[0.07]
                           hover:border-white/30 px-6 py-4 transition-all duration-300 disabled:opacity-40"
              >
                {gerando ? (
                  <span className="text-[9px] tracking-[0.4em] text-white/35 uppercase">A gerar...</span>
                ) : (
                  <>
                    <svg className="w-3 h-3 text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0121 9.414V19a2 2 0 01-2 2z"/>
                    </svg>
                    <span className="text-[9px] tracking-[0.4em] text-white/40 uppercase">Gerar Contrato</span>
                  </>
                )}
              </button>

              {/* Guardar */}
              <button type="submit" disabled={saving}
                className="flex items-center gap-3 border border-white/20 bg-white/[0.04] hover:bg-white/[0.09] hover:border-white/35
                           px-8 py-4 transition-all duration-300 disabled:opacity-40">
                {saving ? (
                  <span className="text-[9px] tracking-[0.5em] text-white/40 uppercase">A guardar...</span>
                ) : saved ? (
                  <span className="text-[9px] tracking-[0.5em] text-emerald-400/70 uppercase">✓ Guardado</span>
                ) : (
                  <span className="text-[9px] tracking-[0.5em] text-white/55 uppercase">Guardar Ficha →</span>
                )}
              </button>
            </div>
          </div>

        </form>

      </div>
    </main>
  )
}
