'use client'

import { useEffect, useMemo, useState } from 'react'

/* Marcar reunião a partir do rollup: dias → horas → presencial/videochamada →
   nomes e telefone. Usa os horários livres da reunião de preparação
   (/api/rollup-reuniao). Os horários só carregam quando se abre o painel. */

type Slot = { id: string; data: string; hora: string }
type Reserva = { data: string; hora: string; formato: string; link: string }

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const DIAS_LONGOS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const MESES_LONGOS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

const d = (iso: string) => new Date(iso + 'T12:00:00')
const longa = (iso: string) => { const x = d(iso); return `${DIAS_LONGOS[x.getDay()]}, ${x.getDate()} de ${MESES_LONGOS[x.getMonth()]}` }

export default function MarcarReuniao({ dataCasamento, whatsapp }: { dataCasamento: string; whatsapp: string }) {
  const [aberto, setAberto] = useState(false)
  const [slots, setSlots] = useState<Slot[] | null>(null)
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

  function carregar() {
    setErroCarregar(false)
    fetch('/api/rollup-reuniao', { cache: 'no-store' })
      .then(r => r.json())
      .then(j => { if (!j.ok) throw 0; setSlots(j.slots); if (j.slots[0]) setDia(j.slots[0].data) })
      .catch(() => setErroCarregar(true))
  }
  useEffect(() => { if (aberto && !slots) carregar() }, [aberto]) // eslint-disable-line react-hooks/exhaustive-deps

  const dias = useMemo(() => [...new Set((slots ?? []).map(s => s.data))], [slots])
  const horas = (slots ?? []).filter(s => s.data === dia)
  const escolhido = (slots ?? []).find(s => s.id === slotId)

  async function confirmar() {
    if (!escolhido) return setErro('Escolham um horário, por favor.')
    setErro(''); setEnviando(true)
    try {
      const r = await fetch('/api/rollup-reuniao', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId, nome, contato: tel, formato, dataCasamento, site }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) {
        setErro(j.error ?? 'Não foi possível marcar.')
        // Horário apanhado entretanto: recarrega a lista
        if (r.status === 409) { setSlotId(''); setSlots(null); carregar() }
        return
      }
      setReserva(j.reserva)
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
          {slots && slots.length === 0 && (
            <p className="mr-vazio">De momento não temos horários livres.<br />
              <a href={whatsapp} target="_blank" rel="noopener noreferrer">Combinem connosco pelo WhatsApp ↗</a></p>
          )}

          {slots && slots.length > 0 && (
            <>
              <p className="mr-lbl">Dia</p>
              <div className="mr-dias">
                {dias.map(iso => {
                  const x = d(iso)
                  return (
                    <button key={iso} className={iso === dia ? 'on' : ''} onClick={() => { setDia(iso); setSlotId('') }}>
                      <span>{DIAS[x.getDay()]}</span><b>{x.getDate()}</b><span>{MESES[x.getMonth()]}</span>
                    </button>
                  )
                })}
              </div>

              <p className="mr-lbl">Hora</p>
              <div className="mr-horas">
                {horas.map(s => (
                  <button key={s.id} className={s.id === slotId ? 'on' : ''} onClick={() => setSlotId(s.id)}>{s.hora}</button>
                ))}
              </div>

              <p className="mr-lbl">Como preferem</p>
              <div className="mr-formato">
                {(['Videochamada', 'Presencial'] as const).map(f => (
                  <button key={f} className={f === formato ? 'on' : ''} onClick={() => setFormato(f)}>
                    {f === 'Videochamada' ? 'Videochamada' : 'No estúdio'}
                  </button>
                ))}
              </div>

              <p className="mr-lbl">Os vossos nomes</p>
              <input className="mr-in" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex.: Ana e Pedro" autoComplete="name" />
              <p className="mr-lbl">Telefone</p>
              <input className="mr-in" value={tel} onChange={e => setTel(e.target.value)} placeholder="912 345 678" inputMode="tel" autoComplete="tel" />
              <input className="mr-hp" tabIndex={-1} autoComplete="off" value={site} onChange={e => setSite(e.target.value)} aria-hidden="true" />

              {escolhido && <p className="mr-resumo">{longa(escolhido.data)} às {escolhido.hora}</p>}
              {erro && <p className="mr-erro">{erro}</p>}
              <button className="mr-conf" onClick={confirmar} disabled={enviando || !slotId || nome.trim().length < 2 || tel.replace(/\D/g, '').length < 9}>
                {enviando ? 'A marcar…' : 'Confirmar reunião'}
              </button>
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
.ru .mr-horas,.ru .mr-formato{display:flex;flex-wrap:wrap;gap:8px;}
.ru .mr-horas button,.ru .mr-formato button{padding:11px 16px;border-radius:10px;border:1px solid var(--line);background:transparent;color:var(--tx);font-family:var(--fd);font-size:15px;cursor:pointer;transition:.3s var(--ease);}
.ru .mr-formato button{flex:1;}
.ru .mr-dias button.on,.ru .mr-horas button.on,.ru .mr-formato button.on{border-color:var(--g);background:rgba(216,190,147,.14);color:var(--g);}
.ru .mr-dias button.on b{color:var(--g);}
.ru .mr-in{width:100%;box-sizing:border-box;background:rgba(0,0,0,.25);border:1px solid var(--line);border-radius:10px;padding:13px 14px;color:var(--tx);font-family:var(--fd);font-size:16px;}
.ru .mr-in:focus{outline:none;border-color:var(--g);}
.ru .mr-hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0;}
.ru .mr-resumo{text-align:center;font-family:var(--fs);font-style:italic;font-size:19px;color:var(--g);margin:20px 0 0;}
.ru .mr-erro{text-align:center;font-family:var(--fd);font-size:14px;color:#e8a0a0;margin:14px 0 0;}
.ru .mr-erro button{background:none;border:none;color:var(--g);text-decoration:underline;cursor:pointer;font:inherit;}
.ru .mr-vazio{text-align:center;font-family:var(--fd);font-size:15px;color:var(--tx-mid);line-height:1.7;margin:4px 0;}
.ru .mr-vazio a{color:var(--g);}
.ru .mr-conf{width:100%;margin-top:18px;padding:16px;border-radius:12px;border:none;cursor:pointer;background:var(--g);color:var(--ink);font-family:var(--fm);font-size:11px;letter-spacing:.26em;text-transform:uppercase;transition:.3s var(--ease);}
.ru .mr-conf:disabled{opacity:.4;cursor:default;}
.ru .mr-ok{margin-top:40px;text-align:center;padding:28px 20px;border-radius:14px;border:1px solid var(--g);background:radial-gradient(120% 140% at 50% 0%,rgba(216,190,147,.14),transparent 60%);animation:ruSobe .7s var(--ease) both;}
.ru .mr-ok-t{font-family:var(--fs);font-weight:300;font-size:42px;color:var(--tx);margin:10px 0 0;}
.ru .mr-ok-t em{font-style:italic;color:var(--g);}
.ru .mr-ok-q{font-family:var(--fd);font-weight:300;font-size:18px;color:var(--tx);line-height:1.6;margin:12px 0 0;}
.ru .mr-ok-l{display:inline-block;margin-top:14px;font-family:var(--fm);font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--g);text-decoration:none;}
`
