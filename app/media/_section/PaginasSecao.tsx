'use client'

import { useMemo, useState } from 'react'

export type PaginaSecao = { id: string; title: string | null; notion_url: string | null }

// Nome curto do destino do link (Notion, Google Drive, domínio…)
function destino(url: string | null): string {
  if (!url) return 'Sem link'
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    if (host.includes('notion')) return 'Notion'
    if (host.includes('docs.google')) return 'Google Docs'
    if (host.includes('drive.google')) return 'Google Drive'
    return host
  } catch {
    return 'Link'
  }
}

// Comparação sem acentos nem maiúsculas
const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const IconeExterno = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    className="w-4 h-4" aria-hidden>
    <path d="M14 4h6v6M20 4l-9 9M18 14v4a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h4" />
  </svg>
)

const IconeBusca = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    className="w-4 h-4" aria-hidden>
    <path d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
  </svg>
)

export default function PaginasSecao({ paginas, nomeSecao }: { paginas: PaginaSecao[]; nomeSecao: string }) {
  const [busca, setBusca] = useState('')

  const filtradas = useMemo(() => {
    const q = normalizar(busca.trim())
    if (!q) return paginas.map((p, i) => ({ p, n: i + 1 }))
    return paginas
      .map((p, i) => ({ p, n: i + 1 }))
      .filter(({ p }) => normalizar(`${p.title ?? ''} ${destino(p.notion_url)}`).includes(q))
  }, [busca, paginas])

  // Sem páginas nenhumas na secção
  if (paginas.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/[0.14] bg-[#00141f]/70 px-6 py-14 text-center">
        <span className="mx-auto w-12 h-12 rounded-full border border-[#2e6cf6]/50 flex items-center justify-center text-[#5a8bff]">
          <IconeExterno />
        </span>
        <p className="mt-5 rlp-t text-[22px]">Ainda não há páginas</p>
        <p className="mt-2 max-w-md mx-auto text-[13.5px] leading-relaxed text-white/55">
          As páginas de {nomeSecao} aparecem aqui assim que forem ligadas à secção.
          Para acrescentar uma, cria uma linha na tabela <span className="rlp-m text-[11px] text-[#a9c1ff]">media_pages</span> com
          o título e o link do Notion.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Barra: contagem + pesquisa */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <p className="rlp-m text-[10px] text-[#7c8893]">
          {busca.trim()
            ? `${filtradas.length} de ${paginas.length} ${paginas.length === 1 ? 'página' : 'páginas'}`
            : `${paginas.length} ${paginas.length === 1 ? 'página' : 'páginas'}`}
        </p>
        <label className="relative w-full sm:w-80">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7c8893]"><IconeBusca /></span>
          <input
            type="search"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Procurar página…"
            aria-label="Procurar página"
            className="w-full rounded-full border border-white/[0.1] bg-[#00141f]/70 pl-11 pr-4 py-2.5 text-[13.5px] text-white
                       placeholder:text-white/35 outline-none focus:border-[#2e6cf6] transition-colors"
          />
        </label>
      </div>

      {filtradas.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.1] bg-[#00141f]/70 px-6 py-10 text-center">
          <p className="text-[14px] text-white/75">Nenhuma página corresponde a “{busca.trim()}”.</p>
          <button type="button" onClick={() => setBusca('')}
            className="mt-4 inline-flex items-center rounded-full border border-[#2e6cf6]/70 px-4 py-1.5 text-[12px] text-[#5a8bff] hover:bg-[#2e6cf6]/10 transition-colors">
            Limpar pesquisa
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtradas.map(({ p, n }) => {
            const conteudo = (
              <>
                <span className="flex items-start justify-between gap-3">
                  <span className="rlp-m text-[10px] text-[#5a8bff]/80">{String(n).padStart(2, '0')}</span>
                  <span className={p.notion_url ? 'text-white/35 group-hover:text-[#5a8bff] transition-colors' : 'text-white/15'}>
                    <IconeExterno />
                  </span>
                </span>
                <span className="mt-4 block text-[15px] leading-snug text-white/90 group-hover:text-white">
                  {p.title || 'Sem título'}
                </span>
                <span className="mt-auto pt-4 block rlp-m text-[10px] text-[#7c8893] truncate">{destino(p.notion_url)}</span>
              </>
            )
            return p.notion_url ? (
              <a key={p.id} href={p.notion_url} target="_blank" rel="noopener noreferrer"
                className="group flex flex-col min-h-[132px] rounded-2xl border border-white/[0.1] bg-[#00141f]/70 px-5 py-4
                           hover:border-[#2e6cf6]/70 hover:bg-[#0c2236]/80 hover:-translate-y-0.5 transition-all">
                {conteudo}
              </a>
            ) : (
              <div key={p.id} title="Esta página ainda não tem link"
                className="flex flex-col min-h-[132px] rounded-2xl border border-dashed border-white/[0.1] bg-[#00141f]/50 px-5 py-4 opacity-70">
                {conteudo}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
