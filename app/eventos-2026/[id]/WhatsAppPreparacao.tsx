'use client'

import { useEffect, useState } from 'react'
import { whatsappLink, mensagemReuniaoPreparacao, nomeNoivos, PREPARACAO_DIAS } from '@/lib/crm'

/* Botão de WhatsApp para marcar a reunião de preparação do dia (horários,
   dicas, ajustes). Também aparece no /photo cerca de 15 dias antes do evento. */
export default function WhatsAppPreparacao({ e }: { e: any }) {
  const [enviadoEm, setEnviadoEm] = useState<string | null>(null)
  const [carregado, setCarregado] = useState(false)
  const [quem, setQuem] = useState<'noiva' | 'noivo'>(e.tel_noiva ? 'noiva' : 'noivo')

  useEffect(() => {
    setCarregado(false)
    fetch(`/api/evento-whatsapp?eventoId=${e.id}`).then(r => r.json()).then(d => {
      const env = (d.envios ?? []).find((x: any) => x.evento === 'reuniao_preparacao')
      setEnviadoEm(env?.created_at ?? null)
    }).catch(() => {}).finally(() => setCarregado(true))
  }, [e.id])

  const nome = nomeNoivos(e.cliente, e.nome_noiva, e.nome_noivo)
  const tel = quem === 'noiva' ? e.tel_noiva : e.tel_noivo
  const href = whatsappLink(tel, mensagemReuniaoPreparacao(nome))

  let faltam: number | null = null
  if (e.data_evento) {
    const hoje = new Date(); hoje.setHours(12, 0, 0, 0)
    faltam = Math.round((new Date(String(e.data_evento).slice(0, 10) + 'T12:00:00').getTime() - hoje.getTime()) / 86400000)
  }

  const base = 'text-[11px] font-semibold tracking-wider uppercase text-center px-4 py-2.5 rounded-lg border transition-colors'

  return (
    <div className="rounded-xl border border-green-500/20 bg-green-500/[0.04] p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[10px] tracking-[0.3em] uppercase text-green-400/80 font-semibold">Reunião de preparação do dia</span>
          <p className="text-white/45 text-xs mt-1 leading-relaxed">
            Marcar pelo WhatsApp uma conversa sobre horários, dicas, sugestões e últimos ajustes.
            Aparece no calendário do painel {PREPARACAO_DIAS} dias antes do casamento.
          </p>
        </div>
        {faltam !== null && faltam >= 0 && (
          <span className={`shrink-0 text-[10px] px-2 py-1 rounded-md ${faltam <= PREPARACAO_DIAS ? 'bg-green-500/15 text-green-400' : 'bg-white/5 text-white/40'}`}>
            {faltam === 0 ? 'É hoje' : `Faltam ${faltam} ${faltam === 1 ? 'dia' : 'dias'}`}
          </span>
        )}
      </div>

      {e.tel_noiva && e.tel_noivo && !enviadoEm && (
        <div className="flex gap-1.5 text-[10px] tracking-[0.2em] uppercase">
          {(['noiva', 'noivo'] as const).map(q => (
            <button key={q} onClick={() => setQuem(q)}
              className={`px-3 py-1 rounded-md border transition-colors ${quem === q ? 'border-green-500/40 text-green-400 bg-green-500/10' : 'border-white/10 text-white/35 hover:text-white/60'}`}>
              {q === 'noiva' ? 'Noiva / Mãe' : 'Noivo / Pai'}
            </button>
          ))}
        </div>
      )}

      {!carregado ? (
        <div className={`${base} border-white/10 text-white/30`}>A carregar…</div>
      ) : enviadoEm ? (
        <div className={`${base} border-white/10 text-white/35 bg-white/[0.03] cursor-not-allowed select-none`}>
          ✓ Reunião de preparação · Enviado a {new Date(enviadoEm).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}
        </div>
      ) : href ? (
        <a href={href} target="_blank" rel="noopener noreferrer"
          onClick={() => {
            setEnviadoEm(new Date().toISOString())
            fetch('/api/evento-whatsapp', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ eventoId: e.id, evento: 'reuniao_preparacao' }),
            }).then(r => r.json()).then(d => { if (!d?.ok) setEnviadoEm(null) }).catch(() => setEnviadoEm(null))
          }}
          className={`${base} border-green-500/30 text-green-400 bg-green-500/10 hover:bg-green-500/20 hover:border-green-500/50`}>
          Marcar reunião de preparação
        </a>
      ) : (
        <div className={`${base} border-white/10 text-white/30`}>Sem telemóvel nos Dados do Casal</div>
      )}
    </div>
  )
}
