import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'

// O painel /photo guarda as suas leituras em cache durante 30 minutos.
// Quem altera dados que lá aparecem (por exemplo marcar uma reunião numa
// ficha de CRM) chama esta rota para o painel mostrar a alteração já a
// seguir, em vez de esperar pela próxima revalidação.
export async function POST() {
  revalidateTag('photo-dashboard', { expire: 0 })
  return NextResponse.json({ ok: true })
}
