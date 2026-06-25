'use client'

import { useMemo, useState } from 'react'

const PRECO = 5
const GOLD = '#c8a866'

export default function PhotoOrderForm() {
  const [open, setOpen] = useState(false)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [formato, setFormato] = useState<'digital' | 'papel'>('digital')
  const [morada, setMorada] = useState('')
  const [quantidade, setQuantidade] = useState(1)
  const [mensagem, setMensagem] = useState('')
  const [ficheiro, setFicheiro] = useState<File | null>(null)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)

  const { subtotal, portes, total } = useMemo(() => {
    const q = Math.max(0, quantidade || 0)
    const sub = q * PRECO
    const p = formato === 'papel' ? (q < 5 ? 4 : 0) : 0
    return { subtotal: sub, portes: p, total: sub + p }
  }, [quantidade, formato])

  const eur = (n: number) => `${n.toFixed(2)} €`

  async function submit(ev: React.FormEvent) {
    ev.preventDefault()
    if (sending) return
    if (!nome || !email || !telefone || !quantidade || !ficheiro) {
      setResult({ ok: false, msg: 'Preenche os campos obrigatórios e anexa o comprovativo.' }); return
    }
    if (formato === 'papel' && !morada.trim()) {
      setResult({ ok: false, msg: 'A morada é obrigatória para entrega em papel.' }); return
    }
    setSending(true); setResult(null)
    try {
      const fd = new FormData()
      fd.append('nome', nome); fd.append('email', email); fd.append('telefone', telefone)
      fd.append('morada', morada); fd.append('formato', formato)
      fd.append('quantidade', String(quantidade))
      fd.append('subtotal', String(subtotal)); fd.append('portes', String(portes)); fd.append('total', String(total))
      fd.append('mensagem', mensagem)
      fd.append('comprovativo', ficheiro)
      const res = await fetch('/api/photo-orders', { method: 'POST', body: fd })
      const d = await res.json().catch(() => ({}))
      if (res.ok && d?.ok) {
        setResult({ ok: true, msg: `Pedido enviado! Referência ${d.pedido}. Vais receber um email de confirmação.` })
        setNome(''); setEmail(''); setTelefone(''); setMorada(''); setQuantidade(1); setMensagem(''); setFicheiro(null)
      } else {
        setResult({ ok: false, msg: d?.error || 'Não foi possível enviar o pedido.' })
      }
    } catch {
      setResult({ ok: false, msg: 'Erro de rede. Tenta novamente.' })
    }
    setSending(false)
  }

  const inputCls = 'w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-[#c8a866]/50'
  const labelCls = 'block text-[10px] tracking-[0.2em] uppercase text-white/45 mb-1.5'

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-[13px] font-bold tracking-wider uppercase transition-all"
        style={{ background: GOLD, color: '#0b0a08', boxShadow: '0 0 24px -6px rgba(200,168,102,0.6)' }}>
        ＋ Formulário de Fotos
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-white/[0.08] p-5 sm:p-6 space-y-4"
      style={{ background: 'linear-gradient(158deg, rgba(255,255,255,0.025), rgba(200,168,102,0.02))' }}>
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold" style={{ color: GOLD }}>Encomenda de Fotografias</h2>
        <button type="button" onClick={() => setOpen(false)} className="text-white/40 hover:text-white text-lg">✕</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label className={labelCls}>Nome *</label><input className={inputCls} value={nome} onChange={e => setNome(e.target.value)} /></div>
        <div><label className={labelCls}>Email *</label><input type="email" className={inputCls} value={email} onChange={e => setEmail(e.target.value)} /></div>
        <div><label className={labelCls}>Telefone *</label><input className={inputCls} value={telefone} onChange={e => setTelefone(e.target.value)} /></div>
        <div>
          <label className={labelCls}>Formato *</label>
          <select className={inputCls + ' [color-scheme:dark] cursor-pointer'} value={formato} onChange={e => setFormato(e.target.value as 'digital' | 'papel')}>
            <option value="digital">Digital</option>
            <option value="papel">Papel (carta registada)</option>
          </select>
        </div>
        {formato === 'papel' && (
          <div className="sm:col-span-2"><label className={labelCls}>Morada *</label><input className={inputCls} value={morada} onChange={e => setMorada(e.target.value)} /></div>
        )}
        <div>
          <label className={labelCls}>Nº de fotografias * (× {eur(PRECO)})</label>
          <input type="number" min={1} className={inputCls} value={quantidade} onChange={e => setQuantidade(parseInt(e.target.value || '0', 10))} />
        </div>
        <div>
          <label className={labelCls}>Comprovativo de pagamento * (imagem/PDF)</label>
          <input type="file" accept="image/*,application/pdf" onChange={e => setFicheiro(e.target.files?.[0] ?? null)}
            className="w-full text-[12px] text-white/70 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:uppercase file:tracking-wider file:bg-[#c8a866] file:text-black" />
        </div>
      </div>

      <div><label className={labelCls}>Mensagem (opcional)</label><textarea rows={3} className={inputCls + ' resize-none'} value={mensagem} onChange={e => setMensagem(e.target.value)} /></div>

      {/* Resumo */}
      <div className="rounded-xl border border-[#c8a866]/20 p-4 text-[13px] space-y-1.5" style={{ background: 'rgba(200,168,102,0.04)' }}>
        <div className="flex justify-between text-white/60"><span>Subtotal</span><span>{eur(subtotal)}</span></div>
        <div className="flex justify-between text-white/60"><span>Portes</span><span>{portes > 0 ? eur(portes) : 'Grátis'}</span></div>
        <div className="flex justify-between font-bold pt-1.5 border-t border-white/10" style={{ color: GOLD }}><span>TOTAL</span><span>{eur(total)}</span></div>
      </div>

      <p className="text-[11px] text-white/40 leading-relaxed">
        Pagamento por <strong className="text-white/70">MB WAY 916 162 728</strong> (Liliana Gonçalves). Entrega: digital até 15 dias úteis · papel até 30 dias úteis.
      </p>

      {result && (
        <div className={`rounded-lg border p-3 text-[12px] ${result.ok ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-red-500/30 bg-red-500/10 text-red-300'}`}>
          {result.msg}
        </div>
      )}

      <button type="submit" disabled={sending}
        className="w-full py-3 rounded-xl text-[13px] font-bold tracking-wider uppercase transition-all disabled:opacity-50"
        style={{ background: GOLD, color: '#0b0a08' }}>
        {sending ? 'A enviar…' : 'Enviar Pedido'}
      </button>
    </form>
  )
}
