import NewsletterLanding from './landing'

export const metadata = {
  title: 'Newsletter | RL Photo & Video',
  description: 'Dicas, tendências e bastidores da fotografia e videografia de casamentos. Inspiração quinzenal direto na tua caixa de email.',
  openGraph: {
    title: 'Newsletter RL Photo & Video',
    description: 'Inspiração quinzenal para o teu casamento de sonho.',
    images: ['https://rlphotovideo.pt/casamentos-2026.jpg'],
  },
}

export default function Page() {
  return <NewsletterLanding />
}
