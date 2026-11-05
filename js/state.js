/* js/state.js — meters, inventory, notebook, flags, save/load, endings (SPEC §3, §7, slice-scaled).
 * Pure data + rules. No DOM. main.js listens to `onChange` to refresh the HUD.
 */
import { FOODS, INGREDIENTS } from './content/foods.js';
import { MOOD_BANDS, ENDINGS } from './content/text.js';

export const SAVE_KEY = 'tuvia-walker-save-v1';
export const META_KEY = 'tuvia-walker-meta-v1';
export const SLICE = { pagesTarget: 100, ingredients: 3, badFoodsForHealthy: 5, chapters: ['airport', 'settlement', 'bneibrak'] };

const safe = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { /* no storage */ } },
};

export function freshState() {
  return {
    mood: 60, moodCap: 100, pages: 0, pagesRaw: 0,
    ingredients: [],            // ids
    inventory: { cola: 1, rugelach: 0 },
    notebook: [],               // { quote, margin, chapter, who, pages, pencil }
    flags: {},                  // per-run flags (dialogue + quests)
    chapterFlags: {},           // flags reset per chapter: { [chapterId]: {...} }
    talks: {},                  // npcId → count
    visited: [],                // chapters completed
    isiCalled: [], goatFound: [],
    badEaten: 0, goodEaten: 0, foodsEaten: [],
    disguise: 'none',
    chapter: null, taxiRides: 0,
    pos: null,                  // [x, y] in tiles (saved mid-chapter)
    ended: null,
    startedAt: Date.now(),
  };
}

export function createState() {
  let s = freshState();
  const listeners = new Set();
  const emit = (what, extra) => { for (const l of listeners) l(what, extra); };

  const api = {
    get s() { return s; },
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    reset() { s = freshState(); emit('reset'); },
    load() {
      const d = safe.get(SAVE_KEY);
      if (!d || typeof d !== 'object' || !(d.chapter || (d.visited && d.visited.length))) return false;
      s = Object.assign(freshState(), d); emit('load'); return true;
    },
    hasSave() { const d = safe.get(SAVE_KEY); return !!(d && (d.chapter || (d.visited && d.visited.length))); },
    save(extra = {}) { Object.assign(s, extra); return safe.set(SAVE_KEY, s); },
    clearSave() { safe.del(SAVE_KEY); },

    // ---- meta (endings seen, settings) ----
    meta() { return Object.assign({ endingsSeen: [], muted: false, textSpeed: 'normal', contrast: false, goatTotal: 0 }, safe.get(META_KEY) || {}); },
    setMeta(patch) { const m = Object.assign(api.meta(), patch); safe.set(META_KEY, m); return m; },

    // ---- mood ----
    moodBand(m = s.mood) { let b = MOOD_BANDS[0]; for (const band of MOOD_BANDS) if (m >= band.min) b = band; return b; },
    pagesMult() { return s.mood < 20 ? 0.5 : s.mood >= 80 ? 1.5 : 1; },
    addMood(n, why) {
      const before = s.mood;
      s.mood = Math.max(0, Math.min(s.moodCap, s.mood + n));
      emit('mood', { delta: s.mood - before, why });
      if (s.mood <= 0) {
        if (s.inventory.cola > 0) { s.inventory.cola--; s.mood = 20; emit('autoCola'); }
        else emit('moodZero');
      }
      return s.mood - before;
    },
    setMoodCap(cap) { s.moodCap = cap; if (s.mood > cap) s.mood = cap; emit('mood', { delta: 0 }); },

    // ---- pages / notebook ----
    addPages(n, quote, margin, who) {
      const gained = Math.max(1, Math.round(n * api.pagesMult()));
      s.pages += gained; s.pagesRaw += n;
      if (quote) s.notebook.push({ quote, margin: margin || '', chapter: s.chapter, who: who || '', pages: gained, pencil: !!s.flags.penGiven, t: s.notebook.length });
      emit('pages', { gained, quote, who });
      return gained;
    },

    // ---- food ----
    eat(foodId, polite = false) {
      const f = FOODS[foodId]; if (!f) return null;
      let mood = f.mood;
      if (foodId === 'ptcha' && s.disguise === 'bneibrak') mood = f.moodBneibrak;
      if (f.kind === 'bad') { s.badEaten++; } else { s.goodEaten++; }
      s.foodsEaten.push(foodId);
      const delta = api.addMood(mood, 'food');
      emit('eat', { food: f, id: foodId, delta, polite });
      return { food: f, delta };
    },
    addItem(kind, n = 1) {
      if (kind === 'cola') s.inventory.cola = Math.min(3, s.inventory.cola + n);
      else if (kind === 'rugelach') s.inventory.rugelach = Math.min(9, s.inventory.rugelach + n);
      emit('inventory', { kind, n });
    },
    useItem(kind) {
      if (kind === 'cola' && s.inventory.cola > 0) { s.inventory.cola--; emit('inventory', { kind, n: -1 }); return api.eat('cola'); }
      if (kind === 'rugelach' && s.inventory.rugelach > 0) { s.inventory.rugelach--; emit('inventory', { kind, n: -1 }); return api.eat('rugelach'); }
      return null;
    },

    // ---- ingredients / quest ----
    giveIngredient(id) {
      if (!INGREDIENTS.find((i) => i.id === id)) return false;
      if (!s.ingredients.includes(id)) { s.ingredients.push(id); emit('ingredient', { id }); }
      return true;
    },
    hasIngredient(id) { return s.ingredients.includes(id); },
    markIsi(ch = s.chapter) { if (ch && !s.isiCalled.includes(ch)) { s.isiCalled.push(ch); emit('isi'); return true; } return false; },
    markGoat(ch = s.chapter) { if (ch && !s.goatFound.includes(ch)) { s.goatFound.push(ch); emit('goat'); return true; } return false; },
    setFlag(k, v = true) { s.flags[k] = v; emit('flag', { k, v }); },
    flag(k) { return !!s.flags[k]; },
    talked(npc) { s.talks[npc] = (s.talks[npc] || 0) + 1; return s.talks[npc]; },
    setDisguise(d) { s.disguise = d; emit('disguise', { d }); },
    completeChapter(ch = s.chapter) { if (ch && !s.visited.includes(ch)) s.visited.push(ch); emit('chapter'); },
    chapterDone(ch) { return s.visited.includes(ch); },
    finaleUnlocked() { return SLICE.chapters.every((c) => s.visited.includes(c)); },

    // ---- endings (SPEC §7 order, slice-scaled) ----
    evaluateEnding(immediate = false) {
      if (s.mood <= 0 && s.inventory.cola <= 0) return 'huff';
      if (immediate) return null;
      if (s.badEaten >= SLICE.badFoodsForHealthy) return 'healthy';
      const all = s.ingredients.length >= SLICE.ingredients;
      const secret = all && SLICE.chapters.every((c) => s.isiCalled.includes(c)) && SLICE.chapters.every((c) => s.goatFound.includes(c));
      if (secret) return 'secret';
      if (s.pages >= SLICE.pagesTarget && all && s.mood >= 40) return 'bestseller';
      if (s.pages >= SLICE.pagesTarget) return 'mediocre';
      return 'nobook';
    },
    ending(id) { return ENDINGS.find((e) => e.id === id); },
    recordEnding(id) { const m = api.meta(); if (!m.endingsSeen.includes(id)) m.endingsSeen.push(id); api.setMeta(m); s.ended = id; },
  };
  return api;
}
