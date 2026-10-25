'use client'

import { use, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FUNDO } from '@/app/media/_lib/estilo'
import { lerData, hojeLisboa } from '@/app/media/_lib/eventos'
import { CATEGORIAS, singular, type CategoriaId, type FichaDados, type MembroEquipa } from '../categorias'

// Ficha de um membro da equipa RL PROD: a RL PROD preenche os dados
// (contactos, perfil, especialidades, preferências, pagamento) e vê os projetos.

type Projeto = { ref: string; funcao: string; nome: string; filmagem: string | null; status: string | null; valor: number; pago: boolean }
type Membro = MembroEquipa & { foto_url?: string | null; dados: FichaDados; criado_em: string; projetos: Projeto[]; acesso_token?: string; senha?: string }

const eur = (n: number) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(n)

const CARD = 'rounded-2xl border border-white/[0.1] bg-[#00141f]/75 backdrop-blur-sm p-5 sm:p-6'
const INPUT = 'w-full rounded-md border border-white/[0.12] bg-[#00141f]/70 px-3 py-2 text-[14px] text-white placeholder:text-white/25 focus:outline-none focus:border-[#2e6cf6]'
const DISPONIBILIDADE = ['Disponível para novos projetos', 'Disponibilidade limitada', 'Indisponível']
const PAGAMENTO = ['Transferência bancária', 'MB WAY', 'Recibo verde', 'Fatura']

const iniciais = (n: string) => n.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase()
const insta = (v: string) => v.replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/$/, '')
const dataPt = (iso: string) => new Date(iso).toLocaleDateString('pt-PT')

export default function FichaMembro({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [m, setM] = useState<Membro | null>(null)
  const [erroCarregar, setErroCarregar] = useState(false)
  const [editar, setEditar] = useState(false)
  const [rasc, setRasc] = useState<Membro | null>(null)
  const [aGravar, setAGravar] = useState(false)
  const [aCarregarFoto, setACarregarFoto] = useState(false)
  const [mostrarIban, setMostrarIban] = useState(false)
  const fotoRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(`/api/media-equipa/membros?id=${id}`).then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setM({ ...d.membro, dados: d.membro.dados ?? {} }))
      .catch(() => setErroCarregar(true))
  }, [id])

  const v = editar ? rasc : m
  const setD = (k: keyof FichaDados, val: FichaDados[keyof FichaDados]) => setRasc(r => r && ({ ...r, dados: { ...r.dados, [k]: val } }))
  const setC = (k: 'nome' | 'categoria' | 'telefone' | 'email' | 'instagram' | 'notas', val: string) => setRasc(r => r && ({ ...r, [k]: val }))

  function comecar() { setRasc(m && JSON.parse(JSON.stringify(m))); setEditar(true) }

  async function guardar() {
    if (!rasc) return
    if (!rasc.nome.trim()) { alert('O nome não pode ficar vazio.'); return }
    setAGravar(true)
    const especialidades = (rasc.dados.especialidades ?? []).filter(e => e.nome.trim())
    const r = await fetch('/api/media-equipa/membros', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id, nome: rasc.nome, categoria: rasc.categoria, telefone: rasc.telefone, email: rasc.email,
        instagram: rasc.instagram, notas: rasc.notas, foto_url: rasc.foto_url, dados: { ...rasc.dados, especialidades },
      }),
    })
    const d = await r.json()
    setAGravar(false)
    if (!r.ok) { alert(d.error || 'Não foi possível guardar.'); return }
    setM(x => x && ({ ...x, ...d.membro, dados: d.membro.dados ?? {} }))
    setEditar(false)
  }

  async function carregarFoto(f: File) {
    setACarregarFoto(true)
    const fd = new FormData(); fd.append('file', f)
    try {
      const d = await fetch('/api/upload-image', { method: 'POST', body: fd }).then(r => r.json())
      if (!d.url) { alert(d.error || 'Não foi possível carregar a foto.'); setACarregarFoto(false); return }
      // Grava já, mesmo fora do modo de edição
      const r = await fetch('/api/media-equipa/membros', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, foto_url: d.url }) })
      if (!r.ok) alert('A foto foi carregada mas não ficou gravada. Tenta outra vez.')
      else { setM(x => x && ({ ...x, foto_url: d.url })); setRasc(x => x && ({ ...x, foto_url: d.url })) }
    } catch { alert('Erro de ligação.') }
    setACarregarFoto(false)
  }

  async function alternarAtivo() {
    if (!m) return
    const r = await fetch('/api/media-equipa/membros', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ativo: !m.ativo }) })
    if (r.ok) setM({ ...m, ativo: !m.ativo })
  }

  async function apagar() {
    if (!m || !confirm(`Apagar a ficha de ${m.nome}? Os projetos onde foi nomeado mantêm o nome.`)) return
    const r = await fetch(`/api/media-equipa/membros?id=${id}`, { method: 'DELETE' })
    if (r.ok) router.push('/media/equipa')
  }

  if (erroCarregar) return <Moldura><p className="mt-10 text-white/60">Membro não encontrado. <Link href="/media/equipa" className="text-[#5a8bff]">Voltar à equipa</Link></p></Moldura>
  if (!v) return <Moldura><p className="mt-10 text-white/45">A carregar…</p></Moldura>

  const d = v.dados
  const hoje = hojeLisboa()
  const proximos = v.projetos.filter(p => { const x = lerData(p.filmagem); return x && x >= hoje })
  const anoAtual = v.projetos.filter(p => lerData(p.filmagem)?.getFullYear() === hoje.getFullYear())
  const esp = d.especialidades ?? []

  // Campo de texto: mostra o valor ou um input quando está a editar
  const linha = ({ rotulo, k, tipo = 'text', placeholder, opcoes, secreto }: { rotulo: string; k: keyof FichaDados; tipo?: string; placeholder?: string; opcoes?: string[]; secreto?: boolean }) => {
    const val = (d[k] as string | undefined) ?? ''
    return (
      <div className="flex items-center justify-between gap-4 py-2.5 border-b border-white/[0.06] last:border-0">
        <span className="text-[12.5px] text-white/45 shrink-0">{rotulo}</span>
        {editar ? (
          opcoes ? (
            <select className={INPUT + ' max-w-[60%] [color-scheme:dark]'} value={val} onChange={e => setD(k, e.target.value)}>
              <option value="">·</option>
              {opcoes.map(o => <option key={o}>{o}</option>)}
            </select>
          ) : (
            <input className={INPUT + ' max-w-[60%] text-right [color-scheme:dark]'} type={tipo} placeholder={placeholder} value={val} onChange={e => setD(k, e.target.value)} />
          )
        ) : (
          <span className="text-[13.5px] text-white/90 text-right min-w-0 break-words">
            {val ? (secreto && !mostrarIban ? `${val.slice(0, 4)} •••• ${val.slice(-4)}` : tipo === 'date' ? dataPt(val) : val) : <span className="text-white/25">·</span>}
          </span>
        )}
      </div>
    )
  }

  const Titulo = ({ children }: { children: React.ReactNode }) => <h2 className="rlp-t text-[22px] leading-none mb-4">{children}</h2>

  return (
    <Moldura>
      {/* cabeçalho */}
      <header className="mt-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
        <div className="min-w-0">
          <p className="rlp-m traco text-[10.5px] text-[#5a8bff]">RL Prod · Equipa · {singular(v.categoria)}</p>
          <h1 className="rlp-t text-[48px] sm:text-[72px] leading-[0.9] mt-3 break-words">{v.nome}.</h1>
          <p className="rlp-m mt-3 text-[10.5px] text-white/50">Dados · Projetos · Pagamentos</p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          {editar ? (
            <>
              <button onClick={() => setEditar(false)} className="rounded-full border border-white/[0.16] px-5 py-3 text-[13.5px] text-white/75 hover:text-white">Cancelar</button>
              <button onClick={guardar} disabled={aGravar} className="rounded-full bg-[#2e6cf6] hover:bg-[#5a8bff] px-6 py-3 text-[13.5px] font-medium disabled:opacity-50">{aGravar ? 'A guardar…' : 'Guardar ficha'}</button>
            </>
          ) : (
            <button onClick={comecar} className="rounded-full bg-[#2e6cf6] hover:bg-[#5a8bff] px-6 py-3 text-[13.5px] font-medium">✎ Editar ficha</button>
          )}
        </div>
      </header>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {/* cartão de perfil */}
        <section className={CARD}>
          <div className="flex items-start gap-4">
            {/* foto: clicar no círculo carrega e grava logo */}
            <button type="button" onClick={() => fotoRef.current?.click()} disabled={aCarregarFoto}
              className="group relative shrink-0 w-24 h-24 rounded-full" aria-label="Carregar foto" title="Carregar foto">
              {v.foto_url
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={v.foto_url} alt="" className="w-24 h-24 rounded-full object-cover border-2 border-[#2e6cf6]" />
                : <span className="rlp-t w-24 h-24 rounded-full flex items-center justify-center bg-[#2e6cf6] text-[32px]">{iniciais(v.nome)}</span>}
              <span className={`absolute inset-0 rounded-full flex flex-col items-center justify-center bg-black/55 text-[11px] text-white transition-opacity ${aCarregarFoto ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                {aCarregarFoto ? 'A carregar…' : <><span className="text-[18px]">📷</span>{v.foto_url ? 'Mudar' : 'Foto'}</>}
              </span>
              <span className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#00141f] border border-white/25 flex items-center justify-center text-[13px]">📷</span>
            </button>
            <input ref={fotoRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) carregarFoto(f) }} />
            <div className="min-w-0 flex-1">
              {editar
                ? <input className={INPUT + ' rlp-t text-[18px]'} value={v.nome} onChange={e => setC('nome', e.target.value)} />
                : <p className="rlp-t text-[24px] leading-tight break-words">{v.nome}</p>}
              <span className={`rlp-m mt-2 inline-block rounded-full border px-2.5 py-1 text-[8.5px] ${v.ativo ? 'border-[#2e6cf6] text-[#a9c1ff]' : 'border-white/20 text-white/45'}`}>
                {v.ativo ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          </div>

          {editar ? (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {CATEGORIAS.map(c => (
                <button key={c.id} onClick={() => setC('categoria', c.id as CategoriaId)}
                  className={`rounded-full border px-3 py-1 text-[12px] ${v.categoria === c.id ? 'border-[#2e6cf6] bg-[#2e6cf6]' : 'border-white/[0.14] text-white/65'}`}>{c.singular}</button>
              ))}
            </div>
          ) : <p className="rlp-m mt-4 text-[10px] text-[#5a8bff]">{singular(v.categoria)}</p>}

          <div className="mt-4 grid gap-2.5 text-[13.5px]">
            {editar ? (
              <>
                <input className={INPUT} placeholder="Email" value={v.email ?? ''} onChange={e => setC('email', e.target.value)} />
                <input className={INPUT} placeholder="Telemóvel" value={v.telefone ?? ''} onChange={e => setC('telefone', e.target.value)} />
                <input className={INPUT} placeholder="Instagram" value={v.instagram ?? ''} onChange={e => setC('instagram', e.target.value)} />
              </>
            ) : (
              <>
                <Contacto icone="✉" valor={v.email} href={v.email ? `mailto:${v.email}` : undefined} />
                <Contacto icone="✆" valor={v.telefone} href={v.telefone ? `tel:${v.telefone.replace(/\s/g, '')}` : undefined} />
                {v.telefone && <Contacto icone="◍" valor="WhatsApp" href={`https://wa.me/${(v.telefone.replace(/\D/g, '').length === 9 ? '351' : '') + v.telefone.replace(/\D/g, '')}`} />}
                <Contacto icone="◎" valor={v.instagram ? `@${insta(v.instagram)}` : null} href={v.instagram ? `https://instagram.com/${insta(v.instagram)}` : undefined} />
                <Contacto icone="◉" valor={d.localizacao} />
              </>
            )}
          </div>
          <p className="mt-5 border-t border-white/[0.07] pt-3 text-[12px] text-white/40">Na equipa desde {dataPt(v.criado_em)}</p>
        </section>

        {/* informações */}
        <section className={CARD}>
          <Titulo>Informações</Titulo>
          {linha({ rotulo: "Nome completo", k: "nomeCompleto" })}
          {linha({ rotulo: "Data de nascimento", k: "nascimento", tipo: "date" })}
          {linha({ rotulo: "Localização", k: "localizacao", placeholder: "Setúbal" })}
          {linha({ rotulo: "Morada", k: "morada" })}
          {linha({ rotulo: "Portfólio / site", k: "website", placeholder: "https://" })}
          {linha({ rotulo: "Idiomas", k: "idiomas", placeholder: "Português, Inglês" })}
        </section>

        {/* resumo */}
        <section className={CARD}>
          <Titulo>Resumo da atividade</Titulo>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { k: 'Projetos', v: v.projetos.length },
              { k: 'Próximos', v: proximos.length },
              { k: `Em ${hoje.getFullYear()}`, v: anoAtual.length },
              { k: 'Valor / dia', v: d.valorDia ? `${d.valorDia} €` : '·' },
              { k: 'Por pagar', v: eur(v.projetos.filter(p => !p.pago).reduce((s, p) => s + p.valor, 0)) },
              { k: 'Já pago', v: eur(v.projetos.filter(p => p.pago).reduce((s, p) => s + p.valor, 0)) },
            ].map(x => (
              <div key={x.k} className="rounded-xl bg-[#0c2236]/70 px-3.5 py-3">
                <p className="rlp-m text-[8.5px] text-white/45">{x.k}</p>
                <p className="rlp-t mt-1.5 text-[26px] leading-none">{x.v}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[13px] text-white/55">{d.disponibilidade || 'Disponibilidade por indicar'}</p>
        </section>

        {/* sobre */}
        <section className={CARD + ' lg:col-span-2'}>
          <Titulo>Sobre</Titulo>
          {editar
            ? <textarea className={INPUT + ' min-h-[110px]'} placeholder="Trabalho, experiência e estilo desta pessoa" value={d.sobre ?? ''} onChange={e => setD('sobre', e.target.value)} />
            : <p className="text-[14px] leading-relaxed text-white/70 whitespace-pre-line">{d.sobre || 'Sem descrição. Carrega em Editar ficha para escrever sobre o trabalho e o estilo desta pessoa.'}</p>}
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {([['Experiência', 'experiencia', '6+ anos'], ['Estilo', 'estilo', 'Cinemático, emocional']] as const).map(([r, k, ph]) => (
              <div key={k} className="rounded-xl bg-[#0c2236]/70 px-4 py-3">
                <p className="rlp-m text-[8.5px] text-white/45">{r}</p>
                {editar
                  ? <input className={INPUT + ' mt-1.5'} placeholder={ph} value={d[k] ?? ''} onChange={e => setD(k, e.target.value)} />
                  : <p className="rlp-t mt-1.5 text-[18px]">{d[k] || '·'}</p>}
              </div>
            ))}
          </div>
        </section>

        {/* especialidades */}
        <section className={CARD}>
          <Titulo>Especialidades</Titulo>
          {esp.length === 0 && !editar && <p className="text-[13.5px] text-white/45">Sem especialidades indicadas.</p>}
          <div className="grid gap-3.5">
            {esp.map((e, i) => editar ? (
              <div key={i} className="flex items-center gap-2">
                <input className={INPUT} placeholder="Ex.: Color grading" value={e.nome} onChange={x => setD('especialidades', esp.map((y, j) => j === i ? { ...y, nome: x.target.value } : y))} />
                <input className={INPUT + ' w-20 text-right'} type="number" min={0} max={100} value={e.nivel} onChange={x => setD('especialidades', esp.map((y, j) => j === i ? { ...y, nivel: Math.max(0, Math.min(100, Number(x.target.value))) } : y))} />
                <button onClick={() => setD('especialidades', esp.filter((_, j) => j !== i))} className="text-white/35 hover:text-[#ff4747]" aria-label="Remover">✕</button>
              </div>
            ) : (
              <div key={i}>
                <div className="flex justify-between text-[13px]"><span className="text-white/80">{e.nome}</span><span className="text-white/45">{e.nivel}%</span></div>
                <div className="mt-1.5 h-1.5 rounded-full bg-white/[0.08] overflow-hidden"><div className="h-full rounded-full bg-[#2e6cf6]" style={{ width: `${e.nivel}%` }} /></div>
              </div>
            ))}
          </div>
          {editar && <button onClick={() => setD('especialidades', [...esp, { nome: '', nivel: 80 }])} className="rlp-m mt-3 text-[10px] text-[#a9c1ff] hover:text-white">+ Especialidade</button>}
        </section>

        {/* preferências */}
        <section className={CARD}>
          <Titulo>Trabalho</Titulo>
          {linha({ rotulo: "Disponibilidade", k: "disponibilidade", opcoes: DISPONIBILIDADE })}
          {linha({ rotulo: "Dias de trabalho", k: "diasTrabalho", placeholder: "Segunda a sábado" })}
          {linha({ rotulo: "Horário", k: "horario", placeholder: "09:00 - 18:00" })}
          {linha({ rotulo: "Comunicação", k: "comunicacao", placeholder: "WhatsApp, email" })}
          {linha({ rotulo: "Valor por dia (€)", k: "valorDia", placeholder: "250" })}
          {linha({ rotulo: "Meio dia (€)", k: "valorMeioDia", placeholder: "150" })}
        </section>

        {/* pagamento */}
        <section className={CARD}>
          <div className="flex items-baseline justify-between gap-3">
            <Titulo>Pagamento</Titulo>
            {!editar && d.iban && <button onClick={() => setMostrarIban(s => !s)} className="rlp-m text-[9.5px] text-[#a9c1ff] hover:text-white">{mostrarIban ? 'Esconder' : 'Mostrar'}</button>}
          </div>
          {linha({ rotulo: "Método", k: "metodoPagamento", opcoes: PAGAMENTO })}
          {linha({ rotulo: "IBAN", k: "iban", placeholder: "PT50 ...", secreto: true })}
          {linha({ rotulo: "Titular", k: "titular" })}
          {linha({ rotulo: "NIF", k: "nif" })}
        </section>

        {/* equipamento */}
        <section className={CARD}>
          <Titulo>Equipamento</Titulo>
          {editar
            ? <textarea className={INPUT + ' min-h-[110px]'} placeholder="Câmaras, lentes, drone, áudio..." value={d.equipamento ?? ''} onChange={e => setD('equipamento', e.target.value)} />
            : <p className="text-[14px] leading-relaxed text-white/70 whitespace-pre-line">{d.equipamento || 'Sem equipamento indicado.'}</p>}
        </section>

        {/* projetos */}
        <section className={CARD + ' lg:col-span-2'}>
          <Titulo>Projetos</Titulo>
          {v.projetos.length === 0 ? (
            <p className="text-[13.5px] text-white/45">Ainda não foi nomeado em nenhum projeto. Nomeia na página Equipa de cada portal.</p>
          ) : (
            <ul className="divide-y divide-white/[0.07]">
              {v.projetos.map((p, i) => {
                const data = lerData(p.filmagem)
                return (
                  <li key={p.ref + i}>
                    <Link href={`/portal-media/${p.ref}/equipa`} className="flex items-center gap-3 py-3 group">
                      <span className="rlp-m w-20 shrink-0 text-[9px] text-white/45">{data ? data.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: '2-digit' }) : 'Sem data'}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] text-white/90 group-hover:text-white">{p.nome}</span>
                        <span className="block text-[12px] text-white/45">{p.funcao || singular(v.categoria)}{p.status ? ` · ${p.status}` : ''}</span>
                      </span>
                      {p.valor > 0 && (
                        <span className="text-right">
                          <span className="rlp-t block text-[16px] leading-none">{eur(p.valor)}</span>
                          <span className={`rlp-m block mt-1 text-[8px] ${p.pago ? 'text-[#a9c1ff]' : 'text-[#ff8a8a]'}`}>{p.pago ? 'Pago' : 'Por pagar'}</span>
                        </span>
                      )}
                      <span className="text-white/30 group-hover:text-[#5a8bff]">›</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* portal do membro: link secreto para enviar à pessoa */}
        {v.acesso_token && !editar && <PortalMembro id={id} token={v.acesso_token} senha={v.senha ?? ''} nome={v.nome} telefone={v.telefone}
          onSenha={s => setM(x => x && ({ ...x, senha: s }))} />}

        {/* contacto de urgência */}
        <section className={CARD + ' border-[#ff4747]/30'}>
          <Titulo>Contacto de urgência</Titulo>
          {linha({ rotulo: 'Nome', k: 'urgenciaNome' })}
          {linha({ rotulo: 'Relação', k: 'urgenciaRelacao', placeholder: 'Mãe, companheiro...' })}
          {linha({ rotulo: 'Telemóvel', k: 'urgenciaTelefone', tipo: 'tel', placeholder: '912 345 678' })}
          {!editar && d.urgenciaTelefone && (
            <a href={`tel:${d.urgenciaTelefone.replace(/\s/g, '')}`}
              className="mt-4 inline-flex rounded-full border border-[#ff4747]/50 px-4 py-2 text-[13px] text-white hover:bg-[#ff4747]/15">
              ✆ Ligar a {d.urgenciaNome || 'contacto de urgência'}
            </a>
          )}
        </section>

        {/* notas internas */}
        <section className={CARD + ' lg:col-span-3'}>
          <Titulo>Notas internas</Titulo>
          {editar
            ? <textarea className={INPUT + ' min-h-[90px]'} placeholder="O que é útil saber sobre esta pessoa" value={v.notas ?? ''} onChange={e => setC('notas', e.target.value)} />
            : <p className="text-[14px] leading-relaxed text-white/70 whitespace-pre-line">{v.notas || 'Sem notas.'}</p>}
        </section>
      </div>

      {!editar && (
        <div className="mt-8 flex flex-wrap gap-4 text-[12.5px]">
          <button onClick={alternarAtivo} className="text-white/50 hover:text-white">{v.ativo ? 'Marcar como inativo' : 'Marcar como ativo'}</button>
          <button onClick={apagar} className="text-white/50 hover:text-[#ff4747]">Apagar ficha</button>
        </div>
      )}
    </Moldura>
  )
}

function Moldura({ children }: { children: React.ReactNode }) {
  return (
    <main className="rlp min-h-screen relative text-white">
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: FUNDO }} />
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-10 pt-8 pb-16">
        <Link href="/media/equipa" className="text-[12px] text-white/45 hover:text-white transition-colors">‹ Equipa</Link>
        {children}
      </div>
    </main>
  )
}

function Contacto({ icone, valor, href }: { icone: string; valor?: string | null; href?: string }) {
  if (!valor) return null
  const conteudo = <><span className="w-5 text-center text-[#5a8bff]">{icone}</span><span className="truncate">{valor}</span></>
  return href
    ? <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="flex items-center gap-2.5 text-white/75 hover:text-white">{conteudo}</a>
    : <p className="flex items-center gap-2.5 text-white/75">{conteudo}</p>
}

// Caixa com o link do portal do membro (abrir, copiar, enviar por WhatsApp)
function PortalMembro({ id, token, senha, nome, telefone, onSenha }: { id: string; token: string; senha: string; nome: string; telefone?: string | null; onSenha: (s: string) => void }) {
  const [copiado, setCopiado] = useState('')
  const [aGerar, setAGerar] = useState(false)
  const copiar = (txt: string, qual: string) => { navigator.clipboard?.writeText(txt); setCopiado(qual); setTimeout(() => setCopiado(''), 1800) }
  async function gerar() {
    if (!confirm('Gerar uma senha nova? A senha atual deixa de funcionar e a pessoa tem de voltar a entrar.')) return
    setAGerar(true)
    const r = await fetch('/api/media-equipa/membros', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, novaSenha: true }) })
    const d = await r.json().catch(() => ({}))
    if (r.ok && d.membro?.senha) onSenha(d.membro.senha)
    else alert('Não foi possível gerar a senha.')
    setAGerar(false)
  }
  const url = `https://portal.rlphotovideo.pt/equipa-rlprod/${token}`
  const primeiro = nome.trim().split(/\s+/)[0]
  const tel = (telefone ?? '').replace(/\D/g, '')
  // Mensagem de boas-vindas (sem emojis: no link wa.me podem chegar como "?")
  const texto = [
    `Olá ${primeiro.charAt(0).toUpperCase() + primeiro.slice(1).toLowerCase()}!`,
    '',
    'Bem-vindo(a) à equipa *RL PROD*. É um gosto enorme ter-te connosco.',
    '',
    'Criámos o teu portal pessoal da equipa. Lá encontras:',
    '- os trabalhos para que foste escolhido(a) e a agenda',
    '- o briefing de cada projeto',
    '- o sítio para nos enviares o material depois de cada trabalho',
    '- os teus pagamentos e os teus dados',
    '',
    `*Link:* ${url}`,
    `*Senha:* ${senha}`,
    '',
    'Guarda esta mensagem. A senha é só tua, não a partilhes.',
    'Qualquer dúvida, fala connosco por aqui.',
    '',
    'Bom trabalho!',
    'RL PROD',
  ].join('\n')
  return (
    <section className={CARD + ' lg:col-span-3 border-[#2e6cf6]/40'}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="rlp-t text-[22px] leading-none">Portal do membro</h2>
          <p className="mt-2 text-[13px] text-white/55">Link pessoal: a pessoa vê os seus trabalhos, a agenda, os pagamentos e os seus dados. Para entrar precisa da senha.</p>
          <p className="mt-2 truncate text-[12.5px] text-[#a9c1ff]">{url}</p>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-white/60">
            Senha <span className="rlp-m rounded-md border border-white/[0.16] bg-[#00141f] px-2.5 py-1 text-[12px] tracking-[0.12em] text-white">{senha}</span>
            <button type="button" onClick={() => copiar(senha, 'senha')} className="text-[12px] text-[#a9c1ff] hover:text-white">{copiado === 'senha' ? '✓ Copiada' : 'Copiar senha'}</button>
            <button type="button" onClick={gerar} disabled={aGerar} className="text-[12px] text-white/45 hover:text-white disabled:opacity-50">{aGerar ? 'A gerar…' : 'Gerar nova'}</button>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={url} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/[0.16] px-4 py-2 text-[13px] text-white/80 hover:text-white">Abrir portal ↗</a>
          <button type="button" onClick={() => copiar(`${url}
Senha: ${senha}`, 'link')}
            className="rounded-full border border-white/[0.16] px-4 py-2 text-[13px] text-white/80 hover:text-white">{copiado === 'link' ? '✓ Copiado' : 'Copiar link e senha'}</button>
          {tel && (
            <a href={`https://wa.me/${(tel.length === 9 ? '351' : '') + tel}?text=${encodeURIComponent(texto)}`} target="_blank" rel="noopener noreferrer"
              className="rounded-full bg-[#2e6cf6] hover:bg-[#5a8bff] px-4 py-2 text-[13px] font-medium">Enviar por WhatsApp</a>
          )}
        </div>
      </div>
    </section>
  )
}
