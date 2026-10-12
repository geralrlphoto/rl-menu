'use client'

import { useState } from 'react'
import { PROMPT_ANALISTA } from './promptAnalista'

// Mostra o prompt oficial do analista na página /crm/analises (recolhido por omissão).
export default function PromptAnalistaPainel() {
  const [aberto, setAberto] = useState(false)
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    try { await navigator.clipboard.writeText(PROMPT_ANALISTA); setCopiado(true); setTimeout(() => setCopiado(false), 2500) } catch { /* sem clipboard */ }
  }

  return (
    <div className="bg-white/3 border border-white/8 rounded-2xl mb-6 overflow-hidden">
      <button onClick={() => setAberto(v => !v)} className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-white/[0.03] transition-colors">
        <div>
          <p className="text-xs tracking-[0.3em] text-gold uppercase">Prompt do analista</p>
          <p className="text-[11px] text-white/35 mt-1">As regras que o Claude segue em todas as análises: escala de notas, sinais de alerta e o que grava</p>
        </div>
        <span className={`text-white/40 text-sm transition-transform ${aberto ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {aberto && (
        <div className="px-5 pb-5">
          <div className="flex justify-end mb-2">
            <button onClick={copiar}
              className="text-[10px] tracking-[0.2em] uppercase px-3 py-1.5 rounded-lg border border-gold/40 text-gold hover:bg-gold/10 transition-all">
              {copiado ? 'Copiado ✓' : 'Copiar prompt'}
            </button>
          </div>
          <pre className="whitespace-pre-wrap break-words text-[12.5px] leading-relaxed text-white/65 bg-black/30 border border-white/8 rounded-xl p-4 max-h-[480px] overflow-y-auto font-sans">
            {PROMPT_ANALISTA}
          </pre>
          <p className="text-[11px] text-white/30 mt-2">
            O botão "Analisar nova reunião" preenche sozinho o vídeo, o nome, a data e o estado da lead. Para mudar o prompt, pede ao Claude: está em app/crm/analises/promptAnalista.ts.
          </p>
        </div>
      )}
    </div>
  )
}
