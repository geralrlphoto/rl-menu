import { sbAdmin } from '@/lib/preparacao'
import Armazenamento from './Armazenamento'
import type { Disco } from './tipos'

export const metadata = { title: 'Armazenamento · RL' }
export const dynamic = 'force-dynamic'

/* Armazenamento: o que está guardado em cada disco externo.
   O Vercel não vê os discos: o robô do PC (scripts/indexar-disco.py --robo,
   tarefa "RL Armazenamento") lê-os e grava em armazenamento_discos.
   O botão Atualizar deixa um pedido que o robô apanha em ~2 minutos. */

async function discos(): Promise<Disco[] | null> {
  try {
    const { data, error } = await sbAdmin().from('armazenamento_discos')
      .select('disco, letra, tamanho, livre, atualizado, pedido_em, ligado, visto_em, dados')
      .order('disco')
    if (error) return null
    return (data ?? []).map(r => ({
      disco: r.disco, letra: r.letra ?? '?', tamanho: Number(r.tamanho ?? 0), livre: Number(r.livre ?? 0),
      atualizado: r.atualizado, pedido_em: r.pedido_em, ligado: !!r.ligado, visto_em: r.visto_em,
      pastas: r.dados?.pastas ?? [], ficheiros: r.dados?.ficheiros ?? [],
    }))
  } catch { return null }
}

export default async function ArmazenamentoPage() {
  return <Armazenamento discos={await discos()} />
}
