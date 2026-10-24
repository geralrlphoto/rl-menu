'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import type { Projeto, RegistoPagamento } from '@/app/portal-media/_data/mockProject'
import AdminBar from './AdminBar'
import EditableField from './EditableField'
import EditableSelect from './EditableSelect'
import EditableDateField from './EditableDateField'
import HeroUploadBlock from './HeroUploadBlock'

/* ── Identidade rlprod.pt ── */
const CARTAO    = 'rounded-2xl border border-white/[0.1] bg-[#00141f]/70'
const TILE      = 'rounded-xl border border-white/[0.08] bg-[#0c2236]/70'
const LABEL     = 'rlp-m text-[9.5px] text-white/45 block mb-1.5'
const INPUT     = 'w-full rounded-md border border-white/[0.12] bg-[#00141f]/70 px-4 py-3 text-[14px] text-white/90 outline-none focus:border-[#2e6cf6] placeholder:text-white/30 transition-colors'
const BTN_AZUL  = 'rounded-full bg-[#2e6cf6] hover:bg-[#3d79ff] px-6 py-3 text-[13.5px] font-medium text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
const BTN_LINHA = 'rounded-full border border-white/25 hover:border-white/50 px-5 py-3 text-[13.5px] text-white/85 hover:text-white transition-colors'

const PAG_CFG = {
  pago:      { label: 'Pago',      pill: 'border-[#2e6cf6]/60 bg-[#2e6cf6]/15 text-[#a9c1ff]', card: 'border-[#2e6cf6]/30 bg-[#00141f]/70', dot: 'border-[#2e6cf6] bg-[#2e6cf6] text-white' },
  pendente:  { label: 'Pendente',  pill: 'border-[#7c8893]/50 text-[#7c8893]',                 card: 'border-white/[0.1] bg-[#00141f]/70',   dot: 'border-[#7c8893]/60 bg-[#0c2236] text-[#7c8893]' },
  em_atraso: { label: 'Em Atraso', pill: 'border-[#ff4747]/60 bg-[#ff4747]/10 text-[#ff4747]', card: 'border-[#ff4747]/50 bg-[#ff4747]/[0.06]', dot: 'border-[#ff4747] bg-[#0c2236] text-[#ff4747]' },
}

const eur = (n: number) => `${n.toLocaleString('pt-PT')} €`

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
  const pct      = total > 0 ? Math.min(100, Math.round((pago / total) * 100)) : 0
  const emAtraso = projeto.pagamentos.filter(pg => pg.estado === 'em_atraso')
  const valorAtraso = emAtraso.reduce((s, pg) => s + pg.valor, 0)

  // Mesmos valores por defeito da página Contrato
  const iban    = projeto.contaBancaria?.iban    ?? 'PT50 0036 0167 9910 0068 3001 0'
  const titular = projeto.contaBancaria?.titular ?? 'Liliana Sofia Barreto Gonçalves'

  return (
    <>
      <HeroUploadBlock url={heroUrl} isEditing={isEditing} onChange={setHeroUrl} />

      <div className="rlp relative z-10 max-w-3xl mx-auto px-4 sm:px-8 py-8 sm:py-12 text-white">

        <Link href={`/portal-media/${projeto.ref}`}
          className="rlp-m inline-flex items-center gap-2 text-[10.5px] text-white/45 hover:text-white transition-colors mb-10 group">
          <span className="group-hover:-translate-x-1 transition-transform duration-200">‹</span>
          Portal {projeto.nome}
        </Link>

        {/* ── Cabeçalho ── */}
        <header className="mb-8">
          <p className="rlp-m traco text-[10.5px] text-[#5a8bff]">RL Prod · {projeto.nome}</p>
          <h1 className="rlp-t mt-3 text-[44px] sm:text-[60px] leading-[0.95]">Pagamentos</h1>
          <p className="mt-3 text-[15px] text-white/60 leading-relaxed max-w-xl">
            O registo oficial dos pagamentos do vosso projeto. Acompanhem aqui o que já está liquidado e o que falta.
          </p>
        </header>

        {/* ── Resumo: total, pago, em falta ── */}
        <section className={`${CARTAO} p-4 sm:p-6 mb-4`}>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className={`${TILE} px-3 py-4 sm:px-4`}>
              <p className="rlp-m text-[8.5px] sm:text-[9.5px] text-white/45">Total</p>
              <p className="rlp-t mt-2 text-[19px] sm:text-[28px] leading-none text-white">{eur(total)}</p>
              <p className="mt-1.5 text-[12px] text-white/40">Serviço</p>
            </div>
            <div className={`${TILE} px-3 py-4 sm:px-4`}>
              <p className="rlp-m text-[8.5px] sm:text-[9.5px] text-white/45">Pago</p>
              <p className="rlp-t mt-2 text-[19px] sm:text-[28px] leading-none text-[#5a8bff]">{eur(pago)}</p>
              <p className="mt-1.5 text-[12px] text-white/40">{registos.length} registo{registos.length !== 1 ? 's' : ''}</p>
            </div>
            <div className={`${TILE} px-3 py-4 sm:px-4`}>
              <p className="rlp-m text-[8.5px] sm:text-[9.5px] text-white/45">Em falta</p>
              <p className={`rlp-t mt-2 text-[19px] sm:text-[28px] leading-none ${restante === 0 ? 'text-[#a9c1ff]' : 'text-white'}`}>{eur(restante)}</p>
              <p className="mt-1.5 text-[12px] text-white/40">{restante === 0 ? 'Liquidado' : 'Por pagar'}</p>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-baseline justify-between mb-2">
              <p className="rlp-m text-[9.5px] text-white/45">Progresso</p>
              <p className="rlp-t text-[18px] leading-none text-white">
                {pct}%<span className="ml-1.5 text-[12px] font-normal normal-case text-white/45">pago</span>
              </p>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
              <div className="h-full rounded-full bg-[#2e6cf6] transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
          </div>

          {emAtraso.length > 0 && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-[#ff4747]/40 bg-[#ff4747]/[0.08] px-4 py-3">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#ff4747]" />
              <p className="text-[14px] text-white/80 leading-relaxed">
                {emAtraso.length === 1 ? 'Há 1 prestação em atraso' : `Há ${emAtraso.length} prestações em atraso`}
                {valorAtraso > 0 && <> no valor de <span className="text-[#ff4747] font-medium">{eur(valorAtraso)}</span></>}.
                {' '}Se já pagaram, registem o pagamento abaixo.
              </p>
            </div>
          )}
        </section>

        {/* ── Registar Pagamento ── */}
        <button
          onClick={openForm}
          className="w-full mb-10 rounded-2xl border border-[#2e6cf6]/60 hover:border-[#2e6cf6] bg-[#2e6cf6]/[0.12] hover:bg-[#2e6cf6]/[0.2]
                     px-4 py-4 sm:px-6 sm:py-5 transition-colors group text-left"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#2e6cf6] flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                </svg>
              </div>
              <div>
                <p className="rlp-t text-[19px] sm:text-[21px] leading-none text-white">Registar Pagamento</p>
                <p className="text-[14px] text-white/55 mt-1.5">Submetam o comprovativo e o valor pago</p>
              </div>
            </div>
            <span className="text-[#a9c1ff] group-hover:translate-x-0.5 transition-transform">→</span>
          </div>
        </button>

        {/* ── Plano de Pagamento (admin edita) ── */}
        <section className="mb-10">
          <p className="rlp-m traco text-[10.5px] text-[#5a8bff]">Prestações</p>
          <h2 className="rlp-t mt-1 mb-4 text-[24px]">Plano de pagamento</h2>

          {projeto.pagamentos.length === 0 && !isEditing && (
            <div className={`${CARTAO} px-5 py-6 text-center`}>
              <p className="rlp-m text-[10px] text-white/40">Plano ainda por definir</p>
            </div>
          )}

          <ol className="relative flex flex-col gap-3">
            {projeto.pagamentos.length > 1 && (
              <span aria-hidden className="absolute left-[15px] top-8 bottom-8 w-px bg-white/[0.12]" />
            )}
            {projeto.pagamentos.map((pag, i) => {
              const cfg = PAG_CFG[pag.estado]
              const corValor = pag.estado === 'em_atraso' ? 'text-[#ff4747]' : 'text-white'
              return (
                <li key={i} className="relative flex gap-3 sm:gap-4">
                  <span className={`relative z-[1] mt-4 flex h-[31px] w-[31px] shrink-0 items-center justify-center rounded-full border-2 ${cfg.dot}`}>
                    {pag.estado === 'pago' ? (
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                    ) : (
                      <span className="rlp-m text-[9.5px] tracking-normal">{i + 1}</span>
                    )}
                  </span>
                  <div className={`flex-1 min-w-0 rounded-2xl border ${cfg.card} px-4 py-4 sm:px-5`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <EditableField
                          value={pag.descricao}
                          isEditing={isEditing}
                          onChange={v => updatePag(i, 'descricao', v)}
                          className="rlp-t text-[17px] sm:text-[18px] leading-tight text-white block"
                          placeholder="Descrição"
                        />
                        <EditableDateField
                          value={pag.data}
                          isEditing={isEditing}
                          onChange={v => updatePag(i, 'data', v)}
                          className="text-[13px] text-white/50 mt-1 block"
                          placeholder="Data prevista"
                        />
                      </div>
                      <div className="text-right shrink-0 flex flex-col items-end gap-2">
                        <div className="flex items-center justify-end gap-1">
                          <EditableField
                            value={String(pag.valor)}
                            isEditing={isEditing}
                            onChange={v => updatePag(i, 'valor', Number(v) || 0)}
                            type="number"
                            className={`rlp-t text-[20px] leading-none block text-right ${corValor}`}
                          />
                          {!isEditing && <span className={`rlp-t text-[20px] leading-none ${corValor}`}>€</span>}
                        </div>
                        {isEditing ? (
                          <EditableSelect
                            value={pag.estado}
                            options={ESTADO_OPTIONS}
                            isEditing={isEditing}
                            onChange={v => updatePag(i, 'estado', v)}
                            className="text-[13px]"
                          />
                        ) : (
                          <span className={`rlp-m text-[8.5px] tracking-[0.2em] px-2.5 py-1 border rounded-full ${cfg.pill}`}>
                            {cfg.label}
                          </span>
                        )}
                        {isEditing && (
                          <button onClick={() => removePagamento(i)}
                            className="rlp-m text-[9.5px] text-[#ff4747]/70 hover:text-[#ff4747] transition-colors">
                            Remover
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>

          {isEditing && (
            <button onClick={addPagamento}
              className="rlp-m mt-3 w-full rounded-2xl border border-dashed border-white/20 hover:border-[#2e6cf6] py-3.5
                         text-[10px] text-white/55 hover:text-white transition-colors">
              + Adicionar linha
            </button>
          )}
        </section>

        {/* ── Histórico de pagamentos registados ── */}
        {registos.length > 0 && (
          <section className="mb-10">
            <p className="rlp-m traco text-[10.5px] text-[#5a8bff]">Recebido</p>
            <h2 className="rlp-t mt-1 mb-4 text-[24px]">Histórico de pagamentos</h2>
            <div className={`${CARTAO} divide-y divide-white/[0.07] overflow-hidden`}>
              {[...registos].reverse().map((r, i) => (
                <div key={i} className="px-4 py-3.5 sm:px-5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-[#2e6cf6] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[14.5px] text-white/85">{r.data}</p>
                      {r.fase && (
                        <p className="rlp-m text-[9px] tracking-[0.2em] text-white/45 mt-1 truncate">
                          {r.fase}{r.metodo ? ` · ${r.metodo}` : ''}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="rlp-t text-[19px] leading-none text-[#5a8bff]">{eur(r.valor)}</p>
                    {r.comprativoUrl && (
                      <a href={r.comprativoUrl} target="_blank" rel="noopener noreferrer"
                        className="mt-1.5 inline-block text-[12.5px] text-[#a9c1ff]/80 hover:text-white underline underline-offset-2 transition-colors">
                        Ver comprovativo ↗
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Dados para pagamento ── */}
        <section className={`${CARTAO} p-4 sm:p-6 mb-4`}>
          <p className="rlp-m traco text-[10.5px] text-[#5a8bff]">Transferência</p>
          <h2 className="rlp-t mt-1 mb-4 text-[22px]">Dados para pagamento</h2>
          <div className="flex flex-col gap-2.5">
            {iban && <LinhaCopiar label="IBAN" valor={iban} />}
            <LinhaCopiar label="Referência" valor={projeto.ref} />
            {titular && (
              <div className={`${TILE} px-4 py-3`}>
                <p className="rlp-m text-[9.5px] text-white/45">Titular</p>
                <p className="mt-1 text-[15px] text-white/85">{titular}</p>
              </div>
            )}
          </div>
          <p className="mt-3 text-[13px] text-white/45 leading-relaxed">Indiquem a referência no descritivo da transferência.</p>
        </section>

        {/* ── Como funciona ── */}
        <section className={`${CARTAO} p-4 sm:p-6`}>
          <p className="rlp-m traco text-[10.5px] text-[#5a8bff]">Como funciona</p>
          <p className="mt-3 text-[15px] text-white/65 leading-relaxed">
            Sempre que efetuarem um pagamento (adjudicação, reforço ou valor final), registem-no aqui. Fica documentado e a nossa equipa é notificada de imediato.
          </p>
          <ol className="mt-4 flex flex-col gap-2.5">
            {[
              { n: '1', text: 'Cliquem em «Registar Pagamento»' },
              { n: '2', text: 'Preencham o valor, o método e a data do pagamento' },
              { n: '3', text: 'Anexem o comprovativo (transferência, MB Way, etc.)' },
              { n: '4', text: 'Cliquem em Enviar. A equipa RL PROD recebe a confirmação' },
            ].map(step => (
              <li key={step.n} className="flex items-start gap-3">
                <span className="rlp-m w-6 h-6 rounded-full border border-[#2e6cf6]/60 text-[#a9c1ff] flex items-center justify-center shrink-0
                                 text-[9.5px] tracking-normal mt-px">{step.n}</span>
                <p className="text-[14.5px] text-white/65 leading-relaxed">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

      </div>

      {isAdmin && (
        <AdminBar isEditing={isEditing} saving={saving}
          onToggle={() => setIsEditing(true)} onSave={save} onCancel={cancel} />
      )}

      {/* ── Modal Registar Pagamento ── */}
      {showForm && (
        <div className="rlp fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-[#00141f]/90 overflow-y-auto">

          <div className="relative w-full max-w-lg my-auto rounded-2xl border border-white/[0.12] bg-[#0c2236] text-white">

            {submitted ? (
              <div className="px-6 sm:px-8 py-12 flex flex-col items-center text-center gap-5">
                <div className="w-12 h-12 rounded-full bg-[#2e6cf6] flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <div>
                  <p className="rlp-t text-[24px] leading-none mb-3">Pagamento registado</p>
                  <p className="text-[15px] text-white/60 leading-relaxed">
                    A informação foi enviada com sucesso para a RL PROD.<br />
                    O registo já está visível na página.
                  </p>
                </div>
                <button onClick={closeForm} className={BTN_LINHA}>
                  Fechar
                </button>
              </div>
            ) : (
              <>
                <div className="px-5 sm:px-8 pt-5 sm:pt-7 pb-2 flex items-start justify-between gap-3">
                  <div>
                    <p className="rlp-m traco text-[10px] text-[#5a8bff]">RL Prod · {projeto.nome}</p>
                    <h2 className="rlp-t mt-2 text-[26px] leading-none">Registar Pagamento</h2>
                  </div>
                  <button onClick={closeForm} aria-label="Fechar"
                    className="w-9 h-9 rounded-full border border-white/[0.12] flex items-center justify-center text-white/55 hover:text-white hover:border-white/40 transition-colors shrink-0">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>

                <div className="px-5 sm:px-8 py-5 sm:py-6 flex flex-col gap-4">

                  {/* Empresa + Referência */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className={LABEL}>Empresa</label>
                      <input
                        value={form.empresa}
                        onChange={e => setField('empresa', e.target.value)}
                        className={INPUT}
                        placeholder="Nome da empresa"
                      />
                    </div>
                    <div>
                      <label className={LABEL}>Referência</label>
                      <input
                        value={form.referencia}
                        readOnly
                        className="w-full rounded-md border border-white/[0.08] bg-[#00141f]/40 px-4 py-3 text-[14px] text-white/55
                                   outline-none font-mono tracking-wider cursor-default"
                      />
                    </div>
                  </div>

                  {/* Fase */}
                  <div>
                    <label className={LABEL}>Fase do pagamento</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Adjudicação', 'Reforço', 'Final'].map(f => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setField('fase', f)}
                          className={`rounded-full py-2.5 border text-[13px] transition-colors
                            ${form.fase === f
                              ? 'border-[#2e6cf6] bg-[#2e6cf6] text-white'
                              : 'border-white/[0.12] bg-[#00141f]/50 text-white/60 hover:text-white hover:border-white/30'
                            }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Valor + Método */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className={LABEL}>Valor (€)</label>
                      <input
                        type="number"
                        value={form.valor}
                        onChange={e => setField('valor', e.target.value)}
                        min="0"
                        step="0.01"
                        className={INPUT}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className={LABEL}>Método</label>
                      <select
                        value={form.metodo}
                        onChange={e => setField('metodo', e.target.value)}
                        className={`${INPUT} appearance-none cursor-pointer [color-scheme:dark]`}
                      >
                        {METODO_OPTIONS.map(m => (
                          <option key={m} value={m} style={{ background: '#00141f' }}>{m}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Data */}
                  <div>
                    <label className={LABEL}>Data do pagamento</label>
                    <input
                      type="date"
                      value={form.data}
                      onChange={e => setField('data', e.target.value)}
                      className={`${INPUT} [color-scheme:dark]`}
                    />
                  </div>

                  {/* Comprovativo */}
                  <div>
                    <label className={LABEL}>
                      Comprovativo <span className="normal-case tracking-normal text-white/35">(foto ou PDF)</span>
                    </label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-full rounded-xl border border-dashed px-4 py-5 flex flex-col items-center gap-1.5 cursor-pointer transition-colors
                        ${form.file ? 'border-[#2e6cf6]/70 bg-[#2e6cf6]/[0.08]' : 'border-white/[0.18] hover:border-[#2e6cf6]/70 bg-[#00141f]/50'}`}
                    >
                      {form.file ? (
                        <>
                          <svg className="w-5 h-5 text-[#5a8bff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                          <p className="text-[14px] text-white/85 break-all text-center">{form.file.name}</p>
                          <p className="text-[13px] text-white/45">{(form.file.size / 1024).toFixed(0)} KB · clica para alterar</p>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 text-white/45" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
                          </svg>
                          <p className="text-[14px] text-white/70">Clica para fazer upload</p>
                          <p className="text-[13px] text-white/40">JPG, PNG, PDF</p>
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
                    <p className="text-[14px] text-[#ff4747]">{submitError}</p>
                  )}

                  <button
                    onClick={submitPagamento}
                    disabled={submitting || !form.valor}
                    className={`${BTN_AZUL} mt-1 w-full`}
                  >
                    {submitting ? 'A enviar...' : 'Enviar registo'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

/* ── Linha com botão de copiar (IBAN, referência) ── */
function LinhaCopiar({ label, valor }: { label: string; valor: string }) {
  const [copiado, setCopiado] = useState(false)
  const copiar = async () => {
    try {
      // O IBAN copia-se sem espaços para colar direto no homebanking
      await navigator.clipboard.writeText(label === 'IBAN' ? valor.replace(/\s+/g, '') : valor.trim())
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1800)
    } catch {}
  }
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0c2236]/70 px-4 py-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="rlp-m text-[9.5px] text-white/45">{label}</p>
        <p className="mt-1 text-[14.5px] sm:text-[16px] text-white break-all font-mono tracking-wide">{valor}</p>
      </div>
      <button type="button" onClick={copiar}
        className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[12.5px] transition-colors ${
          copiado ? 'border-[#2e6cf6] bg-[#2e6cf6] text-white' : 'border-white/20 text-white/75 hover:border-[#2e6cf6] hover:text-white'
        }`}>
        {copiado ? 'Copiado' : 'Copiar'}
      </button>
    </div>
  )
}
