# 2048 3x3

A 3x3 version of the classic 2048 game — a single, dependency-free static page.
[Play Here](https://shrjamal.github.io/2048-3x3/)

## Run locally

It's just static files, so any static server works:

```sh
python3 -m http.server
# then open http://localhost:8000
```

Or simply open `index.html` in a browser.

## How to play

Use the arrow keys (or `WASD` / Vim `HJKL`), or swipe on touch devices, to slide
all tiles. Tiles with the same number merge into one. Merge tiles to score high!

## Files

- `index.html` — markup and styles
- `script.js` — game logic and animations

## Deploy

Pushing to `main` publishes to GitHub Pages via `.github/workflows/deploy.yml`.
