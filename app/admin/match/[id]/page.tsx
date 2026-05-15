'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { Match, Prediction, Profile, MatchResultState } from '@/lib/types'
import { getDataProvider } from '@/lib/data-provider'
import { formatDateLocal, formatTimeLocal } from '@/lib/date-utils'
import { TopNav } from '@/components/TopNav'
import { FlagCircle } from '@/components/FlagCircle'

type PredictionWithUser = Prediction & { display_name: string; user_id: string }

export default function AdminMatchPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const matchId = parseInt(params.id, 10)

  const [match, setMatch] = useState<Match | null>(null)
  const [resultState, setResultState] = useState<MatchResultState>('no_result')
  const [home, setHome] = useState<string>('')
  const [away, setAway] = useState<string>('')
  const [allPredictions, setAllPredictions] = useState<PredictionWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)

  async function reload() {
    const provider = getDataProvider()
    const overview = await provider.adminGetMatchOverview()
    const entry = overview.find(o => o.match.id === matchId)
    if (!entry) return
    setMatch(entry.match)
    setResultState(entry.result_state)
    if (entry.match.home_score !== null) {
      setHome(entry.match.home_score.toString())
      setAway(entry.match.away_score!.toString())
    }

    // Collect predictions across all users via the data provider
    try {
      const preds = await provider.adminGetPredictionsForMatch(matchId)
      setAllPredictions(preds.map((p: any) => ({
        match_id: matchId,
        user_id: p.user_id,
        display_name: p.display_name,
        home_score: p.home_score,
        away_score: p.away_score,
        submitted_at: p.submitted_at,
        points_awarded: p.points_awarded,
      })))
    } catch (err) {
      console.error('Could not load predictions:', err)
      setAllPredictions([])
    }
  }

  useEffect(() => {
    async function load() {
      const provider = getDataProvider()
      const user = await provider.getCurrentUser()
      if (!user) { router.push('/login'); return }
      if (!user.is_admin) { router.push('/predictions'); return }
      await reload()
      setLoading(false)
    }
    load()
  }, [router, matchId])

  async function handleSaveProvisional() {
    setBusy(true)
    setMessage(null)
    try {
      const h = parseInt(home, 10)
      const a = parseInt(away, 10)
      if (Number.isNaN(h) || Number.isNaN(a)) throw new Error('Vul beide scores in')
      await getDataProvider().adminSaveProvisionalScore(matchId, h, a)
      setMessage({ kind: 'success', text: 'Voorlopige uitslag opgeslagen.' })
      await reload()
    } catch (err: any) {
      setMessage({ kind: 'error', text: err.message || 'Fout bij opslaan' })
    }
    setBusy(false)
  }

  async function handleConfirm() {
    setBusy(true)
    setMessage(null)
    try {
      const res = await getDataProvider().adminConfirmAndScore(matchId)
      setMessage({ kind: 'success', text: `Bevestigd. ${res.updated} voorspellingen gescoord.` })
      await reload()
    } catch (err: any) {
      setMessage({ kind: 'error', text: err.message || 'Fout bij bevestigen' })
    }
    setBusy(false)
  }

  async function handleUnconfirm() {
    if (!confirm('Weet je zeker dat je deze uitslag wilt terugzetten naar voorlopig? Alle uitgedeelde punten worden teruggetrokken.')) return
    setBusy(true)
    setMessage(null)
    try {
      await getDataProvider().adminUnconfirm(matchId)
      setMessage({ kind: 'success', text: 'Terug naar voorlopig. Punten zijn ingetrokken.' })
      await reload()
    } catch (err: any) {
      setMessage({ kind: 'error', text: err.message || 'Fout' })
    }
    setBusy(false)
  }

  async function handleClear() {
    if (!confirm('Volledig wissen? De wedstrijd komt terug op "geen uitslag" en alle punten worden ingetrokken.')) return
    setBusy(true)
    setMessage(null)
    try {
      await getDataProvider().adminClearScore(matchId)
      setHome(''); setAway('')
      setMessage({ kind: 'success', text: 'Uitslag gewist.' })
      await reload()
    } catch (err: any) {
      setMessage({ kind: 'error', text: err.message || 'Fout' })
    }
    setBusy(false)
  }

  if (loading || !match) {
    return <><TopNav /><main className="max-w-3xl mx-auto p-4"><p className="text-ink-400 text-sm text-center mt-12">Laden…</p></main></>
  }

  const homeName = match.home_team?.fifa_code || match.placeholder_home || 'TBD'
  const awayName = match.away_team?.fifa_code || match.placeholder_away || 'TBD'

  const isConfirmed = resultState === 'confirmed'
  const isProvisional = resultState === 'provisional'

  return (
    <>
      <TopNav />
      <main className="max-w-3xl mx-auto p-4 pb-12">
        <Link href="/admin" className="text-xs text-ink-400 hover:text-ink-50 inline-flex items-center gap-1 mb-3">
          <BackIcon /> Terug naar overzicht
        </Link>

        {/* Match header */}
        <div className="tile p-5 mb-4">
          <div className="text-center text-[10px] text-ink-500 tracking-wider uppercase mb-2">
            Wedstrijd #{match.id}
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 mb-3">
            <div className="flex items-center gap-2 justify-self-start min-w-0">
              <FlagCircle isoCode={match.home_team?.iso_code || null} />
              <div className="min-w-0">
                <div className="text-ink-50 text-sm font-medium truncate">{match.home_team?.name || homeName}</div>
                <div className="text-ink-500 text-[10px] uppercase">{homeName}</div>
              </div>
            </div>
            <div className="text-center text-ink-400 text-xs">
              <div>{formatDateLocal(match.kickoff_ams)}</div>
              <div>{formatTimeLocal(match.kickoff_ams)}</div>
            </div>
            <div className="flex items-center gap-2 justify-self-end min-w-0">
              <div className="min-w-0 text-right">
                <div className="text-ink-50 text-sm font-medium truncate">{match.away_team?.name || awayName}</div>
                <div className="text-ink-500 text-[10px] uppercase">{awayName}</div>
              </div>
              <FlagCircle isoCode={match.away_team?.iso_code || null} />
            </div>
          </div>
          {match.city_name && (
            <div className="text-center text-[10px] text-ink-500 tracking-wider uppercase">
              {match.city_name} · {match.country}
            </div>
          )}
        </div>

        {/* State banner */}
        {isConfirmed && (
          <div className="bg-accent-mint/10 border border-accent-mint/30 rounded-tile p-3 mb-4 flex items-center gap-2">
            <span className="text-accent-mint">✓</span>
            <span className="text-accent-mint text-sm">Bevestigd. Punten zijn uitgekeerd.</span>
          </div>
        )}
        {isProvisional && (
          <div className="bg-accent-orange/10 border border-accent-orange/30 rounded-tile p-3 mb-4 flex items-center gap-2">
            <span className="text-accent-orange">⏳</span>
            <span className="text-accent-orange text-sm">Voorlopig opgeslagen. Klik 'Bevestigen' om de punten te berekenen.</span>
          </div>
        )}

        {/* Score input */}
        <div className="tile p-5 mb-4">
          <h2 className="text-ink-50 font-display text-base font-medium mb-3">Uitslag invoeren</h2>
          <div className="flex items-center justify-center gap-3 mb-4">
            <input
              type="number"
              min="0"
              max="99"
              inputMode="numeric"
              value={home}
              onChange={e => setHome(e.target.value)}
              disabled={isConfirmed || busy}
              aria-label={`Score ${homeName}`}
              className="w-16 h-12 text-center text-xl font-display font-medium tabular-nums disabled:opacity-50"
            />
            <span className="text-ink-400 text-base">–</span>
            <input
              type="number"
              min="0"
              max="99"
              inputMode="numeric"
              value={away}
              onChange={e => setAway(e.target.value)}
              disabled={isConfirmed || busy}
              aria-label={`Score ${awayName}`}
              className="w-16 h-12 text-center text-xl font-display font-medium tabular-nums disabled:opacity-50"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {!isConfirmed && (
              <button
                onClick={handleSaveProvisional}
                disabled={busy || !home || !away}
                className="flex-1 py-2.5 bg-ink-700 hover:bg-ink-600 text-ink-50 text-sm font-medium rounded-lg transition-colors disabled:opacity-40"
              >
                {isProvisional ? 'Bijwerken' : 'Voorlopig opslaan'}
              </button>
            )}
            {isProvisional && (
              <button
                onClick={handleConfirm}
                disabled={busy}
                className="flex-1 py-2.5 bg-accent-orange hover:brightness-110 text-ink-950 text-sm font-display font-medium rounded-lg transition-all disabled:opacity-40"
              >
                Bevestigen & punten berekenen
              </button>
            )}
            {isConfirmed && (
              <button
                onClick={handleUnconfirm}
                disabled={busy}
                className="flex-1 py-2.5 bg-ink-700 hover:bg-ink-600 text-ink-50 text-sm font-medium rounded-lg transition-colors disabled:opacity-40"
              >
                Bevestiging intrekken
              </button>
            )}
            {(isProvisional || isConfirmed) && (
              <button
                onClick={handleClear}
                disabled={busy}
                className="sm:w-auto py-2.5 px-4 text-accent-coral hover:bg-accent-coral/10 text-sm rounded-lg transition-colors disabled:opacity-40"
              >
                Wissen
              </button>
            )}
          </div>

          {message && (
            <p className={`mt-3 text-center text-xs ${message.kind === 'success' ? 'text-accent-mint' : 'text-accent-coral'}`}>
              {message.text}
            </p>
          )}
        </div>

        {/* Predictions */}
        <div className="tile p-5">
          <h2 className="text-ink-50 font-display text-base font-medium mb-3">
            Voorspellingen ({allPredictions.length})
          </h2>
          {allPredictions.length === 0 ? (
            <p className="text-ink-400 text-sm">Niemand heeft deze wedstrijd voorspeld.</p>
          ) : (
            <div className="space-y-1.5">
              {allPredictions.map(p => {
                const isExact = isConfirmed && p.home_score === match.home_score && p.away_score === match.away_score
                const isCorrectOutcome = isConfirmed && match.home_score !== null && match.away_score !== null &&
                  Math.sign(p.home_score - p.away_score) === Math.sign(match.home_score - match.away_score)

                return (
                  <div key={p.user_id} className="flex items-center gap-3 px-3 py-2 bg-ink-800 rounded-lg">
                    <span className="flex-1 text-ink-200 text-sm">{p.display_name}</span>
                    <span className="font-mono text-ink-50 text-sm tabular-nums">
                      {p.home_score}–{p.away_score}
                    </span>
                    {isExact && <span className="px-1.5 py-0.5 rounded bg-accent-mint/20 text-accent-mint text-[10px] font-medium">EXACT</span>}
                    {!isExact && isCorrectOutcome && <span className="px-1.5 py-0.5 rounded bg-accent-amber/20 text-accent-amber text-[10px] font-medium">UITSLAG</span>}
                    {p.points_awarded !== null && (
                      <span className="font-display font-medium text-accent-orange text-sm w-10 text-right">+{p.points_awarded}</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </>
  )
}

function BackIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}
