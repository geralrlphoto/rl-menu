'use client'

import Link from 'next/link'
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
  data_mensagem: string | null
  link_ficha: string | null
  enviada_em: string | null
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

/** Dias desde a mensagem do cliente (à meia-noite de Lisboa, contado em dias de calendário). */
function diasDesde(iso: string): number {
  const dia = (d: Date) => new Date(d.toLocaleDateString('en-CA', { timeZone: 'Europe/Lisbon' })).getTime()
  return Math.max(0, Math.round((dia(new Date()) - dia(new Date(iso))) / 86_400_000))
}

function textoEspera(dias: number) {
  if (dias === 0) return 'Escreveu hoje'
  if (dias === 1) return 'À espera desde ontem'
  return `À espera há ${dias} dias`
}

/** Pedaços [ASSIM] que o Claude deixou para o Rui preencher. */
function porPreencher(texto: string): string[] {
  return [...new Set(texto.match(/\[[^\]\n]{1,60}\]/g) ?? [])]
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
            {s.id === 'pendente' && estado === 'pendente' && lista && lista.length > 0 && (
              <span className="ml-2 text-white/60">{lista.length}</span>
            )}
          </button>
        ))}
        <button onClick={carregar} className="ml-auto text-[13px] text-white/40 hover:text-[#C9A84C]">Atualizar</button>
      </div>

      {erro && <p className="text-red-400 text-[14px] mb-6">Erro: {erro}</p>}
      {lista === null && <p className="text-white/40">A carregar…</p>}
      {lista && lista.length === 0 && !erro && (
        <p className="text-white/40 font-light max-w-xl leading-relaxed">
          Nada por responder. No Claude Code diz &quot;ler mensagens&quot; e as sugestões aparecem aqui.
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
  const [telefone, setTelefone] = useState(s.telefone ?? '')
  const [aEditarTel, setAEditarTel] = useState(!s.telefone)
  const [copiado, setCopiado] = useState(false)
  const [aGuardar, setAGuardar] = useState(false)
  // Primeiro clique com [ ] por preencher só avisa; o segundo segue à mesma.
  const [avisado, setAvisado] = useState<'' | 'copiar' | 'abrir'>('')

  const numero = numeroWa(telefone)
  const faltam = porPreencher(texto)
  const dias = diasDesde(s.data_mensagem ?? s.created_at)
  const pendente = s.estado === 'pendente'

  useEffect(() => { setAvisado('') }, [texto])

  async function patch(body: Record<string, string>) {
    setAGuardar(true)
    await fetch('/api/whatsapp-sugestoes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id, ...body }),
    }).catch(() => {})
    setAGuardar(false)
  }

  function guardarTexto() {
    if (texto !== s.sugestao) patch({ sugestao: texto })
  }

  function guardarTelefone() {
    if (telefone.trim() !== (s.telefone ?? '')) patch({ telefone })
    if (telefone.trim()) setAEditarTel(false)
  }

  function precisaAviso(accao: 'copiar' | 'abrir') {
    if (faltam.length > 0 && avisado !== accao) { setAvisado(accao); return true }
    return false
  }

  async function copiar() {
    if (precisaAviso('copiar')) return
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1800)
    } catch { /* sem permissão de clipboard */ }
    guardarTexto()
  }

  function abrirWhatsapp() {
    if (precisaAviso('abrir')) return
    guardarTexto()
    // WhatsApp Web numa janela própria na metade direita do ecrã, já na conversa
    // e com o texto escrito. O nome fixo faz com que a mesma janela seja reutilizada.
    const url = `https://web.whatsapp.com/send?${numero ? `phone=${numero}&` : ''}text=${encodeURIComponent(texto)}`
    const sw = window.screen.availWidth
    const sh = window.screen.availHeight
    const left = Math.round(sw / 2)
    const w = window.open(url, 'rl-whatsapp', `popup=yes,left=${left},top=0,width=${sw - left},height=${sh}`)
    if (w) { w.opener = null; w.focus() }
  }

  async function mudarEstado(novo: Sugestao['estado']) {
    await patch({ estado: novo, sugestao: texto })
    onMudou()
  }

  const corEspera = dias >= 7 ? 'text-red-400 border-red-400/40 bg-red-500/10'
    : dias >= 2 ? 'text-amber-300 border-amber-300/40 bg-amber-300/10'
    : 'text-white/60 border-white/15'

  return (
    <article className="border border-white/10 bg-white/[0.02] p-5 sm:p-6">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h2 className="text-[22px] font-bold uppercase tracking-wide">{s.cliente}</h2>
        {s.referencia && <span className="text-[12px] tracking-[0.2em] text-[#C9A84C]">{s.referencia}</span>}
        {pendente && (
          <span className={`ml-auto px-2.5 py-1 border text-[12px] tracking-[0.12em] uppercase ${corEspera}`}>
            {textoEspera(dias)}
          </span>
        )}
        {!pendente && (
          <span className="ml-auto text-[12px] text-white/35">
            {s.estado === 'enviada' && s.enviada_em ? `Enviada ${dataCurta(s.enviada_em)}` : dataCurta(s.created_at)}
          </span>
        )}
      </header>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-[13px]">
        {aEditarTel ? (
          <span className="flex items-center gap-2">
            <input
              value={telefone}
              onChange={e => setTelefone(e.target.value)}
              onBlur={guardarTelefone}
              onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
              placeholder="Número do cliente (ex.: 912 345 678)"
              className="bg-black/40 border border-white/20 focus:border-[#C9A84C] outline-none px-3 py-1.5 text-white/90 w-[260px] max-w-full"
            />
            {!telefone.trim() && <span className="text-white/35">Falta o número</span>}
          </span>
        ) : (
          <button onClick={() => setAEditarTel(true)} className="text-white/45 hover:text-[#C9A84C]" title="Alterar número">
            {telefone}
          </button>
        )}
        {s.link_ficha && (
          <Link href={s.link_ficha} target="_blank" className="text-[#C9A84C]/80 hover:text-[#C9A84C] tracking-[0.15em] uppercase text-[12px]">
            Ver ficha →
          </Link>
        )}
        {s.data_mensagem && <span className="text-white/30">Mensagem de {dataCurta(s.data_mensagem)}</span>}
      </div>

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
          onBlur={guardarTexto}
          rows={Math.min(14, Math.max(5, texto.split('\n').length + 2))}
          className={`w-full bg-black/40 border outline-none p-4 text-[15px] leading-relaxed text-white/90 font-sans ${
            faltam.length ? 'border-red-400/60 focus:border-red-400' : 'border-[#C9A84C]/30 focus:border-[#C9A84C]'
          }`}
        />
        {faltam.length > 0 && (
          <p className="mt-2 text-[13px] text-red-400">
            Falta preencher: {faltam.map(f => <span key={f} className="font-bold mr-2">{f}</span>)}
          </p>
        )}
      </div>

      {avisado && (
        <p className="mt-3 text-[13px] text-red-300">
          O texto ainda tem {faltam.join(', ')}. Preenche primeiro, ou carrega outra vez para {avisado === 'copiar' ? 'copiar' : 'abrir'} à mesma.
        </p>
      )}

      <div className="flex flex-wrap gap-3 mt-4">
        <button onClick={copiar} className="px-5 py-2.5 border border-[#C9A84C] text-[#C9A84C] hover:bg-[#C9A84C] hover:text-black text-[13px] tracking-[0.2em] uppercase transition-colors">
          {copiado ? 'Copiado' : 'Copiar'}
        </button>
        <button onClick={abrirWhatsapp} className="px-5 py-2.5 bg-[#25D366] text-black font-bold text-[13px] tracking-[0.2em] uppercase hover:opacity-90">
          Abrir no WhatsApp
        </button>
        {pendente ? (
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
