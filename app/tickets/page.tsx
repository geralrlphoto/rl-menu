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
    titulo: 'Equipa · Freelancers',
    tickets: [
      { k: 'fl-novidades', nome: 'Novo Evento', assunto: 'Tens novidades no portal — CAS_000_27_RL', quando: 'Na equipa da ficha do evento, ao carregar no botão de notificar o freelancer.', para: 'Freelancers da equipa', info: 'Pílula NOVO EVENTO, nome e função do membro, casamento, data, local, referência e botão ABRIR O MEU PORTAL.' },
      { k: 'fl-briefing', nome: 'Briefing Disponível', assunto: 'Briefing disponível — Quinta de Exemplo · 12 Jun 2027', quando: 'Quando o briefing do casamento é enviado à equipa.', para: 'Freelancers da equipa', info: 'Pílula BRIEFING DISPONÍVEL, nome e função, casamento, data, local, referência e botão VER O BRIEFING.' },
      { k: 'fl-notificacao', nome: 'Nova Notificação', assunto: 'Tens uma nova notificação — <título>', quando: 'Quando o admin envia uma notificação ao freelancer (fica também no sino do portal).', para: 'Freelancer', info: 'Pílula NOVA NOTIFICAÇÃO, nome e função, o título e botão VER NO PORTAL.' },
      { k: 'fl-mensagem', nome: 'Nova Mensagem', assunto: 'Tens uma nova mensagem no portal', quando: 'Quando o admin escreve ao freelancer nas mensagens do portal.', para: 'Freelancer', info: 'Pílula NOVA MENSAGEM, nome e função, a mensagem numa caixa e botão RESPONDER NO PORTAL.' },
      { k: 'fl-tarefa', nome: 'Nova Tarefa', assunto: 'Nova tarefa atribuída · <tarefa>', quando: 'Quando é atribuída uma tarefa ao freelancer.', para: 'Freelancer', info: 'Pílula NOVA TAREFA, nome e função, prazo, prioridade, descrição e botão ABRIR O MEU PORTAL.' },
      { k: 'fl-edicao-fotos', nome: 'Nova Edição de Fotos', assunto: 'Nova edição de fotos · Ana e Tiago', quando: 'Quando a edição de fotos de um casamento é atribuída a um freelancer.', para: 'Editor de fotografia', info: 'Pílula NOVA EDIÇÃO DE FOTOS, nome, casamento, data, local, referência e botão ABRIR O MEU PORTAL.' },
      { k: 'fl-edicao-album', nome: 'Nova Edição de Álbum', assunto: 'Nova edição de álbum · Ana e Tiago', quando: 'Quando a edição do álbum é atribuída, com as fotos escolhidas pelos noivos.', para: 'Editor de álbum', info: 'Pílula NOVA EDIÇÃO DE ÁLBUM, nome, casamento, data, local, referência, nº de fotos, a lista das fotos e botão ABRIR O MEU PORTAL.' },
      { k: 'fl-album-aviso', nome: 'Aviso do Álbum', assunto: '<título do aviso>', quando: 'Quando o estado do álbum muda (maquete aprovada, alterações pedidas…).', para: 'Editor de álbum', info: 'Pílula ÁLBUM, nome, o aviso, casamento, data, local, referência, a mensagem e botão ABRIR O MEU PORTAL.' },
      { k: 'fl-candidatura', nome: 'Candidatura Recebida', assunto: 'Recebemos a tua candidatura · RL Photo.Video', quando: 'Quando alguém se candidata a freelancer (formulário ou Tally).', para: 'Candidato', info: 'Pílula CANDIDATURA RECEBIDA, nome do candidato, agradecimento e botão CONHECER O NOSSO TRABALHO.' },
    ],
  },
  {
    titulo: 'Equipa · Editores de vídeo',
    tickets: [
      { k: 'ticket-editor', nome: 'Ticket de Edição', assunto: 'Ticket de Edição · Ana e Tiago', quando: 'Quando um editor de vídeo é nomeado na equipa do evento.', para: 'Editor de vídeo', info: 'Pílula TICKET DE EDIÇÃO, nome, Nº do ticket, data de atribuição, casamento, data, local, prazo do filme, os 4 próximos passos e botão ABRIR O MEU PAINEL.' },
      { k: 'fl-trabalho-edicao', nome: 'Trabalho de Edição', assunto: 'Trabalho de edição — Quinta de Exemplo', quando: 'Quando o trabalho (ficheiros e links) é enviado aos editores de vídeo.', para: 'Editores de vídeo', info: 'Pílula TRABALHO DE EDIÇÃO, nome, casamento, data, local, referência, os links de download e botão ABRIR O MEU PAINEL.' },
      { k: 'ed-novo-projeto', nome: 'Novo Projeto', assunto: 'Novo projeto atribuído · RL Photo.Video', quando: 'No Painel do Editor, quando um projeto novo é atribuído.', para: 'Editor de vídeo', info: 'Pílula NOVO PROJETO, nome, casamento e botão ABRIR O MEU PAINEL.' },
      { k: 'ed-tarefa', nome: 'Nova Tarefa (Painel)', assunto: 'Nova tarefa atribuída · RL Photo.Video', quando: 'No Painel do Editor, quando é criada uma tarefa para o editor.', para: 'Editor de vídeo', info: 'Pílula NOVA TAREFA, nome, projeto, prazo e hora, prioridade, descrição e botão ABRIR O MEU PAINEL.' },
      { k: 'ed-atrasado', nome: 'Projeto Atrasado', assunto: '⚠ Projeto atrasado: <noivos> (<dias> dias)', quando: 'Quando a entrega prevista de um projeto passa sem estar marcado como entregue.', para: 'Editor de vídeo', info: 'Pílula PROJETO ATRASADO, nome, casamento, entrega prevista, dias de atraso em destaque e botão ABRIR O PROJETO.' },
      { k: 'ticket-aprovacao', nome: 'Ticket de Aprovação', assunto: 'Ticket de Aprovação · Ana e Tiago', quando: 'Quando a RL aprova o vídeo em revisão.', para: 'Editor de vídeo', info: 'Pílula TICKET DE APROVAÇÃO, nome, Nº do ticket, data, casamento, local, notas da RL, os 4 próximos passos e botão VER A VERSÃO APROVADA.' },
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

const OURO = '#C9A84C'
const total = GRUPOS.reduce((n, g) => n + g.tickets.length, 0)
const contar = (prefixo: string) => GRUPOS.filter(g => g.titulo.startsWith(prefixo)).reduce((n, g) => n + g.tickets.length, 0)

// Desenho da página como o /freelancers: capa com câmara a preto e branco,
// linha dourada vertical, título grande em maiúsculas e cartões de 22px.
export default function TicketsPage() {
  return (
    <main className="min-h-screen bg-[#070707] overflow-x-clip font-cond">
      {/* ── CAPA ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[520px] lg:min-h-[64vh] flex flex-col overflow-hidden">
        <div className="absolute inset-y-0 right-0 w-full lg:w-[64%]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/email/equipa-camera.jpg" alt="" className="absolute inset-0 w-full h-full object-cover object-center grayscale opacity-60 lg:opacity-80" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, #070707 0%, rgba(7,7,7,0.75) 30%, rgba(7,7,7,0.15) 70%, rgba(7,7,7,0.5) 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(0deg, #070707 0%, transparent 35%, transparent 75%, rgba(7,7,7,0.6) 100%)' }} />
        </div>
        <div className="absolute top-0 bottom-0 left-6 sm:left-10 lg:left-14 w-px bg-[#C9A84C]/45" />
        <p className="hidden md:block absolute right-6 top-1/2 -translate-y-1/2 text-[11px] tracking-[0.4em] uppercase text-white/30 [writing-mode:vertical-rl]">
          Noivos · Equipa · Convidados
        </p>

        <div className="relative flex-1 grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_330px] gap-10 items-end pl-11 sm:pl-16 lg:pl-24 pr-5 sm:pr-16 pt-14 lg:pt-8 pb-12 lg:pb-16">
          <div className="min-w-0 flex flex-col h-full">
            <a href="/photo" className="text-[14px] text-white/45 hover:text-[#C9A84C] transition-colors">‹ Menu principal</a>
            <div className="mt-auto pt-20">
              <p className="text-[13px] sm:text-[18px] font-bold tracking-[0.55em] uppercase text-[#C9A84C]">RL Photo.Video</p>
              <h1 className="font-bold uppercase text-white leading-[0.88] text-[60px] sm:text-[96px] xl:text-[128px] mt-2">Tickets</h1>
              <div className="flex items-center gap-4 mt-5">
                <span className="hidden sm:block w-12 h-px bg-[#C9A84C]" />
                <p className="text-[13px] sm:text-[17px] tracking-[0.22em] uppercase text-white/70">
                  <span className="text-[#C9A84C]">Noivos</span> · Equipa · Convidados · Leads
                </p>
              </div>
              <p className="font-light text-white/50 text-[15px] sm:text-[17px] leading-relaxed mt-5 max-w-2xl">
                Todos os emails que a app envia, com dados fictícios. Nada é enviado daqui.
                Os noivos recebem o bilhete (foto com os nomes e a data); a equipa recebe o card da equipa (câmara, nome e função).
              </p>
            </div>
          </div>

          <aside className="rounded-[22px] border border-[#C9A84C]/30 bg-[#111111]/80 backdrop-blur-xl p-5 shadow-[0_0_48px_-22px_rgba(201,168,76,0.5)]">
            <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.12em] uppercase text-white/85">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] shadow-[0_0_8px_#C9A84C]" />
              Os tickets em números
            </p>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {[
                { l: 'Total', v: total, ouro: true },
                { l: 'Noivos', v: contar('Noivos') },
                { l: 'Equipa', v: contar('Equipa') },
                { l: 'Outros', v: total - contar('Noivos') - contar('Equipa') },
              ].map(x => (
                <div key={x.l} className="rounded-[14px] border border-white/[0.08] bg-black/30 px-3.5 py-3">
                  <p className="text-[10px] tracking-[0.2em] uppercase text-white/40">{x.l}</p>
                  <p className={`font-semibold text-[24px] leading-none mt-1.5 ${x.ouro ? 'text-[#C9A84C]' : 'text-white'}`}>{x.v}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <div className="px-5 sm:px-16 lg:px-24 pb-24">
        {/* ── Grupos ─────────────────────────────────────────────────────── */}
        <nav className="flex flex-wrap gap-2 mb-4">
          {GRUPOS.map((g, i) => (
            <a key={g.titulo} href={`#g${i}`}
              className="inline-flex items-center gap-2 text-[12px] px-4 py-2 rounded-full border border-white/12 text-white/60 hover:text-white hover:border-[#C9A84C]/60 tracking-[0.12em] uppercase font-semibold transition-all">
              {g.titulo} <span style={{ color: OURO }}>{g.tickets.length}</span>
            </a>
          ))}
        </nav>

        {GRUPOS.map((g, i) => (
          <section key={g.titulo} id={`g${i}`} className="scroll-mt-6">
            <div className="flex items-center gap-4 mt-14 mb-6">
              <span className="w-10 h-px bg-[#C9A84C]" />
              <h2 className="text-[15px] sm:text-[18px] font-bold tracking-[0.3em] uppercase text-white">{g.titulo}</h2>
              <span className="text-[13px] tracking-[0.2em] text-[#C9A84C]">{g.tickets.length}</span>
            </div>
            <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 560px), 1fr))' }}>
              {g.tickets.map(t => (
                <article key={t.k}
                  className="rounded-[22px] overflow-hidden border border-white/[0.08] bg-[#111111] transition-all duration-300 hover:border-[#C9A84C]/45 hover:shadow-[0_0_50px_-20px_rgba(201,168,76,0.6)]"
                  style={{ borderLeft: `2px solid ${OURO}` }}>
                  <div className="px-5 pt-5 pb-4">
                    <p className="font-bold uppercase text-white text-[22px] leading-tight">{t.nome}</p>
                    <dl className="mt-3 space-y-1.5 text-[13px] leading-relaxed">
                      {([['Assunto', t.assunto], ['Quando', t.quando], ['Para', t.para], ['Mostra', t.info]] as const).filter(([, v]) => v).map(([k, v]) => (
                        <div key={k} className="grid grid-cols-[72px_1fr] gap-2">
                          <dt className="text-[10px] tracking-[0.2em] uppercase text-[#C9A84C] pt-[3px]">{k}</dt>
                          <dd className="text-white/60">{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                  <iframe
                    title={t.nome}
                    src={`/api/jornada/email?k=${t.k}&v=${VERSAO}`}
                    sandbox="allow-same-origin"
                    loading="lazy"
                    className="block w-full border-0"
                    style={{ height: t.info ? 1180 : 900, background: t.info ? '#070707' : '#f3ede1' }}
                  />
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}
