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
  editoEu: number   // casamentos que o Rui edita ele próprio (poupa o editor)
}

const DEFAULT_CFG: Cfg = {
  renda: 320, internet: 15, luz: 25,
  videografo: 300, editor: 150,
  preco: 1200,
  incluirOutros: false,
  editoEu: 0,
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

// Casamento marcado no ano: dia (AAAA-MM-DD) e valor do vídeo
export type CasamentoVideo = { dia: string; valor: number }

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

export default function CustoProdutora({ ano, outrosFixosAnuais, casamentos, meta, casamentosAno, onFixosChange, onLucroPrevisto }: {
  ano: number; outrosFixosAnuais: number; casamentos: number; meta: number
  casamentosAno: CasamentoVideo[]; onFixosChange?: (f: FixosCfg) => void
  onLucroPrevisto?: (lucro: number | null) => void
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

  // Lucro previsto com os casamentos marcados (mesma conta do quadro Previsão),
  // enviado para a página mostrar a % da meta nos Objetivos.
  const nAno      = casamentosAno.length
  const diasAno   = new Set(casamentosAno.map(c => c.dia)).size
  const receitaPrev = casamentosAno.reduce((s, c) => s + c.valor, 0)
  const editoPrev = Math.min(Math.max(0, Math.round(cfg.editoEu)), nAno)
  const lucroPrev = receitaPrev - (nAno - diasAno) * cfg.videografo - (nAno - editoPrev) * cfg.editor - fixoAno
  useEffect(() => {
    onLucroPrevisto?.(nAno > 0 ? lucroPrev : null)
  }, [lucroPrev, nAno, onLucroPrevisto])

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

      {/* Previsão com os casamentos marcados no ano (dados reais dos eventos) */}
      {(() => {
        const V = cfg.videografo, E = cfg.editor
        const N = casamentosAno.length
        // Um casamento por dia é do Rui; os restantes no mesmo dia vão para o videógrafo freelancer
        const porDia = new Map<string, number>()
        casamentosAno.forEach(c => porDia.set(c.dia, (porDia.get(c.dia) ?? 0) + 1))
        const diasDuplos = [...porDia.entries()].filter(([, n]) => n > 1)
        const captoEu  = porDia.size
        const captoFree = N - captoEu
        const receita  = casamentosAno.reduce((s, c) => s + c.valor, 0)
        const comValor = casamentosAno.filter(c => c.valor > 0)
        const semValor = N - comValor.length
        const media    = comValor.length > 0 ? receita / comValor.length : cfg.preco
        const edito    = Math.min(Math.max(0, Math.round(cfg.editoEu)), N)
        const custoVid = captoFree * V
        const custoEd  = (N - edito) * E
        const lucro    = receita - custoVid - custoEd - fixoAno
        const diff     = lucro - meta
        // Casamentos novos: captados por ti (dia livre); editados pelo editor ou por ti
        const margemNovoEditor = media - E
        const margemNovoTu     = media
        const novosEditor = diff < 0 && margemNovoEditor > 0 ? Math.ceil(-diff / margemNovoEditor) : 0
        const novosTu     = diff < 0 && margemNovoTu > 0 ? Math.ceil(-diff / margemNovoTu) : 0
        const fmtDia = (d: string) => d.split('-').reverse().slice(0, 2).join('/')
        if (N === 0) {
          return (
            <div className="rounded-2xl border border-gold/25 bg-gold/[0.04] p-5 text-center">
              <p className="text-[10px] tracking-[0.35em] text-gold/70 uppercase">Previsão {ano}</p>
              <p className="text-[12px] text-white/45 mt-2">Ainda não há casamentos marcados em {ano}.</p>
            </div>
          )
        }
        return (
          <div className="rounded-2xl border border-gold/25 bg-gold/[0.04] p-5 space-y-4">
            <div className="text-center">
              <p className="text-[10px] tracking-[0.35em] text-gold/70 uppercase">Previsão {ano} com os casamentos marcados</p>
              <p className="text-[11px] text-white/40 mt-1">
                Só o valor dos vídeos. Num dia com mais de um casamento, o segundo é do videógrafo freelancer.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { l: 'Casamentos marcados', v: String(N), s: `${porDia.size} dias diferentes`, c: 'text-white/80' },
                { l: 'Captas tu', v: String(captoEu), s: 'um por dia', c: 'text-gold' },
                { l: 'Videógrafo freelancer', v: String(captoFree), s: diasDuplos.length ? `dias ${diasDuplos.map(([d]) => fmtDia(d)).join(', ')}` : 'nenhum dia duplo', c: 'text-red-300/80' },
                { l: 'Receita de vídeo', v: eur(receita), s: `média ${eur(media)}${semValor ? ` · ${semValor} sem valor` : ''}`, c: 'text-green-400' },
              ].map(k => (
                <div key={k.l} className="rounded-xl border border-white/[0.08] bg-black/20 p-3 text-center">
                  <p className="text-[9px] tracking-[0.25em] text-white/30 uppercase mb-1">{k.l}</p>
                  <p className={`text-xl font-light font-mono ${k.c}`}>{k.v}</p>
                  <p className="text-[9px] text-white/25 mt-0.5">{k.s}</p>
                </div>
              ))}
            </div>

            {/* Régua: quantos casamentos editas tu */}
            <div className="rounded-xl border border-white/[0.08] bg-black/20 p-4 space-y-3">
              <div className="flex items-center gap-4">
                <span className="text-[11px] text-white/50 w-40 shrink-0">Casamentos que editas tu</span>
                <input type="range" min={0} max={N} step={1} value={edito}
                  onChange={e => set({ editoEu: Number(e.target.value) })}
                  className="flex-1 accent-yellow-400" />
                <span className="text-lg font-mono text-gold w-10 text-right">{edito}</span>
              </div>
              <p className="text-[10px] text-white/30 text-right">o editor faz {N - edito} · poupas {eur(edito * E)}</p>

              <div className="border-t border-white/[0.06] pt-3 space-y-1 text-[12px]">
                {[
                  { l: 'Receita de vídeo', v: receita, c: 'text-green-400/80' },
                  { l: `Videógrafo freelancer (${captoFree} × ${eur(V)})`, v: -custoVid, c: 'text-red-300/70' },
                  { l: `Editor (${N - edito} × ${eur(E)})`, v: -custoEd, c: 'text-red-300/70' },
                  { l: 'Custos fixos do ano', v: -fixoAno, c: 'text-red-300/70' },
                ].map(r => (
                  <div key={r.l} className="flex justify-between">
                    <span className="text-white/45">{r.l}</span>
                    <span className={`font-mono ${r.c}`}>{r.v < 0 ? '−' : ''}{eur(Math.abs(r.v))}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-white/[0.06] pt-2 mt-1">
                  <span className="text-white/70 font-medium">Lucro previsto</span>
                  <span className={`font-mono text-lg ${lucro >= 0 ? 'text-green-400' : 'text-red-400'}`}>{lucro < 0 ? '−' : ''}{eur(Math.abs(lucro))}</span>
                </div>
                <p className="text-[10px] text-white/30 text-right">{eur(lucro / 12)} por mês</p>
              </div>
            </div>

            {/* Meta */}
            <div className={`rounded-xl border p-4 text-center ${diff >= 0 ? 'border-green-500/25 bg-green-500/[0.05]' : 'border-red-500/25 bg-red-500/[0.05]'}`}>
              <p className="text-[10px] tracking-[0.3em] text-white/35 uppercase mb-1">Meta de lucro {eur(meta)} (muda nos Objetivos)</p>
              {diff >= 0 ? (
                <p className="text-sm text-green-400">Meta atingida com os casamentos já marcados. Sobram {eur(diff)}.</p>
              ) : (
                <>
                  <p className="text-sm text-red-400">Faltam {eur(-diff)}.</p>
                  <p className="text-[12px] text-white/60 mt-2">
                    Precisas de mais <span className="text-gold font-mono text-base">{novosEditor}</span> casamentos
                    (a {eur(media)} de média, captados por ti e editados pelo editor),
                    ou <span className="text-gold font-mono text-base">{novosTu}</span> se também os editares tu.
                  </p>
                  <p className="text-[10px] text-white/30 mt-1">
                    Total no ano: {N + novosEditor} casamentos ({N + novosTu} se editares os novos).
                    Os novos têm de cair em dias livres para seres tu a captar.
                  </p>
                </>
              )}
            </div>
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
