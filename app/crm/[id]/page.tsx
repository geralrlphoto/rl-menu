'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const MEET_LINK = 'https://meet.google.com/dih-etvh-xkh'
const MAPS_LINK = 'https://www.google.com/maps/place/RL+Photo.Video+(Casamentos,Batizados,Eventos)/@38.634382,-8.9147077,212m/data=!3m2!1e3!4b1!4m6!3m5!1s0xd19414ebaa9e467:0x1d9b63c70ffe06a!8m2!3d38.634381!4d-8.914064!16s%2Fg%2F11w219lx62?authuser=0&entry=ttu&g_ep=EgoyMDI2MDQxMi4wIKXMDSoASAFQAw%3D%3D'

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

function F({ label, name, value, onChange, type = 'text', placeholder = '' }: {
  label: string; name: string; value: string; onChange: (k: string, v: string) => void
  type?: string; placeholder?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs tracking-widest text-white/30 uppercase">{label}</label>
      <input
        type={type}
        value={value ?? ''}
        onChange={e => onChange(name, e.target.value)}
        placeholder={placeholder}
        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-gold/50"
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
    // Buscar campos críticos do DB para não os sobrescrever se estiverem vazios no form
    const { data: current } = await supabase
      .from('crm_contacts')
      .select('reuniao_data,reuniao_hora,reuniao_tipo,reuniao_link,reuniao_enviada_at,page_token,page_publicada,page_views,page_confirmacao')
      .eq('id', id)
      .single()

    const pc = typeof form.page_content === 'string'
      ? JSON.parse(form.page_content || '{}')
      : (form.page_content || {})
    const formToSave: Record<string, any> = {
      ...form,
      // Preservar campos da reunião — só sobrescreve se o form tiver valor explícito
      reuniao_data:       form.reuniao_data       || current?.reuniao_data       || null,
      reuniao_hora:       form.reuniao_hora       || current?.reuniao_hora       || null,
      reuniao_tipo:       form.reuniao_tipo       || current?.reuniao_tipo       || null,
      reuniao_link:       form.reuniao_link       || current?.reuniao_link       || null,
      reuniao_enviada_at: form.reuniao_enviada_at || current?.reuniao_enviada_at || null,
      // Preservar token e estado da página (geridos por handleTogglePage)
      page_token:         form.page_token         || current?.page_token         || null,
      page_publicada:     form.page_publicada      ?? current?.page_publicada    ?? false,
      page_views:         current?.page_views      ?? form.page_views            ?? 0,
      page_confirmacao:   current?.page_confirmacao ?? form.page_confirmacao     ?? null,
      page_content: { ...pc, propostas, extras_proposta: extrasGlobais },
    }
    // Regista data_fecho automaticamente quando status = Fechou e ainda não tem
    if (form.status === 'Fechou' && !form.data_fecho) {
      formToSave.data_fecho = new Date().toISOString()
    }
    const { error } = await supabase.from('crm_contacts').update(formToSave).eq('id', id)
    if (!error) {
      setForm(formToSave)
      setOriginal(formToSave)
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
  const [sendingReuniao, setSendingReuniao] = useState(false)
  const [reuniaoSent, setReuniaoSent] = useState(false)
  const [togglingPage, setTogglingPage] = useState(false)
  const [copied, setCopied] = useState(false)

  // ── Propostas ────────────────────────────────────────────────────────────────
  type ExtraServico = { nome: string; valor: string }
  type Proposta = { nome: string; servicos_foto: string[]; servicos_video: string[]; valor: string }

  const SERVICOS_FOTO = [
    '1 Fotógrafo', '2 Fotógrafos', 'Rep. Todo Evento',
    '700 Fotografias Editadas', '850 Fotografias Editadas', '1000 Fotografias Editadas',
    'Sessão Pré-Wedding', 'Sessão TTD',
    'Álbum 25×25 — 40 Fotos', 'Álbum 30×30 — 60 Fotos',
    'Foto Lembrança', 'Galerias Open',
    'Entrega por Link', 'Entrega em Pen Box', 'Deslocação',
  ]
  const SERVICOS_VIDEO = [
    '1 Videógrafo', '2 Videógrafos', 'Rep. Todo Evento',
    'Vídeo até 20 min | Full HD', 'Deslocação',
    'Sessão Pré-Wedding', 'Sessão TTD',
    'Drone', 'Same Day Edit', 'Trailer', 'Teaser',
    'Relive Wedding', 'Entrega por Link', 'Entrega em Pen Box',
    'Qualidade Full HD', 'Qualidade 4K',
  ]
  const EXTRAS_OPTIONS = [
    '1 Fotógrafo', '2 Fotógrafos', 'Sessão Pré-Wedding', 'Sessão TTD',
    'Álbum 25×25 — 40 Fotos', 'Álbum 30×30 — 60 Fotos',
    'Foto Lembrança', 'Galerias Open', 'Entrega por Link', 'Entrega em Pen Box', 'Deslocação',
    '1 Videógrafo', '2 Videógrafos', 'Drone', 'Same Day Edit', 'Trailer', 'Teaser',
    'Relive Wedding', 'Vídeo até 20 min | Full HD', 'Vídeos Originais',
  ]

  const DEFAULT_PROPOSTAS: Proposta[] = [
    { nome: 'Proposta 1', servicos_foto: [], servicos_video: [], valor: '' },
    { nome: 'Proposta 2', servicos_foto: [], servicos_video: [], valor: '' },
    { nome: 'Proposta 3', servicos_foto: [], servicos_video: [], valor: '' },
  ]
  const [propostas, setPropostas] = useState<Proposta[]>(DEFAULT_PROPOSTAS)
  const [extrasGlobais, setExtrasGlobais] = useState<ExtraServico[]>([])
  const [propostaOpen, setPropostaOpen] = useState<Record<number, boolean>>({ 0: true, 1: false, 2: false })
  const [savingPropostas, setSavingPropostas] = useState(false)
  const [savedPropostas, setSavedPropostas] = useState(false)

  useEffect(() => {
    if (!form.page_content) return
    const pc = typeof form.page_content === 'string' ? JSON.parse(form.page_content) : form.page_content
    if (pc?.propostas) setPropostas(pc.propostas)
    if (pc?.extras_proposta?.length > 0) {
      setExtrasGlobais(pc.extras_proposta)
    } else {
      // Migrar extras do formato antigo (por proposta) para secção partilhada
      const primeiraComExtras = (pc?.propostas || []).find((p: any) => p.extras?.length > 0)
      if (primeiraComExtras?.extras) setExtrasGlobais(primeiraComExtras.extras)
    }
  }, [form.page_content])

  const handleSavePropostas = async () => {
    setSavingPropostas(true)
    const pc = typeof form.page_content === 'string'
      ? JSON.parse(form.page_content || '{}')
      : (form.page_content || {})
    const newPc = { ...pc, propostas, extras_proposta: extrasGlobais }
    const { error } = await supabase.from('crm_contacts').update({ page_content: newPc }).eq('id', id)
    if (!error) {
      setForm((f: Contact) => ({ ...f, page_content: newPc }))
      setOriginal((f: Contact) => ({ ...f, page_content: newPc }))
      setSavedPropostas(true)
      setTimeout(() => setSavedPropostas(false), 2500)
    } else {
      alert('Erro ao guardar propostas: ' + error.message)
    }
    setSavingPropostas(false)
  }

  const setProposta = (pi: number, key: keyof Proposta, value: string) => {
    setPropostas(prev => prev.map((p, i) => i === pi ? { ...p, [key]: value } : p))
  }
  const toggleServico = (pi: number, campo: 'servicos_foto' | 'servicos_video', servico: string) => {
    setPropostas(prev => prev.map((p, i) => {
      if (i !== pi) return p
      const atual = p[campo] || []
      const has = atual.includes(servico)
      return { ...p, [campo]: has ? atual.filter(s => s !== servico) : [...atual, servico] }
    }))
  }
  const toggleExtraGlobal = (nome: string) => {
    setExtrasGlobais(prev => {
      const has = prev.some(e => e.nome === nome)
      return has ? prev.filter(e => e.nome !== nome) : [...prev, { nome, valor: '' }]
    })
  }
  const setExtraValorGlobal = (nome: string, valor: string) => {
    setExtrasGlobais(prev => prev.map(e => e.nome === nome ? { ...e, valor } : e))
  }

  const handleEnviarReuniao = async () => {
    if (!form.reuniao_data || !form.reuniao_hora) {
      alert('Preenche a data e hora da reunião.')
      return
    }
    const tipo = form.reuniao_tipo || 'Presencial'
    const link = tipo === 'Videochamada' ? MEET_LINK : MAPS_LINK
    setSendingReuniao(true)
    const { error } = await supabase.from('crm_contacts').update({
      reuniao_data: form.reuniao_data,
      reuniao_hora: form.reuniao_hora,
      reuniao_tipo: tipo,
      reuniao_link: link,
      status: 'Reunião Agendada',
      status_updated_at: new Date().toISOString(),
      reuniao_enviada_at: new Date().toISOString(),
    }).eq('id', id)
    if (!error) {
      const enviadaAt = new Date().toISOString()
      setForm(f => ({ ...f, status: 'Reunião Agendada', reuniao_tipo: tipo, reuniao_link: link, reuniao_enviada_at: enviadaAt }))
      setOriginal(f => ({ ...f, status: 'Reunião Agendada', reuniao_data: form.reuniao_data, reuniao_hora: form.reuniao_hora, reuniao_tipo: tipo, reuniao_link: link, reuniao_enviada_at: enviadaAt }))
      // Enviar email ao cliente se tiver email
      if (form.email) {
        fetch('/api/send-reuniao-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email:        form.email,
            nome:         form.nome,
            reuniao_data: form.reuniao_data,
            reuniao_hora: form.reuniao_hora,
            reuniao_tipo: tipo,
            reuniao_link: link,
            page_token:   form.page_token || null,
          }),
        }).catch(() => {})
      }
      setReuniaoSent(true)
      setTimeout(() => setReuniaoSent(false), 3000)
    } else {
      alert('Erro ao guardar reunião: ' + error.message)
    }
    setSendingReuniao(false)
  }

  const handleTogglePage = async (publish: boolean) => {
    setTogglingPage(true)
    const res = await fetch('/api/lead-page/toggle-publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, publish }),
    })
    const data = await res.json()
    if (data.token) {
      setForm(f => ({ ...f, page_publicada: publish ? 'true' : '', page_token: data.token }))
      setOriginal(f => ({ ...f, page_publicada: publish ? 'true' : '', page_token: data.token }))
    }
    setTogglingPage(false)
  }

  const handleCopyLink = () => {
    const url = `${window.location.origin}/r/${form.page_token}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    // Arquivar no Notion primeiro (evita que o sync a recrie)
    if (form.notion_id) {
      fetch('/api/archive-notion-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notion_id: form.notion_id }),
      }).catch(() => {})
    }
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
            <F label="Nº de Convidados" name="num_convidados" value={form.num_convidados} onChange={set} placeholder="Ex: 120" />
          </div>
          <F label="Serviços" name="servicos" value={form.servicos} onChange={set} placeholder="Ex: Fotografia + Vídeo" />
        </div>

        {/* Preocupações */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-6 flex flex-col gap-4">
          <h2 className="text-xs tracking-[0.3em] text-gold uppercase mb-1">Preocupações / Mensagem Inicial</h2>
          <textarea
            value={form.mensagem ?? ''}
            onChange={e => set('mensagem', e.target.value)}
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

        {/* Gerar Proposta PDF */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs tracking-[0.3em] text-gold uppercase">Proposta PDF</h2>
              <p className="text-[11px] text-white/30 mt-1">Gera um PDF profissional com as 3 propostas</p>
            </div>
            <button
              onClick={() => window.open(`/crm/${id}/proposta-pdf`, '_blank')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wider transition-all bg-gold/90 hover:bg-gold text-black"
            >
              <span>↗</span> Gerar Proposta
            </button>
          </div>
          {form.proposta_pdf_url ? (
            <div className="flex items-center justify-between bg-gold/5 border border-gold/20 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-gold text-sm">✓</span>
                <span className="text-[11px] text-gold/80">Botão PDF visível para o cliente</span>
              </div>
              <a href={form.proposta_pdf_url} target="_blank" rel="noopener noreferrer"
                className="text-[11px] text-white/30 hover:text-white/60 underline transition-colors">
                Ver →
              </a>
            </div>
          ) : (
            <p className="text-[11px] text-white/20 italic">Gera a proposta para o link ser criado automaticamente.</p>
          )}
        </div>

        {/* Propostas Fotografia / Vídeo */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs tracking-[0.3em] text-gold uppercase">Propostas Fotografia / Vídeo</h2>
            <button
              onClick={handleSavePropostas}
              disabled={savingPropostas}
              className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition-all ${
                savedPropostas ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                'bg-gold/90 hover:bg-gold text-black disabled:opacity-40'
              }`}
            >
              {savingPropostas ? 'A guardar...' : savedPropostas ? '✓ Guardado' : 'Guardar Propostas'}
            </button>
          </div>

          {propostas.map((proposta, pi) => (
            <div key={pi} className="flex flex-col rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>

              {/* Card header — clicável para abrir/fechar */}
              <button
                onClick={() => setPropostaOpen(prev => ({ ...prev, [pi]: !prev[pi] }))}
                className="flex items-center justify-between gap-3 px-4 py-3 w-full text-left transition-colors hover:bg-white/3"
                style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] tracking-[0.4em] text-gold/60 uppercase shrink-0">Proposta {['1','2','3'][pi]}</span>
                  {proposta.nome && <span className="text-sm text-white/60">{proposta.nome}</span>}
                  {(proposta.servicos_foto.length + proposta.servicos_video.length) > 0 && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(201,168,76,0.12)', color: '#C9A84C', border: '0.5px solid rgba(201,168,76,0.3)' }}>
                      {proposta.servicos_foto.length + proposta.servicos_video.length} serviços
                    </span>
                  )}
                </div>
                <span className="text-white/30 text-xs transition-transform" style={{ display: 'inline-block', transform: propostaOpen[pi] ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
              </button>

              {propostaOpen[pi] && (
                <div className="flex flex-col gap-4 p-4" style={{ background: 'rgba(255,255,255,0.01)' }}>

                  {/* Nome */}
                  <input
                    type="text"
                    value={proposta.nome}
                    onChange={e => setProposta(pi, 'nome', e.target.value)}
                    placeholder="Ex: Essencial, Premium, Luxe…"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-gold/50"
                  />

                  {/* Serviços — duas colunas */}
                  <div className="grid grid-cols-2 gap-3">

                    {/* Fotografia */}
                    <div className="flex flex-col gap-1.5 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <p className="text-[9px] tracking-[0.4em] text-white/30 uppercase mb-1">📷 Fotografia</p>
                      {SERVICOS_FOTO.map(s => {
                        const active = (proposta.servicos_foto || []).includes(s)
                        return (
                          <button key={s} onClick={() => toggleServico(pi, 'servicos_foto', s)}
                            className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-lg transition-all"
                            style={active
                              ? { background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.35)' }
                              : { background: 'transparent', border: '1px solid transparent' }}>
                            <span className="w-4 h-4 rounded flex items-center justify-center shrink-0 text-[10px]"
                              style={active
                                ? { background: 'rgba(201,168,76,0.8)', color: '#0d0b07' }
                                : { background: 'rgba(255,255,255,0.06)', color: 'transparent', border: '1px solid rgba(255,255,255,0.12)' }}>
                              {active ? '✓' : ''}
                            </span>
                            <span className="text-xs leading-snug" style={{ color: active ? '#C9A84C' : 'rgba(255,255,255,0.45)' }}>{s}</span>
                          </button>
                        )
                      })}
                    </div>

                    {/* Vídeo */}
                    <div className="flex flex-col gap-1.5 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <p className="text-[9px] tracking-[0.4em] text-white/30 uppercase mb-1">🎥 Vídeo</p>
                      {SERVICOS_VIDEO.map(s => {
                        const active = (proposta.servicos_video || []).includes(s)
                        return (
                          <button key={s} onClick={() => toggleServico(pi, 'servicos_video', s)}
                            className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-lg transition-all"
                            style={active
                              ? { background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.35)' }
                              : { background: 'transparent', border: '1px solid transparent' }}>
                            <span className="w-4 h-4 rounded flex items-center justify-center shrink-0 text-[10px]"
                              style={active
                                ? { background: 'rgba(201,168,76,0.8)', color: '#0d0b07' }
                                : { background: 'rgba(255,255,255,0.06)', color: 'transparent', border: '1px solid rgba(255,255,255,0.12)' }}>
                              {active ? '✓' : ''}
                            </span>
                            <span className="text-xs leading-snug" style={{ color: active ? '#C9A84C' : 'rgba(255,255,255,0.45)' }}>{s}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Resumo selecionados */}
                  {((proposta.servicos_foto || []).length > 0 || (proposta.servicos_video || []).length > 0) && (
                    <div className="flex flex-col gap-1.5">
                      {(proposta.servicos_foto || []).length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          <span className="text-[9px] text-white/20 uppercase tracking-widest self-center mr-1">📷</span>
                          {(proposta.servicos_foto || []).map(s => (
                            <span key={s} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(201,168,76,0.12)', color: '#C9A84C', border: '0.5px solid rgba(201,168,76,0.3)' }}>{s}</span>
                          ))}
                        </div>
                      )}
                      {(proposta.servicos_video || []).length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          <span className="text-[9px] text-white/20 uppercase tracking-widest self-center mr-1">🎥</span>
                          {(proposta.servicos_video || []).map(s => (
                            <span key={s} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(100,160,255,0.1)', color: '#90b8ff', border: '0.5px solid rgba(100,160,255,0.25)' }}>{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Valor */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs tracking-widest text-white/30 uppercase">Valor Total</label>
                      <span className="text-[10px] text-white/20">Fotografia + Vídeo</span>
                    </div>
                    <input
                      type="text"
                      value={proposta.valor}
                      onChange={e => setProposta(pi, 'valor', e.target.value)}
                      placeholder="Ex: 3 500 €"
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-gold/50"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* ── Serviços Extras — secção partilhada ──────────────────────────── */}
          <div className="flex flex-col gap-2 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-[9px] tracking-[0.4em] text-gold/60 uppercase mb-1">✦ Serviços Extras — comuns às 3 propostas</p>
            <div className="grid grid-cols-2 gap-1">
              {EXTRAS_OPTIONS.map(s => {
                const active = extrasGlobais.some(e => e.nome === s)
                return (
                  <button key={s} onClick={() => toggleExtraGlobal(s)}
                    className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-lg transition-all"
                    style={active
                      ? { background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.35)' }
                      : { background: 'transparent', border: '1px solid transparent' }}>
                    <span className="w-4 h-4 rounded flex items-center justify-center shrink-0 text-[10px]"
                      style={active
                        ? { background: 'rgba(201,168,76,0.8)', color: '#0d0b07' }
                        : { background: 'rgba(255,255,255,0.06)', color: 'transparent', border: '1px solid rgba(255,255,255,0.12)' }}>
                      {active ? '✓' : ''}
                    </span>
                    <span className="text-xs leading-snug" style={{ color: active ? '#C9A84C' : 'rgba(255,255,255,0.45)' }}>{s}</span>
                  </button>
                )
              })}
            </div>
            {extrasGlobais.length > 0 && (
              <div className="flex flex-col gap-2 mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-[9px] tracking-[0.3em] text-white/20 uppercase">Valor por serviço extra</p>
                {extrasGlobais.map(e => (
                  <div key={e.nome} className="flex items-center gap-2">
                    <span className="text-[11px] text-white/40 flex-1 truncate">◆ {e.nome}</span>
                    <input
                      type="text"
                      value={e.valor}
                      onChange={ev => setExtraValorGlobal(e.nome, ev.target.value)}
                      placeholder="Ex: 250 €"
                      className="w-28 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-gold/50 text-right"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Página do Cliente */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs tracking-[0.3em] text-gold uppercase">Página do Cliente</h2>
            <span className={`text-xs px-2.5 py-1 rounded-full border ${
              form.page_publicada
                ? 'bg-green-500/15 text-green-400 border-green-500/30'
                : 'bg-white/5 text-white/25 border-white/10'
            }`}>
              {form.page_publicada ? '● Publicada' : '○ Despublicada'}
            </span>
          </div>

          {/* Estatísticas */}
          {form.page_token && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/3 rounded-xl px-4 py-3 flex flex-col gap-1">
                <span className="text-xs text-white/25 tracking-widest uppercase">Visitas</span>
                <span className="text-2xl font-light text-white">{form.page_views || '0'}</span>
              </div>
              <div className="bg-white/3 rounded-xl px-4 py-3 flex flex-col gap-1">
                <span className="text-xs text-white/25 tracking-widest uppercase">Confirmação</span>
                <span className={`text-sm font-light ${
                  form.page_confirmacao === 'confirmada' ? 'text-green-400' :
                  form.page_confirmacao === 'alteracao_pedida' ? 'text-yellow-400' :
                  'text-white/30'
                }`}>
                  {form.page_confirmacao === 'confirmada' ? '✓ Confirmada' :
                   form.page_confirmacao === 'alteracao_pedida' ? '⚠ Alteração pedida' :
                   '— Pendente'}
                </span>
              </div>
            </div>
          )}

          {/* Foto footer */}
          <div className="flex flex-col gap-1">
            <label className="text-xs tracking-widest text-white/30 uppercase">Foto Footer (URL)</label>
            <input
              type="url"
              value={form.page_foto_url ?? ''}
              onChange={e => set('page_foto_url', e.target.value)}
              placeholder="https://... (foto que aparece no fundo da página)"
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-gold/50"
            />
          </div>

          {/* Link copiável */}
          {form.page_token && (
            <button
              onClick={handleCopyLink}
              className={`w-full py-2.5 rounded-xl text-xs tracking-wider transition-all text-left px-4 flex items-center justify-between ${
                copied
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : 'bg-white/5 text-white/40 border border-white/10 hover:border-white/20'
              }`}
            >
              <span className="truncate font-mono text-xs">
                {window?.location?.origin}/r/{form.page_token}
              </span>
              <span className="ml-3 shrink-0">{copied ? '✓ Copiado' : 'Copiar'}</span>
            </button>
          )}

          {/* Botões publicar / despublicar */}
          <div className="flex gap-3">
            {!form.page_publicada ? (
              <button
                onClick={() => handleTogglePage(true)}
                disabled={togglingPage}
                className="flex-1 py-3 rounded-xl text-sm font-semibold tracking-wider transition-all bg-gold/90 hover:bg-gold text-black disabled:opacity-40"
              >
                {togglingPage ? 'A publicar...' : 'Publicar Página'}
              </button>
            ) : (
              <button
                onClick={() => handleTogglePage(false)}
                disabled={togglingPage}
                className="flex-1 py-3 rounded-xl text-sm tracking-wider transition-all bg-white/5 hover:bg-white/10 text-white/50 border border-white/10 disabled:opacity-40"
              >
                {togglingPage ? 'A despublicar...' : 'Despublicar'}
              </button>
            )}
          </div>
        </div>

        {/* Notas da Reunião */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs tracking-[0.3em] text-gold uppercase">Notas da Reunião</h2>
              <p className="text-[11px] text-white/25 mt-1">O que foi falado, decidido ou acordado</p>
            </div>
            <button
              onClick={() => {
                const now = new Date().toLocaleString('pt-PT', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })
                const prefix = `\n── ${now} ──\n`
                const current = form.reuniao_notas ?? ''
                set('reuniao_notas', prefix + current)
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] tracking-wider text-white/40 border border-white/10 hover:border-gold/40 hover:text-gold/80 transition-all"
            >
              <span>+</span> Nova entrada
            </button>
          </div>
          <textarea
            value={form.reuniao_notas ?? ''}
            onChange={e => set('reuniao_notas', e.target.value)}
            rows={8}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-gold/50 resize-y font-mono leading-relaxed"
            placeholder={`── 28/04/2026 14:30 ──\nCliente interessado em foto + vídeo.\nOrçamento até 3500€.\nDúvida sobre álbum — enviar exemplos.\n\n── 05/05/2026 10:00 ──\n...`}
          />
        </div>

        {/* Marcação de Reunião */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-6 flex flex-col gap-4">
          <h2 className="text-xs tracking-[0.3em] text-gold uppercase">Marcação de Reunião</h2>

          {/* Resumo se já agendada */}
          {form.reuniao_data && form.reuniao_hora && (
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl px-4 py-3 flex flex-col gap-2">
              <div className="flex items-center gap-3 text-sm text-purple-300">
                <span>📅</span>
                <span>{form.reuniao_data} às {form.reuniao_hora}</span>
                <span className="text-purple-400/50">·</span>
                <span>{form.reuniao_tipo || 'Presencial'}</span>
              </div>
              {form.reuniao_link && (
                <a
                  href={form.reuniao_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 text-xs hover:opacity-80 transition-opacity font-mono tracking-wide ${
                    form.reuniao_tipo === 'Videochamada' ? 'text-green-400' : 'text-blue-400'
                  }`}
                >
                  <span>{form.reuniao_tipo === 'Videochamada' ? '🎥' : '📍'}</span>
                  <span>{form.reuniao_tipo === 'Videochamada' ? form.reuniao_link : 'Ver localização no Google Maps'}</span>
                </a>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs tracking-widest text-white/30 uppercase">Data</label>
              <input
                type="date"
                value={form.reuniao_data ?? ''}
                onChange={e => set('reuniao_data', e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold/50"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs tracking-widest text-white/30 uppercase">Hora</label>
              <input
                type="time"
                value={form.reuniao_hora ?? ''}
                onChange={e => set('reuniao_hora', e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold/50"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs tracking-widest text-white/30 uppercase">Tipo</label>
            <select
              value={form.reuniao_tipo ?? 'Presencial'}
              onChange={e => set('reuniao_tipo', e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold/50"
            >
              <option value="Presencial" className="bg-zinc-900">Presencial</option>
              <option value="Videochamada" className="bg-zinc-900">Videochamada</option>
            </select>
          </div>
          <button
            onClick={handleEnviarReuniao}
            disabled={sendingReuniao}
            className={`w-full py-3 rounded-xl text-sm font-semibold tracking-wider transition-all ${
              reuniaoSent
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-white/8 hover:bg-white/12 text-white border border-white/15 hover:border-white/30'
            } disabled:opacity-40`}
          >
            {sendingReuniao ? 'A enviar...' : reuniaoSent ? '✓ Reunião Agendada' : 'Enviar'}
          </button>
          {form.reuniao_enviada_at && (
            <p className="text-[11px] text-white/25 text-center tracking-wide">
              ✓ Enviado a {new Date(form.reuniao_enviada_at).toLocaleString('pt-PT', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
              })}
            </p>
          )}
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
