'use client'

import { useState } from 'react'
import Link from 'next/link'
import { getDataProvider, isMockMode } from '@/lib/data-provider'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'busy' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('busy')
    setErrorMsg('')

    try {
      await getDataProvider().sendPasswordResetEmail(email)
      setStatus('sent')
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
          <h1 className="font-display text-xl font-medium text-ink-50 mb-1">Wachtwoord vergeten?</h1>
          <p className="text-ink-400 text-sm">Geen probleem. Vul je email-adres in en we sturen je een reset-link.</p>
        </div>

        {status === 'sent' ? (
          <div className="space-y-4">
            <div className="p-4 bg-accent-mint/10 border border-accent-mint/30 rounded-lg">
              <p className="text-accent-mint text-sm leading-relaxed">
                Check je inbox (en spam-folder) voor een mail met een reset-link. Klik op de link om een nieuw wachtwoord in te stellen.
              </p>
            </div>
            <p className="text-ink-400 text-xs text-center leading-relaxed">
              Krijg je geen mail binnen 5 minuten? Stuur Guido een bericht — hij kan je wachtwoord ook handmatig resetten.
            </p>
            <Link
              href="/login"
              className="block w-full py-3 bg-ink-700 hover:bg-ink-600 text-ink-50 text-center text-sm font-medium rounded-lg transition-colors"
            >
              Terug naar inloggen
            </Link>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-3">
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
                  autoFocus
                  className="w-full px-4 py-2.5 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={status === 'busy'}
                className="w-full py-3 bg-accent-orange text-ink-950 font-display font-medium text-sm rounded-lg hover:brightness-110 transition-all disabled:opacity-50"
              >
                {status === 'busy' ? 'Versturen…' : 'Stuur reset-link'}
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

            {isMockMode() && (
              <div className="mt-6 p-4 bg-ink-800 rounded-lg border border-ink-600">
                <p className="text-xs text-ink-400 mb-2 tracking-wide uppercase">Dev mode</p>
                <p className="text-xs text-ink-200 leading-relaxed">
                  In mock mode wordt geen echte mail verstuurd. De "verzonden" status wordt direct getoond.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
