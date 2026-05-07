import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'
import { getProjeto } from '@/app/portal-media/_data/mockProject'

export const runtime = 'edge'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: { ref: string } }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: row } = await supabase
    .from('media_portais')
    .select('dados')
    .eq('ref', (params.ref ?? '').toUpperCase())
    .single()

  const mock = getProjeto(params.ref)
  const dados = row?.dados ? { ...(mock ?? {}), ...row.dados } : mock
  const nomeProjeto = ((dados as any)?.nome ?? params.ref ?? 'Portal').toUpperCase()
  const cliente = ((dados as any)?.cliente ?? '').toUpperCase()

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: '#04080f',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Grid neon background */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(30,80,220,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(30,80,220,0.10) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
        {/* Top neon glow */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
          background: 'linear-gradient(90deg, #04080f, #2563eb, #04080f)',
        }} />
        {/* Bottom neon glow */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(37,99,235,0.5), transparent)',
        }} />

        {/* Logo circle */}
        <div style={{
          width: '100px', height: '100px',
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.22)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '32px',
          background: 'rgba(255,255,255,0.04)',
          boxShadow: '0 0 40px rgba(255,255,255,0.08)',
        }}>
          <img
            src="https://rl-menu-lake.vercel.app/logo-rl-prod-branco.png"
            width={65}
            style={{ opacity: 0.9 }}
          />
        </div>

        {/* Badge */}
        <div style={{
          border: '1px solid rgba(96,165,250,0.4)',
          background: 'rgba(96,165,250,0.08)',
          padding: '8px 28px',
          marginBottom: '28px',
          display: 'flex',
        }}>
          <span style={{ fontSize: '11px', letterSpacing: '8px', color: 'rgba(147,197,253,0.9)', textTransform: 'uppercase' }}>
            Portal do Cliente
          </span>
        </div>

        {/* Project name */}
        <div style={{ fontSize: '9px', letterSpacing: '6px', color: 'rgba(255,255,255,0.20)', textTransform: 'uppercase', marginBottom: '10px', display: 'flex' }}>
          Projecto
        </div>
        <div style={{ fontSize: '48px', fontWeight: 200, letterSpacing: '8px', color: 'rgba(255,255,255,0.88)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex' }}>
          {nomeProjeto}
        </div>
        {cliente && (
          <div style={{ fontSize: '14px', letterSpacing: '4px', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', display: 'flex' }}>
            {cliente}
          </div>
        )}

        {/* Footer */}
        <div style={{
          position: 'absolute', bottom: '24px',
          fontSize: '10px', letterSpacing: '5px',
          color: 'rgba(255,255,255,0.12)', textTransform: 'uppercase',
          display: 'flex',
        }}>
          RL PROD · Photography &amp; Video · www.rlprod.pt
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
