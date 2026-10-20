// Email "O vosso portal está aberto" enviado aos noivos/pais.
// Desde 2026-10-21 usa o bilhete dos noivos (lib/bilheteNoivos.ts): nomes e data
// sobre a foto, contagem, chave de acesso e botão para o portal.
import { buildBilheteNoivos, blocoChave, nomesBilhete } from './bilheteNoivos'

// "PATRÍCIA ISABEL" → "Patrícia"
export function primeiroNome(s?: string | null): string {
  const w = String(s ?? '').trim().split(/\s+/)[0] ?? ''
  return w ? w.charAt(0).toLocaleUpperCase('pt-PT') + w.slice(1).toLocaleLowerCase('pt-PT') : ''
}

function diasAte(iso?: string | null): number | null {
  const m = String(iso ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null
  const alvo = Date.UTC(+m[1], +m[2] - 1, +m[3])
  const hoje = new Date()
  const d = Math.round((alvo - Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())) / 86400000)
  return d > 0 ? d : null
}

export function buildPortalEmailV2(o: {
  tipo: 'casamento' | 'batizado'
  nomesAlt: string
  data?: string | null
  referencia?: string | null
  email: string
  password: string
  loginUrl: string
}): string {
  const dias = diasAte(o.data)
  const batizado = o.tipo === 'batizado'
  return buildBilheteNoivos({
    chave: 'portal',
    pill: 'O vosso portal',
    nomes: o.nomesAlt.includes('|') ? o.nomesAlt : nomesBilhete(o.nomesAlt) || o.nomesAlt,
    data: o.data,
    tipo: o.tipo,
    frase: batizado
      ? 'A partir de hoje, cada passo até ao grande dia vive num só lugar. Feito só para vocês.'
      : 'A partir de hoje, cada passo até ao vosso grande dia vive num só lugar. Feito só para vocês.',
    campos: [
      { k: 'Faltam', v: dias ? `${dias} ${dias === 1 ? 'dia' : 'dias'}` : '' },
      { k: 'Lá dentro', v: batizado ? 'Sessão, cronograma e filme' : 'Pré-wedding, cronograma e filme' },
      { k: 'Referência', v: o.referencia ?? '', mono: true },
      { k: 'Acesso', v: 'Email + chave', mono: true },
    ],
    extra: blocoChave(o.email, o.password),
    cta: { label: 'Abrir o nosso portal', url: o.loginUrl },
    preheader: `${o.nomesAlt.replace(' | ', ' e ')}, o vosso portal está aberto.`,
  })
}
