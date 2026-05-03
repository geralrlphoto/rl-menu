'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import type { Projeto, RegistoPagamento } from '@/app/portal-media/_data/mockProject'
import AdminBar from './AdminBar'
import EditableField from './EditableField'
import EditableSelect from './EditableSelect'
import EditableDateField from './EditableDateField'

const PAG_CFG = {
  pago:      { label: 'Pago',      color: 'text-emerald-400/80', border: 'border-emerald-400/20', bg: 'bg-emerald-400/5'  },
  pendente:  { label: 'Pendente',  color: 'text-white/30',       border: 'border-white/[0.06]',   bg: 'bg-white/[0.015]' },
  em_atraso: { label: 'Em Atraso', color: 'text-red-400/80',     border: 'border-red-400/20',     bg: 'bg-red-400/5'     },
}

const ESTADO_OPTIONS = [
  { value: 'pago',      label: 'Pago'      },
  { value: 'pendente',  label: 'Pendente'  },
  { value: 'em_atraso', label: 'Em Atraso' },
]

const METODO_OPTIONS = [
  'Transferência Bancária',
  'MB Way',
  'Multibanco',
  'Cheque',
  'Numerário',
]

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

interface FormState {
  empresa:    string
  referencia: string
  fase:       string
  valor:      string
  metodo:     string
  data:       string
  file:       File | null
}

interface Props { projeto: Projeto; isAdmin: boolean }

export default function PagamentosClient({ projeto: initial, isAdmin }: Props) {
  const [projeto, setProjeto] = useState(initial)
  const [registos, setRegistos] = useState<RegistoPagamento[]>(initial.registosPagamento ?? [])
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [heroUrl, setHeroUrl] = useState(initial.pagamentosImageUrl ?? '')
  const [uploadingHero, setUploadingHero] = useState(false)
  const heroFileRef = useRef<HTMLInputElement>(null)

  const handleHeroUpload = async (file: File) => {
    setUploadingHero(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload-image', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) setHeroUrl(data.url)
    } catch {}
    setUploadingHero(false)
  }

  /* ── Registar Pagamento ── */
  const [showForm, setShowForm]       = useState(false)
  const [submitting, setSubmitting]   = useState(false)
  const [submitted, setSubmitted]     = useState(false)
  const [submitError, setSubmitError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<FormState>({
    empresa:    projeto.fichaCliente?.empresa || projeto.cliente,
    referencia: projeto.ref,
    fase:       '',
    valor:      '',
    metodo:     'Transferência Bancária',
    data:       todayISO(),
    file:       null,
  })

  const setField = (k: keyof FormState, v: string) =>
    setForm(f => ({ ...f, [k]: v }))

  const openForm = () => {
    setSubmitted(false)
    setSubmitError('')
    setForm({
      empresa:    projeto.fichaCliente?.empresa || projeto.cliente,
      referencia: projeto.ref,
      fase:       '',
      valor:      '',
      metodo:     'Transferência Bancária',
      data:       todayISO(),
      file:       null,
    })
    setShowForm(true)
  }

  const closeForm = () => { setShowForm(false); setSubmitted(false) }

  const submitPagamento = async () => {
    if (!form.valor) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const fd = new FormData()
      fd.append('empresa',    form.empresa)
      fd.append('referencia', form.referencia)
      fd.append('fase',       form.fase)
      fd.append('valor',      form.valor)
      fd.append('metodo',     form.metodo)
      fd.append('data',       form.data)
      if (form.file) fd.append('comprovativo', form.file)

      const res = await fetch('/api/media-portal/registar-pagamento', {
        method: 'POST',
        body: fd,
      })
      const data = await res.json()
      if (data.ok) {
        if (data.registosPagamento?.length) {
          setRegistos(data.registosPagamento)
        }
        setSubmitted(true)
      } else {
        setSubmitError(data.error || 'Erro ao enviar. Tenta novamente.')
      }
    } catch {
      setSubmitError('Erro de ligação. Tenta novamente.')
    }
    setSubmitting(false)
  }

  /* ── Admin edit ── */
  const save = async () => {
    setSaving(true)
    try {
      await fetch(`/api/media-portal/${projeto.ref}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pagamentos: projeto.pagamentos, pagamentosImageUrl: heroUrl }),
      })
    } catch {}
    setSaving(false)
    setIsEditing(false)
  }

  const cancel = () => { setProjeto(initial); setIsEditing(false) }

  const updatePag = (idx: number, field: string, value: string | number) =>
    setProjeto(p => ({
      ...p,
      pagamentos: p.pagamentos.map((pg, i) => i === idx ? { ...pg, [field]: value } : pg),
    }))

  const addPagamento = () =>
    setProjeto(p => ({
      ...p,
      pagamentos: [...p.pagamentos, { descricao: 'Nova Prestação', valor: 0, estado: 'pendente' as const, data: '' }],
    }))

  const removePagamento = (idx: number) =>
    setProjeto(p => ({ ...p, pagamentos: p.pagamentos.filter((_, i) => i !== idx) }))

  /* ── Cálculos ── */
  const total    = projeto.pagamentos.reduce((s, pg) => s + pg.valor, 0)
  const pago     = registos.reduce((s, r) => s + r.valor, 0)
  const restante = Math.max(0, total - pago)

  return (
    <>
      {/* ── Hero com foto a desvanecer ── */}
      {heroUrl && (
        <div className="w-full shrink-0 overflow-hidden" style={{ height: 320 }}>
          <img
            src={heroUrl}
            alt=""
            className="w-full h-full object-cover object-center"
            style={{
              maskImage: 'linear-gradient(to bottom, black 0%, black 30%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 30%, transparent 100%)',
            }}
          />
        </div>
      )}
      {isEditing && (
        <div className="relative z-10 max-w-3xl mx-auto px-6 sm:px-10 pt-4">
          <input
            ref={heroFileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleHeroUpload(f) }}
          />
          <div className="flex items-center gap-3 border border-white/[0.07] bg-white/[0.02] px-4 py-3">
            <span className="text-[11px] tracking-[0.4em] text-white/25 uppercase shrink-0">🖼 Foto cabeçalho</span>
            <button
              onClick={() => heroFileRef.current?.click()}
              disabled={uploadingHero}
              className="flex-1 text-left text-sm text-white/40 hover:text-white/70 transition-colors disabled:opacity-40"
            >
              {uploadingHero ? '⏳ A carregar...' : heroUrl ? '✓ Trocar foto' : '⬆ Carregar foto'}
            </button>
            {heroUrl && !uploadingHero && (
              <button onClick={() => setHeroUrl('')} className="text-white/20 hover:text-white/50 text-sm transition-colors shrink-0">✕ Remover</button>
            )}
          </div>
        </div>
      )}

      <div className="relative z-10 max-w-3xl mx-auto px-6 sm:px-10 py-10">

        <Link href={`/portal-media/${projeto.ref}`}
          className="inline-flex items-center gap-2 text-sm tracking-[0.4em] text-white/25 hover:text-white/55 transition-colors uppercase mb-12 group">
          <span className="group-hover:-translate-x-1 transition-transform duration-200">‹</span>
          Portal {projeto.nome}
        </Link>

        <div className="mb-10">
          <p className="text-sm tracking-[0.6em] text-white/20 uppercase mb-2">RL Media · {projeto.nome}</p>
          <h1 className="text-3xl font-extralight tracking-[0.3em] text-white/80 uppercase">Pagamentos</h1>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-px w-12 bg-white/25" />
            <div className="h-px flex-1 bg-white/[0.04]" />
          </div>
        </div>

        {/* ── Texto explicativo ── */}
        <div className="mb-8 border border-white/[0.06] bg-white/[0.02] px-6 py-5 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-px h-10 bg-white/20 shrink-0" />
            <p className="text-sm tracking-[0.5em] text-white/30 uppercase">Como funciona</p>
          </div>
          <p className="text-sm font-light leading-relaxed text-white/45">
            Esta página é o registo oficial de todos os pagamentos realizados no âmbito do vosso projecto.
            Cada vez que efectuarem um pagamento — seja adjudicação, reforço ou valor final — devem submetê-lo aqui para que fique documentado e a nossa equipa seja notificada de imediato.
          </p>
          <div className="flex flex-col gap-2 mt-1">
            {[
              { n: '1', text: 'Cliquem em «Registar Pagamento» abaixo' },
              { n: '2', text: 'Preencham o valor, método e data do pagamento' },
              { n: '3', text: 'Anexem o comprovativo (transferência, MB Way, etc.)' },
              { n: '4', text: 'Cliquem em Enviar — a equipa RL Media recebe a confirmação' },
            ].map(step => (
              <div key={step.n} className="flex items-start gap-3">
                <span className="w-5 h-5 border border-white/15 flex items-center justify-center shrink-0
                                 text-[11px] tracking-widest text-white/25 mt-0.5">{step.n}</span>
                <p className="text-sm font-light text-white/35 leading-relaxed">{step.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Botão Registar ── */}
        <button
          onClick={openForm}
          className="w-full mb-8 relative overflow-hidden border border-white/20 hover:border-white/40
                     bg-white/[0.03] hover:bg-white/[0.07] px-6 py-5 transition-all duration-300 group"
        >
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 border border-white/15 flex items-center justify-center shrink-0
                              group-hover:border-white/30 transition-colors">
                <svg className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                </svg>
              </div>
              <div className="text-left">
                <p className="text-sm tracking-[0.5em] text-white/60 group-hover:text-white/85 uppercase font-medium transition-colors">
                  Registar Pagamento
                </p>
                <p className="text-sm text-white/25 group-hover:text-white/40 mt-0.5 transition-colors">
                  Submete o comprovativo e regista o valor pago
                </p>
              </div>
            </div>
            <span className="text-white/20 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all">→</span>
          </div>
        </button>

        {/* ── Resumo ── */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          <div className="border border-white/[0.07] bg-white/[0.02] px-4 py-5 text-center">
            <p className="text-sm tracking-[0.4em] text-white/25 uppercase mb-1">Total</p>
            <p className="text-sm tracking-[0.1em] text-white/65 font-light">{total.toLocaleString('pt-PT')} €</p>
            <p className="text-[10px] tracking-[0.3em] text-white/15 uppercase mt-1">Serviço</p>
          </div>
          <div className={`border px-4 py-5 text-center ${pago > 0 ? 'border-emerald-400/20 bg-emerald-400/[0.03]' : 'border-white/[0.07] bg-white/[0.02]'}`}>
            <p className="text-sm tracking-[0.4em] text-white/25 uppercase mb-1">Pago</p>
            <p className={`text-sm tracking-[0.1em] font-light ${pago > 0 ? 'text-emerald-400/80' : 'text-white/65'}`}>
              {pago.toLocaleString('pt-PT')} €
            </p>
            <p className="text-[10px] tracking-[0.3em] text-white/15 uppercase mt-1">{registos.length} registo{registos.length !== 1 ? 's' : ''}</p>
          </div>
          <div className={`border px-4 py-5 text-center ${restante > 0 ? 'border-white/[0.07] bg-white/[0.02]' : 'border-emerald-400/20 bg-emerald-400/[0.03]'}`}>
            <p className="text-sm tracking-[0.4em] text-white/25 uppercase mb-1">Restante</p>
            <p className={`text-sm tracking-[0.1em] font-light ${restante > 0 ? 'text-white/65' : 'text-emerald-400/80'}`}>
              {restante.toLocaleString('pt-PT')} €
            </p>
            <p className="text-[10px] tracking-[0.3em] text-white/15 uppercase mt-1">{restante === 0 ? 'Liquidado' : 'Em falta'}</p>
          </div>
        </div>

        {/* ── Histórico de pagamentos registados ── */}
        {registos.length > 0 && (
          <div className="mb-10">
            <p className="text-[11px] tracking-[0.5em] text-white/20 uppercase mb-3">Histórico de Pagamentos</p>
            <div className="flex flex-col gap-2">
              {[...registos].reverse().map((r, i) => (
                <div key={i} className="border border-emerald-400/15 bg-emerald-400/[0.02] px-5 py-3.5
                                        flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/50 shrink-0" />
                    <div>
                      <p className="text-sm tracking-[0.2em] text-white/55">{r.data}</p>
                      {r.fase && (
                        <p className="text-[11px] tracking-[0.3em] text-white/25 uppercase mt-0.5">
                          {r.fase}{r.metodo ? ` · ${r.metodo}` : ''}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm tracking-[0.15em] text-emerald-400/80 font-light">
                      {r.valor.toLocaleString('pt-PT')} €
                    </p>
                    {r.comprativoUrl && (
                      <a href={r.comprativoUrl} target="_blank" rel="noopener noreferrer"
                        className="text-[10px] tracking-[0.3em] text-white/25 hover:text-white/50 uppercase transition-colors">
                        Ver comprovativo ↗
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Plano de Pagamento (admin edita) ── */}
        <div className="mb-6">
          <p className="text-[11px] tracking-[0.5em] text-white/20 uppercase mb-3">Plano de Pagamento</p>
          <div className="flex flex-col gap-3">
            {projeto.pagamentos.map((pag, i) => {
              const cfg = PAG_CFG[pag.estado]
              return (
                <div key={i} className={`border ${cfg.border} ${cfg.bg} px-6 py-4`}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <EditableField
                        value={pag.descricao}
                        isEditing={isEditing}
                        onChange={v => updatePag(i, 'descricao', v)}
                        className="text-sm tracking-[0.2em] text-white/60 uppercase font-medium block"
                        placeholder="Descrição"
                      />
                      <EditableDateField
                        value={pag.data}
                        isEditing={isEditing}
                        onChange={v => updatePag(i, 'data', v)}
                        className="text-sm tracking-[0.2em] text-white/20 mt-0.5 block"
                        placeholder="Data prevista"
                      />
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center justify-end gap-1">
                        <EditableField
                          value={String(pag.valor)}
                          isEditing={isEditing}
                          onChange={v => updatePag(i, 'valor', Number(v) || 0)}
                          type="number"
                          className="text-sm tracking-[0.1em] text-white/60 font-light block text-right"
                        />
                        {!isEditing && <span className="text-sm text-white/60 font-light">€</span>}
                      </div>
                      <div className="mt-1">
                        <EditableSelect
                          value={pag.estado}
                          options={ESTADO_OPTIONS}
                          isEditing={isEditing}
                          onChange={v => updatePag(i, 'estado', v)}
                          className={`text-sm tracking-[0.3em] uppercase ${cfg.color}`}
                        />
                      </div>
                      {isEditing && (
                        <button onClick={() => removePagamento(i)}
                          className="mt-2 text-sm tracking-[0.3em] text-red-400/50 hover:text-red-400/80 uppercase transition-colors">
                          — Remover
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {isEditing && (
            <button onClick={addPagamento}
              className="mt-3 w-full border border-dashed border-white/15 hover:border-white/30 bg-white/[0.01] hover:bg-white/[0.03] py-3
                         text-sm tracking-[0.4em] text-white/30 uppercase transition-colors">
              + Adicionar Linha
            </button>
          )}
        </div>

      </div>

      {isAdmin && (
        <AdminBar isEditing={isEditing} saving={saving}
          onToggle={() => setIsEditing(true)} onSave={save} onCancel={cancel} />
      )}

      {/* ── Modal Registar Pagamento ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(4,8,15,0.92)', backdropFilter: 'blur(6px)' }}>

          <div className="relative w-full max-w-lg border border-white/[0.12] bg-[#04080f]"
            style={{ boxShadow: '0 0 60px rgba(50,110,255,0.08)' }}>

            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            {submitted ? (
              <div className="px-8 py-12 flex flex-col items-center text-center gap-5">
                <div className="w-12 h-12 border border-emerald-400/30 bg-emerald-400/5 flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-400/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm tracking-[0.5em] text-white/65 uppercase mb-2">Pagamento Registado</p>
                  <p className="text-sm text-white/35 leading-relaxed">
                    A informação foi enviada com sucesso para a RL Media.<br />
                    O registo já está visível na página.
                  </p>
                </div>
                <button onClick={closeForm}
                  className="mt-2 border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] px-6 py-2.5
                             text-sm tracking-[0.4em] text-white/45 hover:text-white/70 uppercase transition-all">
                  Fechar
                </button>
              </div>
            ) : (
              <>
                <div className="px-8 pt-7 pb-2 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] tracking-[0.5em] text-white/20 uppercase mb-1">RL Media · {projeto.nome}</p>
                    <h2 className="text-lg font-extralight tracking-[0.3em] text-white/75 uppercase">Registar Pagamento</h2>
                  </div>
                  <button onClick={closeForm}
                    className="w-8 h-8 flex items-center justify-center text-white/25 hover:text-white/60 transition-colors">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>

                <div className="px-8 py-6 flex flex-col gap-4">

                  {/* Empresa + Referência */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] tracking-[0.4em] text-white/25 uppercase block mb-1.5">Empresa</label>
                      <input
                        value={form.empresa}
                        onChange={e => setField('empresa', e.target.value)}
                        className="w-full bg-white/[0.05] border border-white/[0.10] text-white/70 text-sm px-3 py-2.5
                                   outline-none focus:border-white/30 placeholder-white/20 transition-colors"
                        placeholder="Nome da empresa"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] tracking-[0.4em] text-white/25 uppercase block mb-1.5">Referência</label>
                      <input
                        value={form.referencia}
                        readOnly
                        className="w-full bg-white/[0.02] border border-white/[0.06] text-white/35 text-sm px-3 py-2.5
                                   outline-none font-mono tracking-wider cursor-default"
                      />
                    </div>
                  </div>

                  {/* Fase */}
                  <div>
                    <label className="text-[11px] tracking-[0.4em] text-white/25 uppercase block mb-2">Fase do Pagamento</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Adjudicação', 'Reforço', 'Final'].map(f => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setField('fase', f)}
                          className={`py-2.5 border text-sm tracking-[0.3em] uppercase transition-all
                            ${form.fase === f
                              ? 'border-white/40 bg-white/[0.10] text-white/80'
                              : 'border-white/[0.08] bg-white/[0.02] text-white/30 hover:border-white/20 hover:text-white/50'
                            }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Valor + Método */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] tracking-[0.4em] text-white/25 uppercase block mb-1.5">Valor (€)</label>
                      <input
                        type="number"
                        value={form.valor}
                        onChange={e => setField('valor', e.target.value)}
                        min="0"
                        step="0.01"
                        className="w-full bg-white/[0.05] border border-white/[0.10] text-white/70 text-sm px-3 py-2.5
                                   outline-none focus:border-white/30 placeholder-white/20 transition-colors"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] tracking-[0.4em] text-white/25 uppercase block mb-1.5">Método</label>
                      <select
                        value={form.metodo}
                        onChange={e => setField('metodo', e.target.value)}
                        className="w-full bg-white/[0.05] border border-white/[0.10] text-white/70 text-sm px-3 py-2.5
                                   outline-none focus:border-white/30 transition-colors appearance-none cursor-pointer"
                        style={{ background: 'rgba(255,255,255,0.05)' }}
                      >
                        {METODO_OPTIONS.map(m => (
                          <option key={m} value={m} style={{ background: '#04080f' }}>{m}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Data */}
                  <div>
                    <label className="text-[11px] tracking-[0.4em] text-white/25 uppercase block mb-1.5">Data do Pagamento</label>
                    <input
                      type="date"
                      value={form.data}
                      onChange={e => setField('data', e.target.value)}
                      className="w-full bg-white/[0.05] border border-white/[0.10] text-white/70 text-sm px-3 py-2.5
                                 outline-none focus:border-white/30 transition-colors"
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>

                  {/* Comprovativo */}
                  <div>
                    <label className="text-[11px] tracking-[0.4em] text-white/25 uppercase block mb-1.5">
                      Comprovativo <span className="text-white/15 normal-case tracking-normal text-[10px]">(foto ou PDF)</span>
                    </label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border border-dashed border-white/[0.12] hover:border-white/25 bg-white/[0.02]
                                 hover:bg-white/[0.04] px-4 py-5 flex flex-col items-center gap-2 cursor-pointer transition-all"
                    >
                      {form.file ? (
                        <>
                          <svg className="w-5 h-5 text-emerald-400/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                          <p className="text-sm text-white/55">{form.file.name}</p>
                          <p className="text-[11px] text-white/25">{(form.file.size / 1024).toFixed(0)} KB · clica para alterar</p>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 text-white/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
                          </svg>
                          <p className="text-sm text-white/30">Clica para fazer upload</p>
                          <p className="text-[11px] text-white/20">JPG, PNG, PDF</p>
                        </>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={e => setForm(f => ({ ...f, file: e.target.files?.[0] ?? null }))}
                    />
                  </div>

                  {submitError && (
                    <p className="text-sm text-red-400/70 tracking-[0.2em]">{submitError}</p>
                  )}

                  <button
                    onClick={submitPagamento}
                    disabled={submitting || !form.valor}
                    className="mt-1 w-full border border-white/25 hover:border-white/45 bg-white/[0.05] hover:bg-white/[0.10]
                               px-6 py-3.5 text-sm tracking-[0.5em] text-white/55 hover:text-white/85 uppercase
                               transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'A enviar...' : 'Enviar Registo'}
                  </button>
                </div>
              </>
            )}

            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
          </div>
        </div>
      )}
    </>
  )
}
