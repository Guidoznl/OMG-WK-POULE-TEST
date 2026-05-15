// Date/time helpers.
//
// IMPORTANT: All timestamps are stored as UTC (ISO 8601). For DISPLAY we
// render in the user's LOCAL timezone (detected automatically by the browser
// via Intl.DateTimeFormat) so a colleague on holiday in NYC sees NYC time.
//
// For deadlines we ALWAYS show the timezone abbreviation (e.g. "CEST") so
// there is never any ambiguity.

const DUTCH_DAYS = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za']
const DUTCH_MONTHS = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']

/** Get the user's IANA timezone (e.g. "Europe/Amsterdam", "America/New_York") */
export function getUserTimezone(): string {
  if (typeof Intl === 'undefined') return 'Europe/Amsterdam'
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Amsterdam'
}

/** "zo 14 jun" in user's local timezone */
export function formatDateLocal(iso: string): string {
  const d = new Date(iso)
  const tz = getUserTimezone()
  // Use formatToParts so we can build Dutch-style format manually
  const parts = new Intl.DateTimeFormat('nl-NL', {
    timeZone: tz, weekday: 'short', day: 'numeric', month: 'short',
  }).formatToParts(d)
  // We want our own Dutch abbreviations consistently
  const fmt2 = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, weekday: 'short', day: 'numeric', month: 'short',
  }).format(d)
  // Render manually using getDay/getMonth in the user's TZ.
  // Trick: get the "wall clock" date in the user's timezone using formatToParts.
  const ymd = getLocalParts(d, tz)
  return `${DUTCH_DAYS[ymd.weekday]} ${ymd.day} ${DUTCH_MONTHS[ymd.month]}`
}

/** "21:00" in user's local timezone */
export function formatTimeLocal(iso: string): string {
  const d = new Date(iso)
  const tz = getUserTimezone()
  return new Intl.DateTimeFormat('nl-NL', {
    timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(d)
}

/** Short timezone abbreviation: "CEST", "CET", "EDT", etc. */
export function getTimezoneAbbr(iso: string): string {
  const d = new Date(iso)
  const tz = getUserTimezone()
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, timeZoneName: 'short',
    }).formatToParts(d)
    const tzPart = parts.find(p => p.type === 'timeZoneName')
    return tzPart?.value || ''
  } catch {
    return ''
  }
}

/** Full deadline string: "23/06 23:59 CEST" */
export function formatDeadline(iso: string): string {
  const d = new Date(iso)
  const tz = getUserTimezone()
  const date = new Intl.DateTimeFormat('nl-NL', {
    timeZone: tz, day: '2-digit', month: '2-digit',
  }).format(d)
  const time = new Intl.DateTimeFormat('nl-NL', {
    timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(d)
  const tzAbbr = getTimezoneAbbr(iso)
  return `${date} ${time}${tzAbbr ? ' ' + tzAbbr : ''}`
}

/** Countdown structure: how long until target. */
export function formatCountdown(toIso: string): {
  d: number; h: number; m: number; isPast: boolean; totalMs: number
} {
  const target = new Date(toIso).getTime()
  const diff = target - Date.now()
  if (diff <= 0) return { d: 0, h: 0, m: 0, isPast: true, totalMs: diff }
  const d = Math.floor(diff / 86_400_000)
  const h = Math.floor((diff % 86_400_000) / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  return { d, h, m, isPast: false, totalMs: diff }
}

/** Human-friendly countdown like "2d 14u 23m" or "23m" */
export function formatCountdownShort(toIso: string): string {
  const c = formatCountdown(toIso)
  if (c.isPast) return 'verstreken'
  if (c.d > 0) return `${c.d}d ${c.h}u ${c.m}m`
  if (c.h > 0) return `${c.h}u ${c.m}m`
  return `${c.m}m`
}

// ---------------------------------------------------------------------------
// Internal helper: convert a UTC date to "local parts" in a given timezone
// (because JS Date is always UTC internally).
// ---------------------------------------------------------------------------
function getLocalParts(d: Date, tz: string): { weekday: number; day: number; month: number } {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, weekday: 'short', day: 'numeric', month: 'numeric', year: 'numeric',
  })
  const parts = fmt.formatToParts(d)
  const dayStr = parts.find(p => p.type === 'day')?.value || '1'
  const monthStr = parts.find(p => p.type === 'month')?.value || '1'
  const weekdayStr = parts.find(p => p.type === 'weekday')?.value || 'Sun'
  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  return {
    weekday: weekdayMap[weekdayStr] ?? 0,
    day: parseInt(dayStr, 10),
    month: parseInt(monthStr, 10) - 1,
  }
}
