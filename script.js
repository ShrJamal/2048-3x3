// 2048 3x3 — a single-file, framework-free port.
// Tiles are absolutely-positioned elements with stable ids; movement is animated
// with the Web Animations API, and the grid model drives merges and game-over.

const SIZE = 3;

const SLIDE_MS = 100;
const POP_MS = 200;

const COLORS = new Map([
  [2, { bg: "#eee4da", fg: "#776e65" }],
  [4, { bg: "#ede0c8", fg: "#776e65" }],
  [8, { bg: "#f2b179", fg: "#f9f6f2" }],
  [16, { bg: "#f59563", fg: "#f9f6f2" }],
  [32, { bg: "#f67c5f", fg: "#f9f6f2" }],
  [64, { bg: "#f65e3b", fg: "#f9f6f2" }],
  [128, { bg: "#edcf72", fg: "#f9f6f2" }],
  [256, { bg: "#edcc61", fg: "#f9f6f2" }],
  [512, { bg: "#edc850", fg: "#f9f6f2" }],
  [1024, { bg: "#edc53f", fg: "#f9f6f2" }],
  [2048, { bg: "#edc22e", fg: "#f9f6f2" }],
  [4096, { bg: "#ccbf3f", fg: "#f9f6f2" }],
  [8192, { bg: "#33a4d8", fg: "#f9f6f2" }],
  [16384, { bg: "#a06cd5", fg: "#f9f6f2" }],
  [32768, { bg: "#f07b7b", fg: "#f9f6f2" }],
  [65536, { bg: "#7acba5", fg: "#f9f6f2" }],
  [131072, { bg: "#ffb347", fg: "#f9f6f2" }],
]);

const DIRECTIONS = ["Up", "Down", "Left", "Right"];

// Arrow keys, WASD, and Vim HJKL all map to a direction.
const GAME_KEYS = {
  ArrowLeft: "Left", KeyA: "Left", KeyH: "Left",
  ArrowRight: "Right", KeyD: "Right", KeyL: "Right",
  ArrowUp: "Up", KeyW: "Up", KeyK: "Up",
  ArrowDown: "Down", KeyS: "Down", KeyJ: "Down",
};

const SWIPE_THRESHOLD = 60;

const GAME_KEY = `GAME-${SIZE}x${SIZE}`;
const BEST_KEY = `BEST_SCORE-${SIZE}x${SIZE}`;

const CSS_POS = (pos) =>
  `calc(var(--grid-pad) + ${pos} * ( var(--cell-size) + var(--grid-gap) ))`;

// ---- DOM references ----
const boardEl = document.getElementById("board");
const messageEl = document.getElementById("game-message");
const scoreValueEl = document.getElementById("score-value");
const scoreAddEl = document.getElementById("score-add");
const bestValueEl = document.getElementById("best-value");
const nbrFormat = new Intl.NumberFormat();

// ---- Game state ----
let grid;
let score = 0;
let bestScore = 0;
let status = "playing"; // "playing" | "over"
let isMoving = false;
const tileEls = new Map(); // tile.id -> HTMLElement

function init() {
  boardEl.style.setProperty("--game-size", SIZE);
  renderCells();
  wireInput();
  document.getElementById("new-game").addEventListener("click", newGame);
  document.getElementById("play-again").addEventListener("click", newGame);
  loadGame();
}

// The core move: slide + merge, spawn a tile, update score, check game over.
async function handleMove(dir) {
  if (isMoving || status !== "playing") return;
  isMoving = true;
  try {
    const { addedScore, hasMoved } = await slideTiles(grid, dir);
    if (!hasMoved) return;

    grid.addTile(grid.getRandTile());
    reconcileTiles();

    if (addedScore > 0) addScore(addedScore);
    if (isGameOver()) setStatus("over");

    saveGame();
  } finally {
    isMoving = false;
  }
}

function newGame() {
  for (const el of tileEls.values()) el.remove();
  tileEls.clear();

  grid = new Grid(SIZE);
  const first = createRandTile(grid.tiles);
  grid.addTile(first);
  grid.addTile(createRandTile(grid.tiles));

  score = 0;
  setStatus("playing");
  renderScore();
  reconcileTiles();
  saveGame();
}

// ---- Rendering ----

// Paint the static background cells once.
function renderCells() {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < SIZE * SIZE; i++) {
    const cell = document.createElement("span");
    cell.className = "cell";
    frag.appendChild(cell);
  }
  boardEl.insertBefore(frag, messageEl);
}

// Diff the live grid against the DOM: create new tiles, update + pop changed
// ones, and remove tiles that were merged away.
function reconcileTiles() {
  const live = grid.tiles;
  const liveIds = new Set(live.map((t) => t.id));

  for (const [id, el] of tileEls) {
    if (!liveIds.has(id)) {
      el.remove();
      tileEls.delete(id);
    }
  }

  for (const tile of live) {
    let el = tileEls.get(tile.id);
    if (!el) {
      el = createTileEl(tile);
      tileEls.set(tile.id, el);
      boardEl.insertBefore(el, messageEl);
      pop(el);
    } else {
      const changed = el.dataset.value !== String(tile.value);
      paintTile(el, tile);
      if (changed) pop(el);
    }
    el.style.left = CSS_POS(tile.x);
    el.style.top = CSS_POS(tile.y);
  }
}

function createTileEl(tile) {
  const el = document.createElement("div");
  el.className = "tile";
  el.id = tile.id;
  const span = document.createElement("span");
  el.appendChild(span);
  paintTile(el, tile);
  return el;
}

function paintTile(el, tile) {
  const color = COLORS.get(tile.value);
  el.dataset.value = tile.value;
  el.style.backgroundColor = color?.bg ?? "#3c3a32";
  el.firstChild.style.color = color?.fg ?? "#f9f6f2";
  el.firstChild.textContent = tile.value;
}

function renderScore() {
  scoreValueEl.textContent = nbrFormat.format(score);
  bestValueEl.textContent = nbrFormat.format(bestScore);
}

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

function setStatus(next) {
  status = next;
  messageEl.hidden = next === "playing";
}

function pop(el) {
  el.style.animation = "none";
  void el.offsetWidth; // restart the animation
  el.style.animation = `pop ${POP_MS}ms ease-in-out`;
}

function floatScore(added) {
  scoreAddEl.textContent = `+${added}`;
  scoreAddEl.style.animation = "none";
  void scoreAddEl.offsetWidth;
  scoreAddEl.style.animation = "zoomAndFade 500ms ease-in-out";
}

// ---- Input ----
function wireInput() {
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
    const dir = GAME_KEYS[e.code];
    if (!dir) return;
    e.preventDefault();
    handleMove(dir);
  });

  let start = { x: 0, y: 0 };
  boardEl.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length > 1) return;
      const t = e.touches[0];
      start = { x: t.pageX, y: t.pageY };
    },
    { passive: true },
  );
  boardEl.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });
  boardEl.addEventListener("touchend", (e) => {
    const t = e.changedTouches[0];
    if (!t) return;
    const dir = swipeDir(t.pageX - start.x, t.pageY - start.y);
    if (dir) handleMove(dir);
  });

  boardEl.addEventListener("mousedown", (e) => {
    start = { x: e.pageX, y: e.pageY };
  });
  boardEl.addEventListener("mouseup", (e) => {
    const dir = swipeDir(e.pageX - start.x, e.pageY - start.y);
    if (dir) handleMove(dir);
  });
}

function swipeDir(dx, dy) {
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  if (Math.max(absX, absY) < SWIPE_THRESHOLD) return null;
  if (absX >= absY) return dx > 0 ? "Right" : "Left";
  return dy > 0 ? "Down" : "Up";
}

// ---- Engine: grid model ----
class Grid {
  constructor(size, initTiles) {
    this.size = size;
    this.cells = Array.from({ length: size }, (_, y) =>
      Array.from({ length: size }, (_, x) => {
        const tile = initTiles?.find((t) => t.x === x && t.y === y);
        return { x, y, tile: tile ? { ...tile } : null, mergedTile: null };
      }),
    );
  }

  getCellAt(x, y) {
    if (x < 0 || y < 0 || x >= this.size || y >= this.size)
      throw new Error("Invalid cell coordinates");
    return this.cells[y][x];
  }

  get tiles() {
    return this.cells
      .flat()
      .filter((cell) => cell.tile)
      .map((cell) => cell.tile);
  }

  addTile(tile) {
    if (!tile) return;
    this.getCellAt(tile.x, tile.y).tile = tile;
  }

  // Pick a random empty cell and return a fresh tile for it.
  getRandTile() {
    const empty = this.cells.flat().filter((c) => !c.tile);
    if (!empty.length) return null;
    const cell = empty[Math.floor(Math.random() * empty.length)];
    return makeTile(cell.x, cell.y);
  }

  // Return cells as lines ordered so index 0 is the wall a tile slides toward.
  getCellsByDir(dir) {
    switch (dir) {
      case "Left":
        return this.cells;
      case "Right":
        return this.cells.map((row) => [...row].reverse());
      case "Up":
        return Array.from({ length: this.size }, (_, x) =>
          Array.from({ length: this.size }, (_, y) => this.getCellAt(x, y)),
        );
      default: // Down
        return Array.from({ length: this.size }, (_, x) =>
          Array.from({ length: this.size }, (_, y) =>
            this.getCellAt(x, this.size - 1 - y),
          ),
        );
    }
  }
}

// Slide every tile in `dir`, animating movers, then commit positions/merges.
// Returns the score gained and whether anything actually moved.
async function slideTiles(grid, dir) {
  let addedScore = 0;
  const animations = [];
  const afterAnimation = [];

  for (const line of grid.getCellsByDir(dir)) {
    line.forEach((currentCell, i) => {
      if (i === 0 || !currentCell?.tile) return;
      const currentTile = currentCell.tile;
      const dstCell = findDestinationCell(line, i, currentTile);
      if (!dstCell) return;

      currentCell.tile = null;
      animations.push(animateTileTo(currentTile, dstCell.x, dstCell.y));
      afterAnimation.push(() => {
        currentTile.x = dstCell.x;
        currentTile.y = dstCell.y;
      });

      if (dstCell.tile) {
        const dstTile = dstCell.tile;
        dstCell.mergedTile = currentTile;
        afterAnimation.push(() => {
          dstCell.mergedTile = null;
          dstTile.value *= 2;
          addedScore += dstTile.value;
        });
      } else {
        dstCell.tile = currentTile;
      }
    });
  }

  // Wait for the slides, but never let a backgrounded tab — where the browser
  // pauses animations and `.finished` never settles — lock the board.
  if (animations.length)
    await Promise.race([Promise.all(animations), wait(SLIDE_MS + 80)]);
  afterAnimation.forEach((fn) => fn());

  return { addedScore, hasMoved: animations.length > 0 };
}

// Walk toward the wall to find the furthest cell this tile can land in:
// the last empty cell, or a same-valued cell it can merge with (once).
function findDestinationCell(line, startIndex, tile) {
  let dstCell = null;
  for (let j = startIndex - 1; j >= 0; j--) {
    const cell = line[j];
    if (!cell.tile || (!cell.mergedTile && cell.tile.value === tile.value)) {
      dstCell = cell;
    } else {
      return dstCell;
    }
  }
  return dstCell;
}

function isGameOver() {
  return DIRECTIONS.every((dir) => !hasMoveInDir(grid, dir));
}

function hasMoveInDir(grid, dir) {
  for (const line of grid.getCellsByDir(dir)) {
    for (let i = 0; i < line.length; i++) {
      if (!i || !line[i]?.tile) continue;
      if (findDestinationCell(line, i, line[i].tile)) return true;
    }
  }
  return false;
}

function animateTileTo(tile, newX, newY) {
  const el = tileEls.get(tile.id);
  if (!el) return Promise.resolve();
  return el.animate(
    { left: [CSS_POS(tile.x), CSS_POS(newX)], top: [CSS_POS(tile.y), CSS_POS(newY)] },
    { duration: SLIDE_MS, easing: "ease-in-out" },
  ).finished;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---- Tiles ----
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
  } while (existing.some((t) => t.x === x && t.y === y));
  return makeTile(x, y);
}

// ---- Persistence ----
function loadGame() {
  bestScore = Number(localStorage.getItem(BEST_KEY)) || 0;
  try {
    const saved = JSON.parse(localStorage.getItem(GAME_KEY));
    if (!saved || !Array.isArray(saved.tiles) || !saved.tiles.length)
      throw new Error("no save");
    grid = new Grid(SIZE, saved.tiles);
    score = saved.score || 0;
    bestScore = Math.max(bestScore, saved.bestScore || 0);
    setStatus(saved.isOver ? "over" : "playing");
    renderScore();
    reconcileTiles();
  } catch {
    newGame();
  }
}

function saveGame() {
  const tiles = grid.tiles;
  const game = {
    size: String(SIZE),
    score,
    bestScore,
    tiles,
    topTile: tiles.reduce((max, t) => Math.max(max, t.value), 2),
    isOver: status === "over",
  };
  localStorage.setItem(GAME_KEY, JSON.stringify(game));
  localStorage.setItem(BEST_KEY, String(bestScore));
}

// Entry point — runs last so every function and class above is defined.
init();
