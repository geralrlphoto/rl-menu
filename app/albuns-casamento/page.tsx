import { redirect } from 'next/navigation'

// A página Álbuns passou para o Departamento de Fotografia › Álbuns
// (/edicao-fotografia/albuns), com o estado num só sítio (lib/albumEstado.ts).
// Fica este reencaminhamento para os links antigos (ex.: o cartão do /photo).
export default function AlbunsCasamentoPage() {
  redirect('/edicao-fotografia/albuns')
}
