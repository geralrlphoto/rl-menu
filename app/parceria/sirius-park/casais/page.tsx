// Kit para os casais do Sirius Park: página pública (sem password) que a Inês reencaminha
// aos noivos que visitam o espaço. Botão no portal de parceria (KitCasais em PortalParceria).
import { PUBLICO, PASTA } from '../dados'
import Kit from './Kit'

export const metadata = {
  title: 'Vão casar no Sirius Park? · RL Photo · Video',
  description: 'A equipa de fotografia e vídeo recomendada pelo Sirius Park.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Vão casar no Sirius Park?',
    description: 'A equipa de fotografia e vídeo recomendada pelo Sirius Park.',
    images: [`${PUBLICO}${PASTA}/espaco/sirius-2.jpg`],
  },
}

export default function Page() {
  return <Kit fotosEspaco={`${PUBLICO}${PASTA}/espaco/`} />
}
