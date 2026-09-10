'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { CSS } from '../styles'

// Formulário de seleção de fotografias — casamento.
// Mesmos campos e mesmo fluxo do formulário do Tally (FOTOS P/SELEÇÃO):
// a submissão grava em fotos_selecao (Supabase) e cria a página no Notion.
// Cada secção é preenchida foto a foto e mostra o total escolhido.

type Seccao = { name: string; label: string; required: boolean }

const SECCOES: Seccao[] = [
  { name: 'fotos_noivo',   label: 'Fotos do Noivo',   required: true  },
  { name: 'fotos_noiva',   label: 'Fotos da Noiva',   required: true  },
  { name: 'cerimonia',     label: 'Cerimónia',        required: true  },
  { name: 'convidados',    label: 'Convidados',       required: true  },
  { name: 'sala_animacao', label: 'Sala e Animação',  required: true  },
  { name: 'bolo_bouquet',  label: 'Bolo e Bouquet',   required: true  },
  { name: 'detalhes',      label: 'Detalhes',         required: true  },
  { name: 'sessao_noivos', label: 'Sessão Noivos',    required: true  },
  { name: 'fotos_album',   label: 'Fotos para Álbum', required: false },
]

const FOTOS_VAZIAS: Record<string, string[]> =
  Object.fromEntries(SECCOES.map(s => [s.name, s.required ? [''] : []]))

function plural(n: number) {
  return n === 1 ? '1 fotografia' : `${n} fotografias`
}

export default function FormSelecaoCasamentoPage() {
  const [dados, setDados]   = useState({ nome_noivos: '', date: '', referencia: '' })
  const [fotos, setFotos]   = useState<Record<string, string[]>>(FOTOS_VAZIAS)
  const [sending, setSending] = useState(false)
  const [sent, setSent]     = useState(false)
  const [erro, setErro]     = useState('')
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

  const preenchidas = (name: string) => fotos[name].filter(v => v.trim()).length
  const total = SECCOES.reduce((acc, s) => acc + preenchidas(s.name), 0)

  function addFoto(name: string) {
    setFotos(p => ({ ...p, [name]: [...p[name], ''] }))
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

    const emFalta = SECCOES.filter(s => s.required && preenchidas(s.name) === 0)
    if (emFalta.length) {
      setErro(`Falta indicar fotografias em: ${emFalta.map(s => s.label).join(', ')}.`)
      return
    }

    const payload: Record<string, string> = { ...dados }
    for (const s of SECCOES) {
      payload[s.name] = fotos[s.name].map(v => v.trim()).filter(Boolean).join(', ')
    }

    setSending(true)
    try {
      const res = await fetch('/api/selecao-fotos-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const d = await res.json()
      if (!res.ok || d.error) { setErro('Não foi possível enviar. Tentem novamente dentro de momentos.'); return }
      setSent(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setErro('Não foi possível enviar. Verifiquem a ligação e tentem novamente.')
    } finally {
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
              <div className="r"><span className="eyebrow" style={{ justifyContent: 'center' }}>Casamento</span></div>
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
                  as iniciais dos noivos seguidas do número da fotografia.
                </p>
                <div className="ex">Exemplo: LG-0001</div>
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
                    <label htmlFor="nome_noivos">Nome dos Noivos</label>
                    <input id="nome_noivos" type="text" required placeholder="Ex.: Ana e André"
                      value={dados.nome_noivos}
                      onChange={e => setDados(d => ({ ...d, nome_noivos: e.target.value }))} />
                  </div>
                  <div className="field">
                    <label htmlFor="date">Data do Casamento</label>
                    <input id="date" type="date" required
                      value={dados.date}
                      onChange={e => setDados(d => ({ ...d, date: e.target.value }))} />
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="referencia">Referência do Evento</label>
                  <input id="referencia" type="text" required placeholder="Ex.: CAS_011_26_RL"
                    value={dados.referencia}
                    onChange={e => setDados(d => ({ ...d, referencia: e.target.value }))} />
                </div>

                {SECCOES.map(s => {
                  const n = preenchidas(s.name)
                  return (
                    <div className="field" key={s.name}>
                      <div className="fhead">
                        <label>
                          {s.label} {!s.required && <span className="opt">(opcional)</span>}
                        </label>
                        <span className={n ? 'count has' : 'count'}>{plural(n)}</span>
                      </div>

                      {fotos[s.name].length > 0 ? (
                        <div className="fotolist">
                          {fotos[s.name].map((valor, i) => (
                            <div className="fotorow" key={i}>
                              <span className="idx">{i + 1}.</span>
                              <input type="text" placeholder="LG-0001" value={valor}
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

                      <button type="button" className="addfoto" onClick={() => addFoto(s.name)}>
                        + Adicionar fotografia
                      </button>
                    </div>
                  )
                })}

                <div className="totalgeral">
                  <span className="k">Total escolhido</span>
                  <span className="v">{total}</span>
                </div>

                <button className="btn" type="submit" disabled={sending}>
                  <span className="fill" /><span className="dot" />
                  {sending ? 'A enviar...' : 'Enviar seleção'}
                </button>
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
