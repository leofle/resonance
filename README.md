# Resonance

A puzzle game where every tile is a note. Tap one tile and its ring travels along the arrows; solve the level by making **every** tile ring from a single tap.

## How to play
- Open `index.html` in a browser (or `python3 -m http.server 8765` and visit http://localhost:8765/index.html).
- Each beat (180 ms) a ring jumps to the next tile in its arrow direction, skipping empty space. Each tile rings once.
- **Split** (↔ / ↕) sends the ring both ways.
- **Mute** (bold stripes, "×2"): rings only when two rings hit it on the **same beat**; a lone ring is absorbed.
- **Delay** (amber, hourglass, "+1 beat"): passes the ring on one beat late. Its beat label shows `arrival→pass-on`.
- **Rotatable** (gold border, ↻ badge): click ↻ to rotate clockwise; right-click or long-press (450 ms) the tile for counter-clockwise. Undo (z) reverses either; Restart (r) resets the level.
- A failed chain pulses the silent tiles and shows "N tiles silent". Fresh loads start at the first unsolved level; the dots under the title are the level picker.

## Build
Levels live in `final.json`, rules in `engine.js` (shared with node), UI in `index.template.html`.
```
python3 build.py        # writes index.html (inlines engine.js + final.json)
```

## Tools / tests (`tools/`, need `npm install` and Chrome at /usr/bin/google-chrome; server on :8765)
```
node tools/solve.js           # tiles, solutions, random-tap odds per level
node tools/check_delay.js     # each delay is load-bearing (D -> arrow => 0 solutions)
node tools/gen6.js <spec> [s] # constructive level generator (hush1, hush, delay, chorus, finale)
node tools/test_ui.js         # Playwright UI test (rotation, undo/restart, fail feedback, start level, solves)
node tools/test_effects.js    # no effect pixels painted outside the board mid-chain (L5, L7, L10)
node tools/test_audio.js && python3 tools/analyze_wav.py   # renders level4_solve.wav offline + analysis
node tools/stress_audio.js    # limiter keeps dense chains below 1.0
```
