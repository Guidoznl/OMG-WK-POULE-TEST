'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CURRENT_TERMS_VERSION } from '@/lib/types'
import { getDataProvider, isMockMode } from '@/lib/data-provider'

type Mode = 'signin' | 'signup'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [status, setStatus] = useState<'idle' | 'busy' | 'check_email' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('busy')
    setErrorMsg('')

    try {
      const provider = getDataProvider()
      if (mode === 'signin') {
        await provider.signInWithPassword(email, password)
      } else {
        if (!agreed) throw new Error('Je moet akkoord gaan met de spelregels')
        if (!displayName.trim()) throw new Error('Vul een naam in')
        if (password.length < 6) throw new Error('Wachtwoord moet minimaal 6 tekens zijn')
        await provider.signUpWithPassword(email, password, displayName.trim())
      }

      // After auth: in mock mode redirect immediately; in Supabase mode the
      // session is now active and we can also redirect.
      const user = await provider.getCurrentUser()
      if (!user) {
        // Supabase requires email confirmation if that's enabled
        if (mode === 'signup' && !isMockMode()) {
          setStatus('check_email')
          return
        }
      }

      // Check terms acceptance for already-existing users
      if (user && (!user.accepted_terms_at || user.accepted_terms_version !== CURRENT_TERMS_VERSION)) {
        // If user just registered and ticked the agreement, accept the terms immediately
        if (mode === 'signup' && agreed) {
          await provider.acceptTerms(CURRENT_TERMS_VERSION)
          router.push('/predictions')
          return
        }
        router.push('/terms-accept')
        return
      }

      router.push('/predictions')
    } catch (err: any) {
      setStatus('error')
      setErrorMsg(err.message || 'Er ging iets mis')
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-accent-orange text-ink-950 font-display font-bold text-xl rounded-lg mb-4">
            O!
          </div>
          <h1 className="font-display text-2xl font-medium text-ink-50 mb-1">WK Poule '26</h1>
          <p className="text-ink-400 text-sm">Intern OppoSuits voorspellingenspel</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-ink-800 p-1 rounded-lg">
          <button
            onClick={() => { setMode('signin'); setErrorMsg(''); setStatus('idle') }}
            className={`flex-1 py-2 text-xs font-medium rounded transition-colors ${
              mode === 'signin' ? 'bg-ink-700 text-ink-50' : 'text-ink-400 hover:text-ink-50'
            }`}
          >
            Inloggen
          </button>
          <button
            onClick={() => { setMode('signup'); setErrorMsg(''); setStatus('idle') }}
            className={`flex-1 py-2 text-xs font-medium rounded transition-colors ${
              mode === 'signup' ? 'bg-ink-700 text-ink-50' : 'text-ink-400 hover:text-ink-50'
            }`}
          >
            Registreren
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'signup' && (
            <div>
              <label className="block text-[10px] tracking-wider uppercase text-ink-500 mb-1.5">
                Naam (zoals anderen je zullen zien)
              </label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Bijv. Jan K."
                required
                maxLength={40}
                className="w-full px-4 py-2.5 text-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] tracking-wider uppercase text-ink-500 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="jouw@email.com"
              required
              autoComplete="email"
              className="w-full px-4 py-2.5 text-sm"
            />
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <label className="block text-[10px] tracking-wider uppercase text-ink-500">
                Wachtwoord {mode === 'signup' && <span className="text-ink-400 normal-case tracking-normal">(min. 6 tekens)</span>}
              </label>
              {mode === 'signin' && (
                <Link
                  href="/forgot-password"
                  className="text-[10px] text-ink-400 hover:text-accent-orange underline underline-offset-2"
                >
                  Vergeten?
                </Link>
              )}
            </div>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={mode === 'signup' ? 6 : undefined}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              className="w-full px-4 py-2.5 text-sm"
            />
          </div>

          {mode === 'signup' && (
            <label className="flex items-start gap-2.5 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-accent-orange flex-shrink-0"
              />
              <span className="text-ink-200 text-xs leading-relaxed">
                Ik ga akkoord met de{' '}
                <Link href="/rules" className="text-accent-orange hover:underline underline-offset-2" target="_blank">
                  spelregels
                </Link>
              </span>
            </label>
          )}

          <button
            type="submit"
            disabled={status === 'busy'}
            className="w-full py-3 bg-accent-orange text-ink-950 font-display font-medium text-sm rounded-lg hover:brightness-110 transition-all disabled:opacity-50 mt-1"
          >
            {status === 'busy'
              ? (mode === 'signin' ? 'Inloggen…' : 'Registreren…')
              : (mode === 'signin' ? 'Inloggen' : 'Account aanmaken')}
          </button>
        </form>

        {status === 'check_email' && (
          <div className="mt-4 p-3 bg-accent-mint/10 border border-accent-mint/30 rounded-lg">
            <p className="text-accent-mint text-sm text-center">
              Check je mail om je account te activeren. Klik op de link en log daarna in.
            </p>
          </div>
        )}

        {status === 'error' && errorMsg && (
          <p className="mt-4 text-center text-accent-coral text-sm">
            {errorMsg}
          </p>
        )}

        <p className="mt-6 text-center text-xs text-ink-400">
          Vergeten waar het over gaat?{' '}
          <Link href="/rules" className="text-ink-200 hover:text-accent-orange underline underline-offset-2">
            Bekijk de spelregels
          </Link>
        </p>

        {isMockMode() && (
          <div className="mt-6 p-4 bg-ink-800 rounded-lg border border-ink-600">
            <p className="text-xs text-ink-400 mb-2 tracking-wide uppercase">Dev mode</p>
            <p className="text-xs text-ink-200 leading-relaxed">
              Mock-modus: log in met willekeurige gegevens. Tip: <span className="text-ink-50">lisa@opposuits.com</span> heeft de regels nog niet geaccepteerd.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
