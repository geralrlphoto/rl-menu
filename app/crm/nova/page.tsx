'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function NovaLeadPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nome: '',
    contato: '',
    email: '',
    status: 'Por Contactar',
    lead_prioridade: 'Médio',
    tipo_evento: 'Casamento',
    data_casamento: '',
    data_entrada: new Date().toISOString().split('T')[0],
    local_casamento: '',
    orcamento: '',
    como_chegou: '',
    mensagem: '',
    tipo_cerimonia: '',
    servicos: '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('crm_contacts').insert([form])
    if (!error) {
      router.push('/crm')
    } else {
      alert('Erro ao guardar: ' + error.message)
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen px-4 py-10 max-w-2xl mx-auto">
      <Link href="/crm" className="text-xs tracking-widest text-white/30 hover:text-gold transition-colors">
        ‹ VOLTAR AO CRM
      </Link>

      <div className="mt-8 mb-8">
        <h1 className="text-2xl font-light tracking-widest text-gold uppercase">Nova Lead</h1>
        <div className="mt-3 h-px w-16 bg-gold/40" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">

        {/* Dados Pessoais */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-6 flex flex-col gap-4">
          <h2 className="text-xs tracking-[0.3em] text-gold uppercase mb-1">Dados Pessoais</h2>

          <div>
            <label className="text-xs tracking-widest text-white/40 uppercase block mb-1">Nome *</label>
            <input required value={form.nome} onChange={e => set('nome', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-gold/50"
              placeholder="Ex: Ana e João" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs tracking-widest text-white/40 uppercase block mb-1">Contacto</label>
              <input value={form.contato} onChange={e => set('contato', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-gold/50"
                placeholder="+351 9xx xxx xxx" />
            </div>
            <div>
              <label className="text-xs tracking-widest text-white/40 uppercase block mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-gold/50"
                placeholder="email@exemplo.com" />
            </div>
          </div>

          <div>
            <label className="text-xs tracking-widest text-white/40 uppercase block mb-1">Como Chegou até nós?</label>
            <select value={form.como_chegou} onChange={e => set('como_chegou', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold/50">
              <option value="" className="bg-zinc-900">— Selecionar —</option>
              {['Instagram', 'Facebook', 'Instagram/Facebook', 'WebSite', 'Casamentos.pt', 'Indicação', 'Newsletter'].map(o =>
                <option key={o} value={o} className="bg-zinc-900">{o}</option>
              )}
            </select>
          </div>
        </div>

        {/* Estado */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-6 flex flex-col gap-4">
          <h2 className="text-xs tracking-[0.3em] text-gold uppercase mb-1">Estado da Lead</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs tracking-widest text-white/40 uppercase block mb-1">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold/50">
                {['Por Contactar','Contactado','Agendar Reunião','Reunião Agendada','Negociação','Fechou','NÃO FECHOU','Sem resposta','Encerrado','Cancelado'].map(s =>
                  <option key={s} value={s} className="bg-zinc-900">{s}</option>
                )}
              </select>
            </div>
            <div>
              <label className="text-xs tracking-widest text-white/40 uppercase block mb-1">Lead Prioridade</label>
              <select value={form.lead_prioridade} onChange={e => set('lead_prioridade', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold/50">
                {['Alta','Médio','Baixa'].map(p =>
                  <option key={p} value={p} className="bg-zinc-900">{p}</option>
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs tracking-widest text-white/40 uppercase block mb-1">Data de Entrada</label>
            <input type="date" value={form.data_entrada} onChange={e => set('data_entrada', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold/50" />
          </div>
        </div>

        {/* Evento */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-6 flex flex-col gap-4">
          <h2 className="text-xs tracking-[0.3em] text-gold uppercase mb-1">Evento</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs tracking-widest text-white/40 uppercase block mb-1">Tipo de Evento</label>
              <select value={form.tipo_evento} onChange={e => set('tipo_evento', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold/50">
                {['Casamento','Batizado','Evento','Casamento e Batizado','bodas de prata'].map(t =>
                  <option key={t} value={t} className="bg-zinc-900">{t}</option>
                )}
              </select>
            </div>
            <div>
              <label className="text-xs tracking-widest text-white/40 uppercase block mb-1">Tipo de Cerimónia</label>
              <select value={form.tipo_cerimonia} onChange={e => set('tipo_cerimonia', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold/50">
                <option value="" className="bg-zinc-900">— Selecionar —</option>
                {['Religiosa','Civil','Outra'].map(t =>
                  <option key={t} value={t} className="bg-zinc-900">{t}</option>
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs tracking-widest text-white/40 uppercase block mb-1">Data do Casamento</label>
              <input type="date" value={form.data_casamento} onChange={e => set('data_casamento', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold/50" />
            </div>
            <div>
              <label className="text-xs tracking-widest text-white/40 uppercase block mb-1">Orçamento (€)</label>
              <input value={form.orcamento} onChange={e => set('orcamento', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-gold/50"
                placeholder="Ex: 2500" />
            </div>
          </div>

          <div>
            <label className="text-xs tracking-widest text-white/40 uppercase block mb-1">Local do Casamento</label>
            <input value={form.local_casamento} onChange={e => set('local_casamento', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-gold/50"
              placeholder="Ex: Quinta das Rosas, Lisboa" />
          </div>

          <div>
            <label className="text-xs tracking-widest text-white/40 uppercase block mb-1">Serviços</label>
            <select value={form.servicos} onChange={e => set('servicos', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold/50">
              <option value="" className="bg-zinc-900">— Selecionar —</option>
              {['SERVIÇO DE FOTOGRAFIA','SERVIÇO DE VIDEO','SERVIÇO DE FOTOGRAFIA + VIDEO','Sessão de Pré-Wedding - Fotografia','Sessão de Pré-Wedding - Vídeo','Drone','Álbum Impresso','Same Day Edit'].map(s =>
                <option key={s} value={s} className="bg-zinc-900">{s}</option>
              )}
            </select>
          </div>
        </div>

        {/* Mensagem */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-6 flex flex-col gap-4">
          <h2 className="text-xs tracking-[0.3em] text-gold uppercase mb-1">Mensagem Inicial</h2>
          <textarea value={form.mensagem} onChange={e => set('mensagem', e.target.value)}
            rows={4}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-gold/50 resize-none"
            placeholder="Mensagem enviada pelo cliente..." />
        </div>

        {/* Botões */}
        <div className="flex gap-3">
          <Link href="/crm"
            className="flex-1 text-center px-6 py-3 border border-white/10 rounded-xl text-sm text-white/50 hover:text-white hover:border-white/30 transition-all">
            Cancelar
          </Link>
          <button type="submit" disabled={saving}
            className="flex-1 px-6 py-3 bg-gold/90 hover:bg-gold rounded-xl text-sm font-semibold text-black tracking-wider transition-all disabled:opacity-50">
            {saving ? 'A GUARDAR...' : '+ CRIAR LEAD'}
          </button>
        </div>

      </form>
    </main>
  )
}
