import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

// Acesso aos portais de editoriais (/editorial/<slug>): senha "RL.XXXXXX" por editorial.
// No código fica só a impressão digital (sha256) da senha, nunca a senha em claro.
// Depois de entrar fica um cookie assinado com o AUTH_SECRET; mudar a senha invalida os cookies antigos.
// Admin (rl_auth) entra sempre direto.

export const EDITORIAIS_SENHA: Record<string, string> = {
  'zankyou-quinta-da-ria': '09284cc9b9a1300986431d82270bceaeafb9b0cb8f2d7ee2c53240f940f2f8f1',
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
  return iguais(createHash('sha256').update(normSenha(senha)).digest('hex'), esperada)
}

export function cookieValido(slug: string, valor: string | undefined) {
  if (!valor || !EDITORIAIS_SENHA[slug]) return false
  return iguais(valor, assinaturaEditorial(slug))
}
