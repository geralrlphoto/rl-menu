// Apresentação da RL para a reunião com o Sirius Park, protegida por password (ver acesso.ts).
// Admin (sessão da RL) entra direto e pode escolher as fotos de cada espaço (botão Editar fotos).
import { temAcesso } from './acesso'
import { ehAdmin, lerEscolhas } from './fotos'
import Apresentacao from './Apresentacao'
import Cadeado from './Cadeado'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Apresentação · RL Photo · Video × Sirius Park', robots: { index: false, follow: false } }

export default async function Page() {
  const admin = await ehAdmin()
  if (!admin && !(await temAcesso())) return <Cadeado />
  return <Apresentacao escolhas={await lerEscolhas()} admin={admin} />
}
