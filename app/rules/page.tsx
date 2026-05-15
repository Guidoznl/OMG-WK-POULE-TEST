'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TopNav } from '@/components/TopNav'
import { RulesContent } from '@/components/RulesContent'
import { getDataProvider } from '@/lib/data-provider'

export default function RulesPage() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    getDataProvider().getCurrentUser().then(u => setIsLoggedIn(!!u))
  }, [])

  return (
    <>
      {isLoggedIn && <TopNav />}
      <main className="max-w-3xl mx-auto p-4 pb-12">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-medium text-ink-50 mb-1">Spelregels & Voorwaarden</h1>
          <p className="text-ink-400 text-sm">
            De regels van de OppoSuits WK Poule '26 — bewaar of bookmark deze pagina, je kunt 'm altijd terugvinden.
          </p>
        </div>
        <RulesContent />
        {!isLoggedIn && (
          <div className="mt-10 pt-6 border-t border-ink-600 text-center">
            <button
              onClick={() => router.push('/login')}
              className="px-5 py-2.5 bg-accent-orange text-ink-950 font-display font-medium text-sm rounded-lg hover:brightness-110 transition-all"
            >
              Naar inloggen
            </button>
          </div>
        )}
      </main>
    </>
  )
}
