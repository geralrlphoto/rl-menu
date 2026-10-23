'use client'

import { useEffect, useState } from 'react'
import EstiloRLProd from '@/app/media/_components/EstiloRLProd'
import { FUNDO } from '@/app/media/_lib/estilo'

// Formulário público de pedido de orçamento da RL PROD (cores e letras do rlprod.pt)

const TIPOS = [
  'Vídeo Institucional',
  'Produção Photography & Video',
  'Vídeo Casamento',
  'Vídeo Evento',
  'Fotografia Comercial',
  'Fotografia Produto',
  'Fotografia Evento',
  'Social Media',
  'Outro',
]

const FONTES = [
  'Instagram',
  'Website',
  'Referência / Boca-a-boca',
  'Google',
  'LinkedIn',
  'Email',
  'Telefone',
  'Outro',
]

const EMPTY = {
  nome: '',
  empresa: '',
  email: '',
  telefone: '',
  ramo: '',
  website: '',
  instagram: '',
  tipo: '',
  fonte: '',
  mensagem: '',
  estado: 'Novo',
}

// Contactos reais da RL Prod (os mesmos de /boas-vindas)
const WHATSAPP = 'https://wa.me/351912932768'
const EMAIL = 'geral.rlprod@gmail.com'

const PASSOS = [
  { t: 'Recebemos o pedido', s: 'Analisamos os detalhes do teu projeto.' },
  { t: 'Preparamos a proposta', s: 'Uma proposta pensada para a tua marca.' },
  { t: 'Enviamos em até 24h', s: 'Por email ou WhatsApp, como preferires.' },
  { t: 'Começamos a criar', s: 'Depois da aprovação, pomos tudo em marcha.' },
]

export default function NovaLeadPage() {
  const [form, setForm]       = useState(EMPTY)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [enviado, setEnviado] = useState(false)
  // ?interno=1 → lead registada pela equipa a partir do CRM: sem emails, só o nome é obrigatório
  const [interno, setInterno] = useState(false)
  useEffect(() => { setInterno(new URLSearchParams(window.location.search).has('interno')) }, [])

  const set = (k: keyof typeof EMPTY) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim())     { setError('O nome é obrigatório.'); return }
    if (interno) {
      if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) { setError('Email inválido.'); return }
      return enviar()
    }
    if (!form.empresa.trim())  { setError('A empresa é obrigatória.'); return }
    if (!form.email.trim())    { setError('O email é obrigatório.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) { setError('Email inválido.'); return }
    if (!form.telefone.trim()) { setError('O telefone é obrigatório.'); return }
    if (!form.tipo)            { setError('Escolhe o tipo de serviço.'); return }
    if (!form.fonte)           { setError('Indica como nos encontraste.'); return }
    if (!form.mensagem.trim()) { setError('Conta-nos um pouco sobre o projeto.'); return }
    return enviar()
  }

  async function enviar() {
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/media-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, interno }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setEnviado(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar.')
      setSaving(false)
    }
  }

  const labelCls = 'rlp-m block text-[10.5px] text-white/55 mb-2.5'
  const inputCls = 'w-full rounded-md border border-white/[0.12] bg-[#00141f]/70 px-4 py-3.5 text-[16px] text-white placeholder:text-white/30 focus:outline-none focus:border-[#2e6cf6] focus:bg-[#00141f] transition-colors'
  const chip = (ativo: boolean) =>
    `rounded-full border px-4 py-2 text-[13.5px] transition-colors ${ativo
      ? 'border-[#2e6cf6] bg-[#2e6cf6] text-white'
      : 'border-white/[0.14] bg-white/[0.03] text-white/75 hover:border-[#5a8bff]/70 hover:text-white'}`

  const Fundo = () => (
    <div className="pointer-events-none fixed inset-0 z-0" style={{ background: FUNDO }} />
  )

  // ── Sucesso de uma lead registada no CRM ──────────────────────────────────
  if (enviado && interno) {
    return (
      <main className="rlp min-h-screen relative flex items-center justify-center text-white" style={{ background: '#00141f' }}>
        <EstiloRLProd />
        <Fundo />
        <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg">
          <span className="w-14 h-14 rounded-full flex items-center justify-center mb-6 bg-[#2e6cf6]">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
          </span>
          <p className="rlp-m traco text-[11px] text-[#5a8bff] mb-3">CRM</p>
          <h1 className="rlp-t text-[44px] sm:text-[56px] leading-[1]">Lead registada.</h1>
          <p className="mt-4 text-[15px] text-white/60">{form.empresa || form.nome} já está no CRM, no estado Novo. Não foi enviado nenhum email.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="/media/crm/leads" className="rounded-md bg-[#2e6cf6] hover:bg-[#3d79ff] px-6 py-3 text-[14px] font-medium">Ver as leads →</a>
            <button onClick={() => { setForm(EMPTY); setEnviado(false); setSaving(false) }}
              className="rounded-md border border-white/25 hover:border-white/50 px-6 py-3 text-[14px]">Registar outra</button>
          </div>
        </div>
      </main>
    )
  }

  // ── Ecrã de sucesso ────────────────────────────────────────────────────────
  if (enviado) {
    return (
      <main className="rlp min-h-screen relative flex items-center justify-center text-white" style={{ background: '#00141f' }}>
        <EstiloRLProd />
        <Fundo />
        <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-rl-prod-branco.png" alt="RL PROD" className="w-20 h-20 object-contain mb-8" />
          <span className="w-14 h-14 rounded-full flex items-center justify-center mb-6 bg-[#2e6cf6]">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
          </span>
          <p className="rlp-m traco text-[11px] text-[#5a8bff] mb-3">Pedido recebido</p>
          <h1 className="rlp-t text-[44px] sm:text-[56px] leading-[1]">
            Obrigado.<br /><span className="text-[#5a8bff]">Falamos em breve.</span>
          </h1>
          <p className="mt-5 text-[16px] text-white/65 leading-relaxed">
            Recebemos o teu contacto. Respondemos em até 24h com uma proposta à medida do teu projeto.
          </p>
          <a href="https://rlprod.pt" className="rlp-m mt-8 text-[11px] text-white/60 hover:text-white border-b border-white/30 pb-1">
            Voltar ao site →
          </a>
        </div>
      </main>
    )
  }

  return (
    <main className="rlp min-h-screen relative text-white" style={{ background: '#00141f' }}>
      <EstiloRLProd />
      <Fundo />

      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-10 pt-8 pb-14">

        {/* ── Topo: logo + WhatsApp ─────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <a href="https://rlprod.pt" className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-rl-prod-branco.png" alt="RL PROD" className="w-11 h-11 object-contain" />
            <span className="rlp-t text-[20px] tracking-[0.04em]">RL Prod</span>
          </a>
          {interno ? (
            <a href="/media/crm"
              className="rlp-m text-[10.5px] text-white/70 hover:text-white border border-white/20 hover:border-white/45 rounded-md px-4 py-2.5 transition-colors">
              ‹ Voltar ao CRM
            </a>
          ) : (
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer"
              className="rlp-m text-[10.5px] text-white/70 hover:text-white border border-white/20 hover:border-white/45 rounded-md px-4 py-2.5 transition-colors">
              WhatsApp ↗
            </a>
          )}
        </div>

        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <section className="mt-14 sm:mt-20 max-w-3xl">
          <p className="rlp-m traco text-[11px] text-[#5a8bff]">{interno ? 'CRM · registo interno' : 'Pedido de orçamento'}</p>
          {interno ? (
            <>
              <h1 className="rlp-t mt-4 text-[52px] sm:text-[80px] lg:text-[92px] leading-[0.95]">
                Nova<br /><span className="text-[#5a8bff]">lead.</span>
              </h1>
              <p className="mt-6 text-[16px] sm:text-[18px] text-white/70 leading-relaxed max-w-xl">
                Para contactos que chegaram por telefone, WhatsApp ou pessoalmente. Só o nome é obrigatório e o cliente não recebe nenhum email.
              </p>
            </>
          ) : (
            <>
              <h1 className="rlp-t mt-4 text-[52px] sm:text-[80px] lg:text-[92px] leading-[0.95]">
                Vamos criar algo<br />
                <span className="text-[#5a8bff]">incrível juntos.</span>
              </h1>
              <p className="mt-6 text-[16px] sm:text-[18px] text-white/70 leading-relaxed max-w-xl">
                Conta-nos sobre o teu projeto. Respondemos em até 24h com uma proposta à medida.
              </p>
            </>
          )}
          <div className={`rlp-m mt-8 flex-wrap gap-x-6 gap-y-2 text-[10.5px] text-white/50 ${interno ? 'hidden' : 'flex'}`}>
            <span><span className="text-[#5a8bff]">●</span> Resposta até 24h</span>
            <span><span className="text-[#5a8bff]">●</span> Proposta à medida</span>
            <span><span className="text-[#5a8bff]">●</span> Dados protegidos</span>
          </div>
        </section>

        <div className="mt-14 h-px bg-white/[0.1]" />

        {/* ── Formulário + lateral ───────────────────────────────────────── */}
        <div className={`mt-12 grid grid-cols-1 gap-10 ${interno ? 'max-w-3xl' : 'lg:grid-cols-[1.7fr_1fr]'}`}>

          <form onSubmit={handleSubmit} className="flex flex-col gap-10">

            {/* 01 — Contacto */}
            <section>
              <div className="flex items-baseline gap-4 mb-6">
                <span className="rlp-t text-[44px] leading-none text-[#2e6cf6]">01</span>
                <h2 className="rlp-t text-[24px]">Contacto</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className={labelCls}>Nome *</label>
                  <input value={form.nome} onChange={set('nome')} placeholder="Nome completo" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Empresa{interno ? '' : ' *'}</label>
                  <input value={form.empresa} onChange={set('empresa')} placeholder="Nome da empresa ou marca" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Email{interno ? '' : ' *'}</label>
                  <input type="email" value={form.email} onChange={set('email')} placeholder="email@exemplo.com" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Telefone{interno ? '' : ' *'}</label>
                  <input value={form.telefone} onChange={set('telefone')} placeholder="+351 9xx xxx xxx" className={inputCls} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Ramo de atividade</label>
                  <input value={form.ramo} onChange={set('ramo')} placeholder="Ex.: restauração, imobiliário, moda, saúde…" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Site</label>
                  <input value={form.website} onChange={set('website')} placeholder="www.marca.pt" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Instagram</label>
                  <input value={form.instagram} onChange={set('instagram')} placeholder="@marca" className={inputCls} />
                </div>
              </div>
            </section>

            {/* 02 — Projeto */}
            <section>
              <div className="flex items-baseline gap-4 mb-6">
                <span className="rlp-t text-[44px] leading-none text-[#2e6cf6]">02</span>
                <h2 className="rlp-t text-[24px]">Projeto</h2>
              </div>

              <label className={labelCls}>Tipo de serviço{interno ? '' : ' *'}</label>
              <div className="flex flex-wrap gap-2">
                {TIPOS.map(t => (
                  <button key={t} type="button" onClick={() => setForm(f => ({ ...f, tipo: t }))} className={chip(form.tipo === t)}>
                    {t}
                  </button>
                ))}
              </div>

              <label className={`${labelCls} mt-7`}>{interno ? 'Como chegou' : 'Como nos encontraste *'}</label>
              <div className="flex flex-wrap gap-2">
                {FONTES.map(t => (
                  <button key={t} type="button" onClick={() => setForm(f => ({ ...f, fonte: t }))} className={chip(form.fonte === t)}>
                    {t}
                  </button>
                ))}
              </div>

              <label className={`${labelCls} mt-7`}>Sobre o projeto{interno ? '' : ' *'}</label>
              <textarea value={form.mensagem} onChange={set('mensagem')} rows={6}
                placeholder="O que tens em mente? Objetivo, datas, local, onde vai ser publicado…"
                className={inputCls + ' resize-none leading-relaxed'} />
            </section>

            {error && (
              <p className="rounded-md border border-[#ff4747]/40 bg-[#ff4747]/[0.08] px-4 py-3 text-[14.5px] text-[#ff8a8a]">{error}</p>
            )}

            <div className="flex items-center justify-between gap-4 pt-6 border-t border-white/[0.1]">
              <button type="button" onClick={() => { setForm(EMPTY); setError('') }}
                className="rlp-m text-[10.5px] text-white/40 hover:text-white/75 transition-colors">
                Limpar
              </button>
              <button type="submit" disabled={saving}
                className="rlp-t inline-flex items-center gap-3 rounded-md bg-[#2e6cf6] hover:bg-[#3d79ff] px-8 py-3.5 text-[19px] tracking-[0.06em] text-white transition-colors disabled:opacity-50"
                style={{ boxShadow: '0 10px 30px -10px rgba(46,108,246,0.7)' }}>
                {saving ? 'A guardar…' : interno ? 'Registar lead →' : 'Enviar pedido →'}
              </button>
            </div>
          </form>

          {/* ── Lateral ──────────────────────────────────────────────────── */}
          <aside className={`flex-col gap-5 ${interno ? 'hidden' : 'flex'}`}>
            <div className="rounded-xl border border-white/[0.1] bg-[#00141f]/60 backdrop-blur p-6">
              <p className="rlp-m traco text-[10.5px] text-[#5a8bff] mb-6">Como funciona</p>
              <div className="space-y-5">
                {PASSOS.map((p, i) => (
                  <div key={p.t} className="border-l-2 border-[#2e6cf6] pl-4">
                    <p className="rlp-t text-[22px] leading-none text-[#5a8bff]">{String(i + 1).padStart(2, '0')}</p>
                    <p className="rlp-t mt-1.5 text-[16px] tracking-[0.02em]">{p.t}</p>
                    <p className="text-[13.5px] text-white/55 leading-relaxed">{p.s}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-[#2e6cf6]/40 bg-[#2e6cf6]/[0.08] p-6">
              <p className="rlp-t text-[20px]">Preferes falar já?</p>
              <p className="mt-1 text-[14px] text-white/65">Fala connosco por WhatsApp ou telefone.</p>
              <a href={WHATSAPP} target="_blank" rel="noopener noreferrer"
                className="rlp-m mt-5 flex items-center justify-center gap-2 rounded-md border border-white/25 hover:border-white/50 px-4 py-3 text-[10.5px] text-white transition-colors">
                WhatsApp · 912 932 768 ↗
              </a>
            </div>
          </aside>
        </div>

        {/* ── Rodapé ─────────────────────────────────────────────────────── */}
        <footer className="rlp-m mt-16 pt-6 border-t border-white/[0.1] flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-white/40">
          <span>Conceito · Direção · Produção</span>
          <span><span className="text-white/75">Setúbal</span> — Worldwide</span>
          <a href={`mailto:${EMAIL}`} className="hover:text-white normal-case tracking-[0.1em]">{EMAIL}</a>
        </footer>
      </div>
    </main>
  )
}
