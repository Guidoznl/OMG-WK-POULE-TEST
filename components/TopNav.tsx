'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Profile } from '@/lib/types'
import { getDataProvider, isMockMode } from '@/lib/data-provider'

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
  if (user) {
    baseItems.push({ href: `/speler/${user.id}`, label: 'Mijn voorspellingen' })
  }
  const navItems = user?.is_admin
    ? [...baseItems, { href: '/admin', label: 'Admin' }]
    : baseItems

  return (
    <header className="border-b border-ink-600 bg-ink-900/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <Link href="/predictions" className="flex items-baseline gap-1.5 flex-shrink-0 group">
          <span className="font-display font-bold text-ink-50 text-base tracking-tight group-hover:text-accent-orange transition-colors">
            OMG
          </span>
          <span className="font-display font-medium text-accent-orange text-base" aria-hidden="true">·</span>
          <span className="font-display font-medium text-ink-50 text-base tracking-tight">
            WK <span className="text-accent-orange">2026</span>
          </span>
        </Link>

        <nav className="flex gap-0.5 overflow-x-auto">
          {navItems.map(item => {
            const isAdminLink = item.href === '/admin' || item.href.startsWith('/admin/')
            const isMineLink = user && item.href === `/speler/${user.id}`
            const isActive = pathname === item.href
              || (isAdminLink && pathname.startsWith('/admin'))
              || (isMineLink && pathname.startsWith(`/speler/${user.id}`))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? (isAdminLink ? 'bg-accent-orange/20 text-accent-orange' : 'bg-ink-700 text-ink-50')
                    : isAdminLink
                      ? 'text-accent-orange/80 hover:text-accent-orange'
                      : 'text-ink-200 hover:text-ink-50'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2 flex-shrink-0">
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
              className="text-ink-200 hover:text-ink-50 text-xs whitespace-nowrap"
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
