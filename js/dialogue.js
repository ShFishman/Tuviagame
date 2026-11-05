/* js/dialogue.js — the visual-novel presentation layer: scene, NPC, Tuvia, typewriter speech, 💭 asides,
 * narration captions, choices, food cards and generic cards. No game rules here (see main.js).
 *
 * Step format used by js/content/*.js (interpreted in main.js):
 *   { s: 'shira', t: 'text', m: 'mood' }      NPC speech (m = NPC mood). s: 'tuvia' (x = expression) | 'narr'
 *   { a: 'text', x: 'expr' }                  💭 aside (handwriting bubble). `t`/`a` may be {none, tobi, bneibrak, guest}
 *   { n: 'text' }                             narration caption
 *   { x: 'expr' }                             Tuvia expression only
 *   { fx: { mood, pages, sfx, sting, cue, music, shake, cola, rugelach, flag, badPolite, goat, disguise } }
 *   { q: { who, t, pages, margin } }          notebook quote (+pages)
 *   { food: 'id', from, react:{eat,polite,refuse}, then:{...}, noRefuse, polite:false }
 *   { choices: [{ t, k: 'innocent'|'disguise'|'plain', dis, go, fx, when }] }
 *   { mg: 'id', go: { win, lose } }           minigame
 *   { go } · { when: fn, go, else } · { ingredient } · { disguise: true } · { npc, m } · { bg } · { end } · { ending }
 */
import { tuviaSVG } from './art/tuvia.js';
import { npcSVG, NPC_NAMES } from './art/npcs.js';
import { sceneSVG } from './art/scenes.js';

export const SPEEDS = { slow: 42, normal: 22, fast: 9, instant: 0 };

/** Wrap Latin letters / digits in <bdi> so they sit correctly inside RTL text. */
export function bidi(s) {
  if (typeof s !== 'string') return '';
  return s.replace(/[A-Za-z0-9₪$][A-Za-z0-9₪$ .,'"!?:/-]*[A-Za-z0-9%]|[A-Za-z0-9₪$]/g, (m) => `<bdi>${m}</bdi>`);
}

export function createDialogue(opts) {
  const { stage, dialog, audio, getSettings, getDisguise, onIdle, onGoat } = opts;
  const sceneEl = stage.querySelector('.scene-bg');
  const npcEl = stage.querySelector('.scene-npc');
  const tuviaEl = stage.querySelector('.scene-tuvia');
  const asideEl = stage.querySelector('.scene-aside');
  const captionEl = stage.querySelector('.scene-caption');
  const nameEl = dialog.querySelector('.dlg-name');
  const textEl = dialog.querySelector('.dlg-text');
  const choicesEl = dialog.querySelector('.dlg-choices');
  const hintEl = dialog.querySelector('.dlg-hint');
  const box = dialog.querySelector('.dlg-box');

  let current = { npc: null, mood: 'neutral', expr: 'smirk', pose: 'listen', bg: null };
  let waiting = null;        // resolve fn for "tap to continue"
  let typing = null;         // { timer, full, done }
  let idleTimer = 0;
  let lastGoatState = null;

  const resolveText = (t) => {
    if (t == null) return '';
    if (typeof t === 'string') return t;
    const d = getDisguise();
    return t[d] ?? t.none ?? Object.values(t)[0] ?? '';
  };

  function setScene(bg, o = {}) {
    current.bg = bg;
    lastGoatState = o.goat || null;
    sceneEl.innerHTML = sceneSVG(bg, o);
    sceneEl.className = 'scene-bg bg-' + bg;
    const hit = sceneEl.querySelector('.goat-hit');
    if (hit) {
      hit.style.cursor = 'pointer';
      hit.setAttribute('tabindex', '0');
      hit.setAttribute('role', 'button');
      hit.addEventListener('click', (e) => { e.stopPropagation(); onGoat && onGoat(); });
    }
  }
  function refreshScene() { if (current.bg) setScene(current.bg, { goat: lastGoatState }); }
  function setGoatState(s) { lastGoatState = s; refreshScene(); }

  function setNPC(name, mood) {
    current.npc = name || null; current.mood = mood || 'neutral';
    if (!name) { npcEl.innerHTML = ''; npcEl.className = 'scene-npc empty'; return; }
    npcEl.innerHTML = npcSVG(name, { mood: current.mood, size: 200 });
    npcEl.className = 'scene-npc npc-' + name;
    npcEl.classList.remove('pop'); void npcEl.offsetWidth; npcEl.classList.add('pop');
  }
  function setNPCMood(mood) { if (current.npc && mood && mood !== current.mood) { current.mood = mood; npcEl.innerHTML = npcSVG(current.npc, { mood, size: 200 }); } }
  function setTuvia(expr, pose) {
    if (expr) current.expr = expr;
    if (pose) current.pose = pose;
    tuviaEl.innerHTML = tuviaSVG({ expression: current.expr, pose: current.pose, disguise: getDisguise(), crop: 'bust', size: 220, table: false });
  }
  function anim(cls) { const svg = tuviaEl.querySelector('svg'); if (!svg) return; svg.classList.add(cls); setTimeout(() => svg.classList.remove(cls), 1500); }
  function shake() { stage.classList.add('shake'); document.body.classList.add('shake'); setTimeout(() => { stage.classList.remove('shake'); document.body.classList.remove('shake'); }, 800); }

  // ---------- tap-to-continue plumbing ----------
  function armIdle() { clearTimeout(idleTimer); idleTimer = setTimeout(() => { if (waiting && onIdle) onIdle(); armIdle(); }, 20000); }
  function disarmIdle() { clearTimeout(idleTimer); }
  function waitTap() {
    return new Promise((res) => { waiting = res; hintEl.classList.add('on'); armIdle(); });
  }
  function tap() {
    if (typing && !typing.done) { finishTyping(); return true; }
    if (waiting) { const r = waiting; waiting = null; hintEl.classList.remove('on'); disarmIdle(); r(); return true; }
    return false;
  }
  dialog.addEventListener('click', (e) => { if (e.target.closest('button')) return; tap(); });
  stage.addEventListener('click', (e) => { if (e.target.closest('.goat-hit')) return; tap(); });
  window.addEventListener('keydown', (e) => {
    if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
    if (e.key === ' ' || e.key === 'Enter') { if (document.querySelector('.card-overlay, .mg-root, .phone')) return; if (tap()) e.preventDefault(); }
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= 9) { const b = choicesEl.querySelectorAll('button')[n - 1]; if (b) { e.preventDefault(); b.click(); } }
  });

  function typeInto(elm, html) {
    // Typewriter over an HTML string: reveal text nodes progressively (tags stay intact).
    return new Promise((res) => {
      const speed = SPEEDS[getSettings().speed] ?? SPEEDS.normal;
      elm.innerHTML = html;
      if (!speed) { typing = { done: true }; res(); return; }
      const nodes = [];
      const walk = (n) => { for (const c of n.childNodes) { if (c.nodeType === 3) nodes.push({ node: c, text: c.data }); else walk(c); } };
      walk(elm);
      for (const n of nodes) n.node.data = '';
      let i = 0, j = 0;
      typing = { done: false, full: nodes, res };
      const step = () => {
        if (typing.done) return;
        if (i >= nodes.length) { typing.done = true; res(); return; }
        const n = nodes[i];
        n.node.data = n.text.slice(0, ++j);
        if (j >= n.text.length) { i++; j = 0; }
        const ch = n.text[j - 1];
        typing.timer = setTimeout(step, ch === '.' || ch === '?' || ch === '!' ? speed * 6 : speed);
      };
      step();
    });
  }
  function finishTyping() {
    if (!typing || typing.done) return;
    clearTimeout(typing.timer);
    for (const n of typing.full) n.node.data = n.text;
    typing.done = true; typing.res();
  }

  // ---------- public lines ----------
  async function speak(who, text, o = {}) {
    const t = resolveText(text);
    choicesEl.innerHTML = '';
    asideEl.classList.remove('on');
    dialog.classList.remove('narr', 'tuvia', 'npc');
    if (who === 'narr') {
      dialog.classList.add('narr'); nameEl.textContent = ''; nameEl.className = 'dlg-name';
    } else if (who === 'tuvia') {
      dialog.classList.add('tuvia'); nameEl.textContent = 'טוביה'; nameEl.className = 'dlg-name tuvia';
      setTuvia(o.x || 'neutral', 'stand');
    } else {
      dialog.classList.add('npc'); nameEl.textContent = NPC_NAMES[who] || who; nameEl.className = 'dlg-name npc-' + who;
      if (o.m) setNPCMood(o.m);
      setTuvia(o.x || 'smirk', 'listen');
    }
    await typeInto(textEl, bidi(t));
    await waitTap();
  }
  async function aside(text, o = {}) {
    const t = resolveText(text);
    choicesEl.innerHTML = '';
    setTuvia(o.x || 'suspicious', current.pose);
    asideEl.innerHTML = `<div class="aside-cloud"><span class="aside-icon">💭</span></div>`;
    asideEl.classList.add('on');
    dialog.classList.remove('narr', 'tuvia', 'npc'); dialog.classList.add('aside-mode');
    nameEl.textContent = '💭 טוביה (רק אתם שומעים)'; nameEl.className = 'dlg-name aside';
    await typeInto(textEl, bidi(t));
    await waitTap();
    dialog.classList.remove('aside-mode');
    asideEl.classList.remove('on');
  }
  async function narrate(text) {
    await speak('narr', text);
  }
  /** Non-blocking small bubble (idle lines, goat found). */
  function bubble(text, ms = 4500) {
    const b = document.createElement('div');
    b.className = 'bubble-toast';
    b.innerHTML = '💭 ' + bidi(text);
    stage.appendChild(b);
    requestAnimationFrame(() => b.classList.add('on'));
    setTimeout(() => { b.classList.remove('on'); setTimeout(() => b.remove(), 400); }, ms);
  }

  function choose(choices) {
    return new Promise((res) => {
      hintEl.classList.remove('on');
      dialog.classList.remove('narr', 'npc', 'aside-mode'); dialog.classList.add('tuvia');
      nameEl.textContent = 'טוביה'; nameEl.className = 'dlg-name tuvia';
      textEl.innerHTML = '<span class="dlg-prompt">מה אני אומר?</span>';
      choicesEl.innerHTML = '';
      choices.forEach((c, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'choice choice-' + (c.k || 'plain');
        const icon = c.k === 'innocent' ? '😇' : c.k === 'disguise' ? '🎭' : '💬';
        b.innerHTML = `<span class="choice-icon">${icon}</span><span class="choice-text">${bidi(resolveText(c.t))}</span><span class="choice-key"><bdi>${i + 1}</bdi></span>`;
        b.addEventListener('click', () => { choicesEl.innerHTML = ''; audio.playSfx('click'); res(c); });
        choicesEl.appendChild(b);
      });
      armIdle();
    });
  }

  /** A modal card over the stage. buttons: [{id, label, cls}]. Returns the chosen id. */
  function card(html, buttons, cls = '') {
    return new Promise((res) => {
      const ov = document.createElement('div');
      ov.className = 'card-overlay ' + cls;
      ov.innerHTML = `<div class="card">${html}<div class="card-buttons"></div></div>`;
      const bb = ov.querySelector('.card-buttons');
      buttons.forEach((b, i) => {
        const btn = document.createElement('button');
        btn.type = 'button'; btn.className = 'btn ' + (b.cls || ''); btn.innerHTML = b.label; btn.dataset.id = b.id;
        btn.addEventListener('click', () => { ov.classList.remove('on'); setTimeout(() => ov.remove(), 250); res(b.id); });
        bb.appendChild(btn);
      });
      stage.parentNode.appendChild(ov);
      requestAnimationFrame(() => ov.classList.add('on'));
      const first = bb.querySelector('button'); if (first) setTimeout(() => first.focus(), 300);
      const onKey = (e) => { const n = parseInt(e.key, 10); const list = bb.querySelectorAll('button'); if (n >= 1 && n <= list.length) { e.preventDefault(); list[n - 1].click(); window.removeEventListener('keydown', onKey); } };
      window.addEventListener('keydown', onKey);
    });
  }

  function flashPages(n, where = 'quote') {
    const f = document.createElement('div');
    f.className = 'pages-flash';
    f.innerHTML = `📖 <bdi>+${n}</bdi> עמודים`;
    stage.appendChild(f);
    requestAnimationFrame(() => f.classList.add('on'));
    setTimeout(() => f.remove(), 1800);
    anim('anim-glint');
  }
  function flashMood(d, label) {
    const f = document.createElement('div');
    f.className = 'mood-flash ' + (d >= 0 ? 'up' : 'down');
    f.innerHTML = `${label || '🍲'} <bdi>${d >= 0 ? '+' : ''}${d}</bdi>`;
    stage.appendChild(f);
    requestAnimationFrame(() => f.classList.add('on'));
    setTimeout(() => f.remove(), 1600);
  }

  function clear() { choicesEl.innerHTML = ''; textEl.innerHTML = ''; nameEl.textContent = ''; hintEl.classList.remove('on'); asideEl.classList.remove('on'); }

  /** Test hook: finish typing / advance. */
  function skip() { return tap(); }
  function isWaiting() { return !!waiting || (typing && !typing.done); }

  return { setScene, refreshScene, setGoatState, setNPC, setNPCMood, setTuvia, anim, shake, speak, aside, narrate, bubble, choose, card, flashPages, flashMood, clear, skip, isWaiting, resolveText, current };
}
