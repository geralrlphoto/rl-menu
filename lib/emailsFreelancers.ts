// Emails aos freelancers (cards em imagem). Partilhados entre as rotas de envio e a
// pré-visualização da página Tickets (/api/jornada/email).

/** "Tens novidades no portal": novo evento na ficha do freelancer (send-freelancer-notification). */
export function emailNovidadesFreelancer(freelancerId: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0d0901;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0901;padding:32px 16px;">
    <tr>
      <td align="center">
        <a href="https://portal.rlphotovideo.pt/freelancers/${freelancerId}?view=freelancer" style="display:block;text-decoration:none;">
          <img src="https://portal.rlphotovideo.pt/card_novo_evento.png"
            width="560" alt="Tens novidades no portal"
            style="display:block;width:100%;max-width:560px;border:0;" />
        </a>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/** "Briefing disponível": briefing enviado à equipa do evento (briefing-equipa). */
export function emailNovoBriefing(site: string, freelancerId: string): string {
  const CARD_URL = `${site}/card-novo-briefing.png`
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0d0901;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0901;padding:32px 16px;">
    <tr>
      <td align="center">
        <a href="${site}/freelancers/${freelancerId}?view=freelancer" style="display:block;text-decoration:none;">
          <img src="${CARD_URL}"
            width="560" alt="Novo Briefing disponível"
            style="display:block;width:100%;max-width:560px;border:0;" />
        </a>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/** "Trabalho de edição": trabalho enviado aos editores de vídeo (relatorio-editores). */
export function emailTrabalhoEdicao(site: string, editorId: string): string {
  const CARD_URL = `${site}/card-trabalho-edicao.png`
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0d0901;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0901;padding:32px 16px;">
    <tr>
      <td align="center">
        <a href="${site}/painel-editor?freelancer=${editorId}" style="display:block;text-decoration:none;">
          <img src="${CARD_URL}" width="560" alt="Novo trabalho de edição"
            style="display:block;width:100%;max-width:560px;border:0;" />
        </a>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/** "Nova edição de fotos": edição de fotos atribuída a um freelancer (send-edicao-fotos-email). */
export function emailEdicaoFotos(portalUrl: string, nome_noivos?: string | null, referencia?: string | null): string {
  const IMG_URL = 'https://portal.rlphotovideo.pt/card-edicao-fotos.png'
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0d0901;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0901;padding:32px 16px;">
    <tr>
      <td align="center">
        <a href="${portalUrl}" style="display:block;text-decoration:none;">
          <img src="${IMG_URL}"
            width="320" alt="Nova edição de fotos"
            style="display:block;width:100%;max-width:320px;border:0;" />
        </a>
        ${nome_noivos || referencia ? `
        <p style="margin:18px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:13px;color:#a09070;letter-spacing:0.05em;">
          ${nome_noivos ?? ''}${nome_noivos && referencia ? ' &middot; ' : ''}${referencia ?? ''}
        </p>` : ''}
      </td>
    </tr>
  </table>
</body>
</html>`
}

/** "Recebemos a tua candidatura": confirmação ao candidato a freelancer (send-admin-notification). */
export function emailCandidatura(adminUrl: string): string {
  return `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Candidatura Recebida</title></head>
<body style="margin:0;padding:0;background:#0e0c07;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0c07;">
  <tr><td align="center" style="padding:32px 20px;">
    <img src="${adminUrl}/card-freelancer-obrigado.png" width="560" alt="Recebemos a tua candidatura" style="display:block;max-width:100%;border:0;"/>
  </td></tr>
</table>
</body>
</html>`
}
