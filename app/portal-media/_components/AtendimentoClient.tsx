'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { Projeto } from '@/app/portal-media/_data/mockProject'
import AdminBar from './AdminBar'
import EditableField from './EditableField'
import HeroUploadBlock from './HeroUploadBlock'
import ChatBox from './ChatBox'

interface Props { projeto: Projeto; isAdmin: boolean }

// Iniciais para o avatar do contacto (ex.: "Rui Lima" → "RL")
const iniciais = (nome: string) => {
  const partes = (nome ?? '').trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return 'RL'
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

// Número para o wa.me: só dígitos; números portugueses de 9 dígitos levam o 351
const numeroWhatsApp = (tel: string) => {
  const d = (tel ?? '').replace(/\D/g, '').replace(/^00/, '')
  if (d.length === 9) return `351${d}`
  return d
}

const PASSOS = [
  { n: '01', t: 'Gestor dedicado',        d: 'Tens um gestor de conta atribuído ao teu projeto, responsável por acompanhar todo o processo e responder às tuas questões.' },
  { n: '02', t: 'Horário de atendimento', d: 'De segunda a sexta-feira, das 10h00 às 18h00. Fora deste horário, as mensagens são respondidas no dia útil seguinte.' },
  { n: '03', t: 'Chat do projeto',        d: 'Usa o chat em baixo para falares diretamente com a equipa sobre o projeto, sem precisares de email ou WhatsApp.' },
  { n: '04', t: 'Contacto direto',        d: 'Se preferires, podes ligar, enviar email ou WhatsApp. Os contactos estão todos nesta página.' },
]

const IconeTel = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
  </svg>
)
const IconeEmail = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
    <rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" />
  </svg>
)
const IconeWhats = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
    <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" /><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5" />
  </svg>
)

export default function AtendimentoClient({ projeto: initial, isAdmin }: Props) {
  const [projeto, setProjeto] = useState(initial)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [heroUrl, setHeroUrl] = useState(initial.atendimentoImageUrl ?? '')

  const save = async () => {
    setSaving(true)
    try {
      await fetch(`/api/media-portal/${projeto.ref}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gestorNome: projeto.gestorNome,
          gestorEmail: projeto.gestorEmail,
          gestorTelefone: projeto.gestorTelefone,
          atendimentoImageUrl: heroUrl,
        }),
      })
    } catch {}
    setSaving(false)
    setIsEditing(false)
  }

  const cancel = () => { setProjeto(initial); setIsEditing(false) }
  const set = (field: keyof Projeto, value: string) =>
    setProjeto(p => ({ ...p, [field]: value }))

  const wa = numeroWhatsApp(projeto.gestorTelefone)
  const botao = 'flex items-center justify-center gap-2 rounded-md px-4 py-3 text-[14px] font-medium transition-colors'

  return (
    <>
      <HeroUploadBlock url={heroUrl} isEditing={isEditing} onChange={setHeroUrl} />
      <div className="rlp relative z-10 max-w-3xl mx-auto px-4 sm:px-8 py-8 sm:py-10">

        <Link href={`/portal-media/${projeto.ref}`}
          className="rlp-m inline-flex items-center gap-2 text-[10px] text-white/45 hover:text-white transition-colors mb-8 group">
          <span className="group-hover:-translate-x-1 transition-transform duration-200">‹</span>
          Portal {projeto.nome}
        </Link>

        <header className="mb-8">
          <p className="rlp-m traco text-[10px] text-[#5a8bff] mb-3">RL PROD · {projeto.nome}</p>
          <h1 className="rlp-t text-[clamp(32px,7vw,48px)] leading-none text-white">Atendimento</h1>
          <p className="mt-3 text-[15px] text-white/65 leading-relaxed max-w-xl">
            A tua linha direta com a nossa equipa. Aqui tens os contactos do teu gestor de conta e o chat do projeto.
          </p>
        </header>

        {/* Gestor de conta */}
        <section className="rounded-2xl border border-white/[0.1] bg-[#00141f]/70 p-5 sm:p-6 mb-4">
          <p className="rlp-m text-[10px] text-[#7c8893] mb-4">Gestor de conta</p>
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-full bg-[#2e6cf6] flex items-center justify-center shrink-0">
              <span className="rlp-t text-[20px] text-white select-none">{iniciais(projeto.gestorNome)}</span>
            </div>
            <div className="min-w-0 flex-1">
              <EditableField
                value={projeto.gestorNome}
                isEditing={isEditing}
                onChange={v => set('gestorNome', v)}
                className="rlp-t text-[20px] text-white block truncate"
                placeholder="Nome do gestor"
              />
              <p className="text-[13px] text-[#a9c1ff] mt-0.5">RL PROD · Photography &amp; Video</p>
            </div>
          </div>

          {isEditing ? (
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="rlp-m text-[9px] text-[#7c8893]">Email</span>
                <EditableField
                  value={projeto.gestorEmail}
                  isEditing={true}
                  onChange={v => set('gestorEmail', v)}
                  className="text-[15px]"
                  placeholder="geral.rlmedia@gmail.com"
                  type="email"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="rlp-m text-[9px] text-[#7c8893]">Telefone</span>
                <EditableField
                  value={projeto.gestorTelefone}
                  isEditing={true}
                  onChange={v => set('gestorTelefone', v)}
                  className="text-[15px]"
                  placeholder="+351 900 000 000"
                  type="tel"
                />
              </label>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {projeto.gestorTelefone && (
                  <a href={`tel:${projeto.gestorTelefone}`}
                    className={`${botao} bg-[#2e6cf6] text-white hover:bg-[#5a8bff]`}>
                    <IconeTel /> Ligar
                  </a>
                )}
                {projeto.gestorEmail && (
                  <a href={`mailto:${projeto.gestorEmail}`}
                    className={`${botao} border border-white/[0.14] bg-[#0c2236]/70 text-white hover:border-[#2e6cf6]`}>
                    <IconeEmail /> Email
                  </a>
                )}
                {wa && (
                  <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer"
                    className={`${botao} border border-white/[0.14] bg-[#0c2236]/70 text-white hover:border-[#2e6cf6]`}>
                    <IconeWhats /> WhatsApp
                  </a>
                )}
              </div>
              <div className="mt-4 flex flex-col sm:flex-row sm:gap-6 gap-1 text-[13px] text-white/55">
                {projeto.gestorEmail && <span className="truncate">{projeto.gestorEmail}</span>}
                {projeto.gestorTelefone && <span>{projeto.gestorTelefone}</span>}
              </div>
            </>
          )}
        </section>

        {/* Horário + site */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          <div className="rounded-2xl bg-[#0c2236]/70 border border-white/[0.1] px-5 py-4">
            <p className="rlp-m text-[9px] text-[#7c8893] mb-1.5">Horário</p>
            <p className="text-[15px] text-white">Segunda a sexta-feira</p>
            <p className="text-[15px] text-[#a9c1ff]">10h00 às 18h00</p>
          </div>
          <a href="https://www.rlprod.pt" target="_blank" rel="noopener noreferrer"
            className="group rounded-2xl bg-[#0c2236]/70 border border-white/[0.1] hover:border-[#2e6cf6] px-5 py-4 flex items-center justify-between transition-colors">
            <div>
              <p className="rlp-m text-[9px] text-[#7c8893] mb-1.5">Site</p>
              <p className="text-[15px] text-white">RL PROD · Photography &amp; Video</p>
              <p className="text-[13px] text-[#5a8bff]">www.rlprod.pt</p>
            </div>
            <span className="text-white/40 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all">↗</span>
          </a>
        </div>

        {/* Como funciona */}
        <section className="rounded-2xl border border-white/[0.1] bg-[#00141f]/70 p-5 sm:p-6 mb-10">
          <p className="rlp-m traco text-[10px] text-[#5a8bff] mb-4">Como funciona</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PASSOS.map(({ n, t, d }) => (
              <div key={n} className="rounded-xl bg-[#0c2236]/70 px-4 py-4">
                <p className="rlp-m text-[10px] text-[#5a8bff] mb-2">{n}</p>
                <p className="rlp-t text-[17px] text-white mb-1">{t}</p>
                <p className="text-[14px] text-white/60 leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Chat */}
        <section className="mb-10">
          <p className="rlp-m traco text-[10px] text-[#5a8bff] mb-3">Mensagens</p>
          <h2 className="rlp-t text-[26px] leading-none text-white mb-2">Chat do projeto</h2>
          <p className="text-[15px] text-white/60 leading-relaxed mb-5">
            Coloca questões, partilha ideias ou acompanha o andamento do projeto. A nossa equipa responde assim que possível.
          </p>
          <ChatBox
            projetoRef={projeto.ref}
            isAdmin={isAdmin}
            clienteNome={projeto.cliente}
          />
        </section>
      </div>

      {isAdmin && (
        <AdminBar isEditing={isEditing} saving={saving}
          onToggle={() => setIsEditing(true)} onSave={save} onCancel={cancel} />
      )}
    </>
  )
}
