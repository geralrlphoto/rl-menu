import { createHmac, randomBytes } from 'node:crypto'

// Acesso ao portal do staff RL PROD (/equipa-rlprod/<token>): link secreto + senha "RL.XXXXXX".
// Depois de entrar, fica um cookie por membro com uma assinatura do token e da senha;
// se a RL PROD gerar uma senha nova, o cookie antigo deixa de valer.

const SEGREDO = () => process.env.AUTH_SECRET ?? 'rl-staff-dev'

export const cookieStaff = (membroId: string) => `rps_${membroId.replace(/-/g, '').slice(0, 16)}`
export const STAFF_COOKIE_MAX_AGE = 60 * 60 * 24 * 60 // 60 dias

export function assinaturaStaff(token: string, senha: string) {
  return createHmac('sha256', SEGREDO()).update(`${token}:${senha}`).digest('hex')
}

// Senha nova: "RL." + 6 letras/números sem caracteres que se confundem (0/O, 1/I)
export function novaSenhaStaff() {
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const b = randomBytes(6)
  return 'RL.' + Array.from(b, x => letras[x % letras.length]).join('')
}

// A senha escreve-se sem ligar a maiúsculas e espaços
export const normSenha = (s: string) => s.trim().toUpperCase().replace(/\s+/g, '')
