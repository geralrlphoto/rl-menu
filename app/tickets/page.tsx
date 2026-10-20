// Montra dos tickets enviados por email, só com exemplos (casal fictício).
// Cada exemplo vem de /api/jornada/email, que usa as mesmas funções de HTML das
// rotas de envio: a página mostra sempre o email real e não lê a base de dados.

export const metadata = { title: 'Tickets · RL' }

type Ticket = { k: string; nome: string; assunto: string; quando: string; para: string }

const TICKETS: Ticket[] = [
  {
    k: 'ticket', nome: 'Ticket Fotos/Dia',
    assunto: 'Comprovativo de aquisição de fotografias — RP-0000',
    quando: 'Quando é registado um pedido de fotografias do dia (papel ou digital), ou reenviado na lista de pedidos.',
    para: 'Convidado que comprou as fotografias',
  },
  {
    k: 'ticket-editor', nome: 'Ticket de Edição',
    assunto: 'Ticket de Edição · Ana e Tiago',
    quando: 'Quando um editor de vídeo é nomeado na equipa do evento.',
    para: 'Editor de vídeo',
  },
  {
    k: 'ticket-aprovacao', nome: 'Ticket de Aprovação',
    assunto: 'Ticket de Aprovação · Ana e Tiago',
    quando: 'Quando a RL aprova o vídeo em revisão.',
    para: 'Editor de vídeo',
  },
  { k: 'filme-aguardar', nome: 'Ticket do Filme · 1 Editor', assunto: 'Ticket do Filme · Ana & Tiago', quando: 'Quando o vídeo passa a Aguardar (já tem editor).', para: 'Noivos' },
  { k: 'filme-edicao', nome: 'Ticket do Filme · 2 Edição', assunto: 'Ticket do Filme · Ana & Tiago', quando: 'Quando o vídeo passa a Em Edição.', para: 'Noivos' },
  { k: 'filme-revisao', nome: 'Ticket do Filme · 3 Revisão', assunto: 'Ticket do Filme · Ana & Tiago', quando: 'Quando o vídeo passa a Em Revisão.', para: 'Noivos' },
  { k: 'filme-finalizado', nome: 'Ticket do Filme · 4 Pronto', assunto: 'Ticket do Filme · Ana & Tiago', quando: 'Quando o vídeo passa a Finalizado.', para: 'Noivos' },
  { k: 'filme-estreia', nome: 'Ticket do Filme · 5 Estreia', assunto: 'Ticket do Filme · Ana & Tiago', quando: 'Quando a estreia do filme é marcada.', para: 'Noivos' },
]

export default function TicketsPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#0b0a08', color: '#f0e8d8', padding: '40px 16px 80px', fontFamily: 'Georgia, serif' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <a href="/" style={{ color: '#8c8170', fontSize: 13, textDecoration: 'none' }}>‹ Voltar</a>
        <p style={{ margin: '24px 0 0', fontSize: 11, letterSpacing: '0.45em', color: '#d8be93', textTransform: 'uppercase' }}>RL Photo · Video</p>
        <h1 style={{ margin: '8px 0 6px', fontSize: 34, fontWeight: 400, fontStyle: 'italic' }}>Tickets</h1>
        <p style={{ margin: '0 0 36px', fontSize: 14, color: '#a99d88' }}>
          Exemplos de todos os tickets enviados por email. Dados fictícios, nada é enviado.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 580px), 1fr))', gap: 28 }}>
          {TICKETS.map(t => (
            <section key={t.k} style={{ border: '1px solid #2a2620', borderRadius: 6, overflow: 'hidden', background: '#141210' }}>
              <div style={{ padding: '18px 20px' }}>
                <h2 style={{ margin: '0 0 10px', fontSize: 20, fontWeight: 400, color: '#d8be93' }}>{t.nome}</h2>
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
    </main>
  )
}
