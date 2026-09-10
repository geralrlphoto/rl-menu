'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { CSS } from '../styles'

// Formulário de seleção de fotografias — casamento.
// Mesmos campos e mesmo fluxo do formulário do Tally (FOTOS P/SELEÇÃO):
// a submissão grava em fotos_selecao (Supabase) e cria a página no Notion.

type Campo = {
  name: string
  label: string
  required: boolean
  tipo?: 'text' | 'date' | 'area'
  placeholder?: string
}

const CAMPOS: Campo[] = [
  { name: 'fotos_noivo',   label: 'Fotos do Noivo',   required: true,  tipo: 'area' },
  { name: 'fotos_noiva',   label: 'Fotos da Noiva',   required: true,  tipo: 'area' },
  { name: 'cerimonia',     label: 'Cerimónia',        required: true,  tipo: 'area' },
  { name: 'convidados',    label: 'Convidados',       required: true,  tipo: 'area' },
  { name: 'sala_animacao', label: 'Sala e Animação',  required: true,  tipo: 'area' },
  { name: 'bolo_bouquet',  label: 'Bolo e Bouquet',   required: true,  tipo: 'area' },
  { name: 'detalhes',      label: 'Detalhes',         required: true,  tipo: 'area' },
  { name: 'sessao_noivos', label: 'Sessão Noivos',    required: true,  tipo: 'area' },
  { name: 'fotos_album',   label: 'Fotos para Álbum', required: false, tipo: 'area' },
]

const VAZIO: Record<string, string> = {
  nome_noivos: '', date: '', referencia: '',
  ...Object.fromEntries(CAMPOS.map(c => [c.name, ''])),
}

export default function FormSelecaoCasamentoPage() {
  const [form, setForm]     = useState<Record<string, string>>(VAZIO)
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

  function set(name: string, value: string) {
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setSending(true)
    try {
      const res = await fetch('/api/selecao-fotos-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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
              Obrigado! Já temos a vossa seleção. Vamos preparar a edição das fotografias
              escolhidas e entregamos em alta qualidade dentro de 30 dias úteis.
            </p>
            <div className="recap">{form.nome_noivos}{form.referencia ? ` · ${form.referencia}` : ''}</div>
          </section>
        ) : (
          <>
            <section className="phero">
              <div className="r"><span className="eyebrow" style={{ justifyContent: 'center' }}>Casamento</span></div>
              <h1 className="r" style={{ marginTop: 22 }}>Fotos para <em>seleção.</em></h1>
              <p className="phero__sub r">
                Indiquem em cada campo as fotografias que pretendem que sejam editadas.
                Prevemos entregar a seleção em <strong>30 dias úteis</strong> após o vosso envio.
              </p>
            </section>

            <div className="wrap">
              <div className="instr r">
                <h2>Instruções para Envio da Seleção</h2>
                <p>
                  Ao preencherem o formulário, deverão indicar em cada campo as fotografias que
                  pretendem que sejam editadas.
                </p>
                <p>
                  A numeração deve ser colocada exatamente como aparece na galeria e deverá conter
                  as iniciais dos noivos seguidas do número da fotografia, separadas por vírgula e
                  espaço.
                </p>
                <div className="ex">Exemplo: LG-0001, LG-0025, LG-1034</div>
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
              <form className="form" onSubmit={submit} noValidate={false}>
                <div className="frow two">
                  <div className="field">
                    <label htmlFor="nome_noivos">Nome dos Noivos</label>
                    <input id="nome_noivos" type="text" required placeholder="Ex.: Ana e André"
                      value={form.nome_noivos} onChange={e => set('nome_noivos', e.target.value)} />
                  </div>
                  <div className="field">
                    <label htmlFor="date">Data do Casamento</label>
                    <input id="date" type="date" required
                      value={form.date} onChange={e => set('date', e.target.value)} />
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="referencia">Referência do Evento</label>
                  <input id="referencia" type="text" required placeholder="Ex.: CAS_011_26_RL"
                    value={form.referencia} onChange={e => set('referencia', e.target.value)} />
                </div>

                {CAMPOS.map(c => (
                  <div className="field" key={c.name}>
                    <label htmlFor={c.name}>
                      {c.label} {!c.required && <span className="opt">(opcional)</span>}
                    </label>
                    <textarea id={c.name} required={c.required} rows={2}
                      placeholder="LG-0001, LG-0025, LG-1034"
                      value={form[c.name]} onChange={e => set(c.name, e.target.value)} />
                  </div>
                ))}

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
