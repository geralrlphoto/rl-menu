'use client'

// Gestão › Departamento de Comunicação. Landing pages públicas para entregar aos
// clientes (ficheiros em public/lp, rota pública /lp/... no middleware).
// Cada landing tem: pré-visualização, abrir, copiar o link e WhatsApp de boas-vindas
// a pedir o preenchimento do formulário (wa.me manual, sem emojis).

import { useEffect, useRef, useState } from 'react'

const OURO = '#C9A84C'
const DOMINIO = 'https://portal.rlphotovideo.pt'

const LANDINGS = [
  {
    id: 'casamentos', nome: 'Casamentos', path: '/lp/casamentos',
    descricao: 'Fotografia e filme de casamento: teaser, portfólio, entregas e o formulário dos noivos no fim da página.',
  },
]

// 912 345 678 → 351912345678; com indicativo fica como está
function numeroWa(tel: string) {
  const d = tel.replace(/\D/g, '').replace(/^00/, '')
  if (!d) return ''
  return d.length === 9 ? '351' + d : d
}

function mensagemBoasVindas(nome: string, link: string) {
  const ola = nome.trim() ? `Olá ${nome.trim()}!` : 'Olá!'
  return `${ola} Obrigado pelo vosso contacto, é um prazer receber-vos na RL Photo · Video.

Preparámos uma página para conhecerem o nosso trabalho: ${link}

No fim da página está o nosso formulário. Pedimos que o preencham com calma, para prepararmos a conversa à medida do vosso dia.

Qualquer dúvida, estamos por aqui.`
}

function CartaoLanding({ l }: { l: typeof LANDINGS[number] }) {
  const link = DOMINIO + l.path
  const [copiado, setCopiado] = useState(false)
  const [nome, setNome] = useState('')
  const [tel, setTel] = useState('')
  const msg = mensagemBoasVindas(nome, link)
  const num = numeroWa(tel)
  const wa = `https://wa.me/${num}?text=${encodeURIComponent(msg)}`
  const caixa = useRef<HTMLAnchorElement>(null)
  const [esc, setEsc] = useState(0.5)
  useEffect(() => {
    const el = caixa.current; if (!el) return
    const ro = new ResizeObserver(() => setEsc(el.clientWidth / 1440))
    ro.observe(el); return () => ro.disconnect()
  }, [])

  async function copiar() {
    try { await navigator.clipboard.writeText(link) } catch {
      const t = document.createElement('textarea'); t.value = link; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove()
    }
    setCopiado(true); setTimeout(() => setCopiado(false), 2200)
  }

  return (
    <article className="rounded-[22px] border border-white/[0.08] bg-[#111111]/90 overflow-hidden grid lg:grid-cols-[1.25fr_1fr]" style={{ borderLeft: `2px solid ${OURO}` }}>
      {/* Pré-visualização (a página real, reduzida) */}
      <a ref={caixa} href={l.path} target="_blank" rel="noopener noreferrer" className="relative block bg-black overflow-hidden group" style={{ aspectRatio: '16 / 10' }} aria-label={`Abrir a landing ${l.nome}`}>
        <iframe src={l.path} title={`Pré-visualização ${l.nome}`} loading="lazy" tabIndex={-1}
          className="absolute top-0 left-0 border-0 pointer-events-none origin-top-left"
          style={{ width: '1440px', height: '900px', transform: `scale(${esc})` }} />
        <span className="absolute inset-0 flex items-end justify-end p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="rounded-full border border-[#C9A84C]/60 bg-black/60 px-4 py-2 text-[11px] font-semibold tracking-[0.2em] uppercase" style={{ color: OURO }}>Abrir ↗</span>
        </span>
      </a>

      <div className="p-6 sm:p-8 flex flex-col gap-5">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.3em] uppercase" style={{ color: OURO }}>Landing page</p>
          <h2 className="mt-2 text-3xl font-semibold">{l.nome}</h2>
          <p className="mt-2 text-[14px] text-white/55 leading-relaxed">{l.descricao}</p>
        </div>

        {/* Link + copiar */}
        <div className="flex items-stretch gap-2">
          <code className="flex-1 min-w-0 truncate rounded-full border border-white/10 bg-black/40 px-4 py-2.5 text-[13px] text-white/75">{link}</code>
          <button type="button" onClick={copiar}
            className="shrink-0 rounded-full border px-5 py-2.5 text-[11px] font-semibold tracking-[0.16em] uppercase transition-colors"
            style={copiado ? { borderColor: 'rgba(74,222,128,.6)', color: '#4ade80', background: 'rgba(74,222,128,.1)' } : { borderColor: 'rgba(201,168,76,.55)', color: OURO, background: 'rgba(201,168,76,.1)' }}>
            {copiado ? 'Copiado ✓' : 'Copiar link'}
          </button>
        </div>

        {/* WhatsApp de boas-vindas */}
        <div className="rounded-[18px] border border-white/[0.08] bg-[#141414] p-4 flex flex-col gap-3">
          <p className="text-[11px] font-semibold tracking-[0.25em] uppercase text-white/50">Boas-vindas por WhatsApp</p>
          <div className="grid sm:grid-cols-2 gap-2">
            <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nomes (ex.: Ana e Paulo)"
              className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[14px] text-white outline-none focus:border-[#C9A84C]/60" />
            <input value={tel} onChange={e => setTel(e.target.value)} placeholder="Telemóvel (opcional)" inputMode="tel"
              className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[14px] text-white outline-none focus:border-[#C9A84C]/60" />
          </div>
          <p className="whitespace-pre-line rounded-lg bg-black/30 border border-white/[0.06] p-3 text-[13px] leading-relaxed text-white/65">{msg}</p>
          <a href={wa} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#25D366]/50 bg-[#25D366]/10 px-5 py-3 text-[12px] font-semibold tracking-[0.16em] uppercase text-[#4ade80] hover:bg-[#25D366]/20 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884M20.464 3.488A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            {num ? 'Enviar no WhatsApp' : 'Abrir no WhatsApp e escolher o contacto'}
          </a>
        </div>
      </div>
    </article>
  )
}

export default function ComunicacaoPage() {
  return (
    <main className="min-h-screen bg-[#070707] text-white font-cond overflow-x-clip">
      <section className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 70% at 85% 10%, rgba(201,168,76,0.12), transparent 70%)' }} />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-24 pb-12">
          <p className="text-[13px] font-bold tracking-[0.5em] uppercase" style={{ color: OURO }}>Gestão</p>
          <h1 className="mt-3 font-bold uppercase leading-[0.9] text-[44px] sm:text-[80px] lg:text-[100px]">Comunicação</h1>
          <div className="mt-5 flex items-center gap-4">
            <span className="w-12 h-px" style={{ background: OURO }} />
            <span className="text-sm tracking-[0.22em] uppercase text-white/60">Páginas para entregar aos clientes</span>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-12 flex flex-col gap-8">
        {LANDINGS.map(l => <CartaoLanding key={l.id} l={l} />)}
      </div>
    </main>
  )
}
