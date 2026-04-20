import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://newsletter.rlphotovideo.pt'

  if (!token) {
    return NextResponse.redirect(`${baseUrl}/newsletter/erro?msg=token-invalido`)
  }

  await supabaseAdmin
    .from('newsletter_subscribers')
    .update({
      status: 'unsubscribed',
      unsubscribed_at: new Date().toISOString(),
    })
    .eq('confirmation_token', token)

  return NextResponse.redirect(`${baseUrl}/newsletter/removido`)
}
