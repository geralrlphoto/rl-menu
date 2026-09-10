'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CSS } from './styles'

// Página do cliente — "Seleção de Fotografias".
// Mesmo sistema visual das páginas públicas (ver /adquirir-fotografias):
// fundo escuro, grão + vinheta, Jost/Hanken/Space Mono, dourado.

type Tipo = 'casamento' | 'batizado'

const OPCOES: { key: Tipo; titulo: string; desc: string }[] = [
  { key: 'casamento', titulo: 'Casamento', desc: 'Seleção das fotografias do casamento' },
  { key: 'batizado',  titulo: 'Batizado',  desc: 'Seleção das fotografias do batizado' },
]

export default function FormSelecaoFotosPage() {
  const [tipo, setTipo] = useState<Tipo | null>(null)
  const router = useRouter()
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { (e.target as HTMLElement).classList.add('in'); io.unobserve(e.target) }
      })
    }, { threshold: .12 })
    document.querySelectorAll('.self .r').forEach(el => {
      if (reduce) el.classList.add('in'); else io.observe(el)
    })
  }, [])

  function escolher(key: Tipo) {
    setTipo(key)
    if (key === 'casamento') router.push('/form-selecao-fotos/casamento')
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="self">
        <div className="fx-grain" />
        <div className="fx-vig" />

        <section className="phero">
          <div className="r"><span className="eyebrow" style={{ justifyContent: 'center' }}>Seleção de Fotografias</span></div>
          <h1 className="r" style={{ marginTop: 22 }}>Escolham as vossas <em>fotografias.</em></h1>
          <p className="phero__sub r">
            Chegou o momento de escolher as vossas fotografias para as editarmos e entregarmos em alta
            qualidade. Prevemos entregar a seleção em <strong>30 dias úteis</strong> após o vosso envio.
          </p>
        </section>

        <div className="wrap">
          <div className="info">
            <div className="icard r">
              <div className="ic">Edição</div>
              <div className="iv">Alta qualidade</div>
              <div className="id">Cada fotografia escolhida é editada individualmente pela nossa equipa.</div>
            </div>
            <div className="icard r">
              <div className="ic">Entrega</div>
              <div className="iv">30 dias úteis</div>
              <div className="id">Contados a partir do dia em que nos enviam a vossa seleção.</div>
            </div>
          </div>
        </div>

        <section className="wrap block r">
          <span className="lbl">Escolham o vosso evento</span>
          <div className="seg">
            {OPCOES.map(op => (
              <button key={op.key} type="button" onClick={() => escolher(op.key)}
                className={tipo === op.key ? 'on' : ''}>
                <span className="t">{op.titulo}</span>
                <span className="d">{op.desc}</span>
              </button>
            ))}
          </div>
          {tipo && (
            <p className="chosen">Selecionado: <b>{tipo === 'casamento' ? 'Casamento' : 'Batizado'}</b></p>
          )}
        </section>

        <footer className="foot">
          <div className="fm">RL Photo.Video &nbsp;·&nbsp; <a href="mailto:geral.rlphoto@gmail.com">geral.rlphoto@gmail.com</a> &nbsp;·&nbsp; 912 832 788</div>
        </footer>
      </div>
    </>
  )
}
