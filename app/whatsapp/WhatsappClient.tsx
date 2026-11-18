'use client'

import { useCallback, useEffect, useState } from 'react'

type Sugestao = {
  id: string
  cliente: string
  telefone: string | null
  referencia: string | null
  mensagem_cliente: string | null
  sugestao: string
  estado: 'pendente' | 'enviada' | 'arquivada'
  created_at: string
}

const SEPARADORES = [
  { id: 'pendente', label: 'Por enviar' },
  { id: 'enviada', label: 'Enviadas' },
  { id: 'arquivada', label: 'Arquivadas' },
] as const

/** 912345678 → 351912345678; +351 912… → 351912… */
function numeroWa(tel: string | null): string {
  const d = (tel ?? '').replace(/\D/g, '')
  if (d.length === 9) return `351${d}`
  return d.replace(/^00/, '')
}

function dataCurta(iso: string) {
  return new Date(iso).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function WhatsappClient() {
  const [estado, setEstado] = useState<Sugestao['estado']>('pendente')
  const [lista, setLista] = useState<Sugestao[] | null>(null)
  const [erro, setErro] = useState('')

  const carregar = useCallback(async () => {
    setLista(null)
    setErro('')
    try {
      const r = await fetch(`/api/whatsapp-sugestoes?estado=${estado}`, { cache: 'no-store' })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error ?? 'erro')
      setLista(j.sugestoes)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'erro')
      setLista([])
    }
  }, [estado])

  useEffect(() => { carregar() }, [carregar])

  return (
    <section className="pl-11 sm:pl-16 lg:pl-24 pr-5 sm:pr-16 pb-24">
      <div className="flex flex-wrap items-center gap-2 mb-8">
        {SEPARADORES.map(s => (
          <button
            key={s.id}
            onClick={() => setEstado(s.id)}
            className={`px-4 py-2 text-[13px] tracking-[0.2em] uppercase border transition-colors ${
              estado === s.id ? 'border-[#C9A84C] text-[#C9A84C]' : 'border-white/15 text-white/50 hover:text-white'
            }`}
          >
            {s.label}
          </button>
        ))}
        <button onClick={carregar} className="ml-auto text-[13px] text-white/40 hover:text-[#C9A84C]">Atualizar</button>
      </div>

      {erro && <p className="text-red-400 text-[14px] mb-6">Erro: {erro}</p>}
      {lista === null && <p className="text-white/40">A carregar…</p>}
      {lista && lista.length === 0 && !erro && (
        <p className="text-white/40 font-light max-w-xl leading-relaxed">
          Nada aqui. No Claude Code diz &quot;responde à [nome]&quot; e a sugestão aparece nesta lista.
        </p>
      )}

      <div className="grid gap-6 max-w-3xl">
        {lista?.map(s => <Cartao key={s.id} s={s} onMudou={carregar} />)}
      </div>
    </section>
  )
}

function Cartao({ s, onMudou }: { s: Sugestao; onMudou: () => void }) {
  const [texto, setTexto] = useState(s.sugestao)
  const [copiado, setCopiado] = useState(false)
  const [aGuardar, setAGuardar] = useState(false)
  const numero = numeroWa(s.telefone)

  async function patch(body: Record<string, string>) {
    setAGuardar(true)
    await fetch('/api/whatsapp-sugestoes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id, ...body }),
    }).catch(() => {})
    setAGuardar(false)
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1800)
    } catch { /* sem permissão de clipboard */ }
    if (texto !== s.sugestao) patch({ sugestao: texto })
  }

  function abrirWhatsapp() {
    if (texto !== s.sugestao) patch({ sugestao: texto })
    const url = numero
      ? `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`
      : `https://wa.me/?text=${encodeURIComponent(texto)}`
    window.open(url, '_blank', 'noopener')
  }

  async function mudarEstado(novo: Sugestao['estado']) {
    await patch({ estado: novo, sugestao: texto })
    onMudou()
  }

  return (
    <article className="border border-white/10 bg-white/[0.02] p-5 sm:p-6">
      <header className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 className="text-[22px] font-bold uppercase tracking-wide">{s.cliente}</h2>
        {s.referencia && <span className="text-[12px] tracking-[0.2em] text-[#C9A84C]">{s.referencia}</span>}
        <span className="ml-auto text-[12px] text-white/35">{dataCurta(s.created_at)}</span>
      </header>
      {s.telefone && <p className="text-[13px] text-white/40 mt-1">{s.telefone}</p>}

      {s.mensagem_cliente && (
        <div className="mt-5">
          <p className="text-[11px] tracking-[0.3em] uppercase text-white/35 mb-2">Cliente escreveu</p>
          <p className="whitespace-pre-line text-[15px] font-light text-white/70 border-l-2 border-white/15 pl-4">{s.mensagem_cliente}</p>
        </div>
      )}

      <div className="mt-5">
        <p className="text-[11px] tracking-[0.3em] uppercase text-[#C9A84C] mb-2">Resposta sugerida</p>
        <textarea
          value={texto}
          onChange={e => setTexto(e.target.value)}
          rows={Math.min(14, Math.max(5, texto.split('\n').length + 2))}
          className="w-full bg-black/40 border border-[#C9A84C]/30 focus:border-[#C9A84C] outline-none p-4 text-[15px] leading-relaxed text-white/90 font-sans"
        />
      </div>

      <div className="flex flex-wrap gap-3 mt-4">
        <button onClick={copiar} className="px-5 py-2.5 border border-[#C9A84C] text-[#C9A84C] hover:bg-[#C9A84C] hover:text-black text-[13px] tracking-[0.2em] uppercase transition-colors">
          {copiado ? 'Copiado' : 'Copiar'}
        </button>
        <button onClick={abrirWhatsapp} className="px-5 py-2.5 bg-[#25D366] text-black font-bold text-[13px] tracking-[0.2em] uppercase hover:opacity-90">
          Abrir no WhatsApp
        </button>
        {s.estado === 'pendente' ? (
          <>
            <button disabled={aGuardar} onClick={() => mudarEstado('enviada')} className="px-4 py-2.5 border border-white/15 text-white/60 hover:text-white text-[13px] tracking-[0.15em] uppercase">
              Marcar enviada
            </button>
            <button disabled={aGuardar} onClick={() => mudarEstado('arquivada')} className="px-4 py-2.5 text-white/35 hover:text-white/70 text-[13px] tracking-[0.15em] uppercase">
              Arquivar
            </button>
          </>
        ) : (
          <button disabled={aGuardar} onClick={() => mudarEstado('pendente')} className="px-4 py-2.5 border border-white/15 text-white/60 hover:text-white text-[13px] tracking-[0.15em] uppercase">
            Voltar a por enviar
          </button>
        )}
      </div>
      {!numero && <p className="text-[12px] text-white/35 mt-3">Sem número: o WhatsApp abre e escolhes o contacto.</p>}
    </article>
  )
}
