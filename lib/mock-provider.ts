// Mock data provider — works entirely in-memory with localStorage persistence.
// Use this to develop and test the UI without setting up Supabase.
//
// Contains the full 2026 World Cup group stage (48 teams, 12 groups, 72 matches)
// and 4 test users with pre-filled predictions.

import {
  DataProvider, Match, Prediction, Profile, Stage,
  GroupStanding, LeaderboardEntry, Team, MatchStatus, MatchdaySummary,
  BonusQuestion, BonusPrediction,
  AdminMatchOverview, AdminBonusAnswer, MatchResultState,
} from './types'

// ---------------------------------------------------------------------------
// Static seed data
// ---------------------------------------------------------------------------

const STAGES: Stage[] = [
  { id: 1, name: 'Group Stage',     slug: 'group-stage',  display_order: 1, points_exact: 10, points_winner: 4, points_goals: 1 },
  { id: 2, name: 'Round of 32',     slug: 'round-of-32',  display_order: 2, points_exact: 15, points_winner: 6, points_goals: 2 },
  { id: 3, name: 'Round of 16',     slug: 'round-of-16',  display_order: 3, points_exact: 20, points_winner: 8, points_goals: 2 },
  { id: 4, name: 'Quarterfinals',   slug: 'quarterfinals',display_order: 4, points_exact: 30, points_winner: 12, points_goals: 3 },
  { id: 5, name: 'Semifinals',      slug: 'semifinals',   display_order: 5, points_exact: 40, points_winner: 16, points_goals: 4 },
  { id: 6, name: 'Third Place',     slug: 'third-place',  display_order: 6, points_exact: 30, points_winner: 12, points_goals: 3 },
  { id: 7, name: 'Final',           slug: 'final',        display_order: 7, points_exact: 60, points_winner: 24, points_goals: 6 },
]

// All 48 teams from the CSV
const TEAMS: Team[] = [
  { id:  1, name: 'Mexico', fifa_code: 'MEX', iso_code: 'mx' },
  { id:  2, name: 'South Africa', fifa_code: 'RSA', iso_code: 'za' },
  { id:  3, name: 'South Korea', fifa_code: 'KOR', iso_code: 'kr' },
  { id:  4, name: 'Czechia', fifa_code: 'CZE', iso_code: 'cz' },
  { id:  5, name: 'Canada', fifa_code: 'CAN', iso_code: 'ca' },
  { id:  6, name: 'Bosnia And Herzegovina', fifa_code: 'BOS', iso_code: 'ba' },
  { id:  7, name: 'Qatar', fifa_code: 'QAT', iso_code: 'qa' },
  { id:  8, name: 'Switzerland', fifa_code: 'SUI', iso_code: 'ch' },
  { id:  9, name: 'Brazil', fifa_code: 'BRA', iso_code: 'br' },
  { id: 10, name: 'Morocco', fifa_code: 'MAR', iso_code: 'ma' },
  { id: 11, name: 'Haiti', fifa_code: 'HAI', iso_code: 'ht' },
  { id: 12, name: 'Scotland', fifa_code: 'SCO', iso_code: 'gb-sct' },
  { id: 13, name: 'USA', fifa_code: 'USA', iso_code: 'us' },
  { id: 14, name: 'Paraguay', fifa_code: 'PAR', iso_code: 'py' },
  { id: 15, name: 'Australia', fifa_code: 'AUS', iso_code: 'au' },
  { id: 16, name: 'Turkiye', fifa_code: 'TUR', iso_code: 'tr' },
  { id: 17, name: 'Germany', fifa_code: 'GER', iso_code: 'de' },
  { id: 18, name: 'Curacao', fifa_code: 'CUR', iso_code: 'cw' },
  { id: 19, name: "Cote d'Ivoire", fifa_code: 'CIV', iso_code: 'ci' },
  { id: 20, name: 'Ecuador', fifa_code: 'ECU', iso_code: 'ec' },
  { id: 21, name: 'Netherlands', fifa_code: 'NED', iso_code: 'nl' },
  { id: 22, name: 'Japan', fifa_code: 'JPN', iso_code: 'jp' },
  { id: 23, name: 'Sweden', fifa_code: 'SWE', iso_code: 'se' },
  { id: 24, name: 'Tunisia', fifa_code: 'TUN', iso_code: 'tn' },
  { id: 25, name: 'Belgium', fifa_code: 'BEL', iso_code: 'be' },
  { id: 26, name: 'Egypt', fifa_code: 'EGY', iso_code: 'eg' },
  { id: 27, name: 'IR Iran', fifa_code: 'IRN', iso_code: 'ir' },
  { id: 28, name: 'New Zealand', fifa_code: 'NZL', iso_code: 'nz' },
  { id: 29, name: 'Spain', fifa_code: 'ESP', iso_code: 'es' },
  { id: 30, name: 'Cabo Verde', fifa_code: 'CPV', iso_code: 'cv' },
  { id: 31, name: 'Saudi Arabia', fifa_code: 'KSA', iso_code: 'sa' },
  { id: 32, name: 'Uruguay', fifa_code: 'URU', iso_code: 'uy' },
  { id: 33, name: 'France', fifa_code: 'FRA', iso_code: 'fr' },
  { id: 34, name: 'Senegal', fifa_code: 'SEN', iso_code: 'sn' },
  { id: 35, name: 'Iraq', fifa_code: 'IRQ', iso_code: 'iq' },
  { id: 36, name: 'Norway', fifa_code: 'NOR', iso_code: 'no' },
  { id: 37, name: 'Argentina', fifa_code: 'ARG', iso_code: 'ar' },
  { id: 38, name: 'Algeria', fifa_code: 'ALG', iso_code: 'dz' },
  { id: 39, name: 'Austria', fifa_code: 'AUT', iso_code: 'at' },
  { id: 40, name: 'Jordan', fifa_code: 'JOR', iso_code: 'jo' },
  { id: 41, name: 'Portugal', fifa_code: 'POR', iso_code: 'pt' },
  { id: 42, name: 'Congo-Kinshasa', fifa_code: 'CNG', iso_code: 'cd' },
  { id: 43, name: 'Uzbekistan', fifa_code: 'UZB', iso_code: 'uz' },
  { id: 44, name: 'Colombia', fifa_code: 'COL', iso_code: 'co' },
  { id: 45, name: 'England', fifa_code: 'ENG', iso_code: 'gb-eng' },
  { id: 46, name: 'Croatia', fifa_code: 'CRO', iso_code: 'hr' },
  { id: 47, name: 'Ghana', fifa_code: 'GHA', iso_code: 'gh' },
  { id: 48, name: 'Panama', fifa_code: 'PAN', iso_code: 'pa' },
]

const findTeam = (id: number) => TEAMS.find(t => t.id === id) || null

// "Now" anchor. Match 1 = -24h, match 2 = -1h, rest in future.
const NOW = Date.now()
const hoursFromNow = (h: number) => new Date(NOW + h * 3600_000).toISOString()

type RawMatch = {
  id: number; stage_id: number; group_label: string; home_id: number; away_id: number;
  offset: number; venue: string; city: string; country: string;
  home_score: number | null; away_score: number | null;
}

const MATCHES_RAW: RawMatch[] = [
  { id: 1, stage_id: 1, group_label: 'Group A', home_id: 1, away_id: 2, offset: -24, venue: 'Estadio Azteca', city: 'Mexico City', country: 'Mexico', home_score: null, away_score: null },
  { id: 2, stage_id: 1, group_label: 'Group A', home_id: 3, away_id: 4, offset: -1, venue: 'Estadio Akron', city: 'Guadalajara', country: 'Mexico', home_score: null, away_score: null },
  { id: 3, stage_id: 1, group_label: 'Group B', home_id: 5, away_id: 6, offset: 4, venue: 'BMO Field', city: 'Toronto', country: 'Canada', home_score: null, away_score: null },
  { id: 4, stage_id: 1, group_label: 'Group D', home_id: 13, away_id: 14, offset: 8, venue: 'SoFi Stadium', city: 'Los Angeles', country: 'USA', home_score: null, away_score: null },
  { id: 5, stage_id: 1, group_label: 'Group B', home_id: 7, away_id: 8, offset: 26, venue: "Levi's Stadium", city: 'San Francisco Bay Area', country: 'USA', home_score: null, away_score: null },
  { id: 6, stage_id: 1, group_label: 'Group C', home_id: 9, away_id: 10, offset: 26, venue: 'MetLife Stadium', city: 'New York/New Jersey', country: 'USA', home_score: null, away_score: null },
  { id: 7, stage_id: 1, group_label: 'Group C', home_id: 11, away_id: 12, offset: 29, venue: 'Gillette Stadium', city: 'Boston', country: 'USA', home_score: null, away_score: null },
  { id: 8, stage_id: 1, group_label: 'Group D', home_id: 15, away_id: 16, offset: 35, venue: 'BC Place', city: 'Vancouver', country: 'Canada', home_score: null, away_score: null },
  { id: 9, stage_id: 1, group_label: 'Group E', home_id: 17, away_id: 18, offset: 46, venue: 'NRG Stadium', city: 'Houston', country: 'USA', home_score: null, away_score: null },
  { id: 10, stage_id: 1, group_label: 'Group F', home_id: 21, away_id: 22, offset: 49, venue: 'AT&T Stadium', city: 'Dallas', country: 'USA', home_score: null, away_score: null },
  { id: 11, stage_id: 1, group_label: 'Group E', home_id: 19, away_id: 20, offset: 51, venue: 'Lincoln Financial Field', city: 'Philadelphia', country: 'USA', home_score: null, away_score: null },
  { id: 12, stage_id: 1, group_label: 'Group F', home_id: 23, away_id: 24, offset: 55, venue: 'Estadio BBVA', city: 'Monterrey', country: 'Mexico', home_score: null, away_score: null },
  { id: 13, stage_id: 1, group_label: 'Group H', home_id: 29, away_id: 30, offset: 68, venue: 'Mercedes-Benz Stadium', city: 'Atlanta', country: 'USA', home_score: null, away_score: null },
  { id: 14, stage_id: 1, group_label: 'Group G', home_id: 25, away_id: 26, offset: 74, venue: 'Lumen Field', city: 'Seattle', country: 'USA', home_score: null, away_score: null },
  { id: 15, stage_id: 1, group_label: 'Group H', home_id: 31, away_id: 32, offset: 74, venue: 'Hard Rock Stadium', city: 'Miami', country: 'USA', home_score: null, away_score: null },
  { id: 16, stage_id: 1, group_label: 'Group G', home_id: 27, away_id: 28, offset: 80, venue: 'SoFi Stadium', city: 'Los Angeles', country: 'USA', home_score: null, away_score: null },
  { id: 17, stage_id: 1, group_label: 'Group I', home_id: 33, away_id: 34, offset: 95, venue: 'MetLife Stadium', city: 'New York/New Jersey', country: 'USA', home_score: null, away_score: null },
  { id: 18, stage_id: 1, group_label: 'Group I', home_id: 35, away_id: 36, offset: 98, venue: 'Gillette Stadium', city: 'Boston', country: 'USA', home_score: null, away_score: null },
  { id: 19, stage_id: 1, group_label: 'Group J', home_id: 37, away_id: 38, offset: 102, venue: 'Arrowhead Stadium', city: 'Kansas City', country: 'USA', home_score: null, away_score: null },
  { id: 20, stage_id: 1, group_label: 'Group J', home_id: 39, away_id: 40, offset: 107, venue: "Levi's Stadium", city: 'San Francisco Bay Area', country: 'USA', home_score: null, away_score: null },
  { id: 21, stage_id: 1, group_label: 'Group K', home_id: 41, away_id: 42, offset: 118, venue: 'NRG Stadium', city: 'Houston', country: 'USA', home_score: null, away_score: null },
  { id: 22, stage_id: 1, group_label: 'Group L', home_id: 45, away_id: 46, offset: 121, venue: 'AT&T Stadium', city: 'Dallas', country: 'USA', home_score: null, away_score: null },
  { id: 23, stage_id: 1, group_label: 'Group L', home_id: 47, away_id: 48, offset: 123, venue: 'BMO Field', city: 'Toronto', country: 'Canada', home_score: null, away_score: null },
  { id: 24, stage_id: 1, group_label: 'Group K', home_id: 43, away_id: 44, offset: 127, venue: 'Estadio Azteca', city: 'Mexico City', country: 'Mexico', home_score: null, away_score: null },
  { id: 25, stage_id: 1, group_label: 'Group A', home_id: 4, away_id: 2, offset: 140, venue: 'Mercedes-Benz Stadium', city: 'Atlanta', country: 'USA', home_score: null, away_score: null },
  { id: 26, stage_id: 1, group_label: 'Group B', home_id: 8, away_id: 6, offset: 146, venue: 'SoFi Stadium', city: 'Los Angeles', country: 'USA', home_score: null, away_score: null },
  { id: 27, stage_id: 1, group_label: 'Group B', home_id: 5, away_id: 7, offset: 149, venue: 'BC Place', city: 'Vancouver', country: 'Canada', home_score: null, away_score: null },
  { id: 28, stage_id: 1, group_label: 'Group A', home_id: 1, away_id: 3, offset: 150, venue: 'Estadio Akron', city: 'Guadalajara', country: 'Mexico', home_score: null, away_score: null },
  { id: 29, stage_id: 1, group_label: 'Group D', home_id: 13, away_id: 15, offset: 170, venue: 'Lumen Field', city: 'Seattle', country: 'USA', home_score: null, away_score: null },
  { id: 30, stage_id: 1, group_label: 'Group C', home_id: 12, away_id: 10, offset: 170, venue: 'Gillette Stadium', city: 'Boston', country: 'USA', home_score: null, away_score: null },
  { id: 31, stage_id: 1, group_label: 'Group C', home_id: 9, away_id: 11, offset: 173, venue: 'Lincoln Financial Field', city: 'Philadelphia', country: 'USA', home_score: null, away_score: null },
  { id: 32, stage_id: 1, group_label: 'Group D', home_id: 16, away_id: 14, offset: 179, venue: "Levi's Stadium", city: 'San Francisco Bay Area', country: 'USA', home_score: null, away_score: null },
  { id: 33, stage_id: 1, group_label: 'Group F', home_id: 21, away_id: 23, offset: 190, venue: 'NRG Stadium', city: 'Houston', country: 'USA', home_score: null, away_score: null },
  { id: 34, stage_id: 1, group_label: 'Group E', home_id: 17, away_id: 19, offset: 192, venue: 'BMO Field', city: 'Toronto', country: 'Canada', home_score: null, away_score: null },
  { id: 35, stage_id: 1, group_label: 'Group E', home_id: 20, away_id: 18, offset: 197, venue: 'Arrowhead Stadium', city: 'Kansas City', country: 'USA', home_score: null, away_score: null },
  { id: 36, stage_id: 1, group_label: 'Group F', home_id: 24, away_id: 22, offset: 201, venue: 'Estadio BBVA', city: 'Monterrey', country: 'Mexico', home_score: null, away_score: null },
  { id: 37, stage_id: 1, group_label: 'Group H', home_id: 29, away_id: 31, offset: 212, venue: 'Mercedes-Benz Stadium', city: 'Atlanta', country: 'USA', home_score: null, away_score: null },
  { id: 38, stage_id: 1, group_label: 'Group G', home_id: 25, away_id: 27, offset: 218, venue: 'SoFi Stadium', city: 'Los Angeles', country: 'USA', home_score: null, away_score: null },
  { id: 39, stage_id: 1, group_label: 'Group H', home_id: 32, away_id: 30, offset: 218, venue: 'Hard Rock Stadium', city: 'Miami', country: 'USA', home_score: null, away_score: null },
  { id: 40, stage_id: 1, group_label: 'Group G', home_id: 28, away_id: 26, offset: 224, venue: 'BC Place', city: 'Vancouver', country: 'Canada', home_score: null, away_score: null },
  { id: 41, stage_id: 1, group_label: 'Group J', home_id: 37, away_id: 39, offset: 238, venue: 'AT&T Stadium', city: 'Dallas', country: 'USA', home_score: null, away_score: null },
  { id: 42, stage_id: 1, group_label: 'Group I', home_id: 33, away_id: 35, offset: 241, venue: 'Lincoln Financial Field', city: 'Philadelphia', country: 'USA', home_score: null, away_score: null },
  { id: 43, stage_id: 1, group_label: 'Group I', home_id: 36, away_id: 34, offset: 244, venue: 'MetLife Stadium', city: 'New York/New Jersey', country: 'USA', home_score: null, away_score: null },
  { id: 44, stage_id: 1, group_label: 'Group J', home_id: 40, away_id: 38, offset: 250, venue: "Levi's Stadium", city: 'San Francisco Bay Area', country: 'USA', home_score: null, away_score: null },
  { id: 45, stage_id: 1, group_label: 'Group K', home_id: 41, away_id: 43, offset: 262, venue: 'NRG Stadium', city: 'Houston', country: 'USA', home_score: null, away_score: null },
  { id: 46, stage_id: 1, group_label: 'Group L', home_id: 45, away_id: 47, offset: 264, venue: 'Gillette Stadium', city: 'Boston', country: 'USA', home_score: null, away_score: null },
  { id: 47, stage_id: 1, group_label: 'Group L', home_id: 48, away_id: 46, offset: 267, venue: 'BMO Field', city: 'Toronto', country: 'Canada', home_score: null, away_score: null },
  { id: 48, stage_id: 1, group_label: 'Group K', home_id: 44, away_id: 42, offset: 271, venue: 'Estadio Akron', city: 'Guadalajara', country: 'Mexico', home_score: null, away_score: null },
  { id: 49, stage_id: 1, group_label: 'Group B', home_id: 8, away_id: 5, offset: 290, venue: 'BC Place', city: 'Vancouver', country: 'Canada', home_score: null, away_score: null },
  { id: 50, stage_id: 1, group_label: 'Group B', home_id: 6, away_id: 7, offset: 290, venue: 'Lumen Field', city: 'Seattle', country: 'USA', home_score: null, away_score: null },
  { id: 51, stage_id: 1, group_label: 'Group C', home_id: 12, away_id: 9, offset: 290, venue: 'Hard Rock Stadium', city: 'Miami', country: 'USA', home_score: null, away_score: null },
  { id: 52, stage_id: 1, group_label: 'Group C', home_id: 10, away_id: 11, offset: 290, venue: 'Mercedes-Benz Stadium', city: 'Atlanta', country: 'USA', home_score: null, away_score: null },
  { id: 53, stage_id: 1, group_label: 'Group A', home_id: 4, away_id: 1, offset: 294, venue: 'Estadio Azteca', city: 'Mexico City', country: 'Mexico', home_score: null, away_score: null },
  { id: 54, stage_id: 1, group_label: 'Group A', home_id: 2, away_id: 3, offset: 294, venue: 'Estadio BBVA', city: 'Monterrey', country: 'Mexico', home_score: null, away_score: null },
  { id: 55, stage_id: 1, group_label: 'Group E', home_id: 18, away_id: 19, offset: 312, venue: 'Lincoln Financial Field', city: 'Philadelphia', country: 'USA', home_score: null, away_score: null },
  { id: 56, stage_id: 1, group_label: 'Group E', home_id: 20, away_id: 17, offset: 312, venue: 'MetLife Stadium', city: 'New York/New Jersey', country: 'USA', home_score: null, away_score: null },
  { id: 57, stage_id: 1, group_label: 'Group F', home_id: 22, away_id: 23, offset: 316, venue: 'AT&T Stadium', city: 'Dallas', country: 'USA', home_score: null, away_score: null },
  { id: 58, stage_id: 1, group_label: 'Group F', home_id: 24, away_id: 21, offset: 316, venue: 'Arrowhead Stadium', city: 'Kansas City', country: 'USA', home_score: null, away_score: null },
  { id: 59, stage_id: 1, group_label: 'Group D', home_id: 16, away_id: 13, offset: 321, venue: 'SoFi Stadium', city: 'Los Angeles', country: 'USA', home_score: null, away_score: null },
  { id: 60, stage_id: 1, group_label: 'Group D', home_id: 14, away_id: 15, offset: 321, venue: "Levi's Stadium", city: 'San Francisco Bay Area', country: 'USA', home_score: null, away_score: null },
  { id: 61, stage_id: 1, group_label: 'Group I', home_id: 36, away_id: 33, offset: 335, venue: 'Gillette Stadium', city: 'Boston', country: 'USA', home_score: null, away_score: null },
  { id: 62, stage_id: 1, group_label: 'Group I', home_id: 34, away_id: 35, offset: 335, venue: 'BMO Field', city: 'Toronto', country: 'Canada', home_score: null, away_score: null },
  { id: 63, stage_id: 1, group_label: 'Group H', home_id: 30, away_id: 31, offset: 341, venue: 'NRG Stadium', city: 'Houston', country: 'USA', home_score: null, away_score: null },
  { id: 64, stage_id: 1, group_label: 'Group H', home_id: 32, away_id: 29, offset: 341, venue: 'Estadio Akron', city: 'Guadalajara', country: 'Mexico', home_score: null, away_score: null },
  { id: 65, stage_id: 1, group_label: 'Group G', home_id: 26, away_id: 27, offset: 346, venue: 'Lumen Field', city: 'Seattle', country: 'USA', home_score: null, away_score: null },
  { id: 66, stage_id: 1, group_label: 'Group G', home_id: 28, away_id: 25, offset: 346, venue: 'BC Place', city: 'Vancouver', country: 'Canada', home_score: null, away_score: null },
  { id: 67, stage_id: 1, group_label: 'Group L', home_id: 48, away_id: 45, offset: 361, venue: 'MetLife Stadium', city: 'New York/New Jersey', country: 'USA', home_score: null, away_score: null },
  { id: 68, stage_id: 1, group_label: 'Group L', home_id: 46, away_id: 47, offset: 361, venue: 'Lincoln Financial Field', city: 'Philadelphia', country: 'USA', home_score: null, away_score: null },
  { id: 69, stage_id: 1, group_label: 'Group K', home_id: 44, away_id: 41, offset: 363.5, venue: 'Hard Rock Stadium', city: 'Miami', country: 'USA', home_score: null, away_score: null },
  { id: 70, stage_id: 1, group_label: 'Group K', home_id: 42, away_id: 43, offset: 363.5, venue: 'Mercedes-Benz Stadium', city: 'Atlanta', country: 'USA', home_score: null, away_score: null },
  { id: 71, stage_id: 1, group_label: 'Group J', home_id: 38, away_id: 39, offset: 367, venue: 'Arrowhead Stadium', city: 'Kansas City', country: 'USA', home_score: null, away_score: null },
  { id: 72, stage_id: 1, group_label: 'Group J', home_id: 40, away_id: 37, offset: 367, venue: 'AT&T Stadium', city: 'Dallas', country: 'USA', home_score: null, away_score: null },
]

// ---------------------------------------------------------------------------
// Compute matchday per group (1, 2, or 3) based on chronological order
// ---------------------------------------------------------------------------
function computeMatchday(rawId: number): number {
  const raw = MATCHES_RAW.find(m => m.id === rawId)!
  if (raw.stage_id > 1) return 1
  // Within the group, sort matches by offset and find this match's index
  const groupMatches = MATCHES_RAW
    .filter(m => m.group_label === raw.group_label)
    .sort((a, b) => a.offset - b.offset)
  return groupMatches.findIndex(m => m.id === rawId) + 1
}

// Build the full Match array including derived status + lock_at
function buildMatch(raw: RawMatch, adminOverlay?: AdminResultStorage): Match {
  const kickoffMs = NOW + raw.offset * 3600_000
  const lockMs = kickoffMs - 2 * 3600_000
  const now = Date.now()

  // All results (including pre-seeded ones) go through the admin overlay.
  // This guarantees that clear/unconfirm can ALWAYS reach the data — there
  // is no "hardcoded baseline" that the admin can't touch.
  let homeScore: number | null = null
  let awayScore: number | null = null
  let resultLocked = false
  let resultState: MatchResultState = 'no_result'

  if (adminOverlay && adminOverlay[raw.id]) {
    homeScore = adminOverlay[raw.id].home
    awayScore = adminOverlay[raw.id].away
    resultState = adminOverlay[raw.id].state
    resultLocked = resultState === 'confirmed'
  }

  const hasConfirmedResult = resultState === 'confirmed' && homeScore !== null && awayScore !== null

  let status: MatchStatus
  if (hasConfirmedResult) status = 'finished'
  else if (now >= kickoffMs) status = 'in_progress'
  else if (now >= lockMs) status = 'locked'
  else status = 'open'

  return {
    id: raw.id,
    stage_id: raw.stage_id,
    matchday: computeMatchday(raw.id),
    group_label: raw.group_label,
    home_team: findTeam(raw.home_id),
    away_team: findTeam(raw.away_id),
    placeholder_home: null,
    placeholder_away: null,
    kickoff_ams: new Date(kickoffMs).toISOString(),
    lock_at: new Date(lockMs).toISOString(),
    status,
    venue_name: raw.venue,
    city_name: raw.city,
    country: raw.country,
    home_score: hasConfirmedResult ? homeScore : null, // only show score on tile when confirmed
    away_score: hasConfirmedResult ? awayScore : null,
    result_locked: resultLocked,
  }
}

// Module-level pre-computed MATCHES (without admin overlay) — used only for
// computing leaderboard exact_predictions where we cross-reference stage info.
// All UI-facing calls go through the class methods which apply admin overlay.
const MATCHES: Match[] = MATCHES_RAW.map(r => buildMatch(r))

// Bonus questions (the three extras)
const BONUS_QUESTIONS: BonusQuestion[] = [
  { id: 1, question_text: 'Wie wordt WK kampioen?',           question_type: 'team',   points_exact: 50,  points_close: 0,  close_threshold: 0, display_order: 1, is_active: true, correct_answer: null },
  { id: 2, question_text: 'Wie wordt topscorer van het toernooi?', question_type: 'text',   points_exact: 20,  points_close: 0,  close_threshold: 0, display_order: 2, is_active: true, correct_answer: null },
  { id: 3, question_text: 'Hoe vaak komt Jelle in beeld?',    question_type: 'number', points_exact: 100, points_close: 25, close_threshold: 3, display_order: 3, is_active: true, correct_answer: null },
]

const TEST_USERS: Profile[] = [
  { id: 'user-jan',   display_name: 'Jan K.',     email: 'jan@opposuits.com',   is_admin: false, accepted_terms_at: new Date(NOW - 86_400_000).toISOString(), accepted_terms_version: '2026-05-13-v1' },
  { id: 'user-sara',  display_name: 'Sara M.',    email: 'sara@opposuits.com',  is_admin: false, accepted_terms_at: new Date(NOW - 86_400_000).toISOString(), accepted_terms_version: '2026-05-13-v1' },
  { id: 'user-tom',   display_name: 'Tom (admin)',email: 'tom@opposuits.com',   is_admin: true,  accepted_terms_at: new Date(NOW - 86_400_000).toISOString(), accepted_terms_version: '2026-05-13-v1' },
  { id: 'user-lisa',  display_name: 'Lisa',       email: 'lisa@opposuits.com',  is_admin: false, accepted_terms_at: null, accepted_terms_version: null },  // hasn't accepted yet
]

const INITIAL_PREDICTIONS: Record<string, Prediction[]> = {
  'user-jan': [
    { match_id: 1, home_score: 2, away_score: 1, submitted_at: hoursFromNow(-48), points_awarded: 10 },
    { match_id: 2, home_score: 1, away_score: 1, submitted_at: hoursFromNow(-12), points_awarded: null },
  ],
  'user-sara': [
    { match_id: 1, home_score: 1, away_score: 0, submitted_at: hoursFromNow(-48), points_awarded: 4 },
    { match_id: 2, home_score: 2, away_score: 0, submitted_at: hoursFromNow(-10), points_awarded: null },
  ],
  'user-tom': [
    { match_id: 1, home_score: 2, away_score: 1, submitted_at: hoursFromNow(-48), points_awarded: 10 },
  ],
  'user-lisa': [],
}

const INITIAL_BONUS: Record<string, BonusPrediction[]> = {
  'user-jan': [
    { question_id: 1, answer_raw: 'Brazil', answer_normalized: 'Brazil', submitted_at: hoursFromNow(-48), points_awarded: null },
    { question_id: 2, answer_raw: 'Kylian Mbappé', answer_normalized: 'Kylian Mbappé', submitted_at: hoursFromNow(-48), points_awarded: null },
    { question_id: 3, answer_raw: '14', answer_normalized: '14', submitted_at: hoursFromNow(-48), points_awarded: null },
  ],
  'user-sara': [
    { question_id: 1, answer_raw: 'Netherlands', answer_normalized: 'Netherlands', submitted_at: hoursFromNow(-48), points_awarded: null },
  ],
  'user-tom': [],
  'user-lisa': [],
}

// Seed for admin overlay: match 1 is already played and confirmed (2-1).
// This used to be hardcoded in MATCHES_RAW, but that made the admin unable
// to clear/unconfirm it. Now it goes through the same overlay as anything
// an admin enters, so clear and unconfirm work consistently.
const INITIAL_ADMIN_RESULTS: AdminResultStorage = {
  1: { home: 2, away: 1, state: 'confirmed' },
}

// ---------------------------------------------------------------------------
// LocalStorage helpers
// ---------------------------------------------------------------------------
const STORAGE_KEYS = {
  currentUser: 'wkpool_current_user',
  predictions: 'wkpool_predictions',
  bonusPredictions: 'wkpool_bonus',
  termsAccepted: 'wkpool_terms_accepted',  // per-user override
  adminResults: 'wkpool_admin_results',    // per-match { home, away, state }
  adminBonusNorm: 'wkpool_admin_bonus_norm', // per-user-per-question normalized override
  adminBonusCorrect: 'wkpool_admin_bonus_correct', // correct_answer override per question
}

// Type for admin result storage
type AdminResultStorage = Record<number, {
  home: number
  away: number
  state: MatchResultState
}>
type AdminBonusNormStorage = Record<string, string> // key = `${userId}|${questionId}`
type AdminBonusCorrectStorage = Record<number, string> // key = questionId

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveToStorage<T>(key: string, value: T) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
}

// ---------------------------------------------------------------------------
// Mock provider implementation
// ---------------------------------------------------------------------------

class MockProvider implements DataProvider {
  private currentUserId: string = ''
  private predictions: Record<string, Prediction[]> = {}
  private bonusPredictions: Record<string, BonusPrediction[]> = {}
  private termsByUser: Record<string, { at: string; version: string }> = {}
  private adminResults: AdminResultStorage = {}
  private adminBonusNorm: AdminBonusNormStorage = {}
  private adminBonusCorrect: AdminBonusCorrectStorage = {}
  private initialized = false

  private init() {
    if (this.initialized) return
    this.currentUserId = loadFromStorage(STORAGE_KEYS.currentUser, 'user-jan')
    this.predictions = loadFromStorage(STORAGE_KEYS.predictions, INITIAL_PREDICTIONS)
    this.bonusPredictions = loadFromStorage(STORAGE_KEYS.bonusPredictions, INITIAL_BONUS)
    this.termsByUser = loadFromStorage(STORAGE_KEYS.termsAccepted, {})
    this.adminResults = loadFromStorage(STORAGE_KEYS.adminResults, INITIAL_ADMIN_RESULTS)
    this.adminBonusNorm = loadFromStorage(STORAGE_KEYS.adminBonusNorm, {})
    this.adminBonusCorrect = loadFromStorage(STORAGE_KEYS.adminBonusCorrect, {})
    this.initialized = true
  }

  /** Convenience: rebuild a Match with the current admin overlay applied. */
  private freshMatch(matchId: number): Match {
    const raw = MATCHES_RAW.find(m => m.id === matchId)
    if (!raw) throw new Error(`Match ${matchId} not found`)
    return buildMatch(raw, this.adminResults)
  }

  /** Convenience: build all matches with overlay. */
  private freshAllMatches(): Match[] {
    return MATCHES_RAW.map(r => buildMatch(r, this.adminResults))
  }

  /** Require admin or throw. */
  private async requireAdmin(): Promise<void> {
    this.init()
    const user = this.getUserWithTermsOverride(this.currentUserId)
    if (!user?.is_admin) {
      throw new Error('Admin rechten vereist voor deze actie')
    }
  }

  private getUserWithTermsOverride(userId: string): Profile | null {
    const base = TEST_USERS.find(u => u.id === userId)
    if (!base) return null
    const override = this.termsByUser[userId]
    if (override) {
      return { ...base, accepted_terms_at: override.at, accepted_terms_version: override.version }
    }
    return base
  }

  async getCurrentUser(): Promise<Profile | null> {
    this.init()
    return this.getUserWithTermsOverride(this.currentUserId)
  }

  async signInWithPassword(email: string, _password: string): Promise<void> {
    // Mock mode: wachtwoord wordt niet gecontroleerd, alleen email lookup
    this.init()
    const match = TEST_USERS.find(u => u.email.toLowerCase() === email.toLowerCase())
    this.currentUserId = match?.id || 'user-jan'
    saveToStorage(STORAGE_KEYS.currentUser, this.currentUserId)
  }

  async signUpWithPassword(email: string, _password: string, _displayName: string): Promise<void> {
    // Mock mode: kies eerste matchende user of fallback
    this.init()
    const match = TEST_USERS.find(u => u.email.toLowerCase() === email.toLowerCase())
    this.currentUserId = match?.id || 'user-jan'
    saveToStorage(STORAGE_KEYS.currentUser, this.currentUserId)
  }

  async signOut(): Promise<void> {
    this.init()
    this.currentUserId = ''
    saveToStorage(STORAGE_KEYS.currentUser, '')
  }

  async acceptTerms(version: string): Promise<void> {
    this.init()
    if (!this.currentUserId) return
    this.termsByUser[this.currentUserId] = { at: new Date().toISOString(), version }
    saveToStorage(STORAGE_KEYS.termsAccepted, this.termsByUser)
  }

  async getStages(): Promise<Stage[]> {
    return STAGES
  }

  async getMatches(stageId?: number): Promise<Match[]> {
    this.init()
    // Rebuild matches each call so status/lock_at reflect "now" + admin overlay
    const fresh = this.freshAllMatches()
    return stageId ? fresh.filter(m => m.stage_id === stageId) : fresh
  }

  async getMatchdaySummaries(): Promise<MatchdaySummary[]> {
    this.init()
    const fresh = this.freshAllMatches()
    const grouped: Record<string, Match[]> = {}
    for (const m of fresh) {
      const key = `${m.stage_id}-${m.matchday}`
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(m)
    }
    const now = Date.now()
    return Object.entries(grouped).map(([key, matches]) => {
      const [stageIdStr, matchdayStr] = key.split('-')
      const sorted = [...matches].sort(
        (a, b) => new Date(a.kickoff_ams).getTime() - new Date(b.kickoff_ams).getTime()
      )
      const stillOpen = sorted.filter(m => new Date(m.lock_at).getTime() > now)
      return {
        stage_id: parseInt(stageIdStr),
        matchday: parseInt(matchdayStr),
        match_count: matches.length,
        first_kickoff: sorted[0].kickoff_ams,
        last_kickoff: sorted[sorted.length - 1].kickoff_ams,
        next_lock_at: stillOpen.length > 0 ? stillOpen[0].lock_at : null,
        all_locked: stillOpen.length === 0,
      }
    })
  }

  async getGroupStandings(groupLabel: string): Promise<GroupStanding[]> {
    this.init()
    const fresh = this.freshAllMatches()
    const played = fresh.filter(m =>
      m.group_label === groupLabel && m.home_score !== null && m.away_score !== null
    )
    type Tally = {
      team_id: number; team_fifa: string;
      played: number; wins: number; draws: number; losses: number;
      pts: number; gf: number; ga: number;
    }
    const tally: Record<number, Tally> = {}

    for (const m of played) {
      if (!m.home_team || !m.away_team || m.home_score === null || m.away_score === null) continue
      const h = m.home_team.id, a = m.away_team.id
      tally[h] = tally[h] || { team_id: h, team_fifa: m.home_team.fifa_code, played: 0, wins: 0, draws: 0, losses: 0, pts: 0, gf: 0, ga: 0 }
      tally[a] = tally[a] || { team_id: a, team_fifa: m.away_team.fifa_code, played: 0, wins: 0, draws: 0, losses: 0, pts: 0, gf: 0, ga: 0 }
      tally[h].played++; tally[a].played++
      tally[h].gf += m.home_score; tally[h].ga += m.away_score
      tally[a].gf += m.away_score; tally[a].ga += m.home_score
      if (m.home_score > m.away_score) {
        tally[h].pts += 3; tally[h].wins++; tally[a].losses++
      } else if (m.home_score < m.away_score) {
        tally[a].pts += 3; tally[a].wins++; tally[h].losses++
      } else {
        tally[h].pts += 1; tally[a].pts += 1
        tally[h].draws++; tally[a].draws++
      }
    }

    // Include unplayed teams
    const all = new Set<number>()
    fresh.filter(m => m.group_label === groupLabel).forEach(m => {
      if (m.home_team) all.add(m.home_team.id)
      if (m.away_team) all.add(m.away_team.id)
    })
    for (const tid of Array.from(all)) {
      if (!tally[tid]) {
        const team = TEAMS.find(t => t.id === tid)!
        tally[tid] = { team_id: tid, team_fifa: team.fifa_code, played: 0, wins: 0, draws: 0, losses: 0, pts: 0, gf: 0, ga: 0 }
      }
    }

    const sorted = Object.values(tally).sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts
      if ((b.gf - b.ga) !== (a.gf - a.ga)) return (b.gf - b.ga) - (a.gf - a.ga)
      return b.gf - a.gf
    })

    return sorted.map((t, i) => ({
      group_label: groupLabel,
      team_id: t.team_id,
      team_fifa: t.team_fifa,
      played: t.played,
      wins: t.wins,
      draws: t.draws,
      losses: t.losses,
      points: t.pts,
      goals_for: t.gf,
      goals_against: t.ga,
      goal_difference: t.gf - t.ga,
      rank: i + 1,
    }))
  }

  async getMyPredictions(): Promise<Prediction[]> {
    this.init()
    return this.predictions[this.currentUserId] || []
  }

  async savePrediction(matchId: number, homeScore: number, awayScore: number): Promise<void> {
    this.init()
    const fresh = this.freshMatch(matchId)
    if (fresh.status !== 'open') {
      throw new Error('Deze wedstrijd is vergrendeld en kan niet meer worden voorspeld.')
    }

    const userPreds = this.predictions[this.currentUserId] || []
    const idx = userPreds.findIndex(p => p.match_id === matchId)
    const pred: Prediction = {
      match_id: matchId,
      home_score: homeScore,
      away_score: awayScore,
      submitted_at: new Date().toISOString(),
      points_awarded: null,
    }
    if (idx >= 0) userPreds[idx] = pred
    else userPreds.push(pred)
    this.predictions[this.currentUserId] = userPreds
    saveToStorage(STORAGE_KEYS.predictions, this.predictions)
  }

  async getBonusQuestions(): Promise<BonusQuestion[]> {
    return BONUS_QUESTIONS
  }

  async getMyBonusPredictions(): Promise<BonusPrediction[]> {
    this.init()
    return this.bonusPredictions[this.currentUserId] || []
  }

  async saveBonusPrediction(questionId: number, answer: string): Promise<void> {
    this.init()
    const list = this.bonusPredictions[this.currentUserId] || []
    const idx = list.findIndex(b => b.question_id === questionId)
    const pred: BonusPrediction = {
      question_id: questionId,
      answer_raw: answer,
      answer_normalized: answer,    // in real backend, admin can normalize later
      submitted_at: new Date().toISOString(),
      points_awarded: null,
    }
    if (idx >= 0) list[idx] = pred
    else list.push(pred)
    this.bonusPredictions[this.currentUserId] = list
    saveToStorage(STORAGE_KEYS.bonusPredictions, this.bonusPredictions)
  }

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    this.init()
    const entries = TEST_USERS.map(user => {
      const preds = this.predictions[user.id] || []
      const matchPoints = preds.reduce((sum, p) => sum + (p.points_awarded || 0), 0)
      const bonusPreds = this.bonusPredictions[user.id] || []
      const bonusPoints = bonusPreds.reduce((sum, b) => sum + (b.points_awarded || 0), 0)
      const exactCount = preds.filter(p => {
        if (p.points_awarded === null) return false
        const match = MATCHES.find(m => m.id === p.match_id)
        if (!match) return false
        const stage = STAGES.find(s => s.id === match.stage_id)!
        return p.points_awarded === stage.points_exact
      }).length

      const winnerPick = bonusPreds.find(b => b.question_id === 1)?.answer_normalized || null

      return {
        user_id: user.id,
        display_name: user.display_name,
        total_points: matchPoints + bonusPoints,
        match_points: matchPoints,
        bonus_points: bonusPoints,
        exact_predictions: exactCount,
        predicted_winner: winnerPick,
        rank: 0,
      }
    })
    entries.sort((a, b) => {
      if (b.total_points !== a.total_points) return b.total_points - a.total_points
      return b.exact_predictions - a.exact_predictions
    })
    entries.forEach((e, i) => { e.rank = i + 1 })
    return entries
  }

  // ────────────────────────────────────────────────────────────────────
  // ADMIN METHODS
  // ────────────────────────────────────────────────────────────────────

  /**
   * Scoring formula — must match the SQL function in 001_initial_schema.sql.
   *
   *   Exact score (e.g. 3-1 voorspeld, 3-1 werkelijk) → points_exact
   *   Otherwise:
   *     - Correct outcome (home win / draw / away win) → points_winner
   *     - Each side's goal count exactly right → +points_goals per side
   */
  private calculatePoints(
    predHome: number, predAway: number,
    actualHome: number, actualAway: number,
    stageId: number
  ): number {
    const stage = STAGES.find(s => s.id === stageId)
    if (!stage) return 0

    // Exact score = highest reward (takes precedence over winner+goals)
    if (predHome === actualHome && predAway === actualAway) {
      return stage.points_exact
    }

    let total = 0

    // Correct outcome (sign of difference matches)
    const predSign = Math.sign(predHome - predAway)
    const actualSign = Math.sign(actualHome - actualAway)
    if (predSign === actualSign) {
      total += stage.points_winner
    }

    // Goal-count bonuses per side
    if (predHome === actualHome) total += stage.points_goals
    if (predAway === actualAway) total += stage.points_goals

    return total
  }

  private persistAdminResults() {
    saveToStorage(STORAGE_KEYS.adminResults, this.adminResults)
  }

  async adminGetMatchOverview(): Promise<AdminMatchOverview[]> {
    await this.requireAdmin()
    const all = this.freshAllMatches()
    return all.map(match => {
      const adminEntry = this.adminResults[match.id]
      const state: MatchResultState = adminEntry ? adminEntry.state : 'no_result'

      // Count predictions for this match across all users
      let count = 0
      let exactCount = 0
      for (const userId of Object.keys(this.predictions)) {
        const pred = this.predictions[userId].find(p => p.match_id === match.id)
        if (pred) {
          count++
          if (state === 'confirmed' && match.home_score !== null && match.away_score !== null) {
            if (pred.home_score === match.home_score && pred.away_score === match.away_score) {
              exactCount++
            }
          }
        }
      }

      return {
        match,
        result_state: state,
        prediction_count: count,
        exact_count: exactCount,
      }
    })
  }

  async adminSaveProvisionalScore(matchId: number, home: number, away: number): Promise<void> {
    await this.requireAdmin()
    if (home < 0 || away < 0 || home > 99 || away > 99) {
      throw new Error('Ongeldige score')
    }
    this.adminResults[matchId] = { home, away, state: 'provisional' }
    this.persistAdminResults()
  }

  async adminGetPredictionsForMatch(matchId: number): Promise<any[]> {
    await this.requireAdmin()
    const out: any[] = []
    for (const user of TEST_USERS) {
      const userPreds = this.predictions[user.id] || []
      const myPred = userPreds.find(p => p.match_id === matchId)
      if (myPred) {
        out.push({
          user_id: user.id,
          display_name: user.display_name,
          home_score: myPred.home_score,
          away_score: myPred.away_score,
          points_awarded: myPred.points_awarded,
          submitted_at: myPred.submitted_at,
        })
      }
    }
    return out
  }

  async adminConfirmAndScore(matchId: number): Promise<{ updated: number }> {
    await this.requireAdmin()
    const entry = this.adminResults[matchId]
    if (!entry) throw new Error('Geen voorlopige uitslag ingevoerd voor deze wedstrijd')

    const raw = MATCHES_RAW.find(m => m.id === matchId)
    if (!raw) throw new Error('Wedstrijd niet gevonden')

    // Mark confirmed first
    this.adminResults[matchId] = { ...entry, state: 'confirmed' }
    this.persistAdminResults()

    // Score every prediction for this match
    let updated = 0
    for (const userId of Object.keys(this.predictions)) {
      const userPreds = this.predictions[userId]
      const idx = userPreds.findIndex(p => p.match_id === matchId)
      if (idx >= 0) {
        const pred = userPreds[idx]
        const points = this.calculatePoints(
          pred.home_score, pred.away_score,
          entry.home, entry.away,
          raw.stage_id
        )
        userPreds[idx] = { ...pred, points_awarded: points }
        updated++
      }
    }
    saveToStorage(STORAGE_KEYS.predictions, this.predictions)
    return { updated }
  }

  async adminConfirmAllProvisional(stageId: number): Promise<{ updated: number }> {
    await this.requireAdmin()
    let total = 0
    for (const id of Object.keys(this.adminResults).map(Number)) {
      const raw = MATCHES_RAW.find(m => m.id === id)
      if (!raw || raw.stage_id !== stageId) continue
      const entry = this.adminResults[id]
      if (!entry || entry.state !== 'provisional') continue
      await this.adminConfirmAndScore(id)
      total++
    }
    return { updated: total }
  }

  async getMatchPredictionAggregate(matchId: number): Promise<{
    homeWins: number; draws: number; awayWins: number; total: number
  }> {
    this.init()
    // Aggregate is altijd zichtbaar — gebruikers mogen elkaars voorspellingen
    // zien zodra ze zijn ingediend (zie ontwerpkeuze).
    let h = 0, d = 0, a = 0
    for (const userId of Object.keys(this.predictions)) {
      const p = this.predictions[userId].find(pp => pp.match_id === matchId)
      if (!p) continue
      if (p.home_score > p.away_score) h++
      else if (p.home_score < p.away_score) a++
      else d++
    }
    return { homeWins: h, draws: d, awayWins: a, total: h + d + a }
  }

  async getMatchPredictionsPublic(matchId: number): Promise<any[]> {
    this.init()
    const out: any[] = []
    for (const user of TEST_USERS) {
      const userPreds = this.predictions[user.id] || []
      const myPred = userPreds.find(p => p.match_id === matchId)
      out.push({
        user_id: user.id,
        display_name: user.display_name,
        home_score: myPred?.home_score ?? null,
        away_score: myPred?.away_score ?? null,
        points_awarded: myPred?.points_awarded ?? null,
        submitted_at: myPred?.submitted_at ?? null,
        is_self: user.id === this.currentUserId,
        has_predicted: !!myPred,
      })
    }
    return out.sort((a, b) => a.display_name.localeCompare(b.display_name))
  }

  async adminUnconfirm(matchId: number): Promise<void> {
    await this.requireAdmin()
    const entry = this.adminResults[matchId]
    if (!entry) {
      throw new Error('Deze wedstrijd heeft geen ingevoerde uitslag om in te trekken.')
    }

    // Revert state and remove points
    this.adminResults[matchId] = { ...entry, state: 'provisional' }
    this.persistAdminResults()

    for (const userId of Object.keys(this.predictions)) {
      const userPreds = this.predictions[userId]
      const idx = userPreds.findIndex(p => p.match_id === matchId)
      if (idx >= 0) {
        userPreds[idx] = { ...userPreds[idx], points_awarded: null }
      }
    }
    saveToStorage(STORAGE_KEYS.predictions, this.predictions)
  }

  async adminClearScore(matchId: number): Promise<void> {
    await this.requireAdmin()
    delete this.adminResults[matchId]
    this.persistAdminResults()

    for (const userId of Object.keys(this.predictions)) {
      const userPreds = this.predictions[userId]
      const idx = userPreds.findIndex(p => p.match_id === matchId)
      if (idx >= 0) {
        userPreds[idx] = { ...userPreds[idx], points_awarded: null }
      }
    }
    saveToStorage(STORAGE_KEYS.predictions, this.predictions)
  }

  async adminGetBonusAnswers(): Promise<AdminBonusAnswer[]> {
    await this.requireAdmin()
    const out: AdminBonusAnswer[] = []
    for (const user of TEST_USERS) {
      const answers = this.bonusPredictions[user.id] || []
      for (const a of answers) {
        const normKey = `${user.id}|${a.question_id}`
        const adminNorm = this.adminBonusNorm[normKey]
        out.push({
          user_id: user.id,
          display_name: user.display_name,
          question_id: a.question_id,
          answer_raw: a.answer_raw,
          answer_normalized: adminNorm ?? a.answer_normalized,
          points_awarded: a.points_awarded,
        })
      }
    }
    return out
  }

  async adminNormalizeAnswer(userId: string, questionId: number, normalized: string): Promise<void> {
    await this.requireAdmin()
    const key = `${userId}|${questionId}`
    this.adminBonusNorm[key] = normalized
    saveToStorage(STORAGE_KEYS.adminBonusNorm, this.adminBonusNorm)

    // Also update the actual bonus prediction
    const userPreds = this.bonusPredictions[userId] || []
    const idx = userPreds.findIndex(p => p.question_id === questionId)
    if (idx >= 0) {
      userPreds[idx] = { ...userPreds[idx], answer_normalized: normalized }
      this.bonusPredictions[userId] = userPreds
      saveToStorage(STORAGE_KEYS.bonusPredictions, this.bonusPredictions)
    }
  }

  async adminSetBonusCorrectAnswer(questionId: number, correctAnswer: string): Promise<void> {
    await this.requireAdmin()
    this.adminBonusCorrect[questionId] = correctAnswer
    saveToStorage(STORAGE_KEYS.adminBonusCorrect, this.adminBonusCorrect)
  }

  async adminScoreBonusQuestion(questionId: number): Promise<{ updated: number }> {
    await this.requireAdmin()
    const correct = this.adminBonusCorrect[questionId]
    if (!correct) throw new Error('Stel eerst het juiste antwoord in')

    const question = BONUS_QUESTIONS.find(q => q.id === questionId)
    if (!question) throw new Error('Vraag niet gevonden')

    let updated = 0
    for (const userId of Object.keys(this.bonusPredictions)) {
      const list = this.bonusPredictions[userId]
      const idx = list.findIndex(b => b.question_id === questionId)
      if (idx < 0) continue

      const pred = list[idx]
      const userAnswer = pred.answer_normalized || pred.answer_raw
      let points = 0

      if (question.question_type === 'number') {
        const u = parseInt(userAnswer, 10)
        const c = parseInt(correct, 10)
        if (!isNaN(u) && !isNaN(c)) {
          if (u === c) points = question.points_exact
          else if (Math.abs(u - c) <= question.close_threshold) points = question.points_close
        }
      } else {
        // text or team: exact (case-insensitive) match
        if (userAnswer.trim().toLowerCase() === correct.trim().toLowerCase()) {
          points = question.points_exact
        }
      }

      list[idx] = { ...pred, points_awarded: points }
      updated++
    }
    saveToStorage(STORAGE_KEYS.bonusPredictions, this.bonusPredictions)
    return { updated }
  }

  // ────────────────────────────────────────────────────────────────────
  // DEV-ONLY METHODS
  // ────────────────────────────────────────────────────────────────────

  async devSwitchUser(userId: string): Promise<void> {
    this.init()
    this.currentUserId = userId
    saveToStorage(STORAGE_KEYS.currentUser, userId)
  }

  async devListUsers(): Promise<Profile[]> {
    this.init()
    return TEST_USERS.map(u => this.getUserWithTermsOverride(u.id)!)
  }
}

// Export all teams for the bonus dropdown (WK kampioen team picker)
export function getAllTeams(): Team[] {
  return TEAMS
}

let _instance: MockProvider | null = null
export function getMockProvider(): MockProvider {
  if (!_instance) _instance = new MockProvider()
  return _instance
}
