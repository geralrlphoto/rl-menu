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
  // ── Margem de Lucro (slider em €, 5 em 5) ───────────
  margemEuros: 0,             // valor fixo em € a somar ao subtotal
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

    // Margem de lucro — valor fixo em € (slider de 5 em 5) somado ao subtotal
    const margemValor = Math.max(0, Number(f.margemEuros) || 0)
    const total       = subtotal + margemValor

    return {
      kmTotal, subKm, subPortagens, subRefeicoes, subViagem, subServico, subDormida,
      subtotal, margemValor, total,
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

            {/* ── Margem de Lucro — slider em €, 5 em 5 ─────────────────── */}
            <div className={sectionCls}>
              <h2 className={sectionTitle}><span className="w-2 h-2 rounded-full bg-emerald-400" /> Margem de Lucro</h2>

              <div className="flex items-baseline justify-between mb-2">
                <span className="text-[11px] tracking-[0.3em] text-white/40 uppercase">Margem</span>
                <span className="text-2xl font-bold text-emerald-300">{fmt(totals.margemValor)}</span>
              </div>

              <input
                type="range" min="0" max="200" step="1"
                value={f.margemEuros}
                onChange={e => set('margemEuros', Number(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer h-1"
              />

              <div className="flex items-baseline justify-between mt-1">
                <span className="text-[10px] text-white/30">0 €</span>
                <span className="text-[10px] text-white/30">200 €</span>
              </div>

              {/* Presets — clicar SUBSTITUI o valor */}
              <div className="grid grid-cols-4 gap-2 mt-4">
                {[30, 50, 75].map(v => {
                  const ativo = Number(f.margemEuros) === v
                  return (
                    <button key={v} type="button" onClick={() => set('margemEuros', v)}
                      className={`px-3 py-2.5 rounded-lg text-sm tracking-widest font-bold transition-all border ${
                        ativo
                          ? 'bg-emerald-400 text-black border-emerald-400'
                          : 'border-emerald-400/30 text-emerald-300/80 hover:bg-emerald-400/10 hover:border-emerald-400/60'
                      }`}>
                      {v} €
                    </button>
                  )
                })}
                <button type="button" onClick={() => set('margemEuros', 0)}
                  className="px-3 py-2.5 rounded-lg text-sm tracking-widest font-bold border border-white/15 text-white/45 hover:bg-white/[0.05] transition-all">
                  Zero
                </button>
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
        {/* Design no mesmo padrão do contrato — secções numeradas + assinaturas */}
        <div className="print-only max-w-[800px] mx-auto px-10 py-10 text-zinc-900">

          {/* Cabeçalho */}
          <header className="flex items-start justify-between mb-10 pb-6 border-b-2 border-black">
            <div className="flex items-center gap-5">
              <img
                src="https://awwbkmprgtwmnejeuiak.supabase.co/storage/v1/object/public/portal-images/logo_rl_gold.png"
                alt="RL Photo Video"
                width={80} height={80}
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

          {/* Título centrado */}
          <div className="text-center mb-10">
            <h2 className="text-xl font-black tracking-[0.25em] uppercase mb-2">Orçamento de Deslocação</h2>
            <p className="text-[11px] text-zinc-400 tracking-widest uppercase">
              {new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
            <div className="mt-3 flex items-center justify-center gap-3">
              <div className="h-px w-12 bg-zinc-300" />
              <span className="text-zinc-300 text-sm">◆</span>
              <div className="h-px w-12 bg-zinc-300" />
            </div>
          </div>

          {/* 1. Identificação das Partes */}
          <section className="mb-8">
            <h3 className="text-[10px] font-black tracking-[0.3em] uppercase border-b border-zinc-200 pb-2 mb-4">
              1. Identificação das Partes
            </h3>
            <div className="space-y-5">
              <div>
                <p className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase mb-1">Primeira Outorgante (Prestadora)</p>
                <p className="text-sm leading-relaxed">
                  <strong>Liliana Sofia Fernandes Barreto Gonçalves</strong>, a exercer sob a marca <strong>RL Photo — Fotografia &amp; Vídeo</strong>,
                  contribuinte n.º <strong>238 076 415</strong>, CAE <strong>74200</strong> (Atividades Fotográficas/Vídeo),
                  com sede em <strong>Centro Comercial Os Mochos, Loja 124, 2955-185 Pinhal Novo</strong>,
                  e-mail <strong>geral.rlphoto@gmail.com</strong>, telefone <strong>+351 916 162 728</strong>,
                  doravante designada como <strong>PRESTADORA</strong>.
                </p>
              </div>
              {(f.cliente) && (
                <div>
                  <p className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase mb-1">Segunda Outorgante (Cliente)</p>
                  <p className="text-sm leading-relaxed">
                    <strong>{f.cliente}</strong>, doravante designado como <strong>CLIENTE</strong>.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* 2. Objeto */}
          <section className="mb-8">
            <h3 className="text-[10px] font-black tracking-[0.3em] uppercase border-b border-zinc-200 pb-2 mb-4">
              2. Objeto do Orçamento
            </h3>
            <p className="text-sm leading-relaxed mb-4">
              O presente orçamento refere-se às despesas de <strong>deslocação, refeições, horas de viagem/serviço e estadia</strong> da equipa da PRESTADORA para a cobertura do seguinte evento:
            </p>
            <div className="bg-zinc-50 rounded-lg p-4 grid grid-cols-2 gap-3 text-sm">
              {f.evento  && <div><span className="text-zinc-400 text-xs block mb-0.5">Tipo de Evento</span><strong>{f.evento}</strong></div>}
              {f.data    && <div><span className="text-zinc-400 text-xs block mb-0.5">Data do Evento</span><strong>{new Date(f.data + 'T12:00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}</strong></div>}
              {f.destino && <div className="col-span-2"><span className="text-zinc-400 text-xs block mb-0.5">Local</span><strong>{f.destino}</strong></div>}
            </div>
          </section>

          {/* 3. Trajeto */}
          <section className="mb-8">
            <h3 className="text-[10px] font-black tracking-[0.3em] uppercase border-b border-zinc-200 pb-2 mb-4">
              3. Trajeto da Deslocação
            </h3>
            <div className="bg-zinc-50 rounded-lg p-4 grid grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-zinc-400 text-xs block mb-0.5">Origem</span>
                <strong>{f.origem || '—'}</strong>
              </div>
              <div>
                <span className="text-zinc-400 text-xs block mb-0.5">Destino</span>
                <strong>{f.destino || '—'}</strong>
              </div>
              <div>
                <span className="text-zinc-400 text-xs block mb-0.5">Distância Total</span>
                <strong>{totals.kmTotal.toLocaleString('pt-PT')} km</strong>
                <span className="text-[10px] text-zinc-400 ml-1">{f.idaVolta ? '(ida e volta)' : '(só ida)'}</span>
              </div>
            </div>
          </section>

          {/* 4. Serviços Incluídos */}
          <section className="mb-8">
            <h3 className="text-[10px] font-black tracking-[0.3em] uppercase border-b border-zinc-200 pb-2 mb-4">
              4. Serviços e Despesas Incluídas
            </h3>
            <ul className="space-y-2.5 text-sm leading-relaxed">
              {totals.subKm > 0 && (
                <li className="flex items-start gap-3">
                  <span className="text-zinc-400 mt-0.5">◆</span>
                  <span>
                    <strong>Deslocação</strong> — {totals.kmTotal.toLocaleString('pt-PT')} km {f.idaVolta ? '(ida e volta)' : '(só ida)'} entre <em>{f.origem}</em> e <em>{f.destino || 'local do evento'}</em>.
                  </span>
                </li>
              )}
              {totals.subPortagens > 0 && (
                <li className="flex items-start gap-3">
                  <span className="text-zinc-400 mt-0.5">◆</span>
                  <span><strong>Portagens</strong> — custos de portagem incluídos no trajeto.</span>
                </li>
              )}
              {totals.subRefeicoes > 0 && (
                <li className="flex items-start gap-3">
                  <span className="text-zinc-400 mt-0.5">◆</span>
                  <span>
                    <strong>Refeições da equipa</strong> — {f.numPessoas} {f.numPessoas === 1 ? 'pessoa' : 'pessoas'},
                    {' '}{f.numRefeicoes} {f.numRefeicoes === 1 ? 'refeição' : 'refeições'} {f.numPessoas > 1 ? 'cada' : ''}.
                  </span>
                </li>
              )}
              {totals.subViagem > 0 && (
                <li className="flex items-start gap-3">
                  <span className="text-zinc-400 mt-0.5">◆</span>
                  <span><strong>Horas de viagem</strong> — {f.horasViagem}h de deslocação.</span>
                </li>
              )}
              {totals.subServico > 0 && (
                <li className="flex items-start gap-3">
                  <span className="text-zinc-400 mt-0.5">◆</span>
                  <span><strong>Horas de serviço extra</strong> — {f.horasServico}h adicionais para além do pacote contratado.</span>
                </li>
              )}
              {totals.subDormida > 0 && (
                <li className="flex items-start gap-3">
                  <span className="text-zinc-400 mt-0.5">◆</span>
                  <span>
                    <strong>Estadia</strong> — alojamento para {f.numPessoas} {f.numPessoas === 1 ? 'pessoa' : 'pessoas'}
                    {' '}durante {f.noites} {f.noites === 1 ? 'noite' : 'noites'}.
                  </span>
                </li>
              )}
            </ul>
          </section>

          {/* 5. Valor */}
          <section className="mb-10">
            <h3 className="text-[10px] font-black tracking-[0.3em] uppercase border-b border-zinc-200 pb-2 mb-4">
              5. Valor a Liquidar
            </h3>
            <div className="bg-black text-white rounded-lg px-6 py-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] tracking-[0.4em] uppercase mb-1" style={{ color: '#C9A84C' }}>Total da Deslocação</p>
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

          {/* Condições gerais */}
          <section className="mb-10 text-[11px] text-zinc-600 leading-relaxed">
            <h3 className="text-[10px] font-black tracking-[0.3em] uppercase border-b border-zinc-200 pb-2 mb-3 text-zinc-900">
              Condições Gerais
            </h3>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>O presente orçamento é <strong>válido por 30 dias</strong> a partir da data de emissão.</li>
              <li>Valores apresentados em <strong>euros (€)</strong>, com IVA incluído quando aplicável.</li>
              <li>A deslocação inclui a viagem entre a sede da PRESTADORA e o local do evento indicado.</li>
              <li>O pagamento dos custos de deslocação é faturado em <strong>separado</strong> do serviço de fotografia/vídeo.</li>
              <li>Em caso de cancelamento por parte do CLIENTE, podem ser cobrados <strong>custos já incorridos</strong> (portagens, estadias confirmadas, etc.).</li>
              <li>Alterações ao local, data ou número de pessoas implicam recálculo do orçamento.</li>
            </ul>
          </section>

          {/* Local + Data + Assinaturas */}
          <section className="mb-8">
            <h3 className="text-[10px] font-black tracking-[0.3em] uppercase border-b border-zinc-200 pb-2 mb-6">
              Aceitação
            </h3>
            <p className="text-sm text-zinc-600 mb-8">
              Para aceitar o presente orçamento, basta assinar e devolver uma cópia à PRESTADORA, ou confirmar por escrito (email).
            </p>
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
                <p className="text-xs text-zinc-500 text-center">O CLIENTE</p>
                <p className="text-xs font-bold text-center mt-1">{f.cliente || '____________________________'}</p>
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

