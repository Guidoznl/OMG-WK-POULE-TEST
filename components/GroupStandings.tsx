'use client'

import { useEffect, useState } from 'react'
import { GroupStanding } from '@/lib/types'
import { getDataProvider } from '@/lib/data-provider'

type Props = { groupLabel: string }

export function GroupStandings({ groupLabel }: Props) {
  const [standings, setStandings] = useState<GroupStanding[]>([])
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (!expanded) return
    getDataProvider().getGroupStandings(groupLabel).then(setStandings)
  }, [groupLabel, expanded])

  const anyPlayed = standings.some(s => s.played > 0)

  return (
    <div className="mb-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-ink-400 hover:text-ink-50 transition-colors py-2"
      >
        <span className="text-xs tracking-wide uppercase">Huidige stand</span>
        <ChevronIcon flipped={expanded} />
      </button>
      {expanded && (
        <div className="bg-ink-800 rounded-lg p-3 mt-1 fade-in">
          {standings.length === 0 ? (
            <p className="text-center text-ink-400 text-xs py-2">Laden…</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-ink-500 text-[10px] tracking-wider uppercase">
                  <th className="text-left font-normal pb-1.5">#</th>
                  <th className="text-left font-normal pb-1.5">Team</th>
                  <th className="text-center font-normal pb-1.5">G</th>
                  <th className="text-center font-normal pb-1.5">DV</th>
                  <th className="text-right font-normal pb-1.5">Pt</th>
                </tr>
              </thead>
              <tbody>
                {standings.map(s => (
                  <tr key={s.team_id} className="border-t border-ink-600">
                    <td className="py-1.5 text-ink-200 tabular-nums">{s.rank}</td>
                    <td className="py-1.5 text-ink-50 font-medium">{s.team_fifa}</td>
                    <td className="text-center py-1.5 text-ink-200 tabular-nums">{s.played}</td>
                    <td className={`text-center py-1.5 tabular-nums ${
                      s.goal_difference > 0 ? 'text-accent-mint' :
                      s.goal_difference < 0 ? 'text-accent-coral' : 'text-ink-400'
                    }`}>
                      {s.goal_difference > 0 ? '+' : ''}{s.goal_difference}
                    </td>
                    <td className="text-right py-1.5 text-ink-50 font-medium tabular-nums">{s.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!anyPlayed && standings.length > 0 && (
            <p className="text-[10px] text-ink-500 text-center mt-2 tracking-wide">NOG GEEN WEDSTRIJDEN GESPEELD</p>
          )}
        </div>
      )}
    </div>
  )
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
