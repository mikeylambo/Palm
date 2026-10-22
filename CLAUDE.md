# PALM — handoff for Claude Code

PALM is a WarioWare-paced reaction game. A masked, robed guardian holds up a palm. Faces burst into a manga panel and you have a split second to **BLAST** them or **LET THEM PASS**. Three onlookers in the bottom panel are your lives.

- Live: https://palm-nu.vercel.app (Vercel project `palm`, deploys on every push to `main`)
- Owner: Mikey Lambo (credits use this name)
- Status: design is finished. What's left is bug fixing, a light refactor, and music.

## Design rules (settled with the owner, do not reopen)

Ask the owner before changing how the game plays or looks. Feel words: raw, intentional jank, reflexive, high energy.

The game got better every time something was cut. Treat these as hard constraints:

- **Less is more.** Do not add new characters, rule types, cards, banners, text, shifts, daily runs, unlocks or cosmetics unless asked.
- **On-screen words during play:** only `BLASTED`, `PASSED`, `FLINCHED` (big, centered). FLINCHED = any move made too early: at a shadow, at empty air, at shut eyes, before a turn. No other feedback text.
- **The clock holds:** reaction window warms up from 2.2 s (−55 ms per beat) and then stays at 1.2 s. No steady speed-up; tension comes from the characters' timing (shadow waits, naps, late turns). Still being tuned with the owner; the design doc's tempo steps are an open option.
- **Arrivals pop in instantly,** except the Lurker and, once the Lurker is known, a growing share of anyone you've met (0% at beat 10 → 30% at 25 → 45% at 60), who come out of the shadow. The shadow's random wait widens 0.5 s → 1.7 s (beat 20) → 2.1 s (beat 45). All ramps use `ramp()` in `state.js` and keep climbing slowly past the last debut so long runs don't plateau. Only the Lurker can turn out to be nothing.
- **Faces:** keep the janky procedural faces. The original v1 faces (white face, black spiky hair, big grin or grumpy jagged mouth) appear about 17% of the time and never twice in a row. Arrivals are drawn at v1 size.
- **The blast is a Hakai, not a ki blast:** instant, no charge, no beam. Violet flash (no screen invert), whiteout, palm thrust, deep boom. The blasted face does one of three things, 33/33/33: fling, crumble into ink flakes, or simply get covered by the white. Every blast holds its first frame for 75 ms (hit-stop, `HITSTOP` in `game.js`); correct reads also get an 85 ms beat before it.
- **The snap:** the speed bonus (+50 under 400 ms) counts from the moment acting became valid (the reveal from a shadow, a Sleeper's eyes opening, a Turncoat's turn, the second Twin). A correct blast within 400 ms of that after a wait is a snap: 140 ms hit-stop and a bigger boom.
- **The shadow breathes:** a rising drone (`shadow.mp3`) timed so its peak lands on the reveal, cut to silence 120 ms before it. In 40% of waits over 0.7 s the shadow twitches toward you once (never act on a shadow: that rule never changes).
- **Silence before a reveal:** the music ducks to 25% while you wait (shadow, nap, the second Twin, pause, the slump) and cuts to silence for the last 120 ms before a reveal you're waiting on. Never before a Turncoat's turn, which would give it away.
- **Aura is the first read** (red = threat, gold = friend), eyes second (slit pupils = threat). Disguises appear later. Disguised Wanderers start after the Lurker's learn stretch and never appear during any learn stretch; they ramp 8% (beat 14) → 32% (20) → 50% (52), never above 50% so the aura never becomes a reverse tell.
- Main menu text is only: `PALM`, `Blast it, or let it pass.`, `Press any button` (no Best line).
- **The face that ended your run** fades back into the top panel, still and with no caption, while the guardian slumps, and stays faintly behind GAME OVER. A blast at thin air leaves the panel empty.
- No rule moments: `LET NOTHING PASS` / `MERCY` were cut.
- **Never cheat the player:** every mistake must be readable on screen at the moment you act. No type may look identical to another with a different rule.
- **Kind tone:** no children, no crying, no demon masks.
- **Music target: about 174 BPM.** The game is not beat-synced; the track loops underneath. Placeholder now: Logica, "Palm OST" (~169 BPM), fade-out trimmed so it loops at 3:21.

## Roster (unlock beat)

| Character | Beat | Rule |
| --- | --- | --- |
| Wanderer | 0 | Watch the eyes. The aura can lie (intro card says exactly this) |
| Lurker | 10 | Shadow, variable wait; sometimes nothing comes. Pressing early = FLINCHED |
| Sleeper | 16 | Eyes shut 0.15–2.3 s. Moving before they open = FLINCHED |
| Twins | 23 | Two faces; the second pops in 0.2–1.1 s after the first. Moving before both show = FLINCHED. Then blast if either is a threat. Onlookers stay tense until both show |
| Turncoat | 30 | Violet aura (like Sleeper and Twins: violet = a special, watch the eyes), smiles; some turn 20–65% into the beat (always ~0.4 s left to blast). Moving before the turn = FLINCHED |

Order: a player's first full run uses the table's order. Once they have met every type (`palm_metall` in localStorage), the Lurker still debuts at 10 and the Sleeper, Twins and Turncoat are dealt into the 16/23/30 slots at random each run (`dealOrder()` / `AT` in `state.js`).

Cut on purpose: Mirror, The Masked, Herald, The Child, The Dancer. The roster ends at the Turncoat; no sixth type unless the owner asks. Pacing is learn, then mix: each debut is followed by two more of the newcomer (three in a row, no disguises or extra shadows); then everyone met so far mixes in, the two newest a bit more often.

## Faces

Gags follow the owner's Face Lab rules (`GAGS` in `characters.js`, picked per mood by weight): mouth none 75 / tongue 25 (grins only); brows none 67 / raised 33 / wiggle 10 / unibrow 10; cheeks none 40 / blush 40 / sweat 20; smug lids on 50% of grins; v1 face 17%, no gags. Buck teeth, chatter, gap, drool, wavy, nose hair and snot bubble are off.

## Lives and onlookers

Three onlookers (bowl cut, spiky, topknot). Letting a threat through knocks one out (spins away, X eyes). Any other mistake makes one flee. Lose all three: the guardian slumps, then GAME OVER.

## Code layout

`index.html` holds the markup and CSS and loads `src/main.js` as an ES module (serve over http; `file://` will not load modules). Modules:

- `src/state.js`: constants (`C`, `TOP`, `BOT`, `ROSTER`), shared state (`S` for score/mode, `G` for timing and the current arrival, `seen`, `OL` onlookers), `SET` + `saveSet()` settings (music, sfx, shake, flashes, haptics) in localStorage
- `src/characters.js`: `pickType()`, `freshType()`, `newLook()`, `newFig()`, `correctAct()`
- `src/game.js`: game flow: `startBeat()`, `spawn()`, `act()`, `update()`, `pause()`, `resume()`, `goTitle()`. Modes: `title`, `card`, `lurk`, `beat`, `resolve`, `fall`, `over`
- `src/render.js`: all drawing, `draw()` plus the faces (`face()`; `L.classic` draws the v1 face). The blast effect is the block starting `// hakai`
- `src/audio.js`: sound. The owner's picks live in `sfx/` (pop, pop2 for the second Twin, eyes_open, turn, shadow, nothing, pass, flinch, strike, ko, flee, combo at ×4/×8, intro, slump, gameover, click), cut and levelled by `tools/build_sfx.py` from their source takes, decoded into Web Audio buffers on the first input. Each cue falls back to a synthesized `tone()` until its file loads. The blast boom (`kiBoom()`) stays synthesized. Music runs through a Web Audio gain (`musicLevel()`, called every frame) for the ducks and silences
- `src/ui.js`: keys, buttons, swipes, pause button, menus (`openPanel()`, `closePanel()`, `showMenu()`, `#menu-links`)
- `src/leaderboard.js`: shared Supabase project `leaderboards`, table `scores`, rows tagged `game: 'palm'` (same setup as `neonstriker/src/systems/online.js`). Publishable key is client-safe; RLS protects the table. There is also a `window.claude` db path used only when the game runs as a claude.ai artifact; it is inert on Vercel.
- `tests/playthrough.mjs` (`npm test`): headless Playwright run on a seeded virtual clock; plays until every type appears, checks intro cards, pause keys, TITLE, game over and console errors. `.vercelignore` keeps tests and `package.json` out of the deploy, so Vercel stays a static site.
- `src/main.js`: main loop (`frame()`), plus a read-only `window.PALM` hook used by the tests
- Music: `<audio id="bgm" src="music.mp3">` in the repo root. Replace the file to change the track.

## Status

Fixed: intro cards (types only debut through `maybeIntro()`), pause keys (no auto-repeat toggling, `KeyP` on any layout, capture phase, game buttons never take focus), TITLE on the pause screen and at game over. Done: ES module split (verified pixel-identical with a seeded replay), `npm test`, phone/desktop pass (landscape phones put PASS/BLAST either side of the stage; panels cover the stage; no pull-to-refresh on swipes).

Pause note: the owner's report never reproduced headless. The live build had the code and isn't cached. If P still fails for the owner, check which browser and keyboard layout they use, and whether an extension grabs keys.

## Remaining

1. Final music (about 174 BPM): replace the placeholder `music.mp3`.
