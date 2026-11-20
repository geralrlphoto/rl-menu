'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { EXEMPLOS, calc, clone, eur, num, type Estado } from '../_lib/lucro'

/* Aula interativa da Sessão 1. O mentor vai passando de secção em secção
   e preenche com o mentorando, ao vivo, o esquema todo. No fim sai o
   Documento de Posicionamento, pronto a imprimir. */

const GOLD = '#B1937E'
const GOLD_DK = '#9A7B66'
const CREAM = '#F8F6F3'
const CREAM2 = '#FBF8F4'
const BG2 = '#EFE7DE'
const RULE = '#E3D9CC'
const MUTE = '#8A7E72'
const INK = '#33302B'
const ALERT = '#B4533C'
const OK = '#5E7F5B'
const CHAVE = 'wm-aula-s1'

type Dados = {
  nome: string
  e: Estado
  sabadosLivres: number
  hoje: { casamentos: number; ticket: number; custos: number; lucro: number }
  degrau: number
  clientes: string[]
  padrao: string
  quem: string; valorizam: string; receiam: string; procuram: string
  fCasal: string; fTransf: string; fDif: string; publica: string
  testes: boolean[]
}

const NOVO = (): Dados => ({
  nome: '',
  e: { ...clone(EXEMPLOS[1].e), capacidade: 20 },
  sabadosLivres: 6,
  hoje: { casamentos: 0, ticket: 0, custos: 0, lucro: 0 },
  degrau: 20,
  clientes: ['', '', ''],
  padrao: '',
  quem: '', valorizam: '', receiam: '', procuram: '',
  fCasal: '', fTransf: '', fDif: '', publica: '',
  testes: [false, false, false],
})

/* ---------- pequenos componentes ---------- */

function Num({ label, valor, onChange, suf = '€', passo = 50, dica }: { label: string; valor: number; onChange: (v: number) => void; suf?: string; passo?: number; dica?: string }) {
  return (
    <label className="a-num">
      <span>{label}{dica && <small>{dica}</small>}</span>
      <span className="a-num-in">
        <input type="number" inputMode="decimal" step={passo} value={Number.isFinite(valor) && valor !== 0 ? valor : ''} placeholder="0"
          onChange={ev => onChange(ev.target.value === '' ? 0 : Number(ev.target.value))} />
        <em>{suf}</em>
      </span>
    </label>
  )
}

function Txt({ label, valor, onChange, ph, linhas = 2 }: { label: string; valor: string; onChange: (v: string) => void; ph?: string; linhas?: number }) {
  return (
    <label className="a-txt">
      <span>{label}</span>
      <textarea rows={linhas} value={valor} placeholder={ph} onChange={ev => onChange(ev.target.value)} />
    </label>
  )
}

function Cab({ k, t, s }: { k: string; t: string; s?: string }) {
  return (
    <header className="a-cab">
      <div className="a-k">{k}</div>
      <h2>{t}</h2>
      {s && <p>{s}</p>}
    </header>
  )
}

/* ---------- página ---------- */

export default function AulaSessao1() {
  const [d, setD] = useState<Dados>(NOVO)
  const [i, setI] = useState(0)
  const [rev, setRev] = useState(0) // passos revelados dentro da secção atual
  const [menu, setMenu] = useState(false)
  const [virados, setVirados] = useState<boolean[]>([false, false, false])
  const [abertos, setAbertos] = useState<boolean[]>([false, false, false, false])
  const carregado = useRef(false)

  // guarda o trabalho da aula neste aparelho (para não se perder com um refresh)
  useEffect(() => {
    try { const g = localStorage.getItem(CHAVE); if (g) setD({ ...NOVO(), ...JSON.parse(g) }) } catch {}
    carregado.current = true
  }, [])
  useEffect(() => {
    if (!carregado.current) return
    try { localStorage.setItem(CHAVE, JSON.stringify(d)) } catch {}
  }, [d])

  const up = (p: Partial<Dados>) => setD(v => ({ ...v, ...p }))
  const upE = (p: Partial<Estado>) => setD(v => ({ ...v, e: { ...v.e, ...p } }))
  const upLinha = (k: 'fixos' | 'variaveis', j: number, valor: number) =>
    setD(v => ({ ...v, e: { ...v.e, [k]: v.e[k].map((l, n) => (n === j ? { ...l, valor } : l)) } }))

  const r = useMemo(() => calc(d.e), [d.e])
  const e = d.e
  const precoAtual = d.hoje.ticket || 0
  const precoDegrau = precoAtual ? Math.round(precoAtual * (1 + d.degrau / 100) / 50) * 50 : 0
  const rDegrau = useMemo(() => (precoDegrau ? calc(d.e, precoDegrau) : null), [d.e, precoDegrau])
  const lucroHoje = d.hoje.lucro
  const porCasamentoHoje = d.hoje.casamentos ? lucroHoje / d.hoje.casamentos : 0
  const sabadosOcupados = Math.min(26, r.casamentos)
  const precoMin = Math.ceil(r.precoMinCapacidade / 50) * 50
  const frase = `Ajudo ${d.fCasal || '[casal ideal]'} a ${d.fTransf || '[transformação]'} através de ${d.fDif || '[o teu diferencial]'}.`
  const passaTeste = d.testes.every(Boolean)

  /* ---------- secções ---------- */
  const SECOES: { id: string; titulo: string; passos?: number; parte?: string; render: () => ReactNode }[] = [
    {
      id: 'capa', titulo: 'Início',
      render: () => (
        <div className="a-capa">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="a-logo" src="/logo mentor.webp" alt="RL Wedding Mentor" />
          <div className="a-k">SESSÃO 01 · AULA INTERATIVA</div>
          <h1>Posicionamento e a Matemática do Lucro</h1>
          <p className="a-lead">Hoje desenhamos juntos a conta do teu negócio: o lucro que queres, quantos casamentos precisas, a que preço, e para quem trabalhas.</p>
          <label className="a-nome">
            <span>Mentorando</span>
            <input value={d.nome} placeholder="Nome de quem está na aula" onChange={ev => up({ nome: ev.target.value })} />
          </label>
          <p className="a-hint">Usa as setas ← → (ou os botões em baixo) para avançar.</p>
        </div>
      ),
    },
    {
      id: 'vida', titulo: 'A vida que queres', parte: 'A · O lucro',
      render: () => (
        <>
          <Cab k="Antes dos números" t="Que vida queres ter daqui a 3 anos?" s="Os números servem a vida, não o contrário. Responde a estas três perguntas primeiro." />
          <div className="a-grid3">
            <div className="a-card">
              <h3>Quanto queres levar para casa?</h3>
              <p>Por mês, já depois de impostos. Como um salário.</p>
              <Num label="Por mês" valor={e.lucroMensal} passo={100} onChange={v => upE({ lucroMensal: v })} />
              <Num label="Meses" valor={e.meses} suf="" passo={1} onChange={v => upE({ meses: v })} />
              <div className="a-big">{eur(r.lucroLiquido)}<small>por ano, no bolso</small></div>
            </div>
            <div className="a-card">
              <h3>Quantos casamentos, no máximo?</h3>
              <p>O teto que aceitas fazer por ano, sem te queimares.</p>
              <Num label="Casamentos por ano" valor={e.capacidade} suf="" passo={1} onChange={v => upE({ capacidade: v })} />
              <Num label="Sábados livres na época alta" valor={d.sabadosLivres} suf="" passo={1} dica="de ~26 (maio a outubro)" onChange={v => up({ sabadosLivres: v })} />
              <div className="a-big">{Math.max(0, 26 - d.sabadosLivres)}<small>sábados de época alta a trabalhar</small></div>
            </div>
            <div className="a-card">
              <h3>Quanto tempo dá cada casamento?</h3>
              <p>Reuniões, dia, edição, gestão. Sê honesto.</p>
              <Num label="Horas por casamento" valor={e.horas} suf="h" passo={1} onChange={v => upE({ horas: v })} />
              <div className="a-big">{num(e.capacidade * e.horas)} h<small>por ano, no teu teto de {e.capacidade} casamentos</small></div>
            </div>
          </div>
        </>
      ),
    },
    {
      id: 'hoje', titulo: 'Onde estás hoje', parte: 'A · O lucro',
      render: () => (
        <>
          <Cab k="O ponto de partida" t="Onde estás hoje?" s="Os números reais dos últimos 12 meses. Aproximados servem." />
          <div className="a-grid4">
            <div className="a-card"><Num label="Casamentos" valor={d.hoje.casamentos} suf="" passo={1} onChange={v => up({ hoje: { ...d.hoje, casamentos: v } })} /></div>
            <div className="a-card"><Num label="Ticket médio (sem IVA)" valor={d.hoje.ticket} passo={100} onChange={v => up({ hoje: { ...d.hoje, ticket: v } })} /></div>
            <div className="a-card"><Num label="Custos do ano" valor={d.hoje.custos} passo={500} onChange={v => up({ hoje: { ...d.hoje, custos: v } })} /></div>
            <div className="a-card"><Num label="Lucro no bolso" valor={d.hoje.lucro} passo={500} onChange={v => up({ hoje: { ...d.hoje, lucro: v } })} /></div>
          </div>
          <div className="a-res">
            <div><small>Faturação</small><b>{eur(d.hoje.casamentos * d.hoje.ticket)}</b></div>
            <div><small>Lucro por mês</small><b>{eur(lucroHoje / 12)}</b></div>
            <div><small>Ficou por casamento</small><b>{eur(porCasamentoHoje)}</b></div>
            <div><small>Distância ao que queres</small><b>{eur(r.lucroLiquido - lucroHoje)}</b></div>
          </div>
          <p className="a-nota">Se o lucro for difícil de saber: faturação menos custos menos impostos. Quase ninguém sabe quanto lhe fica por casamento, e é por isso que começamos aqui.</p>
        </>
      ),
    },
    {
      id: 'conta', titulo: 'A conta começa no fim', parte: 'A · O lucro', passos: 5,
      render: () => {
        const st = [
          ['01', 'Lucro que queres', eur(r.lucroLiquido), `${eur(e.lucroMensal)} × ${e.meses}`],
          ['02', '+ Impostos e SS', eur(r.lucroBruto - r.lucroLiquido), `taxa efetiva ${e.impostos}%`],
          ['03', '+ Custos fixos', eur(r.fixos), 'por ano'],
          ['04', '÷ Margem', eur(r.margem), `${eur(e.preco)} − ${eur(r.porCasamento)}`],
          ['05', '= Casamentos', num(r.casamentos), `a ${eur(e.preco)}`],
        ]
        return (
          <>
            <Cab k="A conta ao contrário" t="A conta começa no fim" s="Clica em avançar para construir a conta passo a passo, com os números de quem está na aula." />
            <div className="a-cadeia">
              {st.map(([n, t, v, s], k) => (
                <div key={n} className={`a-elo ${k < rev ? 'on' : ''} ${k === 4 ? 'fim' : ''}`}>
                  <small>{n}</small><h3>{t}</h3><b>{k < rev ? v : '?'}</b><span>{k < rev ? s : ''}</span>
                </div>
              ))}
            </div>
            <div className={`a-formula ${rev >= 5 ? 'on' : ''}`}>
              Casamentos = (lucro antes de impostos + custos fixos) ÷ (preço − custo por casamento)
            </div>
            <p className="a-nota">Os números de cada passo afinam-se nas secções seguintes. Aqui é só para veres a lógica toda.</p>
          </>
        )
      },
    },
    {
      id: 'custos', titulo: 'Impostos e custos', parte: 'A · O lucro',
      render: () => (
        <>
          <Cab k="Passos 2, 3 e 4" t="O que sai antes do teu lucro" s="Troca os valores de exemplo pelos reais. O resultado atualiza logo." />
          <div className="a-grid3">
            <div className="a-card">
              <h3>Impostos e SS</h3>
              <p>Taxa efetiva sobre o lucro. Confirma com o contabilista.</p>
              <Num label="Taxa efetiva" valor={e.impostos} suf="%" passo={1} onChange={v => upE({ impostos: Math.min(70, v) })} />
              <div className="a-big">{eur(r.lucroBruto)}<small>a gerar antes de impostos</small></div>
            </div>
            <div className="a-card">
              <h3>Custos fixos por ano</h3>
              <p>Pagas mesmo sem casamentos.</p>
              {e.fixos.map((l, k) => <Num key={l.nome} label={l.nome} valor={l.valor} passo={100} onChange={v => upLinha('fixos', k, v)} />)}
              <div className="a-tot"><span>Total</span><b>{eur(r.fixos)}</b></div>
            </div>
            <div className="a-card">
              <h3>Custo de cada casamento</h3>
              <p>Só existe quando fazes o casamento.</p>
              {e.variaveis.map((l, k) => <Num key={l.nome} label={l.nome} valor={l.valor} passo={50} onChange={v => upLinha('variaveis', k, v)} />)}
              <div className="a-tot"><span>Por casamento</span><b>{eur(r.porCasamento)}</b></div>
            </div>
          </div>
        </>
      ),
    },
    {
      id: 'resultado', titulo: 'O resultado', parte: 'A · O lucro',
      render: () => (
        <>
          <Cab k="Passo 5" t="Quantos casamentos e a que preço?" s="Arrasta o preço. Repara no que acontece à agenda." />
          <div className="a-hero">
            <div className="a-hero-l">
              <div className="a-k">A ESTE PREÇO</div>
              <h3>{isFinite(r.casamentos) ? <>Precisas de <b>{r.casamentos} casamentos</b> a <b>{eur(e.preco)}</b></> : <>Sem margem: o custo de cada casamento é maior do que o preço.</>}</h3>
              <input type="range" min={1000} max={12000} step={100} value={e.preco} onChange={ev => upE({ preco: Number(ev.target.value) })} aria-label="Preço por casamento" />
              <div className="a-range-l"><span>1.000 €</span><span>{eur(e.preco)} sem IVA · {eur(e.preco * 1.23)} com IVA</span><span>12.000 €</span></div>
              {isFinite(r.casamentos) && (r.casamentos > e.capacidade
                ? <div className="a-alerta">São mais {r.casamentos - e.capacidade} do que o teu teto de {e.capacidade}. Para lá chegares com {e.capacidade} casamentos, o preço mínimo é <b>{eur(precoMin)}</b>.</div>
                : <div className="a-ok">Cabe no teu teto de {e.capacidade}. São {sabadosOcupados} sábados de época alta e {num(r.horasAno)} horas por ano.</div>)}
            </div>
            <div className="a-agenda" aria-label="Sábados da época alta">
              <div className="a-k">ÉPOCA ALTA · ~26 SÁBADOS</div>
              <div className="a-sab">
                {Array.from({ length: 26 }, (_, k) => <span key={k} className={k < sabadosOcupados ? (k >= 26 - d.sabadosLivres ? 'cheio quer-livre' : 'cheio') : ''} />)}
              </div>
              <p>{r.casamentos > 26 ? `+${r.casamentos - 26} casamentos fora da época alta` : `${26 - sabadosOcupados} sábados livres (querias ${d.sabadosLivres})`}</p>
            </div>
          </div>
          <table className="a-tab">
            <thead><tr><th>Preço</th><th>Casamentos</th><th>Horas</th><th>Leads</th></tr></thead>
            <tbody>
              {Array.from(new Set([2500, 3000, 4000, 5000, 6000, 8000, e.preco])).sort((a, b) => a - b).map(pv => {
                const x = calc(e, pv); const over = x.casamentos > e.capacidade
                return (
                  <tr key={pv} className={pv === e.preco ? 'on' : ''} onClick={() => upE({ preco: pv })}>
                    <td>{eur(pv)}</td><td className={over ? 'over' : ''}>{isFinite(x.casamentos) ? x.casamentos : '—'}</td><td>{num(x.horasAno)} h</td><td>{num(x.leads)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </>
      ),
    },
    {
      id: 'degrau', titulo: 'O primeiro degrau', parte: 'A · O lucro',
      render: () => (
        <>
          <Cab k="Sem saltos impossíveis" t="O teu primeiro degrau de preço" s="Ninguém dobra o preço de um ano para o outro. Qual é a subida deste ano?" />
          {!precoAtual ? (
            <p className="a-nota">Preenche o ticket médio em “Onde estás hoje” para calcular o degrau.</p>
          ) : (
            <div className="a-grid3">
              <div className="a-card"><h3>Hoje</h3><div className="a-big">{eur(precoAtual)}<small>ticket médio atual</small></div></div>
              <div className="a-card dest">
                <h3>Subida deste ano</h3>
                <input type="range" min={5} max={60} step={5} value={d.degrau} onChange={ev => up({ degrau: Number(ev.target.value) })} aria-label="Subida de preço" />
                <div className="a-big">+{d.degrau}%<small>novo preço: {eur(precoDegrau)}</small></div>
              </div>
              <div className="a-card">
                <h3>Com este degrau</h3>
                <div className="a-big">{rDegrau && isFinite(rDegrau.casamentos) ? rDegrau.casamentos : '—'}<small>casamentos para o lucro que queres</small></div>
                <p>{rDegrau && isFinite(rDegrau.casamentos) && rDegrau.casamentos > e.capacidade
                  ? `Ainda acima do teu teto de ${e.capacidade}. É normal: o objetivo final é ${eur(precoMin)}, este é só o primeiro passo.`
                  : 'Já cabe no teu teto. Este degrau chega para o lucro que queres.'}</p>
              </div>
            </div>
          )}
          <p className="a-nota">Subidas de 15 a 25% por ano costumam passar sem perder a procura, desde que o portefólio, a experiência e a reunião subam junto.</p>
        </>
      ),
    },
    {
      id: 'funil', titulo: 'O funil', parte: 'A · O lucro',
      render: () => (
        <>
          <Cab k="A conta até ao fim" t="Quantas leads precisas?" s="Com as tuas taxas reais. É este motor que a Sessão 2 vai construir." />
          <div className="a-grid2">
            <div className="a-card">
              <Num label="Leads que marcam reunião" valor={e.taxaReuniao} suf="%" passo={5} onChange={v => upE({ taxaReuniao: Math.max(1, v) })} />
              <Num label="Reuniões que fecham" valor={e.taxaFecho} suf="%" passo={5} onChange={v => upE({ taxaFecho: Math.max(1, v) })} />
            </div>
            <div className="a-funil">
              <div><b>{num(r.casamentos)}</b><span>casamentos</span></div>
              <i>←</i>
              <div><b>{num(r.reunioes)}</b><span>reuniões</span></div>
              <i>←</i>
              <div className="dest"><b>{num(r.leads)}</b><span>leads por ano</span></div>
            </div>
          </div>
          <div className="a-res">
            <div><small>Leads por semana</small><b>{(r.leads / 52).toFixed(1).replace('.', ',')}</b></div>
            <div><small>Reuniões por mês</small><b>{(r.reunioes / 12).toFixed(1).replace('.', ',')}</b></div>
            <div><small>+5 pontos no fecho</small><b>−{num(r.leads - r.casamentos / ((e.taxaFecho + 5) / 100) / (e.taxaReuniao / 100))} leads</b></div>
          </div>
        </>
      ),
    },
    {
      id: 'parteB', titulo: 'Posicionamento', parte: 'B · Posicionamento',
      render: () => (
        <>
          <Cab k="Parte B" t="Agora: porque é que te pagam esse preço?" s="Toca em cada cartão genérico para ver a versão posicionada." />
          <div className="a-grid3">
            {[
              ['Fotógrafo de casamentos profissional.', 'Casamentos pequenos, fotografados e filmados pela mesma equipa, do primeiro olá ao filme.'],
              ['Faço fotografia e vídeo de qualidade.', 'Filmes de casamento com alma de cinema, para quem quer emocionar-se a cada revisão.'],
              ['Cubro o vosso casamento do início ao fim.', 'Discreto durante o dia, presente para sempre: a memória que os vossos filhos vão querer ver.'],
            ].map(([a, b], k) => (
              <button key={k} className={`a-flip ${virados[k] ? 'on' : ''}`} onClick={() => setVirados(v => v.map((x, n) => (n === k ? !x : x)))}>
                <small>{virados[k] ? 'POSICIONADO' : 'GENÉRICO'}</small>
                <span>{virados[k] ? b : a}</span>
              </button>
            ))}
          </div>
          <p className="a-nota">Um posicionamento para todos não serve ninguém. Quem soa igual a todos compete pelo preço mais baixo.</p>
        </>
      ),
    },
    {
      id: 'casal', titulo: 'O casal ideal', parte: 'B · Posicionamento',
      render: () => (
        <>
          <Cab k="Não inventes, encontra" t="O teu casal ideal" s="Começa pelos 3 melhores clientes que já tiveste: os que pagaram melhor, ficaram mais felizes e te recomendaram." />
          <div className="a-grid2">
            <div className="a-card">
              <h3>Os teus 3 melhores clientes</h3>
              {d.clientes.map((c, k) => (
                <label key={k} className="a-linha"><span>{k + 1}</span>
                  <input value={c} placeholder="Nome do casal" onChange={ev => up({ clientes: d.clientes.map((x, n) => (n === k ? ev.target.value : x)) })} />
                </label>
              ))}
              <Txt label="O que têm em comum?" valor={d.padrao} ph="Idade, tipo de festa, local, nº de convidados, como chegaram a ti…" linhas={3} onChange={v => up({ padrao: v })} />
            </div>
            <div className="a-card">
              <h3>O retrato</h3>
              <Txt label="Quem são?" valor={d.quem} ph="Idade, fase de vida, profissão, onde vivem" onChange={v => up({ quem: v })} />
              <Txt label="O que valorizam?" valor={d.valorizam} ph="Emoção, estética, discrição, festa…" onChange={v => up({ valorizam: v })} />
              <Txt label="O que os assusta?" valor={d.receiam} ph="Fotógrafo intrusivo, dia caótico…" onChange={v => up({ receiam: v })} />
              <Txt label="O que procuram em ti?" valor={d.procuram} ph="O sentimento que só tu lhes garantes" onChange={v => up({ procuram: v })} />
            </div>
          </div>
        </>
      ),
    },
    {
      id: 'frase', titulo: 'A frase', parte: 'B · Posicionamento',
      render: () => (
        <>
          <Cab k="Exercício ao vivo" t="Escreve a tua frase" s="Preenche as três partes. A frase constrói-se sozinha." />
          <div className="a-frase">{frase}</div>
          <div className="a-grid3">
            <div className="a-card"><Txt label="Casal ideal" valor={d.fCasal} ph="casais que casam em quinta, com menos de 80 convidados," onChange={v => up({ fCasal: v })} /></div>
            <div className="a-card"><Txt label="Transformação" valor={d.fTransf} ph="reviver o dia tal como o sentiram" onChange={v => up({ fTransf: v })} /></div>
            <div className="a-card"><Txt label="O teu diferencial" valor={d.fDif} ph="uma só equipa de foto e vídeo, da primeira reunião ao filme" onChange={v => up({ fDif: v })} /></div>
          </div>
        </>
      ),
    },
    {
      id: 'teste', titulo: 'O teste da frase', parte: 'B · Posicionamento',
      render: () => (
        <>
          <Cab k="Antes de a usares" t="A tua frase passa no teste?" s="Só passa com três sins." />
          <div className="a-frase pequena">{frase}</div>
          <div className="a-testes">
            {[
              ['É só tua?', 'Um concorrente não podia dizer exatamente a mesma frase.'],
              ['O teu casal ideal reconhece-se?', 'Ao ler, pensam “isto é para nós”.'],
              ['Consegues prová-la?', 'Portefólio, testemunhos e processo confirmam o que prometes.'],
            ].map(([t, s], k) => (
              <button key={k} className={`a-teste ${d.testes[k] ? 'on' : ''}`} onClick={() => up({ testes: d.testes.map((x, n) => (n === k ? !x : x)) })}>
                <i>{d.testes[k] ? '✓' : ''}</i><span><b>{t}</b><small>{s}</small></span>
              </button>
            ))}
          </div>
          <div className={passaTeste ? 'a-ok claro' : 'a-alerta claro'}>{passaTeste ? 'Passa. Esta é a frase que testamos na Sessão 2.' : 'Ainda não passa. Volta à frase e afina a parte que falhou.'}</div>
          <div className="a-card" style={{ marginTop: 16 }}>
            <Txt label="Versão pública (curta, para o site e o Instagram)" valor={d.publica} ph="Ex.: Casamentos pequenos, fotografados e filmados pela mesma equipa." onChange={v => up({ publica: v })} />
          </div>
        </>
      ),
    },
    {
      id: 'erros', titulo: 'Erros comuns', parte: 'B · Posicionamento',
      render: () => (
        <>
          <Cab k="Evita estas armadilhas" t="Qual destes cometes hoje?" s="Toca para abrir cada um." />
          <div className="a-grid2">
            {[
              ['Copiar a concorrência', 'Se soas igual a todos, o casal escolhe pelo preço. Copiar é competir no terreno do mais barato.'],
              ['Querer agradar a toda a gente', 'Ao tentar servir todos os casais, deixas de ser a escolha óbvia para qualquer um deles.'],
              ['Falar de ti, não do casal', '“Tenho 10 anos de experiência” importa menos do que “vais reviver este dia para sempre”.'],
              ['Listar serviços, não emoções', 'Horas, fotos e entregáveis não vendem. A memória e o sentimento que protegem, sim.'],
            ].map(([t, s], k) => (
              <button key={k} className={`a-erro ${abertos[k] ? 'on' : ''}`} onClick={() => setAbertos(v => v.map((x, n) => (n === k ? !x : x)))}>
                <b>{t}</b>{abertos[k] && <span>{s}</span>}
              </button>
            ))}
          </div>
        </>
      ),
    },
    {
      id: 'resumo', titulo: 'Documento de Posicionamento', parte: 'Fecho',
      render: () => (
        <div className="a-doc">
          <Cab k="O entregável" t={`Documento de Posicionamento${d.nome ? ' · ' + d.nome : ''}`} s="Tudo o que construímos hoje. Imprime ou guarda em PDF e traz afinado à Sessão 2." />
          <div className="a-doc-grid">
            <section>
              <h3>Onde estás</h3>
              <p>{d.hoje.casamentos || '—'} casamentos a {eur(d.hoje.ticket)} · lucro de {eur(d.hoje.lucro)} ({eur(porCasamentoHoje)} por casamento)</p>
              <h3>O que queres</h3>
              <p>{eur(e.lucroMensal)}/mês × {e.meses} = {eur(r.lucroLiquido)} no bolso · no máximo {e.capacidade} casamentos · {d.sabadosLivres} sábados livres</p>
              <h3>A tua conta</h3>
              <p>{eur(r.lucroBruto)} antes de impostos ({e.impostos}%) + {eur(r.fixos)} de custos fixos ÷ margem de {eur(r.margem)} ({eur(e.preco)} − {eur(r.porCasamento)})</p>
              <p className="a-doc-dest">{isFinite(r.casamentos) ? `${r.casamentos} casamentos a ${eur(e.preco)}` : 'Sem margem a este preço'}{r.casamentos > e.capacidade ? ` · acima do teto: preço mínimo ${eur(precoMin)}` : ''}</p>
              <h3>Primeiro degrau</h3>
              <p>{precoAtual ? `${eur(precoAtual)} → ${eur(precoDegrau)} (+${d.degrau}%)` : '—'}</p>
              <h3>Funil</h3>
              <p>{num(r.leads)} leads → {num(r.reunioes)} reuniões → {num(r.casamentos)} casamentos ({e.taxaReuniao}% marcam, {e.taxaFecho}% fecham)</p>
            </section>
            <section>
              <h3>Casal ideal</h3>
              <p>{d.clientes.filter(Boolean).join(', ') || '—'}</p>
              {d.padrao && <p><i>Em comum:</i> {d.padrao}</p>}
              {d.quem && <p><i>Quem são:</i> {d.quem}</p>}
              {d.valorizam && <p><i>Valorizam:</i> {d.valorizam}</p>}
              {d.receiam && <p><i>Receiam:</i> {d.receiam}</p>}
              {d.procuram && <p><i>Procuram:</i> {d.procuram}</p>}
              <h3>A frase</h3>
              <p className="a-doc-dest">{frase}</p>
              {d.publica && <p><i>Versão pública:</i> {d.publica}</p>}
              <p>Teste: {passaTeste ? 'passa nos três' : `${d.testes.filter(Boolean).length} de 3`}</p>
            </section>
          </div>
          <div className="a-doc-bt">
            <button onClick={() => window.print()}>Imprimir / guardar PDF</button>
            <button className="sec" onClick={() => { if (confirm('Apagar tudo o que foi preenchido nesta aula?')) { setD(NOVO()); setI(0); setRev(0) } }}>Começar nova aula</button>
          </div>
        </div>
      ),
    },
  ]

  const total = SECOES.length
  const sec = SECOES[i]
  const ir = useCallback((n: number) => { setI(Math.max(0, Math.min(total - 1, n))); setRev(0); setMenu(false); window.scrollTo(0, 0) }, [total])
  const seguinte = useCallback(() => {
    const passos = SECOES[i].passos ?? 0
    if (rev < passos) setRev(v => v + 1)
    else ir(i + 1)
  }, [i, rev, ir]) // eslint-disable-line react-hooks/exhaustive-deps
  const anterior = useCallback(() => ir(i - 1), [i, ir])

  useEffect(() => {
    const k = (ev: KeyboardEvent) => {
      const t = ev.target as HTMLElement
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return
      if (ev.key === 'ArrowRight' || ev.key === 'PageDown' || ev.key === ' ') { ev.preventDefault(); seguinte() }
      else if (ev.key === 'ArrowLeft' || ev.key === 'PageUp') { ev.preventDefault(); anterior() }
      else if (ev.key === 'f' || ev.key === 'F') { if (!document.fullscreenElement) document.documentElement.requestFullscreen?.(); else document.exitFullscreen?.() }
      else if (ev.key === 'Escape') setMenu(false)
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [seguinte, anterior])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=Poppins:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; background: ${CREAM} !important; color: ${INK} !important; font-family: 'Poppins', -apple-system, sans-serif; line-height: 1.5; }
        h1, h2, h3, p, div, span, label, td, th, small, b, i { color: inherit; }
        .a-app { min-height: 100vh; display: flex; flex-direction: column; color: ${INK}; }
        .a-top { position: sticky; top: 0; z-index: 20; display: flex; align-items: center; gap: 14px; padding: 12px 22px; background: rgba(248,246,243,.94); backdrop-filter: blur(6px); border-bottom: 1px solid ${RULE}; }
        .a-top a { font-size: 12px; color: ${GOLD_DK}; text-decoration: none; letter-spacing: .5px; }
        .a-top .a-parte { font-size: 11px; letter-spacing: 3px; color: ${GOLD}; font-weight: 600; text-transform: uppercase; flex: 1; text-align: center; }
        .a-top button { font-family: inherit; background: none; border: 1px solid ${RULE}; border-radius: 20px; padding: 6px 14px; font-size: 12px; color: ${INK}; cursor: pointer; }
        .a-prog { height: 3px; background: ${RULE}; }
        .a-prog i { display: block; height: 100%; background: ${GOLD}; transition: width .4s ease; }
        .a-main { flex: 1; width: 100%; max-width: 1180px; margin: 0 auto; padding: 34px 26px 120px; animation: aEntra .45s ease; }
        @keyframes aEntra { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: none } }
        .a-k { font-size: 11px; letter-spacing: 4px; color: ${GOLD}; font-weight: 600; text-transform: uppercase; }
        .a-cab { margin-bottom: 24px; }
        .a-cab h2 { font-family: 'Playfair Display', Georgia, serif; font-size: clamp(28px, 4vw, 44px); margin: 6px 0 6px; line-height: 1.15; }
        .a-cab p { color: ${MUTE}; font-size: 16px; margin: 0; max-width: 760px; }
        .a-capa { min-height: 70vh; display: flex; flex-direction: column; justify-content: center; align-items: flex-start; max-width: 760px; }
        .a-logo { width: 110px; margin-bottom: 26px; }
        .a-capa h1 { font-family: 'Playfair Display', Georgia, serif; font-size: clamp(36px, 6vw, 64px); margin: 10px 0 14px; line-height: 1.08; }
        .a-lead { font-size: 18px; color: ${MUTE}; margin: 0 0 28px; }
        .a-nome { display: flex; flex-direction: column; gap: 6px; width: 100%; max-width: 420px; font-size: 12px; letter-spacing: 2px; color: ${GOLD_DK}; text-transform: uppercase; font-weight: 600; }
        .a-nome input { font-family: 'Playfair Display', Georgia, serif; font-size: 22px; border: none; border-bottom: 1px solid ${GOLD}; background: transparent; padding: 6px 0; color: ${INK}; letter-spacing: 0; text-transform: none; }
        .a-nome input:focus { outline: none; border-bottom-width: 2px; }
        .a-hint { margin-top: 30px; font-size: 13px; color: ${MUTE}; }
        .a-grid2, .a-grid3, .a-grid4 { display: grid; gap: 16px; }
        .a-grid2 { grid-template-columns: repeat(2, 1fr); }
        .a-grid3 { grid-template-columns: repeat(3, 1fr); }
        .a-grid4 { grid-template-columns: repeat(4, 1fr); }
        .a-card { background: #fff; border: 1px solid ${RULE}; border-radius: 16px; padding: 20px; box-shadow: 0 6px 18px rgba(60,45,30,.04); }
        .a-card.dest { background: ${BG2}; border-color: ${GOLD}; }
        .a-card h3 { font-family: 'Playfair Display', Georgia, serif; font-size: 20px; margin: 0 0 4px; }
        .a-card > p { font-size: 13px; color: ${MUTE}; margin: 0 0 12px; }
        .a-num { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 6px 0; font-size: 14px; }
        .a-num > span:first-child small { display: block; font-size: 11px; color: ${MUTE}; }
        .a-num-in { display: flex; align-items: center; gap: 4px; }
        .a-num input { width: 104px; font-family: inherit; font-size: 16px; text-align: right; padding: 7px 9px; border: 1px solid ${RULE}; border-radius: 9px; background: ${CREAM2}; color: ${INK}; }
        .a-num input:focus, .a-txt textarea:focus, .a-linha input:focus { outline: none; border-color: ${GOLD}; box-shadow: 0 0 0 3px rgba(177,147,126,.18); }
        .a-num em { font-style: normal; font-size: 13px; color: ${MUTE}; width: 18px; }
        .a-grid4 .a-num { flex-direction: column; align-items: flex-start; }
        .a-grid4 .a-num input { width: 100%; font-size: 22px; font-family: 'Playfair Display', Georgia, serif; }
        .a-grid4 .a-num-in { width: 100%; }
        .a-big { margin-top: 14px; padding-top: 12px; border-top: 1px solid ${RULE}; font-family: 'Playfair Display', Georgia, serif; font-size: 32px; font-weight: 700; color: ${GOLD_DK}; line-height: 1.1; }
        .a-big small { display: block; font-family: 'Poppins'; font-size: 12px; font-weight: 400; color: ${MUTE}; margin-top: 4px; }
        .a-tot { display: flex; justify-content: space-between; margin-top: 8px; padding-top: 10px; border-top: 1px solid ${RULE}; font-size: 14px; font-weight: 600; }
        .a-tot b { color: ${GOLD_DK}; }
        .a-res { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 18px; }
        .a-res > div { background: ${INK}; color: #F3ECE3; border-radius: 14px; padding: 14px 16px; }
        .a-res small { display: block; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; opacity: .7; }
        .a-res b { font-family: 'Playfair Display', Georgia, serif; font-size: 24px; }
        .a-nota { margin-top: 18px; font-size: 14px; color: ${MUTE}; font-style: italic; max-width: 820px; }
        .a-cadeia { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }
        .a-elo { background: #fff; border: 1px dashed ${RULE}; border-radius: 16px; padding: 18px 16px; min-height: 190px; transition: all .4s ease; opacity: .55; }
        .a-elo.on { border-style: solid; opacity: 1; transform: translateY(-4px); box-shadow: 0 12px 26px rgba(60,45,30,.08); }
        .a-elo.fim.on { background: ${BG2}; border-color: ${GOLD}; }
        .a-elo small { font-family: 'Playfair Display', Georgia, serif; font-size: 20px; color: ${GOLD}; font-weight: 700; }
        .a-elo h3 { font-size: 15px; margin: 6px 0 10px; font-weight: 600; }
        .a-elo b { display: block; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; color: ${GOLD_DK}; }
        .a-elo span { font-size: 12px; color: ${MUTE}; }
        .a-formula { margin-top: 18px; text-align: center; font-family: 'Playfair Display', Georgia, serif; font-size: 18px; padding: 16px; border-radius: 14px; background: ${BG2}; border: 1px solid ${GOLD}; opacity: 0; transform: translateY(8px); transition: all .5s ease; }
        .a-formula.on { opacity: 1; transform: none; }
        .a-hero { display: grid; grid-template-columns: 1.6fr 1fr; gap: 16px; }
        .a-hero-l { background: ${INK}; color: #F3ECE3; border-radius: 18px; padding: 26px; }
        .a-hero-l h3 { font-family: 'Playfair Display', Georgia, serif; font-size: clamp(26px, 3.4vw, 38px); margin: 8px 0 18px; line-height: 1.15; }
        .a-hero-l h3 b { color: #E4CDB5; }
        .a-hero-l input[type=range], .a-card input[type=range] { width: 100%; accent-color: ${GOLD}; }
        .a-range-l { display: flex; justify-content: space-between; font-size: 12px; opacity: .75; margin-top: 4px; gap: 8px; }
        .a-alerta, .a-ok { margin-top: 16px; border-radius: 12px; padding: 12px 14px; font-size: 14px; }
        .a-alerta { background: rgba(180,83,60,.18); border: 1px solid rgba(228,140,115,.5); }
        .a-ok { background: rgba(177,147,126,.18); border: 1px solid rgba(177,147,126,.45); }
        .a-alerta.claro { background: #F7E6E0; border-color: #E8B9AA; color: ${ALERT}; }
        .a-ok.claro { background: #E7EFE4; border-color: #B9CDB3; color: ${OK}; }
        .a-agenda { background: #fff; border: 1px solid ${RULE}; border-radius: 18px; padding: 20px; }
        .a-sab { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; margin: 14px 0 10px; max-width: 320px; }
        .a-sab span { aspect-ratio: 1; border-radius: 6px; background: ${CREAM2}; border: 1px solid ${RULE}; transition: background .3s; }
        .a-sab span.cheio { background: ${GOLD}; border-color: ${GOLD}; }
        .a-sab span.quer-livre { background: ${ALERT}; border-color: ${ALERT}; }
        .a-agenda p { font-size: 13px; color: ${MUTE}; margin: 0; }
        .a-tab { width: 100%; border-collapse: collapse; margin-top: 18px; background: #fff; border: 1px solid ${RULE}; border-radius: 14px; overflow: hidden; font-size: 15px; }
        .a-tab th { background: ${BG2}; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: ${GOLD_DK}; padding: 10px 14px; text-align: right; }
        .a-tab td { padding: 10px 14px; border-top: 1px solid ${RULE}; text-align: right; }
        .a-tab th:first-child, .a-tab td:first-child { text-align: left; }
        .a-tab tr { cursor: pointer; }
        .a-tab tr.on td { background: ${CREAM2}; font-weight: 600; }
        .a-tab td.over { color: ${ALERT}; }
        .a-funil { display: flex; align-items: center; justify-content: space-around; gap: 8px; background: #fff; border: 1px solid ${RULE}; border-radius: 16px; padding: 20px; }
        .a-funil div { text-align: center; }
        .a-funil b { display: block; font-family: 'Playfair Display', Georgia, serif; font-size: 40px; }
        .a-funil span { font-size: 13px; color: ${MUTE}; }
        .a-funil .dest b { color: ${GOLD_DK}; }
        .a-funil i { font-style: normal; color: ${GOLD}; font-size: 24px; }
        .a-flip { font-family: inherit; text-align: left; min-height: 170px; background: #fff; border: 1px solid ${RULE}; border-radius: 16px; padding: 20px; cursor: pointer; transition: all .35s ease; display: flex; flex-direction: column; gap: 10px; }
        .a-flip small { font-size: 11px; letter-spacing: 2px; color: ${MUTE}; font-weight: 600; }
        .a-flip span { font-size: 17px; color: ${MUTE}; font-style: italic; }
        .a-flip.on { background: ${BG2}; border-color: ${GOLD}; transform: rotate(-.6deg); }
        .a-flip.on small { color: ${GOLD_DK}; }
        .a-flip.on span { font-family: 'Playfair Display', Georgia, serif; font-style: normal; font-size: 20px; color: ${INK}; }
        .a-txt { display: flex; flex-direction: column; gap: 4px; margin: 8px 0; font-size: 13px; font-weight: 600; }
        .a-txt textarea { font-family: inherit; font-size: 15px; font-weight: 400; padding: 9px 11px; border: 1px solid ${RULE}; border-radius: 10px; background: ${CREAM2}; color: ${INK}; resize: vertical; }
        .a-linha { display: flex; align-items: center; gap: 10px; margin: 8px 0; }
        .a-linha span { font-family: 'Playfair Display', Georgia, serif; font-size: 20px; color: ${GOLD}; width: 18px; }
        .a-linha input { flex: 1; font-family: inherit; font-size: 15px; padding: 9px 11px; border: 1px solid ${RULE}; border-radius: 10px; background: ${CREAM2}; color: ${INK}; }
        .a-frase { font-family: 'Playfair Display', Georgia, serif; font-size: clamp(22px, 3vw, 32px); line-height: 1.3; background: #fff; border: 1px solid ${GOLD}; border-radius: 18px; padding: 24px 28px; margin-bottom: 18px; }
        .a-frase.pequena { font-size: 20px; }
        .a-testes { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .a-teste { font-family: inherit; text-align: left; display: flex; gap: 12px; align-items: flex-start; background: #fff; border: 1px solid ${RULE}; border-radius: 14px; padding: 16px; cursor: pointer; transition: .2s; }
        .a-teste i { flex: none; width: 26px; height: 26px; border-radius: 50%; border: 2px solid ${GOLD}; display: flex; align-items: center; justify-content: center; font-style: normal; color: #fff; font-weight: 700; }
        .a-teste.on { border-color: ${OK}; }
        .a-teste.on i { background: ${OK}; border-color: ${OK}; }
        .a-teste b { display: block; font-size: 15px; }
        .a-teste small { font-size: 13px; color: ${MUTE}; }
        .a-erro { font-family: inherit; text-align: left; background: #fff; border: 1px solid ${RULE}; border-radius: 14px; padding: 18px 20px; cursor: pointer; display: flex; flex-direction: column; gap: 8px; transition: .2s; }
        .a-erro b { font-family: 'Playfair Display', Georgia, serif; font-size: 19px; }
        .a-erro b::before { content: '⚠ '; color: ${GOLD}; }
        .a-erro span { font-size: 14px; color: ${MUTE}; }
        .a-erro.on { background: ${BG2}; border-color: ${GOLD}; }
        .a-doc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
        .a-doc section { background: #fff; border: 1px solid ${RULE}; border-radius: 16px; padding: 22px 24px; }
        .a-doc h3 { font-size: 11px; letter-spacing: 2.5px; text-transform: uppercase; color: ${GOLD}; margin: 16px 0 4px; }
        .a-doc h3:first-child { margin-top: 0; }
        .a-doc section p { margin: 2px 0; font-size: 14px; }
        .a-doc section p i { color: ${MUTE}; font-style: normal; }
        .a-doc-dest { font-family: 'Playfair Display', Georgia, serif; font-size: 19px !important; color: ${GOLD_DK}; margin-top: 6px !important; }
        .a-doc-bt { display: flex; gap: 10px; margin-top: 20px; flex-wrap: wrap; }
        .a-doc-bt button { font-family: inherit; background: ${INK}; color: #fff; border: none; border-radius: 10px; padding: 12px 20px; font-size: 14px; cursor: pointer; }
        .a-doc-bt button.sec { background: transparent; color: ${MUTE}; border: 1px solid ${RULE}; }
        .a-nav { position: fixed; bottom: 0; left: 0; right: 0; z-index: 20; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 22px; background: rgba(248,246,243,.96); backdrop-filter: blur(6px); border-top: 1px solid ${RULE}; }
        .a-nav button { font-family: inherit; border-radius: 30px; padding: 11px 22px; font-size: 14px; cursor: pointer; }
        .a-nav .ant { background: transparent; border: 1px solid ${RULE}; color: ${INK}; }
        .a-nav .seg { background: ${INK}; border: 1px solid ${INK}; color: #fff; }
        .a-nav button:disabled { opacity: .3; cursor: default; }
        .a-dots { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; }
        .a-dots button { width: 9px; height: 9px; padding: 0; border-radius: 50%; border: none; background: ${RULE}; }
        .a-dots button.on { background: ${GOLD}; transform: scale(1.3); }
        .a-menu { position: fixed; inset: 0; z-index: 40; background: rgba(51,48,43,.4); display: flex; justify-content: flex-end; }
        .a-menu nav { width: min(360px, 90vw); background: ${CREAM}; height: 100%; overflow-y: auto; padding: 22px; }
        .a-menu nav button { display: flex; gap: 12px; width: 100%; text-align: left; font-family: inherit; background: none; border: none; border-bottom: 1px solid ${RULE}; padding: 12px 4px; font-size: 15px; color: ${INK}; cursor: pointer; }
        .a-menu nav button span { color: ${GOLD}; width: 22px; }
        .a-menu nav button.on { font-weight: 600; color: ${GOLD_DK}; }
        @media (max-width: 900px) {
          .a-grid3, .a-grid4, .a-cadeia, .a-hero, .a-testes, .a-doc-grid { grid-template-columns: 1fr 1fr; }
          .a-res { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 640px) {
          .a-grid2, .a-grid3, .a-grid4, .a-cadeia, .a-hero, .a-testes, .a-doc-grid { grid-template-columns: 1fr; }
          .a-main { padding: 22px 16px 120px; }
          .a-top { padding: 10px 16px; }
          .a-top .a-parte { display: none; }
          .a-dots { display: none; }
          .a-elo { min-height: 0; }
          .a-funil b { font-size: 30px; }
        }
        @media print {
          .a-top, .a-nav, .a-prog, .a-doc-bt { display: none !important; }
          body { background: #fff !important; }
          .a-main { padding: 0; animation: none; }
          .a-doc section { break-inside: avoid; }
        }
      `}</style>

      <div className="a-app">
        <div className="a-top">
          <a href="/wedding-mentor">‹ Mentoria</a>
          <span className="a-parte">{sec.parte ?? 'Sessão 1'}</span>
          <button onClick={() => setMenu(true)}>{i + 1} / {total} · Secções</button>
        </div>
        <div className="a-prog"><i style={{ width: `${((i + 1) / total) * 100}%` }} /></div>

        <main key={sec.id} className="a-main">{sec.render()}</main>

        <div className="a-nav">
          <button className="ant" onClick={anterior} disabled={i === 0}>‹ Anterior</button>
          <div className="a-dots">
            {SECOES.map((s, k) => <button key={s.id} className={k === i ? 'on' : ''} onClick={() => ir(k)} aria-label={s.titulo} title={s.titulo} />)}
          </div>
          <button className="seg" onClick={seguinte} disabled={i === total - 1 && rev >= (sec.passos ?? 0)}>
            {(sec.passos ?? 0) > rev ? 'Revelar ›' : i === total - 1 ? 'Fim' : 'Seguinte ›'}
          </button>
        </div>

        {menu && (
          <div className="a-menu" onClick={() => setMenu(false)}>
            <nav onClick={ev => ev.stopPropagation()}>
              <div className="a-k" style={{ marginBottom: 10 }}>SECÇÕES DA AULA</div>
              {SECOES.map((s, k) => (
                <button key={s.id} className={k === i ? 'on' : ''} onClick={() => ir(k)}><span>{String(k + 1).padStart(2, '0')}</span>{s.titulo}</button>
              ))}
            </nav>
          </div>
        )}
      </div>
    </>
  )
}
