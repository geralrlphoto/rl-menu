import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Contar tudo
    const { count: total } = await supabase
      .from('crm_contacts')
      .select('*', { count: 'exact', head: true })

    // Contar com email
    const { count: comEmail } = await supabase
      .from('crm_contacts')
      .select('*', { count: 'exact', head: true })
      .not('email', 'is', null)
      .neq('email', '')

    // Ver alguns exemplos
    const { data: sample } = await supabase
      .from('crm_contacts')
      .select('nome, email, status')
      .not('email', 'is', null)
      .neq('email', '')
      .limit(5)

    // Ver todos os estados
    const { data: statuses } = await supabase
      .from('crm_contacts')
      .select('status')

    const statusCounts: Record<string, number> = {}
    for (const r of statuses || []) {
      const s = r.status || '(sem estado)'
      statusCounts[s] = (statusCounts[s] || 0) + 1
    }

    // Verificar quantos já estão na newsletter
    const { data: emails } = await supabase
      .from('crm_contacts')
      .select('email')
      .not('email', 'is', null)
      .neq('email', '')

    const emailList = (emails || []).map(e => e.email.toLowerCase().trim())
    const { count: jaSubscritos } = await supabase
      .from('newsletter_subscribers')
      .select('*', { count: 'exact', head: true })
      .in('email', emailList)

    return NextResponse.json({
      total_crm: total,
      com_email: comEmail,
      sem_email: (total || 0) - (comEmail || 0),
      ja_subscritos: jaSubscritos,
      deveriam_importar: (comEmail || 0) - (jaSubscritos || 0),
      status_counts: statusCounts,
      sample: sample,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
