// Factory: returns the active DataProvider based on the NEXT_PUBLIC_DATA_MODE env var.
//
// 'mock' (default) -> in-memory + localStorage, no backend needed
// 'supabase'       -> uses your Supabase project

import { DataProvider } from './types'
import { getMockProvider } from './mock-provider'
import { getSupabaseProvider } from './supabase-provider'

export function getDataProvider(): DataProvider {
  const mode = process.env.NEXT_PUBLIC_DATA_MODE || 'mock'
  if (mode === 'supabase') return getSupabaseProvider()
  return getMockProvider()
}

export function isMockMode(): boolean {
  return (process.env.NEXT_PUBLIC_DATA_MODE || 'mock') === 'mock'
}
