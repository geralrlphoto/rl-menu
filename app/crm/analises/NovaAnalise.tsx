'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { preencherPrompt } from './promptAnalista'

// Botão "Analisar nova reunião": preenche o prompt oficial do analista (promptAnalista.ts) para a lead
// escolhida, copia-o e abre a app Claude (o Claude Code faz a transcrição e
// grava o relatório em crm_analises_reuniao).

type LeadReuniao = { id: string; nome: string | null; reuniao_data: string | null; status: string | null; reuniao_gravacao: string | null }

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
      .not('reuniao_gravacao', 'is', null).order('reuniao_data', { ascending: false }).limit(200)
      .then(({ data }) => setLeads((data ?? []) as LeadReuniao[]))
    supabase.from('crm_analises_reuniao').select('contact_id')
      .then(({ data }) => setAnalisadas(new Set((data ?? []).map(d => d.contact_id))))
  }, [aberto, leads.length])

  const lead = leads.find(l => l.id === leadId)

  async function copiarEAbrir() {
    if (!lead) return
    try { await navigator.clipboard.writeText(preencherPrompt(lead, video.trim())) } catch { /* sem clipboard */ }
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
              <span className="text-xs tracking-widest text-white/30 uppercase">Reunião gravada</span>
              <select value={leadId} onChange={e => {
                const l = leads.find(x => x.id === e.target.value)
                setLeadId(e.target.value); setCopiado(false)
                if (l?.reuniao_gravacao) setVideo(l.reuniao_gravacao)
              }}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold/50">
                <option value="" className="bg-[#121212]">{leads.length ? 'Escolher reunião gravada…' : 'A carregar…'}</option>
                {[
                  { label: `Por analisar (${leads.filter(l => !analisadas.has(l.id)).length})`, itens: leads.filter(l => !analisadas.has(l.id)), marca: '' },
                  { label: `Já analisadas (${leads.filter(l => analisadas.has(l.id)).length})`, itens: leads.filter(l => analisadas.has(l.id)), marca: '✓ ' },
                ].filter(g => g.itens.length).map(g => (
                  <optgroup key={g.label} label={g.label} className="bg-[#121212]">
                    {g.itens.map(l => (
                      <option key={l.id} value={l.id} className="bg-[#121212]">
                        {g.marca}{l.nome} · {l.reuniao_data?.split('-').reverse().join('/')}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
            {lead && analisadas.has(lead.id) && (
              <p className="-mt-2 text-[12px] text-yellow-200/80">
                Esta reunião já tem relatório. Uma nova análise acrescenta outro, sem apagar o anterior.
              </p>
            )}

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
