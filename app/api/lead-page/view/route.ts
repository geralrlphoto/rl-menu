import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Defaults usados quando o admin define data/hora/tipo da reunião mas não
// preencheu o link explícito — o cliente continua a poder entrar/abrir o mapa.
const MEET_LINK = 'https://meet.google.com/dih-etvh-xkh'
const MAPS_LINK = 'https://www.google.com/maps/place/RL+Photo.Video+(Casamentos,Batizados,Eventos)/@38.634382,-8.9147077,212m/data=!3m2!1e3!4b1!4m6!3m5!1s0xd19414ebaa9e467:0x1d9b63c70ffe06a!8m2!3d38.634381!4d-8.914064!16s%2Fg%2F11w219lx62?authuser=0&entry=ttu&g_ep=EgoyMDI2MDQxMi4wIKXMDSoASAFQAw%3D%3D'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const isAdmin = req.cookies.get('rl_auth')?.value === process.env.AUTH_SECRET

  const { data: contact } = await supabase
    .from('crm_contacts')
    .select('*')
    .eq('page_token', token)
    .single()

  // Admins vêem sempre; clientes só vêem páginas publicadas
  if (!contact || (!contact.page_publicada && !isAdmin)) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  // Registar visita
  await supabase.from('crm_contacts').update({
    page_views: (contact.page_views || 0) + 1,
    page_last_viewed: new Date().toISOString(),
  }).eq('id', contact.id)

  // Fallback do link da reunião — se o admin marcou data/hora/tipo mas não
  // preencheu o link, usar o default consoante o tipo (Videochamada → Meet,
  // Presencial → Maps). O cliente vê sempre o botão certo.
  if (!contact.reuniao_link && contact.reuniao_data && contact.reuniao_hora) {
    contact.reuniao_link = contact.reuniao_tipo === 'Videochamada' ? MEET_LINK : MAPS_LINK
  }

  return NextResponse.json({ contact })
}
