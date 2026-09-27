import { qualificarLead, QUALIFICACAO_UI } from '@/lib/crm'

/* Selo 🔥 Quente / 🌤 Morna / ❄️ Fria da lead, calculado do orçamento e da data
   (regras em lib/crm.ts › qualificarLead). Mostra-se só ao admin. */
export default function SeloQualificacao({ orcamento, dataCasamento, className = '' }: {
  orcamento: string | null | undefined
  dataCasamento: string | null | undefined
  className?: string
}) {
  const q = QUALIFICACAO_UI[qualificarLead(orcamento, dataCasamento)]
  return (
    <span title="Qualificação automática: orçamento + data do evento"
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold tracking-wider uppercase whitespace-nowrap ${q.classe} ${className}`}>
      <span aria-hidden="true">{q.icone}</span>{q.rotulo}
    </span>
  )
}
