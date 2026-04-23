import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  try {
    // Contar duplicados antes
    const { data: all } = await supabase.from('crm_contacts').select('id, notion_id')
    const total = all?.length ?? 0

    // Encontrar IDs a manter (MIN id por notion_id)
    const keepMap = new Map<string, string>()
    for (const row of (all ?? [])) {
      const key = row.notion_id ?? row.id
      if (!keepMap.has(key) || row.id < keepMap.get(key)!) {
        keepMap.set(key, row.id)
      }
    }
    const keepIds = Array.from(keepMap.values())
    const toDelete = (all ?? []).filter(r => !keepIds.includes(r.id)).map(r => r.id)

    if (toDelete.length === 0) {
      return NextResponse.json({ ok: true, deleted: 0, total, message: 'Sem duplicados encontrados' })
    }

    const { error } = await supabase.from('crm_contacts').delete().in('id', toDelete)
    if (error) throw new Error(error.message)

    return NextResponse.json({ ok: true, deleted: toDelete.length, total, kept: keepIds.length, message: `${toDelete.length} duplicados apagados` })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
