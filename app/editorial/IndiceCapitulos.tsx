'use client'
import { useEffect, useState } from 'react'

// Índice dos capítulos do editorial: botões no computador; no telemóvel, barra com hambúrguer
// que abre a lista e fecha ao escolher um capítulo (ou ao tocar fora).
// O estilo (.indice, .ham…) está no CSS da página, dentro de .ed.

export default function IndiceCapitulos({ capitulos }: { capitulos: Array<{ id: string; nome: string }> }) {
  const [aberto, setAberto] = useState(false)

  useEffect(() => {
    if (!aberto) return
    const fechar = (e: KeyboardEvent) => { if (e.key === 'Escape') setAberto(false) }
    window.addEventListener('keydown', fechar)
    return () => window.removeEventListener('keydown', fechar)
  }, [aberto])

  const n = (i: number) => String(i + 2).padStart(2, '0')

  // Fecha a lista e só depois desce ao capítulo (com a lista a fechar, o salto do browser perdia-se)
  function irPara(e: React.MouseEvent, id: string) {
    e.preventDefault()
    setAberto(false)
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
      history.replaceState(null, '', `#${id}`)
    })
  }

  return (
    <div className={`indice${aberto ? ' aberto' : ''}`}>
      <nav className="chips" aria-label="Capítulos">
        {capitulos.map((c, i) => <a key={c.id} href={`#${c.id}`}><i>{n(i)}</i>{c.nome}</a>)}
      </nav>

      <div className="ham-barra">
        <span className="ham-t">Quinta da Ria</span>
        <button type="button" className="ham" aria-expanded={aberto} aria-label={aberto ? 'Fechar capítulos' : 'Abrir capítulos'} onClick={() => setAberto(a => !a)}>
          <span>Capítulos</span><i /><i /><i />
        </button>
      </div>
      {aberto && <div className="ham-fundo" onClick={() => setAberto(false)} />}
      <nav className="ham-lista" aria-label="Capítulos" hidden={!aberto}>
        {capitulos.map((c, i) => (
          <a key={c.id} href={`#${c.id}`} onClick={e => irPara(e, c.id)}><i>{n(i)}</i>{c.nome}</a>
        ))}
      </nav>
    </div>
  )
}
