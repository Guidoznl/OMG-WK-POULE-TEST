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
    // Twee aparte queries: matches+teams in één call, lock status in een tweede.
    // We berekenen status client-side op basis van kickoff_ams om join issues
    // met views te vermijden.
    let query = this.supabase
      .from('matches')
      .select(`
        *,
        home_team:home_team_id(*),
        away_team:away_team_id(*)
      `)
      .order('kickoff_ams')
    if (stageId) query = query.eq('stage_id', stageId)
    const { data, error } = await query
    if (error) {
      console.error('getMatches error:', error)
      return []
    }

    const now = Date.now()
    return (data || []).map((r: any) => {
      const kickoff = new Date(r.kickoff_ams).getTime()
      const lockAt = kickoff - 2 * 3600_000
      const hasResult = r.home_score !== null && r.away_score !== null

      let status: 'open' | 'locked' | 'in_progress' | 'finished'
      if (hasResult && r.result_locked) status = 'finished'
      else if (now >= kickoff) status = 'in_progress'
      else if (now >= lockAt) status = 'locked'
      else status = 'open'

      return {
        ...r,
        lock_at: new Date(lockAt).toISOString(),
        status,
        // Voor wedstrijden zonder bevestigd resultaat: scores verbergen
        home_score: r.result_locked ? r.home_score : null,
        away_score: r.result_locked ? r.away_score : null,
      }
    })
  }

  async getMatchdaySummaries(): Promise<MatchdaySummary[]> {
    const { data, error } = await this.supabase.from('matchday_summary').select('*')
    if (error) {
      console.error('getMatchdaySummaries error:', error)
      return []
    }
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

  async adminGetMatchOverview(): Promise<any[]> {
    // Roep SQL functie aan voor de status + counts, en haal apart de match data op
    const [overviewRes, matchesRes] = await Promise.all([
      this.supabase.rpc('admin_get_match_overview'),
      this.getMatches(),
    ])

    if (overviewRes.error) throw overviewRes.error

    // Combine: match data uit getMatches + state/counts uit RPC
    const overviewMap = new Map<number, any>()
    for (const row of (overviewRes.data || [])) {
      overviewMap.set(row.match_id, row)
    }

    return matchesRes.map(match => {
      const info = overviewMap.get(match.id) || {
        result_state: 'no_result', prediction_count: 0, exact_count: 0,
      }
      return {
        match,
        result_state: info.result_state,
        prediction_count: Number(info.prediction_count || 0),
        exact_count: Number(info.exact_count || 0),
      }
    })
  }

  async adminSaveProvisionalScore(matchId: number, home: number, away: number): Promise<void> {
    const { error } = await this.supabase.rpc('admin_save_provisional_score', {
      p_match_id: matchId, p_home: home, p_away: away,
    })
    if (error) throw new Error(error.message)
  }

  async adminGetPredictionsForMatch(matchId: number): Promise<any[]> {
    const { data, error } = await this.supabase.rpc('admin_get_predictions_for_match', {
      p_match_id: matchId,
    })
    if (error) throw new Error(error.message)
    return data || []
  }

  async adminConfirmAndScore(matchId: number): Promise<{ updated: number }> {
    const { data, error } = await this.supabase.rpc('admin_confirm_and_score', {
      p_match_id: matchId,
    })
    if (error) throw new Error(error.message)
    return { updated: Number(data || 0) }
  }

  async adminUnconfirm(matchId: number): Promise<void> {
    const { error } = await this.supabase.rpc('admin_unconfirm', {
      p_match_id: matchId,
    })
    if (error) throw new Error(error.message)
  }

  async adminClearScore(matchId: number): Promise<void> {
    const { error } = await this.supabase.rpc('admin_clear_score', {
      p_match_id: matchId,
    })
    if (error) throw new Error(error.message)
  }

  async adminGetBonusAnswers(): Promise<any[]> {
    const { data, error } = await this.supabase.rpc('admin_get_bonus_answers')
    if (error) throw new Error(error.message)
    return (data || []).map((row: any) => ({
      user_id: row.user_id,
      display_name: row.display_name,
      question_id: row.question_id,
      answer_raw: row.answer_raw,
      answer_normalized: row.answer_normalized,
      points_awarded: row.points_awarded,
    }))
  }

  async adminNormalizeAnswer(userId: string, questionId: number, normalized: string): Promise<void> {
    const { error } = await this.supabase.rpc('admin_normalize_answer', {
      p_user_id: userId, p_question_id: questionId, p_normalized: normalized,
    })
    if (error) throw new Error(error.message)
  }

  async adminSetBonusCorrectAnswer(questionId: number, correctAnswer: string): Promise<void> {
    const { error } = await this.supabase.rpc('admin_set_bonus_correct_answer', {
      p_question_id: questionId, p_correct: correctAnswer,
    })
    if (error) throw new Error(error.message)
  }

  async adminScoreBonusQuestion(questionId: number): Promise<{ updated: number }> {
    const { data, error } = await this.supabase.rpc('admin_score_bonus_question', {
      p_question_id: questionId,
    })
    if (error) throw new Error(error.message)
    return { updated: Number(data || 0) }
  }
}

let _instance: SupabaseProvider | null = null
export function getSupabaseProvider(): SupabaseProvider {
  if (!_instance) _instance = new SupabaseProvider()
  return _instance
}
