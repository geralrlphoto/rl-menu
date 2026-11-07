'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { EVENTO_ABRIU_LINK } from '@/lib/crm'

/* Números do fluxo novo (portal com calendário primeiro): das leads que receberam as Boas-vindas,
   quantas abriram o portal, pediram reunião, tiveram a reunião e fecharam. */

const INICIO = ['WhatsApp de boas-vindas enviado', 'WhatsApp marcar reunião enviado']
const PERIODOS = [['30', '30 dias'], ['90', '90 dias'], ['tudo', 'Tudo']] as const

type Lead = { id: string; status: string | null; reuniao_data: string | null; reuniao_pedido: unknown }

export default function FunilFluxo() {
  const [eventos, setEventos] = useState<{ contact_id: string; evento: string; created_at: string }[] | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [periodo, setPeriodo] = useState<(typeof PERIODOS)[number][0]>('90')

  useEffect(() => {
    supabase.from('crm_status_history').select('contact_id,evento,created_at')
      .in('evento', [...INICIO, EVENTO_ABRIU_LINK]).limit(5000)
      .then(async ({ data }) => {
        const ev = data ?? []
        const ids = [...new Set(ev.map(e => e.contact_id))]
        const lista: Lead[] = []
        for (let i = 0; i < ids.length; i += 200) {
          const { data: l } = await supabase.from('crm_contacts').select('id,status,reuniao_data,reuniao_pedido').in('id', ids.slice(i, i + 200))
          lista.push(...((l ?? []) as Lead[]))
        }
        setLeads(lista); setEventos(ev)
      })
  }, [])

  const passos = useMemo(() => {
    if (!eventos) return null
    const desde = periodo === 'tudo' ? '' : new Date(Date.now() - Number(periodo) * 86400000).toISOString()
    const inicio = new Map<string, string>()
    for (const e of eventos) if (INICIO.includes(e.evento) && (!inicio.has(e.contact_id) || e.created_at < inicio.get(e.contact_id)!)) inicio.set(e.contact_id, e.created_at)
    const base = new Set([...inicio].filter(([, d]) => d >= desde).map(([id]) => id))
    const hoje = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Lisbon' })
    const ls = leads.filter(l => base.has(l.id))
    const marcaram = ls.filter(l => l.reuniao_data || l.reuniao_pedido)
    const reuniao = ls.filter(l => l.reuniao_data && l.reuniao_data < hoje)
    const fecharam = ls.filter(l => l.status === 'Fechou')
    // A abertura só se regista no 1.º acesso pelo link pessoal: quem marcou também conta como tendo aberto
    const abriram = new Set([...eventos.filter(e => e.evento === EVENTO_ABRIU_LINK && base.has(e.contact_id)).map(e => e.contact_id), ...marcaram.map(l => l.id)])
    return [
      ['Receberam as Boas-vindas', base.size],
      ['Abriram o portal', abriram.size],
      ['Marcaram reunião', marcaram.length],
      ['Tiveram a reunião', reuniao.length],
      ['Fecharam', fecharam.length],
    ] as [string, number][]
  }, [eventos, leads, periodo])

  return (
    <div className="bg-white/3 border border-white/8 rounded-2xl p-6 mb-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xs tracking-[0.35em] uppercase text-white/30 mb-2">Fluxo da lead</h2>
          <p className="text-white/20 text-[10px] tracking-wider">Desde o envio das Boas-vindas. A percentagem ao lado compara com o passo anterior.</p>
        </div>
        <div className="flex gap-1.5">
          {PERIODOS.map(([v, t]) => (
            <button key={v} type="button" onClick={() => setPeriodo(v)}
              className={`px-3 py-1.5 rounded-lg text-[11px] border transition-colors ${periodo === v ? 'border-[#C9A84C]/60 bg-[#C9A84C]/15 text-white' : 'border-white/10 text-white/45 hover:text-white/80'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>
      {!passos ? <p className="text-white/20 text-xs">A carregar…</p> : passos[0][1] === 0 ? (
        <p className="text-white/20 text-xs">Ainda sem Boas-vindas enviadas neste período.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {passos.map(([nome, n], i) => {
            const total = passos[0][1]
            const anterior = i > 0 ? passos[i - 1][1] : 0
            return (
              <div key={nome} className="grid grid-cols-[150px_1fr_90px] sm:grid-cols-[190px_1fr_110px] items-center gap-3">
                <span className="text-[12px] text-white/60">{nome}</span>
                <div className="h-7 rounded-md bg-white/5 overflow-hidden">
                  <div className="h-full rounded-md" style={{ width: `${Math.max(2, (n / total) * 100)}%`, background: 'linear-gradient(90deg, #C9A84C, #8a6d2c)' }} />
                </div>
                <span className="text-right">
                  <span className="text-lg font-extralight text-white">{n}</span>
                  {i > 0 && <span className="text-[11px] text-white/40"> · {anterior ? Math.round((n / anterior) * 100) : 0}%</span>}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
