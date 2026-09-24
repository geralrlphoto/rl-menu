'use client'

import { useEffect, useState } from 'react'
import { whatsappLink, mensagemReuniaoPreparacao, nomeNoivos, ehBatizado, PREPARACAO_DIAS } from '@/lib/crm'
import { linkPublico } from '@/lib/site-url'

/* Reunião de preparação do dia (horários, dicas, ajustes):
   - botão de WhatsApp com o link /preparacao/<id> para os noivos escolherem o horário;
   - disponibilidade comum a todos os casais (preparacao_slots);
   - também aparece no /photo cerca de 15 dias antes do evento. */

type Slot = { id: string; data: string; hora: string; evento_id: string | null; formato: string | null; cliente: string | null }

function fmtDia(iso: string) {
  return new Date(iso + 'T12:00:00Z').toLocaleDateString('pt-PT', { weekday: 'short', day: '2-digit', month: 'short', timeZone: 'UTC' })
}

export default function WhatsAppPreparacao({ e }: { e: any }) {
  // A ficha traz o id do Notion em e.id; o id interno (usado nas reservas) vem em _supabase_id
  const evId: string = e._supabase_id ?? e.id
  const [enviadoEm, setEnviadoEm] = useState<string | null>(null)
  const [carregado, setCarregado] = useState(false)
  const [quem, setQuem] = useState<'noiva' | 'noivo'>(e.tel_noiva ? 'noiva' : 'noivo')
  const [slots, setSlots] = useState<Slot[]>([])
  const [gerir, setGerir] = useState(false)
  const [novaData, setNovaData] = useState('')
  const [novaHora, setNovaHora] = useState('')
  const [erro, setErro] = useState('')

  const carregarSlots = () =>
    fetch('/api/preparacao/slots').then(r => r.json()).then(d => { if (d.ok) setSlots(d.slots) }).catch(() => {})

  useEffect(() => {
    setCarregado(false)
    fetch(`/api/evento-whatsapp?eventoId=${evId}`).then(r => r.json()).then(d => {
      const env = (d.envios ?? []).find((x: any) => x.evento === 'reuniao_preparacao')
      setEnviadoEm(env?.created_at ?? null)
    }).catch(() => {}).finally(() => setCarregado(true))
    carregarSlots()
  }, [evId])

  const nome = nomeNoivos(e.cliente, e.nome_noiva, e.nome_noivo)
  const tel = quem === 'noiva' ? e.tel_noiva : e.tel_noivo
  const batizado = ehBatizado(e.tipo_evento)
  const href = whatsappLink(tel, mensagemReuniaoPreparacao(nome, evId, batizado ? { crianca: e.nome_crianca } : null))
  const linkNoivos = linkPublico(`/preparacao/${evId}`)
  const reserva = slots.find(s => s.evento_id === evId) ?? null
  const livres = slots.filter(s => !s.evento_id).length
  // O que este casal vê no link: horários livres a partir de amanhã e antes do casamento
  const amanha = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` })()
  const dataCas = e.data_evento ? String(e.data_evento).slice(0, 10) : null
  const serveEste = (s: Slot) => s.data >= amanha && (!dataCas || s.data < dataCas)
  const visiveis = slots.filter(s => !s.evento_id && serveEste(s)).length

  let faltam: number | null = null
  if (e.data_evento) {
    const hoje = new Date(); hoje.setHours(12, 0, 0, 0)
    faltam = Math.round((new Date(String(e.data_evento).slice(0, 10) + 'T12:00:00').getTime() - hoje.getTime()) / 86400000)
  }

  async function acrescentar() {
    setErro('')
    const d = await fetch('/api/preparacao/slots', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: novaData, hora: novaHora }),
    }).then(r => r.json()).catch(() => ({ error: 'Sem ligação' }))
    if (!d.ok) { setErro(d.error || 'Não foi possível acrescentar'); return }
    setNovaHora(''); carregarSlots()
  }
  async function remover(id: string) {
    await fetch(`/api/preparacao/slots?id=${id}`, { method: 'DELETE' }).catch(() => {})
    carregarSlots()
  }
  async function libertar(id: string) {
    if (!confirm('Cancelar esta marcação? O horário volta a ficar livre.')) return
    await fetch('/api/preparacao/slots', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, libertar: true }),
    }).catch(() => {})
    carregarSlots()
  }

  const base = 'text-[11px] font-semibold tracking-wider uppercase text-center px-4 py-2.5 rounded-lg border transition-colors'
  const porDia = slots.reduce<Record<string, Slot[]>>((acc, s) => { (acc[s.data] ||= []).push(s); return acc }, {})

  return (
    <div className="rounded-xl border border-green-500/20 bg-green-500/[0.04] p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[10px] tracking-[0.3em] uppercase text-green-400/80 font-semibold">Reunião de preparação do dia</span>
          <p className="text-white/45 text-xs mt-1 leading-relaxed">
            Pelo WhatsApp segue um link onde os noivos escolhem o dia e a hora da tua disponibilidade.
            Aparece no calendário do painel {PREPARACAO_DIAS} dias antes do {batizado ? 'batizado' : 'casamento'}.
          </p>
        </div>
        {faltam !== null && faltam >= 0 && (
          <span className={`shrink-0 text-[10px] px-2 py-1 rounded-md ${faltam <= PREPARACAO_DIAS ? 'bg-green-500/15 text-green-400' : 'bg-white/5 text-white/40'}`}>
            {faltam === 0 ? 'É hoje' : `Faltam ${faltam} ${faltam === 1 ? 'dia' : 'dias'}`}
          </span>
        )}
      </div>

      {/* Marcação feita pelos noivos */}
      {reserva && (
        <div className="rounded-lg border border-gold/40 bg-gold/10 px-3 py-2.5 flex items-center justify-between gap-3">
          <div>
            <div className="text-[9px] tracking-[0.3em] uppercase text-gold/80">Marcada pelos noivos</div>
            <div className="text-white text-sm mt-0.5 capitalize">{fmtDia(reserva.data)} às {reserva.hora} · {reserva.formato}</div>
          </div>
          <button onClick={() => libertar(reserva.id)} className="text-[10px] tracking-[0.2em] uppercase text-white/40 hover:text-red-400 transition-colors">Cancelar</button>
        </div>
      )}

      {!reserva && e.tel_noiva && e.tel_noivo && !enviadoEm && (
        <div className="flex gap-1.5 text-[10px] tracking-[0.2em] uppercase">
          {(['noiva', 'noivo'] as const).map(q => (
            <button key={q} onClick={() => setQuem(q)}
              className={`px-3 py-1 rounded-md border transition-colors ${quem === q ? 'border-green-500/40 text-green-400 bg-green-500/10' : 'border-white/10 text-white/35 hover:text-white/60'}`}>
              {q === 'noiva' ? 'Noiva / Mãe' : 'Noivo / Pai'}
            </button>
          ))}
        </div>
      )}

      {!reserva && (!carregado ? (
        <div className={`${base} border-white/10 text-white/30`}>A carregar…</div>
      ) : enviadoEm ? (
        <div className="flex gap-2">
          <div className={`${base} flex-1 border-white/10 text-white/35 bg-white/[0.03] cursor-not-allowed select-none`}>
            ✓ Link enviado a {new Date(enviadoEm).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })} · à espera da escolha
          </div>
          {/* Volta a mostrar o botão verde para mandar o link outra vez */}
          <button onClick={() => setEnviadoEm(null)} title="Enviar o link outra vez"
            className={`${base} shrink-0 border-white/10 text-white/45 hover:text-green-400 hover:border-green-500/40`}>
            ↺ Reenviar
          </button>
        </div>
      ) : href ? (
        <a href={href} target="_blank" rel="noopener noreferrer"
          onClick={() => {
            setEnviadoEm(new Date().toISOString())
            fetch('/api/evento-whatsapp', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ eventoId: evId, evento: 'reuniao_preparacao' }),
            }).then(r => r.json()).then(d => { if (!d?.ok) setEnviadoEm(null) }).catch(() => setEnviadoEm(null))
          }}
          className={`${base} border-green-500/30 text-green-400 bg-green-500/10 hover:bg-green-500/20 hover:border-green-500/50`}>
          Marcar reunião de preparação
        </a>
      ) : (
        <div className={`${base} border-white/10 text-white/30`}>Sem telemóvel nos Dados do Casal</div>
      ))}

      <div className="flex items-center justify-between gap-3 text-[10px]">
        <a href={linkNoivos} target="_blank" rel="noopener noreferrer" className="text-white/35 hover:text-gold truncate">
          Ver a página dos noivos ↗ <span className={visiveis ? 'text-green-400/80' : 'text-amber-400'}>· {visiveis === 0 ? 'não vêem nenhum horário' : `vêem ${visiveis} horário${visiveis === 1 ? '' : 's'}`}</span>
        </a>
        <button onClick={() => setGerir(v => !v)} className="shrink-0 tracking-[0.2em] uppercase text-white/45 hover:text-gold">
          {gerir ? 'Fechar' : `Disponibilidade (${livres} livre${livres === 1 ? '' : 's'})`}
        </button>
      </div>

      {/* Disponibilidade comum a todos os casais */}
      {gerir && (
        <div className="rounded-lg border border-white/10 bg-black/30 p-3 flex flex-col gap-3">
          <p className="text-white/40 text-[11px] leading-relaxed">
            Horários que qualquer casal pode escolher. Quando um casal marca, o horário fica ocupado para os outros.
            {dataCas && <> Cada casal só vê os horários <span className="text-white/70">antes do seu evento</span>; a cinzento estão os que este casal não vê.</>}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input type="date" value={novaData} onChange={ev => setNovaData(ev.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-gold [color-scheme:dark]" />
            <input type="time" value={novaHora} onChange={ev => setNovaHora(ev.target.value)} step={900}
              className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-gold [color-scheme:dark]" />
            <button onClick={acrescentar} disabled={!novaData || !novaHora}
              className="px-3 py-1.5 rounded-lg bg-gold text-black text-[10px] font-bold tracking-[0.2em] uppercase disabled:opacity-40">+ Acrescentar</button>
            {erro && <span className="text-[11px] text-red-400">{erro}</span>}
          </div>
          {slots.length === 0 ? (
            <p className="text-white/30 text-xs">Ainda não há horários. Acrescenta a data e a hora acima.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {Object.entries(porDia).map(([dia, lista]) => (
                <div key={dia} className="flex items-start gap-3">
                  <span className="w-24 shrink-0 text-[11px] text-white/50 capitalize pt-1">{fmtDia(dia)}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {lista.map(s => s.evento_id ? (
                      <span key={s.id} title={`${s.cliente ?? ''} · ${s.formato ?? ''}`}
                        className="text-[11px] px-2 py-1 rounded-md border border-gold/40 bg-gold/10 text-gold">
                        {s.hora} · {(s.cliente ?? '').trim() || 'Reservado'}
                      </span>
                    ) : (
                      <span key={s.id} title={serveEste(s) ? undefined : 'Depois do evento deste casal (ou já passou): não aparece no link deles'}
                        className={`group text-[11px] pl-2 pr-1 py-1 rounded-md border flex items-center gap-1 ${serveEste(s) ? 'border-white/12 text-white/75' : 'border-white/5 text-white/25 line-through decoration-white/20'}`}>
                        {s.hora}
                        <button onClick={() => remover(s.id)} aria-label="Remover horário" className="w-4 h-4 rounded text-white/30 hover:text-red-400">✕</button>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
