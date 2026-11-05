// js/state.js — meters, inventory, notebook, flags, save/load, ending logic (SPEC §3, §7; slice scaling in README).
import { INGREDIENTS, MOOD_BANDS } from './content/cast.js';

export const SAVE_KEY = 'tuvia-novel-save-v1';
export const SETTINGS_KEY = 'tuvia-novel-settings-v1';
// pageScale: quote values in js/content are written at SPEC full-game scale (300 pages = a book);
// the slice multiplies them by 0.4 so that 100 pages = a book (see README).
export const SLICE = { bookTarget: 100, ingredientsTotal: 3, healthyThreshold: 5, pageScale: 0.4, chapters: ['ch1', 'ch3', 'ch4', 'finale'] };

export function freshState() {
  return {
    v: 1,
    chapter: null, encounter: 0,           // where to resume
    mood: 60, pages: 0, pagesRaw: 0,
    ingredients: [],                       // ids
    inventory: { cola: 0, rugelach: 0 },
    notebook: [],                          // { ch, who, text, note, pages, kind }
    flags: {},                             // per-chapter story flags (reset each chapter)
    disguise: 'none',
    isiCalled: {}, goatFound: {},          // per chapter id → true
    politeBad: 0, badEaten: 0, goodEaten: 0, foodsEaten: [],
    unlocked: ['ch1'],
    endingsSeen: [],
    seen: {},                              // line hashes for fast-forward
    kugelPages: 0,
    started: false,
  };
}

export function loadSettings() {
  const d = { speed: 'normal', muted: false, contrast: false, volume: 0.8 };
  try { return { ...d, ...(JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')) }; } catch (e) { return d; }
}
export function saveSettings(s) { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch (e) { /* private mode etc. */ } }

export function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || s.v !== 1) return null;
    return { ...freshState(), ...s };
  } catch (e) { return null; }
}
export function saveState(s) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); return true; } catch (e) { return false; } }
export function clearState() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ } }

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function moodBand(mood) {
  let b = MOOD_BANDS[0];
  for (const band of MOOD_BANDS) if (mood >= band.min) b = band;
  return b;
}
export function moodBandIndex(mood) { return mood >= 80 ? 4 : mood >= 60 ? 3 : mood >= 40 ? 2 : mood >= 20 ? 1 : 0; }

/** SPEC §3.1: pages × 0.5 below 20, ×1.5 at 80+. */
export function pageMultiplier(mood) { return mood < 20 ? 0.5 : mood >= 80 ? 1.5 : 1; }

export function ingredientInfo(id) { return INGREDIENTS.find((i) => i.id === id); }

/** Endings in SPEC §7 order, scaled to the slice (README). `secret` is checked before the bestseller. */
export function decideEnding(s) {
  const ing = s.ingredients.length;
  if (s.politeBad >= SLICE.healthyThreshold) return 'healthy';
  const allIsi = SLICE.chapters.slice(0, 3).every((c) => s.isiCalled[c]);
  const allGoat = SLICE.chapters.slice(0, 3).every((c) => s.goatFound[c]);
  if (allIsi && allGoat && ing >= SLICE.ingredientsTotal) return 'secret';
  if (s.pages >= SLICE.bookTarget && ing >= SLICE.ingredientsTotal && s.mood >= 40) return 'bestseller';
  if (s.pages >= SLICE.bookTarget) return 'mediocre';
  return 'nobook';
}
