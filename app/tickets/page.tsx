// Montra dos tickets enviados por email, só com exemplos (casal fictício).
// Tudo o que vai para os noivos usa o bilhete (lib/bilheteNoivos.ts), desde 2026-10-21.
// Cada exemplo vem de /api/jornada/email, que usa as mesmas funções de HTML das
// rotas de envio: a página mostra sempre o email real e não lê a base de dados.

export const metadata = { title: 'Tickets · RL' }

// Muda a cada deploy: o browser nunca mostra uma pré-visualização antiga
const VERSAO = (process.env.VERCEL_GIT_COMMIT_SHA ?? 'dev').slice(0, 8)

type Ticket = { k: string; nome: string; assunto: string; quando: string; para: string; info?: string }

const FICHA = 'Na ficha do evento, ao enviar o link'
const FILME = (passo: string) => ({ assunto: 'Ticket do Filme · Ana & Tiago', quando: `Quando o vídeo passa a ${passo}.`, para: 'Noivos', info: 'Pílula TICKET DO FILME, título e texto do passo, Nº do ticket (FL-referência), passo atual, os 5 passos (Editor, Edição, Revisão, Pronto, Estreia) e botão ABRIR O NOSSO PORTAL.' })

const GRUPOS: { titulo: string; tickets: Ticket[] }[] = [
  {
    titulo: 'Noivos · Portal',
    tickets: [
      { k: 'portal', nome: 'O Vosso Portal Está Aberto', assunto: '💍 O portal do casamento está pronto', quando: 'Quando o contrato é aprovado e o portal dos noivos é criado. Leva o email e a palavra-passe de acesso.', para: 'Noiva (ou noivo, se não houver email da noiva)', info: 'Pílula O VOSSO PORTAL, nomes e data do casamento, dias que faltam, o que há lá dentro, referência, chave de acesso (email + palavra-passe) e botão ABRIR O NOSSO PORTAL.' },
      { k: 'recuperar', nome: 'Recuperar a Palavra-passe', assunto: '🔑 A vossa palavra-passe do portal', quando: 'Quando os noivos pedem a palavra-passe no login do portal e confirmam a identidade.', para: 'Noiva (ou noivo, se não houver email da noiva)', info: 'Pílula A VOSSA PALAVRA-PASSE, nomes, a chave de acesso e botão ENTRAR NO PORTAL, com aviso para ignorarem se não foram eles a pedir.' },
      { k: 'portal-pronto', nome: 'Portal dos Noivos Pronto', assunto: 'O vosso Portal dos Noivos está pronto', quando: 'Na ficha do evento, no botão de enviar o portal ao cliente.', para: 'Noiva', info: 'Pílula O VOSSO PORTAL, nomes, referência, palavra-passe e botão ABRIR O NOSSO PORTAL.' },
      { k: 'notificacao', nome: 'Nova Notificação', assunto: '🔔 <título da notificação>', quando: 'Na ficha do evento, ao enviar uma notificação aos noivos (fica também no sino do portal).', para: 'Noiva', info: 'Pílula NOVA NOTIFICAÇÃO, nomes e data, o título, a mensagem numa caixa e botão VER NO PORTAL.' },
      { k: 'resposta', nome: 'Resposta à Mensagem', assunto: 'RE: <assunto da mensagem>', quando: 'Quando a RL responde a uma mensagem que os noivos enviaram no Atendimento do portal.', para: 'Noiva', info: 'Pílula RESPOSTA DA NOSSA EQUIPA, nomes e data, a resposta, a mensagem original e botão ABRIR O NOSSO PORTAL.' },
      { k: 'tarefa-nova', nome: 'Nova Tarefa', assunto: '📋 Nova tarefa no vosso portal — <tarefa>', quando: 'Quando é criada uma tarefa para os noivos no portal.', para: 'Noiva (ou noivo)', info: 'Pílula NOVA TAREFA, nomes e data, a tarefa numa caixa e botão ABRIR O NOSSO PORTAL.' },
      { k: 'tarefa-concluida', nome: 'Tarefa Concluída', assunto: '✓ Tarefa concluída — <tarefa>', quando: 'Quando uma tarefa dos noivos é marcada como concluída.', para: 'Noiva (ou noivo)', info: 'Pílula TAREFA CONCLUÍDA, nomes e data, a tarefa numa caixa e botão ABRIR O NOSSO PORTAL.' },
      { k: 'dados-recebidos', nome: 'Dados Recebidos', assunto: '✓ Dados recebidos — RL Photo Video', quando: 'Quando os noivos enviam os dados para o contrato e o portal ainda não foi enviado.', para: 'Noiva (ou noivo)', info: 'Pílula DADOS RECEBIDOS, nomes e data, noivos, próximo passo (contrato e portal) e botão FALAR CONNOSCO (email da RL).' },
    ],
  },
  {
    titulo: 'Noivos · Pré-Wedding',
    tickets: [
      { k: 'proposta-60', nome: 'Faltam 60 Dias', assunto: 'Faltam 60 dias · preparámos algo para vocês', quando: 'Sozinho, quando faltam 60 dias para o casamento e o envio está agendado na ficha.', para: 'Noiva', info: 'Pílula FALTAM 60 DIAS, nomes e data, o texto da proposta e botão VER A PÁGINA (pre-wedding-entrada).' },
      { k: 'marcar-prewedding', nome: 'Marcar o Pré-Wedding', assunto: 'O vosso Pré-Wedding — RL Photo.Video', quando: 'Quando o admin aprova a marcação do pré-wedding na ficha do evento.', para: 'Noiva', info: 'Pílula O VOSSO PRÉ-WEDDING, nomes e data, local do casamento, onde marcar e botão MARCAR A SESSÃO.' },
      { k: 'prewedding-reservado', nome: 'Pré-Wedding Reservado', assunto: '📅 Pré-wedding reservado — <noivos>', quando: 'Quando os noivos escolhem o dia da sessão no portal.', para: 'Noiva (o admin recebe o seu aviso à parte)', info: 'Pílula PRÉ-WEDDING RESERVADO, nomes, data da sessão, hora e local, referência e botão ABRIR O NOSSO PORTAL.' },
    ],
  },
  {
    titulo: 'Noivos · Fotografias',
    tickets: [
      { k: 'entrega-galerias', nome: 'Fotos do Dia', assunto: 'As fotos do dia já estão disponíveis', quando: `${FICHA} da Galeria Online, ou no Departamento de Fotografia.`, para: 'Noiva', info: 'Pílula AS FOTOS DO DIA, nomes e data, local, onde fica no portal (Fotografias → Galerias Online), referência e botão VER A GALERIA com o link da entrega.' },
      { k: 'entrega-selecao', nome: 'Fotos para Seleção', assunto: 'As vossas fotos estão prontas para seleção', quando: `${FICHA} das Fotos p/ Seleção, ou no Departamento de Fotografia.`, para: 'Noiva', info: 'Pílula AS FOTOS PARA SELEÇÃO, nomes e data, local, onde fica no portal (Fotografias → Seleção), referência e botão ESCOLHER AS FOTOS com o link da entrega.' },
      { k: 'entrega-fotos_finais', nome: 'Fotos Editadas', assunto: 'As vossas fotos já estão editadas', quando: `${FICHA} das Fotos Finais, ou quando a entrega fica concluída no Departamento de Fotografia.`, para: 'Noiva', info: 'Pílula AS FOTOS FINAIS, nomes e data, local, onde fica no portal (Fotografias → Fotos Finais), referência e botão VER AS FOTOS com o link da entrega.' },
      { k: 'entrega-prewedding', nome: 'Fotos Pré-Wedding', assunto: 'As vossas fotos pré-wedding estão prontas', quando: `${FICHA} das Fotos Pré-Wedding.`, para: 'Noiva', info: 'Pílula AS FOTOS PRÉ-WEDDING, nomes e data, local, onde fica no portal (Fotografias → Pré-Wedding), referência e botão VER AS FOTOS com o link da entrega.' },
      { k: 'entrega-maquete', nome: 'Maquete do Álbum', assunto: 'A vossa maquete do álbum está pronta', quando: `${FICHA} da maquete, ou quando o álbum passa a Para Aprovação nos Álbuns.`, para: 'Noiva', info: 'Pílula A MAQUETE DO ÁLBUM, nomes e data, local, onde fica no portal (Fotografias → Álbum), referência e botão VER A MAQUETE com o link da entrega.' },
    ],
  },
  {
    titulo: 'Noivos · Vídeos',
    tickets: [
      { k: 'entrega-video_prewedding', nome: 'Vídeo Pré-Wedding', assunto: 'O vosso vídeo pré-wedding está pronto', quando: `${FICHA} do Vídeo Pré-Wedding.`, para: 'Noiva', info: 'Pílula O VÍDEO PRÉ-WEDDING, nomes e data, local, onde fica no portal (O Nosso Filme → Pré-Wedding), referência e botão VER O VÍDEO com o link da entrega.' },
      { k: 'entrega-same_day_edit', nome: 'Same Day Edit', assunto: 'O vosso Same Day Edit está pronto', quando: `${FICHA} do Same Day Edit.`, para: 'Noiva', info: 'Pílula O SAME DAY EDIT, nomes e data, local, onde fica no portal (O Nosso Filme → Same Day Edit), referência e botão VER O VÍDEO com o link da entrega.' },
      { k: 'entrega-teaser', nome: 'Teaser / Trailer', assunto: 'O vosso Teaser está pronto', quando: `${FICHA} do Teaser / Trailer.`, para: 'Noiva', info: 'Pílula O VOSSO TEASER, nomes e data, local, onde fica no portal (O Nosso Filme → Teaser), referência e botão VER O TEASER com o link da entrega.' },
      { k: 'entrega-wedding_film', nome: 'Wedding Film', assunto: 'O vosso Wedding Film está pronto', quando: 'Quando o filme é entregue na Edição de Vídeo (sem estreia marcada).', para: 'Noiva', info: 'Pílula O VOSSO WEDDING FILM, nomes e data, local, onde fica no portal (O Nosso Filme → Wedding Film), referência e botão VER O FILME com o link da entrega.' },
      { k: 'filme-aguardar', nome: 'Ticket do Filme · 1 Editor', ...FILME('Aguardar (já tem editor)') },
      { k: 'filme-edicao', nome: 'Ticket do Filme · 2 Edição', ...FILME('Em Edição') },
      { k: 'filme-revisao', nome: 'Ticket do Filme · 3 Revisão', ...FILME('Em Revisão') },
      { k: 'filme-finalizado', nome: 'Ticket do Filme · 4 Pronto', ...FILME('Finalizado') },
      { k: 'filme-estreia', nome: 'Ticket do Filme · 5 Estreia', assunto: 'Ticket do Filme · Ana & Tiago', quando: 'Quando a estreia do filme é marcada.', para: 'Noivos', info: 'Pílula TICKET DO FILME, a data e hora da estreia em destaque, Nº do ticket, os 5 passos e botão ABRIR O NOSSO PORTAL.' },
    ],
  },
  {
    titulo: 'Noivos · Pagamentos',
    tickets: [
      { k: 'pagamento-tally', nome: 'Pagamento Registado (Tally)', assunto: '✓ Pagamento registado — RL Photo Video', quando: 'Quando os noivos preenchem o formulário de pagamento no Tally.', para: 'Email indicado no formulário', info: 'Pílula PAGAMENTO REGISTADO, nomes, valor em destaque, referência, forma de pagamento, data e botão ABRIR O NOSSO PORTAL.' },
      { k: 'pagamento', nome: 'Comprovativo de Pagamento', assunto: 'Comprovativo de pagamento — 750.00 €', quando: 'Quando os noivos registam um pagamento em Registar Pagamento. O mesmo card vai também para o admin (assunto "Novo pagamento").', para: 'Noiva e admin', info: 'Pílula COMPROVATIVO DE PAGAMENTO, nomes, valor pago em destaque, referência, fase, método, data, a imagem do comprovativo (se houver) e botão ABRIR O NOSSO PORTAL.' },
    ],
  },
  {
    titulo: 'Freelancers',
    tickets: [
      { k: 'fl-novidades', nome: 'Tens Novidades no Portal', assunto: 'Tens novidades no portal — CAS_000_27_RL', quando: 'Na equipa da ficha do evento, ao carregar no botão de notificar o freelancer.', para: 'Freelancers da equipa' },
      { k: 'fl-briefing', nome: 'Briefing Disponível', assunto: 'Briefing disponível — Quinta de Exemplo · 12 Jun 2027', quando: 'Quando o briefing do casamento é enviado à equipa.', para: 'Freelancers da equipa' },
      { k: 'fl-trabalho-edicao', nome: 'Trabalho de Edição', assunto: 'Trabalho de edição — Quinta de Exemplo', quando: 'Quando o trabalho (ficheiros e links) é enviado aos editores de vídeo.', para: 'Editores de vídeo' },
      { k: 'fl-edicao-fotos', nome: 'Nova Edição de Fotos', assunto: 'Nova edição de fotos · Ana e Tiago', quando: 'Quando a edição de fotos de um casamento é atribuída a um freelancer.', para: 'Editor de fotografia' },
      { k: 'fl-candidatura', nome: 'Candidatura Recebida', assunto: 'Recebemos a tua candidatura · RL Photo.Video', quando: 'Quando alguém se candidata a freelancer.', para: 'Candidato' },
    ],
  },
  {
    titulo: 'Editores de vídeo',
    tickets: [
      { k: 'ticket-editor', nome: 'Ticket de Edição', assunto: 'Ticket de Edição · Ana e Tiago', quando: 'Quando um editor de vídeo é nomeado na equipa do evento.', para: 'Editor de vídeo' },
      { k: 'ticket-aprovacao', nome: 'Ticket de Aprovação', assunto: 'Ticket de Aprovação · Ana e Tiago', quando: 'Quando a RL aprova o vídeo em revisão.', para: 'Editor de vídeo' },
    ],
  },
  {
    titulo: 'Convidados',
    tickets: [
      { k: 'ticket', nome: 'Ticket Fotos/Dia', assunto: 'Comprovativo de aquisição de fotografias — RP-0000', quando: 'Quando é registado um pedido de fotografias do dia (papel ou digital), ou reenviado na lista de pedidos.', para: 'Convidado que comprou e responsável pela venda' },
    ],
  },
  {
    titulo: 'Casais · Leads',
    tickets: [
      { k: 'reuniao', nome: 'Reunião Marcada', assunto: 'Tens uma reunião marcada · <data> às <hora>', quando: 'No CRM, ao marcar a reunião com o casal.', para: 'Casal (email da lead)', info: 'Pílula REUNIÃO MARCADA, nomes, data, hora, modo e botão VER A REUNIÃO.' },
      { k: 'lembrete-reuniao', nome: 'Lembrete da Reunião', assunto: '⏰ A vossa reunião começa em 30 minutos', quando: 'Sozinho, 30 minutos antes da reunião marcada no CRM.', para: 'Casal (email da lead)', info: 'Pílula FALTAM 30 MINUTOS, nomes, hora, destaque "30 minutos" e botão JUNTAR À VIDEOCHAMADA.' },
      { k: 'nova-lead', nome: 'Recebemos o Vosso Contacto', assunto: 'Recebemos o vosso contacto — RL Photo.Video', quando: 'Quando uma lead preenche o formulário de contacto (Nova Lead).', para: 'Lead', info: 'Pílula MENSAGEM RECEBIDA, nomes, serviços pedidos e botão VER O BLOG.' },
    ],
  },
]

export default function TicketsPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#0b0a08', color: '#f0e8d8', padding: '40px 16px 80px', fontFamily: 'Georgia, serif' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <a href="/" style={{ color: '#8c8170', fontSize: 13, textDecoration: 'none' }}>‹ Voltar</a>
        <p style={{ margin: '24px 0 0', fontSize: 11, letterSpacing: '0.45em', color: '#d8be93', textTransform: 'uppercase' }}>RL Photo · Video</p>
        <h1 style={{ margin: '8px 0 6px', fontSize: 34, fontWeight: 400, fontStyle: 'italic' }}>Tickets</h1>
        <p style={{ margin: '0 0 12px', fontSize: 14, color: '#a99d88' }}>
          Exemplos de todos os tickets enviados por email. Dados fictícios, nada é enviado.
          Tudo o que vai para os noivos usa o mesmo bilhete: foto com os nomes e a data, linha de corte, frase, campos e botão em dourado suave.
        </p>
        <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '0 0 8px' }}>
          {GRUPOS.map((g, i) => (
            <a key={g.titulo} href={`#g${i}`} style={{ padding: '6px 14px', border: '1px solid #3a3226', borderRadius: 40, fontSize: 12, color: '#d8be93', textDecoration: 'none' }}>
              {g.titulo} ({g.tickets.length})
            </a>
          ))}
        </nav>
        {GRUPOS.map((g, i) => (
          <div key={g.titulo} id={`g${i}`}>
            <h2 style={{ margin: '44px 0 18px', fontSize: 13, letterSpacing: '0.3em', textTransform: 'uppercase', fontWeight: 400, color: '#d8be93' }}>{g.titulo}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 580px), 1fr))', gap: 28 }}>
              {g.tickets.map(t => (
                <section key={t.k} style={{ border: '1px solid #2a2620', borderRadius: 6, overflow: 'hidden', background: '#141210' }}>
                  <div style={{ padding: '18px 20px' }}>
                    <h3 style={{ margin: '0 0 10px', fontSize: 20, fontWeight: 400, color: '#f0e8d8' }}>{t.nome}</h3>
                    <p style={{ margin: '0 0 4px', fontSize: 13, color: '#c9bea9' }}><span style={{ color: '#8c8170' }}>Assunto:</span> {t.assunto}</p>
                    <p style={{ margin: '0 0 4px', fontSize: 13, color: '#c9bea9' }}><span style={{ color: '#8c8170' }}>Quando:</span> {t.quando}</p>
                    <p style={{ margin: 0, fontSize: 13, color: '#c9bea9' }}><span style={{ color: '#8c8170' }}>Para:</span> {t.para}</p>
                    {t.info && <p style={{ margin: '4px 0 0', fontSize: 13, color: '#c9bea9' }}><span style={{ color: '#8c8170' }}>Mostra:</span> {t.info}</p>}
                  </div>
                  <iframe
                    title={t.nome}
                    src={`/api/jornada/email?k=${t.k}&v=${VERSAO}`}
                    sandbox="allow-same-origin"
                    loading="lazy"
                    style={{ display: 'block', width: '100%', height: t.info ? 1180 : 900, border: 0, background: t.info ? '#0b0b0b' : '#f3ede1' }}
                  />
                </section>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
