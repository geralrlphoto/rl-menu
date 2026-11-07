import { randomUUID } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { pedirFormulario, propostaLiberada } from '@/lib/crm'

/* Portal da reunião (/r/<token>): publicar copia a maquete e guarda só o que é de cada casal.
   Usado pelo botão Publicar da ficha e por "Aceitar" num pedido de reunião. */

const MASTER_TOKEN = '85343645-b0d3-4412-ae78-795fd7f8ddf1'

export const MAPS_LINK = 'https://www.google.com/maps/place/RL+Photo.Video+(Casamentos,Batizados,Eventos)/@38.634382,-8.9147077,212m/data=!3m2!1e3!4b1!4m6!3m5!1s0xd19414ebaa9e467:0x1d9b63c70ffe06a!8m2!3d38.634381!4d-8.914064!16s%2Fg%2F11w219lx62?authuser=0&entry=ttu&g_ep=EgoyMDI2MDQxMi4wIKXMDSoASAFQAw%3D%3D'

// Password das propostas: 4 algarismos, fácil de dizer por mensagem
export const gerarPassword = () => String(1000 + Math.floor(Math.random() * 9000))

/* O que sai do servidor para os noivos: nunca as notas, outros dados internos da ficha nem a password.
   Propostas e valores só saem aqui depois de a RL os apresentar (propostaLiberada); antes disso
   só com a password certa, em /api/lead-page/proposta-acesso. */
const CAMPOS_NOIVOS = ['id', 'nome', 'status', 'data_casamento', 'page_confirmacao', 'page_content', 'page_foto_url', 'proposta_pdf_url',
  'proposta_resposta', 'reuniao_data', 'reuniao_hora', 'reuniao_link', 'reuniao_pedido', 'reuniao_tipo']

export function semDadosDaProposta(pc: Record<string, any>, manterPropostas = false) {
  const { propostas, extras_proposta, propostas_auto: _a, propostaAceite: _c, ...resto } = pc
  return { ...resto, ...(manterPropostas ? { propostas, extras_proposta } : {}), proposta: { ...(pc.proposta ?? {}), password: '' } }
}

export function contactoParaNoivos(c: Record<string, any>, fechado: boolean) {
  const out: Record<string, any> = Object.fromEntries(CAMPOS_NOIVOS.map(k => [k, c[k] ?? null]))
  const pc = (typeof c.page_content === 'string' ? JSON.parse(c.page_content || '{}') : c.page_content) ?? {}
  out.page_content = semDadosDaProposta(pc, !fechado && propostaLiberada(c))
  out.proposta_com_password = !!pc.proposta?.password
  out.pedir_formulario = pedirFormulario(c)
  if (fechado) out.proposta_pdf_url = null
  return out
}

/* Campos a gravar para publicar (ou despublicar) o portal. As propostas ficam sempre protegidas:
   com `password` usa essa; sem ela, mantém a do casal ou gera uma só para ele. */
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
      ...(currentPC.tipo ? { tipo: currentPC.tipo } : {}),
      propostas: currentPC.propostas ?? masterPC.propostas,
      extras_proposta: currentPC.extras_proposta ?? masterPC.extras_proposta,
      propostaPage: {
        ...(masterPC.propostaPage ?? {}),
        propostaAtiva: currentPC.propostaPage?.propostaAtiva ?? 0,
      },
      proposta: {
        ...(masterPC.proposta ?? {}),
        password: password || currentPC.proposta?.password || gerarPassword(),
      },
    }
  }
  return { token, campos }
}
