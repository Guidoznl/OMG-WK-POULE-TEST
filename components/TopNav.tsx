'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Profile } from '@/lib/types'
import { getDataProvider, isMockMode } from '@/lib/data-provider'
import { useTheme } from './ThemeProvider'

export function TopNav() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<Profile | null>(null)
  const [allUsers, setAllUsers] = useState<Profile[]>([])

  useEffect(() => {
    const provider = getDataProvider()
    provider.getCurrentUser().then(setUser)
    if (isMockMode() && provider.devListUsers) {
      provider.devListUsers().then(setAllUsers)
    }
  }, [pathname])

  async function handleSwitch(userId: string) {
    const provider = getDataProvider()
    if (provider.devSwitchUser) {
      await provider.devSwitchUser(userId)
      router.refresh()
      window.location.reload()
    }
  }

  async function handleSignOut() {
    await getDataProvider().signOut()
    router.push('/login')
  }

  const baseItems = [
    { href: '/predictions', label: 'Voorspellen' },
    { href: '/extras',      label: 'Extra punten' },
    { href: '/leaderboard', label: 'Ranglijst' },
    { href: '/rules',       label: 'Regels' },
  ]
  const navItems = user?.is_admin
    ? [...baseItems, { href: '/admin', label: 'Admin' }]
    : baseItems

  return (
    <header className="border-b border-ink-600 bg-ink-900/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <Link href="/predictions" className="flex items-center gap-2 flex-shrink-0">
          <span className="inline-flex items-center justify-center w-7 h-7 bg-accent-orange text-ink-950 font-display font-bold text-sm rounded">
            O!
          </span>
          <span className="hidden sm:inline-flex items-center gap-1.5 font-display font-medium text-ink-50 text-sm">
            WK Poule '26
            <FootballIcon />
          </span>
        </Link>

        <nav className="flex gap-0.5 overflow-x-auto">
          {navItems.map(item => {
            const isAdminLink = item.href === '/admin' || item.href.startsWith('/admin/')
            const isActive = pathname === item.href || (isAdminLink && pathname.startsWith('/admin'))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? (isAdminLink ? 'bg-accent-orange/20 text-accent-orange' : 'bg-ink-700 text-ink-50')
                    : isAdminLink
                      ? 'text-accent-orange/80 hover:text-accent-orange'
                      : 'text-ink-400 hover:text-ink-50'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2 flex-shrink-0">
          <ThemeToggle />
          {isMockMode() && allUsers.length > 0 && (
            <select
              value={user?.id || ''}
              onChange={e => handleSwitch(e.target.value)}
              className="bg-ink-700 text-ink-200 border-ink-600 text-xs rounded-lg px-2 py-1 cursor-pointer max-w-[110px]"
              title="Dev: switch user"
            >
              {allUsers.map(u => (
                <option key={u.id} value={u.id}>{u.display_name}</option>
              ))}
            </select>
          )}
          {user && !isMockMode() && (
            <button
              onClick={handleSignOut}
              className="text-ink-400 hover:text-ink-50 text-xs whitespace-nowrap"
            >
              Uitloggen
            </button>
          )}
        </div>
      </div>

      {isMockMode() && (
        <div className="bg-accent-orange/10 border-t border-accent-orange/30 text-accent-orange text-[10px] text-center py-1 tracking-wider uppercase">
          Dev mode — mock data
        </div>
      )}
    </header>
  )
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const isPink = theme === 'pink'
  return (
    <button
      onClick={() => setTheme(isPink ? 'dark' : 'pink')}
      title={isPink ? 'Schakel naar dark mode' : 'Schakel naar pink mode'}
      aria-label="Wissel thema"
      className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-400 hover:text-ink-50 hover:bg-ink-700 transition-colors"
    >
      {isPink ? <MoonIcon /> : <PinkBallIcon />}
    </button>
  )
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function PinkBallIcon() {
  // Simple football icon — sphere with pentagon hint
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3 L8 8 L4 10" />
      <path d="M12 3 L16 8 L20 10" />
      <path d="M8 8 L12 14 L16 8" />
      <path d="M12 14 L9 21" />
      <path d="M12 14 L15 21" />
    </svg>
  )
}

function FootballIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent-orange opacity-90" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 6 L15.5 8.5 L14 12.5 L10 12.5 L8.5 8.5 Z" fill="currentColor" opacity="0.3" />
      <path d="M12 6 L12 3" />
      <path d="M15.5 8.5 L18.5 7" />
      <path d="M14 12.5 L17 15" />
      <path d="M10 12.5 L7 15" />
      <path d="M8.5 8.5 L5.5 7" />
    </svg>
  )
}
