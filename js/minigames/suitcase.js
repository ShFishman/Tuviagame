/* js/minigames/suitcase.js — "בדיקה ביטחונית": pack the suitcase so the X-ray doesn't flag the pot.
 * Tap a piece in the tray, tap a cell to place it (anchor = the piece's first cell). 🔄 rotates.
 * Tap a placed piece to lift it. Win: every piece placed and the pot touches no wall.
 */
import { el, frame, say, think, keys, timerBar, pick } from './common.js';

export const id = 'suitcase';

function rotate(cells) {
  const maxY = Math.max(...cells.map((c) => c[1]));
  const r = cells.map(([x, y]) => [maxY - y, x]);
  const minX = Math.min(...r.map((c) => c[0])), minY = Math.min(...r.map((c) => c[1]));
  return r.map(([x, y]) => [x - minX, y - minY]).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
}

export function run(host, ctx) {
  const C = ctx.content;
  const { cols, rows } = C;
  const f = frame(host, { cls: 'mg-suitcase' });
  return new Promise((resolve) => {
    let finished = false;
    const pieces = C.pieces.map((p) => ({ ...p, shape: p.cells.map((c) => c.slice()), placed: null }));
    const grid = Array.from({ length: rows }, () => Array(cols).fill(null));
    let selected = null;
    let cursor = { x: 1, y: 1 };
    let saidPotOk = false, saidHalf = false;

    // ---- DOM ----
    f.status.innerHTML = `<span class="mg-title">${C.icon} ${C.title}</span>`;
    const timer = timerBar(C.seconds, () => finish(false, 'timeout'), (left) => { if (left < 20 && !f.root.dataset.hurry) { f.root.dataset.hurry = '1'; say(f.npc, C.shira.hurry, 'shira'); } });
    f.status.appendChild(timer.el);
    say(f.npc, 'תארוז. הסיר לא נוגע בקיר. כל הפריטים בפנים. יש שעון.', 'shira');
    think(f.aside, C.tuvia.start);

    const board = el('div', 'sc-board');
    board.style.setProperty('--cols', cols);
    board.style.setProperty('--rows', rows);
    const cellEls = [];
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const c = el('button', 'sc-cell');
      c.type = 'button'; c.dataset.x = x; c.dataset.y = y;
      c.setAttribute('aria-label', `משבצת ${x + 1},${y + 1}`);
      c.addEventListener('click', () => onCell(x, y));
      c.addEventListener('pointerenter', () => { cursor = { x, y }; preview(); });
      board.appendChild(c); cellEls.push(c);
    }
    const tray = el('div', 'sc-tray');
    const rules = el('div', 'sc-rules', C.rules.map((r) => `<span>✔ ${r}</span>`).join(''));
    f.main.append(board, rules, tray);

    const rotBtn = el('button', 'btn btn-secondary', '🔄 לסובב');
    rotBtn.type = 'button';
    rotBtn.addEventListener('click', rotateSelected);
    f.controls.append(rotBtn);

    function renderTray() {
      tray.innerHTML = '';
      for (const p of pieces) {
        const b = el('button', 'sc-piece' + (p.placed ? ' placed' : '') + (selected === p ? ' selected' : ''));
        b.type = 'button';
        b.style.setProperty('--c', p.color);
        const w = Math.max(...p.shape.map((c) => c[0])) + 1, h = Math.max(...p.shape.map((c) => c[1])) + 1;
        const mini = el('div', 'sc-mini');
        mini.style.gridTemplateColumns = `repeat(${w}, 10px)`; mini.style.gridTemplateRows = `repeat(${h}, 10px)`;
        for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
          const on = p.shape.some(([cx, cy]) => cx === xx && cy === yy);
          mini.appendChild(el('i', on ? 'on' : ''));
        }
        b.append(el('span', 'sc-piece-icon', p.icon), mini, el('span', 'sc-piece-name', p.name));
        b.addEventListener('click', () => { if (p.placed) lift(p); else { selected = p; renderTray(); preview(); } });
        tray.appendChild(b);
      }
    }

    function canPlace(p, ax, ay) {
      for (const [dx, dy] of p.shape) {
        const x = ax + dx, y = ay + dy;
        if (x < 0 || y < 0 || x >= cols || y >= rows) return false;
        if (grid[y][x] && grid[y][x] !== p) return false;
      }
      return true;
    }
    function preview() {
      for (const c of cellEls) c.classList.remove('ghost', 'bad');
      if (!selected || selected.placed) return;
      const ok = canPlace(selected, cursor.x, cursor.y);
      for (const [dx, dy] of selected.shape) {
        const x = cursor.x + dx, y = cursor.y + dy;
        if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
        cellEls[y * cols + x].classList.add(ok ? 'ghost' : 'bad');
      }
    }
    function renderBoard() {
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        const c = cellEls[y * cols + x], p = grid[y][x];
        c.style.setProperty('--c', p ? p.color : 'transparent');
        c.classList.toggle('full', !!p);
        c.classList.toggle('pot', !!p && p.id === 'pot');
        c.innerHTML = p && p.placed.x === x && p.placed.y === y ? `<span>${p.icon}</span>` : '';
      }
      preview();
    }
    function potTouchesWall() {
      const pot = pieces.find((p) => p.id === 'pot');
      if (!pot.placed) return null;
      return pot.shape.some(([dx, dy]) => { const x = pot.placed.x + dx, y = pot.placed.y + dy; return x === 0 || y === 0 || x === cols - 1 || y === rows - 1; });
    }
    function onCell(x, y) {
      cursor = { x, y };
      const occupant = grid[y][x];
      if (selected && !selected.placed) {
        if (!canPlace(selected, x, y)) { if (occupant) say(f.npc, C.shira.overlap, 'shira'); ctx.audio.playSfx('boo'); preview(); return; }
        place(selected, x, y);
      } else if (occupant) {
        lift(occupant);
      }
    }
    function place(p, x, y) {
      for (const [dx, dy] of p.shape) grid[y + dy][x + dx] = p;
      p.placed = { x, y };
      ctx.audio.playSfx('thud');
      selected = pieces.find((q) => !q.placed) || null;
      renderTray(); renderBoard();
      if (p.id === 'pot') {
        const wall = potTouchesWall();
        say(f.npc, wall ? C.shira.pot_edge : C.shira.pot_ok, 'shira');
        if (!wall) saidPotOk = true;
      } else say(f.npc, C.shira[p.id] || '', 'shira');
      const n = pieces.filter((q) => q.placed).length;
      if (n >= 4 && !saidHalf) { saidHalf = true; think(f.aside, C.tuvia.half); }
      check();
    }
    function lift(p) {
      if (!p.placed) return;
      for (const [dx, dy] of p.shape) grid[p.placed.y + dy][p.placed.x + dx] = null;
      p.placed = null; selected = p;
      ctx.audio.playSfx('pop');
      say(f.npc, C.shira.lift, 'shira');
      renderTray(); renderBoard();
    }
    function rotateSelected() {
      if (!selected || selected.placed) return;
      selected.shape = rotate(selected.shape);
      ctx.audio.playSfx('click');
      renderTray(); preview();
    }
    function check() {
      if (pieces.every((p) => p.placed) && potTouchesWall() === false) finish(true, 'win');
    }
    function finish(win, why) {
      if (finished) return;
      finished = true;
      timer.stop(); unbind();
      say(f.npc, win ? C.shira.win : C.shira.timeout, 'shira');
      think(f.aside, win ? C.tuvia.win : C.tuvia.lose);
      ctx.audio.playSfx(win ? 'tada' : 'boo');
      board.classList.add(win ? 'won' : 'lost');
      setTimeout(() => resolve({ win, why, placed: pieces.filter((p) => p.placed).length, timeLeft: Math.round(timer.left()) }), win ? 900 : 1200);
    }

    const unbind = keys({
      ArrowLeft: () => { cursor.x = Math.max(0, cursor.x - 1); preview(); },
      ArrowRight: () => { cursor.x = Math.min(cols - 1, cursor.x + 1); preview(); },
      ArrowUp: () => { cursor.y = Math.max(0, cursor.y - 1); preview(); },
      ArrowDown: () => { cursor.y = Math.min(rows - 1, cursor.y + 1); preview(); },
      Enter: () => onCell(cursor.x, cursor.y), ' ': () => onCell(cursor.x, cursor.y),
      r: rotateSelected, R: rotateSelected, 'ר': rotateSelected,
      Tab: () => { const free = pieces.filter((p) => !p.placed); if (!free.length) return; const i = free.indexOf(selected); selected = free[(i + 1) % free.length]; renderTray(); preview(); },
      Backspace: () => { const p = grid[cursor.y][cursor.x]; if (p) lift(p); },
      ...Object.fromEntries(pieces.map((p, i) => [String(i + 1), () => { if (!p.placed) { selected = p; renderTray(); preview(); } }])),
    });

    selected = pieces[0];
    renderTray(); renderBoard();
    ctx.control({ finish: (win) => { if (win) { // auto-solve for tests
      for (const p of pieces) if (p.placed) lift(p);
      const solution = { pot: [1, 1], kugel: [4, 0], book1: [0, 0], book2: [2, 0], book3: [4, 2], susp: [0, 1], rug: [1, 3], };
      pieces.find((p) => p.id === 'susp').shape = [[0, 0], [0, 1], [0, 2]];
      pieces.find((p) => p.id === 'book3').shape = [[0, 0], [0, 1]];
      for (const p of pieces) { const [x, y] = solution[p.id]; if (canPlace(p, x, y)) place(p, x, y); }
      if (!finished) finish(true, 'forced');
    } else finish(false, 'forced'); } });
  });
}
