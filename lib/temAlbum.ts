import type { SupabaseClient } from '@supabase/supabase-js'

/** Tem álbum? Como no Departamento de Fotografia: os serviços da proposta aceite no CRM
 *  (portais.settings.propostaToken) e os extras; senão os serviços de fotografia da ficha.
 *  null = não se sabe. */
export async function temAlbumPortal(sb: SupabaseClient, referencia: string, settings: Record<string, any> | null): Promise<boolean | null> {
  const temAlb = (l: unknown[]) => l.some(x => /[áa]lbum/i.test(String(x)))
  const tk = settings?.propostaToken
  if (tk) {
    const { data: c } = await sb.from('crm_contacts').select('page_content').eq('page_token', tk).maybeSingle()
    if (c) {
      const pc = typeof c.page_content === 'string' ? JSON.parse(c.page_content || '{}') : (c.page_content || {})
      const aceite = pc.propostaAceite
      const prop = aceite?.nome ? aceite : (pc.propostas ?? [])[pc.propostaPage?.propostaAtiva ?? 0]
      if (prop) {
        const extras = (aceite?.extras ?? pc.extras_proposta ?? []).map((e: any) => String(e?.nome ?? ''))
        return temAlb([...(prop.servicos_foto ?? []), ...extras])
      }
    }
  }
  const { data: e } = await sb.from('eventos_2026').select('servico_foto').eq('referencia', referencia).limit(1).maybeSingle()
  return Array.isArray(e?.servico_foto) && e.servico_foto.length ? temAlb(e.servico_foto) : null
}

/** Página do portal onde ficam as Notas Privadas da equipa (briefingInfo[página].notasPrivadas) */
export const PAGINA_NOTAS_PRIVADAS = '32c22011-6d8a-803e-9167-edd1d0637292'

export type EscolhaAlbum = { quem: 'noivos' | 'rl'; em: string }

export const textoEscolhaAlbum = (e: EscolhaAlbum) => e.quem === 'noivos'
  ? 'Os noivos vão personalizar o álbum no portal'
  : 'Os noivos deixaram a personalização do álbum à RL Photo.Video'
