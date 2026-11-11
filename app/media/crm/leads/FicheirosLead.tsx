'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

// Secção "Ficheiros" na ficha da lead: apresentações, propostas, emails, etc.
// O envio vai direto para o Storage (sem passar pelo limite de tamanho da Vercel).

type Ficheiro = { path: string; nome: string; tamanho: number; criado: string }

const API = '/api/media-leads/ficheiros'

function tamanho(b: number) {
  if (!b) return ''
  if (b < 1024 * 1024) return `${Math.max(1, Math.round(b / 1024))} KB`
  return `${(b / 1024 / 1024).toFixed(1).replace('.', ',')} MB`
}

export default function FicheirosLead({ leadId, labelCls }: { leadId: string; labelCls: string }) {
  const [lista, setLista] = useState<Ficheiro[] | null>(null)
  const [enviando, setEnviando] = useState('')
  const [erro, setErro] = useState('')
  const input = useRef<HTMLInputElement>(null)

  async function carregar() {
    const r = await fetch(`${API}?lead=${leadId}`).catch(() => null)
    const j = r && r.ok ? await r.json() : { ficheiros: [] }
    setLista(j.ficheiros ?? [])
  }
  useEffect(() => { carregar() }, [leadId])

  async function enviar(files: FileList | null) {
    if (!files?.length) return
    setErro('')
    try {
      for (const f of Array.from(files)) {
        if (f.size > 50 * 1024 * 1024) throw new Error(`${f.name} tem mais de 50 MB.`)
        setEnviando(f.name)
        const p = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lead: leadId, nome: f.name }) })
        const j = await p.json()
        if (!p.ok) throw new Error(j.error)
        const { error } = await supabase.storage.from('ficheiros-leads').uploadToSignedUrl(j.path, j.token, f, { contentType: f.type || 'application/octet-stream' })
        if (error) throw new Error(error.message)
      }
      await carregar()
    } catch (e) {
      setErro(e instanceof Error && e.message ? e.message : 'Não foi possível enviar.')
    } finally {
      setEnviando('')
      if (input.current) input.current.value = ''
    }
  }

  async function apagar(f: Ficheiro) {
    if (!confirm(`Apagar "${f.nome}"? Não dá para recuperar.`)) return
    await fetch(API, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lead: leadId, path: f.path }) })
    carregar()
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className={labelCls}>Ficheiros{lista && lista.length > 0 ? ` · ${lista.length}` : ''}</p>
        <button onClick={() => input.current?.click()} disabled={!!enviando}
          className="text-[11px] tracking-[0.2em] uppercase px-4 py-2 border border-[#2e6cf6]/60 text-[#a9c1ff] hover:bg-[#2e6cf6]/15 rounded-full transition-colors disabled:opacity-40">
          {enviando ? 'A enviar…' : '+ Anexar'}
        </button>
        <input ref={input} type="file" multiple className="hidden" onChange={e => enviar(e.target.files)} />
      </div>

      {erro && <p className="text-[12px] text-[#ff4747] mb-2">{erro}</p>}
      {enviando && <p className="text-[12px] text-white/40 mb-2">A enviar {enviando}…</p>}

      {lista === null ? (
        <p className="text-[12px] text-white/30">A carregar…</p>
      ) : lista.length === 0 ? (
        <p className="text-[12.5px] text-white/30">Sem ficheiros anexados.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-white/[0.06] border border-white/[0.06] bg-white/[0.02]">
          {lista.map(f => {
            const ext = (f.nome.split('.').pop() || '').toUpperCase().slice(0, 4)
            return (
              <li key={f.path} className="flex items-center gap-4 px-4 py-3">
                <span className="shrink-0 w-11 text-center text-[10px] font-mono tracking-wider text-[#5a8bff] border border-[#5a8bff]/30 rounded py-1">{ext || 'FICH'}</span>
                <a href={`${API}?lead=${leadId}&abrir=${encodeURIComponent(f.path)}`} target="_blank" rel="noopener noreferrer"
                  className="flex-1 min-w-0 text-[13.5px] text-white/75 hover:text-white truncate">{f.nome} ↗</a>
                <span className="shrink-0 text-[11px] text-white/30 font-mono hidden sm:block">{tamanho(f.tamanho)}</span>
                <button onClick={() => apagar(f)} className="shrink-0 text-[11px] text-white/25 hover:text-[#ff4747] transition-colors">Apagar</button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
