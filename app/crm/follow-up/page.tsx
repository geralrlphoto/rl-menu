'use client'

import Link from 'next/link'

export default function FollowUpPage() {
  return (
    <main className="min-h-screen px-3 sm:px-6 py-6 sm:py-10 max-w-[1400px] mx-auto">
      <div className="mb-8 sm:mb-12">
        <Link href="/crm" className="text-xs tracking-[0.3em] text-white/20 hover:text-gold transition-colors uppercase">
          ‹ CRM
        </Link>
        <h1 className="text-3xl sm:text-5xl font-extralight tracking-[0.15em] sm:tracking-[0.2em] text-white uppercase mt-3">Follow Up</h1>
      </div>
    </main>
  )
}
