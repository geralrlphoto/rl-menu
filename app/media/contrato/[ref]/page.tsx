import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import PrintButton from './PrintButton'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type Props = { params: Promise<{ ref: string }> }

// Prestadora (dados fixos RL Media)
const PRESTADORA = {
  nome: 'Liliana Sofia Fernandes Barreto Gonçalves (RL MEDIA - AUDIOVISUAL)',
  nif: '238076415',
  cae: '74200 (Atividades Fotográficas/Vídeo)',
  morada: 'Centro Comercial os Mochos Loja 136 - 2955-185 Pinhal Novo',
  email: 'geral.rlphoto@gmail.com',
  telefone: '916162728',
  iban: 'PT50 0018 0003 6110 2844 0284 0204 5',
}

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

  const valorNum = parseFloat(ficha.orcamento || '0')
  const val80 = (valorNum * 0.8).toLocaleString('pt-PT', { minimumFractionDigits: 2 })
  const val20 = (valorNum * 0.2).toLocaleString('pt-PT', { minimumFractionDigits: 2 })
  const valorTotal = valorNum.toLocaleString('pt-PT', { minimumFractionDigits: 2 })

  const servicosList: string[] = ficha.servicosList
    ? ficha.servicosList.split('\n').map((s: string) => s.trim()).filter(Boolean)
    : []

  const profissionaisList: string[] = ficha.profissionaisList
    ? ficha.profissionaisList.split('\n').map((s: string) => s.trim()).filter(Boolean)
    : []

  return (
    <>
      {/* Barra topo — só ecrã */}
      <div className="print:hidden bg-[#050507] border-b border-white/[0.06] px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <Link href="/media/ficha-cliente"
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

      <style>{`
        @media print {
          @page { margin: 0; size: A4; }
          body { margin: 0; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
        }
        .page-break { page-break-before: always; }
      `}</style>

      {/* ═══ CAPA ═══ */}
      <div style={{ background: '#000', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '60px 80px', fontFamily: 'Arial, sans-serif' }}>
        {/* Logo círculo */}
        <div style={{ width: 100, height: 100, borderRadius: '50%', border: '2px solid #fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start' }}>
          <div style={{ color: '#fff', fontWeight: 900, fontSize: 18, letterSpacing: 1, lineHeight: 1.1, textAlign: 'center' }}>RL<br/>MEDIA</div>
          <div style={{ color: '#fff', fontSize: 6, letterSpacing: 3, marginTop: 2 }}>AUDIOVISUAL</div>
        </div>

        {/* Centro */}
        <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div style={{ color: '#fff', fontWeight: 900, fontSize: 96, letterSpacing: 8, lineHeight: 1, textTransform: 'uppercase' }}>RL MEDIA</div>
          <div style={{ color: '#fff', fontSize: 22, letterSpacing: 14, fontWeight: 300 }}>AUDIOVISUAL</div>
          <div style={{ marginTop: 24 }}>
            <div style={{ color: '#9B59B6', fontSize: 22, fontWeight: 400, letterSpacing: 2 }}>MORE THAN A PRODUCT,</div>
            <div style={{ color: '#fff', fontSize: 22, fontWeight: 900, letterSpacing: 2 }}>AN EXPERIENCE.</div>
          </div>
        </div>

        {/* Rodapé capa */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#fff', fontWeight: 900, fontSize: 16, letterSpacing: 2, marginBottom: 4 }}>CONTRATO DE PRESTAÇÃO DE SERVIÇOS</div>
          <div style={{ color: '#fff', fontWeight: 900, fontSize: 16, letterSpacing: 2 }}>({(ficha.empresa || ficha.nome || refUp).toUpperCase()})</div>
        </div>
      </div>

      {/* ═══ TEMPLATE PÁGINA (reutilizável) ═══ */}
      {/* Página 2 — Partes */}
      <ContentPage>
        <SectionTitle>CONTRATANTE SEGUNDA OUTORGANTE:</SectionTitle>
        <InfoBlock>
          <InfoLine>EMPRESA: {(ficha.empresa || ficha.nome || '').toUpperCase()}</InfoLine>
          {ficha.representanteLegal && <InfoLine>LEGAL REPRESENTANTE</InfoLine>}
          {ficha.representanteLegal && <InfoLine>NOME: {ficha.representanteLegal.toUpperCase()}</InfoLine>}
          {ficha.nif && <InfoLine>NIF: {ficha.nif}</InfoLine>}
          {ficha.morada && <InfoLine>MORADA: {ficha.morada.toUpperCase()}</InfoLine>}
          {ficha.telefone && <InfoLine>CONTATO: {ficha.telefone}</InfoLine>}
        </InfoBlock>

        <SectionTitle>CONTRATADA - PRIMEIRA OUTORGANTE:</SectionTitle>
        <InfoBlock>
          <InfoLine>{PRESTADORA.nome}</InfoLine>
          <InfoLine>NIF: {PRESTADORA.nif}</InfoLine>
          <InfoLine>CAE: {PRESTADORA.cae}</InfoLine>
          <InfoLine>Endereço: {PRESTADORA.morada}</InfoLine>
          <InfoLine>E-mail: {PRESTADORA.email}</InfoLine>
          <InfoLine>Telefone: {PRESTADORA.telefone}</InfoLine>
        </InfoBlock>

        <p style={{ fontSize: 13, color: '#222', lineHeight: 1.9, textAlign: 'justify', marginTop: 24 }}>
          Por este acordo, as partes têm entre si, contratante e contratado o que segue. A CONTRATADA é ajustada, para realizar os serviços a seguir discriminados com seus respectivos valores, o serviço de videografia e fotografia será realizado pela RL Media - Audiovisual.
        </p>
      </ContentPage>

      {/* Página 3 — Considerandos + Cláusulas 1ª e 2ª */}
      <ContentPage>
        <p style={{ fontSize: 13, color: '#222', lineHeight: 1.9, marginBottom: 16 }}>Considerando que:</p>
        <p style={{ fontSize: 13, color: '#222', lineHeight: 1.9, marginBottom: 4 }}>i. A Prestadora de Serviços, entre outros, dedica-se à prestação de produção de vídeos e fotografia bem como a criação de um website.</p>
        <p style={{ fontSize: 13, color: '#222', lineHeight: 1.9, marginBottom: 16 }}>ii. O Cliente pretende contratar os serviços de produção de vídeo, fotografia e website.</p>
        <p style={{ fontSize: 13, color: '#222', lineHeight: 1.9, marginBottom: 24, textAlign: 'justify' }}>
          É livremente estabelecido e mutuamente aceite, nos termos e condições aqui estabelecidos, o presente Contrato de Prestação de Serviços (doravante, o &quot;Contrato&quot;) que se regerá pelos considerados acima e pelas seguintes cláusulas:
        </p>

        <ClauseTitle>PRIMEIRA CLÁUSULA</ClauseTitle>
        <ClauseText>A prestadora de serviço compromete-se a executar os serviços de produção de conteúdo audiovisual ao cliente, assumindo a correspondente responsabilidade técnica pela elaboração dos mesmos. A prestação dos serviços é realizada com autonomia técnica e criativa, sendo as estratégias e sugestões de desenvolvimento, elaboradas com base no conhecimento da equipa da prestadora, as quais são discutidas e partilhadas com o cliente.</ClauseText>

        <ClauseTitle>SEGUNDA CLÁUSULA</ClauseTitle>
        <ClauseText>Os serviços prestados pela primeira parte estão sujeitos a regras de utilização que visam o bom funcionamento dos mesmos, nomeadamente:</ClauseText>
        <p style={{ fontSize: 13, color: '#222', lineHeight: 1.9, margin: '12px 0 8px' }}>1. Relativas aos serviços prestados:</p>
        <ClauseText>a) No caso de atrasos na entrega de dados ou informação necessária à realização dos serviços contratados pelo cliente, a prestadora não se responsabiliza pelo incumprimento do prazo de entrega e declina todas e quaisquer responsabilidades por erros ou omissões que possam existir e não tenham sido devidamente identificados e anotados pelo cliente nos suportes documentais apresentados e comunicados por escrito para a prestadora.</ClauseText>
      </ContentPage>

      {/* Página 4 */}
      <ContentPage>
        <ClauseText>b) A aprovação ou pedido de alterações aos planeamentos devem ser comunicados por escrito no prazo máximo de 3 (três) dias úteis após a sua boa receção. No caso de solicitar alterações, a prestadora compromete-se com o prazo máximo de 10 (dez) dias úteis para alterações e o envio do novo conteúdo por e-mail para aprovação.</ClauseText>
        <ClauseText>c) Na falta de resposta dentro do prazo, ao exposto nas anteriores alíneas a prestadora considera o trabalho aprovado e não se responsabilizando por demais alterações.</ClauseText>
        <ClauseText>d) As avenças mensais serão faturadas na última semana de cada mês com prazo de pagamento de 5 dias úteis para efetuar o mesmo.</ClauseText>
        <ClauseText>e) No caso da contratação para a cobertura de eventos e os mesmos sofrerem alterações de qualquer natureza, é obrigação do cliente informar via e-mail à produtora as alterações. O novo agendamento ficará sujeito a confirmação, mediante disponibilidade de datas da produtora.</ClauseText>

        <p style={{ fontSize: 13, color: '#222', lineHeight: 1.9, margin: '16px 0 8px' }}>2. Cancelamento na prestação dos serviços:</p>
        <ClauseText>O cliente ficará sujeito ao cancelamento da prestação de serviços sempre que:</ClauseText>
        <ClauseText>a) Publique conteúdos ilegais ou impróprios associados ao nome da prestadora.</ClauseText>
        <ClauseText>b) Seja insultuosa com entidades coletivas, particulares ou quaisquer outras.</ClauseText>
        <ClauseText>c) Invada a privacidade e/ou ponha em risco a integridade do utilizador ou do conteúdo produzido pela prestadora.</ClauseText>
        <ClauseText>d) Publicar conteúdos que incitem à violência, intolerância ou qualquer outro comportamento censurável.</ClauseText>
        <ClauseText>e) Seja incumpridora relativamente ao pagamento dos serviços prestados pela primeira outorgante, dentro do prazo estipulado neste contrato.</ClauseText>

        <ClauseTitle>TERCEIRA CLÁUSULA</ClauseTitle>
        <ClauseText>O cliente aceita, salvo disposição expressa em contrário, que a prestadora possa colocar a sua imagem e/ou menção aos seus serviços em todos os suportes gráficos a desenvolver e possa utilizar o projeto no seu website, portfólio e outros meios de promoção.</ClauseText>
        <ClauseText>a) Produções extras: Todas as propostas apresentadas pela produtora que não sejam aprovadas pelo cliente e/ou não resultem em aprovação de proposta com valores e contrato validado, são propriedade exclusiva da prestadora.</ClauseText>
      </ContentPage>

      {/* Página 5 */}
      <ContentPage>
        <ClauseTitle>QUARTA CLÁUSULA</ClauseTitle>
        <ClauseText>a) O incumprimento pelo cliente das regras de utilização, mencionadas nas cláusulas anteriores, traduzem-se no cancelamento dos serviços prestados, ficando aquela sem direito a devolução do valor pago pela mesma.</ClauseText>
        <ClauseText>b) O cliente deve nomear um responsável, devendo identificá-lo, por escrito, o qual irá assegurar a dinâmica necessária na troca de informação com a prestadora, sendo responsável pela disponibilização, em tempo útil, de todos os dados necessários à correta elaboração da prestação de serviços.</ClauseText>

        <ClauseTitle>QUINTA CLÁUSULA</ClauseTitle>
        <ClauseText>A prestadora não se responsabiliza pelos conteúdos publicados pelo cliente, sendo a responsabilidade dos mesmos do seu autor, mesmo que publicados por colaboradores da prestadora a pedido do cliente.</ClauseText>

        <ClauseTitle>SEXTA CLÁUSULA</ClauseTitle>
        <ClauseText>A prestadora reserva o direito de debitar a totalidade do valor da prestação de serviços, caso haja incumprimento, pelo cliente, na entrega dos conteúdos ou tomadas de decisão para o avanço do projeto no período superior a 22 dias úteis, respetivamente em trabalhos que demandem agendamentos e reservas prévias de materiais, equipamentos e deslocação de profissionais.</ClauseText>

        <ClauseTitle>SÉTIMA CLÁUSULA</ClauseTitle>
        <ClauseText>As deslocações estão incluídas no presente contrato. Deslocações prevista fora do acordado será taxado a um valor de 0,45€ por quilometro.</ClauseText>

        <ClauseTitle>OITAVA CLÁUSULA</ClauseTitle>
        <ClauseText>Após a rescisão de algum dos serviços contratados, por motivo explícito em alguma cláusula deste contrato, em especial para pacotes de serviços diversificados, os trabalhos desenvolvidos e afetos a este contrato e ainda não facultados ao cliente podem por solicitados no prazo de 15 dias, a contar da data de rescisão, desde que nada seja devido à prestadora.</ClauseText>

        <ClauseTitle>NONA CLÁUSULA</ClauseTitle>
        <ClauseText>O não consumo dos serviços prestados pelo presente contrato, por incumprimento da parte do cliente, é da responsabilidade do mesmo e não são acumuláveis com outros, nem podem ser trocados por quaisquer outros serviços da prestadora.</ClauseText>
      </ContentPage>

      {/* Página 6 */}
      <ContentPage>
        <ClauseTitle>DÉCIMA CLÁUSULA</ClauseTitle>
        <ClauseText>O presente contrato inicia-se imediatamente após assinatura por parte do cliente, e tem a duração pelo prazo de execução dos serviços apresentados na proposta e até a entrega final do conteúdo contratado.</ClauseText>

        <ClauseTitle>DÉCIMA PRIMEIRA CLÁUSULA</ClauseTitle>
        <ClauseText>O presente contrato pode ser rescindido por qualquer das partes com justa causa, devendo essa rescisão verificar-se através de carta registada com aviso de receção, na qual se invoquem os seus motivos.</ClauseText>
        <ClauseText>a) A rescisão contratual sem justa causa, obrigará o cliente a liquidar de forma imediata, o valor acordado pelos outorgantes para pagamento dos serviços prestados pela prestadora e demais despesas que tenham incorrido por parte da mesma, a fim de realizar os serviços para o cliente, conforme proposto.</ClauseText>

        <ClauseTitle>DÉCIMA SEGUNDA CLÁUSULA</ClauseTitle>
        <ClauseText>Os prazos de entrega do projeto, video fotografia e website prevemos que este seja entregue num prazo não superior a 90 dias úteis.</ClauseText>

        <ClauseTitle>DOS SERVIÇOS CONTRATADOS</ClauseTitle>
        <ClauseText>Descritivo dos Serviços: O descritivo de todos os serviços contemplados neste contrato encontrar-se-ão no ANEXO I deste contrato.</ClauseText>

        <p style={{ fontSize: 13, color: '#222', lineHeight: 1.9, margin: '20px 0 8px' }}>Preços e métodos de pagamento:</p>
        {valorNum > 0 ? (
          <>
            <ClauseText>a) Pelo serviço contratado, o cliente pagará à prestadora o montante de {valorTotal} Euros, ao qual acresce IVA à taxa legal em vigor.</ClauseText>
            <ClauseText>b) O montante indicado no número anterior, será pago através de transferência bancária, para o IBAN {PRESTADORA.iban}, da seguinte forma:</ClauseText>
            <ul style={{ fontSize: 13, color: '#222', lineHeight: 2, paddingLeft: 28, margin: '8px 0' }}>
              <li>Em duas prestações, de acordo com as seguintes fases de execução do serviço:</li>
              <li>80% (oitenta por cento) — {val80} € — com a adjudicação do serviço, na data de celebração do presente contrato;</li>
              <li>20% (vinte por cento) — {val20} € — passados sessenta dias após o primeiro dia do contrato.</li>
            </ul>
          </>
        ) : (
          <ClauseText>a) O valor dos serviços será acordado e formalizado em proposta anexa a este contrato.</ClauseText>
        )}
        <ClauseText>c) Qualquer serviço adicional, não compreendido neste contrato, poderá ser executado mediante apresentação de orçamento prévio ao cliente e aprovação.</ClauseText>
        <ClauseText>d) O não pagamento ou atraso de qualquer uma das prestações, implica a suspensão da execução do serviço, podendo a prestadora proceder à cobrança do remanescente do valor em dívida, conforme fase de desenvolvimento.</ClauseText>
      </ContentPage>

      {/* Página 7 — Confidencialidade + Lei */}
      <ContentPage>
        <ClauseTitle>CONFIDENCIALIDADE</ClauseTitle>
        <ClauseText>a) Todas as comunicações trocadas entre a prestadora e o cliente, são confidenciais.</ClauseText>
        <ClauseText>b) Todos os projetos, propostas e materiais para aprovação, apresentados pela prestadora ao cliente, são confidenciais, não podendo o último divulgá-las a terceiros ou facilitar o acesso às mesmas, durante a execução dos serviços, sob pena de incumprimento do presente contrato e responsabilidade civil contratual perante a prestadora.</ClauseText>
        <ClauseText>c) Todas as informações transmitidas à prestadora, que digam respeito ao know-how, estratégia e organização comercial do cliente, só serão usadas pela prestadora para efeitos de execução do presente contrato, sempre com pré-aprovação do cliente.</ClauseText>
        <ClauseText>d) O cliente desde já autoriza a prestadora a utilizar a(s) marca(s) do primeiro, em tudo o quanto diga respeito à execução do presente contrato.</ClauseText>

        <ClauseTitle>DADOS PESSOAIS</ClauseTitle>
        <ClauseText>Os dados pessoais das PARTES neste contrato, são exclusivamente processados para efeitos da execução do presente contrato e obrigações legais associadas. Os mesmos serão tratados em observância das regras aplicáveis em matéria de proteção de dados, designadamente o RGPD, sendo conservados enquanto tal for exigido por lei.</ClauseText>

        <ClauseTitle>LEI E FORO</ClauseTitle>
        <ClauseText>Em tudo o que não estiver previsto no presente contrato, aplicam-se as normas do Código Civil, onde obrigam-se as partes a desenvolver todos os esforços na resolução amigável e extrajudicial de quaisquer diferendos que possam surgir. Na falta de possibilidade de alcançar solução consensual, para litígios emergentes da execução do Contrato, é competente o Tribunal Judicial da Comarca de Lisboa com expressa renúncia a qualquer outro.</ClauseText>

        <ClauseTitle>DISPOSIÇÕES FINAIS</ClauseTitle>
        <ClauseText>Qualquer alteração ao presente contrato deverá revestir a forma de documento escrito e será válida desde que acordada por todas as partes por escrito, com menção expressa de cada uma das cláusulas eliminadas e da redação de cada uma das aditadas ou modificadas.</ClauseText>
        <ClauseText>Para efeitos do presente contrato, todas as comunicações oficiais deverão realizar-se para o seguinte endereço de correio eletrónico: {PRESTADORA.email}</ClauseText>
        <ClauseText>Este presente contrato segue devidamente preenchido com os dados fornecidos e deve ser assinado pelo representante legal da segunda outorgante, bem como constar o carimbo da empresa no local indicado abaixo. Após assinatura e carimbo, o documento deverá ser digitalizado e encaminhado para o e-mail indicado acima para que seja realizado o mesmo procedimento pela parte da prestadora, formalizando-se, em duas vias de igual teor, o contrato entre as partes.</ClauseText>
      </ContentPage>

      {/* Página 8 — ANEXO I */}
      <ContentPage>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <p style={{ fontWeight: 700, fontSize: 14, letterSpacing: 2, color: '#111' }}>ANEXO I</p>
          <p style={{ fontWeight: 700, fontSize: 14, letterSpacing: 2, color: '#111' }}>CONTRATO DE PRESTAÇÃO DE SERVIÇOS</p>
        </div>

        <ClauseText>Esse ANEXO I é parte integrante do Contrato de Prestação de Serviços. O descritivo abaixo refere-se a todos os serviços contemplados no contrato, conforme mencionado no item DOS SERVIÇOS CONTRATADOS.</ClauseText>

        <p style={{ fontSize: 13, color: '#222', margin: '20px 0 8px' }}>Que contempla:</p>
        {servicosList.length > 0 ? (
          <ul style={{ fontSize: 13, color: '#222', lineHeight: 2, paddingLeft: 28 }}>
            {servicosList.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        ) : (
          <ClauseText>A definir em proposta.</ClauseText>
        )}

        {profissionaisList.length > 0 && (
          <>
            <p style={{ fontSize: 13, color: '#222', margin: '20px 0 8px' }}>Profissionais envolvidos:</p>
            <ul style={{ fontSize: 13, color: '#222', lineHeight: 2, paddingLeft: 28 }}>
              {profissionaisList.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          </>
        )}

        {valorNum > 0 && (
          <p style={{ fontSize: 13, color: '#222', margin: '20px 0', fontWeight: 500 }}>
            Investimento = {valorTotal} Euros + iva
          </p>
        )}

        <p style={{ fontSize: 12, color: '#555', marginTop: 16, fontStyle: 'italic' }}>
          *O contrato entre as partes é válido até que a entrega de todos os conteúdos contratados, seja finalizada. A forma de pagamento antecipada aos serviços não retira da prestadora a sua responsabilidade com o cliente.
        </p>
      </ContentPage>

      {/* Página 9 — Assinaturas */}
      <ContentPage>
        <ClauseText>E por assim estarem ambas as partes de acordo, firmam o presente ANEXO I que integra o contrato principal, em duas vias de igual teor.</ClauseText>

        <p style={{ fontSize: 13, color: '#222', margin: '24px 0 48px' }}>
          {ficha.localAssinatura || 'Lisboa'}, {contrato.geradoEm || new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, marginTop: 60 }}>
          <div>
            <div style={{ borderTop: '1px solid #999', paddingTop: 12, marginBottom: 8 }} />
            <p style={{ fontSize: 13, color: '#444', fontWeight: 600 }}>{ficha.empresa || ficha.nome || 'O Cliente'}</p>
            <p style={{ fontSize: 12, color: '#888' }}>{ficha.representanteLegal || 'Representante Legal'}</p>
            <p style={{ fontSize: 11, color: '#aaa' }}>(Representante Legal)</p>
            <div style={{ marginTop: 32, border: '1px solid #ddd', height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ fontSize: 10, color: '#ccc', letterSpacing: 2 }}>CARIMBO</p>
            </div>
          </div>
          <div>
            <div style={{ borderTop: '1px solid #999', paddingTop: 12, marginBottom: 8 }} />
            <p style={{ fontSize: 13, color: '#444', fontWeight: 600 }}>RL Media - Audiovisual</p>
            <p style={{ fontSize: 12, color: '#888' }}>Liliana Sofia Fernandes Barreto Gonçalves</p>
            <p style={{ fontSize: 11, color: '#aaa' }}>(Representante Legal)</p>
          </div>
        </div>
      </ContentPage>
    </>
  )
}

// ── Componentes auxiliares ──────────────────────────────────────

function ContentPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-break" style={{
      background: '#fff',
      minHeight: '100vh',
      fontFamily: 'Arial, Helvetica, sans-serif',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '32px 60px 0', position: 'relative' }}>
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontWeight: 900, fontSize: 28, letterSpacing: 2, color: '#111', lineHeight: 1 }}>RL MEDIA</div>
          <div style={{ fontSize: 8, letterSpacing: 8, color: '#555', marginTop: 2 }}>A U D I O V I S U A L</div>
        </div>
        {/* Diagonal corner */}
        <div style={{
          width: 0, height: 0,
          borderStyle: 'solid',
          borderWidth: '0 140px 140px 0',
          borderColor: 'transparent #111 transparent transparent',
          position: 'absolute',
          top: 0, right: 0,
        }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '32px 60px 80px', maxWidth: '100%' }}>
        {children}
      </div>

      {/* Footer */}
      <div style={{ padding: '16px 60px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div />
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#9B59B6', fontSize: 10, letterSpacing: 1 }}>MORE THAN A PRODUCT</div>
          <div style={{ fontWeight: 900, fontSize: 10, letterSpacing: 1, color: '#111' }}>AN EXPERIENCE.</div>
        </div>
      </div>
      <div style={{ textAlign: 'center', paddingBottom: 16, fontSize: 9, letterSpacing: 3, color: '#aaa' }}>
        WWW.RLMEDIA.PT
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p style={{ fontWeight: 700, fontSize: 13, color: '#111', marginBottom: 8, marginTop: 20 }}>{children}</p>
}

function ClauseTitle({ children }: { children: React.ReactNode }) {
  return <p style={{ fontWeight: 700, fontSize: 13, color: '#111', marginTop: 20, marginBottom: 6 }}>{children}</p>
}

function ClauseText({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 13, color: '#222', lineHeight: 1.9, textAlign: 'justify', marginBottom: 8 }}>{children}</p>
}

function InfoBlock({ children }: { children: React.ReactNode }) {
  return <div style={{ marginBottom: 20 }}>{children}</div>
}

function InfoLine({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 13, color: '#222', lineHeight: 1.8 }}>{children}</p>
}
