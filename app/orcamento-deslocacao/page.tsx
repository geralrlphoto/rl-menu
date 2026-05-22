'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

const DEFAULTS = {
  // Cliente
  cliente: '',
  evento: '',
  data: '',
  origem: 'Setúbal',
  destino: '',
  // Deslocação
  kmIda: 0,
  idaVolta: true,
  valorPorKm: 0.50,
  portagens: 0,
  // Equipa
  numPessoas: 2,
  // Refeições
  numRefeicoes: 2,
  valorRefeicao: 12,
  // Horas
  horasViagem: 0,
  valorHoraViagem: 15,
  horasServico: 0,
  valorHoraServico: 30,
  // Dormida
  noites: 0,
  valorNoite: 60,
  // Extras
  observacoes: '',
  // ── Margem de Lucro (slider 0-100%) ─────────────────
  margemPct: 0,               // % a somar ao subtotal
}

type Form = typeof DEFAULTS

const fmt = (n: number) => n.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'

export default function OrcamentoDeslocacaoPage() {
  const [f, setF] = useState<Form>(DEFAULTS)

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF(prev => ({ ...prev, [k]: v }))

  const totals = useMemo(() => {
    const kmTotal = (Number(f.kmIda) || 0) * (f.idaVolta ? 2 : 1)
    const subKm        = kmTotal * (Number(f.valorPorKm) || 0)
    const subPortagens = Number(f.portagens) || 0
    const subRefeicoes = (Number(f.numPessoas) || 0) * (Number(f.numRefeicoes) || 0) * (Number(f.valorRefeicao) || 0)
    const subViagem    = (Number(f.horasViagem) || 0) * (Number(f.valorHoraViagem) || 0)
    const subServico   = (Number(f.horasServico) || 0) * (Number(f.valorHoraServico) || 0)
    const subDormida   = (Number(f.numPessoas) || 0) * (Number(f.noites) || 0) * (Number(f.valorNoite) || 0)
    const subtotal = subKm + subPortagens + subRefeicoes + subViagem + subServico + subDormida

    // Margem de lucro — slider 0-100% somada ao subtotal
    const margemPct   = Math.max(0, Math.min(100, Number(f.margemPct) || 0))
    const margemValor = subtotal * (margemPct / 100)
    const total       = subtotal + margemValor

    return {
      kmTotal, subKm, subPortagens, subRefeicoes, subViagem, subServico, subDormida,
      subtotal, margemPct, margemValor, total,
    }
  }, [f])

  // Print helper
  const handlePrint = () => window.print()
  const handleReset = () => { if (confirm('Limpar todos os campos?')) setF(DEFAULTS) }

  const inputCls = 'w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2.5 text-[15px] text-white/85 outline-none focus:border-gold/50 transition-colors placeholder:text-white/20'
  const labelCls = 'block text-[10px] tracking-[0.35em] uppercase text-white/40 mb-1.5 font-medium'
  const sectionCls = 'bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 sm:p-6'
  const sectionTitle = 'text-[10px] tracking-[0.4em] text-gold uppercase font-bold mb-4 flex items-center gap-2'

  return (
    <>
      {/* Estilos de impressão — esconde UI e estiliza preto/branco */}
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
          .print-only img {
            display: block !important;
            visibility: visible !important;
          }
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

        {/* Header (só ecrã — escondido no PDF) */}
        <header className="no-print mb-10">
          <p className="text-[9px] tracking-[0.5em] text-white/20 uppercase mb-2">RL PHOTO.VIDEO</p>
          <h1 className="text-3xl font-extralight tracking-[0.2em] text-gold uppercase">
            Orçamento de Deslocação
          </h1>
          <p className="text-sm text-white/40 mt-3 max-w-2xl">
            Preenche os campos abaixo. Os totais atualizam em tempo real. Quando estiver pronto, clica em <strong className="text-gold/80">Gerar PDF</strong> para guardar ou enviar ao cliente.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-px w-12 bg-gold/50" />
            <div className="h-px flex-1 bg-white/[0.04]" />
          </div>
        </header>

        {/* GRID 2 colunas: inputs (esq) + breakdown (dir) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── INPUTS (2/3) ───────────────────────────────────────────── */}
          <div className="lg:col-span-2 flex flex-col gap-4 no-print">

            {/* Cliente */}
            <div className={sectionCls}>
              <h2 className={sectionTitle}><span className="w-2 h-2 rounded-full bg-gold" /> Cliente / Evento</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Nome do Cliente</label>
                  <input value={f.cliente} onChange={e => set('cliente', e.target.value)} placeholder="Ex: Ana & João Silva" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Tipo de Evento</label>
                  <input value={f.evento} onChange={e => set('evento', e.target.value)} placeholder="Casamento, Batizado, Sessão..." className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Data do Evento</label>
                  <input type="date" value={f.data} onChange={e => set('data', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Local / Destino</label>
                  <input value={f.destino} onChange={e => set('destino', e.target.value)} placeholder="Ex: Quinta da Granja, Sintra" className={inputCls} />
                </div>
              </div>
            </div>

            {/* Deslocação */}
            <div className={sectionCls}>
              <h2 className={sectionTitle}><span className="w-2 h-2 rounded-full bg-blue-400" /> Deslocação</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className={labelCls}>Origem</label>
                  <input value={f.origem} onChange={e => set('origem', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>KM (ida)</label>
                  <input type="number" min="0" step="0.1" value={f.kmIda} onChange={e => set('kmIda', Number(e.target.value))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Valor / km</label>
                  <input type="number" min="0" step="0.01" value={f.valorPorKm} onChange={e => set('valorPorKm', Number(e.target.value))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Portagens</label>
                  <input type="number" min="0" step="0.10" value={f.portagens} onChange={e => set('portagens', Number(e.target.value))} className={inputCls} />
                </div>
                <div className="col-span-2 sm:col-span-4 flex items-center gap-2 pt-1">
                  <input id="idaVolta" type="checkbox" checked={f.idaVolta} onChange={e => set('idaVolta', e.target.checked)}
                    className="w-4 h-4 accent-gold" />
                  <label htmlFor="idaVolta" className="text-sm text-white/65 cursor-pointer select-none">
                    Ida e volta <span className="text-white/30">(multiplica KM por 2)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Equipa + Refeições */}
            <div className={sectionCls}>
              <h2 className={sectionTitle}><span className="w-2 h-2 rounded-full bg-pink-400" /> Equipa &amp; Refeições</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className={labelCls}>Nº Pessoas</label>
                  <input type="number" min="1" step="1" value={f.numPessoas} onChange={e => set('numPessoas', Number(e.target.value))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Nº Refeições / pessoa</label>
                  <input type="number" min="0" step="1" value={f.numRefeicoes} onChange={e => set('numRefeicoes', Number(e.target.value))} className={inputCls} />
                </div>
                <div className="col-span-2 sm:col-span-2">
                  <label className={labelCls}>Valor por Refeição</label>
                  <input type="number" min="0" step="0.5" value={f.valorRefeicao} onChange={e => set('valorRefeicao', Number(e.target.value))} className={inputCls} />
                </div>
              </div>
            </div>

            {/* Horas */}
            <div className={sectionCls}>
              <h2 className={sectionTitle}><span className="w-2 h-2 rounded-full bg-emerald-400" /> Horas</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className={labelCls}>Horas de Viagem</label>
                  <input type="number" min="0" step="0.25" value={f.horasViagem} onChange={e => set('horasViagem', Number(e.target.value))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>€ / hora viagem</label>
                  <input type="number" min="0" step="1" value={f.valorHoraViagem} onChange={e => set('valorHoraViagem', Number(e.target.value))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Horas Serviço Extra</label>
                  <input type="number" min="0" step="0.25" value={f.horasServico} onChange={e => set('horasServico', Number(e.target.value))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>€ / hora serviço</label>
                  <input type="number" min="0" step="1" value={f.valorHoraServico} onChange={e => set('valorHoraServico', Number(e.target.value))} className={inputCls} />
                </div>
              </div>
            </div>

            {/* Dormida */}
            <div className={sectionCls}>
              <h2 className={sectionTitle}><span className="w-2 h-2 rounded-full bg-purple-400" /> Estadia / Dormida</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Nº Noites / pessoa</label>
                  <input type="number" min="0" step="1" value={f.noites} onChange={e => set('noites', Number(e.target.value))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Valor por Noite</label>
                  <input type="number" min="0" step="1" value={f.valorNoite} onChange={e => set('valorNoite', Number(e.target.value))} className={inputCls} />
                </div>
              </div>
              <p className="text-[11px] text-white/30 mt-3 italic">Multiplica Nº pessoas × noites × valor</p>
            </div>

            {/* Observações */}
            <div className={sectionCls}>
              <h2 className={sectionTitle}><span className="w-2 h-2 rounded-full bg-amber-400" /> Observações</h2>
              <textarea value={f.observacoes} onChange={e => set('observacoes', e.target.value)} rows={3}
                placeholder="Ex: incluí drone, equipamento extra, taxas de entrada..."
                className={inputCls + ' resize-none leading-relaxed'} />
            </div>

            {/* ── Margem de Lucro — slider, soma ao subtotal ────────────── */}
            <div className={sectionCls}>
              <h2 className={sectionTitle}><span className="w-2 h-2 rounded-full bg-emerald-400" /> Margem de Lucro</h2>

              <div className="flex items-baseline justify-between mb-2">
                <span className="text-[11px] tracking-[0.3em] text-white/40 uppercase">Margem</span>
                <span className="text-lg font-bold text-emerald-300">{totals.margemPct.toFixed(0)}%</span>
              </div>

              <input
                type="range" min="0" max="100" step="1"
                value={f.margemPct}
                onChange={e => set('margemPct', Number(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer h-1"
              />

              <div className="flex items-baseline justify-between mt-1">
                <span className="text-[10px] text-white/30">0%</span>
                <span className="text-[10px] text-white/30">100%</span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="bg-black/30 rounded-xl px-4 py-3 border border-white/[0.06]">
                  <p className="text-[9px] tracking-[0.3em] uppercase text-white/35 mb-1">Subtotal</p>
                  <p className="text-base font-semibold text-white/80">{fmt(totals.subtotal)}</p>
                </div>
                <div className="bg-emerald-500/[0.07] rounded-xl px-4 py-3 border border-emerald-500/20">
                  <p className="text-[9px] tracking-[0.3em] uppercase text-emerald-400/70 mb-1">+ Margem</p>
                  <p className="text-base font-semibold text-emerald-300">{fmt(totals.margemValor)}</p>
                </div>
                <div className="bg-gold/10 rounded-xl px-4 py-3 border border-gold/30">
                  <p className="text-[9px] tracking-[0.3em] uppercase text-gold/70 mb-1">= Total</p>
                  <p className="text-base font-bold text-gold">{fmt(totals.total)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── BREAKDOWN (1/3) — sticky no desktop, breakdown total ─────── */}
          <aside className="lg:col-span-1 lg:sticky lg:top-6 self-start no-print">
            <div className="bg-gradient-to-br from-gold/[0.06] to-black border border-gold/30 rounded-2xl p-5 sm:p-6"
              style={{ boxShadow: '0 0 24px -4px rgba(201,168,76,0.18)' }}>
              <p className="text-[10px] tracking-[0.4em] text-gold uppercase font-bold mb-1">Resumo</p>
              <p className="text-[11px] text-white/40 mb-5">Atualiza em tempo real</p>

              <Row label="KM total" value={`${totals.kmTotal.toLocaleString('pt-PT')} km`} sub={`${(f.kmIda || 0).toLocaleString('pt-PT')} ida${f.idaVolta ? ' ×2' : ''}`} />
              <Row label="Deslocação" value={fmt(totals.subKm)} sub={`${totals.kmTotal} × ${fmt(f.valorPorKm)}`} />
              {totals.subPortagens > 0 && <Row label="Portagens" value={fmt(totals.subPortagens)} />}
              {totals.subRefeicoes > 0 && <Row label="Refeições" value={fmt(totals.subRefeicoes)} sub={`${f.numPessoas} × ${f.numRefeicoes} × ${fmt(f.valorRefeicao)}`} />}
              {totals.subViagem > 0 && <Row label="Horas viagem" value={fmt(totals.subViagem)} sub={`${f.horasViagem}h × ${fmt(f.valorHoraViagem)}`} />}
              {totals.subServico > 0 && <Row label="Horas serviço" value={fmt(totals.subServico)} sub={`${f.horasServico}h × ${fmt(f.valorHoraServico)}`} />}
              {totals.subDormida > 0 && <Row label="Estadia" value={fmt(totals.subDormida)} sub={`${f.numPessoas} × ${f.noites} noites × ${fmt(f.valorNoite)}`} />}

              <div className="my-4 h-px bg-gold/20" />

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

        {/* ─── PRINT VIEW (oculta em ecrã, visível no PDF) ─────────────── */}
        {/* Design clean & profissional · só TOTAL (sem valores por linha) ───*/}
        <div className="print-only max-w-[800px] mx-auto px-10 py-12 text-zinc-900">

          {/* Cabeçalho */}
          <header className="flex items-end justify-between mb-12 pb-5 border-b border-zinc-300">
            <div className="flex items-center gap-5">
              <img
                src="https://awwbkmprgtwmnejeuiak.supabase.co/storage/v1/object/public/portal-images/logo_rl_gold.png"
                alt="RL Photo Video"
                width={80} height={80}
                style={{ width: '80px', height: '80px' }}
              />
              <div>
                <p className="text-[22px] font-light tracking-[0.18em] uppercase text-zinc-900 leading-none">RL <strong className="font-bold">PHOTO</strong>.VIDEO</p>
                <p className="text-[10px] text-zinc-500 tracking-[0.3em] uppercase mt-1.5">Fotografia &amp; Vídeo</p>
              </div>
            </div>
            <div className="text-right text-[10px] text-zinc-500 tracking-wider leading-relaxed">
              <p>NIF · 238 076 415</p>
              <p>CAE · 74200</p>
              <p>+351 916 162 728</p>
              <p>geral.rlphoto@gmail.com</p>
            </div>
          </header>

          {/* Título — minimal */}
          <div className="mb-12">
            <p className="text-[10px] tracking-[0.5em] uppercase text-zinc-400 mb-2">Documento</p>
            <h1 className="text-[28px] font-light tracking-[0.05em] text-zinc-900 leading-tight">Orçamento de Deslocação</h1>
            <p className="text-[11px] text-zinc-500 mt-2 tracking-wide">
              Emitido em {new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Cliente + Trajeto — grid limpo */}
          {(f.cliente || f.evento || f.data || f.destino) && (
            <section className="mb-10">
              <p className="text-[9px] tracking-[0.4em] uppercase text-zinc-400 mb-3">Para</p>
              <div className="grid grid-cols-2 gap-x-12 gap-y-3 text-[13px]">
                {f.cliente && <div><p className="text-[9px] uppercase tracking-widest text-zinc-400 mb-0.5">Cliente</p><p className="font-semibold">{f.cliente}</p></div>}
                {f.evento  && <div><p className="text-[9px] uppercase tracking-widest text-zinc-400 mb-0.5">Evento</p><p className="font-semibold">{f.evento}</p></div>}
                {f.data    && <div><p className="text-[9px] uppercase tracking-widest text-zinc-400 mb-0.5">Data</p><p className="font-semibold">{new Date(f.data + 'T12:00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}</p></div>}
                {f.destino && <div><p className="text-[9px] uppercase tracking-widest text-zinc-400 mb-0.5">Local</p><p className="font-semibold">{f.destino}</p></div>}
              </div>
            </section>
          )}

          {/* Trajeto detalhe */}
          <section className="mb-10">
            <p className="text-[9px] tracking-[0.4em] uppercase text-zinc-400 mb-3">Trajeto</p>
            <div className="flex items-center justify-between border border-zinc-200 rounded-md px-5 py-4 text-[13px]">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-zinc-400 mb-0.5">Origem</p>
                  <p className="font-semibold">{f.origem || '—'}</p>
                </div>
                <span className="text-zinc-300 text-lg">→</span>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-zinc-400 mb-0.5">Destino</p>
                  <p className="font-semibold">{f.destino || '—'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[9px] uppercase tracking-widest text-zinc-400 mb-0.5">Distância</p>
                <p className="font-semibold">{totals.kmTotal.toLocaleString('pt-PT')} km <span className="text-[10px] font-normal text-zinc-400">{f.idaVolta ? '(ida e volta)' : '(só ida)'}</span></p>
              </div>
            </div>
          </section>

          {/* Resumo — apenas LISTAGEM sem valores individuais */}
          <section className="mb-10">
            <p className="text-[9px] tracking-[0.4em] uppercase text-zinc-400 mb-3">Inclui</p>
            <ul className="space-y-2.5 text-[13px] leading-relaxed">
              {totals.subKm > 0 && (
                <li className="flex items-start gap-3">
                  <span className="text-zinc-300 mt-0.5">·</span>
                  <span><strong>Deslocação</strong> — {totals.kmTotal.toLocaleString('pt-PT')} km {f.idaVolta ? '(ida e volta)' : ''}</span>
                </li>
              )}
              {totals.subPortagens > 0 && (
                <li className="flex items-start gap-3">
                  <span className="text-zinc-300 mt-0.5">·</span>
                  <span><strong>Portagens</strong></span>
                </li>
              )}
              {totals.subRefeicoes > 0 && (
                <li className="flex items-start gap-3">
                  <span className="text-zinc-300 mt-0.5">·</span>
                  <span><strong>Refeições</strong> da equipa ({f.numPessoas} {f.numPessoas === 1 ? 'pessoa' : 'pessoas'} · {f.numRefeicoes} {f.numRefeicoes === 1 ? 'refeição' : 'refeições'})</span>
                </li>
              )}
              {totals.subViagem > 0 && (
                <li className="flex items-start gap-3">
                  <span className="text-zinc-300 mt-0.5">·</span>
                  <span><strong>Horas de viagem</strong> ({f.horasViagem}h)</span>
                </li>
              )}
              {totals.subServico > 0 && (
                <li className="flex items-start gap-3">
                  <span className="text-zinc-300 mt-0.5">·</span>
                  <span><strong>Horas de serviço</strong> ({f.horasServico}h)</span>
                </li>
              )}
              {totals.subDormida > 0 && (
                <li className="flex items-start gap-3">
                  <span className="text-zinc-300 mt-0.5">·</span>
                  <span><strong>Estadia</strong> ({f.numPessoas} {f.numPessoas === 1 ? 'pessoa' : 'pessoas'} · {f.noites} {f.noites === 1 ? 'noite' : 'noites'})</span>
                </li>
              )}
            </ul>
          </section>

          {/* TOTAL — destaque grande */}
          <section className="mb-10">
            <div className="border-t-2 border-zinc-900 pt-6 flex items-end justify-between">
              <div>
                <p className="text-[10px] tracking-[0.5em] uppercase text-zinc-500 mb-1">Total</p>
                <p className="text-[11px] text-zinc-400 tracking-wide">Valor total da deslocação</p>
              </div>
              <p className="text-[36px] font-light tracking-tight text-zinc-900 leading-none">{fmt(totals.total)}</p>
            </div>
          </section>

          {f.observacoes && (
            <section className="mb-10">
              <p className="text-[9px] tracking-[0.4em] uppercase text-zinc-400 mb-3">Observações</p>
              <p className="text-[12px] text-zinc-700 leading-relaxed whitespace-pre-wrap">{f.observacoes}</p>
            </section>
          )}

          {/* Condições gerais — discreto */}
          <section className="mb-12 text-[10px] text-zinc-500 leading-relaxed">
            <p className="text-[9px] tracking-[0.4em] uppercase text-zinc-400 mb-2">Condições</p>
            <p>
              Orçamento válido por 30 dias. Valores em euros, com IVA incluído quando aplicável.
              A deslocação inclui ida e volta entre a sede da prestadora e o local indicado.
              Em caso de cancelamento, podem ser cobrados custos já incorridos.
            </p>
          </section>

          {/* Rodapé */}
          <footer className="pt-6 border-t border-zinc-200 text-center">
            <p className="text-[9px] tracking-[0.45em] uppercase text-zinc-500 mb-1.5"><strong>RL Photo · Video</strong> — Photography &amp; Video</p>
            <p className="text-[9px] text-zinc-400 tracking-wide">Centro Comercial Os Mochos, Loja 124 · 2955-185 Pinhal Novo</p>
            <p className="text-[9px] text-zinc-400 tracking-wide">NIF 238 076 415 · geral.rlphoto@gmail.com · +351 916 162 728</p>
          </footer>
        </div>
      </main>
    </>
  )
}

// ─── Sub-componentes ─────────────────────────────────────────────────────
function Row({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-baseline justify-between mb-2">
      <div className="min-w-0">
        <p className="text-[12px] text-white/65">{label}</p>
        {sub && <p className="text-[10px] text-white/25 mt-0.5">{sub}</p>}
      </div>
      <span className="text-sm font-mono text-white/90 shrink-0 ml-3">{value}</span>
    </div>
  )
}

