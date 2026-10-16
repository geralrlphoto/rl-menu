/**
 * GET /api/membros-whatsapp
 *
 * Membros da equipa com telefone, para a janela "Enviar por WhatsApp" das
 * gavetas do /photo. Só admin e só as colunas precisas (nunca a password).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ehAdmin, naoAutorizado } from '@/lib/api-guard'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  if (!ehAdmin(req)) return naoAutorizado()
  const { data } = await supabase.from('freelancers')
    .select('id, nome, status, contato, foto_url')
    .eq('is_template', false)
    .not('contato', 'is', null)
    .order('order_index', { ascending: true })
  // Fica só quem tem um número a sério (9 ou mais dígitos)
  const membros = (data ?? []).filter(m => String(m.contato ?? '').replace(/\D/g, '').length >= 9)
  return NextResponse.json({ membros }, { headers: { 'Cache-Control': 'private, max-age=300' } })
}
