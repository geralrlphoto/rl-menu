/* Cartão de contacto (vCard) do botão "Guardar contacto" da página de boas-vindas. */

const VCARD = [
  'BEGIN:VCARD',
  'VERSION:3.0',
  'N:;RL Photo.Video;;;',
  'FN:RL Photo.Video',
  'ORG:RL Photo.Video',
  'TEL;TYPE=CELL:+351912932768',
  'EMAIL;TYPE=WORK:geral@rlphotovideo.pt',
  'URL:https://rlphotovideo.pt',
  'URL:https://rlprod.pt',
  'X-SOCIALPROFILE;TYPE=instagram:https://www.instagram.com/rlphoto_fotografia.video/',
  'END:VCARD',
].join('\r\n')

export function GET() {
  return new Response(VCARD, {
    headers: {
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': 'attachment; filename="RL Photo.Video.vcf"',
    },
  })
}
