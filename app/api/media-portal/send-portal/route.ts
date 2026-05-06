import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { getProjeto } from '@/app/portal-media/_data/mockProject'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { ref } = await req.json()
  if (!ref) return NextResponse.json({ error: 'ref em falta' }, { status: 400 })

  // ── Buscar dados do portal ──
  const { data: row } = await supabase
    .from('media_portais')
    .select('dados')
    .eq('ref', ref.toUpperCase())
    .single()

  const mock = getProjeto(ref)
  const dados = row?.dados ? { ...(mock ?? {}), ...row.dados } : mock

  if (!dados) return NextResponse.json({ error: 'Portal não encontrado' }, { status: 404 })

  const nomeProjeto  = (dados as any).nome     ?? ref
  const cliente      = (dados as any).cliente  ?? ''
  const senha        = (dados as any).senha    as string | undefined
  const emailCliente = (dados as any).fichaCliente?.email as string | undefined

  if (!emailCliente)
    return NextResponse.json({ error: 'Email do cliente não definido no portal (Contrato & CPS)' }, { status: 400 })

  const portalUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? 'https://rl-menu-lake.vercel.app'}/portal-media/${ref.toUpperCase()}`

  // ── Construir email ──
  const senhaBlock = senha ? `
    <table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 32px;">
      <tr>
        <td style="border:1px solid rgba(251,191,36,0.25);
                   background:rgba(251,191,36,0.05);
                   padding:18px 24px;text-align:center;">
          <p style="margin:0 0 6px;font-size:8px;letter-spacing:5px;
                    color:rgba(251,191,36,0.55);text-transform:uppercase;">
            Senha de Acesso
          </p>
          <p style="margin:0;font-size:22px;font-weight:300;letter-spacing:10px;
                    color:rgba(251,191,36,0.85);font-family:monospace;">
            ${senha}
          </p>
        </td>
      </tr>
    </table>` : `
    <table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 32px;">
      <tr>
        <td style="border:1px solid rgba(52,211,153,0.2);
                   background:rgba(52,211,153,0.04);
                   padding:12px 24px;text-align:center;">
          <p style="margin:0;font-size:9px;letter-spacing:4px;
                    color:rgba(52,211,153,0.55);text-transform:uppercase;">
            Acesso Livre · Sem senha necessária
          </p>
        </td>
      </tr>
    </table>`

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#020810;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" border="0"
  style="background-color:#020810;min-height:100vh;">
<tr><td align="center" style="padding:0;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0"
    style="background-color:#020810;padding:56px 16px;">
  <tr><td align="center">

    <table width="460" cellpadding="0" cellspacing="0" border="0"
      style="max-width:460px;width:100%;
             background-color:#07101f;
             background-image:
               linear-gradient(rgba(30,80,220,0.13) 1px, transparent 1px),
               linear-gradient(90deg, rgba(30,80,220,0.13) 1px, transparent 1px);
             background-size:44px 44px;
             border:1px solid rgba(40,100,255,0.22);
             border-top:none;">

      <!-- Linha neon topo -->
      <tr>
        <td height="3"
          style="background:linear-gradient(90deg,#020810,#2563eb,#020810);
                 font-size:0;line-height:0;">&nbsp;</td>
      </tr>

      <tr><td style="padding:52px 44px 44px;text-align:center;">

        <!-- Logo -->
        <table cellpadding="0" cellspacing="0" style="margin:0 auto 36px;">
          <tr>
            <td style="width:90px;height:90px;
                       border-radius:50%;
                       border:1px solid rgba(255,255,255,0.22);
                       box-shadow:0 0 18px rgba(255,255,255,0.1),inset 0 0 12px rgba(255,255,255,0.04);
                       background:rgba(255,255,255,0.04);
                       text-align:center;vertical-align:middle;padding:0;">
              <img src="https://rl-menu-lake.vercel.app/logo-rl-prod-branco.png"
                width="58" alt="RL PROD"
                style="display:block;margin:16px auto;width:58px;height:auto;
                       mix-blend-mode:screen;opacity:0.95;" />
            </td>
          </tr>
        </table>

        <!-- Divider -->
        <table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 28px;">
          <tr><td height="1"
            style="background:linear-gradient(90deg,transparent,rgba(37,99,235,0.4),transparent);
                   font-size:0;">&nbsp;</td></tr>
        </table>

        <!-- Badge -->
        <table cellpadding="0" cellspacing="0" style="margin:0 auto 30px;">
          <tr><td style="border:1px solid rgba(96,165,250,0.35);
                         background:rgba(96,165,250,0.07);
                         padding:8px 24px;text-align:center;">
            <p style="margin:0;font-size:8px;letter-spacing:7px;
                      color:rgba(96,165,250,0.9);text-transform:uppercase;">
              Portal do Cliente
            </p>
          </td></tr>
        </table>

        <!-- Projecto -->
        <p style="margin:0 0 3px;font-size:9px;letter-spacing:5px;
                  color:rgba(255,255,255,0.18);text-transform:uppercase;">Projecto</p>
        <p style="margin:0 0 5px;font-size:26px;font-weight:200;letter-spacing:5px;
                  color:rgba(255,255,255,0.88);text-transform:uppercase;">${nomeProjeto}</p>
        <p style="margin:0 0 36px;font-size:10px;letter-spacing:3px;
                  color:rgba(255,255,255,0.22);text-transform:uppercase;">${cliente}</p>

        <!-- Mensagem -->
        <p style="margin:0 0 32px;font-size:14px;color:rgba(255,255,255,0.45);
                  line-height:1.9;font-weight:300;text-align:left;">
          O vosso portal exclusivo está pronto.<br>
          Aqui podem acompanhar o progresso do projeto, consultar documentos, ver entregas e muito mais.
        </p>

        ${senhaBlock}

        <!-- Botão aceder -->
        <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
          <tr>
            <td style="background:rgba(37,99,235,0.15);
                       border:1px solid rgba(37,99,235,0.5);
                       text-align:center;">
              <a href="${portalUrl}" target="_blank"
                style="display:inline-block;padding:16px 44px;
                       font-size:10px;letter-spacing:6px;
                       color:rgba(147,197,253,0.95);text-transform:uppercase;
                       text-decoration:none;font-weight:600;">
                Aceder ao Portal →
              </a>
            </td>
          </tr>
        </table>

        <!-- URL visível -->
        <p style="margin:0 0 24px;font-size:9px;letter-spacing:2px;
                  color:rgba(255,255,255,0.15);word-break:break-all;">
          ${portalUrl}
        </p>

        <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.25);
                  line-height:1.8;font-weight:300;">
          Qualquer questão, estamos disponíveis.<br>
          <span style="color:rgba(255,255,255,0.35);">Equipa RL PROD</span>
        </p>

      </td></tr>

      <!-- Linha neon fundo -->
      <tr>
        <td height="1"
          style="background:linear-gradient(90deg,transparent,rgba(37,99,235,0.35),transparent);
                 font-size:0;line-height:0;">&nbsp;</td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding:18px 44px;text-align:center;background:#040c1c;">
          <p style="margin:0;font-size:8px;letter-spacing:5px;
                    color:rgba(255,255,255,0.1);text-transform:uppercase;">
            RL PROD &middot; Photography &amp; Video &middot; rlphotovideo.pt
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
  </table>
</td></tr>
</table>

</body>
</html>`

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'RL PROD <geral@rlphotovideo.pt>',
      to: [emailCliente],
      subject: `${nomeProjeto} · O vosso Portal do Cliente está pronto — RL PROD`,
      html,
    }),
  })

  const data = await resendRes.json()
  if (!resendRes.ok) return NextResponse.json({ ok: false, error: data.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

