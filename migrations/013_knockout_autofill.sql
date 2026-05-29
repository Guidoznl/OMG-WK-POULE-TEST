-- ============================================================================
-- Migration 013: Knockout autofill helpers
-- ============================================================================
-- Drie placeholder-types in matches.placeholder_home/away:
--   1A, 2C, 1F   → nummer/groep (auto-invul vanuit groepsstand)
--   3BEFIJ       → beste #3 uit een van die groepen (UI toont beperkte dropdown)
--   W74, RU101   → winnaar/runner-up van match 74/101 (auto-invul vanuit uitslag)
--
-- Deze migratie geeft de admin-pagina (volgende sessie te bouwen) alle data
-- die nodig is om dropdowns vooraf in te vullen.
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1. Functie: per groep de top-N teams op basis van officiële uitslagen
--    Gebruikt de bestaande group_standings view die we in migratie 008 hebben.
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_get_group_position(
  p_group_label TEXT,
  p_position INT
)
RETURNS INT AS $$
DECLARE
  v_team_id INT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Inloggen vereist';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE) THEN
    RAISE EXCEPTION 'Geen admin-rechten';
  END IF;

  SELECT team_id INTO v_team_id
  FROM group_standings
  WHERE group_label = p_group_label
    AND rank = p_position
  LIMIT 1;

  RETURN v_team_id;  -- NULL als groepsfase nog niet klaar is
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE;

-- ────────────────────────────────────────────────────────────────────────────
-- 2. Functie: winnaar/runner-up van een specifieke wedstrijd
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_get_match_winner(
  p_match_id INT,
  p_winner BOOLEAN  -- TRUE = winnaar, FALSE = runner-up
)
RETURNS INT AS $$
DECLARE
  v_match RECORD;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Inloggen vereist';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE) THEN
    RAISE EXCEPTION 'Geen admin-rechten';
  END IF;

  SELECT home_team_id, away_team_id, home_score, away_score, result_locked
    INTO v_match FROM matches WHERE id = p_match_id;

  IF NOT FOUND OR NOT v_match.result_locked OR v_match.home_score IS NULL THEN
    RETURN NULL;
  END IF;

  -- Bij gelijke stand: aanname dat dit niet voorkomt in knockout (penalty's etc.
  -- worden geadministreerd in de score). Bij gelijk geven we NULL terug.
  IF v_match.home_score > v_match.away_score THEN
    RETURN CASE WHEN p_winner THEN v_match.home_team_id ELSE v_match.away_team_id END;
  ELSIF v_match.away_score > v_match.home_score THEN
    RETURN CASE WHEN p_winner THEN v_match.away_team_id ELSE v_match.home_team_id END;
  ELSE
    RETURN NULL;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE;

-- ────────────────────────────────────────────────────────────────────────────
-- 3. Hoofdfunctie: alle openstaande knockout-wedstrijden met suggesties
--    Parses elke placeholder en geeft suggested_team_id terug (of NULL voor
--    3XYZ-types die handmatig moeten).
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_get_knockout_suggestions()
RETURNS TABLE (
  match_id INT,
  stage_id INT,
  kickoff_ams TIMESTAMPTZ,
  placeholder_home TEXT,
  placeholder_away TEXT,
  current_home_team_id INT,
  current_away_team_id INT,
  suggested_home_team_id INT,
  suggested_away_team_id INT,
  home_eligible_team_ids INT[],  -- bij 3XYZ: alleen #3'en uit die groepen
  away_eligible_team_ids INT[]
) AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Inloggen vereist';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE) THEN
    RAISE EXCEPTION 'Geen admin-rechten';
  END IF;

  RETURN QUERY
  SELECT
    m.id,
    m.stage_id,
    m.kickoff_ams,
    m.placeholder_home,
    m.placeholder_away,
    m.home_team_id,
    m.away_team_id,
    resolve_placeholder(m.placeholder_home) AS suggested_home_team_id,
    resolve_placeholder(m.placeholder_away) AS suggested_away_team_id,
    eligible_for_placeholder(m.placeholder_home) AS home_eligible_team_ids,
    eligible_for_placeholder(m.placeholder_away) AS away_eligible_team_ids
  FROM matches m
  WHERE m.stage_id > 1  -- alles na groepsfase
    AND (m.home_team_id IS NULL OR m.away_team_id IS NULL)
  ORDER BY m.kickoff_ams;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE;

-- ────────────────────────────────────────────────────────────────────────────
-- 4. Helper: parse één placeholder string → team_id (of NULL)
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION resolve_placeholder(p_placeholder TEXT)
RETURNS INT AS $$
DECLARE
  v_match_id INT;
  v_pos_char TEXT;
  v_group_char TEXT;
BEGIN
  IF p_placeholder IS NULL THEN RETURN NULL; END IF;

  -- W74, W93, W100 → winnaar van match N
  IF p_placeholder ~ '^W\d+$' THEN
    v_match_id := SUBSTRING(p_placeholder FROM 2)::INT;
    RETURN admin_get_match_winner(v_match_id, TRUE);
  END IF;

  -- RU101, RU102 → runner-up van match N
  IF p_placeholder ~ '^RU\d+$' THEN
    v_match_id := SUBSTRING(p_placeholder FROM 3)::INT;
    RETURN admin_get_match_winner(v_match_id, FALSE);
  END IF;

  -- 1A, 2B, 1F → nummer X van groep Y
  IF p_placeholder ~ '^[12][A-L]$' THEN
    v_pos_char := SUBSTRING(p_placeholder FROM 1 FOR 1);
    v_group_char := SUBSTRING(p_placeholder FROM 2 FOR 1);
    RETURN admin_get_group_position('Group ' || v_group_char, v_pos_char::INT);
  END IF;

  -- 3BEFIJ → admin moet zelf kiezen (return NULL voor "geen suggestie")
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE;

-- ────────────────────────────────────────────────────────────────────────────
-- 5. Helper: welke teams komen in aanmerking voor deze placeholder?
--    Voor 3XYZ: alle #3'en uit groepen X, Y, Z.
--    Voor de rest: leeg (de UI gebruikt dan gewoon alle teams).
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION eligible_for_placeholder(p_placeholder TEXT)
RETURNS INT[] AS $$
DECLARE
  v_letters TEXT;
  v_letter TEXT;
  v_team_id INT;
  v_result INT[] := '{}';
BEGIN
  IF p_placeholder IS NULL OR p_placeholder !~ '^3[A-L]+$' THEN
    RETURN '{}';
  END IF;

  v_letters := SUBSTRING(p_placeholder FROM 2);
  FOR i IN 1..LENGTH(v_letters) LOOP
    v_letter := SUBSTRING(v_letters FROM i FOR 1);
    v_team_id := admin_get_group_position('Group ' || v_letter, 3);
    IF v_team_id IS NOT NULL THEN
      v_result := array_append(v_result, v_team_id);
    END IF;
  END LOOP;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE;

-- ────────────────────────────────────────────────────────────────────────────
-- 6. Save-functie: admin bevestigt de selecties → schrijf naar matches
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_set_knockout_teams(
  p_match_id INT,
  p_home_team_id INT,
  p_away_team_id INT
)
RETURNS VOID AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Inloggen vereist';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE) THEN
    RAISE EXCEPTION 'Geen admin-rechten';
  END IF;

  UPDATE matches
    SET home_team_id = COALESCE(p_home_team_id, home_team_id),
        away_team_id = COALESCE(p_away_team_id, away_team_id)
    WHERE id = p_match_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
