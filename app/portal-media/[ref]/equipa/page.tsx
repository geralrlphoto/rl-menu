import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import EquipaClient from '@/app/portal-media/_components/EquipaClient'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ ref: string }> }

export default async function EquipaPage({ params }: Props) {
  const { ref } = await params

  // Página exclusiva para admin
  const cookieStore = await cookies()
  if (cookieStore.get('rl_auth')?.value !== process.env.AUTH_SECRET) redirect(`/portal-media/${ref}`)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: row } = await supabase
    .from('media_portais')
    .select('nome:dados->>nome')
    .eq('ref', ref.toUpperCase())
    .single()

  return (
    <main className="min-h-screen relative">
      <EquipaClient portalRef={ref.toUpperCase()} nome={(row as { nome?: string } | null)?.nome || ref.toUpperCase()} />
    </main>
  )
}
