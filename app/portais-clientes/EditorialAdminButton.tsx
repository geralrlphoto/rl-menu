'use client'

import { useState } from 'react'

// Botão + do cartão de um editorial: abre uma janela ao centro para mudar a senha
// e colar os links dos vídeos a entregar (gravado em /api/editorial/admin).

type Item = { id: string; nome: string; formato: string }
type Grupo = { parceiro: string; sub: string; itens: Item[] }

export default function EditorialAdminButton({ slug, nome }: { slug: string; nome: string }) {
  const [aberto, setAberto] = useState(false)
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [links, setLinks] = useState<Record<string, string>>({})
  const [datas, setDatas] = useState<Record<string, string>>({})
  const [senha, setSenha] = useState('')
  const [sugerida, setSugerida] = useState('')
  const [estado, setEstado] = useState<'a-carregar' | 'pronto' | 'a-gravar' | 'gravado' | 'erro'>('a-carregar')
  const [msg, setMsg] = useState('')
  const [senhaGravada, setSenhaGravada] = useState('')

  async function abrir() {
    setAberto(true); setEstado('a-carregar'); setMsg(''); setSenha(''); setSenhaGravada('')
    try {
      const r = await fetch(`/api/editorial/admin?slug=${encodeURIComponent(slug)}`)
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Erro ao abrir')
      setGrupos(d.grupos)
      setLinks(Object.fromEntries(Object.entries(d.entregas ?? {}).map(([k, v]: [string, any]) => [k, v.link])))
      setDatas(Object.fromEntries(Object.entries(d.entregas ?? {}).map(([k, v]: [string, any]) => [k, v.data ?? ''])))
      setSugerida(d.novaSugerida)
      setEstado('pronto')
    } catch (e) { setMsg(e instanceof Error ? e.message : 'Erro'); setEstado('erro') }
  }

  async function gravar() {
    setEstado('a-gravar'); setMsg('')
    const entregas = Object.fromEntries(Object.entries(links).filter(([, l]) => l.trim()).map(([id, link]) => [id, { link: link.trim(), data: datas[id] || undefined }]))
    try {
      const r = await fetch('/api/editorial/admin', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, senha: senha.trim() || undefined, entregas }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d.error || 'Erro ao gravar')
      if (senha.trim()) setSenhaGravada(senha.trim().toUpperCase())
      setSenha('')
      setEstado('gravado')
    } catch (e) { setMsg(e instanceof Error ? e.message : 'Erro'); setEstado('pronto') }
  }

  const total = grupos.reduce((n, g) => n + g.itens.length, 0)
  const feitas = grupos.flatMap(g => g.itens).filter(i => links[i.id]?.trim()).length

  return (
    <>
      <button type="button" onClick={abrir} aria-label="Senha e entregas"
        className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-lg leading-none transition-all hover:bg-[#C9A84C] hover:text-black"
        style={{ color: '#C9A84C', border: '1px solid rgba(201,168,76,0.4)' }}>
        +
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={e => { if (e.target === e.currentTarget) setAberto(false) }}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setAberto(false)} />
          <div className="relative w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0d0d0d] p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-[10px] tracking-[0.35em] uppercase" style={{ color: 'rgba(201,168,76,0.7)' }}>Editorial</p>
                <h2 className="font-playfair font-black text-xl text-white mt-1">{nome}</h2>
              </div>
              <button onClick={() => setAberto(false)} className="text-white/30 hover:text-white/60 transition-colors text-xl leading-none">✕</button>
            </div>

            {estado === 'a-carregar' && <p className="text-white/40 text-sm animate-pulse tracking-widest text-center py-8">A carregar…</p>}
            {estado === 'erro' && <p className="text-xs text-red-400/80 py-4">{msg}</p>}

            {(estado === 'pronto' || estado === 'a-gravar' || estado === 'gravado') && (
              <div className="space-y-6">
                {/* Senha */}
                <section>
                  <p className="text-[10px] tracking-widest text-white/40 uppercase mb-2">Senha de acesso</p>
                  <p className="text-xs text-white/30 mb-2">A senha atual não se pode ver (fica guardada cifrada). Para mudar, escreve uma nova ou usa a sugerida; ao gravar, as pessoas com a senha antiga deixam de entrar.</p>
                  <div className="flex gap-2">
                    <input value={senha} onChange={e => setSenha(e.target.value.toUpperCase())} placeholder="Nova senha (deixar vazio = manter)"
                      className="flex-1 min-w-0 bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono text-sm tracking-widest outline-none focus:border-[#C9A84C]/40 placeholder:text-white/20 placeholder:tracking-normal" />
                    <button type="button" onClick={() => setSenha(sugerida)}
                      className="shrink-0 px-3 rounded-xl border border-white/10 text-white/50 text-[10px] tracking-widest uppercase hover:text-white/80">Gerar</button>
                  </div>
                  {senhaGravada && (
                    <p className="mt-2 text-xs text-green-400">Senha nova gravada: <span className="font-mono tracking-widest text-white">{senhaGravada}</span> (copia-a agora)</p>
                  )}
                </section>

                {/* Entregas */}
                <section>
                  <div className="flex items-baseline justify-between mb-2">
                    <p className="text-[10px] tracking-widest text-white/40 uppercase">Links dos vídeos</p>
                    <p className="text-[10px] tracking-widest text-white/30">{feitas} de {total} entregues</p>
                  </div>
                  <div className="space-y-4">
                    {grupos.map(g => (
                      <div key={g.parceiro}>
                        <p className="text-[11px] tracking-[0.25em] uppercase mb-2" style={{ color: 'rgba(201,168,76,0.7)' }}>{g.parceiro} · {g.sub}</p>
                        <div className="space-y-2">
                          {g.itens.map(i => (
                            <label key={i.id} className="block">
                              <span className="flex items-center justify-between text-xs text-white/70 mb-1">
                                <span>{i.nome} <span className="text-white/25">· {i.formato}</span></span>
                                <span className={links[i.id]?.trim() ? 'text-green-400' : 'text-white/25'}>{links[i.id]?.trim() ? 'Disponível' : 'Aguardar'}</span>
                              </span>
                              <input value={links[i.id] ?? ''} onChange={e => setLinks(l => ({ ...l, [i.id]: e.target.value }))} placeholder="https://… (Drive, WeTransfer, Vimeo)"
                                className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#C9A84C]/40 placeholder:text-white/20" />
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {msg && <p className="text-xs text-red-400/80">{msg}</p>}
                <div className="flex gap-3 pt-1">
                  <button onClick={() => setAberto(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/40 text-sm hover:text-white/60 transition-all">Fechar</button>
                  <button onClick={gravar} disabled={estado === 'a-gravar'}
                    className="flex-1 py-2.5 rounded-xl bg-[#C9A84C] text-black font-bold text-sm hover:bg-[#C9A84C]/80 transition-all disabled:opacity-40">
                    {estado === 'a-gravar' ? 'A gravar…' : estado === 'gravado' ? '✓ Gravado' : 'Gravar'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
