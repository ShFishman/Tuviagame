/* js/state.js — meters, inventory, notebook, save/load, endings (SPEC §3, §7; slice scaling in README).
 * Pure data + rules. No DOM. main.js subscribes to `on('change')` to redraw the HUD.
 */

export const SAVE_KEY = 'tuvia-mix-save-v1';
export const META_KEY = 'tuvia-mix-meta-v1';

export const SLICE = {
  pagesTarget: 100,          // 1/3 of SPEC's 300: three chapters out of eight
  ingredientsTarget: 3,      // pot, beans, kishke
  healthyThreshold: 5,       // bad foods eaten "politely" → 🥗 ending (SPEC: 8 of 8 chapters)
  chapters: ['ch1', 'ch3', 'ch4', 'finale'],
};

export const INGREDIENTS = [
  { id: 'pot',      ch: 'ch1', name: 'הסיר',          icon: '🍲', from: 'שירה, הקצינה הביטחונית', line: 'הוא חשב שזה פצצה. הוא צדק. זה פצצת קלוריות.' },
  { id: 'barley',   ch: 'ch2', name: 'הגריסים',       icon: '🌾', soon: true },
  { id: 'beans',    ch: 'ch3', name: 'השעועית',       icon: '🫘', from: 'הגינה של צופיה', line: 'אורגני. נו, שוין. גם שעועית צריכה אידיאולוגיה.' },
  { id: 'kishke',   ch: 'ch4', name: 'הקישקע',        icon: '🌭', from: 'הרבנית גיטל', line: 'היא שאלה אותי על אבא שלי. ואז נתנה לי קישקע. זה המשפט העברי.' },
  { id: 'baharat',  ch: 'ch5', name: 'הבהרט',         icon: '🧂', soon: true },
  { id: 'fire',     ch: 'ch6', name: 'האש הקטנה',     icon: '🔥', soon: true },
  { id: 'potatoes', ch: 'ch7', name: 'תפוחי האדמה',   icon: '🥔', soon: true },
];

export const MOOD_BANDS = [
  { min: 0,  face: 'angry',      emoji: '😫', text: 'אני הולך הביתה.' },
  { min: 20, face: 'suspicious', emoji: '😒', text: "מישהו פה מכיר את המושג 'בשר'?" },
  { min: 40, face: 'neutral',    emoji: '😐', text: 'נו.' },
  { min: 60, face: 'smirk',      emoji: '🙂', text: 'מעניין.' },
  { min: 80, face: 'delighted',  emoji: '🤤', text: 'אני אוהב את המדינה הזאת.' },
];

export function moodBand(m) {
  let b = MOOD_BANDS[0];
  for (const band of MOOD_BANDS) if (m >= band.min) b = band;
  return b;
}

export function pagesMultiplier(mood) {
  return mood < 20 ? 0.5 : mood >= 80 ? 1.5 : 1;
}

function freshState() {
  return {
    version: 1,
    chapter: null,          // current chapter id
    node: null,             // current node id inside the chapter (save point)
    mood: 60,
    moodCap: 100,           // 120 in Bnei Brak ("שיכור מקוגל")
    pages: 0,
    ingredients: [],
    cola: 1,
    rugelach: 0,
    disguise: 'none',
    notebook: [],           // { ch, who, text, pages, margin }
    flags: {},
    isi: {},                // chapter → true when Isi was called there
    goat: {},               // chapter → true when the goat was found there
    badPolite: 0,
    eaten: [],              // food ids
    done: [],               // chapters finished
    mg: {},                 // minigame results
    colaSaves: 0,
    ending: null,
  };
}

function freshMeta() {
  return { endingsSeen: [], settings: { speed: 'normal', muted: false, contrast: false }, runs: 0 };
}

const listeners = new Map();
export function on(ev, cb) { if (!listeners.has(ev)) listeners.set(ev, new Set()); listeners.get(ev).add(cb); return () => listeners.get(ev).delete(cb); }
export function emit(ev, data) { const s = listeners.get(ev); if (s) for (const cb of s) { try { cb(data); } catch (e) { console.error(e); } } }

export let state = freshState();
export let meta = loadMeta();

function loadMeta() {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (raw) { const m = JSON.parse(raw); return { ...freshMeta(), ...m, settings: { ...freshMeta().settings, ...(m.settings || {}) } }; }
  } catch (e) { /* private mode etc. */ }
  return freshMeta();
}
export function saveMeta() {
  try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch (e) { /* ignore */ }
}

export function newGame() {
  state = freshState();
  meta.runs = (meta.runs || 0) + 1;
  saveMeta();
  emit('change', state);
  return state;
}

export function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); return true; } catch (e) { return false; }
}
export function hasSave() {
  try { const raw = localStorage.getItem(SAVE_KEY); if (!raw) return false; const s = JSON.parse(raw); return !!s.chapter && !s.ending; } catch (e) { return false; }
}
export function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    state = { ...freshState(), ...s };
    emit('change', state);
    return state;
  } catch (e) { return null; }
}
export function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ } }

// ---------- meters ----------
export function setMood(n, opts = {}) {
  const before = state.mood;
  state.mood = Math.max(0, Math.min(state.moodCap, Math.round(n)));
  emit('mood', { before, after: state.mood, delta: state.mood - before, ...opts });
  emit('change', state);
  if (state.mood <= 0 && !opts.noRescue) {
    if (state.cola > 0) {
      state.cola--; state.colaSaves++;
      state.mood = 20;
      emit('colaSave', state);
      emit('change', state);
    } else {
      emit('moodZero', state);
    }
  }
  return state.mood;
}
export function addMood(d, opts) { return setMood(state.mood + d, opts); }

export function addPages(n, opts = {}) {
  const raw = Math.max(0, n);
  const gained = opts.raw ? raw : Math.round(raw * pagesMultiplier(state.mood));
  state.pages += gained;
  emit('pages', { gained, raw, ...opts });
  emit('change', state);
  return gained;
}

export function addQuote(q) {
  // q: { who, text, pages, margin, ch }
  const gained = addPages(q.pages || 0, { quote: true, silent: true });
  const entry = { ch: q.ch || state.chapter, who: q.who, text: q.text, pages: gained, margin: q.margin || '', kind: q.kind || 'quote' };
  state.notebook.push(entry);
  emit('quote', entry);
  emit('change', state);
  return entry;
}

export function giveIngredient(id) {
  if (!INGREDIENTS.find((i) => i.id === id)) return false;
  if (state.ingredients.includes(id)) return false;
  state.ingredients.push(id);
  emit('ingredient', id);
  emit('change', state);
  return true;
}
export function hasIngredient(id) { return state.ingredients.includes(id); }

export function giveCola(n = 1) { state.cola = Math.min(3, state.cola + n); emit('change', state); }
export function giveRugelach(n = 1) { state.rugelach = Math.min(9, state.rugelach + n); emit('change', state); }
export function useCola() { if (state.cola <= 0) return false; state.cola--; addMood(10); emit('item', 'cola'); return true; }
export function useRugelach() { if (state.rugelach <= 0) return false; state.rugelach--; addMood(8); emit('item', 'rugelach'); return true; }

export function setDisguise(d) { state.disguise = d; emit('disguise', d); emit('change', state); }

export function markIsi(ch = state.chapter) { state.isi[ch] = true; emit('change', state); }
export function markGoat(ch = state.chapter) { if (state.goat[ch]) return false; state.goat[ch] = true; emit('goat', ch); emit('change', state); return true; }
export function setFlag(k, v = true) { state.flags[k] = v; emit('change', state); }
export function flag(k) { return !!state.flags[k]; }

export function eatFood(food, polite) {
  state.eaten.push(food.id);
  if (food.bad && polite) state.badPolite++;
  addMood(food.mood, { food: food.id });
  emit('change', state);
}

export function finishChapter(ch) {
  if (!state.done.includes(ch)) state.done.push(ch);
  state.disguise = 'none';
  state.moodCap = 100;
  if (state.mood > 100) state.mood = 100;
  emit('change', state);
  save();
}

// ---------- endings (SPEC §7, slice scaling) ----------
export const ENDINGS = [
  { id: 'huff',       icon: '🥤', name: 'חזרה לניו יורק בכעס', book: 'ארץ בלי שומן', hint: '😤 משהו עם קינואה, בלי קולה...' },
  { id: 'healthy',    icon: '🥗', name: 'סוף האימה: טוביה הבריא', book: 'נבטים: מסע רוחני', hint: '🧘 תגיד "תודה, טעים מאוד" יותר מדי פעמים...' },
  { id: 'bestseller', icon: '📘', name: 'רב-מכר', book: 'צ׳ולנט: איך הבנתי את המזרח התיכון דרך הקיבה', hint: '📖 ספר שלם, סיר שלם, בטן שמחה.' },
  { id: 'medium',     icon: '📗', name: 'ספר בינוני', book: 'טוביה מסתכל על סיר ריק', hint: '📖 ספר טוב. צ׳ולנט עצוב.' },
  { id: 'nobook',     icon: '📕', name: 'אין ספר', book: '(אין)', hint: '📞 המו"ל מתקשר. זה לא טוב.' },
  { id: 'secret',     icon: '💌', name: 'סוף סודי: הצ׳ולנט של איזי', book: 'לאיזי. שתמיד ידעה.', hint: '😶 משהו עם עז. ועם טלפון. בכל פרק.' },
];

export function decideEnding() {
  const s = state;
  const ing = s.ingredients.length;
  const chapters = ['ch1', 'ch3', 'ch4'];
  const isiAll = chapters.every((c) => s.isi[c]);
  const goatAll = chapters.every((c) => s.goat[c]);
  if (s.mood <= 0) return 'huff';
  if (s.badPolite >= SLICE.healthyThreshold) return 'healthy';
  if (isiAll && goatAll && ing >= SLICE.ingredientsTarget) return 'secret';
  if (s.pages >= SLICE.pagesTarget && ing >= SLICE.ingredientsTarget && s.mood >= 40) return 'bestseller';
  if (s.pages >= SLICE.pagesTarget) return 'medium';
  return 'nobook';
}

export function recordEnding(id) {
  state.ending = id;
  if (!meta.endingsSeen.includes(id)) meta.endingsSeen.push(id);
  saveMeta();
  clearSave();
  emit('change', state);
}

export function setSetting(k, v) { meta.settings[k] = v; saveMeta(); emit('settings', meta.settings); }
