'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CURRENT_TERMS_VERSION } from '@/lib/types'
import { getDataProvider, isMockMode } from '@/lib/data-provider'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    try {
      await getDataProvider().signInWithEmail(email)
      if (isMockMode()) {
        // After "login", check if user needs to accept terms
        const user = await getDataProvider().getCurrentUser()
        if (!user?.accepted_terms_at || user.accepted_terms_version !== CURRENT_TERMS_VERSION) {
          router.push('/terms-accept')
        } else {
          router.push('/predictions')
        }
      } else {
        setStatus('sent')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-accent-orange text-ink-950 font-display font-bold text-xl rounded-lg mb-4">
            O!
          </div>
          <h1 className="font-display text-2xl font-medium text-ink-50 mb-2">WK Poule '26</h1>
          <p className="text-ink-400 text-sm">Intern OppoSuits voorspellingenspel</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="jouw@opposuits.com"
            required
            className="w-full px-4 py-3 text-sm"
          />
          <button
            type="submit"
            disabled={status === 'sending'}
            className="w-full py-3 bg-accent-orange text-ink-950 font-display font-medium text-sm rounded-lg hover:brightness-110 transition-all disabled:opacity-50"
          >
            {status === 'sending' ? 'Versturen…' : 'Stuur magic link'}
          </button>
        </form>

        {status === 'sent' && (
          <p className="mt-4 text-center text-accent-mint text-sm">
            Check je mail voor de inloglink.
          </p>
        )}
        {status === 'error' && (
          <p className="mt-4 text-center text-accent-coral text-sm">
            Er ging iets mis. Probeer opnieuw.
          </p>
        )}

        <p className="mt-6 text-center text-xs text-ink-400">
          Door in te loggen ga je akkoord met de{' '}
          <Link href="/rules" className="text-ink-200 hover:text-accent-orange underline underline-offset-2">spelregels</Link>.
        </p>

        {isMockMode() && (
          <div className="mt-8 p-4 bg-ink-800 rounded-lg border border-ink-600">
            <p className="text-xs text-ink-400 mb-2 tracking-wide uppercase">Dev mode</p>
            <p className="text-xs text-ink-200 leading-relaxed">
              Tip: log in als <span className="text-ink-50">lisa@opposuits.com</span> — zij heeft de regels nog niet geaccepteerd, zo zie je het terms-scherm.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
