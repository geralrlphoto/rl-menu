'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

// Botão "Analisar nova reunião": monta o prompt do analista crítico para a lead
// escolhida, copia-o e abre a app Claude (o Claude Code faz a transcrição e
// grava o relatório em crm_analises_reuniao).

type LeadReuniao = { id: string; nome: string | null; reuniao_data: string | null; status: string | null; reuniao_gravacao: string | null }

function montarPrompt(l: LeadReuniao, video: string) {
  return `És um analista especialista em reuniões de venda de fotografia e vídeo de casamento, com muitos anos a avaliar reuniões entre fotógrafos e noivos. És crítico, direto e exigente: não dás elogios vazios, apontas o que faz perder vendas e dizes exatamente o que mudar. Escreves em português de Portugal.

Analisa a reunião gravada em:
${video || '[CAMINHO DO VÍDEO]'}

Lead no CRM: ${l.nome ?? ''} (crm_contacts.id = ${l.id}${l.reuniao_data ? `, reunião de ${l.reuniao_data}` : ''}, estado atual: ${l.status ?? 'sem estado'}).

Processo:
1. Extrai o áudio com ffmpeg (mono, 16 kHz) para o scratchpad.
2. Transcreve com: python -I "C:\\Users\\Rui\\Desktop\\rui claude code\\analise_reunioes\\transcrever.py" <audio.wav> <saida.txt>. Guarda a transcrição em analise_reunioes\\AAAA-MM-DD Noivos.txt.
3. Lê a transcrição inteira e avalia a reunião de forma crítica:
   - Ligação (rapport): criou confiança e relação pessoal?
   - Descoberta: percebeu o casal, o dia que imaginam, quem decide, orçamento e concorrência?
   - Apresentação: ligou o valor ao que os noivos disseram valorizar, ou foi monólogo?
   - Objeções: detetou e resolveu dúvidas, preço e concorrentes com respostas concretas?
   - Fecho: pediu decisão no momento certo e saiu com próximo passo e data marcada?
   Para cada ponto indica o minuto (mm:ss). Distingue o que é falha grave do que é detalhe.
4. Insere uma linha em crm_analises_reuniao (Supabase awwbkmprgtwmnejeuiak) com contact_id = ${l.id}:
   data_reuniao, duracao_min, ficheiro, nota (0-10, sê exigente), veredicto (1 frase crítica), resumo,
   perfil {casal, evento, valores, orcamento, concorrencia},
   scores {rapport, descoberta, apresentacao, objecoes, fecho} de 0 a 10,
   pontos_fortes, pontos_fracos e melhorar como [{titulo, detalhe, momento, categoria, gravidade}]
   (categoria: Descoberta | Apresentação | Objeções | Fecho; gravidade: alta | média | baixa),
   proximos_passos como lista de textos.
5. No fim, resume-me em poucas linhas a nota, as 3 falhas mais graves e o que fazer já com estes noivos.`
}

export default function NovaAnalise() {
  const [aberto, setAberto] = useState(false)
  const [leads, setLeads] = useState<LeadReuniao[]>([])
  const [leadId, setLeadId] = useState('')
  const [video, setVideo] = useState('F:\\reunioes\\')
  const [copiado, setCopiado] = useState(false)
  const [analisadas, setAnalisadas] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!aberto || leads.length) return
    // reuniao_gravacao é preenchido por analise_reunioes/sincronizar_gravacoes.py (data/hora do ficheiro)
    supabase.from('crm_contacts').select('id,nome,reuniao_data,status,reuniao_gravacao')
      .not('reuniao_data', 'is', null).order('reuniao_data', { ascending: false }).limit(100)
      .then(({ data }) => setLeads((data ?? []) as LeadReuniao[]))
    supabase.from('crm_analises_reuniao').select('contact_id')
      .then(({ data }) => setAnalisadas(new Set((data ?? []).map(d => d.contact_id))))
  }, [aberto, leads.length])

  const lead = leads.find(l => l.id === leadId)

  async function copiarEAbrir() {
    if (!lead) return
    try { await navigator.clipboard.writeText(montarPrompt(lead, video.trim())) } catch { /* sem clipboard */ }
    setCopiado(true)
    // Traz a app Claude para a frente (se estiver instalada; caso contrário não faz nada)
    window.location.href = 'claude://'
  }

  return (
    <>
      <button onClick={() => { setAberto(true); setCopiado(false) }}
        className="inline-flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase px-4 py-2.5 rounded-xl border border-gold/50 text-gold bg-gold/10 hover:bg-gold/20 transition-all">
        <span className="text-base leading-none">+</span> Analisar nova reunião
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setAberto(false)}>
          <div className="w-full max-w-lg bg-[#121212] border border-white/10 rounded-2xl p-6 flex flex-col gap-4" onClick={e => e.stopPropagation()}>
            <div>
              <h2 className="text-xs tracking-[0.3em] text-gold uppercase">Analisar nova reunião</h2>
              <p className="text-[12px] text-white/40 mt-1">Analista crítico especializado em reuniões de casamento</p>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs tracking-widest text-white/30 uppercase">Noivos</span>
              <select value={leadId} onChange={e => {
                const l = leads.find(x => x.id === e.target.value)
                setLeadId(e.target.value); setCopiado(false)
                if (l?.reuniao_gravacao) setVideo(l.reuniao_gravacao)
              }}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold/50">
                <option value="" className="bg-[#121212]">{leads.length ? 'Escolher lead…' : 'A carregar…'}</option>
                {leads.map(l => (
                  <option key={l.id} value={l.id} className="bg-[#121212]">
                    {l.nome} · {l.reuniao_data?.split('-').reverse().join('/')}{analisadas.has(l.id) ? ' · ✓ analisada' : l.reuniao_gravacao ? ' · gravação' : ''}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs tracking-widest text-white/30 uppercase">
                Caminho do vídeo{lead?.reuniao_gravacao && video === lead.reuniao_gravacao ? <span className="normal-case tracking-normal text-green-400/80"> · encontrado pela data da reunião</span> : ''}
              </span>
              <input value={video} onChange={e => { setVideo(e.target.value); setCopiado(false) }}
                placeholder="F:\reunioes\2026-09-14 13-59-28.mp4"
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder-white/20 focus:outline-none focus:border-gold/50" />
            </label>

            {copiado ? (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-[13px] text-green-300 leading-relaxed">
                Prompt copiado. Na app Claude, abre o separador <b>Code</b> na pasta <span className="font-mono">rui claude code</span>, cola (Ctrl+V) e envia. Quando terminar, o relatório aparece aqui e na ficha.
              </div>
            ) : (
              <p className="text-[12px] text-white/35 leading-relaxed">
                O prompt é copiado e a app Claude abre. A transcrição e a análise correm no teu computador (cerca de 30 min para 1 h de reunião).
              </p>
            )}

            <div className="flex justify-end gap-2">
              <button onClick={() => setAberto(false)} className="text-[11px] tracking-[0.2em] uppercase px-4 py-2 rounded-lg text-white/40 hover:text-white/70">Fechar</button>
              <button onClick={copiarEAbrir} disabled={!lead || !video.trim().toLowerCase().match(/\.(mp4|mov|mkv|m4a|mp3|wav|webm)$/)}
                className="text-[11px] tracking-[0.2em] uppercase px-4 py-2 rounded-lg border border-gold/50 text-gold bg-gold/10 hover:bg-gold/20 disabled:opacity-30 transition-all">
                {copiado ? 'Copiar de novo' : 'Copiar e abrir Claude'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
