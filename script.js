// 2048 3x3 — a single-file, framework-free port.
//
// Architecture in one breath: a plain-object grid model is the source of truth;
// each tile is an absolutely-positioned <div> placed with a CSS `transform`, so a
// move is "mutate the model, write new transforms, let CSS transition the slide."
// That keeps input non-blocking (nothing waits on an animation) and lets the
// browser composite movement on the GPU. The same model drives merges, the
// game-over check, undo snapshots, and localStorage persistence.

// ---- Config (tunable via the URL for testing) ----
// e.g. ?size=8&ms=70&ease=ease-in
const params = new URLSearchParams(location.search);
// Board is SIZE x SIZE. Clamped to 2..8; defaults to the canonical 3x3.
const SIZE = Math.min(8, Math.max(2, Number(params.get("size")) || 3));
// Slide duration in ms (clamped 10..1000). Also the timing budget the deferred
// merge reveal and ghost-tile removal lean on, so they land with the slide.
const SLIDE_MS = Math.min(1000, Math.max(10, Number(params.get("ms")) || 140));
// Easing for the slide. The default's third control point is > 1, so the tile
// overshoots its target then settles back — the slight "bounce".
const SLIDE_EASE = params.get("ease") || "cubic-bezier(0.34, 1.4, 0.64, 1)";
// Duration of the scale "pop" used on merges and score changes.
const POP_MS = 200;

// Per-value tile colours (background + foreground), matching the classic look.
const TILE_STYLES = {
  2: { bg: "#FFFFFF", fg: "#8C8275" },
  4: { bg: "#F7E7AE", fg: "#B0863A" },
  8: { bg: "#F6CFA3", fg: "#C07A38" },
  16: { bg: "#EF9A63", fg: "#FFFFFF" },
  32: { bg: "#F19AAA", fg: "#FFFFFF" },
  64: { bg: "#C9A9E2", fg: "#FFFFFF" },
  128: { bg: "#9FC0E8", fg: "#FFFFFF" },
  256: { bg: "#7FCFBA", fg: "#FFFFFF" },
  512: { bg: "#F0764C", fg: "#FFFFFF" },
  1024: { bg: "#F3C95A", fg: "#7A4E0E" },
  2048: { bg: "#7BBE6E", fg: "#FFFFFF" },
};

// Anything past 2048 reuses this purple.
const HIGH = { bg: "#9B6CD0", fg: "#FFFFFF" };

// The four moves, used by the game-over check (no move in any direction = over).
const DIRECTIONS = ["Up", "Down", "Left", "Right"];

// Arrow keys, WASD, and Vim HJKL all map to a direction.
const GAME_KEYS = {
  ArrowLeft: "Left", KeyA: "Left", KeyH: "Left",
  ArrowRight: "Right", KeyD: "Right", KeyL: "Right",
  ArrowUp: "Up", KeyW: "Up", KeyK: "Up",
  ArrowDown: "Down", KeyS: "Down", KeyJ: "Down",
};

// Minimum swipe/drag distance (px) before it counts as a move.
const SWIPE_THRESHOLD = 60;

// localStorage keys, namespaced by board size so each size keeps its own game.
const GAME_KEY = `GAME-${SIZE}x${SIZE}`;
const BEST_KEY = `BEST_SCORE-${SIZE}x${SIZE}`;

// Build the CSS transform that places a tile at grid coords (x, y). Tiles sit at
// the grid origin (--grid-pad) and are offset by whole cells (cell + gap), so
// updating x/y and letting the CSS transition run is what animates the slide.
const tileTransform = (x, y) =>
  `translate(calc(${x} * (var(--cell-size) + var(--grid-gap))), calc(${y} * (var(--cell-size) + var(--grid-gap))))`;

// ---- DOM references ----
const boardEl = document.getElementById("board");
const messageEl = document.getElementById("game-message"); // game-over overlay
const scoreValueEl = document.getElementById("score");
const scoreAddEl = document.getElementById("score-add"); // floating "+N"
const bestValueEl = document.getElementById("best");
const comboEl = document.getElementById("combo");
const comboTextEl = document.getElementById("combo-text");
const undoBtn = document.getElementById("undo");
const confirmDialog = document.getElementById("confirm-dialog");
const nbrFormat = new Intl.NumberFormat(); // adds thousands separators to scores

const MAX_HISTORY = 50; // cap on undo snapshots so history can't grow unbounded
// Live media query — read `.matches` each time so it tracks OS setting changes.
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");

// ---- Game state ----
let grid; // the Grid model — the source of truth
let score = 0;
let bestScore = 0;
let combo = 0; // consecutive merges; resets on a merge-less move
let status = "playing"; // "playing" | "over"
const tileEls = new Map(); // tile.id -> its <div>, so render can reuse DOM nodes
const history = []; // pre-move snapshots, newest last, for undo

// Set CSS variables, build the board, wire input, then load any saved game.
function init() {
  boardEl.style.setProperty("--game-size", SIZE);
  boardEl.style.setProperty("--slide-ms", `${SLIDE_MS}ms`);
  boardEl.style.setProperty("--slide-ease", SLIDE_EASE);
  // Relabel the page for non-default test sizes (3x3 stays canonical for SEO).
  if (SIZE !== 3) {
    document.querySelector(".title span").textContent = `${SIZE}x${SIZE}`;
    document.title = `2048 ${SIZE}x${SIZE} — test board`;
  }
  renderCells();
  wireInput();
  undoBtn.addEventListener("click", undo);
  document.getElementById("new-game").addEventListener("click", requestNewGame);
  document.getElementById("play-again").addEventListener("click", newGame);
  document.getElementById("confirm-new").addEventListener("click", () => {
    confirmDialog.close();
    newGame();
  });
  document
    .getElementById("confirm-cancel")
    .addEventListener("click", () => confirmDialog.close());
  loadGame();
  // Glyph widths shift once Nunito loads, so re-fit the numbers then.
  if (document.fonts?.ready) document.fonts.ready.then(refitAll);
}

// The core move: slide + merge, spawn a tile, update score, check game over.
// Synchronous and non-blocking — CSS transitions handle the motion, so rapid
// input stays responsive instead of waiting on each animation.
function handleMove(dir) {
  if (status !== "playing") return;
  flushReveals(); // commit any still-pending merge reveal before moving again
  const snapshot = takeSnapshot(); // capture state first, in case the move sticks
  const { addedScore, merges, hasMoved, mergedAway } = slideTiles(grid, dir);
  if (!hasMoved) return; // nothing slid: not a real move, no spawn, no history

  pushHistory(snapshot);
  grid.addTile(grid.getRandTile()); // every real move spawns one new tile
  render(mergedAway);

  if (addedScore > 0) addScore(addedScore);
  updateCombo(merges);
  if (merges > 0 && navigator.vibrate) navigator.vibrate(12); // tiny mobile buzz
  if (isGameOver()) setStatus("over");

  saveGame();
}

// Restore the board to just before the last move.
function undo() {
  if (!history.length) return;
  clearAllReveals(); // cancel any pending merge reveal we're about to revert
  const snap = history.pop();
  grid = new Grid(SIZE, snap.tiles);
  score = snap.score;
  combo = snap.combo;
  // bestScore is intentionally not restored — it's an all-time high-water mark.
  setStatus("playing");
  renderScore();
  renderCombo();
  render([], true); // instant: restore values without the deferred merge reveal
  updateUndoButton();
  saveGame();
}

// New Game is destructive, so confirm when there's progress to lose.
function requestNewGame() {
  const hasProgress = score > 0 || history.length > 0 || grid.tiles.length > 2;
  if (hasProgress) confirmDialog.showModal();
  else newGame();
}

// Wipe the board and start a fresh game with two random tiles.
function newGame() {
  clearAllReveals();
  for (const el of tileEls.values()) el.remove();
  tileEls.clear();

  grid = new Grid(SIZE);
  const first = createRandTile(grid.tiles);
  grid.addTile(first);
  grid.addTile(createRandTile(grid.tiles)); // second tile avoids the first's cell

  score = 0;
  combo = 0;
  history.length = 0;
  renderCombo();
  updateUndoButton();
  setStatus("playing");
  renderScore();
  render();
  saveGame();
}

// ---- Rendering ----

// Paint the static background cells once (the tiles render on top of these).
function renderCells() {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < SIZE * SIZE; i++) {
    const cell = document.createElement("span");
    cell.className = "cell";
    frag.appendChild(cell);
  }
  boardEl.insertBefore(frag, messageEl); // keep the overlay last in the board
}

// Reconcile the live grid against the DOM, keyed by tile id: move surviving
// tiles (CSS transitions the slide), pop merge results, spawn new tiles, and
// slide each merged-away "ghost" into the merge cell before removing it.
// `mergedAway` are the source tiles consumed by a merge this move.
// `instant` skips the deferred merge reveal (used by undo/restore).
function render(mergedAway = [], instant = false) {
  const live = grid.tiles;
  // ids that should stay on screen: live tiles plus the ghosts still sliding out.
  const keep = new Set(live.map((t) => t.id));
  for (const t of mergedAway) keep.add(t.id);

  // Drop any element that's no longer on the board.
  for (const [id, el] of tileEls) {
    if (!keep.has(id)) {
      clearReveal(el);
      el.remove();
      tileEls.delete(id);
    }
  }

  // A merged source slides into its destination, then disappears under the result.
  for (const tile of mergedAway) {
    const el = tileEls.get(tile.id);
    if (!el) continue;
    clearReveal(el);
    tileEls.delete(tile.id); // stop tracking it; it's on its way out
    el.style.zIndex = "1"; // sit under the result tile (which is z-index 2)
    el.style.transform = tileTransform(tile.x, tile.y); // slide to the merge cell
    liftTile(el);
    setTimeout(() => el.remove(), SLIDE_MS + 40); // remove once it has arrived
  }

  for (const tile of live) {
    let el = tileEls.get(tile.id);
    if (!el) {
      // New tile (a spawn, or first render): build it and pop it in.
      el = createTileEl(tile);
      tileEls.set(tile.id, el);
      boardEl.insertBefore(el, messageEl);
      fitText(el); // measure now that it's laid out
      appearTile(el);
    } else {
      // Existing tile: re-place it. The last transform we wrote is still on the
      // element, so a difference means it actually moved — lift it as it slides.
      const tf = tileTransform(tile.x, tile.y);
      if (el.style.transform !== tf) {
        el.style.transform = tf;
        liftTile(el);
      }
      // A live tile's value only changes by absorbing a merge.
      const changed = el.dataset.value !== String(tile.value);
      if (changed) {
        if (instant) {
          paintTile(el, tile);
          fitText(el);
        } else {
          // Truer merge: keep the old value during the slide; reveal the doubled
          // value and pop only once the sliding source has arrived.
          scheduleReveal(el, tile);
        }
      }
    }
  }
}

// Build a tile element: wrapper (.tile — positions and slides) > inner
// (.tile-inner — colour, shadow, pop) > span (.tile-num — the scaled number).
function createTileEl(tile) {
  const el = document.createElement("div");
  el.className = "tile";
  el.id = tile.id;
  const inner = document.createElement("div");
  inner.className = "tile-inner";
  const num = document.createElement("span");
  num.className = "tile-num";
  inner.appendChild(num);
  el.appendChild(inner);
  paintTile(el, tile);
  el.style.transform = tileTransform(tile.x, tile.y); // place it (no slide yet)
  return el;
}

// Write a tile's value and colours into the DOM. `dataset.value` doubles as the
// "currently displayed value" that render() diffs against to detect merges.
function paintTile(el, tile) {
  const { bg, fg } = tileStyle(tile.value);
  el.dataset.value = tile.value;
  const inner = el.firstChild;
  inner.style.backgroundColor = bg;
  inner.style.color = fg;
  inner.firstChild.textContent = tile.value; // the .tile-num span
}

// Colour pair for a value, falling back to the shared purple past 2048.
function tileStyle(value) {
  return TILE_STYLES[value] ?? HIGH;
}

// Scale the number down so even large values fit the tile. The scale is a ratio
// of text width to box width — both scale with --cell-size, so it survives board
// resizes and only needs recomputing when the value changes.
function fitText(el) {
  const num = el.firstChild.firstChild; // .tile-num
  num.style.transform = ""; // reset before measuring
  const max = el.firstChild.clientWidth * 0.84; // leave a little side padding
  const natural = num.offsetWidth; // layout width, unaffected by any transform
  if (natural > max) num.style.transform = `scale(${max / natural})`;
}

// Re-fit every on-screen tile (e.g. after the web font loads).
function refitAll() {
  for (const el of tileEls.values()) fitText(el);
}

// Paint the score and best-score readouts.
function renderScore() {
  scoreValueEl.textContent = nbrFormat.format(score);
  bestValueEl.textContent = nbrFormat.format(bestScore);
}

// Add to the score (with the +N float and pop), bumping best score if beaten.
function addScore(added) {
  score += added;
  pop(scoreValueEl);
  floatScore(added);
  if (score > bestScore) {
    bestScore = score;
    pop(bestValueEl);
  }
  renderScore();
}

// Grow the streak on merges; a merge-less move breaks it. Shown from x2 up.
function updateCombo(merges) {
  combo = merges > 0 ? combo + merges : 0;
  renderCombo();
  if (merges > 0 && !comboEl.hidden) pop(comboEl);
}

// Reflect the current combo count, hiding the badge below x2.
function renderCombo() {
  comboTextEl.textContent = `x${combo}`;
  comboEl.hidden = combo < 2;
}

// Set play/over status and toggle the game-over overlay accordingly.
function setStatus(next) {
  status = next;
  messageEl.hidden = next === "playing";
}

// ---- Undo history ----

// Capture everything undo needs to restore: deep-copied tiles, score, combo.
function takeSnapshot() {
  return { tiles: grid.tiles.map((t) => ({ ...t })), score, combo };
}

// Push a snapshot, trim to the cap, and refresh the undo button's enabled state.
function pushHistory(snapshot) {
  history.push(snapshot);
  if (history.length > MAX_HISTORY) history.shift(); // drop the oldest
  updateUndoButton();
}

// Undo is only available when there's something to undo.
function updateUndoButton() {
  undoBtn.disabled = history.length === 0;
}

// Restart a CSS keyframe animation on an element (the reflow forces it to replay).
function pop(el) {
  el.style.animation = "none";
  void el.offsetWidth; // force reflow so the next assignment restarts the anim
  el.style.animation = `pop ${POP_MS}ms ease-in-out`;
}

// Tile pop/spawn animate the inner layer, leaving the wrapper's slide untouched.
// The merge pop fires at reveal time (already after the slide), plus a brief
// brightness glow. The spawn appear uses a CSS delay + `backwards` so it stays
// hidden until the slide finishes.
function popTile(el) {
  const inner = el.firstChild;
  inner.style.animation = "none";
  void inner.offsetWidth; // reflow to restart
  inner.style.animation = `pop ${POP_MS}ms ease-in-out, glow ${POP_MS}ms ease-out`;
}

// Spawn animation: scale in, but only after the slide (delay = SLIDE_MS).
function appearTile(el) {
  el.firstChild.style.animation = `appear 160ms ease-out ${SLIDE_MS}ms backwards`;
}

// A short shadow pulse on the wrapper as it slides — adds depth. WAAPI so it
// doesn't fight the inner's pop/appear; cosmetic, so skipped for reduced motion.
function liftTile(el) {
  if (reduceMotion.matches) return;
  el.animate(
    [
      { boxShadow: "0 0 0 rgba(0, 0, 0, 0)" },
      { boxShadow: "0 0.7rem 0.85rem rgba(0, 0, 0, 0.22)", offset: 0.5 },
      { boxShadow: "0 0 0 rgba(0, 0, 0, 0)" },
    ],
    { duration: SLIDE_MS, easing: "ease-out" },
  );
}

// ---- Deferred merge reveal ----
// A merge result keeps its old value while the source slides in; these helpers
// schedule, force, or cancel the swap-to-doubled-value + pop. The pending timer
// is parked on the element (`_reveal`), with its tile on `_revealTile`.

// Reveal the doubled value once the sliding source has arrived (after SLIDE_MS).
function scheduleReveal(el, tile) {
  clearTimeout(el._reveal); // replace any earlier pending reveal for this tile
  el._revealTile = tile;
  el._reveal = setTimeout(() => {
    el._reveal = null;
    paintTile(el, tile);
    fitText(el);
    popTile(el);
  }, SLIDE_MS);
}

// Commit every pending reveal now — called before the next move so a freshly
// merged tile shows its real value if it's about to slide again (no pop needed).
function flushReveals() {
  for (const el of tileEls.values()) {
    if (!el._reveal) continue;
    clearTimeout(el._reveal);
    el._reveal = null;
    paintTile(el, el._revealTile);
    fitText(el);
  }
}

// Cancel a single pending reveal (e.g. the element is being removed).
function clearReveal(el) {
  if (el._reveal) {
    clearTimeout(el._reveal);
    el._reveal = null;
  }
}

// Cancel all pending reveals (used by undo/new-game, which change the board out
// from under any in-flight reveal).
function clearAllReveals() {
  for (const el of tileEls.values()) clearReveal(el);
}

// Show a floating "+N" above the score that drifts up and fades.
function floatScore(added) {
  scoreAddEl.textContent = `+${added}`;
  scoreAddEl.style.animation = "none";
  void scoreAddEl.offsetWidth; // reflow to restart
  scoreAddEl.style.animation = "floatUp 600ms ease-out";
}

// ---- Input ----
// Keyboard (arrows/WASD/HJKL + Ctrl/Cmd+Z), touch (swipe), and mouse (drag).
function wireInput() {
  document.addEventListener("keydown", (e) => {
    if (confirmDialog.open) return; // don't move the board behind the dialog
    // Ctrl/Cmd+Z undoes the last move.
    if ((e.ctrlKey || e.metaKey) && e.code === "KeyZ" && !e.shiftKey) {
      e.preventDefault();
      undo();
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return; // leave shortcuts alone
    const dir = GAME_KEYS[e.code];
    if (!dir) return;
    e.preventDefault(); // stop arrow keys from scrolling the page
    handleMove(dir);
  });

  // `start` is the anchor point for the current swipe/drag (null when idle).
  let start = null;
  boardEl.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length > 1) {
        start = null; // ignore multi-touch (pinch/zoom)
        return;
      }
      const t = e.touches[0];
      start = { x: t.pageX, y: t.pageY };
    },
    { passive: true },
  );
  // Fire the instant the threshold is crossed, then re-anchor so a single
  // continuous drag can trigger several moves. `passive: false` lets us
  // preventDefault to stop the page scrolling while swiping the board.
  boardEl.addEventListener(
    "touchmove",
    (e) => {
      e.preventDefault();
      const t = e.touches[0];
      if (!start || !t) return;
      const dir = swipeDir(t.pageX - start.x, t.pageY - start.y);
      if (dir) {
        handleMove(dir);
        start = { x: t.pageX, y: t.pageY }; // re-anchor for the next swipe
      }
    },
    { passive: false },
  );
  boardEl.addEventListener("touchend", (e) => {
    const t = e.changedTouches[0];
    if (start && t) {
      // Catch a final swipe shorter than re-anchoring would have triggered.
      const dir = swipeDir(t.pageX - start.x, t.pageY - start.y);
      if (dir) handleMove(dir);
    }
    start = null;
  });

  // Mouse drag mirrors touch but fires once, on release.
  boardEl.addEventListener("mousedown", (e) => {
    start = { x: e.pageX, y: e.pageY };
  });
  boardEl.addEventListener("mouseup", (e) => {
    if (!start) return;
    const dir = swipeDir(e.pageX - start.x, e.pageY - start.y);
    if (dir) handleMove(dir);
  });
}

// Turn a drag offset into a direction, or null if it's below the threshold.
// The dominant axis wins, so a mostly-horizontal drag is Left/Right, etc.
function swipeDir(dx, dy) {
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  if (Math.max(absX, absY) < SWIPE_THRESHOLD) return null;
  if (absX >= absY) return dx > 0 ? "Right" : "Left";
  return dy > 0 ? "Down" : "Up";
}

// ---- Engine: grid model ----
// A SIZE x SIZE grid of cells. Each cell holds at most one `tile` and a transient
// `mergedTile` marker used to forbid a second merge into the same cell per move.
class Grid {
  // `initTiles` (from a save or undo snapshot) seeds tiles back into their cells.
  constructor(size, initTiles) {
    this.size = size;
    this.cells = Array.from({ length: size }, (_, y) =>
      Array.from({ length: size }, (_, x) => {
        const tile = initTiles?.find((t) => t.x === x && t.y === y);
        return { x, y, tile: tile ? { ...tile } : null, mergedTile: null };
      }),
    );
  }

  // Cell at (x, y); throws if out of bounds so logic errors surface loudly.
  getCellAt(x, y) {
    if (x < 0 || y < 0 || x >= this.size || y >= this.size)
      throw new Error("Invalid cell coordinates");
    return this.cells[y][x];
  }

  // All tiles currently on the board (the model's flat view of occupied cells).
  get tiles() {
    return this.cells
      .flat()
      .filter((cell) => cell.tile)
      .map((cell) => cell.tile);
  }

  // Drop a tile into its cell (no-op for null, so callers can pass getRandTile()).
  addTile(tile) {
    if (!tile) return;
    this.getCellAt(tile.x, tile.y).tile = tile;
  }

  // Pick a random empty cell and return a fresh tile for it (null if full).
  getRandTile() {
    const empty = this.cells.flat().filter((c) => !c.tile);
    if (!empty.length) return null;
    const cell = empty[Math.floor(Math.random() * empty.length)];
    return makeTile(cell.x, cell.y);
  }

  // Return the board as "lines" ordered so index 0 is the wall a tile slides
  // toward. This normalizes all four directions, so slideTiles can treat every
  // move as "compact toward index 0" without caring which way it is.
  getCellsByDir(dir) {
    switch (dir) {
      case "Left":
        return this.cells; // rows, left-to-right
      case "Right":
        return this.cells.map((row) => [...row].reverse()); // rows, reversed
      case "Up":
        return Array.from({ length: this.size }, (_, x) =>
          Array.from({ length: this.size }, (_, y) => this.getCellAt(x, y)),
        ); // columns, top-to-bottom
      default: // Down
        return Array.from({ length: this.size }, (_, x) =>
          Array.from({ length: this.size }, (_, y) =>
            this.getCellAt(x, this.size - 1 - y),
          ),
        ); // columns, bottom-to-top
    }
  }
}

// Slide every tile in `dir`, committing moves and merges to the model at once.
// The DOM transitions the motion; merged-away source tiles are returned so they
// can slide into the merge cell before being removed.
function slideTiles(grid, dir) {
  let addedScore = 0;
  let merges = 0;
  let moved = false;
  const mergedAway = [];

  // Each line is ordered wall-first; walk outward and pull tiles toward the wall.
  for (const line of grid.getCellsByDir(dir)) {
    line.forEach((currentCell, i) => {
      if (i === 0 || !currentCell?.tile) return; // index 0 is the wall; skip empties
      const currentTile = currentCell.tile;
      const dstCell = findDestinationCell(line, i, currentTile);
      if (!dstCell) return; // nowhere to go: already settled

      moved = true;
      currentCell.tile = null; // leaving this cell
      currentTile.x = dstCell.x; // commit the new position to the model now
      currentTile.y = dstCell.y;

      if (dstCell.tile) {
        // Merge: keep the destination tile, double it, and retire the mover.
        const dstTile = dstCell.tile;
        dstCell.mergedTile = currentTile; // block a second merge into this cell
        dstTile.value *= 2;
        addedScore += dstTile.value;
        merges++;
        mergedAway.push(currentTile); // the source becomes a sliding "ghost"
      } else {
        dstCell.tile = currentTile; // plain move into an empty cell
      }
    });
  }

  // Clear the per-move merge markers so they don't leak into the next move
  // or the game-over check.
  for (const row of grid.cells) for (const cell of row) cell.mergedTile = null;

  return { addedScore, merges, hasMoved: moved, mergedAway };
}

// Walk from a tile toward the wall and return the furthest cell it can land in:
// the last empty cell, or a same-valued cell it can merge with (one that hasn't
// already absorbed a merge this move). Returns null if it can't move.
function findDestinationCell(line, startIndex, tile) {
  let dstCell = null;
  for (let j = startIndex - 1; j >= 0; j--) {
    const cell = line[j];
    if (!cell.tile || (!cell.mergedTile && cell.tile.value === tile.value)) {
      dstCell = cell; // empty or mergeable: keep going to find the furthest
    } else {
      return dstCell; // blocked: stop at the last good cell
    }
  }
  return dstCell;
}

// Game over when no direction has any possible move or merge.
function isGameOver() {
  return DIRECTIONS.every((dir) => !hasMoveInDir(grid, dir));
}

// Is any move possible in `dir`? (Same scan as slideTiles, but read-only.)
function hasMoveInDir(grid, dir) {
  for (const line of grid.getCellsByDir(dir)) {
    for (let i = 0; i < line.length; i++) {
      if (!i || !line[i]?.tile) continue; // skip the wall and empty cells
      if (findDestinationCell(line, i, line[i].tile)) return true;
    }
  }
  return false;
}

// ---- Tiles ----

// Make a tile at (x, y). New tiles are 90% a 2 and 10% a 4; the id is unique and
// stable so render() can track this tile across moves.
function makeTile(x, y, value) {
  return {
    id: `tile-${x}-${y}-${Math.random().toString(36).slice(2, 15)}`,
    x,
    y,
    value: value ?? (Math.random() < 0.9 ? 2 : 4),
  };
}

// A tile on a random unoccupied cell, given the tiles already placed.
function createRandTile(existing = []) {
  let x;
  let y;
  do {
    x = Math.floor(Math.random() * SIZE);
    y = Math.floor(Math.random() * SIZE);
  } while (existing.some((t) => t.x === x && t.y === y)); // retry until empty
  return makeTile(x, y);
}

// ---- Persistence ----

// Load the saved game for this board size, or start fresh if there's none/invalid.
function loadGame() {
  bestScore = Number(localStorage.getItem(BEST_KEY)) || 0;
  try {
    const saved = JSON.parse(localStorage.getItem(GAME_KEY));
    if (!saved || !Array.isArray(saved.tiles) || !saved.tiles.length)
      throw new Error("no save"); // jump to the new-game fallback
    grid = new Grid(SIZE, saved.tiles);
    score = saved.score || 0;
    bestScore = Math.max(bestScore, saved.bestScore || 0);
    setStatus(saved.isOver ? "over" : "playing");
    renderScore();
    render();
    updateUndoButton();
  } catch {
    newGame();
  }
}

// Persist the current game and best score to localStorage.
function saveGame() {
  const tiles = grid.tiles;
  const game = {
    size: String(SIZE),
    score,
    bestScore,
    tiles,
    topTile: tiles.reduce((max, t) => Math.max(max, t.value), 2), // highest reached
    isOver: status === "over",
  };
  localStorage.setItem(GAME_KEY, JSON.stringify(game));
  localStorage.setItem(BEST_KEY, String(bestScore));
}

// Entry point — runs last so every function and class above is defined.
init();
