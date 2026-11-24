// Fotos escolhidas para cada espaço da apresentação (modo Editar fotos, só admin).
// Ficam em portal_template_settings (page_id 'parceria_sirius-park', settings.fotos = { espaço: url }).
// Só o servidor lá chega (service role).
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

export const PAGE_ID = 'parceria_sirius-park'
export type Escolhas = Record<string, string>

export function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function ehAdmin() {
  const auth = (await cookies()).get('rl_auth')?.value
  return !!auth && auth === process.env.AUTH_SECRET
}

export async function lerEscolhas(): Promise<Escolhas> {
  const { data } = await db().from('portal_template_settings').select('settings').eq('page_id', PAGE_ID).maybeSingle()
  return (data?.settings as { fotos?: Escolhas } | null)?.fotos ?? {}
}
