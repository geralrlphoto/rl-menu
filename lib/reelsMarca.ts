// Vídeos da marca pessoal do Rui (pasta MARCA PESSOAL do Vimeo) para o portal
// da reunião. A lista real vem de /api/reels-marca (lê a pasta no Vimeo);
// esta lista fixa é a reserva e dá as capas 9:16 e as frases já escritas.

export type Reel = {
  vimeo: string      // id do vídeo no Vimeo
  t: string          // título
  p: string          // frase curta (no Vimeo: a descrição do vídeo)
  d: string          // duração mm:ss
  vertical: boolean
  capa: string       // /reels/<id>.jpg ou a capa do Vimeo
  capaH?: boolean    // capa horizontal do Vimeo (sem capa 9:16 nossa): mostra-se inteira sobre fundo desfocado
}

// Ficam fora do portal dos noivos (conteúdo para profissionais)
export const REELS_FORA = ['1246417907'] // Qualificação de leads

export const REELS_FIXOS: Reel[] = [
  { vimeo: '1246417908', t: 'Vais casar em 2027?',         d: '00:55', vertical: false, capa: '/reels/2027.jpg',       p: 'O que tratar já, o que pode esperar e porque é que as melhores datas voam primeiro.' },
  { vimeo: '1246417910', t: 'Foste pedida em casamento?',  d: '01:03', vertical: false, capa: '/reels/pedida.jpg',     p: 'Os três primeiros passos depois do “sim”, antes de entrar em pânico com listas.' },
  { vimeo: '1246417909', t: 'Quanto custa casar?',         d: '00:55', vertical: false, capa: '/reels/custa.jpg',      p: 'Onde vai cada euro de um casamento, sem rodeios.' },
  { vimeo: '1246416051', t: 'O maior erro do meu negócio', d: '00:52', vertical: true,  capa: '/reels/erro.jpg',       p: 'O que aprendi pelo caminho e como deixei de o cometer.' },
  { vimeo: '1246444384', t: 'Same day edit',               d: '00:53', vertical: true,  capa: '/reels/sde.jpg',        p: 'O vosso filme, mostrado na própria festa, a todos os convidados.' },
  { vimeo: '1246453964', t: 'O comentário dos noivos',     d: '00:44', vertical: true,  capa: '/reels/comentario.jpg', p: 'Palavra dos noivos no momento em que viram o same day edit.' },
]

// Capas 9:16 próprias (public/reels), por id do Vimeo. Vídeo novo na pasta sem
// capa aqui → usa a do Vimeo (horizontal) inteira. Para pôr a capa certa:
// gravar a 9:16 em public/reels e acrescentar a linha.
export const CAPAS: Record<string, string> = {
  ...Object.fromEntries(REELS_FIXOS.map(r => [r.vimeo, r.capa])),
  '1246741648': '/reels/prewedding.jpg', // Pre wedding
}
