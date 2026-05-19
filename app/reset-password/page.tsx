'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getDataProvider } from '@/lib/data-provider'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'busy' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  // De Supabase auth helper detecteert automatisch de `type=recovery` token
  // in de URL fragment en wisselt deze in voor een actieve sessie. Hier hoeven
  // we niets te doen behalve het nieuwe wachtwoord te updaten.

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('busy')
    setErrorMsg('')

    if (password.length < 6) {
      setStatus('error')
      setErrorMsg('Wachtwoord moet minimaal 6 tekens zijn')
      return
    }
    if (password !== confirmPassword) {
      setStatus('error')
      setErrorMsg('De twee wachtwoorden komen niet overeen')
      return
    }

    try {
      await getDataProvider().updatePassword(password)
      setStatus('success')
      // Na 2 seconden door naar predictions
      setTimeout(() => router.push('/predictions'), 2000)
    } catch (err: any) {
      setStatus('error')
      setErrorMsg(err.message || 'Er ging iets mis. Misschien is de reset-link verlopen — vraag een nieuwe aan.')
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-accent-orange text-ink-950 font-display font-bold text-xl rounded-lg mb-4">
            O!
          </div>
          <h1 className="font-display text-xl font-medium text-ink-50 mb-1">Kies een nieuw wachtwoord</h1>
          <p className="text-ink-400 text-sm">Minimaal 6 tekens.</p>
        </div>

        {status === 'success' ? (
          <div className="space-y-4">
            <div className="p-4 bg-accent-mint/10 border border-accent-mint/30 rounded-lg">
              <p className="text-accent-mint text-sm text-center">
                Wachtwoord opgeslagen — je wordt automatisch ingelogd…
              </p>
            </div>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] tracking-wider uppercase text-ink-500 mb-1.5">
                  Nieuw wachtwoord
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  autoFocus
                  className="w-full px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] tracking-wider uppercase text-ink-500 mb-1.5">
                  Bevestig nieuw wachtwoord
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full px-4 py-2.5 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={status === 'busy'}
                className="w-full py-3 bg-accent-orange text-ink-950 font-display font-medium text-sm rounded-lg hover:brightness-110 transition-all disabled:opacity-50"
              >
                {status === 'busy' ? 'Opslaan…' : 'Wachtwoord opslaan'}
              </button>
            </form>

            {status === 'error' && errorMsg && (
              <p className="mt-4 text-center text-accent-coral text-sm">
                {errorMsg}
              </p>
            )}

            <p className="mt-6 text-center text-xs text-ink-400">
              <Link href="/login" className="text-ink-200 hover:text-accent-orange underline underline-offset-2">
                Terug naar inloggen
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  )
}
