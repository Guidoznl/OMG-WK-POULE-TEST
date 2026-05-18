'use client'

import { useEffect, useState, useMemo } from 'react'
import { GroupStanding, Match, Prediction } from '@/lib/types'
import { getDataProvider } from '@/lib/data-provider'

type Props = {
  groupLabel: string
  matches: Match[]        // alle wedstrijden (om de groep eruit te filteren)
  predictions: Prediction[]  // jouw eigen voorspellingen
}

type Tab = 'official' | 'virtual'

export function GroupStandings({ groupLabel, matches, predictions }: Props) {
  const [officialStandings, setOfficialStandings] = useState<GroupStanding[]>([])
  const [expanded, setExpanded] = useState(false)
  const [tab, setTab] = useState<Tab>('official')
  const [loading, setLoading] = useState(false)

  // Laad officiële stand bij open
  useEffect(() => {
    if (!expanded) return
    setLoading(true)
    getDataProvider().getGroupStandings(groupLabel)
      .then(s => setOfficialStandings(s))
      .finally(() => setLoading(false))
  }, [groupLabel, expanded])

  // Bereken virtuele stand client-side op basis van eigen voorspellingen
  const virtualStandings = useMemo<GroupStanding[]>(() => {
    return computeVirtualStandings(groupLabel, matches, predictions)
  }, [groupLabel, matches, predictions])

  const standings = tab === 'official' ? officialStandings : virtualStandings
  const anyPlayed = standings.some(s => s.played > 0)
  const predictedCount = matches
    .filter(m => m.group_label === groupLabel)
    .filter(m => predictions.find(p => p.match_id === m.id))
    .length

  return (
    <div className="mb-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-ink-400 hover:text-ink-50 transition-colors py-2"
      >
        <span className="text-xs tracking-wide uppercase">Groepsstand</span>
        <ChevronIcon flipped={expanded} />
      </button>

      {expanded && (
        <div className="bg-ink-800 rounded-lg p-3 mt-1 fade-in">
          {/* Tab switcher */}
          <div className="flex gap-1 mb-3 bg-ink-900 p-1 rounded-lg">
            <button
              onClick={() => setTab('official')}
              className={`flex-1 py-1.5 text-[11px] font-medium rounded transition-colors ${
                tab === 'official' ? 'bg-ink-700 text-ink-50' : 'text-ink-400 hover:text-ink-50'
              }`}
            >
              Officieel
            </button>
            <button
              onClick={() => setTab('virtual')}
              className={`flex-1 py-1.5 text-[11px] font-medium rounded transition-colors ${
                tab === 'virtual' ? 'bg-ink-700 text-accent-orange' : 'text-ink-400 hover:text-ink-50'
              }`}
            >
              Jouw voorspelling
            </button>
          </div>

          {tab === 'official' && loading ? (
            <p className="text-center text-ink-400 text-xs py-2">Laden…</p>
          ) : standings.length === 0 ? (
            <p className="text-center text-ink-400 text-xs py-3">
              {tab === 'virtual' ? 'Je hebt nog geen voorspellingen ingediend voor deze groep.' : 'Geen data.'}
            </p>
          ) : (
            <>
              <div className="overflow-x-auto -mx-3 px-3">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-ink-500 text-[10px] tracking-wider uppercase">
                      <th className="text-left font-normal pb-1.5 pr-1">#</th>
                      <th className="text-left font-normal pb-1.5">Team</th>
                      <th className="text-center font-normal pb-1.5 px-1" title="Gespeeld">Gs</th>
                      <th className="text-center font-normal pb-1.5 px-1" title="Winst">W</th>
                      <th className="text-center font-normal pb-1.5 px-1" title="Gelijk">Gl</th>
                      <th className="text-center font-normal pb-1.5 px-1" title="Verlies">V</th>
                      <th className="text-center font-normal pb-1.5 px-1" title="Doelpunten voor">DV</th>
                      <th className="text-center font-normal pb-1.5 px-1" title="Doelpunten tegen">DT</th>
                      <th className="text-center font-normal pb-1.5 px-1" title="Doelsaldo">+/-</th>
                      <th className="text-right font-normal pb-1.5 pl-1">Pt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map(s => (
                      <tr key={s.team_id} className="border-t border-ink-600">
                        <td className="py-1.5 pr-1 text-ink-200 tabular-nums">{s.rank}</td>
                        <td className="py-1.5 text-ink-50 font-medium">{s.team_fifa}</td>
                        <td className="text-center py-1.5 px-1 text-ink-200 tabular-nums">{s.played}</td>
                        <td className="text-center py-1.5 px-1 text-ink-200 tabular-nums">{s.wins}</td>
                        <td className="text-center py-1.5 px-1 text-ink-200 tabular-nums">{s.draws}</td>
                        <td className="text-center py-1.5 px-1 text-ink-200 tabular-nums">{s.losses}</td>
                        <td className="text-center py-1.5 px-1 text-ink-200 tabular-nums">{s.goals_for}</td>
                        <td className="text-center py-1.5 px-1 text-ink-200 tabular-nums">{s.goals_against}</td>
                        <td className={`text-center py-1.5 px-1 tabular-nums ${
                          s.goal_difference > 0 ? 'text-accent-mint' :
                          s.goal_difference < 0 ? 'text-accent-coral' : 'text-ink-400'
                        }`}>
                          {s.goal_difference > 0 ? '+' : ''}{s.goal_difference}
                        </td>
                        <td className="text-right py-1.5 pl-1 text-ink-50 font-medium tabular-nums">{s.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Info-line onderin */}
              {tab === 'official' && !anyPlayed && (
                <p className="text-[10px] text-ink-500 text-center mt-2 tracking-wide">
                  NOG GEEN WEDSTRIJDEN GESPEELD
                </p>
              )}
              {tab === 'virtual' && (
                <p className="text-[10px] text-ink-500 text-center mt-2 tracking-wide">
                  OP BASIS VAN {predictedCount} VAN {matches.filter(m => m.group_label === groupLabel).length} VOORSPELLINGEN
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────
// Virtuele stand berekenen op basis van eigen voorspellingen
// ────────────────────────────────────────────────────────────────────────

function computeVirtualStandings(
  groupLabel: string,
  matches: Match[],
  predictions: Prediction[]
): GroupStanding[] {
  // 1. Haal de wedstrijden in deze groep op
  const groupMatches = matches.filter(m => m.group_label === groupLabel)
  if (groupMatches.length === 0) return []

  // 2. Verzamel alle teams in deze groep + maak een lege standing-record per team
  type StandingAcc = {
    team_id: number
    team_fifa: string
    played: number
    wins: number
    draws: number
    losses: number
    points: number
    goals_for: number
    goals_against: number
  }
  const newAcc = (id: number, fifa: string): StandingAcc => ({
    team_id: id, team_fifa: fifa,
    played: 0, wins: 0, draws: 0, losses: 0, points: 0, goals_for: 0, goals_against: 0,
  })

  const teamMap = new Map<number, StandingAcc>()
  for (const m of groupMatches) {
    if (m.home_team) teamMap.set(m.home_team.id, teamMap.get(m.home_team.id) || newAcc(m.home_team.id, m.home_team.fifa_code))
    if (m.away_team) teamMap.set(m.away_team.id, teamMap.get(m.away_team.id) || newAcc(m.away_team.id, m.away_team.fifa_code))
  }

  // 3. Loop over voorspellingen voor deze groep en update standings
  for (const match of groupMatches) {
    const pred = predictions.find(p => p.match_id === match.id)
    if (!pred) continue
    if (!match.home_team || !match.away_team) continue

    const home = teamMap.get(match.home_team.id)!
    const away = teamMap.get(match.away_team.id)!

    home.played++
    away.played++
    home.goals_for += pred.home_score
    home.goals_against += pred.away_score
    away.goals_for += pred.away_score
    away.goals_against += pred.home_score

    if (pred.home_score > pred.away_score) {
      home.points += 3; home.wins++; away.losses++
    } else if (pred.home_score < pred.away_score) {
      away.points += 3; away.wins++; home.losses++
    } else {
      home.points += 1; away.points += 1
      home.draws++; away.draws++
    }
  }

  // 4. Sorteer en geef ranks
  const sorted = Array.from(teamMap.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    const gdA = a.goals_for - a.goals_against
    const gdB = b.goals_for - b.goals_against
    if (gdB !== gdA) return gdB - gdA
    if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for
    return a.team_fifa.localeCompare(b.team_fifa)
  })

  return sorted.map((s, i) => ({
    group_label: groupLabel,
    team_id: s.team_id,
    team_fifa: s.team_fifa,
    played: s.played,
    wins: s.wins,
    draws: s.draws,
    losses: s.losses,
    points: s.points,
    goals_for: s.goals_for,
    goals_against: s.goals_against,
    goal_difference: s.goals_for - s.goals_against,
    rank: i + 1,
  }))
}

function ChevronIcon({ flipped }: { flipped: boolean }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={`transition-transform ${flipped ? 'rotate-180' : ''}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}
