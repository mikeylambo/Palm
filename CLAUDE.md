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
- **The blast is a Hakai, not a ki blast:** instant, no charge, no beam. Short hitstop, violet flash (no screen invert), whiteout, palm thrust, deep boom. The blasted face does one of three things, 33/33/33: fling, crumble into ink flakes, or simply get covered by the white.
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

Cut on purpose: Mirror, The Masked. Pacing is learn, then mix: after each debut, only the newcomer and the Wanderer appear for about 4 beats; then everyone met so far mixes in, the two newest a bit more often. Rule cards fire only during a mix stretch, never on a debut.

## Lives and onlookers

Three onlookers (bowl cut, spiky, topknot). Letting a threat through knocks one out (spins away, X eyes). Any other mistake makes one flee. Lose all three: the guardian slumps, then GAME OVER.

## Code layout

Everything is in `index.html` (canvas game, one inline script). Key areas, in order:

- `ROSTER`, `newLook()`, `newFig()`: characters and procedural faces (`face()`; `L.classic` draws the v1 face)
- `startBeat()`, `spawn()`, `act()`, `correctAct()`: game flow. Modes: `title`, `card`, `lurk`, `beat`, `resolve`, `fall`, `over`
- `frame()`: main loop and all drawing; blast effect is the block starting `// hakai`
- `SET` + `saveSet()`: settings (music, sfx, shake, flashes, haptics) in localStorage
- Menus: `openPanel()`, `closePanel()`, `#menu-links`, `#btn-pause`
- Leaderboard: shared Supabase project `leaderboards`, table `scores`, rows tagged `game: 'palm'` (same setup as `neonstriker/src/systems/online.js`). Publishable key is client-safe; RLS protects the table. There is also a `window.claude` db path used only when the game runs as a claude.ai artifact; it is inert on Vercel.
- Music: `<audio id="bgm" src="music.mp3">`. Drop `music.mp3` in the repo root. It loops, follows the volume slider, and ducks during the Lurker wait, pause and the game-over slump.

## Known bugs (fix these first)

1. ~~Characters debut without their intro card.~~ Fixed: `pickType()` never returns an unseen type; debuts go through `debutDue()` / `maybeIntro()`.
2. **P / Esc don't pause for the owner** in the Vercel build, although automated tests pause fine. Reproduce in a real browser; suspects: focus on a game button, the pause button `setInterval`, or a cached build.
3. **No way back to the title screen.** Add a `TITLE` option on the pause screen and on game over.

## Wrap-up list

1. Fix the known bugs above.
2. Light refactor: split into a few ES modules (state, characters/faces, render, ui/menus, leaderboard) without changing behavior.
3. Add a small headless test (Playwright) that plays through every character type and checks for console errors.
4. Full pass on phone and desktop: overlaps at game over, pause, settings and credits panels, swipe controls.
5. Hook up the owner's music when provided.
