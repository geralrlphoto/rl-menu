import { createClient } from '@supabase/supabase-js'
import { resolveEmailNoiva } from './emailNoiva'
import { emailPropostaPreWedding } from '@/lib/emailsNoivos'

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
          html: emailPropostaPreWedding({ nomes, data: r.data ?? r.dataSettings ?? null, url: PAGINA_PROPOSTA }),
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
