import MediaSectionTemplate from '@/app/media/_section/MediaSectionTemplate'

// Server-render por request (sem geração estática no build) — evita
// timeouts de 60s no Vercel quando o Supabase está lento.
export const dynamic = 'force-dynamic'

export default function Page() {
  return <MediaSectionTemplate sectionName="Recursos Humanos" />
}
