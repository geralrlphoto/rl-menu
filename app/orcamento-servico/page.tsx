'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

/* ── tipos ─────────────────────────────────────────────────────── */
type ServicoItem = { label: string; ativo: boolean; valor: number }

const mkFoto = (label: string, valor = 0): ServicoItem => ({ label, ativo: false, valor })
const mkVideo = (label: string, valor = 0): ServicoItem => ({ label, ativo: false, valor })

const DEFAULTS = {
  // Referência / cliente
  referencia: '',
  nomeNoivos: '',
  dataCasamento: '',
  local: '',
  // Foto
  foto: [
    mkFoto('Cobertura de Todo o Evento'),
    mkFoto('Galerias On-line'),
    mkFoto('Apresentação de Fotografias'),
    mkFoto('2.º Fotógrafo'),
    mkFoto('Álbum 25×25'),
    mkFoto('Álbum 30×30'),
    mkFoto('Sessão Pré-Wedding'),
    mkFoto('Sessão Trash the Dress'),
    mkFoto('Galerias Abertas'),
    mkFoto('Foto Lembrança'),
    mkFoto('Photo Box com 40 Fotos'),
    mkFoto('Caixa para Álbum'),
    mkFoto('Saco para Álbum'),
    mkFoto('Deslocação (Foto)'),
  ],
  // Vídeo
  video: [
    mkVideo('Cobertura de Todo o Evento (Vídeo)'),
    mkVideo('1 Videógrafo'),
    mkVideo('2 Videógrafos'),
    mkVideo('Vídeo até 25 Minutos'),
    mkVideo('Qualidade Full HD'),
    mkVideo('Qualidade 4K'),
    mkVideo('Entrega via Link'),
    mkVideo('Sessão Pré-Wedding (Vídeo)'),
    mkVideo('Sessão Trash the Dress (Vídeo)'),
    mkVideo('Same Day Edit'),
    mkVideo('Deslocação (Vídeo)'),
  ],
  // Desconto / margem
  desconto: 0,
  observacoes: '',
}

type Form = typeof DEFAULTS
const fmt = (n: number) =>
  n.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'

export default function OrcamentoServico() {
  const [f, setF] = useState<Form>(DEFAULTS)

  const set = <K extends keyof Form>(k: K, v: Form[K]) =>
    setF(prev => ({ ...prev, [k]: v }))

  /* toggle / valor de um item */
  const toggleItem = (tipo: 'foto' | 'video', idx: number) => {
    const arr = [...f[tipo]]
    arr[idx] = { ...arr[idx], ativo: !arr[idx].ativo }
    set(tipo, arr as Form['foto'])
  }
  const setValor = (tipo: 'foto' | 'video', idx: number, val: number) => {
    const arr = [...f[tipo]]
    arr[idx] = { ...arr[idx], valor: val }
    set(tipo, arr as Form['foto'])
  }

  const totals = useMemo(() => {
    const subFoto = f.foto.filter(i => i.ativo).reduce((s, i) => s + (Number(i.valor) || 0), 0)
    const subVideo = f.video.filter(i => i.ativo).reduce((s, i) => s + (Number(i.valor) || 0), 0)
    const subtotal = subFoto + subVideo
    const desc = Math.max(0, Number(f.desconto) || 0)
    const total = Math.max(0, subtotal - desc)
    return { subFoto, subVideo, subtotal, desc, total }
  }, [f])

  const handlePrint = () => window.print()
  const handleReset = () => { if (confirm('Limpar todos os campos?')) setF(DEFAULTS) }

  const inputCls = 'w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2.5 text-[15px] text-white/85 outline-none focus:border-gold/50 transition-colors placeholder:text-white/20'
  const labelCls = 'block text-[10px] tracking-[0.35em] uppercase text-white/40 mb-1.5 font-medium'
  const sectionCls = 'bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 sm:p-6'
  const sectionTitle = 'text-[10px] tracking-[0.4em] text-gold uppercase font-bold mb-4 flex items-center gap-2'

  /* itens ativos para PDF */
  const fotoAtivos = f.foto.filter(i => i.ativo)
  const videoAtivos = f.video.filter(i => i.ativo)

  return (
    <>
      <style jsx global>{`
        @media print {
          html, body {
            background: #fff !important;
            color: #000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          @page { margin: 1.5cm; size: A4; }
        }
        .print-only { display: none; }
      `}</style>

      <main className="min-h-screen px-4 py-12 max-w-6xl mx-auto">

        {/* Voltar */}
        <Link href="/secao/657aa823-19f0-4bc8-a1a1-a0a712f6d6e0"
          className="no-print inline-flex items-center gap-2 text-[10px] tracking-[0.35em] text-white/30 hover:text-gold transition-colors mb-10 uppercase">
          ‹ Voltar
        </Link>

        {/* Header */}
        <header className="no-print mb-10">
          <p className="text-[9px] tracking-[0.5em] text-white/20 uppercase mb-2">RL PHOTO.VIDEO</p>
          <h1 className="text-3xl font-extralight tracking-[0.2em] text-gold uppercase">
            Orçamento de Serviço
          </h1>
          <p className="text-sm text-white/40 mt-3 max-w-2xl">
            Seleciona os serviços incluídos e define o valor de cada um. O total atualiza em tempo real. Clica em <strong className="text-gold/80">Gerar PDF</strong> para guardar ou enviar.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-px w-12 bg-gold/50" />
            <div className="h-px flex-1 bg-white/[0.04]" />
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── INPUTS ─────────────────────────────────────────────── */}
          <div className="lg:col-span-2 flex flex-col gap-4 no-print">

            {/* Referência / Clientes */}
            <div className={sectionCls}>
              <h2 className={sectionTitle}><span className="w-2 h-2 rounded-full bg-gold" /> Identificação do Evento</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Referência do Casamento</label>
                  <input value={f.referencia} onChange={e => set('referencia', e.target.value)}
                    placeholder="Ex: CAS_001_26_RL" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Nome dos Noivos</label>
                  <input value={f.nomeNoivos} onChange={e => set('nomeNoivos', e.target.value)}
                    placeholder="Ex: Ana & João Silva" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Data do Casamento</label>
                  <input type="date" value={f.dataCasamento} onChange={e => set('dataCasamento', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Local</label>
                  <input value={f.local} onChange={e => set('local', e.target.value)}
                    placeholder="Ex: Quinta da Granja, Sintra" className={inputCls} />
                </div>
              </div>
            </div>

            {/* Fotografia */}
            <div className={sectionCls}>
              <h2 className={sectionTitle}><span className="w-2 h-2 rounded-full bg-amber-400" /> Serviço de Fotografia</h2>
              <div className="flex flex-col gap-2">
                {f.foto.map((item, idx) => (
                  <ServicoRow
                    key={item.label}
                    item={item}
                    onToggle={() => toggleItem('foto', idx)}
                    onValor={v => setValor('foto', idx, v)}
                    inputCls={inputCls}
                  />
                ))}
              </div>
              {totals.subFoto > 0 && (
                <div className="mt-4 pt-4 border-t border-white/[0.06] flex justify-between items-baseline">
                  <span className="text-[10px] tracking-[0.35em] text-white/40 uppercase">Subtotal Foto</span>
                  <span className="text-base font-semibold text-amber-300">{fmt(totals.subFoto)}</span>
                </div>
              )}
            </div>

            {/* Vídeo */}
            <div className={sectionCls}>
              <h2 className={sectionTitle}><span className="w-2 h-2 rounded-full bg-blue-400" /> Serviço de Vídeo</h2>
              <div className="flex flex-col gap-2">
                {f.video.map((item, idx) => (
                  <ServicoRow
                    key={item.label}
                    item={item}
                    onToggle={() => toggleItem('video', idx)}
                    onValor={v => setValor('video', idx, v)}
                    inputCls={inputCls}
                  />
                ))}
              </div>
              {totals.subVideo > 0 && (
                <div className="mt-4 pt-4 border-t border-white/[0.06] flex justify-between items-baseline">
                  <span className="text-[10px] tracking-[0.35em] text-white/40 uppercase">Subtotal Vídeo</span>
                  <span className="text-base font-semibold text-blue-300">{fmt(totals.subVideo)}</span>
                </div>
              )}
            </div>

            {/* Desconto + Observações */}
            <div className={sectionCls}>
              <h2 className={sectionTitle}><span className="w-2 h-2 rounded-full bg-rose-400" /> Desconto &amp; Observações</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Desconto (€)</label>
                  <input type="number" min="0" step="10" value={f.desconto}
                    onChange={e => set('desconto', Number(e.target.value))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Observações</label>
                  <textarea value={f.observacoes} onChange={e => set('observacoes', e.target.value)}
                    rows={2} placeholder="Notas adicionais..."
                    className={inputCls + ' resize-none leading-relaxed'} />
                </div>
              </div>
            </div>
          </div>

          {/* ── SIDEBAR RESUMO ──────────────────────────────────────── */}
          <aside className="lg:col-span-1 lg:sticky lg:top-6 self-start no-print">
            <div className="bg-gradient-to-br from-gold/[0.06] to-black border border-gold/30 rounded-2xl p-5 sm:p-6"
              style={{ boxShadow: '0 0 24px -4px rgba(201,168,76,0.18)' }}>
              <p className="text-[10px] tracking-[0.4em] text-gold uppercase font-bold mb-1">Resumo</p>
              <p className="text-[11px] text-white/40 mb-5">Atualiza em tempo real</p>

              {f.nomeNoivos && (
                <p className="text-[12px] text-white/60 mb-3 truncate">{f.nomeNoivos}</p>
              )}

              {fotoAtivos.length > 0 && (
                <>
                  <p className="text-[9px] tracking-[0.4em] text-amber-300/60 uppercase mb-2">Fotografia</p>
                  {fotoAtivos.map(i => (
                    <Row key={i.label} label={i.label} value={fmt(Number(i.valor) || 0)} />
                  ))}
                  <div className="flex justify-between mb-3 mt-1">
                    <span className="text-[10px] text-amber-300/70 uppercase tracking-widest">Sub-foto</span>
                    <span className="text-sm font-semibold text-amber-300">{fmt(totals.subFoto)}</span>
                  </div>
                </>
              )}

              {videoAtivos.length > 0 && (
                <>
                  <p className="text-[9px] tracking-[0.4em] text-blue-300/60 uppercase mb-2">Vídeo</p>
                  {videoAtivos.map(i => (
                    <Row key={i.label} label={i.label} value={fmt(Number(i.valor) || 0)} />
                  ))}
                  <div className="flex justify-between mb-3 mt-1">
                    <span className="text-[10px] text-blue-300/70 uppercase tracking-widest">Sub-vídeo</span>
                    <span className="text-sm font-semibold text-blue-300">{fmt(totals.subVideo)}</span>
                  </div>
                </>
              )}

              <div className="my-4 h-px bg-gold/20" />

              {totals.desc > 0 && (
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-[11px] text-rose-300/80">Desconto</span>
                  <span className="text-sm text-rose-300">− {fmt(totals.desc)}</span>
                </div>
              )}

              <div className="flex items-baseline justify-between">
                <span className="text-[11px] tracking-[0.4em] text-gold uppercase font-bold">Total</span>
                <span className="text-3xl font-light text-gold">{fmt(totals.total)}</span>
              </div>

              <div className="mt-6 flex flex-col gap-2">
                <button onClick={handlePrint}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3.5 rounded-lg bg-gold text-black font-bold text-[11px] tracking-[0.35em] uppercase hover:bg-gold/85 transition-all">
                  📄 Gerar PDF
                </button>
                <button onClick={handleReset}
                  className="text-[10px] tracking-[0.35em] text-white/30 hover:text-white/60 uppercase transition-colors py-2">
                  Limpar tudo
                </button>
              </div>
            </div>
          </aside>
        </div>

        {/* ─── PRINT VIEW ──────────────────────────────────────────── */}
        <div className="print-only max-w-[800px] mx-auto px-10 py-10 text-zinc-900">

          {/* Cabeçalho */}
          <header className="flex items-start justify-between mb-10 pb-6 border-b-2 border-black">
            <div className="flex items-center gap-5">
              <img
                src="https://awwbkmprgtwmnejeuiak.supabase.co/storage/v1/object/public/portal-images/logo_rl_gold.png"
                alt="RL Photo Video" width={80} height={80}
                style={{ width: '80px', height: '80px' }}
              />
              <div>
                <h1 className="text-2xl font-black tracking-[0.15em] uppercase">RL PHOTO.VIDEO</h1>
                <p className="text-xs text-zinc-500 mt-1">Fotografia &amp; Vídeo</p>
              </div>
            </div>
            <div className="text-right text-[11px] text-zinc-500 leading-relaxed">
              <p>NIF: 238 076 415</p>
              <p>CAE: 74200</p>
              <p>geral.rlphoto@gmail.com</p>
              <p>+351 916 162 728</p>
            </div>
          </header>

          {/* Título */}
          <div className="text-center mb-10">
            <h2 className="text-xl font-black tracking-[0.25em] uppercase mb-2">Orçamento de Serviço</h2>
            <p className="text-[11px] text-zinc-400 tracking-widest uppercase">
              {new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
            <div className="mt-3 flex items-center justify-center gap-3">
              <div className="h-px w-12 bg-zinc-300" />
              <span className="text-zinc-300 text-sm">◆</span>
              <div className="h-px w-12 bg-zinc-300" />
            </div>
          </div>

          {/* 1. Identificação */}
          <section className="mb-8">
            <h3 className="text-[10px] font-black tracking-[0.3em] uppercase border-b border-zinc-200 pb-2 mb-4">
              1. Identificação das Partes
            </h3>
            <div className="space-y-5">
              <div>
                <p className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase mb-1">Prestadora</p>
                <p className="text-sm leading-relaxed">
                  <strong>Liliana Sofia Fernandes Barreto Gonçalves</strong>, a exercer sob a marca <strong>RL Photo — Fotografia &amp; Vídeo</strong>,
                  contribuinte n.º <strong>238 076 415</strong>, CAE <strong>74200</strong>,
                  Centro Comercial Os Mochos, Loja 124, 2955-185 Pinhal Novo.
                </p>
              </div>
              {f.nomeNoivos && (
                <div>
                  <p className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase mb-1">Clientes (Noivos)</p>
                  <p className="text-sm leading-relaxed"><strong>{f.nomeNoivos}</strong></p>
                </div>
              )}
            </div>
          </section>

          {/* 2. Evento */}
          <section className="mb-8">
            <h3 className="text-[10px] font-black tracking-[0.3em] uppercase border-b border-zinc-200 pb-2 mb-4">
              2. Dados do Evento
            </h3>
            <div className="bg-zinc-50 rounded-lg p-4 grid grid-cols-2 gap-3 text-sm">
              {f.referencia && <div><span className="text-zinc-400 text-xs block mb-0.5">Referência</span><strong>{f.referencia}</strong></div>}
              {f.dataCasamento && <div><span className="text-zinc-400 text-xs block mb-0.5">Data</span><strong>{new Date(f.dataCasamento + 'T12:00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}</strong></div>}
              {f.local && <div className="col-span-2"><span className="text-zinc-400 text-xs block mb-0.5">Local</span><strong>{f.local}</strong></div>}
            </div>
          </section>

          {/* 3. Fotografia */}
          {fotoAtivos.length > 0 && (
            <section className="mb-8">
              <h3 className="text-[10px] font-black tracking-[0.3em] uppercase border-b border-zinc-200 pb-2 mb-4">
                3. Serviço de Fotografia
              </h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] text-zinc-400 uppercase tracking-widest border-b border-zinc-100">
                    <th className="text-left pb-2 font-medium">Serviço</th>
                    <th className="text-right pb-2 font-medium">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {fotoAtivos.map(i => (
                    <tr key={i.label} className="border-b border-zinc-50">
                      <td className="py-2 flex items-center gap-2">
                        <span className="text-zinc-300">◆</span> {i.label}
                      </td>
                      <td className="py-2 text-right font-mono">{fmt(Number(i.valor) || 0)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="pt-3 text-[10px] font-black tracking-widest text-zinc-400 uppercase">Subtotal Fotografia</td>
                    <td className="pt-3 text-right font-bold">{fmt(totals.subFoto)}</td>
                  </tr>
                </tbody>
              </table>
            </section>
          )}

          {/* 4. Vídeo */}
          {videoAtivos.length > 0 && (
            <section className="mb-8">
              <h3 className="text-[10px] font-black tracking-[0.3em] uppercase border-b border-zinc-200 pb-2 mb-4">
                4. Serviço de Vídeo
              </h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] text-zinc-400 uppercase tracking-widest border-b border-zinc-100">
                    <th className="text-left pb-2 font-medium">Serviço</th>
                    <th className="text-right pb-2 font-medium">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {videoAtivos.map(i => (
                    <tr key={i.label} className="border-b border-zinc-50">
                      <td className="py-2 flex items-center gap-2">
                        <span className="text-zinc-300">◆</span> {i.label}
                      </td>
                      <td className="py-2 text-right font-mono">{fmt(Number(i.valor) || 0)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="pt-3 text-[10px] font-black tracking-widest text-zinc-400 uppercase">Subtotal Vídeo</td>
                    <td className="pt-3 text-right font-bold">{fmt(totals.subVideo)}</td>
                  </tr>
                </tbody>
              </table>
            </section>
          )}

          {/* 5. Total */}
          <section className="mb-10">
            <h3 className="text-[10px] font-black tracking-[0.3em] uppercase border-b border-zinc-200 pb-2 mb-4">
              5. Valor Total do Serviço
            </h3>
            {totals.desc > 0 && (
              <div className="flex justify-between text-sm mb-2 text-zinc-500">
                <span>Desconto</span>
                <span>− {fmt(totals.desc)}</span>
              </div>
            )}
            <div className="bg-black text-white rounded-lg px-6 py-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] tracking-[0.4em] uppercase mb-1" style={{ color: '#C9A84C' }}>Total do Serviço</p>
                <p className="text-[11px] text-zinc-400">Valores em euros, com IVA quando aplicável.</p>
              </div>
              <p className="text-3xl font-black tracking-tight" style={{ color: '#C9A84C' }}>{fmt(totals.total)}</p>
            </div>
          </section>

          {f.observacoes && (
            <section className="mb-8">
              <h3 className="text-[10px] font-black tracking-[0.3em] uppercase border-b border-zinc-200 pb-2 mb-4">
                6. Observações
              </h3>
              <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">{f.observacoes}</p>
            </section>
          )}

          {/* Condições */}
          <section className="mb-10 text-[11px] text-zinc-600 leading-relaxed">
            <h3 className="text-[10px] font-black tracking-[0.3em] uppercase border-b border-zinc-200 pb-2 mb-3 text-zinc-900">
              Condições Gerais
            </h3>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>O presente orçamento é <strong>válido por 30 dias</strong> a partir da data de emissão.</li>
              <li>Valores apresentados em <strong>euros (€)</strong>, com IVA incluído quando aplicável.</li>
              <li>A confirmação do serviço implica a assinatura de contrato e pagamento de sinal.</li>
              <li>Em caso de cancelamento, aplicam-se as cláusulas do contrato de prestação de serviços.</li>
            </ul>
          </section>

          {/* Assinaturas */}
          <section className="mb-8">
            <h3 className="text-[10px] font-black tracking-[0.3em] uppercase border-b border-zinc-200 pb-2 mb-6">
              Aceitação
            </h3>
            <p className="text-sm mb-10">Palmela, {new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}.</p>
            <div className="grid grid-cols-2 gap-16">
              <div>
                <div className="border-b border-zinc-400 mb-3 h-12" />
                <p className="text-xs text-zinc-500 text-center">A PRESTADORA</p>
                <p className="text-xs font-bold text-center mt-1">Liliana Sofia F. B. Gonçalves</p>
                <p className="text-[10px] text-zinc-400 text-center">RL PHOTO.VIDEO</p>
              </div>
              <div>
                <div className="border-b border-zinc-400 mb-3 h-12" />
                <p className="text-xs text-zinc-500 text-center">OS CLIENTES</p>
                <p className="text-xs font-bold text-center mt-1">{f.nomeNoivos || '____________________________'}</p>
              </div>
            </div>
          </section>

          {/* Rodapé */}
          <footer className="pt-5 border-t border-zinc-200 text-center">
            <p className="text-[9px] tracking-[0.45em] uppercase text-zinc-500 mb-1.5"><strong>RL Photo · Video</strong> — Photography &amp; Video</p>
            <p className="text-[9px] text-zinc-400 tracking-wide">Centro Comercial Os Mochos, Loja 124 · 2955-185 Pinhal Novo</p>
            <p className="text-[9px] text-zinc-400 tracking-wide">NIF 238 076 415 · geral.rlphoto@gmail.com · +351 916 162 728</p>
          </footer>
        </div>
      </main>
    </>
  )
}

/* ── Sub-componentes ──────────────────────────────────────────── */
function ServicoRow({
  item, onToggle, onValor, inputCls,
}: {
  item: ServicoItem
  onToggle: () => void
  onValor: (v: number) => void
  inputCls: string
}) {
  return (
    <div className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
      item.ativo ? 'bg-white/[0.04] border border-white/10' : 'border border-transparent'
    }`}>
      <button type="button" onClick={onToggle}
        className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-all ${
          item.ativo
            ? 'bg-gold border-gold text-black'
            : 'border-white/20 text-transparent hover:border-gold/50'
        }`}>
        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
          <polyline points="2,6 5,9 10,3" />
        </svg>
      </button>
      <span className={`flex-1 text-sm select-none cursor-pointer ${item.ativo ? 'text-white/85' : 'text-white/40'}`}
        onClick={onToggle}>
        {item.label}
      </span>
      {item.ativo && (
        <div className="flex items-center gap-1 shrink-0">
          <input
            type="number" min="0" step="10"
            value={item.valor}
            onChange={e => onValor(Number(e.target.value))}
            className="w-28 bg-white/[0.05] border border-white/15 rounded-lg px-3 py-1.5 text-sm text-white/85 outline-none focus:border-gold/50 transition-colors text-right"
            placeholder="0"
          />
          <span className="text-[11px] text-white/30">€</span>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between mb-1.5">
      <p className="text-[11px] text-white/55 truncate max-w-[60%]">{label}</p>
      <span className="text-[12px] font-mono text-white/80 shrink-0 ml-2">{value}</span>
    </div>
  )
}
