import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exigeAdminOuProprio } from '@/lib/api-guard'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// A funcao do membro e a coluna `status` da tabela freelancers (a que a ficha
// admin edita). O perfil_editor arranca do default do painel, que dizia sempre
// "Editor de Video" mesmo para videografos e fotografos.
const FUNCAO_POR_STATUS: Record<string, string> = {
  FOTOGRAFO: 'Fotógrafo',
  VIDEOGRAFO: 'Videógrafo',
  EDITORES: 'Editor de Vídeo',
  EDITOR: 'Editor de Vídeo',
  ASSISTENTE: 'Assistente',
}
function funcaoDeStatus(status?: string | null): string | null {
  if (!status) return null
  const chave = status.trim().toUpperCase()
  return FUNCAO_POR_STATUS[chave] ?? null
}

// GET: perfil do editor (freelancers.perfil_editor) + identidade base da BD.
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('freelancer')
  if (!id) return NextResponse.json({ error: 'freelancer required' }, { status: 400 })
  // O perfil leva IBAN e NIF: só o próprio ou o admin.
  const barrado = await exigeAdminOuProprio(req, id)
  if (barrado) return barrado
  const supabase = db()

  // ?only=foto — devolve só a foto (JSON-path select). Evita arrastar o
  // perfil_editor inteiro para o dashboard, que só precisa do avatar.
  if (req.nextUrl.searchParams.get('only') === 'foto') {
    const { data } = await supabase
      .from('freelancers')
      .select('foto_url, perfil_editor->>foto')
      .eq('id', id)
      .maybeSingle()
    const row = data as { foto_url?: string | null; foto?: string | null } | null
    return NextResponse.json({ foto: row?.foto_url || row?.foto || null })
  }
  const { data } = await supabase
    .from('freelancers')
    .select('id, nome, email, contato, foto_url, status, perfil_editor')
    .eq('id', id)
    .maybeSingle()
  return NextResponse.json({
    base: data ? { nome: data.nome, email: data.email, contato: data.contato, foto_url: data.foto_url, funcao: funcaoDeStatus(data.status) } : null,
    perfil: data?.perfil_editor ?? null,
  })
}

// PATCH: grava o perfil do editor em freelancers.perfil_editor.
export async function PATCH(req: NextRequest) {
  const { freelancer, perfil } = await req.json()
  if (!freelancer) return NextResponse.json({ error: 'freelancer required' }, { status: 400 })
  const barrado = await exigeAdminOuProprio(req, freelancer)
  if (barrado) return barrado
  const supabase = db()
  const { error } = await supabase
    .from('freelancers')
    .update({ perfil_editor: perfil ?? {} })
    .eq('id', freelancer)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
