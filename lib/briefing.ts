// Briefing pré-casamento (substitui o Tally "BRIEFING PRÉ CASAMENTO").
// Os noivos respondem no link /preparacao/<id do evento>; as respostas ficam
// em preparacao_eventos.briefing e aparecem na ficha (Comunicação com os Noivos).

export type CampoBriefing = {
  key: string
  label: string
  tipo: 'texto' | 'longo' | 'hora' | 'opcoes' | 'simnao'
  opcoes?: string[]
  obrigatorio: boolean
  placeholder?: string
  detalhe?: string // simnao: texto do campo que abre quando é "Sim"
}

export const CAMPOS_BRIEFING: CampoBriefing[] = [
  { key: 'nome_noivos', label: 'Nome dos noivos', tipo: 'texto', obrigatorio: true },
  { key: 'local_cerimonia', label: 'Local da cerimónia', tipo: 'texto', obrigatorio: true },
  { key: 'hora_cerimonia', label: 'Hora da cerimónia', tipo: 'hora', obrigatorio: true },
  { key: 'celebracao', label: 'Tipo de celebração', tipo: 'opcoes', opcoes: ['Civil', 'Religiosa'], obrigatorio: true },
  { key: 'morada_prep_noivo', label: 'Morada da preparação do noivo', tipo: 'texto', obrigatorio: true },
  { key: 'contacto_alt_noivo', label: 'Contacto alternativo ao noivo', tipo: 'texto', obrigatorio: true, placeholder: 'Nome e telemóvel' },
  { key: 'morada_prep_noiva', label: 'Morada da preparação da noiva', tipo: 'texto', obrigatorio: true },
  { key: 'contacto_alt_noiva', label: 'Contacto alternativo à noiva', tipo: 'texto', obrigatorio: true, placeholder: 'Nome e telemóvel' },
  { key: 'entrada_noivo', label: 'Como vai ser feita a entrada do noivo na cerimónia?', tipo: 'longo', obrigatorio: true },
  { key: 'entrada_noiva', label: 'Como vai ser feita a entrada da noiva na cerimónia?', tipo: 'longo', obrigatorio: true },
  { key: 'equipa_animacao', label: 'Equipa de animação', tipo: 'texto', obrigatorio: true, placeholder: 'Nome da equipa (ou "Não temos")' },
  { key: 'jogos', label: 'Jogos durante o dia?', tipo: 'simnao', obrigatorio: true, detalhe: 'Que jogos e em que momento?' },
  { key: 'danca', label: 'Dança', tipo: 'simnao', obrigatorio: true, detalhe: 'Que música e a que hora, aproximadamente?' },
  { key: 'bolo', label: 'Corte do bolo', tipo: 'simnao', obrigatorio: true, detalhe: 'A que hora, aproximadamente?' },
  { key: 'outras', label: 'Outras informações', tipo: 'longo', obrigatorio: false, placeholder: 'Tudo o que achem importante sabermos' },
]

export type RespostasBriefing = Record<string, string>

/* Devolve a lista de campos obrigatórios por preencher (vazia = pode enviar) */
export function emFaltaBriefing(r: RespostasBriefing): string[] {
  return CAMPOS_BRIEFING
    .filter(c => c.obrigatorio && !(r[c.key] ?? '').trim())
    .map(c => c.label)
}

/* Só guarda as chaves conhecidas, como texto e com tamanho limitado */
export function limparBriefing(entrada: unknown): RespostasBriefing {
  const r: RespostasBriefing = {}
  const src = (entrada && typeof entrada === 'object') ? entrada as Record<string, unknown> : {}
  for (const c of CAMPOS_BRIEFING) {
    for (const k of [c.key, `${c.key}_detalhe`]) {
      const v = src[k]
      if (typeof v === 'string' && v.trim()) r[k] = v.trim().slice(0, 2000)
    }
  }
  return r
}

/* Texto de uma resposta para mostrar (junta Sim/Não com o detalhe) */
export function valorBriefing(c: CampoBriefing, r: RespostasBriefing): string {
  const v = r[c.key] ?? ''
  if (c.tipo === 'simnao' && v === 'Sim' && r[`${c.key}_detalhe`]) return `Sim · ${r[`${c.key}_detalhe`]}`
  return v
}
