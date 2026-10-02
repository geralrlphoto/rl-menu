// Quem está a pedir dados de um portal: admin (rl_auth), noivos de um portal
// (nv_session, só o próprio) ou membro da equipa (fl_session).
import type { NextRequest } from 'next/server'
import { NV_COOKIE_NAME, verifyNvSession } from '@/lib/noivos-session'
import { FL_COOKIE_NAME, verifyFlSession } from '@/lib/freelancer-session'

export type Acesso = { admin: boolean; freelancer: boolean; noivosRef: string | null }

export async function acessoPortal(req: NextRequest): Promise<Acesso> {
  const admin = !!process.env.AUTH_SECRET && req.cookies.get('rl_auth')?.value === process.env.AUTH_SECRET
  if (admin) return { admin: true, freelancer: false, noivosRef: null }
  const [nv, fl] = await Promise.all([
    verifyNvSession(req.cookies.get(NV_COOKIE_NAME)?.value),
    verifyFlSession(req.cookies.get(FL_COOKIE_NAME)?.value),
  ])
  return { admin: false, freelancer: !!fl, noivosRef: nv?.referencia ?? null }
}

/* Pode ler ou alterar o portal desta referência? (admin, equipa, ou os próprios noivos) */
export function podeUsarPortal(a: Acesso, referencia: string | null | undefined): boolean {
  if (a.admin || a.freelancer) return true
  return !!referencia && !!a.noivosRef && a.noivosRef.toLowerCase() === String(referencia).toLowerCase()
}
