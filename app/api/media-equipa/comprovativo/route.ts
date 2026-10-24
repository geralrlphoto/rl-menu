import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exigeAdmin } from '@/lib/api-guard'

// Comprovativo do pagamento a um membro da equipa num projeto (bucket privado).
//   POST (admin, multipart: id + file)  → guarda e marca o trabalho como pago
//   GET  (admin, ?id=)                  → abre o ficheiro (link temporário de 10 min)
// O membro vê-o no portal da equipa por um link temporário gerado na página.

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const BUCKET = 'comprovativos-equipa'
const TIPOS: Record<string, string> = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/heic': 'heic' }

export async function POST(req: NextRequest) {
  const bloqueio = exigeAdmin(req)
  if (bloqueio) return bloqueio
  const form = await req.formData()
  const id = String(form.get('id') ?? '')
  const file = form.get('file') as File | null
  if (!id || !file) return NextResponse.json({ error: 'Falta o ficheiro.' }, { status: 400 })
  const ext = TIPOS[(file.type || '').toLowerCase()]
  if (!ext) return NextResponse.json({ error: 'Usa PDF ou imagem (JPG, PNG).' }, { status: 415 })
  if (file.size > 15 * 1024 * 1024) return NextResponse.json({ error: 'Ficheiro demasiado grande (máx. 15 MB).' }, { status: 413 })

  const { data: linha } = await supabase.from('media_equipa_projeto').select('id, comprovativo_path, despesa_id').eq('id', id).maybeSingle()
  if (!linha) return NextResponse.json({ error: 'Trabalho não encontrado.' }, { status: 404 })

  const path = `${id}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (linha.comprovativo_path) await supabase.storage.from(BUCKET).remove([linha.comprovativo_path])

  const hoje = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Lisbon' })
  const { data, error: e2 } = await supabase.from('media_equipa_projeto')
    .update({ comprovativo_path: path, pago: true, pago_em: hoje }).eq('id', id).select('id, comprovativo_path, pago, pago_em').single()
  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 })
  if (linha.despesa_id) await supabase.from('media_despesas').update({ notas: 'Equipa do projeto · pago' }).eq('id', linha.despesa_id)
  return NextResponse.json({ ok: true, membro: data })
}

export async function GET(req: NextRequest) {
  const bloqueio = exigeAdmin(req)
  if (bloqueio) return bloqueio
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Falta o id.' }, { status: 400 })
  const { data: linha } = await supabase.from('media_equipa_projeto').select('comprovativo_path').eq('id', id).maybeSingle()
  if (!linha?.comprovativo_path) return NextResponse.json({ error: 'Sem comprovativo.' }, { status: 404 })
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(linha.comprovativo_path, 600)
  if (!data?.signedUrl) return NextResponse.json({ error: 'Não foi possível abrir.' }, { status: 500 })
  return NextResponse.redirect(data.signedUrl)
}
