'use client'

import { useEffect, useState } from 'react'
import { whatsappLink, nomeNoivos } from '@/lib/crm'

/* Sneak peek (ficha › Ações Fotografia): link das primeiras fotografias do dia,
   enviado aos noivos por WhatsApp com a mensagem já escrita. Grava o link e o dia
   em portais.settings (sneakpeek_url / sneakpeek_enviada), as mesmas chaves que o
   Departamento de Fotografia e o cartão "Sneak Peek" do portal usam.
   Mensagem aos noivos: sem referência, sem emojis, sem "(Mensagem automática)". */

function mensagemSneakPeek(nome: string, url: string) {
  return `Olá ${nome}!\n\nAinda com o coração cheio do vosso casamento, não conseguimos esperar: aqui ficam as primeiras fotografias do vosso dia.\n\n${url}\n\nA galeria completa chega nos próximos dias. Esperamos que gostem tanto quanto nós gostámos de as fazer!\n\nUm abraço,\nRL Photo.Video`
}

const fmt = (iso: string) => new Date(iso.slice(0, 10) + 'T12:00:00Z').toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })

export default function SneakPeekWhatsApp({ e }: { e: any }) {
  const ref: string | null = e?.referencia ?? null
  const [url, setUrl] = useState('')
  const [enviada, setEnviada] = useState<string | null>(null)
  const [quem, setQuem] = useState<'noiva' | 'noivo'>(e?.tel_noiva ? 'noiva' : 'noivo')

  useEffect(() => {
    if (!ref) return
    fetch(`/api/portais?ref=${encodeURIComponent(ref)}`).then(r => r.ok ? r.json() : null).then(d => {
      const s = d?.portal?.settings ?? {}
      if (typeof s.sneakpeek_url === 'string') setUrl(s.sneakpeek_url)
      if (s.sneakpeek_enviada) setEnviada(String(s.sneakpeek_enviada))
    }).catch(() => {})
  }, [ref])

  const tel = quem === 'noiva' ? e?.tel_noiva : e?.tel_noivo
  const valido = /^https?:\/\//i.test(url.trim())
  const href = valido ? whatsappLink(tel, mensagemSneakPeek(nomeNoivos(e?.cliente, e?.nome_noiva, e?.nome_noivo), url.trim())) : null

  async function guardar(campos: Record<string, unknown>) {
    if (!ref) return
    await fetch('/api/portais', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referencia: ref, updates: { settings: campos } }),
    }).catch(() => {})
  }

  async function enviar() {
    if (!href) return
    window.open(href, '_blank')
    const hoje = new Date().toISOString().slice(0, 10)
    setEnviada(hoje)
    await guardar({ sneakpeek_url: url.trim(), sneakpeek_enviada: hoje })
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm text-white/80">Sneak Peek</p>
          <p className="text-[11px] text-white/35">As primeiras fotografias do dia · até 48 horas depois do casamento</p>
        </div>
        <div className="flex items-center gap-2">
          {e?.tel_noiva && e?.tel_noivo && (
            <div className="flex rounded-lg border border-white/10 overflow-hidden text-[10px] tracking-[0.15em] uppercase">
              {(['noiva', 'noivo'] as const).map(q => (
                <button key={q} type="button" onClick={() => setQuem(q)}
                  className={`px-2.5 py-1.5 ${quem === q ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}>{q}</button>
              ))}
            </div>
          )}
          <button type="button" onClick={enviar} disabled={!href}
            title={!valido ? 'Cola primeiro o link do sneak peek' : !tel ? 'Sem telemóvel na ficha (Dados do Casal)' : 'Abrir o WhatsApp com a mensagem'}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold tracking-[0.15em] uppercase border transition-all ${
              href ? 'bg-[#25D366]/15 text-[#25D366] border-[#25D366]/40 hover:bg-[#25D366]/25' : 'bg-white/[0.03] text-white/20 border-white/10 cursor-not-allowed'}`}>
            {enviada ? '✓ Reenviar por WhatsApp' : 'Enviar por WhatsApp'}
          </button>
        </div>
      </div>
      <input type="url" placeholder="Cola aqui o link do sneak peek…" value={url}
        onChange={ev => setUrl(ev.target.value)}
        onBlur={() => { if (valido) guardar({ sneakpeek_url: url.trim() }) }}
        className="bg-white/[0.03] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white/60 placeholder-white/20 focus:outline-none focus:border-blue-400/40 transition-colors" />
      {enviada && <p className="text-[11px] text-green-400/80">✓ Enviado aos noivos a {fmt(enviada)}</p>}
      {valido && !tel && <p className="text-[11px] text-amber-300/80">Sem telemóvel da {quem} na ficha. Preenche-o em Dados do Casal.</p>}
      <div className="h-px bg-white/5 mt-2" />
    </div>
  )
}
