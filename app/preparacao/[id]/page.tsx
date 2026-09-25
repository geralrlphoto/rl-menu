'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { MEET_LINK } from '@/lib/crm'
import BriefingForm, { type BriefingInfo } from './BriefingForm'

/* Página pública (link do WhatsApp): os noivos escolhem o dia e a hora da
   reunião de preparação do casamento (sempre por videochamada) a partir da
   disponibilidade da RL. Layout "design premium": foto + gradiente à esquerda,
   calendário interativo à direita. */

type Slot = { id: string; data: string; hora: string }
type Reserva = { data: string; hora: string; formato: string }

const SERIF = { fontFamily: "'Cormorant Garamond', serif" }
const GOLD = '#C9A84C'
const HERO = '/eventos-hero-2026.webp'
const HERO_BATIZADO = '/batizado-hero.webp'
const SEMANA = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']
const DURACAO_MIN = 45

const ymd = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
const dUTC = (iso: string) => new Date(iso.slice(0, 10) + 'T12:00:00Z')
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const diaLongo = (iso: string) => cap(dUTC(iso).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }))
const mesAno = (y: number, m: number) => cap(new Date(Date.UTC(y, m, 15)).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric', timeZone: 'UTC' }))

function hojeLisboa() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Lisbon' }).format(new Date())
}

/* Link "Adicionar ao Google Calendar" (hora de Lisboa) */
function googleCalUrl(r: Reserva, nome: string, evento: string) {
  const [h, m] = r.hora.split(':').map(Number)
  const ini = r.data.replace(/-/g, '') + 'T' + String(h).padStart(2, '0') + String(m).padStart(2, '0') + '00'
  const fimMin = h * 60 + m + DURACAO_MIN
  const fim = r.data.replace(/-/g, '') + 'T' + String(Math.floor(fimMin / 60)).padStart(2, '0') + String(fimMin % 60).padStart(2, '0') + '00'
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: 'Reunião de preparação · RL PhotoVideo',
    dates: `${ini}/${fim}`,
    ctz: 'Europe/Lisbon',
    details: `Videochamada com a RL PhotoVideo para prepararmos ${evento}${nome ? ` (${nome})` : ''}: horários, dicas e últimos ajustes.

Videochamada: ${MEET_LINK}`,
    location: MEET_LINK,
  })
  return `https://calendar.google.com/calendar/render?${p.toString()}`
}

export default function PreparacaoPage() {
  const { id } = useParams<{ id: string }>()
  const demo = id === 'demo' // simulação: casal fictício, nada é gravado
  const [estado, setEstado] = useState<'carregar' | 'erro' | 'ok'>('carregar')
  const [nome, setNome] = useState('')
  const [dataEvento, setDataEvento] = useState<string | null>(null)
  const [batizado, setBatizado] = useState(false)
  const [crianca, setCrianca] = useState<string | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [reserva, setReserva] = useState<Reserva | null>(null)
  const [dia, setDia] = useState<string | null>(null)
  const [slotId, setSlotId] = useState<string | null>(null)
  const [mes, setMes] = useState<{ y: number; m: number } | null>(null)
  const [aEnviar, setAEnviar] = useState(false)
  const [aviso, setAviso] = useState('')
  const [acabouDeMarcar, setAcabouDeMarcar] = useState(false)
  const [aAlterar, setAAlterar] = useState(false)
  const [expirado, setExpirado] = useState(false)
  const [briefing, setBriefing] = useState<BriefingInfo | null>(null)
  const [vista, setVista] = useState<'reuniao' | 'briefing'>('reuniao')
  const [acabouBriefing, setAcabouBriefing] = useState(false)
  const vistaInicial = useRef(false)
  // "Outro dia e horário": qualquer dia útil até à véspera do evento, fora da disponibilidade publicada
  const [outro, setOutro] = useState(false)
  // Até 2 opções (dias diferentes); ficam como pedido até a RL confirmar
  const [opcoes, setOpcoes] = useState<{ data: string; hora: string }[]>([])
  const [pedido, setPedido] = useState<{ opcoes: { data: string; hora: string }[]; em: string | null; mensagem?: string | null } | null>(null)
  const [mensagem, setMensagem] = useState('')
  const [aPedir, setAPedir] = useState(false)
  const [acabouDePedir, setAcabouDePedir] = useState(false)
  const [horasOutro, setHorasOutro] = useState<string[]>([])

  const carregar = () => {
    fetch(`/api/preparacao-publico?e=${id}`).then(r => r.json()).then(d => {
      if (!d.ok) { setEstado('erro'); return }
      setNome(d.nome); setDataEvento(d.dataEvento); setBatizado(!!d.batizado); setCrianca(d.crianca ?? null); setExpirado(!!d.expirado); setBriefing(d.briefing ?? null);
      // Casamentos: primeiro o briefing; só abre na reunião se já o enviaram ou já marcaram
      if (!vistaInicial.current) {
        vistaInicial.current = true
        if (d.briefing && !d.briefing.enviadoEm && !d.reserva) setVista('briefing')
      } setSlots(d.slots ?? []); setReserva(d.reserva); setHorasOutro(d.horasOutro ?? []); setPedido(d.pedido ?? null)
      const primeiro: string | undefined = d.slots?.[0]?.data
      setMes(prev => prev ?? (primeiro
        ? { y: +primeiro.slice(0, 4), m: +primeiro.slice(5, 7) - 1 }
        : { y: +hojeLisboa().slice(0, 4), m: +hojeLisboa().slice(5, 7) - 1 }))
      setEstado('ok')
    }).catch(() => setEstado('erro'))
  }
  useEffect(carregar, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const diasComSlots = useMemo(() => new Set(slots.map(s => s.data)), [slots])
  // Dias úteis (seg a sex) de amanhã até à véspera do evento; sem evento, os próximos 3 meses
  const diasUteis = useMemo(() => {
    const set = new Set<string>()
    const d = dUTC(hojeLisboa()); d.setUTCDate(d.getUTCDate() + 1)
    const fim = dataEvento ? dUTC(dataEvento) : new Date(d.getTime() + 92 * 86400000)
    for (; d < fim; d.setUTCDate(d.getUTCDate() + 1)) {
      if (d.getUTCDay() !== 0 && d.getUTCDay() !== 6) set.add(ymd(d))
    }
    return set
  }, [dataEvento])
  const diasAtivos = outro ? diasUteis : diasComSlots
  const meses = useMemo(() => [...new Set([...diasAtivos].map(s => s.slice(0, 7)))].sort(), [diasAtivos])
  const horas = slots.filter(s => s.data === dia)
  const escolhido: { data: string; hora: string } | null = outro
    ? opcoes[0] ?? null
    : slots.find(s => s.id === slotId) ?? null
  const opcaoDoDia = opcoes.find(o => o.data === dia)?.hora ?? null
  // Escolher a hora de um dia: substitui a opção desse dia; um 3.º dia substitui a última
  const escolherHora = (hora: string) => {
    if (!dia) return
    setOpcoes(prev => {
      const outros = prev.filter(o => o.data !== dia)
      const base = outros.length >= 2 ? outros.slice(0, 1) : outros
      return [...base, { data: dia, hora }].sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora))
    })
  }

  const mudarModo = (novo: boolean) => {
    setOutro(novo); setDia(null); setSlotId(null); setOpcoes([]); setAviso('')
    const alvo = [...(novo ? diasUteis : diasComSlots)].sort()[0]
    if (alvo) setMes({ y: +alvo.slice(0, 4), m: +alvo.slice(5, 7) - 1 })
  }
  const passo = escolhido ? 3 : dia ? 2 : 1

  // Textos que mudam entre casamento e batizado
  const oEvento = batizado ? (crianca ? `o batizado de ${crianca}` : 'o batizado') : 'o vosso dia'
  const rotuloEvento = batizado ? 'O batizado' : 'O vosso casamento'

  const faltamCasamento = dataEvento
    ? Math.round((dUTC(dataEvento).getTime() - dUTC(hojeLisboa()).getTime()) / 86400000)
    : null

  // Grelha do mês (segunda a domingo)
  const grelha = useMemo(() => {
    if (!mes) return []
    const primeiro = new Date(Date.UTC(mes.y, mes.m, 1, 12))
    const desloc = (primeiro.getUTCDay() + 6) % 7
    const nDias = new Date(Date.UTC(mes.y, mes.m + 1, 0, 12)).getUTCDate()
    const cel: (string | null)[] = Array(desloc).fill(null)
    for (let d = 1; d <= nDias; d++) cel.push(ymd(new Date(Date.UTC(mes.y, mes.m, d, 12))))
    while (cel.length % 7) cel.push(null)
    return cel
  }, [mes])

  const chaveMes = mes ? `${mes.y}-${String(mes.m + 1).padStart(2, '0')}` : ''
  const idxMes = meses.indexOf(chaveMes)
  const irMes = (delta: number) => {
    const alvo = meses[idxMes + delta]
    if (alvo) setMes({ y: +alvo.slice(0, 4), m: +alvo.slice(5, 7) - 1 })
  }

  async function confirmar() {
    if (!escolhido) return
    if (outro) return solicitar()
    setAEnviar(true); setAviso('')
    const d = await fetch('/api/preparacao-publico', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ e: id, slotId, alterar: aAlterar }),
    }).then(r => r.json()).catch(() => ({ error: 'Sem ligação. Tentem de novo.' }))
    setAEnviar(false)
    if (d.ok) {
      setReserva(d.reserva); setAcabouDeMarcar(true); setAAlterar(false); setSlotId(null); setDia(null)
      setPedido(null); setAPedir(false)
      if (!demo) carregar() // o horário antigo volta a ficar livre na lista
      return
    }
    setAviso(d.error || 'Não foi possível marcar.')
    setSlotId(null); carregar()
  }

  // "Outro horário": envia o pedido (1 ou 2 opções); só fica marcado quando a RL confirmar
  async function solicitar() {
    setAEnviar(true); setAviso('')
    const d = await fetch('/api/preparacao-publico', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ e: id, pedido: opcoes, mensagem }),
    }).then(r => r.json()).catch(() => ({ error: 'Sem ligação. Tentem de novo.' }))
    setAEnviar(false)
    if (!d.ok) { setAviso(d.error || 'Não foi possível enviar o pedido.'); return }
    setPedido(d.pedido); setAcabouDePedir(true); setAPedir(false); setAAlterar(false)
    setOutro(false); setOpcoes([]); setDia(null); setMensagem('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className="min-h-screen bg-[#070707] text-white lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* O @import do globals.css não chega ao browser; a fonte carrega-se aqui */}
      <link rel="stylesheet" precedence="default"
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap" />
      {/* ── Foto (fixa no desktop) ── */}
      <section className="relative h-[46vh] min-h-[320px] lg:h-screen lg:sticky lg:top-0 overflow-hidden">
        {/* Só mostra a foto depois de saber se é casamento ou batizado (evita trocar a meio) */}
        {estado !== 'carregar' && (
          <img src={batizado ? HERO_BATIZADO : HERO} alt="" className="absolute inset-0 w-full h-full object-cover scale-105 animate-[kenburns_18s_ease-out_forwards]"
            style={{ objectPosition: batizado ? '50% 40%' : '50% 50%' }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070707] via-transparent to-transparent lg:hidden" />
        <div className="relative h-full flex flex-col justify-end lg:justify-center px-6 sm:px-12 pb-10 lg:pb-0 max-w-xl">
          <p className="text-[10px] tracking-[0.5em] uppercase animate-[fadeUp_.7s_ease-out_both]" style={{ color: GOLD }}>RL PhotoVideo</p>
          <h1 className="text-[44px] sm:text-6xl xl:text-7xl font-light leading-[0.95] mt-4 animate-[fadeUp_.7s_.1s_ease-out_both]" style={{ ...SERIF, color: GOLD }}>
            Reunião de<br />preparação
          </h1>
          <div className="h-px mt-6 mb-5 origin-left animate-[linha_.9s_.35s_ease-out_both]" style={{ background: GOLD, width: 72 }} />
          <p className="text-white/80 text-lg sm:text-xl italic leading-relaxed animate-[fadeUp_.7s_.25s_ease-out_both]" style={SERIF}>
            {nome ? `${nome}, ` : ''}vamos preparar juntos {oEvento}: horários, dicas e os últimos detalhes.
          </p>
          {faltamCasamento !== null && faltamCasamento > 0 && (
            <div className="mt-7 flex items-baseline gap-3 animate-[fadeUp_.7s_.4s_ease-out_both]">
              <span className="text-5xl font-light tabular-nums" style={{ ...SERIF, color: GOLD }}>{faltamCasamento}</span>
              <span className="text-[10px] tracking-[0.35em] uppercase text-white/55">{faltamCasamento === 1 ? 'dia' : 'dias'} para o grande dia</span>
            </div>
          )}
        </div>
      </section>

      {/* ── Marcação ── */}
      <section className="relative px-5 sm:px-10 xl:px-16 py-10 lg:py-16 flex flex-col">
        <div className="w-full max-w-[560px] mx-auto lg:mx-0">
          {demo && (
            <p className="mb-6 rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-2.5 text-xs text-amber-200">
              Simulação: casal fictício. Nada é gravado nem enviado.
            </p>
          )}
          {estado === 'carregar' && (
            <div className="flex flex-col gap-3 animate-pulse">
              <div className="h-4 w-40 rounded bg-white/5" /><div className="h-72 rounded-2xl bg-white/[0.03]" />
            </div>
          )}

          {estado === 'erro' && (
            <p className="text-white/60 italic text-xl" style={SERIF}>Este link não é válido. Falem connosco pelo WhatsApp, por favor.</p>
          )}

          {/* ── Link expirado ── */}
          {estado === 'ok' && expirado && (
            <div className="flex flex-col items-center text-center pt-4 lg:pt-20">
              <div className="w-16 h-16 rounded-full border flex items-center justify-center text-2xl" style={{ borderColor: 'rgba(201,168,76,0.5)', color: GOLD }}>✦</div>
              <p className="text-3xl sm:text-4xl font-light mt-8 leading-tight" style={SERIF}>
                {reserva ? 'A nossa reunião já aconteceu' : 'Este link já não está ativo'}
              </p>
              <p className="text-white/50 text-sm mt-5 leading-relaxed max-w-sm">
                Obrigado{nome ? `, ${nome}` : ''}! Qualquer alteração, falem connosco pelo WhatsApp.
              </p>
            </div>
          )}

          {/* ── Separadores: reunião e briefing (só casamentos) ── */}
          {estado === 'ok' && !expirado && briefing && (
            <div className="mb-10 grid grid-cols-2 gap-1 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-1">
              {([
                ['briefing', '1 · Briefing', !!briefing.enviadoEm, false],
                ['reuniao', '2 · Reunião', !!reserva, !briefing.enviadoEm && !reserva],
              ] as const).map(([k, t, feito, bloqueado]) => (
                <button key={k} disabled={bloqueado} title={bloqueado ? 'Enviem primeiro o briefing' : undefined}
                  onClick={() => { setVista(k); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  className="rounded-xl py-3 text-[11px] tracking-[0.3em] uppercase transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                  style={{ background: vista === k ? 'rgba(201,168,76,0.14)' : 'transparent', color: vista === k ? GOLD : bloqueado ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.45)' }}>
                  <span className="w-4 h-4 rounded-full border text-[9px] flex items-center justify-center"
                    style={{ borderColor: feito ? GOLD : 'rgba(255,255,255,0.2)', background: feito ? GOLD : 'transparent', color: '#000' }}>{feito ? '✓' : bloqueado ? '🔒' : ''}</span>
                  {t}
                </button>
              ))}
            </div>
          )}

          {/* ── Briefing ── */}
          {estado === 'ok' && !expirado && briefing && vista === 'briefing' && (
            <BriefingForm eventoId={id} info={briefing} batizado={batizado} crianca={crianca}
              onEnviado={(respostas, enviadoEm) => {
                const primeira = !briefing.enviadoEm
                setBriefing(b => b ? { ...b, respostas, enviadoEm } : b)
                // Depois do 1.º envio passa logo para a marcação da reunião
                if (primeira && !reserva) { setAcabouBriefing(true); setVista('reuniao'); window.scrollTo({ top: 0, behavior: 'smooth' }) }
              }} />
          )}

          {/* ── Confirmado ── */}
          {estado === 'ok' && !expirado && vista === 'reuniao' && reserva && !aAlterar && (
            <div className="flex flex-col items-center text-center pt-4 lg:pt-16">
              <div className="relative w-24 h-24">
                {acabouDeMarcar && Array.from({ length: 14 }).map((_, i) => (
                  <span key={i} className="absolute left-1/2 top-1/2 w-1.5 h-1.5 rounded-full animate-[faisca_1.1s_ease-out_forwards]"
                    style={{ background: GOLD, ['--a' as any]: `${(360 / 14) * i}deg`, animationDelay: `${(i % 3) * 60}ms` }} />
                ))}
                <svg viewBox="0 0 96 96" className="w-24 h-24">
                  <circle cx="48" cy="48" r="44" fill="none" stroke={GOLD} strokeWidth="1.5" strokeDasharray="277" strokeDashoffset="277" className="animate-[desenha_.8s_ease-out_forwards]" />
                  <path d="M30 49 l12 12 l24 -26" fill="none" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    strokeDasharray="60" strokeDashoffset="60" className="animate-[desenha_.5s_.6s_ease-out_forwards]" />
                </svg>
              </div>
              <p className="text-white/60 italic text-xl mt-8" style={SERIF}>{nome ? `${nome}, está` : 'Está'} marcado!</p>
              <p className="text-4xl sm:text-5xl font-light mt-3 leading-tight" style={SERIF}>{diaLongo(reserva.data)}</p>
              <p className="mt-3 text-sm tracking-[0.3em] uppercase" style={{ color: GOLD }}>{reserva.hora} · Videochamada</p>
              <p className="text-white/45 text-sm mt-8 leading-relaxed max-w-sm">
                Vamos falar sobre os horários {batizado ? 'desse dia' : 'do vosso dia'}, partilhar dicas e sugestões e ajustar os últimos detalhes.
                Se precisarem de mudar alguma coisa, é só dizerem-nos pelo WhatsApp.
              </p>
              <div className="mt-6 w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 flex items-center gap-4 text-left">
                <span className="shrink-0 w-10 h-10 rounded-full border flex items-center justify-center" style={{ borderColor: 'rgba(201,168,76,0.4)', color: GOLD }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="2.5" y="6" width="13" height="12" rx="2" /><path d="M15.5 10.5l6-3.5v10l-6-3.5" strokeLinejoin="round" /></svg>
                </span>
                <span className="min-w-0">
                  <span className="block text-[10px] tracking-[0.3em] uppercase text-white/40">Link da videochamada</span>
                  <span className="block text-sm text-white/85 leading-snug mt-0.5">Encontra-se na mensagem que vos enviámos por WhatsApp.</span>
                </span>
              </div>
              <a href={googleCalUrl(reserva, nome, batizado ? oEvento : 'o vosso casamento')} target="_blank" rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-2 rounded-full border px-6 py-3 text-[11px] tracking-[0.25em] uppercase transition-all hover:bg-[#C9A84C] hover:text-black"
                style={{ borderColor: GOLD, color: GOLD }}>
                + Adicionar ao calendário
              </a>
              {pedido && (
                <p className="mt-6 w-full max-w-sm rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100 text-left">
                  Pediram outro horário ({pedido.opcoes.map(o => `${diaLongo(o.data)} às ${o.hora}`).join(' ou ')}). Carece de confirmação da nossa parte; até lá mantém-se esta data.
                </p>
              )}
              <button onClick={() => { setAAlterar(true); setAcabouDeMarcar(false); setAviso('') }}
                className="mt-4 text-[11px] tracking-[0.25em] uppercase text-white/45 hover:text-[#C9A84C] underline underline-offset-4 decoration-white/20 transition-colors">
                Alterar data da reunião
              </button>

              {/* Convite para o briefing, logo a seguir à marcação */}
              {briefing && (
                <button onClick={() => { setVista('briefing'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  className="mt-10 w-full max-w-sm rounded-2xl border px-5 py-4 flex items-center gap-4 text-left transition-all hover:-translate-y-0.5"
                  style={{ borderColor: briefing.enviadoEm ? 'rgba(255,255,255,0.1)' : 'rgba(201,168,76,0.5)', background: briefing.enviadoEm ? 'rgba(255,255,255,0.02)' : 'rgba(201,168,76,0.08)' }}>
                  <span className="shrink-0 w-10 h-10 rounded-full border flex items-center justify-center" style={{ borderColor: 'rgba(201,168,76,0.5)', color: GOLD }}>
                    {briefing.enviadoEm ? '✓' : '✎'}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] tracking-[0.3em] uppercase" style={{ color: GOLD }}>{briefing.enviadoEm ? 'Briefing enviado' : 'Antes da reunião'}</span>
                    <span className="block text-sm text-white/85 leading-snug mt-0.5">{briefing.enviadoEm ? 'Ver ou corrigir as vossas respostas' : batizado ? 'Preencham o briefing do batizado' : 'Preencham o briefing do vosso dia'}</span>
                  </span>
                  <span className="text-white/40">›</span>
                </button>
              )}
            </div>
          )}

          {/* ── Pedido enviado: aguarda confirmação da RL ── */}
          {estado === 'ok' && !expirado && vista === 'reuniao' && !reserva && pedido && !aPedir && (
            <div className="flex flex-col items-center text-center pt-4 lg:pt-16 animate-[fadeUp_.5s_ease-out_both]">
              <div className="w-20 h-20 rounded-full border flex items-center justify-center text-3xl" style={{ borderColor: 'rgba(201,168,76,0.5)', color: GOLD }}>⧗</div>
              <p className="text-white/60 italic text-xl mt-8" style={SERIF}>{acabouDePedir ? 'Pedido enviado!' : 'Pedido de reunião'}</p>
              <p className="text-3xl sm:text-4xl font-light mt-3 leading-tight" style={SERIF}>Aguarda a nossa confirmação</p>
              <div className="mt-8 w-full max-w-sm flex flex-col gap-2">
                {pedido.opcoes.map((o, i) => (
                  <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-left">
                    <span className="block text-[10px] tracking-[0.3em] uppercase text-white/40">Opção {i + 1}</span>
                    <span className="block text-xl font-light" style={SERIF}>{diaLongo(o.data)} · {o.hora}</span>
                  </div>
                ))}
              </div>
              {pedido.mensagem && (
                <p className="mt-3 w-full max-w-sm rounded-2xl border-l-2 border-[#C9A84C]/60 bg-white/[0.03] px-5 py-3 text-left italic text-white/75 whitespace-pre-wrap" style={SERIF}>“{pedido.mensagem}”</p>
              )}
              <p className="text-white/45 text-sm mt-8 leading-relaxed max-w-sm">
                Este horário carece de confirmação da nossa parte. Vamos ver a nossa agenda e confirmamos convosco pelo WhatsApp.
              </p>
              <button onClick={() => { setAPedir(true); setAcabouDePedir(false); mudarModo(true); setMensagem(pedido.mensagem ?? '') }}
                className="mt-6 text-[11px] tracking-[0.25em] uppercase text-white/45 hover:text-[#C9A84C] underline underline-offset-4 decoration-white/20 transition-colors">
                Alterar pedido
              </button>
            </div>
          )}

          {/* ── Escolher ── */}
          {estado === 'ok' && !expirado && vista === 'reuniao' && (!reserva || aAlterar) && (!pedido || aPedir || !!reserva) && (
            <>
              {acabouBriefing && (
                <div className="mb-8 rounded-2xl border border-[#C9A84C]/40 bg-[#C9A84C]/10 px-5 py-4 animate-[fadeUp_.5s_ease-out_both]">
                  <p className="text-[10px] tracking-[0.3em] uppercase" style={{ color: GOLD }}>✓ Briefing enviado</p>
                  <p className="text-xl font-light mt-1" style={SERIF}>Obrigado! Agora escolham o dia e a hora da nossa reunião.</p>
                </div>
              )}
              {/* A alterar: lembra o horário atual, que se mantém até confirmarem outro */}
              {reserva && aAlterar && (
                <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[10px] tracking-[0.3em] uppercase text-white/40">Marcada atualmente</p>
                    <p className="text-xl font-light mt-0.5 truncate" style={SERIF}>{diaLongo(reserva.data)} · {reserva.hora}</p>
                  </div>
                  <button onClick={() => { setAAlterar(false); setSlotId(null); setDia(null) }}
                    className="shrink-0 text-[10px] tracking-[0.25em] uppercase text-white/45 hover:text-[#C9A84C] transition-colors">Manter</button>
                </div>
              )}
              {/* Progresso */}
              <div className="flex items-center gap-3 mb-8">
                {['O dia', 'A hora', outro ? 'Solicitar' : 'Confirmar'].map((t, i) => {
                  const n = i + 1; const feito = passo > n; const ativo = passo === n
                  return (
                    <div key={t} className="flex items-center gap-3 flex-1 last:flex-none">
                      <span className="flex items-center gap-2 shrink-0">
                        <span className="w-6 h-6 rounded-full text-[11px] flex items-center justify-center border transition-all duration-300"
                          style={{ borderColor: ativo || feito ? GOLD : 'rgba(255,255,255,0.15)', background: feito ? GOLD : 'transparent', color: feito ? '#000' : ativo ? GOLD : 'rgba(255,255,255,0.35)' }}>
                          {feito ? '✓' : n}
                        </span>
                        <span className={`text-[10px] tracking-[0.25em] uppercase hidden sm:inline ${ativo ? 'text-white' : 'text-white/35'}`}>{t}</span>
                      </span>
                      {n < 3 && <span className="h-px flex-1 transition-colors duration-500" style={{ background: feito ? GOLD : 'rgba(255,255,255,0.1)' }} />}
                    </div>
                  )
                })}
              </div>

              {aviso && <p className="mb-5 rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">{aviso}</p>}

              {slots.length === 0 && !outro ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
                  <p className="text-2xl font-light" style={SERIF}>Sem horários de momento</p>
                  <p className="text-white/45 text-sm mt-3">Escolham um dia útil e uma hora que vos dê jeito.</p>
                  {diasUteis.size > 0 && (
                    <button onClick={() => mudarModo(true)}
                      className="mt-6 inline-flex rounded-full border px-6 py-3 text-[11px] tracking-[0.25em] uppercase transition-all hover:bg-[#C9A84C] hover:text-black"
                      style={{ borderColor: GOLD, color: GOLD }}>
                      Outro horário
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Calendário */}
                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-5">
                      <button onClick={() => irMes(-1)} disabled={idxMes <= 0} aria-label="Mês anterior"
                        className="w-9 h-9 rounded-full border border-white/10 text-white/60 hover:border-[#C9A84C] hover:text-[#C9A84C] disabled:opacity-20 disabled:hover:border-white/10 disabled:hover:text-white/60 transition-colors">‹</button>
                      <span className="text-2xl font-light" style={SERIF}>{mes ? mesAno(mes.y, mes.m) : ''}</span>
                      <button onClick={() => irMes(1)} disabled={idxMes === -1 || idxMes >= meses.length - 1} aria-label="Mês seguinte"
                        className="w-9 h-9 rounded-full border border-white/10 text-white/60 hover:border-[#C9A84C] hover:text-[#C9A84C] disabled:opacity-20 disabled:hover:border-white/10 disabled:hover:text-white/60 transition-colors">›</button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center">
                      {SEMANA.map((s, i) => <span key={i} className="text-[10px] tracking-[0.2em] text-white/30 pb-2">{s}</span>)}
                      {grelha.map((iso, i) => {
                        if (!iso) return <span key={i} />
                        const tem = diasAtivos.has(iso)
                        const sel = iso === dia
                        const comOpcao = outro && opcoes.some(o => o.data === iso)
                        const casamento = iso === dataEvento
                        return (
                          <button key={iso} disabled={!tem} onClick={() => { setDia(iso); setSlotId(null) }}
                            className={`relative aspect-square rounded-xl text-base sm:text-lg tabular-nums transition-all duration-200 ${tem ? 'hover:scale-105' : 'cursor-default'}`}
                            style={{
                              ...SERIF,
                              background: sel ? GOLD : comOpcao ? 'rgba(201,168,76,0.32)' : tem ? 'rgba(201,168,76,0.08)' : 'transparent',
                              color: sel ? '#000' : tem ? '#fff' : casamento ? GOLD : 'rgba(255,255,255,0.18)',
                              border: `1px solid ${sel ? GOLD : tem ? 'rgba(201,168,76,0.35)' : casamento ? 'rgba(201,168,76,0.4)' : 'transparent'}`,
                              boxShadow: sel ? '0 0 24px rgba(201,168,76,0.35)' : undefined,
                            }}
                            title={casamento ? rotuloEvento : undefined}>
                            {+iso.slice(8)}
                            {tem && !sel && <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ background: GOLD }} />}
                            {casamento && <span className="absolute -top-1 -right-1 text-[10px]" style={{ color: GOLD }}>♥</span>}
                          </button>
                        )
                      })}
                    </div>
                    <p className="text-[10px] text-white/30 mt-4 flex items-center gap-4">
                      <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full" style={{ background: GOLD }} /> {outro ? 'Dias úteis (seg. a sex.)' : 'Com horários'}</span>
                      {dataEvento && <span className="flex items-center gap-1.5"><span style={{ color: GOLD }}>♥</span> {rotuloEvento}</span>}
                    </p>
                  </div>

                  {/* Outro dia e horário (fora da disponibilidade; fins de semana não) */}
                  {(slots.length > 0 || outro) && diasUteis.size > 0 && (
                    <button onClick={() => mudarModo(!outro)}
                      className="mt-4 w-full rounded-xl border py-3.5 text-[11px] tracking-[0.3em] uppercase transition-all hover:bg-[#C9A84C] hover:text-black"
                      style={{ borderColor: GOLD, color: GOLD }}>
                      {outro ? '‹ Horários disponíveis' : 'Outro horário'}
                    </button>
                  )}
                  {outro && <p className="mt-2 text-[11px] text-white/35">De segunda a sexta, das 10h às 12h ou das 17h às 20h. Ao fim de semana não é possível. Podem indicar até dois dias diferentes.</p>}

                  {/* Horas */}
                  <div className={`transition-all duration-500 ${dia ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-1 pointer-events-none'}`}>
                    <p className="mt-8 mb-3 text-[10px] tracking-[0.35em] uppercase text-white/40">{dia ? diaLongo(dia) : 'Escolham primeiro o dia'}</p>
                    <div key={dia ?? 'nenhum'} className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {(outro ? horasOutro.map(h => ({ id: h, hora: h })) : horas).map((s, i) => {
                        const ativo = outro ? s.hora === opcaoDoDia : s.id === slotId
                        return (
                          <button key={s.id} onClick={() => outro ? escolherHora(s.hora) : setSlotId(s.id)}
                            className="rounded-xl border py-3.5 text-xl tabular-nums transition-all duration-200 hover:-translate-y-0.5 animate-[fadeUp_.35s_ease-out_both]"
                            style={{ ...SERIF, animationDelay: `${i * 45}ms`, borderColor: ativo ? GOLD : 'rgba(255,255,255,0.1)', background: ativo ? GOLD : 'rgba(255,255,255,0.02)', color: ativo ? '#000' : 'rgba(255,255,255,0.9)' }}>
                            {s.hora}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Resumo + confirmar */}
                  <div className={`mt-8 rounded-2xl border p-5 transition-all duration-500 ${escolhido ? 'border-[#C9A84C]/50 bg-[#C9A84C]/[0.06]' : 'border-white/[0.06] bg-transparent'}`}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[10px] tracking-[0.3em] uppercase text-white/40">Videochamada · cerca de {DURACAO_MIN} min</p>
                        {outro ? (
                          opcoes.length ? opcoes.map((o, i) => (
                            <p key={o.data} className="text-xl font-light mt-1 flex items-center gap-3" style={SERIF}>
                              <span className="truncate"><span className="text-white/40 text-base">Opção {i + 1}:</span> {diaLongo(o.data)} · {o.hora}</span>
                              <button onClick={() => setOpcoes(prev => prev.filter(x => x.data !== o.data))} aria-label="Remover opção"
                                className="shrink-0 text-xs text-white/35 hover:text-white">✕</button>
                            </p>
                          )) : <p className="text-2xl font-light mt-1" style={SERIF}>Escolham até dois dias</p>
                        ) : (
                          <p className="text-2xl font-light mt-1 truncate" style={SERIF}>
                            {escolhido ? `${diaLongo(escolhido.data)} · ${escolhido.hora}` : 'Escolham um horário'}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 w-10 h-10 rounded-full border flex items-center justify-center" style={{ borderColor: 'rgba(201,168,76,0.4)', color: GOLD }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="2.5" y="6" width="13" height="12" rx="2" /><path d="M15.5 10.5l6-3.5v10l-6-3.5" strokeLinejoin="round" /></svg>
                      </span>
                    </div>
                    {outro && (
                      <textarea value={mensagem} onChange={ev => setMensagem(ev.target.value.slice(0, 500))} rows={3}
                        placeholder="Querem deixar-nos uma mensagem? (opcional)"
                        className="mt-4 w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[15px] text-white placeholder:text-white/25 focus:outline-none focus:border-[#C9A84C] transition-colors" />
                    )}
                    <button onClick={confirmar} disabled={!escolhido || aEnviar}
                      className="relative overflow-hidden mt-5 w-full rounded-xl py-4 text-[12px] font-semibold tracking-[0.3em] uppercase transition-all disabled:opacity-25 enabled:hover:shadow-[0_0_30px_rgba(201,168,76,0.35)]"
                      style={{ background: GOLD, color: '#000' }}>
                      {escolhido && !aEnviar && <span className="absolute inset-y-0 -left-1/3 w-1/3 bg-white/30 skew-x-[-20deg] animate-[brilho_2.4s_ease-in-out_infinite]" />}
                      <span className="relative">{aEnviar ? (outro ? 'A enviar…' : 'A marcar…') : outro ? 'Solicitar reunião' : aAlterar ? 'Confirmar nova data' : 'Confirmar reunião'}</span>
                    </button>
                    {outro && <p className="mt-3 text-[11px] text-white/40 text-center">O pedido carece de confirmação da nossa parte.</p>}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </section>

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: none } }
        @keyframes linha { from { transform: scaleX(0) } to { transform: scaleX(1) } }
        @keyframes kenburns { from { transform: scale(1.12) } to { transform: scale(1.02) } }
        @keyframes desenha { to { stroke-dashoffset: 0 } }
        @keyframes brilho { 0% { left: -40% } 60%, 100% { left: 130% } }
        @keyframes faisca {
          0% { transform: translate(-50%, -50%) rotate(var(--a)) translateY(0); opacity: 1 }
          100% { transform: translate(-50%, -50%) rotate(var(--a)) translateY(-70px); opacity: 0 }
        }
        @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms !important; animation-delay: 0ms !important } }
      `}</style>
    </main>
  )
}
