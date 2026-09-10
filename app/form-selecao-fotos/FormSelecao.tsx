'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { CSS } from './styles'

// Formulário de seleção de fotografias, usado pelo casamento e pelo batizado.
// Mesmo fluxo do formulário do Tally (FOTOS P/SELEÇÃO): a submissão grava em
// fotos_selecao (Supabase) e cria a página no Notion.
// Cada secção é um card que abre e se preenche foto a foto.

export type Seccao = {
  name: string      // coluna em fotos_selecao
  label: string
}

export type FormSelecaoProps = {
  eyebrow: string        // "Casamento" / "Batizado"
  nomeLabel: string      // "Nome dos Noivos" / "Nome da Criança"
  nomePlaceholder: string
  dataLabel: string      // "Data do Casamento" / "Data do Batizado"
  refPlaceholder: string
  tipo: 'casamento' | 'batizado'
  exemplo: string        // "LG-0001"
  iniciais: string       // como descrever as iniciais nas instruções
  seccoes: Seccao[]
}

function plural(n: number) {
  return n === 1 ? '1 fotografia' : `${n} fotografias`
}

export default function FormSelecao({
  tipo, eyebrow, nomeLabel, nomePlaceholder, dataLabel, refPlaceholder, exemplo, iniciais, seccoes,
}: FormSelecaoProps) {
  const [dados, setDados]     = useState({ nome_noivos: '', date: '', referencia: '' })
  const [fotos, setFotos]     = useState<Record<string, string[]>>(
    () => Object.fromEntries(seccoes.map(s => [s.name, ['']]))
  )
  const [sending, setSending] = useState(false)
  const [sent, setSent]       = useState(false)
  const [erro, setErro]       = useState('')
  const [abertas, setAbertas] = useState<string[]>([])
  const [aCarregar, setACarregar] = useState<string[]>([])
  const [progresso, setProgresso] = useState(0)
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { (e.target as HTMLElement).classList.add('in'); io.unobserve(e.target) }
      })
    }, { threshold: .08 })
    document.querySelectorAll('.self .r').forEach(el => {
      if (reduce) el.classList.add('in'); else io.observe(el)
    })
  }, [])

  const preenchidas = (name: string) => (fotos[name] ?? []).filter(v => v.trim()).length
  const total = seccoes.reduce((acc, s) => acc + preenchidas(s.name), 0)

  function toggle(name: string) {
    const abrir = !abertas.includes(name)
    setAbertas(p => abrir ? [...p, name] : p.filter(n => n !== name))
    if (!abrir) return
    // barra de carregamento enquanto a lista da secção não aparece
    setACarregar(p => [...p, name])
    setTimeout(() => setACarregar(p => p.filter(n => n !== name)), 750)
  }

  function addFoto(name: string) {
    setFotos(p => ({ ...p, [name]: [...p[name], ''] }))
    setAbertas(p => p.includes(name) ? p : [...p, name])
  }
  function setFoto(name: string, i: number, valor: string) {
    setFotos(p => ({ ...p, [name]: p[name].map((v, j) => j === i ? valor : v) }))
  }
  function removeFoto(name: string, i: number) {
    setFotos(p => ({ ...p, [name]: p[name].filter((_, j) => j !== i) }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    // Nenhuma secção é obrigatória; só não faz sentido enviar uma seleção vazia.
    if (total === 0) {
      setErro('Indiquem pelo menos uma fotografia antes de enviar.')
      return
    }

    const payload: Record<string, string> = { ...dados, tipo }
    for (const s of seccoes) {
      payload[s.name] = fotos[s.name].map(v => v.trim()).filter(Boolean).join('; ')
    }

    setSending(true)
    setProgresso(0)
    const inicio = Date.now()
    const DURACAO = 4000
    const timer = setInterval(() => {
      setProgresso(Math.min(100, Math.round((Date.now() - inicio) / DURACAO * 100)))
    }, 60)

    try {
      // A barra vai sempre dos 0% aos 100%, mesmo que o envio seja mais rápido.
      const [res] = await Promise.all([
        fetch('/api/selecao-fotos-submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }),
        new Promise(r => setTimeout(r, DURACAO)),
      ])
      setProgresso(100)
      const d = await res.json()
      if (!res.ok || d.error) { setErro('Não foi possível enviar. Tentem novamente dentro de momentos.'); return }
      setSent(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setErro('Não foi possível enviar. Verifiquem a ligação e tentem novamente.')
    } finally {
      clearInterval(timer)
      setSending(false)
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="self">
        <div className="fx-grain" />
        <div className="fx-vig" />
        <Link href="/form-selecao-fotos" className="back">‹ Voltar</Link>

        {sent ? (
          <section className="sent">
            <div className="mk">✓</div>
            <h2>Seleção <em>recebida.</em></h2>
            <p>
              Obrigado! Já temos a vossa seleção de {plural(total)}. Vamos preparar a edição das
              fotografias escolhidas e entregamos em alta qualidade dentro de 30 dias úteis.
            </p>
            <div className="recap">{dados.nome_noivos}{dados.referencia ? ` · ${dados.referencia}` : ''}</div>
          </section>
        ) : (
          <>
            <section className="phero">
              <div className="r"><span className="eyebrow" style={{ justifyContent: 'center' }}>{eyebrow}</span></div>
              <h1 className="r" style={{ marginTop: 22 }}>Fotos para <em>seleção.</em></h1>
              <p className="phero__sub r">
                Indiquem em cada secção as fotografias que pretendem que sejam editadas.
                Prevemos entregar a seleção em <strong>30 dias úteis</strong> após o vosso envio.
              </p>
            </section>

            <div className="wrap">
              <div className="instr r">
                <h2>Instruções para Envio da Seleção</h2>
                <p>
                  Ao preencherem o formulário, deverão indicar em cada secção as fotografias que
                  pretendem que sejam editadas, uma de cada vez.
                </p>
                <p>
                  A numeração deve ser colocada exatamente como aparece na galeria e deverá conter
                  {' '}{iniciais} seguidas do número da fotografia.
                </p>
                <div className="ex">Exemplo: {exemplo}</div>
                <p>
                  É fundamental que a identificação seja inserida corretamente e respeitando este
                  formato. Caso contrário, o nosso sistema poderá não conseguir reconhecer a
                  respetiva numeração, o que poderá originar atrasos no processo de edição.
                </p>
                <p>
                  A correta indicação das fotografias garante maior organização, rapidez e precisão
                  na preparação do vosso álbum.
                </p>
              </div>
            </div>

            <section className="wrap block r" style={{ marginBottom: 'clamp(50px,8vh,90px)' }}>
              <form className="form" onSubmit={submit}>
                <div className="frow two">
                  <div className="field">
                    <label htmlFor="nome_noivos">{nomeLabel}</label>
                    <input id="nome_noivos" type="text" required placeholder={nomePlaceholder}
                      value={dados.nome_noivos}
                      onChange={e => setDados(d => ({ ...d, nome_noivos: e.target.value }))} />
                  </div>
                  <div className="field">
                    <label htmlFor="date">{dataLabel}</label>
                    <input id="date" type="date" required
                      value={dados.date}
                      onChange={e => setDados(d => ({ ...d, date: e.target.value }))} />
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="referencia">Referência do Evento</label>
                  <input id="referencia" type="text" required placeholder={refPlaceholder}
                    value={dados.referencia}
                    onChange={e => setDados(d => ({ ...d, referencia: e.target.value }))} />
                </div>

                <div className="cards">
                  {seccoes.map(s => {
                    const n = preenchidas(s.name)
                    const aberta = abertas.includes(s.name)
                    return (
                      <div key={s.name} className={`scard${aberta ? ' open' : ''}${n ? ' has' : ''}`}>
                        <button type="button" className="scard__head" onClick={() => toggle(s.name)}
                          aria-expanded={aberta}>
                          <span className="scard__t">{s.label}</span>
                          <span className="scard__meta">
                            <span className={n ? 'count has' : 'count'}>{plural(n)}</span>
                            <span className="chev">›</span>
                          </span>
                        </button>

                        {aberta && (
                          <div className="scard__body">
                            {aCarregar.includes(s.name) ? (
                              <div className="loading">
                                <span className="track"><span className="bar" /></span>
                                <p className="lbl">A carregar fotografias</p>
                              </div>
                            ) : fotos[s.name].length > 0 ? (
                              <div className="fotolist">
                                {fotos[s.name].map((valor, i) => (
                                  <div className="fotorow" key={i}>
                                    <span className="idx">{i + 1}.</span>
                                    <input type="text" placeholder={exemplo} value={valor}
                                      onChange={e => setFoto(s.name, i, e.target.value)}
                                      onKeyDown={e => {
                                        if (e.key === 'Enter') { e.preventDefault(); addFoto(s.name) }
                                      }} />
                                    <button type="button" className="rm" title="Remover"
                                      onClick={() => removeFoto(s.name, i)}>✕</button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="vazio">Sem fotografias nesta secção.</p>
                            )}

                            {!aCarregar.includes(s.name) && (
                              <button type="button" className="addfoto" onClick={() => addFoto(s.name)}>
                                + Adicionar fotografia
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                <div className="totalgeral">
                  <span className="k">Total escolhido</span>
                  <span className="v">{total}</span>
                </div>

                {sending ? (
                  <div className="enviando">
                    <div className="track"><span className="bar" style={{ width: `${progresso}%` }} /></div>
                    <p className="pct">{progresso}%</p>
                    <p className="lbl">A enviar a vossa seleção</p>
                  </div>
                ) : (
                  <button className="btn" type="submit">
                    <span className="fill" /><span className="dot" />
                    Enviar seleção
                  </button>
                )}
                {erro && <p className="err">{erro}</p>}
                <p className="note">
                  Confirmem a numeração antes de enviar. Depois do envio, começamos a preparar a
                  edição das fotografias escolhidas.
                </p>
              </form>
            </section>
          </>
        )}

        <footer className="foot">
          <div className="fm">RL Photo.Video &nbsp;·&nbsp; <a href="mailto:geral.rlphoto@gmail.com">geral.rlphoto@gmail.com</a> &nbsp;·&nbsp; 912 832 788</div>
        </footer>
      </div>
    </>
  )
}
