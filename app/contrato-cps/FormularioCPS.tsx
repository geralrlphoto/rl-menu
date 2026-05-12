'use client'

import { useState } from 'react'
import Link from 'next/link'

// Opções dos selects (default — o admin pode editar e gravamos em settings se necessário)
const PROPOSTAS_DEFAULT = [
  'Proposta 1',
  'Proposta 2',
  'Proposta 3',
]

const SERVICOS_DEFAULT = [
  'Proposta 1',
  'Proposta 2',
  'Proposta 3',
]

type Form = {
  nome_noivos: string
  data_casamento: string
  local_cerimonia: string
  proposta: string
  // Noiva/Mãe
  nome_noiva: string
  morada_noiva: string
  tel_noiva: string
  cc_noiva: string
  nif_noiva: string
  email_noiva: string
  // Noivo/Pai
  nome_noivo: string
  morada_noivo: string
  tel_noivo: string
  cc_noivo: string
  nif_noivo: string
  email_noivo: string
  // Serviço
  servico: string
}

const EMPTY: Form = {
  nome_noivos: '', data_casamento: '', local_cerimonia: '', proposta: '',
  nome_noiva: '', morada_noiva: '', tel_noiva: '', cc_noiva: '', nif_noiva: '', email_noiva: '',
  nome_noivo: '', morada_noivo: '', tel_noivo: '', cc_noivo: '', nif_noivo: '', email_noivo: '',
  servico: '',
}

// ─── Field wrapper premium ────────────────────────────────────────────────────
function Field({
  label, name, value, onChange, type = 'text', required, placeholder,
}: {
  label: string
  name: keyof Form
  value: string
  onChange: (k: keyof Form, v: string) => void
  type?: 'text' | 'email' | 'tel' | 'date'
  required?: boolean
  placeholder?: string
}) {
  return (
    <label className="group block">
      <span className="block text-[10px] tracking-[0.4em] text-gold/55 uppercase mb-2 transition-colors group-focus-within:text-gold">
        {label}{required && <span className="text-gold/80 ml-1">*</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={e => onChange(name, e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full bg-transparent border-b border-white/15 px-0 py-3 text-[15px] text-white/90
                   placeholder:text-white/15 focus:outline-none focus:border-gold/70
                   transition-colors duration-300"
      />
    </label>
  )
}

function Select({
  label, name, value, onChange, options, required,
}: {
  label: string
  name: keyof Form
  value: string
  onChange: (k: keyof Form, v: string) => void
  options: string[]
  required?: boolean
}) {
  return (
    <label className="group block">
      <span className="block text-[10px] tracking-[0.4em] text-gold/55 uppercase mb-2 transition-colors group-focus-within:text-gold">
        {label}{required && <span className="text-gold/80 ml-1">*</span>}
      </span>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(name, e.target.value)}
          required={required}
          className="w-full appearance-none bg-transparent border-b border-white/15 px-0 py-3 pr-8 text-[15px]
                     text-white/90 focus:outline-none focus:border-gold/70 transition-colors cursor-pointer
                     [&>option]:bg-[#0e0b07] [&>option]:text-white"
        >
          <option value="" className="text-white/40">— Seleciona —</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <span className="absolute right-0 top-1/2 -translate-y-1/2 text-gold/50 pointer-events-none text-xs">▾</span>
      </div>
    </label>
  )
}

// ─── Section divider premium ──────────────────────────────────────────────────
function SectionTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mb-10 mt-16 first:mt-0">
      <p className="text-[9px] tracking-[0.5em] text-white/25 uppercase mb-3">{kicker}</p>
      <h2 className="font-cormorant text-[28px] sm:text-[34px] font-light italic text-gold leading-tight">{title}</h2>
      <div className="mt-4 flex items-center gap-3">
        <div className="h-px w-12 bg-gold/50" />
        <div className="h-px flex-1 bg-white/[0.04]" />
      </div>
    </div>
  )
}

export default function FormularioCPS({ sectionName, backHref = '/photo' }: {
  sectionName?: string
  backHref?: string
}) {
  const [form, setForm] = useState<Form>(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function update(k: keyof Form, v: string) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/contrato-cps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      setSuccess(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e: any) {
      setError(e.message ?? 'Erro ao enviar')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Pós-submit: thank you premium ─────────────────────────────────────────
  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-12"
        style={{ background: 'radial-gradient(ellipse at 50% 30%, #2b1b04 0%, #120b02 40%, #080503 100%)' }}>
        <div className="max-w-xl w-full text-center">
          <div className="mx-auto mb-8 w-16 h-16 rounded-full border-[1.5px] border-gold/70 flex items-center justify-center text-gold text-2xl">
            ✓
          </div>
          <p className="text-[10px] tracking-[0.5em] text-gold/50 uppercase mb-4">Confirmado</p>
          <h1 className="font-cormorant text-5xl sm:text-6xl font-light tracking-wide text-white/95 mb-3 leading-tight">
            Dados recebidos.
          </h1>
          <p className="font-cormorant text-2xl italic text-gold/80 mb-8 font-light">
            Obrigado pela vossa confiança.
          </p>
          <div className="mx-auto h-px w-24 bg-gold/40 mb-8" />
          <p className="font-cormorant text-lg text-white/50 leading-relaxed mb-10 italic font-light">
            Recebemos os vossos dados para o contrato.<br/>
            Em breve entraremos em contacto para os próximos passos.
          </p>
          <Link href={backHref}
            className="inline-block text-[10px] tracking-[0.4em] text-white/40 hover:text-gold uppercase transition-colors">
            ‹ Voltar
          </Link>
        </div>
      </main>
    )
  }

  // ─── Form principal ────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen px-4 py-10 sm:py-16"
      style={{ background: 'radial-gradient(ellipse at 50% 20%, #1f1404 0%, #100a02 45%, #060402 100%)' }}>
      <div className="max-w-2xl mx-auto">

        {/* Voltar */}
        <Link href={backHref}
          className="inline-flex items-center gap-2 text-[10px] tracking-[0.35em] text-white/30 hover:text-gold transition-colors mb-12 uppercase">
          ‹ Voltar
        </Link>

        {/* Hero */}
        <header className="mb-16 text-center">
          <p className="text-[9px] tracking-[0.5em] text-gold/40 uppercase mb-4">RL PHOTO.VIDEO</p>
          <h1 className="font-cormorant text-5xl sm:text-6xl font-light tracking-wide text-white/95 leading-[1.05] mb-4">
            Dados para
            <br/>
            <span className="italic text-gold">Contrato CPS</span>
          </h1>
          <div className="mx-auto h-px w-16 bg-gold/50 my-6" />
          <p className="font-cormorant text-[19px] sm:text-[21px] text-white/65 leading-[1.7] max-w-lg mx-auto font-light">
            <span className="italic text-gold/80">Caros noivos / pais,</span><br/>
            espero que se encontrem bem. Quero expressar o nosso sincero <em className="text-white/85">muito obrigado</em> pela confiança que depositaram na nossa equipa ao escolher os nossos serviços.
          </p>
          <p className="font-cormorant mt-6 text-[17px] sm:text-[18px] text-white/50 leading-[1.7] max-w-lg mx-auto italic font-light">
            Para preparar o contrato, precisamos de alguns dados. Preencham o formulário abaixo da forma mais completa possível — nomes completos, moradas com código postal e quaisquer serviços extras pretendidos.
          </p>
          {sectionName && (
            <p className="mt-8 text-[10px] tracking-[0.4em] text-white/20 uppercase">
              {sectionName}
            </p>
          )}
        </header>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Dados Gerais ── */}
          <SectionTitle kicker="Secção 01" title="Dados Gerais" />
          <Field label="Nome dos Noivos / Pais" name="nome_noivos" value={form.nome_noivos} onChange={update} required placeholder="Ex.: Ana e João" />
          <Field label="Data do Casamento / Batizado" name="data_casamento" value={form.data_casamento} onChange={update} type="date" required />
          <Field label="Local da Cerimónia (Igreja + Quinta)" name="local_cerimonia" value={form.local_cerimonia} onChange={update} required placeholder="Ex.: Igreja de São José + Quinta dos Lagos" />
          <Select label="Proposta Escolhida" name="proposta" value={form.proposta} onChange={update} options={PROPOSTAS_DEFAULT} required />

          {/* ── Noiva/Mãe ── */}
          <SectionTitle kicker="Secção 02" title="Dados da Noiva / Mãe" />
          <Field label="Nome da Noiva / Mãe" name="nome_noiva" value={form.nome_noiva} onChange={update} required />
          <Field label="Morada Completa da Noiva / Mãe" name="morada_noiva" value={form.morada_noiva} onChange={update} required placeholder="Rua, número, código postal, localidade" />
          <Field label="Contato Noiva / Mãe" name="tel_noiva" value={form.tel_noiva} onChange={update} type="tel" required placeholder="+351 9XX XXX XXX" />
          <Field label="N.º C. de Cidadão Noiva / Mãe" name="cc_noiva" value={form.cc_noiva} onChange={update} required />
          <Field label="N.º Iden. Fiscal Noiva / Mãe" name="nif_noiva" value={form.nif_noiva} onChange={update} required />
          <Field label="E-mail Noiva / Mãe" name="email_noiva" value={form.email_noiva} onChange={update} type="email" required />

          {/* ── Noivo/Pai ── */}
          <SectionTitle kicker="Secção 03" title="Dados do Noivo / Pai" />
          <Field label="Nome do Noivo / Pai" name="nome_noivo" value={form.nome_noivo} onChange={update} required />
          <Field label="Morada Completa do Noivo / Pai" name="morada_noivo" value={form.morada_noivo} onChange={update} required placeholder="Rua, número, código postal, localidade" />
          <Field label="Contato do Noivo / Pai" name="tel_noivo" value={form.tel_noivo} onChange={update} type="tel" required placeholder="+351 9XX XXX XXX" />
          <Field label="N.º C. Cidadão Noivo / Pai" name="cc_noivo" value={form.cc_noivo} onChange={update} required />
          <Field label="N.º Ide. Fiscal Noivo / Pai" name="nif_noivo" value={form.nif_noivo} onChange={update} required />
          <Field label="E-mail do Noivo / Pai" name="email_noivo" value={form.email_noivo} onChange={update} type="email" required />

          {/* ── Serviço ── */}
          <SectionTitle kicker="Secção 04" title="Serviço Pretendido" />
          <Select label="Serviço Pretendido" name="servico" value={form.servico} onChange={update} options={SERVICOS_DEFAULT} required />

          {/* ── Submit ── */}
          <div className="pt-12 pb-8">
            {error && (
              <div className="mb-6 p-4 border border-red-500/30 bg-red-500/[0.04] text-red-400/80 text-[13px] text-center rounded">
                {error}
              </div>
            )}
            <button type="submit" disabled={submitting}
              className="group relative w-full overflow-hidden border border-gold/40 bg-gradient-to-r from-gold/[0.08] via-gold/[0.04] to-gold/[0.08]
                         hover:from-gold/[0.15] hover:via-gold/[0.08] hover:to-gold/[0.15]
                         px-10 py-5 text-[12px] tracking-[0.4em] text-gold uppercase
                         transition-all duration-500 disabled:opacity-40 disabled:cursor-not-allowed">
              <span className="relative z-10">
                {submitting ? 'A enviar...' : 'Enviar Dados'}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/10 to-transparent
                              -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </button>
            <p className="mt-6 text-center text-[10px] tracking-[0.3em] text-white/20 uppercase">
              Os vossos dados são tratados com confidencialidade
            </p>
          </div>
        </form>
      </div>
    </main>
  )
}
