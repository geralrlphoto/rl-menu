import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProjeto } from '@/app/portal-media/_data/mockProject'

type Props = { params: Promise<{ ref: string }> }

const NAV = [
  { slug: 'workflow',       label: 'Workflow',        desc: 'Fases do projeto',           icon: '◈' },
  { slug: 'briefing',       label: 'Briefing',        desc: 'Objetivos e referências',     icon: '◎' },
  { slug: 'contrato',       label: 'Contrato & CPS',  desc: 'Documentos e dados',          icon: '◇' },
  { slug: 'pagamentos',     label: 'Pagamentos',      desc: 'Estado financeiro',           icon: '◉' },
  { slug: 'revisoes',       label: 'Revisões',        desc: 'Feedback e aprovações',       icon: '⬡' },
  { slug: 'entregas',       label: 'Entregas',        desc: 'Ficheiros finais',            icon: '◐' },
  { slug: 'atendimento',    label: 'Atendimento',     desc: 'Equipa e contactos',          icon: '◑' },
  { slug: 'satisfacao',     label: 'Satisfação',      desc: 'Avaliação do projeto',        icon: '◒' },
]

const FASE_LABEL: Record<string, { label: string; color: string; dot: string }> = {
  concluido: { label: 'Concluído',  color: 'text-emerald-400/80', dot: 'bg-emerald-400' },
  em_curso:  { label: 'Em Curso',   color: 'text-blue-400/80',    dot: 'bg-blue-400'    },
  pendente:  { label: 'Pendente',   color: 'text-white/25',       dot: 'bg-white/15'    },
}

export default async function PortalMediaPage({ params }: Props) {
  const { ref } = await params
  const projeto = getProjeto(ref)
  if (!projeto) notFound()

  const fasesTotal = projeto.fases.length
  const fasesConcluidas = projeto.fases.filter(f => f.estado === 'concluido').length
  const progresso = Math.round((fasesConcluidas / fasesTotal) * 100)
  const faseAtual = projeto.fases.find(f => f.estado === 'em_curso') ?? projeto.fases.find(f => f.estado === 'pendente')

  return (
    <main className="min-h-screen bg-[#050507] relative overflow-x-hidden">

      {/* Grid bg */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.016) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.016) 1px,transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        background: 'radial-gradient(ellipse 90% 50% at 50% -5%, rgba(180,200,255,0.045) 0%, transparent 70%)',
      }} />

      {/* ── HERO COM IMAGEM ── */}
      {projeto.heroImageUrl && (
        <div className="relative z-10 w-full overflow-hidden shrink-0" style={{ height: '320px' }}>
          <div className="absolute inset-0 bg-cover bg-center scale-105"
            style={{ backgroundImage: `url(${projeto.heroImageUrl})` }} />
          <div className="absolute inset-0 bg-black/55" />
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#050507] to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#050507] via-[#050507]/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050507]/30 via-transparent to-[#050507]/30" />

          {/* Logo do cliente se existir */}
          {projeto.heroLogoUrl && (
            <div className="absolute inset-0 flex items-center justify-center">
              <img src={projeto.heroLogoUrl} alt={projeto.nome}
                className="max-h-16 max-w-[200px] object-contain opacity-80" />
            </div>
          )}

          {/* Badge topo direito */}
          <div className="absolute top-5 right-6 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/70 animate-pulse" />
            <span className="text-[8px] tracking-[0.4em] text-white/30 uppercase">Activo</span>
          </div>

          {/* Label topo esquerdo */}
          <div className="absolute top-5 left-6 flex items-center gap-3">
            <div className="flex flex-col gap-[3px]">
              <div className="h-px w-5 bg-white/30" />
              <div className="h-px w-3 bg-white/15" />
              <div className="h-px w-5 bg-white/30" />
            </div>
            <span className="text-[8px] tracking-[0.45em] text-white/25 uppercase">RL Media · Portal do Cliente</span>
          </div>
        </div>
      )}

      {/* ── HERO ── */}
      <header className="relative z-10 px-6 sm:px-12 pt-8 pb-14 max-w-5xl mx-auto">

        {/* Top bar — só mostra se não há imagem */}
        {!projeto.heroImageUrl && (
          <div className="flex items-center justify-between mb-14">
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-[3px]">
                <div className="h-px w-5 bg-white/35" />
                <div className="h-px w-3 bg-white/15" />
                <div className="h-px w-5 bg-white/35" />
              </div>
              <span className="text-[9px] tracking-[0.5em] text-white/25 uppercase">RL Media · Portal do Cliente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/70 animate-pulse" />
              <span className="text-[8px] tracking-[0.4em] text-white/20 uppercase">Activo</span>
            </div>
          </div>
        )}

        {/* Project name */}
        <div className="flex items-start gap-6 mb-10">
          <div className="mt-2 w-12 h-12 border border-white/10 flex items-center justify-center shrink-0"
            style={{ boxShadow: '0 0 30px rgba(180,200,255,0.07)' }}>
            <span className="text-xl text-white/20 select-none">◈</span>
          </div>
          <div>
            <p className="text-[8px] tracking-[0.6em] text-white/20 uppercase mb-1">{projeto.tipo}</p>
            <h1 className="text-[clamp(2rem,6vw,3.5rem)] font-extralight tracking-[0.4em] text-white/85 uppercase leading-none">
              {projeto.nome}
            </h1>
            <p className="text-[11px] tracking-[0.3em] text-white/30 uppercase mt-2">{projeto.cliente}</p>
          </div>
        </div>

        {/* ── BOAS VINDAS ── */}
        <div className="mb-10 border border-white/[0.07] bg-white/[0.02] px-7 py-7">
          <div className="flex items-start gap-3 mb-5">
            <span className="text-2xl leading-none mt-1">👋</span>
            <div>
              <p className="text-xs tracking-[0.4em] text-white/20 uppercase mb-1">Apresentação</p>
              <h2 className="text-xl font-light text-white/75">Bem-vindo ao Portal do Cliente</h2>
            </div>
          </div>

          <p className="text-sm text-white/45 leading-relaxed mb-6">
            Olá, seja bem-vindo ao <span className="text-white/65">Portal do Cliente</span>.<br/>
            Aqui encontra <span className="text-white/65">tudo o que precisa saber sobre o andamento do seu projeto</span> de forma clara, organizada e transparente.
          </p>

          <div className="grid sm:grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm text-white/40 font-medium mb-3 flex items-center gap-2">
                <span>🔎</span> O que pode acompanhar
              </p>
              <ul className="flex flex-col gap-3">
                {[
                  ['Workflow do Projeto',   'Etapas concluídas, em curso e próximas fases'],
                  ['Cronograma',            'Progresso detalhado de cada fase'],
                  ['Contactos Dedicados',   'A quem falar em cada momento'],
                  ['Documentos & Entregas', 'Ficheiros e registos importantes'],
                ].map(([titulo, desc]) => (
                  <li key={titulo} className="flex items-start gap-2">
                    <span className="text-white/20 mt-1 shrink-0">—</span>
                    <span className="text-sm text-white/40 leading-relaxed">
                      <span className="text-white/60 font-medium">{titulo}</span> — {desc}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm text-white/40 font-medium mb-3 flex items-center gap-2">
                <span>✅</span> Como usar
              </p>
              <ol className="flex flex-col gap-3">
                {[
                  'Navegue pelo menu para explorar cada secção.',
                  'Clique na fase do projeto para ver detalhes, prazos e status.',
                  'Use a área de contactos para falar diretamente com os responsáveis.',
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-sm font-mono text-white/20 shrink-0 mt-0.5">{i + 1}.</span>
                    <span className="text-sm text-white/40 leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="border-t border-white/[0.05] pt-5 flex items-start gap-2">
            <span className="text-sm shrink-0">👉</span>
            <p className="text-sm text-white/35 leading-relaxed">
              Este portal foi criado para <span className="text-white/45">garantir transparência, confiança e proximidade</span> durante todo o processo.
              Obrigado pela confiança na nossa equipa.
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {[
            { label: 'Local',         value: projeto.local },
            { label: 'Filmagem',      value: projeto.dataFilmagem },
            { label: 'Revisões',      value: `${projeto.revisoes.usadas} / ${projeto.revisoes.total}` },
            { label: 'Entrega Final', value: projeto.dataEntrega },
          ].map(stat => (
            <div key={stat.label}
              className="border border-white/[0.07] bg-white/[0.02] px-4 py-3">
              <p className="text-[8px] tracking-[0.4em] text-white/25 uppercase mb-1">{stat.label}</p>
              <p className="text-[11px] tracking-[0.15em] text-white/65 font-light">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[8px] tracking-[0.4em] text-white/25 uppercase">
            Fase Actual — {faseAtual?.nome ?? 'Concluído'}
          </p>
          <p className="text-[8px] tracking-[0.4em] text-white/25 uppercase">{progresso}%</p>
        </div>
        <div className="h-px w-full bg-white/[0.06] relative overflow-hidden">
          <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-white/30 to-white/10 transition-all duration-1000"
            style={{ width: `${progresso}%` }} />
        </div>

        {/* Phase steps */}
        <div className="mt-4 flex items-start gap-0 overflow-x-auto pb-1">
          {projeto.fases.map((fase, i) => {
            const cfg = FASE_LABEL[fase.estado]
            return (
              <div key={fase.id} className="flex items-center shrink-0">
                <div className="flex flex-col items-center gap-1.5 px-3">
                  <div className={`w-2 h-2 rounded-full ${cfg.dot} ${fase.estado === 'em_curso' ? 'animate-pulse' : ''}`} />
                  <span className={`text-[8px] tracking-[0.2em] uppercase whitespace-nowrap ${cfg.color}`}>
                    {fase.nome}
                  </span>
                </div>
                {i < projeto.fases.length - 1 && (
                  <div className="h-px w-6 bg-white/[0.06] shrink-0" />
                )}
              </div>
            )
          })}
        </div>
      </header>

      {/* ── DIVIDER ── */}
      <div className="relative z-10 px-6 sm:px-12 max-w-5xl mx-auto mb-12">
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
          <span className="text-[8px] tracking-[0.5em] text-white/15 uppercase">Menu</span>
          <div className="h-px flex-1 bg-gradient-to-l from-white/10 to-transparent" />
        </div>
      </div>

      {/* ── NAV CARDS ── */}
      <section className="relative z-10 px-6 sm:px-12 pb-20 max-w-5xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {NAV.map((item, i) => (
            <Link key={item.slug} href={`/portal-media/${ref}/${item.slug}`}
              className="group relative border border-white/[0.07] hover:border-white/18
                         bg-white/[0.015] hover:bg-white/[0.035]
                         transition-all duration-400 p-5 flex flex-col gap-3"
            >
              {/* Corner TL */}
              <div className="absolute top-3 left-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-3 h-px bg-white/30" /><div className="w-px h-3 bg-white/30" />
              </div>
              {/* Corner BR */}
              <div className="absolute bottom-3 right-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-end">
                <div className="w-px h-3 bg-white/30" /><div className="w-3 h-px bg-white/30" />
              </div>

              <div className="flex items-start justify-between">
                <span className="text-lg text-white/10 group-hover:text-white/25 transition-colors duration-300 select-none leading-none">
                  {item.icon}
                </span>
                <span className="text-[9px] font-mono text-white/12 group-hover:text-white/25 transition-colors duration-300">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <div>
                <p className="text-[10px] tracking-[0.3em] font-medium text-white/55 group-hover:text-white/80 uppercase transition-colors duration-300 leading-tight">
                  {item.label}
                </p>
                <p className="text-[9px] tracking-[0.1em] text-white/20 mt-1 leading-tight">{item.desc}</p>
              </div>
              <div className="flex items-center gap-1.5 mt-auto">
                <div className="h-px w-0 group-hover:w-4 bg-white/30 transition-all duration-400" />
                <span className="text-[10px] text-white/0 group-hover:text-white/30 transition-colors duration-400">→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-white/[0.04] px-6 sm:px-12 py-5 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <p className="text-[8px] tracking-[0.5em] text-white/10 uppercase">© RL Media · Audiovisual · 2026</p>
          <p className="text-[8px] tracking-[0.3em] text-white/10 uppercase font-mono">REF: {projeto.ref}</p>
        </div>
      </footer>

      {/* Bottom fixed line */}
      <div className="fixed bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.05] to-transparent pointer-events-none z-20" />
    </main>
  )
}
