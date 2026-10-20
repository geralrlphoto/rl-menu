import { buildBilheteNoivos, blocoDestaque, esc, nomesBilhete } from './bilheteNoivos'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://portal.rlphotovideo.pt'
const eur = (n: number) => `${Number(n).toFixed(2)} €`

// Comprovativo de pagamento no layout do bilhete dos noivos (lib/bilheteNoivos.ts).
// O MESMO card é enviado ao admin e à noiva.
export function cardPagamento(o: any): string {
  const batizado = /^BAT/i.test(String(o.referencia ?? ''))
  const comprovativo = o.comprovativo_url ? `
  <div style="height:22px;font-size:0;line-height:0;">&nbsp;</div>
  <p style="margin:0 0 10px;text-align:center;font-family:'Space Mono','Courier New',monospace;font-size:10px;letter-spacing:.3em;color:#d8be93;">COMPROVATIVO ANEXADO</p>
  <a href="${esc(o.comprovativo_url)}" target="_blank"><img src="${esc(o.comprovativo_url)}" alt="Comprovativo" width="432" style="display:block;width:100%;max-width:432px;border:1px solid rgba(216,190,147,.3);border-radius:12px;"></a>` : ''
  return buildBilheteNoivos({
    pill: 'Comprovativo de pagamento',
    nomes: nomesBilhete(o.nome_noivos) || String(o.nome_noivos ?? ''),
    tipo: batizado ? 'batizado' : 'casamento',
    frase: 'Este documento confirma o pagamento efetuado. Obrigado pela vossa confiança.',
    campos: [
      { k: 'Referência', v: o.referencia || '', mono: true },
      { k: 'Fase', v: o.fase || '' },
      { k: 'Método', v: o.metodo || '', mono: true },
      { k: 'Data', v: o.data || '', mono: true },
    ],
    extra: blocoDestaque('Valor pago', eur(o.valor), true) + comprovativo,
    cta: { label: 'Abrir o nosso portal', url: `${SITE}/${batizado ? 'login-batizado' : 'login-noivos'}` },
    preheader: `Pagamento de ${eur(o.valor)} recebido.`,
  })
}
