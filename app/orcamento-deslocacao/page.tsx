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
    const total = subKm + subPortagens + subRefeicoes + subViagem + subServico + subDormida
    return { kmTotal, subKm, subPortagens, subRefeicoes, subViagem, subServico, subDormida, total }
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
        <div className="print-only max-w-[800px] mx-auto px-10 py-8">

          {/* Cabeçalho — logo + dados da empresa (mesmo padrão do contrato) */}
          <div className="flex items-start justify-between mb-10 pb-6 border-b-2 border-black">
            <div className="flex items-center gap-5">
              <img
                src="https://awwbkmprgtwmnejeuiak.supabase.co/storage/v1/object/public/portal-images/logo_rl_gold.png"
                alt="RL Photo Video"
                width={90}
                height={90}
                className="object-contain"
                style={{ width: '90px', height: '90px' }}
              />
              <div>
                <h1 className="text-2xl font-black tracking-[0.15em] uppercase text-black">RL PHOTO.VIDEO</h1>
                <p className="text-xs text-zinc-500 mt-1">Fotografia &amp; Vídeo de Casamentos</p>
              </div>
            </div>
            <div className="text-right text-[11px] text-zinc-600 leading-relaxed">
              <p><strong>NIF:</strong> 238 076 415</p>
              <p><strong>CAE:</strong> 74200</p>
              <p>geral.rlphoto@gmail.com</p>
              <p>+351 916 162 728</p>
            </div>
          </div>

          {/* Título */}
          <div className="text-center mb-10">
            <h2 className="text-xl font-black tracking-[0.2em] uppercase mb-2 text-black">Orçamento de Deslocação</h2>
            <p className="text-xs text-zinc-500 tracking-widest uppercase">
              Emitido em {new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* 1. Identificação das Partes */}
          <section className="mb-8">
            <h3 className="text-[10px] font-black tracking-[0.3em] uppercase border-b border-zinc-200 pb-2 mb-4 text-black">
              1. Identificação das Partes
            </h3>

            <div className="space-y-5">
              <div>
                <p className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase mb-1">Primeira Outorgante (Prestadora)</p>
                <p className="text-sm leading-relaxed text-zinc-800">
                  <strong>Liliana Sofia Fernandes Barreto Gonçalves</strong>, a exercer sob a marca <strong>RL Photo — Fotografia &amp; Vídeo</strong>,
                  contribuinte n.º <strong>238 076 415</strong>, CAE <strong>74200</strong> (Atividades Fotográficas/Vídeo),
                  com sede em <strong>Centro Comercial Os Mochos, Loja 124, 2955-185 Pinhal Novo</strong>,
                  e-mail <strong>geral.rlphoto@gmail.com</strong>, telefone <strong>+351 916 162 728</strong>.
                </p>
              </div>

              {(f.cliente || f.evento || f.data || f.destino) && (
                <div>
                  <p className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase mb-1">Segunda Outorgante (Cliente)</p>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                    {f.cliente && <div><span className="text-zinc-400 text-[10px] block mb-0.5">Nome</span><strong>{f.cliente}</strong></div>}
                    {f.evento  && <div><span className="text-zinc-400 text-[10px] block mb-0.5">Tipo de evento</span><strong>{f.evento}</strong></div>}
                    {f.data    && <div><span className="text-zinc-400 text-[10px] block mb-0.5">Data do evento</span><strong>{new Date(f.data + 'T12:00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}</strong></div>}
                    {f.destino && <div><span className="text-zinc-400 text-[10px] block mb-0.5">Local</span><strong>{f.destino}</strong></div>}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 2. Trajeto */}
          <section className="mb-8">
            <h3 className="text-[10px] font-black tracking-[0.3em] uppercase border-b border-zinc-200 pb-2 mb-4 text-black">
              2. Trajeto
            </h3>
            <div className="bg-zinc-50 rounded-lg p-4 text-sm grid grid-cols-3 gap-3">
              <div>
                <span className="text-zinc-400 text-[10px] block mb-0.5 uppercase tracking-wider">Origem</span>
                <strong>{f.origem || '—'}</strong>
              </div>
              <div>
                <span className="text-zinc-400 text-[10px] block mb-0.5 uppercase tracking-wider">Destino</span>
                <strong>{f.destino || '—'}</strong>
              </div>
              <div>
                <span className="text-zinc-400 text-[10px] block mb-0.5 uppercase tracking-wider">Distância</span>
                <strong>{totals.kmTotal.toLocaleString('pt-PT')} km</strong>
                <span className="text-zinc-400 text-[10px] ml-1">{f.idaVolta ? '(ida e volta)' : '(só ida)'}</span>
              </div>
            </div>
          </section>

          {/* 3. Detalhe dos Custos */}
          <section className="mb-8">
            <h3 className="text-[10px] font-black tracking-[0.3em] uppercase border-b border-zinc-200 pb-2 mb-4 text-black">
              3. Detalhe dos Custos
            </h3>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-zinc-300">
                  <th className="text-left py-2 text-[10px] tracking-widest uppercase text-zinc-500 font-bold">Item</th>
                  <th className="text-left py-2 text-[10px] tracking-widest uppercase text-zinc-500 font-bold">Detalhe</th>
                  <th className="text-right py-2 text-[10px] tracking-widest uppercase text-zinc-500 font-bold">Valor</th>
                </tr>
              </thead>
              <tbody>
                <PrintRow label="Deslocação" detail={`${totals.kmTotal} km × ${fmt(f.valorPorKm)}/km${f.idaVolta ? ' (ida e volta)' : ''}`} valor={totals.subKm} />
                {totals.subPortagens > 0 && <PrintRow label="Portagens" detail="Valor total da via" valor={totals.subPortagens} />}
                {totals.subRefeicoes > 0 && <PrintRow label="Refeições" detail={`${f.numPessoas} pessoas × ${f.numRefeicoes} refeições × ${fmt(f.valorRefeicao)}`} valor={totals.subRefeicoes} />}
                {totals.subViagem > 0 && <PrintRow label="Horas de viagem" detail={`${f.horasViagem}h × ${fmt(f.valorHoraViagem)}/h`} valor={totals.subViagem} />}
                {totals.subServico > 0 && <PrintRow label="Horas de serviço extra" detail={`${f.horasServico}h × ${fmt(f.valorHoraServico)}/h`} valor={totals.subServico} />}
                {totals.subDormida > 0 && <PrintRow label="Estadia" detail={`${f.numPessoas} pessoas × ${f.noites} noite(s) × ${fmt(f.valorNoite)}`} valor={totals.subDormida} />}
                <tr className="bg-black text-white">
                  <td colSpan={2} className="py-3 px-2 text-sm tracking-widest uppercase font-bold">TOTAL A LIQUIDAR</td>
                  <td className="py-3 px-2 text-right text-xl font-black">{fmt(totals.total)}</td>
                </tr>
              </tbody>
            </table>
          </section>

          {f.observacoes && (
            <section className="mb-8">
              <h3 className="text-[10px] font-black tracking-[0.3em] uppercase border-b border-zinc-200 pb-2 mb-4 text-black">
                4. Observações
              </h3>
              <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">{f.observacoes}</p>
            </section>
          )}

          {/* Condições gerais */}
          <section className="mb-8 text-[11px] text-zinc-600 leading-relaxed">
            <h3 className="text-[10px] font-black tracking-[0.3em] uppercase border-b border-zinc-200 pb-2 mb-3 text-black">
              Condições Gerais
            </h3>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>O presente orçamento é válido por <strong>30 dias</strong> a partir da data de emissão.</li>
              <li>Valores apresentados em <strong>Euros (€)</strong>, com IVA incluído quando aplicável.</li>
              <li>A deslocação inclui a viagem de ida e volta entre a sede da prestadora e o local indicado.</li>
              <li>O pagamento dos custos de deslocação é faturado em separado do serviço de fotografia/vídeo.</li>
              <li>Em caso de cancelamento por parte do cliente, podem ser cobrados custos já incorridos (portagens, estadias confirmadas).</li>
            </ul>
          </section>

          {/* Rodapé */}
          <div className="pt-6 border-t border-zinc-300 text-center">
            <p className="text-[10px] tracking-[0.4em] uppercase text-zinc-500 mb-1">RL Photo · Video · Photography &amp; Video</p>
            <p className="text-[10px] text-zinc-400">Centro Comercial Os Mochos, Loja 124, 2955-185 Pinhal Novo</p>
            <p className="text-[10px] text-zinc-400">NIF 238 076 415 · geral.rlphoto@gmail.com · +351 916 162 728</p>
          </div>
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

function PrintRow({ label, detail, valor }: { label: string; detail: string; valor: number }) {
  return (
    <tr className="border-b border-gray-200">
      <td className="py-2 font-semibold">{label}</td>
      <td className="py-2 text-gray-600 text-[12px]">{detail}</td>
      <td className="py-2 text-right font-mono">{valor.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</td>
    </tr>
  )
}
