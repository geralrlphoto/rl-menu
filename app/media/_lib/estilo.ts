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

// Fundo comum: degradé azul-marinho, brilho azul e grelha fina (como o vídeo do rodapé do site)
export const FUNDO = `
  linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
  linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px),
  radial-gradient(ellipse 60% 50% at 85% 0%, rgba(46,108,246,0.22) 0%, transparent 70%),
  radial-gradient(ellipse 50% 40% at 10% 100%, rgba(46,108,246,0.10) 0%, transparent 70%),
  linear-gradient(180deg, #0b2033 0%, #00141f 55%, #000d17 100%)`
export const FUNDO_TAMANHO = '56px 56px, 56px 56px, auto, auto, auto'
