# PALM — handoff for Claude Code

PALM is a WarioWare-paced reaction game. A masked, robed guardian holds up a palm. Faces burst into a manga panel and you have a split second to **BLAST** them or **LET THEM PASS**. Three onlookers in the bottom panel are your lives.

- Live: https://palm-nu.vercel.app (Vercel project `palm`, deploys on every push to `main`)
- Owner: Mikey Lambo (credits use this name)
- Status: design is finished. What's left is bug fixing, a light refactor, and music.

## Design rules (settled with the owner, do not reopen)

The game got better every time something was cut. Treat these as hard constraints:

- **Less is more.** Do not add new characters, rule types, cards, banners, text, shifts, daily runs, unlocks or cosmetics unless asked.
- **On-screen words during play:** only `BLASTED`, `PASSED`, `FLINCHED` (big, centered) and the rule cards `LET NOTHING PASS` / `MERCY: PASS EVERYONE`. No other feedback text.
- **Speed is v1 speed:** reaction window starts at 2.2 s and drops 55 ms per beat to a 0.9 s floor; past beat 40 it tightens slowly toward 0.6 s.
- **Regular arrivals pop in instantly.** Only the Lurker makes you wait (shadow, variable delay).
- **Faces:** keep the janky procedural faces. The original v1 faces (white face, black spiky hair, big grin or grumpy jagged mouth) appear about 17% of the time and never twice in a row. Arrivals are drawn at v1 size.
- **The blast is a Hakai, not a ki blast:** instant, no charge, no beam. Impact frame (invert), violet flash, whiteout, palm thrust, deep boom. The blasted face does one of three things, 33/33/33: fling, crumble into ink flakes, or simply get covered by the white.
- **Aura is the first read** (red = threat, gold = friend), eyes second (slit pupils = threat). Disguises appear later.
- Main menu text is only: `PALM`, `Blast it, or let it pass.`, `Press any button`.
- Rule moments end silently; no "back to normal" card.

## Roster (unlock beat)

| Character | Beat | Rule |
| --- | --- | --- |
| Wanderer | 0 | Read aura, then eyes |
| Lurker | 10 | Shadow, variable wait; sometimes nothing comes. Pressing early = FLINCHED |
| Sleeper | 16 | Eyes shut 0.15–2.3 s. Acting before they open is a strike |
| Herald | 23 | Carries a sealed scroll. Always pass |
| Twins | 29 | Two faces. Blast if either is a threat |
| Turncoat | 35 | Smiles, some turn mid-beat. Blasting before the turn is a strike |
| Child | 40 | Red aura, crowd screams. Always pass |

Cut on purpose: Mirror, The Masked. Rotation: each beat draws from the Wanderer plus the two newest specials, so characters do not stack.

## Lives and onlookers

Three onlookers (bowl cut, spiky, topknot). Letting a threat through knocks one out (spins away, X eyes). Any other mistake makes one flee. Lose all three: the guardian slumps, then GAME OVER.

## Code layout

`index.html` holds the markup and CSS and loads `src/main.js` as an ES module (serve over http; `file://` will not load modules). Modules:

- `src/state.js`: constants (`C`, `TOP`, `BOT`, `ROSTER`), shared state (`S` for score/mode, `G` for timing and the current arrival, `seen`, `OL` onlookers), `SET` + `saveSet()` settings (music, sfx, shake, flashes, haptics) in localStorage
- `src/characters.js`: `pickType()`, `freshType()`, `newLook()`, `newFig()`, `correctAct()`
- `src/game.js`: game flow: `startBeat()`, `spawn()`, `act()`, `update()`, `pause()`, `resume()`, `goTitle()`. Modes: `title`, `card`, `lurk`, `beat`, `resolve`, `fall`, `over`
- `src/render.js`: all drawing, `draw()` plus the faces (`face()`; `L.classic` draws the v1 face). The blast effect is the block starting `// hakai`
- `src/audio.js`: synthesized sfx (`tone()`, `kiBoom()`), haptics, music volume/ducking
- `src/ui.js`: keys, buttons, swipes, pause button, menus (`openPanel()`, `closePanel()`, `showMenu()`, `#menu-links`)
- `src/leaderboard.js`: shared Supabase project `leaderboards`, table `scores`, rows tagged `game: 'palm'` (same setup as `neonstriker/src/systems/online.js`). Publishable key is client-safe; RLS protects the table. There is also a `window.claude` db path used only when the game runs as a claude.ai artifact; it is inert on Vercel.
- `tests/playthrough.mjs` (`npm test`): headless Playwright run on a seeded virtual clock; plays until every type appears, checks intro cards, pause keys, TITLE, game over and console errors. `.vercelignore` keeps tests and `package.json` out of the deploy, so Vercel stays a static site.
- `src/main.js`: main loop (`frame()`), plus a read-only `window.PALM` hook used by the tests
- Music: `<audio id="bgm" src="music.mp3">`. Drop `music.mp3` in the repo root. It loops, follows the volume slider, and ducks during the Lurker wait, pause and the game-over slump.

## Status

Fixed: intro cards (types only debut through `maybeIntro()`), pause keys (no auto-repeat toggling, `KeyP` on any layout, capture phase, game buttons never take focus), TITLE on the pause screen and at game over. Done: ES module split (verified pixel-identical with a seeded replay), `npm test`, phone/desktop pass (landscape phones put PASS/BLAST either side of the stage; panels cover the stage; no pull-to-refresh on swipes).

Pause note: the owner's report never reproduced headless. The live build had the code and isn't cached. If P still fails for the owner, check which browser and keyboard layout they use, and whether an extension grabs keys.

## Remaining

1. Hook up the owner's music: drop `music.mp3` in the repo root (wiring is done).
