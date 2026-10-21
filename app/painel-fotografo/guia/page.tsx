'use client'

// Guia do Portal para fotógrafos: todo o processo, do novo casamento até às fotos e ao
// álbum chegarem aos noivos. Junta o Fluxo de Trabalho aprovado (/fluxo-trabalho) com as
// regras do Departamento de Fotografia (lib/fotografiaFluxo.ts) e dos Álbuns
// (lib/albumEstado.ts). Mesmo desenho do Guia do Editor (/painel-editor/guia).

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { getFotografoId } from '../_data/freelancer-profile'

const OURO = '#C9A84C'

type Quem = 'Tu' | 'RL' | 'Noivos' | 'Automático'
type Passo = { n: string; titulo: string; quem: Quem; onde: string; texto: string[]; dica?: string }

const PASSOS: Passo[] = [
  {
    n: '01', titulo: 'Novo casamento', quem: 'Automático', onde: 'Email · Tens novidades no portal',
    texto: [
      'Quando a RL te põe na equipa de um casamento, recebes o email "Tens novidades no portal" e o casamento aparece no separador Casamentos: data, horário previsto, locais e a tua função.',
      'Confirma ou recusa a disponibilidade no portal em 48 horas, mesmo que seja para recusar. Depois de confirmar, bloqueia a data na tua agenda.',
    ],
    dica: 'Sem resposta, a RL não consegue fechar a equipa do dia e a data pode ir para outro fotógrafo.',
  },
  {
    n: '02', titulo: 'Briefing', quem: 'RL', onde: 'Email · Briefing disponível',
    texto: [
      'Antes do dia, recebes o email "Briefing disponível". O briefing fica dentro do casamento, no portal.',
      'Lê o cronograma completo, os locais e tempos de deslocação, a lista de fotografias de família, os pedidos especiais do casal e os contactos da equipa e dos fornecedores.',
    ],
    dica: 'Guarda o briefing no telemóvel para o teres sem rede. Dúvidas, pergunta antes do dia.',
  },
  {
    n: '03', titulo: 'O dia do casamento', quem: 'Tu', onde: 'No terreno',
    texto: [
      'Roupa de cores lisas (cinzento, branco, preto, creme, castanho ou azul-escuro), sem estampados nem letras, calça lisa e ténis discretos. Ganga é proibida.',
      'Equipamento revisto, baterias carregadas e cartões formatados na noite anterior. Chega com tempo a cada local.',
      'Antes de sair da casa dos noivos, confirma as fotografias com pais, avós e padrinhos, se estiverem presentes.',
      'Se houver provas no dia, envia-as dos tablets a 75% de qualidade para fotos.rlphoto@gmail.com e cola o link no cartão Fotos Prova do casamento.',
    ],
  },
  {
    n: '04', titulo: 'Pós-casamento', quem: 'Tu', onde: 'Primeiras 72 horas',
    texto: [
      'Faz backup de todos os cartões em duas cópias, em locais diferentes. Abre imagens ao acaso para confirmar que os backups funcionam e só depois formata os cartões.',
      'Se não houve provas no dia, envia-as até 7 dias depois do casamento, com marca de água, para fotos.rlphoto@gmail.com, e cola o link no cartão Fotos Prova.',
    ],
    dica: 'As provas servem para a RL enviar aos noivos o sneak peek (48 horas) e a galeria online (7 dias).',
  },
  {
    n: '05', titulo: 'Seleção de fotos', quem: 'Tu', onde: 'Cartão Seleção de Fotos',
    texto: [
      'Faz a seleção com 1500 a 3000 fotografias (mais não é problema, menos sim), organizada por pastas por momentos do dia, e confirma que tens todos os momentos e as fotos de família.',
      'Entrega até 20 dias depois do casamento: envia para fotos.rlphoto@gmail.com e cola o link no cartão Seleção de Fotos.',
    ],
    dica: 'A RL envia aos noivos as fotos para seleção até 30 dias depois do casamento. A tua seleção tem de chegar antes.',
  },
  {
    n: '06', titulo: 'Os noivos escolhem', quem: 'Noivos', onde: 'Portal dos noivos',
    texto: [
      'Os noivos escolhem no portal deles as fotografias para edição e para o álbum. Se passarem 30 dias sem escolha, a RL lembra-os.',
      'Quando a escolha chega, a edição pode começar.',
    ],
  },
  {
    n: '07', titulo: 'Edição de fotos', quem: 'Tu', onde: 'Separador Edição Fotos',
    texto: [
      'Se fores o editor de fotos, recebes o email "Nova edição de fotos" e o trabalho aparece no separador Edição Fotos, com as fotografias escolhidas pelos noivos.',
      'Tens 30 dias para entregar. Edita por blocos de luz e de local, para a galeria ficar coerente. Preto e branco ou edições mais ousadas são bem-vindas, mas deixa sempre a versão a cores.',
      'Exporta por pastas, com a mesma estrutura da seleção, envia para fotos.rlphoto@gmail.com e cola o link no cartão Fotos Editadas.',
    ],
    dica: 'Antes de enviar, vê tudo do início ao fim, de uma vez, como se fosses o cliente.',
  },
  {
    n: '08', titulo: 'A RL entrega aos noivos', quem: 'RL', onde: 'Departamento de Fotografia',
    texto: [
      'A RL revê a edição e envia as fotografias finais aos noivos, no portal deles e por email. É a RL que marca a entrega como feita.',
    ],
  },
  {
    n: '09', titulo: 'O álbum', quem: 'Tu', onde: 'Separador Edição Álbum',
    texto: [
      'Se fores o editor do álbum, o álbum aparece no separador Edição Álbum em Por começar. Passa-o a Em edição quando começares.',
      'Quando a maqueta estiver pronta, cola o link e carrega em "Entregar o álbum". O álbum passa a Em revisão e a RL recebe um email.',
      'A RL revê e envia o álbum aos noivos. Se pedirem alterações, o álbum volta para ti com um aviso aqui e por email. Quando o aprovam, segue para produção (Em elaboração, 30 dias) e depois fica Concluído.',
    ],
    dica: 'Os passos depois de "Entregar o álbum" são da RL e dos noivos. No portal ficam marcados com "· RL".',
  },
  {
    n: '10', titulo: 'Recebes o pagamento', quem: 'RL', onde: 'Separador Pagamentos',
    texto: [
      'Os teus trabalhos e valores aparecem no separador Pagamentos, com o que tens a receber e o que já recebeste.',
    ],
  },
]

const ESTADOS: { e: string; quem: Quem; texto: string }[] = [
  { e: 'Sneak peek', quem: 'RL', texto: 'Primeiras fotografias aos noivos em 48 horas, a partir das tuas provas.' },
  { e: 'Galeria online', quem: 'RL', texto: 'As fotos do dia, 7 dias depois do casamento.' },
  { e: 'Fotos p/ seleção', quem: 'RL', texto: 'A tua seleção vai para os noivos até 30 dias depois do casamento.' },
  { e: 'Seleção dos noivos', quem: 'Noivos', texto: 'Os noivos escolhem as fotografias para edição e para o álbum.' },
  { e: 'Edição', quem: 'Tu', texto: '30 dias depois de chegar a escolha dos noivos.' },
  { e: 'Entregue', quem: 'RL', texto: 'As fotografias finais chegam aos noivos.' },
]

const PAGINAS: { t: string; texto: string }[] = [
  { t: 'Casamentos', texto: 'Os teus casamentos: confirmar disponibilidade, briefing e os cartões Fotos Prova, Seleção de Fotos e Fotos Editadas.' },
  { t: 'Edição Fotos', texto: 'Os trabalhos de edição, com as fotografias escolhidas pelos noivos.' },
  { t: 'Edição Álbum', texto: 'Os álbuns que estás a fazer e o botão "Entregar o álbum".' },
  { t: 'Tarefas', texto: 'Pedidos da RL que precisam de resposta.' },
  { t: 'Calendário', texto: 'Casamentos e prazos.' },
  { t: 'Pagamentos', texto: 'O que tens a receber e o que já recebeste.' },
  { t: 'Fluxo de Trabalho', texto: 'A lista de verificação das 6 etapas, para ires marcando o que está feito.' },
  { t: 'Dados Pessoais', texto: 'Contactos e dados para os pagamentos.' },
]

const corQuem = (q: Quem) => (q === 'Tu' ? OURO : q === 'RL' ? '#f0e8d8' : q === 'Noivos' ? '#d8be93' : '#8a8a8a')
const rotuloQuem = (q: Quem) => (q === 'Tu' ? 'Tu' : q === 'RL' ? 'RL' : q === 'Noivos' ? 'Noivos' : 'Automático')

function Guia() {
  const params = useSearchParams()
  const id = getFotografoId(params?.get('freelancer'))
  const portal = id ? `/freelancers/${id}?view=freelancer` : '/login'

  return (
    <main className="min-h-screen bg-[#070707] overflow-x-clip font-cond text-white">
      {/* ── CAPA ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[460px] lg:min-h-[58vh] flex flex-col overflow-hidden">
        <div className="absolute inset-y-0 right-0 w-full lg:w-[64%]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/boas-vindas-camera.webp" alt="" className="absolute inset-0 w-full h-full object-cover object-center grayscale opacity-60 lg:opacity-80" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, #070707 0%, rgba(7,7,7,0.75) 30%, rgba(7,7,7,0.15) 70%, rgba(7,7,7,0.5) 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(0deg, #070707 0%, transparent 35%, transparent 75%, rgba(7,7,7,0.6) 100%)' }} />
        </div>
        <div className="absolute top-0 bottom-0 left-6 sm:left-10 lg:left-14 w-px bg-[#C9A84C]/45" />

        <div className="relative flex-1 grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_330px] gap-10 items-end pl-11 sm:pl-16 lg:pl-24 pr-5 sm:pr-16 pt-14 lg:pt-8 pb-12 lg:pb-16">
          <div className="min-w-0 flex flex-col h-full">
            <a href={portal} className="text-[14px] text-white/45 hover:text-[#C9A84C] transition-colors">‹ O meu portal</a>
            <div className="mt-auto pt-16">
              <p className="text-[13px] sm:text-[18px] font-bold tracking-[0.55em] uppercase text-[#C9A84C]">RL Photo.Video</p>
              <h1 className="font-bold uppercase text-white leading-[0.88] text-[52px] sm:text-[88px] xl:text-[112px] mt-2">Guia do<br />portal</h1>
              <div className="flex items-center gap-4 mt-5">
                <span className="hidden sm:block w-12 h-px bg-[#C9A84C]" />
                <p className="text-[13px] sm:text-[17px] tracking-[0.22em] uppercase text-white/70"><span className="text-[#C9A84C]">Fotógrafo</span> · Edição · Álbum</p>
              </div>
              <p className="font-light text-white/50 text-[15px] sm:text-[17px] leading-relaxed mt-5 max-w-2xl">
                Tudo o que acontece desde que entras num casamento até as fotografias e o álbum chegarem aos noivos: provas, seleção, edição, álbum e pagamento.
              </p>
            </div>
          </div>

          <aside className="rounded-[22px] border border-[#C9A84C]/30 bg-[#111111]/80 backdrop-blur-xl p-5 shadow-[0_0_48px_-22px_rgba(201,168,76,0.5)]">
            <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.12em] uppercase text-white/85">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] shadow-[0_0_8px_#C9A84C]" />
              Os teus prazos
            </p>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {[
                { l: 'Disponibilidade', v: '48 h' },
                { l: 'Provas', v: '7 dias' },
                { l: 'Seleção', v: '20 dias', ouro: true },
                { l: 'Edição', v: '30 dias' },
              ].map(x => (
                <div key={x.l} className="rounded-[14px] border border-white/[0.08] bg-black/30 px-3.5 py-3">
                  <p className="text-[10px] tracking-[0.2em] uppercase text-white/40">{x.l}</p>
                  <p className={`font-semibold text-[22px] leading-none mt-1.5 ${x.ouro ? 'text-[#C9A84C]' : 'text-white'}`}>{x.v}</p>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-white/40 mt-3">Provas e seleção contam a partir do casamento; a edição, a partir da escolha dos noivos.</p>
          </aside>
        </div>
      </section>

      <div className="px-5 sm:px-16 lg:px-24 pb-24 max-w-[1400px]">
        <nav className="flex flex-wrap gap-2 mb-4">
          {[['#processo', 'O processo'], ['#fases', 'As fases das fotografias'], ['#paginas', 'O portal']].map(([h, t]) => (
            <a key={h} href={h} className="inline-flex items-center text-[12px] px-4 py-2 rounded-full border border-white/12 text-white/60 hover:text-white hover:border-[#C9A84C]/60 tracking-[0.12em] uppercase font-semibold transition-all">{t}</a>
          ))}
          <a href="/fluxo-trabalho" className="inline-flex items-center text-[12px] px-4 py-2 rounded-full border border-[#C9A84C]/50 bg-[#C9A84C]/10 text-[#C9A84C] tracking-[0.12em] uppercase font-semibold transition-all">Fluxo de Trabalho →</a>
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
                      style={{ color: corQuem(p.quem), background: corQuem(p.quem) + '1f', border: `1px solid ${corQuem(p.quem)}55` }}>{rotuloQuem(p.quem)}</span>
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

        {/* ── Fases das fotografias (Departamento) ───────────────────────── */}
        <section id="fases" className="scroll-mt-6">
          <div className="flex items-center gap-4 mt-16 mb-6">
            <span className="w-10 h-px bg-[#C9A84C]" />
            <h2 className="text-[15px] sm:text-[18px] font-bold tracking-[0.3em] uppercase text-white">As fases das fotografias</h2>
          </div>
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))' }}>
            {ESTADOS.map((s, i) => (
              <div key={s.e} className="rounded-[18px] border border-white/[0.08] bg-[#111111] p-5" style={{ borderLeft: `2px solid ${corQuem(s.quem)}` }}>
                <p className="text-[10px] tracking-[0.25em] uppercase text-white/40">{i + 1} · {rotuloQuem(s.quem)}</p>
                <p className="font-bold uppercase text-white text-[20px] mt-1">{s.e}</p>
                <p className="text-[13px] text-white/60 mt-2 leading-relaxed">{s.texto}</p>
              </div>
            ))}
          </div>
          <p className="text-[13px] text-white/45 mt-4">É assim que a RL acompanha cada casamento no Departamento de Fotografia. Os noivos recebem um email em cada entrega.</p>
        </section>

        {/* ── O portal ───────────────────────────────────────────────────── */}
        <section id="paginas" className="scroll-mt-6">
          <div className="flex items-center gap-4 mt-16 mb-6">
            <span className="w-10 h-px bg-[#C9A84C]" />
            <h2 className="text-[15px] sm:text-[18px] font-bold tracking-[0.3em] uppercase text-white">O que tens no portal</h2>
          </div>
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))' }}>
            {PAGINAS.map(p => (
              <div key={p.t} className="rounded-[18px] border border-white/[0.08] bg-[#111111] p-5" style={{ borderLeft: `2px solid ${OURO}` }}>
                <p className="font-bold uppercase text-white text-[18px]">{p.t}</p>
                <p className="text-[13px] text-white/60 mt-2 leading-relaxed">{p.texto}</p>
              </div>
            ))}
          </div>
          <a href={portal}
            className="mt-8 inline-flex items-center gap-2.5 rounded-full border border-[#C9A84C]/70 bg-[#C9A84C]/15 hover:bg-[#C9A84C]/30 px-6 py-3 text-[14px] font-semibold tracking-[0.18em] uppercase text-white transition-all shadow-[0_0_34px_-12px_rgba(201,168,76,0.7)]">
            Abrir o meu portal <span className="text-[#C9A84C]">→</span>
          </a>
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
