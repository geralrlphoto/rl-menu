'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { linkPublico } from '@/lib/site-url'
import {
  STATUSES, MOTIVOS_NAO_FECHOU, FOLLOW_PARADO_DIAS, colunaDe, daysSince, estadoAcao,
  fmtDataCurta, whatsappLink, mensagemBoasVindas, mensagemLembreteReuniao, mensagemPortalReuniao, mensagemFollowUp, mensagemFollowUp2, mensagemFecho, diasParaFollowUp, FOLLOW2_WA_DIAS, telLink, type ColunaKey,
} from '@/lib/crm'

export type Contact = {
  id: string
  notion_id?: string | null
  nome: string
  contato: string
  email: string
  status: string
  lead_prioridade: string
  tipo_evento: string
  data_casamento: string
  data_entrada: string
  local_casamento: string
  orcamento: string
  como_chegou: string
  servicos: string
  status_updated_at: string
  data_fecho: string
  proxima_acao: string | null
  proxima_acao_data: string | null
  motivo_nao_fechou: string | null
  reuniao_data?: string | null
  reuniao_hora?: string | null
  page_token?: string | null
  page_tipo?: string | null
}

export const statusColor: Record<string, string> = {
  'Fechou': 'bg-green-500/20 text-green-400 border-green-500/30',
  'Negociação': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'Follow Up 1': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'Follow Up 2': 'bg-amber-600/20 text-amber-500 border-amber-600/30',
  'Follow Up 3': 'bg-orange-600/20 text-orange-500 border-orange-600/30',
  'Por Contactar': 'bg-red-500/20 text-red-400 border-red-500/30',
  'Contactado': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Reunião Agendada': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'NÃO FECHOU': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  'Agendar Reunião': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'Sem resposta': 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  'Encerrado': 'bg-gray-700/20 text-gray-500 border-gray-700/30',
  'Cancelado': 'bg-red-900/20 text-red-600 border-red-900/30',
  'Iniciar': 'bg-white/10 text-white/50 border-white/20',
}

export function StatusSelect({ value, onChange, className = '' }: { value: string; onChange: (s: string) => void; className?: string }) {
  return (
    <select
      value={value ?? ''}
      onClick={e => e.stopPropagation()}
      onChange={e => onChange(e.target.value)}
      className={`text-xs px-2 py-1 rounded-full border cursor-pointer focus:outline-none bg-transparent min-w-0 ${statusColor[value] ?? 'bg-white/10 text-white/50 border-white/20'} ${className}`}
    >
      {!STATUSES.includes(value) && <option value={value ?? ''} className="bg-zinc-900 text-white">{value || 'Sem status'}</option>}
      {STATUSES.map(s => <option key={s} value={s} className="bg-zinc-900 text-white">{s}</option>)}
    </select>
  )
}

/* ── Botões rápidos: WhatsApp, telefone, email ── */
export function ContactButtons({ c, size = 'sm' }: { c: Contact; size?: 'sm' | 'md' }) {
  const wa = whatsappLink(c.contato)
  const tel = telLink(c.contato)
  const box = size === 'md' ? 'w-9 h-9' : 'w-7 h-7'
  const icon = size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5'
  const base = `${box} rounded-lg border flex items-center justify-center transition-colors`
  const stop = (e: React.MouseEvent) => e.stopPropagation()
  return (
    <div className="flex items-center gap-1.5">
      {wa && (
        <a href={wa} target="_blank" rel="noopener noreferrer" onClick={stop} title="WhatsApp"
          className={`${base} border-green-500/20 text-green-400/70 hover:text-green-400 hover:border-green-500/50`}>
          <svg className={icon} viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3zM12 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4c-1-1.6-1.5-3.4-1.5-5.2 0-5.4 4.4-9.8 9.8-9.8 2.6 0 5.1 1 6.9 2.9 1.8 1.8 2.9 4.3 2.9 6.9 0 5.4-4.4 9.8-9.8 9.8zm8.4-18.2C18.2 1.3 15.2 0 12 0 5.4 0 .1 5.3.1 11.9c0 2.1.6 4.1 1.6 5.9L0 24l6.3-1.7c1.7.9 3.7 1.4 5.7 1.4 6.6 0 11.9-5.3 11.9-11.9 0-3.2-1.2-6.2-3.5-8.4z"/></svg>
        </a>
      )}
      {tel && (
        <a href={tel} onClick={stop} title="Ligar"
          className={`${base} border-blue-500/20 text-blue-400/70 hover:text-blue-400 hover:border-blue-500/50`}>
          <svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.3a1 1 0 01.9.7l1.5 4.5a1 1 0 01-.5 1.2l-2.3 1.1a11 11 0 005.5 5.5l1.1-2.3a1 1 0 011.2-.5l4.5 1.5a1 1 0 01.7.9V19a2 2 0 01-2 2h-1C9.7 21 3 14.3 3 6V5z"/></svg>
        </a>
      )}
      {c.email && (
        <a href={`mailto:${c.email}`} onClick={stop} title="Email"
          className={`${base} border-gold/20 text-gold/60 hover:text-gold hover:border-gold/50`}>
          <svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.9 5.3a2 2 0 002.2 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
        </a>
      )}
    </div>
  )
}

/* ── Botão que abre o WhatsApp com a mensagem escrita e regista o envio no histórico ── */
function WhatsAppMsgButton({ c, texto, evento, label, enviados, onEnviado, onPortal }: {
  c: Contact
  /* Com onPortal, o texto recebe o link do portal; se a lead ainda não tiver portal, é criado no clique */
  texto: string | ((portal: string) => string)
  evento: string; label: string
  enviados: Record<string, string>; onEnviado: (evento: string) => void
  onPortal?: (token: string) => void
}) {
  const [aCriar, setACriar] = useState(false)
  const portal = portalUrl(c)
  const semPortal = !!onPortal && !portal
  const href = typeof texto === 'string'
    ? whatsappLink(c.contato, texto)
    : whatsappLink(c.contato, portal ? texto(portal) : '')
  if (!href) return null
  // Depois de enviado fica bloqueado (o registo no histórico é a fonte de verdade)
  if (evento in enviados) {
    return (
      <div onClick={e => e.stopPropagation()}
        className="text-[11px] font-semibold tracking-wider uppercase text-center px-3 py-2 rounded-lg border border-white/10 text-white/35 bg-white/[0.03] cursor-not-allowed select-none">
        ✓ {label} · Enviado
      </div>
    )
  }
  return (
    <a
      href={href}
      target="_blank" rel="noopener noreferrer"
      onClick={async e => {
        e.stopPropagation()
        if (semPortal) {
          e.preventDefault()
          if (aCriar) return
          // Abre já a janela (senão o browser bloqueia) e só depois de criado o portal aponta para o WhatsApp
          const w = window.open('', '_blank')
          setACriar(true)
          const res = await fetch('/api/lead-page/toggle-publish', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: c.id, publish: true }),
          }).then(r => r.json()).catch(() => null)
          setACriar(false)
          if (!res?.token) { w?.close(); alert('Não foi possível criar o portal desta lead.'); return }
          onPortal!(res.token)
          const url = portalUrl({ ...c, page_token: res.token })!
          const link = whatsappLink(c.contato, (texto as (p: string) => string)(url))!
          if (w) w.location.href = link; else window.open(link, '_blank')
        }
        onEnviado(evento)
        supabase.from('crm_status_history').insert({ contact_id: c.id, evento })
          .then(() => { fetch('/api/revalidate-photo?tag=whatsapp', { method: 'POST' }).catch(() => {}) })
      }}
      className="text-[11px] font-semibold tracking-wider uppercase text-center px-3 py-2 rounded-lg border border-green-500/30 text-green-400 bg-green-500/10 hover:bg-green-500/20 hover:border-green-500/50 transition-colors"
    >
      {aCriar ? 'A criar portal…' : label}
    </a>
  )
}

function portalUrl(c: Contact): string | null {
  if (!c.page_token) return null
  return linkPublico(`/${c.page_tipo === 'batizado' ? 'b' : 'r'}/${c.page_token}`)
}

function AcaoLinha({ c }: { c: Contact }) {
  const estado = estadoAcao(c.proxima_acao_data)
  if (!c.proxima_acao && !estado) return null
  const cor = estado === 'atrasada' ? 'text-red-400 bg-red-500/10 border-red-500/20'
    : estado === 'hoje' ? 'text-orange-400 bg-orange-500/10 border-orange-500/20'
    : 'text-white/50 bg-white/[0.03] border-white/8'
  return (
    <div className={`text-[11px] px-2 py-1 rounded-md border flex items-center gap-1.5 ${cor}`}>
      <span>→</span>
      <span className="truncate">{c.proxima_acao || 'Próxima ação'}</span>
      {c.proxima_acao_data && (
        <span className="ml-auto flex-shrink-0 font-semibold">
          {estado === 'hoje' ? 'Hoje' : fmtDataCurta(c.proxima_acao_data)}
        </span>
      )}
    </div>
  )
}

/* ── CARTÃO DO QUADRO ── */
export function KanbanCard({ c, coluna, diasNoPasso, enviados, onEnviado, onPortal, onOpen, onStatusChange, dragging, onDragStart, onDragEnd }: {
  c: Contact
  coluna: ColunaKey
  diasNoPasso: number
  enviados: Record<string, string>  // evento → quando foi enviado
  onEnviado: (evento: string) => void
  onPortal: (token: string) => void
  onOpen: () => void
  onStatusChange: (id: string, s: string) => void
  dragging: boolean
  onDragStart: () => void
  onDragEnd: () => void
}) {
  const dias = daysSince(c.status_updated_at || c.data_entrada)
  const fechou = c.status === 'Fechou'
  const acaoFutura = estadoAcao(c.proxima_acao_data) === 'futura' || estadoAcao(c.proxima_acao_data) === 'hoje'
  const parado = coluna === 'follow' && diasNoPasso >= FOLLOW_PARADO_DIAS && !acaoFutura

  return (
    <div
      draggable
      onDragStart={e => { e.dataTransfer.setData('text/plain', c.id); e.dataTransfer.effectAllowed = 'move'; onDragStart() }}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      className={`rounded-xl border bg-[#111111] hover:border-gold/30 transition-all p-4 flex flex-col gap-3 cursor-grab active:cursor-grabbing ${parado ? 'border-red-500/30' : 'border-white/8'} ${dragging ? 'opacity-40 scale-[0.98]' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-white text-sm font-medium leading-snug line-clamp-2">{c.nome || 'Sem nome'}</span>
        {coluna === 'follow' && (
          <span
            title="Dias em follow up"
            className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-md ${dias >= 14 ? 'bg-red-500/20 text-red-400' : dias >= 7 ? 'bg-orange-500/20 text-orange-400' : 'bg-yellow-500/15 text-yellow-400'}`}
          >
            {dias}d
          </span>
        )}
        {coluna === 'encerrada' && (
          <span className={`flex-shrink-0 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-md ${fechou ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-white/40'}`}>
            {fechou ? 'Fechou' : 'Não fechou'}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-white/35">
        <span className="truncate">{c.tipo_evento?.replace(/[\[\]"]/g, '') || '—'}</span>
        <span className="flex-shrink-0">{c.data_casamento || c.data_entrada || '—'}</span>
      </div>

      {coluna === 'follow' && (
        <div className="text-[11px] text-white/30">
          Em follow up há <span className="text-white/60">{dias} {dias === 1 ? 'dia' : 'dias'}</span>
        </div>
      )}

      {parado && (
        <div className="text-[11px] text-red-400 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          Parado há {diasNoPasso} dias em {c.status}, sem próxima ação
        </div>
      )}

      {coluna !== 'encerrada' && <AcaoLinha c={c} />}

      {coluna === 'encerrada' && !fechou && c.motivo_nao_fechou && (
        <div className="text-[11px] text-white/35">Motivo: <span className="text-white/60">{c.motivo_nao_fechou}</span></div>
      )}

      <div className="flex items-center justify-between gap-2">
        <StatusSelect value={c.status} onChange={s => onStatusChange(c.id, s)} />
        {c.orcamento && <span className="text-gold text-xs font-semibold whitespace-nowrap">{c.orcamento} €</span>}
      </div>

      {coluna === 'nova' && (
        <WhatsAppMsgButton c={c} texto={mensagemBoasVindas(c.nome)} evento="WhatsApp de boas-vindas enviado" label="Boas-vindas" enviados={enviados} onEnviado={onEnviado} />
      )}

      {coluna === 'reuniao' && whatsappLink(c.contato) && !(c.reuniao_data && c.reuniao_hora) && (
        <Link
          href={`/crm/${c.id}`}
          onClick={e => e.stopPropagation()}
          title="Preenche a data e a hora da reunião na ficha para desbloquear o envio"
          className="text-[11px] font-semibold tracking-wider uppercase text-center px-3 py-2 rounded-lg border border-white/10 text-white/40 bg-white/[0.03] hover:text-white/70 hover:border-white/25 transition-colors"
        >
          🔒 Agendar reunião
        </Link>
      )}

      {coluna === 'reuniao' && whatsappLink(c.contato) && c.reuniao_data && c.reuniao_hora && (
        <div className="flex flex-col gap-1.5">
          <WhatsAppMsgButton c={c} texto={p => mensagemPortalReuniao(c.nome, p, c.reuniao_data, c.reuniao_hora)} evento="WhatsApp portal da reunião enviado" label="Portal da reunião" enviados={enviados} onEnviado={onEnviado} onPortal={onPortal} />
          <WhatsAppMsgButton c={c} texto={mensagemLembreteReuniao(c.nome, c.reuniao_hora)} evento="WhatsApp lembrete 1h enviado" label="Lembrete: falta 1 hora" enviados={enviados} onEnviado={onEnviado} />
        </div>
      )}

      {coluna === 'follow' && whatsappLink(c.contato) && (() => {
        const faltam = diasParaFollowUp(c.reuniao_data || c.status_updated_at)
        const enviado1 = enviados['WhatsApp follow-up enviado']
        if (enviado1) {
          const faltam2 = diasParaFollowUp(enviado1, FOLLOW2_WA_DIAS)
          return (
            <div className="flex flex-col gap-1.5">
              <WhatsAppMsgButton c={c} texto="" evento="WhatsApp follow-up enviado" label="Follow up" enviados={enviados} onEnviado={onEnviado} />
              {faltam2 > 0 && !('WhatsApp 2.º follow-up enviado' in enviados) ? (
                <div onClick={e => e.stopPropagation()}
                  title="O 2.º follow up fica disponível 8 dias depois do 1.º, se não houver resposta"
                  className="text-[11px] font-semibold tracking-wider uppercase text-center px-3 py-2 rounded-lg border border-white/10 text-white/35 bg-white/[0.03] cursor-not-allowed select-none">
                  🔒 2.º Follow up · {faltam2 === 1 ? 'Falta 1 dia' : `Faltam ${faltam2} dias`}
                </div>
              ) : (
                <WhatsAppMsgButton c={c} texto={mensagemFollowUp2(c.nome, c.data_casamento)} evento="WhatsApp 2.º follow-up enviado" label="2.º Follow up" enviados={enviados} onEnviado={onEnviado} />
              )}
            </div>
          )
        }
        if (faltam > 0) return (
          <div onClick={e => e.stopPropagation()}
            title="O follow up pelo WhatsApp fica disponível 3 dias depois da reunião"
            className="text-[11px] font-semibold tracking-wider uppercase text-center px-3 py-2 rounded-lg border border-white/10 text-white/35 bg-white/[0.03] cursor-not-allowed select-none">
            🔒 Follow up · {faltam === 1 ? 'Falta 1 dia' : `Faltam ${faltam} dias`}
          </div>
        )
        return <WhatsAppMsgButton c={c} texto={mensagemFollowUp(c.nome, c.data_casamento)} evento="WhatsApp follow-up enviado" label="Follow up" enviados={enviados} onEnviado={onEnviado} />
      })()}

      {coluna === 'follow' && (
        <WhatsAppMsgButton c={c} texto={mensagemFecho(c.nome, c.data_casamento, portalUrl(c))} evento="WhatsApp fecho enviado" label="Aceitaram a proposta" enviados={enviados} onEnviado={onEnviado} />
      )}

      {coluna !== 'encerrada' && (c.contato || c.email) && (
        <div className="pt-1 border-t border-white/5">
          <ContactButtons c={c} />
        </div>
      )}
    </div>
  )
}

/* ── MODAL ENCERRAR: Fechou / Não fechou + motivo ── */
export function EncerrarModal({ nome, inicial, onCancel, onConfirm }: {
  nome: string
  inicial: 'escolher' | 'nao'
  onCancel: () => void
  onConfirm: (status: string, motivo: string | null) => void
}) {
  const [passo, setPasso] = useState<'escolher' | 'nao'>(inicial)
  const [motivo, setMotivo] = useState('')
  const [outro, setOutro] = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  const motivoFinal = motivo === 'Outro' ? (outro.trim() ? `Outro: ${outro.trim()}` : 'Outro') : motivo

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onCancel}>
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0f0f0f] p-6 flex flex-col gap-5" onClick={e => e.stopPropagation()}>
        <div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-white/30">Encerrar lead</p>
          <h3 className="text-white text-lg font-light mt-1">{nome || 'Sem nome'}</h3>
        </div>

        {passo === 'escolher' ? (
          <>
            <p className="text-sm text-white/50">Como terminou esta lead?</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => onConfirm('Fechou', null)}
                className="py-4 rounded-xl border border-green-500/30 bg-green-500/10 text-green-400 text-sm font-semibold tracking-wider uppercase hover:bg-green-500/20 transition-colors">
                Fechou
              </button>
              <button onClick={() => setPasso('nao')}
                className="py-4 rounded-xl border border-white/10 bg-white/5 text-white/60 text-sm font-semibold tracking-wider uppercase hover:bg-white/10 transition-colors">
                Não fechou
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-white/50">Porque não fechou?</p>
            <div className="flex flex-wrap gap-2">
              {MOTIVOS_NAO_FECHOU.map(m => (
                <button key={m} onClick={() => setMotivo(m)}
                  className={`px-3 py-2 rounded-lg border text-xs transition-colors ${motivo === m ? 'border-gold/60 bg-gold/15 text-gold' : 'border-white/10 text-white/60 hover:border-white/30'}`}>
                  {m}
                </button>
              ))}
            </div>
            {motivo === 'Outro' && (
              <input autoFocus value={outro} onChange={e => setOutro(e.target.value)} placeholder="Escreve o motivo"
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-gold/50" />
            )}
            <button disabled={!motivo} onClick={() => onConfirm('NÃO FECHOU', motivoFinal)}
              className="py-3 rounded-xl bg-gold/90 hover:bg-gold text-black text-sm font-semibold tracking-wider uppercase disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              Guardar
            </button>
          </>
        )}

        <button onClick={onCancel} className="text-xs text-white/30 hover:text-white/60 tracking-widest uppercase">Cancelar</button>
      </div>
    </div>
  )
}

/* ── PAINEL LATERAL (ficha rápida) ── */
type Historico = { id: string; status_de: string | null; status_para: string | null; evento: string | null; created_at: string }

export function LeadDrawer({ c, onClose, onStatusChange, onPatch }: {
  c: Contact
  onClose: () => void
  onStatusChange: (id: string, s: string) => void
  onPatch: (id: string, patch: Partial<Contact>) => Promise<void>
}) {
  const [extra, setExtra] = useState<{ notas: string; mensagem: string } | null>(null)
  const [notas, setNotas] = useState('')
  const [historico, setHistorico] = useState<Historico[]>([])
  const [acao, setAcao] = useState(c.proxima_acao ?? '')
  const [acaoData, setAcaoData] = useState(c.proxima_acao_data ?? '')
  const [guardado, setGuardado] = useState('')

  useEffect(() => {
    setAcao(c.proxima_acao ?? '')
    setAcaoData(c.proxima_acao_data ?? '')
  }, [c.id, c.proxima_acao, c.proxima_acao_data])

  useEffect(() => {
    let vivo = true
    setExtra(null)
    supabase.from('crm_contacts').select('notas,mensagem').eq('id', c.id).single()
      .then(({ data }) => { if (vivo) { setExtra({ notas: data?.notas ?? '', mensagem: data?.mensagem ?? '' }); setNotas(data?.notas ?? '') } })
    supabase.from('crm_status_history').select('id,status_de,status_para,evento,created_at').eq('contact_id', c.id).order('created_at', { ascending: false }).limit(30)
      .then(({ data }) => { if (vivo) setHistorico(data ?? []) })
    return () => { vivo = false }
  }, [c.id, c.status])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const flash = (msg: string) => { setGuardado(msg); setTimeout(() => setGuardado(''), 1800) }

  const guardarAcao = async () => {
    await onPatch(c.id, { proxima_acao: acao.trim() || null, proxima_acao_data: acaoData || null })
    flash('Próxima ação guardada')
  }
  const concluirAcao = async () => {
    setAcao(''); setAcaoData('')
    await onPatch(c.id, { proxima_acao: null, proxima_acao_data: null })
    flash('Ação concluída')
  }
  const guardarNotas = async () => {
    if (extra && notas === extra.notas) return
    await supabase.from('crm_contacts').update({ notas }).eq('id', c.id)
    setExtra(e => e ? { ...e, notas } : e)
    flash('Notas guardadas')
  }

  const estado = estadoAcao(acaoData)
  const Info = ({ label, value }: { label: string; value?: string | null }) => value ? (
    <div>
      <div className="text-[10px] tracking-widest uppercase text-white/25 mb-0.5">{label}</div>
      <div className="text-sm text-white/75 break-words">{value}</div>
    </div>
  ) : null

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
      <aside
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-md h-full bg-[#0c0c0c] border-l border-white/10 overflow-y-auto"
        style={{ animation: 'crmSlideIn .25s ease-out' }}
      >
        <style>{`@keyframes crmSlideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
        <div className="sticky top-0 z-10 bg-[#0c0c0c]/95 backdrop-blur border-b border-white/5 px-6 py-4 flex items-center justify-between">
          <span className="text-[10px] tracking-[0.3em] uppercase text-white/30">Ficha rápida</span>
          <div className="flex items-center gap-3">
            {guardado && <span className="text-xs text-green-400">✓ {guardado}</span>}
            <button onClick={onClose} className="text-white/40 hover:text-white text-xl leading-none" aria-label="Fechar">×</button>
          </div>
        </div>

        <div className="px-6 py-6 flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <h2 className="text-2xl font-light text-white leading-tight">{c.nome || 'Sem nome'}</h2>
            <div className="flex items-center gap-3 flex-wrap">
              <StatusSelect value={c.status} onChange={s => onStatusChange(c.id, s)} />
              {c.orcamento && <span className="text-gold text-sm font-semibold">{c.orcamento} €</span>}
            </div>
            <ContactButtons c={c} size="md" />
          </div>

          {/* Próxima ação */}
          {colunaDe(c.status) !== 'encerrada' && (
            <section className={`rounded-xl border p-4 flex flex-col gap-3 ${estado === 'atrasada' ? 'border-red-500/30 bg-red-500/5' : estado === 'hoje' ? 'border-orange-500/30 bg-orange-500/5' : 'border-white/8 bg-white/[0.02]'}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] tracking-[0.3em] uppercase text-gold">Próxima ação</h3>
                {estado === 'atrasada' && <span className="text-[10px] tracking-wider uppercase text-red-400 font-semibold">Atrasada</span>}
                {estado === 'hoje' && <span className="text-[10px] tracking-wider uppercase text-orange-400 font-semibold">Hoje</span>}
              </div>
              <input value={acao} onChange={e => setAcao(e.target.value)} placeholder="Ex: Ligar para saber da proposta"
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-gold/50" />
              <div className="flex flex-wrap gap-2">
                {[['Amanhã', 1], ['3 dias', 3], ['1 semana', 7]].map(([label, n]) => (
                  <button key={label} type="button"
                    onClick={() => { const d = new Date(); d.setDate(d.getDate() + (n as number)); setAcaoData(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`) }}
                    className="px-2.5 py-1 rounded-md border border-white/10 text-[11px] text-white/50 hover:text-gold hover:border-gold/40 transition-colors">
                    {label}
                  </button>
                ))}
                <input type="date" value={acaoData} onChange={e => setAcaoData(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-[11px] text-white/70 focus:outline-none focus:border-gold/50 [color-scheme:dark]" />
              </div>
              <div className="flex gap-2">
                <button onClick={guardarAcao}
                  disabled={acao === (c.proxima_acao ?? '') && acaoData === (c.proxima_acao_data ?? '')}
                  className="flex-1 py-2 rounded-lg bg-gold/90 hover:bg-gold text-black text-xs font-semibold tracking-wider uppercase disabled:opacity-30 transition-colors">
                  Guardar
                </button>
                {(c.proxima_acao || c.proxima_acao_data) && (
                  <button onClick={concluirAcao}
                    className="px-4 py-2 rounded-lg border border-green-500/30 text-green-400 text-xs font-semibold tracking-wider uppercase hover:bg-green-500/10 transition-colors">
                    ✓ Feita
                  </button>
                )}
              </div>
            </section>
          )}

          {c.status === 'NÃO FECHOU' && (
            <section className="flex flex-col gap-2">
              <h3 className="text-[10px] tracking-[0.3em] uppercase text-gold">Motivo</h3>
              <select value={MOTIVOS_NAO_FECHOU.includes(c.motivo_nao_fechou ?? '') ? c.motivo_nao_fechou ?? '' : (c.motivo_nao_fechou ? '__custom' : '')}
                onChange={e => onPatch(c.id, { motivo_nao_fechou: e.target.value || null }).then(() => flash('Motivo guardado'))}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold/50">
                <option value="" className="bg-zinc-900">Sem motivo</option>
                {c.motivo_nao_fechou && !MOTIVOS_NAO_FECHOU.includes(c.motivo_nao_fechou) && <option value="__custom" className="bg-zinc-900">{c.motivo_nao_fechou}</option>}
                {MOTIVOS_NAO_FECHOU.map(m => <option key={m} value={m} className="bg-zinc-900">{m}</option>)}
              </select>
            </section>
          )}

          <section className="grid grid-cols-2 gap-4">
            <Info label="Data do evento" value={c.data_casamento} />
            <Info label="Entrada" value={c.data_entrada} />
            <Info label="Tipo" value={c.tipo_evento?.replace(/[\[\]"]/g, '')} />
            <Info label="Como chegou" value={c.como_chegou?.replace(/[\[\]"]/g, '')} />
            <div className="col-span-2"><Info label="Local" value={c.local_casamento} /></div>
            <div className="col-span-2"><Info label="Serviços" value={c.servicos?.replace(/[\[\]"]/g, '')} /></div>
            <Info label="Contacto" value={c.contato} />
            <Info label="Email" value={c.email} />
          </section>

          {extra?.mensagem && (
            <section className="flex flex-col gap-2">
              <h3 className="text-[10px] tracking-[0.3em] uppercase text-gold">Mensagem inicial</h3>
              <p className="text-sm text-white/60 whitespace-pre-wrap leading-relaxed">{extra.mensagem}</p>
            </section>
          )}

          <section className="flex flex-col gap-2">
            <h3 className="text-[10px] tracking-[0.3em] uppercase text-gold">Notas internas</h3>
            <textarea value={notas} onChange={e => setNotas(e.target.value)} onBlur={guardarNotas} rows={4}
              disabled={!extra} placeholder={extra ? 'Escreve notas sobre esta lead. Guarda ao sair do campo.' : 'A carregar...'}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-gold/50 resize-none" />
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="text-[10px] tracking-[0.3em] uppercase text-gold">Histórico</h3>
            {historico.length === 0 ? (
              <p className="text-xs text-white/25">Sem mudanças registadas. O histórico começou a ser guardado a 17 set 2026.</p>
            ) : (
              <ol className="relative border-l border-white/10 ml-1.5 flex flex-col gap-3">
                {historico.map(h => (
                  <li key={h.id} className="pl-4 relative">
                    <span className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gold/60" />
                    <div className="text-xs text-white/70">
                      {h.evento ? <span className="text-green-400">{h.evento}</span> : <>
                        {h.status_de ? <><span className="text-white/35">{h.status_de}</span> → </> : <span className="text-white/35">Entrou como </span>}
                        <span className="text-white">{h.status_para}</span>
                      </>}
                    </div>
                    <div className="text-[10px] text-white/25 mt-0.5">
                      {new Date(h.created_at).toLocaleString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <Link href={`/crm/${c.id}`}
            className="text-center py-3 rounded-xl border border-gold/20 hover:border-gold/60 text-xs tracking-[0.2em] uppercase text-gold/60 hover:text-gold transition-colors">
            Abrir ficha completa →
          </Link>
        </div>
      </aside>
    </div>
  )
}
