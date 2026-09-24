// Sincroniza o briefing pré-casamento (respostas dos noivos em /preparacao/<id>)
// com a sub-página BRIEFING do portal dos noivos (portais.settings).
//
// Regras:
//  - só acrescenta: nunca apaga nem altera o que o admin escreveu no portal;
//  - os itens criados aqui têm id "bf-…"; numa nova sincronização só esses são substituídos;
//  - se o admin já tiver um item equivalente (mesmo título/etiqueta), não duplica.
import { sbAdmin } from '@/lib/preparacao'
import type { RespostasBriefing } from '@/lib/briefing'

/* Página BRIEFING do modelo do portal (Notion); o portal guarda os dados por este id */
export const BRIEFING_PAGE_ID = '32c22011-6d8a-803e-9167-edd1d0637292'

type Item = { id: string; [k: string]: any }
type Ficha = { id: string; label: string; value: string }

const norm = (s: unknown) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()
const ehNosso = (it: { id?: string }) => String(it?.id ?? '').startsWith('bf-')

/* Hora dentro de um texto livre ("às 22h", "23:30") → "22:00" / "23:30" */
function horaDe(txt?: string): string | null {
  const m = (txt ?? '').match(/\b([01]?\d|2[0-3])\s*(?:[:h]\s*([0-5]\d)?)\b/i)
  return m ? `${m[1].padStart(2, '0')}:${m[2] ?? '00'}` : null
}
const TEL_RE = /(\+?\d[\d\s]{7,}\d)/
const tel = (txt?: string) => ((txt ?? '').match(TEL_RE)?.[1] ?? '').replace(/\s+/g, '')
/* "João 912 345 678" → "João" (o número vai para o campo telefone) */
const semTel = (txt: string) => txt.replace(TEL_RE, '').replace(/[\s,;:/()-]+$/, '').trim() || txt

/* Junta os itens gerados à lista do admin: tira os "bf-" antigos e não repete o que o admin já tem */
function juntar(lista: Item[] | undefined, novos: Item[], chave: string): Item[] {
  const doAdmin = (lista ?? []).filter(it => !ehNosso(it))
  const jaTem = new Set(doAdmin.map(it => norm(it[chave])))
  return [...doAdmin, ...novos.filter(n => !jaTem.has(norm(n[chave])))]
}

function juntarFicha(atual: Ficha[] | undefined, novos: Ficha[]): Ficha[] {
  const base = atual ?? [{ id: 'nome', label: 'Nome', value: '' }, { id: 'contato', label: 'Contacto', value: '' }]
  const doAdmin = base.filter(f => !ehNosso(f))
  const jaTem = new Set(doAdmin.filter(f => (f.value ?? '').trim()).map(f => norm(f.label)))
  return [...doAdmin, ...novos.filter(n => n.value && !jaTem.has(norm(n.label)))]
}

export async function sincronizarBriefingPortal(referencia: string | null | undefined, r: RespostasBriefing | null) {
  if (!referencia || !r) return { ok: false as const, motivo: 'sem dados' }
  const sb = sbAdmin()
  const { data: portal } = await sb.from('portais').select('id, settings').eq('referencia', referencia).maybeSingle()
  if (!portal) return { ok: false as const, motivo: 'sem portal' }

  const settings = (portal.settings ?? {}) as Record<string, any>
  const bi = { ...((settings.briefingInfo ?? {})[BRIEFING_PAGE_ID] ?? {}) }
  const v = (k: string) => (r[k] ?? '').trim()

  // Cronograma
  const crono: Item[] = []
  if (v('hora_cerimonia')) crono.push({ id: 'bf-cerimonia', time: v('hora_cerimonia'), title: 'Cerimónia', location: v('local_cerimonia') })
  const hDanca = v('danca') === 'Sim' ? horaDe(r.danca_detalhe) : null
  if (hDanca) crono.push({ id: 'bf-danca', time: hDanca, title: 'Primeira dança', location: v('local_festa') })
  const hBolo = v('bolo') === 'Sim' ? horaDe(r.bolo_detalhe) : null
  if (hBolo) crono.push({ id: 'bf-bolo', time: hBolo, title: 'Corte do bolo', location: v('local_festa') })

  // Mapas
  const mapas: Item[] = [
    { id: 'bf-prep-noivo', label: 'Preparação do noivo', address: v('morada_prep_noivo') },
    { id: 'bf-prep-noiva', label: 'Preparação da noiva', address: v('morada_prep_noiva') },
    { id: 'bf-cerimonia', label: 'Cerimónia', address: v('local_cerimonia'), time: v('hora_cerimonia') },
    { id: 'bf-festa', label: 'Festa', address: v('local_festa') },
  ].filter(m => m.address)

  // Momentos
  const celebracao = v('celebracao') === 'Civil'
    ? `Cerimónia civil${v('celebracao_civil') ? ` · ${v('celebracao_civil') === 'Outro' ? v('celebracao_civil_outro') || 'Outro' : v('celebracao_civil')}` : ''}`
    : v('celebracao') === 'Religiosa' ? 'Cerimónia religiosa' : ''
  const detalhe = (k: string) => v(`${k}_detalhe`) ? `: ${v(`${k}_detalhe`)}` : ''
  const momentos: Item[] = [
    celebracao && { id: 'bf-celebracao', label: celebracao },
    v('votos') === 'Sim' && { id: 'bf-votos', label: 'Votos dos noivos' },
    v('jogos') === 'Sim' && { id: 'bf-jogos', label: `Jogos${detalhe('jogos')}` },
    v('danca') === 'Sim' && { id: 'bf-danca', label: `Primeira dança${detalhe('danca')}` },
    v('bolo') === 'Sim' && { id: 'bf-bolo', label: `Corte do bolo${detalhe('bolo')}` },
  ].filter(Boolean) as Item[]

  // Contactos
  const semAnimacao = /^n[aã]o\b|n[aã]o temos|nenhum/i.test(v('equipa_animacao'))
  const contactos: Item[] = [
    v('contacto_alt_noivo') && { id: 'bf-alt-noivo', role: 'Contacto alternativo (noivo)', name: semTel(v('contacto_alt_noivo')), phone: tel(v('contacto_alt_noivo')) },
    v('contacto_alt_noiva') && { id: 'bf-alt-noiva', role: 'Contacto alternativo (noiva)', name: semTel(v('contacto_alt_noiva')), phone: tel(v('contacto_alt_noiva')) },
    v('equipa_animacao') && !semAnimacao && { id: 'bf-animacao', role: 'Animação', name: v('equipa_animacao') },
  ].filter(Boolean) as Item[]

  bi.cronograma = juntar(bi.cronograma, crono, 'title')
  bi.mapas = juntar(bi.mapas, mapas, 'label')
  bi.momentos = juntar(bi.momentos, momentos, 'label')
  bi.contactos = juntar(bi.contactos, contactos, 'role')
  bi.historico = [...(bi.historico ?? []), { at: new Date().toISOString(), who: 'Briefing dos noivos', action: 'Sincronizado com as respostas do briefing' }].slice(-100)

  // Fichas individuais NOIVO / NOIVA
  const fichas = { ...(settings.briefingFichas ?? {}) }
  fichas.NOIVO = juntarFicha(fichas.NOIVO, [
    { id: 'bf-prep', label: 'Local preparação', value: v('morada_prep_noivo') },
    { id: 'bf-alt', label: 'Contacto familiar', value: v('contacto_alt_noivo') },
    { id: 'bf-entrada', label: 'Entrada na cerimónia', value: v('entrada_noivo') },
  ])
  fichas.NOIVA = juntarFicha(fichas.NOIVA, [
    { id: 'bf-prep', label: 'Local preparação', value: v('morada_prep_noiva') },
    { id: 'bf-alt', label: 'Contacto familiar', value: v('contacto_alt_noiva') },
    { id: 'bf-entrada', label: 'Entrada na cerimónia', value: v('entrada_noiva') },
  ])

  const novoSettings = {
    ...settings,
    briefingInfo: { ...(settings.briefingInfo ?? {}), [BRIEFING_PAGE_ID]: bi },
    briefingFichas: fichas,
  }
  const { error } = await sb.from('portais').update({ settings: novoSettings, updated_at: new Date().toISOString() }).eq('id', portal.id)
  if (error) return { ok: false as const, motivo: error.message }
  return { ok: true as const }
}
