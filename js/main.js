/* js/main.js — boot, screen flow, game loop, input, effects. The glue between
 * state.js (rules), world.js (engine), dialogue.js (runner), ui.js (DOM) and audio.js (music).
 * Exposes window.__tuvia for automated testing (see README).
 */
import { createState, SLICE } from './state.js';
import { createWorld } from './world.js';
import { createDialogue } from './dialogue.js';
import { createUI } from './ui.js';
import { createAudio } from './audio.js';
import { MAPS } from './content/maps.js';
import { NPCS, FINALE_GUEST_LINES } from './content/npcs.js';
import { FOODS, INGREDIENTS } from './content/foods.js';
import { TAXI, ISI, ENDINGS, REVEAL, UI, IDLE_LINES, HUNGER_LINES, DISGUISE_LINES, CHAPTER_CARDS, GOAT_FOUND, RUSH_LINES, DISGUISES } from './content/text.js';
import { tuviaSVG } from './art/tuvia.js';

const state = createState();
const ui = createUI();
const canvas = document.getElementById('game');
let audio = null;                       // created on the first user gesture (SPEC §10: audio needs a gesture)
let playing = false, inRush = false, rushLeft = 0, hungerT = 0, idleSaid = 0, saveT = 0, lastT = 0;
let keys = new Set(), joy = { dx: 0, dy: 0 };
const NAME2ID = Object.fromEntries(Object.entries(NPCS).map(([id, n]) => [n.name, id]));
const portraitCache = new Map();
const chapterTitles = Object.fromEntries(Object.values(MAPS).map((m) => [m.id, m.title]));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rushLinesUsed = [];

// ---------------------------------------------------------------- audio (lazy)
function ensureAudio() {
  if (audio) return audio;
  audio = createAudio({ basePath: './audio/', checkFiles: false });
  const m = state.meta(); audio.setMuted(!!m.muted); audio.setMood(state.s.mood);
  if (playing && world.map()) audio.playMusic(world.map().music);
  return audio;
}
const sfx = (n) => audio && audio.playSfx(n);
document.addEventListener('pointerdown', ensureAudio, { once: true, capture: true });
document.addEventListener('keydown', ensureAudio, { once: true, capture: true });

// ---------------------------------------------------------------- dialogue
const dialogue = createDialogue({
  box: ui.$('dlg'), nameEl: ui.$('dlg-name'), textEl: ui.$('dlg-text'), choicesEl: ui.$('dlg-choices'), portraitEl: ui.$('dlg-portrait'), hintEl: ui.$('dlg-hint'),
  textSpeed: state.meta().textSpeed, applyFx: (fx, conv) => applyFx(fx, conv),
  onLine: (line) => { if (line.kind === 'npc' || line.kind === 'isi') sfx('click'); if (line.kind === 'aside') sfx('pop'); },
  onChoice: (c) => { sfx('click'); if (c.kind === 'innocent') { bumpGlint(); } },
});
function npcPortrait(id) {
  const key = id + ':' + (world.art() ? world.art().u : 0);
  if (!portraitCache.has(key)) { const a = world.art(); const def = NPCS[id]; if (!a || !def) return ''; const c = id === 'goat' ? a.goat('left', 0) : a.npc(id, def.look, 'down', 0); portraitCache.set(key, `<img src="${c.toDataURL()}" alt="">`); }
  return portraitCache.get(key);
}
function portraitFor(conv) {
  return (line) => {
    if (line.kind === 'aside') return '💭';
    if (line.kind === 'isi') return '📱';
    if (line.kind === 'tuvia') return tuviaSVG({ crop: 'head', expression: state.moodBand().expr, disguise: state.s.disguise, size: 96, id: 'dp' });
    if (line.kind === 'stage') return '';
    const id = conv.npcId || NAME2ID[line.who];
    return id ? npcPortrait(id) : '';
  };
}
function talk(convSpec, onDone) {
  document.body.classList.add('dlg-open');
  world.setPaused(true); ui.prompt(null);
  dialogue.start(convSpec, () => { document.body.classList.remove('dlg-open'); world.setPaused(false); onDone && onDone(); refreshHUD(); autosave(); });
}
function talkNPC(id, nodeOverride, onDone) {
  const def = NPCS[id]; if (!def || dialogue.isOpen()) return;
  const talks = state.s.talks[id] || 0;
  const ctx = { disguise: state.s.disguise, flags: state.s.flags, talks, chapter: state.s.chapter, mood: state.s.mood };
  world.facePlayerAt(id);
  const entry = nodeOverride || def.entry;
  talk({ name: def.name, npcId: id, nodes: def.nodes, entry, ctx, portrait: portraitFor({ npcId: id }) }, () => { state.talked(id); world.stopNPC(id); onDone && onDone(); });
}

// ---------------------------------------------------------------- world
const world = createWorld({
  canvas,
  hooks: {
    flag: (k) => state.flag(k),
    onCatch(id, n) {
      if (dialogue.isOpen() || ui.anyModal()) return;
      if (inRush) { // instant feeding in the rush
        if (n.finaleFeeder === 'bad') { eatFood('quinoa'); ui.toast(RUSH_LINES.tzofia); } else { eatFood('kugelY'); ui.toast(RUSH_LINES.gittel); }
        return;
      }
      if (id === 'gittel' && (state.s.talks.gittel || 0) > 0 && NPCS.gittel.nodes.catch) talkNPC('gittel', 'catch');
      else talkNPC(id);
    },
    onPickup(it) {
      if (it.food) { const f = FOODS[it.food]; eatFood(it.food); if (f.kind === 'bad') ui.aside(pick(['דרכתי על זה. אז אכלתי את זה. ככה זה עובד אצלי.', 'זה היה על הרצפה. זה עדיין בריא. זה הכי גרוע.', 'אכלתי בטעות. הגוף שלי לא מבדיל בין טעות לבריאות.']), 3200); }
      else if (it.item) { state.addItem(it.item, 1); sfx(it.item === 'cola' ? 'fizz' : 'ding'); ui.toast(it.item === 'cola' ? '🥤 קולה זירו לכיס (+1)' : '🥐 רוגעלך (+1)'); }
      else if (it.ingredient) { giveIngredient(it.ingredient, it.line); }
      refreshHUD();
    },
    onLandmark(l) { if (!dialogue.isOpen() && !ui.anyModal()) { ui.aside(l.text); sfx('pop'); } },
    onGoatFound() { if (state.markGoat()) { ui.aside(GOAT_FOUND); sfx('goat'); refreshHUD(); } },
    onExit() { if (!dialogue.isOpen() && !ui.anyModal() && !inRush) offerExit(); },
    onBumpGuest(id) { const lines = FINALE_GUEST_LINES[id]; if (lines) { world.say(id, pick(lines)); sfx('click'); } },
    onPlate(p) {
      const f = FOODS[p.food];
      if (p.bad) { eatFood(p.food); ui.toast(pick(RUSH_LINES.bad)); }
      else { eatFood(p.food); const g = state.addPages(2, null); ui.toast(pick(RUSH_LINES.good) + ` 📖 +${g}`, 'pages'); }
      refreshHUD();
    },
  },
});

// ---------------------------------------------------------------- effects
function bumpGlint() { const svg = ui.$('hud-face-svg').querySelector('svg'); if (svg) { svg.classList.add('anim-glint'); setTimeout(() => svg.classList.remove('anim-glint'), 1500); } }
function eatFood(id, polite = false) {
  const r = state.eat(id, polite); if (!r) return;
  const f = r.food;
  ui.foodToast(f, r.delta, world.art() ? world.art().iconDataURL(f.icon, 80) : null);
  if (audio) { audio.setMood(state.s.mood); if (f.kind === 'bad') { audio.sting('bad'); } else { audio.sting('good'); } setTimeout(() => sfx(f.sfx), f.kind === 'bad' ? 500 : 700); }
  if (f.shake) { world.shake(0.9); sfx('gasp'); document.body.classList.add('shake'); setTimeout(() => document.body.classList.remove('shake'), 900); ui.$('hud-face-svg').innerHTML = tuviaSVG({ expression: 'shocked', crop: 'head', size: 64, disguise: state.s.disguise, id: 'hud' }); setTimeout(refreshHUD, 2500); }
  else if (f.kind !== 'bad') { const svg = ui.$('hud-face-svg').querySelector('svg'); if (svg) { svg.classList.add('anim-laugh'); setTimeout(() => svg.classList.remove('anim-laugh'), 1200); } }
  ui.bumpFace(); refreshHUD();
}
function giveIngredient(id, line) {
  if (state.hasIngredient(id)) return;
  state.giveIngredient(id);
  const ing = INGREDIENTS.find((i) => i.id === id);
  ui.toast(`🥄 מרכיב לצ'ולנט: ${ing.name}!`, 'pages'); sfx('tada');
  setTimeout(() => ui.aside(line || ing.line), 600);
  refreshHUD();
}
function applyFx(fx, conv) {
  if (!fx) return;
  if (fx.mood) { state.addMood(fx.mood, 'fx'); }
  if (fx.pages) { const [n, quote, margin] = fx.pages; const g = state.addPages(n, quote, margin, conv && conv.name); ui.toast(UI.pagesGain(g), 'pages'); sfx('scribble'); bumpGlint(); }
  if (fx.food) { let id = fx.food; if (id.startsWith('pick:')) id = pick(id.slice(5).split(',')); eatFood(id); }
  if (fx.politeFood) { let id = fx.politeFood; if (id === 'pick') id = pick(['kale', 'sprouts', 'goatYogurt', 'chia', 'herbalTea', 'spelt']); eatFood(id, true); if (id === 'quinoa') state.setFlag('quinoaPolite'); }
  if (fx.item) for (const [k, n] of Object.entries(fx.item)) { state.addItem(k, n); ui.toast(k === 'cola' ? `🥤 +${n}` : `🥐 רוגעלך +${n}`); }
  if (fx.ingredient) giveIngredient(fx.ingredient);
  if (fx.flag) state.setFlag(fx.flag, true);
  if (fx.unflag) state.setFlag(fx.unflag, false);
  if (fx.shake) { world.shake(0.9); document.body.classList.add('shake'); setTimeout(() => document.body.classList.remove('shake'), 900); }
  if (fx.sfx) sfx(fx.sfx);
  if (fx.sting && audio) audio.sting(fx.sting);
  if (fx.cue && audio) audio.cue(fx.cue);
  if (fx.chase) world.boostChase(fx.chase.npc, fx.chase.speed || 1.2);
  if (fx.goat) { if (state.markGoat()) sfx('goat'); }
  refreshHUD();
}

// ---------------------------------------------------------------- HUD
function chapterChecks() {
  const ch = state.s.chapter; const map = MAPS[ch]; if (!map || ch === 'finale') return null;
  const ing = INGREDIENTS.find((i) => i.chapter === ch);
  return {
    ingredient: { icon: '🥄', label: map.checklist ? map.checklist.ingredient : '', done: ing && state.hasIngredient(ing.id) },
    goat: { icon: '🐐', label: UI.checklist.goat, done: state.s.goatFound.includes(ch) },
    isi: { icon: '📱', label: UI.checklist.isi, done: state.s.isiCalled.includes(ch) },
  };
}
function refreshHUD() { ui.updateHUD(state, state.moodBand(), chapterChecks()); ui.pulsePhone(state.s.chapter && state.s.chapter !== 'finale' && !state.s.isiCalled.includes(state.s.chapter)); if (audio) audio.setMood(state.s.mood); }
state.onChange((what, extra) => {
  if (what === 'autoCola') { ui.toast('🥤 ' + UI.autoCola, 'pages'); sfx('fizz'); }
  if (what === 'moodZero') { setTimeout(() => endGame('huff'), 50); }
});

// ---------------------------------------------------------------- chapters
function goto(id, opts = {}) {
  if (id === 'world') return showWorld();
  const map = MAPS[id]; if (!map) return;
  playing = false; inRush = false; ui.rushTimer(null); ui.$('aside').hidden = true; ui.$('toasts').innerHTML = '';
  state.s.chapter = id; state.setMoodCap(map.moodCap || 100);
  const items = (state.s.chapterItems || {})[id] || [];
  ui.show('play'); world.resize();
  world.load(map, { pos: opts.pos, takenItems: items, goatFound: state.s.goatFound.includes(id) });
  world.setDisguise(state.s.disguise);
  if (audio) audio.playMusic(map.music);
  refreshHUD();
  const begin = () => { ui.show('play'); world.resize(); playing = true; lastT = performance.now(); hungerT = 0; idleSaid = 0; if (id === 'finale') startFinale(); else setTimeout(() => ui.aside(map.exitHint, 3800), 900); };
  if (opts.resume) return begin();
  const card = CHAPTER_CARDS[id];
  ui.chapterCard({ n: card.line, title: map.title, subtitle: map.subtitle, shot: world.snapshot(640, 400), aside: map.establishing, onGo: begin });
}
async function offerExit() {
  const map = world.map(); if (!map) return;
  const hook = map.onExit && map.onExit(state.s.flags);
  if (hook) { talkNPC(hook.npc, hook.node, () => setTimeout(offerExit, 300)); return; }
  const ch = state.s.chapter; const ing = INGREDIENTS.find((i) => i.chapter === ch);
  const missing = [];
  if (ing && !state.hasIngredient(ing.id)) missing.push(ing.name);
  if (!state.s.goatFound.includes(ch)) missing.push('העז');
  if (!state.s.isiCalled.includes(ch)) missing.push('שיחה עם איזי');
  world.setPaused(true);
  const ok = await ui.confirm(UI.leaveTitle, missing.length ? UI.leaveMissing(missing.join(', ')) : UI.leaveOk, UI.leave, UI.stay);
  world.setPaused(false);
  if (ok) leaveChapter(); else { const t = world.tuvia(); world.teleport(Math.floor(t.x), Math.floor(t.y - 0.5) - 1); }
}
function leaveChapter() {
  playing = false;
  state.completeChapter(); state.setMoodCap(100);
  state.s.chapter = null; state.s.pos = null; state.s.taxiRides = (state.s.taxiRides || 0) + 1;
  const ride = TAXI[Math.min(TAXI.length - 1, state.s.taxiRides - 1)];
  ui.taxi([200, 612, 1948][Math.min(2, state.s.taxiRides - 1)]);
  if (audio) { audio.playMusic('airport'); audio.cue('honk'); }
  state.save();
  talk({ name: 'משה', npcId: 'moshe', nodes: Object.assign({ start: { lines: ride.lines, choices: ride.choices } }, ride.nodes || {}), entry: 'start', ctx: { flags: state.s.flags }, portrait: portraitFor({ npcId: 'moshe' }) }, () => showWorld());
}
function showWorld() {
  playing = false; state.s.chapter = null; state.save();
  if (audio) audio.playMusic('airport');
  ui.worldMap({ visited: state.s.visited, finaleReady: state.finaleUnlocked(), onPick: (w) => {
    if (w.locked) { ui.worldLine(w.locked); sfx('nu'); return; }
    if (w.finale) { if (!state.finaleUnlocked()) { ui.worldLine(w.lockedLine); sfx('nu'); return; } goto('finale'); return; }
    if (state.chapterDone(w.id)) { ui.worldLine(UI.worldDone); sfx('nu'); return; }
    goto(w.id);
  } });
  ui.$('world-notebook').onclick = () => ui.notebook(state, chapterTitles);
}

// ---------------------------------------------------------------- finale: the Shabbat rush → reveal → ending
function startFinale() {
  talk({ name: 'טוביה', nodes: { start: { lines: [`~ ${UI.rushText}`] } }, entry: 'start', ctx: { flags: state.s.flags }, portrait: portraitFor({}) }, () => {
    inRush = true; rushLeft = MAPS.finale.rush.seconds; world.startRush(MAPS.finale.rush); ui.rushTimer(UI.rushTime(rushLeft)); sfx('drumroll');
  });
}
function endRush() {
  inRush = false; world.stopRush(); ui.rushTimer(null); world.setFrozen(true);
  const full = state.s.ingredients.length >= SLICE.ingredients;
  const lines = full ? REVEAL.full : REVEAL.partial;
  if (audio && full) audio.setMood(100);
  talk({ name: 'טוביה', nodes: { start: { lines } }, entry: 'start', ctx: { flags: state.s.flags }, portrait: portraitFor({}) }, () => endGame());
}
function endGame(forced) {
  const id = forced || state.evaluateEnding();
  const e = state.ending(id); if (!e) return;
  playing = false; inRush = false; ui.rushTimer(null); dialogue.abort(); ui.closeModals();
  state.recordEnding(id); state.clearSave();
  if (audio) {
    if (id === 'healthy') { audio.stopMusic(); sfx('gasp'); setTimeout(() => sfx('thud'), 600); }
    else if (id === 'huff') { audio.playMusic('airport'); audio.setMood(5); }
    else if (id === 'bestseller' || id === 'secret') { audio.playMusic(id === 'secret' ? 'bneibrak' : 'finale'); audio.setMood(95); sfx('cheer'); }
    else { audio.playMusic('airport'); audio.setMood(40); }
  }
  ui.endingScreen(e, { onTitle: () => boot(), onAgain: () => { state.reset(); goto('airport'); } });
  setTimeout(() => talk({ name: 'טוביה', nodes: { start: { lines: e.lines } }, entry: 'start', ctx: { flags: {} }, portrait: portraitFor({}) }, () => ui.endingButtons()), 400);
}

// ---------------------------------------------------------------- player actions
function action() {
  if (dialogue.isOpen()) { dialogue.advance(); return; }
  if (ui.anyModal() || !playing) return;
  const n = world.nearNPC();
  if (n) { talkNPC(n.id); return; }
  if (world.nearGoat()) { talkNPC('goat'); return; }
}
function setDisguise(d) {
  if (d === state.s.disguise) return;
  state.setDisguise(d); world.setDisguise(d); sfx('whoosh');
  ui.aside(pick(DISGUISE_LINES[d])); refreshHUD();
}
function cycleDisguise() { const i = DISGUISES.findIndex((d) => d.id === state.s.disguise); setDisguise(DISGUISES[(i + 1) % DISGUISES.length].id); }
function callIsi() {
  if (!playing || dialogue.isOpen()) return;
  const ch = state.s.chapter; const call = ISI[ch]; if (!call) return;
  if (state.s.isiCalled.includes(ch)) { ui.aside(pick(['כבר דיברנו. היא אמרה לאכול ירק. אני אוכל רוגעלך.', 'איזי לא עונה. היא בפגישה. עם הסלט שלה.', 'פעם אחת בפרק. זה החוק. גם של איזי.'])); return; }
  sfx('phone'); world.setPaused(true);
  ui.phone(call.lines, () => { state.markIsi(ch); world.setPaused(false); refreshHUD(); autosave(); const ring = ui.$('hud-face-svg').querySelector('svg'); if (ring) { ring.classList.add('anim-glint'); setTimeout(() => ring.classList.remove('anim-glint'), 1500); } });
}
function openSettings() {
  ui.settings(state.meta(), (patch) => {
    const m = state.setMeta(patch);
    if ('muted' in patch && audio) audio.setMuted(m.muted);
    if ('contrast' in patch) document.body.classList.toggle('contrast', !!m.contrast);
    if ('textSpeed' in patch) dialogue.setSpeed(m.textSpeed);
  }, () => { state.clearSave(); ui.$('btn-resume').hidden = true; });
}
function autosave() {
  if (!state.s.chapter || state.s.chapter === 'finale') return;
  const t = world.tuvia(); if (!t) return;
  const items = Object.assign({}, state.s.chapterItems || {}); items[state.s.chapter] = world.takenItems();
  state.save({ pos: [Math.floor(t.x), Math.floor(t.y - 0.5)], chapterItems: items });
}

// ---------------------------------------------------------------- loop
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - lastT) / 1000 || 0); lastT = now;
  if (!playing || ui.current !== 'play') return;
  const busy = dialogue.isOpen() || ui.anyModal();
  let dx = joy.dx, dy = joy.dy;
  if (!busy) {
    if (keys.has('ArrowLeft') || keys.has('a') || keys.has('A')) dx -= 1;
    if (keys.has('ArrowRight') || keys.has('d') || keys.has('D')) dx += 1;
    if (keys.has('ArrowUp') || keys.has('w') || keys.has('W')) dy -= 1;
    if (keys.has('ArrowDown') || keys.has('s') || keys.has('S')) dy += 1;
  } else { dx = 0; dy = 0; }
  world.setInput(dx, dy);
  world.update(dt);
  world.render();
  if (!busy) {
    // hunger: −1 per 20 s while walking around (SPEC §3.1)
    hungerT += dt;
    if (hungerT >= 20) { hungerT = 0; state.addMood(-1, 'hunger'); ui.toast('🍽 ' + UI.hungry + ' −1'); if (Math.random() < 0.35 && ui.$('aside').hidden) ui.aside(pick(HUNGER_LINES), 3500); refreshHUD(); }
    const idle = world.idleTime();
    if (idle > 9 && idle - idleSaid > 14 && !inRush) { idleSaid = idle; ui.aside(pick(IDLE_LINES), 3800); }
    if (idle < 1) idleSaid = 0;
    if (inRush) { rushLeft -= dt; ui.rushTimer(UI.rushTime(Math.ceil(rushLeft))); if (rushLeft <= 0) endRush(); }
    saveT += dt; if (saveT > 10) { saveT = 0; autosave(); }
    const n = world.nearNPC();
    if (document.body.classList.contains('touch')) ui.prompt(n ? `💬 ${NPCS[n.id].name}` : world.nearGoat() ? '💬 העז' : null);
    else ui.prompt(n ? `<kbd>E</kbd> ${UI.talk} עם ${NPCS[n.id].name}` : world.nearGoat() ? `<kbd>E</kbd> ${UI.talk} עם העז` : null);
  } else ui.prompt(null);
}
requestAnimationFrame(loop);

// ---------------------------------------------------------------- input
window.addEventListener('keydown', (e) => {
  if (e.repeat && !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'a', 's', 'd', 'w', 'A', 'S', 'D', 'W'].includes(e.key)) return;
  keys.add(e.key);
  const k = e.key.toLowerCase();
  if (e.key === 'Escape') { if (ui.anyModal()) ui.closeModals(); else if (playing && !dialogue.isOpen()) openSettings(); return; }
  if (ui.anyModal()) { if (k === 'n' && !ui.$('modal-notebook').hidden) ui.closeModals(); return; }
  if (e.key === 'e' || e.key === 'E' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); action(); }
  else if (/^[1-4]$/.test(e.key) && dialogue.hasChoices()) dialogue.choose(+e.key - 1);
  else if (k === 'q' && playing && !dialogue.isOpen()) cycleDisguise();
  else if (k === 'n' && playing && !dialogue.isOpen()) ui.notebook(state, chapterTitles);
  else if (k === 'p' && playing) callIsi();
  else if (k === 'm') { const m = state.setMeta({ muted: !state.meta().muted }); ensureAudio().setMuted(m.muted); ui.toast(m.muted ? '🔇 שקט' : '🔊 מוזיקה'); }
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) e.preventDefault();
});
window.addEventListener('keyup', (e) => keys.delete(e.key));
window.addEventListener('blur', () => keys.clear());
ui.$('dlg').addEventListener('click', (e) => { if (!e.target.closest('.choice')) dialogue.advance(); });
canvas.addEventListener('pointerdown', () => { if (dialogue.isOpen()) dialogue.advance(); });
ui.$('btn-action').addEventListener('click', action);
ui.joystick((dx, dy) => { joy.dx = dx; joy.dy = dy; });
ui.$('btn-disguise').onclick = () => { if (playing && !dialogue.isOpen()) ui.disguisePicker(state.s.disguise, setDisguise); };
ui.$('btn-notebook').onclick = () => { if (!dialogue.isOpen()) ui.notebook(state, chapterTitles); };
ui.$('btn-phone').onclick = callIsi;
ui.$('btn-gear').onclick = openSettings;
ui.$('btn-cola').onclick = () => { if (state.s.inventory.cola) { const r = state.useItem('cola'); if (r) { ui.foodToast(r.food, r.delta, world.art() && world.art().iconDataURL('can', 80)); sfx('fizz'); refreshHUD(); } } else ui.aside(UI.colaEmpty); };
ui.$('btn-rug').onclick = () => { const r = state.useItem('rugelach'); if (r) { ui.foodToast(r.food, r.delta, world.art() && world.art().iconDataURL('rugelach', 80)); sfx('crunch'); refreshHUD(); } };
window.addEventListener('resize', () => { if (ui.current === 'play') world.resize(); });
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) document.body.classList.add('touch');

// ---------------------------------------------------------------- boot
function boot() {
  playing = false; inRush = false; dialogue.abort(); ui.closeModals(); ui.rushTimer(null);
  const meta = state.meta();
  document.body.classList.toggle('contrast', !!meta.contrast); dialogue.setSpeed(meta.textSpeed);
  if (audio) audio.stopMusic();
  ui.buildTitle({
    hasSave: state.hasSave(), endingsSeen: meta.endingsSeen,
    onStart: async () => { ensureAudio(); if (state.hasSave() && !(await ui.confirm(UI.start, UI.newGameConfirm, UI.start, UI.stay))) return; state.reset(); goto('airport'); },
    onResume: () => { ensureAudio(); if (!state.load()) return; const ch = state.s.chapter; if (ch && MAPS[ch] && ch !== 'finale') goto(ch, { resume: true, pos: state.s.pos || undefined }); else showWorld(); },
    onEndings: () => ui.endingsGallery(meta.endingsSeen),
    onSettings: openSettings,
  });
  ui.onGoatPoke = () => sfx('goat');
  ui.show('title');
}
boot();

// ---------------------------------------------------------------- test API (README)
window.__tuvia = {
  state, world, dialogue, ui, get audio() { return audio; }, MAPS, NPCS, FOODS,
  goto: (id, opts) => goto(id, opts),
  setMood: (n) => { state.s.mood = Math.max(0, Math.min(state.s.moodCap, n)); refreshHUD(); },
  addPages: (n) => { state.addPages(n); refreshHUD(); },
  giveIngredient: (id) => { giveIngredient(id); },
  talk: (id, node) => talkNPC(id, node),
  advance: () => dialogue.advance(), choose: (i) => dialogue.choose(i),
  skip: () => { while (dialogue.isOpen() && !dialogue.hasChoices()) dialogue.advance(); },
  teleport: (x, y) => world.teleport(x, y),
  leave: () => leaveChapter(), toWorld: () => showWorld(),
  markIsi: (ch) => state.markIsi(ch || state.s.chapter), markGoat: (ch) => state.markGoat(ch || state.s.chapter),
  endRush: () => { if (inRush) { rushLeft = 0; } },
  endGame: (id) => endGame(id),
  disguise: setDisguise, callIsi, autosave, boot,
  get playing() { return playing; }, get inRush() { return inRush; },
};
