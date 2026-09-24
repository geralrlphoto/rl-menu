'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  whatsappLink, mensagemLembreteReuniao, mensagemFollowUp, mensagemFollowUp2, mensagemReuniaoPreparacao,
} from '@/lib/crm'

/* Tarefa de WhatsApp da faixa "Próximos 30 dias" do /photo.
   Quando já é o dia, um clique abre o WhatsApp com a mensagem e regista o
   envio no histórico da lead (o mesmo registo que os botões do /crm usam). */

export type WaTarefa = {
  tipo: 'lembrete' | 'follow1' | 'follow2' | 'preparacao'
  contactId: string    // id da lead no CRM; em 'preparacao' é o id do evento
  nome: string
  contato: string | null
  reuniaoHora: string | null
  dataCasamento: string | null
  batizado?: { crianca: string | null } | null
  atrasoDias: number   // > 0 quando o dia já passou
  futura: boolean      // ainda não é o dia: só informativa
}

const CONFIG = {
  lembrete: { rotulo: 'Lembrete 1h', evento: 'WhatsApp lembrete 1h enviado' },
  follow1: { rotulo: '1.º Follow up', evento: 'WhatsApp follow-up enviado' },
  follow2: { rotulo: '2.º Follow up', evento: 'WhatsApp 2.º follow-up enviado' },
  preparacao: { rotulo: 'Reunião preparação', evento: 'reuniao_preparacao' },
}

function textoDe(t: WaTarefa): string {
  if (t.tipo === 'lembrete') return mensagemLembreteReuniao(t.nome, t.reuniaoHora)
  if (t.tipo === 'follow1') return mensagemFollowUp(t.nome, t.dataCasamento)
  if (t.tipo === 'preparacao') return mensagemReuniaoPreparacao(t.nome, t.contactId, t.batizado)
  return mensagemFollowUp2(t.nome, t.dataCasamento)
}

export function WaTarefaChip({ t }: { t: WaTarefa }) {
  const [enviado, setEnviado] = useState(false)
  const cfg = CONFIG[t.tipo]
  const href = t.futura ? null : whatsappLink(t.contato, textoDe(t))
  const nome = t.nome.trim() || 'Sem nome'

  const corpo = (
    <>
      <p className="text-[8px] tracking-[0.25em] uppercase flex items-center gap-1" style={{ color: enviado ? 'rgba(255,255,255,0.35)' : t.futura ? 'rgba(74,222,128,0.45)' : '#4ade80' }}>
        <svg className="w-2.5 h-2.5 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 .1 5.3.1 11.9c0 2.1.6 4.1 1.6 5.9L0 24l6.3-1.7c1.7.9 3.7 1.4 5.7 1.4 6.6 0 11.9-5.3 11.9-11.9C23.9 5.3 18.6 0 12 0z" /></svg>
        {enviado ? `${cfg.rotulo} · Enviado` : cfg.rotulo}
        {!enviado && t.atrasoDias > 0 && <span className="text-red-400 normal-case tracking-normal">· {t.atrasoDias}d atraso</span>}
      </p>
      <p className={`text-[11px] leading-tight truncate mt-0.5 ${enviado ? 'text-white/35 line-through' : t.futura ? 'text-white/45' : 'text-white/85 group-hover:text-white'}`}>{nome}</p>
    </>
  )
  const cls = 'group block rounded-lg px-2 py-1.5 border border-dashed transition-all'
  const estilo = { borderColor: t.futura || enviado ? 'rgba(74,222,128,0.15)' : 'rgba(74,222,128,0.4)', background: t.futura || enviado ? 'transparent' : 'rgba(74,222,128,0.05)' }

  // Futura, já enviada ou sem telefone: não envia daqui (sem telefone abre a ficha)
  if (enviado || t.futura) return <div className={cls} style={estilo} title={t.futura ? 'Fica disponível neste dia' : undefined}>{corpo}</div>
  const ficha = t.tipo === 'preparacao' ? `/eventos-2026/${t.contactId}` : `/crm/${t.contactId}`
  if (!href) return <Link href={ficha} className={cls} style={estilo} title="Sem telefone válido na ficha">{corpo}</Link>

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`${cls} hover:bg-green-500/10`} style={estilo}
      title={`Enviar ${cfg.rotulo.toLowerCase()} pelo WhatsApp`}
      onClick={() => {
        setEnviado(true)
        if (t.tipo === 'preparacao') {
          fetch('/api/evento-whatsapp', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventoId: t.contactId, evento: cfg.evento }),
          }).catch(() => {})
          return
        }
        supabase.from('crm_status_history').insert({ contact_id: t.contactId, evento: cfg.evento })
          .then(() => { fetch('/api/revalidate-photo?tag=whatsapp', { method: 'POST' }).catch(() => {}) })
      }}>
      {corpo}
    </a>
  )
}
