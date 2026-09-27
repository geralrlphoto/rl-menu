'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import DataPT from '@/app/components/DataPT'

const FASES = ['ADJUDICAÇÃO', 'REFORÇO', 'FINAL']

const METODOS = [
  { label: 'MB WAY', value: 'MBWAY' },
  { label: 'Transferência', value: 'TRANSFERENCIA' },
  { label: 'Numerário', value: 'NUMERÁRIO' },
]

function RegistarPagamentoInner() {
  const params = useSearchParams()
  const refParam = params.get('ref') ?? ''
  const noivosParam = params.get('noivos') ?? ''
  const dataParam = /^\d{4}-\d{2}-\d{2}$/.test(params.get('data') ?? '') ? params.get('data')! : ''

  const [noivos, setNoivos] = useState(noivosParam)
  const [referencia, setReferencia] = useState(refParam)
  const [email, setEmail] = useState('')
  const [dataCasamento, setDataCasamento] = useState(dataParam)
  const [fase, setFase] = useState('')
  const [valor, setValor] = useState('')
  const [metodo, setMetodo] = useState('MBWAY')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setNoivos(noivosParam); setReferencia(refParam); if (dataParam) setDataCasamento(dataParam) }, [noivosParam, refParam, dataParam])

  function pickFile(f: File | null) {
    setFile(f)
    setPreview(f ? URL.createObjectURL(f) : null)
    setErro(null)
  }

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const podeEnviar = !sending

  async function submit() {
    setErro(null)
    if (!noivos.trim()) return setErro('Falta o nome dos noivos.')
    if (!emailOk) return setErro('Indica um email válido.')
    if (!referencia.trim()) return setErro('Falta a referência do evento.')
    if (!dataCasamento) return setErro('Falta a data do casamento/batizado.')
    if (!fase) return setErro('Escolhe a fase do pagamento.')
    if (!(Number(valor) > 0)) return setErro('Indica um valor válido.')
    if (!file) return setErro('Anexa o comprovativo.')
    setSending(true)
    try {
      // 1) Upload do comprovativo
      const fd = new FormData()
      fd.append('file', file)
      const up = await fetch('/api/upload-image', { method: 'POST', body: fd }).then(r => r.json())
      if (!up?.url) throw new Error(up?.error || 'Falha ao carregar o comprovativo.')

      // 2) Regista o pagamento + envia emails
      const res = await fetch('/api/registar-pagamento-noivos', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome_noivos: noivos.trim(), email: email.trim(), referencia: referencia.trim(), data_casamento: dataCasamento, valor: Number(valor), fase, metodo, comprovativo_url: up.url }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok || !d.ok) throw new Error(d?.error || 'Não foi possível registar o pagamento.')
      setDone(true)
    } catch (e: any) {
      setErro(e?.message || 'Erro de rede. Tenta novamente.')
    } finally {
      setSending(false)
    }
  }

  const lockedInput = 'w-full bg-transparent border-b border-dashed border-[#d8be93]/50 text-[#d8be93] font-light text-lg py-2 outline-none cursor-not-allowed'
  const input = 'w-full bg-transparent border-b border-white/15 text-white font-light text-lg py-2 outline-none focus:border-[#d8be93] transition-colors placeholder:text-white/25'
  const labelCls = 'block text-[11px] tracking-[0.2em] uppercase text-[#d8be93] mb-2'

  if (done) return (
    <main className="min-h-screen bg-[#0b0a08] text-white flex items-center justify-center px-5" style={{ fontFamily: "'Hanken Grotesk',sans-serif" }}>
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full border border-[#d8be93] grid place-items-center mx-auto mb-6 text-[#d8be93] text-2xl">✓</div>
        <h1 className="text-3xl font-light" style={{ fontFamily: 'Georgia,serif' }}>Pagamento <em className="text-[#d8be93]">registado.</em></h1>
        <p className="text-white/55 mt-4 leading-relaxed">Recebemos o teu comprovativo. Foi enviado um recibo por email. Obrigado!</p>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen bg-[#0b0a08] text-white px-5 py-14" style={{ fontFamily: "'Hanken Grotesk',sans-serif" }}>
      <div className="max-w-xl mx-auto">
        <p className="text-[11px] tracking-[0.34em] uppercase text-[#d8be93] mb-2">RL Photo · Video</p>
        <h1 className="text-4xl font-light leading-tight" style={{ fontFamily: 'Georgia,serif' }}>Registar <em className="text-[#d8be93]">Pagamento</em></h1>
        <p className="text-white/50 mt-3 leading-relaxed text-[15px]">Qualquer pagamento deve ser acompanhado deste registo, para ficar tudo registado na nossa plataforma. Recebem um recibo por email e a equipa fica logo a saber.</p>
        <div className="mt-5 rounded-xl border border-[#d8be93]/25 bg-[#d8be93]/[0.05] px-4 py-3 text-[14px] text-white/70 leading-relaxed">
          MB WAY para o contacto <span className="text-[#d8be93]">916 162 728</span> (Liliana Gonçalves).<br />
          A referência do evento deve ser escrita tal como vos foi dada, por exemplo <span className="text-[#d8be93]">CAS_026_26_RL</span>.
        </div>

        <div className="mt-10 grid gap-7">
          <div>
            <label className={labelCls}>Nome dos noivos/pais</label>
            <input className={noivosParam ? lockedInput : input} value={noivos} readOnly={!!noivosParam}
              onChange={e => setNoivos(e.target.value)} placeholder="Ana & Miguel" />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input type="email" className={input} value={email} onChange={e => setEmail(e.target.value)} placeholder="nome@email.com" />
          </div>
          <div>
            <label className={labelCls}>Referência do evento</label>
            <input className={refParam ? lockedInput : input} value={referencia} readOnly={!!refParam}
              onChange={e => setReferencia(e.target.value)} placeholder="CAS_000_26_RL" />
          </div>
          <div>
            <label className={labelCls}>Data do casamento/batizado</label>
            <DataPT value={dataCasamento} onChange={setDataCasamento} className="w-full border-b border-white/15 text-lg font-light py-2 outline-none justify-between" />
          </div>
          <div>
            <label className={labelCls}>Valor pago (€)</label>
            <input type="number" inputMode="decimal" min="0" step="0.01" className={input} value={valor}
              onChange={e => setValor(e.target.value)} placeholder="0,00" />
          </div>
          <div>
            <label className={labelCls}>Fase do pagamento</label>
            <div className="grid grid-cols-3 gap-2">
              {FASES.map(f => (
                <button key={f} type="button" onClick={() => setFase(f)}
                  className={`rounded-lg border py-3 text-sm transition-all ${fase === f ? 'border-[#d8be93] bg-[#d8be93]/10 text-[#d8be93]' : 'border-white/10 text-white/60 hover:border-white/25'}`}>
                  {f.charAt(0) + f.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls}>Método de pagamento</label>
            <div className="grid grid-cols-3 gap-2">
              {METODOS.map(m => (
                <button key={m.value} type="button" onClick={() => setMetodo(m.value)}
                  className={`rounded-lg border py-3 text-sm transition-all ${metodo === m.value ? 'border-[#d8be93] bg-[#d8be93]/10 text-[#d8be93]' : 'border-white/10 text-white/60 hover:border-white/25'}`}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls}>Comprovativo</label>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => pickFile(e.target.files?.[0] ?? null)} />
            <button type="button" onClick={() => fileRef.current?.click()}
              className="w-full rounded-xl border border-dashed border-white/20 hover:border-[#d8be93]/60 py-6 text-center transition-all">
              {preview ? (
                <img src={preview} alt="Comprovativo" className="max-h-56 mx-auto rounded-lg" />
              ) : (
                <span className="text-white/45 text-sm">📎 Toca para anexar a foto do comprovativo</span>
              )}
            </button>
            {file && <p className="text-[11px] text-white/35 mt-2 text-center">{file.name} · toca para trocar</p>}
          </div>

          {erro && <p className="text-[13px] text-red-300 text-center">{erro}</p>}

          <button onClick={submit} disabled={!podeEnviar}
            className="w-full rounded-full bg-[#d8be93] text-[#0b0a08] font-semibold tracking-[0.15em] uppercase text-sm py-4 mt-1 disabled:opacity-40 transition-opacity">
            {sending ? 'A registar…' : 'Registar Pagamento'}
          </button>
        </div>
      </div>
    </main>
  )
}

export default function RegistarPagamentoPage() {
  return <Suspense><RegistarPagamentoInner /></Suspense>
}
