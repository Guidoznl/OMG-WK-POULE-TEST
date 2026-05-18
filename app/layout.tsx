import type { Metadata } from 'next'
import '@/styles/globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'

export const metadata: Metadata = {
  title: 'OppoSuits WK Poule \'26',
  description: 'Interne WK 2026 voorspellingenpoule',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" data-theme="dark">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
