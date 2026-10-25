'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Barra por cima das credenciais do projeto (não sai na impressão)

export default function BarraCredenciais({ refProjeto, nomeProjeto, equipa, atual }: {
  refProjeto: string; nomeProjeto: string; equipa: { id: string; nome: string }[]; atual: string | null
}) {
  const router = useRouter()
  const base = `/media/credenciais/${encodeURIComponent(refProjeto)}`
  return (
    <div className="print:hidden max-w-2xl mx-auto px-4 pt-8 pb-8">
      <Link href={`/portal-media/${refProjeto}/equipa`} className="text-[12px] text-white/45 hover:text-white">‹ Equipa do projeto</Link>
      <p className="rlp-m traco mt-5 text-[10px] text-[#5a8bff]">RL Prod · {nomeProjeto}</p>
      <h1 className="rlp-t mt-2 text-[40px] leading-none">Credenciais.</h1>
      <p className="mt-2 text-[13.5px] text-white/55">
        Uma credencial por pessoa do staff deste projeto, em A6 (105 × 148 mm), frente e verso. Em &quot;Descarregar PDF&quot;, escolhe <b className="text-white">Guardar como PDF</b> e deixa as margens em <b className="text-white">Nenhuma</b>.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {equipa.length > 1 && (
          <select value={atual ?? ''} onChange={e => router.replace(e.target.value ? `${base}?membro=${e.target.value}` : base)}
            className="rounded-full border border-white/[0.16] bg-[#00141f] px-4 py-2.5 text-[13.5px] text-white focus:outline-none focus:border-[#2e6cf6] [color-scheme:dark]">
            <option value="">Toda a equipa ({equipa.length})</option>
            {equipa.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
        )}
        {equipa.length > 0 && (
          <button type="button" onClick={() => window.print()}
            className="rounded-full bg-[#2e6cf6] hover:bg-[#5a8bff] px-6 py-2.5 text-[13.5px] font-medium">Descarregar PDF</button>
        )}
      </div>
    </div>
  )
}
