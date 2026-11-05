/* js/minigames/seating.js — "סידור הושבה": seat the eight guests. Every neighbour pair has a written reaction.
 * Tap a guest, tap a seat (or drag). Tap a seated guest to lift them. "להגיש" when all are seated.
 * There is no perfect arrangement; the funniest one is valid (SPEC §5 ch.8).
 */
import { el, frame, say, think, keys } from './common.js';
import { npcSVG } from '../art/npcs.js';

export const id = 'seating';

export function run(host, ctx) {
  const C = ctx.content;
  const f = frame(host, { cls: 'mg-seating' });
  return new Promise((resolve) => {
    let finished = false;
    const seats = Array(8).fill(null);     // 0-3 top row, 4-7 bottom row
    let selected = null;                   // guest id in hand
    f.status.innerHTML = `<span class="mg-title">${C.icon} ${C.title}</span><span class="st-score">שלום: <bdi>0</bdi></span>`;
    const scoreEl = f.status.querySelector('.st-score bdi');
    say(f.npc, 'כולם עומדים. אף אחד לא יושב. כולם מחכים שמישהו יגיד להם איפה. זה אני.', 'tuvia');
    think(f.aside, 'אין סידור מושלם. בדקתי. גם איזי בדקה. בסוף שמים את גיטל ליד הסיר.');

    const table = el('div', 'st-table');
    const top = el('div', 'st-row');
    const mid = el('div', 'st-cloth', '🕯️ 🍲 🕯️');
    const bottom = el('div', 'st-row');
    const seatEls = [];
    for (let i = 0; i < 8; i++) {
      const s = el('button', 'st-seat');
      s.type = 'button'; s.dataset.i = i;
      s.setAttribute('aria-label', 'כיסא ' + (i + 1));
      s.addEventListener('click', () => onSeat(i));
      s.addEventListener('dragover', (e) => e.preventDefault());
      s.addEventListener('drop', (e) => { e.preventDefault(); const g = e.dataTransfer.getData('text/plain'); if (g) { selected = g; onSeat(i); } });
      (i < 4 ? top : bottom).appendChild(s); seatEls.push(s);
    }
    table.append(top, mid, bottom);
    const bench = el('div', 'st-bench');
    const reactions = el('div', 'st-reactions');
    f.main.append(table, bench, reactions);
    const serve = el('button', 'btn btn-big st-serve', '🍲 להגיש');
    serve.type = 'button'; serve.disabled = true;
    serve.addEventListener('click', () => finish());
    f.controls.append(serve);

    const chip = (g, cls = '') => {
      const c = el('button', 'st-guest ' + cls, `<span class="st-guest-art">${npcSVG(g, { size: 44 })}</span><span class="st-guest-name">${C.names[g]}</span>`);
      c.type = 'button'; c.dataset.g = g; c.draggable = true;
      c.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', g); selected = g; });
      return c;
    };
    function renderBench() {
      bench.innerHTML = '';
      for (const g of C.guests) {
        if (seats.includes(g)) continue;
        const c = chip(g, selected === g ? 'selected' : '');
        c.addEventListener('click', () => { selected = selected === g ? null : g; renderBench(); table.classList.toggle('picking', !!selected); });
        bench.appendChild(c);
      }
      if (!bench.children.length) bench.innerHTML = '<span class="st-bench-empty">כולם יושבים. להגיש?</span>';
    }
    function renderSeats() {
      seatEls.forEach((s, i) => {
        s.innerHTML = seats[i] ? chip(seats[i], 'seated').innerHTML : '<span class="st-empty">🪑</span>';
        s.classList.toggle('full', !!seats[i]);
      });
    }
    function onSeat(i) {
      if (finished) return;
      if (selected) {
        const from = seats.indexOf(selected);
        if (from >= 0) seats[from] = seats[i]; // swap if moving a seated guest
        else if (seats[i]) { /* bump the sitter back to the bench */ }
        seats[i] = selected; selected = null;
        ctx.audio.playSfx('thud');
      } else if (seats[i]) {
        selected = seats[i]; seats[i] = null; ctx.audio.playSfx('pop');
      }
      table.classList.toggle('picking', !!selected);
      renderBench(); renderSeats(); react();
    }
    function pairKey(a, b) { return C.pairs[a + '|' + b] ? a + '|' + b : b + '|' + a; }
    function pairsNow() {
      const out = [];
      const add = (i, j) => { if (seats[i] && seats[j]) { const k = pairKey(seats[i], seats[j]); if (C.pairs[k]) out.push({ k, ...C.pairs[k] }); } };
      for (let i = 0; i < 3; i++) { add(i, i + 1); add(i + 4, i + 5); }
      for (let i = 0; i < 4; i++) add(i, i + 4);
      return out;
    }
    let shown = new Set();
    function react() {
      const ps = pairsNow();
      const score = ps.reduce((s, p) => s + p.v, 0);
      scoreEl.textContent = score;
      scoreEl.parentNode.classList.toggle('bad', score < 0);
      for (const p of ps) if (!shown.has(p.k)) {
        shown.add(p.k);
        const r = el('div', 'st-react ' + (p.v > 0 ? 'good' : p.v < 0 ? 'bad' : ''), `<span class="st-react-v">${p.v > 0 ? '+' + p.v : p.v}</span> ${p.t}`);
        reactions.prepend(r);
        while (reactions.children.length > 4) reactions.lastChild.remove();
        ctx.audio.playSfx(p.v > 0 ? 'ding' : p.v < 0 ? 'boo' : 'click');
      }
      serve.disabled = !seats.every(Boolean);
    }
    const unbind = keys({ Enter: () => { if (!serve.disabled) finish(); } });

    function finish(forced) {
      if (finished) return;
      if (forced != null) { const free = C.guests.filter((g) => !seats.includes(g)); for (let i = 0; i < 8; i++) if (!seats[i]) seats[i] = free.shift(); renderSeats(); renderBench(); react(); }
      finished = true; unbind();
      const ps = pairsNow();
      const score = ps.reduce((s, p) => s + p.v, 0);
      const band = C.bands.find((b) => score >= b.min) || C.bands[C.bands.length - 1];
      const win = score >= 2;
      say(f.npc, band.t, 'tuvia');
      ctx.audio.playSfx(win ? 'cheer' : 'nu');
      setTimeout(() => resolve({ win, score, text: band.t, pairs: ps.map((p) => p.t) }), 1400);
    }
    renderBench(); renderSeats();
    ctx.control({ finish: (win) => finish(!!win) });
  });
}
