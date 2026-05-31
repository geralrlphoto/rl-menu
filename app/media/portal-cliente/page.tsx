import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { getProjeto, type Projeto } from '@/app/portal-media/_data/mockProject'
import PortalSenhaInput from './PortalSenhaInput'
import NovoPortalMediaButton from './NovoPortalMediaButton'

export const dynamic = 'force-dynamic'

// ─── helpers ──────────────────────────────────────────────────────────────────
function getFaseAtual(projeto: Projeto): string {
  const emCurso = projeto.fases?.find(f => f.estado === 'em_curso')
  if (emCurso) return emCurso.nome
  const concluidas = projeto.fases?.filter(f => f.estado === 'concluido') || []
  if (concluidas.length > 0) return concluidas[concluidas.length - 1].nome
  return '—'
}

function getStatusColor(status: string) {
  const s = status?.toLowerCase() || ''
  if (s.includes('produção') || s.includes('producao')) return { dot: 'bg-blue-400', text: 'text-blue-400/70' }
  if (s.includes('concluí') || s.includes('conclu')) return { dot: 'bg-emerald-400', text: 'text-emerald-400/70' }
  if (s.includes('pausa')) return { dot: 'bg-amber-400', text: 'text-amber-400/70' }
  return { dot: 'bg-white/30', text: 'text-white/30' }
}

// ─── página ───────────────────────────────────────────────────────────────────
export default async function PortalClientePage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Buscar todos os portais do Supabase
  const { data: rows } = await supabase
    .from('media_portais')
    .select('ref, dados')
    .order('updated_at', { ascending: false })

  // 2. Montar lista: Supabase primeiro, depois mocks que não existam já
  const supabaseRefs = new Set((rows || []).map((r: any) => r.ref.toUpperCase()))

  // Mapa ref → senha e portalEnviadoEm (raw from Supabase, not merged)
  const senhaMap: Record<string, string | undefined> = {}
  const enviadoEmMap: Record<string, string | undefined> = {}
  ;(rows || []).forEach((r: any) => {
    senhaMap[r.ref.toUpperCase()] = r.dados?.senha as string | undefined
    enviadoEmMap[r.ref.toUpperCase()] = r.dados?.portalEnviadoEm as string | undefined
  })

  const mockProjetos: Projeto[] = []
  const oleobio = getProjeto('OLEOBIO')
  if (oleobio && !supabaseRefs.has('OLEOBIO')) mockProjetos.push(oleobio)

  const supabaseProjetos: Projeto[] = (rows || [])
    .map((r: any) => {
      const mock = getProjeto(r.ref)
      return mock ? { ...mock, ...r.dados } : (r.dados as Projeto)
    })
    .filter(Boolean)

  const todos: Projeto[] = [...supabaseProjetos, ...mockProjetos]

  return (
    <main className="min-h-screen bg-[#02060f] relative">

      {/* ── Mesh gradient (mesmo de /media/crm/nova-lead) ── */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        background: 'linear-gradient(180deg, #06122a 0%, #030814 55%, #02060f 100%)',
      }} />
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        background: 'radial-gradient(ellipse 95% 65% at 50% 0%, rgba(37,99,235,0.32) 0%, rgba(37,99,235,0.08) 35%, transparent 60%)',
      }} />
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        background: 'radial-gradient(ellipse 55% 70% at 0% 40%, rgba(56,189,248,0.14) 0%, transparent 55%)',
      }} />
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        background: 'radial-gradient(ellipse 60% 50% at 100% 100%, rgba(59,130,246,0.16) 0%, transparent 60%)',
      }} />
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 50%, rgba(0,0,0,0.45) 100%)',
      }} />

      <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-10 py-10">

        {/* Back */}
        <Link href="/media"
          className="inline-flex items-center gap-2 text-[9px] tracking-[0.4em] text-white/25 hover:text-white/55 transition-colors uppercase mb-12 group">
          <span className="group-hover:-translate-x-1 transition-transform duration-200">‹</span>
          Menu RL PROD
        </Link>

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[8px] tracking-[0.6em] text-white/20 uppercase mb-2">RL PROD · Photography & Video</p>
              <h1 className="text-3xl font-extralight tracking-[0.3em] text-white/80 uppercase">Portal Cliente</h1>
            </div>
            {/* Botão Acesso ao Portal */}
            <Link href="/media/portal-cliente/acesso"
              className="group flex items-center gap-3 border border-white/15 bg-white/[0.04] hover:bg-white/[0.09] hover:border-white/30 px-5 py-3 transition-all duration-300">
              <svg className="w-3.5 h-3.5 text-white/40 group-hover:text-white/80 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span className="text-[9px] tracking-[0.4em] text-white/50 group-hover:text-white/85 uppercase transition-colors whitespace-nowrap">Acesso ao Portal</span>
              <span className="text-white/25 group-hover:text-white/60 group-hover:translate-x-0.5 transition-all duration-200">→</span>
            </Link>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-px w-12 bg-white/25" />
            <div className="h-px flex-1 bg-white/[0.04]" />
            <span className="text-[8px] font-mono text-white/15">{String(todos.length).padStart(2, '0')} PORTAIS</span>
          </div>
        </div>

        {/* Cards */}
        <div className="flex flex-col gap-3 mb-10">
          {todos.map((portal) => {
            const fase = getFaseAtual(portal)
            const { dot, text } = getStatusColor(portal.status)
            const href = `/portal-media/${portal.ref}`
            return (
              <div key={portal.ref}
                className="group border border-white/[0.08] hover:border-white/[0.18] bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-400 p-6 relative overflow-hidden">

                {/* Corner TL */}
                <div className="absolute top-4 left-4 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-3 h-px bg-white/30" /><div className="w-px h-3 bg-white/30" />
                </div>
                {/* Corner BR */}
                <div className="absolute bottom-4 right-4 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-end">
                  <div className="w-px h-3 bg-white/30" /><div className="w-3 h-px bg-white/30" />
                </div>

                {/* ACTIVO badge — aparece quando o portal foi enviado ao cliente */}
                {enviadoEmMap[portal.ref?.toUpperCase()] && (
                  <div className="absolute top-0 right-0 flex items-center gap-2 border-l border-b border-emerald-400/30 bg-emerald-400/[0.07] px-4 py-2"
                    style={{ boxShadow: '0 0 18px rgba(52,211,153,0.12), inset 0 0 12px rgba(52,211,153,0.04)' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <span className="text-[8px] tracking-[0.6em] text-emerald-400/85 uppercase font-semibold">Activo</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                  {/* Info */}
                  <div className="flex items-start gap-5">
                    <div className="w-11 h-11 border border-white/10 flex items-center justify-center shrink-0 mt-0.5"
                      style={{ boxShadow: '0 0 20px rgba(180,200,255,0.06)' }}>
                      <span className="text-base text-white/20 select-none">◎</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-[13px] tracking-[0.3em] font-medium text-white/75 uppercase">
                          {portal.nome || portal.ref}
                        </h2>
                        <span className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${dot} animate-pulse`} />
                          <span className={`text-[8px] tracking-[0.35em] ${text} uppercase`}>{portal.status}</span>
                        </span>
                      </div>
                      <p className="text-[10px] tracking-[0.15em] text-white/30">{portal.cliente}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-[8px] tracking-[0.25em] text-white/20 uppercase">{portal.tipo}</span>
                        <span className="text-white/10">·</span>
                        <span className="text-[8px] tracking-[0.25em] text-white/20 uppercase">Fase: {fase}</span>
                        {portal.dataEntrega && <>
                          <span className="text-white/10">·</span>
                          <span className="text-[8px] tracking-[0.25em] text-white/20 uppercase">Entrega: {portal.dataEntrega}</span>
                        </>}
                      </div>
                    </div>
                  </div>

                  {/* CTAs */}
                  <div className="shrink-0 flex items-center gap-2">
                    <Link href={`${href}/card`} target="_blank"
                      className="flex items-center gap-2 border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/20 px-4 py-3 transition-all duration-300 group/card">
                      <svg className="w-3 h-3 text-white/25 group-hover/card:text-white/55 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>
                      </svg>
                      <span className="text-[9px] tracking-[0.4em] text-white/30 group-hover/card:text-white/60 uppercase transition-colors whitespace-nowrap">Card</span>
                    </Link>
                    <Link href={href} target="_blank"
                      className="flex items-center gap-3 border border-white/15 bg-white/[0.04] hover:bg-white/[0.09] hover:border-white/30 px-5 py-3 transition-all duration-300 group/btn">
                      <span className="text-[9px] tracking-[0.4em] text-white/50 group-hover/btn:text-white/80 uppercase transition-colors whitespace-nowrap">Abrir Portal</span>
                      <span className="text-white/25 group-hover/btn:text-white/60 group-hover/btn:translate-x-0.5 transition-all duration-200">→</span>
                    </Link>
                  </div>
                </div>

                {/* Senha do portal */}
                <div className="mt-4 pt-4 border-t border-white/[0.04] flex items-center gap-3">
                  <span className="text-[8px] tracking-[0.4em] text-white/15 uppercase shrink-0">Senha</span>
                  <div className="h-px flex-1 bg-white/[0.03]" />
                  <PortalSenhaInput
                    portalRef={portal.ref}
                    senhaInicial={senhaMap[portal.ref?.toUpperCase()] ?? (portal as any).senha}
                    portalEnviadoEm={enviadoEmMap[portal.ref?.toUpperCase()] ?? (portal as any).portalEnviadoEm}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Novo portal */}
        <div className="border border-dashed border-white/[0.06] px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] tracking-[0.3em] text-white/20 uppercase">Novo Portal</p>
            <p className="text-[9px] text-white/[0.12] mt-1">Criar manualmente ou via CRM</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/media/crm/leads"
              className="text-[9px] tracking-[0.3em] text-white/20 hover:text-white/45 uppercase transition-colors">
              CRM →
            </Link>
            <NovoPortalMediaButton />
          </div>
        </div>

      </div>
    </main>
  )
}

