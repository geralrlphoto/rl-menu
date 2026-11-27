import type { SupabaseClient } from '@supabase/supabase-js'

/** Tem álbum? Pelos serviços de fotografia contratados na ficha do cliente (eventos_2026.servico_foto).
 *  Sem ficha ou sem "álbum" nos serviços = não tem. */
export async function temAlbumPortal(sb: SupabaseClient, referencia: string): Promise<boolean> {
  const { data: e, error } = await sb.from('eventos_2026').select('servico_foto').eq('referencia', referencia).limit(1).maybeSingle()
  if (error) throw error
  return Array.isArray(e?.servico_foto) && e.servico_foto.some((x: unknown) => /[áa]lbum/i.test(String(x)))
}

/** Página do portal onde ficam as Notas Privadas da equipa (briefingInfo[página].notasPrivadas) */
export const PAGINA_NOTAS_PRIVADAS = '32c22011-6d8a-803e-9167-edd1d0637292'

export type EscolhaAlbum = { quem: 'noivos' | 'rl'; em: string }

export const textoEscolhaAlbum = (e: EscolhaAlbum) => e.quem === 'noivos'
  ? 'Os noivos vão personalizar o álbum no portal'
  : 'Os noivos deixaram a personalização do álbum à RL Photo.Video'
