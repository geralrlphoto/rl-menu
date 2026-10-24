'use client'
import { useState } from 'react'

// Secção "Enviar material": o membro cola o link da transferência e envia à RL PROD.

type Envio = { id: string; link: string; nota: string | null; enviadoEm: string }

export default function EnvioMaterial({ token, trabalho, inicial }: { token: string; trabalho: string; inicial: Envio[] }) {
  const [envios, setEnvios] = useState(inicial)
  const [link, setLink] = useState('')
  const [nota, setNota] = useState('')
  const [aEnviar, setAEnviar] = useState(false)
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState(false)

  async function chamar(corpo: Record<string, string>) {
    const r = await fetch('/api/equipa-rlprod/envio', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, trabalho, ...corpo }),
    })
    const d = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(d.error || 'Não foi possível enviar.')
    setEnvios(d.envios ?? [])
  }

  async function enviar() {
    setErro(''); setOk(false)
    if (!link.trim()) { setErro('Cola primeiro o link da transferência.'); return }
    setAEnviar(true)
    try { await chamar({ link, nota }); setLink(''); setNota(''); setOk(true) }
    catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível enviar.') }
    setAEnviar(false)
  }

  async function apagar(e: Envio) {
    if (!confirm('Apagar este envio?')) return
    try { await chamar({ apagar: e.id }) } catch { alert('Não foi possível apagar.') }
  }

  const INPUT = 'w-full rounded-md border border-white/[0.12] bg-[#00141f]/70 px-4 py-3 text-[15px] text-white placeholder:text-white/30 focus:outline-none focus:border-[#2e6cf6]'

  return (
    <section className="mt-10 rounded-2xl border border-[#2e6cf6]/50 bg-[#00141f]/80 p-5 sm:p-6">
      <p className="rlp-m text-[9.5px] text-[#a9c1ff]">Depois do trabalho</p>
      <h2 className="rlp-t mt-1 text-[28px] leading-none">Enviar material</h2>
      <p className="mt-2 text-[13.5px] text-white/60">Faz a transferência (WeTransfer, Google Drive, Dropbox…), cola aqui o link e carrega em Enviar. A RL PROD recebe logo um aviso.</p>

      <div className="mt-4 grid gap-3">
        <input className={INPUT} type="url" inputMode="url" placeholder="https://we.tl/..." value={link} onChange={e => setLink(e.target.value)} />
        <input className={INPUT} placeholder="Nota (opcional): ex. cartões A e B, falta o drone" value={nota} onChange={e => setNota(e.target.value)} />
        {erro && <p className="text-[13px] text-[#ff8a8a]">{erro}</p>}
        {ok && <p className="text-[13px] text-[#a9c1ff]">✓ Enviado. Obrigado!</p>}
        <div className="flex justify-end">
          <button type="button" onClick={enviar} disabled={aEnviar}
            className="rounded-full bg-[#2e6cf6] hover:bg-[#5a8bff] px-6 py-3 text-[14px] font-medium disabled:opacity-50">
            {aEnviar ? 'A enviar…' : 'Enviar à RL PROD'}
          </button>
        </div>
      </div>

      {envios.length > 0 && (
        <ul className="mt-5 divide-y divide-white/[0.07] border-t border-white/[0.07]">
          {[...envios].reverse().map(e => (
            <li key={e.id} className="flex items-center gap-3 py-3">
              <span className="text-[#5a8bff]">✓</span>
              <span className="min-w-0 flex-1">
                <a href={e.link} target="_blank" rel="noopener noreferrer" className="block truncate text-[13.5px] text-white hover:text-[#a9c1ff]">{e.link}</a>
                <span className="block text-[11.5px] text-white/45">
                  Enviado a {new Date(e.enviadoEm).toLocaleString('pt-PT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}{e.nota ? ` · ${e.nota}` : ''}
                </span>
              </span>
              <button type="button" onClick={() => apagar(e)} aria-label="Apagar envio" className="text-white/30 hover:text-[#ff4747] text-[13px]">✕</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
