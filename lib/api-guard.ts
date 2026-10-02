import { NextResponse } from 'next/server'
import { verifyFlSession, FL_COOKIE_NAME } from '@/lib/freelancer-session'

/** Lê os cookies do cabeçalho — funciona com Request e com NextRequest. */
function cookiesDe(req: Request): Record<string, string> {
  const bruto = req.headers.get('cookie') ?? ''
  const out: Record<string, string> = {}
  for (const parte of bruto.split(';')) {
    const i = parte.indexOf('=')
    if (i < 0) continue
    out[parte.slice(0, i).trim()] = decodeURIComponent(parte.slice(i + 1).trim())
  }
  return out
}

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
export function ehAdmin(req: Request): boolean {
  const auth = cookiesDe(req)['rl_auth']
  return !!auth && auth === process.env.AUTH_SECRET
}

/** Sessão do membro (cookie fl_session), ou null. */
export async function sessaoMembro(req: Request) {
  return verifyFlSession(cookiesDe(req)[FL_COOKIE_NAME])
}

export function naoAutorizado(motivo = 'nao_autorizado') {
  return NextResponse.json({ error: motivo }, { status: 401 })
}

/** Só admin. Devolve a resposta de erro, ou null quando pode seguir. */
export function exigeAdmin(req: Request): NextResponse | null {
  return ehAdmin(req) ? null : naoAutorizado()
}

/**
 * Admin, ou o próprio membro sobre os seus dados. Devolve a resposta de erro,
 * ou null quando pode seguir.
 */
export async function exigeAdminOuProprio(
  req: Request,
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

/**
 * Qualquer sessão válida (admin ou membro). Usado nas rotas da equipa, que são
 * partilhadas entre todos: mensagens, notificações, casamentos, disponibilidade.
 * Fecha o caso grave — estarem abertas a quem não tem sessão nenhuma.
 */
export async function exigeSessao(req: Request): Promise<NextResponse | null> {
  if (ehAdmin(req)) return null
  const sessao = await sessaoMembro(req)
  return sessao ? null : naoAutorizado()
}

/** Emails gerais da RL (destinos aceites além dos membros da equipa). */
const EMAILS_RL = ['geral.rlphoto@gmail.com', 'geral@rlphotovideo.pt']

/**
 * O destinatário é alguém da equipa (tabela freelancers) ou um email geral da RL?
 * Serve para as rotas que enviam emails não poderem ser usadas para escrever
 * a qualquer endereço a partir do domínio da RL.
 */
export async function destinoDaEquipa(email: string | null | undefined): Promise<boolean> {
  const e = String(email ?? '').trim().toLowerCase()
  if (!e || !e.includes('@')) return false
  if (EMAILS_RL.includes(e)) return true
  const { createClient } = await import('@supabase/supabase-js')
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data } = await db.from('freelancers').select('id').ilike('email', e).limit(1)
  return !!data?.length
}

/**
 * Admin, ou os noivos deste casamento (nv_session com a mesma referência) e,
 * com `equipa`, também quem tem sessão da equipa (fl_session).
 * Devolve a resposta de erro, ou null quando pode seguir.
 */
export async function exigeAcessoRef(
  req: Request,
  referencia: string | null | undefined,
  opcoes: { equipa?: boolean } = {},
): Promise<NextResponse | null> {
  if (ehAdmin(req)) return null
  if (opcoes.equipa && (await sessaoMembro(req))) return null
  const nv = await sessaoNoivos(req)
  if (nv && referencia && nv.referencia.toLowerCase() === String(referencia).toLowerCase()) return null
  return naoAutorizado()
}

/** Sessão dos noivos (cookie nv_session), ou null. */
export async function sessaoNoivos(req: Request) {
  const { verifyNvSession, NV_COOKIE_NAME } = await import('@/lib/noivos-session')
  return verifyNvSession(cookiesDe(req)[NV_COOKIE_NAME])
}

/** Cabeçalho para chamadas do próprio servidor a rotas protegidas (sem cookies do browser). */
export function cabecalhoInterno(): Record<string, string> {
  return { cookie: `rl_auth=${process.env.AUTH_SECRET ?? ''}` }
}
