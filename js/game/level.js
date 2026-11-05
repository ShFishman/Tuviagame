/* js/game/level.js — the arcade food-catcher level (SPEC §9.3).
 *
 * createLevel({ stage, chapter, audio, hooks }) → { start, stop, pause, resume, restart, setDisguise, complain, findGoat, skip, isRunning }
 *   stage:   a positioned <div>; the level creates its canvas + DOM overlays inside it.
 *   chapter: a CHAPTERS entry (content), the level reads chapter.level.
 *   hooks:   { onEnd(results), onHuff(), onDisguise(d), onQuote(entry), onPolite(n) }
 *
 * World units = CSS pixels of the stage; `s` scales sprites by the stage height.
 */
import { tuviaSVG, goatSVG } from '../art/tuvia.js';
import { npcSVG } from '../art/npcs.js';
import { drawShape } from '../art/food.js';
import { FOODS, INGREDIENTS, foodMood } from '../content/foods.js';
import { CAST, DISGUISE_ORDER, DISGUISES } from '../content/chapters.js';
import { COMPLAINTS, DELIGHTS, COMBO_LINES, MISS_LINES, IDLE_LINES, AMBIENT, OVERFLOW_LINES, QUOTE_CATCH, EMERGENCY_LINES } from '../content/asides.js';
import * as S from '../state.js';

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rnd = (a, b) => a + Math.random() * (b - a);

// ---------- SVG → Image cache ----------
const imgCache = new Map();
function svgImage(key, svgFn) {
  if (imgCache.has(key)) return imgCache.get(key);
  const rec = { img: new Image(), ready: false };
  rec.img.onload = () => { rec.ready = true; };
  rec.img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgFn());
  imgCache.set(key, rec);
  return rec;
}
const tuviaImg = (expr, dis) => svgImage(`tv:${expr}:${dis}`, () => tuviaSVG({ pose: 'plate', expression: expr, disguise: dis, crop: 'full', size: 240, table: false, id: `tvp-${expr}-${dis}` }));
const npcImg = (id, mouth = 'flat') => svgImage(`npc:${id}:${mouth}`, () => npcSVG(id, { size: 200, mouth }));
const goatImg = (mood, flip) => svgImage(`goat:${mood}:${flip}`, () => goatSVG({ size: 160, mood, flip }));

// ---------- rotating line pickers (no immediate repeats) ----------
function rotator(arr) { let last = -1; return () => { if (!arr || !arr.length) return ''; let i; do { i = Math.floor(Math.random() * arr.length); } while (arr.length > 1 && i === last); last = i; return arr[i]; }; }

export function createLevel({ stage, chapter, audio, hooks = {} }) {
  const L = chapter.level;
  const chId = chapter.id;
  // ---------- DOM ----------
  stage.innerHTML = '';
  stage.classList.add('level-stage');
  const canvas = document.createElement('canvas'); canvas.className = 'level-canvas'; stage.appendChild(canvas);
  const overlay = document.createElement('div'); overlay.className = 'level-overlay'; stage.appendChild(overlay);
  const ctx = canvas.getContext('2d');
  const el = {
    aside: mk('aside-cloud', overlay), say: mk('tuvia-say', overlay), verdict: mk('verdict', overlay),
    combo: mk('combo', overlay), exchange: mk('exchange', overlay), tip: mk('tip', overlay),
    phase: mk('phase-label', overlay), polite: mk('polite-meter', overlay), npc: mk('npc-bubble', overlay),
    flash: mk('flash', overlay), overflow: mk('overflow-badge', overlay), beat: mk('beat-dots', overlay),
    center: mk('center-msg', overlay),
  };
  function mk(cls, parent) { const d = document.createElement('div'); d.className = cls; parent.appendChild(d); return d; }

  // ---------- sizing ----------
  let W = 0, H = 0, s = 1, dpr = 1;
  function resize() {
    const r = stage.getBoundingClientRect();
    W = Math.max(300, r.width); H = Math.max(400, r.height);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    s = clamp(H / 760, 0.62, 1.15) * clamp(W / 420, 0.85, 1);
    tuvia.x = clamp(tuvia.x, tuvia.half, W - tuvia.half);
  }

  // ---------- world ----------
  const tuvia = { x: 0, tx: null, vx: 0, half: 60, expr: 'smirk', exprUntil: 0, dis: S.state.disguise || 'none', run: 0, face: 1, knocked: 0, lastMove: 0 };
  const items = [];
  const parts = [];
  const bubbles = [];     // thrower throw animations
  let t = 0, elapsed = 0, timeScale = 1, running = false, paused = false, finished = false, raf = 0, lastTs = 0;
  let shake = 0, shakeT = 0, flashT = 0, goldT = 0;
  let spawnAcc = 0, phaseIdx = -1, phase = null, eventsDone = new Set();
  let combo = 0, bestCombo = 0, comboT = 0;
  let politeMode = false, politeQuinoa = 0, politeNeed = (L.ingredient && L.ingredient.need) || 4, complainedThisPhase = false, politeFinaleWarned = false;
  let disguiseUsed = false, disguiseJackpotsDone = new Set(), disguiseSwapT = -99, pendingDisguiseJackpot = null;
  let ingredientSpawned = false, ingredientGot = false, goatFound = S.state.goatsFound.includes(chId);
  let honest = true, quizDone = false, quizActive = false, cholentReveal = false, cholentCaught = false;
  let quoteIdx = 0, jackpotIdx = 0, nextQuoteT = 9, nextJackpotT = 22, nextAmbientT = 18, nextMissLineT = 0, idleT = 0, driftAcc = 0, overflowT = 0;
  const goats = [];           // running goats
  const results = { caught: 0, missed: 0, badCaught: 0, goodCaught: 0, pages: 0, ingredient: false, goat: goatFound, bestCombo: 0, complained: 0 };
  const compPick = {}; for (const k in COMPLAINTS) compPick[k] = rotator(COMPLAINTS[k]);
  const delightPick = {}; for (const k in DELIGHTS) delightPick[k] = rotator(DELIGHTS[k]);
  const missPick = rotator(MISS_LINES), idlePick = rotator(IDLE_LINES), ambientPick = rotator(AMBIENT[chId] || AMBIENT.finale), overflowPick = rotator(OVERFLOW_LINES), qcPick = rotator(QUOTE_CATCH);
  const quotes = [...L.quotes].sort(() => Math.random() - .5);
  const jackpots = [...L.jackpots];
  const throwers = L.throwers.map((th) => ({ ...th, px: 0, py: 0, pulse: 0, mouth: 'flat', mouthT: 0 }));
  let beatUnsub = null, beatFallback = null, lastBeatStep = -1;

  // ---------- helpers ----------
  const now = () => t;
  function tuviaGeom() {
    const h = 190 * s, w = h * 240 / 320;
    const legs = 26 * s;
    const top = H - 8 - legs - h;
    const plateY = top + h * 262 / 320;
    return { h, w, top, plateY, legs };
  }
  function setExpr(e, ms = 900) { tuvia.expr = e; tuvia.exprUntil = t + ms / 1000; }
  function aside(text, ms = 3600) { if (!text) return; el.aside.textContent = '💭 ' + text; el.aside.classList.add('show'); clearTimeout(el.aside._t); el.aside._t = setTimeout(() => el.aside.classList.remove('show'), ms); }
  function say(text, ms = 2200) { el.say.textContent = text; el.say.classList.add('show'); clearTimeout(el.say._t); el.say._t = setTimeout(() => el.say.classList.remove('show'), ms); }
  function verdict(name, text, kind, pages) {
    el.verdict.innerHTML = `<b>${name}</b>${pages ? ` <span class="pg">📖 <bdi dir="ltr">+${pages}</bdi></span>` : ''}<br><span>${text}</span>`;
    el.verdict.className = `verdict show ${kind}`; clearTimeout(el.verdict._t); el.verdict._t = setTimeout(() => el.verdict.classList.remove('show'), 2600);
  }
  function npcLine(who, text, ms = 3800) {
    const th = throwers.find((x) => x.id === who);
    const name = (CAST[who] && CAST[who].name) || who;
    el.npc.innerHTML = `<b>${name}:</b> ${text}`;
    el.npc.style.left = th ? `${clamp(th.px / W * 100, 18, 82)}%` : '50%';
    el.npc.classList.add('show'); clearTimeout(el.npc._t); el.npc._t = setTimeout(() => el.npc.classList.remove('show'), ms);
    if (th) { th.mouth = 'open'; th.mouthT = t + 1.4; }
  }
  function tip(text, ms = 5200) { el.tip.textContent = text; el.tip.classList.add('show'); clearTimeout(el.tip._t); el.tip._t = setTimeout(() => el.tip.classList.remove('show'), ms); }
  function centerMsg(html, ms = 2400, cls = '') { el.center.innerHTML = html; el.center.className = `center-msg show ${cls}`; clearTimeout(el.center._t); el.center._t = setTimeout(() => el.center.classList.remove('show'), ms); }
  function exchange({ icon, q, who, a, pages, margin }) {
    const name = (CAST[who] && CAST[who].name) || who;
    el.exchange.innerHTML = `<div class="ex-q">${icon} <b>טוביה:</b> ${q}</div><div class="ex-a"><b>${name}:</b> ${a}</div><div class="ex-p">📖 <bdi dir="ltr">+${pages}</bdi> עמודים${margin ? ` · <i>${margin}</i>` : ''}</div>`;
    el.exchange.classList.add('show'); clearTimeout(el.exchange._t); el.exchange._t = setTimeout(() => el.exchange.classList.remove('show'), 5200);
  }
  function doShake(n = 8, dur = .4) { shake = n; shakeT = dur; }
  function slowmo(factor, dur) { timeScale = factor; clearTimeout(slowmo._t); slowmo._t = setTimeout(() => { timeScale = 1; }, dur); }
  function crumbs(x, y, color, n = 10, up = true) { for (let i = 0; i < n; i++) parts.push({ x, y, vx: rnd(-140, 140) * s, vy: (up ? rnd(-260, -60) : rnd(-40, 40)) * s, r: rnd(2, 4.5) * s, c: color, life: rnd(.5, 1) }); }
  function sparkle(x, y, n = 18) { for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = rnd(60, 260) * s; parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: rnd(2, 5) * s, c: Math.random() < .5 ? '#E5B632' : '#fff', life: rnd(.5, 1.1), star: true }); } }
  function sfx(n) { try { audio.playSfx(n); } catch (e) { /* */ } }

  // ---------- phases ----------
  function enterPhase(i) {
    phaseIdx = i; phase = L.phases[i]; spawnAcc = 0;
    el.phase.textContent = phase.label; el.phase.classList.add('show'); clearTimeout(el.phase._t); el.phase._t = setTimeout(() => el.phase.classList.remove('show'), 4200);
    if (phase.polite) { politeMode = true; politeQuinoa = 0; complainedThisPhase = false; updatePolite(); hooks.onPolite && hooks.onPolite({ active: true }); }
    if (phase.cokeRain) { aside('גשם. של קולה זירו. בבני ברק. אם זה לא הוכחה לאלוהים, אני לא יודע מה כן.'); }
    if (phase.avalanche) { doShake(5, .6); sfx('drumroll'); }
  }
  function updatePolite() {
    if (!politeMode) { el.polite.classList.remove('show'); return; }
    const need = chId === 'ch3' ? politeNeed : 0;
    el.polite.innerHTML = need
      ? `😇 נימוס: <bdi dir="ltr">${politeQuinoa}/${need}</bdi> קינואה בשקט · 🗯 להתלונן = הקלה (ואין שעועית)`
      : `😇 נימוס בשולחן שבת · אוכל רע שנאכל בשקט: <bdi dir="ltr">${S.state.politeBad}/${S.HEALTHY_THRESHOLD}</bdi> · 🗯 להתלונן`;
    el.polite.classList.add('show');
  }
  function endPolite(reason) {
    if (!politeMode) return;
    politeMode = false; updatePolite(); hooks.onPolite && hooks.onPolite({ active: false });
    if (reason === 'complained') { results.complained++; S.state.complained++; }
  }

  // ---------- spawning ----------
  function weightedPick(weights) {
    let total = 0; for (const k in weights) total += weights[k];
    let r = Math.random() * total;
    for (const k in weights) { r -= weights[k]; if (r <= 0) return k; }
    return Object.keys(weights)[0];
  }
  function currentWeights() {
    const w = { ...phase.items };
    const d = L.disguises && L.disguises[tuvia.dis];
    if (d && d.items) for (const k in d.items) w[k] = (w[k] || 0) + d.items[k];
    return w;
  }
  function throwerFor(from) {
    if (from === 'sky') return null;
    if (from === 'all') return pick(throwers);
    if (from === 'both') return pick(throwers.slice(0, 2));
    return throwers.find((x) => x.id === from) || throwers[0];
  }
  function spawnFood(foodId, opts = {}) {
    const f = FOODS[foodId]; if (!f) return null;
    const th = opts.thrower !== undefined ? opts.thrower : throwerFor(opts.from || phase.from);
    const r = (f.cursed ? 34 : f.kind === 'special' ? 26 : 24) * s * (opts.scale || 1);
    const sp = (phase ? phase.speed : 1) * (opts.speed || 1);
    const it = { kind: 'food', food: f, id: foodId, r, rot: rnd(-.3, .3), vrot: rnd(-1.2, 1.2), label: f.name, cursed: !!f.cursed };
    launch(it, th, sp, opts);
    items.push(it);
    return it;
  }
  function launch(it, th, sp, opts = {}) {
    const g = 420 * s * sp;
    it.g = g;
    if (th) {
      it.x = th.px + rnd(-10, 10) * s; it.y = th.py;
      const targetX = opts.targetX != null ? opts.targetX : clamp(tuvia.x + rnd(-W * .38, W * .38), 40, W - 40);
      const flight = rnd(1.5, 2.1) / Math.sqrt(sp);
      it.vx = (targetX - it.x) / flight; it.vy = -rnd(60, 160) * s;
      th.pulse = 1; th.mouth = th.mouth === 'open' ? 'open' : 'smile'; th.mouthT = Math.max(th.mouthT, t + .4);
    } else {
      it.x = opts.x != null ? opts.x : rnd(30, W - 30); it.y = -it.r - 10; it.vx = rnd(-30, 30) * s; it.vy = rnd(40, 120) * s;
    }
    if (opts.zigzag) it.zig = { a: 90 * s, f: rnd(2, 3), p: Math.random() * 6 };
    if (opts.slow) { it.g *= .25; it.vy = 30 * s; it.vx *= .3; }
    it.born = t;
  }
  function spawnBubble(kind, data) {
    const base = { quote: { r: 26, c: ['#FFFFFF', '#3B2A21'], icon: '📖' }, jackpot: { r: 28, c: ['#FFE8A8', '#B6861A'], icon: '😇' },
      disguise: { r: 28, c: ['#E9D8F4', '#6B3F8E'], icon: '🎭' }, answer: { r: 30, c: ['#DFF1FF', '#2B3A67'], icon: '❓' } }[kind];
    const it = { kind, data, r: base.r * s, c: base.c, icon: base.icon, rot: 0, vrot: 0, label: data.label || '' };
    const th = kind === 'answer' ? throwers.find((x) => x.id === 'gittel') : throwerFor(phase ? phase.from : 'all');
    launch(it, th, kind === 'jackpot' ? 1.9 : kind === 'answer' ? 1.0 : 0.75, { targetX: data.targetX });
    if (kind === 'jackpot') { it.vrot = 0; it.vx *= 1.25; }
    items.push(it);
    return it;
  }
  function spawnIngredient() {
    if (ingredientSpawned || !chapter.ingredient) return;
    ingredientSpawned = true;
    const ing = INGREDIENTS[chapter.ingredient];
    const it = { kind: 'ingredient', data: ing, r: 34 * s, rot: 0, vrot: 0, label: ing.name, glow: true };
    launch(it, null, 1, { x: clamp(tuvia.x + rnd(-80, 80), 60, W - 60), slow: true });
    it.vy = 60 * s; it.g = 25 * s;
    items.push(it);
    centerMsg(`✨ ${ing.name} ✨<br><small>מרכיב לצ'ולנט. תתפסו!</small>`, 3200, 'gold');
    sfx('ding'); goldT = 1.5;
  }
  function spawnDisguiseJackpot(d) {
    const dd = L.disguises && L.disguises[d];
    if (!dd || !dd.jackpot || disguiseJackpotsDone.has(d)) return;
    disguiseJackpotsDone.add(d);
    spawnBubble('disguise', { ...dd.jackpot, q: '(' + DISGUISES[d].label + ')', label: '🎭 ' + (CAST[dd.jackpot.who] ? CAST[dd.jackpot.who].name : dd.jackpot.who) });
  }
  function spawnGoat() {
    const fromLeft = Math.random() < .5;
    goats.push({ x: fromLeft ? -90 * s : W + 90 * s, dir: fromLeft ? 1 : -1, v: rnd(200, 290) * s, hit: false, mood: 'disappointed' });
    sfx('goat');
  }

  // ---------- events ----------
  function runEvent(ev) {
    switch (ev.type) {
      case 'tip': tip(ev.text); break;
      case 'npcLine': npcLine(ev.who, ev.text); break;
      case 'human': aside(ev.text, 5200); el.flash.classList.add('warm'); setTimeout(() => el.flash.classList.remove('warm'), 1200); break;
      case 'goatRun': spawnGoat(); break;
      case 'cursed': {
        npcLine('tzofia', chId === 'ch3' ? 'טוביה! הצ\'ולנט! בלי גלוטן! תתפוס!' : 'עוד אחד! בלי גלוטן!', 2500);
        const it = spawnFood(ev.food, { thrower: throwers.find((x) => x.id === 'tzofia') || throwers[0], speed: .8, zigzag: true });
        if (it) it.vrot = .6;
        sfx('drumroll');
        break;
      }
      case 'politeEnd': endPolite('phase'); if (chId === 'ch3') aside(politeQuinoa >= politeNeed ? 'שתקתי. ארבע פעמים. הצלחת ריקה, הנשמה מלאה, השעועית בדרך.' : 'שלב הנימוס נגמר. לא שתקתי מספיק. השעועית נשארת בגינה. נו.'); break;
      case 'ingredientCheck': if (chId === 'ch1') { if (honest) { npcLine('shira', 'אתה כן. כל הזמן היית אתה. קח.'); spawnIngredient(); } else npcLine('shira', 'לפני רגע היית מישהו אחר. הסיר נשאר אצלי. הסיר כן.'); } break;
      case 'phone': {
        npcLine('shmerel', 'זה טלפון כשר! אין אינטרנט! אין כלום! (הטלפון נופל)', 3000);
        const it = spawnFood('kosherPhone', { thrower: throwers.find((x) => x.id === 'shmerel'), speed: .9 });
        if (it) it.tiktok = true;
        setTimeout(() => sfx('tiktok'), 400);
        break;
      }
      case 'quiz': startQuiz(); break;
      case 'cholentReveal': {
        const n = S.sliceIngredientCount();
        if (n >= 3) {
          cholentReveal = true; slowmo(.3, 6500); goldT = 7; sfx('choir');
          centerMsg("🍲 הצ'ולנט המושלם יורד. בהילוך איטי. <br><small>הסיר של שירה. השעועית של צופיה. הקישקע של הרבנית.</small>", 5200, 'gold');
          const it = { kind: 'cholent', r: 44 * s, rot: 0, vrot: 0, label: "הצ'ולנט המושלם", glow: true };
          launch(it, null, 1, { x: clamp(tuvia.x + rnd(-60, 60), 70, W - 70), slow: true }); it.vy = 90 * s; it.g = 30 * s;
          items.push(it);
        } else {
          centerMsg(`🍲 הרמתי את המכסה.<br><small><bdi dir="ltr">${n}/3</bdi> מרכיבים. משהו חסר. כולם מרגישים. אף אחד לא אומר.</small>`, 4200, '');
          aside('חסר. אני יודע מה. בשנה הבאה.');
        }
        break;
      }
      default: break;
    }
  }
  function startQuiz() {
    if (quizDone || !L.quiz) return;
    quizActive = true;
    npcLine(L.quiz.who, L.quiz.question + ' (שלוש תשובות נופלות. תתפוס את הנכונה.)', 5000);
    const answers = [...L.quiz.answers].sort(() => Math.random() - .5);
    const slots = [0.22, 0.5, 0.78];
    answers.forEach((a, i) => setTimeout(() => { if (running) spawnBubble('answer', { ...a, label: a.text, targetX: W * slots[i] }); }, 900 + i * 650));
  }

  // ---------- catching ----------
  function onCatch(it) {
    const g = tuviaGeom();
    results.caught++; S.state.stats.caught++;
    if (it.kind === 'food') return catchFood(it, g);
    if (it.kind === 'quote') {
      const got = S.addQuote({ ...it.data, chapter: chId, kind: 'quote' });
      results.pages += got; sfx('scribble'); setExpr('writing', 700); sparkle(it.x, it.y, 8);
      verdict('📖 ' + ((CAST[it.data.who] && CAST[it.data.who].name) || it.data.who), it.data.text, 'quote', got);
      aside(qcPick(), 1800);
      hooks.onQuote && hooks.onQuote(it.data);
      return;
    }
    if (it.kind === 'jackpot' || it.kind === 'disguise') {
      const d = it.data;
      const got = S.addQuote({ who: d.who, text: d.a || d.text, q: d.q, pages: d.pages, margin: d.margin, chapter: chId, kind: it.kind });
      results.pages += got; sfx('tada'); sfx('scribble'); setExpr('delighted', 1500); sparkle(it.x, it.y, 26); slowmo(.35, 2600); goldT = 1.2;
      exchange({ icon: it.kind === 'jackpot' ? '😇' : '🎭', q: d.q, who: d.who, a: d.a || d.text, pages: got, margin: d.margin });
      hooks.onQuote && hooks.onQuote(d);
      return;
    }
    if (it.kind === 'ingredient') {
      ingredientGot = true; results.ingredient = true;
      S.giveIngredient(it.data.id); sfx('choir'); sfx('cheer'); sparkle(it.x, it.y, 40); goldT = 2.5; doShake(3, .3);
      setExpr('delighted', 2500); aside(it.data.reaction, 5200);
      centerMsg(`🥄 ${it.data.name} <small>· מ${it.data.who}</small>`, 3200, 'gold');
      return;
    }
    if (it.kind === 'answer') {
      quizActive = false; quizDone = true;
      for (let i = items.length - 1; i >= 0; i--) if (items[i].kind === 'answer' && items[i] !== it) items.splice(i, 1);
      if (it.data.correct) { npcLine('gittel', L.quiz.success, 5000); sfx('tada'); setExpr('happy', 2000); setTimeout(() => { if (running) spawnIngredient(); }, 1800); }
      else { npcLine('gittel', it.data.line, 4200); sfx('boo'); S.addMood(-3); setExpr('suspicious', 1600); doShake(4, .3); aside('טעיתי בתשובה על אבא שלי. בן שישים ומשהו. אני חוזר לכיתה א\'.'); }
      return;
    }
    if (it.kind === 'cholent') {
      cholentCaught = true; results.cholent = true;
      S.addMood(25); sfx('choir'); sfx('slurp'); sparkle(it.x, it.y, 60); goldT = 4; setExpr('delighted', 4000);
      verdict("הצ'ולנט המושלם", 'זה לא אוכל. זה זיכרון.', 'good');
      aside('אור זהוב. שקט. כולם טועמים. כולם מתלוננים. כולם לוקחים עוד. זה הספר. זה כל הספר.', 6000);
      return;
    }
  }
  function catchFood(it, g) {
    const f = it.food;
    const color = f.c[0];
    crumbs(it.x, g.plateY, color, 10);
    // the kosher phone
    if (f.kind === 'special') {
      const got = S.addQuote({ who: 'shmerel', text: 'זה טלפון כשר! אין אינטרנט, אין כלום! (צלצול טיקטוק) ...זה הטלפון של אשתי.', pages: f.pages, margin: 'שני טלפונים. אחת אמת. אני רושם את שניהם.', chapter: chId, kind: 'special' });
      results.pages += got; sfx('tiktok'); sfx('scribble'); setExpr('suspicious', 1500);
      verdict(f.name, f.verdict, 'quote', got); return;
    }
    let delta = foodMood(f, tuvia.dis);
    const good = delta > 0;
    const d = L.disguises && L.disguises[tuvia.dis];
    if (good && d && d.double) delta = Math.round(delta * 1.5);
    if (f.id === undefined) f.id = it.id;
    if (good) {
      results.goodCaught++; S.state.goodEaten++;
      combo++; comboT = t + 2.6; if (combo > bestCombo) bestCombo = combo;
      if (combo >= 3) { delta += Math.min(4, Math.floor(combo / 3)); showCombo(); }
      const r = S.addMood(delta);
      sfx(f.sfx || 'burp'); if (combo % 4 === 0) audio.sting('good');
      setExpr(delta >= 12 ? 'delighted' : 'happy', 900);
      verdict(f.name, f.verdict, 'good');
      if (Math.random() < .45 && DELIGHTS[it.id]) aside(delightPick[it.id](), 2600);
      if (it.id === 'coke') { if (S.addCan()) centerMsg('🥤 פחית חירום נשמרה', 1200, 'small'); }
      if (it.id === 'rugelach') S.addRugelach();
      if (S.state.mood > 100 && t > overflowT) { overflowT = t + 9; aside(overflowPick(), 3000); el.overflow.textContent = '🥴 ' + (L.overflowLabel || 'שיכור מקוגל'); el.overflow.classList.add('show'); }
      if (r.emergency) emergency();
    } else {
      results.badCaught++; S.state.badEaten++;
      combo = 0; el.combo.classList.remove('show');
      const polite = politeMode && !complainedThisPhase && f.kind === 'bad' && (chId !== 'ch3' || it.id === 'quinoa');
      let r;
      if (it.cursed) {
        r = S.addMood(delta); sfx('gasp'); audio.sting('bad'); doShake(16, .9); slowmo(.25, 1400); setExpr('shocked', 2400);
        el.flash.classList.add('red'); setTimeout(() => el.flash.classList.remove('red'), 700);
        verdict(f.name, f.verdict, 'cursed');
        setTimeout(() => aside(compPick.gfCholent(), 5600), 500);
      } else {
        r = S.addMood(polite ? Math.round(delta * .8) : delta);
        sfx(f.sfx || 'sigh'); if (f.kind === 'bad') audio.sting('bad');
        setExpr(f.kind === 'junk' ? 'suspicious' : 'disgusted', 1100);
        verdict(f.name, f.verdict, f.kind === 'junk' ? 'junk' : 'bad');
        const line = (compPick[it.id] || compPick._general)();
        if (polite) {
          S.state.politeBad++; if (it.id === 'quinoa') politeQuinoa++;
          say(pick(['תודה. טעים מאוד.', 'נהדר. באמת.', 'מצוין. (בולע)', 'כל הכבוד. בריא.']));
          aside(line, 3000); updatePolite();
          if (S.state.politeBad === S.HEALTHY_THRESHOLD - 1) setTimeout(() => aside(L.politeWarn || 'עוד אחת ואני נהיה אדם בריא. קוראים יקרים, תצילו אותי.', 4200), 3100);
          if (chId === 'ch3' && politeQuinoa >= politeNeed && !ingredientSpawned) { endPolite('done'); npcLine('tzofia', 'ארבע צלחות. בשקט. אתה אדם מנומס. (הולכת לגינה)', 3600); setTimeout(() => { if (running) spawnIngredient(); }, 2200); }
          if (S.state.politeBad >= S.HEALTHY_THRESHOLD && !politeFinaleWarned) { politeFinaleWarned = true; setTimeout(() => aside('זהו. אני אדם בריא עכשיו. אני לא מרגיש כלום. זה הסימן.', 4000), 3200); }
        } else aside(line, 3200);
      }
      if (r.emergency) emergency();
      if (r.zero) { huff(); return; }
    }
    if (it.id === 'coke' && good) { /* handled */ }
  }
  function emergency() {
    sfx('fizz'); aside(pick(EMERGENCY_LINES), 3600); centerMsg('🥤 פחית חירום! מצב רוח 20.', 1800, 'small'); setExpr('neutral', 1500);
  }
  function huff() {
    if (finished) return; finished = true; running = false;
    centerMsg('🥤 אפס. בלי פחית. טוביה הולך הביתה.', 2600, '');
    setTimeout(() => hooks.onHuff && hooks.onHuff(), 2000);
  }
  function showCombo() {
    const tier = Math.min(COMBO_LINES.length - 1, Math.floor(combo / 2) + 1);
    el.combo.innerHTML = `<span class="n">×<bdi>${combo}</bdi></span> ${COMBO_LINES[tier] || COMBO_LINES[2]}`;
    el.combo.classList.remove('show'); void el.combo.offsetWidth; el.combo.classList.add('show');
    if (combo >= 5 && combo % 5 === 0) { sfx('cheer'); }
  }
  function miss(it) {
    const g = tuviaGeom();
    if (it.kind === 'food') {
      if (it.food.kind === 'good' || it.food.kind === 'twist' || it.food.kind === 'drink' || it.food.kind === 'snack') {
        results.missed++; S.state.stats.missed++; combo = 0; el.combo.classList.remove('show');
        crumbs(it.x, H - 6, it.food.c[0], 8, false); sfx('thud');
        if (t > nextMissLineT && Math.random() < .5) { nextMissLineT = t + 9; aside(missPick(), 2800); setExpr('angry', 700); }
      } else if (it.cursed) { aside('הצ\'ולנט ללא גלוטן נפל על הרצפה. הרצפה בסדר. הרצפה לא אוכלת גלוטן גם ככה.', 3200); setExpr('happy', 900); sfx('thud'); }
    } else if (it.kind === 'jackpot') { aside('שאלה תמימה נפלה. לא נשאלה. ככה זה כשמתעסקים עם הצלחת.', 2600); }
    else if (it.kind === 'ingredient') { aside('המרכיב נפל. על הרצפה. חמש שניות לא חלות על צ\'ולנט. אני מרים. לא, הוא כבר הלך.', 3200); setExpr('shocked', 900); ingredientSpawned = false; setTimeout(() => { if (running && !ingredientGot) spawnIngredient(); }, 6000); }
    else if (it.kind === 'cholent') { aside('הצ\'ולנט המושלם. נפל. אני לא יכול לכתוב את זה. (כתבתי.)', 3600); setExpr('shocked', 2000); }
    else if (it.kind === 'answer') { if (items.filter((x) => x.kind === 'answer').length === 0 && quizActive) { quizActive = false; quizDone = true; npcLine('gittel', 'לא ענית. (מנידה ראש) תאכל קוגל בכל זאת.', 3400); } }
  }

  // ---------- disguise ----------
  function setDisguise(d, silent = false) {
    if (!DISGUISES[d] || d === tuvia.dis) return;
    tuvia.dis = d; S.state.disguise = d; S.state.disguiseUses++;
    if (!silent) {
      disguiseUsed = true; if (chId === 'ch1') honest = false;
      sfx('whoosh'); doShake(2, .2); setExpr('smirk', 500);
      const dd = L.disguises && L.disguises[d];
      if (dd && dd.line) setTimeout(() => npcLine(dd.line.who, dd.line.text), 250);
      disguiseSwapT = t; pendingDisguiseJackpot = d;
      hooks.onDisguise && hooks.onDisguise(d);
      centerMsg(`🎭 ${DISGUISES[d].label}`, 1300, 'small');
    }
  }
  function cycleDisguise() { const i = DISGUISE_ORDER.indexOf(tuvia.dis); setDisguise(DISGUISE_ORDER[(i + 1) % DISGUISE_ORDER.length]); }
  function complain() {
    if (!running) return;
    if (!politeMode) { aside(pick(['מתלונן. לאוויר. אף אחד לא מגיש כלום רע כרגע. בכל זאת.', 'אני מתלונן באופן כללי. זה המקצוע.']), 2200); return; }
    complainedThisPhase = true; results.complained++; S.state.complained++;
    say(pick(['זה לא אוכל. זה עשב.', 'קינואה?! יש לי זכויות!', 'סליחה. יש פה משהו עם שומן?']), 2600);
    S.addMood(4); sfx('nu'); setExpr('angry', 1200);
    if (chId === 'ch3') { npcLine('tzofia', '(שתיקה) ...הבנתי. (לוקחת את השעועית חזרה לגינה)', 3800); endPolite('complained'); }
    else { npcLine('tzofia', 'בשולחן שבת?! (גיטל: תן לו קוגל. הוא רזה.)', 3400); endPolite('complained'); }
  }
  function findGoat() {
    if (goatFound) return false;
    goatFound = true; results.goat = true; S.markGoat(chId);
    sfx('goat'); sparkle(L.goat.x * W, L.goat.y * H, 14); aside(L.goat.line, 5000); setExpr('suspicious', 1200);
    centerMsg(`🐐 העז נמצאה (<bdi dir="ltr">${S.state.goatsFound.length}/3</bdi>)`, 1800, 'small');
    return true;
  }

  // ---------- input ----------
  const keys = {};
  function onKey(e) {
    if (!running && !paused) return;
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'ש') { keys.left = e.type === 'keydown'; e.preventDefault(); }
    else if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'ג') { keys.right = e.type === 'keydown'; e.preventDefault(); }
    else if (e.type === 'keydown' && (k === ' ' || k === 'Spacebar')) { e.preventDefault(); if (running) cycleDisguise(); }
    else if (e.type === 'keydown' && (k === 'c' || k === 'C' || k === 'ב')) { complain(); }
    if (e.type === 'keydown') tuvia.tx = null;
  }
  let auto = false;
  function autoTarget() {
    const g = tuviaGeom();
    let best = null, bestScore = -1e9;
    for (const it of items) {
      let v = 0;
      if (it.kind === 'food') { const f = it.food; v = f.kind === 'special' ? 8 : foodMood(f, tuvia.dis); if (f.kind === 'junk') v = -3; }
      else if (it.kind === 'quote') v = 6; else if (it.kind === 'jackpot' || it.kind === 'disguise') v = 15;
      else if (it.kind === 'ingredient' || it.kind === 'cholent') v = 40; else if (it.kind === 'answer') v = it.data.correct ? 30 : -20;
      if (auto === 'polite' && it.kind === 'food' && it.id === 'quinoa' && politeMode) v = 12;
      if (auto === 'glutton' && it.kind === 'food') v = Math.abs(v) + 5;
      if (v <= 0) continue;
      const dy = g.plateY - it.y; if (dy < 0) continue;
      const score = v * 10 - dy * .05 - Math.abs(it.x - tuvia.x) * .02;
      if (score > bestScore) { bestScore = score; best = it; }
    }
    if (best) { const tt = Math.max(.05, (g.plateY - best.y) / Math.max(40, best.vy + 1)); tuvia.tx = clamp(best.x + best.vx * Math.min(tt, 1.2), 40, W - 40); }
    // dodge: if a bad item is about to land on the plate and nothing good is there, step aside
    if (auto !== 'glutton') for (const it of items) { if (it.kind !== 'food' || foodMood(it.food, tuvia.dis) > 0 || (auto === 'polite' && it.id === 'quinoa' && politeMode)) continue; const dy = g.plateY - it.y; if (dy > 0 && dy < 140 * s && Math.abs(it.x - tuvia.x) < tuvia.half + 10 && (!best || Math.abs(best.x - it.x) < 60)) { tuvia.tx = clamp(it.x + (it.x < W / 2 ? 150 : -150) * s, 40, W - 40); } }
  }
  let pointerDown = false;
  function onPointer(e) {
    if (e.type === 'pointerdown') {
      pointerDown = true;
      const r = canvas.getBoundingClientRect(); const x = e.clientX - r.left, y = e.clientY - r.top;
      if (L.goat && Math.hypot(x - L.goat.x * W, y - L.goat.y * H) < 34 * s) { if (findGoat()) return; }
      tuvia.tx = x;
    } else if (e.type === 'pointermove') { if (pointerDown) { const r = canvas.getBoundingClientRect(); tuvia.tx = e.clientX - r.left; } }
    else { pointerDown = false; }
  }
  window.addEventListener('keydown', onKey); window.addEventListener('keyup', onKey);
  canvas.addEventListener('pointerdown', onPointer); window.addEventListener('pointermove', onPointer); window.addEventListener('pointerup', onPointer); window.addEventListener('pointercancel', onPointer);
  window.addEventListener('resize', resize);

  // ---------- rhythm (settlement 7/8) ----------
  function startRhythm() {
    stopRhythm();
    const onBeat = (step, stepsPerBar, bar) => {
      if (!running || paused || !phase || !phase.rhythm) return;
      const groupStart = step === 0 || step === 4 || step === 8;
      if (!groupStart) return;
      const strong = step === 0 || step === 8;
      const th = throwers.find((x) => x.rhythm) || throwers[0];
      th.pulse = 1; pulseDots(step);
      if (strong || bar % 2 === 0) spawnFood(weightedPick(currentWeights()), { thrower: th, speed: 1 });
    };
    const b = audio.getBeat && audio.getBeat();
    if (b && b.playing && b.location === 'settlement' || (b && b.playing && b.segment === 'settlement')) {
      beatUnsub = audio.onStep((info) => {
        if (info.segment !== 'settlement' && info.location !== 'settlement') return;
        if (info.stepsPerBar !== 14) return;
        const delay = Math.max(0, (info.time - audio.now()) * 1000);
        setTimeout(() => onBeat(info.step, info.stepsPerBar, info.bar), delay);
      });
    }
    // internal 7/8 metronome at 140 bpm (fallback when the audio is off, and for the finale's settlement guests)
    let step = 0, bar = 0; const stepMs = 60000 / 140 / 4;
    beatFallback = setInterval(() => { if (!beatUnsub) onBeat(step, 14, bar); else pulseDotsOnly(step); step = (step + 1) % 14; if (step === 0) bar++; }, stepMs);
  }
  function pulseDotsOnly(step) { if (!beatUnsub) pulseDots(step); }
  function pulseDots(step) {
    if (!el.beat.children.length) { el.beat.innerHTML = [0, 1, 2, 3, 4, 5, 6].map((i) => `<i class="${i === 0 || i === 2 || i === 4 ? 'g' : ''}"></i>`).join(''); }
    const beat = Math.floor(step / 2);
    [...el.beat.children].forEach((d, i) => d.classList.toggle('on', i === beat));
  }
  function stopRhythm() { if (beatUnsub) { beatUnsub(); beatUnsub = null; } if (beatFallback) { clearInterval(beatFallback); beatFallback = null; } }

  // ---------- update ----------
  function update(dt) {
    t += dt; elapsed += dt;
    // phases + events
    while (phaseIdx + 1 < L.phases.length && elapsed >= L.phases[phaseIdx + 1].t) enterPhase(phaseIdx + 1);
    for (const ev of L.events) if (!eventsDone.has(ev) && elapsed >= ev.t) { eventsDone.add(ev); runEvent(ev); }
    if (elapsed >= L.duration) return finish();
    // spawning
    if (phase) {
      let rate = phase.rate;
      const d = L.disguises && L.disguises[tuvia.dis];
      if (d && d.double) rate *= 1.4;
      rate *= 1 + Math.min(.5, elapsed / L.duration * .5);     // difficulty curve inside the level
      spawnAcc += rate * dt;
      while (spawnAcc >= 1) { spawnAcc -= 1; spawnFood(weightedPick(currentWeights()), { from: phase.from === 'all' && phase.side ? pick([phase.side, phase.from]) : phase.from, zigzag: Math.random() < .12 }); }
    }
    if (t >= nextQuoteT && quoteIdx < quotes.length) { nextQuoteT = t + rnd(10, 15); const q = quotes[quoteIdx++]; spawnBubble('quote', { ...q, label: '📖 ' + ((CAST[q.who] && CAST[q.who].name) || q.who) }); }
    if (t >= nextJackpotT && jackpotIdx < jackpots.length) { nextJackpotT = t + rnd(30, 42); const j = jackpots[jackpotIdx++]; spawnBubble('jackpot', { ...j, label: '😇 שאלה תמימה' }); aside('שאלה תמימה. זהב. מהר. לפני שהיא נופלת.', 1800); }
    if (pendingDisguiseJackpot && t - disguiseSwapT > 4) { const d = pendingDisguiseJackpot; pendingDisguiseJackpot = null; if (tuvia.dis === d) spawnDisguiseJackpot(d); }
    if (t >= nextAmbientT) { nextAmbientT = t + rnd(20, 28); if (!el.aside.classList.contains('show')) aside(ambientPick(), 4200); }
    // drift −1 / 20 s
    driftAcc += dt; if (driftAcc >= 20) { driftAcc -= 20; const r = S.addMood(-1); if (r.zero) return huff(); if (r.emergency) emergency(); }
    if (S.state.mood <= 100) el.overflow.classList.remove('show');
    // tuvia movement
    const g = tuviaGeom();
    tuvia.half = (70 * s) * (tuvia.knocked > 0 ? .5 : 1);
    const maxV = 560 * s;
    let dir = 0;
    if (keys.left) dir -= 1; if (keys.right) dir += 1;
    if (auto) autoTarget();
    if (dir === 0 && tuvia.tx != null) { const dx = tuvia.tx - tuvia.x; if (Math.abs(dx) > 4) dir = Math.sign(dx) * Math.min(1, Math.abs(dx) / (40 * s)); }
    tuvia.vx += (dir * maxV - tuvia.vx) * Math.min(1, dt * 14);
    const prevX = tuvia.x;
    tuvia.x = clamp(tuvia.x + tuvia.vx * dt, g.w * .3, W - g.w * .3);
    if (Math.abs(tuvia.x - prevX) > .5) { tuvia.run += dt * 12; tuvia.face = tuvia.x > prevX ? 1 : -1; idleT = 0; } else { idleT += dt; if (idleT > 9) { idleT = 0; aside(idlePick(), 3000); setExpr('sleepy', 1600); } }
    if (tuvia.knocked > 0) tuvia.knocked -= dt;
    if (tuvia.exprUntil && t > tuvia.exprUntil) { tuvia.expr = S.moodBand(S.state.mood).expr; tuvia.exprUntil = 0; }
    if (combo > 0 && t > comboT) { combo = 0; el.combo.classList.remove('show'); }
    // items
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      const py = it.y;
      it.vy += it.g * dt; it.x += it.vx * dt; it.y += it.vy * dt; it.rot += it.vrot * dt;
      if (it.zig) it.x += Math.sin(t * it.zig.f + it.zig.p) * it.zig.a * dt;
      if (it.x < it.r) { it.x = it.r; it.vx = Math.abs(it.vx); } if (it.x > W - it.r) { it.x = W - it.r; it.vx = -Math.abs(it.vx); }
      if (it.vy > 0 && py <= g.plateY + 6 && it.y > g.plateY - 10 && Math.abs(it.x - tuvia.x) < tuvia.half + it.r * .45 && tuvia.knocked <= 0) { items.splice(i, 1); onCatch(it); continue; }
      if (it.y > H + it.r + 10) { items.splice(i, 1); miss(it); }
    }
    // goats
    for (let i = goats.length - 1; i >= 0; i--) {
      const gt = goats[i]; gt.x += gt.v * gt.dir * dt;
      if (!gt.hit && Math.abs(gt.x - tuvia.x) < 46 * s) { gt.hit = true; gt.mood = 'shocked'; tuvia.knocked = 1.3; setExpr('shocked', 1300); sfx('goat'); sfx('thud'); doShake(7, .4); aside(pick(['העז נגחה. לא בכעס. באכזבה.', 'נגיחה. בצלחת. העז יודעת בדיוק איפה זה כואב.', 'העז עברה. הצלחת קטנה. גם אני, פתאום.']), 2800); for (let k = 0; k < 2; k++) crumbs(tuvia.x, g.plateY, '#E5B632', 6); }
      if ((gt.dir === 1 && gt.x > W + 100 * s) || (gt.dir === -1 && gt.x < -100 * s)) goats.splice(i, 1);
    }
    // particles
    for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.life -= dt; p.vy += 600 * s * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.life <= 0) parts.splice(i, 1); }
    for (const th of throwers) { th.pulse = Math.max(0, th.pulse - dt * 3); if (th.mouthT && t > th.mouthT) { th.mouth = 'flat'; th.mouthT = 0; } }
    if (shakeT > 0) shakeT -= dt; else shake = 0;
    if (goldT > 0) goldT -= dt;
    hooks.onTick && hooks.onTick({ elapsed, duration: L.duration, combo });
  }

  // ---------- draw ----------
  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    if (shake > 0) ctx.translate(rnd(-shake, shake), rnd(-shake, shake));
    drawBackground();
    drawThrowers();
    const g = tuviaGeom();
    // floor shadow
    ctx.fillStyle = 'rgba(0,0,0,.14)'; ctx.beginPath(); ctx.ellipse(tuvia.x, H - 6, g.w * .55, 9 * s, 0, 0, 7); ctx.fill();
    // goats on the floor
    for (const gt of goats) { const im = goatImg(gt.mood, gt.dir === -1); if (im.ready) ctx.drawImage(im.img, gt.x - 60 * s, H - 8 - 90 * s, 120 * s, 90 * s); }
    drawTuvia(g);
    for (const it of items) drawItem(it);
    for (const p of parts) { ctx.globalAlpha = clamp(p.life * 1.5, 0, 1); ctx.fillStyle = p.c; ctx.beginPath(); if (p.star) { ctx.moveTo(p.x, p.y - p.r); ctx.lineTo(p.x + p.r * .4, p.y); ctx.lineTo(p.x, p.y + p.r); ctx.lineTo(p.x - p.r * .4, p.y); ctx.closePath(); } else ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
    if (goldT > 0) { ctx.fillStyle = `rgba(255,220,120,${Math.min(.28, goldT * .12)})`; ctx.fillRect(0, 0, W, H); }
    if (S.state.mood > 100) { ctx.fillStyle = `rgba(255,170,60,${.08 + .05 * Math.sin(t * 6)})`; ctx.fillRect(0, 0, W, H); }
    ctx.restore();
  }
  function drawTuvia(g) {
    const im = tuviaImg(tuvia.expr, tuvia.dis);
    const x = tuvia.x, top = g.top;
    ctx.save();
    ctx.translate(x, top + g.h);
    if (tuvia.knocked > 0) ctx.rotate(Math.sin(t * 30) * .06);
    // legs
    const moving = Math.abs(tuvia.vx) > 20;
    const swing = moving ? Math.sin(tuvia.run) * 10 * s : 0;
    for (const side of [-1, 1]) {
      const lx = side * 24 * s + (moving ? side * swing * .3 : 0), ly = (moving ? side * swing * .5 : 0);
      ctx.fillStyle = '#1B2034'; ctx.strokeStyle = '#3B2A21'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.roundRect(lx - 13 * s, -4 - ly, 26 * s, g.legs + ly, 5); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#5A3212'; ctx.beginPath(); ctx.roundRect(lx - 16 * s - (side < 0 ? 6 * s : 0), g.legs - 10 * s, 36 * s, 11 * s, 5); ctx.fill(); ctx.stroke();
    }
    ctx.translate(0, -g.h);
    const bob = moving ? Math.abs(Math.sin(tuvia.run)) * 3 * s : Math.sin(t * 2) * 1.5 * s;
    if (im.ready) ctx.drawImage(im.img, -g.w / 2, bob, g.w, g.h);
    else { ctx.fillStyle = '#F7CFAE'; ctx.beginPath(); ctx.arc(0, g.h * .3, g.w * .3, 0, 7); ctx.fill(); }
    // the plate (drawn by the game so it can shrink when the goat hits)
    const py = g.h * 262 / 320 + bob + 6 * s, half = tuvia.half;
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(0, py + 8 * s, half + 4, 12 * s, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = '#3B2A21'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(0, py, half + 2, 13 * s, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = tuvia.dis === 'bneibrak' ? '#17181C' : '#2B3A67'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(0, py, half * .78, 9 * s, 0, 0, 7); ctx.stroke();
    ctx.strokeStyle = '#C0262D'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(0, py, half * .62, 6.5 * s, 0, 0, 7); ctx.stroke();
    ctx.restore();
  }
  function drawItem(it) {
    ctx.save(); ctx.translate(it.x, it.y);
    if (it.glow) { ctx.shadowColor = '#FFD460'; ctx.shadowBlur = 24 + 10 * Math.sin(t * 8); }
    if (it.kind === 'jackpot') { ctx.shadowColor = '#FFC83C'; ctx.shadowBlur = 16; }
    if (it.kind === 'food') { ctx.rotate(it.rot); drawShape(ctx, it.food.shape, it.r, it.food.c); }
    else if (it.kind === 'ingredient') { ctx.rotate(Math.sin(t * 3) * .12); drawShape(ctx, it.data.shape, it.r, it.data.c); }
    else if (it.kind === 'cholent') { ctx.rotate(Math.sin(t * 2) * .08); drawShape(ctx, 'pot', it.r, ['#7A4A1E', '#5A3212', '#E5B632']); }
    else { drawShape(ctx, 'bubble', it.r, it.c); ctx.shadowBlur = 0; ctx.fillStyle = '#3B2A21'; ctx.font = `700 ${it.r * .5}px Rubik, Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'rtl'; ctx.fillText(it.icon + ' ' + (it.kind === 'answer' ? '' : it.kind === 'quote' ? 'ציטוט' : it.kind === 'jackpot' ? 'שאלה' : 'תחפושת'), 0, -it.r * .08); }
    ctx.shadowBlur = 0;
    ctx.restore();
    // label
    const label = it.kind === 'answer' ? it.data.text : it.label;
    if (label) {
      ctx.save(); ctx.font = `${it.kind === 'answer' ? 600 : 500} ${(it.kind === 'answer' ? 13 : 12) * s}px Rubik, Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.direction = 'rtl';
      const tw = ctx.measureText(label).width + 10 * s, ly = it.y + it.r + (it.kind === 'food' ? 4 : 10) * s;
      ctx.fillStyle = it.cursed ? 'rgba(192,38,45,.92)' : it.glow ? 'rgba(229,182,50,.95)' : 'rgba(43,29,20,.78)';
      ctx.beginPath(); ctx.roundRect(it.x - tw / 2, ly - 2 * s, tw, 17 * s, 6); ctx.fill();
      ctx.fillStyle = it.glow ? '#2B1D14' : '#fff'; ctx.fillText(label, it.x, ly);
      ctx.restore();
    }
  }
  function drawThrowers() {
    const size = Math.min(86 * s, W / throwers.length * .92);
    throwers.forEach((th, i) => {
      th.px = th.x * W; th.py = size * .78;
      const im = npcImg(th.id, th.mouth);
      const p = th.pulse;
      ctx.save(); ctx.translate(th.px, size * .5);
      if (th.rhythm && phase && phase.rhythm) { ctx.strokeStyle = `rgba(229,182,50,${.2 + p * .7})`; ctx.lineWidth = 3 + p * 5; ctx.beginPath(); ctx.arc(0, 0, size * .55 + p * 10, 0, 7); ctx.stroke(); }
      ctx.scale(1 + p * .08, 1 - p * .05);
      if (im.ready) ctx.drawImage(im.img, -size / 2, -size / 2, size, size);
      ctx.restore();
      ctx.fillStyle = 'rgba(43,29,20,.75)'; ctx.font = `600 ${11 * s}px Rubik, Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.direction = 'rtl';
      const name = (CAST[th.id] && CAST[th.id].name) || th.id; const tw = ctx.measureText(name).width + 10 * s;
      ctx.beginPath(); ctx.roundRect(th.px - tw / 2, size * 1.0, tw, 15 * s, 5); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillText(name, th.px, size * 1.0 + 1.5 * s);
    });
  }
  function drawBackground() {
    const sc = chapter.scene;
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    if (sc === 'airport') { grad.addColorStop(0, '#EAF2F8'); grad.addColorStop(1, '#D5DEE6'); }
    else if (sc === 'hill') { grad.addColorStop(0, '#9CD3F0'); grad.addColorStop(.6, '#E8F0D8'); grad.addColorStop(1, '#C9B98A'); }
    else if (sc === 'bneibrak') { grad.addColorStop(0, '#2B2A4A'); grad.addColorStop(1, '#5C4A3A'); }
    else { grad.addColorStop(0, '#4A2C3A'); grad.addColorStop(1, '#8A5A3B'); }
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalAlpha = .9;
    if (sc === 'airport') {
      ctx.fillStyle = '#C9D3DC'; for (let x = 0; x < W; x += 90 * s) ctx.fillRect(x, 150 * s, 70 * s, 100 * s);
      ctx.fillStyle = '#2B3A67'; ctx.fillRect(0, 262 * s, W, 26 * s); ctx.fillStyle = '#fff'; ctx.font = `700 ${15 * s}px Rubik, Arial`; ctx.textAlign = 'center'; ctx.direction = 'rtl'; ctx.textBaseline = 'middle'; ctx.fillText('← יציאה · מוניות · חדר צדדי →', W / 2, 275 * s);
      ctx.fillStyle = '#F2C230'; ctx.fillRect(W * .62, 160 * s, W * .3, 80 * s); ctx.fillStyle = '#C0262D'; ctx.font = `700 ${16 * s}px Arial`; ctx.direction = 'ltr'; ctx.fillText('DUTY FREE', W * .77, 200 * s);
      ctx.fillStyle = '#7E8795'; ctx.fillRect(0, H - 40 * s, W, 8 * s); // conveyor belt
      for (let x = 0; x < W; x += 40 * s) { ctx.fillStyle = '#4A4A52'; ctx.fillRect(x + ((t * 40 * s) % (40 * s)), H - 40 * s, 20 * s, 8 * s); }
    } else if (sc === 'hill') {
      ctx.fillStyle = '#B9C98A'; ctx.beginPath(); ctx.moveTo(0, H * .6); ctx.quadraticCurveTo(W * .3, H * .42, W * .6, H * .58); ctx.quadraticCurveTo(W * .8, H * .66, W, H * .5); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
      ctx.fillStyle = '#9BB573'; ctx.beginPath(); ctx.moveTo(0, H * .75); ctx.quadraticCurveTo(W * .5, H * .62, W, H * .74); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
      // caravans
      for (const [cx, cy, cw] of [[W * .14, H * .5, 110], [W * .78, H * .52, 120]]) { ctx.fillStyle = '#F3EAD6'; ctx.strokeStyle = '#3B2A21'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(cx - cw * s / 2, cy, cw * s, 54 * s, 6); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#2B7BBF'; ctx.fillRect(cx - cw * s / 2 + 10 * s, cy + 10 * s, 26 * s, 20 * s); ctx.fillStyle = '#C0262D'; ctx.fillRect(cx - cw * s / 2, cy - 8 * s, cw * s, 8 * s); }
      // sign
      ctx.fillStyle = '#F8F2E2'; ctx.strokeStyle = '#3B2A21'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(W * .5 - 90 * s, H * .4, 180 * s, 40 * s, 6); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#2B1D14'; ctx.font = `700 ${13 * s}px Rubik, Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'rtl'; ctx.fillText('ברוכים הבאים! (בלי גלוטן)', W * .5, H * .4 + 20 * s);
      ctx.fillStyle = '#A9744B'; ctx.fillRect(W * .5 - 3 * s, H * .4 + 40 * s, 6 * s, 50 * s);
    } else if (sc === 'bneibrak') {
      for (let i = 0; i < 6; i++) { const bx = i * W / 5.5, bw = W / 5.8, bh = (160 + (i % 3) * 50) * s; ctx.fillStyle = i % 2 ? '#8A7A6A' : '#A08E7A'; ctx.fillRect(bx, H * .62 - bh, bw, bh); for (let wy = H * .62 - bh + 14 * s; wy < H * .62 - 20 * s; wy += 34 * s) for (let wx = bx + 8 * s; wx < bx + bw - 14 * s; wx += 26 * s) { ctx.fillStyle = Math.random() < .002 ? '#fff' : '#F2C230'; ctx.fillRect(wx, wy, 14 * s, 18 * s); } }
      // pashkevilim
      for (let i = 0; i < 7; i++) { const px = (i * 97 + 20) % (W - 60 * s), py = H * .64 + (i % 2) * 40 * s; ctx.fillStyle = '#F8F2E2'; ctx.fillRect(px, py, 44 * s, 56 * s); ctx.fillStyle = '#17181C'; ctx.fillRect(px + 6 * s, py + 6 * s, 32 * s, 8 * s); ctx.fillRect(px + 6 * s, py + 18 * s, 32 * s, 3 * s); ctx.fillRect(px + 6 * s, py + 26 * s, 32 * s, 3 * s); ctx.fillRect(px + 6 * s, py + 34 * s, 20 * s, 3 * s); }
      // string lights
      ctx.strokeStyle = '#3B2A21'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, 150 * s); ctx.quadraticCurveTo(W / 2, 200 * s, W, 150 * s); ctx.stroke();
      for (let i = 0; i <= 10; i++) { const u = i / 10, lx = u * W, ly = (1 - u) * (1 - u) * 150 * s + 2 * (1 - u) * u * 200 * s + u * u * 150 * s; ctx.fillStyle = ['#F2C230', '#C0262D', '#7FBF9F', '#2B7BBF'][i % 4]; ctx.beginPath(); ctx.arc(lx, ly + 8 * s, 5 * s, 0, 7); ctx.fill(); }
    } else {
      ctx.fillStyle = '#6E4A2A'; ctx.fillRect(0, H * .66, W, 22 * s); ctx.fillStyle = '#fff'; ctx.fillRect(0, H * .66, W, 10 * s);
      for (let i = 0; i < 2; i++) { const cx = W * (.35 + i * .3); ctx.fillStyle = '#DDE2E9'; ctx.fillRect(cx - 4 * s, H * .66 - 48 * s, 8 * s, 48 * s); ctx.fillStyle = '#F2C230'; ctx.beginPath(); ctx.ellipse(cx, H * .66 - 56 * s, 6 * s, 11 * s, 0, 0, 7); ctx.fill(); }
      ctx.strokeStyle = '#E5B632'; ctx.lineWidth = 3 * s; ctx.beginPath(); ctx.arc(W / 2, 150 * s, 50 * s, Math.PI * .15, Math.PI * .85); ctx.stroke();
      for (let i = 0; i < 5; i++) { const a = Math.PI * (.2 + i * .15), lx = W / 2 + Math.cos(a) * 50 * s, ly = 150 * s + Math.sin(a) * 50 * s; ctx.fillStyle = '#FFE8A8'; ctx.beginPath(); ctx.arc(lx, ly + 10 * s, 6 * s, 0, 7); ctx.fill(); }
      ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(0, 0, W, H);
    }
    // the hidden goat (every chapter)
    if (L.goat) {
      const im = goatImg(goatFound ? 'smiling' : 'disappointed', L.goat.x > .5);
      if (im.ready) { ctx.globalAlpha = goatFound ? 1 : .6; ctx.drawImage(im.img, L.goat.x * W - 26 * s, L.goat.y * H - 20 * s, 52 * s, 39 * s); }
    }
    ctx.restore();
  }

  // ---------- loop ----------
  function frame(ts) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const dtRaw = Math.min(.05, (ts - lastTs) / 1000 || 0); lastTs = ts;
    if (!paused) update(dtRaw * timeScale);
    draw();
  }
  function finish() {
    if (finished) return; finished = true; running = false; stopRhythm();
    results.bestCombo = bestCombo; S.state.stats.bestCombo = Math.max(S.state.stats.bestCombo, bestCombo);
    results.cholent = cholentCaught; results.ingredient = ingredientGot;
    hooks.onEnd && hooks.onEnd(results);
  }

  // preload sprites
  for (const e of ['smirk', 'suspicious', 'delighted', 'disgusted', 'shocked', 'writing', 'sleepy', 'happy', 'angry', 'neutral']) for (const d of DISGUISE_ORDER) tuviaImg(e, d);
  for (const th of throwers) for (const m of ['flat', 'open', 'smile']) npcImg(th.id, m);
  for (const m of ['disappointed', 'smiling', 'shocked']) { goatImg(m, false); goatImg(m, true); }

  const api = {
    start() {
      resize(); tuvia.x = W / 2; running = true; paused = false; lastTs = performance.now();
      enterPhase(0); startRhythm();
      raf = requestAnimationFrame(frame);
      hooks.onStart && hooks.onStart();
    },
    pause() { paused = true; stage.classList.add('paused'); },
    resume() { paused = false; lastTs = performance.now(); stage.classList.remove('paused'); },
    isPaused() { return paused; },
    isRunning() { return running; },
    stop() { running = false; stopRhythm(); cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey); window.removeEventListener('pointermove', onPointer); window.removeEventListener('pointerup', onPointer); window.removeEventListener('pointercancel', onPointer); window.removeEventListener('resize', resize); },
    setDisguise, cycleDisguise, complain, findGoat,
    /** demo / test: Tuvia plays himself ('polite' also eats quinoa in the politeness phase) */
    setAuto(v) { auto = v; if (!v) tuvia.tx = null; },
    skip() { elapsed = L.duration; },
    /** test helper: jump the level clock forward (runs events/phases, no spawning avalanche) */
    seek(sec) { elapsed = Math.max(elapsed, sec); },
    debug() { return { elapsed, phase: phase && phase.label, items: items.length, honest, politeMode, politeQuinoa, ingredientGot, goatFound, combo, bestCombo, results }; },
    results,
  };
  return api;
}
