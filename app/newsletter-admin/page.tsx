import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { LogoutButton } from '../components/LogoutButton'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const dynamic = 'force-dynamic'

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  draft:    { label: 'DRAFT',     color: '#f0b429', bg: 'rgba(240,180,41,0.1)' },
  approved: { label: 'APROVADA',  color: '#3ca374', bg: 'rgba(60,163,116,0.1)' },
  sent:     { label: 'ENVIADA',   color: '#8a7450', bg: 'rgba(138,116,80,0.1)' },
  skipped:  { label: 'ESQUECIDA', color: '#666',    bg: 'rgba(100,100,100,0.1)' },
}

const CAT_STYLE: Record<string, string> = {
  dicas: '#c9a96e', tendencias: '#e08a4c', bastidores: '#8ab0d1',
  checklists: '#a4c97c', inspiracao: '#d18abd', historias: '#c97c7c',
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  const dt = new Date(d + 'T00:00:00')
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  return `${String(dt.getDate()).padStart(2,'0')} ${meses[dt.getMonth()]} ${dt.getFullYear()}`
}

function daysUntil(d: string) {
  const today = new Date(); today.setHours(0,0,0,0)
  const target = new Date(d + 'T00:00:00')
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

export default async function NewsletterAdmin() {
  const [
    { data: newsletters },
    { count: activeCount },
    { count: pendingCount },
  ] = await Promise.all([
    supabase.from('newsletters').select('*').order('scheduled_for', { ascending: true }),
    supabase.from('newsletter_subscribers').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('newsletter_subscribers').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  const drafts   = (newsletters ?? []).filter(n => n.status === 'draft')
  const approved = (newsletters ?? []).filter(n => n.status === 'approved')
  const sent     = (newsletters ?? []).filter(n => n.status === 'sent').reverse()

  // proxima a ir
  const today = new Date().toISOString().split('T')[0]
  const proxima = drafts.find(d => d.scheduled_for && d.scheduled_for >= today) || drafts[0]

  return (
    <div style={{ minHeight: '100vh', background: '#0e0b06', color: '#fff', fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div style={{ padding: '24px 40px', borderBottom: '1px solid #2a2217', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Link href="/" style={{ color: '#8a7450', fontSize: 11, textDecoration: 'none', letterSpacing: 2 }}>← VOLTAR AO MENU</Link>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 32, fontWeight: 400, marginTop: 8 }}>
            Newsletter <em style={{ color: '#c9a96e' }}>Admin</em>
          </h1>
          <p style={{ color: '#8a7450', fontSize: 12, marginTop: 4, letterSpacing: 1 }}>
            Calendario editorial · Envio quinzenal
          </p>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Link href="/newsletter-admin/subscritores" style={{
            padding: '14px 20px', background: 'transparent', color: '#c9a96e',
            border: '1px solid #7a6340', fontSize: 11, letterSpacing: 2,
            textTransform: 'uppercase', textDecoration: 'none', textAlign: 'center',
          }}>
            <div style={{ fontSize: 24, fontFamily: 'Georgia, serif', marginBottom: 2 }}>
              {activeCount || 0}
            </div>
            <div style={{ fontSize: 10, letterSpacing: 2 }}>SUBSCRITORES →</div>
          </Link>
          <LogoutButton />
        </div>
      </div>

      {/* Proxima newsletter destaque */}
      {proxima && (
        <div style={{ padding: '32px 40px', borderBottom: '1px solid #2a2217', background: 'linear-gradient(135deg, rgba(201,169,110,0.08), transparent)' }}>
          <div style={{ fontSize: 10, color: '#c9a96e', letterSpacing: 3, marginBottom: 8 }}>PROXIMA A IR</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 24, fontWeight: 400, marginBottom: 6 }}>
                {proxima.title}
              </h2>
              <div style={{ fontSize: 12, color: '#b3a082' }}>
                {fmtDate(proxima.scheduled_for)}
                {proxima.scheduled_for && (() => {
                  const d = daysUntil(proxima.scheduled_for)
                  return <span style={{ marginLeft: 12, color: d < 7 ? '#f0b429' : '#6a5a3e' }}>
                    {d < 0 ? `Em atraso ${Math.abs(d)}d` : d === 0 ? 'Hoje' : `Em ${d} dias`}
                  </span>
                })()}
              </div>
            </div>
            <Link href={`/newsletter-admin/${proxima.id}`} style={{
              padding: '14px 32px', background: '#c9a96e', color: '#0e0b06', textDecoration: 'none',
              fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase',
            }}>Rever e Aprovar →</Link>
          </div>
        </div>
      )}

      {/* Lista */}
      <div style={{ padding: '32px 40px' }}>
        <SectionTitle title="DRAFTS" count={drafts.length} />
        <Grid items={drafts} />

        {approved.length > 0 && (<>
          <SectionTitle title="APROVADAS (agendadas)" count={approved.length} />
          <Grid items={approved} />
        </>)}

        {sent.length > 0 && (<>
          <SectionTitle title="HISTORICO DE ENVIOS" count={sent.length} />
          <Grid items={sent} />
        </>)}
      </div>
    </div>
  )
}

function SectionTitle({ title, count }: { title: string; count: number }) {
  return (
    <div style={{ margin: '40px 0 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 11, color: '#8a7450', letterSpacing: 3 }}>{title}</span>
      <span style={{ flex: 1, height: 1, background: '#2a2217' }} />
      <span style={{ fontSize: 11, color: '#6a5a3e' }}>{count}</span>
    </div>
  )
}

function Grid({ items }: { items: any[] }) {
  if (items.length === 0) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#4a3f28', fontSize: 13 }}>—</div>
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
      {items.map(n => <Card key={n.id} n={n} />)}
    </div>
  )
}

function Card({ n }: { n: any }) {
  const st = STATUS_STYLE[n.status] || STATUS_STYLE.draft
  const isOutline = !n.intro || n.sections?.length === 0
  return (
    <Link href={`/newsletter-admin/${n.id}`} style={{
      display: 'block', padding: 20, background: '#110e08', border: '1px solid #2a2217',
      textDecoration: 'none', color: '#fff', transition: 'all 0.2s', position: 'relative',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{
          fontSize: 9, letterSpacing: 2, padding: '4px 10px', borderRadius: 2,
          background: st.bg, color: st.color, fontWeight: 600,
        }}>{st.label}</span>
        {n.category && (
          <span style={{ fontSize: 10, color: CAT_STYLE[n.category] || '#8a7450', letterSpacing: 1.5, textTransform: 'uppercase' }}>
            {n.category}
          </span>
        )}
      </div>
      <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 17, fontWeight: 400, lineHeight: 1.3, marginBottom: 8, color: '#fff' }}>
        {n.title}
      </h3>
      <div style={{ fontSize: 11, color: '#8a7450' }}>
        {n.status === 'sent' ? (
          <>
            <div>{fmtDate(n.sent_at?.split('T')[0] || n.scheduled_for)} &middot; {n.sent_to_count || 0} destinatários</div>
            {(n.unique_opens || n.total_clicks || n.ig_clicks) ? (
              <div style={{ marginTop: 8, display: 'flex', gap: 14, fontSize: 11, color: '#b3a082' }}>
                <span>👁 {n.unique_opens || 0}</span>
                <span>🖱 {n.total_clicks || 0}</span>
                <span>📸 {n.ig_clicks || 0}</span>
                <span>↗ {n.share_clicks || 0}</span>
              </div>
            ) : null}
          </>
        ) : (
          fmtDate(n.scheduled_for)
        )}
      </div>
      {isOutline && n.status === 'draft' && (
        <div style={{ marginTop: 10, fontSize: 10, color: '#f0b429', letterSpacing: 1 }}>
          ⚠ Conteudo por completar
        </div>
      )}
    </Link>
  )
}
