'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const statusColor: Record<string, string> = {
  'Fechou': 'bg-green-500/20 text-green-400 border-green-500/40',
  'Negociação': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
  'Por Contactar': 'bg-red-500/20 text-red-400 border-red-500/40',
  'Contactado': 'bg-blue-500/20 text-blue-400 border-blue-500/40',
  'Reunião Agendada': 'bg-purple-500/20 text-purple-400 border-purple-500/40',
  'NÃO FECHOU': 'bg-gray-500/20 text-gray-400 border-gray-500/40',
  'Agendar Reunião': 'bg-orange-500/20 text-orange-400 border-orange-500/40',
  'Sem resposta': 'bg-gray-500/20 text-gray-300 border-gray-500/40',
  'Encerrado': 'bg-gray-700/20 text-gray-500 border-gray-700/40',
  'Cancelado': 'bg-red-900/20 text-red-600 border-red-900/40',
  'Iniciar': 'bg-white/10 text-white/50 border-white/20',
}

const leadColor: Record<string, string> = {
  'Alta': 'bg-red-500/20 text-red-400 border-red-500/40',
  'Médio': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
  'Baixa': 'bg-green-500/20 text-green-400 border-green-500/40',
}

const STATUSES = ['Por Contactar','Iniciar','Contactado','Agendar Reunião','Reunião Agendada','Negociação','Fechou','NÃO FECHOU','Sem resposta','Encerrado','Cancelado']
const PRIORIDADES = ['Alta','Médio','Baixa']
const COMO_CHEGOU_OPTIONS = ['','Instagram','Facebook','Instagram/Facebook','WebSite','Casamentos.pt','Indicação','Newsletter']

type Contact = Record<string, string>

function F({ label, name, value, onChange, type = 'text', placeholder = '', readOnly = false }: {
  label: string; name: string; value: string; onChange: (k: string, v: string) => void
  type?: string; placeholder?: string; readOnly?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs tracking-widest text-white/30 uppercase">{label}</label>
      <input
        type={type}
        value={value ?? ''}
        onChange={readOnly ? undefined : e => onChange(name, e.target.value)}
        readOnly={readOnly}
        placeholder={placeholder}
        className={`border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none ${readOnly ? 'bg-white/3 text-white/50 cursor-default' : 'bg-white/5 focus:border-gold/50'}`}
      />
    </div>
  )
}

function S({ label, name, value, onChange, options }: {
  label: string; name: string; value: string; onChange: (k: string, v: string) => void; options: string[]
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs tracking-widest text-white/30 uppercase">{label}</label>
      <select
        value={value ?? ''}
        onChange={e => onChange(name, e.target.value)}
        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold/50"
      >
        {options.map(o => <option key={o} value={o} className="bg-zinc-900">{o || '— Selecionar —'}</option>)}
      </select>
    </div>
  )
}

function parseConvidados(mensagem: string): string {
  const line = (mensagem ?? '').split('\n').find(l => l.startsWith('Convidados:'))
  return line ? line.replace('Convidados:', '').trim() : ''
}

function parsePreocupacoes(mensagem: string): string {
  return (mensagem ?? '').split('\n').filter(l => !l.startsWith('Convidados:')).join('\n').trim()
}

export default function ClientePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [form, setForm] = useState<Contact>({})
  const [original, setOriginal] = useState<Contact>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('crm_contacts').select('*').eq('id', id).single().then(({ data }) => {
      if (!data) { router.push('/crm'); return }
      setForm(data)
      setOriginal(data)
      setLoading(false)
    })
  }, [id])

  const set = (k: string, v: string) => {
    setSaved(false)
    setForm(f => ({ ...f, [k]: v }))
  }

  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase.from('crm_contacts').update(form).eq('id', id)
    if (!error) {
      setOriginal(form)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } else {
      alert('Erro ao guardar: ' + error.message)
    }
    setSaving(false)
  }

  const isDirty = JSON.stringify(form) !== JSON.stringify(original)

  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    const { error } = await supabase.from('crm_contacts').delete().eq('id', id)
    if (!error) {
      router.push('/crm')
    } else {
      alert('Erro ao apagar: ' + error.message)
      setDeleting(false)
    }
  }

  if (loading) return (
    <main className="min-h-screen px-4 py-10 max-w-3xl mx-auto">
      <div className="text-center py-20 text-white/30 tracking-widest text-sm">A CARREGAR...</div>
    </main>
  )

  return (
    <main className="min-h-screen px-4 py-10 max-w-3xl mx-auto">
      <Link href="/crm" className="text-xs tracking-widest text-white/30 hover:text-gold transition-colors">
        ‹ VOLTAR AO CRM
      </Link>

      {/* Header */}
      <div className="mt-8 mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light text-white tracking-wide">{form.nome || 'Sem nome'}</h1>
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {form.status && (
              <span className={`text-xs px-3 py-1 rounded-full border ${statusColor[form.status] ?? 'bg-white/10 text-white/50 border-white/20'}`}>
                {form.status}
              </span>
            )}
            {form.lead_prioridade && (
              <span className={`text-xs px-3 py-1 rounded-full border ${leadColor[form.lead_prioridade] ?? 'bg-white/10 text-white/50 border-white/20'}`}>
                Lead {form.lead_prioridade}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !isDirty}
          className={`px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wider transition-all ${
            saved ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
            isDirty ? 'bg-gold/90 hover:bg-gold text-black' :
            'bg-white/5 text-white/20 border border-white/10 cursor-not-allowed'
          }`}
        >
          {saving ? 'A guardar...' : saved ? '✓ Guardado' : 'Guardar'}
        </button>
      </div>

      <div className="h-px bg-gold/20 mb-8" />

      <div className="flex flex-col gap-6">

        {/* Dados Pessoais */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-6 flex flex-col gap-4">
          <h2 className="text-xs tracking-[0.3em] text-gold uppercase mb-1">Dados Pessoais</h2>
          <F label="Nome" name="nome" value={form.nome} onChange={set} placeholder="Ex: Ana e João" />
          <div className="grid grid-cols-2 gap-4">
            <F label="Contacto" name="contato" value={form.contato} onChange={set} placeholder="+351 9xx xxx xxx" />
            <F label="Email" name="email" value={form.email} onChange={set} type="email" placeholder="email@exemplo.com" />
          </div>
          <S label="Como Chegou" name="como_chegou" value={form.como_chegou} onChange={set} options={COMO_CHEGOU_OPTIONS} />
        </div>

        {/* Estado da Lead */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-6 flex flex-col gap-4">
          <h2 className="text-xs tracking-[0.3em] text-gold uppercase mb-1">Estado da Lead</h2>
          <div className="grid grid-cols-2 gap-4">
            <S label="Status" name="status" value={form.status} onChange={set} options={STATUSES} />
            <S label="Lead Prioridade" name="lead_prioridade" value={form.lead_prioridade} onChange={set} options={PRIORIDADES} />
          </div>
          <F label="Data de Entrada" name="data_entrada" value={form.data_entrada} onChange={set} type="date" />
        </div>

        {/* Evento */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-6 flex flex-col gap-4">
          <h2 className="text-xs tracking-[0.3em] text-gold uppercase mb-1">Evento</h2>
          <div className="grid grid-cols-2 gap-4">
            <F label="Tipo de Evento" name="tipo_evento" value={form.tipo_evento} onChange={set} placeholder="Ex: Casamento" />
            <F label="Tipo de Cerimónia" name="tipo_cerimonia" value={form.tipo_cerimonia} onChange={set} placeholder="Ex: Religiosa" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <F label="Data do Casamento" name="data_casamento" value={form.data_casamento} onChange={set} type="date" />
            <F label="Orçamento (€)" name="orcamento" value={form.orcamento} onChange={set} placeholder="Ex: 2500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <F label="Local do Casamento" name="local_casamento" value={form.local_casamento} onChange={set} placeholder="Ex: Quinta das Rosas, Lisboa" />
            <F label="Nº de Convidados" name="_convidados_display" value={parseConvidados(form.mensagem ?? '')} onChange={() => {}} placeholder="—" readOnly />
          </div>
          <F label="Serviços" name="servicos" value={form.servicos} onChange={set} placeholder="Ex: Fotografia + Vídeo" />
        </div>

        {/* Preocupações */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-6 flex flex-col gap-4">
          <h2 className="text-xs tracking-[0.3em] text-gold uppercase mb-1">Preocupações / Mensagem Inicial</h2>
          <textarea
            value={parsePreocupacoes(form.mensagem ?? '')}
            onChange={e => {
              const convidados = parseConvidados(form.mensagem ?? '')
              const newMensagem = [e.target.value, convidados ? `Convidados: ${convidados}` : ''].filter(Boolean).join('\n')
              set('mensagem', newMensagem)
            }}
            rows={4}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-gold/50 resize-none"
            placeholder="Preocupações e mensagem enviada pelo cliente..."
          />
        </div>

        {/* Notas */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-6 flex flex-col gap-4">
          <h2 className="text-xs tracking-[0.3em] text-gold uppercase mb-1">Notas Internas</h2>
          <textarea
            value={form.notas ?? ''}
            onChange={e => set('notas', e.target.value)}
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-gold/50 resize-none"
            placeholder="Notas sobre esta lead..."
          />
        </div>

      </div>

      {/* Botão guardar em baixo */}
      {isDirty && (
        <div className="mt-8 flex gap-3">
          <button
            onClick={() => { setForm(original); setSaved(false) }}
            className="flex-1 px-6 py-3 border border-white/10 rounded-xl text-sm text-white/40 hover:text-white hover:border-white/30 transition-all"
          >
            Cancelar alterações
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-6 py-3 bg-gold/90 hover:bg-gold rounded-xl text-sm font-semibold text-black tracking-wider transition-all disabled:opacity-50"
          >
            {saving ? 'A guardar...' : 'Guardar'}
          </button>
        </div>
      )}

      {/* Zona de Perigo — Apagar Lead */}
      <div className="mt-16 border border-red-900/30 rounded-2xl p-6">
        <h2 className="text-xs tracking-[0.3em] text-red-500/70 uppercase mb-1">Apagar Lead</h2>
        <p className="text-white/30 text-sm mb-5">Esta ação é permanente e não pode ser revertida.</p>
        <button
          onClick={handleDelete}
          disabled={deleting}
          onMouseLeave={() => setConfirmDelete(false)}
          className={`px-6 py-2.5 rounded-xl text-sm font-semibold tracking-wider transition-all ${
            confirmDelete
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/40'
          }`}
        >
          {deleting ? 'A apagar...' : confirmDelete ? '⚠ Confirmar — Apagar definitivamente' : 'Apagar Lead'}
        </button>
        {confirmDelete && (
          <p className="text-red-400/60 text-xs mt-3">Clica novamente para confirmar. Move o rato para fora para cancelar.</p>
        )}
      </div>

    </main>
  )
}
