'use client'

import { useState } from 'react'
import CustomSelect from '@/app/components/CustomSelect'

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

const STEPS = [
  { num: '1', titulo: 'CONTACTO',     sub: 'Os teus dados' },
  { num: '2', titulo: 'PROJETO',      sub: 'Conta-nos tudo' },
  { num: '3', titulo: 'CONFIRMAÇÃO',  sub: 'Enviado com sucesso' },
]

const EMPTY = {
  nome: '',
  empresa: '',
  email: '',
  telefone: '',
  tipo: '',
  fonte: '',
  mensagem: '',
  estado: 'Novo',
}

export default function NovaLeadPage() {
  const [step, setStep]     = useState(0)
  const [form, setForm]     = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const [enviado, setEnviado] = useState(false)

  const set = (k: keyof typeof EMPTY) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  function validateStep(s: number): string | null {
    if (s === 0) {
      if (!form.nome.trim())     return 'O nome é obrigatório.'
      if (!form.empresa.trim())  return 'A empresa é obrigatória.'
      if (!form.email.trim())    return 'O email é obrigatório.'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return 'Email inválido.'
      if (!form.telefone.trim()) return 'O telefone é obrigatório.'
    }
    if (s === 1) {
      if (!form.tipo)            return 'O tipo de serviço é obrigatório.'
      if (!form.fonte)           return 'Indica como nos encontrou.'
      if (!form.mensagem.trim()) return 'A mensagem é obrigatória.'
    }
    return null
  }

  function goNext() {
    const err = validateStep(step)
    if (err) { setError(err); return }
    setError('')
    setStep(s => s + 1)
  }
  function goBack() { setError(''); setStep(s => s - 1) }

  async function handleSubmit() {
    for (const s of [0, 1]) {
      const err = validateStep(s)
      if (err) { setError(err); setStep(s); return }
    }
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/media-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setEnviado(true)
      setStep(2)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar.')
      setSaving(false)
    }
  }

  const labelCls = "block text-[11px] tracking-[0.4em] text-white/60 uppercase mb-2 font-medium"
  const inputCls = "w-full bg-white/[0.06] border border-white/[0.15] focus:border-blue-400/50 focus:outline-none px-4 py-3.5 text-[15px] text-white placeholder:text-white/30 transition-colors duration-200 rounded-md"

  // ── Backgrounds (mantidos do design original — azul neon) ──────────────────
  const BgLayers = () => (
    <>
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        backgroundImage: `linear-gradient(rgba(30,100,255,0.10) 1px,transparent 1px),linear-gradient(90deg,rgba(30,100,255,0.10) 1px,transparent 1px)`,
        backgroundSize: '44px 44px',
      }} />
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        background: 'radial-gradient(ellipse 80% 50% at 50% -5%, rgba(37,99,235,0.20) 0%, transparent 65%)',
      }} />
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        background: 'radial-gradient(ellipse 60% 40% at 80% 100%, rgba(37,99,235,0.10) 0%, transparent 65%)',
      }} />
    </>
  )

  // ── Ecrã de sucesso ────────────────────────────────────────────────────────
  if (enviado) {
    return (
      <main className="min-h-screen relative flex items-center justify-center" style={{ background: '#02060f' }}>
        <BgLayers />
        <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-md">
          <img src="/logo-rl-prod-branco.png" alt="RL PROD" className="w-20 h-20 object-contain mb-8"
            style={{ filter: 'drop-shadow(0 0 24px rgba(59,130,246,0.2))' }} />
          <div className="w-14 h-14 rounded-full border border-blue-400/40 bg-blue-500/10 flex items-center justify-center mb-6"
            style={{ boxShadow: '0 0 24px rgba(59,130,246,0.15)' }}>
            <svg className="w-6 h-6 text-blue-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
          </div>
          <p className="text-[8px] tracking-[0.6em] text-white/30 uppercase mb-3">RL PROD · Photography &amp; Video</p>
          <h2 className="text-2xl font-extralight tracking-[0.3em] text-white uppercase mb-4">Mensagem Enviada</h2>
          <p className="text-[13px] text-white/45 tracking-wider leading-relaxed mb-8">
            Recebemos o teu contacto. Respondemos em até 24h com uma proposta personalizada para ti.
          </p>
          <div className="flex items-center gap-3 w-full">
            <div className="h-px flex-1 bg-white/[0.08]" />
            <div className="w-1 h-1 rounded-full bg-blue-400/40" />
            <div className="h-px flex-1 bg-white/[0.08]" />
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen relative" style={{ background: '#02060f' }}>
      <BgLayers />

      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 py-12 sm:py-16">

        {/* ── HERO ───────────────────────────────────────────────────────── */}
        <div className="mb-12 sm:mb-16">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-8">
            <div className="flex-1 max-w-2xl">
              <div className="flex items-center gap-3 mb-6">
                <img src="/logo-rl-prod-branco.png" alt="RL PROD" className="w-12 h-12 object-contain"
                  style={{ filter: 'drop-shadow(0 0 16px rgba(59,130,246,0.25))' }} />
                <div>
                  <p className="text-[9px] tracking-[0.5em] text-blue-300/60 uppercase">RL Prod</p>
                  <p className="text-[8px] tracking-[0.4em] text-white/30 uppercase">Photography &amp; Video</p>
                </div>
              </div>

              <p className="text-[10px] tracking-[0.5em] text-blue-400/70 uppercase mb-4">Pedido de Orçamento</p>
              <h1 className="text-3xl sm:text-5xl font-extralight tracking-tight text-white leading-[1.1]">
                Vamos criar algo
                <br />
                <span className="text-blue-400">incrível juntos.</span>
              </h1>
              <p className="text-[15px] text-white/55 leading-relaxed mt-6 max-w-lg">
                Preenche o formulário e conta-nos sobre o teu projeto.<br />
                Respondemos em até 24h com uma proposta personalizada.
              </p>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">
            {[
              { icon: '⏱', titulo: 'Resposta rápida', sub: 'Até 24h' },
              { icon: '◆', titulo: 'Propostas personalizadas', sub: 'Para o teu projeto' },
              { icon: '⚿', titulo: 'Privacidade garantida', sub: 'Os teus dados estão seguros' },
            ].map(t => (
              <div key={t.titulo} className="flex items-center gap-3 px-4 py-3 border border-white/[0.08] bg-white/[0.02] rounded-lg">
                <span className="text-blue-400/70 text-lg shrink-0">{t.icon}</span>
                <div className="min-w-0">
                  <p className="text-[12px] text-white/85 font-medium leading-tight">{t.titulo}</p>
                  <p className="text-[10px] text-white/35 tracking-wide">{t.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── STEP INDICATOR ────────────────────────────────────────────── */}
        <div className="mb-10 border-y border-white/[0.06] py-5">
          <div className="grid grid-cols-3 gap-2">
            {STEPS.map((s, i) => {
              const isCurrent = i === step
              const isDone    = i < step
              return (
                <div key={s.num} className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 transition-all ${
                    isCurrent ? 'bg-blue-500 text-white' :
                    isDone    ? 'bg-blue-500/15 text-blue-300 border border-blue-400/30' :
                                'bg-white/[0.04] text-white/30 border border-white/10'
                  }`}>
                    {isDone ? '✓' : s.num}
                  </div>
                  <div className="min-w-0 hidden sm:block">
                    <p className={`text-[11px] font-medium tracking-widest uppercase ${isCurrent || isDone ? 'text-white' : 'text-white/35'}`}>{s.titulo}</p>
                    <p className="text-[9px] text-white/30 tracking-wider truncate">{s.sub}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── MAIN LAYOUT: form (esq) + side panels (dir) ───────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── FORM (col 1+2) ─────────────────────────────────────────── */}
          <div className="lg:col-span-2">
            {step === 0 && (
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6 sm:p-8">
                <h2 className="text-[11px] tracking-[0.4em] text-blue-300/70 uppercase font-medium mb-2">1 — Contacto</h2>
                <p className="text-[13px] text-white/35 mb-6">Diz-nos quem és para podermos falar contigo.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className={labelCls}>Nome <span className="text-blue-400/60">*</span></label>
                    <input value={form.nome} onChange={set('nome')} placeholder="Nome completo" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Empresa <span className="text-blue-400/60">*</span></label>
                    <input value={form.empresa} onChange={set('empresa')} placeholder="Nome da empresa" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Email <span className="text-blue-400/60">*</span></label>
                    <input type="email" value={form.email} onChange={set('email')} placeholder="email@exemplo.com" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Telefone <span className="text-blue-400/60">*</span></label>
                    <input value={form.telefone} onChange={set('telefone')} placeholder="+351 9xx xxx xxx" className={inputCls} />
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6 sm:p-8">
                <h2 className="text-[11px] tracking-[0.4em] text-blue-300/70 uppercase font-medium mb-2">2 — Projeto</h2>
                <p className="text-[13px] text-white/35 mb-6">Conta-nos sobre o que pretendes.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className={labelCls}>Tipo de Serviço <span className="text-blue-400/60">*</span></label>
                    <CustomSelect
                      value={form.tipo}
                      onChange={v => setForm(f => ({ ...f, tipo: v }))}
                      options={TIPOS}
                      placeholder="Selecionar..."
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Como nos encontrou <span className="text-blue-400/60">*</span></label>
                    <CustomSelect
                      value={form.fonte}
                      onChange={v => setForm(f => ({ ...f, fonte: v }))}
                      options={FONTES}
                      placeholder="Selecionar..."
                    />
                  </div>
                </div>

                <div className="mt-5">
                  <label className={labelCls}>Mensagem / Descrição do Pedido <span className="text-blue-400/60">*</span></label>
                  <textarea value={form.mensagem} onChange={set('mensagem')}
                    placeholder="Descreve o que o cliente pretende..." rows={6}
                    className={inputCls + ' resize-none leading-relaxed'} />
                </div>
              </div>
            )}

            {/* Erro */}
            {error && (
              <div className="mt-4 px-4 py-3 rounded-lg border border-red-400/30 bg-red-500/[0.06] text-[13px] text-red-300/85">
                ⚠ {error}
              </div>
            )}

            {/* Navegação */}
            <div className="mt-6 flex items-center justify-between gap-4">
              {step > 0 ? (
                <button onClick={goBack} type="button"
                  className="text-[11px] tracking-[0.35em] text-white/40 hover:text-white/70 uppercase transition-colors">
                  ← Anterior
                </button>
              ) : <div />}

              {step < 1 ? (
                <button onClick={goNext} type="button"
                  className="flex items-center gap-3 px-8 py-3.5 rounded-md bg-blue-500 hover:bg-blue-400 text-white font-semibold text-[12px] tracking-[0.3em] uppercase transition-all shadow-[0_0_20px_rgba(59,130,246,0.25)]">
                  Próximo Passo →
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={saving} type="button"
                  className="flex items-center gap-3 px-8 py-3.5 rounded-md bg-blue-500 hover:bg-blue-400 text-white font-semibold text-[12px] tracking-[0.3em] uppercase transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(59,130,246,0.25)]">
                  {saving ? 'A enviar...' : 'Enviar Pedido →'}
                </button>
              )}
            </div>

            {/* Botão limpar */}
            {step === 0 && (
              <button type="button" onClick={() => setForm(EMPTY)}
                className="mt-4 text-[11px] tracking-[0.35em] text-white/25 hover:text-white/55 uppercase transition-colors">
                Limpar
              </button>
            )}
          </div>

          {/* ── SIDE PANELS (col 3) ────────────────────────────────────── */}
          <div className="lg:col-span-1 flex flex-col gap-4">

            {/* O que acontece depois? */}
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-5 sm:p-6">
              <h3 className="text-[11px] tracking-[0.35em] text-blue-300/70 uppercase font-medium mb-5">O que acontece depois?</h3>
              {[
                { icon: '💬', t: 'Recebemos o teu pedido', s: 'Analisamos os detalhes do teu projeto.' },
                { icon: '📝', t: 'Criamos a melhor proposta', s: 'Preparamos uma proposta personalizada para ti.' },
                { icon: '✈', t: 'Enviamos em até 24h', s: 'Recebes a proposta por email ou WhatsApp.' },
                { icon: '✓', t: 'Começamos a criar', s: 'Depois da aprovação, colocamos tudo em ação!' },
              ].map((s, i) => (
                <div key={i} className="flex items-start gap-3 mb-4 last:mb-0">
                  <div className="w-7 h-7 rounded-full bg-blue-500/15 border border-blue-400/30 flex items-center justify-center shrink-0 text-[12px]">
                    {s.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-white/85 font-medium leading-tight">{s.t}</p>
                    <p className="text-[11px] text-white/35 leading-relaxed mt-0.5">{s.s}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Precisas de ajuda? */}
            <div className="bg-blue-500/[0.05] border border-blue-400/25 rounded-2xl p-5 sm:p-6">
              <h3 className="text-[11px] tracking-[0.35em] text-blue-300/80 uppercase font-medium mb-2">Precisas de ajuda?</h3>
              <p className="text-[12px] text-white/55 leading-relaxed mb-4">
                Fala diretamente connosco por WhatsApp se preferires.
              </p>
              <a href="https://wa.me/351912345678" target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-md bg-white/[0.04] border border-white/15 hover:bg-white/[0.08] hover:border-white/25 text-white text-[11px] tracking-[0.3em] uppercase font-medium transition-all">
                <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.52 3.48A11.83 11.83 0 0012 0C5.37 0 0 5.37 0 12c0 2.12.55 4.18 1.6 6L0 24l6.18-1.61A11.83 11.83 0 0012 24c6.63 0 12-5.37 12-12 0-3.2-1.25-6.21-3.48-8.52z"/>
                </svg>
                Falar no WhatsApp
              </a>
            </div>

            {/* Porquê escolher? */}
            <div className="bg-[#050b1c] border border-white/[0.1] rounded-2xl p-5 sm:p-6 relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 w-32 h-32 rounded-full bg-blue-500/[0.04] blur-2xl pointer-events-none" />
              <h3 className="text-[11px] tracking-[0.35em] text-white/80 uppercase font-medium mb-5 relative">Porquê escolher a RL PROD?</h3>
              <div className="space-y-3 relative">
                {[
                  'Experiência e criatividade',
                  'Foco em resultados',
                  'Equipamento profissional',
                  'Entrega no prazo',
                  'Acompanhamento dedicado',
                ].map(b => (
                  <div key={b} className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-blue-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M8 12l3 3 5-6"/></svg>
                    <span className="text-[12px] text-white/70">{b}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* ── FOOTER ─────────────────────────────────────────────────────── */}
        <footer className="mt-16 pt-8 border-t border-white/[0.08]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src="/logo-rl-prod-branco.png" alt="RL PROD" className="w-10 h-10 object-contain opacity-70" />
              <div>
                <p className="text-[10px] tracking-[0.4em] text-white/50 uppercase">RL Prod · Photography &amp; Video</p>
                <p className="text-[9px] text-white/25 mt-0.5">Lisboa, Portugal · info@rlprod.pt</p>
              </div>
            </div>
            <p className="text-[10px] tracking-[0.3em] text-white/25 uppercase">© 2026 RL Prod · Todos os direitos reservados</p>
          </div>
        </footer>

      </div>
    </main>
  )
}
