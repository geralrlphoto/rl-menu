'use server'

// Password da apresentação do Sirius Park. Fica só no servidor (nunca vai para o browser):
// quem acerta recebe um cookie httpOnly válido 30 dias.

import { cookies } from 'next/headers'
import { createHash } from 'crypto'
import { PAGE_ID, db, ehAdmin, lerEscolhas } from './fotos'

const PASSWORD = '456789'
const COOKIE = 'sirius_apresentacao'

function assinatura() {
  return createHash('sha256').update(`sirius-park:${PASSWORD}:${process.env.AUTH_SECRET ?? ''}`).digest('hex')
}

export async function temAcesso() {
  return (await cookies()).get(COOKIE)?.value === assinatura()
}

// Grava a foto de um espaço (url vazio = volta à foto de origem). Só admin.
const ESPACOS = ['capa', 'quem', 'portal', 'm0', 'm1', 'm2', 'm3', 'm4', 'm5', 'testemunho', 'fim']
export async function gravarFoto(espaco: string, url: string | null) {
  if (!(await ehAdmin())) return false
  if (!ESPACOS.includes(espaco)) return false
  if (url && !/^https:\/\/([a-z0-9-]+\.)*wfolio\.(com|photo)\//.test(url)) return false
  const atual = await lerEscolhas()
  if (url) atual[espaco] = url; else delete atual[espaco]
  const { data } = await db().from('portal_template_settings').select('settings').eq('page_id', PAGE_ID).maybeSingle()
  const settings = { ...((data?.settings as object) ?? {}), fotos: atual }
  const { error } = await db().from('portal_template_settings')
    .upsert({ page_id: PAGE_ID, settings, updated_at: new Date().toISOString() }, { onConflict: 'page_id' })
  return !error
}

export async function entrar(password: string) {
  if (password.trim() !== PASSWORD) return false
  ;(await cookies()).set(COOKIE, assinatura(), {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax',
    path: '/parceria/sirius-park', maxAge: 60 * 60 * 24 * 30,
  })
  return true
}
