'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Match, Prediction, Stage, MatchdaySummary, CURRENT_TERMS_VERSION } from '@/lib/types'
import { getDataProvider } from '@/lib/data-provider'
import { TopNav } from '@/components/TopNav'
import { MatchTile } from '@/components/MatchTile'
import { GroupStandings } from '@/components/GroupStandings'
import { dutchStageName } from '@/lib/labels'

export default function PredictionsPage() {
  const router = useRouter()
  const [stages, setStages] = useState<Stage[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [summaries, setSummaries] = useState<MatchdaySummary[]>([])
  const [activeStageId, setActiveStageId] = useState<number>(3)
  const [activeGroup, setActiveGroup] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const provider = getDataProvider()
      const user = await provider.getCurrentUser()
      if (!user) { router.push('/login'); return }
      if (!user.accepted_terms_at || user.accepted_terms_version !== CURRENT_TERMS_VERSION) {
        router.push('/terms-accept')
        return
      }

      const [s, m, p, sum] = await Promise.all([
        provider.getStages(),
        provider.getMatches(),
        provider.getMyPredictions(),
        provider.getMatchdaySummaries(),
      ])
      setStages(s)
      setMatches(m)
      setPredictions(p)
      setSummaries(sum)
      setLoading(false)
    }
    load()

    const interval = setInterval(load, 60_000)
    return () => clearInterval(interval)
  }, [router])

  useEffect(() => {
    if (activeStageId === 1 && !activeGroup) {
      const groups = uniqueGroups(matches)
      if (groups.length > 0) setActiveGroup(groups[0])
    }
    if (activeStageId !== 1) setActiveGroup(null)
  }, [activeStageId, matches])

  const matchdayGroups = useMemo(() => {
    let visible = matches.filter(m => m.stage_id === activeStageId)
    if (activeStageId === 1 && activeGroup) {
      visible = visible.filter(m => m.group_label === activeGroup)
    }
    visible.sort((a, b) => new Date(a.kickoff_ams).getTime() - new Date(b.kickoff_ams).getTime())
    const map: Record<number, Match[]> = {}
    for (const m of visible) {
      if (!map[m.matchday]) map[m.matchday] = []
      map[m.matchday].push(m)
    }
    return Object.entries(map)
      .map(([md, list]) => ({ matchday: parseInt(md, 10), matches: list }))
      .sort((a, b) => a.matchday - b.matchday)
  }, [matches, activeStageId, activeGroup])

  async function handleSave(matchId: number, home: number, away: number) {
    await getDataProvider().savePrediction(matchId, home, away)
    setPredictions(prev => {
      const others = prev.filter(p => p.match_id !== matchId)
      return [...others, {
        match_id: matchId, home_score: home, away_score: away,
        submitted_at: new Date().toISOString(), points_awarded: null,
      }]
    })
  }

  async function handleReset(matchId: number) {
    await getDataProvider().clearPrediction(matchId)
    setPredictions(prev => prev.filter(p => p.match_id !== matchId))
  }

  if (loading) {
    return (
      <>
        <TopNav />
        <main className="max-w-3xl mx-auto p-4">
          <p className="text-ink-400 text-sm text-center mt-12">Laden…</p>
        </main>
      </>
    )
  }

  const groups = uniqueGroups(matches)
  const activeStageName = stages.find(s => s.id === activeStageId)?.name || ''

  return (
    <>
      <TopNav />
      <main className="max-w-3xl mx-auto p-4 pb-12">
        {/* Phase tabs */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
          {stages.map(stage => {
            const isActive = stage.id === activeStageId
            const allPredicted = isStageFullyPredicted(stage.id, matches, predictions)
            return (
              <button
                key={stage.id}
                onClick={() => setActiveStageId(stage.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive ? 'bg-ink-600 text-ink-50' : 'text-ink-400 hover:text-ink-50'
                }`}
              >
                {dutchStageName(stage.name)}
                {allPredicted && <CheckIcon className="inline w-3 h-3 ml-1 text-accent-mint" />}
              </button>
            )
          })}
        </div>

        {/* Group tabs (Group Stage only) */}
        {activeStageId === 1 && (
          <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1">
            {groups.map(g => {
              const letter = g.replace('Group ', '')
              const isActive = g === activeGroup
              const groupMatches = matches.filter(m => m.group_label === g)
              const complete = groupMatches.every(m => predictions.find(p => p.match_id === m.id))
              return (
                <button
                  key={g}
                  onClick={() => setActiveGroup(g)}
                  className={`tab-btn flex items-center gap-1.5 ${isActive ? 'tab-btn-active' : ''} ${complete && !isActive ? 'tab-btn-done' : ''}`}
                >
                  <span>{letter}</span>
                  {complete && <CheckIcon className="w-3 h-3 text-accent-mint" />}
                </button>
              )
            })}
          </div>
        )}

        {/* Group/stage header */}
        {activeStageId === 1 && activeGroup ? (
          <>
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-display text-lg font-medium text-ink-50">
                Voorspel {activeGroup.replace('Group', 'Groep')}
              </h2>
              <span className="text-ink-400 text-xs">
                {matchdayGroups.flatMap(mg => mg.matches).filter(m => predictions.find(p => p.match_id === m.id)).length} van {matchdayGroups.flatMap(mg => mg.matches).length} ingevuld
              </span>
            </div>
            <GroupStandings groupLabel={activeGroup} matches={matches} predictions={predictions} />
          </>
        ) : (
          <h2 className="font-display text-lg font-medium text-ink-50 mb-4">
            Voorspel {dutchStageName(activeStageName)}
          </h2>
        )}

        {/* Matches grouped by matchday */}
        <div className="space-y-6">
          {matchdayGroups.length === 0 ? (
            <p className="text-ink-400 text-sm text-center py-12">
              Geen wedstrijden gevonden voor deze fase.
            </p>
          ) : (
            matchdayGroups.map(mg => {
              // De deadline van een speelronde = lock_at van de eerste open
              // wedstrijd. Door de nieuwe view is dat voor groepsfase
              // automatisch dezelfde globale deadline voor alle wedstrijden.
              const nextLockAt = mg.matches
                .filter(m => m.status === 'open')
                .sort((a, b) => new Date(a.lock_at).getTime() - new Date(b.lock_at).getTime())[0]
                ?.lock_at

              return (
                <section key={mg.matchday}>
                  <MatchdayHeader
                    stageId={activeStageId}
                    matchday={mg.matchday}
                    nextLockAt={nextLockAt}
                    allLocked={!nextLockAt}
                  />
                  <div className="space-y-2.5">
                    {mg.matches.map(match => (
                      <MatchTile
                        key={match.id}
                        match={match}
                        prediction={predictions.find(p => p.match_id === match.id) || null}
                        onSave={handleSave}
                        onReset={handleReset}
                      />
                    ))}
                  </div>
                </section>
              )
            })
          )}
        </div>

        {/* Quick rules footer */}
        <div className="mt-10 text-center text-[11px] text-ink-500">
          <a href="/rules" className="text-ink-400 hover:text-ink-50 underline underline-offset-2">
            Bekijk volledige spelregels
          </a>
          <p className="mt-2">Voorspellingen sluiten bij de aftrap van de eerste wedstrijd van een speelronde.</p>
        </div>
      </main>
    </>
  )
}

// ─── Subcomponents ─────────────────────────────────────────────────────

function MatchdayHeader({ stageId, matchday, nextLockAt, allLocked }: {
  stageId: number; matchday: number; nextLockAt?: string; allLocked: boolean
}) {
  const label = stageId === 1 ? `Speelronde ${matchday}` : ''
  if (!label) return null

  return (
    <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-ink-600">
      <h3 className="text-ink-200 text-sm font-display font-medium">{label}</h3>
      {nextLockAt ? (
        <div className="text-right">
          <div className="text-[10px] text-ink-500 tracking-wider uppercase">Deadline</div>
          <div className="text-xs text-accent-amber tabular-nums">
            {formatDeadlineAms(nextLockAt)}
          </div>
        </div>
      ) : (
        <span className="text-[10px] text-ink-500 tracking-wider uppercase">Vergrendeld</span>
      )}
    </div>
  )
}

// Formatteer als "Datum: 11-06  Tijd: 21:00 (AMS)"
function formatDeadlineAms(iso: string): string {
  const d = new Date(iso)
  const fmt = new Intl.DateTimeFormat('nl-NL', {
    timeZone: 'Europe/Amsterdam',
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
  const parts = fmt.formatToParts(d)
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? ''
  const date = `${get('day')}-${get('month')}`
  const time = `${get('hour')}:${get('minute')}`
  return `Datum: ${date}  Tijd: ${time} (AMS)`
}

function uniqueGroups(matches: Match[]): string[] {
  return Array.from(new Set(matches.map(m => m.group_label).filter(Boolean) as string[])).sort()
}

function isStageFullyPredicted(stageId: number, matches: Match[], preds: Prediction[]): boolean {
  const stageMatches = matches.filter(m => m.stage_id === stageId)
  if (stageMatches.length === 0) return false
  return stageMatches.every(m => preds.find(p => p.match_id === m.id))
}

function CheckIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
