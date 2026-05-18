'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { Match, Prediction } from '@/lib/types'
import { formatDateLocal, formatTimeLocal } from '@/lib/date-utils'
import { FlagCircle } from './FlagCircle'

type Props = {
  match: Match
  prediction: Prediction | null
  onSave: (matchId: number, home: number, away: number) => Promise<void>
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export function MatchTile({ match, prediction, onSave }: Props) {
  const [home, setHome] = useState<string>(prediction?.home_score?.toString() ?? '')
  const [away, setAway] = useState<string>(prediction?.away_score?.toString() ?? '')
  const [save, setSave] = useState<SaveState>('idle')
  const [savedRecently, setSavedRecently] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const homeName = match.home_team?.fifa_code || match.placeholder_home || 'TBD'
  const awayName = match.away_team?.fifa_code || match.placeholder_away || 'TBD'
  const hasResult = match.home_score !== null && match.away_score !== null

  // Auto-save when both filled & changed
  useEffect(() => {
    if (match.status !== 'open') return
    const h = parseInt(home, 10), a = parseInt(away, 10)
    if (Number.isNaN(h) || Number.isNaN(a)) return
    if (h === prediction?.home_score && a === prediction?.away_score) return

    const timer = setTimeout(async () => {
      setSave('saving')
      try {
        await onSave(match.id, h, a)
        setSave('saved')
        setSavedRecently(true)
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        timeoutRef.current = setTimeout(() => {
          setSave('idle')
          setSavedRecently(false)
        }, 4000) // longer than before for clearer feedback
      } catch (err) {
        console.error(err)
        setSave('error')
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [home, away])

  // ═══ FINISHED — has score ═══════════════════════════════════════════════
  if (hasResult) {
    const correctOutcome = prediction && (
      Math.sign(prediction.home_score - prediction.away_score) ===
      Math.sign(match.home_score! - match.away_score!)
    )
    const exactMatch = prediction &&
      prediction.home_score === match.home_score &&
      prediction.away_score === match.away_score

    return (
      <div className="tile p-4 fade-in">
        <TileHeader homeName={homeName} awayName={awayName} match={match} statusLabel="EINDSTAND" />
        <div className="flex items-center justify-center gap-3 mt-3">
          <div className="flex items-center gap-2 text-ink-50 font-display font-medium text-xl tabular-nums">
            <span>{match.home_score}</span>
            <span className="text-ink-400 text-sm">–</span>
            <span>{match.away_score}</span>
          </div>
        </div>
        {prediction && (
          <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-ink-600 text-xs">
            <span className="text-ink-400">Jouw voorspelling:</span>
            <span className="font-mono text-ink-200">{prediction.home_score}–{prediction.away_score}</span>
            {exactMatch && <span className="px-1.5 py-0.5 rounded bg-accent-mint/20 text-accent-mint font-medium">EXACT</span>}
            {!exactMatch && correctOutcome && <span className="px-1.5 py-0.5 rounded bg-accent-amber/20 text-accent-amber font-medium">UITSLAG</span>}
            {prediction.points_awarded !== null && (
              <span className="ml-auto font-display font-medium text-accent-orange">+{prediction.points_awarded}</span>
            )}
          </div>
        )}
        <DetailLink match={match} />
        <LocationLabel match={match} />
      </div>
    )
  }

  // ═══ IN PROGRESS — match started ════════════════════════════════════════
  if (match.status === 'in_progress') {
    return (
      <div className="tile tile-locked p-4 fade-in">
        <TileHeader homeName={homeName} awayName={awayName} match={match} statusLabel="GESTART" />
        {prediction ? (
          <>
            <div className="flex items-center justify-center gap-3 mt-3">
              <div className="flex items-center gap-2 text-ink-50 font-display text-lg tabular-nums">
                <span>{prediction.home_score}</span>
                <span className="text-ink-400 text-sm">–</span>
                <span>{prediction.away_score}</span>
              </div>
            </div>
            <p className="text-center text-[10px] text-ink-500 mt-2 tracking-wide">WACHT OP EINDSTAND</p>
          </>
        ) : (
          <p className="text-center text-ink-400 text-xs mt-3">Geen voorspelling ingediend</p>
        )}
        <DetailLink match={match} />
        <LocationLabel match={match} />
      </div>
    )
  }

  // ═══ LOCKED — 2h window before kickoff ══════════════════════════════════
  if (match.status === 'locked') {
    return (
      <div className="tile tile-locked p-4 fade-in border border-ink-600">
        <TileHeader homeName={homeName} awayName={awayName} match={match} statusLabel="VERGRENDELD" />
        {prediction ? (
          <div className="flex items-center justify-center gap-3 mt-3">
            <div className="flex items-center gap-2 text-ink-50 font-display text-lg tabular-nums">
              <span>{prediction.home_score}</span>
              <span className="text-ink-400 text-sm">–</span>
              <span>{prediction.away_score}</span>
            </div>
          </div>
        ) : (
          <p className="text-center text-ink-400 text-xs mt-3">Te laat — geen voorspelling mogelijk</p>
        )}
        <DetailLink match={match} />
        <LocationLabel match={match} />
      </div>
    )
  }

  // ═══ OPEN — editable ════════════════════════════════════════════════════
  // savedRecently => show green border for 4s
  const tileClasses = `tile p-4 fade-in transition-all duration-300 ${
    savedRecently ? 'ring-2 ring-accent-mint ring-offset-2 ring-offset-ink-950' : ''
  }`

  return (
    <div className={tileClasses}>
      <TileHeader homeName={homeName} awayName={awayName} match={match} />
      <div className="flex items-center justify-center gap-2 mt-3">
        <input
          type="number"
          min="0" max="20"
          inputMode="numeric"
          value={home}
          onChange={e => setHome(e.target.value)}
          placeholder="–"
          aria-label={`Score ${homeName}`}
          className="w-12 h-10 text-center text-base font-display font-medium tabular-nums"
        />
        <span className="text-ink-400 text-sm">–</span>
        <input
          type="number"
          min="0" max="20"
          inputMode="numeric"
          value={away}
          onChange={e => setAway(e.target.value)}
          placeholder="–"
          aria-label={`Score ${awayName}`}
          className="w-12 h-10 text-center text-base font-display font-medium tabular-nums"
        />
      </div>
      {/* Persistent saved label below inputs */}
      <div className="h-4 mt-2 text-center">
        {save === 'saving' && <span className="text-ink-400 text-[11px]">Opslaan…</span>}
        {save === 'saved' && (
          <span className="text-accent-mint text-[11px] font-medium inline-flex items-center gap-1">
            <CheckMini /> Opgeslagen
          </span>
        )}
        {save === 'error' && <span className="text-accent-coral text-[11px]">Fout — probeer opnieuw</span>}
      </div>
      <DetailLink match={match} />
      <LocationLabel match={match} />
    </div>
  )
}

// ─── Subcomponents ──────────────────────────────────────────────────────

function TileHeader({ homeName, awayName, match, statusLabel }: {
  homeName: string
  awayName: string
  match: Match
  statusLabel?: string
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
      <div className="flex items-center gap-2 justify-self-start min-w-0">
        <FlagCircle isoCode={match.home_team?.iso_code || null} />
        <span className="text-ink-50 text-sm font-medium truncate">{homeName}</span>
      </div>
      <div className="text-center text-ink-400 text-[11px] leading-tight">
        {statusLabel ? (
          <div className="flex items-center justify-center gap-1 text-ink-500">
            {statusLabel === 'VERGRENDELD' && <LockIcon />}
            <span className="text-[10px] tracking-wider">{statusLabel}</span>
          </div>
        ) : (
          <>
            <div>{formatDateLocal(match.kickoff_ams)}</div>
            <div>{formatTimeLocal(match.kickoff_ams)} uur</div>
          </>
        )}
      </div>
      <div className="flex items-center gap-2 justify-self-end min-w-0">
        <span className="text-ink-50 text-sm font-medium truncate">{awayName}</span>
        <FlagCircle isoCode={match.away_team?.iso_code || null} />
      </div>
    </div>
  )
}

/**
 * "Bekijk details" knop, geplaatst onderaan een wedstrijdtile.
 * Linkt naar de detailpagina van de wedstrijd (alle voorspellingen, probability).
 */
function DetailLink({ match }: { match: Match }) {
  return (
    <Link
      href={`/match/${match.id}`}
      className="flex items-center justify-center gap-1.5 mt-3 pt-2.5 border-t border-ink-600 text-ink-400 hover:text-accent-orange transition-colors text-xs"
    >
      <InfoIcon />
      <span>Bekijk details &amp; voorspellingen</span>
    </Link>
  )
}

function InfoIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}

function LocationLabel({ match }: { match: Match }) {
  if (!match.city_name) return null
  return (
    <div className="text-center text-[10px] text-ink-500 mt-2 tracking-wider uppercase">
      {match.city_name} · {match.country}
    </div>
  )
}

function LockIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function CheckMini() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
