// World Cup 2026 — implied tournament-win probabilities per team.
// Source: github.com/mooncitydev/worldcup-2026-prediction (decimal odds → implied %)
// Used for:
//   1. "Wie wint de WK" probability scaling on bonus question
//   2. Match-by-match win probability prediction (NL 62% / draw 22% / JPN 16%)

// FIFA-code → implied probability (%) of winning the tournament
export const TEAM_PROBABILITY: Record<string, number> = {
  // Hosts
  USA: 5.9,
  MEX: 2.9,
  CAN: 2.0,
  // UEFA
  FRA: 18.2,
  ESP: 16.7,
  ENG: 5.9,
  POR: 9.1,
  GER: 9.1,
  NED: 11.1,
  BEL: 4.8,
  CRO: 3.8,
  AUT: 2.0,
  SWE: 2.0,
  SUI: 2.0,
  NOR: 1.5,
  TUR: 1.2,
  SCO: 0.7,
  CZE: 0.7,
  BOS: 0.5,
  // CONMEBOL
  ARG: 15.4,
  BRA: 13.3,
  COL: 3.8,
  URU: 3.8,
  ECU: 1.5,
  PAR: 0.7,
  // AFC
  JPN: 2.9,
  KOR: 1.2,
  AUS: 1.0,
  IRN: 1.0,
  KSA: 1.0,
  QAT: 0.4,
  JOR: 0.3,
  UZB: 0.4,
  IRQ: 0.5,
  // CAF
  MAR: 4.8,
  SEN: 2.0,
  EGY: 1.0,  // hun id 'nga' had Egypt als naam — wij gebruiken EGY consistent
  CIV: 1.0,
  ALG: 1.0,
  GHA: 0.7,
  TUN: 0.5,
  CNG: 0.5,
  RSA: 0.4,
  CPV: 0.3,
  // OFC
  NZL: 0.2,
  // CONCACAF (non-hosts)
  PAN: 0.5,
  HAI: 0.2,
  CUR: 0.2,
}

export type MatchOdds = {
  homeWin: number   // 0-100
  draw: number      // 0-100
  awayWin: number   // 0-100
}

/**
 * Compute win/draw/win probabilities for a single match.
 *
 * Algorithm:
 *   - Look up each team's tournament-win implied probability (%)
 *   - Compute strength share: strongerShare = strong / (strong + weak)
 *   - Reserve a draw probability that scales with team imbalance:
 *       draw = 30% - 20% × |strongerShare - 0.5|
 *     → 30% when teams equal, ~10% when extremely unequal
 *   - Distribute remainder according to strength ratio
 */
export function computeMatchOdds(homeFifa: string, awayFifa: string): MatchOdds {
  const homeP = TEAM_PROBABILITY[homeFifa] ?? 0.5
  const awayP = TEAM_PROBABILITY[awayFifa] ?? 0.5

  const total = homeP + awayP
  if (total === 0) return { homeWin: 33.3, draw: 33.3, awayWin: 33.4 }

  const homeShare = homeP / total // 0..1
  const imbalance = Math.abs(homeShare - 0.5) // 0 (equal) .. 0.5 (one team dominant)

  const draw = 30 - 20 * imbalance * 2 // %; clamped via formula naturally to 10..30
  const remainder = 100 - draw

  const homeWin = remainder * homeShare
  const awayWin = remainder * (1 - homeShare)

  return {
    homeWin: Math.round(homeWin * 10) / 10,
    draw: Math.round(draw * 10) / 10,
    awayWin: Math.round(awayWin * 10) / 10,
  }
}

/**
 * Aggregeer voorspellingen van andere spelers tot win/draw/win percentages.
 * Voor "OMG Spelers denken: NL 48% / draw 22% / JPN 30%"
 */
export function aggregatePredictions(
  predictions: { home_score: number; away_score: number }[]
): MatchOdds & { sampleSize: number } {
  if (predictions.length === 0) {
    return { homeWin: 0, draw: 0, awayWin: 0, sampleSize: 0 }
  }
  let h = 0, d = 0, a = 0
  for (const p of predictions) {
    if (p.home_score > p.away_score) h++
    else if (p.home_score < p.away_score) a++
    else d++
  }
  const total = predictions.length
  return {
    homeWin: Math.round((h / total) * 1000) / 10,
    draw: Math.round((d / total) * 1000) / 10,
    awayWin: Math.round((a / total) * 1000) / 10,
    sampleSize: total,
  }
}
