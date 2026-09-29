import type { Metadata } from 'next'
import { CSS_BRIEFING } from '@/app/_briefing/estilo'

/* Boas-vindas: página aberta pelo QR code impresso.
   Todas as ligações da RL num só sítio (contactos, sites, redes). */

export const metadata: Metadata = { title: 'RL Photo.Video · Contactos' }

type Ligacao = { rotulo: string; valor: string; href: string }

const LIGACOES: Ligacao[] = [
  { rotulo: 'Telefone', valor: '912 932 768', href: 'tel:+351912932768' },
  { rotulo: 'WhatsApp', valor: 'Enviar mensagem', href: 'https://wa.me/351912932768' },
  { rotulo: 'Email', valor: 'geral@rlphotovideo.pt', href: 'mailto:geral@rlphotovideo.pt' },
  { rotulo: 'Site', valor: 'rlphotovideo.pt', href: 'https://rlphotovideo.pt' },
  { rotulo: 'Site', valor: 'rlprod.pt', href: 'https://rlprod.pt' },
  { rotulo: 'Instagram', valor: '@rlphoto_fotografia.video', href: 'https://www.instagram.com/rlphoto_fotografia.video/' },
]

const CSS_LIGACOES = `
.nlead .lig{display:flex;align-items:center;gap:14px;padding:20px 18px;border:1px solid var(--line-soft);border-radius:12px;
  text-decoration:none;transition:.4s var(--ease);}
.nlead .lig:hover{border-color:var(--g);background:rgba(216,190,147,.05);}
.nlead .lig .r{font-family:var(--fm);font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--g);width:84px;flex:none;}
.nlead .lig .v{font-family:var(--fd);font-weight:300;font-size:clamp(15px,4.2vw,18px);color:var(--tx);flex:1;min-width:0;overflow-wrap:anywhere;}
.nlead .lig .s{color:var(--tx-dim);transition:.4s var(--ease);}
.nlead .lig:hover .s{color:var(--g);transform:translateX(3px);}
`

export default function BoasVindasPage() {
  return (
    <main className="nlead" style={{ minHeight: '100vh', background: 'var(--ink)' }}>
      <style>{CSS_BRIEFING + CSS_LIGACOES}</style>
      <div className="fx-grain" aria-hidden="true" />
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: 'clamp(48px,9vh,96px) 20px 80px' }}>
        <header style={{ textAlign: 'center', marginBottom: 'clamp(36px,6vh,56px)' }}>
          <p className="eyebrow">RL Photo &middot; Video</p>
          <h1 style={{ fontSize: 'clamp(44px,11vw,72px)', marginTop: '20px' }}>Bem-<em>vindos</em></h1>
          <div style={{ width: '48px', height: '1px', background: 'var(--g)', opacity: .6, margin: '26px auto 0' }} />
          <p className="lead" style={{ marginTop: '22px' }}>Todos os nossos contactos, num só sítio.</p>
        </header>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {LIGACOES.map(l => (
            <a key={l.href} href={l.href} className="lig"
              {...(l.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
              <span className="r">{l.rotulo}</span>
              <span className="v">{l.valor}</span>
              <span className="s" aria-hidden="true">↗</span>
            </a>
          ))}
        </nav>
      </div>
    </main>
  )
}
