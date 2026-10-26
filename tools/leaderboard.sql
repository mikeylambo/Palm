-- PALM leaderboard guards. Run once in the Supabase SQL editor of the shared 'leaderboards' project.
-- Scoped to game = 'palm', so Neon Striker's rows are untouched. NOT VALID: rows already in the table are
-- not re-checked (the game hides any that break these rules anyway; see fair() in src/leaderboard.js).

-- a score the game could have produced: a beat pays at most 925 (100 x the x8 combo, +50 speed, +75 special)
alter table public.scores add constraint palm_score_possible
  check (game <> 'palm' or (score >= 0 and stage between 1 and 999 and score <= stage * 925)) not valid;

-- a name of 1-16 characters with no slur or swear in it, leetspeak included (same lists as ANYWHERE and WORD in src/leaderboard.js)
alter table public.scores add constraint palm_name_clean
  check (game <> 'palm' or (
    char_length(btrim(name)) between 1 and 16
    and regexp_replace(translate(lower(name), '013457@$', 'oieastas'), '[^a-z]', '', 'g') !~ '(fuck|shit|cunt|nigg)'
    and regexp_replace(translate(lower(name), '013457@$', 'oieastas'), '[^a-z]+', ' ', 'g')
        !~ '(^| )(rape|kys|spic|dick|fag|faggot|penis|porn|kike|chink|nazi|slut|whore|bitch|retard|tranny|hitler|pussy|cock)s?( |$)'
  )) not valid;
