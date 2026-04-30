'use client'

import Link from 'next/link'
import { useState } from 'react'
import CustomSelect from '@/app/components/CustomSelect'

const TIPOS = [
  'Vídeo Institucional',
  'Produção Audiovisual',
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
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [enviado, setEnviado] = useState(false)

  const set = (k: keyof typeof EMPTY) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) { setError('Nome é obrigatório.'); return }
    setSaving(true)
    setError('')
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

  const labelCls = "block text-[8px] tracking-[0.5em] text-white/25 uppercase mb-2"
  const inputCls = "w-full bg-white/[0.03] border border-white/[0.08] focus:border-white/25 focus:outline-none px-4 py-3 text-[15px] text-white/75 placeholder:text-white/15 transition-colors duration-200"
  const selectCls = inputCls + " appearance-none cursor-pointer [color-scheme:dark]"

  if (enviado) {
    return (
      <main className="min-h-screen bg-[#050507] relative flex items-center justify-center">
        <div className="pointer-events-none fixed inset-0 z-0" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.016) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.016) 1px,transparent 1px)`,
          backgroundSize: '60px 60px',
        }} />
        <div className="pointer-events-none fixed inset-0 z-0" style={{
          background: 'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(180,200,255,0.04) 0%, transparent 70%)',
        }} />
        <div className="relative z-10 flex flex-col items-center text-center px-6">
          <img
            src="/logo_marca_advocacia__8_-removebg-preview.png"
            alt="RL Media"
            className="w-16 h-16 object-contain mb-8"
            style={{ filter: 'drop-shadow(0 0 16px rgba(255,255,255,0.1))' }}
          />
          <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center mb-6">
            <span className="text-white/50 text-lg">✓</span>
          </div>
          <p className="text-[8px] tracking-[0.6em] text-white/20 uppercase mb-3">RL Media · Audiovisual</p>
          <h2 className="text-xl font-extralight tracking-[0.4em] text-white/70 uppercase mb-4">Mensagem Enviada</h2>
          <p className="text-[12px] text-white/30 tracking-wider max-w-xs leading-relaxed">
            Recebemos o teu contacto. Entraremos em breve em contacto contigo.
          </p>
          <div className="mt-8 flex items-center gap-3 w-full max-w-xs">
            <div className="h-px flex-1 bg-white/[0.06]" />
            <div className="w-1 h-1 rounded-full bg-white/20" />
            <div className="h-px flex-1 bg-white/[0.06]" />
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#050507] relative">
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.016) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.016) 1px,transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        background: 'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(180,200,255,0.04) 0%, transparent 70%)',
      }} />

      <div className="relative z-10 max-w-2xl mx-auto px-6 sm:px-10 py-10">

        {/* Back */}
        <Link href="/media/crm"
          className="inline-flex items-center gap-2 text-[9px] tracking-[0.4em] text-white/25 hover:text-white/55 transition-colors uppercase mb-12 group">
          <span className="group-hover:-translate-x-1 transition-transform duration-200">‹</span>
          CRM
        </Link>

        {/* Header */}
        <div className="mb-12 flex flex-col items-center text-center">
          <img
            src="/logo_marca_advocacia__8_-removebg-preview.png"
            alt="RL Media"
            className="w-20 h-20 object-contain mb-6"
            style={{ filter: 'drop-shadow(0 0 16px rgba(255,255,255,0.1))' }}
          />
          <p className="text-[8px] tracking-[0.6em] text-white/20 uppercase mb-2">RL Media · Audiovisual</p>
          <h1 className="text-2xl font-extralight tracking-[0.4em] text-white/80 uppercase">Formulário</h1>
          <div className="mt-4 flex items-center gap-3 w-full max-w-xs">
            <div className="h-px flex-1 bg-white/[0.06]" />
            <div className="w-1 h-1 rounded-full bg-white/20" />
            <div className="h-px flex-1 bg-white/[0.06]" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">

          {/* Contacto */}
          <div>
            <p className="text-[8px] tracking-[0.55em] text-white/20 uppercase mb-5 flex items-center gap-3">
              <span>01 — Contacto</span>
              <span className="flex-1 h-px bg-white/[0.05]" />
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Nome *</label>
                <input value={form.nome} onChange={set('nome')} placeholder="Nome completo" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Empresa</label>
                <input value={form.empresa} onChange={set('empresa')} placeholder="Nome da empresa" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" value={form.email} onChange={set('email')} placeholder="email@exemplo.com" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Telefone</label>
                <input value={form.telefone} onChange={set('telefone')} placeholder="+351 9xx xxx xxx" className={inputCls} />
              </div>
            </div>
          </div>

          {/* Projeto */}
          <div>
            <p className="text-[8px] tracking-[0.55em] text-white/20 uppercase mb-5 flex items-center gap-3">
              <span>02 — Projeto</span>
              <span className="flex-1 h-px bg-white/[0.05]" />
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Tipo de Serviço</label>
                <CustomSelect
                  value={form.tipo}
                  onChange={v => setForm(f => ({ ...f, tipo: v }))}
                  options={TIPOS}
                  placeholder="Selecionar..."
                />
              </div>
              <div>
                <label className={labelCls}>Como nos encontrou</label>
                <CustomSelect
                  value={form.fonte}
                  onChange={v => setForm(f => ({ ...f, fonte: v }))}
                  options={FONTES}
                  placeholder="Selecionar..."
                />
              </div>
            </div>
            <div className="mt-4">
              <label className={labelCls}>Mensagem / Descrição do Pedido</label>
              <textarea value={form.mensagem} onChange={set('mensagem')}
                placeholder="Descreve o que o cliente pretende..." rows={5}
                className={inputCls + ' resize-none leading-relaxed'} />
            </div>
          </div>

          {/* Error */}
          {error && <p className="text-[10px] tracking-[0.3em] text-red-400/70 uppercase">{error}</p>}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-white/[0.05]">
            <button type="button" onClick={() => setForm(EMPTY)}
              className="text-[9px] tracking-[0.4em] text-white/20 hover:text-white/45 uppercase transition-colors">
              Limpar
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-3 border border-white/20 bg-white/[0.04] hover:bg-white/[0.09] hover:border-white/35
                         px-8 py-4 transition-all duration-300 disabled:opacity-40">
              <span className="text-[9px] tracking-[0.5em] text-white/55 uppercase">
                {saving ? 'A enviar...' : 'Enviar →'}
              </span>
            </button>
          </div>

        </form>
      </div>
    </main>
  )
}
