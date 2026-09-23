import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'

// O painel /photo guarda as suas leituras em cache durante 30 minutos.
// Quem altera dados que lá aparecem (por exemplo marcar uma reunião numa
// ficha de CRM) chama esta rota para o painel mostrar a alteração já a
// seguir, em vez de esperar pela próxima revalidação.
// Com ?tag=whatsapp só refaz as tarefas de WhatsApp (poupa as outras leituras).
export async function POST(req: Request) {
  const tag = new URL(req.url).searchParams.get('tag')
  revalidateTag(tag === 'whatsapp' ? 'photo-whatsapp' : 'photo-dashboard', { expire: 0 })
  return NextResponse.json({ ok: true })
}
