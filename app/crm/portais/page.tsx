import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const MASTER_TOKEN = '85343645-b0d3-4412-ae78-795fd7f8ddf1'
const BATIZADO_MASTER = 'batizado_batizado-maquete'

type WeddingPortal = {
  page_token: string
  nome: string | null
  data_casamento: string | null
  status: string | null
}

type BatizadoPortal = {
  page_id: string
  settings: { content?: { evento?: { nome?: string } } } | null
}

export const revalidate = 0

export default async function PortaisPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [{ data: weddingRaw }, { data: batizadoRaw }] = await Promise.all([
    supabase
      .from('crm_contacts')
      .select('page_token, nome, data_casamento, status')
      .not('page_token', 'is', null)
      .neq('page_token', MASTER_TOKEN)
      .order('nome', { ascending: true }),
    supabase
      .from('portal_template_settings')
      .select('page_id, settings')
      .like('page_id', 'batizado_%')
      .neq('page_id', BATIZADO_MASTER)
      .order('page_id', { ascending: true }),
  ])

  const weddings: WeddingPortal[] = (weddingRaw ?? []).filter(r => r.page_token)
  const batizados: BatizadoPortal[] = (batizadoRaw ?? [])

  const totalPortais = weddings.length + batizados.length

  return (
    <main className="min-h-screen bg-[#0c0a07] px-6 py-14 md:px-12">
      {/* Header */}
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <p className="text-[10px] tracking-[0.5em] uppercase text-white/20 mb-2">CRM · Portais</p>
            <h1 className="text-3xl font-extralight text-white tracking-[0.06em]">Portais Activos</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-white/20 text-[10px] tracking-[0.4em] uppercase">Total</p>
              <p className="text-3xl font-extralight text-gold">{totalPortais}</p>
            </div>
            <Link
              href="/crm"
              className="px-5 py-3 border border-white/10 hover:border-gold/40 rounded-xl text-sm text-white/40 hover:text-gold tracking-[0.15em] uppercase transition-all"
            >
              ← CRM
            </Link>
          </div>
        </div>

        {/* Casamentos */}
        <section className="mb-14">
          <div className="flex items-center gap-4 mb-6">
            <span className="text-[10px] tracking-[0.5em] uppercase text-gold/50">Casamentos</span>
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-xs text-white/20">{weddings.length}</span>
          </div>

          {weddings.length === 0 ? (
            <p className="text-white/20 text-sm tracking-wider">Nenhum portal de casamento encontrado.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {weddings.map(p => (
                <a
                  key={p.page_token}
                  href={`/r/${p.page_token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-white/[0.02] border border-white/8 hover:border-gold/30 rounded-2xl px-5 py-5 transition-all hover:bg-white/[0.04]"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-[9px] tracking-[0.4em] uppercase text-gold/40 border border-gold/20 rounded-full px-2 py-0.5">
                      Casamento
                    </span>
                    <svg className="w-3.5 h-3.5 text-white/20 group-hover:text-gold/60 transition-colors mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                    </svg>
                  </div>
                  <p className="text-white font-light text-base tracking-wide mb-1">
                    {p.nome || <span className="text-white/30 italic text-sm">Sem nome</span>}
                  </p>
                  {p.data_casamento && (
                    <p className="text-white/30 text-xs tracking-wider">
                      {new Date(p.data_casamento + 'T00:00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  )}
                  {p.status && (
                    <p className="text-white/20 text-[10px] tracking-[0.3em] uppercase mt-2">{p.status}</p>
                  )}
                </a>
              ))}
            </div>
          )}
        </section>

        {/* Batizados */}
        <section>
          <div className="flex items-center gap-4 mb-6">
            <span className="text-[10px] tracking-[0.5em] uppercase text-gold/50">Batizados</span>
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-xs text-white/20">{batizados.length}</span>
          </div>

          {batizados.length === 0 ? (
            <p className="text-white/20 text-sm tracking-wider">Nenhum portal de batizado encontrado.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {batizados.map(p => {
                const token = p.page_id.replace('batizado_', '')
                const clientName = p.settings?.content?.evento?.nome || null
                return (
                  <a
                    key={p.page_id}
                    href={`/b/${token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group bg-white/[0.02] border border-white/8 hover:border-gold/30 rounded-2xl px-5 py-5 transition-all hover:bg-white/[0.04]"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-[9px] tracking-[0.4em] uppercase text-blue-400/50 border border-blue-400/20 rounded-full px-2 py-0.5">
                        Batizado
                      </span>
                      <svg className="w-3.5 h-3.5 text-white/20 group-hover:text-gold/60 transition-colors mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                      </svg>
                    </div>
                    <p className="text-white font-light text-base tracking-wide mb-1">
                      {clientName || <span className="text-white/30 italic text-sm">Sem nome</span>}
                    </p>
                    <p className="text-white/20 text-[10px] tracking-[0.25em] font-mono mt-1">{token}</p>
                  </a>
                )
              })}
            </div>
          )}
        </section>

      </div>
    </main>
  )
}
