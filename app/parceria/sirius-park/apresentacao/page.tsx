// Apresentação da RL para a reunião com o Sirius Park, protegida por password (ver acesso.ts).
import { temAcesso } from './acesso'
import Apresentacao from './Apresentacao'
import Cadeado from './Cadeado'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Apresentação · RL Photo · Video × Sirius Park', robots: { index: false, follow: false } }

export default async function Page() {
  return (await temAcesso()) ? <Apresentacao /> : <Cadeado />
}
