'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CSS_BRIEFING } from '@/app/_briefing/estilo'

// Ecrã de entrada dos portais de editoriais: pede a senha (começa por "RL.").

const CSS = `
.ent-ed{position:relative;min-height:100svh;display:flex;align-items:center;justify-content:center;padding:24px 16px;overflow:hidden;}
.ent-ed .fundo{position:absolute;inset:0;background:url('/casamentos-2028.webp') center 35%/cover no-repeat;filter:grayscale(1);opacity:.18;}
.ent-ed::after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse 60% 55% at 50% 45%,rgba(201,168,76,.08),transparent 70%),linear-gradient(to bottom,#0b0b0b,rgba(11,11,11,.55) 30%,rgba(11,11,11,.7) 70%,#0b0a08);}
.ent-ed form{position:relative;z-index:2;width:100%;max-width:400px;text-align:center;padding:40px 28px 32px;border:1px solid var(--line-soft);border-radius:18px;background:rgba(16,14,11,.82);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);}
.ent-ed img{width:44px;margin:0 auto;display:block;opacity:.85;}
.ent-ed .parc{font-family:var(--fm);font-size:9.5px;letter-spacing:.3em;text-transform:uppercase;color:var(--tx-mid);margin-top:22px;}
.ent-ed .parc b{color:var(--g);font-weight:400;margin:0 .4em;}
.ent-ed h1{font-size:clamp(34px,8vw,44px);margin:14px 0 0;}
.ent-ed .ln{width:48px;height:1px;background:var(--g);margin:18px auto 0;}
.ent-ed .lead{font-size:14.5px;margin-top:18px;}
.ent-ed .finput{text-align:center;letter-spacing:.2em;margin-top:22px;}
.ent-ed .btn{width:100%;margin-top:24px;}
.ent-ed .err{margin-top:14px;}
.ent-ed .hint{margin-top:22px;}
`

export default function EntradaEditorial({ slug }: { slug: string }) {
  const router = useRouter()
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [aEntrar, setAEntrar] = useState(false)

  async function entrar(e: React.FormEvent) {
    e.preventDefault()
    setErro(''); setAEntrar(true)
    try {
      const r = await fetch('/api/editorial/entrar', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, senha }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d.error || 'Não foi possível entrar.')
      router.refresh()
    } catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível entrar.'); setAEntrar(false) }
  }

  return (
    <main className="nlead ent-ed">
      <style>{CSS_BRIEFING + CSS}</style>
      <div className="fundo" aria-hidden="true" />
      <form onSubmit={entrar}>
        <img src="/logo_rl_gold.png" alt="RL Photo Video" />
        <p className="parc">Zankyou<b>×</b>Quinta da Ria<b>×</b>RL Photo Video</p>
        <h1>Editorial de <em>Casamento</em></h1>
        <div className="ln" />
        <p className="lead">Escreva a senha para entrar. Começa por <span style={{ color: 'var(--tx)' }}>RL.</span></p>
        <input
          className="finput" autoFocus autoComplete="current-password" type="password" placeholder="RL.XXXXXX"
          value={senha} onChange={e => setSenha(e.target.value)} aria-label="Senha"
        />
        {erro && <p className="err">{erro}</p>}
        <button type="submit" className="btn" disabled={aEntrar || !senha.trim()}>
          <span className="fill" />{aEntrar ? 'A entrar…' : 'Entrar'}
        </button>
        <p className="hint">Não tem a senha? Peça-a à RL Photo Video.</p>
      </form>
    </main>
  )
}
