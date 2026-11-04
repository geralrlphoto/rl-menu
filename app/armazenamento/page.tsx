import { DISCOS } from './discos'
import Armazenamento from './Armazenamento'

export const metadata = { title: 'Armazenamento · RL' }

/* Armazenamento: o que está guardado em cada disco externo.
   O Vercel não vê os discos, por isso o índice é gerado no PC com
   `python scripts/indexar-disco.py J` e vai no deploy (app/armazenamento/discos). */

export default function ArmazenamentoPage() {
  return <Armazenamento discos={DISCOS} />
}
