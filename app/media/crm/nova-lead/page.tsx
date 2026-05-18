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
  const [form, setForm]     = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const [enviado, setEnviado] = useState(false)

  const set = (k: keyof typeof EMPTY) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim())     { setError('O nome é obrigatório.'); return }
    if (!form.empresa.trim())  { setError('A empresa é obrigatória.'); return }
    if (!form.email.trim())    { setError('O email é obrigatório.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) { setError('Email inválido.'); return }
    if (!form.telefone.trim()) { setError('O telefone é obrigatório.'); return }
    if (!form.tipo)            { setError('O tipo de serviço é obrigatório.'); return }
    if (!form.fonte)           { setError('Indica como nos encontrou.'); return }
    if (!form.mensagem.trim()) { setError('A mensagem é obrigatória.'); return }

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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar.')
      setSaving(false)
    }
  }

  const labelCls = "block text-[13px] tracking-[0.4em] text-white/70 uppercase mb-2.5 font-medium"
  const inputCls = "w-full bg-white/[0.06] border border-white/[0.15] focus:border-blue-400/50 focus:outline-none px-4 py-4 text-[17px] text-white placeholder:text-white/30 transition-colors duration-200 rounded-md"

  // ── Background — gradiente diagonal limpo (azul escuro → azul vibrante → escuro)
  const BgLayers = () => (
    <>
      {/* Gradient diagonal principal — transição clara entre tons */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        background: 'linear-gradient(135deg, #02060f 0%, #0a1a3a 35%, #1e3a8a 55%, #0a1a3a 75%, #02060f 100%)',
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
          <p className="text-[10px] tracking-[0.6em] text-white/35 uppercase mb-3">RL PROD · Photography &amp; Video</p>
          <h2 className="text-3xl font-extralight tracking-[0.3em] text-white uppercase mb-5">Mensagem Enviada</h2>
          <p className="text-[16px] text-white/55 tracking-wider leading-relaxed mb-8">
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

          {/* Hero banner full-width com imagem que desvanece de cima para baixo */}
          <div className="relative w-full mb-10">

            {/* Imagem com mask que faz fade-out vertical (visível no topo → transparente no fundo) */}
            <img
              src="https://images.pexels.com/photos/31158869/pexels-photo-31158869.jpeg?auto=compress&cs=tinysrgb&w=2000"
              alt="Câmara de vídeo profissional com iluminação neon"
              className="w-full h-[420px] sm:h-[520px] object-cover"
              style={{
                WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.95) 25%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0) 100%)',
                maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.95) 25%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0) 100%)',
              }}
            />

            {/* Tint azul subtil sobre a imagem (em vez do overlay escuro) — também faz fade */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'linear-gradient(to bottom, rgba(2,6,15,0.35) 0%, rgba(2,6,15,0.25) 40%, rgba(2,6,15,0) 100%)',
            }} />

            {/* Conteúdo sobreposto — logo central + texto centrado por baixo */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 sm:px-12 py-10">
              {/* Logo central grande */}
              <img src="/logo-rl-prod-branco.png" alt="RL PROD" className="w-44 sm:w-56 md:w-64 object-contain mb-6"
                style={{ filter: 'drop-shadow(0 4px 30px rgba(59,130,246,0.45)) drop-shadow(0 2px 8px rgba(0,0,0,0.6))' }} />

              <p className="text-[12px] tracking-[0.5em] text-blue-400/80 uppercase mb-4 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">Pedido de Orçamento</p>
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-extralight tracking-tight text-white leading-[1.1] drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)]">
                Vamos criar algo
                <br />
                <span className="text-blue-400">incrível juntos.</span>
              </h1>
              <p className="text-[15px] sm:text-[18px] text-white/80 leading-relaxed mt-5 max-w-2xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
                Preenche o formulário e conta-nos sobre o teu projeto.<br className="hidden sm:inline" />
                Respondemos em até 24h com uma proposta personalizada.
              </p>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: '⏱', titulo: 'Resposta rápida', sub: 'Até 24h' },
              { icon: '◆', titulo: 'Propostas personalizadas', sub: 'Para o teu projeto' },
              { icon: '⚿', titulo: 'Privacidade garantida', sub: 'Os teus dados estão seguros' },
            ].map(t => (
              <div key={t.titulo} className="flex items-center gap-3 px-5 py-4 border border-white/[0.08] bg-white/[0.02] rounded-lg">
                <span className="text-blue-400/70 text-2xl shrink-0">{t.icon}</span>
                <div className="min-w-0">
                  <p className="text-[15px] text-white/90 font-medium leading-tight">{t.titulo}</p>
                  <p className="text-[12px] text-white/40 tracking-wide mt-0.5">{t.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── MAIN LAYOUT: form (esq) + side panels (dir) ───────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── FORM (col 1+2) — single page com 2 secções ─────────────── */}
          <form onSubmit={handleSubmit} className="lg:col-span-2 flex flex-col gap-6">

            {/* Secção 01 — Contacto */}
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6 sm:p-8">
              <p className="text-[13px] tracking-[0.45em] text-blue-300/70 uppercase mb-6 flex items-center gap-3">
                <span>01 — Contacto</span>
                <span className="flex-1 h-px bg-white/[0.06]" />
              </p>
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

            {/* Secção 02 — Projeto */}
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6 sm:p-8">
              <p className="text-[13px] tracking-[0.45em] text-blue-300/70 uppercase mb-6 flex items-center gap-3">
                <span>02 — Projeto</span>
                <span className="flex-1 h-px bg-white/[0.06]" />
              </p>
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

            {/* Erro */}
            {error && (
              <div className="px-4 py-3.5 rounded-lg border border-red-400/30 bg-red-500/[0.06] text-[15px] text-red-300/85">
                ⚠ {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
              <button type="button" onClick={() => setForm(EMPTY)}
                className="text-[13px] tracking-[0.35em] text-white/35 hover:text-white/65 uppercase transition-colors">
                Limpar
              </button>
              <button type="submit" disabled={saving}
                className="flex items-center gap-3 px-9 py-4 rounded-md bg-blue-500 hover:bg-blue-400 text-white font-semibold text-[14px] tracking-[0.3em] uppercase transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(59,130,246,0.25)]">
                {saving ? 'A enviar...' : 'Enviar →'}
              </button>
            </div>
          </form>

          {/* ── SIDE PANELS (col 3) ────────────────────────────────────── */}
          <div className="lg:col-span-1 flex flex-col gap-4">

            {/* O que acontece depois? */}
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6 sm:p-7">
              <h3 className="text-[13px] tracking-[0.35em] text-blue-300/80 uppercase font-medium mb-6">O que acontece depois?</h3>
              {[
                { icon: '💬', t: 'Recebemos o teu pedido', s: 'Analisamos os detalhes do teu projeto.' },
                { icon: '📝', t: 'Criamos a melhor proposta', s: 'Preparamos uma proposta personalizada para ti.' },
                { icon: '✈', t: 'Enviamos em até 24h', s: 'Recebes a proposta por email ou WhatsApp.' },
                { icon: '✓', t: 'Começamos a criar', s: 'Depois da aprovação, colocamos tudo em ação!' },
              ].map((s, i) => (
                <div key={i} className="flex items-start gap-3.5 mb-5 last:mb-0">
                  <div className="w-9 h-9 rounded-full bg-blue-500/15 border border-blue-400/30 flex items-center justify-center shrink-0 text-[15px]">
                    {s.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] text-white/90 font-medium leading-tight">{s.t}</p>
                    <p className="text-[13px] text-white/45 leading-relaxed mt-1">{s.s}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Precisas de ajuda? */}
            <div className="bg-blue-500/[0.05] border border-blue-400/25 rounded-2xl p-6 sm:p-7">
              <h3 className="text-[13px] tracking-[0.35em] text-blue-300/85 uppercase font-medium mb-2.5">Precisas de ajuda?</h3>
              <p className="text-[14px] text-white/60 leading-relaxed mb-5">
                Fala diretamente connosco por WhatsApp se preferires.
              </p>
              <a href="https://wa.me/351912345678" target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 w-full px-4 py-3.5 rounded-md bg-white/[0.04] border border-white/15 hover:bg-white/[0.08] hover:border-white/25 text-white text-[13px] tracking-[0.3em] uppercase font-medium transition-all">
                <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.52 3.48A11.83 11.83 0 0012 0C5.37 0 0 5.37 0 12c0 2.12.55 4.18 1.6 6L0 24l6.18-1.61A11.83 11.83 0 0012 24c6.63 0 12-5.37 12-12 0-3.2-1.25-6.21-3.48-8.52z"/>
                </svg>
                Falar no WhatsApp
              </a>
            </div>

            {/* Porquê escolher? */}
            <div className="bg-[#050b1c] border border-white/[0.1] rounded-2xl p-6 sm:p-7 relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 w-32 h-32 rounded-full bg-blue-500/[0.04] blur-2xl pointer-events-none" />
              <h3 className="text-[13px] tracking-[0.35em] text-white/85 uppercase font-medium mb-6 relative">Porquê escolher a RL PROD?</h3>
              <div className="space-y-3.5 relative">
                {[
                  'Experiência e criatividade',
                  'Foco em resultados',
                  'Equipamento profissional',
                  'Entrega no prazo',
                  'Acompanhamento dedicado',
                ].map(b => (
                  <div key={b} className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-blue-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M8 12l3 3 5-6"/></svg>
                    <span className="text-[14px] text-white/80">{b}</span>
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
              <img src="/logo-rl-prod-branco.png" alt="RL PROD" className="w-12 h-12 object-contain opacity-70" />
              <div>
                <p className="text-[12px] tracking-[0.4em] text-white/60 uppercase">RL Prod · Photography &amp; Video</p>
                <p className="text-[11px] text-white/30 mt-1">Lisboa, Portugal · info@rlprod.pt</p>
              </div>
            </div>
            <p className="text-[12px] tracking-[0.3em] text-white/30 uppercase">© 2026 RL Prod · Todos os direitos reservados</p>
          </div>
        </footer>

      </div>
    </main>
  )
}
