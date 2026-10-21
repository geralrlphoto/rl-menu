'use client'

// Painel do Editor › Guia do Portal: todo o processo do editor de vídeo, do momento
// em que é nomeado até ao filme chegar aos noivos. Segue as regras do Departamento de
// Edição de Vídeo (lib/videoEstado.ts): Aguardar → Em Edição → Em Revisão são do editor;
// Finalizado e Entregue são da RL. Desenho como o /freelancers e o /tickets.

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

const OURO = '#C9A84C'

type Passo = { n: string; titulo: string; quem: 'Tu' | 'RL' | 'Automático'; onde: string; texto: string[]; dica?: string }

const PASSOS: Passo[] = [
  {
    n: '01', titulo: 'És nomeado editor', quem: 'Automático', onde: 'Email · Ticket de Edição',
    texto: [
      'Quando a RL te põe como editor de vídeo de um casamento, recebes por email o Ticket de Edição com os noivos, a data, o local e o prazo de entrega do filme.',
      'O projeto aparece logo em Novos Projetos, no estado Aguardar. Nesta fase o download do material está bloqueado.',
    ],
    dica: 'Confirma em até 2 dias que recebeste o projeto, abrindo-o no painel.',
  },
  {
    n: '02', titulo: 'Recebes o material', quem: 'RL', onde: 'Email · Trabalho de edição',
    texto: [
      'A RL envia-te o trabalho: recebes o email "Trabalho de edição" e um aviso no sino do painel.',
      'Dentro do projeto, na secção Material e Relatório da RL, ficam o link de download (WeTransfer, Drive ou Dropbox) e o Relatório Diário da equipa: o que foi gravado, áudio, drone, máquinas, problemas técnicos e informação importante do dia.',
    ],
    dica: 'Lê o Relatório Diário antes de começar. Lá estão os detalhes que não se veem nas imagens.',
  },
  {
    n: '03', titulo: 'Desbloqueias e descarregas', quem: 'Tu', onde: 'Novos Projetos › o projeto',
    texto: [
      'Abre o projeto e muda o estado do vídeo para Em Edição. Só assim o botão ↓ Download fica ativo.',
      'Carrega em ↓ Download e descarrega todo o material. Ao passares a Em Edição, a RL e os noivos ficam a saber que o filme começou a ganhar forma.',
    ],
    dica: 'Sem link de download ainda? Fala com a RL pelas mensagens do projeto.',
  },
  {
    n: '04', titulo: 'Editas o filme', quem: 'Tu', onde: 'O teu computador',
    texto: [
      'Primeiro o Teaser / Trailer, a peça que os noivos partilham primeiro: o objetivo são 4 semanas.',
      'Depois o filme completo, com cor e com o áudio dos votos e dos discursos.',
      'O prazo final do filme são 180 dias úteis depois do casamento. Vês a data no Ticket de Edição e no projeto.',
    ],
    dica: 'As músicas que usares ficam registadas na Biblioteca do painel.',
  },
  {
    n: '05', titulo: 'Envias o vídeo para revisão', quem: 'Tu', onde: 'Projeto › Revisão do Vídeo',
    texto: [
      'Quando tiveres uma versão para ver, cola o link na secção Revisão do Vídeo (Frame.io) e carrega em Enviar para revisão.',
      'O vídeo passa a Em Revisão. A RL recebe o aviso e os noivos recebem o Ticket do Filme a dizer que o filme está a ser revisto.',
    ],
    dica: 'O vídeo só passa a Em Revisão com o link. O botão "Enviar Revisão" do menu leva-te diretamente a esta secção.',
  },
  {
    n: '06', titulo: 'A RL revê', quem: 'RL', onde: 'Departamento de Edição de Vídeo',
    texto: [
      'A RL vê o filme do princípio ao fim. Há dois caminhos possíveis:',
      'Requer Alterações: o vídeo volta a Em Edição e recebes as notas da RL no painel. Fazes as alterações e voltas ao passo 05 com o novo link.',
      'Aprovado: recebes por email o Ticket de Aprovação, com as notas finais, e o vídeo passa a Finalizado.',
    ],
  },
  {
    n: '07', titulo: 'Envias a versão final', quem: 'Tu', onde: 'Projeto › Entrega do Projeto',
    texto: [
      'Exporta o master em alta qualidade.',
      'Cola o link (Drive, WeTransfer, Frame.io ou Vimeo) na secção Entrega do Projeto e envia. A RL recebe o aviso e o link fica guardado na ficha do casamento.',
    ],
    dica: 'Guarda o projeto e o master no NAS.',
  },
  {
    n: '08', titulo: 'A RL entrega aos noivos', quem: 'RL', onde: 'Portal dos noivos',
    texto: [
      'A RL faz a entrega aos noivos no portal deles. Pode marcar uma estreia, em que o filme aparece a uma hora combinada.',
      'O vídeo passa a Entregue e o projeto fica concluído no teu painel.',
    ],
  },
  {
    n: '09', titulo: 'Recebes o pagamento', quem: 'RL', onde: 'Pagamentos',
    texto: [
      'Cada trabalho que recebes cria um pagamento A receber na página Pagamentos, com o valor combinado e a data prevista.',
      'Quando a RL paga, o pagamento passa a Recebido.',
    ],
  },
]

const ESTADOS: { e: string; quem: string; texto: string }[] = [
  { e: 'Aguardar', quem: 'Automático', texto: 'Foste nomeado. Download bloqueado.' },
  { e: 'Em Edição', quem: 'Tu', texto: 'Desbloqueia o download. Também volta aqui quando a RL pede alterações.' },
  { e: 'Em Revisão', quem: 'Tu', texto: 'Quando envias o link de revisão.' },
  { e: 'Finalizado', quem: 'RL', texto: 'A RL aprovou o filme.' },
  { e: 'Entregue', quem: 'RL', texto: 'O filme chegou aos noivos.' },
]

const PAGINAS: { t: string; href: string; texto: string }[] = [
  { t: 'Novos Projetos', href: '/painel-editor/novos-projetos', texto: 'Os teus casamentos: estado, material, revisão, entrega e mensagens com a RL.' },
  { t: 'Workflow', href: '/painel-editor/workflow', texto: 'Todos os trabalhos numa lista, com o estado de cada um.' },
  { t: 'Calendário', href: '/painel-editor/calendario', texto: 'Casamentos e prazos de entrega.' },
  { t: 'Tarefas', href: '/painel-editor/tarefas', texto: 'Pedidos da RL que precisam de resposta.' },
  { t: 'Pagamentos', href: '/painel-editor/pagamentos', texto: 'O que tens a receber e o que já recebeste.' },
  { t: 'Biblioteca', href: '/painel-editor/musicas', texto: 'As músicas usadas em cada filme.' },
  { t: 'Dados Pessoais', href: '/painel-editor/dados-pessoais', texto: 'Contactos, NIF e IBAN para os pagamentos.' },
]

const corQuem = (q: string) => (q === 'Tu' ? OURO : q === 'RL' ? '#f0e8d8' : '#8a8a8a')

function Guia() {
  const params = useSearchParams()
  const fl = params?.get('freelancer')
  const comId = (href: string) => (fl ? `${href}?freelancer=${fl}` : href)

  return (
    <main className="min-h-screen bg-[#070707] overflow-x-clip font-cond text-white">
      {/* ── CAPA ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[460px] lg:min-h-[58vh] flex flex-col overflow-hidden">
        <div className="absolute inset-y-0 right-0 w-full lg:w-[64%]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/email/equipa-camera.jpg" alt="" className="absolute inset-0 w-full h-full object-cover object-center grayscale opacity-60 lg:opacity-80" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, #070707 0%, rgba(7,7,7,0.75) 30%, rgba(7,7,7,0.15) 70%, rgba(7,7,7,0.5) 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(0deg, #070707 0%, transparent 35%, transparent 75%, rgba(7,7,7,0.6) 100%)' }} />
        </div>
        <div className="absolute top-0 bottom-0 left-6 sm:left-10 lg:left-14 w-px bg-[#C9A84C]/45" />

        <div className="relative flex-1 grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_330px] gap-10 items-end pl-11 sm:pl-16 lg:pl-24 pr-5 sm:pr-16 pt-14 lg:pt-8 pb-12 lg:pb-16">
          <div className="min-w-0 flex flex-col h-full">
            <Link href={comId('/painel-editor')} className="text-[14px] text-white/45 hover:text-[#C9A84C] transition-colors">‹ O meu painel</Link>
            <div className="mt-auto pt-16">
              <p className="text-[13px] sm:text-[18px] font-bold tracking-[0.55em] uppercase text-[#C9A84C]">RL Photo.Video</p>
              <h1 className="font-bold uppercase text-white leading-[0.88] text-[52px] sm:text-[88px] xl:text-[112px] mt-2">Guia do<br />portal</h1>
              <div className="flex items-center gap-4 mt-5">
                <span className="hidden sm:block w-12 h-px bg-[#C9A84C]" />
                <p className="text-[13px] sm:text-[17px] tracking-[0.22em] uppercase text-white/70">Editor de <span className="text-[#C9A84C]">vídeo</span></p>
              </div>
              <p className="font-light text-white/50 text-[15px] sm:text-[17px] leading-relaxed mt-5 max-w-2xl">
                Tudo o que acontece desde que és nomeado até o filme chegar aos noivos: como recebes o material, como o descarregas, como envias o vídeo e como termina o projeto.
              </p>
            </div>
          </div>

          <aside className="rounded-[22px] border border-[#C9A84C]/30 bg-[#111111]/80 backdrop-blur-xl p-5 shadow-[0_0_48px_-22px_rgba(201,168,76,0.5)]">
            <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.12em] uppercase text-white/85">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] shadow-[0_0_8px_#C9A84C]" />
              Os prazos
            </p>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {[
                { l: 'Confirmar', v: '2 dias' },
                { l: 'Teaser', v: '4 sem.' },
                { l: 'Filme', v: '180 d.ú.', ouro: true },
                { l: 'Passos', v: String(PASSOS.length) },
              ].map(x => (
                <div key={x.l} className="rounded-[14px] border border-white/[0.08] bg-black/30 px-3.5 py-3">
                  <p className="text-[10px] tracking-[0.2em] uppercase text-white/40">{x.l}</p>
                  <p className={`font-semibold text-[22px] leading-none mt-1.5 ${x.ouro ? 'text-[#C9A84C]' : 'text-white'}`}>{x.v}</p>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-white/40 mt-3">d.ú. = dias úteis depois do casamento</p>
          </aside>
        </div>
      </section>

      <div className="px-5 sm:px-16 lg:px-24 pb-24 max-w-[1400px]">
        {/* ── Índice ─────────────────────────────────────────────────────── */}
        <nav className="flex flex-wrap gap-2 mb-4">
          {[['#processo', 'O processo'], ['#estados', 'Os estados do vídeo'], ['#paginas', 'As páginas do painel']].map(([h, t]) => (
            <a key={h} href={h} className="inline-flex items-center text-[12px] px-4 py-2 rounded-full border border-white/12 text-white/60 hover:text-white hover:border-[#C9A84C]/60 tracking-[0.12em] uppercase font-semibold transition-all">{t}</a>
          ))}
        </nav>

        {/* ── O processo ─────────────────────────────────────────────────── */}
        <section id="processo" className="scroll-mt-6">
          <div className="flex items-center gap-4 mt-14 mb-6">
            <span className="w-10 h-px bg-[#C9A84C]" />
            <h2 className="text-[15px] sm:text-[18px] font-bold tracking-[0.3em] uppercase text-white">O processo, passo a passo</h2>
          </div>
          <ol className="grid gap-5">
            {PASSOS.map(p => (
              <li key={p.n} className="rounded-[22px] border border-white/[0.08] bg-[#111111] p-5 sm:p-7 grid sm:grid-cols-[96px_1fr] gap-4 sm:gap-6"
                style={{ borderLeft: `2px solid ${corQuem(p.quem)}` }}>
                <p className="font-bold text-[44px] sm:text-[56px] leading-none text-[#C9A84C]/80 tabular-nums">{p.n}</p>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold uppercase text-white text-[22px] sm:text-[26px] leading-tight mr-2">{p.titulo}</h3>
                    <span className="rounded-full px-2.5 py-0.5 text-[10px] tracking-[0.2em] uppercase"
                      style={{ color: corQuem(p.quem), background: corQuem(p.quem) + '1f', border: `1px solid ${corQuem(p.quem)}55` }}>{p.quem}</span>
                    <span className="rounded-full px-2.5 py-0.5 text-[10px] tracking-[0.2em] uppercase text-white/50 border border-white/12">{p.onde}</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {p.texto.map((t, i) => <p key={i} className="text-[15px] text-white/70 leading-relaxed">{t}</p>)}
                  </div>
                  {p.dica && (
                    <p className="mt-4 text-[13px] text-white/60 leading-relaxed rounded-[14px] border border-[#C9A84C]/25 bg-[#C9A84C]/[0.06] px-4 py-3">
                      <span className="text-[10px] tracking-[0.25em] uppercase text-[#C9A84C] mr-2">Dica</span>{p.dica}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Estados do vídeo ───────────────────────────────────────────── */}
        <section id="estados" className="scroll-mt-6">
          <div className="flex items-center gap-4 mt-16 mb-6">
            <span className="w-10 h-px bg-[#C9A84C]" />
            <h2 className="text-[15px] sm:text-[18px] font-bold tracking-[0.3em] uppercase text-white">Os estados do vídeo</h2>
          </div>
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))' }}>
            {ESTADOS.map((s, i) => (
              <div key={s.e} className="rounded-[18px] border border-white/[0.08] bg-[#111111] p-5" style={{ borderLeft: `2px solid ${corQuem(s.quem)}` }}>
                <p className="text-[10px] tracking-[0.25em] uppercase text-white/40">{i + 1} · {s.quem === 'Tu' ? 'Mudas tu' : s.quem === 'RL' ? 'Muda a RL' : 'Automático'}</p>
                <p className="font-bold uppercase text-white text-[20px] mt-1">{s.e}</p>
                <p className="text-[13px] text-white/60 mt-2 leading-relaxed">{s.texto}</p>
              </div>
            ))}
          </div>
          <p className="text-[13px] text-white/45 mt-4">Em cada mudança, os noivos recebem o Ticket do Filme com o ponto em que o filme está.</p>
        </section>

        {/* ── Páginas do painel ──────────────────────────────────────────── */}
        <section id="paginas" className="scroll-mt-6">
          <div className="flex items-center gap-4 mt-16 mb-6">
            <span className="w-10 h-px bg-[#C9A84C]" />
            <h2 className="text-[15px] sm:text-[18px] font-bold tracking-[0.3em] uppercase text-white">As páginas do painel</h2>
          </div>
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))' }}>
            {PAGINAS.map(p => (
              <Link key={p.t} href={comId(p.href)}
                className="rounded-[18px] border border-white/[0.08] bg-[#111111] p-5 transition-all duration-300 hover:border-[#C9A84C]/45 hover:shadow-[0_0_50px_-20px_rgba(201,168,76,0.6)] hover:-translate-y-1"
                style={{ borderLeft: `2px solid ${OURO}` }}>
                <p className="font-bold uppercase text-white text-[18px]">{p.t} <span className="text-[#C9A84C]">→</span></p>
                <p className="text-[13px] text-white/60 mt-2 leading-relaxed">{p.texto}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Guia />
    </Suspense>
  )
}
