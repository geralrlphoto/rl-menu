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

// Ignora acentos e maiúsculas, para "orcamento" encontrar "Orçamento"
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export default function MenuGrid({ items }: { items: MenuItem[] }) {
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
        .mg .mg-barra { display: flex; flex-wrap: wrap; align-items: center; gap: 14px 22px; margin-bottom: 34px; }
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
        .mg .mg-grelha {
          display: grid; gap: 14px;
          grid-template-columns: repeat(auto-fill, minmax(268px, 1fr));
        }
        .mg .mg-cartao {
          position: relative; display: flex; flex-direction: column; gap: 14px;
          padding: 22px 22px 20px; border: 1px solid var(--line-soft); border-radius: 12px;
          background: rgba(243,237,226,.012); text-decoration: none;
          transition: border-color .35s var(--ease), background .35s var(--ease), transform .35s var(--ease);
        }
        .mg .mg-cartao:hover, .mg .mg-cartao.mg-on {
          border-color: var(--g); background: rgba(216,190,147,.06); transform: translateY(-3px);
        }
        .mg .mg-cartao:focus-visible { outline: 2px solid var(--g); outline-offset: 3px; }
        .mg .mg-topo { display: flex; align-items: center; justify-content: space-between; }
        .mg .mg-num { font-family: var(--fm); font-size: 10px; letter-spacing: .28em; color: var(--tx-dim); }
        .mg .mg-seta { font-size: 15px; color: var(--tx-dim); transition: color .35s var(--ease), transform .35s var(--ease); }
        .mg .mg-cartao:hover .mg-seta, .mg .mg-cartao.mg-on .mg-seta { color: var(--g); transform: translateX(3px); }
        .mg .mg-icone { width: 26px; height: 26px; color: var(--g); opacity: .75; }
        .mg .mg-icone svg { width: 100%; height: 100%; }
        .mg .mg-nome {
          font-family: var(--fs); font-weight: 300; font-size: 27px; line-height: 1.05;
          color: var(--tx); letter-spacing: -.01em;
        }
        .mg .mg-desc { font-family: var(--fb); font-weight: 300; font-size: 13px; line-height: 1.5; color: var(--tx-mid); }
        .mg .mg-vazio { padding: 54px 0; text-align: center; }
        @media (prefers-reduced-motion: reduce) {
          .mg .mg-cartao { transition: none; }
          .mg .mg-cartao:hover, .mg .mg-cartao.mg-on { transform: none; }
        }
      `}</style>

      <div className="mg-barra">
        <div className="mg-busca">
          <label htmlFor="mg-q" className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
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
              {g.n} <span style={{ opacity: .55 }}>{contagem[g.k]}</span>
            </button>
          ))}
        </div>
      </div>

      {visiveis.length > 0 ? (
        <div className="mg-grelha">
          {visiveis.map((it, i) => {
            const conteudo = (
              <>
                <div className="mg-topo">
                  <span className="mg-num">{String(it.idx).padStart(2, '0')}</span>
                  <span className="mg-seta" aria-hidden="true">{it.internal ? '→' : '↗'}</span>
                </div>
                <div className="mg-icone" aria-hidden="true">{it.icon}</div>
                <div>
                  <p className="mg-nome">{it.label}</p>
                  <p className="mg-desc">{it.desc}</p>
                </div>
              </>
            )
            const cls = `mg-cartao${i === sel ? ' mg-on' : ''}`
            return it.internal
              ? <Link key={it.href + it.idx} href={it.href} className={cls} onMouseEnter={() => setSel(i)}>{conteudo}</Link>
              : <a key={it.href + it.idx} href={it.href} target="_blank" rel="noopener noreferrer" className={cls} onMouseEnter={() => setSel(i)}>{conteudo}</a>
          })}
        </div>
      ) : (
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
