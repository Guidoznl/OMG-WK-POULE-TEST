// Supabase data provider — used when NEXT_PUBLIC_DATA_MODE=supabase.
// All methods map to the same DataProvider interface as the mock provider,
// so UI components don't change between dev and prod.

import { createBrowserClient } from '@supabase/ssr'
import {
  DataProvider, Match, Prediction, Profile, Stage,
  GroupStanding, LeaderboardEntry, MatchdaySummary,
  BonusQuestion, BonusPrediction,
} from './types'

class SupabaseProvider implements DataProvider {
  private supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async getCurrentUser(): Promise<Profile | null> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) return null
    const { data } = await this.supabase
      .from('profiles').select('*').eq('id', user.id).single()
    return data
  }

  async signInWithPassword(email: string, password: string): Promise<void> {
    const { error } = await this.supabase.auth.signInWithPassword({ email, password })
    if (error) {
      // Geef gebruiksvriendelijke errors in plaats van rauwe Supabase strings
      if (error.message.toLowerCase().includes('invalid login')) {
        throw new Error('Verkeerd email-adres of wachtwoord')
      }
      if (error.message.toLowerCase().includes('email not confirmed')) {
        throw new Error('Bevestig eerst je email-adres (check je mail)')
      }
      throw error
    }
  }

  async signUpWithPassword(email: string, password: string, displayName: string): Promise<void> {
    const { error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: `${window.location.origin}/predictions`,
      },
    })
    if (error) {
      if (error.message.toLowerCase().includes('already registered')) {
        throw new Error('Dit email-adres is al geregistreerd — gebruik "Inloggen"')
      }
      if (error.message.toLowerCase().includes('password')) {
        throw new Error('Wachtwoord moet minimaal 6 tekens zijn')
      }
      throw error
    }
  }

  async signOut(): Promise<void> {
    await this.supabase.auth.signOut()
  }

  async acceptTerms(version: string): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('Niet ingelogd')
    const { error } = await this.supabase
      .from('profiles')
      .update({
        accepted_terms_at: new Date().toISOString(),
        accepted_terms_version: version,
      })
      .eq('id', user.id)
    if (error) throw error
  }

  async getStages(): Promise<Stage[]> {
    const { data } = await this.supabase
      .from('stages').select('*').order('display_order')
    return data || []
  }

  async getMatches(stageId?: number): Promise<Match[]> {
    let query = this.supabase
      .from('matches')
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(*),
        away_team:teams!matches_away_team_id_fkey(*),
        lock_status:match_lock_status!inner(lock_at, status)
      `)
      .order('kickoff_ams')
    if (stageId) query = query.eq('stage_id', stageId)
    const { data } = await query
    return (data || []).map((r: any) => ({
      ...r,
      lock_at: r.lock_status?.lock_at,
      status: r.lock_status?.status,
    }))
  }

  async getMatchdaySummaries(): Promise<MatchdaySummary[]> {
    const { data } = await this.supabase.from('matchday_summary').select('*')
    return data || []
  }

  async getGroupStandings(groupLabel: string): Promise<GroupStanding[]> {
    const { data } = await this.supabase
      .from('group_standings')
      .select('*, team:teams(fifa_code)')
      .eq('group_label', groupLabel)
      .order('rank')
    return (data || []).map((r: any) => ({ ...r, team_fifa: r.team?.fifa_code || '' }))
  }

  async getMyPredictions(): Promise<Prediction[]> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) return []
    const { data } = await this.supabase
      .from('predictions').select('*').eq('user_id', user.id)
    return data || []
  }

  async savePrediction(matchId: number, home: number, away: number): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('Niet ingelogd')
    const { error } = await this.supabase.from('predictions').upsert({
      user_id: user.id,
      match_id: matchId,
      home_score: home,
      away_score: away,
    }, { onConflict: 'user_id,match_id' })
    if (error) throw error
  }

  async getBonusQuestions(): Promise<BonusQuestion[]> {
    const { data } = await this.supabase
      .from('bonus_questions')
      .select('*')
      .eq('is_active', true)
      .order('display_order')
    return data || []
  }

  async getMyBonusPredictions(): Promise<BonusPrediction[]> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) return []
    const { data } = await this.supabase
      .from('bonus_predictions').select('*').eq('user_id', user.id)
    return data || []
  }

  async saveBonusPrediction(questionId: number, answer: string): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('Niet ingelogd')
    const { error } = await this.supabase.from('bonus_predictions').upsert({
      user_id: user.id,
      question_id: questionId,
      answer_raw: answer,
    }, { onConflict: 'user_id,question_id' })
    if (error) throw error
  }

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    const { data } = await this.supabase
      .from('leaderboard').select('*').order('rank')
    return data || []
  }

  // ── Admin methods (TODO: wire up against the SQL functions) ──
  // For now these throw "not implemented" so the UI handles it cleanly.
  // When you go to production, implement these against the matches/predictions
  // tables and the score_match_predictions() SQL function from migration 001.

  async adminGetMatchOverview(): Promise<any[]> {
    throw new Error('Supabase admin methods nog niet geïmplementeerd. Gebruik mock mode om de admin UI te testen.')
  }
  async adminSaveProvisionalScore(): Promise<void> {
    throw new Error('Niet geïmplementeerd in Supabase provider')
  }
  async adminConfirmAndScore(): Promise<{ updated: number }> {
    throw new Error('Niet geïmplementeerd in Supabase provider')
  }
  async adminUnconfirm(): Promise<void> {
    throw new Error('Niet geïmplementeerd in Supabase provider')
  }
  async adminClearScore(): Promise<void> {
    throw new Error('Niet geïmplementeerd in Supabase provider')
  }
  async adminGetBonusAnswers(): Promise<any[]> {
    throw new Error('Niet geïmplementeerd in Supabase provider')
  }
  async adminNormalizeAnswer(): Promise<void> {
    throw new Error('Niet geïmplementeerd in Supabase provider')
  }
  async adminSetBonusCorrectAnswer(): Promise<void> {
    throw new Error('Niet geïmplementeerd in Supabase provider')
  }
  async adminScoreBonusQuestion(): Promise<{ updated: number }> {
    throw new Error('Niet geïmplementeerd in Supabase provider')
  }
}

let _instance: SupabaseProvider | null = null
export function getSupabaseProvider(): SupabaseProvider {
  if (!_instance) _instance = new SupabaseProvider()
  return _instance
}
