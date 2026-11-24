'use server'

// Password da apresentação do Sirius Park. Fica só no servidor (nunca vai para o browser):
// quem acerta recebe um cookie httpOnly válido 30 dias.

import { cookies } from 'next/headers'
import { createHash } from 'crypto'

const PASSWORD = '456789'
const COOKIE = 'sirius_apresentacao'

function assinatura() {
  return createHash('sha256').update(`sirius-park:${PASSWORD}:${process.env.AUTH_SECRET ?? ''}`).digest('hex')
}

export async function temAcesso() {
  return (await cookies()).get(COOKIE)?.value === assinatura()
}

export async function entrar(password: string) {
  if (password.trim() !== PASSWORD) return false
  ;(await cookies()).set(COOKIE, assinatura(), {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax',
    path: '/parceria/sirius-park', maxAge: 60 * 60 * 24 * 30,
  })
  return true
}
