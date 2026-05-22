'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { PlayerPrediction, PlayerProfile, Stage } from '@/lib/types'
import { getDataProvider } from '@/lib/data-provider'
import { dutchStageName } from '@/lib/labels'
import { formatDateLocal } from '@/lib/date-utils'
import { TopNav } from '@/components/TopNav'
import { FlagCircle } from '@/components/FlagCircle'

export default function PlayerProfilePage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const userId = params.id

  const [profile, setProfile] = useState<PlayerProfile | null>(null)
  const [predictions, setPredictions] = useState<PlayerPrediction[]>([])
  const [stages, setStages] = useState<Stage[]>([])
  const [myId, setMyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const provider = getDataProvider()
      const user = await provider.getCurrentUser()
      if (!user) { router.push('/login'); return }
      setMyId(user.id)

      try {
        const [prof, preds, stageList] = await Promise.all([
          provider.getPlayerProfile(userId),
          provider.getPlayerPredictions(userId),
          provider.getStages(),
        ])
        if (!prof) {
          setError('Speler niet gevonden')
        } else {
          setProfile(prof)
          setPredictions(preds)
          setStages(stageList)
        }
      } catch (err: any) {
        setError(err.message || 'Fout bij laden')
      }
      setLoading(false)
    }
    load()
  }, [router, userId])

  const stageName = useMemo(() => {
    const map = new Map<number, string>()
    stages.forEach(s => map.set(s.id, dutchStageName(s.name)))
    return map
  }, [stages])

  // Groepeer voorspellingen per fase
  const grouped = useMemo(() => {
    const groups = new Map<number, PlayerPrediction[]>()
    for (const p of predictions) {
      if (!groups.has(p.stage_id)) groups.set(p.stage_id, [])
      groups.get(p.stage_id)!.push(p)
    }
    return Array.from(groups.entries())
      .sort(([a], [b]) => a - b)
      .map(([stageId, preds]) => ({ stageId, preds }))
  }, [predictions])

  if (loading) {
    return <><TopNav /><main className="max-w-3xl mx-auto p-4"><p className="text-ink-400 text-sm text-center mt-12">Laden…</p></main></>
  }
  if (error || !profile) {
    return (
      <>
        <TopNav />
        <main className="max-w-3xl mx-auto p-4">
          <p className="text-accent-coral text-sm text-center mt-12">{error || 'Speler niet gevonden'}</p>
          <div className="text-center mt-4">
            <Link href="/leaderboard" className="text-ink-400 hover:text-ink-50 text-xs underline">Terug naar ranglijst</Link>
          </div>
        </main>
      </>
    )
  }

  const isMe = myId === profile.user_id
  const totalPredicted = predictions.length
  const exactCount = predictions.filter(p =>
    p.result_locked && p.actual_home !== null &&
    p.pred_home === p.actual_home && p.pred_away === p.actual_away
  ).length

  return (
    <>
      <TopNav />
      <main className="max-w-3xl mx-auto p-4 pb-12">
        <Link href="/leaderboard" className="text-xs text-ink-400 hover:text-ink-50 inline-flex items-center gap-1 mb-3">
          <BackIcon /> Terug naar ranglijst
        </Link>

        {/* Profielheader */}
        <div className="tile p-5 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-accent-orange/20 flex items-center justify-center flex-shrink-0">
              <span className="font-display font-bold text-accent-orange text-xl">
                {profile.display_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-xl font-medium text-ink-50 truncate">
                {profile.display_name}
                {isMe && <span className="ml-2 text-[10px] tracking-wider uppercase text-accent-orange/80">jij</span>}
              </h1>
              <p className="text-ink-400 text-xs">
                {profile.rank > 0 ? `Plek ${profile.rank} op de ranglijst` : 'Nog niet gerangschikt'}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-ink-600">
            <StatBlock value={profile.total_points} label="Punten" accent />
            <StatBlock value={exactCount} label="Exact" />
            <StatBlock value={totalPredicted} label="Voorspeld" />
          </div>
        </div>

        {/* Voorspellingen per fase */}
        {grouped.length === 0 ? (
          <p className="text-ink-400 text-sm text-center py-12">
            {isMe ? 'Je hebt nog geen voorspellingen ingediend.' : 'Deze speler heeft nog geen voorspellingen ingediend.'}
          </p>
        ) : (
          <div className="space-y-5">
            {grouped.map(({ stageId, preds }) => (
              <div key={stageId}>
                <h2 className="font-display text-sm font-medium text-ink-200 mb-2 px-1">
                  {stageName.get(stageId) || `Fase ${stageId}`}
                </h2>
                <div className="space-y-1">
                  {preds.map(p => (
                    <PlayerPredictionRow key={p.match_id} pred={p} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
}

function StatBlock({ value, label, accent }: { value: number; label: string; accent?: boolean }) {
  return (
    <div className="text-center">
      <div className={`font-display font-medium text-xl tabular-nums ${accent ? 'text-accent-orange' : 'text-ink-50'}`}>
        {value}
      </div>
      <div className="text-[10px] tracking-wider uppercase text-ink-500 mt-0.5">{label}</div>
    </div>
  )
}

function PlayerPredictionRow({ pred }: { pred: PlayerPrediction }) {
  const hasResult = pred.result_locked && pred.actual_home !== null && pred.actual_away !== null
  const isExact = hasResult &&
    pred.pred_home === pred.actual_home && pred.pred_away === pred.actual_away

  return (
    <Link
      href={`/match/${pred.match_id}`}
      className="flex items-center gap-3 px-3 py-2 bg-ink-800 hover:bg-ink-700 rounded-lg transition-colors"
    >
      {/* Teams */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <FlagCircle isoCode={pred.home_iso} size="sm" />
        <span className="text-ink-50 text-xs font-medium">{pred.home_fifa || 'TBD'}</span>
        <span className="text-ink-500 text-[10px] mx-0.5">–</span>
        <span className="text-ink-50 text-xs font-medium">{pred.away_fifa || 'TBD'}</span>
        <FlagCircle isoCode={pred.away_iso} size="sm" />
      </div>

      {/* Voorspelling */}
      <div className="text-center">
        <span className="font-mono text-ink-200 text-sm tabular-nums">
          {pred.pred_home}–{pred.pred_away}
        </span>
      </div>

      {/* Werkelijke uitslag (indien bekend) */}
      {hasResult && (
        <div className="text-center min-w-[40px]">
          <span className="text-ink-500 text-[10px] tabular-nums">
            ({pred.actual_home}–{pred.actual_away})
          </span>
        </div>
      )}

      {/* Badge + punten */}
      {isExact && <span className="px-1.5 py-0.5 rounded bg-accent-mint/20 text-accent-mint text-[10px] font-medium">EXACT</span>}
      {pred.points_awarded !== null && pred.points_awarded > 0 && (
        <span className="font-display font-medium text-accent-orange text-sm w-9 text-right">+{pred.points_awarded}</span>
      )}
      {pred.points_awarded === 0 && hasResult && (
        <span className="text-ink-600 text-xs w-9 text-right">0</span>
      )}
    </Link>
  )
}

function BackIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}
