// Shared TypeScript types — match the database schema 1:1
// so we can flip between mock and Supabase without changing components.

export type Stage = {
  id: number
  name: string
  slug: string
  display_order: number
  points_exact: number
  points_winner: number
  points_goals: number
}

export type Team = {
  id: number
  name: string
  fifa_code: string
  iso_code: string | null
}

export type MatchStatus = 'open' | 'locked' | 'in_progress' | 'finished'

export type Match = {
  id: number
  stage_id: number
  matchday: number              // 1, 2, 3 within a group; 1 for knockout
  group_label: string | null
  home_team: Team | null
  away_team: Team | null
  placeholder_home: string | null
  placeholder_away: string | null
  kickoff_ams: string           // ISO timestamp
  lock_at: string               // ISO timestamp (kickoff - 2h)
  status: MatchStatus
  venue_name: string | null
  city_name: string | null
  country: string | null
  home_score: number | null
  away_score: number | null
  result_locked: boolean
}

export type Prediction = {
  match_id: number
  home_score: number
  away_score: number
  submitted_at: string
  points_awarded: number | null
}

export type Profile = {
  id: string
  display_name: string
  email: string
  is_admin: boolean
  accepted_terms_at: string | null
  accepted_terms_version: string | null
}

export type LeaderboardEntry = {
  user_id: string
  display_name: string
  total_points: number
  match_points: number
  bonus_points: number
  exact_predictions: number
  predicted_winner: string | null
  rank: number
}

export type GroupStanding = {
  group_label: string
  team_id: number
  team_fifa: string
  played: number
  points: number
  goals_for: number
  goals_against: number
  goal_difference: number
  rank: number
}

export type MatchdaySummary = {
  stage_id: number
  matchday: number
  match_count: number
  first_kickoff: string
  last_kickoff: string
  next_lock_at: string | null    // earliest lock time still in the future
  all_locked: boolean
}

// Bonus questions (the three "extras")
export type BonusQuestionType = 'team' | 'text' | 'number'

export type BonusQuestion = {
  id: number
  question_text: string
  question_type: BonusQuestionType
  points_exact: number
  points_close: number
  close_threshold: number
  display_order: number
  is_active: boolean
  correct_answer: string | null
}

export type BonusPrediction = {
  question_id: number
  answer_raw: string
  answer_normalized: string | null
  submitted_at: string
  points_awarded: number | null
}

// Version stored on profile so we know whether user accepted current terms
export const CURRENT_TERMS_VERSION = '2026-05-13-v1'

// ──────────────────────────────────────────────────────────────────────────
// ADMIN types
// ──────────────────────────────────────────────────────────────────────────

// Provisional vs confirmed result state for a match
export type MatchResultState =
  | 'no_result'           // no score entered yet
  | 'provisional'         // admin entered a score but hasn't confirmed
  | 'confirmed'           // confirmed, points distributed to predictions

// Admin match overview row
export type AdminMatchOverview = {
  match: Match
  result_state: MatchResultState
  prediction_count: number
  exact_count: number       // only meaningful after confirmation
}

// One user's bonus answer (admin view), with all raw values grouped
export type AdminBonusAnswer = {
  user_id: string
  display_name: string
  question_id: number
  answer_raw: string
  answer_normalized: string | null
  points_awarded: number | null
}

// ──────────────────────────────────────────────────────────────────────────
// Data provider interface
// ──────────────────────────────────────────────────────────────────────────
export interface DataProvider {
  getCurrentUser(): Promise<Profile | null>
  signInWithEmail(email: string): Promise<void>
  signOut(): Promise<void>
  acceptTerms(version: string): Promise<void>

  getStages(): Promise<Stage[]>
  getMatches(stageId?: number): Promise<Match[]>
  getMatchdaySummaries(): Promise<MatchdaySummary[]>
  getGroupStandings(groupLabel: string): Promise<GroupStanding[]>

  getMyPredictions(): Promise<Prediction[]>
  savePrediction(matchId: number, homeScore: number, awayScore: number): Promise<void>

  getBonusQuestions(): Promise<BonusQuestion[]>
  getMyBonusPredictions(): Promise<BonusPrediction[]>
  saveBonusPrediction(questionId: number, answer: string): Promise<void>

  getLeaderboard(): Promise<LeaderboardEntry[]>

  // ── Admin methods (require is_admin = true) ──
  adminGetMatchOverview(): Promise<AdminMatchOverview[]>
  adminSaveProvisionalScore(matchId: number, home: number, away: number): Promise<void>
  adminConfirmAndScore(matchId: number): Promise<{ updated: number }>
  adminUnconfirm(matchId: number): Promise<void>
  adminClearScore(matchId: number): Promise<void>
  adminGetBonusAnswers(): Promise<AdminBonusAnswer[]>
  adminNormalizeAnswer(userId: string, questionId: number, normalized: string): Promise<void>
  adminSetBonusCorrectAnswer(questionId: number, correctAnswer: string): Promise<void>
  adminScoreBonusQuestion(questionId: number): Promise<{ updated: number }>

  devSwitchUser?(userId: string): Promise<void>
  devListUsers?(): Promise<Profile[]>
}
