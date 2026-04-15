import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const auth = req.cookies.get('rl_auth')?.value
  return NextResponse.json({ isAdmin: auth === process.env.AUTH_SECRET })
}
