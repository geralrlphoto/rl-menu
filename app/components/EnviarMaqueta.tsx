'use client'
import { useState } from 'react'

// ── Enviar a maqueta à RL (link) ─────────────────────────────────────────────
// O álbum passa a "Revisão RL": a RL vê a maqueta no Departamento de Fotografia
// antes de a enviar aos noivos (POST /api/freelancer-album/maqueta).
export function EnviarMaqueta({ referencia, onEnviada }: { referencia: string; onEnviada: () => void }) {
  const [url, setUrl] = useState('')
  const [estado, setEstado] = useState<'' | 'a enviar' | 'erro'>('')
  const [msg, setMsg] = useState('')
  async function enviar() {
    setEstado('a enviar'); setMsg('')
    const r = await fetch('/api/freelancer-album/maqueta', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referencia, url: url.trim() }),
    }).catch(() => null)
    const d = r ? await r.json().catch(() => ({})) : {}
    if (!r?.ok) { setEstado('erro'); setMsg((d as any).error || 'Não foi possível enviar.'); return }
    setEstado(''); setUrl(''); onEnviada()
  }
  return (
    <div className="mt-3 flex flex-col gap-2 rounded-xl border border-gold/20 bg-gold/[0.04] p-3">
      <p className="text-[12px] tracking-[0.2em] uppercase text-gold/70">Entregar o álbum à RL</p>
      <div className="flex gap-2 flex-wrap">
        <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://… (link do álbum)"
          className="flex-1 min-w-[200px] rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[14px] text-white outline-none focus:border-gold/50" />
        <button type="button" onClick={enviar} disabled={estado === 'a enviar' || !/^https?:\/\//i.test(url.trim())}
          className="rounded-xl border border-gold/40 bg-gold/10 px-4 py-2 text-[13px] tracking-[0.15em] uppercase text-gold hover:bg-gold/20 disabled:opacity-40">
          {estado === 'a enviar' ? 'A entregar…' : 'Entregar o álbum'}
        </button>
      </div>
      {estado === 'erro' && <p className="text-[13px] text-red-400">{msg}</p>}
      <p className="text-[12px] text-white/35">A RL recebe um email, revê o álbum e envia-o aos noivos. Se houver alterações, recebes um aviso aqui e por email.</p>
    </div>
  )
}
