import { randomUUID } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

/* Portal da reunião (/r/<token>): publicar copia a maquete e guarda só o que é de cada casal.
   Usado pelo botão Publicar da ficha e por "Aceitar" num pedido de reunião. */

const MASTER_TOKEN = '85343645-b0d3-4412-ae78-795fd7f8ddf1'

export const MAPS_LINK = 'https://www.google.com/maps/place/RL+Photo.Video+(Casamentos,Batizados,Eventos)/@38.634382,-8.9147077,212m/data=!3m2!1e3!4b1!4m6!3m5!1s0xd19414ebaa9e467:0x1d9b63c70ffe06a!8m2!3d38.634381!4d-8.914064!16s%2Fg%2F11w219lx62?authuser=0&entry=ttu&g_ep=EgoyMDI2MDQxMi4wIKXMDSoASAFQAw%3D%3D'

// Password das propostas: 4 algarismos, fácil de dizer por mensagem
export const gerarPassword = () => String(1000 + Math.floor(Math.random() * 9000))

/* Campos a gravar para publicar (ou despublicar) o portal. Com `password`, as propostas ficam
   protegidas por ela; sem ela, mantém-se a que o casal já tinha. */
export async function camposPublicar(sb: SupabaseClient, id: string, publish: boolean, password?: string) {
  const { data: existing } = await sb.from('crm_contacts').select('page_token, page_content').eq('id', id).single()
  const token: string = existing?.page_token || randomUUID()
  const campos: Record<string, unknown> = { page_publicada: publish, page_token: token }

  if (publish) {
    const { data: master } = await sb.from('crm_contacts').select('page_content').eq('page_token', MASTER_TOKEN).maybeSingle()
    const masterPC = master?.page_content ?? {}
    const currentPC = existing?.page_content ?? {}
    // Da maquete vem tudo; de cada casal ficam as propostas, os extras, a proposta ativa e a password
    campos.page_content = {
      ...masterPC,
      propostas: currentPC.propostas ?? masterPC.propostas,
      extras_proposta: currentPC.extras_proposta ?? masterPC.extras_proposta,
      propostaPage: {
        ...(masterPC.propostaPage ?? {}),
        propostaAtiva: currentPC.propostaPage?.propostaAtiva ?? 0,
      },
      proposta: {
        ...(masterPC.proposta ?? {}),
        password: password ?? currentPC.proposta?.password ?? masterPC.proposta?.password ?? '',
      },
    }
  }
  return { token, campos }
}
