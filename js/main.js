// js/main.js — boot, screens, the dialogue runner, HUD, notebook, phone, seating puzzle, endings.
// Content lives in js/content/*, art in js/art/*, meters in js/state.js, music in js/audio.js.
import { tuviaSVG, goatSVG, TUVIA_CSS } from './art/tuvia.js';
import { npcSVG } from './art/npcs.js';
import { sceneSVG } from './art/scenes.js';
import { createAudio } from './audio.js';
import * as S from './state.js';
import { CAST, DISGUISES, INGREDIENTS } from './content/cast.js';
import { FOODS, POLITE_LINE, POLITE_SCREAMS, HONEST_GRUMBLES, CANNOT_REFUSE } from './content/foods.js';
import ch1 from './content/ch1.js';
import ch3 from './content/ch3.js';
import ch4 from './content/ch4.js';
import finale, { GUESTS, pairLine, SEATING_HINTS } from './content/finale.js';
import { ISI_CALLS, ISI_BUSY } from './content/isi.js';
import { ENDINGS, ENDING_ORDER } from './content/endings.js';
import { CHAPTER_LIST, IDLE_GENERIC, BETWEEN, GOAT_PAGE, SETTINGS_COPY } from './content/misc.js';

const CHAPTERS = { ch1, ch3, ch4, finale };
const NEXT = { ch1: 'ch3', ch3: 'ch4', ch4: 'finale', finale: null };
const $ = (id) => document.getElementById(id);
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

// ---------------------------------------------------------------- state & audio
let state = S.loadState() || S.freshState();
let settings = S.loadSettings();
// SPEC §8.4 mp3 hook: set USE_AUDIO_FILES = true once real recordings exist under ./audio/<name>.mp3.
// Off by default so a clean static deploy logs no 404 probes.
const USE_AUDIO_FILES = false;
const audio = createAudio({ basePath: './audio/', checkFiles: USE_AUDIO_FILES });
audio.setMuted(settings.muted); audio.setVolume(settings.volume);
document.body.classList.toggle('contrast', !!settings.contrast);
{ const st = document.createElement('style'); st.textContent = TUVIA_CSS; document.head.appendChild(st); }

// ---------------------------------------------------------------- run control
class Goto { constructor(label) { this.label = label; } }
class Abort extends Error { constructor() { super('abort'); } }
class EndingSignal { constructor(id) { this.id = id; } }
const run = { token: 0 };
let waiting = { type: 'none', resolve: null, options: null };
let typing = null;             // { finish() }
let fastForward = false;
let expression = 'smirk';
let currentNpc = null, currentScene = null, currentChapter = null;
let usedChoices = new Set();
let encounterHadFood = false;
let lastInteraction = Date.now();
const log = [];

function abortRun() {
  run.token++;
  if (waiting.resolve) { const r = waiting.resolve; waiting = { type: 'none' }; r(null); }
  if (typing) typing.finish();
}
function waitFor(type, options) {
  const token = run.token;
  return new Promise((resolve) => { waiting = { type, resolve, options }; if (type === 'tap') $('next').classList.remove('hidden'); })
    .then((v) => { $('next').classList.add('hidden'); if (token !== run.token) throw new Abort(); return v; });
}
function resolveWait(v) { if (!waiting.resolve) return; const r = waiting.resolve; waiting = { type: 'none' }; r(v); }

// ---------------------------------------------------------------- screens
function showScreen(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === 'screen-' + id));
  if (id === 'title') renderTitle();
  if (id === 'chapters') renderChapters();
  if (id === 'notebook') renderNotebook();
  if (id === 'settings') renderSettings();
}
let backTo = 'title';
document.querySelectorAll('[data-back]').forEach((b) => b.addEventListener('click', () => { audio.playSfx('click'); showScreen(backTo); }));

// ---------------------------------------------------------------- text helpers
function fmt(text) {
  return String(text)
    .replace(/\{pages\}/g, `<bdi>${state.pages}</bdi>`).replace(/\{kugel\}/g, `<bdi>${Math.max(1, Math.min(state.pages - 1, state.kugelPages || Math.round(state.pages * 0.75)))}</bdi>`)
    .replace(/\*\((.+?)\)\*/g, '<i class="stage">($1)</i>');
}
/** Wrap every text character in a span so the typewriter reveals without reflow. */
function spanify(html) {
  const tpl = document.createElement('template'); tpl.innerHTML = html;
  const walk = (node) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        for (const ch of child.textContent) { const sp = document.createElement('span'); sp.className = 'ch'; sp.textContent = ch; frag.appendChild(sp); }
        child.replaceWith(frag);
      } else walk(child);
    }
  };
  walk(tpl.content);
  return tpl.content;
}
function typeInto(el, html) {
  if (typing) typing.finish();
  el.innerHTML = ''; el.appendChild(spanify(html));
  const spans = [...el.querySelectorAll('.ch')];
  const ms = (SETTINGS_COPY.speeds.find((s) => s.id === settings.speed) || SETTINGS_COPY.speeds[1]).ms;
  return new Promise((resolve) => {
    let i = 0, timer = null;
    const finish = () => { if (timer) clearInterval(timer); spans.forEach((s) => s.classList.add('on')); typing = null; resolve(); };
    if (ms === 0 || fastForward) return finish();
    timer = setInterval(() => {
      if (i < spans.length) spans[i++].classList.add('on');
      if (i >= spans.length) finish();
    }, ms);
    typing = { finish };
  });
}

// ---------------------------------------------------------------- HUD
function moodCap() { return (currentChapter && currentChapter.moodCap) || 100; }
function renderHud() {
  const m = state.mood;
  const band = S.moodBand(m);
  const face = $('hud-face');
  const key = band.face + '|' + state.disguise;
  if (face.dataset.key !== key) { face.dataset.key = key; face.innerHTML = tuviaSVG({ expression: band.face, crop: 'head', disguise: state.disguise, size: 48, id: 'hudface' }); }
  const fill = $('hud-bar-fill'); fill.style.width = Math.min(100, m) + '%'; fill.classList.toggle('over', m > 100);
  $('hud-mood-label').textContent = band.label;
  $('hud-pages-n').textContent = state.pages;
  $('hud-spoons').innerHTML = INGREDIENTS.map((i) => {
    const have = state.ingredients.includes(i.id);
    return `<div class="spoon ${have ? 'have' : ''} ${i.soon ? 'soon' : ''}" title="${i.name}${i.soon ? ' (בקרוב)' : have ? ' ✓' : ''}">${have ? i.emoji : (i.soon ? '·' : '🥄')}</div>`;
  }).join('');
  const inv = state.inventory;
  $('hud-items').innerHTML = (inv.cola ? `<button class="hud-item" data-use="cola" title="קולה זירו: +10 (חירום אוטומטי במצב רוח 0)">🥤×<bdi>${inv.cola}</bdi></button>` : '') +
    (inv.rugelach ? `<button class="hud-item" data-use="rugelach" title="רוגעלך: +8">🥐×<bdi>${inv.rugelach}</bdi></button>` : '');
  const chId = state.chapter;
  const canIsi = chId && ISI_CALLS[chId] && !state.isiCalled[chId];
  $('isi-badge').classList.toggle('on', !!canIsi);
  $('btn-isi').disabled = !(chId && ISI_CALLS[chId]);
}
$('hud-items').addEventListener('click', (e) => {
  const b = e.target.closest('[data-use]'); if (!b) return;
  useItem(b.dataset.use);
});
function useItem(id) {
  if (!state.inventory[id]) return;
  state.inventory[id]--;
  const f = FOODS[id];
  audio.playSfx(f.sfx);
  applyMood(f.mood, f.name);
  showAside(f.verdict, 3200, false);
  setExpression('delighted', 1800);
  renderHud();
}
function toast(text, cls = '') {
  const t = document.createElement('div'); t.className = 'toast ' + cls; t.innerHTML = text;
  const box = $('toasts'); box.appendChild(t); while (box.children.length > 4) box.firstChild.remove();
  setTimeout(() => t.remove(), 2700);
}

// ---------------------------------------------------------------- meters
function applyMood(delta, why) {
  const before = state.mood;
  state.mood = S.clamp(Math.round(state.mood + delta), 0, moodCap());
  const d = state.mood - before;
  if (d) toast(`${d > 0 ? '+' : ''}${d} 🍲${why ? ' ' + esc(why) : ''}`, d > 0 ? 'good' : 'bad');
  audio.setMood(Math.min(100, state.mood));
  renderHud();
  if (state.mood <= 0) {
    if (state.inventory.cola > 0) {
      state.inventory.cola--; state.mood = 20; audio.playSfx('fizz');
      toast('🥤 קולה זירו חירום! +20', 'good');
      showAside('קולה זירו. אפס קלוריות, מאה אחוז הצלה. איזי צדקה שאמרה לקחת ארגז.', 3500, false);
      audio.setMood(20); renderHud();
    } else {
      throw new EndingSignal('ny');
    }
  }
}
function addPages(n, why) {
  const mult = S.pageMultiplier(state.mood);
  const p = Math.max(1, Math.round(n * S.SLICE.pageScale * mult));
  state.pages += p; state.pagesRaw += n;
  if (why && /קוגל/.test(why)) state.kugelPages = (state.kugelPages || 0) + p;
  $('hud-pages').classList.remove('bump'); void $('hud-pages').offsetWidth; $('hud-pages').classList.add('bump');
  toast(`📖 +${p}${mult !== 1 ? ` <small>(×${mult})</small>` : ''}`, 'pages');
  audio.playSfx('scribble');
  const tv = $('tuvia').querySelector('svg'); if (tv) { tv.classList.add('anim-glint'); setTimeout(() => tv.classList.remove('anim-glint'), 1500); }
  renderHud();
  return p;
}
function addQuote(node) {
  const who = node.who || (currentNpc && CAST[currentNpc] ? CAST[currentNpc].name : 'טוביה');
  const p = addPages(node.pages || 0, node.quote);
  state.notebook.push({ ch: state.chapter, who, text: node.quote, note: node.note || '', pages: p, kind: node.kind || 'quote' });
}
function giveIngredient(id) {
  if (state.ingredients.includes(id)) return;
  state.ingredients.push(id);
  const info = S.ingredientInfo(id);
  audio.sting('good'); audio.playSfx('tada');
  toast(`🥄 ${info.emoji} ${info.name}! (${state.ingredients.length}/${S.SLICE.ingredientsTotal})`, 'ing');
  const tv = $('tuvia').querySelector('svg'); if (tv) { tv.classList.add('anim-snap', 'anim-laugh'); setTimeout(() => tv.classList.remove('anim-snap', 'anim-laugh'), 1500); }
  renderHud();
}
function addItem(id, n) { state.inventory[id] = Math.min(id === 'cola' ? 3 : 9, (state.inventory[id] || 0) + n); toast(`${id === 'cola' ? '🥤' : '🥐'} +${n}`); renderHud(); }

// ---------------------------------------------------------------- stage
function setScene(key, instant = false) {
  if (currentScene === key) return;
  currentScene = key;
  const el = $('scene');
  const swap = () => { el.innerHTML = sceneSVG(key); el.classList.remove('fade'); placeGoat(); };
  if (instant) swap(); else { el.classList.add('fade'); setTimeout(swap, 300); }
}
function setNpc(id, mood = 'neutral') {
  const el = $('npc');
  if (currentNpc !== id) {
    currentNpc = id;
    el.innerHTML = id ? npcSVG(id, { mood, size: 300 }) : '';
    el.classList.remove('enter'); void el.offsetWidth; el.classList.add('enter');
  } else if (id) {
    const svg = el.querySelector('svg');
    if (svg && !svg.classList.contains('npc-' + mood)) el.innerHTML = npcSVG(id, { mood, size: 300 });
  }
}
let exprTimer = null;
function setExpression(expr, revertMs = 0) {
  if (exprTimer) { clearTimeout(exprTimer); exprTimer = null; }
  const prev = expression;
  expression = expr || expression;
  renderTuvia();
  if (revertMs) exprTimer = setTimeout(() => { expression = prev; renderTuvia(); }, revertMs);
}
function renderTuvia() {
  const el = $('tuvia');
  const key = expression + '|' + state.disguise;
  if (el.dataset.key === key) return;
  el.dataset.key = key;
  el.innerHTML = tuviaSVG({ expression, pose: 'listen', disguise: state.disguise, crop: 'bust', size: 300, id: 'stagetuvia', table: false });
}
let asideTimer = null;
function showAside(text, autoHideMs = 0, scream = false) {
  const c = $('aside');
  c.classList.remove('hidden', 'idle', 'scream');
  if (scream) c.classList.add('scream');
  if (asideTimer) { clearTimeout(asideTimer); asideTimer = null; }
  $('aside-text').innerHTML = fmt(text);
  if (autoHideMs) { c.classList.add('idle'); asideTimer = setTimeout(hideAside, autoHideMs); }
}
function hideAside() { $('aside').classList.add('hidden'); }
function placeGoat() {
  const g = $('goat');
  g.classList.add('hidden'); g.innerHTML = '';
  const ch = currentChapter;
  if (!ch || !ch.goat || ch.goat.scene !== currentScene) return;
  const anchor = $('scene').querySelector('[data-goat]');
  if (!anchor) return;
  const [ax, ay, as] = anchor.dataset.goat.split(' ').map(Number);
  const found = !!state.goatFound[ch.id];
  // scene is 800×500 cover-cropped (xMidYMax slice): map svg coords to stage pixels
  const st = $('stage').getBoundingClientRect();
  const scale = Math.max(st.width / 800, st.height / 500);
  const offX = (st.width - 800 * scale) / 2, offY = st.height - 500 * scale;
  const w = 120 * as * scale;
  g.style.left = (offX + ax * scale - w / 2) + 'px';
  g.style.top = (offY + ay * scale - w * .75) + 'px';
  g.innerHTML = goatSVG({ size: w, mood: found ? 'disappointed' : 'disappointed', flip: ax > 400 });
  g.classList.toggle('found', found);
  g.classList.remove('hidden');
}
window.addEventListener('resize', placeGoat);
$('goat').addEventListener('click', () => {
  const ch = currentChapter; if (!ch || !ch.goat) return;
  audio.playSfx('goat');
  if (state.goatFound[ch.id]) { showAside(pick(['העז. עדיין פה. עדיין מאוכזבת.', 'היא לא רוצה לדבר. אני מכבד את זה.', 'מֶה. זה כל מה שיש לה להגיד. וזה מספיק.']), 2600); return; }
  state.goatFound[ch.id] = true;
  $('goat').classList.add('found');
  toast('🐐 מצאת את העז! (' + Object.keys(state.goatFound).length + '/3)', 'ing');
  showAside(ch.goat.line, 6000);
  const tv = $('tuvia').querySelector('svg'); if (tv) { tv.classList.add('anim-glint'); setTimeout(() => tv.classList.remove('anim-glint'), 1500); }
  S.saveState(state);
});
function shake() { const s = $('stage'); s.classList.remove('shake'); void s.offsetWidth; s.classList.add('shake'); setTimeout(() => s.classList.remove('shake'), 1100); }

// ---------------------------------------------------------------- dialogue primitives
function speakerTag(speaker) {
  const el = $('speaker');
  const c = CAST[speaker];
  if (!c || !c.name) { el.classList.add('empty'); el.textContent = '·'; return; }
  el.classList.remove('empty'); el.textContent = c.name; el.style.background = c.color;
}
async function say(speaker, text, expr) {
  const token = run.token;
  const hash = speaker + '|' + text;
  const seenBefore = !!state.seen[hash];
  state.seen[hash] = 1;
  lastInteraction = Date.now();
  log.push({ speaker, text });
  const textEl = $('text');
  $('choices').innerHTML = '';
  textEl.classList.remove('aside-mode', 'book');
  if (speaker === '💭') {
    if (expr) setExpression(expr);
    speakerTag('aside');
    textEl.classList.add('aside-mode'); textEl.innerHTML = '💭 טוביה חושב. (הקישו להמשך)';
    const c = $('aside'); c.classList.remove('hidden', 'idle', 'scream');
    if (asideTimer) { clearTimeout(asideTimer); asideTimer = null; }
    await typeInto($('aside-text'), fmt(text));
  } else {
    hideAside();
    speakerTag(speaker);
    if (speaker === 'book') textEl.classList.add('book');
    if (speaker === 'tuvia') { setExpression(expr || expression); $('tuvia').classList.add('speaking'); }
    else { if (expr) setExpression(expr); if (speaker === currentNpc) setNpc(speaker, 'talk'); }
    await typeInto(textEl, fmt(text));
    $('tuvia').classList.remove('speaking');
    if (speaker === currentNpc) setNpc(speaker, 'neutral');
  }
  if (token !== run.token) throw new Abort();
  if (fastForward && seenBefore) { await delay(140); if (token !== run.token) throw new Abort(); }
  else await waitFor('tap');
  if (speaker === '💭') hideAside();
}
function choiceButton(o, idx, lockedReason) {
  const b = document.createElement('button');
  b.className = 'choice ' + (o.kind || '') + (lockedReason ? ' locked' : '');
  const icon = o.kind === 'innocent' ? '😇' : o.kind === 'disguise' ? '🎭' : o.kind === 'food' ? '🍽' : '';
  b.innerHTML = `${icon ? `<span class="k">${icon}</span>` : ''}${fmt(o.t)}${lockedReason ? `<span class="lock">${lockedReason}</span>` : ''}`;
  b.dataset.idx = idx;
  if (lockedReason) b.disabled = true;
  return b;
}
async function choose(node) {
  do {
    const opts = node.choices.filter((o) => !(o.once && usedChoices.has(o.t)));
    const box = $('choices'); box.innerHTML = '';
    const visible = [];
    opts.forEach((o, i) => {
      const locked = o.dis && o.dis !== state.disguise ? `🎭 צריך: ${DISGUISES[o.dis].short}` : '';
      box.appendChild(choiceButton(o, i, locked));
      visible.push({ o, locked: !!locked });
    });
    $('next').classList.add('hidden');
    const picked = await waitFor('choice', opts);
    if (!picked) throw new Abort();
    audio.playSfx('click');
    lastInteraction = Date.now();
    log.push({ speaker: 'tuvia', text: picked.t, choice: true });
    box.innerHTML = '';
    if (picked.once) usedChoices.add(picked.t);
    if (picked.goto) throw new Goto(picked.goto);
    if (picked.then) await runList(picked.then);
    if (picked.exit) break;
  } while (node.loop);
}
$('choices').addEventListener('click', (e) => {
  const b = e.target.closest('.choice'); if (!b || b.disabled) return;
  if (waiting.type === 'choice') resolveWait(waiting.options[b.dataset.idx]);
  else if (waiting.type === 'food') resolveWait(b.dataset.mode);
});
async function offerFood(node) {
  const f = FOODS[node.food];
  const by = CAST[node.by] ? CAST[node.by].name : '';
  let noRefuse = !!node.noRefuse;
  let mode;
  for (;;) {
    const box = $('choices');
    box.innerHTML = `<div class="food-card ${f.cursed ? 'cursed' : ''}"><div class="em">${f.emoji}</div><div><div class="fname">${esc(f.name)}</div><div class="fby">${by ? 'מגיש/ה: ' + esc(by) : ''} · ${f.good ? 'נראה טוב.' : 'נראה בריא. זה לא מחמאה.'}</div></div>
      <div class="fbtns"><button class="choice food" data-mode="eat">🍴 לאכול</button><button class="choice innocent" data-mode="polite">🙂 "תודה, טעים מאוד"</button>${noRefuse ? '' : '<button class="choice" data-mode="refuse">✋ לסרב</button>'}</div></div>`;
    speakerTag('aside');
    $('text').classList.remove('aside-mode', 'book'); $('text').innerHTML = '💭 ' + (f.good ? 'מגישים לי משהו. אני מריח. אני יודע.' : 'מגישים לי משהו. אני מריח. אני יודע. אוי.');
    hideAside();
    mode = await waitFor('food');
    if (!mode) throw new Abort();
    lastInteraction = Date.now();
    audio.playSfx('click');
    if (mode === 'refuse' && f.good) {
      const line = pick(CANNOT_REFUSE);
      const btn = box.querySelector('[data-mode="refuse"]'); if (btn) { btn.classList.add('jiggle'); btn.disabled = true; }
      showAside(line, 2200, false); setExpression('shocked', 1500); audio.playSfx('nu');
      await delay(900);
      noRefuse = true; continue;
    }
    break;
  }
  $('choices').innerHTML = '';
  encounterHadFood = true;
  log.push({ speaker: 'tuvia', text: `[${f.name}: ${mode === 'eat' ? 'אכל' : mode === 'polite' ? 'אכל בנימוס' : 'סירב'}]`, choice: true });
  const delta = (f.bneibrakMood && state.disguise === 'bneibrak') ? f.bneibrakMood : f.mood;
  if (mode === 'refuse') {
    setExpression('suspicious');
    state.foodsEaten.push(node.food + ':refused');
    await say('💭', pick(['סירבתי. בנימוס. כלומר, אמרתי "לא". פה זה נחשב גס.', 'לא. פשוט לא. יש גבול, ואני עומד עליו. רעב, אבל עומד.', 'סירבתי. הצלחת נשארה על השולחן. היא מסתכלת עליי. גם הצלחת.']), 'suspicious');
  } else {
    state.foodsEaten.push(node.food);
    audio.playSfx(f.sfx);
    if (f.good) {
      state.goodEaten++;
      setExpression('delighted');
      const tv = $('tuvia').querySelector('svg'); if (tv) { tv.classList.add('anim-snap', 'anim-laugh'); setTimeout(() => tv.classList.remove('anim-snap', 'anim-laugh'), 1500); }
      if (!node.quietSting) audio.sting('good');
      applyMood(delta, f.name);
      if (mode === 'polite') await say('tuvia', POLITE_LINE, 'happy');
      await say('💭', f.verdict, 'delighted');
    } else {
      state.badEaten++;
      audio.sting('bad');
      if (f.cursed) { shake(); audio.playSfx('gasp'); }
      if (mode === 'polite') {
        state.politeBad++;
        setExpression('happy');
        const c = $('aside'); c.classList.add('scream');
        await say('💭', POLITE_SCREAMS[node.food] || POLITE_SCREAMS._, 'disgusted');
        c.classList.remove('scream');
        // Saying "טעים מאוד" enough times, he half believes it: polite bad food hurts 60% (the cursed item: in full).
        applyMood(f.cursed ? delta : Math.round(delta * 0.6), f.name);
        await say('tuvia', POLITE_LINE, 'happy');
        setExpression('disgusted');
        await say('💭', f.verdict, 'disgusted');
        if (state.politeBad === 3) toast('💭 שלוש פעמים "טעים מאוד". איזי מתחילה לדאוג.', 'bad');
      } else {
        setExpression(f.cursed ? 'shocked' : 'disgusted');
        applyMood(delta, f.name);
        await say('tuvia', HONEST_GRUMBLES[node.food] || HONEST_GRUMBLES._, f.cursed ? 'shocked' : 'disgusted');
        await say('💭', f.verdict, f.cursed ? 'shocked' : 'disgusted');
      }
    }
  }
  const branch = node.then && node.then[mode];
  if (branch) await runList(branch);
}

// ---------------------------------------------------------------- the runner
async function runList(list) { for (const node of list || []) await execNode(node); }
async function execNode(node) {
  if (run.token === 0) throw new Abort();
  if (Array.isArray(node)) return say(node[0], node[1], node[2]);
  if ('label' in node) return;
  if ('goto' in node) throw new Goto(node.goto);
  if (node.choices) return choose(node);
  if (node.dis) return runList(node.dis[state.disguise] || node.dis.none || []);
  if (node.food) return offerFood(node);
  if ('quote' in node) { addQuote(node); await delay(fastForward ? 60 : 500); return; }
  if ('mood' in node) { applyMood(node.mood, node.why); return; }
  if (node.item) { addItem(node.item, node.n || 1); return; }
  if (node.ingredient) { giveIngredient(node.ingredient); await delay(fastForward ? 60 : 700); return; }
  if (node.set) { Object.assign(state.flags, node.set); return; }
  if (node.inc) { state.flags[node.inc] = (state.flags[node.inc] || 0) + 1; return; }
  if ('if' in node) {
    const ok = typeof node.if === 'function' ? node.if(state.flags, state) : !!state.flags[node.if];
    return runList(ok ? node.then : node.else);
  }
  if (node.sfx) { audio.playSfx(node.sfx); return; }
  if (node.sting) { audio.sting(node.sting); return; }
  if (node.cue) { audio.cue(node.cue); return; }
  if (node.music) { audio.playMusic(node.music); return; }
  if ('scene' in node) { setScene(node.scene); await delay(fastForward ? 50 : 350); return; }
  if ('npc' in node) { setNpc(node.npc); return; }
  if (node.shake) { shake(); return; }
  if (node.expr) { setExpression(node.expr); return; }
  if (node.wait) { await delay(fastForward ? 30 : node.wait); return; }
  if (node.golden) { const g = $('golden'); g.classList.remove('hidden'); setTimeout(() => g.classList.add('hidden'), 6000); return; }
  if (node.goatMood) { $('goat').innerHTML = goatSVG({ size: 110, mood: node.goatMood }); $('goat').style.left = '8%'; $('goat').style.top = '55%'; $('goat').classList.remove('hidden'); $('goat').classList.add('found'); return; }
  if (node.lidContents) {
    const have = INGREDIENTS.filter((i) => state.ingredients.includes(i.id)).map((i) => i.name);
    const miss = INGREDIENTS.filter((i) => !i.soon && !state.ingredients.includes(i.id)).map((i) => i.name);
    return say('💭', `בפנים: ${have.length ? have.join(', ') : 'מים. ואמונה.'}. חסר: ${miss.join(', ')}.`, 'suspicious');
  }
  console.warn('unknown node', node);
}
async function runEncounter(ch, enc) {
  usedChoices = new Set(); encounterHadFood = false;
  setScene(enc.scene || ch.scene, true); setNpc(enc.npc || null); setExpression('smirk');
  hideAside(); $('choices').innerHTML = ''; $('text').innerHTML = ''; speakerTag('narrator');
  if (enc.disguise !== false) await pickDisguise(enc);
  const script = enc.script; let i = 0;
  while (i < script.length) {
    try { await execNode(script[i]); i++; }
    catch (e) {
      if (e instanceof Goto) { i = script.findIndex((n) => n && n.label === e.label); if (i < 0) throw new Error('missing label ' + e.label); }
      else throw e;
    }
  }
  if (!encounterHadFood) applyMood(-2, 'רעב');
}
async function playChapter(chId, fromEncounter = 0) {
  const ch = CHAPTERS[chId];
  currentChapter = ch;
  state.chapter = chId; state.encounter = fromEncounter; state.started = true;
  if (!state.unlocked.includes(chId)) state.unlocked.push(chId);
  if (fromEncounter === 0) state.flags = {};
  S.saveState(state);
  showScreen('game'); renderHud(); renderTuvia();
  const chapterPagesStart = state.pages, foodsStart = state.foodsEaten.length;
  if (fromEncounter === 0) {
    const between = chId === 'finale' ? finale.taxi : BETWEEN[chId];
    if (between) { setScene('taxi', true); setNpc('moshe'); audio.cue('honk'); setExpression('sleepy'); await runList(between); }
    await titleCard(ch);
    audio.playMusic(ch.music);
    setScene(ch.scene, true); setNpc(null); setExpression('neutral');
    await runList(ch.intro);
  } else { audio.playMusic(ch.music); }
  if (chId === 'finale') return playFinale(ch);
  for (let i = fromEncounter; i < ch.encounters.length; i++) {
    state.encounter = i; S.saveState(state);
    await runEncounter(ch, ch.encounters[i]);
  }
  setNpc(null);
  await runList(ch.outro || []);
  await endCard(ch, state.pages - chapterPagesStart, state.foodsEaten.slice(foodsStart));
}
async function playFinale(ch) {
  await runSeating();
  await runList(ch.afterSeating);
  setNpc('gittel');
  await runList(state.ingredients.length >= S.SLICE.ingredientsTotal ? ch.lidFull : ch.lidPartial);
  throw new EndingSignal(S.decideEnding(state));
}
async function startFrom(chId, enc = 0) {
  abortRun();
  const token = ++run.token;
  try {
    let id = chId, e = enc;
    while (id) { await playChapter(id, e); e = 0; id = NEXT[id]; }
  } catch (err) {
    if (err instanceof Abort) return;
    if (err instanceof EndingSignal) { if (token === run.token) await runEnding(err.id).catch((e2) => { if (!(e2 instanceof Abort)) console.error(e2); }); return; }
    console.error(err);
    toast('⚠ ' + esc(err.message), 'bad');
  }
}

// ---------------------------------------------------------------- cards & overlays
async function titleCard(ch) {
  const box = $('card-box');
  box.innerHTML = `<div class="card-num">פרק <bdi>${ch.num}</bdi></div><div class="card-h">${esc(ch.name)}</div><div class="card-tag">${esc(ch.tag)}</div><div class="card-hint">הקישו להמשך</div>`;
  $('overlay-card').classList.remove('hidden');
  audio.playSfx('page');
  await waitFor('card');
  $('overlay-card').classList.add('hidden');
}
async function endCard(ch, pagesGained, foods) {
  const good = foods.filter((f) => FOODS[f] && FOODS[f].good).length, bad = foods.filter((f) => FOODS[f] && !FOODS[f].good).length;
  const ing = INGREDIENTS.find((i) => i.ch === ch.num);
  const box = $('card-box');
  box.innerHTML = `<div class="card-num">סוף פרק <bdi>${ch.num}</bdi></div><div class="card-h">${esc(ch.name)}</div>
    <div class="card-stats"><div>📖 עמודים בפרק: <b><bdi>${pagesGained}</bdi></b> (סה"כ <bdi>${state.pages}</bdi>/<bdi>${S.SLICE.bookTarget}</bdi>)</div>
    <div>🍲 אוכל טוב: <bdi>${good}</bdi> · אוכל "בריא": <bdi>${bad}</bdi></div>
    <div>🥄 ${ing ? (state.ingredients.includes(ing.id) ? `${ing.emoji} ${ing.name}: נמצא!` : `${ing.name}: לא נמצא. (${esc(ing.from)} יודע/ת איפה.)`) : ''}</div>
    <div>📱 איזי: ${state.isiCalled[ch.id] ? 'דיברנו.' : 'לא התקשרתי. היא תזכור.'} · 🐐 העז: ${state.goatFound[ch.id] ? 'נמצאה.' : 'הסתתרה.'}</div></div>
    <div class="card-hint">הקישו להמשך</div>`;
  $('overlay-card').classList.remove('hidden');
  audio.playSfx('page');
  await waitFor('card');
  $('overlay-card').classList.add('hidden');
}
$('overlay-card').addEventListener('click', () => { if (waiting.type === 'card') { audio.playSfx('click'); resolveWait(true); } });

async function pickDisguise(enc) {
  const cards = $('disguise-cards');
  $('disguise-intro').innerHTML = fmt(enc.disguiseIntro || 'מי אני הפעם?');
  cards.innerHTML = Object.entries(DISGUISES).map(([id, d]) =>
    `<button class="dis-card ${state.disguise === id ? 'current' : ''}" data-dis="${id}">${tuviaSVG({ expression: 'smirk', pose: 'stand', disguise: id, crop: 'bust', size: 120, id: 'dis-' + id, table: false })}<div class="dname">${d.label}</div><div class="dmotto">${d.motto}</div></button>`).join('');
  $('overlay-disguise').classList.remove('hidden');
  const id = await waitFor('disguise');
  $('overlay-disguise').classList.add('hidden');
  if (!id) throw new Abort();
  state.disguise = id;
  audio.playSfx(id === 'none' ? 'click' : 'whoosh');
  renderTuvia(); renderHud();
  toast(`🎭 ${DISGUISES[id].label}`);
}
$('disguise-cards').addEventListener('click', (e) => { const b = e.target.closest('[data-dis]'); if (b && waiting.type === 'disguise') resolveWait(b.dataset.dis); });

// ---------------------------------------------------------------- Isi
let phone = null;
function openPhone() {
  const chId = state.chapter;
  if (!chId || !ISI_CALLS[chId]) return;
  if (state.isiCalled[chId]) { audio.playSfx('phone'); showAside(pick(ISI_BUSY), 3500); return; }
  const call = ISI_CALLS[chId];
  state.isiCalled[chId] = true; S.saveState(state); renderHud();
  audio.playSfx('phone');
  const tv = $('tuvia').querySelector('svg'); if (tv) { tv.classList.add('anim-glint'); setTimeout(() => tv.classList.remove('anim-glint'), 2000); }
  $('phone-avatar').innerHTML = npcSVG('isi', { crop: 'head', size: 46 });
  const ny = new Date(Date.now() - 7 * 3600 * 1000); $('phone-time').textContent = ny.getHours().toString().padStart(2, '0') + ':' + ny.getMinutes().toString().padStart(2, '0');
  const chat = $('phone-chat'); chat.innerHTML = '';
  phone = { lines: [...call.lines, ['hint', '💡 ' + call.hint]], i: 0 };
  $('phone-next').textContent = 'המשך';
  $('overlay-phone').classList.remove('hidden');
  phoneNext();
}
function phoneNext() {
  if (!phone) return;
  if (phone.i >= phone.lines.length) { closePhone(); return; }
  const [who, text] = phone.lines[phone.i++];
  const b = document.createElement('div'); b.className = 'bubble ' + who; b.innerHTML = fmt(text);
  $('phone-chat').appendChild(b); b.scrollIntoView({ block: 'end', behavior: 'smooth' });
  audio.playSfx(who === 'isi' ? 'pop' : 'click');
  if (phone.i >= phone.lines.length) $('phone-next').textContent = 'לנתק';
}
function closePhone() { phone = null; $('overlay-phone').classList.add('hidden'); applyMood(2, 'איזי'); }
$('btn-isi').addEventListener('click', openPhone);
$('phone-next').addEventListener('click', phoneNext);
$('phone-close').addEventListener('click', closePhone);

// ---------------------------------------------------------------- seating puzzle
async function runSeating() {
  const seats = new Array(9).fill(null);
  let selected = null;
  const tbl = $('seating-table'), tray = $('seating-tray');
  const hintEl = $('seating-hint'); let hintI = 0;
  const showHint = () => { hintEl.textContent = SEATING_HINTS[hintI++ % SEATING_HINTS.length]; };
  showHint();
  const render = () => {
    tbl.innerHTML = `<div class="tbl">🍲</div>` + seats.map((g, i) => {
      const a = -Math.PI / 2 + i * 2 * Math.PI / 9;
      const x = 50 + 46 * Math.cos(a), y = 50 + 44 * Math.sin(a);
      return `<div class="seat ${g ? 'filled' : ''} ${selected && !g ? 'target' : ''}" data-seat="${i}" style="left:${x}%;top:${y}%">${g ? (g === 'goat' ? goatSVG({ size: 46, mood: 'disappointed' }) : npcSVG(g, { crop: 'head', size: 52 })) + `<span class="gname">${CAST[g].name}</span>` : `<bdi>${i + 1}</bdi>`}</div>`;
    }).join('');
    tray.innerHTML = GUESTS.filter((g) => !seats.includes(g)).map((g) =>
      `<button class="guest ${selected === g ? 'sel' : ''}" data-guest="${g}" title="${CAST[g].name}">${g === 'goat' ? goatSVG({ size: 54, mood: 'disappointed' }) : npcSVG(g, { crop: 'head', size: 56 })}<span class="gname">${CAST[g].name}</span></button>`).join('');
    $('seat-done').disabled = seats.some((s) => !s);
  };
  const onTray = (e) => { const b = e.target.closest('[data-guest]'); if (!b) return; selected = selected === b.dataset.guest ? null : b.dataset.guest; audio.playSfx('click'); render(); };
  const onSeat = (e) => {
    const s = e.target.closest('[data-seat]'); if (!s) return;
    const i = +s.dataset.seat;
    if (selected) { const prev = seats[i]; seats[i] = selected; selected = prev || null; audio.playSfx('pop'); }
    else if (seats[i]) { selected = seats[i]; seats[i] = null; audio.playSfx('click'); }
    render();
  };
  const onRandom = () => {
    const rest = GUESTS.filter((g) => !seats.includes(g)).sort(() => Math.random() - .5);
    for (let i = 0; i < 9; i++) if (!seats[i]) seats[i] = rest.pop();
    selected = null; audio.playSfx('goat'); hintEl.textContent = 'העז החליטה. העז לא מסבירה.'; render();
  };
  tray.addEventListener('click', onTray); tbl.addEventListener('click', onSeat); $('seat-random').addEventListener('click', onRandom);
  const onDone = () => { if (!seats.some((s) => !s)) resolveWait(seats.slice()); };
  $('seat-done').addEventListener('click', onDone);
  const hintTimer = setInterval(showHint, 6000);
  render();
  $('overlay-seating').classList.remove('hidden');
  seatingApi = { seats, random: onRandom, done: onDone, render };
  let arrangement;
  try { arrangement = await waitFor('seating'); }
  finally {
    clearInterval(hintTimer); seatingApi = null;
    tray.removeEventListener('click', onTray); tbl.removeEventListener('click', onSeat); $('seat-random').removeEventListener('click', onRandom); $('seat-done').removeEventListener('click', onDone);
    $('overlay-seating').classList.add('hidden');
  }
  if (!arrangement) throw new Abort();
  // evaluate every adjacent pair around the ring
  let fights = 0, peace = 0;
  setNpc(null);
  await say('💭', 'כולם ישבו. אני עמדתי עם הסיר. ורשמתי.', 'writing');
  for (let i = 0; i < 9; i++) {
    const a = arrangement[i], b = arrangement[(i + 1) % 9];
    const pl = pairLine(a, b);
    setNpc(a === 'goat' ? b : a);
    await say('book', pl.line);
    if (pl.kind === 'fight') { fights++; addQuote({ quote: `${CAST[a].name} ליד ${CAST[b].name}: ריב.`, who: 'שולחן שבת', pages: 4, note: 'ריב בשולחן = פרק. אני לא גאה. אני כותב.' }); audio.playSfx('thud'); }
    else if (pl.kind === 'peace') { peace++; applyMood(3, 'שלום בשולחן'); }
    else if (pl.kind === 'silly') { addQuote({ quote: `${CAST[a].name} ליד ${CAST[b].name}.`, who: 'שולחן שבת', pages: 2, note: 'לא ריב. לא שלום. משהו באמצע. כמו המדינה.' }); applyMood(1); }
    else { addQuote({ quote: `${CAST[a].name} ליד ${CAST[b].name}: שתיקה.`, who: 'שולחן שבת', pages: 2, note: 'שתיקה מביכה. גם זה חומר.' }); }
    await delay(fastForward ? 30 : 200);
  }
  state.flags.fights = fights; state.flags.peace = peace;
  await say('💭', `<bdi>${fights}</bdi> ריבים. <bdi>${peace}</bdi> פעמים שלום. ${fights > peace ? 'ספר טוב. ערב גרוע.' : peace > fights ? 'ערב טוב. ספר בינוני. אני יודע מה אני מעדיף. אני לא גאה.' : 'שוויון. כמו תמיד פה.'} אין פתרון מושלם לשולחן הזה. גם לא למזרח התיכון. אבל הצ\'ולנט הגיע.`, 'smirk');
}
let seatingApi = null;

// ---------------------------------------------------------------- endings
async function runEnding(id) {
  const E = ENDINGS[id];
  if (!state.endingsSeen.includes(id)) state.endingsSeen.push(id);
  state.chapter = null; state.encounter = 0;
  S.saveState(state);
  currentChapter = null;
  hideAside(); $('choices').innerHTML = ''; $('goat').classList.add('hidden');
  if (E.vignette) $('vignette').classList.remove('hidden');
  audio.playMusic(E.music); audio.setMood(E.mood);
  setScene(E.scene, true); setNpc(null);
  try {
    await runList(E.lines);
  } catch (e) { if (!(e instanceof Abort)) throw e; }
  finally { $('vignette').classList.add('hidden'); }
  showEndingCard(id);
}
function showEndingCard(id) {
  const E = ENDINGS[id];
  const box = $('ending-box');
  box.innerHTML = `<div class="em">${E.emoji}</div><h2>${esc(E.title)}</h2>
    <div class="book-cover"><div class="bauthor">טוביה טננבום</div><div class="btitle">${esc(E.book)}</div>${tuviaSVG({ expression: id === 'healthy' ? 'happy' : id === 'ny' ? 'angry' : 'smirk', crop: 'head', size: 90, id: 'cover', disguise: 'none' })}<div class="bpub">הוצאת צ'ולנט · ${new Date().getFullYear()}</div></div>
    <div class="ending-stats"><span>📖 <bdi>${state.pages}</bdi> עמודים</span><span>🥄 <bdi>${state.ingredients.length}/${S.SLICE.ingredientsTotal}</bdi></span><span>🍲 מצב רוח <bdi>${state.mood}</bdi></span><span>🐐 <bdi>${Object.keys(state.goatFound).length}/3</bdi></span><span>📱 <bdi>${Object.keys(state.isiCalled).length}/3</bdi></span></div>
    <div class="btns"><button class="btn btn-primary" id="end-again">שחק שוב</button><button class="btn" id="end-notebook">📓 הפנקס</button><button class="btn" id="end-menu">לתפריט</button></div>`;
  $('overlay-ending').classList.remove('hidden');
  $('end-again').onclick = () => { $('overlay-ending').classList.add('hidden'); newGame(); };
  $('end-menu').onclick = () => { $('overlay-ending').classList.add('hidden'); audio.stopMusic(); showScreen('title'); };
  $('end-notebook').onclick = () => { $('overlay-ending').classList.add('hidden'); backTo = 'title'; showScreen('notebook'); };
}

// ---------------------------------------------------------------- title / chapters / notebook / settings
function renderTitle() {
  if (!$('title-bg').innerHTML) $('title-bg').innerHTML = sceneSVG('title');
  if (!$('title-art').innerHTML) $('title-art').innerHTML = tuviaSVG({ expression: 'smirk', pose: 'listen', size: 260, id: 'titleart' });
  if (!$('title-goat').innerHTML) $('title-goat').innerHTML = goatSVG({ size: 90 });
  $('btn-continue').classList.toggle('hidden', !(state.started && state.chapter));
  $('endings-gallery').innerHTML = ENDING_ORDER.map((id) => {
    const E = ENDINGS[id], seen = state.endingsSeen.includes(id);
    return `<div class="ending-tile ${seen ? '' : 'locked'}"><div class="em">${seen ? E.emoji : '😶'}</div><div>${seen ? esc(E.title) : '???'}</div>${seen ? '' : `<div class="hint">${esc(E.hint)}</div>`}</div>`;
  }).join('');
}
const TITLE_GOAT_LINES = ['מעניין.', 'העז מסתכלת עליי. אני מסתכל על העז. שנינו יודעים את האמת.', 'היא לא מאוכזבת ממך. היא מאוכזבת מכולם.', 'נו.', 'גם במסך הפתיחה. גם לפה היא הגיעה.', 'אני לא אוכל עז. אני גם לא אוכל קינואה. יש לי עקרונות.'];
let goatN = 0;
const pokeGoat = () => { audio.playSfx('goat'); $('title-goat-line').textContent = '💭 ' + TITLE_GOAT_LINES[goatN++ % TITLE_GOAT_LINES.length]; $('title-goat').classList.add('poked'); setTimeout(() => $('title-goat').classList.remove('poked'), 400); };
$('title-goat').addEventListener('click', pokeGoat);
$('title-goat').addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pokeGoat(); } });
function newGame() {
  const keep = { endingsSeen: state.endingsSeen, seen: state.seen };
  state = { ...S.freshState(), ...keep };
  expression = 'smirk';
  startFrom('ch1');
}
$('btn-start').addEventListener('click', () => {
  audio.playSfx('click');
  if (state.started && state.chapter && !confirm('להתחיל מחדש? ההתקדמות תימחק. (הפנקס הישן, גם.)')) return;
  newGame();
});
$('btn-continue').addEventListener('click', () => { audio.playSfx('click'); if (state.chapter) startFrom(state.chapter, state.encounter || 0); });
$('btn-chapters').addEventListener('click', () => { audio.playSfx('click'); backTo = 'title'; showScreen('chapters'); });
$('btn-notebook-title').addEventListener('click', () => { audio.playSfx('click'); backTo = 'title'; showScreen('notebook'); });
$('btn-settings-title').addEventListener('click', () => { audio.playSfx('click'); backTo = 'title'; showScreen('settings'); });
$('btn-notebook').addEventListener('click', () => { audio.playSfx('page'); backTo = 'game'; showScreen('notebook'); });
$('btn-settings').addEventListener('click', () => { audio.playSfx('click'); backTo = 'game'; showScreen('settings'); });
$('screen-title').addEventListener('click', (e) => { if (e.target.closest('button, a')) return; if (!audio.currentLocation()) audio.playMusic('bneibrak'); });

function renderChapters() {
  $('chapters-list').innerHTML = CHAPTER_LIST.map((c) => {
    const reached = state.unlocked.includes(c.id);
    const cls = c.soon ? 'locked' : (!reached ? 'locked' : (state.chapter === c.id ? '' : 'done'));
    return `<div class="ch-card ${cls}" ${!c.soon && reached ? `data-ch="${c.id}" role="button" tabindex="0"` : ''}><div class="num"><bdi>${c.num}</bdi></div><div><div class="name">${esc(c.name)}</div><div class="tag">${esc(c.tag)}</div></div><div>${c.soon ? '🔒 בקרוב' : reached ? '▶' : '🔒'}</div>${c.soon ? `<div class="soon">💭 ${esc(c.soon)}</div>` : (!reached ? '<div class="soon">💭 עוד לא הגעתי לשם. משה עוד לא סיים להסביר.</div>' : '')}</div>`;
  }).join('');
}
$('chapters-list').addEventListener('click', (e) => {
  const c = e.target.closest('[data-ch]'); if (!c) return;
  audio.playSfx('click'); startFrom(c.dataset.ch, 0);
});
let nbTab = 'all';
function renderNotebook() {
  const nb = state.notebook;
  $('nb-stats').innerHTML = `<span>📖 <bdi>${state.pages}</bdi>/<bdi>${S.SLICE.bookTarget}</bdi> עמודים</span><span>✍ <bdi>${nb.length}</bdi> ציטוטים</span><span>🥄 <bdi>${state.ingredients.length}/${S.SLICE.ingredientsTotal}</bdi></span><span>🐐 <bdi>${Object.keys(state.goatFound).length}/3</bdi></span><span>😇 <bdi>${nb.filter((e) => e.kind === 'innocent').length}</bdi> · 🎭 <bdi>${nb.filter((e) => e.kind === 'disguise').length}</bdi></span>`;
  const chs = ['all', ...CHAPTER_LIST.filter((c) => nb.some((e) => e.ch === c.id)).map((c) => c.id)];
  if (!chs.includes(nbTab)) nbTab = 'all';
  $('nb-tabs').innerHTML = chs.map((id) => `<button class="nb-tab ${nbTab === id ? 'on' : ''}" data-tab="${id}">${id === 'all' ? 'הכל' : esc(CHAPTER_LIST.find((c) => c.id === id).name)}</button>`).join('');
  const entries = nb.filter((e) => nbTab === 'all' || e.ch === nbTab);
  let html = entries.map((e) => `<div class="nb-entry ${e.kind}"><div class="who"><span>${esc(e.who)}</span><span>📖 +<bdi>${e.pages}</bdi> · ${esc((CHAPTER_LIST.find((c) => c.id === e.ch) || {}).name || '')}</span></div><div class="q">${fmt(e.text)}</div>${e.note ? `<div class="nb-note">${fmt(e.note)}</div>` : ''}</div>`).join('');
  if (Object.keys(state.goatFound).length >= 3 && nbTab === 'all') html += `<div class="nb-entry goat"><div class="who"><span>🐐 ${esc(GOAT_PAGE.title)}</span></div><div class="q">${esc(GOAT_PAGE.text)}</div><div class="nb-note">${esc(GOAT_PAGE.note)}</div></div>`;
  $('nb-entries').innerHTML = html || `<div class="nb-empty">הפנקס ריק. עוד לא שאלתי אף אחד כלום. זה לא יחזיק מעמד.</div>`;
}
$('nb-tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) { nbTab = b.dataset.tab; renderNotebook(); } });
function renderSettings() {
  $('set-speed').innerHTML = SETTINGS_COPY.speeds.map((s) => `<button data-speed="${s.id}" class="${settings.speed === s.id ? 'on' : ''}">${s.label}</button>`).join('');
  $('set-mute').textContent = settings.muted ? '🔇 מושתק' : '🔊 דלוק';
  $('set-volume').value = settings.volume;
  $('set-contrast').textContent = settings.contrast ? 'דלוק' : 'כבוי';
  $('set-menu').classList.toggle('hidden', backTo !== 'game');
}
$('set-speed').addEventListener('click', (e) => { const b = e.target.closest('[data-speed]'); if (!b) return; settings.speed = b.dataset.speed; S.saveSettings(settings); renderSettings(); });
$('set-mute').addEventListener('click', () => { settings.muted = !settings.muted; audio.setMuted(settings.muted); S.saveSettings(settings); renderSettings(); });
$('set-volume').addEventListener('input', (e) => { settings.volume = +e.target.value; audio.setVolume(settings.volume); S.saveSettings(settings); });
$('set-contrast').addEventListener('click', () => { settings.contrast = !settings.contrast; document.body.classList.toggle('contrast', settings.contrast); S.saveSettings(settings); renderSettings(); });
$('set-menu').addEventListener('click', () => { S.saveState(state); abortRun(); audio.stopMusic(); showScreen('title'); });
$('set-reset').addEventListener('click', () => {
  if (!confirm('למחוק הכל? גם את הפנקס, גם את הסופים, גם את הקוגל?')) return;
  S.clearState(); state = S.freshState(); abortRun(); $('settings-note').textContent = '💭 נמחק. הקוגל נשאר בלב. תמיד.'; backTo = 'title'; showScreen('title');
});

// ---------------------------------------------------------------- stage input, keyboard, idle, log, fast-forward
function stageTap() {
  lastInteraction = Date.now();
  if (typing) { typing.finish(); return; }
  if (waiting.type === 'tap') { audio.playSfx('click'); resolveWait(true); }
}
$('stage').addEventListener('click', (e) => { if (e.target.closest('#goat') || e.target.closest('.hud-item')) return; stageTap(); });
$('dialogue').addEventListener('click', (e) => { if (e.target.closest('button')) return; stageTap(); });
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  const gameActive = $('screen-game').classList.contains('active');
  if (e.key === 'Escape') {
    if (!$('overlay-phone').classList.contains('hidden')) closePhone();
    else if (!$('overlay-log').classList.contains('hidden')) $('overlay-log').classList.add('hidden');
    return;
  }
  if (!$('overlay-card').classList.contains('hidden')) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); resolveWait(true); } return; }
  if (!$('overlay-phone').classList.contains('hidden')) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); phoneNext(); } return; }
  if (!gameActive) return;
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); stageTap(); }
  else if (/^[1-9]$/.test(e.key)) {
    const btns = [...$('choices').querySelectorAll('.choice:not([disabled])')];
    const b = btns[+e.key - 1]; if (b) b.click();
  } else if (e.key.toLowerCase() === 'n') $('btn-notebook').click();
  else if (e.key.toLowerCase() === 'f') $('btn-ff').click();
});
$('btn-ff').addEventListener('click', () => { fastForward = !fastForward; $('btn-ff').classList.toggle('on', fastForward); toast(fastForward ? '⏩ דילוג על שורות שכבר נקראו' : '⏩ כבוי'); if (fastForward && typing) typing.finish(); });
$('btn-log').addEventListener('click', () => {
  $('log-list').innerHTML = log.slice(-80).map((l) => l.speaker === '💭' ? `<div class="log-line aside">💭 ${fmt(l.text)}</div>` : `<div class="log-line"><b>${l.choice ? '▸ ' : ''}${esc((CAST[l.speaker] || {}).name || '')}</b> ${fmt(l.text)}</div>`).join('') || '<div class="nb-empty">עוד לא נאמר כלום.</div>';
  $('overlay-log').classList.remove('hidden'); $('log-list').scrollTop = 1e6;
});
$('log-close').addEventListener('click', () => $('overlay-log').classList.add('hidden'));
setInterval(() => {
  if (!$('screen-game').classList.contains('active') || !currentChapter) return;
  if (!document.querySelector('.overlay:not(.hidden)') && (waiting.type === 'tap' || waiting.type === 'choice') && Date.now() - lastInteraction > 24000 && $('aside').classList.contains('hidden')) {
    showAside(pick([...(currentChapter.idle || []), ...IDLE_GENERIC]), 5000);
    lastInteraction = Date.now();
  }
}, 4000);

// ---------------------------------------------------------------- boot + test API
showScreen('title');
renderHud();
window.__tuvia = {
  get state() { return state; },
  audio, settings, FOODS, CHAPTERS, ENDINGS,
  goto: (chId, enc = 0) => startFrom(chId, enc),
  newGame,
  setMood: (n) => { state.mood = S.clamp(n, 0, moodCap()); audio.setMood(Math.min(100, state.mood)); renderHud(); },
  addPages: (n) => { state.pages += n; renderHud(); },
  giveIngredient,
  setFlag: (k, v) => { state.flags[k] = v; },
  callIsi: () => { const c = state.chapter; if (c) state.isiCalled[c] = true; renderHud(); },
  findGoat: () => { const c = state.chapter; if (c) state.goatFound[c] = true; },
  skip: () => { settings.speed = 'instant'; fastForward = true; $('btn-ff').classList.add('on'); },
  waiting: () => waiting.type,
  tap: () => { if (waiting.type === 'card') resolveWait(true); else stageTap(); },
  choices: () => [...$('choices').querySelectorAll('.choice:not([disabled])')].map((b) => b.textContent.trim()),
  choose: (i) => { const b = [...$('choices').querySelectorAll('.choice:not([disabled])')][i]; if (b) b.click(); return !!b; },
  pickDisguise: (id) => { if (waiting.type === 'disguise') resolveWait(id); },
  seatRandom: () => { if (seatingApi) { seatingApi.random(); seatingApi.done(); } },
  phoneNext, openPhone,
  ending: (id) => { abortRun(); run.token++; return runEnding(id); },
  decideEnding: () => S.decideEnding(state),
  save: () => S.saveState(state), load: () => { const s = S.loadState(); if (s) state = s; renderHud(); return !!s; }, reset: () => { S.clearState(); state = S.freshState(); },
  title: () => { abortRun(); showScreen('title'); },
  log,
};
