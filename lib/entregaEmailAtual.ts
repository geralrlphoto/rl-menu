// Emails de entrega aos noivos tal como estão hoje nas rotas app/api/send-<tipo>-email
// (cópia fiel do HTML dessas rotas), só para a pré-visualização na página Tickets.
// Quando as rotas passarem a usar lib/entregaEmail.ts, a pré-visualização deve usar
// buildEntregaEmailHtml e este ficheiro pode ser apagado.

export type EntregaAtual = 'selecao' | 'galerias' | 'fotos_finais' | 'prewedding' | 'maquete' | 'wedding_film' | 'teaser' | 'same_day_edit' | 'video_prewedding'

export const ENTREGAS_ATUAIS: Record<EntregaAtual, { assunto: string; html: (nomes: string) => string }> = {
  selecao: {
    assunto: 'As vossas fotos estão prontas para seleção',
    html: nomes => `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0e0b06;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0b06;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;border:1px solid #7a6340;background:#110e08;">
          <tr>
            <td style="padding:56px 48px 48px;font-family:Georgia,'Times New Roman',serif;text-align:center;">

              <!-- Greeting -->
              <p style="margin:0 0 24px;font-size:17px;font-style:italic;color:#c9a96e;letter-spacing:0.02em;">
                Olá, ${nomes}!
              </p>

              <!-- Main heading -->
              <h1 style="margin:0;font-size:40px;font-weight:400;color:#ffffff;line-height:1.15;letter-spacing:-0.01em;">
                As vossas fotos
              </h1>
              <h1 style="margin:0 0 20px;font-size:40px;font-weight:400;font-style:italic;color:#c9a96e;line-height:1.15;">
                estão prontas.
              </h1>

              <!-- Subtitle -->
              <p style="margin:0 0 32px;font-size:14px;color:#b0a080;letter-spacing:0.01em;">
                Esperamos que esteja tudo bem convosco.
              </p>

              <!-- Divider -->
              <div style="margin:0 0 32px;color:#7a6340;font-size:14px;letter-spacing:0.3em;">
                &#8212;&nbsp;&nbsp;·&nbsp;◆&nbsp;·&nbsp;&nbsp;&#8212;
              </div>

              <!-- Body text -->
              <p style="margin:0 0 14px;font-size:15px;color:#d4c9b0;line-height:1.7;text-align:center;">
                As <strong style="color:#ffffff;">fotos para seleção</strong> já estão disponíveis.
              </p>
              <p style="margin:0 0 36px;font-size:15px;color:#d4c9b0;line-height:1.7;text-align:center;">
                Consultem o vosso <strong style="color:#ffffff;">Portal dos Noivos</strong><br>para escolherem as vossas favoritas.
              </p>

              <!-- CTA Box -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 48px;border:1px solid #7a6340;width:100%;max-width:400px;">
                <tr>
                  <td style="padding:24px 32px;text-align:center;">
                    <p style="margin:0 0 10px;font-size:9px;letter-spacing:0.4em;color:#8a7450;text-transform:uppercase;">
                      NO VOSSO PORTAL
                    </p>
                    <p style="margin:0;font-size:20px;font-style:italic;color:#c9a96e;letter-spacing:0.02em;">
                      Fotografias &rarr; Galeria Fotos p/ Seleção
                    </p>
                  </td>
                </tr>
              </table>


              <!-- Footer -->
              <p style="margin:0;font-size:9px;letter-spacing:0.35em;color:#5a4f3a;text-transform:uppercase;">
                RL PHOTO &middot; VIDEO
              </p>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },
  galerias: {
    assunto: 'As fotos do dia já estão disponíveis',
    html: nomes => `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0e0b06;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0b06;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;border:1px solid #7a6340;background:#110e08;">
          <tr>
            <td style="padding:56px 48px 48px;font-family:Georgia,'Times New Roman',serif;text-align:center;">

              <!-- Greeting -->
              <p style="margin:0 0 24px;font-size:17px;font-style:italic;color:#c9a96e;letter-spacing:0.02em;">
                Olá, ${nomes}!
              </p>

              <!-- Main heading -->
              <h1 style="margin:0;font-size:40px;font-weight:400;color:#ffffff;line-height:1.15;letter-spacing:-0.01em;">
                As fotos do dia
              </h1>
              <h1 style="margin:0 0 20px;font-size:40px;font-weight:400;font-style:italic;color:#c9a96e;line-height:1.15;">
                já estão disponíveis.
              </h1>

              <!-- Subtitle -->
              <p style="margin:0 0 32px;font-size:14px;color:#b0a080;letter-spacing:0.01em;">
                Esperamos que esteja tudo bem convosco.
              </p>

              <!-- Divider -->
              <div style="margin:0 0 32px;color:#7a6340;font-size:14px;letter-spacing:0.3em;">
                &#8212;&nbsp;&nbsp;·&nbsp;◆&nbsp;·&nbsp;&nbsp;&#8212;
              </div>

              <!-- Body text -->
              <p style="margin:0 0 14px;font-size:15px;color:#d4c9b0;line-height:1.7;text-align:center;">
                As <strong style="color:#ffffff;">fotografias do vosso dia</strong> já estão prontas<br>para partilharem com os vossos <strong style="color:#ffffff;">convidados</strong>.
              </p>
              <p style="margin:0 0 36px;font-size:15px;color:#d4c9b0;line-height:1.7;text-align:center;">
                Acedam ao vosso <strong style="color:#ffffff;">Portal dos Noivos</strong><br>para verem e enviarem.
              </p>

              <!-- CTA Box -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 48px;border:1px solid #7a6340;width:100%;max-width:380px;">
                <tr>
                  <td style="padding:24px 32px;text-align:center;">
                    <p style="margin:0 0 10px;font-size:9px;letter-spacing:0.4em;color:#8a7450;text-transform:uppercase;">
                      NO VOSSO PORTAL
                    </p>
                    <p style="margin:0;font-size:22px;font-style:italic;color:#c9a96e;letter-spacing:0.02em;">
                      Fotografias &rarr; Fotos do Dia
                    </p>
                  </td>
                </tr>
              </table>


              <!-- Footer -->
              <p style="margin:0;font-size:9px;letter-spacing:0.35em;color:#5a4f3a;text-transform:uppercase;">
                RL PHOTO &middot; VIDEO
              </p>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },
  fotos_finais: {
    assunto: 'As vossas fotos já estão editadas',
    html: nomes => `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0e0b06;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0b06;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;border:1px solid #7a6340;background:#110e08;">
          <tr>
            <td style="padding:56px 48px 48px;font-family:Georgia,'Times New Roman',serif;text-align:center;">

              <!-- Greeting -->
              <p style="margin:0 0 24px;font-size:17px;font-style:italic;color:#c9a96e;letter-spacing:0.02em;">
                Olá, ${nomes}!
              </p>

              <!-- Main heading -->
              <h1 style="margin:0;font-size:40px;font-weight:400;color:#ffffff;line-height:1.15;letter-spacing:-0.01em;">
                As vossas fotos
              </h1>
              <h1 style="margin:0 0 20px;font-size:40px;font-weight:400;font-style:italic;color:#c9a96e;line-height:1.15;">
                já estão editadas.
              </h1>

              <!-- Subtitle -->
              <p style="margin:0 0 32px;font-size:14px;color:#b0a080;letter-spacing:0.01em;">
                Esperamos que esteja tudo bem convosco.
              </p>

              <!-- Divider -->
              <div style="margin:0 0 32px;color:#7a6340;font-size:14px;letter-spacing:0.3em;">
                &#8212;&nbsp;&nbsp;·&nbsp;◆&nbsp;·&nbsp;&nbsp;&#8212;
              </div>

              <!-- Body text -->
              <p style="margin:0 0 14px;font-size:15px;color:#d4c9b0;line-height:1.7;text-align:center;">
                As vossas <strong style="color:#ffffff;">fotografias estão prontas</strong><br>e disponíveis para download.
              </p>
              <p style="margin:0 0 36px;font-size:15px;color:#d4c9b0;line-height:1.7;text-align:center;">
                Acedam ao vosso <strong style="color:#ffffff;">Portal dos Noivos</strong><br>para verem e descarregarem.
              </p>

              <!-- CTA Box -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 48px;border:1px solid #7a6340;width:100%;max-width:380px;">
                <tr>
                  <td style="padding:24px 32px;text-align:center;">
                    <p style="margin:0 0 10px;font-size:9px;letter-spacing:0.4em;color:#8a7450;text-transform:uppercase;">
                      NO VOSSO PORTAL
                    </p>
                    <p style="margin:0;font-size:22px;font-style:italic;color:#c9a96e;letter-spacing:0.02em;">
                      Fotografias &rarr; Fotos Editadas
                    </p>
                  </td>
                </tr>
              </table>


              <!-- Footer -->
              <p style="margin:0;font-size:9px;letter-spacing:0.35em;color:#5a4f3a;text-transform:uppercase;">
                RL PHOTO &middot; VIDEO
              </p>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },
  prewedding: {
    assunto: 'As vossas fotos pré-wedding estão prontas',
    html: nomes => `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0e0b06;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0b06;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;border:1px solid #7a6340;background:#110e08;">
          <tr>
            <td style="padding:56px 48px 48px;font-family:Georgia,'Times New Roman',serif;text-align:center;">

              <!-- Greeting -->
              <p style="margin:0 0 24px;font-size:17px;font-style:italic;color:#c9a96e;letter-spacing:0.02em;">
                Olá, ${nomes}!
              </p>

              <!-- Main heading -->
              <h1 style="margin:0;font-size:40px;font-weight:400;color:#ffffff;line-height:1.15;letter-spacing:-0.01em;">
                As vossas fotos
              </h1>
              <h1 style="margin:0;font-size:40px;font-weight:400;font-style:italic;color:#c9a96e;line-height:1.2;">
                pré-wedding
              </h1>
              <h1 style="margin:0 0 20px;font-size:40px;font-weight:400;font-style:italic;color:#c9a96e;line-height:1.15;">
                estão prontas.
              </h1>

              <!-- Subtitle -->
              <p style="margin:0 0 32px;font-size:14px;color:#b0a080;letter-spacing:0.01em;">
                Esperamos que esteja tudo bem convosco.
              </p>

              <!-- Divider -->
              <div style="margin:0 0 32px;color:#7a6340;font-size:14px;letter-spacing:0.3em;">
                &#8212;&nbsp;&nbsp;·&nbsp;◆&nbsp;·&nbsp;&nbsp;&#8212;
              </div>

              <!-- Body text -->
              <p style="margin:0 0 14px;font-size:15px;color:#d4c9b0;line-height:1.7;text-align:center;">
                A vossa <strong style="color:#ffffff;">sessão pré-wedding</strong> já está editada<br>e disponível para consulta.
              </p>
              <p style="margin:0 0 36px;font-size:15px;color:#d4c9b0;line-height:1.7;text-align:center;">
                Acedam ao vosso <strong style="color:#ffffff;">Portal dos Noivos</strong><br>para verem o resultado.
              </p>

              <!-- CTA Box -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 48px;border:1px solid #7a6340;width:100%;max-width:380px;">
                <tr>
                  <td style="padding:24px 32px;text-align:center;">
                    <p style="margin:0 0 10px;font-size:9px;letter-spacing:0.4em;color:#8a7450;text-transform:uppercase;">
                      NO VOSSO PORTAL
                    </p>
                    <p style="margin:0;font-size:22px;font-style:italic;color:#c9a96e;letter-spacing:0.02em;">
                      Fotografias &rarr; Pré-Wedding
                    </p>
                  </td>
                </tr>
              </table>


              <!-- Footer -->
              <p style="margin:0;font-size:9px;letter-spacing:0.35em;color:#5a4f3a;text-transform:uppercase;">
                RL PHOTO &middot; VIDEO
              </p>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },
  maquete: {
    assunto: 'A vossa maquete do álbum está pronta',
    html: nomes => `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0e0b06;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0b06;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;border:1px solid #7a6340;background:#110e08;">
          <tr>
            <td style="padding:56px 48px 48px;font-family:Georgia,'Times New Roman',serif;text-align:center;">

              <!-- Greeting -->
              <p style="margin:0 0 24px;font-size:17px;font-style:italic;color:#c9a96e;letter-spacing:0.02em;">
                Olá, ${nomes}!
              </p>

              <!-- Main heading -->
              <h1 style="margin:0;font-size:40px;font-weight:400;color:#ffffff;line-height:1.15;letter-spacing:-0.01em;">
                A vossa maquete
              </h1>
              <h1 style="margin:0 0 20px;font-size:40px;font-weight:400;font-style:italic;color:#c9a96e;line-height:1.15;">
                está pronta.
              </h1>

              <!-- Subtitle -->
              <p style="margin:0 0 32px;font-size:14px;color:#b0a080;letter-spacing:0.01em;">
                Esperamos que esteja tudo bem convosco.
              </p>

              <!-- Divider -->
              <div style="margin:0 0 32px;color:#7a6340;font-size:14px;letter-spacing:0.3em;">
                &#8212;&nbsp;&nbsp;·&nbsp;◆&nbsp;·&nbsp;&nbsp;&#8212;
              </div>

              <!-- Body text -->
              <p style="margin:0 0 14px;font-size:15px;color:#d4c9b0;line-height:1.7;text-align:center;">
                O vosso <strong style="color:#ffffff;">álbum está pronto para aprovação</strong>.
              </p>
              <p style="margin:0 0 36px;font-size:15px;color:#d4c9b0;line-height:1.7;text-align:center;">
                Consultem o vosso portal para ver a maquete.
              </p>

              <!-- CTA Box -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 48px;border:1px solid #7a6340;width:100%;max-width:360px;">
                <tr>
                  <td style="padding:24px 32px;text-align:center;">
                    <p style="margin:0 0 10px;font-size:9px;letter-spacing:0.4em;color:#8a7450;text-transform:uppercase;">
                      NO VOSSO PORTAL
                    </p>
                    <p style="margin:0;font-size:22px;font-style:italic;color:#c9a96e;letter-spacing:0.02em;">
                      Fotografias &rarr; Ver Maquete
                    </p>
                  </td>
                </tr>
              </table>


              <!-- Footer -->
              <p style="margin:0;font-size:9px;letter-spacing:0.35em;color:#5a4f3a;text-transform:uppercase;">
                RL PHOTO &middot; VIDEO
              </p>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },
  wedding_film: {
    assunto: 'O vosso Wedding Film está pronto',
    html: nomes => `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0e0b06;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0b06;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;border:1px solid #7a6340;background:#110e08;">
          <tr>
            <td style="padding:56px 48px 48px;font-family:Georgia,'Times New Roman',serif;text-align:center;">

              <p style="margin:0 0 24px;font-size:17px;font-style:italic;color:#c9a96e;letter-spacing:0.02em;">
                Olá, ${nomes}!
              </p>

              <h1 style="margin:0;font-size:40px;font-weight:400;color:#ffffff;line-height:1.15;letter-spacing:-0.01em;">
                O vosso
              </h1>
              <h1 style="margin:0;font-size:40px;font-weight:400;font-style:italic;color:#c9a96e;line-height:1.2;">
                Wedding Film
              </h1>
              <h1 style="margin:0 0 20px;font-size:40px;font-weight:400;font-style:italic;color:#c9a96e;line-height:1.15;">
                está pronto.
              </h1>

              <p style="margin:0 0 32px;font-size:14px;color:#b0a080;letter-spacing:0.01em;">
                Esperamos que esteja tudo bem convosco.
              </p>

              <div style="margin:0 0 32px;color:#7a6340;font-size:14px;letter-spacing:0.3em;">
                &#8212;&nbsp;&nbsp;·&nbsp;◆&nbsp;·&nbsp;&nbsp;&#8212;
              </div>

              <p style="margin:0 0 14px;font-size:15px;color:#d4c9b0;line-height:1.7;text-align:center;">
                O vosso <strong style="color:#ffffff;">Wedding Film</strong> já está editado<br>e disponível para visualizar.
              </p>
              <p style="margin:0 0 36px;font-size:15px;color:#d4c9b0;line-height:1.7;text-align:center;">
                Acedam ao vosso <strong style="color:#ffffff;">Portal dos Noivos</strong><br>para verem o resultado.
              </p>

              <table cellpadding="0" cellspacing="0" style="margin:0 auto 48px;border:1px solid #7a6340;width:100%;max-width:380px;">
                <tr>
                  <td style="padding:24px 32px;text-align:center;">
                    <p style="margin:0 0 10px;font-size:9px;letter-spacing:0.4em;color:#8a7450;text-transform:uppercase;">
                      NO VOSSO PORTAL
                    </p>
                    <p style="margin:0;font-size:22px;font-style:italic;color:#c9a96e;letter-spacing:0.02em;">
                      O Nosso Filme &rarr; Wedding Film
                    </p>
                  </td>
                </tr>
              </table>


              <p style="margin:0;font-size:9px;letter-spacing:0.35em;color:#5a4f3a;text-transform:uppercase;">
                RL PHOTO &middot; VIDEO
              </p>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },
  teaser: {
    assunto: 'O vosso Teaser está pronto',
    html: nomes => `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0e0b06;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0b06;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;border:1px solid #7a6340;background:#110e08;">
          <tr>
            <td style="padding:56px 48px 48px;font-family:Georgia,'Times New Roman',serif;text-align:center;">

              <p style="margin:0 0 24px;font-size:17px;font-style:italic;color:#c9a96e;letter-spacing:0.02em;">
                Olá, ${nomes}!
              </p>

              <h1 style="margin:0;font-size:40px;font-weight:400;color:#ffffff;line-height:1.15;letter-spacing:-0.01em;">
                O vosso
              </h1>
              <h1 style="margin:0;font-size:40px;font-weight:400;font-style:italic;color:#c9a96e;line-height:1.2;">
                Teaser está
              </h1>
              <h1 style="margin:0 0 20px;font-size:40px;font-weight:400;font-style:italic;color:#c9a96e;line-height:1.15;">
                pronto.
              </h1>

              <p style="margin:0 0 32px;font-size:14px;color:#b0a080;letter-spacing:0.01em;">
                Esperamos que esteja tudo bem convosco.
              </p>

              <div style="margin:0 0 32px;color:#7a6340;font-size:14px;letter-spacing:0.3em;">
                &#8212;&nbsp;&nbsp;·&nbsp;◆&nbsp;·&nbsp;&nbsp;&#8212;
              </div>

              <p style="margin:0 0 14px;font-size:15px;color:#d4c9b0;line-height:1.7;text-align:center;">
                O <strong style="color:#ffffff;">trailer do vosso casamento</strong><br>já está disponível para verem.
              </p>
              <p style="margin:0 0 36px;font-size:15px;color:#d4c9b0;line-height:1.7;text-align:center;">
                Um <strong style="color:#ffffff;">aperitivo da magia</strong> que foi<br>o vosso dia. Acedam ao vosso <strong style="color:#ffffff;">Portal</strong>.
              </p>

              <table cellpadding="0" cellspacing="0" style="margin:0 auto 48px;border:1px solid #7a6340;width:100%;max-width:380px;">
                <tr>
                  <td style="padding:24px 32px;text-align:center;">
                    <p style="margin:0 0 10px;font-size:9px;letter-spacing:0.4em;color:#8a7450;text-transform:uppercase;">
                      NO VOSSO PORTAL
                    </p>
                    <p style="margin:0;font-size:22px;font-style:italic;color:#c9a96e;letter-spacing:0.02em;">
                      O Nosso Filme &rarr; Teaser / Trailer
                    </p>
                  </td>
                </tr>
              </table>


              <p style="margin:0;font-size:9px;letter-spacing:0.35em;color:#5a4f3a;text-transform:uppercase;">
                RL PHOTO &middot; VIDEO
              </p>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },
  same_day_edit: {
    assunto: 'O vosso Same Day Edit está pronto',
    html: nomes => `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0e0b06;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0b06;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;border:1px solid #7a6340;background:#110e08;">
          <tr>
            <td style="padding:56px 48px 48px;font-family:Georgia,'Times New Roman',serif;text-align:center;">

              <p style="margin:0 0 24px;font-size:17px;font-style:italic;color:#c9a96e;letter-spacing:0.02em;">
                Olá, ${nomes}!
              </p>

              <h1 style="margin:0;font-size:40px;font-weight:400;color:#ffffff;line-height:1.15;letter-spacing:-0.01em;">
                O vosso
              </h1>
              <h1 style="margin:0;font-size:40px;font-weight:400;font-style:italic;color:#c9a96e;line-height:1.2;">
                Same Day Edit
              </h1>
              <h1 style="margin:0 0 20px;font-size:40px;font-weight:400;font-style:italic;color:#c9a96e;line-height:1.15;">
                está pronto.
              </h1>

              <p style="margin:0 0 32px;font-size:14px;color:#b0a080;letter-spacing:0.01em;">
                Esperamos que esteja tudo bem convosco.
              </p>

              <div style="margin:0 0 32px;color:#7a6340;font-size:14px;letter-spacing:0.3em;">
                &#8212;&nbsp;&nbsp;·&nbsp;◆&nbsp;·&nbsp;&nbsp;&#8212;
              </div>

              <p style="margin:0 0 14px;font-size:15px;color:#d4c9b0;line-height:1.7;text-align:center;">
                O <strong style="color:#ffffff;">vídeo editado no próprio dia</strong><br>do vosso casamento já está disponível.
              </p>
              <p style="margin:0 0 14px;font-size:15px;color:#d4c9b0;line-height:1.7;text-align:center;">
                Revivam a <strong style="color:#ffffff;">emoção daquele momento</strong>.
              </p>
              <p style="margin:0 0 36px;font-size:15px;color:#d4c9b0;line-height:1.7;text-align:center;">
                Acedam ao vosso <strong style="color:#ffffff;">Portal dos Noivos</strong>.
              </p>

              <table cellpadding="0" cellspacing="0" style="margin:0 auto 48px;border:1px solid #7a6340;width:100%;max-width:380px;">
                <tr>
                  <td style="padding:24px 32px;text-align:center;">
                    <p style="margin:0 0 10px;font-size:9px;letter-spacing:0.4em;color:#8a7450;text-transform:uppercase;">
                      NO VOSSO PORTAL
                    </p>
                    <p style="margin:0;font-size:22px;font-style:italic;color:#c9a96e;letter-spacing:0.02em;">
                      O Nosso Filme &rarr; Same Day Edit
                    </p>
                  </td>
                </tr>
              </table>


              <p style="margin:0;font-size:9px;letter-spacing:0.35em;color:#5a4f3a;text-transform:uppercase;">
                RL PHOTO &middot; VIDEO
              </p>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },
  video_prewedding: {
    assunto: 'O vosso vídeo pré-wedding está pronto',
    html: nomes => `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0e0b06;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0b06;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;border:1px solid #7a6340;background:#110e08;">
          <tr>
            <td style="padding:56px 48px 48px;font-family:Georgia,'Times New Roman',serif;text-align:center;">

              <p style="margin:0 0 24px;font-size:17px;font-style:italic;color:#c9a96e;letter-spacing:0.02em;">
                Olá, ${nomes}!
              </p>

              <h1 style="margin:0;font-size:40px;font-weight:400;color:#ffffff;line-height:1.15;letter-spacing:-0.01em;">
                O vosso vídeo
              </h1>
              <h1 style="margin:0;font-size:40px;font-weight:400;font-style:italic;color:#c9a96e;line-height:1.2;">
                pré-wedding
              </h1>
              <h1 style="margin:0 0 20px;font-size:40px;font-weight:400;font-style:italic;color:#c9a96e;line-height:1.15;">
                está pronto.
              </h1>

              <p style="margin:0 0 32px;font-size:14px;color:#b0a080;letter-spacing:0.01em;">
                Esperamos que esteja tudo bem convosco.
              </p>

              <div style="margin:0 0 32px;color:#7a6340;font-size:14px;letter-spacing:0.3em;">
                &#8212;&nbsp;&nbsp;·&nbsp;◆&nbsp;·&nbsp;&nbsp;&#8212;
              </div>

              <p style="margin:0 0 14px;font-size:15px;color:#d4c9b0;line-height:1.7;text-align:center;">
                O <strong style="color:#ffffff;">vídeo da vossa sessão pré-wedding</strong><br>já está editado e pronto a ver.
              </p>
              <p style="margin:0 0 14px;font-size:15px;color:#d4c9b0;line-height:1.7;text-align:center;">
                Ponham o som alto e <strong style="color:#ffffff;">aproveitem</strong>.
              </p>
              <p style="margin:0 0 36px;font-size:15px;color:#d4c9b0;line-height:1.7;text-align:center;">
                Acedam ao vosso <strong style="color:#ffffff;">Portal dos Noivos</strong>.
              </p>

              <table cellpadding="0" cellspacing="0" style="margin:0 auto 48px;border:1px solid #7a6340;width:100%;max-width:380px;">
                <tr>
                  <td style="padding:24px 32px;text-align:center;">
                    <p style="margin:0 0 10px;font-size:9px;letter-spacing:0.4em;color:#8a7450;text-transform:uppercase;">
                      NO VOSSO PORTAL
                    </p>
                    <p style="margin:0;font-size:22px;font-style:italic;color:#c9a96e;letter-spacing:0.02em;">
                      O Nosso Filme &rarr; Pré-Wedding
                    </p>
                  </td>
                </tr>
              </table>


              <p style="margin:0;font-size:9px;letter-spacing:0.35em;color:#5a4f3a;text-transform:uppercase;">
                RL PHOTO &middot; VIDEO
              </p>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },
}
