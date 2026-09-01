'use client'

import { useRef, useState } from 'react'
import { validarLead } from '@/lib/podcast/validacao'

/* ============================================================
   Formulário de contacto de noivos.
   Valida no cliente para dar resposta imediata, mas quem manda é o
   servidor: o route handler valida outra vez antes de guardar.
   ============================================================ */

type Props = {
  /** Preenchido na página do episódio, para sabermos o que gera negócio. */
  origemEpisodioId?: string | null
  titulo?: string
  intro?: string
}

export default function FormularioLead({
  origemEpisodioId = null,
  titulo = 'Está a planear o seu casamento?',
  intro = 'Deixe-nos o contacto e falamos sobre fotografia e vídeo para o vosso dia. Sem compromisso.',
}: Props) {
  const [estado, setEstado] = useState<'normal' | 'a-enviar' | 'sucesso' | 'erro'>('normal')
  const [erros, setErros] = useState<Record<string, string>>({})
  const [mensagem, setMensagem] = useState<string | null>(null)
  const abertoEm = useRef(Date.now())

  async function submeter(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (estado === 'a-enviar') return          // trava a submissão dupla

    const f = new FormData(e.currentTarget)
    const body: Record<string, any> = {
      nome: f.get('nome'),
      email: f.get('email'),
      telefone: f.get('telefone'),
      data_casamento: f.get('data_casamento'),
      local: f.get('local'),
      servico_interesse: f.get('servico_interesse'),
      consentimento: f.get('consentimento') === 'on',
      website_confirmacao: f.get('website_confirmacao'),
      aberto_em: abertoEm.current,
      origem_episodio_id: origemEpisodioId,
    }

    const v = validarLead(body)
    if (!v.ok) { setErros(v.erros); setEstado('erro'); setMensagem(null); return }

    setErros({})
    setEstado('a-enviar')
    try {
      const r = await fetch('/api/podcast/lead', {
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
        <h2 className="pod-h2">Recebemos o vosso contacto</h2>
        <p className="pod-lede" style={{ marginBottom: 0 }}>
          Obrigado. Respondemos normalmente no mesmo dia, com uma proposta feita à medida do vosso casamento.
        </p>
      </div>
    )
  }

  return (
    <div className="pod-bloco is-destaque">
      <h2 className="pod-h2">{titulo}</h2>
      <p className="pod-lede">{intro}</p>

      <form className="pod-form" onSubmit={submeter} noValidate>
        <div className="pod-grelha-2">
          <Campo id="lead-nome" nome="nome" etiqueta="Nome" obrigatorio erro={erros.nome} autoComplete="name" />
          <Campo id="lead-email" nome="email" etiqueta="Email" tipo="email" obrigatorio erro={erros.email} autoComplete="email" />
        </div>
        <div className="pod-grelha-2">
          <Campo id="lead-telefone" nome="telefone" etiqueta="Telefone" tipo="tel" erro={erros.telefone} autoComplete="tel" />
          <Campo id="lead-data" nome="data_casamento" etiqueta="Data prevista" tipo="date" erro={erros.data_casamento} />
        </div>
        <div className="pod-grelha-2">
          <Campo id="lead-local" nome="local" etiqueta="Local ou zona" erro={erros.local} />
          <div className="pod-campo">
            <label className="pod-label" htmlFor="lead-servico">Interesse</label>
            <select id="lead-servico" name="servico_interesse" className="pod-input" defaultValue="Fotografia e vídeo">
              <option>Fotografia e vídeo</option>
              <option>Só fotografia</option>
              <option>Só vídeo</option>
              <option>Ainda a decidir</option>
            </select>
          </div>
        </div>

        {/* Campo-armadilha: quem preenche isto é um robô */}
        <div className="pod-armadilha" aria-hidden="true">
          <label htmlFor="lead-website">Não preencher</label>
          <input id="lead-website" name="website_confirmacao" tabIndex={-1} autoComplete="off" />
        </div>

        <label className="pod-consent">
          <input type="checkbox" name="consentimento" required />
          <span>
            Autorizo a RL Photo Video a contactar-me sobre este pedido, nos termos da{' '}
            <a href="/politica-de-privacidade">política de privacidade</a>.
            {erros.consentimento && <><br /><span style={{ color: '#e8a1a1' }}>{erros.consentimento}</span></>}
          </span>
        </label>

        {estado === 'erro' && mensagem && <p className="pod-aviso is-erro">{mensagem}</p>}

        <div>
          <button type="submit" className="pod-btn" disabled={estado === 'a-enviar'}>
            {estado === 'a-enviar' ? 'A enviar…' : 'Pedir contacto'}
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
        id={id}
        name={nome}
        type={tipo}
        className="pod-input"
        autoComplete={autoComplete}
        aria-invalid={erro ? 'true' : undefined}
        aria-describedby={erro ? `${id}-erro` : undefined}
      />
      {erro && <p className="pod-erro-campo" id={`${id}-erro`}>{erro}</p>}
    </div>
  )
}
