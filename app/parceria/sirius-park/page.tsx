// Portal de parceria do Sirius Park (Inês, gestora do espaço), depois da reunião de 25/11/2026.
// Três partes: os casamentos que fecham connosco, a biblioteca de fotos/vídeos para as redes deles
// e o mood board onde nos mandam referências. Mesma password da apresentação (apresentacao/acesso.ts).
// Admin (sessão da RL) entra direto e pode acrescentar casamentos e ficheiros.
// O portal antigo da reunião está no histórico do git (antes de 2026-11-27).
import { temAcesso } from './apresentacao/acesso'
import { ehAdmin } from './apresentacao/fotos'
import Cadeado from './apresentacao/Cadeado'
import { lerPortal, PUBLICO, PASTA } from './dados'
import PortalParceria from './PortalParceria'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Sirius Park × RL Photo · Video', robots: { index: false, follow: false } }

export default async function Page() {
  const admin = await ehAdmin()
  if (!admin && !(await temAcesso())) return <Cadeado titulo="portal" voltar={false} />
  const dados = await lerPortal()
  return <PortalParceria dados={dados} admin={admin} fotosEspaco={`${PUBLICO}${PASTA}/espaco/`} />
}
