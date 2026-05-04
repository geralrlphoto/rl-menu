import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getProjeto } from '@/app/portal-media/_data/mockProject'

const PT_MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
function formatDatePT(iso: string) {
  const d = new Date(iso)
  return `${d.getDate()} ${PT_MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

function fmtEur(n: number) {
  return n.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

export async function POST(req: NextRequest) {
  const formData = await req.formData().catch(() => null)
  if (!formData) return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })

  const ref        = ((formData.get('referencia') as string) || '').toUpperCase()
  const empresa    = (formData.get('empresa')    as string) || ''
  const fase       = (formData.get('fase')       as string) || ''
  const valor      = (formData.get('valor')      as string) || ''
  const metodo     = (formData.get('metodo')     as string) || ''
  const dataISO    = (formData.get('data')       as string) || ''
  const file       = formData.get('comprovativo') as File | null

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // ── 1. Upload comprovativo ──────────────────────────────────────────
  let comprativoUrl = ''
  if (file && file.size > 0) {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const fileName = `comprovativos/${ref}-${Date.now()}.${ext}`
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const { error: upErr } = await supabase.storage
      .from('portal-images')
      .upload(fileName, buffer, { contentType: file.type || 'image/jpeg', upsert: false })

    if (!upErr) {
      const { data: { publicUrl } } = supabase.storage
        .from('portal-images')
        .getPublicUrl(fileName)
      comprativoUrl = publicUrl
    }
  }

  // ── 2. Adicionar registo de pagamento no Supabase ──────────────────
  let registosAtualizados: any[] = []
  let dadosExistentes: any = {}

  try {
    const { data: existing } = await supabase
      .from('media_portais')
      .select('dados')
      .eq('ref', ref)
      .single()

    dadosExistentes = existing?.dados ?? {}
    const registos: any[] = dadosExistentes.registosPagamento ?? []

    const dataPagamento = dataISO ? formatDatePT(dataISO) : formatDatePT(new Date().toISOString())

    const novoRegisto = {
      data:          dataPagamento,
      valor:         parseFloat(valor) || 0,
      fase:          fase || '',
      metodo:        metodo || '',
      empresa:       empresa || '',
      comprativoUrl: comprativoUrl || '',
    }

    registos.push(novoRegisto)

    const merged = { ...dadosExistentes, registosPagamento: registos }
    await supabase
      .from('media_portais')
      .upsert({ ref, dados: merged, updated_at: new Date().toISOString() }, { onConflict: 'ref' })

    registosAtualizados = registos
  } catch {}

  // ── 3. Calcular totais ─────────────────────────────────────────────
  const mock = getProjeto(ref)
  const mergedDados: any = mock ? { ...mock, ...dadosExistentes } : dadosExistentes

  const nomeProjeto    = mergedDados.nome     ?? ref
  const cliente        = mergedDados.cliente  ?? empresa
  const emailCliente   = mergedDados.fichaCliente?.email as string | undefined
  const pagamentosPlano: any[] = mergedDados.pagamentos ?? []

  const totalPlano  = pagamentosPlano.reduce((s: number, p: any) => s + (p.valor ?? 0), 0)
  const totalPago   = registosAtualizados.reduce((s: number, r: any) => s + (r.valor ?? 0), 0)
  const restante    = Math.max(0, totalPlano - totalPago)
  const liquidado   = restante === 0

  const valorPago   = parseFloat(valor) || 0
  const dataPT      = dataISO ? new Date(dataISO).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'
  const portalUrl   = `${process.env.NEXT_PUBLIC_BASE_URL ?? 'https://rl-menu-lake.vercel.app'}/portal-media/${ref}`

  // ── 4. Email admin ─────────────────────────────────────────────────
  const htmlAdmin = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#050507;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#050507;padding:40px 16px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#0a0a12;border:1px solid rgba(255,255,255,0.1);">
        <tr><td height="1" style="background:linear-gradient(90deg,#050507,rgba(255,255,255,0.25),#050507);font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td style="padding:44px 48px 40px;text-align:center;">
          <img src="https://rl-menu-lake.vercel.app/logo_marca_advocacia__8_-removebg-preview.png"
            width="72" alt="RL Media"
            style="display:block;margin:0 auto 28px;width:72px;height:72px;object-fit:contain;" />
          <p style="margin:0 0 4px;font-size:8px;letter-spacing:6px;color:rgba(255,255,255,0.18);text-transform:uppercase;">Registo de Pagamento</p>
          <p style="margin:0 0 28px;font-size:20px;font-weight:200;letter-spacing:5px;color:rgba(255,255,255,0.85);text-transform:uppercase;">${empresa}</p>
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;width:40px;"><tr><td height="1" style="background:rgba(255,255,255,0.12);font-size:0;line-height:0;">&nbsp;</td></tr></table>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.02);">
            ${[
              ['Referência', ref],
              ['Fase',       fase || '—'],
              ['Valor',      `${valor} €`],
              ['Método',     metodo],
              ['Data',       dataPT],
            ].map(([label, val], i, arr) => `
            <tr>
              <td style="padding:14px 20px;font-size:9px;letter-spacing:4px;color:rgba(255,255,255,0.25);text-transform:uppercase;white-space:nowrap;border-bottom:${i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'};">${label}</td>
              <td style="padding:14px 20px;font-size:13px;color:rgba(255,255,255,0.65);font-weight:300;border-bottom:${i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'};">${val}</td>
            </tr>`).join('')}
          </table>
          ${comprativoUrl ? `
          <p style="margin:28px 0 12px;font-size:9px;letter-spacing:4px;color:rgba(255,255,255,0.2);text-transform:uppercase;">Comprovativo</p>
          <a href="${comprativoUrl}" style="display:block;">
            <img src="${comprativoUrl}" alt="Comprovativo" style="display:block;max-width:100%;width:100%;border:1px solid rgba(255,255,255,0.08);" />
          </a>` : `
          <p style="margin:28px 0 0;font-size:11px;color:rgba(255,255,255,0.2);font-style:italic;">Sem comprovativo anexado.</p>`}
        </td></tr>
        <tr><td height="1" style="background:linear-gradient(90deg,#050507,rgba(255,255,255,0.1),#050507);font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td style="padding:18px 48px;text-align:center;">
          <p style="margin:0;font-size:8px;letter-spacing:5px;color:rgba(255,255,255,0.1);text-transform:uppercase;">RL Media &middot; Portal do Cliente &middot; rlmedia.pt</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'RL Media <geral@rlphotovideo.pt>',
      to: ['geral.rlmedia@gmail.com'],
      subject: `Pagamento Registado — ${empresa} · ${fase ? fase + ' · ' : ''}${ref}`,
      html: htmlAdmin,
    }),
  })

  // ── 5. Email cliente ───────────────────────────────────────────────
  if (emailCliente) {
    const resumoFinanceiro = totalPlano > 0 ? `
      <!-- Resumo financeiro -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px;border-collapse:separate;border-spacing:8px 0;">
        <tr>
          <!-- Total -->
          <td width="33%" style="border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.02);padding:16px 12px;text-align:center;vertical-align:top;">
            <p style="margin:0 0 8px;font-size:7px;letter-spacing:5px;color:rgba(255,255,255,0.2);text-transform:uppercase;">Total</p>
            <p style="margin:0;font-size:15px;font-weight:200;letter-spacing:2px;color:rgba(255,255,255,0.55);">${fmtEur(totalPlano)}</p>
            <p style="margin:6px 0 0;font-size:7px;letter-spacing:3px;color:rgba(255,255,255,0.15);text-transform:uppercase;">Serviço</p>
          </td>
          <!-- Pago -->
          <td width="33%" style="border:1px solid rgba(52,211,153,0.2);background:rgba(52,211,153,0.04);padding:16px 12px;text-align:center;vertical-align:top;">
            <p style="margin:0 0 8px;font-size:7px;letter-spacing:5px;color:rgba(52,211,153,0.5);text-transform:uppercase;">Pago</p>
            <p style="margin:0;font-size:15px;font-weight:200;letter-spacing:2px;color:rgba(52,211,153,0.85);">${fmtEur(totalPago)}</p>
            <p style="margin:6px 0 0;font-size:7px;letter-spacing:3px;color:rgba(52,211,153,0.3);text-transform:uppercase;">${registosAtualizados.length} registo${registosAtualizados.length !== 1 ? 's' : ''}</p>
          </td>
          <!-- Restante -->
          <td width="33%" style="border:1px solid ${liquidado ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.08)'};background:${liquidado ? 'rgba(52,211,153,0.04)' : 'rgba(255,255,255,0.02)'};padding:16px 12px;text-align:center;vertical-align:top;">
            <p style="margin:0 0 8px;font-size:7px;letter-spacing:5px;color:${liquidado ? 'rgba(52,211,153,0.5)' : 'rgba(255,255,255,0.2)'};text-transform:uppercase;">Restante</p>
            <p style="margin:0;font-size:15px;font-weight:200;letter-spacing:2px;color:${liquidado ? 'rgba(52,211,153,0.85)' : 'rgba(255,255,255,0.55)'};">${fmtEur(restante)}</p>
            <p style="margin:6px 0 0;font-size:7px;letter-spacing:3px;color:${liquidado ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.15)'};text-transform:uppercase;">${liquidado ? 'Liquidado' : 'Em falta'}</p>
          </td>
        </tr>
      </table>` : ''

    const htmlCliente = `<!DOCTYPE html>
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

      <tr><td style="padding:48px 44px 44px;text-align:center;">

        <!-- Logo -->
        <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
          <tr>
            <td style="width:80px;height:80px;
                       border-radius:50%;
                       border:1px solid rgba(255,255,255,0.22);
                       box-shadow:0 0 18px rgba(255,255,255,0.1),inset 0 0 12px rgba(255,255,255,0.04);
                       background:rgba(255,255,255,0.04);
                       text-align:center;vertical-align:middle;">
              <img src="https://rl-menu-lake.vercel.app/logo-rl-media-branco.png"
                width="52" alt="RL Media"
                style="display:block;margin:14px auto;width:52px;height:auto;
                       mix-blend-mode:screen;opacity:0.95;" />
            </td>
          </tr>
        </table>

        <!-- Divider -->
        <table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 24px;">
          <tr><td height="1"
            style="background:linear-gradient(90deg,transparent,rgba(37,99,235,0.4),transparent);
                   font-size:0;">&nbsp;</td></tr>
        </table>

        <!-- Badge -->
        <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
          <tr><td style="border:1px solid rgba(52,211,153,0.35);
                         background:rgba(52,211,153,0.07);
                         padding:8px 24px;text-align:center;">
            <p style="margin:0;font-size:8px;letter-spacing:7px;
                      color:rgba(52,211,153,0.9);text-transform:uppercase;">
              Pagamento Confirmado
            </p>
          </td></tr>
        </table>

        <!-- Projecto -->
        <p style="margin:0 0 3px;font-size:9px;letter-spacing:5px;
                  color:rgba(255,255,255,0.18);text-transform:uppercase;">Projecto</p>
        <p style="margin:0 0 4px;font-size:24px;font-weight:200;letter-spacing:5px;
                  color:rgba(255,255,255,0.88);text-transform:uppercase;">${nomeProjeto}</p>
        <p style="margin:0 0 32px;font-size:10px;letter-spacing:3px;
                  color:rgba(255,255,255,0.22);text-transform:uppercase;">${cliente}</p>

        <!-- Mensagem -->
        <p style="margin:0 0 28px;font-size:13px;color:rgba(255,255,255,0.45);
                  line-height:1.9;font-weight:300;text-align:left;">
          Confirmamos o registo do vosso pagamento. Obrigado pela pontualidade —
          aqui está o resumo do movimento e do estado financeiro actual do projecto.
        </p>

        <!-- Detalhe do pagamento -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;border:1px solid rgba(52,211,153,0.18);background:rgba(52,211,153,0.04);">
          <tr>
            <td style="padding:10px 18px;font-size:7px;letter-spacing:5px;
                       color:rgba(52,211,153,0.5);text-transform:uppercase;
                       border-bottom:1px solid rgba(52,211,153,0.08);" colspan="2">
              Este Pagamento
            </td>
          </tr>
          ${[
            ['Valor',   fmtEur(valorPago)],
            ...(fase   ? [['Fase',   fase]]   : []),
            ...(metodo ? [['Método', metodo]] : []),
            ['Data',    dataPT],
          ].map(([label, val], i, arr) => `
          <tr>
            <td style="padding:12px 18px;font-size:8px;letter-spacing:4px;
                       color:rgba(255,255,255,0.25);text-transform:uppercase;
                       white-space:nowrap;
                       border-bottom:${i < arr.length - 1 ? '1px solid rgba(52,211,153,0.06)' : 'none'};">
              ${label}
            </td>
            <td style="padding:12px 18px;font-size:14px;
                       color:rgba(52,211,153,0.85);font-weight:300;
                       border-bottom:${i < arr.length - 1 ? '1px solid rgba(52,211,153,0.06)' : 'none'};">
              ${val}
            </td>
          </tr>`).join('')}
        </table>

        ${resumoFinanceiro}

        ${liquidado ? `
        <!-- Liquidado -->
        <table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 32px;">
          <tr><td style="border:1px solid rgba(52,211,153,0.25);
                         background:rgba(52,211,153,0.06);
                         padding:16px 24px;text-align:center;">
            <p style="margin:0 0 4px;font-size:8px;letter-spacing:6px;
                      color:rgba(52,211,153,0.6);text-transform:uppercase;">
              Projecto Totalmente Liquidado
            </p>
            <p style="margin:0;font-size:12px;font-weight:300;letter-spacing:2px;
                      color:rgba(52,211,153,0.45);">
              Obrigado — o valor total foi recebido na íntegra.
            </p>
          </td></tr>
        </table>` : `
        <!-- Ainda em falta -->
        <table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 32px;">
          <tr><td style="border:1px solid rgba(255,255,255,0.08);
                         background:rgba(255,255,255,0.02);
                         padding:14px 24px;text-align:center;">
            <p style="margin:0 0 4px;font-size:8px;letter-spacing:6px;
                      color:rgba(255,255,255,0.2);text-transform:uppercase;">
              Valor Ainda em Falta
            </p>
            <p style="margin:0;font-size:22px;font-weight:200;letter-spacing:4px;
                      color:rgba(255,255,255,0.65);">
              ${fmtEur(restante)}
            </p>
          </td></tr>
        </table>`}

        <!-- Botão portal -->
        <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
          <tr>
            <td style="background:rgba(37,99,235,0.15);
                       border:1px solid rgba(37,99,235,0.5);
                       text-align:center;">
              <a href="${portalUrl}/pagamentos" target="_blank"
                style="display:inline-block;padding:15px 40px;
                       font-size:9px;letter-spacing:6px;
                       color:rgba(147,197,253,0.95);text-transform:uppercase;
                       text-decoration:none;font-weight:600;">
                Ver Pagamentos →
              </a>
            </td>
          </tr>
        </table>

        <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.25);
                  line-height:1.8;font-weight:300;">
          Qualquer questão, estamos disponíveis.<br>
          <span style="color:rgba(255,255,255,0.35);">Equipa RL Media</span>
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
            RL Media &middot; Audiovisual &middot; rlmedia.pt
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

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'RL Media <geral@rlphotovideo.pt>',
        to: [emailCliente],
        subject: `${nomeProjeto} · Pagamento de ${fmtEur(valorPago)} confirmado — RL Media`,
        html: htmlCliente,
      }),
    })
  }

  return NextResponse.json({ ok: true, comprativoUrl, registosPagamento: registosAtualizados })
}
