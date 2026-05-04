import { redirect } from 'next/navigation'

type Props = { params: Promise<{ ref: string }> }

export default async function RevisoesPage({ params }: Props) {
  const { ref } = await params
  redirect(`/portal-media/${ref}/entregas`)
}
