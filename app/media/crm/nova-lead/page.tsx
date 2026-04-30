'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
  const router = useRouter()

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
      router.push('/media/crm/leads')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao guardar.')
      setSaving(false)
    }
  }

  const labelCls = "block text-[8px] tracking-[0.5em] text-white/25 uppercase mb-2"
  const inputCls = "w-full bg-white/[0.03] border border-white/[0.08] focus:border-white/25 focus:outline-none px-4 py-3 text-[13px] text-white/75 placeholder:text-white/15 transition-colors duration-200"
  const selectCls = inputCls + " appearance-none cursor-pointer"

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
        <div className="mb-12">
          <p className="text-[8px] tracking-[0.6em] text-white/20 uppercase mb-2">RL Media · CRM</p>
          <h1 className="text-3xl font-extralight tracking-[0.3em] text-white/80 uppercase">Nova Lead</h1>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-px w-12 bg-white/25" />
            <div className="h-px flex-1 bg-white/[0.04]" />
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
                <div className="relative">
                  <select value={form.tipo} onChange={set('tipo')} className={selectCls}>
                    <option value="">Selecionar...</option>
                    {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/20 text-xs">▾</span>
                </div>
              </div>
              <div>
                <label className={labelCls}>Como nos encontrou</label>
                <div className="relative">
                  <select value={form.fonte} onChange={set('fonte')} className={selectCls}>
                    <option value="">Selecionar...</option>
                    {FONTES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/20 text-xs">▾</span>
                </div>
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
                {saving ? 'A guardar...' : 'Guardar Lead →'}
              </span>
            </button>
          </div>

        </form>
      </div>
    </main>
  )
}
