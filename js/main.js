/* js/main.js — boot + screen manager for the `catcher` prototype of "טוביה אוכל את הארץ". */
import { tuviaSVG, goatSVG, TUVIA_CSS } from './art/tuvia.js';
import { npcSVG, taxiSVG } from './art/npcs.js';
import { createAudio } from './audio.js';
import { CHAPTERS, CHAPTER_FLOW, CHAPTER_LIST, CAST, DISGUISES, DISGUISE_ORDER } from './content/chapters.js';
import { INGREDIENTS, INGREDIENT_ORDER } from './content/foods.js';
import { ENDINGS, ENDING_ORDER } from './content/endings.js';
import { LOCKED_LINES } from './content/asides.js';
import * as S from './state.js';
import { createLevel } from './game/level.js';
import { runComic, isiCall } from './game/comic.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const frac = (a, b) => `<bdi dir="ltr">${a}/${b}</bdi>`;
const plus = (n) => `<bdi dir="ltr">+${n}</bdi>`;
const audio = createAudio({ basePath: './audio/', checkFiles: false }); // set checkFiles: true to let audio/<name>.mp3 recordings replace the procedural sounds (SPEC §8.4)
audio.setMuted(!!S.settings.muted); audio.setVolume(S.settings.volume == null ? .8 : S.settings.volume);

const styleEl = document.createElement('style'); styleEl.textContent = TUVIA_CSS; document.head.appendChild(styleEl);
document.body.classList.toggle('hc', !!S.settings.highContrast);

let level = null, comic = null, currentChapter = null, screenName = 'title', levelResults = null, isiAvailable = false, cardTimer = 0;
/** Stop whatever is running (level loop, comic strip, title-card timer) before switching scenes. */
function teardown() {
  clearTimeout(cardTimer); cardTimer = 0;
  if (level) { level.stop(); level = null; }
  if (comic) { comic.destroy(); comic = null; }
  const pm = $('#pause-menu'); if (pm) pm.classList.remove('show');
  const tc = $('#title-card'); if (tc) tc.onclick = null;
}

// ---------- screens ----------
function show(name) {
  screenName = name;
  $$('.screen').forEach((s) => s.classList.toggle('active', s.dataset.screen === name));
  window.scrollTo(0, 0);
}

// ---------- title ----------
function renderTitle() {
  $('#title-art').innerHTML = tuviaSVG({ pose: 'plate', expression: 'delighted', crop: 'full', size: 260, table: false, id: 'title' });
  $('#btn-continue').hidden = !S.hasSave();
  renderEndingsGallery();
  $('#title-goat').innerHTML = goatSVG({ size: 80, mood: S.settings.goatsEver >= 3 ? 'smiling' : 'disappointed' });
}
function renderEndingsGallery() {
  const g = $('#endings-gallery'); g.innerHTML = '';
  for (const id of ENDING_ORDER) {
    const e = ENDINGS[id], seen = S.settings.endingsSeen.includes(id);
    const d = document.createElement('div'); d.className = `ending-card ${seen ? 'seen' : 'locked'}`;
    d.innerHTML = seen ? `<span class="ic">${e.icon}</span><b>${e.title}</b><small>${e.bookTitle}</small>` : `<span class="ic">😶</span><b>?</b><small>${e.hint}</small>`;
    g.appendChild(d);
  }
}

// ---------- chapter select ----------
function renderChapters() {
  const list = $('#chapter-list'); list.innerHTML = '';
  for (const c of CHAPTER_LIST) {
    const b = document.createElement('button');
    const done = S.state.done.includes(c.id);
    b.className = `chapter-btn ${c.locked ? 'locked' : ''} ${done ? 'done' : ''} ${S.state.next === c.id ? 'next' : ''}`;
    b.innerHTML = `<span class="num"><bdi>${c.num}</bdi></span><span class="ttl">${c.title}</span><span class="st">${c.locked ? 'בקרוב' : done ? '✓ הושלם' : S.state.next === c.id ? '▶ הבא' : ''}</span>`;
    b.addEventListener('click', () => {
      if (c.locked) { $('#chapter-line').textContent = '💭 ' + LOCKED_LINES[c.id]; return; }
      startChapter(c.id);
    });
    list.appendChild(b);
  }
  $('#chapter-line').textContent = '💭 ארבעה פרקים פתוחים. ארבעה "בקרוב". כמו הסכסוך: חצי עבודה.';
}

// ---------- HUD ----------
function renderHUD() {
  const m = S.state.mood, band = S.moodBand(m);
  const face = $('#hud-face');
  const key = `${band.expr}:${S.state.disguise}`;
  if (face.dataset.key !== key) { face.dataset.key = key; face.innerHTML = tuviaSVG({ expression: band.expr, disguise: S.state.disguise, crop: 'head', size: 54, id: 'hudface' }); }
  const bar = $('#hud-mood-bar'); bar.style.width = Math.min(100, m / S.state.moodCap * 100) + '%';
  bar.className = m > 100 ? 'over' : m >= 80 ? 'b5' : m >= 60 ? 'b4' : m >= 40 ? 'b3' : m >= 20 ? 'b2' : 'b1';
  $('#hud-mood-num').textContent = m; $('#hud-mood-label').textContent = band.label;
  $('#hud-pages').textContent = S.state.pages;
  const ing = $('#hud-ing'); ing.innerHTML = INGREDIENT_ORDER.map((id) => { const I = INGREDIENTS[id]; const got = S.state.ingredients.includes(id); return `<span class="slot ${got ? 'got' : ''} ${I.soon ? 'soon' : ''}" title="${I.name}${I.soon ? ' (בקרוב)' : ''}">${got ? '🥄' : I.soon ? '·' : '○'}</span>`; }).join('');
  $('#hud-cans').textContent = S.state.inventory.coke; $('#hud-rug').textContent = S.state.inventory.rugelach;
  $('#btn-can').disabled = S.state.inventory.coke <= 0; $('#btn-rug').disabled = S.state.inventory.rugelach <= 0;
  $('#hud-dis').textContent = DISGUISES[S.state.disguise].short;
}
S.onChange((what) => { if (what === 'mood') audio.setMood(Math.min(100, S.state.mood)); renderHUD(); });

// ---------- chapter flow ----------
function startChapter(id) {
  const ch = CHAPTERS[id]; if (!ch) return;
  teardown();
  currentChapter = ch; levelResults = null;
  S.state.disguise = 'none';
  S.setMoodCap(id === 'ch4' ? 120 : 100);
  if (id !== 'ch4' && S.state.mood > 100) S.setMood(100);
  audio.playMusic(ch.music);
  // title card + establishing shot
  const card = $('#title-card');
  card.className = `screen title-card scene-${ch.scene} active`;
  card.dataset.screen = 'titlecard';
  $('#tc-num').innerHTML = `פרק <bdi>${ch.num}</bdi>`;
  $('#tc-title').textContent = ch.title; $('#tc-sub').textContent = ch.subtitle; $('#tc-caption').textContent = ch.card;
  $('#tc-art').innerHTML = establishingSVG(ch.scene);
  show('titlecard');
  const go = () => { card.onclick = null; clearTimeout(cardTimer); cardTimer = 0; runIntro(ch); };
  card.onclick = go; cardTimer = setTimeout(go, 5200);
  if (id === 'ch1') audio.cue('tease');
}
function establishingSVG(scene) {
  const npcs = { airport: ['shira', 'dutyfree'], hill: ['elyashiv', 'tzofia', 'neria'], bneibrak: ['gittel', 'shmerel', 'yanky'], shabbat: ['gittel', 'tzofia', 'shira', 'elyashiv'] }[scene] || [];
  return npcs.map((n) => `<div class="est-npc">${npcSVG(n, { size: 110, mouth: 'smile' })}</div>`).join('') + `<div class="est-tuvia">${tuviaSVG({ pose: 'stand', expression: 'suspicious', crop: 'full', size: 150, table: false, id: 'est' })}</div>`;
}
function runIntro(ch) {
  show('comic');
  $('#comic-title').innerHTML = `פרק <bdi>${ch.num}</bdi> · ${ch.title}`;
  isiAvailable = !S.state.isiCalled.includes(ch.id);
  const isiBtn = document.createElement('button'); isiBtn.className = 'btn isi'; isiBtn.id = 'btn-isi'; isiBtn.innerHTML = '📱 להתקשר לאיזי';
  isiBtn.hidden = !isiAvailable;
  isiBtn.addEventListener('click', () => callIsi(ch, isiBtn));
  comic = runComic($('#comic-box'), ch.intro, { speed: S.settings.textSpeed, extraButtons: [isiBtn], doneLabel: 'לצלחת! ›', onDone: () => runLevel(ch) });
}
async function callIsi(ch, btn) {
  if (!ch.isi || S.state.isiCalled.includes(ch.id)) return;
  if (btn) btn.hidden = true;
  audio.playSfx('phone');
  S.markIsi(ch.id);
  await isiCall(document.body, ch.isi);
}
function runLevel(ch) {
  if (comic) { comic.destroy(); comic = null; }
  if (level) { level.stop(); level = null; }
  show('level');
  renderHUD();
  const stage = $('#stage');
  $('#btn-complain').hidden = true;
  level = createLevel({ stage, chapter: ch, audio, hooks: {
    onEnd: (res) => { levelResults = res; setTimeout(() => runOutro(ch, res), 600); },
    onHuff: () => endGame('huff'),
    onPolite: ({ active }) => { $('#btn-complain').hidden = !active; },
    onTick: ({ elapsed, duration }) => { $('#hud-time').style.width = (100 - elapsed / duration * 100) + '%'; },
  } });
  level.start();
  audio.playMusic(ch.music);
}
function runOutro(ch, res) {
  if (level) { level.stop(); }
  show('comic');
  $('#comic-title').innerHTML = `פרק <bdi>${ch.num}</bdi> · ${ch.title} · סיכום`;
  const got = ch.id === 'finale' ? !!res.cholent : S.state.ingredients.includes(ch.ingredient);
  const panels = [...(got ? ch.outro.got : ch.outro.missed)];
  panels.push({ card: `סיכום הפרק: נתפסו <bdi>${res.caught}</bdi>, נפלו <bdi>${res.missed}</bdi>, קומבו הכי גבוה <bdi>${res.bestCombo}</bdi>, עמודים לספר ${plus(res.pages)}${res.ingredient ? ', 🥄 מרכיב!' : ''}${res.goat ? ', 🐐 העז נמצאה' : ', 🐐 העז לא נמצאה'}${res.complained ? ', 🗯 התלוננת' : ''}. סה"כ: ${frac(S.state.pages, S.BOOK_TARGET)} עמודים, מצב רוח <bdi>${S.state.mood}</bdi>.` });
  const i = CHAPTER_FLOW.indexOf(ch.id);
  const nextId = CHAPTER_FLOW[i + 1] || null;
  comic = runComic($('#comic-box'), panels, { speed: S.settings.textSpeed, doneLabel: nextId ? 'למונית ›' : 'לסוף ›', onDone: () => {
    S.finishChapter(ch.id, nextId);
    if (ch.id === 'finale') return endGame(S.decideEnding(false));
    runTaxi(ch, nextId);
  } });
}
function runTaxi(ch, nextId) {
  if (comic) { comic.destroy(); comic = null; }
  const tx = ch.taxi; if (!tx) return startChapter(nextId);
  show('taxi');
  audio.playMusic('airport'); audio.cue('honk');
  $('#taxi-art').innerHTML = taxiSVG({ size: 360 });
  $('#taxi-moshe').innerHTML = npcSVG('moshe', { size: 120, mouth: 'open' });
  $('#taxi-marquee').innerHTML = `<span>${tx.lines.map((l) => `<b>משה:</b> ${l}`).join(' &nbsp;·&nbsp; ')} &nbsp;·&nbsp; </span>`;
  $('#taxi-aside').textContent = '💭 ' + tx.aside;
  const meterEl = $('#taxi-meter'); let m = Math.max(0, tx.meter - 140); meterEl.textContent = m;
  clearInterval(runTaxi._iv); runTaxi._iv = setInterval(() => { if (m < tx.meter) { m += 7; meterEl.textContent = Math.min(m, tx.meter); } }, 120);
  const nextCh = CHAPTERS[nextId];
  $('#btn-taxi').textContent = nextCh ? `הגענו: ${nextCh.title} ›` : 'הגענו ›';
  $('#btn-taxi').onclick = () => { clearInterval(runTaxi._iv); startChapter(nextId); };
}

// ---------- endings ----------
function endGame(id) {
  teardown();
  const e = S.recordEnding(id);
  renderEndingsGallery();
  show('ending');
  const scr = $('#ending-screen'); scr.className = `screen active ending-${id} ${e.horror ? 'horror' : ''}`;
  $('#ending-title').textContent = e.icon + ' ' + e.title;
  $('#ending-book').innerHTML = `<div class="book"><div class="book-title">${e.bookTitle}</div><div class="book-author">טוביה טננבום</div><div class="book-tuvia">${tuviaSVG({ pose: 'listen', expression: e.mood, crop: 'bust', size: 120, table: false, id: 'book' })}</div></div>`;
  $('#ending-stats').innerHTML = `📖 ${frac(S.state.pages, S.BOOK_TARGET)} עמודים · 🥄 ${frac(S.sliceIngredientCount(), 3)} מרכיבים · 🍲 מצב רוח <bdi>${S.state.mood}</bdi> · 📱 איזי ${frac(S.state.isiCalled.length, 4)} · 🐐 עזים ${frac(S.state.goatsFound.length, 4)} · 😇 נימוס <bdi>${S.state.politeBad}</bdi>`;
  if (e.horror) { audio.stopMusic(); audio.playSfx('drumroll'); setTimeout(() => audio.playSfx('gasp'), 900); }
  else if (id === 'bestseller' || id === 'secret') { audio.playMusic('bneibrak'); audio.playSfx('choir'); }
  else if (id === 'huff') { audio.playMusic('airport'); audio.sting('bad'); }
  else { audio.playMusic('airport'); }
  const goatMood = id === 'healthy' ? 'smiling' : 'disappointed';
  $('#ending-goat').innerHTML = goatSVG({ size: 90, mood: goatMood });
  comic = runComic($('#ending-box'), e.panels, { speed: S.settings.textSpeed, doneLabel: 'סוף', onDone: () => { $('#ending-actions').classList.add('show'); } });
}

// ---------- notebook ----------
function renderNotebook() {
  const box = $('#notebook-pages'); box.innerHTML = '';
  const nb = S.state.notebook;
  $('#nb-count').innerHTML = `<bdi>${S.state.pages}</bdi> עמודים · <bdi>${nb.length}</bdi> ציטוטים`;
  if (!nb.length) box.innerHTML = `<div class="nb-empty">💭 הפנקס ריק. כמו הצלחת. שניהם מצב זמני.</div>`;
  const byCh = {};
  for (const q of nb) (byCh[q.chapter] = byCh[q.chapter] || []).push(q);
  for (const chId of Object.keys(byCh)) {
    const ch = CHAPTERS[chId];
    const sec = document.createElement('section'); sec.className = 'nb-ch';
    sec.innerHTML = `<h3>פרק <bdi>${ch ? ch.num : ''}</bdi> · ${ch ? ch.title : chId}</h3>`;
    for (const q of byCh[chId]) {
      const name = (CAST[q.who] && CAST[q.who].name) || q.who;
      const d = document.createElement('div'); d.className = `nb-entry ${q.kind}`;
      d.innerHTML = `${q.q ? `<div class="nb-q">${q.kind === 'disguise' ? '🎭' : '😇'} <b>טוביה:</b> ${q.q}</div>` : ''}<div class="nb-text"><b>${name}:</b> ${q.text}</div><div class="nb-margin">${q.margin || ''}</div><div class="nb-pages">📖 ${plus(q.got != null ? q.got : q.pages)}</div>`;
      sec.appendChild(d);
    }
    box.appendChild(sec);
  }
  if (S.settings.secretPage || S.state.goatsFound.length >= 3) {
    const sec = document.createElement('section'); sec.className = 'nb-ch secret';
    sec.innerHTML = `<h3>🐐 העמוד הסודי: העז</h3><div class="nb-entry special"><div class="nb-text">${goatSVG({ size: 90, mood: 'smiling' })}<br>העז הייתה בכל מקום. בשדה התעופה. על הגבעה. בבני ברק. בשולחן שבת. היא לא אמרה כלום. היא לא הייתה צריכה.</div><div class="nb-margin">כולם דיברו. רק העז ידעה מתי לשתוק. אולי בגלל זה היא מאוכזבת: היא היחידה שמקשיבה.</div></div>`;
    box.appendChild(sec);
  }
}

// ---------- settings ----------
function bindSettings() {
  const sp = $('#set-speed'); sp.value = S.settings.textSpeed; sp.addEventListener('input', () => { S.settings.textSpeed = +sp.value; S.saveSettings(); });
  const mu = $('#set-mute'); mu.checked = !!S.settings.muted; mu.addEventListener('change', () => { S.settings.muted = mu.checked; audio.setMuted(mu.checked); S.saveSettings(); $('#btn-mute').textContent = mu.checked ? '🔇' : '🔊'; });
  const vol = $('#set-vol'); vol.value = S.settings.volume == null ? .8 : S.settings.volume; vol.addEventListener('input', () => { S.settings.volume = +vol.value; audio.setVolume(+vol.value); S.saveSettings(); });
  const hc = $('#set-hc'); hc.checked = !!S.settings.highContrast; hc.addEventListener('change', () => { S.settings.highContrast = hc.checked; document.body.classList.toggle('hc', hc.checked); S.saveSettings(); });
  $('#btn-mute').textContent = S.settings.muted ? '🔇' : '🔊';
  $('#btn-mute').addEventListener('click', () => { mu.checked = !mu.checked; mu.dispatchEvent(new Event('change')); });
  $('#btn-wipe').addEventListener('click', () => { S.clearSave(); S.settings.endingsSeen = []; S.settings.secretPage = false; S.settings.goatsEver = 0; S.saveSettings(); S.resetState(); renderTitle(); $('#wipe-msg').textContent = 'נמחק. כמו שלא היה. כמו הצלחת אחרי קוגל.'; });
}

// ---------- buttons ----------
function bind() {
  $('#btn-start').addEventListener('click', () => { S.resetState(); startChapter('ch1'); });
  $('#btn-continue').addEventListener('click', () => { if (S.load()) { renderHUD(); startChapter(S.state.next || 'ch1'); } });
  $('#btn-chapters').addEventListener('click', () => { renderChapters(); show('chapters'); });
  $('#btn-notebook').addEventListener('click', () => { renderNotebook(); show('notebook'); });
  $('#btn-settings').addEventListener('click', () => show('settings'));
  $$('.btn-back').forEach((b) => b.addEventListener('click', () => { renderTitle(); show('title'); }));
  $('#btn-pause').addEventListener('click', () => togglePause(true));
  $('#btn-resume').addEventListener('click', () => togglePause(false));
  $('#btn-restart').addEventListener('click', () => { teardown(); S.setMood(Math.max(S.state.mood, 30)); runLevel(currentChapter); });
  $('#btn-quit').addEventListener('click', () => { teardown(); audio.stopMusic(); renderTitle(); show('title'); });
  $('#btn-pause-notebook').addEventListener('click', () => { renderNotebook(); $('#nb-back-level').hidden = false; show('notebook'); });
  $('#nb-back-level').addEventListener('click', () => { $('#nb-back-level').hidden = true; show('level'); });
  $('#btn-pause-isi').addEventListener('click', async () => { if (currentChapter && !S.state.isiCalled.includes(currentChapter.id)) { await callIsi(currentChapter, null); } $('#btn-pause-isi').hidden = true; });
  $('#btn-disguise').addEventListener('click', () => level && level.cycleDisguise());
  $('#btn-complain').addEventListener('click', () => level && level.complain());
  $('#btn-can').addEventListener('click', () => { if (S.useCan()) audio.playSfx('fizz'); });
  $('#btn-rug').addEventListener('click', () => { if (S.useRugelach()) audio.playSfx('crunch'); });
  $('#btn-ending-title').addEventListener('click', () => { S.resetState(); audio.stopMusic(); renderTitle(); show('title'); });
  $('#btn-ending-notebook').addEventListener('click', () => { renderNotebook(); show('notebook'); });
  window.addEventListener('keydown', (e) => { if ((e.key === 'Escape' || e.key === 'p' || e.key === 'P' || e.key === 'פ') && screenName === 'level' && level) togglePause(!level.isPaused()); });
  // touch halves (hold on the left/right third of the stage to move)
  const stage = $('#stage');
  stage.addEventListener('contextmenu', (e) => e.preventDefault());
}
function togglePause(on) {
  if (!level) return;
  if (on) { level.pause(); $('#pause-menu').classList.add('show'); $('#btn-pause-isi').hidden = !currentChapter || S.state.isiCalled.includes(currentChapter.id); }
  else { level.resume(); $('#pause-menu').classList.remove('show'); }
}

// ---------- boot ----------
async function boot() {
  try { await document.fonts.ready; } catch (e) { /* */ }
  bindSettings(); bind(); renderTitle(); renderHUD(); show('title');
  // the first user gesture wakes the audio context
  const wake = () => { try { audio.playSfx('click'); } catch (e) { /* */ } document.removeEventListener('pointerdown', wake); };
  document.addEventListener('pointerdown', wake);
}
boot();

// ---------- test / debug API ----------
window.__tuvia = {
  state: S.state, settings: S.settings, audio, S,
  screen: () => screenName,
  goto: (id) => startChapter(id),
  setMood: (n) => S.setMood(n),
  addPages: (n) => S.addPages(n),
  giveIngredient: (id) => S.giveIngredient(id),
  callIsi: () => currentChapter && callIsi(currentChapter, $('#btn-isi')),
  skip: () => { if (screenName === 'titlecard') { $('#title-card').onclick && $('#title-card').onclick(); } else if (comic) comic.skip(); else if (level && level.isRunning()) level.skip(); },
  seek: (sec) => level && level.seek(sec),
  level: () => level,
  complain: () => level && level.complain(),
  setDisguise: (d) => level && level.setDisguise(d),
  findGoat: () => level && level.findGoat(),
  auto: (v) => level && level.setAuto(v),
  ending: (id) => endGame(id),
  decideEnding: () => S.decideEnding(false),
  save: () => S.save(), load: () => S.load(), reset: () => S.resetState(),
  title: () => { teardown(); renderTitle(); show('title'); },
};
