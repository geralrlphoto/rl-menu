'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'

export type MenuItem = {
  href: string
  label: string
  desc: string
  group: 'op' | 'cli' | 'eq'
  internal: boolean
  idx: number
  icon: React.ReactNode
}

type Grupo = 'all' | 'op' | 'cli' | 'eq'

const GRUPOS: { k: Grupo; n: string }[] = [
  { k: 'all', n: 'Tudo' },
  { k: 'op', n: 'Operação' },
  { k: 'cli', n: 'Clientes' },
  { k: 'eq', n: 'Equipa & Metas' },
]

const NOME_GRUPO: Record<'op' | 'cli' | 'eq', string> = {
  op: 'Operação', cli: 'Clientes', eq: 'Equipa & Metas',
}

// Ignora acentos e maiúsculas: "orcamento" encontra "Orçamento"
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// `nomes` troca o nome de um grupo só nesta secção (ex.: Menu Geral: Clientes → Estratégias Social Media)
export default function MenuGrid({ items, nomes }: { items: MenuItem[]; nomes?: Partial<Record<'op' | 'cli' | 'eq', string>> }) {
  const [q, setQ] = useState('')
  const [grupo, setGrupo] = useState<Grupo>('all')
  const [sel, setSel] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const contagem = useMemo(() => {
    const c: Record<Grupo, number> = { all: items.length, op: 0, cli: 0, eq: 0 }
    items.forEach(i => { c[i.group] += 1 })
    return c
  }, [items])

  const visiveis = useMemo(() => {
    const termo = norm(q.trim())
    return items.filter(it =>
      (grupo === 'all' || it.group === grupo) &&
      (!termo || norm(it.label).includes(termo) || norm(it.desc).includes(termo))
    )
  }, [items, q, grupo])

  useEffect(() => { setSel(0) }, [q, grupo])

  // Uma fila por grupo presente no que está visível
  const filas = useMemo(() => (['op', 'cli', 'eq'] as const)
    .map(g => ({ g, itens: visiveis.filter(i => i.group === g) }))
    .filter(f => f.itens.length > 0), [visiveis])

  // Teclado: "/" procura, setas navegam, Enter abre, Esc limpa
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const noCampo = document.activeElement === inputRef.current
      if (e.key === '/' && !noCampo) { e.preventDefault(); inputRef.current?.focus(); return }
      if (e.key === 'Escape') { setQ(''); inputRef.current?.blur(); return }
      if (visiveis.length === 0) return
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); setSel(s => (s + 1) % visiveis.length) }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); setSel(s => (s - 1 + visiveis.length) % visiveis.length) }
      if (e.key === 'Enter' && noCampo) {
        const it = visiveis[sel]
        if (it) window.location.href = it.href
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [visiveis, sel])

  return (
    <div className="mg">
      <style>{`
        .mg .mg-barra { display: flex; flex-wrap: wrap; align-items: center; gap: 14px 22px; margin-bottom: 40px; }
        .mg .mg-busca { position: relative; flex: 1 1 260px; min-width: 220px; }
        .mg .mg-busca input {
          width: 100%; background: transparent; border: none;
          border-bottom: 1px solid var(--line); color: var(--tx);
          font-family: var(--fd); font-weight: 300; font-size: 19px;
          padding: 8px 64px 13px 0; outline: none; transition: border-color .4s var(--ease);
        }
        .mg .mg-busca input::placeholder { color: var(--tx-dim); }
        .mg .mg-busca input:focus { border-color: var(--g); }
        .mg .mg-atalho {
          position: absolute; right: 0; top: 10px; pointer-events: none;
          font-family: var(--fm); font-size: 10px; letter-spacing: .14em; color: var(--tx-dim);
          border: 1px solid var(--line-soft); border-radius: 5px; padding: 3px 8px;
        }
        .mg .mg-chips { display: flex; flex-wrap: wrap; gap: 8px; }

        .mg .mg-seccao { margin-bottom: 34px; }
        .mg .mg-rotulo { margin-bottom: 14px; }
        .mg .mg-fila { display: flex; gap: 10px; height: clamp(250px, 38vh, 340px); }

        .mg .mg-painel {
          position: relative; flex: 1 1 0; min-width: 64px; overflow: hidden;
          border: 1px solid var(--line-soft); border-radius: 16px; text-decoration: none;
          background: rgba(243,237,226,.015);
          transition: flex-grow .6s var(--ease), border-color .45s var(--ease), background .45s var(--ease);
        }
        .mg .mg-painel.aberto, .mg .mg-painel:hover {
          flex-grow: 4.4; border-color: rgba(216,190,147,.55); background: rgba(216,190,147,.055);
        }
        /* Com o rato dentro da fila é o rato que manda, não o painel seleccionado */
        .mg .mg-fila:hover .mg-painel.aberto:not(:hover) {
          flex-grow: 1; border-color: var(--line-soft); background: rgba(243,237,226,.015);
        }
        .mg .mg-painel:focus-visible { outline: 2px solid var(--g); outline-offset: 3px; }

        /* Fechado: nome na vertical, a ler de baixo para cima */
        .mg .mg-fechado {
          position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
          gap: 18px; flex-direction: column; padding: 18px 0;
          opacity: 1; transition: opacity .35s var(--ease);
        }
        .mg .mg-painel.aberto .mg-fechado, .mg .mg-painel:hover .mg-fechado { opacity: 0; pointer-events: none; }
        .mg .mg-fila:hover .mg-painel.aberto:not(:hover) .mg-fechado { opacity: 1; }
        .mg .mg-vert {
          writing-mode: vertical-rl; transform: rotate(180deg);
          font-family: var(--fs); font-weight: 300; font-size: clamp(19px, 2.1vw, 25px);
          letter-spacing: .06em; color: var(--tx-mid); white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis; max-height: 74%;
        }
        .mg .mg-vert-num { font-family: var(--fm); font-size: 10px; letter-spacing: .28em; color: var(--tx-dim); }

        /* Aberto: conteúdo completo */
        .mg .mg-conteudo {
          position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: space-between;
          padding: clamp(18px, 2.6vh, 28px) clamp(20px, 2vw, 30px);
          opacity: 0; transition: opacity .45s var(--ease) .12s; pointer-events: none;
        }
        .mg .mg-painel.aberto .mg-conteudo, .mg .mg-painel:hover .mg-conteudo { opacity: 1; }
        .mg .mg-fila:hover .mg-painel.aberto:not(:hover) .mg-conteudo { opacity: 0; }
        .mg .mg-topo { display: flex; align-items: center; justify-content: space-between; gap: 14px; }
        .mg .mg-num { font-family: var(--fm); font-size: 10px; letter-spacing: .28em; color: var(--g); }
        .mg .mg-icone { width: 30px; height: 30px; color: var(--g); opacity: .8; }
        .mg .mg-icone svg { width: 100%; height: 100%; }
        .mg .mg-nome {
          font-family: var(--fs); font-weight: 300; font-size: clamp(30px, 3.6vw, 52px);
          line-height: 1.02; letter-spacing: -.01em; color: var(--tx);
        }
        .mg .mg-desc { font-family: var(--fb); font-weight: 300; font-size: 13.5px; line-height: 1.55; color: var(--tx-mid); margin-top: 10px; max-width: 34ch; }
        .mg .mg-risca { height: 1px; background: var(--g); opacity: .55; margin: 18px 0 16px; transform-origin: left; transform: scaleX(0); transition: transform .7s var(--ease) .18s; }
        .mg .mg-painel.aberto .mg-risca, .mg .mg-painel:hover .mg-risca { transform: scaleX(1); }
        .mg .mg-fila:hover .mg-painel.aberto:not(:hover) .mg-risca { transform: scaleX(0); }
        .mg .mg-accao { display: flex; align-items: center; justify-content: space-between; gap: 14px; }
        .mg .mg-accao span { font-family: var(--fm); font-size: 10px; letter-spacing: .3em; text-transform: uppercase; color: var(--tx-mid); }
        .mg .mg-bola {
          width: 42px; height: 42px; flex: none; border-radius: 50%; border: 1px solid rgba(216,190,147,.5);
          display: grid; place-items: center; color: var(--g); font-size: 15px;
          transition: background .35s var(--ease), transform .35s var(--ease);
        }
        .mg .mg-painel:hover .mg-bola { background: rgba(216,190,147,.14); transform: translateX(3px); }

        .mg .mg-vazio { padding: 54px 0; text-align: center; }

        @media (max-width: 760px) {
          .mg .mg-fila { flex-direction: column; height: auto; }
          .mg .mg-painel { min-height: 68px; flex: none; }
          .mg .mg-painel.aberto { min-height: 240px; }
          .mg .mg-fechado { flex-direction: row; justify-content: flex-start; padding: 0 20px; gap: 14px; }
          .mg .mg-vert { writing-mode: horizontal-tb; transform: none; font-size: 21px; max-height: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .mg .mg-painel, .mg .mg-fechado, .mg .mg-conteudo, .mg .mg-risca { transition: none; }
          .mg .mg-risca { transform: scaleX(1); }
        }
      `}</style>

      <div className="mg-barra">
        <div className="mg-busca">
          <label htmlFor="mg-q" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
            Procurar secção
          </label>
          <input id="mg-q" ref={inputRef} type="search" value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Procurar secção..." autoComplete="off" />
          <span className="mg-atalho" aria-hidden="true">{q ? 'esc' : '/'}</span>
        </div>

        <div className="mg-chips">
          {GRUPOS.map(g => (
            <button key={g.k} type="button" onClick={() => setGrupo(g.k)}
              aria-pressed={grupo === g.k}
              className={`pill${grupo === g.k ? ' on' : ''}`}>
              {(g.k !== 'all' && nomes?.[g.k]) || g.n} <span style={{ opacity: .55 }}>{contagem[g.k]}</span>
            </button>
          ))}
        </div>
      </div>

      {filas.length > 0 ? filas.map(fila => {
        // O painel aberto é o seleccionado; se a selecção estiver noutra fila, abre o primeiro
        const naFila = fila.itens.findIndex(i => visiveis.indexOf(i) === sel)
        const aberto = naFila >= 0 ? naFila : 0
        return (
          <section key={fila.g} className="mg-seccao">
            <p className="eyebrow mg-rotulo">{nomes?.[fila.g] ?? NOME_GRUPO[fila.g]}</p>
            <div className="mg-fila">
              {fila.itens.map((it, i) => {
                const estaAberto = i === aberto
                const conteudo = (
                  <>
                    <div className="mg-fechado" aria-hidden="true">
                      <span className="mg-vert-num">{String(it.idx).padStart(2, '0')}</span>
                      <span className="mg-vert">{it.label}</span>
                    </div>
                    <div className="mg-conteudo" aria-hidden="true">
                      <div className="mg-topo">
                        <span className="mg-num">{String(it.idx).padStart(2, '0')}</span>
                        <span className="mg-icone">{it.icon}</span>
                      </div>
                      <div>
                        <p className="mg-nome">{it.label}</p>
                        <p className="mg-desc">{it.desc}</p>
                        <div className="mg-risca" />
                        <div className="mg-accao">
                          <span>{it.internal ? 'Abrir secção' : 'Abrir no Notion'}</span>
                          <span className="mg-bola" aria-hidden="true">{it.internal ? '→' : '↗'}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )
                const cls = `mg-painel${estaAberto ? ' aberto' : ''}`
                const aoFocar = () => setSel(visiveis.indexOf(it))
                return it.internal
                  ? <Link key={it.href + it.idx} href={it.href} className={cls}
                      onMouseEnter={aoFocar} onFocus={aoFocar} aria-label={it.label}>{conteudo}</Link>
                  : <a key={it.href + it.idx} href={it.href} target="_blank" rel="noopener noreferrer" className={cls}
                      onMouseEnter={aoFocar} onFocus={aoFocar} aria-label={it.label}>{conteudo}</a>
              })}
            </div>
          </section>
        )
      }) : (
        <div className="mg-vazio">
          <p style={{ fontFamily: 'var(--fs)', fontSize: '26px', fontWeight: 300, color: 'var(--tx-mid)' }}>
            Nada com <em style={{ color: 'var(--g)' }}>{q}</em>
          </p>
          <button type="button" className="btn-ghost" style={{ marginTop: '16px' }}
            onClick={() => { setQ(''); setGrupo('all') }}>
            Limpar procura
          </button>
        </div>
      )}
    </div>
  )
}
