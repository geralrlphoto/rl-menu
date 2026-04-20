export default function Erro() {
  return (
    <div style={{
      minHeight: '100vh', background: '#0e0b06', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 40, fontFamily: 'Georgia, serif',
    }}>
      <div style={{ maxWidth: 520, textAlign: 'center' }}>
        <h1 style={{ fontSize: 36, fontWeight: 400, marginBottom: 16 }}>
          Link <em style={{ color: '#c9a96e' }}>inválido</em>
        </h1>
        <p style={{ color: '#b3a082', lineHeight: 1.7, fontFamily: 'Arial, sans-serif' }}>
          O link que usaste não é válido ou expirou.<br />
          Se precisares de ajuda, contacta-nos em geral@rlphotovideo.pt
        </p>
      </div>
    </div>
  )
}
