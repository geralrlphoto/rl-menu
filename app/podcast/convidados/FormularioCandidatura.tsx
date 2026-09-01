'use client'

import { useRef, useState } from 'react'
import { validarCandidatura } from '@/lib/podcast/validacao'
import { AREAS_CANDIDATURA, ETIQUETAS_AREA } from '@/lib/podcast/tipos'

/* ============================================================
   Candidatura a convidado do podcast.
   Mesmas defesas do formulário de noivos: validação nos dois lados,
   campo-armadilha, tempo mínimo e trava à submissão dupla.
   ============================================================ */

export default function FormularioCandidatura() {
  const [estado, setEstado] = useState<'normal' | 'a-enviar' | 'sucesso' | 'erro'>('normal')
  const [erros, setErros] = useState<Record<string, string>>({})
  const [mensagem, setMensagem] = useState<string | null>(null)
  const abertoEm = useRef(Date.now())

  async function submeter(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (estado === 'a-enviar') return

    const f = new FormData(e.currentTarget)
    const body: Record<string, any> = {
      nome: f.get('nome'),
      email: f.get('email'),
      telefone: f.get('telefone'),
      empresa: f.get('empresa'),
      area: f.get('area'),
      zona: f.get('zona'),
      porque_tema: f.get('porque_tema'),
      links: f.get('links'),
      consentimento: f.get('consentimento') === 'on',
      website_confirmacao: f.get('website_confirmacao'),
      aberto_em: abertoEm.current,
    }

    const v = validarCandidatura(body)
    if (!v.ok) { setErros(v.erros); setEstado('erro'); setMensagem(null); return }

    setErros({})
    setEstado('a-enviar')
    try {
      const r = await fetch('/api/podcast/candidatura', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) {
        setErros(j?.erros ?? {})
        setMensagem(j?.erro ?? 'Não foi possível enviar. Tente outra vez.')
        setEstado('erro')
        return
      }
      setEstado('sucesso')
    } catch {
      setMensagem('Não foi possível enviar. Verifique a ligação e tente outra vez.')
      setEstado('erro')
    }
  }

  if (estado === 'sucesso') {
    return (
      <div className="pod-bloco is-destaque">
        <h2 className="pod-h2">Recebemos a sua candidatura</h2>
        <p className="pod-lede" style={{ marginBottom: 0 }}>
          Obrigado pelo interesse. Vamos ler com atenção e respondemos, mesmo que seja para dizer
          que ainda não é desta.
        </p>
      </div>
    )
  }

  return (
    <div className="pod-bloco is-destaque">
      <h2 className="pod-h2">Candidatar-me a convidado</h2>
      <p className="pod-lede">
        Conte-nos quem é e sobre o que gostaria de falar. Não é preciso ter experiência em podcasts.
      </p>

      <form className="pod-form" onSubmit={submeter} noValidate>
        <div className="pod-grelha-2">
          <Campo id="cand-nome" nome="nome" etiqueta="Nome" obrigatorio erro={erros.nome} autoComplete="name" />
          <Campo id="cand-email" nome="email" etiqueta="Email" tipo="email" obrigatorio erro={erros.email} autoComplete="email" />
        </div>
        <div className="pod-grelha-2">
          <Campo id="cand-telefone" nome="telefone" etiqueta="Telefone" tipo="tel" erro={erros.telefone} autoComplete="tel" />
          <Campo id="cand-empresa" nome="empresa" etiqueta="Empresa" erro={erros.empresa} autoComplete="organization" />
        </div>
        <div className="pod-grelha-2">
          <div className="pod-campo">
            <label className="pod-label" htmlFor="cand-area">Área<span aria-hidden="true"> *</span></label>
            <select id="cand-area" name="area" className="pod-input" defaultValue=""
              aria-invalid={erros.area ? 'true' : undefined}>
              <option value="" disabled>Escolha a sua área</option>
              {AREAS_CANDIDATURA.map(a => (
                <option key={a} value={a}>{ETIQUETAS_AREA[a]}</option>
              ))}
            </select>
            {erros.area && <p className="pod-erro-campo">{erros.area}</p>}
          </div>
          <Campo id="cand-zona" nome="zona" etiqueta="Zona onde trabalha" erro={erros.zona} />
        </div>

        <div className="pod-campo">
          <label className="pod-label" htmlFor="cand-tema">
            Sobre o que gostaria de falar<span aria-hidden="true"> *</span>
          </label>
          <textarea id="cand-tema" name="porque_tema" className="pod-input" rows={6}
            placeholder="O tema que domina e o que os noivos costumam perguntar-lhe."
            aria-invalid={erros.porque_tema ? 'true' : undefined} />
          {erros.porque_tema && <p className="pod-erro-campo">{erros.porque_tema}</p>}
        </div>

        <Campo id="cand-links" nome="links" etiqueta="Site, Instagram ou portefólio" erro={erros.links} />

        <div className="pod-armadilha" aria-hidden="true">
          <label htmlFor="cand-website">Não preencher</label>
          <input id="cand-website" name="website_confirmacao" tabIndex={-1} autoComplete="off" />
        </div>

        <label className="pod-consent">
          <input type="checkbox" name="consentimento" required />
          <span>
            Autorizo a RL Photo Video a contactar-me sobre esta candidatura, nos termos da{' '}
            <a href="/politica-de-privacidade">política de privacidade</a>.
            {erros.consentimento && <><br /><span style={{ color: '#e8a1a1' }}>{erros.consentimento}</span></>}
          </span>
        </label>

        {estado === 'erro' && mensagem && <p className="pod-aviso is-erro">{mensagem}</p>}

        <div>
          <button type="submit" className="pod-btn" disabled={estado === 'a-enviar'}>
            {estado === 'a-enviar' ? 'A enviar…' : 'Enviar candidatura'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Campo({ id, nome, etiqueta, tipo = 'text', obrigatorio, erro, autoComplete }: {
  id: string; nome: string; etiqueta: string; tipo?: string
  obrigatorio?: boolean; erro?: string; autoComplete?: string
}) {
  return (
    <div className="pod-campo">
      <label className="pod-label" htmlFor={id}>
        {etiqueta}{obrigatorio && <span aria-hidden="true"> *</span>}
      </label>
      <input
        id={id} name={nome} type={tipo} className="pod-input"
        autoComplete={autoComplete}
        aria-invalid={erro ? 'true' : undefined}
        aria-describedby={erro ? `${id}-erro` : undefined}
      />
      {erro && <p className="pod-erro-campo" id={`${id}-erro`}>{erro}</p>}
    </div>
  )
}
