import type { SupabaseClient } from '@supabase/supabase-js'

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function formatDate(d: string | null | undefined): string {
  if (!d) return ''
  try {
    const dt = new Date(d + 'T00:00:00')
    return `${String(dt.getDate()).padStart(2,'0')} de ${MESES[dt.getMonth()]} de ${dt.getFullYear()}`
  } catch { return d }
}

// Identidade dos noivos para um portal que ainda não existe. Lê do contrato CPS
// e, em alternativa, da ficha do evento. Sem isto, um portal criado de raspão
// por um PATCH de settings (ex.: marcar o contrato como disponível) nascia sem
// noiva/noivo/data/local e abria vazio para os noivos.
export async function identidadeParaRef(db: SupabaseClient, referencia: string) {
  const vazio = { row: {} as Record<string, any>, settings: {} as Record<string, any> }
  try {
    const { data: cps } = await db
      .from('dados_contrato_cps')
      .select('nome_noiva, nome_noivo, data_casamento, local_cerimonia, tipo_evento')
      .eq('referencia_evento', referencia)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle()

    let noiva: string | null = cps?.nome_noiva ?? null
    let noivo: string | null = cps?.nome_noivo ?? null
    let data:  string | null = cps?.data_casamento ?? null
    let local: string | null = cps?.local_cerimonia ?? null

    if (!noiva && !noivo) {
      for (const t of ['eventos_2026', 'eventos_2027']) {
        const { data: ev } = await db.from(t).select('cliente, data_evento, local').eq('referencia', referencia).maybeSingle()
        if (!ev) continue
        const partes = String(ev.cliente ?? '').split(/\s+e\s+|\s*&\s*/i)
        noiva = noiva ?? (partes[0]?.trim() || null)
        noivo = noivo ?? (partes[1]?.trim() || null)
        data  = data  ?? ev.data_evento ?? null
        local = local ?? ev.local ?? null
        break
      }
    }

    if (!noiva && !noivo && !data && !local) return vazio
    return {
      row: { noiva, noivo, data, data_formatada: formatDate(data), local },
      settings: {
        referencia,
        noiva: noiva ?? '',
        noivo: noivo ?? '',
        data: data ?? '',
        dataFormatada: formatDate(data),
        local: local ?? '',
        tipoPortal: cps?.tipo_evento === 'batizado' ? 'batizado' : 'casamento',
      },
    }
  } catch { return vazio }
}
