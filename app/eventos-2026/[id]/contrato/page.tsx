'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
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

function fmtVal(v: number | null | undefined) {
  if (!v) return '______ €'
  return v.toLocaleString('pt-PT', { minimumFractionDigits: 2 }) + ' €'
}

const DEFAULT_CLAUSULAS: Record<string, string> = {
  "1": "1.1 O objeto do presente contrato consiste na realização de serviços especializados de produção de fotografia pelo CONTRATADO ao CONTRATANTE, conforme o pack escolhido pelo CONTRATANTE.",
  "2": "2.1 O CONTRATANTE obriga-se a pagar ao CONTRATADO a importância do valor total pela prestação dos serviços descritos na Cláusula 1.ª deste contrato.\n2.2 O valor total deverá ser pago em três parcelas, da seguinte forma:\n• 1.ª Prestação: 300,00 € para reservar o dia.\n• 2.ª Prestação: 80% do valor em falta, 48h antes do evento.\n• 3.ª Prestação: 20% do valor em falta — 10% na entrega de fotografias para seleção e os restantes 10% no início da edição do vídeo.\n2.3 Os pagamentos podem ser efetuados por transferência bancária, MBWay ou numerário.\n2.4 Todos os pagamentos têm que ser registados pelos noivos através do formulário próprio disponibilizado no portal dos noivos.\n2.5 Caso o CONTRATANTE pretenda a emissão de recibo, o mesmo é entregue no final da liquidação total do serviço.",
  "3": "3.1 Caso o CONTRATANTE pretenda cancelar o serviço deverá informar através de e-mail da sua intenção.\n3.2 O CONTRATANTE tem 15 dias seguidos após a receção do CPS para efetuar o respetivo cancelamento.\n• Caso seja efetuado dentro do período estipulado, é devolvido o valor de reserva (Cláusula 2.2).\n• Se o CONTRATANTE efetuar o cancelamento após os 15 dias seguidos da receção do CPS, tem que liquidar a totalidade do serviço.",
  "4": "4.1 A partir da data de assinatura deste contrato e quitação da primeira parcela especificada no item 2.2, fica o CONTRATADO obrigado a reservar em sua agenda a data do evento.\n4.2 Agendar a reunião de alinhamento até 15 (quinze) dias antes da realização do evento. A reunião poderá ser realizada de forma presencial ou online, conforme alinhamento das partes.\n4.2 O CONTRATADO deverá chegar ao local da captação de imagens no dia agendado com pelo menos 20 minutos de antecedência do horário marcado para início da captação.\n4.3 Comparecer na cerimónia com uma indumentária adequada ao evento; não é permitida a utilização de calções e t-shirts.\n4.4 O CONTRATADO deverá, no dia da captação de imagens, seguir as recomendações da equipa contratante para realização do seu trabalho com segurança e sem atrapalhar a evolução deste.\n4.5 Caso haja alguma falha no equipamento do CONTRATADO, alheia à sua vontade e só percetível após a execução do serviço, que acarrete perda total ou parcial do serviço prestado, fica o CONTRATADO obrigado a devolver a quantia proporcional à perda ocorrida, até ao limite do valor contratado (Cláusula n.º 8).",
  "5": "5.1 O CONTRATANTE deverá assegurar a alimentação da equipa contratada (refeição e bebidas).\n5.2 O CONTRATANTE deverá disponibilizar um espaço para o CONTRATADO guardar os equipamentos, de forma segura e livre de riscos. O acesso a este local durante o evento deve ser exclusivo e restrito à equipa contratada. Caso haja projeção de vídeo (Pré-Wedding ou Same Day Edit) é necessária uma mesa extra além da mesa de refeição.\n5.3 O CONTRATANTE deverá fornecer ao CONTRATADO todas as informações necessárias à realização do serviço, devendo especificar os detalhes necessários à perfeita realização do mesmo.",
  "6": "6.1 Comprometemo-nos a proteger a sua privacidade. Pode entrar em contacto telefónico, por e-mail ou durante o briefing de preparação do trabalho, facultando toda e qualquer informação importante para mantermos a sua privacidade durante as gravações e respetiva captação de imagens.\n6.2 O uso de dados pessoais tem como propósito a realização do trabalho e ações de marketing internas. Os seus dados não serão partilhados com terceiros sem o seu consentimento prévio.",
  "7": "7.1 Estimamos a entrega do vídeo editado até aos 180 dias úteis após o dia do evento.\n7.2 Após a entrega do vídeo final, os noivos têm 5 dias seguidos para solicitar alguma alteração pontual, no máximo até 3 alterações.\n7.3 As alterações são efetuadas entre janeiro e março.\n7.4 Entrega de fotografias para seleção: 60 dias úteis após o dia do evento.\n7.5 Fotografias adquiridas pelos convidados: formato digital 15 dias úteis e formato papel 40 dias úteis.\n7.6 Álbuns (maquete): 40 dias úteis após o envio das fotografias.\n7.7 Após aprovação da maquete do álbum: 30 dias úteis para entregar.\n7.8 O álbum só será impresso após a liquidação total do serviço.\n7.9 Todos os noivos que queiram álbum pelo valor apresentado em reunião têm que entregar as fotografias para o mesmo até ao dia 15 de outubro.",
  "8": "8.1 O cliente tem o direito de receber todos os conteúdos acordados entre ambas as partes. Caso o cliente não receba a totalidade dos conteúdos ou uma parte num prazo de 365 dias, o valor respeitante ao serviço em falta é devolvido na sua totalidade, não havendo qualquer tipo de indemnização.\n8.2 Qualquer anomalia que possa existir nas nossas instalações ou no nosso material (dano, furto, roubo, incêndio) que impeça a entrega do trabalho final, o valor respeitante ao serviço em falta é totalmente devolvido, não havendo qualquer tipo de indemnização.",
  "9": "9.1 A CONTRATADA compromete-se a conservar todos os ficheiros digitais produzidos e/ou entregues ao CONTRATANTE pelo prazo máximo de 180 (cento e oitenta) dias consecutivos, contados a partir da data da entrega final dos materiais.\n9.2 Com o objetivo de assegurar a integridade e segurança dos dados, a CONTRATADA efetua cópias de segurança (backup) de todos os ficheiros através de um sistema de armazenamento em rede do tipo NAS, dotado de acesso controlado, monitorização permanente e medidas de proteção contra perda, corrupção ou acesso não autorizado.\n9.3 Decorrido o prazo de 180 dias, os ficheiros poderão ser eliminados de forma definitiva, sem obrigação de aviso prévio ao CONTRATANTE. Caso este pretenda a conservação dos ficheiros por período superior, deverá solicitá-lo expressamente, por escrito, antes do termo do prazo estipulado, podendo ser aplicáveis encargos adicionais.\n9.4 O CONTRATANTE não poderá ser responsabilizado por perdas ou danos resultantes de falhas técnicas alheias ao seu controlo, casos fortuitos ou de força maior, nos termos da legislação portuguesa aplicável (Cláusula 8.2).\n9.5 Se o CONTRATANTE solicitar uma segunda via após os 180 dias a partir da data de entrega, dos ficheiros de vídeo ou fotografias, há uma taxa de 300,00 €.",
  "10": "10.1 O CONTRATANTE mantém integralmente o seu direito de imagem, nos termos legais aplicáveis. No entanto, todos os conteúdos criados pela CONTRATADA, incluindo fotografias, vídeos, elementos gráficos, montagens ou qualquer outro material digital ou físico, estão protegidos por direitos de autor, cuja titularidade permanece exclusivamente na posse da CONTRATADA, conforme o disposto no Código do Direito de Autor e dos Direitos Conexos.\n10.2 É expressamente vedada a utilização, reprodução, edição, modificação, distribuição ou publicação das imagens por terceiros, nomeadamente para fins comerciais ou divulgação em redes sociais, sem autorização prévia, expressa e escrita da CONTRATADA.\n10.3 Caso se verifique a utilização indevida de qualquer conteúdo por terceiro não autorizado, será enviado um aviso por correio eletrónico ao CONTRATANTE, solicitando a remoção imediata do conteúdo. Caso não haja cumprimento no prazo máximo de 5 (cinco) dias úteis, será imputada ao CONTRATANTE uma taxa compensatória de 2.500,00 €, a título de penalização contratual.\n10.4 A presente cláusula aplica-se independentemente do meio ou plataforma em que os conteúdos sejam utilizados.",
  "11": "Gostaríamos de partilhar convosco um ponto importante relacionado com o nosso trabalho e a sua divulgação. Para nós, a publicação de fotografias e vídeos dos casamentos que registamos é essencial, pois é a principal forma de mostrarmos o nosso trabalho a outros casais. Dado que a nossa atividade depende quase exclusivamente do \"boca-a-boca\" digital, quando não temos autorização para partilhar qualquer conteúdo, enfrentamos um impacto direto na visibilidade do nosso trabalho.\nAssim, caso não seja autorizada qualquer publicação, será cobrado um valor adicional de 50% do valor total do pack. Compreendemos que a privacidade é uma prioridade para alguns casais e respeitamos inteiramente essa escolha. Estamos disponíveis para discutir o assunto e encontrar a solução que melhor se ajuste às vossas expectativas.",
  "12": "12.1 O valor da deslocação encontra-se incluído no preço dos packs contratados.\n12.2 Contudo, caso a distância entre os locais de preparação da noiva e do noivo ultrapasse os 30 minutos de deslocação, poderá ser necessária a presença de um videógrafo/fotógrafo adicional.\n12.3 Para deslocações fora dos concelhos de Palmela, Montijo, Almada ou Setúbal, poderá ser aplicado um acréscimo ao valor total, correspondente às despesas extra de deslocação, previamente comunicadas e acordadas com o CONTRATANTE.",
  "13": "A CONTRATADA fica responsável pelas autorizações necessárias para a captura de vídeo com drone, incluindo licenças de voo ANAC, bem como as autorizações necessárias para filmar em espaços privados, caso aplicável.",
  "14": "14.1 O drone encontra-se devidamente registado na ANAC.\n14.2 Caso as condições atmosféricas sejam adversas (vento/chuva), o drone não efetua captura de imagem, sendo devolvida uma parte do valor de 50%.\n14.3 Após o pôr do sol, o drone já não efetua qualquer tipo de captura de vídeo.\n14.4 Caso no local de voo existam aves a sobrevoar (pombos/gaivotas), o drone efetua aterragem de imediato. Não é devolvido qualquer valor.",
  "15": "O vídeo Teaser/Trailer não sofre qualquer tipo de alteração. Ao contratar os serviços, o CONTRATANTE está ciente de que todo o processo criativo de edição de vídeo e fotografia é da total responsabilidade da CONTRATADA. Ao optar pelos nossos serviços, o cliente concorda e aceita o trabalho desenvolvido pela nossa equipa, reconhecendo a nossa experiência e compromisso em entregar um produto final de excelência.",
  "16": "A CONTRATADA opera com equipas altamente qualificadas, o que nos permite garantir a realização de dois eventos no mesmo dia, sem comprometer a qualidade. Caso algum elemento da equipa não possa comparecer, garantimos a sua substituição por outro membro igualmente competente.",
  "17": "O CONTRATANTE compromete-se a efetuar o pagamento do valor total acordado nos prazos estipulados. Caso o pagamento final não seja efetuado conforme o acordado, aplicar-se-á uma taxa adicional de 100,00 € por cada período de 30 (trinta) dias de atraso, acumulativa até à regularização total. O não cumprimento poderá ainda resultar na suspensão da entrega dos materiais finais.",
  "18": "18.1 As sessões de Pré-Wedding ou Trash the Dress são efetuadas durante a semana e marcadas 30 dias antes do evento.\n18.2 Os valores dos álbuns podem sofrer alterações em qualquer momento do ano.\n18.3 Todos os valores em serviços extras contratados após a reserva do dia podem sofrer alterações.",
}

// Inline editable field
function F({ field, draft, editing, readonlyMode, onChange, type = 'text', placeholder }: {
  field: string; draft: any; editing: boolean; readonlyMode?: boolean; onChange: (f: string, v: any) => void
  type?: 'text' | 'number' | 'date' | 'email' | 'tel'; placeholder?: string
}) {
  const val = draft[field]
  if (!editing || readonlyMode) {
    if (type === 'number') return <span>{fmtVal(val)}</span>
    if (type === 'date') return <span>{formatDate(val)}</span>
    return <span>{fmt(val)}</span>
  }
  return (
    <input
      type={type}
      value={val ?? ''}
      onChange={e => onChange(field, type === 'number' ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value)}
      placeholder={placeholder ?? field}
      className="border-b border-zinc-400 bg-yellow-50 outline-none px-1 py-0.5 text-sm w-full min-w-[120px] focus:border-amber-500"
    />
  )
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

function ContratoPageContent() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const readonly = searchParams.get('readonly') === '1'
  const [evento, setEvento] = useState<any>(null)
  const [draft, setDraft] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [clausulas, setClausulas] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!id) return
    Promise.all([
      fetch(`/api/eventos-notion/${id}`).then(r => r.json()),
      fetch(`/api/contrato-clausulas?eventoId=${id}`).then(r => r.json()),
    ]).then(([d, cd]) => {
      if (d.event) { setEvento(d.event); setDraft(d.event) }
      const custom = cd.clausulas ?? {}
      setClausulas({ ...DEFAULT_CLAUSULAS, ...custom })
    }).finally(() => setLoading(false))
  }, [id])

  function change(field: string, value: any) {
    setDraft((prev: any) => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    setSaving(true)
    const fields = ['nome_noiva','nome_noivo','cc_noiva','cc_noivo','nif_noiva','nif_noivo',
      'morada_noiva','morada_noivo','email_noiva','email_noivo','tel_noiva','tel_noivo',
      'data_evento','local','proposta','valor_foto','valor_video','valor_extras','valor_liquido']
    const payload: any = {}
    for (const f of fields) payload[f] = draft[f] ?? null
    await fetch(`/api/eventos-notion/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setEvento(draft)

    await fetch('/api/contrato-clausulas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventoId: id, clausulas }),
    })

    setSaving(false)
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center bg-white">
      <span className="text-zinc-400 text-xs tracking-widest">A carregar...</span>
    </main>
  )
  if (!draft) return (
    <main className="min-h-screen flex items-center justify-center bg-white">
      <span className="text-red-400 text-sm">Evento não encontrado.</span>
    </main>
  )

  const e = draft
  const hoje = formatDate(new Date().toISOString().split('T')[0])
  const servicosFoto: string[] = evento.servico_foto ?? []
  const servicosVideo: string[] = evento.servico_video ?? []
  const servicosExtra: string[] = evento.servico_extra ?? []

  return (
    <main className="min-h-screen bg-white text-black">
      {/* Toolbar */}
      <div className="print:hidden sticky top-0 z-50 bg-zinc-900 border-b border-white/10 px-6 py-3 flex items-center gap-3">
        {!readonly && (
          <Link href={`/eventos-2026/${id}`}
            className="text-xs text-white/50 hover:text-white/80 transition-colors">
            ‹ Voltar
          </Link>
        )}
        <div className="flex-1" />
        {!readonly && <span className="text-xs text-white/30 tracking-widest uppercase">{e.referencia} — {e.cliente}</span>}
        {!readonly && saved && <span className="text-xs text-green-400 font-semibold">✓ Guardado</span>}
        {!readonly && editing ? (
          <>
            <button onClick={() => { setDraft(evento); setEditing(false) }}
              className="px-3 py-2 rounded-lg border border-white/20 text-white/50 text-xs hover:text-white/80 transition-all">
              Cancelar
            </button>
            <button onClick={handleSave} disabled={saving}
              className="px-4 py-2 rounded-lg bg-green-500 text-white text-xs font-bold tracking-wider hover:bg-green-400 transition-all disabled:opacity-50">
              {saving ? 'A guardar...' : '✓ Guardar'}
            </button>
          </>
        ) : (
          <>
            {!readonly && (
              <button onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber-500/40 text-amber-400 text-xs hover:bg-amber-500/10 transition-all">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Editar
              </button>
            )}
            <button onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-black text-xs font-bold tracking-wider hover:bg-amber-400 transition-all">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              {readonly ? 'Imprimir / Guardar PDF' : 'Imprimir / Guardar PDF'}
            </button>
          </>
        )}
      </div>

      {!readonly && editing && (
        <div className="print:hidden bg-amber-50 border-b border-amber-200 px-6 py-2 text-xs text-amber-700 text-center">
          Modo de edição ativo — os campos com fundo amarelo são editáveis. Clica em <strong>Guardar</strong> para salvar no Notion.
        </div>
      )}

      {/* Documento */}
      <div className="max-w-[800px] mx-auto px-10 py-12 print:px-8 print:py-8">

        {/* Cabeçalho */}
        <div className="flex items-start justify-between mb-10 pb-6 border-b-2 border-black">
          <div>
            <h1 className="text-2xl font-black tracking-[0.15em] uppercase">RL PHOTO.VIDEO</h1>
            <p className="text-xs text-zinc-500 mt-1">Fotografia &amp; Vídeo de Casamentos</p>
          </div>
          <div className="text-right text-xs text-zinc-500 space-y-0.5">
            <p>NIF: 238 076 415</p>
            <p>CAE: 74200</p>
            <p>geral.rlphoto@gmail.com</p>
            <p>+351 916 162 728</p>
          </div>
        </div>

        {/* Título */}
        <div className="text-center mb-10">
          <h2 className="text-xl font-black tracking-[0.2em] uppercase mb-2">Contrato de Prestação de Serviços</h2>
          <p className="text-xs text-zinc-400 tracking-widest uppercase">Referência: {e.referencia}</p>
        </div>

        {/* 1. Identificação das partes */}
        <section className="mb-8">
          <h3 className="text-[10px] font-black tracking-[0.3em] uppercase border-b border-zinc-200 pb-2 mb-4">
            1. Identificação das Partes
          </h3>
          <div className="space-y-5">
            <div>
              <p className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase mb-1">Primeira Outorgante (Contratada)</p>
              <p className="text-sm leading-relaxed">
                <strong>Liliana Sofia Fernandes Barreto Gonçalves</strong>, a exercer sob a marca <strong>RL Photo — Fotografia &amp; Vídeo</strong>,
                contribuinte n.º <strong>238 076 415</strong>, CAE <strong>74200</strong> (Atividades Fotográficas/Vídeo),
                com sede em <strong>Centro Comercial Os Mochos, Loja 124, 2955-185 Pinhal Novo</strong>,
                e-mail <strong>geral.rlphoto@gmail.com</strong>, telefone <strong>+351 916 162 728</strong>,
                doravante designada como <strong>CONTRATADA</strong>.
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase mb-1">Segunda Outorgante (Contratante)</p>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                <div><span className="text-zinc-400 text-xs block mb-0.5">Nome (Noiva)</span><strong><F field="nome_noiva" draft={e} editing={editing} readonlyMode={readonly} onChange={change} placeholder="Nome da noiva" /></strong></div>
                <div><span className="text-zinc-400 text-xs block mb-0.5">Nome (Noivo)</span><strong><F field="nome_noivo" draft={e} editing={editing} readonlyMode={readonly} onChange={change} placeholder="Nome do noivo" /></strong></div>
                <div><span className="text-zinc-400 text-xs block mb-0.5">C.C. (Noiva)</span><F field="cc_noiva" draft={e} editing={editing} readonlyMode={readonly} onChange={change} placeholder="N.º Cartão Cidadão" /></div>
                <div><span className="text-zinc-400 text-xs block mb-0.5">C.C. (Noivo)</span><F field="cc_noivo" draft={e} editing={editing} readonlyMode={readonly} onChange={change} placeholder="N.º Cartão Cidadão" /></div>
                <div><span className="text-zinc-400 text-xs block mb-0.5">NIF (Noiva)</span><F field="nif_noiva" draft={e} editing={editing} readonlyMode={readonly} onChange={change} placeholder="NIF" /></div>
                <div><span className="text-zinc-400 text-xs block mb-0.5">NIF (Noivo)</span><F field="nif_noivo" draft={e} editing={editing} readonlyMode={readonly} onChange={change} placeholder="NIF" /></div>
                <div className="col-span-2"><span className="text-zinc-400 text-xs block mb-0.5">Morada</span><F field="morada_noiva" draft={e} editing={editing} readonlyMode={readonly} onChange={change} placeholder="Morada" /></div>
                <div><span className="text-zinc-400 text-xs block mb-0.5">E-mail</span><F field="email_noiva" draft={e} editing={editing} readonlyMode={readonly} onChange={change} type="email" placeholder="E-mail" /></div>
                <div><span className="text-zinc-400 text-xs block mb-0.5">Telefone</span><F field="tel_noiva" draft={e} editing={editing} readonlyMode={readonly} onChange={change} type="tel" placeholder="Telefone" /></div>
              </div>
              <p className="text-sm mt-3">doravante designados como <strong>CONTRATANTE</strong>.</p>
            </div>
          </div>
        </section>

        {/* 2. Objeto */}
        <section className="mb-8">
          <h3 className="text-[10px] font-black tracking-[0.3em] uppercase border-b border-zinc-200 pb-2 mb-4">
            2. Objeto do Contrato
          </h3>
          <p className="text-sm leading-relaxed mb-4">
            O presente contrato tem por objeto a prestação de serviços de fotografia e/ou vídeo pelo CONTRATADO ao CONTRATANTE, para o seguinte evento:
          </p>
          <div className="bg-zinc-50 rounded-lg p-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-zinc-400 text-xs block mb-0.5">Tipo de Evento</span>
              <strong>{e.tipo_evento?.join(', ') || '____________________________'}</strong>
            </div>
            <div>
              <span className="text-zinc-400 text-xs block mb-0.5">Data do Evento</span>
              <strong><F field="data_evento" draft={e} editing={editing} readonlyMode={readonly} onChange={change} type="date" /></strong>
            </div>
            <div className="col-span-2">
              <span className="text-zinc-400 text-xs block mb-0.5">Local</span>
              <strong><F field="local" draft={e} editing={editing} readonlyMode={readonly} onChange={change} placeholder="Local do evento" /></strong>
            </div>
          </div>
        </section>

        {/* 3. Serviços */}
        <section className="mb-8">
          <h3 className="text-[10px] font-black tracking-[0.3em] uppercase border-b border-zinc-200 pb-2 mb-4">
            3. Serviços Contratados
          </h3>
          {e.proposta && (
            <p className="text-sm mb-4">Pacote escolhido: <strong className="uppercase">{e.proposta}</strong></p>
          )}
          <div className={`grid gap-4 ${servicosFoto.length > 0 && servicosVideo.length > 0 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {servicosFoto.length > 0 && (
              <div className="border border-zinc-200 rounded-lg overflow-hidden">
                <div className="bg-zinc-100 px-4 py-2 text-[10px] font-bold tracking-widest uppercase">Fotografia</div>
                <ul className="p-4 space-y-1.5">
                  {servicosFoto.map((s: string, i: number) => (
                    <li key={i} className="text-sm flex items-start gap-2"><span className="text-zinc-400 mt-1">•</span>{s}</li>
                  ))}
                </ul>
                <div className="border-t border-zinc-100 px-4 py-2 flex justify-between items-center text-sm">
                  <span className="text-zinc-400">Valor</span>
                  <strong><F field="valor_foto" draft={e} editing={editing} readonlyMode={readonly} onChange={change} type="number" placeholder="0" /></strong>
                </div>
              </div>
            )}
            {servicosVideo.length > 0 && (
              <div className="border border-zinc-200 rounded-lg overflow-hidden">
                <div className="bg-zinc-100 px-4 py-2 text-[10px] font-bold tracking-widest uppercase">Vídeo</div>
                <ul className="p-4 space-y-1.5">
                  {servicosVideo.map((s: string, i: number) => (
                    <li key={i} className="text-sm flex items-start gap-2"><span className="text-zinc-400 mt-1">•</span>{s}</li>
                  ))}
                </ul>
                <div className="border-t border-zinc-100 px-4 py-2 flex justify-between items-center text-sm">
                  <span className="text-zinc-400">Valor</span>
                  <strong><F field="valor_video" draft={e} editing={editing} readonlyMode={readonly} onChange={change} type="number" placeholder="0" /></strong>
                </div>
              </div>
            )}
          </div>
          {servicosExtra.length > 0 && (
            <div className="mt-4 border border-zinc-200 rounded-lg overflow-hidden">
              <div className="bg-zinc-100 px-4 py-2 text-[10px] font-bold tracking-widest uppercase">Serviços Extra</div>
              <ul className="p-4 grid grid-cols-2 gap-1.5">
                {servicosExtra.map((s: string, i: number) => (
                  <li key={i} className="text-sm flex items-start gap-2"><span className="text-zinc-400 mt-1">•</span>{s}</li>
                ))}
              </ul>
              <div className="border-t border-zinc-100 px-4 py-2 flex justify-between items-center text-sm">
                <span className="text-zinc-400">Valor extras</span>
                <strong><F field="valor_extras" draft={e} editing={editing} readonlyMode={readonly} onChange={change} type="number" placeholder="0" /></strong>
              </div>
            </div>
          )}
          {(() => {
            const soma = (e.valor_foto ?? 0) + (e.valor_video ?? 0) + (e.valor_extras ?? 0)
            const total = e.valor_liquido ?? (soma > 0 ? soma : null)
            return total ? (
              <div className="mt-4 flex items-center justify-between px-4 py-3 bg-black text-white rounded-lg">
                <span className="text-xs tracking-widest uppercase font-bold">Valor Total do Serviço</span>
                <span className="text-lg font-black">
                  {editing
                    ? <F field="valor_liquido" draft={e} editing={editing} readonlyMode={readonly} onChange={change} type="number" placeholder="0" />
                    : fmtVal(total)
                  }
                </span>
              </div>
            ) : null
          })()}
        </section>

        {/* Cláusulas */}
        <div className="space-y-6 mb-8 text-sm leading-relaxed text-zinc-700">
          {([
            { n: "1.ª", title: "Objeto", key: "1" },
            { n: "2.ª", title: "Pagamentos", key: "2" },
            { n: "3.ª", title: "Cancelamentos", key: "3" },
            { n: "4.ª", title: "Das Obrigações do Contratado", key: "4" },
            { n: "5.ª", title: "Das Obrigações do Contratante", key: "5" },
            { n: "6.ª", title: "Direitos de Privacidade", key: "6" },
            { n: "7.ª", title: "Prazos", key: "7" },
            { n: "8.ª", title: "Garantias do Contratante", key: "8" },
            { n: "9.ª", title: "Armazenamento / Backup", key: "9" },
            { n: "10.ª", title: "Conteúdos e Imagens", key: "10" },
            { n: "11.ª", title: "Publicação de Conteúdos nas Redes Sociais", key: "11" },
            { n: "12.ª", title: "Deslocações", key: "12" },
            { n: "13.ª", title: "Licenças e Autorizações — Drone", key: "13" },
            { n: "14.ª", title: "Utilização do Drone", key: "14" },
            { n: "15.ª", title: "Edição de Vídeo", key: "15" },
            { n: "16.ª", title: "Equipas", key: "16" },
            { n: "17.ª", title: "Falta de Pagamento Final", key: "17" },
            { n: "18.ª", title: "Extras", key: "18" },
          ] as const).map(({ n, title, key }) => (
            <div key={key}>
              <h4 className="text-[10px] font-black tracking-[0.25em] uppercase border-b border-zinc-200 pb-1.5 mb-3 text-zinc-900">
                {n} Cláusula — {title}
              </h4>
              {editing && !readonly ? (
                <textarea
                  value={clausulas[key] ?? DEFAULT_CLAUSULAS[key] ?? ''}
                  onChange={e => setClausulas(c => ({ ...c, [key]: e.target.value }))}
                  rows={Math.max(4, (clausulas[key] ?? DEFAULT_CLAUSULAS[key] ?? '').split('\n').length + 2)}
                  className="w-full border border-amber-300 bg-yellow-50 rounded px-3 py-2 text-sm leading-relaxed outline-none focus:border-amber-500 resize-y"
                />
              ) : (
                <div className="space-y-1.5 whitespace-pre-line">
                  {(clausulas[key] ?? DEFAULT_CLAUSULAS[key] ?? '')}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Assinaturas */}
        <section className="mb-8">
          <h3 className="text-[10px] font-black tracking-[0.3em] uppercase border-b border-zinc-200 pb-2 mb-6">
            Assinaturas
          </h3>
          <p className="text-sm text-zinc-600 mb-8">
            O presente contrato é celebrado em duplicado, ficando um exemplar na posse de cada uma das partes, e entra em vigor na data da sua assinatura.
          </p>
          <p className="text-sm mb-10">Palmela, {hoje}.</p>
          <div className="grid grid-cols-2 gap-16">
            <div>
              <div className="border-b border-zinc-400 mb-3 h-12" />
              <p className="text-xs text-zinc-500 text-center">A CONTRATADA</p>
              <p className="text-xs font-bold text-center mt-1">Liliana Sofia F. B. Gonçalves</p>
              <p className="text-[10px] text-zinc-400 text-center">RL PHOTO.VIDEO</p>
            </div>
            <div>
              <div className="border-b border-zinc-400 mb-3 h-12" />
              <p className="text-xs text-zinc-500 text-center">O CONTRATANTE</p>
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

export default function ContratoPage() {
  return (
    <Suspense fallback={<main className="min-h-screen flex items-center justify-center bg-white"><span className="text-zinc-400 text-xs tracking-widest">A carregar...</span></main>}>
      <ContratoPageContent />
    </Suspense>
  )
}
