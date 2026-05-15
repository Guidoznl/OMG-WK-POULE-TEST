-- ============================================================================
-- Migration 003: Round-based locking, terms acceptance, and bonus extras
-- ============================================================================
-- Run AFTER 001_initial_schema.sql and 002_seed_stages.sql.
-- This migration adds:
--   - matchdays (speelrondes) within each stage
--   - per-match locking based on kickoff timestamp (minus 2h)
--   - terms acceptance tracking
--   - the three "extra punten" bonus questions
-- ============================================================================

-- ----------------------------------------------------------------------------
-- ADD matchday column to matches
-- ----------------------------------------------------------------------------
ALTER TABLE matches ADD COLUMN IF NOT EXISTS matchday INT;

-- Helper: assign matchday based on order WITHIN each group (group stage)
-- or 1 for all knockout matches (each knockout stage IS one matchday).
DO $$
DECLARE
  m RECORD;
  counter INT;
  current_group TEXT := NULL;
BEGIN
  -- Group stage: number matches 1, 2, 3 within each group chronologically
  FOR m IN
    SELECT id, group_label,
      ROW_NUMBER() OVER (PARTITION BY group_label ORDER BY kickoff_ams) AS rn
    FROM matches WHERE stage_id = 1 ORDER BY group_label, kickoff_ams
  LOOP
    UPDATE matches SET matchday = m.rn WHERE id = m.id;
  END LOOP;

  -- Knockout: matchday = 1 for everything (each stage = single round)
  UPDATE matches SET matchday = 1 WHERE stage_id > 1 AND matchday IS NULL;
END $$;

-- Index for fast "matches in this matchday" queries
CREATE INDEX IF NOT EXISTS idx_matches_stage_matchday ON matches(stage_id, matchday);

-- ----------------------------------------------------------------------------
-- VIEW: per-match lock status (kickoff minus 2 hours)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW match_lock_status AS
SELECT
  m.id AS match_id,
  m.kickoff_ams,
  (m.kickoff_ams - INTERVAL '2 hours') AS lock_at,
  NOW() >= (m.kickoff_ams - INTERVAL '2 hours') AS is_locked,
  NOW() >= m.kickoff_ams AS has_started,
  CASE
    WHEN m.home_score IS NOT NULL AND m.away_score IS NOT NULL THEN 'finished'
    WHEN NOW() >= m.kickoff_ams THEN 'in_progress'
    WHEN NOW() >= (m.kickoff_ams - INTERVAL '2 hours') THEN 'locked'
    ELSE 'open'
  END AS status
FROM matches m;

-- ----------------------------------------------------------------------------
-- VIEW: per-matchday summary (for the round headers in the UI)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW matchday_summary AS
SELECT
  m.stage_id,
  m.matchday,
  COUNT(*) AS match_count,
  MIN(m.kickoff_ams) AS first_kickoff,
  MAX(m.kickoff_ams) AS last_kickoff,
  -- "Next deadline" = the lock time of the earliest match that is still open
  (
    SELECT MIN(mm.kickoff_ams - INTERVAL '2 hours')
    FROM matches mm
    WHERE mm.stage_id = m.stage_id
      AND mm.matchday = m.matchday
      AND NOW() < (mm.kickoff_ams - INTERVAL '2 hours')
  ) AS next_lock_at,
  -- True if EVERY match in the matchday has its lock time passed
  BOOL_AND(NOW() >= (m.kickoff_ams - INTERVAL '2 hours')) AS all_locked
FROM matches m
GROUP BY m.stage_id, m.matchday;

-- ----------------------------------------------------------------------------
-- REPLACE the can_user_predict_match function
-- New rule: simply "kickoff - 2 hours has not passed yet"
-- No more late-entry tokens needed because per-match locking handles it.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION can_user_predict_match(
  p_user_id UUID,
  p_match_id INT
) RETURNS BOOLEAN AS $$
DECLARE
  v_kickoff TIMESTAMPTZ;
BEGIN
  SELECT kickoff_ams INTO v_kickoff FROM matches WHERE id = p_match_id;
  IF v_kickoff IS NULL THEN RETURN FALSE; END IF;
  -- Locked 2 hours before kickoff
  RETURN NOW() < (v_kickoff - INTERVAL '2 hours');
END;
$$ LANGUAGE plpgsql STABLE;

-- We can now drop the late_entry_usage table — it's no longer needed.
-- Comment out the next line if you have already used late_entry data you want to keep.
DROP TABLE IF EXISTS late_entry_usage;


-- ----------------------------------------------------------------------------
-- TERMS ACCEPTANCE
-- ----------------------------------------------------------------------------
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS accepted_terms_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS accepted_terms_version TEXT;

-- Helper: check if user has accepted current terms
CREATE OR REPLACE FUNCTION user_has_accepted_terms(p_user_id UUID, p_version TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM profiles
    WHERE id = p_user_id
      AND accepted_terms_at IS NOT NULL
      AND accepted_terms_version = p_version
  );
$$ LANGUAGE SQL STABLE;


-- ----------------------------------------------------------------------------
-- BONUS EXTRAS — the three end-of-tournament questions
-- ----------------------------------------------------------------------------
-- We already have a `bonus_questions` table from migration 001.
-- Seed it with the three extras:

INSERT INTO bonus_questions (id, question_text, question_type, points_exact, points_close, close_threshold, display_order, is_active)
VALUES
  (1, 'Wie wordt WK kampioen?',           'team',   50,   0, 0,  1, TRUE),
  (2, 'Wie wordt topscorer van het toernooi?', 'text',   20,   0, 0,  2, TRUE),
  (3, 'Hoe vaak komt Jelle in beeld?',    'number', 100, 25, 3, 3, TRUE)
ON CONFLICT (id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  question_type = EXCLUDED.question_type,
  points_exact = EXCLUDED.points_exact,
  points_close = EXCLUDED.points_close,
  close_threshold = EXCLUDED.close_threshold,
  display_order = EXCLUDED.display_order;

-- Reset the sequence so future inserts don't collide
SELECT setval('bonus_questions_id_seq', GREATEST(3, (SELECT MAX(id) FROM bonus_questions)));


-- ----------------------------------------------------------------------------
-- KNOCKOUT POINTS RULE: penalty shootouts count as draws
-- We don't enforce this in the DB schema — admins just enter the score after
-- 90 mins + extra time (so a penalty shootout is recorded as e.g. 1-1).
-- The scoring function already treats predictions vs results identically.
-- ----------------------------------------------------------------------------


-- ----------------------------------------------------------------------------
-- LEADERBOARD update: new tiebreaker (predicted tournament winner)
-- ----------------------------------------------------------------------------
DROP VIEW IF EXISTS leaderboard;

CREATE OR REPLACE VIEW leaderboard AS
SELECT
  p.id AS user_id,
  p.display_name,
  p.avatar_url,
  COALESCE(SUM(pr.points_awarded), 0) + COALESCE(bp_total.bonus_pts, 0) AS total_points,
  COALESCE(SUM(pr.points_awarded), 0) AS match_points,
  COALESCE(bp_total.bonus_pts, 0) AS bonus_points,
  COUNT(pr.id) FILTER (WHERE pr.points_awarded > 0) AS predictions_scored,
  COUNT(pr.id) FILTER (
    WHERE pr.points_awarded = (
      SELECT points_exact FROM stages s
      JOIN matches m ON m.stage_id = s.id
      WHERE m.id = pr.match_id
    )
  ) AS exact_predictions,
  -- Winner pick (question_id = 1) for tiebreaker display
  (
    SELECT bp.answer_normalized
    FROM bonus_predictions bp
    WHERE bp.user_id = p.id AND bp.question_id = 1
  ) AS predicted_winner,
  ROW_NUMBER() OVER (
    ORDER BY
      COALESCE(SUM(pr.points_awarded), 0) + COALESCE(bp_total.bonus_pts, 0) DESC,
      COUNT(pr.id) FILTER (
        WHERE pr.points_awarded = (
          SELECT points_exact FROM stages s
          JOIN matches m ON m.stage_id = s.id
          WHERE m.id = pr.match_id
        )
      ) DESC
      -- Second tiebreaker (predicted winner correct) handled in app code where we
      -- know the actual tournament winner. SQL can't easily express this until
      -- the tournament is over.
  ) AS rank
FROM profiles p
LEFT JOIN predictions pr ON pr.user_id = p.id
LEFT JOIN (
  SELECT user_id, SUM(points_awarded) AS bonus_pts
  FROM bonus_predictions
  WHERE points_awarded IS NOT NULL
  GROUP BY user_id
) bp_total ON bp_total.user_id = p.id
GROUP BY p.id, p.display_name, p.avatar_url, bp_total.bonus_pts;
