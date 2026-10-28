import { createHmac, scryptSync, timingSafeEqual } from 'node:crypto'

// Acesso aos portais de editoriais (/editorial/<slug>): senha "RL.XXXXXX" por editorial.
// No código fica só "sal:scrypt" da senha, nunca a senha em claro. O scrypt é lento de propósito:
// mesmo com o código à vista, adivinhar a senha a partir daqui levaria anos.
// Depois de entrar fica um cookie assinado com o AUTH_SECRET; mudar a senha invalida os cookies antigos.
// Admin (rl_auth) entra sempre direto.

export const EDITORIAIS_SENHA: Record<string, string> = {
  'zankyou-quinta-da-ria': '797d6b01345767f9d05f691a4477dde9:345d9171513379936dbc4f25bb3535e99d0ad786085fe85234934e1e74ebff8e',
}

export const EDITORIAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 60 // 60 dias

export const cookieEditorial = (slug: string) => `ed_${slug.replace(/[^a-z0-9]/g, '').slice(0, 24)}`

// Sem AUTH_SECRET não há assinatura possível: nunca aceitar um segredo de recurso
function segredo() {
  const s = process.env.AUTH_SECRET
  if (!s) throw new Error('AUTH_SECRET em falta')
  return s
}

export function assinaturaEditorial(slug: string) {
  return createHmac('sha256', segredo()).update(`editorial:${slug}:${EDITORIAIS_SENHA[slug]}`).digest('hex')
}

// A senha escreve-se sem ligar a maiúsculas e espaços
const normSenha = (s: string) => s.trim().toUpperCase().replace(/\s+/g, '')

function iguais(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

export function senhaCerta(slug: string, senha: string) {
  const esperada = EDITORIAIS_SENHA[slug]
  if (!esperada) return false
  const [sal, hash] = esperada.split(':')
  const tentativa = scryptSync(normSenha(senha), sal, 32, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }).toString('hex')
  return iguais(tentativa, hash)
}

export function cookieValido(slug: string, valor: string | undefined) {
  if (!valor || !EDITORIAIS_SENHA[slug]) return false
  return iguais(valor, assinaturaEditorial(slug))
}
