'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

// Secção "Contrato" da página Financeiro do portal: consultar o contrato sem
// descarregar, descarregar em PDF e devolver o contrato assinado.

type Contrato = { gerado?: boolean; estado?: string; url?: string; ref?: string } | null | undefined
type Assinado = { path?: string; nome?: string; enviadoEm?: string } | null | undefined

interface Props {
  portalRef: string
  contrato: Contrato
  contratoFinalUrl?: string          // contrato final já validado (o admin cola o link em Contrato)
  assinado: Assinado
  assinadoUrl: string | null         // link temporário do ficheiro devolvido
  isAdmin: boolean
}

const fmtData = (iso?: string) => iso ? new Date(iso).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

export default function ContratoFinanceiro({ portalRef, contrato, contratoFinalUrl, assinado: inicial, assinadoUrl: urlInicial, isAdmin }: Props) {
  const [aberto, setAberto] = useState(false)
  const [assinado, setAssinado] = useState(inicial)
  const [assinadoUrl, setAssinadoUrl] = useState(urlInicial)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const ficheiro = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!aberto) return
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setAberto(false) }
    window.addEventListener('keydown', esc)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', esc); document.body.style.overflow = '' }
  }, [aberto])

  // O cliente só vê o contrato depois de a equipa o disponibilizar (o admin vê sempre)
  const disponivel = !!contrato?.gerado && !!contrato?.url && (contrato.estado === 'disponivel' || isAdmin)
  const url = contrato?.url ?? ''

  async function devolver(f: File) {
    setErro('')
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(f.type)) { setErro('Envia o contrato em PDF, JPG ou PNG.'); return }
    if (f.size > 25 * 1024 * 1024) { setErro('O ficheiro é maior do que 25 MB.'); return }
    setEnviando(true)
    try {
      const api = `/api/media-portal/${portalRef}/contrato-assinado`
      const prep = await fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ acao: 'preparar', nome: f.name, tipo: f.type }) })
      const p = await prep.json()
      if (!prep.ok) throw new Error(p.error)
      const { error } = await supabase.storage.from('contratos-assinados').uploadToSignedUrl(p.path, p.token, f, { contentType: f.type })
      if (error) throw new Error(error.message)
      const conf = await fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ acao: 'confirmar', path: p.path, nome: f.name }) })
      const c = await conf.json()
      if (!conf.ok) throw new Error(c.error)
      setAssinado(c.contratoAssinado)
      setAssinadoUrl(c.contratoAssinado?.url ?? null)
    } catch (e) {
      setErro(e instanceof Error && e.message ? e.message : 'Não foi possível enviar. Tenta outra vez.')
    } finally {
      setEnviando(false)
      if (ficheiro.current) ficheiro.current.value = ''
    }
  }

  const estado = contratoFinalUrl
    ? { txt: 'Assinado pelas duas partes', cor: 'border-[#2e6cf6] bg-[#2e6cf6] text-white' }
    : assinado?.path
      ? { txt: 'Assinado, a validar', cor: 'border-[#5a8bff]/70 bg-[#5a8bff]/[0.15] text-[#a9c1ff]' }
      : disponivel
        ? { txt: 'Disponível para assinar', cor: 'border-[#a9c1ff]/60 text-[#a9c1ff]' }
        : { txt: 'Em preparação', cor: 'border-white/20 text-white/55' }

  const passo = 'flex items-start gap-3 rounded-xl bg-[#0c2236]/70 px-4 py-3.5'
  const num = (n: string, feito: boolean) => (
    <span className={`rlp-t w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-[14px] ${feito ? 'bg-[#2e6cf6] text-white' : 'border border-white/20 text-white/50'}`}>{feito ? '✓' : n}</span>
  )

  return (
    <section className="mb-10 rounded-2xl border border-white/[0.1] bg-[#00141f]/70 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="rlp-m traco text-[10.5px] text-[#5a8bff]">Contrato de prestação de serviços</p>
          <h2 className="rlp-t mt-1 text-[24px]">Contrato</h2>
          {contrato?.ref && <p className="rlp-m mt-1 text-[9.5px] text-white/40">{contrato.ref}</p>}
        </div>
        <span className={`rlp-m rounded-full border px-3 py-1.5 text-[9.5px] ${estado.cor}`}>{estado.txt}</span>
      </div>

      {!disponivel && !contratoFinalUrl ? (
        <p className="mt-4 text-[14.5px] leading-relaxed text-white/65">
          O contrato está a ser preparado pela equipa RL PROD. Assim que estiver pronto, fica aqui para consultar, descarregar e devolver assinado.
        </p>
      ) : (
        <>
          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            <div className={passo}>
              {num('1', true)}
              <div><p className="rlp-t text-[15px]">Ler</p><p className="text-[12.5px] text-white/55">Consulte o contrato aqui, sem descarregar.</p></div>
            </div>
            <div className={passo}>
              {num('2', !!assinado?.path || !!contratoFinalUrl)}
              <div><p className="rlp-t text-[15px]">Assinar</p><p className="text-[12.5px] text-white/55">Descarregue em PDF, assine e digitalize.</p></div>
            </div>
            <div className={passo}>
              {num('3', !!assinado?.path || !!contratoFinalUrl)}
              <div><p className="rlp-t text-[15px]">Devolver</p><p className="text-[12.5px] text-white/55">Envie o contrato assinado por aqui.</p></div>
            </div>
          </div>

          <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
            {disponivel && (
              <>
                <button type="button" onClick={() => setAberto(true)}
                  className="rlp-t inline-flex items-center justify-center gap-2 rounded-md bg-[#2e6cf6] hover:bg-[#3d79ff] px-6 py-3 text-[16px] tracking-[0.04em] transition-colors">
                  Consultar contrato
                </button>
                <a href={`${url}?imprimir=1`} target="_blank" rel="noopener noreferrer"
                  className="rlp-t inline-flex items-center justify-center gap-2 rounded-md border border-white/25 hover:border-white/50 px-6 py-3 text-[16px] tracking-[0.04em] transition-colors">
                  Descarregar PDF ↓
                </a>
              </>
            )}
            {contratoFinalUrl && (
              <a href={contratoFinalUrl} target="_blank" rel="noopener noreferrer"
                className="rlp-t inline-flex items-center justify-center gap-2 rounded-md border border-[#2e6cf6] px-6 py-3 text-[16px] tracking-[0.04em] text-[#a9c1ff] hover:bg-[#2e6cf6]/15 transition-colors">
                Contrato final assinado ↗
              </a>
            )}
          </div>

          {/* Devolver assinado */}
          {!contratoFinalUrl && (
            <div className="mt-5 rounded-xl border border-dashed border-[#2e6cf6]/50 bg-[#2e6cf6]/[0.06] p-4 sm:p-5">
              <input ref={ficheiro} type="file" accept="application/pdf,image/jpeg,image/png" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) devolver(f) }} />
              {assinado?.path ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="rlp-t text-[17px]">Contrato assinado recebido</p>
                    <p className="text-[13px] text-white/60">
                      Enviado a {fmtData(assinado.enviadoEm)}{assinado.nome ? ` · ${assinado.nome}` : ''}. A equipa vai validar e enviar a versão final.
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {assinadoUrl && (
                      <a href={assinadoUrl} target="_blank" rel="noopener noreferrer"
                        className="rounded-md border border-white/25 hover:border-white/50 px-4 py-2 text-[13px] transition-colors">Ver o que enviei</a>
                    )}
                    <button type="button" onClick={() => ficheiro.current?.click()} disabled={enviando}
                      className="rounded-md border border-white/25 hover:border-white/50 px-4 py-2 text-[13px] transition-colors disabled:opacity-50">
                      {enviando ? 'A enviar…' : 'Substituir'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="rlp-t text-[17px]">Devolver o contrato assinado</p>
                    <p className="text-[13px] text-white/60">PDF, JPG ou PNG até 25 MB. Pode ser uma digitalização ou uma fotografia nítida.</p>
                  </div>
                  <button type="button" onClick={() => ficheiro.current?.click()} disabled={enviando || !disponivel}
                    className="rlp-t shrink-0 rounded-md bg-[#2e6cf6] hover:bg-[#3d79ff] px-6 py-3 text-[16px] tracking-[0.04em] transition-colors disabled:opacity-50">
                    {enviando ? 'A enviar…' : 'Enviar assinado ↑'}
                  </button>
                </div>
              )}
              {erro && <p className="mt-3 text-[13px] text-[#ff8a8a]">{erro}</p>}
            </div>
          )}
        </>
      )}

      {/* Consultar sem descarregar */}
      {aberto && (
        <div className="fixed inset-0 z-[70] flex flex-col bg-[#000d17]/90 p-2 sm:p-6" onClick={() => setAberto(false)}>
          <div className="mx-auto flex h-full w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/[0.14] bg-[#00141f]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-4 py-3">
              <p className="rlp-t text-[17px]">Contrato</p>
              <div className="flex items-center gap-2">
                <a href={`${url}?imprimir=1`} target="_blank" rel="noopener noreferrer"
                  className="rounded-md border border-white/25 hover:border-white/50 px-3 py-1.5 text-[12.5px] transition-colors">Descarregar PDF</a>
                <button type="button" onClick={() => setAberto(false)} aria-label="Fechar"
                  className="w-8 h-8 rounded-full border border-white/20 hover:border-[#2e6cf6] flex items-center justify-center text-white/70">✕</button>
              </div>
            </div>
            <iframe src={url} title="Contrato" className="flex-1 w-full bg-white" />
          </div>
        </div>
      )}
    </section>
  )
}
