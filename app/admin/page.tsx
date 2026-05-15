'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AdminMatchOverview, Stage } from '@/lib/types'
import { getDataProvider } from '@/lib/data-provider'
import { formatDateLocal, formatTimeLocal } from '@/lib/date-utils'
import { dutchStageName } from '@/lib/labels'
import { TopNav } from '@/components/TopNav'
import { FlagCircle } from '@/components/FlagCircle'

export default function AdminHomePage() {
  const router = useRouter()
  const [overview, setOverview] = useState<AdminMatchOverview[]>([])
  const [stages, setStages] = useState<Stage[]>([])
  const [activeStage, setActiveStage] = useState<number>(1)
  const [filter, setFilter] = useState<'all' | 'pending' | 'provisional' | 'confirmed'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function reload() {
    const provider = getDataProvider()
    const ov = await provider.adminGetMatchOverview()
    setOverview(ov)
  }

  useEffect(() => {
    async function load() {
      const provider = getDataProvider()
      const user = await provider.getCurrentUser()
      if (!user) { router.push('/login'); return }
      if (!user.is_admin) { router.push('/predictions'); return }

      try {
        const [ov, s] = await Promise.all([
          provider.adminGetMatchOverview(),
          provider.getStages(),
        ])
        setOverview(ov)
        setStages(s)
      } catch (err: any) {
        setError(err.message || 'Fout bij laden')
      }
      setLoading(false)
    }
    load()
  }, [router])

  const visible = useMemo(() => {
    let list = overview.filter(o => o.match.stage_id === activeStage)
    if (filter === 'pending') list = list.filter(o => o.result_state === 'no_result')
    if (filter === 'provisional') list = list.filter(o => o.result_state === 'provisional')
    if (filter === 'confirmed') list = list.filter(o => o.result_state === 'confirmed')
    return list.sort((a, b) =>
      new Date(a.match.kickoff_ams).getTime() - new Date(b.match.kickoff_ams).getTime()
    )
  }, [overview, activeStage, filter])

  const stats = useMemo(() => {
    const s = overview.filter(o => o.match.stage_id === activeStage)
    return {
      total: s.length,
      noResult: s.filter(o => o.result_state === 'no_result').length,
      provisional: s.filter(o => o.result_state === 'provisional').length,
      confirmed: s.filter(o => o.result_state === 'confirmed').length,
    }
  }, [overview, activeStage])

  if (loading) {
    return <><TopNav /><main className="max-w-3xl mx-auto p-4"><p className="text-ink-400 text-sm text-center mt-12">Laden…</p></main></>
  }
  if (error) {
    return <><TopNav /><main className="max-w-3xl mx-auto p-4"><p className="text-accent-coral text-sm text-center mt-12">{error}</p></main></>
  }

  return (
    <>
      <TopNav />
      <main className="max-w-3xl mx-auto p-4 pb-12">
        <div className="flex items-center justify-between mb-2">
          <h1 className="font-display text-2xl font-medium text-ink-50">Admin</h1>
          <Link
            href="/admin/bonus"
            className="text-xs text-ink-400 hover:text-ink-50 underline underline-offset-2"
          >
            Bonus &rarr;
          </Link>
        </div>
        <p className="text-ink-400 text-sm mb-6">
          Vul de uitslag in — wordt automatisch <b className="text-ink-50">voorlopig</b> opgeslagen. Klik <b className="text-ink-50">OK</b> om te bevestigen en de punten uit te delen.
        </p>

        {/* Phase tabs */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
          {stages.map(stage => (
            <button
              key={stage.id}
              onClick={() => setActiveStage(stage.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                stage.id === activeStage ? 'bg-ink-600 text-ink-50' : 'text-ink-400 hover:text-ink-50'
              }`}
            >
              {dutchStageName(stage.name)}
            </button>
          ))}
        </div>

        {/* Stats + filter chips */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <StatCard label="Totaal" value={stats.total} active={filter==='all'} onClick={() => setFilter('all')} />
          <StatCard label="Open" value={stats.noResult} active={filter==='pending'} onClick={() => setFilter('pending')} tone="amber" />
          <StatCard label="Voorlopig" value={stats.provisional} active={filter==='provisional'} onClick={() => setFilter('provisional')} tone="orange" />
          <StatCard label="Bevestigd" value={stats.confirmed} active={filter==='confirmed'} onClick={() => setFilter('confirmed')} tone="mint" />
        </div>

        {/* Match list */}
        <div className="space-y-2">
          {visible.length === 0 ? (
            <p className="text-ink-400 text-sm text-center py-12">Geen wedstrijden in deze selectie.</p>
          ) : (
            visible.map(o => (
              <AdminMatchRow
                key={o.match.id}
                overview={o}
                onChange={reload}
              />
            ))
          )}
        </div>
      </main>
    </>
  )
}

// ─── Stat / filter chip ──────────────────────────────────────────────────

function StatCard({ label, value, active, onClick, tone }: {
  label: string; value: number; active: boolean; onClick: () => void;
  tone?: 'amber' | 'orange' | 'mint'
}) {
  const toneClasses = tone === 'mint' ? 'text-accent-mint'
    : tone === 'orange' ? 'text-accent-orange'
    : tone === 'amber' ? 'text-accent-amber'
    : 'text-ink-200'
  return (
    <button
      onClick={onClick}
      className={`text-left p-2.5 rounded-tile transition-all ${
        active ? 'bg-ink-700 ring-1 ring-ink-500' : 'bg-ink-800 hover:bg-ink-700'
      }`}
    >
      <div className={`font-display font-medium text-lg tabular-nums ${toneClasses}`}>{value}</div>
      <div className="text-[10px] tracking-wider uppercase text-ink-500">{label}</div>
    </button>
  )
}

// ─── Match row with inline score input ───────────────────────────────────

type RowSaveState = 'idle' | 'saving' | 'saved' | 'error'

function AdminMatchRow({ overview, onChange }: {
  overview: AdminMatchOverview
  onChange: () => Promise<void>
}) {
  const { match, result_state, prediction_count, exact_count } = overview
  const homeName = match.home_team?.fifa_code || match.placeholder_home || 'TBD'
  const awayName = match.away_team?.fifa_code || match.placeholder_away || 'TBD'

  const initialHome = match.home_score !== null ? match.home_score.toString() : ''
  const initialAway = match.away_score !== null ? match.away_score.toString() : ''

  const [home, setHome] = useState<string>(initialHome)
  const [away, setAway] = useState<string>(initialAway)
  const [saveState, setSaveState] = useState<RowSaveState>('idle')
  const [busy, setBusy] = useState(false)

  // Keep local input in sync when parent reloads (e.g. after confirm/reset)
  const lastSyncedRef = useRef({ home: initialHome, away: initialAway, state: result_state })
  useEffect(() => {
    const expected = lastSyncedRef.current
    if (initialHome !== expected.home || initialAway !== expected.away) {
      setHome(initialHome)
      setAway(initialAway)
    }
    lastSyncedRef.current = { home: initialHome, away: initialAway, state: result_state }
  }, [initialHome, initialAway, result_state])

  const isConfirmed = result_state === 'confirmed'

  // Auto-save as provisional when both fields valid AND have changed
  useEffect(() => {
    if (isConfirmed) return
    const h = parseInt(home, 10)
    const a = parseInt(away, 10)
    if (Number.isNaN(h) || Number.isNaN(a)) return
    if (h < 0 || a < 0 || h > 99 || a > 99) return
    // Compare against last persisted values
    if (home === initialHome && away === initialAway) return

    const timer = setTimeout(async () => {
      setBusy(true)
      setSaveState('saving')
      try {
        await getDataProvider().adminSaveProvisionalScore(match.id, h, a)
        setSaveState('saved')
        await onChange()
        setTimeout(() => setSaveState('idle'), 2000)
      } catch {
        setSaveState('error')
      }
      setBusy(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [home, away])

  async function handleConfirm() {
    setBusy(true)
    try {
      await getDataProvider().adminConfirmAndScore(match.id)
      await onChange()
    } catch (err: any) {
      alert(err.message || 'Fout bij bevestigen')
    }
    setBusy(false)
  }

  async function handleUnconfirm() {
    if (!confirm('Bevestiging intrekken? De punten worden weer ongedaan gemaakt.')) return
    setBusy(true)
    try {
      await getDataProvider().adminUnconfirm(match.id)
      await onChange()
    } catch (err: any) {
      alert(err.message || 'Fout')
    }
    setBusy(false)
  }

  async function handleClear() {
    if (!confirm('Volledig wissen?')) return
    setBusy(true)
    try {
      await getDataProvider().adminClearScore(match.id)
      setHome('')
      setAway('')
      await onChange()
    } catch (err: any) {
      alert(err.message || 'Fout')
    }
    setBusy(false)
  }

  // Status badge content (small, sits in the right column)
  const statusContent = (() => {
    if (isConfirmed) {
      return (
        <div className="flex items-center gap-1">
          <span className="px-1.5 py-0.5 rounded bg-accent-mint/20 text-accent-mint text-[10px] tracking-wider font-medium">BEVESTIGD</span>
          <button
            onClick={handleUnconfirm}
            disabled={busy}
            title="Bevestiging intrekken"
            className="text-ink-500 hover:text-ink-50 transition-colors p-1 rounded"
          >
            <UndoIcon />
          </button>
        </div>
      )
    }
    if (result_state === 'provisional') {
      return (
        <div className="flex items-center gap-1">
          <span className="px-1.5 py-0.5 rounded bg-accent-orange/20 text-accent-orange text-[10px] tracking-wider font-medium">VOORLOPIG</span>
          <button
            onClick={handleConfirm}
            disabled={busy}
            className="px-2 py-0.5 rounded bg-accent-orange hover:brightness-110 text-ink-950 text-[11px] font-display font-medium transition-all disabled:opacity-40"
            title="Bevestigen & punten uitdelen"
          >
            OK
          </button>
        </div>
      )
    }
    return (
      <span className="px-1.5 py-0.5 rounded bg-ink-700 text-ink-400 text-[10px] tracking-wider">OPEN</span>
    )
  })()

  // Save-state indicator on the input row
  const saveIndicator = (() => {
    if (saveState === 'saving') return <span className="text-ink-500 text-[10px]">…</span>
    if (saveState === 'saved') return <span className="text-accent-mint text-[10px]">✓</span>
    if (saveState === 'error') return <span className="text-accent-coral text-[10px]">!</span>
    return <span className="w-2" /> // spacer to keep layout stable
  })()

  return (
    <div className="flex items-center gap-2 px-3 py-2.5 bg-ink-700 rounded-tile hover:bg-ink-700/80 transition-colors">
      {/* Match number */}
      <div className="text-ink-500 text-[10px] tabular-nums w-7 text-center flex-shrink-0">
        #{match.id}
      </div>

      {/* Teams (compact) */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <FlagCircle isoCode={match.home_team?.iso_code || null} size="sm" />
        <span className="text-ink-50 text-xs font-medium">{homeName}</span>
        <span className="text-ink-500 text-[10px] mx-0.5">vs</span>
        <span className="text-ink-50 text-xs font-medium">{awayName}</span>
        <FlagCircle isoCode={match.away_team?.iso_code || null} size="sm" />
      </div>

      {/* Date — only on wider screens to save room */}
      <div className="text-right hidden md:block flex-shrink-0">
        <div className="text-ink-400 text-[10px] tabular-nums">{formatDateLocal(match.kickoff_ams)}</div>
        <div className="text-ink-500 text-[10px] tabular-nums">{formatTimeLocal(match.kickoff_ams)}</div>
      </div>

      {/* Score inputs (always visible) */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <input
          type="number"
          min="0" max="99"
          inputMode="numeric"
          value={home}
          onChange={e => setHome(e.target.value)}
          disabled={isConfirmed || busy}
          aria-label={`Score ${homeName}`}
          className="w-9 h-8 text-center text-sm font-display font-medium tabular-nums disabled:opacity-60"
        />
        <span className="text-ink-500 text-[10px]">–</span>
        <input
          type="number"
          min="0" max="99"
          inputMode="numeric"
          value={away}
          onChange={e => setAway(e.target.value)}
          disabled={isConfirmed || busy}
          aria-label={`Score ${awayName}`}
          className="w-9 h-8 text-center text-sm font-display font-medium tabular-nums disabled:opacity-60"
        />
        <span className="w-3 text-center">{saveIndicator}</span>
      </div>

      {/* Status / OK / undo / clear actions */}
      <div className="flex flex-col items-end gap-0.5 flex-shrink-0 min-w-[90px]">
        {statusContent}
        <div className="text-[9px] text-ink-500 tabular-nums">
          {prediction_count} voorsp.{isConfirmed && exact_count > 0 ? ` · ${exact_count} exact` : ''}
        </div>
      </div>

      {/* Details link icon */}
      <Link
        href={`/admin/match/${match.id}`}
        className="text-ink-500 hover:text-ink-50 transition-colors p-1 rounded"
        title="Details / voorspellingen bekijken"
      >
        <DetailIcon />
      </Link>

      {/* Optional clear button — only when there IS a score */}
      {(result_state === 'provisional' || isConfirmed) && (
        <button
          onClick={handleClear}
          disabled={busy}
          title="Uitslag wissen"
          className="text-ink-500 hover:text-accent-coral transition-colors p-1 rounded"
        >
          <TrashIcon />
        </button>
      )}
    </div>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────

function DetailIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}

function UndoIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1.5 14a2 2 0 0 1-2 1.8H8.5a2 2 0 0 1-2-1.8L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </svg>
  )
}
