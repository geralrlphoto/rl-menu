// Montra dos tickets enviados por email, só com exemplos (casal fictício).
// Cada exemplo vem de /api/jornada/email, que usa as mesmas funções de HTML das
// rotas de envio: a página mostra sempre o email real e não lê a base de dados.

export const metadata = { title: 'Tickets · RL' }

type Ticket = { k: string; nome: string; assunto: string; quando: string; para: string }

const FICHA = 'Na ficha do evento, ao enviar o link'
const FILME = (passo: string) => ({ assunto: 'Ticket do Filme · Ana & Tiago', quando: `Quando o vídeo passa a ${passo}.`, para: 'Noivos' })

const GRUPOS: { titulo: string; tickets: Ticket[] }[] = [
  {
    titulo: 'Noivos · Portal',
    tickets: [
      { k: 'portal', nome: 'O Vosso Portal Está Aberto', assunto: '💍 O portal do casamento está pronto', quando: 'Quando o contrato é aprovado e o portal dos noivos é criado. Leva o email e a palavra-passe de acesso.', para: 'Noiva (ou noivo, se não houver email da noiva)' },
      { k: 'recuperar', nome: 'Recuperar a Palavra-passe', assunto: '🔑 A vossa palavra-passe do portal', quando: 'Quando os noivos pedem a palavra-passe no login do portal e confirmam a identidade.', para: 'Noiva (ou noivo, se não houver email da noiva)' },
      { k: 'dados-recebidos', nome: 'Dados Recebidos', assunto: '✓ Dados recebidos — RL Photo Video', quando: 'Quando os noivos enviam os dados para o contrato e o portal ainda não foi enviado.', para: 'Noiva (ou noivo)' },
    ],
  },
  {
    titulo: 'Noivos · Fotografias',
    tickets: [
      { k: 'entrega-galerias', nome: 'Fotos do Dia', assunto: 'As fotos do dia já estão disponíveis', quando: `${FICHA} da Galeria Online, ou no Departamento de Fotografia.`, para: 'Noiva' },
      { k: 'entrega-selecao', nome: 'Fotos para Seleção', assunto: 'As vossas fotos estão prontas para seleção', quando: `${FICHA} das Fotos p/ Seleção, ou no Departamento de Fotografia.`, para: 'Noiva' },
      { k: 'entrega-fotos_finais', nome: 'Fotos Editadas', assunto: 'As vossas fotos já estão editadas', quando: `${FICHA} das Fotos Finais, ou quando a entrega fica concluída no Departamento de Fotografia.`, para: 'Noiva' },
      { k: 'entrega-prewedding', nome: 'Fotos Pré-Wedding', assunto: 'As vossas fotos pré-wedding estão prontas', quando: `${FICHA} das Fotos Pré-Wedding.`, para: 'Noiva' },
      { k: 'entrega-maquete', nome: 'Maquete do Álbum', assunto: 'A vossa maquete do álbum está pronta', quando: `${FICHA} da maquete, ou quando o álbum passa a Para Aprovação nos Álbuns.`, para: 'Noiva' },
    ],
  },
  {
    titulo: 'Noivos · Vídeos',
    tickets: [
      { k: 'entrega-video_prewedding', nome: 'Vídeo Pré-Wedding', assunto: 'O vosso vídeo pré-wedding está pronto', quando: `${FICHA} do Vídeo Pré-Wedding.`, para: 'Noiva' },
      { k: 'entrega-same_day_edit', nome: 'Same Day Edit', assunto: 'O vosso Same Day Edit está pronto', quando: `${FICHA} do Same Day Edit.`, para: 'Noiva' },
      { k: 'entrega-teaser', nome: 'Teaser / Trailer', assunto: 'O vosso Teaser está pronto', quando: `${FICHA} do Teaser / Trailer.`, para: 'Noiva' },
      { k: 'entrega-wedding_film', nome: 'Wedding Film', assunto: 'O vosso Wedding Film está pronto', quando: 'Quando o filme é entregue na Edição de Vídeo (sem estreia marcada).', para: 'Noiva' },
      { k: 'filme-aguardar', nome: 'Ticket do Filme · 1 Editor', ...FILME('Aguardar (já tem editor)') },
      { k: 'filme-edicao', nome: 'Ticket do Filme · 2 Edição', ...FILME('Em Edição') },
      { k: 'filme-revisao', nome: 'Ticket do Filme · 3 Revisão', ...FILME('Em Revisão') },
      { k: 'filme-finalizado', nome: 'Ticket do Filme · 4 Pronto', ...FILME('Finalizado') },
      { k: 'filme-estreia', nome: 'Ticket do Filme · 5 Estreia', assunto: 'Ticket do Filme · Ana & Tiago', quando: 'Quando a estreia do filme é marcada.', para: 'Noivos' },
    ],
  },
  {
    titulo: 'Noivos · Pagamentos',
    tickets: [
      { k: 'pagamento', nome: 'Comprovativo de Pagamento', assunto: 'Comprovativo de pagamento — 750.00 €', quando: 'Quando os noivos registam um pagamento em Registar Pagamento. O mesmo card vai também para o admin (assunto "Novo pagamento").', para: 'Noiva e admin' },
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
    titulo: 'Leads',
    tickets: [
      { k: 'nova-lead', nome: 'Recebemos o Vosso Contacto', assunto: 'Recebemos o vosso contacto — RL Photo.Video', quando: 'Quando uma lead preenche o formulário de contacto (Nova Lead).', para: 'Lead' },
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
                  </div>
                  <iframe
                    title={t.nome}
                    src={`/api/jornada/email?k=${t.k}`}
                    sandbox="allow-same-origin"
                    loading="lazy"
                    style={{ display: 'block', width: '100%', height: 900, border: 0, background: '#f3ede1' }}
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
