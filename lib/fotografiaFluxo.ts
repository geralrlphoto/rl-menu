// Departamento de Fotografia (/edicao-fotografia): as fases de cada casamento,
// pela ordem em que acontecem, com o prazo de cada uma e onde fica guardado.
// Tudo vive em portais.settings (as mesmas chaves que a ficha do evento e o
// portal dos noivos já usam), por isso a ficha, o /photo e o portal ficam iguais.

export type EtapaFoto = 'sneakpeek' | 'galerias' | 'selecao' | 'escolha' | 'edicao' | 'entregue'

export const ETAPAS_FOTO: {
  k: EtapaFoto
  titulo: string
  enviada?: string           // chave em portais.settings com a data do envio
  url?: string               // chave com o link
  email?: string             // rota do email aos noivos
  prazo: string              // texto do prazo
}[] = [
  { k: 'sneakpeek', titulo: 'Sneak peek', enviada: 'sneakpeek_enviada', url: 'sneakpeek_url', prazo: '48 horas depois do casamento (só quem o tem nos serviços)' },
  { k: 'galerias', titulo: 'Galeria online', enviada: 'galerias_enviada', url: 'galerias_url', email: '/api/send-galerias-email', prazo: '7 dias depois do casamento' },
  { k: 'selecao', titulo: 'Fotos p/ seleção', enviada: 'selecao_enviada', url: 'selecao_url', email: '/api/send-selecao-email', prazo: '30 dias depois do casamento' },
  { k: 'escolha', titulo: 'Seleção dos noivos', prazo: 'Lembrar ao fim de 30 dias' },
  { k: 'edicao', titulo: 'Edição', prazo: '30 dias depois de chegar a seleção' },
  { k: 'entregue', titulo: 'Entregue', enviada: 'fotos_finais_enviada', url: 'fotos_finais_url', email: '/api/send-fotos-finais-email', prazo: '' },
]

/** O casamento tem sneak peek? ("Sneak Peak" nos serviços de fotografia ou do dia, na ficha) */
export const temSneakPeek = (...listas: unknown[]) =>
  listas.some(l => (Array.isArray(l) ? l : [l]).some(x => /sneak/i.test(String(x ?? ''))))

/** Mensagem do sneak peek aos noivos (WhatsApp): sem referência, sem emojis, sem "(Mensagem automática)". */
export function mensagemSneakPeek(nome: string, url: string) {
  return `Olá ${nome}!\n\nAinda com o coração cheio do vosso casamento, não conseguimos esperar: aqui ficam as primeiras fotografias do vosso dia.\n\n${url}\n\nA galeria completa chega nos próximos dias. Esperamos que gostem tanto quanto nós gostámos de as fazer!\n\nUm abraço,\nRL Photo.Video`
}

const mais = (iso: string, dias: number) => new Date(new Date(iso.slice(0, 10) + 'T12:00:00Z').getTime() + dias * 86400000).toISOString().slice(0, 10)

/**
 * Em que fase está um casamento e qual o prazo dessa fase.
 * `s` = portais.settings; `escolhaRecebida` = data em que chegou a seleção dos noivos.
 */
export function faseFoto(dataCasamento: string, s: Record<string, any>, escolhaRecebida: string | null, selEstado?: string | null, comSneakPeek = false) {
  const feito = (k?: string) => !!(k && s[k])
  const selecaoFeita = feito('selecao_enviada') || /entreg/i.test(selEstado ?? '')
  const entregue = feito('fotos_finais_enviada')
  const recebida = escolhaRecebida || (typeof s.selecao_recebida === 'string' ? s.selecao_recebida.slice(0, 10) : null)
  const depois = { galerias: feito('galerias_enviada') || selecaoFeita || !!recebida || entregue }
  let fase: EtapaFoto
  let prazo: string | null = null
  if (entregue) fase = 'entregue'
  else if (comSneakPeek && !feito('sneakpeek_enviada') && !s.sneakpeek_dispensado && !depois.galerias) { fase = 'sneakpeek'; prazo = mais(dataCasamento, 2) }
  else if (!depois.galerias) { fase = 'galerias'; prazo = mais(dataCasamento, 7) }
  else if (!selecaoFeita && !recebida) { fase = 'selecao'; prazo = mais(dataCasamento, 30) }
  else if (!recebida) { fase = 'escolha'; prazo = s.selecao_enviada ? mais(String(s.selecao_enviada), 30) : null }
  else { fase = 'edicao'; prazo = mais(recebida, 30) }
  return { fase, prazo, recebida }
}
