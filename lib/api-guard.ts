import { NextRequest, NextResponse } from 'next/server'
import { verifyFlSession, FL_COOKIE_NAME } from '@/lib/freelancer-session'

/**
 * Guardas de autorização para as rotas de API do painel e da equipa.
 *
 * O middleware deixa passar /api/freelancers, /api/freelancer-* e
 * /api/painel-editor/* sem sessão, porque o próprio membro precisa de as ler
 * com o fl_session (não tem rl_auth). Isso deixava as escritas — e a leitura
 * da lista com passwords — abertas a qualquer pedido. A decisão de quem pode
 * o quê passa a ser de cada rota, com estes ajudantes.
 */

/** Admin = cookie rl_auth igual ao AUTH_SECRET. */
export function ehAdmin(req: NextRequest): boolean {
  const auth = req.cookies.get('rl_auth')?.value
  return !!auth && auth === process.env.AUTH_SECRET
}

/** Sessão do membro (cookie fl_session), ou null. */
export async function sessaoMembro(req: NextRequest) {
  return verifyFlSession(req.cookies.get(FL_COOKIE_NAME)?.value)
}

export function naoAutorizado(motivo = 'nao_autorizado') {
  return NextResponse.json({ error: motivo }, { status: 401 })
}

/** Só admin. Devolve a resposta de erro, ou null quando pode seguir. */
export function exigeAdmin(req: NextRequest): NextResponse | null {
  return ehAdmin(req) ? null : naoAutorizado()
}

/**
 * Admin, ou o próprio membro sobre os seus dados. Devolve a resposta de erro,
 * ou null quando pode seguir.
 */
export async function exigeAdminOuProprio(
  req: NextRequest,
  freelancerId: string | null | undefined,
): Promise<NextResponse | null> {
  if (ehAdmin(req)) return null
  const sessao = await sessaoMembro(req)
  if (sessao && freelancerId && sessao.id === freelancerId) return null
  return naoAutorizado()
}

/** Campos que um membro pode alterar em si próprio. */
export const CAMPOS_PROPRIOS = ['nome', 'email', 'contato', 'foto_url', 'perfil_editor'] as const

/** Campos visíveis a um membro sobre os colegas (para listas e menções). */
export const CAMPOS_PUBLICOS = ['id', 'nome', 'status', 'foto_url', 'order_index'] as const

export function apenasCamposPublicos(linha: Record<string, any>) {
  const out: Record<string, any> = {}
  for (const k of CAMPOS_PUBLICOS) out[k] = linha[k]
  return out
}
