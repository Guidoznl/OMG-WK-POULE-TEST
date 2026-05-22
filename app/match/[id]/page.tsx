'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { Match, Prediction, PublicMatchPrediction } from '@/lib/types'
import { getDataProvider } from '@/lib/data-provider'
import { computeMatchOdds } from '@/lib/probability'
import { formatDateLocal, formatTimeLocal } from '@/lib/date-utils'
import { TopNav } from '@/components/TopNav'
import { FlagCircle } from '@/components/FlagCircle'

export default function MatchDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const matchId = parseInt(params.id, 10)

  const [match, setMatch] = useState<Match | null>(null)
  const [myPrediction, setMyPrediction] = useState<Prediction | null>(null)
  const [allPredictions, setAllPredictions] = useState<PublicMatchPrediction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const provider = getDataProvider()
      const user = await provider.getCurrentUser()
      if (!user) { router.push('/login'); return }

      try {
        const [matches, myPreds, allPreds] = await Promise.all([
          provider.getMatches(),
          provider.getMyPredictions(),
          provider.getMatchPredictionsPublic(matchId),
        ])
        const m = matches.find(mm => mm.id === matchId)
        if (!m) {
          setError('Wedstrijd niet gevonden')
        } else {
          setMatch(m)
          setMyPrediction(myPreds.find(p => p.match_id === matchId) || null)
          setAllPredictions(allPreds)
        }
      } catch (err: any) {
        setError(err.message || 'Fout bij laden')
      }
      setLoading(false)
    }
    load()
  }, [router, matchId])

  if (loading) {
    return <><TopNav /><main className="max-w-3xl mx-auto p-4"><p className="text-ink-400 text-sm text-center mt-12">Laden…</p></main></>
  }
  if (error || !match) {
    return (
      <>
        <TopNav />
        <main className="max-w-3xl mx-auto p-4">
          <p className="text-accent-coral text-sm text-center mt-12">{error || 'Wedstrijd niet gevonden'}</p>
          <div className="text-center mt-4">
            <Link href="/predictions" className="text-ink-400 hover:text-ink-50 text-xs underline">Terug naar voorspellingen</Link>
          </div>
        </main>
      </>
    )
  }

  const homeName = match.home_team?.fifa_code || match.placeholder_home || 'TBD'
  const awayName = match.away_team?.fifa_code || match.placeholder_away || 'TBD'
  const hasResult = match.home_score !== null && match.away_score !== null

  // Probability uit de bookmaker-data
  const odds = match.home_team && match.away_team
    ? computeMatchOdds(match.home_team.fifa_code, match.away_team.fifa_code)
    : null

  // OMG aggregate: alleen tellen waar daadwerkelijk een voorspelling is
  const aggregate = (() => {
    let h = 0, d = 0, a = 0
    for (const p of allPredictions) {
      if (!p.has_predicted) continue
      const homeS = p.home_score as number
      const awayS = p.away_score as number
      if (homeS > awayS) h++
      else if (homeS < awayS) a++
      else d++
    }
    const total = h + d + a
    if (total === 0) return null
    return {
      homeWin: Math.round((h / total) * 1000) / 10,
      draw: Math.round((d / total) * 1000) / 10,
      awayWin: Math.round((a / total) * 1000) / 10,
      total,
    }
  })()

  // Sortering — verschilt of de uitslag bekend is of niet.
  //
  // Vóór uitslag (geen confirmed result):
  //   - Eerst de voorspellingen op chronologische volgorde van indiening
  //   - Daarna spelers zonder voorspelling, alfabetisch
  //
  // Ná uitslag:
  //   - Eerst op behaalde punten (aflopend)
  //   - Bij gelijke punten: alfabetisch
  //   - Spelers zonder voorspelling onderaan, alfabetisch
  const hasResultConfirmed = match.home_score !== null && match.away_score !== null
  const sortedPredictions = (() => {
    const withPrediction = allPredictions.filter(p => p.has_predicted)
    const withoutPrediction = allPredictions
      .filter(p => !p.has_predicted)
      .sort((a, b) => a.display_name.localeCompare(b.display_name))

    if (hasResultConfirmed) {
      withPrediction.sort((a, b) => {
        const aPts = a.points_awarded ?? 0
        const bPts = b.points_awarded ?? 0
        if (bPts !== aPts) return bPts - aPts
        return a.display_name.localeCompare(b.display_name)
      })
    } else {
      withPrediction.sort((a, b) => {
        // submitted_at is een ISO string, lexicografisch sorteren werkt
        const aTime = a.submitted_at || ''
        const bTime = b.submitted_at || ''
        return aTime.localeCompare(bTime)
      })
    }

    return [...withPrediction, ...withoutPrediction]
  })()

  // Eigen voorspelling apart highlighten — vinden via is_self
  const meInList = sortedPredictions.find(p => p.is_self)

  return (
    <>
      <TopNav />
      <main className="max-w-3xl mx-auto p-4 pb-12">
        <Link href="/predictions" className="text-xs text-ink-400 hover:text-ink-50 inline-flex items-center gap-1 mb-3">
          <BackIcon /> Terug naar voorspellingen
        </Link>

        {/* SCORE HEADER met probability percentages */}
        <div className="tile p-5 mb-4">
          {/* Status label boven */}
          <div className="text-center text-[10px] text-ink-500 tracking-wider uppercase mb-3">
            {hasResult ? 'EINDSTAND'
              : match.status === 'in_progress' ? 'BEZIG'
              : match.status === 'locked' ? 'BINNENKORT'
              : formatDateLocal(match.kickoff_ams) + ' · ' + formatTimeLocal(match.kickoff_ams)}
          </div>

          {/* Teams row */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 mb-2">
            {/* Home */}
            <div className="flex items-center gap-2 justify-self-start min-w-0">
              <FlagCircle isoCode={match.home_team?.iso_code || null} />
              <span className="text-ink-50 text-sm font-medium truncate">{homeName}</span>
            </div>

            {/* Center: score or vs */}
            <div className="text-center">
              {hasResult ? (
                <div className="font-display font-medium text-2xl text-ink-50 tabular-nums">
                  {match.home_score} – {match.away_score}
                </div>
              ) : (
                <div className="text-ink-500 text-sm">vs</div>
              )}
            </div>

            {/* Away */}
            <div className="flex items-center gap-2 justify-self-end min-w-0">
              <span className="text-ink-50 text-sm font-medium truncate">{awayName}</span>
              <FlagCircle isoCode={match.away_team?.iso_code || null} />
            </div>
          </div>

          {/* Probability percentages (uit bookmaker-data) */}
          {odds && (
            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-ink-600">
              <ProbabilityCell label={homeName + ' wint'} value={odds.homeWin} />
              <ProbabilityCell label="Gelijkspel" value={odds.draw} />
              <ProbabilityCell label={awayName + ' wint'} value={odds.awayWin} />
            </div>
          )}

          {/* Jouw voorspelling badge (compact) */}
          {myPrediction && (
            <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-ink-600 text-xs">
              <span className="text-ink-400">Jouw voorspelling:</span>
              <span className="font-mono text-ink-200">{myPrediction.home_score}–{myPrediction.away_score}</span>
              {myPrediction.points_awarded !== null && myPrediction.points_awarded > 0 && (
                <span className="font-display font-medium text-accent-orange ml-1">+{myPrediction.points_awarded}</span>
              )}
            </div>
          )}

          {/* Venue */}
          {match.city_name && (
            <div className="text-center text-[10px] text-ink-500 tracking-wider uppercase mt-3">
              {match.city_name} · {match.country}
            </div>
          )}
        </div>

        {/* OMG SPELERS sectie */}
        <div className="mb-2">
          <h2 className="font-display text-base font-medium text-ink-50 px-1 mb-2">
            OMG spelers denken
          </h2>

          {/* Aggregate percentages */}
          {aggregate && aggregate.total > 0 ? (
            <div className="tile p-4 mb-3">
              <div className="grid grid-cols-3 gap-2">
                <ProbabilityCell label={homeName + ' wint'} value={aggregate.homeWin} accent />
                <ProbabilityCell label="Gelijkspel" value={aggregate.draw} accent />
                <ProbabilityCell label={awayName + ' wint'} value={aggregate.awayWin} accent />
              </div>
              <div className="text-center text-[10px] text-ink-500 tracking-wider uppercase mt-3">
                Op basis van {aggregate.total} voorspelling{aggregate.total === 1 ? '' : 'en'}
              </div>
            </div>
          ) : (
            <div className="tile p-4 mb-3">
              <p className="text-ink-400 text-xs text-center">Nog geen voorspellingen ingediend.</p>
            </div>
          )}

          {/* Individuele voorspellingen — gesorteerde volgorde */}
          {sortedPredictions.length > 0 && (
            <div className="space-y-1">
              {sortedPredictions.map(p => (
                <PredictionRow
                  key={p.user_id}
                  prediction={p}
                  match={match}
                  highlight={p.is_self}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}

// ─── Helper components ──────────────────────────────────────────────────

function ProbabilityCell({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="text-center">
      <div className={`font-display font-medium text-lg tabular-nums ${accent ? 'text-accent-orange' : 'text-ink-50'}`}>
        {value.toFixed(1)}%
      </div>
      <div className="text-[10px] tracking-wider uppercase text-ink-500 mt-0.5">
        {label}
      </div>
    </div>
  )
}

function PredictionRow({ prediction, match, highlight }: {
  prediction: PublicMatchPrediction
  match: Match
  highlight?: boolean
}) {
  const hasResult = match.home_score !== null && match.away_score !== null
  const isExact = hasResult && prediction.has_predicted &&
    prediction.home_score === match.home_score &&
    prediction.away_score === match.away_score

  // Niet-voorspeld: subtielere weergave (wel klikbaar naar profiel)
  if (!prediction.has_predicted) {
    return (
      <Link
        href={`/speler/${prediction.user_id}`}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
          highlight ? 'bg-ink-700 ring-1 ring-accent-orange/40 hover:bg-ink-600' : 'bg-ink-800 opacity-60 hover:opacity-100 hover:bg-ink-700'
        }`}
      >
        <span className="flex-1 text-ink-200 text-sm truncate">
          {prediction.display_name}
          {highlight && <span className="ml-1.5 text-[10px] text-accent-orange">(jij)</span>}
        </span>
        <span className="text-ink-500 text-xs italic">Nog niet voorspeld</span>
        <ChevronRightMini />
      </Link>
    )
  }

  return (
    <Link
      href={`/speler/${prediction.user_id}`}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
        highlight ? 'bg-ink-700 ring-1 ring-accent-orange/40 hover:bg-ink-600' : 'bg-ink-800 hover:bg-ink-700'
      }`}
    >
      <span className="flex-1 text-ink-200 text-sm truncate">
        {prediction.display_name}
        {highlight && <span className="ml-1.5 text-[10px] text-accent-orange">(jij)</span>}
      </span>
      <span className="font-mono text-ink-50 text-sm tabular-nums">
        {prediction.home_score}–{prediction.away_score}
      </span>
      {isExact && <span className="px-1.5 py-0.5 rounded bg-accent-mint/20 text-accent-mint text-[10px] font-medium">EXACT</span>}
      {prediction.points_awarded !== null && prediction.points_awarded > 0 && (
        <span className="font-display font-medium text-accent-orange text-sm w-10 text-right">+{prediction.points_awarded}</span>
      )}
      <ChevronRightMini />
    </Link>
  )
}

function ChevronRightMini() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-500 flex-shrink-0">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function BackIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}
