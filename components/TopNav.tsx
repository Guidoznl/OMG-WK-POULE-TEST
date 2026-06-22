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
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const provider = getDataProvider()
    provider.getCurrentUser().then(setUser)
    if (isMockMode() && provider.devListUsers) {
      provider.devListUsers().then(setAllUsers)
    }
  }, [pathname])

  // Sluit menu automatisch bij navigatie
  useEffect(() => {
    setMobileOpen(false)
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

  function isItemActive(href: string): boolean {
    const isAdminLink = href === '/admin' || href.startsWith('/admin/')
    const isMineLink = user && href === `/speler/${user.id}`
    return pathname === href
      || (isAdminLink && pathname.startsWith('/admin'))
      || !!(isMineLink && pathname.startsWith(`/speler/${user.id}`))
  }

  function itemClasses(href: string): string {
    const isAdminLink = href === '/admin' || href.startsWith('/admin/')
    const active = isItemActive(href)
    if (active) {
      return isAdminLink
        ? 'bg-accent-orange/20 text-accent-orange'
        : 'bg-ink-700 text-ink-50'
    }
    return isAdminLink
      ? 'text-accent-orange/80 hover:text-accent-orange'
      : 'text-ink-200 hover:text-ink-50'
  }

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

        {/* Desktop nav — verborgen op mobiel */}
        <nav className="hidden md:flex gap-0.5">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${itemClasses(item.href)}`}
            >
              {item.label}
            </Link>
          ))}
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
          {/* Uitlog-knop alleen zichtbaar op desktop, op mobiel zit 'ie in het dropdown menu */}
          {user && !isMockMode() && (
            <button
              onClick={handleSignOut}
              className="hidden md:inline text-ink-200 hover:text-ink-50 text-xs whitespace-nowrap"
            >
              Uitloggen
            </button>
          )}

          {/* Hamburger-knop — alleen op mobiel */}
          <button
            onClick={() => setMobileOpen(o => !o)}
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-ink-200 hover:text-ink-50 hover:bg-ink-700 transition-colors"
            aria-label={mobileOpen ? 'Menu sluiten' : 'Menu openen'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <CloseIcon /> : <BurgerIcon />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown — alleen als geopend */}
      {mobileOpen && (
        <nav className="md:hidden border-t border-ink-600 bg-ink-900">
          <div className="max-w-3xl mx-auto px-2 py-2 flex flex-col gap-0.5">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${itemClasses(item.href)}`}
              >
                {item.label}
              </Link>
            ))}
            {user && !isMockMode() && (
              <button
                onClick={handleSignOut}
                className="mt-1 px-3 py-2.5 rounded-lg text-sm text-ink-200 hover:text-ink-50 hover:bg-ink-700 transition-colors text-left"
              >
                Uitloggen
              </button>
            )}
          </div>
        </nav>
      )}

      {isMockMode() && (
        <div className="bg-accent-orange/10 border-t border-accent-orange/30 text-accent-orange text-[10px] text-center py-1 tracking-wider uppercase">
          Dev mode — mock data
        </div>
      )}
    </header>
  )
}

function BurgerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
