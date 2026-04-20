export default function Removido() {
  return (
    <div style={{
      minHeight: '100vh', background: '#0e0b06', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 40, fontFamily: 'Georgia, serif',
    }}>
      <div style={{ maxWidth: 520, textAlign: 'center' }}>
        <h1 style={{ fontSize: 36, fontWeight: 400, marginBottom: 16 }}>
          Subscrição <em style={{ color: '#c9a96e' }}>removida</em>
        </h1>
        <p style={{ color: '#b3a082', lineHeight: 1.7, fontFamily: 'Arial, sans-serif' }}>
          Já não vais receber mais emails da nossa newsletter.<br />
          Ficamos tristes por te veres partir, mas respeitamos a tua decisão.
        </p>
      </div>
    </div>
  )
}
