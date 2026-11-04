// Formato do índice gerado por scripts/indexar-disco.py
export type Pasta = {
  p: string                                   // caminho relativo, com "/"
  n: [number, number, number, number, number] // fotos, RAW, vídeos, áudio, outros ficheiros (pasta toda)
  b: number                                   // bytes (pasta toda)
  lr?: 1                                      // pasta interna do Lightroom
}
export type Ficheiro = { p: string; b: number }
// Repetidos = mesmo nome e mesmo tamanho em mais de uma pasta do mesmo disco (ficheiros ≥ 100 KB)
export type Repetidos = {
  n: number          // cópias a mais
  bytes: number      // espaço ocupado pelas cópias a mais
  grupos: number     // ficheiros diferentes que estão repetidos
  pastas: { a: string; b: string; n: number; bytes: number; ta: number; tb: number }[] // pares de pastas com ficheiros iguais
  ficheiros: { n: string; b: number; p: string[] }[]                                  // ficheiro e as pastas onde está
}
export type Disco = {
  disco: string
  letra: string
  tamanho: number
  livre: number
  atualizado: string
  pedido_em?: string | null   // botão Atualizar (o robô do PC apanha o pedido)
  ligado?: boolean            // o disco estava ligado ao PC na última volta do robô
  visto_em?: string | null    // última vez que o robô viu o disco ligado
  pastas: Pasta[]
  ficheiros: Ficheiro[]
  repetidos?: Repetidos | null  // só existe depois de o disco ser lido com a versão nova do robô
}
