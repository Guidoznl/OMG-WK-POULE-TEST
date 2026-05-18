'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export type Theme = 'dark' | 'pink'

type ThemeContextValue = {
  theme: Theme
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  setTheme: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark')

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('wkpool_theme')
      if (saved === 'dark' || saved === 'pink') {
        setThemeState(saved)
      }
    } catch {}
  }, [])

  // Apply theme to <html> as data-attribute so CSS variables switch
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  function setTheme(t: Theme) {
    setThemeState(t)
    try {
      window.localStorage.setItem('wkpool_theme', t)
    } catch {}
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
