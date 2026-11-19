import { NextResponse } from 'next/server'
import { exigeAdmin } from '@/lib/api-guard'
import { clienteAdmin } from '@/lib/podcast/dados'
import { MODELOS } from '@/lib/podcast/mensagens'

/* ============================================================
   /api/podcast-mensagens
   Registo das mensagens enviadas aos convidados do podcast.
   Não envia nada: as mensagens saem à mão (WhatsApp, email ou
   copiar). Isto só guarda o que foi enviado, a quem e quando.
   Só admin.
   ============================================================ */

export const dynamic = 'force-dynamic'

const CANAIS = ['whatsapp', 'email', 'copiado']

// POST { episodio, convidado?, modelo, canal, texto } → regista o envio
export async function POST(req: Request) {
  const barrado = exigeAdmin(req)
  if (barrado) return barrado

  const b = await req.json().catch(() => ({}))
  if (!b.episodio) return NextResponse.json({ error: 'episodio obrigatório' }, { status: 400 })
  if (!MODELOS.some(m => m.chave === b.modelo)) return NextResponse.json({ error: 'modelo inválido' }, { status: 400 })
  if (!CANAIS.includes(b.canal)) return NextResponse.json({ error: 'canal inválido' }, { status: 400 })

  const { data, error } = await clienteAdmin()
    .from('podcast_mensagens')
    .insert({
      episodio_id: b.episodio,
      convidado_id: b.convidado || null,
      modelo: b.modelo,
      canal: b.canal,
      texto: typeof b.texto === 'string' ? b.texto.slice(0, 5000) : null,
    })
    .select('id, episodio_id, convidado_id, modelo, canal, enviado_em')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, mensagem: data })
}

// DELETE ?id=<id> → apaga um registo feito por engano
export async function DELETE(req: Request) {
  const barrado = exigeAdmin(req)
  if (barrado) return barrado

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })
  const { error } = await clienteAdmin().from('podcast_mensagens').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
