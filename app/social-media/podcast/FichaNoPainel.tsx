'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import GravacaoEpisodio from './episodios/GravacaoEpisodio'
import ConvidadosEpisodio from './episodios/ConvidadosEpisodio'
import PotenciaisEpisodio from './episodios/PotenciaisEpisodio'

/* ============================================================
   As duas fichas dentro do painel lateral do plano.

   O painel é construído pelo JavaScript do design, que só reescreve o
   bloco das perguntas (#drQ). Isto acrescenta um contentor no fim do
   corpo do painel e monta lá dentro os dois blocos, sem tocar em nada
   do que já lá está.

   Fica atento à abertura do painel com um MutationObserver, que reage
   ao evento em vez de andar a perguntar de dois em dois segundos: nada
   de setInterval, como é regra nesta aplicação.
   ============================================================ */

type Episodio = { id: string; numero: number; titulo: string }

export default function FichaNoPainel() {
  const [alvo, setAlvo] = useState<HTMLElement | null>(null)
  const [aberto, setAberto] = useState(false)
  const [numero, setNumero] = useState<number | null>(null)
  const [titulo, setTitulo] = useState('')
  const [episodio, setEpisodio] = useState<Episodio | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  // Cria o contentor no fim do corpo do painel, uma vez.
  useEffect(() => {
    const corpo = document.querySelector('.dr__b')
    if (!corpo) return
    let no = document.getElementById('ficha-episodio')
    if (!no) {
      no = document.createElement('div')
      no.id = 'ficha-episodio'
      corpo.appendChild(no)
    }
    setAlvo(no)
  }, [])

  // Segue a abertura e o fecho do painel, e lê que episódio está aberto.
  useEffect(() => {
    const painel = document.getElementById('dr')
    if (!painel) return

    function ler() {
      const estaAberto = painel!.classList.contains('open')
      setAberto(estaAberto)
      if (!estaAberto) return
      const cabecalho = document.getElementById('drN')?.textContent ?? ''
      const n = Number(cabecalho.match(/Epis[óo]dio\s+(\d+)/i)?.[1])
      setNumero(Number.isInteger(n) ? n : null)
      setTitulo(document.getElementById('drT')?.textContent ?? '')
    }

    ler()
    const observador = new MutationObserver(ler)
    observador.observe(painel, { attributes: true, attributeFilter: ['class'] })
    return () => observador.disconnect()
  }, [])

  // Vai buscar (ou cria) a linha do episódio com aquele número.
  useEffect(() => {
    if (!aberto || numero == null) return
    let cancelado = false
    setEpisodio(null)
    setErro(null)
    fetch('/api/podcast-episodios/por-numero', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numero, titulo }),
    })
      .then(r => r.json())
      .then(j => {
        if (cancelado) return
        if (j?.episodio) setEpisodio(j.episodio)
        else setErro('Não foi possível abrir a ficha deste episódio.')
      })
      .catch(() => { if (!cancelado) setErro('Não foi possível abrir a ficha deste episódio.') })
    return () => { cancelado = true }
  }, [aberto, numero, titulo])

  if (!alvo) return null

  return createPortal(
    <div className="fic">
      <div className="fic-sep" />

      {erro && <p className="pc-erro">{erro}</p>}

      {!episodio && !erro && <p className="pc-dica">A abrir a ficha…</p>}

      {episodio && (
        <>
          <GravacaoEpisodio episodioId={episodio.id} />
          <ConvidadosEpisodio episodioId={episodio.id} />
          <PotenciaisEpisodio episodioId={episodio.id} />
        </>
      )}

      <style>{`
        .fic { margin-top: 34px; display: flex; flex-direction: column; gap: 22px; }
        .fic-sep { height: 1px; background: var(--line-soft); }

        /* As fichas usam as classes do back-office; aqui vestem-se com a
           paleta do design, que já está definida no :root da página. */
        .fic .pc-campo { display: flex; flex-direction: column; gap: 8px; }
        .fic .pc-label {
          font-family: var(--fm); font-size: 10px;
          letter-spacing: .2em; text-transform: uppercase; color: var(--g);
        }
        .fic .pc-dica { font-family: var(--fb); font-size: 12.5px; color: var(--tx-dim); line-height: 1.6; margin: 0; }
        .fic .pc-input {
          font-family: var(--fb); font-size: 14px; color: var(--tx);
          background: rgba(0,0,0,.3); border: 1px solid var(--line-soft);
          border-radius: 8px; padding: 11px 13px; width: 100%; min-height: 44px;
          transition: border-color .2s;
        }
        .fic .pc-input:focus { outline: none; border-color: var(--g); }
        .fic .pc-area { resize: vertical; line-height: 1.7; }
        .fic .pc-dois { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 620px) { .fic .pc-dois { grid-template-columns: 1fr; } }

        .fic .pc-sub {
          display: flex; flex-direction: column; gap: 12px;
          padding: 16px; border-radius: 10px;
          border: 1px solid var(--line-soft); background: rgba(0,0,0,.22);
        }


        .fic .pc-dobra { padding: 0; gap: 0; }
        .fic .pc-dobra > summary {
          cursor: pointer; list-style: none;
          display: flex; flex-direction: column; gap: 4px;
          padding: 14px 16px; min-height: 44px;
        }
        .fic .pc-dobra > summary::-webkit-details-marker { display: none; }
        .fic .pc-dobra > summary::after {
          content: 'Abrir'; position: absolute; right: 16px;
          font-family: var(--fm); font-size: 9px; letter-spacing: .16em;
          text-transform: uppercase; color: var(--tx-dim);
        }
        .fic .pc-dobra[open] > summary::after { content: 'Fechar'; }
        .fic .pc-dobra > summary { position: relative; padding-right: 74px; }
        .fic .pc-dobra[open] > summary { border-bottom: 1px solid var(--line-soft); margin-bottom: 14px; }
        .fic .pc-dobra > *:not(summary) { margin: 0 16px; }
        .fic .pc-dobra > *:last-child { margin-bottom: 16px; }
        .fic .pc-dobra-nome { font-family: var(--fd); font-size: 17px; color: var(--tx); }
        .fic .pc-dobra-meta { font-family: var(--fb); font-size: 12px; color: var(--tx-dim); }

        .fic .pc-novo { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        .fic .pc-novo .pc-input { flex: 1; min-width: 180px; }

        .fic .pc-btn-ghost, .fic .pc-mini, .fic .pc-estado {
          font-family: var(--fm); cursor: pointer;
          text-transform: uppercase; background: transparent;
          border: 1px solid var(--line); color: var(--tx-mid);
          border-radius: 40px; transition: color .3s, border-color .3s;
        }
        .fic .pc-btn-ghost { font-size: 11px; letter-spacing: .16em; padding: 12px 20px; min-height: 44px; }
        .fic .pc-mini { font-size: 10px; letter-spacing: .14em; padding: 8px 14px; }
        .fic .pc-estado { font-size: 10px; letter-spacing: .14em; padding: 8px 14px; }
        .fic .pc-btn-ghost:hover, .fic .pc-mini:hover, .fic .pc-estado:hover { color: var(--g); border-color: var(--g); }
        .fic .pc-estado.is-on { color: var(--ink); background: var(--g); border-color: var(--g); }
        .fic .pc-estados { display: flex; flex-wrap: wrap; gap: 8px; }

        .fic .pc-erro {
          font-family: var(--fb); font-size: 13px; color: #e8a1a1;
          background: rgba(220,80,80,.08); border: 1px solid rgba(220,80,80,.25);
          border-radius: 8px; padding: 10px 14px; margin: 0;
        }

        .fic .pc-capa { display: flex; gap: 14px; align-items: flex-start; }
        .fic .pc-capa-img {
          width: 88px; height: 88px; object-fit: cover;
          border-radius: 10px; border: 1px solid var(--line);
        }
        .fic .pc-capa-vazia {
          width: 88px; height: 88px; flex: none;
          display: flex; align-items: center; justify-content: center;
          border-radius: 10px; border: 1px dashed var(--line);
          font-family: var(--fm); font-size: 9px; letter-spacing: .14em;
          text-transform: uppercase; color: var(--tx-dim);
        }
      `}</style>
    </div>,
    alvo,
  )
}
