/* js/minigames/common.js — tiny DOM + timing helpers shared by the minigames. */

export const el = (tag, cls = '', html = '') => { const e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; return e; };
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));
export const rand = (a, b) => a + Math.random() * (b - a);
export const randInt = (a, b) => Math.floor(rand(a, b + 1));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/** A speech line that fades: `say(box, text)` replaces the box's content with a small pop animation. */
export function say(box, text, cls = '') {
  if (!box) return;
  box.innerHTML = '';
  const b = el('div', 'mg-say ' + cls, text);
  box.appendChild(b);
  requestAnimationFrame(() => b.classList.add('in'));
}

/** Builds the standard minigame frame: top status row, NPC-comment box, main area, Tuvia aside bubble, controls row. */
export function frame(host, opts = {}) {
  host.innerHTML = '';
  const root = el('div', 'mg-root ' + (opts.cls || ''));
  const status = el('div', 'mg-status');
  const npc = el('div', 'mg-npc');
  const main = el('div', 'mg-main');
  const aside = el('div', 'mg-aside');
  const controls = el('div', 'mg-controls');
  root.append(status, npc, main, aside, controls);
  host.appendChild(root);
  return { root, status, npc, main, aside, controls };
}

/** Tuvia's thought bubble inside a minigame. */
export function think(box, text) {
  if (!box) return;
  box.innerHTML = `<div class="mg-think"><span class="mg-think-icon">💭</span><span>${text}</span></div>`;
  const t = box.firstChild;
  requestAnimationFrame(() => t.classList.add('in'));
}

/** Keyboard helper: returns an unbind function. */
export function keys(map) {
  const h = (e) => {
    const fn = map[e.key] || map[e.code];
    if (fn) { e.preventDefault(); fn(e); }
  };
  window.addEventListener('keydown', h);
  return () => window.removeEventListener('keydown', h);
}

/** A ticking timer bar. Returns { stop, el }. onDone called when it reaches 0. */
export function timerBar(seconds, onDone, onTick) {
  const bar = el('div', 'mg-timer');
  const fill = el('div', 'mg-timer-fill');
  const label = el('span', 'mg-timer-label', `<bdi>${seconds}</bdi>`);
  bar.append(fill, label);
  const t0 = performance.now();
  let raf = 0, done = false;
  const step = () => {
    if (done) return;
    const left = Math.max(0, seconds - (performance.now() - t0) / 1000);
    fill.style.width = (left / seconds * 100) + '%';
    label.innerHTML = `<bdi>${Math.ceil(left)}</bdi>`;
    bar.classList.toggle('low', left < 10);
    if (onTick) onTick(left);
    if (left <= 0) { done = true; onDone && onDone(); return; }
    raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  return { el: bar, stop() { done = true; cancelAnimationFrame(raf); }, left() { return Math.max(0, seconds - (performance.now() - t0) / 1000); } };
}
