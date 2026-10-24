'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Barra por cima da credencial (não sai na impressão): projeto e "Descarregar PDF"

export default function BarraCredencial({ id, nome, opcoes, atual }: { id: string; nome: string; opcoes: { ref: string; nome: string }[]; atual: string | null }) {
  const router = useRouter()
  return (
    <div className="print:hidden max-w-xl mx-auto px-4 pt-8 pb-6">
      <Link href={`/media/equipa/${id}`} className="text-[12px] text-white/45 hover:text-white">‹ Ficha de {nome}</Link>
      <h1 className="rlp-t mt-4 text-[40px] leading-none">Credencial.</h1>
      <p className="mt-2 text-[13.5px] text-white/55">Tamanho A6 (105 × 148 mm), para a bolsa da fita. Em "Descarregar PDF", escolhe <b className="text-white">Guardar como PDF</b> e deixa as margens em <b className="text-white">Nenhuma</b>.</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {opcoes.length > 0 ? (
          <select value={atual ?? ''} onChange={e => router.replace(`/media/equipa/${id}/credencial?projeto=${encodeURIComponent(e.target.value)}`)}
            className="rounded-full border border-white/[0.16] bg-[#00141f] px-4 py-2.5 text-[13.5px] text-white focus:outline-none focus:border-[#2e6cf6] [color-scheme:dark]">
            {opcoes.map(o => <option key={o.ref} value={o.ref}>{o.nome}</option>)}
          </select>
        ) : <span className="text-[13px] text-white/50">Ainda sem projetos: a credencial sai sem cliente.</span>}
        <button type="button" onClick={() => window.print()}
          className="rounded-full bg-[#2e6cf6] hover:bg-[#5a8bff] px-6 py-2.5 text-[13.5px] font-medium">Descarregar PDF</button>
      </div>
    </div>
  )
}
