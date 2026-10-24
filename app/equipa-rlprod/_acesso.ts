import { cookies } from 'next/headers'
import { assinaturaStaff, cookieStaff } from '@/lib/staffRlprod'

// O membro já entrou com a senha (cookie certo) ou é a RL PROD (sessão de admin)?
export async function temAcessoStaff(m: { id: string; senha: string }, token: string) {
  const c = await cookies()
  if (c.get('rl_auth')?.value === process.env.AUTH_SECRET) return true
  return c.get(cookieStaff(m.id))?.value === assinaturaStaff(token, m.senha)
}
