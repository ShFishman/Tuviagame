/* js/main.js — boot, screens, HUD, the step interpreter, the minigame runner, Isi, notebook, endings.
 * Exposes window.__tuvia for automated testing (documented in README.md).
 */
import * as S from './state.js';
import { state, SLICE, INGREDIENTS, MOOD_BANDS, ENDINGS } from './state.js';
import { createAudio } from './audio.js';
import { tuviaSVG, goatSVG, TUVIA_CSS } from './art/tuvia.js';
import { npcSVG, NPC_NAMES } from './art/npcs.js';
import { createDialogue, bidi } from './dialogue.js';
import { FOODS, DISGUISES } from './content/foods.js';
import { TITLE, CHAPTER_LIST, IDLE_LINES, ITEM_LINES, ISI, MOSHE, ENDING_TEXT } from './content/common.js';
import { MG } from './content/minigames.js';
import { ch1 } from './content/ch1.js';
import { ch3 } from './content/ch3.js';
import { ch4 } from './content/ch4.js';
import { finale } from './content/finale.js';
import * as suitcase from './minigames/suitcase.js';
import * as taxi from './minigames/taxi.js';
import * as quinoa from './minigames/quinoa.js';
import * as goat from './minigames/goat.js';
import * as quiz from './minigames/quiz.js';
import * as kiddush from './minigames/kiddush.js';
import * as seating from './minigames/seating.js';

const CHAPTERS = { ch1, ch3, ch4, finale };
const MINIGAMES = { suitcase, taxi, quinoa, goat, quiz, kiddush, seating };
const LINKS = { ch3: 'taxi3', ch4: 'taxi4', finale: 'taxiF' };

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- boot ----------
const style = document.createElement('style'); style.textContent = TUVIA_CSS; document.head.appendChild(style);
const audio = createAudio({ basePath: 'audio/', checkFiles: false });
audio.setMuted(!!S.meta.settings.muted);

const screens = { title: $('#screen-title'), map: $('#screen-map'), game: $('#screen-game') };
const stage = $('#stage'), dialog = $('#dialog'), mgHost = $('#mg'), hud = $('#hud');
let screen = 'title';
let pendingEnding = null;
let mgControl = null;
let runToken = 0;              // bumps when a chapter is abandoned (goto / new game)
let currentChapter = null;

const ui = createDialogue({
  stage, dialog, audio,
  getSettings: () => S.meta.settings,
  getDisguise: () => state.disguise,
  onIdle: () => ui.bubble(IDLE_LINES[Math.floor(Math.random() * IDLE_LINES.length)]),
  onGoat: () => findGoat(),
});

function showScreen(name) {
  screen = name;
  for (const [k, el] of Object.entries(screens)) el.classList.toggle('on', k === name);
  document.body.dataset.screen = name;
  window.scrollTo(0, 0);
}
function toast(html, ms = 3000) {
  const t = $('#toast');
  t.innerHTML = html; t.classList.add('on');
  clearTimeout(toast.timer); toast.timer = setTimeout(() => t.classList.remove('on'), ms);
}

// ---------- HUD ----------
function renderHUD() {
  const band = S.moodBand(state.mood);
  const faceEl = $('#hud-face');
  const key = band.face + '|' + state.disguise + '|' + (state.mood > 100 ? 'x' : '');
  if (faceEl.dataset.key !== key) { faceEl.dataset.key = key; faceEl.innerHTML = tuviaSVG({ expression: state.mood > 100 ? 'delighted' : band.face, crop: 'head', size: 48, disguise: state.disguise, id: 'hudface' }); }
  const pct = Math.min(100, state.mood / 100 * 100);
  $('#hud-mood-fill').style.width = pct + '%';
  $('#hud-mood-fill').className = 'hud-mood-fill band-' + MOOD_BANDS.indexOf(band) + (state.mood > 100 ? ' over' : '');
  $('#hud-mood-num').innerHTML = `<bdi>${state.mood}</bdi>`;
  $('#hud-mood-text').textContent = state.mood > 100 ? 'שיכור מקוגל.' : band.text;
  $('#hud-pages').innerHTML = `📖 <bdi>${state.pages}</bdi><small>/<bdi>${SLICE.pagesTarget}</bdi></small>`;
  $('#hud-ing').innerHTML = INGREDIENTS.map((i) => {
    const has = state.ingredients.includes(i.id);
    const cls = has ? 'has' : i.soon ? 'soon' : 'missing';
    return `<span class="ing ${cls}" title="${i.soon ? 'בקרוב: ' : ''}${i.name}">${has ? i.icon : i.soon ? '🔒' : '○'}</span>`;
  }).join('');
  $('#hud-cola').innerHTML = `🥤<bdi>×${state.cola}</bdi>`; $('#hud-cola').disabled = state.cola <= 0 || screen !== 'game';
  $('#hud-rug').innerHTML = `🥐<bdi>×${state.rugelach}</bdi>`; $('#hud-rug').disabled = state.rugelach <= 0 || screen !== 'game';
  const ch = currentChapter;
  const isiOk = ch && ISI[ch.id] && !state.isi[ch.id];
  $('#hud-isi').disabled = !isiOk; $('#hud-isi').classList.toggle('ring', !!isiOk);
  $('#hud-isi').title = isiOk ? 'להתקשר לאיזי' : 'איזי: פעם אחת בפרק';
  $('#hud-dis').innerHTML = DISGUISES[state.disguise].icon + ' ' + DISGUISES[state.disguise].short;
}
S.on('change', renderHUD);
S.on('mood', (e) => { if (!e.silent && e.delta) { ui.flashMood(e.delta, e.food ? FOODS[e.food]?.icon : '🍲'); audio.setMood(state.mood); } });
S.on('colaSave', () => { audio.playSfx('fizz'); toast('🥤 פחית חירום! ' + ITEM_LINES.colaSave, 5000); });
S.on('moodZero', () => { pendingEnding = 'huff'; });
S.on('settings', applySettings);
function applySettings() { document.body.classList.toggle('contrast', !!S.meta.settings.contrast); audio.setMuted(!!S.meta.settings.muted); $('#set-mute').textContent = S.meta.settings.muted ? '🔇 מושתק' : '🔊 סאונד'; $$('[data-speed]').forEach((b) => b.classList.toggle('active', b.dataset.speed === S.meta.settings.speed)); $('#set-contrast').classList.toggle('active', !!S.meta.settings.contrast); }

$('#hud-cola').addEventListener('click', () => { if (S.useCola()) { audio.playSfx('fizz'); ui.bubble(ITEM_LINES.cola[Math.floor(Math.random() * ITEM_LINES.cola.length)]); } });
$('#hud-rug').addEventListener('click', () => { if (S.useRugelach()) { audio.playSfx('crunch'); ui.bubble(ITEM_LINES.rugelach[Math.floor(Math.random() * ITEM_LINES.rugelach.length)]); } });
$('#hud-isi').addEventListener('click', () => callIsi());
$('#hud-notebook').addEventListener('click', () => openNotebook());
$('#hud-settings').addEventListener('click', () => openSettings());
$('#hud-menu').addEventListener('click', async () => { const r = await ui.card('<h3>לעזוב באמצע?</h3><p>ההתקדמות נשמרת בתחילת כל סצנה. הקוגל לא.</p>', [{ id: 'yes', label: 'לתפריט', cls: 'btn-secondary' }, { id: 'no', label: 'להישאר' }]); if (r === 'yes') { S.save(); runToken++; goTitle(); } });

// ---------- title ----------
function goTitle() {
  currentChapter = null; pendingEnding = null;
  $('#title-art').innerHTML = tuviaSVG({ pose: 'listen', expression: 'smirk', size: 300, id: 'titleart' });
  $('#title-quote').textContent = '"' + TITLE.quotes[Math.floor(Math.random() * TITLE.quotes.length)] + '"';
  $('#btn-resume').hidden = !S.hasSave();
  $('#title-goat').innerHTML = goatSVG({ size: 80 });
  renderEndings();
  showScreen('title');
}
function renderEndings() {
  const seen = S.meta.endingsSeen;
  $('#endings').innerHTML = ENDINGS.map((e) => seen.includes(e.id)
    ? `<div class="ending-chip seen" title="${e.name}"><span class="ending-icon">${e.icon}</span><span class="ending-name">${e.name}</span></div>`
    : `<div class="ending-chip locked"><span class="ending-icon">🔒</span><span class="ending-name">${e.hint}</span></div>`).join('');
  $('#endings-count').innerHTML = `<bdi>${seen.length}</bdi>/<bdi>${ENDINGS.length}</bdi>`;
}
$('#btn-start').addEventListener('click', async () => {
  audio.playSfx('click');
  if (S.hasSave()) { const r = await ui.card(`<h3>משחק חדש?</h3><p>${TITLE.newGameWarn}</p>`, [{ id: 'new', label: 'להתחיל מחדש' }, { id: 'cancel', label: 'ביטול', cls: 'btn-secondary' }]); if (r !== 'new') return; }
  S.newGame(); S.clearSave();
  startChapter('ch1');
});
$('#btn-resume').addEventListener('click', () => { const s = S.load(); if (!s) return; audio.playSfx('page'); if (s.chapter && CHAPTERS[s.chapter]) startChapter(s.chapter, s.node); else goMap(); });
$('#btn-notebook').addEventListener('click', () => openNotebook());
$('#btn-settings').addEventListener('click', () => openSettings());
$('#title-goat').addEventListener('click', () => { audio.playSfx('goat'); toast('💭 ' + ['העז. גם פה.', 'היא מאוכזבת גם מהתפריט.', 'נו.'][Math.floor(Math.random() * 3)]); });

// ---------- map ----------
function nextChapterId() { return SLICE.chapters.find((c) => !state.done.includes(c)) || null; }
function goMap() {
  const next = nextChapterId();
  $('#map-list').innerHTML = CHAPTER_LIST.map((c) => {
    const done = state.done.includes(c.id), isNext = c.id === next;
    const cls = c.soon ? 'soon' : done ? 'done' : isNext ? 'next' : 'locked';
    return `<button type="button" class="map-ch ${cls}" data-ch="${c.id}"><span class="map-icon">${c.icon}</span><span class="map-body"><span class="map-n">פרק <bdi>${c.n}</bdi>${done ? ' ✓' : c.soon ? ' · בקרוב' : ''}</span><span class="map-name">${c.name}</span><span class="map-sub">${c.sub}</span></span></button>`;
  }).join('');
  $$('.map-ch').forEach((b) => b.addEventListener('click', () => {
    const c = CHAPTER_LIST.find((x) => x.id === b.dataset.ch);
    if (c.soon) { audio.playSfx('nu'); toast('💭 ' + c.line, 4000); return; }
    if (c.id !== next) { audio.playSfx('boo'); toast(state.done.includes(c.id) ? '💭 הייתי שם. אכלתי. רשמתי. הלאה.' : '💭 עוד לא. קודם הפרק הבא. גם ספר קוראים לפי הסדר. בדרך כלל.'); return; }
    startChapter(c.id);
  }));
  $('#map-stats').innerHTML = `📖 <bdi>${state.pages}</bdi> עמודים · 🥄 <bdi>${state.ingredients.length}</bdi>/<bdi>${SLICE.ingredientsTarget}</bdi> · 🍲 <bdi>${state.mood}</bdi>`;
  $('#map-tuvia').innerHTML = tuviaSVG({ pose: 'stand', expression: S.moodBand(state.mood).face, crop: 'bust', size: 140, table: false, id: 'maptuvia' });
  showScreen('map');
  S.save();
}
$('#map-menu').addEventListener('click', () => goTitle());

// ---------- chapter runner ----------
function sceneOpts(ch, bg) {
  if (!ch || !ch.goat || ch.goat.viaMinigame || ch.goat.scene !== bg) return {};
  return { goat: state.goat[ch.id] ? 'found' : 'hidden' };
}
function findGoat() {
  const ch = currentChapter; if (!ch) return;
  if (!S.markGoat(ch.id)) return;
  audio.playSfx('goat');
  ui.setGoatState('found');
  ui.bubble('🐐 ' + (ch.goat.aside || 'העז. מצאתי.'), 6000);
  toast('🐐 מצאת את העז של הפרק!');
}

async function startChapter(id, resumeNode = null) {
  const token = ++runToken;
  pendingEnding = null;
  showScreen('game');
  mgHost.hidden = true; stage.hidden = false; dialog.hidden = false;
  if (id !== 'ch1' && !resumeNode && LINKS[id]) {
    const ok = await runLink(LINKS[id], token);
    if (!ok || token !== runToken) return;
  }
  await playChapter(id, resumeNode, token);
}

async function runLink(linkId, token) {
  const link = MOSHE[linkId];
  currentChapter = null;
  audio.playMusic(link.music);
  ui.clear(); ui.setScene(link.bg, {}); ui.setNPC(link.npc, 'neutral'); ui.setTuvia('smirk', 'listen');
  renderHUD();
  const pseudo = { id: linkId, nodes: { main: { steps: link.steps } } };
  for (const step of link.steps) { if (token !== runToken) return false; await runStep(step, pseudo); if (pendingEnding) break; }
  return true;
}

async function playChapter(id, resumeNode, token) {
  const ch = CHAPTERS[id];
  currentChapter = ch;
  state.chapter = id;
  state.moodCap = ch.moodCap || 100;
  const pagesAtStart = state.pages;
  audio.playMusic(ch.music); audio.setMood(state.mood);
  ui.clear(); ui.setNPC(null); ui.setTuvia('smirk', 'listen');
  renderHUD();
  if (!resumeNode) await titleCard(ch);
  else state.resumeFix = true;
  let node = resumeNode && ch.nodes[resumeNode] ? resumeNode : ch.start;
  while (node) {
    if (token !== runToken) return;
    const r = await runNode(ch, node, token);
    if (token !== runToken) return;
    if (pendingEnding) { await playEnding(pendingEnding, token); return; }
    if (r === 'END') break;
    if (r === 'ENDING') { await playEnding(S.decideEnding(), token); return; }
    node = r;
  }
  S.finishChapter(id);
  await chapterSummary(ch, state.pages - pagesAtStart);
  if (token !== runToken) return;
  goMap();
}

async function titleCard(ch) {
  await ui.card(`<div class="title-card"><div class="tc-n">פרק <bdi>${ch.n}</bdi></div><div class="tc-title">${ch.title}</div><div class="tc-sub">${ch.sub}</div></div>`, [{ id: 'go', label: 'נו, יאללה' }], 'title-card-overlay');
}
async function chapterSummary(ch, gained) {
  const ing = INGREDIENTS.find((i) => i.ch === ch.id);
  const has = ing && state.ingredients.includes(ing.id);
  await ui.card(`<h3>סוף פרק <bdi>${ch.n}</bdi>: ${ch.title}</h3>
    <ul class="summary">
      <li>📖 עמודים מהפרק: <b><bdi>+${gained}</bdi></b> (סה"כ <bdi>${state.pages}</bdi>/<bdi>${SLICE.pagesTarget}</bdi>)</li>
      <li>🥄 מרכיב: ${ing ? (has ? `<b>${ing.icon} ${ing.name}</b> ✓` : `<b>${ing.name}</b> נשאר אצל ${ing.from}.`) : '—'}</li>
      <li>🍲 מצב רוח: <b><bdi>${state.mood}</bdi></b> · ${S.moodBand(state.mood).text}</li>
      <li>📱 איזי: ${state.isi[ch.id] ? 'התקשרתי ✓' : 'לא התקשרתי. היא תזכור.'} · 🐐 העז: ${state.goat[ch.id] ? 'נמצאה ✓' : 'לא נמצאה.'}</li>
    </ul>`, [{ id: 'ok', label: 'למפה ←' }]);
}

async function runNode(ch, nodeId, token) {
  const node = ch.nodes[nodeId];
  if (!node) return null;
  state.node = nodeId; S.save();
  if (node.bg) { state.bg = node.bg; ui.setScene(node.bg, sceneOpts(ch, node.bg)); }
  else if (!ui.current.bg || state.resumeFix) { state.resumeFix = false; ui.setScene(state.bg || ch.bg, sceneOpts(ch, state.bg || ch.bg)); }
  if ('npc' in node) ui.setNPC(node.npc, node.m);
  if (node.drift) { S.addMood(-2, { silent: true }); ui.flashMood(-2, '🍽️ רעב'); }
  for (const step of node.steps) {
    if (token !== runToken) return null;
    const r = await runStep(step, ch);
    if (pendingEnding) return 'ENDING';
    if (r) return r;
  }
  return node.next || null;
}

function applyFx(fx, ch) {
  if (fx.music !== undefined) { if (fx.music) audio.playMusic(fx.music); else audio.stopMusic(); }
  if (fx.sfx) audio.playSfx(fx.sfx);
  if (fx.sting) audio.sting(fx.sting);
  if (fx.cue) audio.cue(fx.cue);
  if (fx.shake) { ui.shake(); ui.anim('anim-shake'); }
  if (fx.mood) S.addMood(fx.mood);
  if (fx.pages) { const g = S.addPages(fx.pages); ui.flashPages(g); audio.playSfx('scribble'); }
  if (fx.cola) { S.giveCola(fx.cola); toast(`🥤 +${fx.cola} קולה זירו`); }
  if (fx.rugelach) { S.giveRugelach(fx.rugelach); toast(`🥐 +${fx.rugelach} רוגעלך`); }
  if (fx.flag) S.setFlag(fx.flag);
  if (fx.badPolite) state.badPolite += fx.badPolite;
  if (fx.goat && ch) { if (S.markGoat(ch.id)) { toast('🐐 מצאת את העז של הפרק!'); } }
  if (fx.disguise) { S.setDisguise(fx.disguise); ui.setTuvia(); }
}

async function runStep(step, ch) {
  if (step.bg) { state.bg = step.bg; ui.setScene(step.bg, sceneOpts(ch, step.bg)); }
  if ('npc' in step && !step.s) { ui.setNPC(step.npc, step.m); return null; }
  if (step.music !== undefined && !step.fx) audio.playMusic(step.music);
  if (step.n) { await ui.narrate(step.n); return null; }
  if (step.s) {
    if (step.s === 'tuvia') await ui.speak('tuvia', step.t, { x: step.x });
    else await ui.speak(step.s, step.t, { m: step.m, x: step.x });
    return null;
  }
  if (step.a) { await ui.aside(step.a, { x: step.x }); return null; }
  if (step.x) { ui.setTuvia(step.x); return null; }
  if (step.fx) { applyFx(step.fx, ch); return null; }
  if (step.q) { quote(step.q); await sleep(600); return null; }
  if (step.food) return foodStep(step);
  if (step.choices) {
    const list = step.choices.filter((c) => (!c.dis || c.dis === state.disguise) && (!c.when || c.when(state)) && (!c.once || !state.flags['once:' + c.once]));
    const c = await ui.choose(list);
    if (c.once) S.setFlag('once:' + c.once);
    if (c.fx) applyFx(c.fx, ch);
    if (c.k === 'innocent') audio.playSfx('ding');
    return c.go || null;
  }
  if (step.mg) { const r = await runMinigame(step.mg); return (step.go && step.go[r.win ? 'win' : 'lose']) || null; }
  if (step.when) return step.when(state) ? step.go : (step.else || null);
  if (step.go) return step.go;
  if (step.ingredient) { await ingredientCard(step.ingredient); return null; }
  if (step.disguise) { await disguisePicker(ch); return null; }
  if (step.end) return 'END';
  if (step.ending) return 'ENDING';
  return null;
}

function quote(q) {
  const entry = S.addQuote({ who: q.who, text: q.t, pages: q.pages, margin: q.margin });
  ui.setTuvia('writing', 'write');
  ui.flashPages(entry.pages);
  audio.playSfx('scribble');
}

async function foodStep(step) {
  const food = FOODS[step.food];
  if (!food) return null;
  const delta = (food.bneibrakMood != null && state.disguise === 'bneibrak') ? food.bneibrakMood : food.mood;
  const buttons = [];
  if (step.only) buttons.push({ id: 'eat', label: step.only });
  else {
    buttons.push({ id: 'eat', label: food.bad ? '😬 לאכול.' : '😋 לאכול!' });
    if (food.bad && step.polite !== false) buttons.push({ id: 'polite', label: '😊 "תודה, טעים מאוד."', cls: 'btn-polite' });
    if (!step.noRefuse) buttons.push({ id: 'refuse', label: '🙅 "לא, תודה."', cls: 'btn-secondary' });
  }
  const html = `<div class="food-card"><div class="food-icon">${food.icon}</div><div class="food-name">${food.name}</div><div class="food-from">${step.from ? 'מגיש/ה: ' + step.from : ''}</div><div class="food-effect ${delta >= 0 ? 'up' : 'down'}">🍲 <bdi>${delta >= 0 ? '+' : ''}${delta}</bdi>${food.bad && step.polite !== false ? '<small>· "טעים מאוד" נספר בשביל הצ\'ולנט (ובשביל סוף אחר)</small>' : ''}</div></div>`;
  const opt = await ui.card(html, buttons, 'food-overlay');
  if (opt === 'refuse') {
    audio.playSfx('nu');
    if (!food.bad) S.addMood(-3);
    ui.setTuvia('neutral');
    if (step.react && step.react.refuse) await ui.speak(ui.current.npc || 'narr', step.react.refuse);
    return (step.then && step.then.refuse) || null;
  }
  const polite = opt === 'polite';
  S.eatFood(food, polite);
  if (food.shock) { audio.playSfx('gasp'); audio.sting('bad'); ui.shake(); ui.setTuvia('shocked'); }
  else if (food.bad) { audio.playSfx(food.sfx || 'sigh'); audio.sting('bad'); ui.setTuvia('disgusted'); }
  else { audio.playSfx(food.sfx || 'burp'); audio.sting('good'); ui.setTuvia('delighted'); ui.anim('anim-snap'); }
  await ui.speak('tuvia', (polite ? '(בקול:) תודה, טעים מאוד. (בלב:) ' : '') + food.verdict, { x: food.shock ? 'shocked' : food.bad ? 'disgusted' : 'delighted' });
  if (!food.bad) ui.anim('anim-laugh');
  if (step.react && step.react[opt]) await ui.speak(ui.current.npc || 'narr', step.react[opt]);
  return (step.then && step.then[opt]) || null;
}

async function ingredientCard(id) {
  const ing = INGREDIENTS.find((i) => i.id === id);
  if (!ing) return;
  const fresh = S.giveIngredient(id);
  audio.playSfx('tada'); audio.sting('good');
  ui.setTuvia('delighted'); ui.anim('anim-snap');
  await ui.card(`<div class="ing-card"><div class="ing-big">${ing.icon}</div><h3>🥄 מרכיב לצ'ולנט המושלם: ${ing.name}</h3><p class="ing-from">מ${ing.from}</p><p class="ing-line">💭 ${bidi(ing.line)}</p><p class="ing-count">${fresh ? '' : '(כבר היה לי. גם זה בסדר.)'} <bdi>${state.ingredients.length}</bdi>/<bdi>${SLICE.ingredientsTarget}</bdi> בפרוסה הזאת</p></div>`, [{ id: 'ok', label: 'לכיס. ליד הפנקס.' }], 'ing-overlay');
}

async function disguisePicker(ch) {
  const hint = ch && state.isi[ch.id] && ISI[ch.id] ? `<p class="dis-hint">📱 איזי אמרה: "${ISI[ch.id].hint}"</p>` : `<p class="dis-hint muted">📱 (איזי עוד לא התקשרה. היא יודעת דברים.)</p>`;
  const opts = Object.values(DISGUISES).map((d) => `<button type="button" class="dis-opt" data-d="${d.id}">${tuviaSVG({ crop: 'head', disguise: d.id, size: 64, expression: d.id === 'guest' ? 'happy' : 'smirk', id: 'dis-' + d.id })}<span class="dis-name">${d.name}</span><span class="dis-desc">${d.desc}</span></button>`).join('');
  await new Promise((res) => {
    const ov = document.createElement('div');
    ov.className = 'card-overlay dis-overlay';
    ov.innerHTML = `<div class="card"><h3>🎭 מי אני היום?</h3>${hint}<div class="dis-grid">${opts}</div></div>`;
    $('#game').appendChild(ov);
    requestAnimationFrame(() => ov.classList.add('on'));
    const pick = (d) => { S.setDisguise(d); ui.setTuvia(); audio.playSfx(d === 'none' ? 'click' : 'whoosh'); ov.classList.remove('on'); setTimeout(() => ov.remove(), 250); window.removeEventListener('keydown', onKey); res(); };
    $$('.dis-opt', ov).forEach((b) => b.addEventListener('click', () => pick(b.dataset.d)));
    const onKey = (e) => { const n = parseInt(e.key, 10); const list = $$('.dis-opt', ov); if (n >= 1 && n <= list.length) { e.preventDefault(); list[n - 1].click(); } };
    window.addEventListener('keydown', onKey);
  });
  if (state.disguise !== 'none') await ui.aside({ tobi: 'כובע טירולי. נוצה. "Ja". אם סבא שלי רואה את זה הוא מתהפך בקבר. ואז מבקש עוגה.', bneibrak: 'כובע קטן. ז\'קט שחור. השלייקעס מציצות. "אתה לא עובד על אף אחד", אמרה איזי. נראה.', guest: 'מפית בצווארון. מזלג ביד. אורח פשוט. אין דבר פשוט באורח עם פנקס.' });
}

// ---------- minigames ----------
async function runMinigame(id) {
  const mod = MINIGAMES[id], C = MG[id];
  const intro = `<div class="mg-intro"><div class="mg-intro-head"><span class="mg-intro-icon">${C.icon}</span><h3>${C.title}</h3></div>${C.intro.map((p) => `<p>${bidi(p)}</p>`).join('')}<p class="mg-intro-ctrl">🖐 מגע · ⌨️ מקלדת (רווח / Enter / חיצים / מספרים)</p></div>`;
  await ui.card(intro, [{ id: 'go', label: 'יאללה' }], 'mg-overlay');
  let result;
  for (;;) {
    stage.hidden = true; dialog.hidden = true; mgHost.hidden = false;
    mgControl = null;
    const ctx = {
      content: C, audio, state,
      tuviaHead: (expr, size) => tuviaSVG({ expression: expr, crop: 'head', size, disguise: state.disguise }),
      control: (c) => { mgControl = c; },
    };
    result = await mod.run(mgHost, ctx);
    mgControl = null;
    state.mg[id] = result;
    const rw = { ...(C.reward ? C.reward[result.win ? 'win' : 'lose'] : {}) };
    if (result.mood != null) rw.mood = (rw.mood || 0) + result.mood;
    if (result.pages != null) rw.pages = (rw.pages || 0) + result.pages;
    const verdict = C.verdict ? C.verdict[result.win ? 'win' : 'lose'] : '';
    const details = result.text ? `<p class="mg-res-detail">${bidi(result.text)}</p>` : '';
    const fxHtml = `<div class="mg-res-fx">${rw.mood ? `<span class="${rw.mood > 0 ? 'up' : 'down'}">🍲 <bdi>${rw.mood > 0 ? '+' : ''}${rw.mood}</bdi></span>` : ''}${rw.pages ? `<span class="up">📖 <bdi>+${rw.pages}</bdi></span>` : ''}</div>`;
    mgHost.hidden = true; stage.hidden = false; dialog.hidden = false;
    const r = await ui.card(`<div class="mg-result ${result.win ? 'win' : 'lose'}"><div class="mg-res-head">${result.win ? '🎉' : '😑'} <h3>${C.title}: ${result.win ? 'הצלחה' : 'לא הפעם'}</h3></div>${details}<p class="mg-res-verdict">💭 ${bidi(verdict)}</p>${fxHtml}</div>`,
      [{ id: 'next', label: 'המשך' }, { id: 'again', label: '🔁 שוב', cls: 'btn-secondary' }], 'mg-overlay');
    if (r === 'again') { audio.playSfx('page'); continue; }
    if (rw.mood) S.addMood(rw.mood);
    if (rw.pages) { const g = S.addPages(rw.pages); ui.flashPages(g); audio.playSfx('scribble'); }
    break;
  }
  ui.setTuvia(result.win ? 'happy' : 'neutral');
  return result;
}

// ---------- Isi ----------
async function callIsi() {
  const ch = currentChapter;
  if (!ch || !ISI[ch.id] || state.isi[ch.id]) return;
  S.markIsi(ch.id);
  audio.playSfx('phone');
  ui.anim('anim-glint');
  const call = ISI[ch.id];
  await new Promise((res) => {
    const ph = document.createElement('div');
    ph.className = 'phone';
    ph.innerHTML = `<div class="phone-body"><div class="phone-top"><span class="phone-who">${npcSVG('isi', { size: 54, mood: 'neutral' })}<span>איזי · ניו יורק</span></span><span class="phone-time">📶 <bdi>${new Date().getHours() > 12 ? 'אחה"צ' : 'בוקר'}</bdi> שם</span></div><div class="phone-log"></div><div class="phone-foot"><button type="button" class="btn phone-next">המשך</button></div></div>`;
    $('#game').appendChild(ph);
    requestAnimationFrame(() => ph.classList.add('on'));
    const log = ph.querySelector('.phone-log'), btn = ph.querySelector('.phone-next');
    let i = 0;
    const next = () => {
      if (i >= call.steps.length) { ph.classList.remove('on'); setTimeout(() => ph.remove(), 300); window.removeEventListener('keydown', onKey); res(); return; }
      const st = call.steps[i++];
      const line = document.createElement('div');
      if (st.a) { line.className = 'phone-line aside'; line.innerHTML = '💭 ' + bidi(st.a); }
      else { line.className = 'phone-line ' + st.s; line.innerHTML = `<b>${st.s === 'isi' ? 'איזי' : 'טוביה'}:</b> ${bidi(st.t)}`; }
      log.appendChild(line); log.scrollTop = log.scrollHeight;
      if (i >= call.steps.length) btn.textContent = 'לנתק. באהבה.';
    };
    btn.addEventListener('click', next);
    const onKey = (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); next(); } };
    window.addEventListener('keydown', onKey);
    next();
  });
  toast('📱 רמז מאיזי נשמר. הוא יופיע בבחירת התחפושת.', 3500);
  renderHUD();
}

// ---------- notebook ----------
function openNotebook() {
  const ov = $('#notebook');
  const byCh = {};
  for (const e of state.notebook) (byCh[e.ch] = byCh[e.ch] || []).push(e);
  const names = Object.fromEntries(CHAPTER_LIST.map((c) => [c.id, `פרק ${c.n}: ${c.name}`]));
  names.taxi3 = 'במונית, בדרך לגבעה'; names.taxi4 = 'במונית, בדרך לבני ברק'; names.taxiF = 'במונית, בדרך לירושלים';
  let html = `<div class="nb-head"><h2>📓 הפנקס</h2><p>📖 <bdi>${state.pages}</bdi>/<bdi>${SLICE.pagesTarget}</bdi> עמודים · <bdi>${state.notebook.length}</bdi> ציטוטים · 🥄 <bdi>${state.ingredients.length}</bdi>/<bdi>${SLICE.ingredientsTarget}</bdi></p></div>`;
  if (!state.notebook.length) html += `<p class="nb-empty">ריק. עוד לא שאלתי אף אחד כלום. זה לא יחזיק מעמד.</p>`;
  for (const [ch, list] of Object.entries(byCh)) {
    html += `<h3 class="nb-ch">${names[ch] || ch}</h3>`;
    for (const e of list) html += `<div class="nb-entry"><div class="nb-who">${e.who} <span class="nb-pages">📖 <bdi>+${e.pages}</bdi></span></div><div class="nb-text">${bidi(e.text)}</div>${e.margin ? `<div class="nb-margin">${bidi(e.margin)}</div>` : ''}</div>`;
  }
  const goats = ['ch1', 'ch3', 'ch4'].filter((c) => state.goat[c]).length;
  html += `<h3 class="nb-ch">🐐 העז</h3><p class="nb-goat">נמצאה ב-<bdi>${goats}</bdi>/<bdi>3</bdi> פרקים. ${goats >= 3 ? '' : 'היא איפשהו בכל פרק. היא מאוכזבת שלא חיפשת.'}</p>`;
  if (goats >= 3) html += `<div class="nb-entry secret">${goatSVG({ size: 120, mood: 'smiling' })}<div class="nb-who">עמוד סודי: העז</div><div class="nb-text">העז הייתה בנתב"ג. על הגבעה. בבני ברק. היא לא אכלה כלום. היא לא אמרה כלום. היא הייתה היחידה שהקשיבה לכולם.</div><div class="nb-margin">אם הייתי עז, הייתי מאוכזב מכולם גם כן. אבל הייתי אוכל את הקינואה. מישהו צריך.</div></div>`;
  html += `<div class="nb-ing">${INGREDIENTS.map((i) => `<span class="${state.ingredients.includes(i.id) ? 'has' : i.soon ? 'soon' : ''}">${i.icon} ${i.name}${i.soon ? ' (בקרוב)' : ''}</span>`).join('')}</div>`;
  $('.nb-body', ov).innerHTML = html;
  ov.classList.add('on'); audio.playSfx('page');
}
$('#nb-close').addEventListener('click', () => $('#notebook').classList.remove('on'));

// ---------- settings ----------
function openSettings() { $('#settings').classList.add('on'); applySettings(); }
$('#set-close').addEventListener('click', () => $('#settings').classList.remove('on'));
$$('[data-speed]').forEach((b) => b.addEventListener('click', () => S.setSetting('speed', b.dataset.speed)));
$('#set-mute').addEventListener('click', () => { S.setSetting('muted', !S.meta.settings.muted); });
$('#set-contrast').addEventListener('click', () => S.setSetting('contrast', !S.meta.settings.contrast));
$('#set-wipe').addEventListener('click', () => { S.clearSave(); toast('🗑 השמירה נמחקה. הקוגל נשאר בזיכרון.'); $('#btn-resume').hidden = true; });

// ---------- endings ----------
async function playEnding(id, token) {
  pendingEnding = null;
  const E = ENDING_TEXT[id] || ENDING_TEXT.nobook;
  const def = ENDINGS.find((e) => e.id === id);
  currentChapter = null; renderHUD();
  ui.clear(); ui.setScene(E.bg, {}); ui.setNPC(E.npc, E.npc === 'goat' ? 'smiling' : 'neutral'); ui.setTuvia(id === 'healthy' ? 'sleepy' : id === 'huff' ? 'angry' : 'smirk', 'listen');
  audio.playMusic(E.music); audio.setMood(id === 'huff' ? 10 : id === 'healthy' ? 25 : 85);
  if (id === 'healthy') document.body.classList.add('horror');
  const pseudo = { id: 'ending', nodes: {} };
  for (const step of E.steps) { if (token != null && token !== runToken) return; await runStep(step, pseudo); }
  document.body.classList.remove('horror');
  S.recordEnding(id);
  const stats = `<ul class="summary"><li>📖 <bdi>${state.pages}</bdi> עמודים</li><li>🥄 <bdi>${state.ingredients.length}</bdi>/<bdi>${SLICE.ingredientsTarget}</bdi> מרכיבים</li><li>🍲 מצב רוח <bdi>${state.mood}</bdi></li><li>😊 "טעים מאוד" על אוכל רע: <bdi>${state.badPolite}</bdi></li><li>📱 איזי: <bdi>${Object.keys(state.isi).length}</bdi> · 🐐 עז: <bdi>${['ch1', 'ch3', 'ch4'].filter((c) => state.goat[c]).length}</bdi>/3</li></ul>`;
  const r = await ui.card(`<div class="ending-card"><div class="ending-big">${def.icon}</div><h3>${def.name}</h3><p class="ending-book">📕 שם הספר: <b>${def.book}</b></p>${stats}<p class="ending-seen">סופים שנראו: <bdi>${S.meta.endingsSeen.length}</bdi>/<bdi>${ENDINGS.length}</bdi></p></div>`, [{ id: 'menu', label: 'לתפריט' }, { id: 'nb', label: '📓 הפנקס', cls: 'btn-secondary' }], 'ending-overlay');
  if (r === 'nb') openNotebook();
  audio.stopMusic();
  goTitle();
}

// ---------- misc ----------
$('#intro-tap')?.addEventListener('click', () => {});
window.addEventListener('beforeunload', () => { if (screen === 'game' && state.chapter && !state.ending) S.save(); });

// ---------- test API ----------
window.__tuvia = {
  get state() { return state; },
  get screen() { return screen; },
  get chapter() { return currentChapter ? currentChapter.id : null; },
  audio, ui, S,
  goto(id, node) { if (!CHAPTERS[id]) throw new Error('no chapter ' + id); runToken++; if (!state.chapter && !state.done.length) S.newGame(); startChapter(id, node || null); },
  newGame() { S.newGame(); S.clearSave(); startChapter('ch1'); },
  title() { runToken++; goTitle(); },
  map() { runToken++; goMap(); },
  setMood: (n) => S.setMood(n),
  addPages: (n) => S.addPages(n, { raw: true }),
  giveIngredient: (id) => S.giveIngredient(id),
  setDisguise: (d) => { S.setDisguise(d); ui.setTuvia(); },
  skip: () => ui.skip(),
  choose(i = 0) { const b = $$('#dialog .choice')[i]; if (b) { b.click(); return true; } return false; },
  card(idOrIndex = 0) { const ov = $$('.card-overlay.on').pop(); if (!ov) return false; const bs = $$('.card-buttons button, .dis-opt', ov); const b = typeof idOrIndex === 'number' ? bs[idOrIndex] : bs.find((x) => x.dataset.id === idOrIndex || x.dataset.d === idOrIndex); if (b) { b.click(); return true; } return false; },
  get mg() { return mgControl; },
  winMinigame() { if (mgControl) { mgControl.finish(true); return true; } return false; },
  loseMinigame() { if (mgControl) { mgControl.finish(false); return true; } return false; },
  callIsi, findGoat,
  phoneNext() { const b = $('.phone-next'); if (b) { b.click(); return true; } return false; },
  save: () => S.save(), load: () => S.load(), reset: () => { S.clearSave(); S.meta.endingsSeen = []; S.saveMeta(); },
  decideEnding: () => S.decideEnding(),
  playEnding: (id) => { runToken++; showScreen('game'); mgHost.hidden = true; stage.hidden = false; dialog.hidden = false; return playEnding(id, null); },
  openNotebook, closeNotebook: () => $('#notebook').classList.remove('on'),
  busy() { return ui.isWaiting() || !!$('.card-overlay.on') || !!mgControl || !!$('.phone.on') || !!$$('#dialog .choice').length; },
  CHAPTERS, MG, FOODS, ENDINGS,
};

applySettings();
goTitle();
