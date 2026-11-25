// Apresentação da RL para a reunião com o Sirius Park, protegida por password (ver acesso.ts).
// Admin (sessão da RL) entra direto e pode escolher as fotos de cada espaço (botão Editar fotos).
// ?editar=1 abre já em modo de edição; sem sessão de admin manda para o login e volta para aqui.
import { redirect } from 'next/navigation'
import { temAcesso } from './acesso'
import { ehAdmin, lerEscolhas } from './fotos'
import Apresentacao from './Apresentacao'
import Cadeado from './Cadeado'
import { lerFilmesRia } from './filmesRia'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Apresentação · RL Photo · Video × Sirius Park', robots: { index: false, follow: false } }

const AQUI = '/parceria/sirius-park/apresentacao'

export default async function Page({ searchParams }: { searchParams: Promise<{ editar?: string }> }) {
  const admin = await ehAdmin()
  const editar = (await searchParams).editar === '1'
  if (editar && !admin) redirect(`/login?next=${encodeURIComponent(`${AQUI}?editar=1`)}`)
  if (!admin && !(await temAcesso())) return <Cadeado />
  const [escolhas, filmesRia] = await Promise.all([lerEscolhas(), lerFilmesRia()])
  return <Apresentacao escolhas={escolhas} admin={admin} editarInicial={editar} filmesRia={filmesRia} />
}
