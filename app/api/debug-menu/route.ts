import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    return NextResponse.json({ error: 'Missing env vars', url: !!url, key: !!key })
  }

  const supabase = createClient(url, key)
  const { data, error } = await supabase.from('menu_sections').select('*').order('order_index')

  return NextResponse.json({ data, error, keyPrefix: key.slice(0, 20) })
}
