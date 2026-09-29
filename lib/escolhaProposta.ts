// Os noivos escolheram uma proposta no portal da reunião ("A nossa escolha").
// Cria para hoje a tarefa do calendário "WhatsApp: agradecer <nomes>", com o
// telefone e a mensagem já escrita (o calendário mostra o botão de WhatsApp com ela).
import type { SupabaseClient } from '@supabase/supabase-js'
import { mensagemObrigadoEscolha, nomeNoivos, NOMES_PROPOSTAS } from '@/lib/crm'

const hojeLisboa = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Lisbon' }).format(new Date())
const horaLisboa = () => new Intl.DateTimeFormat('pt-PT', { timeZone: 'Europe/Lisbon', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date())

/* Só aceita nomes de proposta conhecidos (o pedido vem de uma página pública) */
export function propostaValida(v: unknown): string | null {
  const n = typeof v === 'string' ? v.trim().toUpperCase() : ''
  return (NOMES_PROPOSTAS as readonly string[]).includes(n) ? n : null
}

export async function criarTarefaObrigado(sb: SupabaseClient, token: string, batizado: boolean, proposta: string | null) {
  const { data: c } = await sb.from('crm_contacts').select('nome, contato').eq('page_token', token).maybeSingle()
  if (!c) return
  const quem = nomeNoivos(c.nome) || 'noivos'
  const titulo = `WhatsApp: agradecer ${quem}`
  const hoje = hojeLisboa()
  // Não duplica se escolherem outra vez no mesmo dia
  const { data: existe } = await sb.from('tarefas').select('id').eq('titulo', titulo).eq('data_prazo', hoje).limit(1)
  if (existe?.length) return
  const descricao = [
    proposta ? `Escolheram a proposta ${proposta}.` : 'Escolheram uma proposta no portal.',
    c.contato ? `Contacto: ${c.contato}` : null,
    'Mensagem:',
    mensagemObrigadoEscolha(c.nome, batizado),
  ].filter(Boolean).join('\n')
  await sb.from('tarefas').insert({ titulo, descricao, data_prazo: hoje, hora: horaLisboa(), status: 'NOVA', evento_id: null })
}
