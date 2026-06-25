'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { KnockoutSuggestion, TeamWithGroup } from '@/lib/types'
import { getDataProvider } from '@/lib/data-provider'
import { TopNav } from '@/components/TopNav'
import { FlagCircle } from '@/components/FlagCircle'
import { dutchStageName } from '@/lib/labels'

export default function KnockoutAdminPage() {
  const router = useRouter()
  const [suggestions, setSuggestions] = useState<KnockoutSuggestion[]>([])
  const [teams, setTeams] = useState<TeamWithGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [activeStage, setActiveStage] = useState<number>(2)
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)

  async function reload() {
    const provider = getDataProvider()
    const [s, t] = await Promise.all([
      provider.adminGetKnockoutSuggestions(),
      provider.adminGetTeamsWithGroup(),
    ])
    setSuggestions(s)
    setTeams(t)
  }

useEffect(() => {
    async function load() {
      console.log('[knockout] load start')
      try {
        const provider = getDataProvider()
        console.log('[knockout] provider:', provider)
        const user = await provider.getCurrentUser()
        console.log('[knockout] user:', user)
        if (!user) { router.push('/login'); return }
        if (!user.is_admin) { router.push('/predictions'); return }

        console.log('[knockout] calling RPCs...')
        const [s, t] = await Promise.all([
          provider.adminGetKnockoutSuggestions(),
          provider.adminGetTeamsWithGroup(),
        ])
        console.log('[knockout] suggestions:', s.length, 'teams:', t.length)
        setSuggestions(s)
        setTeams(t)
      } catch (err) {
        console.error('[knockout] LOAD ERROR:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  const stagesPresent = useMemo(() => {
    const set = new Set(suggestions.map(s => s.stage_id))
    return Array.from(set).sort()
  }, [suggestions])

  const visible = useMemo(() =>
    suggestions.filter(s => s.stage_id === activeStage)
  , [suggestions, activeStage])

  const teamsById = useMemo(() => {
    const map = new Map<number, TeamWithGroup>()
    for (const t of teams) map.set(t.team_id, t)
    return map
  }, [teams])

  function getStageName(stageId: number): string {
    const s = suggestions.find(s => s.stage_id === stageId)
    return s ? s.stage_name : ''
  }

  async function handleSave(matchId: number, homeTeamId: number | null, awayTeamId: number | null) {
    try {
      await getDataProvider().adminSetKnockoutTeams(matchId, homeTeamId, awayTeamId)
      setMessage({ kind: 'success', text: `Wedstrijd #${matchId} bijgewerkt.` })
      await reload()
      setTimeout(() => setMessage(null), 3000)
    } catch (err: any) {
      setMessage({ kind: 'error', text: err.message || 'Fout bij opslaan' })
    }
  }

  async function handleApplySuggestionsForStage() {
    const toApply = visible.filter(s =>
      (!s.home_team_id && s.suggested_home_team_id) ||
      (!s.away_team_id && s.suggested_away_team_id)
    )
    if (toApply.length === 0) {
      setMessage({ kind: 'error', text: 'Geen suggesties om toe te passen.' })
      return
    }
    if (!confirm(`Pas ${toApply.length} suggesties toe? Bestaande team-keuzes blijven staan.`)) return

    try {
      for (const s of toApply) {
        await getDataProvider().adminSetKnockoutTeams(
          s.match_id,
          s.home_team_id ?? s.suggested_home_team_id,
          s.away_team_id ?? s.suggested_away_team_id,
        )
      }
      setMessage({ kind: 'success', text: `${toApply.length} wedstrijden bijgewerkt.` })
      await reload()
    } catch (err: any) {
      setMessage({ kind: 'error', text: err.message || 'Fout' })
    }
  }

  if (loading) {
    return <><TopNav /><main className="max-w-3xl mx-auto p-4"><p className="text-ink-200 text-sm text-center mt-12">Laden…</p></main></>
  }

  return (
    <>
      <TopNav />
      <main className="max-w-3xl mx-auto p-4 pb-12">
        <Link href="/admin" className="text-xs text-ink-200 hover:text-ink-50 inline-flex items-center gap-1 mb-3">
          ← Terug naar wedstrijden
        </Link>

        <h1 className="font-display text-2xl font-medium text-ink-50 mb-1">Knockout teams</h1>
        <p className="text-ink-200 text-sm mb-6">
          Vul per knockout-wedstrijd de juiste teams in. Suggesties op basis van poulestanden of bevestigde knockout-uitslagen worden automatisch ingevuld.
          Voor "3XYZ" slots (beste nummers 3) moet je handmatig kiezen uit de toegestane poules.
        </p>

        {message && (
          <div className={`p-3 rounded-tile mb-4 text-sm ${
            message.kind === 'success'
              ? 'bg-accent-mint/10 border border-accent-mint/30 text-accent-mint'
              : 'bg-accent-coral/10 border border-accent-coral/30 text-accent-coral'
          }`}>
            {message.text}
          </div>
        )}

        {/* Stage tabs */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
          {stagesPresent.map(stageId => (
            <button
              key={stageId}
              onClick={() => setActiveStage(stageId)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                stageId === activeStage ? 'bg-ink-600 text-ink-50' : 'text-ink-200 hover:text-ink-50'
              }`}
            >
              {dutchStageName(getStageName(stageId))}
            </button>
          ))}
        </div>

        {/* Bulk apply button */}
        <button
          onClick={handleApplySuggestionsForStage}
          className="w-full mb-4 py-2.5 bg-accent-orange hover:brightness-110 text-ink-950 text-sm font-display font-medium rounded-tile transition-all"
        >
          Pas alle suggesties toe voor deze ronde
        </button>

        {/* Match list */}
        <div className="space-y-2.5">
          {visible.length === 0 ? (
            <p className="text-ink-200 text-sm text-center py-12">Geen wedstrijden in deze ronde.</p>
          ) : (
            visible.map(s => (
              <KnockoutMatchRow
                key={s.match_id}
                suggestion={s}
                teams={teams}
                teamsById={teamsById}
                onSave={handleSave}
              />
            ))
          )}
        </div>
      </main>
    </>
  )
}

// ─── Match row ──────────────────────────────────────────────────────────

function KnockoutMatchRow({ suggestion: s, teams, teamsById, onSave }: {
  suggestion: KnockoutSuggestion
  teams: TeamWithGroup[]
  teamsById: Map<number, TeamWithGroup>
  onSave: (matchId: number, home: number | null, away: number | null) => Promise<void>
}) {
  // Effective IDs: huidige waarde uit DB, anders suggestie als die er is
  const initialHome = s.home_team_id ?? s.suggested_home_team_id ?? null
  const initialAway = s.away_team_id ?? s.suggested_away_team_id ?? null

  const [homeId, setHomeId] = useState<number | null>(initialHome)
  const [awayId, setAwayId] = useState<number | null>(initialAway)

  useEffect(() => {
    setHomeId(s.home_team_id ?? s.suggested_home_team_id ?? null)
    setAwayId(s.away_team_id ?? s.suggested_away_team_id ?? null)
  }, [s.home_team_id, s.away_team_id, s.suggested_home_team_id, s.suggested_away_team_id])

  // Filter teams beschikbaar voor home / away
  const homeOptions = filterTeams(teams, s.home_allowed_groups)
  const awayOptions = filterTeams(teams, s.away_allowed_groups)

  const hasChanges = homeId !== s.home_team_id || awayId !== s.away_team_id
  const isComplete = s.home_team_id !== null && s.away_team_id !== null

  return (
    <div className="tile p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] text-ink-200 tabular-nums">
          #{s.match_id}
        </span>
        <div className="flex items-center gap-2">
          {isComplete && !hasChanges && (
            <span className="text-[10px] text-accent-mint tracking-wider uppercase">Ingevuld</span>
          )}
          {hasChanges && (
            <button
              onClick={() => onSave(s.match_id, homeId, awayId)}
              className="px-3 py-1 rounded bg-accent-orange hover:brightness-110 text-ink-950 text-xs font-display font-medium"
            >
              Opslaan
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <TeamSelector
          value={homeId}
          options={homeOptions}
          placeholder={s.placeholder_home || '?'}
          isManual={s.home_is_manual}
          allowedGroups={s.home_allowed_groups}
          suggestion={s.suggested_home_team_id}
          teamsById={teamsById}
          onChange={setHomeId}
        />
        <span className="text-ink-200 text-xs">vs</span>
        <TeamSelector
          value={awayId}
          options={awayOptions}
          placeholder={s.placeholder_away || '?'}
          isManual={s.away_is_manual}
          allowedGroups={s.away_allowed_groups}
          suggestion={s.suggested_away_team_id}
          teamsById={teamsById}
          onChange={setAwayId}
        />
      </div>
    </div>
  )
}

// ─── Team Selector ──────────────────────────────────────────────────────

function TeamSelector({
  value, options, placeholder, isManual, allowedGroups, suggestion, teamsById, onChange,
}: {
  value: number | null
  options: TeamWithGroup[]
  placeholder: string
  isManual: boolean
  allowedGroups: string | null
  suggestion: number | null
  teamsById: Map<number, TeamWithGroup>
  onChange: (v: number | null) => void
}) {
  const selected = value ? teamsById.get(value) : null

  // Hint-label: "1A", "W74", "3XYZ"
  const hintLabel = isManual
    ? `Beste 3e uit ${allowedGroups || ''}`
    : placeholder

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-ink-200 tracking-wider uppercase">
        {hintLabel}
        {suggestion && value === suggestion && !isManual && (
          <span className="ml-1 text-accent-mint">✓ suggestie</span>
        )}
      </span>
      <div className="flex items-center gap-2">
        <FlagCircle isoCode={selected?.iso_code || null} size="sm" />
        <select
          value={value ?? ''}
          onChange={e => onChange(e.target.value ? parseInt(e.target.value, 10) : null)}
          className="flex-1 px-2 py-1.5 text-xs bg-ink-950 border border-ink-600 rounded text-ink-50 cursor-pointer"
        >
          <option value="">— kies team —</option>
          {options.map(t => (
            <option key={t.team_id} value={t.team_id}>
              {t.fifa_code} · {t.team_name}{t.group_label ? ` (${t.group_label.replace('Group ', '')}${t.group_rank ? `, #${t.group_rank}` : ''})` : ''}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

// Filter teams: bij allowedGroups (bv. "ABCDF") alleen teams uit die poules.
function filterTeams(teams: TeamWithGroup[], allowedGroups: string | null): TeamWithGroup[] {
  if (!allowedGroups) return teams
  const allowed = new Set(allowedGroups.split(''))
  return teams.filter(t => {
    if (!t.group_label) return false
    const letter = t.group_label.replace('Group ', '')
    return allowed.has(letter)
  })
}
