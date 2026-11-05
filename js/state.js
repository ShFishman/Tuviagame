/* js/state.js — meters, inventory, notebook, save/load, endings (SPEC §3, §7; slice scaling in README). */
import { INGREDIENTS } from './content/foods.js';
import { ENDINGS } from './content/endings.js';

export const SAVE_KEY = 'tuvia-catcher-save-v1';
export const SETTINGS_KEY = 'tuvia-catcher-settings-v1';
export const BOOK_TARGET = 100;          // slice: 1/3 of SPEC's 300
export const SLICE_INGREDIENTS = ['pot', 'beans', 'kishke'];
export const HEALTHY_THRESHOLD = 5;      // bad foods eaten politely (slice)

export const MOOD_BANDS = [
  { min: 0,  label: 'אני הולך הביתה.', expr: 'angry' },
  { min: 20, label: "מישהו פה מכיר את המושג 'בשר'?", expr: 'disgusted' },
  { min: 40, label: 'נו.', expr: 'neutral' },
  { min: 60, label: 'מעניין.', expr: 'smirk' },
  { min: 80, label: 'אני אוהב את המדינה הזאת.', expr: 'delighted' },
];
export function moodBand(m) { let b = MOOD_BANDS[0]; for (const x of MOOD_BANDS) if (m >= x.min) b = x; return b; }
export function pagesMultiplier(m) { return m < 20 ? 0.5 : m >= 80 ? 1.5 : 1; }

function freshState() {
  return {
    v: 1,
    next: 'ch1',              // next chapter to play
    done: [],                 // chapters finished
    mood: 60,
    moodCap: 100,
    pages: 0,
    ingredients: [],
    inventory: { coke: 0, rugelach: 0 },
    notebook: [],             // { who, text, pages, margin, chapter, kind: quote|jackpot|disguise|special }
    isiCalled: [],
    goatsFound: [],
    politeBad: 0,
    badEaten: 0,
    goodEaten: 0,
    complained: 0,
    disguise: 'none',
    disguiseUses: 0,
    emergencyUsed: 0,
    stats: { caught: 0, missed: 0, bestCombo: 0 },
    ending: null,
    startedAt: Date.now(),
  };
}

function readJSON(key) { try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
function writeJSON(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); return true; } catch (e) { return false; } }

export const settings = Object.assign({ muted: false, textSpeed: 1, highContrast: false, volume: 0.8, endingsSeen: [], secretPage: false, goatsEver: 0 }, readJSON(SETTINGS_KEY) || {});
export function saveSettings() { return writeJSON(SETTINGS_KEY, settings); }

export const state = freshState();
const listeners = new Set();
export function onChange(cb) { listeners.add(cb); return () => listeners.delete(cb); }
function emit(what, payload) { for (const cb of listeners) { try { cb(what, payload, state); } catch (e) { /* ui must not crash the game */ } } }

export function resetState() { Object.assign(state, freshState()); emit('reset'); }
export function save() { return writeJSON(SAVE_KEY, state); }
export function hasSave() { const s = readJSON(SAVE_KEY); return !!(s && s.v === 1 && !s.ending); }
export function load() {
  const s = readJSON(SAVE_KEY);
  if (!s || s.v !== 1) return false;
  Object.assign(state, freshState(), s);
  emit('load');
  return true;
}
export function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* */ } }

/** Mood with the 0 → emergency-can rule. Returns { delta, emergency, zero }. */
export function addMood(n) {
  const before = state.mood;
  state.mood = Math.max(0, Math.min(state.moodCap, state.mood + n));
  let emergency = false, zero = false;
  if (state.mood <= 0) {
    if (state.inventory.coke > 0) { state.inventory.coke--; state.emergencyUsed++; state.mood = 20; emergency = true; }
    else zero = true;
  }
  emit('mood', { before, after: state.mood, delta: n, emergency, zero });
  return { delta: state.mood - before, emergency, zero };
}
export function setMood(n) { state.mood = Math.max(0, Math.min(state.moodCap, +n || 0)); emit('mood', { before: state.mood, after: state.mood, delta: 0 }); }
export function setMoodCap(cap) { state.moodCap = cap; if (state.mood > cap) state.mood = cap; emit('mood', { before: state.mood, after: state.mood, delta: 0 }); }

/** Pages × mood multiplier. Returns the pages actually added. */
export function addPages(n) {
  const got = Math.max(0, Math.round(n * pagesMultiplier(state.mood)));
  state.pages += got;
  emit('pages', { added: got, raw: n });
  return got;
}
export function addQuote(q) {
  const entry = { ...q, at: Date.now() };
  state.notebook.push(entry);
  const got = q.pages ? addPages(q.pages) : 0;
  entry.got = got;
  emit('quote', entry);
  return got;
}
export function giveIngredient(id) {
  if (!INGREDIENTS[id] || state.ingredients.includes(id)) return false;
  state.ingredients.push(id);
  emit('ingredient', id);
  return true;
}
export function addCan() { if (state.inventory.coke < 3) { state.inventory.coke++; emit('inventory'); return true; } return false; }
export function addRugelach() { state.inventory.rugelach++; emit('inventory'); }
export function useRugelach() { if (state.inventory.rugelach > 0) { state.inventory.rugelach--; addMood(5); emit('inventory'); return true; } return false; }
export function useCan() { if (state.inventory.coke > 0) { state.inventory.coke--; addMood(20); emit('inventory'); return true; } return false; }
export function markIsi(ch) { if (!state.isiCalled.includes(ch)) state.isiCalled.push(ch); emit('isi', ch); }
export function markGoat(ch) {
  if (!state.goatsFound.includes(ch)) { state.goatsFound.push(ch); settings.goatsEver++; saveSettings(); }
  emit('goat', ch);
}
export function finishChapter(id, nextId) { if (!state.done.includes(id)) state.done.push(id); state.next = nextId; save(); emit('chapter', id); }

export function sliceIngredientCount() { return SLICE_INGREDIENTS.filter((i) => state.ingredients.includes(i)).length; }

/** SPEC §7 order, slice-scaled. `huffNow` = mood hit 0 with no can during play. */
export function decideEnding(huffNow = false) {
  if (huffNow) return 'huff';
  if (state.politeBad >= HEALTHY_THRESHOLD) return 'healthy';
  const ing = sliceIngredientCount();
  const allIsi = ['ch1', 'ch3', 'ch4'].every((c) => state.isiCalled.includes(c));
  const allGoats = ['ch1', 'ch3', 'ch4'].every((c) => state.goatsFound.includes(c));
  if (allIsi && allGoats && ing === 3) return 'secret';
  if (state.pages >= BOOK_TARGET && ing === 3 && state.mood >= 40) return 'bestseller';
  if (state.pages >= BOOK_TARGET) return 'mediocre';
  return 'nobook';
}
export function recordEnding(id) {
  state.ending = id;
  if (!settings.endingsSeen.includes(id)) settings.endingsSeen.push(id);
  if (id === 'secret') settings.secretPage = true;
  saveSettings();
  clearSave();
  emit('ending', id);
  return ENDINGS[id];
}
