import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { exigeAdmin } from '@/lib/api-guard'
import { clienteAdmin } from '@/lib/podcast/dados'

/* ============================================================
   /api/podcast-convites/gerar-texto
   Escreve com o Claude o texto "Porque pensámos em si" do convite,
   a partir do que a pessoa faz e do tema do episódio.
   Só admin. Devolve o texto; quem guarda é o formulário.
   ============================================================ */

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const client = new Anthropic()
const MODELO = 'claude-sonnet-5-5'

const EXEMPLO = `As joias são das poucas coisas do casamento que ficam para a vida. O vestido guarda-se e as flores secam, mas a aliança e as peças que a noiva escolhe para esse dia continuam a ser usadas, todos os dias, durante anos.
Muitos casais escolhem estas peças à pressa, numa montra, sem saberem que podem ser feitas à mão e à medida da sua história. É exatamente isso que faz na Halus Stories: joalharia para noivas, peça a peça, feita à mão.
Este episódio só faz sentido com alguém que conhece o processo por dentro: o tempo que uma peça leva a nascer, o que se pode personalizar e o que vale a pena pensar antes de escolher. A sua presença dá aos noivos que nos ouvem o olhar de quem cria, e não apenas de quem vende.`

const SISTEMA = `Escreves, em português de Portugal, o texto da secção "Porque pensámos em si" de um convite pessoal para participar no "Antes do Sim", o podcast da RL Photo.Video sobre casamentos, feito para casais de namorados que estão a pensar casar.

Regras:
- Três parágrafos curtos, separados por uma linha. Tratamento por "você" implícito (sem "você" escrito; usar "a sua presença", "faz", etc.).
- Explica porque o tema do episódio importa aos casais e porque é esta pessoa, com o trabalho que faz, que o deve trazer.
- Usa só o que te é dado. Não inventes anos de experiência, prémios, números, clientes nem pormenores que não estejam na descrição.
- Não reveles perguntas do episódio. Não fales de preços.
- Sem travessões (—). Prefere pontos e vírgulas. Sem emojis, sem listas, sem título.
- Tom caloroso e elegante, sem exageros nem frases feitas de marketing.
- Devolve só o texto.

Exemplo de um texto aprovado:
${EXEMPLO}`

// POST { sobre, marca?, nome?, episodio } → { texto }
export async function POST(req: Request) {
  const barrado = exigeAdmin(req)
  if (barrado) return barrado
  const body = await req.json().catch(() => ({}))
  const sobre = typeof body.sobre === 'string' ? body.sobre.trim() : ''
  if (!sobre) return NextResponse.json({ error: 'Preenche primeiro "O que faz".' }, { status: 400 })

  let tema = ''
  if (body.episodio) {
    const { data } = await clienteAdmin().from('podcast_episodios').select('titulo').eq('id', body.episodio).maybeSingle()
    tema = data?.titulo ?? ''
  }

  try {
    const res = await client.messages.create({
      model: MODELO,
      max_tokens: 1200,
      system: SISTEMA,
      messages: [{
        role: 'user',
        content: `Tema do episódio: ${tema || '(sem tema)'}
Marca: ${body.marca || '(sem marca)'}
O que a pessoa faz: ${sobre}`,
      }],
    })
    const texto = res.content.filter(b => b.type === 'text').map(b => (b as { text: string }).text).join('').trim()
      .replace(/\s*—\s*/g, ', ')
    if (!texto) return NextResponse.json({ error: 'O Claude não devolveu texto. Tenta outra vez.' }, { status: 502 })
    return NextResponse.json({ texto })
  } catch (err: unknown) {
    if (err instanceof Anthropic.APIError && /credit balance/i.test(err.message)) {
      return NextResponse.json({ error: 'A conta da API do Claude está sem crédito. Carrega crédito em console.anthropic.com → Plans & Billing e tenta outra vez.' }, { status: 402 })
    }
    if (err instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: 'A chave ANTHROPIC_API_KEY do Vercel não é válida.' }, { status: 500 })
    }
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json({ error: `Erro do Claude (${err.status}): ${err.message}` }, { status: 502 })
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro ao gerar o texto.' }, { status: 500 })
  }
}
