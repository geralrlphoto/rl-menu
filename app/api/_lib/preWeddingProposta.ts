import { createClient } from '@supabase/supabase-js'
import { resolveEmailNoiva } from './emailNoiva'

// Proposta de Pré-Wedding: o admin agenda o envio na ficha do evento
// (settings.preWeddingPropostaAgendada) e o email sai sozinho quando faltarem
// 60 dias ou menos para o casamento. Enviado uma única vez por evento
// (settings.preWeddingPropostaEnviadaEm guarda a data do envio).
export const DIAS_ANTES = 60

const PAGINA_PROPOSTA = 'https://rlphotovideo.pt/pre-wedding-entrada'

export type EnvioProposta = {
  referencia: string
  ok: boolean
  email?: string
  erro?: string
}

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function hojeISO(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Data (YYYY-MM-DD) a partir da qual o email pode sair: casamento menos 60 dias. */
export function dataEnvioProposta(dataCasamento: string | null | undefined): string | null {
  if (!dataCasamento) return null
  try {
    const d = new Date(dataCasamento + 'T12:00:00')
    if (isNaN(d.getTime())) return null
    d.setDate(d.getDate() - DIAS_ANTES)
    return d.toISOString().slice(0, 10)
  } catch { return null }
}

/**
 * Corre a verificação diária. Sem `referencia`, varre todos os portais com
 * envio agendado; com `referencia`, verifica só esse evento.
 */
export async function runPreWeddingProposta(opts: { referencia?: string } = {}) {
  const supabase = db()
  const hoje = hojeISO()

  // Só os portais com envio agendado e só as colunas necessárias (o `settings`
  // inteiro de todos os portais é a query mais pesada do projeto — ver /api/portais).
  let q = supabase
    .from('portais')
    .select('referencia, noiva, noivo, data, dataSettings:settings->>data, enviadaEm:settings->>preWeddingPropostaEnviadaEm, emailNoiva:settings->>emailNoiva, tipoPortal:settings->>tipoPortal')
    .eq('settings->>preWeddingPropostaAgendada', 'true')

  if (opts.referencia) q = q.ilike('referencia', opts.referencia)

  const { data: rows, error } = await q
  if (error) return { ok: false, erro: error.message, verificados: 0, enviados: 0, resultados: [] as EnvioProposta[] }

  // Janela: já faltam 60 dias ou menos, e o casamento ainda não passou.
  const candidatos = (rows ?? []).filter((r: any) => {
    if (r.enviadaEm) return false
    if ((r.tipoPortal ?? 'casamento') === 'batizado') return false
    if (String(r.referencia ?? '').toUpperCase().startsWith('BAT')) return false
    const dataCasamento = r.data ?? r.dataSettings ?? null
    const envio = dataEnvioProposta(dataCasamento)
    if (!envio) return false
    return envio <= hoje && String(dataCasamento) >= hoje
  })

  const resultados: EnvioProposta[] = []

  for (const r of candidatos as any[]) {
    const referencia = r.referencia as string
    try {
      let email: string | null = r.emailNoiva ?? null
      let noiva: string | null = r.noiva ?? null
      let noivo: string | null = r.noivo ?? null

      if (!email || (!noiva && !noivo)) {
        const { data: cps } = await supabase
          .from('dados_contrato_cps')
          .select('email_noiva, nome_noiva, nome_noivo')
          .eq('referencia_evento', referencia)
          .order('id', { ascending: false })
          .limit(1)
          .maybeSingle()
        email = email ?? cps?.email_noiva ?? null
        noiva = noiva ?? cps?.nome_noiva ?? null
        noivo = noivo ?? cps?.nome_noivo ?? null
      }

      email = await resolveEmailNoiva(email, referencia)
      if (!email) {
        resultados.push({ referencia, ok: false, erro: 'Email da noiva não encontrado' })
        continue
      }

      const nomes = [noiva, noivo].filter(Boolean).join(' e ') || 'Noivos'

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'RL Photo.Video <geral@rlphotovideo.pt>',
          to: [email],
          subject: 'Faltam 60 dias · preparámos algo para vocês',
          html: buildPropostaHtml(nomes),
          text: buildPropostaTexto(nomes),
        }),
      })

      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        resultados.push({ referencia, ok: false, email, erro: d?.message ?? `Resend ${res.status}` })
        continue
      }

      // Marca como enviado (merge sobre o settings atual do portal).
      const { data: atual } = await supabase
        .from('portais').select('settings').ilike('referencia', referencia).maybeSingle()
      const settings = (atual?.settings ?? {}) as Record<string, any>
      await supabase.from('portais').update({
        settings: { ...settings, preWeddingPropostaEnviadaEm: new Date().toISOString() },
        updated_at: new Date().toISOString(),
      }).ilike('referencia', referencia)

      resultados.push({ referencia, ok: true, email })
    } catch (e: any) {
      resultados.push({ referencia, ok: false, erro: e?.message ?? 'erro' })
    }
  }

  return {
    ok: true,
    verificados: candidatos.length,
    enviados: resultados.filter(r => r.ok).length,
    resultados,
  }
}

function buildPropostaTexto(nomes: string): string {
  return `Olá ${nomes},

Faltam dois meses para o vosso casamento. Antes de entrarmos na reta final, preparámos uma página só para vocês, com uma coisa que faz toda a diferença no resultado do dia.

Vejam aqui: ${PAGINA_PROPOSTA}

Falamos em breve,
Rui · RL Photo.Video`
}

function buildPropostaHtml(nomes: string): string {
  const nome = escapeHtml(nomes)
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0e0b06;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0b06;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;border:1px solid #7a6340;background:#110e08;">
          <tr>
            <td style="padding:52px 48px 44px;font-family:Georgia,'Times New Roman',serif;text-align:center;">

              <p style="margin:0 0 26px;font-size:9px;letter-spacing:0.4em;color:#8a7450;text-transform:uppercase;">
                Faltam 60 dias
              </p>

              <h1 style="margin:0 0 6px;font-size:36px;font-weight:400;color:#ffffff;line-height:1.15;">
                Preparámos algo
              </h1>
              <h1 style="margin:0 0 30px;font-size:36px;font-weight:400;font-style:italic;color:#c9a96e;line-height:1.15;">
                para vocês.
              </h1>

              <div style="margin:0 0 30px;color:#7a6340;font-size:14px;letter-spacing:0.3em;">
                &#8212;&nbsp;&nbsp;·&nbsp;&#9670;&nbsp;·&nbsp;&nbsp;&#8212;
              </div>

              <p style="margin:0 0 18px;font-size:16px;font-style:italic;color:#c9a96e;">
                Olá ${nome},
              </p>

              <p style="margin:0 0 32px;font-size:15px;color:#d4c9b0;line-height:1.75;">
                Faltam dois meses para o vosso casamento. Antes de entrarmos na reta final,
                preparámos uma página só para vocês, com uma coisa que faz toda a diferença
                no resultado do dia.
              </p>

              <table cellpadding="0" cellspacing="0" style="margin:0 auto 36px;">
                <tr>
                  <td style="border:1px solid #7a6340;background:rgba(201,169,110,0.08);">
                    <a href="${PAGINA_PROPOSTA}" style="display:block;padding:18px 40px;text-decoration:none;font-family:Georgia,'Times New Roman',serif;font-size:11px;letter-spacing:0.35em;color:#c9a96e;text-transform:uppercase;">
                      Vejam aqui
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 34px;font-size:13px;color:#8a7450;line-height:1.6;">
                <a href="${PAGINA_PROPOSTA}" style="color:#8a7450;text-decoration:underline;">rlphotovideo.pt/pre-wedding-entrada</a>
              </p>

              <p style="margin:0 0 4px;font-size:15px;color:#d4c9b0;line-height:1.7;">
                Falamos em breve,
              </p>
              <p style="margin:0 0 36px;font-size:15px;font-style:italic;color:#c9a96e;">
                Rui &middot; RL Photo.Video
              </p>

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
</html>`
}

function escapeHtml(s: string): string {
  return (s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}
