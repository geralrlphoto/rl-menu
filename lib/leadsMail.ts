/* Leads do Casamentos.pt que chegam por email ao Gmail. O texto vem sempre com o mesmo formato:
   "O utilizador <nome> colocou-se em contacto...", a mensagem e as linhas Data Evento, Email e Telefone. */

export type LeadMail = { nome: string; email: string; contato: string; dataCasamento: string; mensagem: string }

export function lerEmailCasamentos(texto: string): LeadMail | null {
  const t = (texto ?? '').replace(/\r/g, '')
  const nome = (t.match(/O utilizador\s+([\s\S]+?)\s+colocou-se/)?.[1] ?? '').replace(/\s+/g, ' ').trim()
  const email = (t.match(/Email:\s*<?([^\s<>]+@[^\s<>]+)/i)?.[1] ?? '').toLowerCase()
  const contato = (t.match(/Telefone:[ \t]*([+\d][\d \t.()-]*)/i)?.[1] ?? '').trim()
  const d = t.match(/Data Evento:\s*(\d{2})\/(\d{2})\/(\d{4})/i)
  // Há dois formatos: depois da mensagem vem "Setor:" ou "À procura de:" (com o que os noivos procuram)
  const corpo = t.match(/seus serviços\.\s*([\s\S]*?)\s*(?:Setor|À procura de|Data Evento):/i)?.[1] ?? ''
  const pedido = corpo.replace(/^\d{2}\/\d{2}\/\d{2,4}\s+\d{2}:\d{2}\s*/, '').trim()
  const procura = (t.match(/(À procura de:[\s\S]*?)\s*Data Evento:/i)?.[1] ?? '').trim()
  const mensagem = [pedido, procura].filter(Boolean).join('\n\n')
  if (!nome || (!email && !contato)) return null
  return { nome, email, contato, dataCasamento: d ? `${d[3]}-${d[2]}-${d[1]}` : '', mensagem }
}

// Para comparar com as leads que já existem (com ou sem indicativo)
export const chaveTelefone = (v: string | null | undefined) => (v ?? '').replace(/\D/g, '').slice(-9)

// Número português (9 dígitos) ou com indicativo; o resto não abre no WhatsApp sem o corrigir
export function telefoneDuvidoso(v: string): boolean {
  const limpo = v.replace(/[^\d+]/g, '')
  return !/^(\+|00)/.test(limpo) && limpo.length !== 9
}
