'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabase'
import { whatsappLink } from '@/lib/crm'

/* Pedido de reunião feito em /reuniao, na faixa dos 30 dias: cartão "Por confirmar" que abre
   uma janela ao centro para Aceitar (a opção pedida) ou Agendar outro horário. Ao aceitar,
   /api/crm/reuniao-pedido preenche a ficha, publica o portal com password nas propostas e
   devolve a mensagem de WhatsApp pronta. */

type Opcao = { data: string; hora: string }
export type PedidoReuniao = {
  contactId: string; nome: string; contato: string; dataCasamento: string | null
  opcoes: Opcao[]; formato: string; mensagem: string | null; origem: string
}
type Aceite = { data: string; hora: string; tipo: string; portalUrl: string; password: string; mensagem: string; contato: string }

const DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
const longa = (iso: string) => { const d = new Date(iso + 'T12:00:00'); return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}` }
const ORIGEM: Record<string, string> = { link: 'Link de marcação', whatsapp: 'Link do WhatsApp', rollup: 'Rollup' }

export default function PedidoReuniaoCard({ p, opcao }: { p: PedidoReuniao; opcao: Opcao }) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [agendar, setAgendar] = useState(false)
  const [data, setData] = useState(opcao.data)
  const [hora, setHora] = useState(opcao.hora)
  const [tipo, setTipo] = useState(p.formato === 'Presencial' ? 'Presencial' : 'Videochamada')
  const [aGuardar, setAGuardar] = useState(false)
  const [erro, setErro] = useState('')
  const [aceite, setAceite] = useState<Aceite | null>(null)
  const [enviado, setEnviado] = useState(false)

  async function marcar(o: Opcao) {
    setErro(''); setAGuardar(true)
    try {
      const r = await fetch('/api/crm/reuniao-pedido', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.contactId, data: o.data, hora: o.hora, tipo }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) return setErro(j.error ?? 'Não foi possível marcar.')
      setAceite(j)
    } catch {
      setErro('Sem ligação. Tenta outra vez.')
    } finally {
      setAGuardar(false)
    }
  }

  function fechar() {
    setAberto(false)
    // Depois de aceitar, o cartão passa a reunião marcada
    if (aceite) router.refresh()
  }

  function registarEnvio() {
    setEnviado(true)
    // O mesmo registo do botão "Portal da reunião" do /crm (fica com o visto de enviado)
    supabase.from('crm_status_history').insert({ contact_id: p.contactId, evento: 'WhatsApp portal da reunião enviado' }).then(() => {})
  }

  const wa = aceite ? whatsappLink(aceite.contato, aceite.mensagem) : null

  return (
    <>
      <button onClick={() => setAberto(true)}
        className="group block w-full text-left rounded-lg px-2 py-1.5 border transition-all hover:bg-red-500/10"
        style={{ borderColor: 'rgba(239,68,68,0.55)', background: 'rgba(239,68,68,0.06)', boxShadow: '0 0 12px -4px rgba(239,68,68,0.6)' }}>
        <p className="text-[8px] tracking-[0.25em] uppercase text-red-300/90">
          Pedido {opcao.hora}
        </p>
        <p className="text-[11px] text-white/85 group-hover:text-white leading-tight truncate mt-0.5">
          {p.nome || 'Sem nome'}
        </p>
        <p className="text-[8px] tracking-[0.2em] uppercase text-white/35 mt-0.5">Por confirmar</p>
      </button>

      {/* Janela no body: a faixa dos 30 dias tem scroll e transformações que cortariam o fixed */}
      {aberto && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={fechar}>
          <div onClick={e => e.stopPropagation()}
            className="font-cond relative w-full max-w-[460px] max-h-[90vh] overflow-y-auto rounded-[22px] border p-6 text-left"
            style={{ borderColor: 'rgba(201,168,76,0.35)', background: 'rgba(17,17,17,0.95)', boxShadow: '0 0 60px -20px rgba(201,168,76,0.55)' }}>
            <button onClick={fechar} aria-label="Fechar" className="absolute top-4 right-5 text-white/40 hover:text-white text-2xl leading-none">×</button>

            {!aceite ? (
              <>
                <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#d8be93]">Pedido de reunião</p>
                <h3 className="mt-2 text-[30px] font-extralight leading-tight text-white" style={{ fontFamily: 'Jost, sans-serif' }}>{p.nome || 'Sem nome'}</h3>
                <div className="mt-3 space-y-1 text-[14px] text-white/65">
                  <p>Telefone: <span className="text-white">{p.contato || 'sem telefone'}</span></p>
                  <p>Casamento: <span className="text-white">{p.dataCasamento ? longa(p.dataCasamento) : 'data por definir'}</span></p>
                  <p>Pediu: <span className="text-white">{p.formato === 'Presencial' ? 'No estúdio' : 'Videochamada'}</span> · {ORIGEM[p.origem] ?? p.origem}</p>
                </div>
                {p.mensagem && <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[14px] text-white/80 whitespace-pre-wrap">{p.mensagem}</p>}

                <p className="mt-5 text-[11px] font-medium tracking-[0.2em] uppercase text-white/40">{p.opcoes.length > 1 ? 'Opções pedidas' : 'Horário pedido'}</p>
                <div className="mt-2 flex flex-col gap-2">
                  {p.opcoes.map(o => (
                    <div key={o.data + o.hora} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5">
                      <span className="text-[15px] text-white">{longa(o.data)} às {o.hora}</span>
                      <button onClick={() => marcar(o)} disabled={aGuardar}
                        className="shrink-0 rounded-full border border-[#d8be93]/60 bg-[#d8be93]/15 px-4 py-1.5 text-[13px] font-semibold text-white hover:bg-[#d8be93]/25 disabled:opacity-40">
                        Aceitar
                      </button>
                    </div>
                  ))}
                </div>

                <p className="mt-5 text-[11px] font-medium tracking-[0.2em] uppercase text-white/40">Formato</p>
                <div className="mt-2 flex gap-2">
                  {['Videochamada', 'Presencial'].map(t => (
                    <button key={t} onClick={() => setTipo(t)}
                      className={`flex-1 rounded-full border px-4 py-2 text-[14px] font-semibold transition-colors ${tipo === t ? 'border-[#d8be93]/70 bg-[#d8be93]/15 text-white' : 'border-white/15 text-white/60 hover:text-white'}`}>
                      {t === 'Presencial' ? 'No estúdio' : t}
                    </button>
                  ))}
                </div>

                {!agendar ? (
                  <button onClick={() => setAgendar(true)} className="mt-5 text-[12px] font-medium tracking-[0.16em] uppercase text-[#d8be93] underline underline-offset-4">
                    Agendar outro horário
                  </button>
                ) : (
                  <div className="mt-5 rounded-xl border border-white/10 p-3">
                    <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-white/40">Agendar outro horário</p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <input type="date" value={data} onChange={e => setData(e.target.value)} style={{ colorScheme: 'dark' }}
                        className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-[15px] text-white outline-none focus:border-[#d8be93]/70" />
                      <input type="time" value={hora} onChange={e => setHora(e.target.value)} style={{ colorScheme: 'dark' }}
                        className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-[15px] text-white outline-none focus:border-[#d8be93]/70" />
                    </div>
                    <button onClick={() => marcar({ data, hora })} disabled={aGuardar || !data || !hora}
                      className="mt-3 w-full rounded-full bg-[#d8be93] py-2.5 text-[13px] font-semibold tracking-[0.12em] uppercase text-black hover:brightness-110 disabled:opacity-40">
                      Agendar
                    </button>
                  </div>
                )}

                {aGuardar && <p className="mt-4 text-[13px] text-white/50">A marcar e a publicar o portal…</p>}
                {erro && <p className="mt-4 text-[14px] text-red-300">{erro}</p>}
                <Link href={`/crm/${p.contactId}`} className="mt-5 block text-[12px] text-white/40 hover:text-white">Abrir ficha ›</Link>
              </>
            ) : (
              <>
                <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#d8be93]">Reunião confirmada</p>
                <h3 className="mt-2 text-[30px] font-extralight leading-tight text-white" style={{ fontFamily: 'Jost, sans-serif' }}>{p.nome || 'Sem nome'}</h3>
                <div className="mt-3 space-y-1 text-[14px] text-white/65">
                  <p><span className="text-white">{longa(aceite.data)} às {aceite.hora}</span> · {aceite.tipo === 'Presencial' ? 'No estúdio' : 'Videochamada'}</p>
                  <p>Ficha: marcação preenchida</p>
                  <p>Portal publicado: <a href={aceite.portalUrl} target="_blank" rel="noopener noreferrer" className="text-[#d8be93] underline underline-offset-2">abrir</a></p>
                  <p>Password das propostas (só para ti, não vai na mensagem): <span className="text-white font-semibold tracking-wider">{aceite.password}</span></p>
                </div>

                <p className="mt-5 text-[11px] font-medium tracking-[0.2em] uppercase text-white/40">Mensagem para os noivos</p>
                <pre className="mt-2 max-h-[220px] overflow-y-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-black/30 p-3 font-cond text-[13px] leading-relaxed text-white/80">{aceite.mensagem}</pre>

                {wa ? (
                  <a href={wa} target="_blank" rel="noopener noreferrer" onClick={registarEnvio}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] py-3 text-[14px] font-semibold text-white hover:brightness-110">
                    {enviado ? 'Enviado pelo WhatsApp (abrir outra vez)' : 'Enviar pelo WhatsApp'}
                  </a>
                ) : (
                  <p className="mt-4 text-[14px] text-red-300">Sem telefone válido na ficha.</p>
                )}
                <div className="mt-4 flex items-center justify-between">
                  <Link href={`/crm/${p.contactId}`} className="text-[12px] text-white/40 hover:text-white">Abrir ficha ›</Link>
                  <button onClick={fechar} className="text-[12px] text-white/40 hover:text-white">Fechar</button>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
