import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exigeAdmin, cabecalhoInterno } from '@/lib/api-guard'
import { registarFoto } from '@/lib/fotografiaHistorico'

// Departamento de Fotografia › nomear (ou trocar) o editor do álbum.
// POST { referencia, editor }: faz o que a antiga página /fotos-selecao fazia:
//   1) evento_equipa.editor_album (desbloqueia a Maquete Álbum no portal do membro e avisa-o)
//   2) tira o trabalho do álbum ao editor anterior (freelancer_album)
//   3) cria/atualiza o álbum em albuns_casamento (página Álbuns)
//   4) cria o trabalho no portal do novo editor (freelancer_album) e envia-lhe o email

export const maxDuration = 60
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

export async function POST(req: NextRequest) {
  const bloqueio = exigeAdmin(req)
  if (bloqueio) return bloqueio
  const { referencia, editor } = await req.json().catch(() => ({}))
  const novo = String(editor ?? '').trim()
  if (!referencia || !novo) return NextResponse.json({ error: 'Falta a referência ou o editor.' }, { status: 400 })
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const origin = req.nextUrl.origin
  const json = { 'Content-Type': 'application/json', ...cabecalhoInterno() }

  const [{ data: ev }, { data: eq }, { data: sel }, { data: fls }] = await Promise.all([
    sb.from('eventos_2026').select('cliente, data_evento, local').eq('referencia', referencia).maybeSingle(),
    sb.from('evento_equipa').select('editor_album').eq('referencia', referencia).maybeSingle(),
    sb.from('fotos_selecao').select('nome_noivos, fotos_album, data_entrada').eq('referencia', referencia).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    sb.from('freelancers').select('id, nome'),
  ])
  const nome = String(sel?.nome_noivos || ev?.cliente || referencia).trim()
  const anterior: string[] = Array.isArray(eq?.editor_album) ? eq!.editor_album : eq?.editor_album ? [String(eq.editor_album)] : []
  const acha = (n: string) => (fls ?? []).find(f => norm(f.nome ?? '') === norm(n))
  const fl = acha(novo)
  if (!fl) return NextResponse.json({ error: 'Editor não encontrado na equipa.' }, { status: 404 })

  // 1) equipa do evento (avisa o novo editor no portal)
  await fetch(`${origin}/api/evento-equipa`, {
    method: 'PATCH', headers: json,
    body: JSON.stringify({ referencia, local: ev?.local ?? null, data_casamento: ev?.data_evento ?? null, editor_album: [fl.nome] }),
  }).catch(() => {})

  // 2) tira o trabalho ao editor anterior
  for (const n of anterior) {
    const ant = acha(n)
    if (!ant || ant.id === fl.id) continue
    await sb.from('freelancer_album').delete().eq('freelancer_id', ant.id).eq('referencia_album', referencia)
    await sb.from('freelancer_album').delete().eq('freelancer_id', ant.id).eq('nome', nome)
  }

  // 3) álbum na página Álbuns
  await fetch(`${origin}/api/albuns-casamento`, {
    method: 'POST', headers: json,
    body: JSON.stringify({ nome, ref_evento: referencia, num_fotografias: sel?.fotos_album || null, data_entrega_fotos: sel?.data_entrada || null, check_existing: true }),
  }).catch(() => {})

  // 4) trabalho no portal do novo editor + email
  const { data: ja } = await sb.from('freelancer_album').select('id').eq('freelancer_id', fl.id).eq('referencia_album', referencia).limit(1).maybeSingle()
  if (!ja) {
    await sb.from('freelancer_album').insert({
      freelancer_id: fl.id, nome, status: 'AGUARDAR', data_casamento: ev?.data_evento ?? null,
      referencia_album: referencia, updated_at: new Date().toISOString(),
    })
  }
  await fetch(`${origin}/api/send-edicao-album-email`, {
    method: 'POST', headers: json, body: JSON.stringify({ freelancer_id: fl.id, nome_noivos: nome, referencia }),
  }).catch(() => {})

  await registarFoto(referencia, 'Editor de álbum nomeado', fl.nome)
  return NextResponse.json({ ok: true })
}
