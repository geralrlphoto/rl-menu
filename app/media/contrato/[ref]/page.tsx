import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import PrintButton from './PrintButton'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type Props = { params: Promise<{ ref: string }> }

export default async function ContratoPage({ params }: Props) {
  const { ref } = await params
  const refUp = ref.toUpperCase()

  const { data } = await supabase
    .from('media_portais')
    .select('dados')
    .eq('ref', refUp)
    .single()

  if (!data?.dados?.contrato?.gerado) notFound()

  const ficha = data.dados.ficha ?? {}
  const contrato = data.dados.contrato ?? {}

  const hoje = new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <>
      {/* Barra topo — só no ecrã, não imprime */}
      <div className="print:hidden bg-[#050507] border-b border-white/[0.06] px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <Link href={`/media/ficha-cliente`}
          className="text-[9px] tracking-[0.4em] text-white/30 hover:text-white/60 uppercase transition-colors">
          ‹ Ficha de Cliente
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-[8px] tracking-[0.4em] text-white/20 uppercase">{contrato.ref}</span>
          <span className={`text-[8px] tracking-[0.3em] uppercase px-2 py-1 border ${
            contrato.estado === 'Assinado'
              ? 'border-emerald-400/30 text-emerald-400/60'
              : contrato.estado === 'Enviado ao Cliente'
              ? 'border-blue-400/30 text-blue-400/60'
              : 'border-white/10 text-white/25'
          }`}>{contrato.estado}</span>
          <PrintButton />
        </div>
      </div>

      {/* Documento */}
      <div className="bg-white min-h-screen print:min-h-0">
        <div className="max-w-[800px] mx-auto px-14 py-16 text-[#111]">

          {/* Cabeçalho */}
          <div className="flex items-start justify-between mb-14">
            <div>
              <p className="text-[9px] tracking-[0.35em] text-[#999] uppercase mb-1">Contrato de Prestação de Serviços</p>
              <p className="text-[11px] tracking-[0.25em] text-[#555] uppercase">{contrato.ref}</p>
            </div>
            <div className="text-right">
              <p className="text-[22px] font-light tracking-[0.35em] text-[#111] uppercase">RL Media</p>
              <p className="text-[9px] tracking-[0.2em] text-[#999] uppercase">Audiovisual · rlmedia.pt</p>
            </div>
          </div>

          <div className="h-px bg-[#e0e0e0] mb-12" />

          {/* Partes */}
          <div className="grid grid-cols-2 gap-12 mb-12">
            <div>
              <p className="text-[8px] tracking-[0.5em] text-[#bbb] uppercase mb-4">Prestador de Serviços</p>
              <p className="text-[13px] font-medium text-[#111] mb-1">RL Media</p>
              <p className="text-[12px] text-[#555]">Produção Audiovisual</p>
              <p className="text-[11px] text-[#888] mt-2">geral@rlmedia.pt</p>
              <p className="text-[11px] text-[#888]">rlmedia.pt</p>
            </div>
            <div>
              <p className="text-[8px] tracking-[0.5em] text-[#bbb] uppercase mb-4">Cliente</p>
              <p className="text-[13px] font-medium text-[#111] mb-1">{ficha.nome || '—'}</p>
              {ficha.empresa && <p className="text-[12px] text-[#555]">{ficha.empresa}</p>}
              {ficha.nif && <p className="text-[11px] text-[#888] mt-1">NIF: {ficha.nif}</p>}
              {ficha.email && <p className="text-[11px] text-[#888] mt-1">{ficha.email}</p>}
              {ficha.telefone && <p className="text-[11px] text-[#888]">{ficha.telefone}</p>}
              {ficha.morada && <p className="text-[11px] text-[#888] mt-1">{ficha.morada}</p>}
            </div>
          </div>

          <div className="h-px bg-[#eee] mb-12" />

          {/* Cláusulas */}
          <div className="flex flex-col gap-10">

            {/* 1. Objeto */}
            <div>
              <p className="text-[8px] tracking-[0.5em] text-[#bbb] uppercase mb-3">Cláusula 1.ª — Objeto do Contrato</p>
              <p className="text-[12px] text-[#444] leading-[1.8]">
                O presente contrato tem por objeto a prestação de serviços de{' '}
                <strong>{ficha.tipo || 'Produção Audiovisual'}</strong>{' '}
                {ficha.descricao ? `— ${ficha.descricao}` : 'conforme acordado entre as partes.'}
              </p>
            </div>

            {/* 2. Prazo */}
            <div>
              <p className="text-[8px] tracking-[0.5em] text-[#bbb] uppercase mb-3">Cláusula 2.ª — Prazo e Calendarização</p>
              <div className="flex flex-col gap-2">
                {ficha.dataFilmagem && (
                  <div className="flex items-baseline gap-3">
                    <span className="text-[10px] tracking-[0.2em] text-[#bbb] uppercase w-32 shrink-0">Data de Filmagem</span>
                    <span className="text-[12px] text-[#444]">{ficha.dataFilmagem}</span>
                  </div>
                )}
                {ficha.dataEntrega && (
                  <div className="flex items-baseline gap-3">
                    <span className="text-[10px] tracking-[0.2em] text-[#bbb] uppercase w-32 shrink-0">Data de Entrega</span>
                    <span className="text-[12px] text-[#444]">{ficha.dataEntrega}</span>
                  </div>
                )}
                {!ficha.dataFilmagem && !ficha.dataEntrega && (
                  <p className="text-[12px] text-[#999]">Datas a definir em anexo.</p>
                )}
              </div>
            </div>

            {/* 3. Honorários */}
            <div>
              <p className="text-[8px] tracking-[0.5em] text-[#bbb] uppercase mb-3">Cláusula 3.ª — Honorários e Pagamentos</p>
              {ficha.orcamento ? (
                <>
                  <p className="text-[12px] text-[#444] leading-[1.8] mb-3">
                    O valor total acordado para a prestação dos serviços descritos é de{' '}
                    <strong>{parseFloat(ficha.orcamento).toLocaleString('pt-PT', { minimumFractionDigits: 2 })} €</strong>{' '}
                    (acrescido de IVA à taxa legal em vigor).
                  </p>
                  <div className="border border-[#eee] bg-[#fafafa] px-5 py-4 flex flex-col gap-2">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#888]">Sinal — 50% (à assinatura)</span>
                      <span className="text-[#444] font-medium">{(parseFloat(ficha.orcamento) * 0.5).toLocaleString('pt-PT', { minimumFractionDigits: 2 })} €</span>
                    </div>
                    <div className="h-px bg-[#eee]" />
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#888]">Restante — 50% (na entrega)</span>
                      <span className="text-[#444] font-medium">{(parseFloat(ficha.orcamento) * 0.5).toLocaleString('pt-PT', { minimumFractionDigits: 2 })} €</span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-[12px] text-[#999]">Valor e condições de pagamento a definir em proposta anexa.</p>
              )}
            </div>

            {/* 4. Direitos */}
            <div>
              <p className="text-[8px] tracking-[0.5em] text-[#bbb] uppercase mb-3">Cláusula 4.ª — Direitos de Imagem e Utilização</p>
              <p className="text-[12px] text-[#444] leading-[1.8]">
                Os conteúdos produzidos são de utilização exclusiva do Cliente para os fins acordados.
                A RL Media reserva o direito de utilizar imagens e excertos do trabalho realizado para fins de
                portfólio e promoção, salvo indicação expressa em contrário pelo Cliente.
              </p>
            </div>

            {/* 5. Revisões */}
            <div>
              <p className="text-[8px] tracking-[0.5em] text-[#bbb] uppercase mb-3">Cláusula 5.ª — Revisões e Alterações</p>
              <p className="text-[12px] text-[#444] leading-[1.8]">
                Estão incluídas até <strong>3 (três) rondas de revisão</strong> no valor acordado.
                Revisões adicionais serão orçamentadas separadamente e acordadas por escrito entre as partes.
              </p>
            </div>

            {/* 6. Cancelamento */}
            <div>
              <p className="text-[8px] tracking-[0.5em] text-[#bbb] uppercase mb-3">Cláusula 6.ª — Cancelamento</p>
              <p className="text-[12px] text-[#444] leading-[1.8]">
                Em caso de cancelamento pelo Cliente após a assinatura, o sinal pago não será reembolsado.
                O cancelamento com menos de 15 dias de antecedência implica o pagamento integral do valor acordado.
                Em caso de cancelamento por motivo de força maior devidamente comprovado, as partes acordarão uma solução mutuamente aceitável.
              </p>
            </div>

            {/* 7. Disposições gerais */}
            <div>
              <p className="text-[8px] tracking-[0.5em] text-[#bbb] uppercase mb-3">Cláusula 7.ª — Disposições Gerais</p>
              <p className="text-[12px] text-[#444] leading-[1.8]">
                O presente contrato rege-se pela legislação portuguesa aplicável. Para resolução de quaisquer
                litígios emergentes do presente contrato, as partes elegem o Tribunal da Comarca de Lisboa,
                com expressa renúncia a qualquer outro. O presente contrato é válido a partir da data de assinatura por ambas as partes.
              </p>
            </div>

          </div>

          <div className="h-px bg-[#eee] my-14" />

          {/* Notas do contrato */}
          {ficha.contratoNotas && (
            <div className="mb-12">
              <p className="text-[8px] tracking-[0.5em] text-[#bbb] uppercase mb-3">Condições Particulares</p>
              <p className="text-[12px] text-[#555] leading-[1.8] italic">{ficha.contratoNotas}</p>
            </div>
          )}

          {/* Assinaturas */}
          <div>
            <p className="text-[8px] tracking-[0.5em] text-[#bbb] uppercase mb-8">Assinaturas</p>
            <p className="text-[11px] text-[#999] mb-10">
              Feito em Lisboa, em {contrato.geradoEm || hoje}.
            </p>
            <div className="grid grid-cols-2 gap-16">
              <div>
                <div className="h-px bg-[#ccc] mb-3" />
                <p className="text-[11px] text-[#666] font-medium">RL Media</p>
                <p className="text-[10px] text-[#aaa]">O Prestador de Serviços</p>
              </div>
              <div>
                <div className="h-px bg-[#ccc] mb-3" />
                <p className="text-[11px] text-[#666] font-medium">{ficha.nome || 'O Cliente'}</p>
                <p className="text-[10px] text-[#aaa]">{ficha.empresa || 'O Cliente'}</p>
              </div>
            </div>
          </div>

          {/* Rodapé */}
          <div className="mt-16 pt-6 border-t border-[#eee] flex items-center justify-between">
            <p className="text-[9px] text-[#ccc] tracking-[0.2em] uppercase">RL Media · Audiovisual · rlmedia.pt</p>
            <p className="text-[9px] text-[#ccc] tracking-[0.2em] uppercase">{contrato.ref}</p>
          </div>

        </div>
      </div>
    </>
  )
}
