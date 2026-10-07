'use client'

import { useEffect, useMemo, useState } from 'react'

/* Marcar reunião a partir do rollup: dias → horas → presencial/videochamada →
   nomes e telefone. Usa os horários livres da reunião de preparação
   (/api/rollup-reuniao). Os horários só carregam quando se abre o painel.
   "Outro horário" (como na preparação): dias úteis, até 2 opções em dias
   diferentes; fica como pedido até a RL confirmar.
   Com leadId (página /reuniao/<id>, link do WhatsApp do CRM) a lead já existe:
   não pede nomes nem telefone e a marcação atualiza essa lead. */

type Slot = { id: string; data: string; hora: string }
type Reserva = { data: string; hora: string; formato: string; link: string }
type Opcao = { data: string; hora: string }

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const DIAS_LONGOS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const MESES_LONGOS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

const d = (iso: string) => new Date(iso + 'T12:00:00')
const longa = (iso: string) => { const x = d(iso); return `${DIAS_LONGOS[x.getDay()]}, ${x.getDate()} de ${MESES_LONGOS[x.getMonth()]}` }
const ymd = (x: Date) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`

// Dias úteis de amanhã até ~5 semanas (para o "Outro horário")
function diasUteis(): string[] {
  const out: string[] = []
  const x = new Date(); x.setHours(12, 0, 0, 0)
  for (let i = 1; i <= 35; i++) {
    x.setDate(x.getDate() + 1)
    if (x.getDay() !== 0 && x.getDay() !== 6) out.push(ymd(x))
  }
  return out
}

export default function MarcarReuniao({ dataCasamento, leadId }: { dataCasamento: string; leadId?: string }) {
  const [aberto, setAberto] = useState(!!leadId)
  const [slots, setSlots] = useState<Slot[] | null>(null)
  const [horasOutro, setHorasOutro] = useState<string[]>([])
  const [erroCarregar, setErroCarregar] = useState(false)
  const [dia, setDia] = useState('')
  const [slotId, setSlotId] = useState('')
  const [formato, setFormato] = useState<'Videochamada' | 'Presencial'>('Videochamada')
  const [nome, setNome] = useState('')
  const [tel, setTel] = useState('')
  const [site, setSite] = useState('') // campo escondido anti-robô
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [reserva, setReserva] = useState<Reserva | null>(null)
  // Outro horário
  const [outro, setOutro] = useState(false)
  const [opcoes, setOpcoes] = useState<Opcao[]>([])
  const [mensagem, setMensagem] = useState('')
  const [pedidoOk, setPedidoOk] = useState<Opcao[] | null>(null)

  function carregar() {
    setErroCarregar(false)
    fetch('/api/rollup-reuniao', { cache: 'no-store' })
      .then(r => r.json())
      .then(j => {
        if (!j.ok) throw 0
        setSlots(j.slots); setHorasOutro(j.horasOutro ?? [])
        if (j.slots[0]) setDia(j.slots[0].data)
        else { setOutro(true); setDia('') } // sem horários livres: vai direto ao "Outro horário"
      })
      .catch(() => setErroCarregar(true))
  }
  useEffect(() => { if (aberto && !slots) carregar() }, [aberto]) // eslint-disable-line react-hooks/exhaustive-deps

  const uteis = useMemo(diasUteis, [])
  const dias = useMemo(() => outro ? uteis : [...new Set((slots ?? []).map(s => s.data))], [slots, outro, uteis])
  const horas = (slots ?? []).filter(s => s.data === dia)
  const escolhido = (slots ?? []).find(s => s.id === slotId)
  const opcaoDoDia = opcoes.find(o => o.data === dia)?.hora
  const dadosOk = !!leadId || nome.trim().length >= 2 && tel.replace(/\D/g, '').length >= 9

  function mudarModo(novo: boolean) {
    setOutro(novo); setSlotId(''); setOpcoes([]); setErro('')
    setDia(novo ? '' : (slots?.[0]?.data ?? ''))
  }

  // Uma opção por dia; no máximo duas (a mais recente substitui a segunda)
  function escolherHora(hora: string) {
    setOpcoes(prev => {
      const outros = prev.filter(o => o.data !== dia)
      const base = outros.length >= 2 ? outros.slice(0, 1) : outros
      return [...base, { data: dia, hora }].sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora))
    })
  }

  async function confirmar() {
    if (outro ? opcoes.length === 0 : !escolhido) return setErro('Escolham um horário, por favor.')
    setErro(''); setEnviando(true)
    try {
      const r = await fetch('/api/rollup-reuniao', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(outro
          ? { pedido: opcoes, mensagem, nome, contato: tel, formato, dataCasamento, site, leadId }
          : { slotId, nome, contato: tel, formato, dataCasamento, site, leadId }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) {
        setErro(j.error ?? 'Não foi possível marcar.')
        // Horário apanhado entretanto: recarrega a lista
        if (r.status === 409) { setSlotId(''); setSlots(null); carregar() }
        return
      }
      if (outro) setPedidoOk(j.pedido.opcoes)
      else setReserva(j.reserva)
    } catch {
      setErro('Sem ligação. Tentem outra vez, por favor.')
    } finally {
      setEnviando(false)
    }
  }

  if (reserva) return (
    <div className="mr-ok">
      <p className="eyebrow">Reunião marcada</p>
      <p className="mr-ok-t">Até <em>breve!</em></p>
      <p className="mr-ok-q">{longa(reserva.data)}<br />às {reserva.hora} · {reserva.formato}</p>
      <a href={reserva.link} target="_blank" rel="noopener noreferrer" className="mr-ok-l">
        {reserva.formato === 'Videochamada' ? 'Link da videochamada ↗' : 'Ver o estúdio no mapa ↗'}
      </a>
      <p className="hint" style={{ marginTop: 14 }}>Guardem este ecrã. Qualquer imprevisto, falem connosco pelo WhatsApp.</p>
    </div>
  )

  if (pedidoOk) return (
    <div className="mr-ok">
      <p className="eyebrow">Pedido enviado</p>
      <p className="mr-ok-t">Obrigado<em>!</em></p>
      <p className="mr-ok-q">{pedidoOk.map(o => <span key={o.data}>{longa(o.data)} às {o.hora}<br /></span>)}</p>
      <p className="hint" style={{ marginTop: 14 }}>Vamos confirmar convosco o dia e a hora pelo WhatsApp, muito em breve.</p>
    </div>
  )

  return (
    <div>
      <button className={`mr-btn${aberto ? ' on' : ''}`} onClick={() => setAberto(a => !a)} aria-expanded={aberto}>
        <b>Marcar reunião</b>
        <small>{aberto ? 'Escolham o dia e a hora' : 'Conversamos sobre o vosso dia'}</small>
      </button>

      {aberto && (
        <div className="mr-painel">
          {erroCarregar && <p className="mr-erro">Não foi possível carregar os horários. <button onClick={carregar}>Tentar outra vez</button></p>}
          {!slots && !erroCarregar && <p className="hint" style={{ textAlign: 'center' }}>A carregar horários…</p>}

          {slots && (
            <>
              {slots.length === 0 && <p className="mr-vazio">De momento não temos horários livres. Indiquem o dia e a hora que vos dão jeito.</p>}
              <p className="mr-lbl">{outro ? 'Dia (seg. a sex.)' : 'Dia'}</p>
              <div className="mr-dias">
                {dias.map(iso => {
                  const x = d(iso)
                  const comOpcao = outro && opcoes.some(o => o.data === iso)
                  return (
                    <button key={iso} className={`${iso === dia ? 'on' : ''}${comOpcao ? ' marcado' : ''}`} onClick={() => { setDia(iso); setSlotId('') }}>
                      <span>{DIAS[x.getDay()]}</span><b>{x.getDate()}</b><span>{MESES[x.getMonth()]}</span>
                    </button>
                  )
                })}
              </div>
              {slots.length > 0 && (
                <button className="mr-outro" onClick={() => mudarModo(!outro)}>
                  {outro ? '‹ Horários disponíveis' : 'Nenhum dá jeito? Outro horário'}
                </button>
              )}
              {outro && <p className="mr-nota">De segunda a sexta, das 10h às 12h ou das 17h às 20h. Podem indicar até dois dias diferentes.</p>}

              {dia && (
                <>
                  <p className="mr-lbl">Hora</p>
                  <div className="mr-horas">
                    {outro
                      ? horasOutro.map(h => <button key={h} className={h === opcaoDoDia ? 'on' : ''} onClick={() => escolherHora(h)}>{h}</button>)
                      : horas.map(s => <button key={s.id} className={s.id === slotId ? 'on' : ''} onClick={() => setSlotId(s.id)}>{s.hora}</button>)}
                  </div>
                </>
              )}

              {outro && opcoes.length > 0 && (
                <div className="mr-opcoes">
                  {opcoes.map((o, i) => (
                    <span key={o.data}>Opção {i + 1}: {longa(o.data)} às {o.hora}
                      <button aria-label="Remover" onClick={() => setOpcoes(p => p.filter(x => x.data !== o.data))}>×</button></span>
                  ))}
                </div>
              )}

              <p className="mr-lbl">Como preferem</p>
              <div className="mr-formato">
                {(['Videochamada', 'Presencial'] as const).map(f => (
                  <button key={f} className={f === formato ? 'on' : ''} onClick={() => setFormato(f)}>
                    {f === 'Videochamada' ? 'Videochamada' : 'No estúdio'}
                  </button>
                ))}
              </div>

              {!leadId && <>
                <p className="mr-lbl">Os vossos nomes</p>
                <input className="mr-in" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex.: Ana e Pedro" autoComplete="name" />
                <p className="mr-lbl">Telefone</p>
                <input className="mr-in" value={tel} onChange={e => setTel(e.target.value)} placeholder="912 345 678" inputMode="tel" autoComplete="tel" />
              </>}
              <input className="mr-hp" tabIndex={-1} autoComplete="off" value={site} onChange={e => setSite(e.target.value)} aria-hidden="true" />

              {outro && (
                <>
                  <p className="mr-lbl">Mensagem (opcional)</p>
                  <textarea className="mr-in" rows={2} value={mensagem} onChange={e => setMensagem(e.target.value)} placeholder="Ex.: a partir das 18h é melhor para nós" />
                </>
              )}

              {!outro && escolhido && <p className="mr-resumo">{longa(escolhido.data)} às {escolhido.hora}</p>}
              {erro && <p className="mr-erro">{erro}</p>}
              <button className="mr-conf" onClick={confirmar} disabled={enviando || !dadosOk || (outro ? opcoes.length === 0 : !slotId)}>
                {enviando ? (outro ? 'A enviar…' : 'A marcar…') : outro ? 'Solicitar reunião' : 'Confirmar reunião'}
              </button>
              {outro && <p className="mr-nota" style={{ textAlign: 'center' }}>O pedido carece de confirmação da nossa parte.</p>}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export const CSS_MARCAR = `
.ru .mr-btn{position:relative;overflow:hidden;width:100%;display:flex;flex-direction:column;align-items:center;gap:8px;padding:26px 16px;margin-top:40px;border-radius:14px;border:none;cursor:pointer;
  background:linear-gradient(135deg,#e6d0a6,var(--g) 45%,var(--g-deep));color:var(--ink);box-shadow:0 10px 40px -12px rgba(216,190,147,.55);transition:.4s var(--ease);}
.ru .mr-btn::after{content:"";position:absolute;top:0;left:-60%;width:40%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.55),transparent);transform:skewX(-20deg);animation:ruBrilho 4.5s 1s ease-in-out infinite;}
.ru .mr-btn b{font-family:var(--fm);font-weight:400;font-size:11px;letter-spacing:.3em;text-transform:uppercase;}
.ru .mr-btn small{font-family:var(--fs);font-style:italic;font-size:16px;opacity:.75;}
.ru .mr-btn.on{border-radius:14px 14px 0 0;}
.ru .mr-painel{border:1px solid rgba(216,190,147,.35);border-top:none;border-radius:0 0 14px 14px;padding:18px 16px 20px;background:rgba(216,190,147,.03);animation:ruSobe .5s var(--ease) both;}
.ru .mr-lbl{font-family:var(--fm);font-size:9.5px;letter-spacing:.26em;text-transform:uppercase;color:var(--tx-dim);margin:18px 0 10px;}
.ru .mr-lbl:first-child{margin-top:4px;}
.ru .mr-dias{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding-bottom:2px;}
.ru .mr-dias::-webkit-scrollbar{display:none;}
.ru .mr-dias button{flex:none;width:58px;padding:10px 0;border-radius:12px;border:1px solid var(--line);background:transparent;color:var(--tx-mid);cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;transition:.3s var(--ease);}
.ru .mr-dias button span{font-family:var(--fm);font-size:9px;letter-spacing:.14em;text-transform:uppercase;}
.ru .mr-dias button b{font-family:var(--fs);font-weight:300;font-size:26px;line-height:1.1;color:var(--tx);}
.ru .mr-dias button.marcado{border-color:rgba(216,190,147,.6);}
.ru .mr-dias button.marcado::after{content:"";width:5px;height:5px;border-radius:50%;background:var(--g);margin-top:3px;}
.ru .mr-horas,.ru .mr-formato{display:flex;flex-wrap:wrap;gap:8px;}
.ru .mr-horas button,.ru .mr-formato button{padding:11px 16px;border-radius:10px;border:1px solid var(--line);background:transparent;color:var(--tx);font-family:var(--fd);font-size:15px;cursor:pointer;transition:.3s var(--ease);}
.ru .mr-formato button{flex:1;}
.ru .mr-dias button.on,.ru .mr-horas button.on,.ru .mr-formato button.on{border-color:var(--g);background:rgba(216,190,147,.14);color:var(--g);}
.ru .mr-dias button.on b{color:var(--g);}
.ru .mr-outro{display:block;margin:12px 0 0;background:none;border:none;padding:0;cursor:pointer;font-family:var(--fm);font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--g);text-decoration:underline;text-underline-offset:4px;}
.ru .mr-nota{font-family:var(--fd);font-size:13px;color:var(--tx-dim);line-height:1.6;margin:10px 0 0;}
.ru .mr-opcoes{display:flex;flex-direction:column;gap:8px;margin-top:16px;}
.ru .mr-opcoes span{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border-radius:10px;border:1px solid rgba(216,190,147,.4);background:rgba(216,190,147,.08);font-family:var(--fd);font-size:14px;color:var(--tx);}
.ru .mr-opcoes button{background:none;border:none;color:var(--tx-dim);font-size:20px;line-height:1;cursor:pointer;}
.ru .mr-in{width:100%;box-sizing:border-box;background:rgba(0,0,0,.25);border:1px solid var(--line);border-radius:10px;padding:13px 14px;color:var(--tx);font-family:var(--fd);font-size:16px;}
.ru textarea.mr-in{resize:none;}
.ru .mr-in:focus{outline:none;border-color:var(--g);}
.ru .mr-hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0;}
.ru .mr-resumo{text-align:center;font-family:var(--fs);font-style:italic;font-size:19px;color:var(--g);margin:20px 0 0;}
.ru .mr-erro{text-align:center;font-family:var(--fd);font-size:14px;color:#e8a0a0;margin:14px 0 0;}
.ru .mr-erro button{background:none;border:none;color:var(--g);text-decoration:underline;cursor:pointer;font:inherit;}
.ru .mr-vazio{text-align:center;font-family:var(--fd);font-size:15px;color:var(--tx-mid);line-height:1.7;margin:4px 0 12px;}
.ru .mr-conf{width:100%;margin-top:18px;padding:16px;border-radius:12px;border:none;cursor:pointer;background:var(--g);color:var(--ink);font-family:var(--fm);font-size:11px;letter-spacing:.26em;text-transform:uppercase;transition:.3s var(--ease);}
.ru .mr-conf:disabled{opacity:.4;cursor:default;}
.ru .mr-ok{margin-top:40px;text-align:center;padding:28px 20px;border-radius:14px;border:1px solid var(--g);background:radial-gradient(120% 140% at 50% 0%,rgba(216,190,147,.14),transparent 60%);animation:ruSobe .7s var(--ease) both;}
.ru .mr-ok-t{font-family:var(--fs);font-weight:300;font-size:42px;color:var(--tx);margin:10px 0 0;}
.ru .mr-ok-t em{font-style:italic;color:var(--g);}
.ru .mr-ok-q{font-family:var(--fd);font-weight:300;font-size:18px;color:var(--tx);line-height:1.6;margin:12px 0 0;}
.ru .mr-ok-l{display:inline-block;margin-top:14px;font-family:var(--fm);font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--g);text-decoration:none;}
`
