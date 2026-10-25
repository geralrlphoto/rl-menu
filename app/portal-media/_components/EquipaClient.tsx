'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CATEGORIAS } from '@/app/media/equipa/categorias'

// Equipa do projeto, só para o admin. Mostra todo o staff da RL PROD (/media/equipa):
// um clique põe a pessoa no projeto, outro clique tira. Pessoas de fora do staff
// entram pelo formulário. Grava em media_equipa_projeto via /api/media-equipa.

type Membro = { id: string; nome: string; funcao: string; contacto?: string | null; notas?: string | null; membro_id?: string | null; valor: number; pago: boolean; ver_guiao?: boolean; ver_briefing?: boolean; comprovativo_path?: string | null; envios?: { id: string; link: string; nota: string | null; enviadoEm: string }[] }
type Pessoa = { id: string; nome: string; categoria: string; funcao: string; contacto?: string | null; foto_url?: string | null; valorDia?: number }
type Financeiro = { valorProjeto: number; recebido: number; receitasExtra: number; custoEquipa: number; outrasDespesas: number; custoTotal: number }

const eur = (n: number) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(n)

const FUNCOES = ['Videógrafo', 'Diretor Criativo', 'Fotógrafo', 'Editor', 'Assistente', 'Drone', 'Som']
const iniciais = (n: string) => n.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase()

export default function EquipaClient({ portalRef, nome }: { portalRef: string; nome: string }) {
  const [equipa, setEquipa] = useState<Membro[] | null>(null)
  const [pessoas, setPessoas] = useState<Pessoa[]>([])
  const [fin, setFin] = useState<Financeiro | null>(null)
  const [valores, setValores] = useState<Record<string, string>>({})
  const [aMudar, setAMudar] = useState<string | null>(null)
  const [deFora, setDeFora] = useState(false)
  const [form, setForm] = useState({ nome: '', funcao: FUNCOES[0], contacto: '', notas: '', valor: '' })
  const [aGravar, setAGravar] = useState(false)
  const [erro, setErro] = useState('')

  // Recarrega equipa + contas (depois de cada mudança, para os totais baterem certo)
  function carregar() {
    return fetch(`/api/media-equipa?projeto=${encodeURIComponent(portalRef)}`)
      .then(r => r.json())
      .then(d => { setEquipa(d.equipa ?? []); setPessoas(d.pessoas ?? []); setFin(d.financeiro ?? null) })
      .catch(() => setEquipa(e => e ?? []))
  }
  useEffect(() => { carregar() // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portalRef])

  async function mudar(m: Membro, alt: { valor?: number; pago?: boolean; ver_guiao?: boolean; ver_briefing?: boolean }) {
    setEquipa(e => (e ?? []).map(x => x.id === m.id ? { ...x, ...alt } : x))
    const r = await fetch('/api/media-equipa', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: m.id, ...alt }) })
    if (!r.ok) alert('Não foi possível gravar.')
    carregar()
  }

  // Comprovativo do pagamento: carrega o ficheiro (PDF ou imagem) e marca como pago
  const [aCarregar, setACarregar] = useState<string | null>(null)
  async function carregarComprovativo(m: Membro, f: File) {
    setACarregar(m.id)
    const fd = new FormData(); fd.append('id', m.id); fd.append('file', f)
    try {
      const r = await fetch('/api/media-equipa/comprovativo', { method: 'POST', body: fd })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) alert(d.error || 'Não foi possível carregar o comprovativo.')
      await carregar()
    } catch { alert('Erro de ligação.') }
    setACarregar(null)
  }

  function gravarValor(m: Membro) {
    const txt = valores[m.id]
    if (txt === undefined) return
    const v = Number(txt.replace(',', '.')) || 0
    setValores(x => { const n = { ...x }; delete n[m.id]; return n })
    if (v !== Number(m.valor)) mudar(m, { valor: v })
  }

  const ligacao = (p: Pessoa) => (equipa ?? []).find(m => m.membro_id === p.id)

  // Um clique: entra no projeto (ou sai, se já lá estava)
  async function alternar(p: Pessoa) {
    if (aMudar) return
    setAMudar(p.id)
    const atual = ligacao(p)
    try {
      if (atual) {
        const r = await fetch(`/api/media-equipa?id=${atual.id}`, { method: 'DELETE' })
        if (r.ok) { setEquipa(e => (e ?? []).filter(x => x.id !== atual.id)); carregar() }
      } else {
        const r = await fetch('/api/media-equipa', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projeto_ref: portalRef, nome: p.nome, funcao: p.funcao, contacto: p.contacto, membro_id: p.id, valor: p.valorDia || 0 }),
        })
        const d = await r.json()
        if (r.ok) { setEquipa(e => [...(e ?? []), d.membro]); carregar() }
        else alert(d.error || 'Não foi possível pôr no projeto.')
      }
    } catch { alert('Erro de ligação.') }
    setAMudar(null)
  }

  async function nomearDeFora() {
    setErro('')
    if (!form.nome.trim()) { setErro('Escreve o nome da pessoa.'); return }
    setAGravar(true)
    try {
      const r = await fetch('/api/media-equipa', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, projeto_ref: portalRef }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setEquipa(e => [...(e ?? []), d.membro])
      carregar()
      setForm({ nome: '', funcao: FUNCOES[0], contacto: '', notas: '', valor: '' })
      setDeFora(false)
    } catch (e) { setErro(e instanceof Error && e.message ? e.message : 'Não foi possível gravar.') }
    setAGravar(false)
  }

  async function remover(m: Membro) {
    if (!confirm(`Tirar ${m.nome} da equipa deste projeto?`)) return
    const r = await fetch(`/api/media-equipa?id=${m.id}`, { method: 'DELETE' })
    if (r.ok) { setEquipa(e => (e ?? []).filter(x => x.id !== m.id)); carregar() }
  }

  const chip = (ativo: boolean) => `rounded-full border px-3.5 py-1.5 text-[12.5px] transition-colors ${ativo ? 'border-[#2e6cf6] bg-[#2e6cf6] text-white' : 'border-white/[0.14] text-white/70 hover:text-white hover:border-white/30'}`
  const INPUT = 'w-full rounded-md border border-white/[0.12] bg-[#00141f]/70 px-4 py-3 text-[15px] text-white placeholder:text-white/30 focus:outline-none focus:border-[#2e6cf6]'
  const fotoDe = (m: Membro) => pessoas.find(p => p.id === m.membro_id)?.foto_url

  const Avatar = ({ nome, foto, tam = 'w-14 h-14 text-[18px]' }: { nome: string; foto?: string | null; tam?: string }) => foto
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={foto} alt="" className={`${tam} shrink-0 rounded-full object-cover`} />
    : <span className={`rlp-t ${tam} shrink-0 rounded-full flex items-center justify-center bg-[#2e6cf6]/80 text-white`}>{iniciais(nome)}</span>

  return (
    <div className="rlp relative z-10 max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
      <Link href={`/portal-media/${portalRef}`}
        className="rlp-m inline-flex items-center gap-2 text-[11px] text-white/45 hover:text-white/80 transition-colors mb-10 group">
        <span className="group-hover:-translate-x-1 transition-transform duration-200">‹</span>
        Portal {nome}
      </Link>

      <header className="flex items-start justify-between gap-4 mb-8">
        <div className="min-w-0">
          <p className="rlp-m traco text-[11px] text-[#5a8bff] mb-3">RL PROD · {nome}</p>
          <h1 className="rlp-t text-4xl sm:text-5xl text-white leading-none">Equipa</h1>
          <p className="mt-4 text-[15px] text-white/60 leading-relaxed max-w-xl">
            Clica em quem vai trabalhar neste projeto. Clica outra vez para tirar. Só a RL PROD vê esta página.
          </p>
        </div>
        <span className="rlp-m shrink-0 inline-flex items-center gap-2 rounded-full border border-[#a9c1ff]/60 px-3 py-1.5 text-[9px] text-[#a9c1ff]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#a9c1ff] shrink-0" />
          Interno
        </span>
      </header>

      {/* Equipa escolhida: valor de cada um e se já foi pago */}
      <section className="mb-6 rounded-2xl border border-[#2e6cf6]/40 bg-[#00141f]/75 p-4 sm:p-5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="rlp-m text-[10px] text-[#a9c1ff]">No projeto{equipa ? ` · ${equipa.length}` : ''}</p>
          <span className="flex flex-wrap items-baseline gap-3">
            {fin && equipa && equipa.length > 0 && <span className="text-[12.5px] text-white/55">Custo da equipa <span className="rlp-t text-[16px] text-white">{eur(fin.custoEquipa)}</span></span>}
            {equipa && equipa.some(m => m.membro_id) && (
              <a href={`/media/credenciais/${encodeURIComponent(portalRef)}`} target="_blank" rel="noopener noreferrer"
                className="rounded-full bg-[#2e6cf6] hover:bg-[#5a8bff] px-4 py-1.5 text-[12.5px] font-medium">Credenciais da equipa</a>
            )}
          </span>
        </div>
        {equipa === null && <p className="mt-3 text-[14px] text-white/45">A carregar…</p>}
        {equipa && equipa.length === 0 && <p className="mt-3 text-[14px] text-white/50">Ainda ninguém. Escolhe abaixo.</p>}
        {equipa && equipa.length > 0 && (
          <ul className="mt-3 divide-y divide-white/[0.07]">
            {equipa.map(m => (
              <li key={m.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5">
                <Avatar nome={m.nome} foto={fotoDe(m)} tam="w-10 h-10 text-[13px]" />
                <span className="min-w-0 flex-1 basis-40">
                  {m.membro_id
                    ? <Link href={`/media/equipa/${m.membro_id}`} className="block truncate text-[14.5px] leading-tight text-white hover:text-[#a9c1ff]">{m.nome}</Link>
                    : <span className="block truncate text-[14.5px] leading-tight text-white">{m.nome}</span>}
                  <span className="block text-[11.5px] leading-tight text-white/45">{m.funcao}{m.membro_id ? '' : ' · de fora'}</span>
                </span>
                <label className="flex items-center gap-1.5 rounded-md border border-white/[0.12] bg-[#00141f]/70 px-2.5 py-1.5 focus-within:border-[#2e6cf6]">
                  <input inputMode="decimal" placeholder="0" aria-label={`Valor de ${m.nome}`}
                    value={valores[m.id] ?? (Number(m.valor) ? String(m.valor) : '')}
                    onChange={e => setValores(x => ({ ...x, [m.id]: e.target.value }))}
                    onBlur={() => gravarValor(m)}
                    onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                    className="w-20 bg-transparent text-right text-[14px] text-white placeholder:text-white/25 focus:outline-none" />
                  <span className="text-[13px] text-white/45">€</span>
                </label>
                <button type="button" onClick={() => mudar(m, { pago: !m.pago })} disabled={!Number(m.valor)}
                  className={`rlp-m rounded-full border px-3 py-1.5 text-[8.5px] transition-colors disabled:opacity-30 ${m.pago ? 'border-[#2e6cf6] bg-[#2e6cf6]/25 text-[#a9c1ff]' : 'border-[#ff4747]/50 text-[#ff8a8a] hover:bg-[#ff4747]/10'}`}>
                  {m.pago ? '✓ Pago' : 'Por pagar'}
                </button>
                {Number(m.valor) > 0 && (m.comprovativo_path ? (
                  <a href={`/api/media-equipa/comprovativo?id=${m.id}`} target="_blank" rel="noopener noreferrer" title="Ver o comprovativo enviado"
                    className="rlp-m rounded-full border border-[#2e6cf6]/60 px-3 py-1.5 text-[8.5px] text-[#a9c1ff] hover:text-white">↓ Comprovativo</a>
                ) : (
                  <label title="Carrega o comprovativo (PDF ou imagem). Fica marcado como pago."
                    className="rlp-m cursor-pointer rounded-full border border-dashed border-white/25 px-3 py-1.5 text-[8.5px] text-white/55 hover:text-white">
                    {aCarregar === m.id ? 'A carregar…' : '+ Comprovativo'}
                    <input type="file" accept="application/pdf,image/*" className="hidden" disabled={aCarregar === m.id}
                      onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) carregarComprovativo(m, f) }} />
                  </label>
                ))}
                {m.membro_id && (
                  <button type="button" onClick={() => mudar(m, { ver_briefing: !m.ver_briefing })}
                    title={m.ver_briefing ? 'Vê o briefing no portal da equipa' : 'Não vê o briefing'}
                    className={`rlp-m rounded-full border px-3 py-1.5 text-[8.5px] transition-colors ${m.ver_briefing ? 'border-[#2e6cf6] bg-[#2e6cf6]/25 text-[#a9c1ff]' : 'border-white/20 text-white/45 hover:text-white'}`}>
                    {m.ver_briefing ? '✓ Briefing' : 'Sem briefing'}
                  </button>
                )}
                {m.membro_id && (
                  <button type="button" onClick={() => mudar(m, { ver_guiao: !m.ver_guiao })}
                    title={m.ver_guiao ? 'Vê o guião criativo no portal da equipa' : 'Não vê o guião criativo'}
                    className={`rlp-m rounded-full border px-3 py-1.5 text-[8.5px] transition-colors ${m.ver_guiao ? 'border-[#2e6cf6] bg-[#2e6cf6]/25 text-[#a9c1ff]' : 'border-white/20 text-white/45 hover:text-white'}`}>
                    {m.ver_guiao ? '✓ Guião' : 'Sem guião'}
                  </button>
                )}
                {m.membro_id && (
                  <a href={`/media/credenciais/${encodeURIComponent(portalRef)}?membro=${m.membro_id}`} target="_blank" rel="noopener noreferrer"
                    className="rlp-m rounded-full border border-white/20 px-3 py-1.5 text-[8.5px] text-white/55 hover:text-white">Credencial</a>
                )}
                <button type="button" onClick={() => remover(m)} aria-label={`Tirar ${m.nome}`} className="text-white/30 hover:text-[#ff4747] text-[13px]">✕</button>
                {/* material enviado pela pessoa no portal da equipa */}
                {!!m.envios?.length && (
                  <div className="basis-full pl-[52px] grid gap-1">
                    {m.envios.map(e => (
                      <a key={e.id} href={e.link} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-md border border-[#2e6cf6]/40 bg-[#2e6cf6]/10 px-3 py-1.5 text-[12.5px] text-[#a9c1ff] hover:text-white">
                        <span>↓ Material</span>
                        <span className="text-white/45">{new Date(e.enviadoEm).toLocaleString('pt-PT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        {e.nota && <span className="truncate text-white/60">· {e.nota}</span>}
                        <span className="ml-auto">↗</span>
                      </a>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Contas do projeto (automáticas) */}
      {fin && (() => {
        const valor = fin.valorProjeto + fin.receitasExtra
        const lucro = valor - fin.custoTotal
        const porPagar = (equipa ?? []).filter(m => Number(m.valor) && !m.pago).length
        const cards = [
          { k: 'Valor do projeto', v: eur(valor), nota: `Recebido ${eur(fin.recebido)}`, cor: 'text-white' },
          { k: 'Custo da equipa', v: eur(fin.custoEquipa), nota: porPagar === 1 ? '1 por pagar' : `${porPagar} por pagar`, cor: 'text-white' },
          { k: 'Custo total', v: eur(fin.custoTotal), nota: `Outras despesas ${eur(fin.outrasDespesas)}`, cor: 'text-white' },
          { k: 'Lucro previsto', v: eur(lucro), nota: valor > 0 ? `Margem ${Math.round(lucro / valor * 100)}%` : 'Sem valor do projeto', cor: lucro < 0 ? 'text-[#ff4747]' : 'text-[#5a8bff]' },
        ]
        return (
          <section className="mb-10 grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {cards.map(x => (
              <div key={x.k} className="rounded-2xl border border-white/[0.08] bg-[#0c2236]/70 px-4 py-3.5">
                <p className="rlp-m text-[8.5px] text-white/45">{x.k}</p>
                <p className={`rlp-t mt-1.5 text-[22px] leading-none ${x.cor}`}>{x.v}</p>
                <p className="mt-1.5 text-[11.5px] text-white/40">{x.nota}</p>
              </div>
            ))}
            <p className="col-span-2 lg:col-span-4 text-[12px] text-white/40">
              O valor de cada pessoa entra sozinho como despesa do projeto no <Link href={`/portal-media/${portalRef}/pagamentos`} className="text-[#a9c1ff] hover:text-white">Financeiro</Link> e nas <Link href="/media/financas" className="text-[#a9c1ff] hover:text-white">Finanças</Link>.
            </p>
          </section>
        )
      })()}

      {/* Todo o staff, por categoria */}
      {equipa && pessoas.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/[0.14] bg-[#00141f]/50 px-6 py-10 text-center text-[14px] text-white/55">
          Ainda não há staff registado. <Link href="/media/equipa" className="text-[#5a8bff] hover:text-white">Adicionar pessoas à equipa RL PROD ›</Link>
        </div>
      )}
      {equipa && CATEGORIAS.map(c => {
        const lista = pessoas.filter(p => p.categoria === c.id)
        if (lista.length === 0) return null
        return (
          <section key={c.id} className="mb-8">
            <h2 className="rlp-t text-[22px] leading-none border-b border-white/[0.08] pb-2.5 mb-3">{c.nome}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {lista.map(p => {
                const dentro = !!ligacao(p)
                return (
                  <button key={p.id} type="button" onClick={() => alternar(p)} disabled={aMudar === p.id}
                    className={`relative flex flex-col items-center gap-2.5 rounded-2xl border px-3 py-4 text-center transition-colors disabled:opacity-60
                      ${dentro ? 'border-[#2e6cf6] bg-[#2e6cf6]/20' : 'border-white/[0.1] bg-[#0c2236]/70 hover:border-white/30'}`}>
                    <span className={`absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center text-[12px] border
                      ${dentro ? 'bg-[#2e6cf6] border-[#2e6cf6] text-white' : 'border-white/25 text-transparent'}`}>✓</span>
                    <Avatar nome={p.nome} foto={p.foto_url} />
                    <span className="min-w-0 w-full">
                      <span className="rlp-t block truncate text-[16px] leading-tight">{p.nome}</span>
                      <span className={`rlp-m block mt-1 text-[8.5px] ${dentro ? 'text-[#a9c1ff]' : 'text-white/40'}`}>
                        {aMudar === p.id ? 'A gravar…' : dentro ? 'No projeto' : 'Adicionar'}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        )
      })}

      {/* Pessoa de fora do staff */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={() => setDeFora(a => !a)} className="rlp-m text-[10px] text-[#a9c1ff] hover:text-white">
          {deFora ? '− Fechar' : '+ Pessoa de fora do staff'}
        </button>
        <Link href="/media/equipa" className="text-[12.5px] text-white/50 hover:text-white">Gerir equipa RL PROD ›</Link>
      </div>
      {deFora && (
        <section className="mt-3 rounded-2xl border border-dashed border-[#a9c1ff]/40 bg-[#00141f]/70 p-4 sm:p-6 grid gap-3">
          <input className={INPUT} placeholder="Nome" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
          <div className="flex flex-wrap gap-1.5">
            {FUNCOES.map(f => <button key={f} type="button" onClick={() => setForm(x => ({ ...x, funcao: f }))} className={chip(form.funcao === f)}>{f}</button>)}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className={INPUT} placeholder="Telemóvel ou email (opcional)" value={form.contacto} onChange={e => setForm(f => ({ ...f, contacto: e.target.value }))} />
            <input className={INPUT} placeholder="Notas (ex.: só no dia 12)" value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} />
            <input className={INPUT} placeholder="Valor do trabalho €" inputMode="decimal" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} />
          </div>
          {erro && <p className="text-[13px] text-[#ff8a8a]">{erro}</p>}
          <div className="flex justify-end">
            <button type="button" onClick={nomearDeFora} disabled={aGravar}
              className="rounded-md bg-[#2e6cf6] hover:bg-[#3d79ff] px-5 py-2.5 text-[14px] font-medium disabled:opacity-50">
              {aGravar ? 'A gravar…' : 'Pôr no projeto'}
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
