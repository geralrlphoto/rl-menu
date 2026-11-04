// Formato do índice gerado por scripts/indexar-disco.py
export type Pasta = {
  p: string                                   // caminho relativo, com "/"
  n: [number, number, number, number, number] // fotos, RAW, vídeos, áudio, outros ficheiros (pasta toda)
  b: number                                   // bytes (pasta toda)
  lr?: 1                                      // pasta interna do Lightroom
}
export type Ficheiro = { p: string; b: number }
export type Disco = {
  disco: string
  letra: string
  tamanho: number
  livre: number
  atualizado: string
  pastas: Pasta[]
  ficheiros: Ficheiro[]
}
