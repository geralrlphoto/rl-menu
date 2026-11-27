// Dados do portal de parceria do Sirius Park (casamentos fechados, biblioteca, mood board).
// Ficam em portal_template_settings (page_id 'parceria_sirius-park', settings.portal), ao lado das
// fotos da apresentação (settings.fotos). Ficheiros no bucket público 'parcerias', pasta sirius-park/.
import { PAGE_ID, db } from './apresentacao/fotos'

export type Casamento = { id: string; noivos: string; data: string; convidados?: number }
export type ItemBib = { id: string; tipo: 'foto' | 'video'; url: string; titulo: string; criado: string }
export type EstadoMood = 'novo' | 'visto' | 'producao' | 'feito'
export type ItemMood = { id: string; img?: string; link?: string; nota: string; autor: 'sirius' | 'rl'; estado: EstadoMood; criado: string }
export type DadosPortal = { casamentos: Casamento[]; biblioteca: ItemBib[]; moodboard: ItemMood[] }

export const BUCKET = 'parcerias'
export const PASTA = 'sirius-park'
export const PUBLICO = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`

const VAZIO: DadosPortal = { casamentos: [], biblioteca: [], moodboard: [] }

async function lerSettings() {
  const { data } = await db().from('portal_template_settings').select('settings').eq('page_id', PAGE_ID).maybeSingle()
  return (data?.settings as Record<string, unknown> | null) ?? {}
}

export async function lerPortal(): Promise<DadosPortal> {
  const p = (await lerSettings()).portal as Partial<DadosPortal> | undefined
  return { ...VAZIO, ...(p ?? {}) }
}

// Lê, altera e grava (as fotos da apresentação ficam intactas)
export async function mudarPortal(f: (d: DadosPortal) => DadosPortal): Promise<DadosPortal | null> {
  const settings = await lerSettings()
  const atual = { ...VAZIO, ...((settings.portal as Partial<DadosPortal>) ?? {}) }
  const novo = f(atual)
  const { error } = await db().from('portal_template_settings')
    .upsert({ page_id: PAGE_ID, settings: { ...settings, portal: novo }, updated_at: new Date().toISOString() }, { onConflict: 'page_id' })
  return error ? null : novo
}
