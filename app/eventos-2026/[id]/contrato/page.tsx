'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function formatDate(d: string | null) {
  if (!d) return '___/___/______'
  const dt = new Date(d + 'T00:00:00')
  return `${String(dt.getDate()).padStart(2,'0')} de ${MESES[dt.getMonth()]} de ${dt.getFullYear()}`
}

function fmt(v: string | null | undefined) {
  return v && v.trim() ? v.trim() : '____________________________'
}

function fmtVal(v: number | null) {
  if (!v) return '______ €'
  return v.toLocaleString('pt-PT', { minimumFractionDigits: 2 }) + ' €'
}

export default function ContratoPage() {
  const { id } = useParams<{ id: string }>()
  const [evento, setEvento] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    fetch(`/api/eventos-notion/${id}`)
      .then(r => r.json())
      .then(d => { if (d.event) setEvento(d.event) })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center">
      <span className="text-white/20 text-xs tracking-widest">A carregar...</span>
    </main>
  )

  if (!evento) return (
    <main className="min-h-screen flex items-center justify-center">
      <span className="text-red-400/60 text-sm">Evento não encontrado.</span>
    </main>
  )

  const e = evento
  const hoje = formatDate(new Date().toISOString().split('T')[0])
  const totalServicos = (e.valor_foto ?? 0) + (e.valor_video ?? 0) + (e.valor_extras ?? 0)
  const valorSinal = e.valor_liquido ? Math.round(e.valor_liquido * 0.3) : null
  const valorResto = e.valor_liquido && valorSinal ? e.valor_liquido - valorSinal : null

  const servicosFoto: string[] = e.servico_foto ?? []
  const servicosVideo: string[] = e.servico_video ?? []
  const servicosExtra: string[] = e.servico_extra ?? []

  return (
    <main className="min-h-screen bg-white text-black">
      {/* Toolbar — não imprime */}
      <div className="print:hidden sticky top-0 z-50 bg-zinc-900 border-b border-white/10 px-6 py-3 flex items-center gap-4">
        <Link href={`/eventos-2026/${id}`}
          className="flex items-center gap-2 text-xs text-white/50 hover:text-white/80 transition-colors">
          ‹ Voltar
        </Link>
        <div className="flex-1" />
        <span className="text-xs text-white/30 tracking-widest uppercase">{e.referencia} — {e.cliente}</span>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-black text-xs font-bold tracking-wider hover:bg-amber-400 transition-all">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Imprimir / Guardar PDF
        </button>
      </div>

      {/* Documento */}
      <div className="max-w-[800px] mx-auto px-10 py-12 print:px-8 print:py-8">

        {/* Cabeçalho */}
        <div className="flex items-start justify-between mb-10 pb-6 border-b-2 border-black">
          <div>
            <h1 className="text-2xl font-black tracking-[0.15em] uppercase">RL PHOTO.VIDEO</h1>
            <p className="text-xs text-zinc-500 mt-1">Fotografia & Vídeo de Casamentos</p>
          </div>
          <div className="text-right text-xs text-zinc-500 space-y-0.5">
            <p>NIF: 309 268 834</p>
            <p>geral.rlphoto@gmail.com</p>
            <p>+351 915 892 757</p>
          </div>
        </div>

        {/* Título */}
        <div className="text-center mb-10">
          <h2 className="text-xl font-black tracking-[0.2em] uppercase mb-2">Contrato de Prestação de Serviços</h2>
          <p className="text-xs text-zinc-400 tracking-widest uppercase">Referência: {e.referencia}</p>
        </div>

        {/* Identificação das partes */}
        <section className="mb-8">
          <h3 className="text-[10px] font-black tracking-[0.3em] uppercase border-b border-zinc-200 pb-2 mb-4">
            1. Identificação das Partes
          </h3>

          <div className="space-y-5">
            <div>
              <p className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase mb-1">Primeira Outorgante (Prestador de Serviços)</p>
              <p className="text-sm leading-relaxed">
                <strong>RL PHOTO.VIDEO</strong>, contribuinte n.º <strong>309 268 834</strong>, com sede em Portugal,
                contacto <strong>+351 915 892 757</strong> e e-mail <strong>geral.rlphoto@gmail.com</strong>,
                doravante designada como <strong>PRESTADOR</strong>.
              </p>
            </div>

            <div>
              <p className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase mb-1">Segunda Outorgante (Cliente)</p>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm leading-relaxed">
                <div>
                  <span className="text-zinc-400 text-xs">Nome (Noiva): </span>
                  <strong>{fmt(e.nome_noiva)}</strong>
                </div>
                <div>
                  <span className="text-zinc-400 text-xs">Nome (Noivo): </span>
                  <strong>{fmt(e.nome_noivo)}</strong>
                </div>
                <div>
                  <span className="text-zinc-400 text-xs">C.C. (Noiva): </span>
                  {fmt(e.cc_noiva)}
                </div>
                <div>
                  <span className="text-zinc-400 text-xs">C.C. (Noivo): </span>
                  {fmt(e.cc_noivo)}
                </div>
                <div>
                  <span className="text-zinc-400 text-xs">NIF (Noiva): </span>
                  {fmt(e.nif_noiva)}
                </div>
                <div>
                  <span className="text-zinc-400 text-xs">NIF (Noivo): </span>
                  {fmt(e.nif_noivo)}
                </div>
                <div className="col-span-2">
                  <span className="text-zinc-400 text-xs">Morada: </span>
                  {fmt(e.morada_noiva || e.morada_noivo)}
                </div>
                <div>
                  <span className="text-zinc-400 text-xs">E-mail: </span>
                  {fmt(e.email_noiva || e.email_noivo)}
                </div>
                <div>
                  <span className="text-zinc-400 text-xs">Telefone: </span>
                  {fmt(e.tel_noiva || e.tel_noivo)}
                </div>
              </div>
              <p className="text-sm mt-2">doravante designados como <strong>CLIENTE</strong>.</p>
            </div>
          </div>
        </section>

        {/* Objeto do contrato */}
        <section className="mb-8">
          <h3 className="text-[10px] font-black tracking-[0.3em] uppercase border-b border-zinc-200 pb-2 mb-4">
            2. Objeto do Contrato
          </h3>
          <p className="text-sm leading-relaxed mb-4">
            O presente contrato tem por objeto a prestação de serviços de fotografia e/ou vídeo pelo PRESTADOR ao CLIENTE,
            para o seguinte evento:
          </p>
          <div className="bg-zinc-50 rounded-lg p-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-zinc-400 text-xs block">Tipo de Evento</span>
              <strong>{e.tipo_evento?.join(', ') || '____________________________'}</strong>
            </div>
            <div>
              <span className="text-zinc-400 text-xs block">Data do Evento</span>
              <strong>{formatDate(e.data_evento)}</strong>
            </div>
            <div className="col-span-2">
              <span className="text-zinc-400 text-xs block">Local</span>
              <strong>{fmt(e.local)}</strong>
            </div>
          </div>
        </section>

        {/* Serviços */}
        <section className="mb-8">
          <h3 className="text-[10px] font-black tracking-[0.3em] uppercase border-b border-zinc-200 pb-2 mb-4">
            3. Serviços Contratados
          </h3>

          {e.proposta && (
            <p className="text-sm mb-4">
              Pacote escolhido: <strong className="uppercase">{e.proposta}</strong>
            </p>
          )}

          <div className={`grid gap-4 ${servicosFoto.length > 0 && servicosVideo.length > 0 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {servicosFoto.length > 0 && (
              <div className="border border-zinc-200 rounded-lg overflow-hidden">
                <div className="bg-zinc-100 px-4 py-2 text-[10px] font-bold tracking-widest uppercase">Fotografia</div>
                <ul className="p-4 space-y-1.5">
                  {servicosFoto.map((s: string, i: number) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-zinc-400 mt-1">•</span>{s}
                    </li>
                  ))}
                </ul>
                {e.valor_foto && (
                  <div className="border-t border-zinc-100 px-4 py-2 flex justify-between text-sm">
                    <span className="text-zinc-400">Valor</span>
                    <strong>{fmtVal(e.valor_foto)}</strong>
                  </div>
                )}
              </div>
            )}
            {servicosVideo.length > 0 && (
              <div className="border border-zinc-200 rounded-lg overflow-hidden">
                <div className="bg-zinc-100 px-4 py-2 text-[10px] font-bold tracking-widest uppercase">Vídeo</div>
                <ul className="p-4 space-y-1.5">
                  {servicosVideo.map((s: string, i: number) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-zinc-400 mt-1">•</span>{s}
                    </li>
                  ))}
                </ul>
                {e.valor_video && (
                  <div className="border-t border-zinc-100 px-4 py-2 flex justify-between text-sm">
                    <span className="text-zinc-400">Valor</span>
                    <strong>{fmtVal(e.valor_video)}</strong>
                  </div>
                )}
              </div>
            )}
          </div>

          {servicosExtra.length > 0 && (
            <div className="mt-4 border border-zinc-200 rounded-lg overflow-hidden">
              <div className="bg-zinc-100 px-4 py-2 text-[10px] font-bold tracking-widest uppercase">Serviços Extra</div>
              <ul className="p-4 grid grid-cols-2 gap-1.5">
                {servicosExtra.map((s: string, i: number) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-zinc-400 mt-1">•</span>{s}
                  </li>
                ))}
              </ul>
              {e.valor_extras && (
                <div className="border-t border-zinc-100 px-4 py-2 flex justify-between text-sm">
                  <span className="text-zinc-400">Valor extras</span>
                  <strong>{fmtVal(e.valor_extras)}</strong>
                </div>
              )}
            </div>
          )}

          {e.valor_liquido && (
            <div className="mt-4 flex items-center justify-between px-4 py-3 bg-black text-white rounded-lg">
              <span className="text-xs tracking-widest uppercase font-bold">Total do Contrato</span>
              <span className="text-lg font-black">{fmtVal(e.valor_liquido)}</span>
            </div>
          )}
        </section>

        {/* Condições de Pagamento */}
        <section className="mb-8">
          <h3 className="text-[10px] font-black tracking-[0.3em] uppercase border-b border-zinc-200 pb-2 mb-4">
            4. Condições de Pagamento
          </h3>
          <div className="space-y-3 text-sm leading-relaxed">
            <div className="flex items-start gap-3 p-3 bg-zinc-50 rounded-lg">
              <span className="font-black text-zinc-400 text-xs mt-0.5 w-24 flex-shrink-0">Sinal (30%)</span>
              <span>
                {valorSinal ? <><strong>{fmtVal(valorSinal)}</strong> — a pagar no momento da assinatura do presente contrato.</> : 'A acordar entre as partes.'}
              </span>
            </div>
            <div className="flex items-start gap-3 p-3 bg-zinc-50 rounded-lg">
              <span className="font-black text-zinc-400 text-xs mt-0.5 w-24 flex-shrink-0">Restante (70%)</span>
              <span>
                {valorResto ? <><strong>{fmtVal(valorResto)}</strong> — a pagar até ao dia do evento.</> : 'A pagar até ao dia do evento.'}
              </span>
            </div>
          </div>
          <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
            O pagamento poderá ser efetuado por transferência bancária ou outros meios acordados entre as partes.
            O sinal não é reembolsável em caso de desistência por parte do CLIENTE.
          </p>
        </section>

        {/* Cláusulas */}
        <section className="mb-8">
          <h3 className="text-[10px] font-black tracking-[0.3em] uppercase border-b border-zinc-200 pb-2 mb-4">
            5. Cláusulas Gerais
          </h3>
          <div className="space-y-3 text-sm leading-relaxed text-zinc-700">
            <p><strong>5.1</strong> O PRESTADOR compromete-se a estar presente no local e data acordados, com todo o equipamento necessário à realização dos serviços contratados.</p>
            <p><strong>5.2</strong> O PRESTADOR entregará os trabalhos finalizados nos prazos acordados, salvo situações de força maior devidamente comunicadas ao CLIENTE.</p>
            <p><strong>5.3</strong> O CLIENTE autoriza o PRESTADOR a utilizar as imagens e vídeos produzidos para efeitos de portfólio e promoção dos seus serviços, salvo indicação contrária expressa e por escrito.</p>
            <p><strong>5.4</strong> Em caso de força maior que impossibilite a prestação dos serviços por parte do PRESTADOR, este obriga-se a devolver os valores já recebidos ou a apresentar alternativa acordada com o CLIENTE.</p>
            <p><strong>5.5</strong> A rescisão do presente contrato por parte do CLIENTE implica a perda do sinal pago. Em caso de rescisão a menos de 60 dias do evento, poderá ser exigida compensação adicional.</p>
            <p><strong>5.6</strong> Para a resolução de quaisquer litígios emergentes do presente contrato, as partes elegem o foro da comarca de Portugal, com renúncia a qualquer outro.</p>
          </div>
        </section>

        {/* Assinaturas */}
        <section className="mb-8">
          <h3 className="text-[10px] font-black tracking-[0.3em] uppercase border-b border-zinc-200 pb-2 mb-6">
            6. Assinaturas
          </h3>
          <p className="text-sm text-zinc-600 mb-8">
            O presente contrato é celebrado em duplicado, ficando um exemplar na posse de cada uma das partes, e entra em vigor na data da sua assinatura.
          </p>
          <p className="text-sm mb-10">Assinado em ______________________________, aos {hoje}.</p>

          <div className="grid grid-cols-2 gap-16">
            <div>
              <div className="border-b border-zinc-400 mb-3 h-12" />
              <p className="text-xs text-zinc-500 text-center">O PRESTADOR DE SERVIÇOS</p>
              <p className="text-xs font-bold text-center mt-1">RL PHOTO.VIDEO</p>
            </div>
            <div>
              <div className="border-b border-zinc-400 mb-3 h-12" />
              <p className="text-xs text-zinc-500 text-center">O CLIENTE</p>
              <p className="text-xs font-bold text-center mt-1">{e.nome_noiva && e.nome_noivo ? `${e.nome_noiva} & ${e.nome_noivo}` : e.cliente || '____________________________'}</p>
            </div>
          </div>
        </section>

      </div>

      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body { background: white; }
          @page { margin: 1.5cm; size: A4; }
        }
      `}</style>
    </main>
  )
}
