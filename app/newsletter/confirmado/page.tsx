export default function Confirmado() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0e0b06',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
      fontFamily: 'Georgia, serif',
    }}>
      <div style={{ maxWidth: 520, textAlign: 'center' }}>
        <div style={{
          width: 80, height: 80, margin: '0 auto 32px',
          borderRadius: '50%', border: '1px solid #c9a96e',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, color: '#c9a96e',
        }}>✓</div>
        <h1 style={{ fontSize: 40, fontWeight: 400, marginBottom: 16 }}>
          Subscrição <em style={{ color: '#c9a96e' }}>confirmada</em>
        </h1>
        <p style={{ color: '#b3a082', lineHeight: 1.7, fontFamily: 'Arial, sans-serif' }}>
          Obrigado! A partir de agora vais receber a nossa newsletter com dicas, tendências e bastidores do mundo dos casamentos.
        </p>
        <a href="https://rlphotovideo.pt" style={{
          display: 'inline-block', marginTop: 40,
          padding: '16px 44px', background: '#c9a96e', color: '#0e0b06',
          textDecoration: 'none', fontFamily: 'Arial, sans-serif',
          fontSize: 11, fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase',
        }}>
          Visitar Website
        </a>
      </div>
    </div>
  )
}
