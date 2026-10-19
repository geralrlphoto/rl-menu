// A roda: monograma RL dentro de anéis de mostrador. Os anéis de dentro
// (gira / giraInv) rodam com o scroll. Usada na página de marcas (/) e no
// Menu do /photo, para as duas rodas serem iguais.
// As letras usam Cormorant Garamond (a página tem de carregar a fonte).

const OURO = '#d8be93'
const r2r = (v: number) => Math.round(v * 100) / 100

export default function Mostrador({ gira, giraInv, roda, className, style, semLetras }: {
  gira: React.Ref<SVGGElement>; giraInv: React.Ref<SVGGElement>; roda: React.Ref<SVGSVGElement>
  className?: string; style?: React.CSSProperties
  semLetras?: boolean   // sem o "R L" dentro da elipse
}) {
  const letra: React.CSSProperties = { fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: 46, fill: '#f3ede2' }
  return (
    <svg ref={roda} viewBox="-340 -340 680 680" className={className} style={style} aria-hidden="true">
      <circle r="330" fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="1" />
      <g ref={gira}>
        {Array.from({ length: 144 }).map((_, i) => {
          const a = (i / 144) * Math.PI * 2
          const ra = 158, rb = i % 12 === 0 ? 144 : 151
          return <line key={i} x1={r2r(Math.cos(a) * ra)} y1={r2r(Math.sin(a) * ra)} x2={r2r(Math.cos(a) * rb)} y2={r2r(Math.sin(a) * rb)}
            stroke={i === 0 ? OURO : 'rgba(255,255,255,.24)'} strokeWidth={i === 0 ? 2 : 1} />
        })}
      </g>
      <g ref={giraInv}>
        {Array.from({ length: 9 }).map((_, i) => {
          const a = (i / 9) * Math.PI * 2 + .3
          return <circle key={i} cx={r2r(Math.cos(a) * 132)} cy={r2r(Math.sin(a) * 132)} r="3" fill="rgba(255,255,255,.35)" />
        })}
      </g>
      <ellipse rx="44" ry="58" fill="none" stroke={OURO} strokeWidth="1.2" />
      {!semLetras && <>
        <text x="-14" y="-6" textAnchor="middle" style={letra}>R</text>
        <text x="14" y="30" textAnchor="middle" style={letra}>L</text>
      </>}
    </svg>
  )
}
