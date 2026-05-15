'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CURRENT_TERMS_VERSION } from '@/lib/types'
import { getDataProvider } from '@/lib/data-provider'
import { RulesContent } from '@/components/RulesContent'

export default function TermsAcceptPage() {
  const router = useRouter()
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [displayName, setDisplayName] = useState<string | null>(null)

  useEffect(() => {
    getDataProvider().getCurrentUser().then(user => {
      if (!user) { router.push('/login'); return }
      // Already accepted current version? Redirect away
      if (user.accepted_terms_at && user.accepted_terms_version === CURRENT_TERMS_VERSION) {
        router.push('/predictions')
        return
      }
      setDisplayName(user.display_name)
    })
  }, [router])

  async function handleAccept() {
    if (!agreed) return
    setSubmitting(true)
    try {
      await getDataProvider().acceptTerms(CURRENT_TERMS_VERSION)
      router.push('/predictions')
    } catch (err) {
      console.error(err)
      setSubmitting(false)
    }
  }

  if (!displayName) {
    return <main className="min-h-screen flex items-center justify-center text-ink-400 text-sm">Laden…</main>
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-3xl mx-auto p-4 pb-12">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-accent-orange text-ink-950 font-display font-bold text-lg rounded-lg mb-3">
            O!
          </div>
          <h1 className="font-display text-2xl font-medium text-ink-50 mb-1">Welkom, {displayName}</h1>
          <p className="text-ink-400 text-sm">Lees de spelregels en accepteer ze om mee te doen.</p>
        </div>

        <div className="bg-ink-800 rounded-tile p-6 mb-4 max-h-[480px] overflow-y-auto">
          <RulesContent />
        </div>

        {/* Sticky-style action bar */}
        <div className="bg-ink-900 rounded-tile border border-ink-600 p-4 space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              className="mt-1 w-4 h-4 accent-accent-orange"
            />
            <span className="text-ink-200 text-sm">
              Ik heb de spelregels en voorwaarden gelezen en ga hiermee akkoord.
            </span>
          </label>
          <button
            onClick={handleAccept}
            disabled={!agreed || submitting}
            className="w-full py-3 bg-accent-orange text-ink-950 font-display font-medium text-sm rounded-lg hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? 'Bezig…' : 'Akkoord en doe mee'}
          </button>
        </div>
      </div>
    </main>
  )
}
