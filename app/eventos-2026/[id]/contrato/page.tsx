'use client'

import React from 'react'
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

function Clausula({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-[10px] font-black tracking-[0.25em] uppercase border-b border-zinc-200 pb-1.5 mb-3 text-zinc-900">
        {n} Cláusula — {title}
      </h4>
      <div className="space-y-2">{children}</div>
    </div>
  )
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

        {/* Cláusulas */}
        <div className="space-y-6 mb-8 text-sm leading-relaxed text-zinc-700">

          <Clausula n="1.ª" title="Objeto">
            <p><strong>1.1</strong> O objeto do presente contrato consiste na realização de serviços especializados de produção de fotografia pelo CONTRATADO ao CONTRATANTE, conforme o pack escolhido pelo CONTRATANTE.</p>
          </Clausula>

          <Clausula n="2.ª" title="Pagamentos">
            <p><strong>2.1</strong> O CONTRATANTE obriga-se a pagar ao CONTRATADO a importância do valor total pela prestação dos serviços descritos na Cláusula 1.ª deste contrato.</p>
            <p><strong>2.2</strong> O valor total deverá ser pago em três parcelas, da seguinte forma:</p>
            <ul className="ml-4 space-y-1">
              <li>• 1.ª Prestação: <strong>300,00 €</strong> para reservar o dia.</li>
              <li>• 2.ª Prestação: 80% do valor em falta, 48h antes do evento.</li>
              <li>• 3.ª Prestação: 20% do valor em falta — 10% na entrega de fotografias para seleção e os restantes 10% no início da edição do vídeo.</li>
            </ul>
            <p><strong>2.3</strong> Os pagamentos podem ser efetuados por transferência bancária, MBWay ou numerário.</p>
            <p><strong>2.4</strong> Todos os pagamentos têm que ser registados pelos noivos através do formulário próprio disponibilizado no portal dos noivos.</p>
            <p><strong>2.5</strong> Caso o CONTRATANTE pretenda a emissão de recibo, o mesmo é entregue no final da liquidação total do serviço.</p>
          </Clausula>

          <Clausula n="3.ª" title="Cancelamentos">
            <p><strong>3.1</strong> Caso o CONTRATANTE pretenda cancelar o serviço deverá informar através de e-mail da sua intenção.</p>
            <p><strong>3.2</strong> O CONTRATANTE tem 15 dias seguidos após a receção do CPS para efetuar o respetivo cancelamento.</p>
            <ul className="ml-4 space-y-1">
              <li>• Caso seja efetuado dentro do período estipulado, é devolvido o valor de reserva (Cláusula 2.2).</li>
              <li>• Se o CONTRATANTE efetuar o cancelamento após os 15 dias seguidos da receção do CPS, tem que liquidar a totalidade do serviço.</li>
            </ul>
          </Clausula>

          <Clausula n="4.ª" title="Das Obrigações do Contratado">
            <p><strong>4.1</strong> A partir da data de assinatura deste contrato e quitação da primeira parcela especificada no item 2.2, fica o CONTRATADO obrigado a reservar em sua agenda a data do evento.</p>
            <p><strong>4.2</strong> Agendar a reunião de alinhamento até 15 (quinze) dias antes da realização do evento. A reunião poderá ser realizada de forma presencial ou online, conforme alinhamento das partes.</p>
            <p><strong>4.2</strong> O CONTRATADO deverá chegar ao local da captação de imagens no dia agendado com pelo menos 20 minutos de antecedência do horário marcado para início da captação.</p>
            <p><strong>4.3</strong> Comparecer na cerimónia com uma indumentária adequada ao evento; não é permitida a utilização de calções e t-shirts.</p>
            <p><strong>4.4</strong> O CONTRATADO deverá, no dia da captação de imagens, seguir as recomendações da equipa contratante para realização do seu trabalho com segurança e sem atrapalhar a evolução deste.</p>
            <p><strong>4.5</strong> Caso haja alguma falha no equipamento do CONTRATADO, alheia à sua vontade e só percetível após a execução do serviço, que acarrete perda total ou parcial do serviço prestado, fica o CONTRATADO obrigado a devolver a quantia proporcional à perda ocorrida, até ao limite do valor contratado (Cláusula n.º 8).</p>
          </Clausula>

          <Clausula n="5.ª" title="Das Obrigações do Contratante">
            <p><strong>5.1</strong> O CONTRATANTE deverá assegurar a alimentação da equipa contratada (refeição e bebidas).</p>
            <p><strong>5.2</strong> O CONTRATANTE deverá disponibilizar um espaço para o CONTRATADO guardar os equipamentos, de forma segura e livre de riscos. O acesso a este local durante o evento deve ser exclusivo e restrito à equipa contratada. Caso haja projeção de vídeo (Pré-Wedding ou Same Day Edit) é necessária uma mesa extra além da mesa de refeição.</p>
            <p><strong>5.3</strong> O CONTRATANTE deverá fornecer ao CONTRATADO todas as informações necessárias à realização do serviço, devendo especificar os detalhes necessários à perfeita realização do mesmo.</p>
          </Clausula>

          <Clausula n="6.ª" title="Direitos de Privacidade">
            <p><strong>6.1</strong> Comprometemo-nos a proteger a sua privacidade. Pode entrar em contacto telefónico, por e-mail ou durante o briefing de preparação do trabalho, facultando toda e qualquer informação importante para mantermos a sua privacidade durante as gravações e respetiva captação de imagens.</p>
            <p><strong>6.2</strong> O uso de dados pessoais tem como propósito a realização do trabalho e ações de marketing internas. Os seus dados não serão partilhados com terceiros sem o seu consentimento prévio.</p>
          </Clausula>

          <Clausula n="7.ª" title="Prazos">
            <p><strong>7.1</strong> Estimamos a entrega do vídeo editado até aos 180 dias úteis após o dia do evento.</p>
            <p><strong>7.2</strong> Após a entrega do vídeo final, os noivos têm 5 dias seguidos para solicitar alguma alteração pontual, no máximo até 3 alterações.</p>
            <p><strong>7.3</strong> As alterações são efetuadas entre janeiro e março.</p>
            <p><strong>7.4</strong> Entrega de fotografias para seleção: 60 dias úteis após o dia do evento.</p>
            <p><strong>7.5</strong> Fotografias adquiridas pelos convidados: formato digital 15 dias úteis e formato papel 40 dias úteis.</p>
            <p><strong>7.6</strong> Álbuns (maquete): 40 dias úteis após o envio das fotografias.</p>
            <p><strong>7.7</strong> Após aprovação da maquete do álbum: 30 dias úteis para entregar.</p>
            <p><strong>7.8</strong> O álbum só será impresso após a liquidação total do serviço.</p>
            <p><strong>7.9</strong> Todos os noivos que queiram álbum pelo valor apresentado em reunião têm que entregar as fotografias para o mesmo até ao dia 15 de outubro.</p>
          </Clausula>

          <Clausula n="8.ª" title="Garantias do Contratante">
            <p><strong>8.1</strong> O cliente tem o direito de receber todos os conteúdos acordados entre ambas as partes. Caso o cliente não receba a totalidade dos conteúdos ou uma parte num prazo de 365 dias, o valor respeitante ao serviço em falta é devolvido na sua totalidade, não havendo qualquer tipo de indemnização.</p>
            <p><strong>8.2</strong> Qualquer anomalia que possa existir nas nossas instalações ou no nosso material (dano, furto, roubo, incêndio) que impeça a entrega do trabalho final, o valor respeitante ao serviço em falta é totalmente devolvido, não havendo qualquer tipo de indemnização.</p>
          </Clausula>

          <Clausula n="9.ª" title="Armazenamento / Backup">
            <p><strong>9.1</strong> A CONTRATADA compromete-se a conservar todos os ficheiros digitais produzidos e/ou entregues ao CONTRATANTE pelo prazo máximo de 180 (cento e oitenta) dias consecutivos, contados a partir da data da entrega final dos materiais.</p>
            <p><strong>9.2</strong> Com o objetivo de assegurar a integridade e segurança dos dados, a CONTRATADA efetua cópias de segurança (backup) de todos os ficheiros através de um sistema de armazenamento em rede do tipo NAS, dotado de acesso controlado, monitorização permanente e medidas de proteção contra perda, corrupção ou acesso não autorizado.</p>
            <p><strong>9.3</strong> Decorrido o prazo de 180 dias, os ficheiros poderão ser eliminados de forma definitiva, sem obrigação de aviso prévio ao CONTRATANTE. Caso este pretenda a conservação dos ficheiros por período superior, deverá solicitá-lo expressamente, por escrito, antes do termo do prazo estipulado, podendo ser aplicáveis encargos adicionais.</p>
            <p><strong>9.4</strong> O CONTRATANTE não poderá ser responsabilizado por perdas ou danos resultantes de falhas técnicas alheias ao seu controlo, casos fortuitos ou de força maior, nos termos da legislação portuguesa aplicável (Cláusula 8.2).</p>
            <p><strong>9.5</strong> Se o CONTRATANTE solicitar uma segunda via após os 180 dias a partir da data de entrega, dos ficheiros de vídeo ou fotografias, há uma taxa de <strong>300,00 €</strong>.</p>
          </Clausula>

          <Clausula n="10.ª" title="Conteúdos e Imagens">
            <p><strong>10.1</strong> O CONTRATANTE mantém integralmente o seu direito de imagem, nos termos legais aplicáveis. No entanto, todos os conteúdos criados pela CONTRATADA, incluindo fotografias, vídeos, elementos gráficos, montagens ou qualquer outro material digital ou físico, estão protegidos por direitos de autor, cuja titularidade permanece exclusivamente na posse da CONTRATADA, conforme o disposto no Código do Direito de Autor e dos Direitos Conexos.</p>
            <p><strong>10.2</strong> É expressamente vedada a utilização, reprodução, edição, modificação, distribuição ou publicação das imagens por terceiros, nomeadamente para fins comerciais ou divulgação em redes sociais, sem autorização prévia, expressa e escrita da CONTRATADA.</p>
            <p><strong>10.3</strong> Caso se verifique a utilização indevida de qualquer conteúdo por terceiro não autorizado, será enviado um aviso por correio eletrónico ao CONTRATANTE, solicitando a remoção imediata do conteúdo. Caso não haja cumprimento no prazo máximo de 5 (cinco) dias úteis, será imputada ao CONTRATANTE uma taxa compensatória de <strong>2.500,00 €</strong>, a título de penalização contratual.</p>
            <p><strong>10.4</strong> A presente cláusula aplica-se independentemente do meio ou plataforma em que os conteúdos sejam utilizados.</p>
          </Clausula>

          <Clausula n="11.ª" title="Publicação de Conteúdos nas Redes Sociais">
            <p>Gostaríamos de partilhar convosco um ponto importante relacionado com o nosso trabalho e a sua divulgação. Para nós, a publicação de fotografias e vídeos dos casamentos que registamos é essencial, pois é a principal forma de mostrarmos o nosso trabalho a outros casais. Dado que a nossa atividade depende quase exclusivamente do &ldquo;boca-a-boca&rdquo; digital, quando não temos autorização para partilhar qualquer conteúdo, enfrentamos um impacto direto na visibilidade do nosso trabalho.</p>
            <p>Assim, caso não seja autorizada qualquer publicação, será cobrado um valor adicional de <strong>50% do valor total do pack</strong>. Compreendemos que a privacidade é uma prioridade para alguns casais e respeitamos inteiramente essa escolha. Estamos disponíveis para discutir o assunto e encontrar a solução que melhor se ajuste às vossas expectativas.</p>
          </Clausula>

          <Clausula n="12.ª" title="Deslocações">
            <p><strong>12.1</strong> O valor da deslocação encontra-se incluído no preço dos packs contratados.</p>
            <p><strong>12.2</strong> Contudo, caso a distância entre os locais de preparação da noiva e do noivo ultrapasse os 30 minutos de deslocação, poderá ser necessária a presença de um videógrafo/fotógrafo adicional.</p>
            <p><strong>12.3</strong> Para deslocações fora dos concelhos de Palmela, Montijo, Almada ou Setúbal, poderá ser aplicado um acréscimo ao valor total, correspondente às despesas extra de deslocação, previamente comunicadas e acordadas com o CONTRATANTE.</p>
          </Clausula>

          <Clausula n="13.ª" title="Licenças e Autorizações — Drone">
            <p>A CONTRATADA fica responsável pelas autorizações necessárias para a captura de vídeo com drone, incluindo licenças de voo ANAC, bem como as autorizações necessárias para filmar em espaços privados, caso aplicável.</p>
          </Clausula>

          <Clausula n="14.ª" title="Utilização do Drone">
            <p><strong>14.1</strong> O drone encontra-se devidamente registado na ANAC.</p>
            <p><strong>14.2</strong> Caso as condições atmosféricas sejam adversas (vento/chuva), o drone não efetua captura de imagem, sendo devolvida uma parte do valor de <strong>50%</strong>.</p>
            <p><strong>14.3</strong> Após o pôr do sol, o drone já não efetua qualquer tipo de captura de vídeo.</p>
            <p><strong>14.4</strong> Caso no local de voo existam aves a sobrevoar (pombos/gaivotas), o drone efetua aterragem de imediato. Não é devolvido qualquer valor.</p>
          </Clausula>

          <Clausula n="15.ª" title="Edição de Vídeo">
            <p>O vídeo Teaser/Trailer não sofre qualquer tipo de alteração. Ao contratar os serviços, o CONTRATANTE está ciente de que todo o processo criativo de edição de vídeo e fotografia é da total responsabilidade da CONTRATADA. Ao optar pelos nossos serviços, o cliente concorda e aceita o trabalho desenvolvido pela nossa equipa, reconhecendo a nossa experiência e compromisso em entregar um produto final de excelência.</p>
          </Clausula>

          <Clausula n="16.ª" title="Equipas">
            <p>A CONTRATADA opera com equipas altamente qualificadas, o que nos permite garantir a realização de dois eventos no mesmo dia, sem comprometer a qualidade. Caso algum elemento da equipa não possa comparecer, garantimos a sua substituição por outro membro igualmente competente.</p>
          </Clausula>

          <Clausula n="17.ª" title="Falta de Pagamento Final">
            <p>O CONTRATANTE compromete-se a efetuar o pagamento do valor total acordado nos prazos estipulados. Caso o pagamento final não seja efetuado conforme o acordado, aplicar-se-á uma taxa adicional de <strong>100,00 €</strong> por cada período de 30 (trinta) dias de atraso, acumulativa até à regularização total. O não cumprimento poderá ainda resultar na suspensão da entrega dos materiais finais.</p>
          </Clausula>

          <Clausula n="18.ª" title="Extras">
            <p><strong>18.1</strong> As sessões de Pré-Wedding ou Trash the Dress são efetuadas durante a semana e marcadas 30 dias antes do evento.</p>
            <p><strong>18.2</strong> Os valores dos álbuns podem sofrer alterações em qualquer momento do ano.</p>
            <p><strong>18.3</strong> Todos os valores em serviços extras contratados após a reserva do dia podem sofrer alterações.</p>
          </Clausula>

        </div>

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
