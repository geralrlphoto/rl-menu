'use client'

import { useEffect, useState } from 'react'
import { MOMENTOS, VALORIZAM, MAX_VALORIZAM, FASES, DECISOES, type Tipo, type Respostas } from '@/lib/qualificacao'

/* "Preparem a reunião": bloco dos portais da reunião (/r casamento, /b batizado).
   Deixa claro que na reunião não se fala de valores e pergunta pelos momentos,
   pelo que valorizam, em que ponto estão e quando pensam decidir.
   Grava em /api/lead-page/qualificar (que também ajusta a prioridade da lead). */

export default function PrepararReuniao({ token, tipo, isAdmin }: { token: string; tipo: Tipo; isAdmin: boolean }) {
  const [r, setR] = useState<Respostas>({ momentos: [], valorizam: [] })
  const [enviado, setEnviado] = useState(false)
  const [editar, setEditar] = useState(false)
  const [aEnviar, setAEnviar] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    fetch(`/api/lead-page/qualificar?token=${encodeURIComponent(token)}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(j => { if (j.respostas) { setR({ momentos: [], valorizam: [], ...j.respostas }); setEnviado(true) } })
      .catch(() => {})
  }, [token])

  const alternar = (campo: 'momentos' | 'valorizam', v: string, max?: number) => setR(p => {
    const lista = p[campo] ?? []
    if (lista.includes(v)) return { ...p, [campo]: lista.filter(x => x !== v) }
    return { ...p, [campo]: max && lista.length >= max ? [...lista.slice(1), v] : [...lista, v] }
  })

  async function enviar() {
    if (!r.fase || !r.decisao) return setErro('Respondam às duas primeiras perguntas, por favor.')
    setErro(''); setAEnviar(true)
    try {
      const res = await fetch('/api/lead-page/qualificar', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, tipo, respostas: r }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) return setErro(j.error ?? 'Não foi possível enviar.')
      setEnviado(true); setEditar(false)
    } catch {
      setErro('Sem ligação. Tentem outra vez, por favor.')
    } finally {
      setAEnviar(false)
    }
  }

  const batizado = tipo === 'batizado'
  const mostrarForm = !enviado || editar

  return (
    <section id="sec-preparar" className="rlp-sec" style={{ paddingLeft: 'var(--pad)', paddingRight: 'var(--pad)', borderTop: '1px solid var(--line-soft)' }}>
      <style>{CSS}</style>
      <div className="rq">
        <span className="rlp-eyebrow c">Antes de nos conhecermos</span>
        <h2 className="rlp-h2" style={{ marginTop: 16, textAlign: 'center' }}>Preparem a <em>reunião</em></h2>
        <p className="rq-lede">
          Nesta reunião não vamos falar de orçamentos nem de valores. Queremos conhecer-vos: {batizado ? 'a história da vossa família' : 'a vossa história'} e
          os momentos que não podem ficar por contar. Quatro perguntas rápidas ajudam-nos a chegar preparados.
        </p>

        {!mostrarForm && (
          <div className="rq-ok">
            <span className="rq-ok-i">✦</span>
            <p className="rlp-h2" style={{ fontSize: 'clamp(22px,3vw,30px)' }}>Obrigado, <em>já estamos a preparar</em></p>
            <p className="rq-lede" style={{ marginTop: 8 }}>Levamos para a reunião os momentos que escolheram{r.momentos?.length ? `: ${r.momentos.slice(0, 3).join(', ').toLowerCase()}${r.momentos.length > 3 ? '…' : ''}` : '.'}</p>
            <button className="rq-link" onClick={() => setEditar(true)}>Alterar respostas</button>
          </div>
        )}

        {mostrarForm && (
          <div className="rq-form">
            <p className="rq-q"><b>01</b>Em que ponto estão?</p>
            <div className="rq-chips">
              {FASES[tipo].map(f => <button key={f.v} className={r.fase === f.v ? 'on' : ''} onClick={() => setR(p => ({ ...p, fase: f.v }))}>{f.t}</button>)}
            </div>

            <p className="rq-q"><b>02</b>Quando pensam decidir?</p>
            <div className="rq-chips">
              {DECISOES.map(d => <button key={d.v} className={r.decisao === d.v ? 'on' : ''} onClick={() => setR(p => ({ ...p, decisao: d.v }))}>{d.t}</button>)}
            </div>

            <p className="rq-q"><b>03</b>Que momentos não podem ficar por contar?<span>Escolham os que quiserem</span></p>
            <div className="rq-chips">
              {MOMENTOS[tipo].map(m => <button key={m} className={r.momentos?.includes(m) ? 'on' : ''} onClick={() => alternar('momentos', m)}>{m}</button>)}
            </div>

            <p className="rq-q"><b>04</b>O que mais valorizam?<span>Até {MAX_VALORIZAM}</span></p>
            <div className="rq-chips">
              {VALORIZAM.map(v => <button key={v} className={r.valorizam?.includes(v) ? 'on' : ''} onClick={() => alternar('valorizam', v, MAX_VALORIZAM)}>{v}</button>)}
            </div>

            <p className="rq-q"><b>+</b>{batizado ? 'Contem-nos algo sobre a vossa família' : 'Contem-nos algo sobre vós'}<span>Opcional</span></p>
            <textarea className="rq-txt" rows={3} value={r.historia ?? ''} onChange={e => setR(p => ({ ...p, historia: e.target.value }))}
              placeholder={batizado ? 'Ex.: é o primeiro neto da família e os avós vêm de longe' : 'Ex.: conhecemo-nos numa viagem e a família dela é enorme'} />

            {erro && <p className="rq-erro">{erro}</p>}
            <button onClick={enviar} disabled={aEnviar || isAdmin || !r.fase || !r.decisao} className="rlp-btn full" style={{ marginTop: 22 }}>
              <span className="fill" /><span className="dot" />{aEnviar ? 'A enviar…' : enviado ? 'Guardar alterações' : 'Enviar'}
            </button>
            {isAdmin && <p className="rq-nota">Em modo admin as respostas não são gravadas.</p>}
          </div>
        )}
      </div>
    </section>
  )
}

const CSS = `
.rq{max-width:640px;margin:0 auto;display:flex;flex-direction:column;align-items:center;}
.rq-lede{font-size:15px;line-height:1.75;color:var(--tx-mid);text-align:center;max-width:52ch;margin:16px 0 0;}
.rq-form{width:100%;margin-top:30px;}
.rq-q{display:flex;align-items:baseline;flex-wrap:wrap;gap:10px;margin:26px 0 12px;font-size:17px;color:var(--tx,#f3ede2);}
.rq-q b{font-family:'Space Mono',monospace;font-weight:400;font-size:11px;letter-spacing:.14em;color:var(--g);}
.rq-q span{font-family:'Space Mono',monospace;font-size:9.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--tx-dim);}
.rq-chips{display:flex;flex-wrap:wrap;gap:8px;}
.rq-chips button{padding:10px 15px;border-radius:999px;border:1px solid var(--line);background:transparent;color:var(--tx-mid);font-size:14px;cursor:pointer;transition:all .25s ease;}
.rq-chips button:hover{border-color:rgba(216,190,147,.5);color:var(--tx,#f3ede2);}
.rq-chips button.on{border-color:var(--g);background:rgba(216,190,147,.13);color:var(--g);}
.rq-txt{width:100%;box-sizing:border-box;background:rgba(0,0,0,.25);border:1px solid var(--line);border-radius:12px;padding:13px 14px;color:var(--tx,#f3ede2);font-size:15px;line-height:1.6;resize:vertical;}
.rq-txt:focus{outline:none;border-color:var(--g);}
.rq-erro{text-align:center;color:#e8a0a0;font-size:14px;margin:16px 0 0;}
.rq-nota{text-align:center;font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--tx-dim);margin:14px 0 0;}
.rq-ok{margin-top:30px;width:100%;text-align:center;padding:34px 24px;border-radius:14px;border:1px solid rgba(216,190,147,.35);background:rgba(216,190,147,.05);display:flex;flex-direction:column;align-items:center;gap:6px;}
.rq-ok-i{width:46px;height:46px;border-radius:50%;border:1px solid var(--g);display:flex;align-items:center;justify-content:center;color:var(--g);margin-bottom:10px;}
.rq-link{margin-top:14px;background:none;border:none;cursor:pointer;font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--g);text-decoration:underline;text-underline-offset:4px;}
`
