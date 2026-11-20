'use client'

import { useMemo, useState } from 'react'

const GOLD = '#B1937E'
const GOLD_DK = '#9A7B66'
const CREAM = '#F8F6F3'
const CREAM2 = '#FBF8F4'
const BG2 = '#EFE7DE'
const RULE = '#E3D9CC'
const MUTE = '#8A7E72'
const INK = '#33302B'
const ALERT = '#B4533C'

type Linha = { nome: string; valor: number }
type Estado = {
  lucroMensal: number
  meses: number
  impostos: number
  fixos: Linha[]
  variaveis: Linha[]
  preco: number
  capacidade: number
  horas: number
  taxaReuniao: number
  taxaFecho: number
}

const EXEMPLOS: { nome: string; desc: string; e: Estado }[] = [
  {
    nome: 'Fotógrafo a solo',
    desc: 'Só fotografia, edita sozinho, pouca estrutura.',
    e: {
      lucroMensal: 2000, meses: 12, impostos: 25,
      fixos: [
        { nome: 'Equipamento (renovação por ano)', valor: 3000 },
        { nome: 'Software, site e galerias', valor: 1200 },
        { nome: 'Marketing e anúncios', valor: 2500 },
        { nome: 'Contabilista e seguros', valor: 1800 },
        { nome: 'Viatura, escritório, outros', valor: 1500 },
      ],
      variaveis: [
        { nome: '2º fotógrafo / assistente', valor: 150 },
        { nome: 'Edição externa', valor: 0 },
        { nome: 'Álbum e produto', valor: 200 },
        { nome: 'Deslocação e refeições', valor: 80 },
      ],
      preco: 2200, capacidade: 26, horas: 30, taxaReuniao: 40, taxaFecho: 30,
    },
  },
  {
    nome: 'Equipa foto + vídeo',
    desc: 'Foto e vídeo com freelancers e editor externo.',
    e: {
      lucroMensal: 3000, meses: 12, impostos: 30,
      fixos: [
        { nome: 'Equipamento (renovação por ano)', valor: 6000 },
        { nome: 'Software, site e galerias', valor: 2000 },
        { nome: 'Marketing e anúncios', valor: 5000 },
        { nome: 'Contabilista e seguros', valor: 2500 },
        { nome: 'Viatura, escritório, outros', valor: 4500 },
      ],
      variaveis: [
        { nome: 'Equipa no dia (freelancers)', valor: 450 },
        { nome: 'Edição externa', valor: 400 },
        { nome: 'Álbum e produto', valor: 300 },
        { nome: 'Deslocação e refeições', valor: 100 },
      ],
      preco: 4000, capacidade: 26, horas: 40, taxaReuniao: 40, taxaFecho: 25,
    },
  },
  {
    nome: 'Estúdio premium',
    desc: 'Poucos casais, ticket alto, equipa e produto de topo.',
    e: {
      lucroMensal: 5000, meses: 12, impostos: 35,
      fixos: [
        { nome: 'Equipamento (renovação por ano)', valor: 9000 },
        { nome: 'Software, site e galerias', valor: 3000 },
        { nome: 'Marketing e anúncios', valor: 9000 },
        { nome: 'Contabilista e seguros', valor: 3500 },
        { nome: 'Viatura, escritório, outros', valor: 8000 },
      ],
      variaveis: [
        { nome: 'Equipa no dia (freelancers)', valor: 800 },
        { nome: 'Edição externa', valor: 700 },
        { nome: 'Álbum e produto', valor: 600 },
        { nome: 'Deslocação e refeições', valor: 200 },
      ],
      preco: 8500, capacidade: 22, horas: 50, taxaReuniao: 35, taxaFecho: 25,
    },
  },
]

const milhar = (v: number) => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
const eur = (v: number) => (isFinite(v) ? milhar(v) + ' €' : '—')
const num = (v: number) => (isFinite(v) ? milhar(v) : '—')
const soma = (l: Linha[]) => l.reduce((a, b) => a + (b.valor || 0), 0)
const clone = (e: Estado): Estado => JSON.parse(JSON.stringify(e))

function calc(e: Estado, preco = e.preco) {
  const lucroLiquido = e.lucroMensal * e.meses
  const lucroBruto = lucroLiquido / (1 - e.impostos / 100)
  const fixos = soma(e.fixos)
  const porCasamento = soma(e.variaveis)
  const aCobrir = lucroBruto + fixos
  const margem = preco - porCasamento
  const casamentos = margem > 0 ? Math.ceil(aCobrir / margem - 1e-9) : Infinity
  const faturacao = casamentos * preco
  const precoMinCapacidade = e.capacidade > 0 ? aCobrir / e.capacidade + porCasamento : Infinity
  const reunioes = casamentos / (e.taxaFecho / 100)
  const leads = reunioes / (e.taxaReuniao / 100)
  return { lucroLiquido, lucroBruto, fixos, porCasamento, aCobrir, margem, casamentos, faturacao, precoMinCapacidade, reunioes, leads, horasAno: casamentos * e.horas }
}

function Campo({ label, valor, onChange, sufixo, passo = 50, min = 0, max }: { label: string; valor: number; onChange: (v: number) => void; sufixo?: string; passo?: number; min?: number; max?: number }) {
  return (
    <label className="cl-campo">
      <span>{label}</span>
      <span className="cl-input">
        <input type="number" inputMode="numeric" value={Number.isFinite(valor) ? valor : 0} step={passo} min={min} max={max}
          onChange={ev => onChange(ev.target.value === '' ? 0 : Number(ev.target.value))} />
        {sufixo && <em>{sufixo}</em>}
      </span>
    </label>
  )
}

export default function CalculadoraLucro() {
  const [e, setE] = useState<Estado>(clone(EXEMPLOS[1].e))
  const [exemplo, setExemplo] = useState(1)
  const r = useMemo(() => calc(e), [e])
  const set = (p: Partial<Estado>) => { setE(v => ({ ...v, ...p })); setExemplo(-1) }
  const setLinha = (k: 'fixos' | 'variaveis', i: number, valor: number) =>
    set({ [k]: e[k].map((l, j) => (j === i ? { ...l, valor } : l)) } as Partial<Estado>)

  const precos = useMemo(() => {
    const base = [2000, 2500, 3000, 3500, 4000, 5000, 6000, 7000, 8000]
    return Array.from(new Set([...base, e.preco])).sort((a, b) => a - b)
  }, [e.preco])

  const acima = r.casamentos > e.capacidade
  const precoMin = Math.ceil(r.precoMinCapacidade / 50) * 50

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=Poppins:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; background: ${CREAM} !important; color: ${INK} !important; font-family: 'Poppins', -apple-system, sans-serif; line-height: 1.5; }
        h1, h2, h3, p, div, span, label, td, th { color: ${INK}; }
        .cl-wrap { max-width: 1180px; margin: 0 auto; padding: 0 20px 70px; }
        .cl-head { text-align: center; padding: 40px 0 10px; }
        .cl-back { display: inline-block; font-size: 12px; letter-spacing: 1px; color: ${GOLD_DK} !important; text-decoration: none; margin-bottom: 14px; }
        .cl-kicker { font-size: 12px; letter-spacing: 5px; color: ${GOLD} !important; font-weight: 600; }
        .cl-head h1 { font-family: 'Playfair Display', Georgia, serif; font-size: clamp(28px,4.6vw,42px); margin: 6px 0 8px; }
        .cl-intro { color: ${MUTE} !important; max-width: 680px; margin: 0 auto; font-size: 15px; }
        .cl-ex { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin: 22px 0 6px; }
        .cl-ex button { font-family: 'Poppins'; background: #fff; border: 1px solid ${RULE}; border-radius: 12px; padding: 10px 16px; cursor: pointer; text-align: left; min-width: 200px; transition: .15s; }
        .cl-ex button b { display: block; font-size: 14px; color: ${INK}; }
        .cl-ex button small { color: ${MUTE}; font-size: 11.5px; }
        .cl-ex button.on { border-color: ${GOLD}; background: ${BG2}; }
        .cl-chain { display: flex; align-items: stretch; gap: 6px; margin: 26px 0 8px; flex-wrap: wrap; }
        .cl-step { flex: 1 1 150px; background: #fff; border: 1px solid ${RULE}; border-radius: 12px; padding: 12px 14px; }
        .cl-step small { display: block; font-size: 10.5px; letter-spacing: 1.5px; text-transform: uppercase; color: ${GOLD_DK} !important; font-weight: 600; }
        .cl-step strong { font-family: 'Playfair Display', Georgia, serif; font-size: 22px; display: block; margin-top: 2px; }
        .cl-step span { font-size: 11.5px; color: ${MUTE} !important; }
        .cl-step.final { background: ${BG2}; border-color: ${GOLD}; }
        .cl-op { align-self: center; color: ${GOLD} !important; font-size: 20px; font-weight: 600; }
        .cl-grid { display: grid; grid-template-columns: 380px 1fr; gap: 22px; margin-top: 18px; align-items: start; }
        .cl-panel { background: #fff; border: 1px solid ${RULE}; border-radius: 14px; padding: 18px 18px 8px; margin-bottom: 16px; }
        .cl-panel h2 { font-family: 'Playfair Display', Georgia, serif; font-size: 18px; margin: 0 0 2px; }
        .cl-panel .cl-sub { font-size: 12px; color: ${MUTE} !important; margin: 0 0 10px; }
        .cl-panel .cl-tot { display: flex; justify-content: space-between; border-top: 1px solid ${RULE}; padding: 10px 0; font-size: 13px; font-weight: 600; }
        .cl-panel .cl-tot b { color: ${GOLD_DK} !important; }
        .cl-campo { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 6px 0; font-size: 13px; }
        .cl-campo > span:first-child { color: ${INK}; }
        .cl-input { display: flex; align-items: center; gap: 4px; }
        .cl-input input { width: 96px; font-family: 'Poppins'; font-size: 14px; text-align: right; padding: 6px 8px; border: 1px solid ${RULE}; border-radius: 8px; background: ${CREAM2}; color: ${INK}; }
        .cl-input input:focus { outline: none; border-color: ${GOLD}; }
        .cl-input em { font-style: normal; font-size: 12px; color: ${MUTE}; width: 34px; }
        .cl-big { background: ${INK}; border-radius: 16px; padding: 26px 26px 22px; }
        .cl-big * { color: #F3ECE3 !important; }
        .cl-big .cl-k { font-size: 11px; letter-spacing: 3px; color: ${GOLD} !important; font-weight: 600; }
        .cl-big h3 { font-family: 'Playfair Display', Georgia, serif; font-size: clamp(26px,3.6vw,38px); margin: 6px 0 4px; line-height: 1.15; }
        .cl-big h3 b { color: #E4CDB5 !important; }
        .cl-slider { margin: 18px 0 6px; }
        .cl-slider input { width: 100%; accent-color: ${GOLD}; }
        .cl-slider-l { display: flex; justify-content: space-between; font-size: 12px; opacity: .7; }
        .cl-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 16px; }
        .cl-kpi { background: rgba(255,255,255,.06); border-radius: 10px; padding: 10px 12px; }
        .cl-kpi small { display: block; font-size: 10.5px; letter-spacing: 1px; opacity: .7; text-transform: uppercase; }
        .cl-kpi strong { font-size: 18px; font-family: 'Playfair Display', Georgia, serif; }
        .cl-alert { margin-top: 14px; border-radius: 10px; padding: 11px 14px; font-size: 13.5px; background: rgba(180,83,60,.18); border: 1px solid rgba(228,140,115,.5); }
        .cl-ok { margin-top: 14px; border-radius: 10px; padding: 11px 14px; font-size: 13.5px; background: rgba(177,147,126,.16); border: 1px solid rgba(177,147,126,.45); }
        .cl-table { width: 100%; border-collapse: collapse; margin-top: 18px; background: #fff; border: 1px solid ${RULE}; border-radius: 14px; overflow: hidden; font-size: 13.5px; }
        .cl-table th { background: ${BG2}; font-weight: 600; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; color: ${GOLD_DK}; padding: 10px 12px; text-align: right; }
        .cl-table th:first-child, .cl-table td:first-child { text-align: left; }
        .cl-table td { padding: 9px 12px; border-top: 1px solid ${RULE}; text-align: right; }
        .cl-table tr.on td { background: ${CREAM2}; font-weight: 600; }
        .cl-table tr { cursor: pointer; }
        .cl-table td.over { color: ${ALERT}; }
        .cl-note { font-size: 12px; color: ${MUTE} !important; margin-top: 10px; }
        @media (max-width: 900px) {
          .cl-grid { grid-template-columns: 1fr; }
          .cl-kpis { grid-template-columns: repeat(2, 1fr); }
          .cl-op { display: none; }
          .cl-table .hide-sm { display: none; }
        }
      `}</style>

      <div className="cl-wrap">
        <header className="cl-head">
          <a className="cl-back" href="/wedding-mentor">‹ Centro de recursos</a>
          <div className="cl-kicker">SESSÃO 1 · FERRAMENTA</div>
          <h1>Calculadora do Lucro</h1>
          <p className="cl-intro">Começa pelo que queres levar para casa. A conta diz-te exatamente quantos casamentos precisas e a que preço.</p>
          <div className="cl-ex">
            {EXEMPLOS.map((x, i) => (
              <button key={x.nome} className={exemplo === i ? 'on' : ''} onClick={() => { setE(clone(x.e)); setExemplo(i) }}>
                <b>{x.nome}</b><small>{x.desc}</small>
              </button>
            ))}
          </div>
        </header>

        <div className="cl-chain">
          <div className="cl-step"><small>1 · Lucro no bolso</small><strong>{eur(r.lucroLiquido)}</strong><span>{eur(e.lucroMensal)} × {e.meses} meses</span></div>
          <div className="cl-op">+</div>
          <div className="cl-step"><small>2 · Impostos e SS</small><strong>{eur(r.lucroBruto - r.lucroLiquido)}</strong><span>taxa efetiva {e.impostos}%</span></div>
          <div className="cl-op">+</div>
          <div className="cl-step"><small>3 · Custos fixos</small><strong>{eur(r.fixos)}</strong><span>por ano</span></div>
          <div className="cl-op">÷</div>
          <div className="cl-step"><small>4 · Margem por casamento</small><strong>{eur(r.margem)}</strong><span>{eur(e.preco)} − {eur(r.porCasamento)} de custos</span></div>
          <div className="cl-op">=</div>
          <div className="cl-step final"><small>5 · Casamentos</small><strong>{num(r.casamentos)}</strong><span>por ano</span></div>
        </div>

        <div className="cl-grid">
          <div>
            <div className="cl-panel">
              <h2>O que queres ganhar</h2>
              <p className="cl-sub">Líquido, já depois de impostos. Pensa no salário que queres pagar a ti próprio.</p>
              <Campo label="Lucro por mês" valor={e.lucroMensal} sufixo="€" passo={100} onChange={v => set({ lucroMensal: v })} />
              <Campo label="Meses" valor={e.meses} sufixo="" passo={1} min={1} max={14} onChange={v => set({ meses: v })} />
              <Campo label="Impostos e Segurança Social" valor={e.impostos} sufixo="%" passo={1} min={0} max={70} onChange={v => set({ impostos: Math.min(70, v) })} />
              <div className="cl-tot"><span>Precisas de gerar antes de impostos</span><b>{eur(r.lucroBruto)}</b></div>
            </div>
            <div className="cl-panel">
              <h2>O teu preço</h2>
              <p className="cl-sub">Por casamento, sem IVA. Também o podes mudar na barra do resultado.</p>
              <Campo label="Preço por casamento" valor={e.preco} sufixo="€" passo={100} onChange={v => set({ preco: v })} />
              <div className="cl-tot"><span>Com IVA (23%)</span><b>{eur(e.preco * 1.23)}</b></div>
            </div>
            <div className="cl-panel">
              <h2>Custos fixos por ano</h2>
              <p className="cl-sub">Pagas mesmo que não faças nenhum casamento.</p>
              {e.fixos.map((l, i) => <Campo key={l.nome} label={l.nome} valor={l.valor} sufixo="€" passo={100} onChange={v => setLinha('fixos', i, v)} />)}
              <div className="cl-tot"><span>Total fixo</span><b>{eur(r.fixos)}</b></div>
            </div>
            <div className="cl-panel">
              <h2>Custo de cada casamento</h2>
              <p className="cl-sub">Só existe quando fazes o casamento.</p>
              {e.variaveis.map((l, i) => <Campo key={l.nome} label={l.nome} valor={l.valor} sufixo="€" passo={50} onChange={v => setLinha('variaveis', i, v)} />)}
              <div className="cl-tot"><span>Por casamento</span><b>{eur(r.porCasamento)}</b></div>
            </div>
            <div className="cl-panel">
              <h2>Capacidade e funil</h2>
              <p className="cl-sub">O teto real e as leads que a meta exige.</p>
              <Campo label="Casamentos que consegues fazer" valor={e.capacidade} sufixo="/ano" passo={1} onChange={v => set({ capacidade: v })} />
              <Campo label="Horas por casamento" valor={e.horas} sufixo="h" passo={1} onChange={v => set({ horas: v })} />
              <Campo label="Leads que marcam reunião" valor={e.taxaReuniao} sufixo="%" passo={5} min={1} max={100} onChange={v => set({ taxaReuniao: Math.max(1, v) })} />
              <Campo label="Reuniões que fecham" valor={e.taxaFecho} sufixo="%" passo={5} min={1} max={100} onChange={v => set({ taxaFecho: Math.max(1, v) })} />
              <div style={{ height: 8 }} />
            </div>
          </div>

          <div>
            <div className="cl-big">
              <div className="cl-k">O TEU RESULTADO</div>
              <h3>
                {isFinite(r.casamentos)
                  ? <>Precisas de <b>{r.casamentos} casamentos</b> por ano a <b>{eur(e.preco)}</b></>
                  : <>A este preço não há margem: o custo de cada casamento é maior do que o preço.</>}
              </h3>
              <div style={{ fontSize: 13, opacity: 0.75 }}>Preço sem IVA. Com IVA (23%): {eur(e.preco * 1.23)}</div>
              <div className="cl-slider">
                <input type="range" min={1000} max={12000} step={100} value={e.preco} onChange={ev => set({ preco: Number(ev.target.value) })} aria-label="Preço por casamento" />
                <div className="cl-slider-l"><span>1.000 €</span><span>Arrasta para mudar o preço</span><span>12.000 €</span></div>
              </div>
              <div className="cl-kpis">
                <div className="cl-kpi"><small>Faturação</small><strong>{eur(r.faturacao)}</strong></div>
                <div className="cl-kpi"><small>Horas por ano</small><strong>{num(r.horasAno)} h</strong></div>
                <div className="cl-kpi"><small>Reuniões</small><strong>{num(r.reunioes)}</strong></div>
                <div className="cl-kpi"><small>Leads</small><strong>{num(r.leads)}</strong></div>
              </div>
              {isFinite(r.casamentos) && (acima
                ? <div className="cl-alert">São mais {r.casamentos - e.capacidade} casamentos do que a tua capacidade ({e.capacidade}). Para chegar lá com {e.capacidade} casamentos, o preço mínimo é <b>{eur(precoMin)}</b>.</div>
                : <div className="cl-ok">{r.casamentos === e.capacidade ? 'Cabe à justa: a agenda fica cheia.' : `Cabe na tua capacidade: ficam ${e.capacidade - r.casamentos} datas livres.`} Isso são cerca de {num(r.leads / 52)} leads por semana para manter a agenda.</div>)}
            </div>

            <table className="cl-table">
              <thead>
                <tr><th>Preço</th><th>Casamentos</th><th className="hide-sm">Faturação</th><th className="hide-sm">Horas</th><th>Leads</th></tr>
              </thead>
              <tbody>
                {precos.map(pv => {
                  const x = calc(e, pv)
                  const over = x.casamentos > e.capacidade
                  return (
                    <tr key={pv} className={pv === e.preco ? 'on' : ''} onClick={() => set({ preco: pv })}>
                      <td>{eur(pv)}</td>
                      <td className={over ? 'over' : ''}>{isFinite(x.casamentos) ? x.casamentos : 'sem margem'}{over && isFinite(x.casamentos) ? <span className="hide-sm"> · acima da capacidade</span> : ''}</td>
                      <td className="hide-sm">{eur(x.faturacao)}</td>
                      <td className="hide-sm">{num(x.horasAno)} h</td>
                      <td>{num(x.leads)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <p className="cl-note">O mesmo lucro, preços diferentes. Toca numa linha para a usar. Os exemplos são ilustrativos: confirma a tua taxa de impostos com o teu contabilista.</p>
          </div>
        </div>
      </div>
    </>
  )
}
