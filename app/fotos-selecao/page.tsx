import { redirect } from 'next/navigation'

// A página Fotos Seleção foi substituída pelo Departamento de Fotografia
// (/edicao-fotografia): a seleção dos noivos, o editor de fotos e o editor do
// álbum geram-se lá. O detalhe /fotos-selecao/[id] continua disponível.
export default function FotosSelecaoPage() {
  redirect('/edicao-fotografia')
}
