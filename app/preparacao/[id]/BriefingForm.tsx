'use client'

import { useMemo, useState } from 'react'
import { camposBriefing, campoAtivo, emFaltaBriefing, type RespostasBriefing } from '@/lib/briefing'

/* Formulário do briefing pré-casamento dentro da página /preparacao/<id>.
   Pré-preenchido com o que já está na ficha; pode ser corrigido enquanto o link estiver ativo. */

const SERIF = { fontFamily: "'Cormorant Garamond', serif" }
const GOLD = '#C9A84C'

export type BriefingInfo = {
  respostas: RespostasBriefing | null
  enviadoEm: string | null
  prefill: RespostasBriefing
}

export default function BriefingForm({ eventoId, info, onEnviado, batizado = false, crianca = null }: {
  eventoId: string
  info: BriefingInfo
  batizado?: boolean
  crianca?: string | null
  onEnviado: (respostas: RespostasBriefing, enviadoEm: string) => void
}) {
  const primeiraVez = !info.enviadoEm
  const [r, setR] = useState<RespostasBriefing>(() => ({ ...info.prefill, ...(info.respostas ?? {}) }))
  const [aEnviar, setAEnviar] = useState(false)
  const [erro, setErro] = useState('')
  const [tentou, setTentou] = useState(false)
  const [ok, setOk] = useState(false)

  const campos = camposBriefing(batizado)
  const falta = useMemo(() => emFaltaBriefing(r, campos), [r, campos])
  const visiveis = campos.filter(c => campoAtivo(c, r))
  const obrig = visiveis.filter(c => c.obrigatorio).length
  const feitos = obrig - falta.length
  const set = (k: string, v: string) => { setR(p => ({ ...p, [k]: v })); setOk(false) }

  async function enviar() {
    setTentou(true); setErro('')
    if (falta.length) {
      setErro('Falta preencher alguns campos (assinalados a dourado).')
      document.querySelector('[data-falta="1"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setAEnviar(true)
    const d = await fetch('/api/preparacao-publico/briefing', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ e: eventoId, respostas: r }),
    }).then(x => x.json()).catch(() => ({ error: 'Sem ligação. Tentem de novo.' }))
    setAEnviar(false)
    if (!d.ok) { setErro(d.error || 'Não foi possível enviar.'); return }
    setOk(true)
    onEnviado(r, d.enviadoEm)
    if (!primeiraVez) window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const inputCls = 'w-full bg-white/[0.03] border rounded-xl px-4 py-3 text-[15px] text-white placeholder:text-white/20 focus:outline-none focus:border-[#C9A84C] focus:bg-white/[0.05] transition-colors'

  return (
    <div className="flex flex-col">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] tracking-[0.35em] uppercase" style={{ color: GOLD }}>{batizado ? 'Briefing do batizado' : 'Briefing pré-casamento'}</p>
          <h2 className="text-3xl sm:text-4xl font-light mt-2" style={SERIF}>
            {batizado ? `Contem-nos como vai ser o batizado${crianca ? ` de ${crianca}` : ''}` : 'Contem-nos como vai ser o vosso dia'}
          </h2>
        </div>
      </div>
      <p className="text-white/45 text-sm mt-3 leading-relaxed">
        Primeiro o briefing, depois a marcação da reunião. Estas respostas ajudam-nos a preparar a reunião e {batizado ? 'esse dia' : 'o vosso dia'}, e podem voltar a este link para corrigir o que quiserem.
      </p>

      {/* Progresso */}
      <div className="mt-6 flex items-center gap-3">
        <div className="flex-1 h-1 rounded-full bg-white/[0.06] overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(feitos / obrig) * 100}%`, background: GOLD }} />
        </div>
        <span className="text-[10px] tracking-[0.2em] text-white/40 tabular-nums">{feitos}/{obrig}</span>
      </div>

      {ok && (
        <div className="mt-6 rounded-xl border border-[#C9A84C]/40 bg-[#C9A84C]/10 px-4 py-3 text-sm" style={{ color: GOLD }}>
          ✓ Briefing guardado. Obrigado!
        </div>
      )}

      <div className="mt-8 flex flex-col gap-7">
        {visiveis.map((c, i) => {
          const v = r[c.key] ?? ''
          const emFalta = tentou && c.obrigatorio && !v.trim()
          return (
            <div key={c.key} data-falta={emFalta ? '1' : undefined} className="animate-[fadeUp_.4s_ease-out_both]" style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}>
              <label className="flex items-baseline gap-2 mb-2.5">
                <span className="text-[11px] tabular-nums" style={{ color: GOLD, ...SERIF }}>{String(i + 1).padStart(2, '0')}</span>
                <span className="text-[15px] text-white/85">{c.label}</span>
                {!c.obrigatorio && <span className="text-[10px] text-white/30">(opcional)</span>}
              </label>

              {(c.tipo === 'texto' || c.tipo === 'hora') && (
                <input type={c.tipo === 'hora' ? 'time' : 'text'} value={v} onChange={e => set(c.key, e.target.value)} placeholder={c.placeholder}
                  className={`${inputCls} [color-scheme:dark]`} style={{ borderColor: emFalta ? GOLD : 'rgba(255,255,255,0.1)' }} />
              )}

              {c.tipo === 'longo' && (
                <textarea value={v} onChange={e => set(c.key, e.target.value)} rows={3} placeholder={c.placeholder}
                  className={`${inputCls} resize-y`} style={{ borderColor: emFalta ? GOLD : 'rgba(255,255,255,0.1)' }} />
              )}

              {(c.tipo === 'opcoes' || c.tipo === 'simnao') && (
                <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${(c.opcoes ?? ['Sim', 'Não']).length}, minmax(0, 1fr))` }}>
                  {(c.opcoes ?? ['Sim', 'Não']).map(o => {
                    const ativo = v === o
                    return (
                      <button key={o} type="button" onClick={() => set(c.key, o)}
                        className="rounded-xl border py-3 text-sm tracking-[0.15em] uppercase transition-all"
                        style={{ borderColor: ativo ? GOLD : emFalta ? 'rgba(201,168,76,0.6)' : 'rgba(255,255,255,0.1)', background: ativo ? 'rgba(201,168,76,0.12)' : 'transparent', color: ativo ? GOLD : 'rgba(255,255,255,0.55)' }}>
                        {o}
                      </button>
                    )
                  })}
                </div>
              )}

              {c.tipo === 'simnao' && v === 'Sim' && c.detalhe && (
                <textarea value={r[`${c.key}_detalhe`] ?? ''} onChange={e => set(`${c.key}_detalhe`, e.target.value)} rows={2} placeholder={c.detalhe}
                  className={`${inputCls} resize-y mt-2 animate-[fadeUp_.3s_ease-out_both]`} style={{ borderColor: 'rgba(255,255,255,0.1)' }} />
              )}
            </div>
          )
        })}
      </div>

      {erro && <p className="mt-6 rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">{erro}</p>}

      <button onClick={enviar} disabled={aEnviar}
        className="mt-8 w-full rounded-xl py-4 text-[12px] font-semibold tracking-[0.3em] uppercase transition-all disabled:opacity-40 hover:shadow-[0_0_30px_rgba(201,168,76,0.35)]"
        style={{ background: GOLD, color: '#000' }}>
        {aEnviar ? 'A enviar…' : info.enviadoEm ? 'Guardar alterações' : 'Enviar briefing'}
      </button>
    </div>
  )
}
