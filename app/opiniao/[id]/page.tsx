import { redirect } from 'next/navigation'

// Links antigos (/opiniao/<id da lead>) seguem para o formulário novo
export default async function OpiniaoAntiga({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/opiniao?id=${encodeURIComponent(id)}`)
}
