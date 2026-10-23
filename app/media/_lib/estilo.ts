// Identidade do rlprod.pt para as páginas internas da RL PROD (/media)
// Azul-noite + azul elétrico, títulos Saira Condensed em maiúsculas, etiquetas JetBrains Mono.

export const COR = {
  noite: '#00141f',     // barra do site
  marinho: '#0b2033',   // secções escuras
  cartao: '#0c2236',    // cartões sobre o escuro
  azul: '#2e6cf6',      // botões e contornos
  azulClaro: '#5a8bff', // texto de destaque sobre o escuro
  azulPalido: '#a9c1ff',
  cinza: '#7c8893',
  vermelho: '#ff4747',  // o "REC" do site
}

// Carregadas por <link> (o next/font partiu o build do Vercel com a JetBrains Mono)
export const FONTES_CSS =
  'https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@500;600;700;800&family=Saira:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap'

export const FONTE = {
  titulo: "'Saira Condensed', 'Saira', sans-serif",
  texto: "'Saira', system-ui, sans-serif",
  mono: "'JetBrains Mono', monospace",
}

// Anéis de lente (como os círculos das secções "Cinematográfica" e "Pronto para levar" do site)
const ANEIS = `<svg xmlns='http://www.w3.org/2000/svg' width='1400' height='1400' viewBox='0 0 1400 1400' fill='none'>
  <g stroke='%235a8bff'>
    <circle cx='700' cy='700' r='690' stroke-opacity='.07'/>
    <circle cx='700' cy='700' r='560' stroke-opacity='.09'/>
    <circle cx='700' cy='700' r='430' stroke-opacity='.12'/>
    <circle cx='700' cy='700' r='300' stroke-opacity='.10' stroke-dasharray='2 10'/>
    <path d='M700 0v120M700 1280v120M0 700h120M1280 700h120' stroke-opacity='.18'/>
  </g>
  <path d='M700 270 A430 430 0 0 1 1080 470' stroke='%232e6cf6' stroke-opacity='.55' stroke-width='2'/>
</svg>`.replace(/\n\s*/g, ' ')

// Fundo comum: azul-noite do site, luz azul atrás da lente e linhas diagonais finas
// (as do "Cinematográfica com originalidade"), sem grelha
export const FUNDO = `
  url("data:image/svg+xml,${ANEIS.replace(/"/g, "'").replace(/#/g, '%23')}") no-repeat right -420px top -380px / 1400px 1400px,
  radial-gradient(circle at 78% 12%, rgba(46,108,246,0.28) 0%, rgba(46,108,246,0.08) 28%, transparent 50%),
  repeating-linear-gradient(135deg, rgba(255,255,255,0.018) 0px, rgba(255,255,255,0.018) 1px, transparent 1px, transparent 46px),
  linear-gradient(180deg, #071a2b 0%, #00141f 50%, #000d17 100%)`
export const FUNDO_TAMANHO = ''
