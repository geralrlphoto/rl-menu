// Assinatura do link "Não quero receber mais" do card do blog (só no servidor).
import { createHmac } from 'crypto'

export function assinaturaCancelar(email: string): string {
  return createHmac('sha256', process.env.AUTH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'rl')
    .update(email.toLowerCase().trim()).digest('hex').slice(0, 24)
}
