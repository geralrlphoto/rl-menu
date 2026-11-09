'use client'

import { useState } from 'react'
import { ehIdExtra } from '@/lib/editoriaisEntregas'

// Botão + do cartão de um editorial: abre uma janela ao centro para mudar a senha e gerir os vídeos
// a entregar: título, formato e link de cada um, acrescentar vídeos novos e remover os que não vão
// existir (gravado em /api/editorial/admin).

type Def = { id: string; nome: string; formato: string }
type Grupo = { parceiro: string; sub: string; itens: Def[] }
type Video = {
  id: string; grupo: string; nome: string; formato: string; link: string; data: string
  extra?: boolean; oculto?: boolean; ordem?: number; padraoNome?: string; padraoFormato?: string
}

const novoId = () => 'extra-' + Math.random().toString(36).slice(2, 10)

export default function EditorialAdminButton({ slug, nome }: { slug: string; nome: string }) {
  const [aberto, setAberto] = useState(false)
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [videos, setVideos] = useState<Video[]>([])
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
      const gs: Grupo[] = d.grupos ?? []
      const ent: Record<string, any> = d.entregas ?? {}
      const lista: Video[] = gs.flatMap(g => g.itens.map(i => {
        const v = ent[i.id] ?? {}
        return {
          id: i.id, grupo: g.parceiro, nome: v.nome ?? i.nome, formato: v.formato ?? i.formato,
          link: v.link ?? '', data: v.data ?? '', oculto: !!v.oculto, padraoNome: i.nome, padraoFormato: i.formato,
        }
      }))
      const extras: Video[] = Object.entries(ent)
        .filter(([id, v]) => ehIdExtra(id) && v?.extra)
        .map(([id, v]) => ({
          id, grupo: gs.some(g => g.parceiro === v.grupo) ? v.grupo : gs[0]?.parceiro ?? '',
          nome: v.nome ?? '', formato: v.formato ?? '', link: v.link ?? '', data: v.data ?? '', extra: true, ordem: v.ordem ?? 0,
        }))
        .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
      setGrupos(gs); setVideos([...lista, ...extras])
      setSugerida(d.novaSugerida)
      setEstado('pronto')
    } catch (e) { setMsg(e instanceof Error ? e.message : 'Erro'); setEstado('erro') }
  }

  const mudar = (id: string, campos: Partial<Video>) => {
    setVideos(vs => vs.map(v => (v.id === id ? { ...v, ...campos } : v)))
    if (estado === 'gravado') setEstado('pronto')
  }
  const acrescentar = (grupo: string) => {
    setVideos(vs => [...vs, { id: novoId(), grupo, nome: '', formato: '', link: '', data: '', extra: true, ordem: Date.now() }])
    if (estado === 'gravado') setEstado('pronto')
  }
  const remover = (v: Video) => {
    if (v.extra) setVideos(vs => vs.filter(x => x.id !== v.id))
    else mudar(v.id, { oculto: true })
    if (estado === 'gravado') setEstado('pronto')
  }

  async function gravar() {
    setMsg('')
    if (videos.some(v => v.extra && !v.nome.trim())) { setMsg('Dá um título a cada vídeo acrescentado (ou remove-o).'); return }
    setEstado('a-gravar')
    const entregas: Record<string, object> = {}
    for (const v of videos) {
      const link = v.link.trim()
      const base = link ? { link, data: v.data || undefined } : {}
      if (v.extra) {
        entregas[v.id] = { ...base, extra: true, grupo: v.grupo, nome: v.nome.trim(), formato: v.formato.trim(), ordem: v.ordem }
      } else {
        const e: Record<string, unknown> = { ...base }
        if (v.nome.trim() && v.nome.trim() !== v.padraoNome) e.nome = v.nome.trim()
        if (v.formato.trim() !== v.padraoFormato) e.formato = v.formato.trim()
        if (v.oculto) e.oculto = true
        if (Object.keys(e).length) entregas[v.id] = e
      }
    }
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

  const visiveis = videos.filter(v => !v.oculto)
  const feitas = visiveis.filter(v => v.link.trim()).length
  const campo = 'bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#C9A84C]/40 placeholder:text-white/20'

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

                {/* Vídeos */}
                <section>
                  <div className="flex items-baseline justify-between mb-2">
                    <p className="text-[10px] tracking-widest text-white/40 uppercase">Vídeos a entregar</p>
                    <p className="text-[10px] tracking-widest text-white/30">{feitas} de {visiveis.length} entregues</p>
                  </div>
                  <div className="space-y-5">
                    {grupos.map(g => {
                      const doGrupo = videos.filter(v => v.grupo === g.parceiro)
                      const removidos = doGrupo.filter(v => v.oculto)
                      return (
                        <div key={g.parceiro}>
                          <p className="text-[11px] tracking-[0.25em] uppercase mb-2" style={{ color: 'rgba(201,168,76,0.7)' }}>{g.parceiro} · {g.sub}</p>
                          <div className="space-y-2">
                            {doGrupo.filter(v => !v.oculto).map(v => (
                              <div key={v.id} className="rounded-xl border border-white/[0.06] p-2.5 space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <input value={v.nome} onChange={e => mudar(v.id, { nome: e.target.value })} placeholder={v.padraoNome ?? 'Título do vídeo'}
                                    aria-label="Título do vídeo" className={`${campo} flex-1 min-w-0 font-semibold`} />
                                  <input value={v.formato} onChange={e => mudar(v.id, { formato: e.target.value })} placeholder="Formato"
                                    aria-label="Formato" className={`${campo} w-28 shrink-0`} />
                                  <button type="button" onClick={() => remover(v)} aria-label="Remover vídeo" title="Remover vídeo"
                                    className="shrink-0 w-7 h-7 rounded-full text-white/30 hover:text-red-400 hover:bg-white/5 text-sm">✕</button>
                                </div>
                                <div className="flex items-center gap-2">
                                  <input value={v.link} onChange={e => mudar(v.id, { link: e.target.value })} placeholder="https://… (Drive, WeTransfer, Vimeo)"
                                    aria-label="Link do vídeo" className={`${campo} flex-1 min-w-0`} />
                                  <span className={`shrink-0 text-[10px] tracking-wider ${v.link.trim() ? 'text-green-400' : 'text-white/25'}`}>{v.link.trim() ? 'Disponível' : 'Aguardar'}</span>
                                </div>
                              </div>
                            ))}
                            <button type="button" onClick={() => acrescentar(g.parceiro)}
                              className="w-full py-2 rounded-xl border border-dashed border-[#C9A84C]/30 text-[11px] tracking-widest uppercase hover:bg-[#C9A84C]/10 transition-all"
                              style={{ color: 'rgba(201,168,76,0.8)' }}>
                              + Adicionar vídeo
                            </button>
                            {removidos.length > 0 && (
                              <p className="text-[11px] text-white/30">
                                Removidos: {removidos.map((v, k) => (
                                  <span key={v.id}>{k > 0 && ', '}{v.nome || v.padraoNome}{' '}
                                    <button type="button" onClick={() => mudar(v.id, { oculto: false })} className="underline hover:text-white/60">repor</button>
                                  </span>
                                ))}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
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
