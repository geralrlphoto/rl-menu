'use client'

import { useState } from 'react'
import Link from 'next/link'

type ServicoItem = { label: string; ativo: boolean }

const mkItem = (label: string): ServicoItem => ({ label, ativo: false })

const DEFAULTS = {
  referencia: '',
  nomeNoivos: '',
  dataCasamento: '',
  local: '',
  foto: [
    mkItem('Cobertura de Todo o Evento'),
    mkItem('Galerias On-line'),
    mkItem('Apresentação de Fotografias'),
    mkItem('2.º Fotógrafo'),
    mkItem('Álbum 25×25'),
    mkItem('Álbum 30×30'),
    mkItem('Sessão Pré-Wedding'),
    mkItem('Sessão Trash the Dress'),
    mkItem('Galerias Abertas'),
    mkItem('Foto Lembrança'),
    mkItem('Photo Box com 40 Fotos'),
    mkItem('Caixa para Álbum'),
    mkItem('Saco para Álbum'),
    mkItem('Deslocação (Foto)'),
  ],
  video: [
    mkItem('Cobertura de Todo o Evento (Vídeo)'),
    mkItem('1 Videógrafo'),
    mkItem('2 Videógrafos'),
    mkItem('Vídeo até 25 Minutos'),
    mkItem('Qualidade Full HD'),
    mkItem('Qualidade 4K'),
    mkItem('Entrega via Link'),
    mkItem('Sessão Pré-Wedding (Vídeo)'),
    mkItem('Sessão Trash the Dress (Vídeo)'),
    mkItem('Same Day Edit'),
    mkItem('Deslocação (Vídeo)'),
  ],
  valorTotal: 0,
  observacoes: '',
}

type Form = typeof DEFAULTS
const fmt = (n: number) =>
  n.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'

export default function OrcamentoServico() {
  const [f, setF] = useState<Form>(DEFAULTS)

  const set = <K extends keyof Form>(k: K, v: Form[K]) =>
    setF(prev => ({ ...prev, [k]: v }))

  const toggle = (tipo: 'foto' | 'video', idx: number) => {
    const arr = [...f[tipo]]
    arr[idx] = { ...arr[idx], ativo: !arr[idx].ativo }
    set(tipo, arr as Form['foto'])
  }

  const handlePrint = () => window.print()
  const handleReset = () => { if (confirm('Limpar todos os campos?')) setF(DEFAULTS) }

  const inputCls = 'w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2.5 text-[15px] text-white/85 outline-none focus:border-gold/50 transition-colors placeholder:text-white/20'
  const labelCls = 'block text-[10px] tracking-[0.35em] uppercase text-white/40 mb-1.5 font-medium'
  const sectionCls = 'bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 sm:p-6'
  const sectionTitle = 'text-[10px] tracking-[0.4em] text-gold uppercase font-bold mb-4 flex items-center gap-2'

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

        <Link href="/secao/657aa823-19f0-4bc8-a1a1-a0a712f6d6e0"
          className="no-print inline-flex items-center gap-2 text-[10px] tracking-[0.35em] text-white/30 hover:text-gold transition-colors mb-10 uppercase">
          ‹ Voltar
        </Link>

        <header className="no-print mb-10">
          <p className="text-[9px] tracking-[0.5em] text-white/20 uppercase mb-2">RL PHOTO.VIDEO</p>
          <h1 className="text-3xl font-extralight tracking-[0.2em] text-gold uppercase">
            Orçamento de Serviço
          </h1>
          <p className="text-sm text-white/40 mt-3 max-w-2xl">
            Seleciona os serviços incluídos e define o valor total. Clica em <strong className="text-gold/80">Gerar PDF</strong> para guardar ou enviar.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-px w-12 bg-gold/50" />
            <div className="h-px flex-1 bg-white/[0.04]" />
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          <div className="lg:col-span-2 flex flex-col gap-4 no-print">

            {/* Identificação */}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {f.foto.map((item, idx) => (
                  <CheckRow key={item.label} item={item} onToggle={() => toggle('foto', idx)} />
                ))}
              </div>
            </div>

            {/* Vídeo */}
            <div className={sectionCls}>
              <h2 className={sectionTitle}><span className="w-2 h-2 rounded-full bg-blue-400" /> Serviço de Vídeo</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {f.video.map((item, idx) => (
                  <CheckRow key={item.label} item={item} onToggle={() => toggle('video', idx)} />
                ))}
              </div>
            </div>

            {/* Valor Total + Observações */}
            <div className={sectionCls}>
              <h2 className={sectionTitle}><span className="w-2 h-2 rounded-full bg-gold" /> Valor &amp; Observações</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Valor Total (€)</label>
                  <input
                    type="number" min="0" step="50"
                    value={f.valorTotal}
                    onChange={e => set('valorTotal', Number(e.target.value))}
                    className={inputCls + ' text-2xl font-light text-gold'}
                  />
                </div>
                <div>
                  <label className={labelCls}>Observações</label>
                  <textarea value={f.observacoes} onChange={e => set('observacoes', e.target.value)}
                    rows={3} placeholder="Notas adicionais..."
                    className={inputCls + ' resize-none leading-relaxed'} />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1 lg:sticky lg:top-6 self-start no-print">
            <div className="bg-gradient-to-br from-gold/[0.06] to-black border border-gold/30 rounded-2xl p-5 sm:p-6"
              style={{ boxShadow: '0 0 24px -4px rgba(201,168,76,0.18)' }}>
              <p className="text-[10px] tracking-[0.4em] text-gold uppercase font-bold mb-1">Resumo</p>
              {f.nomeNoivos && <p className="text-[12px] text-white/50 mb-4 truncate">{f.nomeNoivos}</p>}

              {fotoAtivos.length > 0 && (
                <>
                  <p className="text-[9px] tracking-[0.4em] text-amber-300/60 uppercase mb-2">Fotografia</p>
                  {fotoAtivos.map(i => (
                    <p key={i.label} className="text-[11px] text-white/55 mb-1 flex items-center gap-1.5">
                      <span className="text-amber-400/50">◆</span> {i.label}
                    </p>
                  ))}
                  <div className="my-3 h-px bg-white/[0.05]" />
                </>
              )}

              {videoAtivos.length > 0 && (
                <>
                  <p className="text-[9px] tracking-[0.4em] text-blue-300/60 uppercase mb-2">Vídeo</p>
                  {videoAtivos.map(i => (
                    <p key={i.label} className="text-[11px] text-white/55 mb-1 flex items-center gap-1.5">
                      <span className="text-blue-400/50">◆</span> {i.label}
                    </p>
                  ))}
                  <div className="my-3 h-px bg-white/[0.05]" />
                </>
              )}

              <div className="my-4 h-px bg-gold/20" />
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] tracking-[0.4em] text-gold uppercase font-bold">Total</span>
                <span className="text-3xl font-light text-gold">{fmt(f.valorTotal)}</span>
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

        {/* ── PRINT VIEW ─────────────────────────────────────────── */}
        <div className="print-only max-w-[800px] mx-auto px-10 py-10 text-zinc-900">

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

          {/* 1. Partes */}
          <section className="mb-8">
            <h3 className="text-[10px] font-black tracking-[0.3em] uppercase border-b border-zinc-200 pb-2 mb-4">1. Identificação das Partes</h3>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase mb-1">Prestadora</p>
                <p className="text-sm leading-relaxed">
                  <strong>Liliana Sofia Fernandes Barreto Gonçalves</strong>, a exercer sob a marca <strong>RL Photo — Fotografia &amp; Vídeo</strong>,
                  NIF <strong>238 076 415</strong>, CAE <strong>74200</strong>, Centro Comercial Os Mochos, Loja 124, 2955-185 Pinhal Novo.
                </p>
              </div>
              {f.nomeNoivos && (
                <div>
                  <p className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase mb-1">Clientes (Noivos)</p>
                  <p className="text-sm"><strong>{f.nomeNoivos}</strong></p>
                </div>
              )}
            </div>
          </section>

          {/* 2. Evento */}
          <section className="mb-8">
            <h3 className="text-[10px] font-black tracking-[0.3em] uppercase border-b border-zinc-200 pb-2 mb-4">2. Dados do Evento</h3>
            <div className="bg-zinc-50 rounded-lg p-4 grid grid-cols-2 gap-3 text-sm">
              {f.referencia && <div><span className="text-zinc-400 text-xs block mb-0.5">Referência</span><strong>{f.referencia}</strong></div>}
              {f.dataCasamento && <div><span className="text-zinc-400 text-xs block mb-0.5">Data</span><strong>{new Date(f.dataCasamento + 'T12:00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}</strong></div>}
              {f.local && <div className="col-span-2"><span className="text-zinc-400 text-xs block mb-0.5">Local</span><strong>{f.local}</strong></div>}
            </div>
          </section>

          {/* 3. Serviços */}
          <section className="mb-8">
            <h3 className="text-[10px] font-black tracking-[0.3em] uppercase border-b border-zinc-200 pb-2 mb-4">3. Serviços Incluídos</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
              {fotoAtivos.length > 0 && (
                <div className="col-span-2 mb-2">
                  <p className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase mb-2">Fotografia</p>
                  {fotoAtivos.map(i => (
                    <p key={i.label} className="flex items-center gap-2 mb-1">
                      <span className="text-zinc-300">◆</span> {i.label}
                    </p>
                  ))}
                </div>
              )}
              {videoAtivos.length > 0 && (
                <div className="col-span-2">
                  <p className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase mb-2 mt-2">Vídeo</p>
                  {videoAtivos.map(i => (
                    <p key={i.label} className="flex items-center gap-2 mb-1">
                      <span className="text-zinc-300">◆</span> {i.label}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* 4. Valor */}
          <section className="mb-10">
            <h3 className="text-[10px] font-black tracking-[0.3em] uppercase border-b border-zinc-200 pb-2 mb-4">4. Valor Total do Serviço</h3>
            <div className="bg-black text-white rounded-lg px-6 py-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] tracking-[0.4em] uppercase mb-1" style={{ color: '#C9A84C' }}>Total</p>
                <p className="text-[11px] text-zinc-400">Valores em euros, com IVA quando aplicável.</p>
              </div>
              <p className="text-3xl font-black tracking-tight" style={{ color: '#C9A84C' }}>{fmt(f.valorTotal)}</p>
            </div>
          </section>

          {f.observacoes && (
            <section className="mb-8">
              <h3 className="text-[10px] font-black tracking-[0.3em] uppercase border-b border-zinc-200 pb-2 mb-4">5. Observações</h3>
              <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">{f.observacoes}</p>
            </section>
          )}

          <section className="mb-10 text-[11px] text-zinc-600 leading-relaxed">
            <h3 className="text-[10px] font-black tracking-[0.3em] uppercase border-b border-zinc-200 pb-2 mb-3 text-zinc-900">Condições Gerais</h3>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>O presente orçamento é <strong>válido por 30 dias</strong> a partir da data de emissão.</li>
              <li>Valores apresentados em <strong>euros (€)</strong>, com IVA incluído quando aplicável.</li>
              <li>A confirmação implica a assinatura de contrato e pagamento de sinal.</li>
              <li>Em caso de cancelamento, aplicam-se as cláusulas do contrato de prestação de serviços.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h3 className="text-[10px] font-black tracking-[0.3em] uppercase border-b border-zinc-200 pb-2 mb-6">Aceitação</h3>
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

function CheckRow({ item, onToggle }: { item: ServicoItem; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors w-full ${
        item.ativo ? 'bg-white/[0.04] border border-white/10' : 'border border-transparent hover:bg-white/[0.02]'
      }`}>
      <span className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-all ${
        item.ativo ? 'bg-gold border-gold text-black' : 'border-white/20'
      }`}>
        {item.ativo && (
          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3">
            <polyline points="2,6 5,9 10,3" />
          </svg>
        )}
      </span>
      <span className={`text-sm ${item.ativo ? 'text-white/85' : 'text-white/40'}`}>{item.label}</span>
    </button>
  )
}
