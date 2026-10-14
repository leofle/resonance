# Resonance

A puzzle game where every tile is a note. Tap one tile and its ring travels along the arrows; solve the level by making **every** tile ring from a single tap.

## How to play
- Open `index.html` in a browser, or play at https://leofle.github.io/resonance/.
- Every level is a fixed 6×6 board. Each tile has its own pitch, one of 6 levels on a pentatonic scale. Pitch is shown by **height only**: every bar and ring uses one neutral colour. A tile's pitch is **hidden until it rings**: during an attempt each tile that rings shows a large bar (height = pitch). The bars stay after the chain ends, so you can compare them with the strip, and clear on your next attempt, on Restart, when you rotate or undo, and on level change.
- Each level has a target tune, shown in the strip above the board: one column per beat, one bar per note, bar height = pitch; a chord shows its notes as separate bars side by side. There are no numbers anywhere, so on mute you match bar heights against the bars your tiles reveal. **Tap the strip** (♪ in its corner; or focus it and press Enter/Space, or press `L`) to hear it; a drag only scrolls. The strip is exactly as wide as the board; when the beats fit, columns spread evenly across it; when a tune has more beats than fit, it scrolls to follow the playing beat (edge fades show more beats) and can be dragged.
- Tap a tile to **hear its note** and select it (a ring highlights it); this is free and starts nothing. Press **▶ Play** (or `P` / Enter; arrow keys move the selection) to ring the chain from the selected tile: that is the attempt. Optional preview cap: `?preview=3` (config `PREVIEW_LIMIT`, off by default) allows N previews per attempt with a counter. Each beat (180 ms) the ring jumps to the next tile its arrow points at, skipping empty slots. Each tile rings once.
- Level order: 1 arrows, 2 gaps, 3 **dials**, 4 splits, 5 branches, 6 mutes, 7 delays, 8–10 combinations. From level 3 every solution needs the right start **and** every dial turned (dials always load pointing the wrong way); several wrong setups begin exactly like the tune (same first 3 beats) and at least 3 other tiles share the tune's first note.
- **Win** = every tile rings **and** your chain plays the target tune beat by beat. From level 3 on, several taps ring every tile, but only one plays the tune; many of those decoys play the same number of notes on every beat as the tune and differ only in pitch (`node tools/shape.js`).
- Wrong beats sound a harsh clash, so you can hear where it went wrong; the strip shows no per-beat marks. A failed chain reports "N of M beats right" and, if any, "N tiles silent".
- **Split** (↔ / ↕) always rings out of both its sides, whichever side the ring came in from.
- **Mute** (bold stripes, "×2") rings only when two rings hit it on the same beat; a lone ring is absorbed with a dull thud.
- **Delay** (amber, hourglass, "+1 beat") passes the ring on one beat late; its label shows `arrival→pass-on`.
- **Rotatable dial** (gold border, small ↻ chip in the corner that never covers the arrow): tapping or clicking a dial (anywhere on the tile) rotates it clockwise; right-click or long-press (450 ms) rotates it counter-clockwise. A dial **never starts a chain**: there is no double-tap or start option, and the solver never counts a dial as a start. Undo (`z`) reverses either; Restart (`r`) resets the level at any time.
- Hints: a popover over the board explains each new mechanic the first time you reach its level on this device (levels 1, 2, 3, 4, 6, 7); a tap or your first move closes it and **?** in the controls row reopens it on any level.
- The board is sized to fill the screen; the header is compact.
- Sound: browsers (iOS Safari/Chrome especially) only allow audio after a tap. Until then a **🔈 Tap to enable sound** button shows and the 🔇/🔊 icon reflects the real audio state; the first tap, click or key unlocks audio (and iOS plays even with the mute switch on). The tune auto-plays on level load only once sound is enabled.
- Progress is saved per browser; a fresh load opens the first unsolved level. The dots are the level picker: buttons named "Level N: Name" (with aria-current on the current level), reachable with Tab and activated with Enter/Space.

## Build
Levels live in `final.json`, rules in `engine.js` (shared with node), UI in `index.template.html`.
```
python3 build.py        # writes index.html (inlines engine.js + final.json)
```

## Tools / tests (`tools/`, need `npm install` and Chrome at /usr/bin/google-chrome; server on :8765)
```
node tools/solve.js           # tiles, solutions, random-tap odds per level
node tools/check_levels.js    # v2.7 audit: solutions, decoys, same shape, decoys matching first 3 beats, tiles sharing the first pitch, dials, intro mechanic load-bearing
node tools/gen10.js <spec> <s> # v2.7 generator (dial split branch hush delay chorus tuning finale)
node tools/check_delay.js     # each delay is load-bearing (D -> arrow => no config plays the tune)
node tools/remap6.js          # v2.2: squeeze levels onto 6 pitches (monotone merge, re-roll if uniqueness breaks); rewrites final.json
node tools/shape.js           # per level: decoys and how many share the tune's notes-per-beat shape
node tools/gen9.js <spec> <s> <minDecoys>   # v2.3: rotation-symmetric boards (decoys in the solution's orbit share its shape)
node tools/anneal.js <i> <s> <minDecoys> [seed.json]  # v2.3: local search maximising same-shape decoys, keeps feature counts
node tools/gen7.js <spec> [s] # v2 generator: board + decoys + pitch assignment (l1 l2 split branch hush delay turn chorus tuning finale)
node tools/test_ui.js         # Playwright UI test (fixed board; no digits on strip/tiles; bar heights; reveal-after-ring; mouse.click at tile centres;
                              #   touch taps + hold; dot a11y/keyboard; decoy/silent feedback; rotation; undo/restart; solves all levels)
node tools/test_effects.js    # 0 pixels change outside the board (strip included) mid-chain (L5, L8, L10)
node tools/test_audio.js && python3 tools/analyze_wav.py   # renders level3_solve.wav + level3_decoy.wav offline + analysis
node tools/stress_audio.js    # limiter keeps dense chains below 1.0
node tools/test_layout.js     # Chrome + WebKit at 320/375/390/430/1280: strip edges = board edges, no horizontal overflow, Listen in controls row, strip follows playback, drag scroll
node tools/test_sound.js      # audio unlock in Chrome + WebKit (desktop and iPhone-size touch); needs `npx playwright-core install webkit`
```

## v2.9 (playtest: counting notes)
- The strip shows **one bar per beat**: the top note of that beat's chord. It never shows how many notes sound on a beat (Listen and tapping the strip still play the full chords). The failed-Play summary only says "N of M beats right · K silent".
- Pitch bars and beat numbers show only on the tile that is ringing; nothing stays after a Play, a win or a preview.
- Dials load at random fixed orientations (some can already be right, at least one is wrong). The start is never the only tile nothing points at.
- Harder levels: L3 has 2 dials (12 full-ring decoys); L8–10 have 3–4 dials (3–4 turned in the solution) and 5–12 full-ring decoys.
- Progress is stored under `res28*` (old progress is ignored).
- `tools/naive.js` reports, per level, decoys whose top-note sequence matches the strip, and how many remain after one failed Play.
- Tools: `gen10.js` (specs dial2/chorus4/tuning4/finale4), `gen11.js` (90°-symmetric, all-same-shape decoys), `scramble_dials.js` (MINWRONG=n), `repitch.js` (TOP=n, NOLB=1), `check_levels.js`.
