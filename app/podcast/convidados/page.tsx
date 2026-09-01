import Link from 'next/link'
import type { Metadata } from 'next'
import { PROGRAMA, BASE_URL } from '@/lib/podcast/programa'
import FormularioCandidatura from './FormularioCandidatura'

/* ============================================================
   /podcast/convidados — dossier de convite.
   Página estática: não lê a base de dados.
   ============================================================ */

export const metadata: Metadata = {
  title: 'Ser convidado',
  description:
    'O que é o Antes do Sim, quem ouve, o que implica ser convidado e o que recebe. Candidaturas abertas a profissionais de casamentos.',
  alternates: { canonical: `${BASE_URL}/podcast/convidados` },
  openGraph: {
    type: 'website',
    locale: 'pt_PT',
    title: `Ser convidado · ${PROGRAMA.nome}`,
    description: 'Candidaturas abertas a profissionais de casamentos.',
    url: `${BASE_URL}/podcast/convidados`,
  },
}

export default function ConvidadosPage() {
  return (
    <div className="pod-wrap">
      <p style={{ marginBottom: 28 }}>
        <Link className="pod-voltar" href="/podcast"><span aria-hidden="true">‹</span> Podcast</Link>
      </p>

      <header>
        <p className="pod-eyebrow">Para profissionais</p>
        <h1 className="pod-h1">Ser <em>convidado</em></h1>
        <p className="pod-lede">
          O Antes do Sim é uma conversa por mês com quem faz casamentos por dentro. Se trabalha no
          setor e tem alguma coisa útil para dizer a quem está a planear, queremos falar consigo.
        </p>
        <hr className="pod-rule" />
      </header>

      <section className="pod-seccao" style={{ marginTop: 40 }}>
        <h2 className="pod-h3">O que é o programa</h2>
        <div className="pod-texto">
          <p>{PROGRAMA.descricao}</p>
          <p>
            São doze episódios por ano, um por mês, publicados na primeira terça-feira. Cada
            episódio dura cerca de 45 minutos e sai em áudio e em vídeo.
          </p>
        </div>
      </section>

      <section className="pod-seccao">
        <h2 className="pod-h3">Quem ouve</h2>
        <div className="pod-texto">
          <p>
            Casais em fase de planeamento, na sua maioria a casar na Margem Sul, em Setúbal, Palmela
            e arredores. Chegam pelo Instagram e pela pesquisa, quase sempre no telemóvel, e ouvem
            enquanto conduzem ou tratam da casa.
          </p>
          <p>
            Não é um público de profissionais. É gente a decidir onde gastar o dinheiro do
            casamento, o que torna as respostas concretas muito mais valiosas do que as vagas.
          </p>
        </div>
      </section>

      <section className="pod-seccao">
        <h2 className="pod-h3">O que implica da sua parte</h2>
        <div className="pod-texto">
          <ul>
            <li>Uma conversa de cerca de 45 minutos, gravada de uma vez.</li>
            <li>Meia hora antes para preparar, sem guião decorado: falamos do que faz todos os dias.</li>
            <li>Disponibilidade para responder com franqueza, incluindo sobre preços e erros comuns.</li>
            <li>Autorização para publicarmos a gravação e os excertos nas nossas redes.</li>
          </ul>
          <p>Não é preciso ter experiência em podcasts, nem saber falar para câmara.</p>
        </div>
      </section>

      <section className="pod-seccao">
        <h2 className="pod-h3">O que recebe</h2>
        <div className="pod-texto">
          <ul>
            <li><strong>Um retrato profissional</strong>, feito no dia da gravação, seu para usar onde quiser.</li>
            <li><strong>Cortes verticais</strong> do episódio, prontos para Instagram e TikTok.</li>
            <li><strong>O ficheiro do episódio</strong>, para publicar nos seus canais.</li>
            <li><strong>Menção com ligação</strong> ao seu site e Instagram, na página do episódio e nas notas.</li>
          </ul>
          <p>Não há pagamento de parte a parte. É uma troca.</p>
        </div>
      </section>

      <section className="pod-seccao">
        <h2 className="pod-h3">Como decorre o dia</h2>
        <div className="pod-texto">
          <p>
            Combinamos uma manhã ou uma tarde. Chegamos cerca de meia hora antes para montar som e
            luz. Gravamos a conversa de seguida, sem cortes, e no fim fazemos o retrato.
          </p>
          <p>
            Gravamos no nosso estúdio em Palmela, ou no seu espaço se fizer sentido para o tema,
            uma quinta, uma loja, um atelier. Também podemos gravar numa quinta parceira, quando o
            episódio é sobre espaços.
          </p>
        </div>
      </section>

      <section className="pod-seccao">
        <FormularioCandidatura />
      </section>
    </div>
  )
}
