'use client'

import { useState } from 'react'

export default function NewsletterLanding() {
  const [email, setEmail] = useState('')
  const [nome, setNome] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  async function subscribe(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const r = await fetch('/api/newsletter-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, nome, source: 'landing' }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Erro')
      setStatus('success')
      setMsg(data.message || 'Verifica o teu email para confirmares!')
    } catch (err: any) {
      setStatus('error')
      setMsg(err.message || 'Erro ao subscrever')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{css}</style>
      <div className="bg-effects" />
      <div className="nl-page">

        <nav>
          <div className="logo">
            <div className="logo-ring"><span>RL</span></div>
            <span className="logo-text">RL PHOTO &amp; VIDEO</span>
          </div>
          <ul className="nav-links">
            <li><a href="#features">O que recebes</a></li>
            <li><a href="#preview">Preview</a></li>
            <li><a href="#testemunhos">Testemunhos</a></li>
            <li><a href="#subscrever">Subscrever</a></li>
          </ul>
        </nav>

        <section className="hero">
          <div className="hero-ring"><span>RL</span></div>
          <div className="hero-badge">Newsletter Exclusiva</div>
          <h1>Inspira o teu<br /><em>casamento de sonho</em></h1>
          <p className="hero-p">
            Dicas, tendências e bastidores do mundo da fotografia e videografia de casamentos.
            Direto na tua caixa de email, a cada 2 semanas.
          </p>

          {status === 'success' ? (
            <div className="success">
              <div className="success-icon">✓</div>
              <h3>Quase lá!</h3>
              <p>{msg}</p>
            </div>
          ) : (
            <form onSubmit={subscribe} className="subscribe-form" id="subscrever">
              <input
                type="text"
                placeholder="O teu nome (opcional)"
                value={nome}
                onChange={e => setNome(e.target.value)}
                className="nl-input"
              />
              <div className="row">
                <input
                  type="email"
                  placeholder="O teu melhor email..."
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="nl-input"
                />
                <button type="submit" disabled={loading} className="btn-gold">
                  {loading ? 'A subscrever...' : 'Subscrever'}
                </button>
              </div>
              {status === 'error' && <p className="err">{msg}</p>}
              <p className="form-note">Sem spam. Cancela quando quiseres.</p>
            </form>
          )}
        </section>

        <div className="stats">
          <div className="stat"><div className="stat-number">+500</div><div className="stat-label">Casamentos</div></div>
          <div className="stat"><div className="stat-number">8</div><div className="stat-label">Anos experiência</div></div>
          <div className="stat"><div className="stat-number">50+</div><div className="stat-label">Dicas exclusivas</div></div>
          <div className="stat"><div className="stat-number">Quinzenal</div><div className="stat-label">Frequência</div></div>
        </div>

        <section className="section" id="features">
          <div className="section-title">
            <h2>O que vais <em>receber</em></h2>
            <p>Conteúdo curado para quem está a planear o dia mais importante</p>
          </div>
          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="feature-card">
                <span className="feature-icon">{f.icon}</span>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="testimonials" id="testemunhos">
          <div className="section-title">
            <h2>O que dizem os <em>noivos</em></h2>
            <p>Casais que confiaram em nós para eternizar o seu grande dia</p>
          </div>
          <div className="testimonial-grid">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="testimonial">
                <div className="testimonial-stars">★ ★ ★ ★ ★</div>
                <p>{t.text}</p>
                <div className="testimonial-author">{t.author}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="cta-bottom">
          <h2>Pronto para <em>começar</em>?</h2>
          <p>Junta-te a centenas de noivos que já recebem as nossas dicas.</p>
          <a href="#subscrever" className="btn-gold btn-inline">Subscrever Agora</a>
        </section>

        <footer>
          <p>© 2026 RL Photo &amp; Video · <a href="https://rlphotovideo.pt">rlphotovideo.pt</a></p>
        </footer>
      </div>
    </>
  )
}

const FEATURES = [
  { icon: '♥', title: 'Dicas para Noivos', body: 'Guias práticos sobre escolher fornecedores, preparar a timeline e evitar os erros mais comuns.' },
  { icon: '★', title: 'Tendências', body: 'As últimas tendências em fotografia e videografia de casamentos: estilos, cores, locais.' },
  { icon: '☰', title: 'Bastidores', body: 'Behind the scenes de casamentos reais. Vê como fotografamos e filmamos os momentos mais especiais.' },
  { icon: '✧', title: 'Inspiração Visual', body: 'Seleção curada de fotografias e filmes dos nossos melhores trabalhos, com dicas práticas.' },
  { icon: '✎', title: 'Checklists', body: 'Listas práticas organizadas por meses antes do casamento. Desde 12 meses até à véspera.' },
  { icon: '♡', title: 'Histórias Reais', body: 'Testemunhos e histórias de casais que já viveram o seu dia. Inspiração autêntica.' },
]

const TESTIMONIALS = [
  { text: 'O Rui e a equipa foram incríveis. Captaram cada emoção com uma sensibilidade única. As fotografias superaram todas as expectativas.', author: 'Ana & Pedro · Casamento 2025' },
  { text: 'Profissionalismo do início ao fim. O filme de casamento é simplesmente cinematográfico!', author: 'Sofia & Miguel · Casamento 2025' },
  { text: 'Mais do que fotógrafos, ganhámos amigos. O resultado fala por si. Recomendamos de olhos fechados!', author: 'Joana & Tiago · Casamento 2024' },
]

const css = `
  .nl-page * { box-sizing: border-box; }
  .nl-page { font-family: 'Montserrat', Arial, sans-serif; background: #0c0907; color: #f5f0e8; min-height: 100vh; position: relative; z-index: 1; max-width: 1200px; margin: 0 auto; padding: 0 24px; }
  .bg-effects { position: fixed; inset: 0; pointer-events: none; z-index: 0; background: radial-gradient(ellipse at 20% 20%, rgba(160,110,50,0.08), transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(140,95,40,0.06), transparent 45%); }
  nav { padding: 32px 0; display: flex; align-items: center; justify-content: space-between; }
  .logo { display: flex; align-items: center; gap: 14px; }
  .logo-ring, .hero-ring { display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; border: 1px solid rgba(201,168,76,0.4); box-shadow: 0 4px 16px rgba(201,168,76,0.15); font-family: Georgia, serif; color: #c9a84c; font-style: italic; }
  .logo-ring { width: 56px; height: 56px; font-size: 18px; }
  .hero-ring { width: 120px; height: 120px; margin: 0 auto 32px; font-size: 38px; border-width: 2px; }
  .logo-text { font-family: Georgia, serif; font-size: 1.4rem; color: #c9a84c; letter-spacing: 2px; }
  .nav-links { display: flex; gap: 32px; list-style: none; padding: 0; margin: 0; }
  .nav-links a { color: #a09585; text-decoration: none; font-size: 0.75rem; letter-spacing: 2px; text-transform: uppercase; transition: color 0.3s; }
  .nav-links a:hover { color: #c9a84c; }
  .hero { padding: 80px 0 100px; text-align: center; }
  .hero-badge { display: inline-block; font-size: 0.65rem; letter-spacing: 4px; text-transform: uppercase; color: #c9a84c; border: 1px solid rgba(201,168,76,0.3); padding: 8px 24px; margin-bottom: 40px; }
  .hero h1 { font-family: Georgia, serif; font-size: clamp(2.5rem, 6vw, 4.5rem); font-weight: 300; line-height: 1.15; margin: 0 0 24px; }
  .hero h1 em { font-style: italic; color: #c9a84c; }
  .hero-p { font-weight: 300; color: #a09585; max-width: 560px; margin: 0 auto 48px; line-height: 1.8; }
  .subscribe-form { max-width: 520px; margin: 0 auto; }
  .row { display: flex; gap: 0; }
  .nl-input { width: 100%; padding: 16px 24px; background: rgba(255,255,255,0.04); border: 1px solid rgba(201,168,76,0.2); color: #f5f0e8; font-family: inherit; font-size: 16px; outline: none; margin-bottom: 10px; }
  .row .nl-input { margin-bottom: 0; border-right: none; }
  .row .btn-gold { border-left: none; }
  .nl-input::placeholder { color: #a09585; opacity: 0.6; }
  .nl-input:focus { border-color: rgba(201,168,76,0.5); background: rgba(255,255,255,0.06); }
  .btn-gold { padding: 16px 32px; background: #c9a84c; border: 1px solid #c9a84c; color: #0c0907; font-family: inherit; font-size: 11px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; cursor: pointer; transition: all 0.3s; white-space: nowrap; }
  .btn-gold:hover { background: #e0c67a; }
  .btn-gold:disabled { opacity: 0.5; cursor: wait; }
  .btn-inline { display: inline-block; text-decoration: none; padding: 18px 42px; }
  .form-note { text-align: center; margin-top: 16px; font-size: 11px; color: #a09585; opacity: 0.6; }
  .err { color: #f0b429; margin-top: 10px; font-size: 13px; }
  .success { text-align: center; max-width: 520px; margin: 0 auto; padding: 40px; border: 1px solid rgba(201,168,76,0.3); }
  .success-icon { font-size: 48px; color: #c9a84c; margin-bottom: 16px; }
  .success h3 { font-family: Georgia, serif; font-size: 28px; color: #c9a84c; margin: 0 0 10px; font-weight: 400; }
  .success p { color: #a09585; }
  .stats { display: flex; justify-content: center; gap: 64px; padding: 60px 0; border-top: 1px solid rgba(201,168,76,0.1); border-bottom: 1px solid rgba(201,168,76,0.1); flex-wrap: wrap; }
  .stat-number { font-family: Georgia, serif; font-size: 2.5rem; color: #c9a84c; margin-bottom: 4px; }
  .stat-label { font-size: 0.65rem; letter-spacing: 3px; text-transform: uppercase; color: #a09585; }
  .section { padding: 80px 0; }
  .section-title { text-align: center; margin-bottom: 56px; }
  .section-title h2 { font-family: Georgia, serif; font-size: 2.2rem; font-weight: 300; margin: 0 0 12px; }
  .section-title em { color: #c9a84c; font-style: italic; }
  .section-title p { color: #a09585; font-size: 0.85rem; font-weight: 300; }
  .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }
  .feature-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(201,168,76,0.1); padding: 40px 32px; transition: all 0.4s; }
  .feature-card:hover { border-color: rgba(201,168,76,0.25); transform: translateY(-4px); }
  .feature-card .feature-icon { font-size: 1.8rem; margin-bottom: 20px; display: block; color: #c9a84c; }
  .feature-card h3 { font-family: Georgia, serif; font-size: 1.3rem; font-weight: 400; margin: 0 0 12px; }
  .feature-card p { font-size: 0.82rem; color: #a09585; line-height: 1.7; margin: 0; }
  .testimonials { padding: 80px 0; border-top: 1px solid rgba(201,168,76,0.1); }
  .testimonial-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }
  .testimonial { padding: 32px; border: 1px solid rgba(201,168,76,0.08); background: rgba(255,255,255,0.015); }
  .testimonial-stars { color: #c9a84c; font-size: 0.75rem; letter-spacing: 2px; margin-bottom: 16px; }
  .testimonial p { font-family: Georgia, serif; font-size: 1rem; font-style: italic; color: #f5f0e8; line-height: 1.7; margin: 0 0 20px; }
  .testimonial-author { font-size: 0.7rem; letter-spacing: 2px; text-transform: uppercase; color: #a09585; }
  .cta-bottom { padding: 100px 0; text-align: center; }
  .cta-bottom h2 { font-family: Georgia, serif; font-size: 2.5rem; font-weight: 300; margin: 0 0 16px; }
  .cta-bottom em { color: #c9a84c; font-style: italic; }
  .cta-bottom p { color: #a09585; font-size: 0.85rem; margin: 0 0 40px; }
  footer { padding: 40px 0; border-top: 1px solid rgba(201,168,76,0.08); text-align: center; }
  footer, footer a { font-size: 11px; color: #a09585; opacity: 0.6; text-decoration: none; }
  @media (max-width: 768px) {
    .nav-links { display: none; }
    .features-grid, .testimonial-grid { grid-template-columns: 1fr; }
    .stats { gap: 28px; }
    .row { flex-direction: column; }
    .row .nl-input { border-right: 1px solid rgba(201,168,76,0.2); }
    .row .btn-gold { width: 100%; border-left: 1px solid #c9a84c; margin-top: 10px; }
    .hero { padding: 40px 0 60px; }
    .hero-ring { width: 90px; height: 90px; font-size: 28px; }
  }
`
