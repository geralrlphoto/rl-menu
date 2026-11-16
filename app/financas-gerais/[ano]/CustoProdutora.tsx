'use client'

import { useEffect, useState } from 'react'

// Custo da produtora: conta direta do que custa ter a RL aberta por mês
// (renda, internet, luz) + o que cada casamento custa em equipa
// (videógrafo + editor). Daí sai o ponto de equilíbrio e o lucro.
// Valores editáveis, guardados no browser por ano.

// O nº de casamentos vem dos Objetivos (único sítio onde se muda).
type Cfg = {
  renda: number; internet: number; luz: number
  videografo: number; editor: number
  preco: number
  incluirOutros: boolean
  captoEu: number   // casamentos que o Rui capta ele próprio (poupa o videógrafo)
}

const DEFAULT_CFG: Cfg = {
  renda: 320, internet: 15, luz: 25,
  videografo: 300, editor: 150,
  preco: 1200,
  incluirOutros: false,
  captoEu: 0,
}

// Parte fixa (renda, internet, luz, outros): a página lê-a para usar em toda a Estratégia.
export type FixosCfg = Pick<Cfg, 'renda' | 'internet' | 'luz' | 'incluirOutros'>
export const DEFAULT_FIXOS: FixosCfg = {
  renda: DEFAULT_CFG.renda, internet: DEFAULT_CFG.internet, luz: DEFAULT_CFG.luz, incluirOutros: DEFAULT_CFG.incluirOutros,
}
export function pickFixos(c: Partial<Cfg>): Partial<FixosCfg> {
  const out: Partial<FixosCfg> = {}
  if (typeof c.renda === 'number') out.renda = c.renda
  if (typeof c.internet === 'number') out.internet = c.internet
  if (typeof c.luz === 'number') out.luz = c.luz
  if (typeof c.incluirOutros === 'boolean') out.incluirOutros = c.incluirOutros
  return out
}

const PRECOS_TABELA = [800, 1000, 1200, 1500, 2000]

const eur = (n: number) => `${Math.round(n).toLocaleString('pt-PT')} €`

function Campo({ label, value, onChange, step = 5, sufixo = '€', cor = 'text-white/80' }: {
  label: string; value: number; onChange: (v: number) => void; step?: number; sufixo?: string; cor?: string
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
      <span className="text-[11px] text-white/50">{label}</span>
      <span className="flex items-center gap-1">
        <input type="number" min={0} step={step} value={value}
          onChange={e => onChange(Math.max(0, Number(e.target.value) || 0))}
          className={`w-20 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm font-mono text-right focus:outline-none focus:border-white/25 ${cor}`} />
        <span className="text-[10px] text-white/25 w-4">{sufixo}</span>
      </span>
    </label>
  )
}

export default function CustoProdutora({ ano, outrosFixosAnuais, casamentos, meta, onFixosChange }: {
  ano: number; outrosFixosAnuais: number; casamentos: number; meta: number; onFixosChange?: (f: FixosCfg) => void
}) {
  const KEY = `custo-produtora-${ano}`
  const [cfgBase, setCfg] = useState<Cfg>(DEFAULT_CFG)
  const cfg = { ...cfgBase, casamentos }

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) setCfg({ ...DEFAULT_CFG, ...JSON.parse(raw) })
    } catch {}
  }, [KEY])

  const set = (patch: Partial<Cfg>) => {
    const next = { ...cfgBase, ...patch }
    setCfg(next)
    try { localStorage.setItem(KEY, JSON.stringify(next)) } catch {}
    onFixosChange?.({ ...DEFAULT_FIXOS, ...pickFixos(next) })
  }

  // ── Contas
  const fixoMes      = cfg.renda + cfg.internet + cfg.luz
  const outrosAno    = cfg.incluirOutros ? outrosFixosAnuais : 0
  const fixoAno      = fixoMes * 12 + outrosAno
  const equipaEvento = cfg.videografo + cfg.editor
  const equipaAno    = equipaEvento * cfg.casamentos
  const custoAno     = fixoAno + equipaAno
  const custoEvento  = cfg.casamentos > 0 ? custoAno / cfg.casamentos : 0
  const sobraEvento  = cfg.preco - equipaEvento
  const equilibrio   = sobraEvento > 0 ? Math.ceil(fixoAno / sobraEvento) : null
  const receitaAno   = cfg.preco * cfg.casamentos
  const lucroAno     = receitaAno - custoAno

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-white/[0.06]" />
        <p className="text-[10px] tracking-[0.4em] text-white/30 uppercase">Custo da Produtora</p>
        <div className="h-px flex-1 bg-white/[0.06]" />
      </div>
      <p className="text-[10px] text-white/25 text-center">Quanto custa a RL por mês e quantos casamentos são precisos para dar lucro</p>

      {/* Entradas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-2">
          <p className="text-[9px] tracking-[0.35em] text-white/35 uppercase mb-1">Custos fixos / mês</p>
          <Campo label="Renda da loja" value={cfg.renda} onChange={v => set({ renda: v })} />
          <Campo label="Internet" value={cfg.internet} onChange={v => set({ internet: v })} />
          <Campo label="Luz" value={cfg.luz} onChange={v => set({ luz: v })} />
        </div>
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-2">
          <p className="text-[9px] tracking-[0.35em] text-white/35 uppercase mb-1">Equipa / casamento</p>
          <Campo label="Videógrafo" value={cfg.videografo} onChange={v => set({ videografo: v })} step={10} cor="text-red-300/80" />
          <Campo label="Editor" value={cfg.editor} onChange={v => set({ editor: v })} step={10} cor="text-red-300/80" />
          <div className="flex items-center justify-between px-3 pt-1 text-[11px]">
            <span className="text-white/35">Total por casamento</span>
            <span className="font-mono text-red-300/80">{eur(equipaEvento)}</span>
          </div>
        </div>
        <div className="rounded-2xl border border-gold/20 bg-gold/[0.04] p-4 space-y-2">
          <p className="text-[9px] tracking-[0.35em] text-gold/60 uppercase mb-1">Objetivo</p>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
            <span className="text-[11px] text-white/50">Casamentos / ano</span>
            <span className="text-right">
              <span className="text-sm font-mono text-blue-300">{cfg.casamentos}</span>
              <span className="block text-[9px] text-white/25">muda nos Objetivos</span>
            </span>
          </div>
          <Campo label="Preço por casamento" value={cfg.preco} onChange={v => set({ preco: v })} step={50} cor="text-gold" />
          {outrosFixosAnuais > 0 && (
            <label className="flex items-center gap-2 px-3 pt-1 text-[11px] text-white/45 cursor-pointer">
              <input type="checkbox" checked={cfg.incluirOutros} onChange={e => set({ incluirOutros: e.target.checked })} className="accent-yellow-400" />
              Incluir outros custos fixos do ano ({eur(outrosFixosAnuais)})
            </label>
          )}
        </div>
      </div>

      {/* Resultado */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: 'Custo fixo / mês', v: eur(fixoAno / 12), s: `${eur(fixoAno)} / ano`, c: 'text-white/80' },
          { l: 'Custo total / ano', v: eur(custoAno), s: `${eur(custoAno / 12)} / mês em média`, c: 'text-red-300' },
          { l: 'Custo por casamento', v: eur(custoEvento), s: `equipa ${eur(equipaEvento)} + fixos ${eur(custoEvento - equipaEvento)}`, c: 'text-white/80' },
          { l: 'Ponto de equilíbrio', v: equilibrio === null ? 'nunca' : `${equilibrio} casamentos`, s: equilibrio === null ? 'preço abaixo do custo da equipa' : 'a partir daqui é lucro', c: equilibrio === null ? 'text-red-400' : 'text-blue-300' },
        ].map(k => (
          <div key={k.l} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 text-center">
            <p className="text-[9px] tracking-[0.3em] text-white/30 uppercase mb-2">{k.l}</p>
            <p className={`text-xl font-light font-mono ${k.c}`}>{k.v}</p>
            <p className="text-[9px] text-white/25 mt-1">{k.s}</p>
          </div>
        ))}
      </div>

      <div className={`rounded-2xl border p-5 text-center ${lucroAno >= 0 ? 'border-green-500/25 bg-green-500/[0.05]' : 'border-red-500/25 bg-red-500/[0.05]'}`}>
        <p className="text-[10px] tracking-[0.35em] text-white/35 uppercase mb-2">
          Lucro com {cfg.casamentos} casamentos a {eur(cfg.preco)}, tudo feito por freelancers
        </p>
        <p className={`text-3xl font-light font-mono ${lucroAno >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {lucroAno < 0 ? '−' : ''}{eur(Math.abs(lucroAno))} <span className="text-sm text-white/30">/ ano</span>
        </p>
        <p className="text-[11px] text-white/40 mt-1">{eur(lucroAno / 12)} por mês · receita {eur(receitaAno)} − custos {eur(custoAno)}</p>
      </div>

      {/* O que fazes tu: captações e edições próprias para chegar à meta */}
      {(() => {
        const V = cfg.videografo, E = cfg.editor, N = cfg.casamentos
        const falta = meta - lucroAno                       // o que falta para a meta se tudo for freelancer
        const capt  = Math.min(Math.max(0, Math.round(cfg.captoEu)), N)
        const restante = falta - capt * V                   // o que ainda falta depois das tuas captações
        const edicoes  = restante > 0 ? (E > 0 ? Math.ceil(restante / E) : Infinity) : 0
        const possivel = edicoes <= N
        const lucroFinal = lucroAno + capt * V + (possivel ? edicoes : N) * E
        const opcoes = [
          { l: 'Só captar', v: V > 0 ? Math.ceil(falta / V) : Infinity, t: 'captações tuas', s: 'e todas as edições pelo editor' },
          { l: 'Só editar', v: E > 0 ? Math.ceil(falta / E) : Infinity, t: 'edições tuas', s: 'e todas as captações por freelancers' },
          { l: 'Captar e editar', v: V + E > 0 ? Math.ceil(falta / (V + E)) : Infinity, t: 'casamentos inteiros teus', s: 'captas e editas os mesmos' },
        ]
        return (
          <div className="rounded-2xl border border-gold/25 bg-gold/[0.04] p-5 space-y-4">
            <div className="text-center">
              <p className="text-[10px] tracking-[0.35em] text-gold/70 uppercase">O que tens de fazer tu</p>
              <p className="text-[11px] text-white/40 mt-1">
                Meta de lucro <span className="text-gold font-mono">{eur(meta)}</span> (muda nos Objetivos).
                Cada captação tua poupa {eur(V)} e cada edição tua poupa {eur(E)}.
              </p>
            </div>

            {falta <= 0 ? (
              <p className="text-center text-sm text-green-400">
                Já chegas à meta só com freelancers. Sobram {eur(-falta)} acima da meta.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {opcoes.map(o => {
                    const ok = o.v <= N
                    return (
                      <div key={o.l} className="rounded-xl border border-white/[0.08] bg-black/20 p-4 text-center">
                        <p className="text-[9px] tracking-[0.3em] text-white/35 uppercase mb-2">{o.l}</p>
                        <p className={`text-3xl font-light font-mono ${ok ? 'text-gold' : 'text-red-400/80'}`}>{ok ? o.v : '✕'}</p>
                        <p className="text-[10px] text-white/45 mt-1">{ok ? o.t : `não chega com ${N} casamentos`}</p>
                        {ok && <p className="text-[9px] text-white/25 mt-0.5">{o.s}</p>}
                      </div>
                    )
                  })}
                </div>

                {/* Combinação à medida: escolhes quantas captas, diz quantas edições faltam */}
                <div className="rounded-xl border border-white/[0.08] bg-black/20 p-4 space-y-3">
                  <p className="text-[9px] tracking-[0.3em] text-white/35 uppercase text-center">A tua combinação</p>
                  <div className="flex items-center gap-4">
                    <span className="text-[11px] text-white/50 w-36 shrink-0">Casamentos que captas</span>
                    <input type="range" min={0} max={N} step={1} value={capt}
                      onChange={e => set({ captoEu: Number(e.target.value) })}
                      className="flex-1 accent-yellow-400" />
                    <span className="text-lg font-mono text-gold w-10 text-right">{capt}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-white/[0.06] pt-3">
                    <span className="text-[11px] text-white/50">Edições que tens de fazer</span>
                    <span className={`text-lg font-mono ${possivel ? 'text-gold' : 'text-red-400'}`}>
                      {possivel ? edicoes : `${N} não chegam`}
                    </span>
                  </div>
                  <p className={`text-[11px] text-center ${lucroFinal >= meta ? 'text-green-400/80' : 'text-red-400/80'}`}>
                    {possivel
                      ? <>Captas {capt} e editas {edicoes} de {N}: lucro de {eur(lucroFinal)} ({eur(lucroFinal / 12)} / mês)</>
                      : <>Mesmo editando os {N}, o lucro fica em {eur(lucroFinal)}. Capta mais, sobe o preço ou faz mais casamentos.</>}
                  </p>
                </div>
              </>
            )}
            <p className="text-[9px] text-white/25 text-center">
              O lucro inclui o valor do teu trabalho: o que poupas em freelancers é o que ganhas por captar e editar.
            </p>
          </div>
        )
      })()}

      {/* Tabela de preços */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
        <div className="px-5 py-3 border-b border-white/[0.06]">
          <p className="text-[9px] tracking-[0.35em] text-white/30 uppercase">Comparação por preço · {cfg.casamentos} casamentos / ano</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-[9px] tracking-[0.2em] uppercase text-white/30">
                <th className="text-left font-normal px-5 py-2.5">Preço</th>
                <th className="text-right font-normal px-3 py-2.5">Sobra / casamento</th>
                <th className="text-right font-normal px-3 py-2.5">Para cobrir custos</th>
                <th className="text-right font-normal px-3 py-2.5">Lucro / ano</th>
                <th className="text-right font-normal px-5 py-2.5">Lucro / mês</th>
              </tr>
            </thead>
            <tbody>
              {[...new Set([...PRECOS_TABELA, cfg.preco])].sort((a, b) => a - b).map(p => {
                const sobra = p - equipaEvento
                const be = sobra > 0 ? Math.ceil(fixoAno / sobra) : null
                const lucro = sobra * cfg.casamentos - fixoAno
                const atual = p === cfg.preco
                return (
                  <tr key={p} className={`border-t border-white/[0.04] ${atual ? 'bg-gold/[0.06]' : ''}`}>
                    <td className={`px-5 py-2.5 font-mono ${atual ? 'text-gold' : 'text-white/70'}`}>{eur(p)}{atual && <span className="text-[9px] text-gold/60 ml-2">o teu</span>}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-white/55">{eur(sobra)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-blue-300">{be === null ? 'nunca' : `${be} casamentos`}</td>
                    <td className={`px-3 py-2.5 text-right font-mono ${lucro >= 0 ? 'text-green-400' : 'text-red-400'}`}>{eur(lucro)}</td>
                    <td className={`px-5 py-2.5 text-right font-mono ${lucro >= 0 ? 'text-green-400/70' : 'text-red-400/70'}`}>{eur(lucro / 12)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[10px] text-white/25 leading-relaxed text-center max-w-2xl mx-auto">
        Valores antes de impostos. Não inclui IVA (se o preço já tem IVA, o que fica é o preço ÷ 1,23), IRS ou IRC, Segurança Social,
        o teu próprio trabalho, material, deslocações nem software. A renda paga-se os 12 meses, mas os casamentos concentram-se entre maio e outubro.
      </p>
    </div>
  )
}
