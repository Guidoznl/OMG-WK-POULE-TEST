'use client'

import { useEffect, useState } from 'react'
import { LeaderboardEntry, Profile } from '@/lib/types'
import { getDataProvider } from '@/lib/data-provider'
import { TopNav } from '@/components/TopNav'

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [me, setMe] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const provider = getDataProvider()
      const [board, currentUser] = await Promise.all([
        provider.getLeaderboard(),
        provider.getCurrentUser(),
      ])
      setEntries(board)
      setMe(currentUser)
      setLoading(false)
    }
    load()
  }, [])

  return (
    <>
      <TopNav />
      <main className="max-w-3xl mx-auto p-4 pb-12">
        <h1 className="font-display text-2xl font-medium text-ink-50 mb-1">Ranglijst</h1>
        <p className="text-ink-400 text-sm mb-6">
          Punten worden bijgewerkt na elke afgeronde wedstrijd.
        </p>

        {loading ? (
          <p className="text-ink-400 text-sm text-center mt-12">Laden…</p>
        ) : (
          <div className="space-y-1.5">
            {entries.map(entry => {
              const isMe = me?.id === entry.user_id
              const isPodium = entry.rank <= 3
              return (
                <div
                  key={entry.user_id}
                  className={`flex items-center gap-4 px-4 py-3 rounded-tile transition-colors ${
                    isMe ? 'bg-accent-orange/10 border border-accent-orange/30' : 'bg-ink-700'
                  }`}
                >
                  <div className={`w-7 text-center font-display font-medium text-base tabular-nums flex-shrink-0 ${
                    isPodium ? 'text-accent-orange' : 'text-ink-400'
                  }`}>
                    {entry.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium text-sm truncate ${isMe ? 'text-accent-orange' : 'text-ink-50'}`}>
                        {entry.display_name}
                      </span>
                      {isMe && <span className="text-[10px] tracking-wider uppercase text-accent-orange/80">jij</span>}
                    </div>
                  </div>
                  {/* Compact exact-count badge */}
                  <div className="flex items-center gap-1 text-ink-400 text-xs tabular-nums" title="Exact geraden uitslagen">
                    <TargetIcon />
                    <span>{entry.exact_predictions}</span>
                  </div>
                  {/* Total points */}
                  <div className="text-right min-w-[60px]">
                    <div className="font-display font-medium text-lg text-ink-50 tabular-nums">
                      {entry.total_points}
                    </div>
                    <div className="text-[10px] tracking-wider uppercase text-ink-500">punten</div>
                  </div>
                </div>
              )
            })}
            {entries.length === 0 && (
              <p className="text-ink-400 text-sm text-center py-12">Nog geen deelnemers</p>
            )}
          </div>
        )}

        <p className="text-[11px] text-ink-500 text-center mt-8 leading-relaxed">
          <TargetIcon className="inline w-3 h-3 mr-1 -mt-0.5" /> = aantal exact geraden uitslagen<br/>
          Tiebreakers: (1) exact geraden, (2) juiste WK-winnaar.
        </p>
      </main>
    </>
  )
}

function TargetIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className || 'w-3.5 h-3.5'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}
