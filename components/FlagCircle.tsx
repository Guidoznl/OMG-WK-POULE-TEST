'use client'

type Props = {
  isoCode: string | null
  size?: 'sm' | 'md'
}

/**
 * Circular country flag using the flag-icons npm package.
 * isoCode is the ISO 3166-1 alpha-2 code (e.g. 'nl', 'jp', 'gb-eng').
 */
export function FlagCircle({ isoCode, size = 'md' }: Props) {
  const sizeClass = size === 'sm' ? 'w-6 h-6' : 'w-9 h-9'
  if (!isoCode) {
    return (
      <div className={`${sizeClass} rounded-full bg-ink-600 border border-ink-600 flex items-center justify-center text-ink-400 text-xs font-medium`}>
        ?
      </div>
    )
  }
  return (
    <span
      className={`${sizeClass} rounded-full overflow-hidden border border-ink-600 inline-block flex-shrink-0`}
      style={{ position: 'relative' }}
    >
      <span
        className={`fi fi-${isoCode}`}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          width: '100%',
          height: '100%',
        }}
      />
    </span>
  )
}
