'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { telLink, whatsappLink } from '@/lib/crm'
import { opcoesFollowUp, scriptTelefone, type TipoFollow } from '@/lib/followUpOpcoes'

/* Janela aberta ao carregar numa lead de follow-up no calendário dos 30 dias: escolher a mensagem
   de WhatsApp ou telefonar com o script. Enviar ou "Já liguei" fecha a tarefa. */

const OURO = '#C9A84C'

export default function FollowUpJanela({ tipo, rotulo, contactId, nome, contato, dataCasamento, atrasoDias, onEnviar, onLigou, onFechar }: {
  tipo: TipoFollow; rotulo: string; contactId: string; nome: string; contato: string | null
  dataCasamento: string | null; atrasoDias: number
  onEnviar: () => void; onLigou: () => void; onFechar: () => void
}) {
  // Abriram o portal e não marcaram: abre já no script de telefonema
  const [aba, setAba] = useState<'mensagem' | 'telefone'>(tipo === 'ligar' ? 'telefone' : 'mensagem')
  const [sel, setSel] = useState(0)
  const opcoes = opcoesFollowUp(tipo, { nome, id: contactId, dataCasamento })
  const s = scriptTelefone(tipo)
  const wa = whatsappLink(contato, opcoes[sel].texto)
  const tel = telLink(contato)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onFechar() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onFechar])

  const Aba = ({ id, texto }: { id: typeof aba; texto: string }) => (
    <button type="button" onClick={() => setAba(id)}
      className="flex-1 py-2.5 text-[11px] font-semibold tracking-[0.2em] uppercase rounded-lg border transition-colors"
      style={aba === id ? { borderColor: `${OURO}99`, background: `${OURO}1f`, color: '#fff' } : { borderColor: 'rgba(255,255,255,.1)', color: 'rgba(255,255,255,.5)' }}>
      {texto}
    </button>
  )
  const Titulo = ({ children }: { children: string }) => (
    <p className="text-[10px] font-semibold tracking-[0.25em] uppercase mb-1.5" style={{ color: OURO }}>{children}</p>
  )

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-3 sm:p-6" onClick={e => { e.stopPropagation(); onFechar() }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" />
      <div role="dialog" aria-modal="true" aria-label={`Follow-up de ${nome}`} onClick={e => e.stopPropagation()}
        className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-2xl border bg-[#0f0f0f] text-left"
        style={{ borderColor: `${OURO}55`, boxShadow: `0 0 50px -20px ${OURO}` }}>

        <div className="sticky top-0 z-10 bg-[#0f0f0f]/95 backdrop-blur px-5 pt-5 pb-3 border-b border-white/5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold tracking-[0.25em] uppercase" style={{ color: OURO }}>
                {rotulo}{atrasoDias > 0 && <span className="text-red-400 normal-case tracking-normal"> · {atrasoDias}d atraso</span>}
              </p>
              <h2 className="text-xl font-light text-white mt-1 truncate">{nome.trim() || 'Sem nome'}</h2>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link href={`/crm/${contactId}`} className="text-[10px] tracking-widest uppercase text-white/40 hover:text-white">Ficha</Link>
              <button type="button" onClick={onFechar} aria-label="Fechar" className="text-white/40 hover:text-white text-xl leading-none">×</button>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Aba id="mensagem" texto="Mensagem" />
            <Aba id="telefone" texto="Telefonar" />
          </div>
        </div>

        {aba === 'mensagem' ? (
          <div className="p-5 flex flex-col gap-3">
            {opcoes.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {opcoes.map((o, i) => (
                  <button key={o.titulo} type="button" onClick={() => setSel(i)}
                    className="px-3 py-2 rounded-lg border text-[12px] transition-colors"
                    style={i === sel ? { borderColor: OURO, background: `${OURO}1f`, color: '#fff' } : { borderColor: 'rgba(255,255,255,.12)', color: 'rgba(255,255,255,.6)' }}>
                    {o.titulo}
                  </button>
                ))}
              </div>
            )}
            <pre className="whitespace-pre-wrap font-sans text-[14px] leading-relaxed text-white/80 rounded-xl border border-white/10 bg-white/[0.03] p-4">{opcoes[sel].texto}</pre>
            {wa ? (
              <a href={wa} target="_blank" rel="noopener noreferrer" onClick={onEnviar}
                className="text-center py-3 rounded-xl border border-green-500/50 bg-green-500/15 hover:bg-green-500/25 text-green-300 text-[12px] font-semibold tracking-[0.2em] uppercase transition-colors">
                Enviar pelo WhatsApp
              </a>
            ) : <p className="text-[13px] text-red-300 text-center">Sem telefone válido na ficha.</p>}
          </div>
        ) : (
          <div className="p-5 flex flex-col gap-4 text-[14px] leading-relaxed text-white/80">
            <p className="text-white/55">{s.objetivo}</p>
            <div><Titulo>Abertura</Titulo><p>{s.abertura.replace('[nome]', nome.trim() || '')}</p></div>
            <div><Titulo>Perguntar</Titulo><ul className="list-disc pl-5 flex flex-col gap-1">{s.perguntas.map(p => <li key={p}>{p}</li>)}</ul></div>
            <div><Titulo>Fecho</Titulo><p>{s.fecho}</p></div>
            <div>
              <Titulo>Se disserem</Titulo>
              <div className="flex flex-col gap-2">
                {s.objecoes.map(o => (
                  <div key={o.se} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                    <p className="text-white font-medium">{`"${o.se}"`}</p>
                    <p className="mt-1 text-white/70">{o.resposta}</p>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-white/55">{s.semResposta}</p>
            <div className="flex gap-2 sticky bottom-0 bg-[#0f0f0f] py-2">
              {tel && (
                <a href={tel} className="flex-1 text-center py-3 rounded-xl border font-semibold text-[12px] tracking-[0.15em] uppercase text-white" style={{ borderColor: `${OURO}99`, background: `${OURO}1f` }}>
                  Ligar {contato}
                </a>
              )}
              <button type="button" onClick={onLigou}
                className="flex-1 py-3 rounded-xl border border-white/15 hover:border-white/35 text-white/80 font-semibold text-[12px] tracking-[0.15em] uppercase transition-colors">
                Já liguei
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
