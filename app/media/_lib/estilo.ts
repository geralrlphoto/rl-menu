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

// Fundo comum: o das secções escuras do site ("Do conceito ao resultado", "Os nossos valores"),
// azul-marinho liso com uma luz suave em cima, sem grelha
export const FUNDO = `
  radial-gradient(ellipse 70% 55% at 65% 0%, rgba(30,70,120,0.55) 0%, transparent 70%),
  radial-gradient(ellipse 60% 45% at 0% 100%, rgba(11,32,51,0.8) 0%, transparent 70%),
  linear-gradient(180deg, #0f2740 0%, #0a1d30 35%, #00141f 75%, #000d17 100%)`
export const FUNDO_TAMANHO = 'auto'
