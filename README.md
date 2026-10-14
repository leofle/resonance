# Resonance

A puzzle game where every tile is a note. Tap one tile and its ring travels along the arrows; solve the level by making **every** tile ring from a single tap.

## How to play
- Open `index.html` in a browser, or play at https://leofle.github.io/resonance/.
- Every level is a fixed 6×6 board. Each tile has its own pitch, one of 6 levels on a pentatonic scale. A tile's pitch is **hidden until it has rung once**; after that it shows a small bar (height + colour = pitch) that stays for the rest of that level, across retries and restarts, and resets when you change level.
- Each level has a target tune, shown in the strip above the board: one column per beat, one bar per note, bar height + colour = pitch; a chord shows its notes as separate bars side by side. There are no numbers anywhere, so on mute you match bar heights against the bars your tiles reveal. Press **♪ Listen** (or `L`) to hear it.
- Tap one tile. Each beat (180 ms) the ring jumps to the next tile its arrow points at, skipping empty slots. Each tile rings once.
- **Win** = every tile rings **and** your chain plays the target tune beat by beat. From level 3 on, several taps ring every tile, but only one plays the tune.
- Wrong beats sound a harsh clash, so you can hear where it went wrong; the strip shows no per-beat marks. A failed chain reports "N of M beats right" and, if any, "N tiles silent".
- **Split** (↔ / ↕) always rings out of both its sides, whichever side the ring came in from.
- **Mute** (bold stripes, "×2") rings only when two rings hit it on the same beat; a lone ring is absorbed with a dull thud.
- **Delay** (amber, hourglass, "+1 beat") passes the ring on one beat late; its label shows `arrival→pass-on`.
- **Rotatable** (gold border, ↻): click ↻ to rotate clockwise; right-click or long-press (450 ms) for counter-clockwise. Undo (`z`) reverses either; Restart (`r`) resets the level at any time.
- Progress is saved per browser; a fresh load opens the first unsolved level. The dots are the level picker: buttons named "Level N: Name" (with aria-current on the current level), reachable with Tab and activated with Enter/Space.

## Build
Levels live in `final.json`, rules in `engine.js` (shared with node), UI in `index.template.html`.
```
python3 build.py        # writes index.html (inlines engine.js + final.json)
```

## Tools / tests (`tools/`, need `npm install` and Chrome at /usr/bin/google-chrome; server on :8765)
```
node tools/solve.js           # tiles, solutions, random-tap odds per level
node tools/check_delay.js     # each delay is load-bearing (D -> arrow => no config plays the tune)
node tools/remap6.js          # v2.2: squeeze levels onto 6 pitches (monotone merge, re-roll if uniqueness breaks); rewrites final.json
node tools/gen7.js <spec> [s] # v2 generator: board + decoys + pitch assignment (l1 l2 split branch hush delay turn chorus tuning finale)
node tools/test_ui.js         # Playwright UI test (fixed board; no digits on strip/tiles; bar heights; reveal-after-ring; mouse.click at tile centres;
                              #   touch taps + hold; dot a11y/keyboard; decoy/silent feedback; rotation; undo/restart; solves all levels)
node tools/test_effects.js    # 0 pixels change outside the board (strip included) mid-chain (L5, L8, L10)
node tools/test_audio.js && python3 tools/analyze_wav.py   # renders level3_solve.wav + level3_decoy.wav offline + analysis
node tools/stress_audio.js    # limiter keeps dense chains below 1.0
```
