/* Cartão de contacto (vCard) do botão "Guardar contacto" da página de boas-vindas (RL Prod). */

const VCARD = [
  'BEGIN:VCARD',
  'VERSION:3.0',
  'N:;RL Prod;;;',
  'FN:RL Prod',
  'ORG:RL Prod',
  'TEL;TYPE=CELL:+351912932768',
  'EMAIL;TYPE=WORK:geral.rlprod@gmail.com',
  'URL:https://rlprod.pt',
  'X-SOCIALPROFILE;TYPE=instagram:https://www.instagram.com/rl_prod_audiovisual/',
  'END:VCARD',
].join('\r\n')

export function GET() {
  return new Response(VCARD, {
    headers: {
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': 'attachment; filename="RL Prod.vcf"',
    },
  })
}
