import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import type { EntregaLink } from './editoriaisEntregas'

// Acesso aos portais de editoriais (/editorial/<slug>): senha "RL.XXXXXX" por editorial.
// A senha e os links das entregas vivem na tabela `editoriais` (só o servidor lá chega, service role).
// Da senha guarda-se só "sal:scrypt", nunca a senha em claro: o scrypt é lento de propósito,
// para que adivinhar a senha a partir do hash leve anos.
// Depois de entrar fica um cookie assinado com o AUTH_SECRET; mudar a senha invalida os cookies antigos.
// Admin (rl_auth) entra sempre direto.

// Enquanto a tabela não tiver a linha do editorial, vale esta senha
const SENHA_INICIAL: Record<string, string> = {
  'zankyou-quinta-da-ria': '797d6b01345767f9d05f691a4477dde9:345d9171513379936dbc4f25bb3535e99d0ad786085fe85234934e1e74ebff8e',
}

export const EDITORIAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 60 // 60 dias

export const cookieEditorial = (slug: string) => `ed_${slug.replace(/[^a-z0-9]/g, '').slice(0, 24)}`

export const ehEditorial = (slug: string) => slug in SENHA_INICIAL

export type Editorial = { senhaHash: string | null; entregas: Record<string, EntregaLink> }

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

/** Senha e links do editorial. Se a tabela ainda não existir, fica a senha inicial e sem links. */
export async function lerEditorial(slug: string): Promise<Editorial> {
  const vazio = { senhaHash: SENHA_INICIAL[slug] ?? null, entregas: {} }
  if (!ehEditorial(slug)) return { senhaHash: null, entregas: {} }
  const { data, error } = await db().from('editoriais').select('senha_hash,entregas').eq('slug', slug).maybeSingle()
  if (error || !data) return vazio
  return { senhaHash: data.senha_hash || vazio.senhaHash, entregas: data.entregas ?? {} }
}

export async function gravarEditorial(slug: string, campos: { senha?: string; entregas?: Record<string, EntregaLink> }) {
  const linha: Record<string, unknown> = { slug, atualizado_em: new Date().toISOString() }
  if (campos.senha) linha.senha_hash = hashSenha(campos.senha)
  if (campos.entregas) linha.entregas = campos.entregas
  const { error } = await db().from('editoriais').upsert(linha, { onConflict: 'slug' })
  if (error) throw new Error(error.message)
}

// Sem AUTH_SECRET não há assinatura possível: nunca aceitar um segredo de recurso
function segredo() {
  const s = process.env.AUTH_SECRET
  if (!s) throw new Error('AUTH_SECRET em falta')
  return s
}

export function assinaturaEditorial(slug: string, senhaHash: string) {
  return createHmac('sha256', segredo()).update(`editorial:${slug}:${senhaHash}`).digest('hex')
}

// A senha escreve-se sem ligar a maiúsculas e espaços
export const normSenha = (s: string) => s.trim().toUpperCase().replace(/\s+/g, '')

const scrypt = (senha: string, sal: string) =>
  scryptSync(normSenha(senha), sal, 32, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }).toString('hex')

export function hashSenha(senha: string) {
  const sal = randomBytes(16).toString('hex')
  return `${sal}:${scrypt(senha, sal)}`
}

function iguais(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

export function senhaCerta(senhaHash: string | null, senha: string) {
  if (!senhaHash) return false
  const [sal, hash] = senhaHash.split(':')
  return iguais(scrypt(senha, sal), hash)
}

export function cookieValido(slug: string, senhaHash: string | null, valor: string | undefined) {
  if (!valor || !senhaHash) return false
  return iguais(valor, assinaturaEditorial(slug, senhaHash))
}

// Senha nova: "RL." + 6 letras/números sem caracteres que se confundem (0/O, 1/I)
export function novaSenhaEditorial() {
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return 'RL.' + Array.from(randomBytes(6), x => letras[x % letras.length]).join('')
}
