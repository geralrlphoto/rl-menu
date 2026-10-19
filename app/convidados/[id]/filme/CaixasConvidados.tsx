'use client'

/* Duas caixas na página do filme para os convidados: um comentário sobre o filme
   e a indicação dos próximos noivos (nós entramos em contacto). */

import { useState, type FormEvent } from 'react'

const G = '#d8be93'
const campo = 'w-full rounded-[14px] border border-white/[0.10] bg-white/[0.03] px-4 py-2.5 font-cond text-[15px] text-white placeholder-white/30 focus:outline-none focus:border-[#d8be93]/50'
const rotulo = 'mb-1.5 block font-cond text-[12px] tracking-[0.06em] text-white/55'

function useEnvio(id: string, tipo: 'comentario' | 'indicacao') {
  const [estado, setEstado] = useState<'idle' | 'a-enviar' | 'feito'>('idle')
  const [erro, setErro] = useState('')
  async function enviar(dados: Record<string, unknown>) {
    setEstado('a-enviar'); setErro('')
    try {
      const r = await fetch(`/api/convidados/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tipo, ...dados }) })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d.error || 'Não foi possível enviar.')
      setEstado('feito')
    } catch (e: any) { setErro(e.message || 'Não foi possível enviar.'); setEstado('idle') }
  }
  return { estado, erro, enviar }
}

function Obrigado({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full border text-[18px]" style={{ borderColor: G, color: G }}>✓</span>
      <p className="mt-4 font-cond font-semibold text-[20px] text-white">{titulo}</p>
      <p className="mt-1 max-w-[34ch] font-cond text-[14.5px] text-white/50">{texto}</p>
    </div>
  )
}

export default function CaixasConvidados({ id }: { id: string }) {
  const com = useEnvio(id, 'comentario')
  const ind = useEnvio(id, 'indicacao')

  function enviarComentario(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    com.enviar({ nome: f.get('nome'), mensagem: f.get('mensagem'), site: f.get('site') })
  }
  function enviarIndicacao(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    ind.enviar({ nome: f.get('nome'), noivos: f.get('noivos'), contacto: f.get('contacto'), data: f.get('data'), notas: f.get('notas'), site: f.get('site') })
  }

  const caixa = 'rounded-[22px] border border-[#d8be93]/20 bg-[#111111]/90 p-6'
  const botao = 'mt-4 inline-flex w-full items-center justify-center rounded-full border border-[#d8be93]/60 bg-[#d8be93]/15 px-5 py-2.5 font-cond font-semibold text-[14px] transition-all hover:bg-[#d8be93]/30 disabled:opacity-50'
  // Campo-isco: escondido para pessoas, os robôs preenchem-no
  const isco = <input type="text" name="site" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

  return (
    <section className="mx-auto mt-10 grid max-w-4xl gap-5 px-5 pb-12 sm:grid-cols-2">
      {/* ── comentário ── */}
      <div className={caixa} style={{ borderLeft: '2px solid rgba(216,190,147,0.6)' }}>
        <p className="font-cond text-[11px] font-medium tracking-[0.2em] uppercase" style={{ color: G }}>O vosso comentário</p>
        <h2 className="mt-2 font-cond font-semibold text-[24px] text-white">O que acharam do filme?</h2>
        {com.estado === 'feito' ? (
          <Obrigado titulo="Obrigado pelas vossas palavras" texto="O comentário chegou-nos e vamos partilhá-lo com os noivos." />
        ) : (
          <form onSubmit={enviarComentario} className="mt-4 flex flex-col gap-3">
            {isco}
            <label><span className={rotulo}>O vosso nome</span><input name="nome" required maxLength={80} className={campo} placeholder="Ex.: Joana Silva" /></label>
            <label><span className={rotulo}>Comentário</span><textarea name="mensagem" required maxLength={2000} rows={4} className={campo} placeholder="Escrevam aqui o que sentiram ao ver o filme." /></label>
            {com.erro && <p className="font-cond text-[13px] text-red-300">{com.erro}</p>}
            <button type="submit" disabled={com.estado === 'a-enviar'} className={botao} style={{ color: G }}>
              {com.estado === 'a-enviar' ? 'A enviar…' : 'Enviar comentário'}
            </button>
          </form>
        )}
      </div>

      {/* ── indicação de noivos ── */}
      <div className={caixa} style={{ borderLeft: '2px solid rgba(216,190,147,0.6)' }}>
        <p className="font-cond text-[11px] font-medium tracking-[0.2em] uppercase" style={{ color: G }}>Indiquem uns noivos</p>
        <h2 className="mt-2 font-cond font-semibold text-[24px] text-white">Conhecem quem se vai casar?</h2>
        {ind.estado === 'feito' ? (
          <Obrigado titulo="Obrigado pela indicação" texto="Vamos entrar em contacto com os noivos com todo o cuidado." />
        ) : (
          <form onSubmit={enviarIndicacao} className="mt-4 flex flex-col gap-3">
            {isco}
            <label><span className={rotulo}>O vosso nome</span><input name="nome" required maxLength={80} className={campo} placeholder="Ex.: Joana Silva" /></label>
            <label><span className={rotulo}>Nome dos noivos</span><input name="noivos" required maxLength={120} className={campo} placeholder="Ex.: Marta e Pedro" /></label>
            <label><span className={rotulo}>Telemóvel ou email dos noivos</span><input name="contacto" required maxLength={120} className={campo} placeholder="912 000 000" /></label>
            <label><span className={rotulo}>Data prevista do casamento (se souberem)</span><input name="data" maxLength={40} className={campo} placeholder="Ex.: setembro de 2027" /></label>
            <p className="font-cond text-[13px] leading-snug text-white/50">
              Vamos entrar em contacto com os noivos e dizer-lhes que foram vocês a indicá-los.
            </p>
            {ind.erro && <p className="font-cond text-[13px] text-red-300">{ind.erro}</p>}
            <button type="submit" disabled={ind.estado === 'a-enviar'} className={botao} style={{ color: G }}>
              {ind.estado === 'a-enviar' ? 'A enviar…' : 'Enviar indicação'}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
