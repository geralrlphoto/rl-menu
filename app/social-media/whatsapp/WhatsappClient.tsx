'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

type Estado = 'pendente' | 'enviada' | 'arquivada'
type Separador = Estado | 'base'

type Sugestao = {
  id: string
  cliente: string
  telefone: string | null
  referencia: string | null
  mensagem_cliente: string | null
  sugestao: string
  estado: Estado
  created_at: string
  data_mensagem: string | null
  link_ficha: string | null
  enviada_em: string | null
  tema: string | null
  base: boolean
  lead_nova: boolean
  tarefa_prazo: string | null
}

const OURO = '#C9A84C'

const SEPARADORES: { id: Separador; label: string }[] = [
  { id: 'pendente', label: 'Por enviar' },
  { id: 'enviada', label: 'Enviadas' },
  { id: 'arquivada', label: 'Arquivadas' },
  { id: 'base', label: 'Respostas-base' },
]

/** 912345678 → 351912345678; +351 912… → 351912… */
function numeroWa(tel: string | null): string {
  const d = (tel ?? '').replace(/\D/g, '')
  if (d.length === 9) return `351${d}`
  return d.replace(/^00/, '')
}

function dataCurta(iso: string) {
  return new Date(iso).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}
function diaMes(isoDia: string) {
  const [, m, d] = isoDia.split('-')
  return `${d}/${m}`
}

/** Dias desde a mensagem do cliente (dias de calendário, em Lisboa). */
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

const botaoPilula = 'inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-semibold text-[14px] transition-all disabled:opacity-50'
const botaoOuro = `${botaoPilula} bg-[#0e0e0e]/90 text-white border border-[#C9A84C]/45 hover:border-[#C9A84C]/80 shadow-[0_0_28px_-12px_rgba(201,168,76,0.6)]`
const botaoDiscreto = `${botaoPilula} border border-white/[0.12] text-white/60 hover:text-white hover:border-white/30`

export default function WhatsappClient() {
  const [sep, setSep] = useState<Separador>('pendente')
  const [lista, setLista] = useState<Sugestao[] | null>(null)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')

  const carregar = useCallback(async () => {
    setLista(null)
    setErro('')
    try {
      const q = sep === 'base' ? 'base=1' : `estado=${sep}`
      const r = await fetch(`/api/whatsapp-sugestoes?${q}`, { cache: 'no-store' })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error ?? 'erro')
      setLista(j.sugestoes)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'erro')
      setLista([])
    }
  }, [sep])

  useEffect(() => { carregar() }, [carregar])
  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(''), 6000)
    return () => clearTimeout(t)
  }, [aviso])

  return (
    <section className="max-w-[1400px] mx-auto px-5 sm:px-10 lg:px-14 pt-6 pb-24">
      <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#C9A84C]">Atendimento</p>
      <h2 className="font-semibold text-white text-[28px] leading-tight mt-1 mb-6">Respostas aos clientes</h2>

      <div className="flex flex-wrap items-center gap-2 mb-8">
        {SEPARADORES.map(s => {
          const ativo = sep === s.id
          return (
            <button
              key={s.id}
              onClick={() => setSep(s.id)}
              className="rounded-full border px-4 py-2 text-[14px] font-semibold transition-colors"
              style={ativo
                ? { color: '#0b0b0b', background: OURO, borderColor: OURO }
                : { color: 'rgba(255,255,255,0.65)', background: 'rgba(201,168,76,0.06)', borderColor: 'rgba(201,168,76,0.25)' }}
            >
              {s.label}
              {s.id === 'pendente' && ativo && lista && lista.length > 0 && <span className="ml-2 opacity-70">{lista.length}</span>}
            </button>
          )
        })}
        <button onClick={carregar} className="ml-auto text-[14px] text-white/40 hover:text-[#C9A84C] transition-colors">Atualizar</button>
      </div>

      {aviso && (
        <div className="mb-6 rounded-[14px] border border-[#C9A84C]/40 bg-[#C9A84C]/10 px-5 py-3 text-[15px] text-[#e8d9b0]">{aviso}</div>
      )}
      {erro && <p className="text-red-400 text-[14px] mb-6">Erro: {erro}</p>}
      {lista === null && <p className="text-white/40">A carregar…</p>}
      {lista && lista.length === 0 && !erro && (
        <p className="text-white/40 font-light max-w-xl leading-relaxed text-[16px]">
          {sep === 'base'
            ? 'Ainda não há respostas-base. Nas Enviadas, carrega em "Guardar como base" nas respostas que se repetem (álbum, prazos, pagamentos…).'
            : sep === 'pendente'
              ? 'Nada por responder. No Claude Code diz "ler mensagens" e as sugestões aparecem aqui.'
              : 'Nada aqui.'}
        </p>
      )}

      <style>{`
        .wa-cartao { transition: border-color .4s ease, box-shadow .4s ease; }
        .wa-cartao:hover { border-color: rgba(216,190,147,.35); box-shadow: 0 0 50px -24px rgba(216,190,147,.55); }
      `}</style>
      <div className="grid gap-5 max-w-4xl">
        {lista?.map(s => <Cartao key={s.id} s={s} vista={sep} onMudou={carregar} onAviso={setAviso} />)}
      </div>
    </section>
  )
}

function Cartao({ s, vista, onMudou, onAviso }: {
  s: Sugestao; vista: Separador; onMudou: () => void; onAviso: (t: string) => void
}) {
  const [texto, setTexto] = useState(s.sugestao)
  const [telefone, setTelefone] = useState(s.telefone ?? '')
  const [aEditarTel, setAEditarTel] = useState(!s.telefone && vista === 'pendente')
  const [copiado, setCopiado] = useState(false)
  const [aGuardar, setAGuardar] = useState(false)
  // Primeiro clique com [ ] por preencher só avisa; o segundo segue à mesma.
  const [avisado, setAvisado] = useState<'' | 'copiar' | 'abrir'>('')
  const [tema, setTema] = useState(s.tema ?? '')
  const [aGuardarBase, setAGuardarBase] = useState(false)

  const numero = numeroWa(telefone)
  const faltam = porPreencher(texto)
  const dias = diasDesde(s.data_mensagem ?? s.created_at)
  const pendente = s.estado === 'pendente' && vista !== 'base'
  const naBase = vista === 'base'

  useEffect(() => { setAvisado('') }, [texto])

  async function patch(body: Record<string, string | boolean>) {
    setAGuardar(true)
    const r = await fetch('/api/whatsapp-sugestoes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id, ...body }),
    }).then(x => x.json()).catch(() => null)
    setAGuardar(false)
    return r as { ok?: boolean; tarefa_prazo?: string | null } | null
  }

  function guardarTexto() {
    if (!naBase && texto !== s.sugestao) patch({ sugestao: texto })
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

  async function mudarEstado(novo: Estado) {
    const r = await patch({ estado: novo, sugestao: texto })
    if (novo === 'enviada') {
      onAviso(r?.tarefa_prazo
        ? `Enviada. A resposta tem uma promessa: criei uma tarefa para ${diaMes(r.tarefa_prazo)} em Tarefas.`
        : 'Marcada como enviada.')
    }
    onMudou()
  }

  async function alternarBase(valor: boolean) {
    setAGuardarBase(true)
    await patch({ base: valor, tema })
    setAGuardarBase(false)
    onAviso(valor ? `Guardada como resposta-base${tema.trim() ? ` (${tema.trim()})` : ''}.` : 'Retirada das respostas-base.')
    onMudou()
  }

  const corEspera = dias >= 7 ? 'text-red-300 border-red-400/40 bg-red-500/10'
    : dias >= 2 ? 'text-amber-200 border-amber-300/40 bg-amber-300/10'
    : 'text-white/60 border-white/15 bg-white/[0.03]'

  const criarLeadUrl = `/crm/nova?${new URLSearchParams({
    nome: s.cliente, contato: telefone, mensagem: s.mensagem_cliente ?? '',
  }).toString()}`

  return (
    <article className="wa-cartao relative rounded-[20px] border border-white/[0.1] bg-[#0e0e0e]/70 p-5 sm:p-7">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h3 className="font-semibold text-[24px] leading-tight text-white">{naBase && s.tema ? s.tema : s.cliente}</h3>
        {s.referencia && !naBase && (
          <span className="rounded-full border px-2.5 py-0.5 text-[12.5px] font-semibold" style={{ color: OURO, background: 'rgba(201,168,76,0.12)', borderColor: 'rgba(201,168,76,0.3)' }}>
            {s.referencia}
          </span>
        )}
        {pendente && (
          <span className={`ml-auto rounded-full border px-3 py-1 text-[13px] font-semibold ${corEspera}`}>{textoEspera(dias)}</span>
        )}
        {!pendente && !naBase && (
          <span className="ml-auto text-[13px] text-white/40">
            {s.estado === 'enviada' && s.enviada_em ? `Enviada ${dataCurta(s.enviada_em)}` : dataCurta(s.created_at)}
          </span>
        )}
        {naBase && <span className="ml-auto text-[13px] text-white/40">Base, de {s.cliente}</span>}
      </header>

      {!naBase && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 text-[14px]">
          {aEditarTel ? (
            <span className="flex items-center gap-2">
              <input
                value={telefone}
                onChange={e => setTelefone(e.target.value)}
                onBlur={guardarTelefone}
                onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                placeholder="Número do cliente (ex.: 912 345 678)"
                className="rounded-full bg-black/40 border border-white/15 focus:border-[#C9A84C]/70 outline-none px-4 py-1.5 text-white/90 w-[270px] max-w-full"
              />
              {!telefone.trim() && <span className="text-white/35">Falta o número</span>}
            </span>
          ) : (
            <button onClick={() => setAEditarTel(true)} className="text-white/50 hover:text-[#C9A84C] transition-colors" title="Alterar número">
              {telefone || 'Sem número'}
            </button>
          )}
          {s.link_ficha && (
            <Link href={s.link_ficha} target="_blank" className="font-semibold text-[#C9A84C]/85 hover:text-[#C9A84C]">Ver ficha →</Link>
          )}
          {s.lead_nova && !s.link_ficha && (
            <Link href={criarLeadUrl} target="_blank"
              className="rounded-full border px-3 py-1 text-[13px] font-semibold transition-colors"
              style={{ color: '#0b0b0b', background: OURO, borderColor: OURO }}>
              + Criar lead
            </Link>
          )}
          {s.tarefa_prazo && (
            <Link href="/tarefas" target="_blank" className="rounded-full border border-white/15 px-3 py-1 text-[13px] text-white/70 hover:text-white">
              Tarefa até {diaMes(s.tarefa_prazo)}
            </Link>
          )}
          {s.data_mensagem && <span className="text-white/30">Mensagem de {dataCurta(s.data_mensagem)}</span>}
        </div>
      )}

      {s.mensagem_cliente && !naBase && (
        <div className="mt-5">
          <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-white/40 mb-2">Cliente escreveu</p>
          <p className="whitespace-pre-line text-[16px] font-light leading-relaxed text-white/70 border-l border-[#C9A84C]/40 pl-4">{s.mensagem_cliente}</p>
        </div>
      )}

      <div className="mt-5">
        <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#C9A84C] mb-2">{naBase ? 'Resposta-base' : 'Resposta sugerida'}</p>
        <textarea
          value={texto}
          onChange={e => setTexto(e.target.value)}
          onBlur={guardarTexto}
          readOnly={naBase}
          rows={Math.min(14, Math.max(5, texto.split('\n').length + 2))}
          className={`w-full rounded-[14px] bg-black/40 border outline-none p-4 text-[15px] leading-relaxed text-white/90 font-sans transition-colors ${
            faltam.length ? 'border-red-400/60 focus:border-red-400' : 'border-[#C9A84C]/25 focus:border-[#C9A84C]/70'
          }`}
        />
        {faltam.length > 0 && !naBase && (
          <p className="mt-2 text-[14px] text-red-300">
            Falta preencher: {faltam.map(f => <span key={f} className="font-bold mr-2">{f}</span>)}
          </p>
        )}
      </div>

      {avisado && (
        <p className="mt-3 text-[14px] text-red-300">
          O texto ainda tem {faltam.join(', ')}. Preenche primeiro, ou carrega outra vez para {avisado === 'copiar' ? 'copiar' : 'abrir'} à mesma.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 mt-5">
        <button onClick={copiar} className={botaoOuro}>{copiado ? 'Copiado' : 'Copiar'}</button>
        {!naBase && (
          <button onClick={abrirWhatsapp} className={`${botaoPilula} bg-[#25D366] text-black hover:brightness-110`}>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden>
              <path d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z" />
            </svg>
            Abrir no WhatsApp
          </button>
        )}
        {pendente && (
          <>
            <button disabled={aGuardar} onClick={() => mudarEstado('enviada')} className={botaoDiscreto}>Marcar enviada</button>
            <button disabled={aGuardar} onClick={() => mudarEstado('arquivada')} className="text-[14px] text-white/35 hover:text-white/70 px-2">Arquivar</button>
          </>
        )}
        {!pendente && !naBase && (
          <button disabled={aGuardar} onClick={() => mudarEstado('pendente')} className={botaoDiscreto}>Voltar a por enviar</button>
        )}
      </div>

      {/* Respostas-base: nas enviadas guarda-se a versão final como modelo para perguntas que se repetem */}
      {(vista === 'enviada' || naBase) && (
        <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-white/[0.06]">
          {s.base ? (
            <button disabled={aGuardarBase} onClick={() => alternarBase(false)} className="text-[14px] text-white/40 hover:text-white/70">
              Retirar das respostas-base
            </button>
          ) : (
            <>
              <input
                value={tema}
                onChange={e => setTema(e.target.value)}
                placeholder="Tema (ex.: Como funciona o álbum)"
                className="rounded-full bg-black/40 border border-white/15 focus:border-[#C9A84C]/70 outline-none px-4 py-2 text-[14px] text-white/90 w-[300px] max-w-full"
              />
              <button disabled={aGuardarBase} onClick={() => alternarBase(true)} className={botaoDiscreto}>Guardar como base</button>
            </>
          )}
        </div>
      )}

      {!numero && pendente && <p className="text-[13px] text-white/35 mt-3">Sem número: o WhatsApp abre e escolhes o contacto.</p>}

    </article>
  )
}
