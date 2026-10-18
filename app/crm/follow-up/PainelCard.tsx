'use client'

import { useState } from 'react'
import {
  FASES, TELEFONEMA, textoTelefonema, type Email, type Mensagem, type Passo, type Quem, type Stats,
} from '@/lib/jornada'
import { FOLLOW_WA_DIAS, FOLLOW2_WA_DIAS } from '@/lib/crm'
import { Copiar } from './MensagemModal'

const pad = (n: number) => String(n).padStart(2, '0')

export type Ctx = {
  estado: Record<string, string>
  stats: Stats | null
  feita: (id: string, i: number) => boolean
  tdone: (p: Passo) => number
  toggle: (p: Passo, i: number, v: boolean) => void
  setEstado: (id: string, v: '' | 'done' | 'miss') => void
  abrirPasso: (id: string, centrar?: boolean) => void
  verMsg: (m: Mensagem) => void
  verMail: (e: Email) => void
}

export const dadosDe = (p: Passo, stats: Stats | null): string | null =>
  typeof p.dados === 'function' ? (stats ? p.dados(stats) : null) : p.dados ?? null

/* ── botões de mensagens e emails ── */
export function MsgBtn({ m, ver }: { m: Mensagem; ver: (m: Mensagem) => void }) {
  return (
    <button type="button" className="wa" onClick={e => { e.stopPropagation(); ver(m) }}>
      <span className="wic">WA</span>
      <span>{m.titulo}{m.quando && <span className="q">{m.quando}</span>}</span>
      <span className={`tag ${m.tipo}`}>{m.tipo === 'crm' ? 'CRM' : m.tipo}</span>
      <span className="ver">ver</span>
    </button>
  )
}
export function MailBtn({ e, ver }: { e: Email; ver: (e: Email) => void }) {
  return (
    <button type="button" className="mail" onClick={ev => { ev.stopPropagation(); ver(e) }}>
      <span className="env">✉</span><span>{e.assunto}</span><span className="ver">ver</span>
    </button>
  )
}

function Tarefas({ p, ctx, cls = 'todo', item = 'td' }: { p: Passo; ctx: Ctx; cls?: string; item?: string }) {
  return (
    <div className={cls}>
      {p.tarefas.map((t, i) => (
        <label key={i} className={item}>
          <input type="checkbox" checked={ctx.feita(p.id, i)} onChange={e => ctx.toggle(p, i, e.target.checked)} />
          <span>{t}</span>
        </label>
      ))}
    </div>
  )
}

/* ── guião da chamada de 2 minutos ── */
function Guiao() {
  return (
    <div className="guiao">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="ey" style={{ color: '#3DDC97' }}>📞 Guião da chamada · 2 min</span>
        <Copiar texto={textoTelefonema()} />
      </div>
      <i>{TELEFONEMA.intro}</i>
      <ul>{TELEFONEMA.perguntas.map(q => <li key={q}>{q}</li>)}</ul>
      <i>{TELEFONEMA.fecho}</i>
      <div className="dest"><span className="ey" style={{ color: '#E2C27A' }}>Se aceitarem, perguntar já</span><p>{TELEFONEMA.destaque}</p></div>
    </div>
  )
}

/* ── respostas prontas às objeções ── */
function Objecoes({ lista }: { lista: { titulo: string; resposta: string }[] }) {
  const [aberta, setAberta] = useState<number | null>(null)
  return (
    <div>
      {lista.map((o, i) => (
        <div key={o.titulo} className="obj">
          <button type="button" onClick={() => setAberta(aberta === i ? null : i)} aria-expanded={aberta === i}>
            <span>“{o.titulo}”</span><span style={{ color: '#C9A84C' }}>{aberta === i ? '−' : '+'}</span>
          </button>
          {aberta === i && (
            <>
              <pre>{o.resposta}</pre>
              <div style={{ padding: '0 10px 10px', textAlign: 'right' }}><Copiar texto={o.resposta} /></div>
            </>
          )}
        </div>
      ))}
    </div>
  )
}

/* ── simulador dos dias de follow-up (vem da página antiga) ── */
function Simulador({ ver, passos }: { ver: (m: Mensagem) => void; passos: Passo[] }) {
  const [dia, setDia] = useState(0)
  const [env1, setEnv1] = useState<number | null>(null)
  const [env2, setEnv2] = useState<number | null>(null)
  const MAX = 16
  const mover = (d: number) => {
    setDia(d)
    if (env1 !== null && d < env1) { setEnv1(null); setEnv2(null) } else if (env2 !== null && d < env2) setEnv2(null)
  }
  const f1 = Math.max(0, FOLLOW_WA_DIAS - dia)
  const f2 = env1 === null ? null : Math.max(0, FOLLOW2_WA_DIAS - (dia - env1))
  const m1 = passos.find(p => p.id === '3-7')?.mensagens?.[0]
  const m2 = passos.find(p => p.id === '3-8')?.mensagens?.[0]
  const falta = (d: number) => d === 1 ? 'Falta 1 dia' : `Faltam ${d} dias`
  return (
    <div className="sim">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span className="big">{dia}</span><span style={{ color: '#A69676' }}>{dia === 1 ? 'dia' : 'dias'} depois da reunião</span>
        <button type="button" className="copiar" style={{ marginLeft: 'auto' }} onClick={() => { setDia(0); setEnv1(null); setEnv2(null) }}>↺</button>
      </div>
      <input type="range" min={0} max={MAX} value={dia} onChange={e => mover(+e.target.value)} aria-label="Dias depois da reunião" />
      {env1 === null
        ? f1 > 0 ? <span className="crmbtn">🔒 Follow up · {falta(f1)}</span>
          : <button type="button" className="crmbtn on" onClick={() => { setEnv1(dia); if (m1) ver(m1) }}>Follow up</button>
        : <>
          <span className="crmbtn">✓ Follow up · Enviado</span>
          {env2 !== null ? <span className="crmbtn">✓ 2.º Follow up · Enviado</span>
            : f2! > 0 ? <span className="crmbtn">🔒 2.º Follow up · {falta(f2!)}</span>
              : <button type="button" className="crmbtn on" onClick={() => { setEnv2(dia); if (m2) ver(m2) }}>2.º Follow up</button>}
        </>}
      <p className="nota">Arrasta os dias e vê o botão do card da lead a mudar, tal como no CRM.</p>
    </div>
  )
}

const QUEM: [Quem, string, string][] = [['Rui', 'RL', 'Rui'], ['Noivos', 'NV', 'Noivos'], ['Equipa', 'FL', 'Equipa'], ['Automático', 'AU', 'Auto']]

/* ── painel de um passo ── */
export function PainelPasso({ p, ctx }: { p: Passo; ctx: Ctx }) {
  const fi = +p.id.split('-')[0], f = FASES[fi], s = ctx.estado['s:' + p.id] ?? ''
  const dados = dadosDe(p, ctx.stats)
  return (
    <>
      <div className="ey">{pad(fi + 1)} · {f.titulo}</div>
      <h3>{p.titulo}</h3>
      <p className="sub">{p.sub}</p>

      <div className="sec"><span className="ey">Quem faz</span>
        <div className="who">{QUEM.map(([q, ini, lb]) => <span key={q} className={p.quem.includes(q) ? 'on' : ''}><i>{ini}</i>{lb}</span>)}</div>
      </div>

      <div className="sec"><span className="ey">O que fazer · {ctx.tdone(p)}/{p.tarefas.length}</span><Tarefas p={p} ctx={ctx} /></div>

      <div className="sec"><span className="ey">O que é</span><p>{p.descricao}</p></div>

      {(p.dica || p.regras?.length) && (
        <div className="sec"><span className="ey">Dica e regras de tempo</span>
          {p.dica && <p className="dica">“{p.dica}”</p>}
          {!!p.regras?.length && (
            <div className="regras">{p.regras.map((r, i) => <div key={i}><span>{r[0]}</span><b>{r[1]}</b>{r[2] && <em>{r[2]}</em>}</div>)}</div>
          )}
        </div>
      )}

      {p.guiao && <div className="sec"><Guiao /></div>}
      {p.objecoes && <div className="sec"><span className="ey">Quando dizem…</span><Objecoes lista={p.objecoes} /></div>}
      {p.simulador && <div className="sec"><span className="ey">Simulador · e se passarem uns dias</span><Simulador ver={ctx.verMsg} passos={FASES[fi].passos} /></div>}

      {!!p.mensagens?.length && (
        <div className="sec"><span className="ey">Mensagens de WhatsApp</span>
          <div className="lista">{p.mensagens.map((m, i) => <MsgBtn key={i} m={m} ver={ctx.verMsg} />)}</div>
        </div>
      )}
      {!!p.emails?.length && (
        <div className="sec"><span className="ey">Emails ao cliente</span>
          <div className="lista">{p.emails.map((e, i) => <MailBtn key={i} e={e} ver={ctx.verMail} />)}</div>
        </div>
      )}

      <div className="sec"><span className="ey">Na app</span>
        <div className="row"><span>Onde</span><b>{p.onde}</b></div>
        <div className="row"><span>Prazo</span><b>{p.prazo}</b></div>
        {dados && <div className={`row${typeof p.dados === 'function' ? ' vivo' : ''}`}><span>Dados reais</span><b>{dados}</b></div>}
      </div>

      <div className="sec"><span className="ey">Estado</span>
        <div className="st">
          <button type="button" className="chip c0" aria-pressed={s === ''} onClick={() => ctx.setEstado(p.id, '')}>Por fazer</button>
          <button type="button" className="chip c1" aria-pressed={s === 'done'} onClick={() => ctx.setEstado(p.id, 'done')}>Feito</button>
          <button type="button" className="chip c2" aria-pressed={s === 'miss'} onClick={() => ctx.setEstado(p.id, 'miss')}>Em falta</button>
        </div>
      </div>
    </>
  )
}

/* ── painel de uma fase ── */
export function PainelFase({ fi, ctx }: { fi: number; ctx: Ctx }) {
  const f = FASES[fi]
  const tot = f.passos.reduce((a, p) => a + p.tarefas.length, 0), dn = f.passos.reduce((a, p) => a + ctx.tdone(p), 0)
  return (
    <>
      <div className="ey">Fase {pad(fi + 1)} de {pad(FASES.length)}</div>
      <h3>{f.titulo}</h3>
      <p className="sub">{f.sub} · {dn}/{tot} tarefas</p>
      {f.passos.map(p => (
        <div key={p.id} className="sec">
          <button type="button" className="ey lk" onClick={() => ctx.abrirPasso(p.id, true)}>{p.titulo} · {ctx.tdone(p)}/{p.tarefas.length} ›</button>
          <Tarefas p={p} ctx={ctx} />
        </div>
      ))}
    </>
  )
}

/* ── todos os emails ao cliente ── */
export function PainelEmails({ ctx }: { ctx: Ctx }) {
  return (
    <>
      <div className="ey">Emails automáticos</div>
      <h3>Emails ao cliente</h3>
      <p className="sub">Tickets enviados aos noivos por email, por fase</p>
      {FASES.map((f, i) => {
        const ps = f.passos.filter(p => p.emails?.length)
        if (!ps.length) return null
        return (
          <div key={i} className="sec"><span className="ey">{pad(i + 1)} · {f.titulo}</span>
            {ps.map(p => (
              <div key={p.id}>
                <button type="button" className="lk" onClick={() => ctx.abrirPasso(p.id, true)}>{p.titulo} ›</button>
                <div className="lista" style={{ marginBottom: 8 }}>{p.emails!.map((e, k) => <MailBtn key={k} e={e} ver={ctx.verMail} />)}</div>
              </div>
            ))}
          </div>
        )
      })}
    </>
  )
}

/* ── todas as regras e prazos (consulta rápida da página antiga) ── */
export function PainelPrazos({ ctx }: { ctx: Ctx }) {
  return (
    <>
      <div className="ey">Consulta rápida</div>
      <h3>Todas as regras e prazos</h3>
      <p className="sub">Toca num passo para o abrir no mapa</p>
      {FASES.map((f, i) => {
        const ps = f.passos.filter(p => p.regras?.length)
        if (!ps.length) return null
        return (
          <div key={i} className="sec"><span className="ey">{pad(i + 1)} · {f.titulo}</span>
            {ps.map(p => (
              <div key={p.id} style={{ marginBottom: 8 }}>
                <button type="button" className="lk" onClick={() => ctx.abrirPasso(p.id, true)}>{p.titulo} ›</button>
                <div className="regras">{p.regras!.map((r, k) => <div key={k}><span>{r[0]}</span><b>{r[1]}</b>{r[2] && <em>{r[2]}</em>}</div>)}</div>
              </div>
            ))}
          </div>
        )
      })}
      <p className="nota">As mensagens com a etiqueta CRM saem já personalizadas pelo botão do card e ficam no histórico da lead. Nas de copiar, substitui [nome], [data] e [hora] antes de enviar.</p>
    </>
  )
}

/* ── conteúdo aberto pelo + debaixo do card ── */
export function PopPasso({ p, ctx }: { p: Passo; ctx: Ctx }) {
  const dados = dadosDe(p, ctx.stats)
  return (
    <>
      <p>{p.descricao}</p>
      <div className="pm">
        <span>Quem</span><b>{p.quem.join(' + ')}</b>
        <span>Prazo</span><b>{p.prazo}</b>
        <span>Onde</span><b>{p.onde}</b>
        {dados && <><span>Dados</span><b>{dados}</b></>}
      </div>
      {p.dica && <p className="pdica">“{p.dica}”</p>}
      {!!p.mensagens?.length && <div className="pmail">{p.mensagens.map((m, i) => <MsgBtn key={i} m={m} ver={ctx.verMsg} />)}</div>}
      {!!p.emails?.length && <div className="pmail">{p.emails.map((e, i) => <MailBtn key={i} e={e} ver={ctx.verMail} />)}</div>}
      <Tarefas p={p} ctx={ctx} cls="ptl" item="" />
    </>
  )
}
export function PopFase({ fi, ctx }: { fi: number; ctx: Ctx }) {
  const f = FASES[fi]
  return (
    <>
      <p>{f.sub}</p>
      <ol>{f.passos.map(p => <li key={p.id}><b>{p.titulo}</b> <span>{ctx.tdone(p)}/{p.tarefas.length}</span></li>)}</ol>
    </>
  )
}
