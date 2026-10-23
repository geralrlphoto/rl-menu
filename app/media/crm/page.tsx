import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { Poppins } from 'next/font/google'
import NovoPortalRMButton from './NovoPortalRMButton'
import { lerData, hojeLisboa } from '@/app/media/_lib/eventos'

export const dynamic = 'force-dynamic'

const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600'] })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ACCENT = '#1fd8c8'
const AMARELO = '#f3e9a6'

// Funil pela ordem do CRM (ESTADOS em leads/LeadsClient.tsx)
const FUNIL = [
  { estado: 'Novo',          cor: '#1fd8c8' },
  { estado: 'Em Contacto',   cor: '#5fd3e8' },
  { estado: 'Qualificado',   cor: '#7aa7ff' },
  { estado: 'Proposta Env.', cor: '#e6c06b' },
  { estado: 'Convertido',    cor: '#8be38f' },
  { estado: 'Perdido',       cor: '#ff7a8a' },
]

const corEstado = (e: string) => FUNIL.find(f => f.estado === e)?.cor ?? '#9aa4ad'

// Ferramentas agrupadas como chips (inspirado nos grupos do plumeform)
const GRUPOS: { titulo: string; itens: { label: string; href?: string; novoPortal?: boolean; icon: string }[] }[] = [
  { titulo: 'Captação', itens: [
    { label: 'Formulário Lead',      href: '/media/crm/nova-lead',  icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.4-9.4a2 2 0 112.8 2.8L11.8 15H9v-2.8l8.6-8.6z' },
    { label: 'Agente Prospeção IA',  href: '/media/crm/prospeccao', icon: 'M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16zM11 8v6M8 11h6' },
  ] },
  { titulo: 'Reunião', itens: [
    { label: 'Maquete Reunião',      href: '/rm/rm-master-rlprod',  icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.6a1 1 0 01.7.3l5.4 5.4a1 1 0 01.3.7V19a2 2 0 01-2 2z' },
    { label: 'Novo Portal Reunião',  novoPortal: true,              icon: 'M12 4v16m8-8H4' },
  ] },
  { titulo: 'Portais', itens: [
    { label: 'Maquete Portais',      href: '/portal-media/MAQUETE', icon: 'M3 5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2zM3 9h18M9 21V9' },
  ] },
]

const CHIP = 'group inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.04] backdrop-blur px-4 py-2 text-[13px] text-white/80 hover:text-white hover:border-[#1fd8c8]/70 hover:bg-[#1fd8c8]/[0.08] transition-colors'

const Icone = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    className="w-4 h-4 text-[#1fd8c8]/80 group-hover:text-[#1fd8c8]"><path d={d} /></svg>
)

const quando = (iso: string) => {
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (dias <= 0) return 'hoje'
  if (dias === 1) return 'ontem'
  if (dias < 30) return `há ${dias} dias`
  return new Date(iso).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })
}

export default async function CrmPage() {
  const [{ data: section }, { data: leads }] = await Promise.all([
    supabase.from('media_sections').select('id').eq('name', 'CRM').single(),
    supabase.from('media_leads').select('id, nome, empresa, estado, created_at, reuniao_data').order('created_at', { ascending: false }),
  ])
  const { data: pages } = section
    ? await supabase.from('media_pages').select('id, title, notion_url').eq('section_id', section.id).order('order_index')
    : { data: [] }

  const todas = (leads ?? []) as { id: string; nome: string | null; empresa: string | null; estado: string; created_at: string; reuniao_data: string | null }[]
  const contagem = FUNIL.map(f => ({ ...f, n: todas.filter(l => l.estado === f.estado).length }))
  const maximo = Math.max(1, ...contagem.map(c => c.n))
  const recentes = todas.slice(0, 5)
  const convertidas = contagem.find(c => c.estado === 'Convertido')?.n ?? 0
  const taxa = todas.length ? Math.round((convertidas / todas.length) * 100) : 0

  // Próxima reunião marcada (de hoje para a frente)
  const hoje = hojeLisboa()
  const proxima = todas
    .map(l => ({ l, d: lerData(l.reuniao_data) }))
    .filter(x => x.d && x.d >= hoje)
    .sort((a, b) => a.d!.getTime() - b.d!.getTime())[0]

  return (
    <main className={`${poppins.className} min-h-screen text-white relative overflow-hidden bg-[#061010]`}>

      {/* ── Fundo: cortinas verticais verde-escuras (à plumeform) ──────── */}
      <div className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `
            repeating-linear-gradient(90deg,
              rgba(255,255,255,0.00) 0px, rgba(255,255,255,0.035) 18px, rgba(0,0,0,0.25) 40px,
              rgba(255,255,255,0.02) 62px, rgba(255,255,255,0.00) 86px),
            radial-gradient(ellipse 60% 70% at 15% 30%, rgba(31,216,200,0.20) 0%, transparent 70%),
            radial-gradient(ellipse 50% 60% at 85% 10%, rgba(31,216,200,0.12) 0%, transparent 70%),
            linear-gradient(180deg, #071716 0%, #061010 60%, #050909 100%)`,
        }} />
      <div className="pointer-events-none fixed inset-0 z-0"
        style={{ background: 'linear-gradient(180deg, transparent 55%, rgba(5,9,9,0.92) 100%)' }} />

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative z-10 px-4 pt-10 sm:pt-14 text-center">
        <Link href="/media" className="text-[12px] text-white/45 hover:text-white transition-colors">‹ Menu RL Prod</Link>

        <div className="mt-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.14] bg-white/[0.04] px-3.5 py-1 text-[10px] tracking-[0.18em] uppercase text-white/75">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: ACCENT }} /> CRM
          </span>
        </div>

        <h1 className="mt-5 text-[40px] sm:text-[60px] lg:text-[68px] font-semibold leading-[1.03] tracking-[-0.035em]">
          Cada lead,
          <br />
          <span style={{ color: ACCENT }}>até ao contrato.</span>
        </h1>
        <p className="mt-5 max-w-xl mx-auto text-[14px] sm:text-[15px] leading-relaxed text-white/60">
          Os contactos que chegam, as reuniões marcadas e as propostas enviadas, num só funil.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/media/crm/leads"
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[13.5px] font-medium text-[#061010] hover:bg-white/90 transition-colors">
            Ver as leads <span aria-hidden>→</span>
          </Link>
          <Link href="/media/crm/nova-lead"
            className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3 text-[13.5px] font-medium text-white/85 hover:border-white/50 hover:text-white transition-colors">
            Nova lead
          </Link>
        </div>
      </section>

      {/* ── Painel do funil, com contorno em degradé verde-água → amarelo ── */}
      <section className="relative z-10 px-4 mt-12">
        <div className="max-w-5xl mx-auto rounded-[22px] p-[1.5px]"
          style={{ background: `linear-gradient(120deg, ${ACCENT} 0%, ${ACCENT}66 35%, ${AMARELO}55 70%, ${AMARELO} 100%)`, boxShadow: `0 30px 80px -30px ${ACCENT}55` }}>
          <div className="rounded-[21px] bg-[#0b1615]/95 backdrop-blur-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 sm:px-7 py-3 border-b border-white/[0.06] text-[11px] text-white/45">
              <span>O teu funil</span>
              <span>{todas.length} leads · {taxa}% convertidas</span>
            </div>

            <div className="grid lg:grid-cols-[1.35fr_1fr]">
              {/* Barras por estado */}
              <div className="p-5 sm:p-7">
                <p className="text-[10px] tracking-[0.2em] uppercase text-white/40">Por estado</p>
                <div className="mt-5 grid grid-cols-6 gap-2 sm:gap-3 items-end h-[270px]">
                  {contagem.map(c => (
                    <Link key={c.estado} href="/media/crm/leads" className="group flex flex-col items-center justify-end h-full gap-2">
                      <span className="text-[15px] font-semibold" style={{ color: c.cor }}>{c.n}</span>
                      <span className="w-full rounded-t-lg transition-opacity group-hover:opacity-100 opacity-80"
                        style={{ height: `${Math.max(6, (c.n / maximo) * 210)}px`, background: `linear-gradient(180deg, ${c.cor}, ${c.cor}22)` }} />
                    </Link>
                  ))}
                </div>
                <div className="mt-2 grid grid-cols-6 gap-2 sm:gap-3">
                  {contagem.map(c => (
                    <span key={c.estado} className="text-center text-[10px] sm:text-[11px] leading-tight text-white/55">{c.estado}</span>
                  ))}
                </div>
              </div>

              {/* Últimas leads */}
              <div className="p-5 sm:p-7 border-t lg:border-t-0 lg:border-l border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] tracking-[0.2em] uppercase text-white/40">Últimas a chegar</p>
                  <Link href="/media/crm/leads" className="text-[11px] text-[#1fd8c8] hover:underline">Ver todas</Link>
                </div>
                <ul className="mt-4 space-y-2">
                  {recentes.length === 0 && <li className="text-[13px] text-white/40">Ainda não há leads.</li>}
                  {recentes.map(l => (
                    <li key={l.id}>
                      <Link href="/media/crm/leads"
                        className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] hover:bg-white/[0.05] px-3 py-2.5 transition-colors">
                        <span className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-[12px] font-semibold"
                          style={{ background: `${corEstado(l.estado)}22`, color: corEstado(l.estado) }}>
                          {(l.empresa || l.nome || '?').trim().charAt(0).toUpperCase()}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block truncate text-[13px] text-white/90">{l.empresa || l.nome || 'Sem nome'}</span>
                          <span className="block text-[11px] text-white/40">{quando(l.created_at)}</span>
                        </span>
                        <span className="shrink-0 rounded-full px-2.5 py-0.5 text-[10.5px]"
                          style={{ background: `${corEstado(l.estado)}1f`, color: corEstado(l.estado) }}>
                          {l.estado}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Ferramentas em chips agrupados + cartão empilhado ──────────── */}
      <section className="relative z-10 px-4 mt-16">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-[1.2fr_1fr] gap-10 items-start">
          <div>
            <h2 className="text-[26px] sm:text-[30px] font-semibold tracking-[-0.02em] leading-tight">Ferramentas</h2>
            <p className="mt-2 text-[14px] text-white/55 max-w-md">Do primeiro contacto à reunião e ao portal do cliente.</p>

            <div className="mt-7 space-y-6">
              {GRUPOS.map(g => (
                <div key={g.titulo}>
                  <p className="text-[10px] tracking-[0.2em] uppercase text-white/40 mb-2.5">{g.titulo}</p>
                  <div className="flex flex-wrap gap-2">
                    {g.itens.map(it => it.novoPortal ? (
                      <NovoPortalRMButton key={it.label} className={CHIP}>
                        <Icone d={it.icon} /> {it.label}
                      </NovoPortalRMButton>
                    ) : (
                      <Link key={it.label} href={it.href!} className={CHIP}>
                        <Icone d={it.icon} /> {it.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cartão empilhado: próxima reunião */}
          <div className="relative mt-2 lg:mt-10">
            <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-[20px] border border-white/[0.06] bg-white/[0.02]" />
            <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-[20px] border border-white/[0.08] bg-white/[0.03]" />
            <div className="relative rounded-[20px] border border-white/[0.12] bg-[#0e1c1b]/90 backdrop-blur-xl p-6">
              <div className="flex items-center justify-between text-[10px] tracking-[0.2em] uppercase">
                <span style={{ color: ACCENT }}>Próxima reunião</span>
                <span className="text-white/35">Agenda</span>
              </div>
              {proxima ? (
                <>
                  <p className="mt-4 text-[22px] font-semibold leading-snug">{proxima.l.empresa || proxima.l.nome}</p>
                  <p className="mt-1 text-[13px] text-white/55">
                    {proxima.d!.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-4 text-[22px] font-semibold leading-snug">Nada marcado</p>
                  <p className="mt-1 text-[13px] text-white/55">Quando uma lead marcar reunião, aparece aqui.</p>
                </>
              )}
              <div className="mt-5 space-y-2">
                {[
                  { k: 'Leads novas', v: contagem[0].n },
                  { k: 'Propostas enviadas', v: contagem[3].n },
                  { k: 'Convertidas', v: convertidas },
                ].map(r => (
                  <div key={r.k} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5">
                    <span className="text-[13px] text-white/75">{r.k}</span>
                    <span className="text-[13px] font-semibold" style={{ color: ACCENT }}>{r.v}</span>
                  </div>
                ))}
              </div>
              <Link href="/media/calendario" className="mt-4 inline-block text-[11.5px] text-white/45 hover:text-white">Ver o calendário →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Páginas do CRM (Notion) ────────────────────────────────────── */}
      {pages && pages.length > 0 && (
        <section className="relative z-10 px-4 mt-16">
          <div className="max-w-5xl mx-auto">
            <p className="text-[10px] tracking-[0.2em] uppercase text-white/40 mb-3">Páginas</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(pages as any[]).map(p => (
                <a key={p.id} href={p.notion_url ?? '#'} target="_blank" rel="noopener noreferrer"
                  className="group flex items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.03] hover:border-[#1fd8c8]/60 px-5 py-4 transition-colors">
                  <span className="text-[14px] text-white/85">{p.title}</span>
                  <span className="text-white/35 group-hover:text-[#1fd8c8]">↗</span>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="h-20" />
    </main>
  )
}
