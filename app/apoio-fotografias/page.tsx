'use client'

import { useEffect, useState } from 'react'
import { CSS } from './styles'

// Página do cliente — "Apoio ao Cliente" das fotografias encomendadas.
// Duas fases: (1) o cliente identifica-se e indica o nº do ticket; (2) escolhe o
// tema e recebe logo a informação do prazo e onde procurar a entrega.
// Mesmo sistema visual das páginas públicas (ver /adquirir-fotografias).

type Tema = 'digital' | 'papel'

const TEMAS: { key: Tema; titulo: string; desc: string }[] = [
  { key: 'digital', titulo: 'Não recebi as fotografias digitais', desc: 'Entrega por email · 15 dias' },
  { key: 'papel',   titulo: 'Não recebi as fotografias em papel',  desc: 'Correio registado · 30 dias úteis' },
]

type Dados = { nome: string; email: string; telefone: string; noivos: string; data: string; ticket: string }

const VAZIO: Dados = { nome: '', email: '', telefone: '', noivos: '', data: '', ticket: '' }

// "2026-06-27" → "27/06/2026" (o input de data devolve sempre ISO).
function fmtData(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso
}

export default function ApoioFotografiasPage() {
  const [fase, setFase] = useState<1 | 2>(1)
  const [dados, setDados] = useState<Dados>(VAZIO)
  const [tema, setTema] = useState<Tema | null>(null)
  const [erro, setErro] = useState('')

  // Revela os blocos à medida que entram no ecrã. Corre outra vez a cada fase
  // porque os blocos da 2.ª fase só existem depois de o cliente continuar.
  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { (e.target as HTMLElement).classList.add('in'); io.unobserve(e.target) }
      })
    }, { threshold: .12 })
    document.querySelectorAll('.apoio .r:not(.in)').forEach(el => {
      if (reduce) el.classList.add('in'); else io.observe(el)
    })
    return () => io.disconnect()
  }, [fase, tema])

  const set = (k: keyof Dados) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDados(d => ({ ...d, [k]: e.target.value }))

  function continuar(e: React.FormEvent) {
    e.preventDefault()
    const falta = (['nome', 'email', 'telefone', 'noivos', 'data', 'ticket'] as const).some(k => !dados[k].trim())
    if (falta) { setErro('Preencham todos os campos para continuarmos.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email.trim())) { setErro('Confirmem o email, parece estar incompleto.'); return }
    setErro('')
    setFase(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function voltar() {
    setTema(null)
    setFase(1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="apoio">
        <div className="fx-grain" />
        <div className="fx-vig" />

        <section className="phero">
          <div className="r"><span className="eyebrow" style={{ justifyContent: 'center' }}>Apoio ao Cliente</span></div>
          <h1 className="r" style={{ marginTop: 22 }}>
            {fase === 1 ? <>Estamos aqui para <em>ajudar.</em></> : <>Em que podemos <em>ajudar?</em></>}
          </h1>
          <p className="phero__sub r">
            {fase === 1
              ? <>Comecem por se identificar e indicar o <strong>número do ticket</strong> da encomenda.
                  Assim conseguimos acompanhar o vosso pedido sem perder tempo.</>
              : <>Escolham o tema que descreve a vossa situação. Respondemos logo aqui, com o prazo
                  de entrega e onde procurar as vossas fotografias.</>}
          </p>
          <div className="steps r">
            <span className={`st ${fase === 1 ? 'on' : ''}`}><span className="n">1</span>Os vossos dados</span>
            <span className="sep" />
            <span className={`st ${fase === 2 ? 'on' : ''}`}><span className="n">2</span>O vosso tema</span>
          </div>
        </section>

        {fase === 1 && (
          <section className="wrap block r">
            <span className="lbl">Os vossos dados</span>
            <form className="form" onSubmit={continuar} noValidate>
              <div className="frow two">
                <div className="field">
                  <label>Nome completo</label>
                  <input type="text" value={dados.nome} onChange={set('nome')} placeholder="O vosso nome" />
                </div>
                <div className="field">
                  <label>Email</label>
                  <input type="email" value={dados.email} onChange={set('email')} placeholder="nome@email.pt" />
                  <div className="hint">É para este email que enviamos as fotografias digitais.</div>
                </div>
              </div>
              <div className="frow two">
                <div className="field">
                  <label>Contacto telefónico</label>
                  <input type="tel" value={dados.telefone} onChange={set('telefone')} placeholder="912 000 000" />
                </div>
                <div className="field">
                  <label>Nome dos noivos</label>
                  <input type="text" value={dados.noivos} onChange={set('noivos')} placeholder="Ex.: Ana e André" />
                </div>
              </div>
              <div className="frow two">
                <div className="field">
                  <label>Data do casamento</label>
                  <input type="date" value={dados.data} onChange={set('data')} />
                </div>
                <div className="field">
                  <label>N.º do ticket</label>
                  <input type="text" value={dados.ticket} onChange={set('ticket')} placeholder="Ex.: PF-0125" />
                  <div className="hint">Está no email de confirmação da encomenda.</div>
                </div>
              </div>
              <button className="btn" type="submit"><span className="fill" /><span className="dot" />Continuar</button>
              {erro && <p className="err">{erro}</p>}
              <p className="note">Estes dados servem apenas para identificarmos a vossa encomenda.</p>
            </form>
          </section>
        )}

        {fase === 2 && (
          <section className="wrap block">
            <div className="recap r">
              <div>
                <div className="k">Ticket</div>
                <div className="v g">{dados.ticket}</div>
              </div>
              <div>
                <div className="k">Noivos</div>
                <div className="v">{dados.noivos}</div>
              </div>
              <div>
                <div className="k">Data do casamento</div>
                <div className="v">{fmtData(dados.data)}</div>
              </div>
            </div>

            <span className="lbl">Escolham o tema</span>
            <div className="seg r">
              {TEMAS.map(t => (
                <button key={t.key} type="button" onClick={() => setTema(t.key)}
                  className={tema === t.key ? 'on' : ''}>
                  <span className="t">{t.titulo}</span>
                  <span className="d">{t.desc}</span>
                </button>
              ))}
            </div>

            {tema === 'digital' && (
              <div className="answer r">
                <div className="ac">Fotografias digitais</div>
                <h2>Comecem por procurar o email da entrega.</h2>
                <p>
                  As fotografias digitais são entregues <strong>por email</strong>, com um link para
                  descarregarem os ficheiros em alta resolução. Muitas vezes o email chega, mas fica
                  guardado numa pasta que não se costuma abrir. Antes de mais, procurem por
                  <strong> RL Photo</strong> ou por <strong>geral.rlphoto@gmail.com</strong> em todas
                  as pastas da vossa caixa de correio:
                </p>
                <ul>
                  <li><span className="dot">✦</span><span><b>Caixa de entrada</b>: usem a pesquisa, o email pode estar abaixo de mensagens mais recentes.</span></li>
                  <li><span className="dot">✦</span><span><b>Spam ou Lixo eletrónico</b>: é aqui que o email fica na maior parte dos casos.</span></li>
                  <li><span className="dot">✦</span><span><b>Promoções e Social</b>: no Gmail, os emails com links são muitas vezes separados para estes separadores.</span></li>
                  <li><span className="dot">✦</span><span><b>Arquivo e Todos os emails</b>: caso tenha sido arquivado sem ser lido.</span></li>
                  <li><span className="dot">✦</span><span><b>Confirmem o email que nos deram</b>: uma letra trocada no endereço é suficiente para a entrega não chegar.</span></li>
                </ul>
                <div className="prazo">
                  <div className="k">Prazo de entrega</div>
                  <div className="v">15 dias</div>
                  <div className="d">
                    As fotografias digitais são entregues no prazo de <strong>15 dias</strong>. Se ainda
                    estamos dentro deste prazo, a vossa encomenda está a ser tratada e o email de entrega
                    chega até ao fim dos 15 dias.
                  </div>
                </div>
                <p>
                  Se já passaram os 15 dias e não encontram o email em nenhuma destas pastas, falem
                  connosco para <strong>geral.rlphoto@gmail.com</strong> ou para o <strong>912 832 788</strong>,
                  indicando o número do ticket <strong>{dados.ticket}</strong>. Reenviamos a entrega no mesmo dia.
                </p>
              </div>
            )}

            {tema === 'papel' && (
              <div className="answer r">
                <div className="ac">Fotografias em papel</div>
                <h2>As fotografias em papel seguem por correio registado.</h2>
                <p>
                  As fotografias em papel são impressas por nós e enviadas para a morada indicada na
                  encomenda, <strong>por correio registado</strong>. Como é registado, a entrega é feita
                  em mão e pode ser pedida assinatura.
                </p>
                <div className="prazo">
                  <div className="k">Prazo de entrega</div>
                  <div className="v">30 dias úteis</div>
                  <div className="d">
                    Contados a partir da confirmação da encomenda, e já incluem a impressão e o envio.
                    Enquanto estamos dentro deste prazo, a encomenda está em preparação ou já a caminho.
                  </div>
                </div>
                <ul>
                  <li><span className="dot">✦</span><span><b>Vejam a caixa de correio</b>: se não estiverem em casa na entrega, os CTT deixam um aviso.</span></li>
                  <li><span className="dot">✦</span><span><b>Guardem o aviso dos CTT</b>: com ele podem recolher a encomenda na estação de correios indicada.</span></li>
                  <li><span className="dot">✦</span><span><b>Confirmem a morada que nos deram</b>: rua, número, andar e código postal, para podermos verificar o envio.</span></li>
                </ul>
                <p>
                  Passados os 30 dias úteis sem receberem nada, escrevam para
                  <strong> geral.rlphoto@gmail.com</strong> ou liguem para o <strong>912 832 788</strong> com
                  o número do ticket <strong>{dados.ticket}</strong>. Confirmamos o estado do envio e resolvemos.
                </p>
              </div>
            )}

            <div className="actions">
              {tema && <button type="button" className="ghost" onClick={() => setTema(null)}>Escolher outro tema</button>}
              <button type="button" className="ghost" onClick={voltar}>‹ Alterar os meus dados</button>
            </div>
          </section>
        )}

        <footer className="foot">
          <div className="fm">RL Photo.Video &nbsp;·&nbsp; <a href="mailto:geral.rlphoto@gmail.com">geral.rlphoto@gmail.com</a> &nbsp;·&nbsp; 912 832 788</div>
        </footer>
      </div>
    </>
  )
}
