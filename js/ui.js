/* js/ui.js — DOM screens and widgets: HUD, 💭 asides, toasts, notebook, phone, settings, endings
 * gallery, disguise picker, title, world map, chapter card, taxi art, ending screen. No game rules here.
 */
import { tuviaSVG, goatSVG, TUVIA_CSS } from './art/tuvia.js';
import { bidi } from './dialogue.js';
import { INGREDIENTS } from './content/foods.js';
import { WORLD } from './content/maps.js';
import { UI, TITLE, SUBTITLE, TITLE_QUIPS, DISGUISES, ENDINGS, GOAT_PAGE, GOAT_PAGE_TITLE } from './content/text.js';

const $ = (id) => document.getElementById(id);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

export function createUI() {
  const style = document.createElement('style'); style.textContent = TUVIA_CSS; document.head.appendChild(style);
  const screens = ['title', 'card', 'play', 'taxi', 'world', 'ending'];
  let asideTimer = null, asideQueue = [];
  let lastFace = '';

  const api = {
    $,
    show(name) { for (const s of screens) $('screen-' + s).classList.toggle('active', s === name); api.current = name; },
    current: 'title',

    // ---------------- title ----------------
    buildTitle({ hasSave, endingsSeen, onStart, onResume, onEndings, onSettings }) {
      $('title-h1').textContent = TITLE; $('title-sub').textContent = SUBTITLE;
      $('title-quip').textContent = '"' + TITLE_QUIPS[Math.floor(Math.random() * TITLE_QUIPS.length)] + '"';
      $('title-art').innerHTML = tuviaSVG({ pose: 'stand', expression: 'smirk', size: 260, id: 'ttl', table: false });
      $('btn-start').textContent = UI.start; $('btn-resume').textContent = UI.resume; $('btn-resume').hidden = !hasSave;
      $('btn-endings').textContent = '🏁 ' + UI.endings; $('btn-settings').textContent = '⚙️ ' + UI.settings;
      $('back-link').textContent = UI.back;
      $('controls-hint').textContent = (document.body.classList.contains('touch') ? UI.controlsMobile : UI.controls);
      const g = $('gallery'); g.innerHTML = '';
      for (const e of ENDINGS) { const d = el('div', 'g' + (endingsSeen.includes(e.id) ? '' : ' locked'), e.emoji); d.title = endingsSeen.includes(e.id) ? e.name : e.hint; g.appendChild(d); }
      $('btn-start').onclick = onStart; $('btn-resume').onclick = onResume; $('btn-endings').onclick = onEndings; $('btn-settings').onclick = onSettings;
      const goat = $('title-goat'); goat.innerHTML = goatSVG({ size: 90 });
      const lines = ['מעניין.', 'העז מסתכלת עליי. אני מסתכל על העז. שנינו יודעים את האמת.', 'היא לא מאוכזבת ממך. היא מאוכזבת מכולם.', 'נו.', 'גם במסך הפתיחה. גם לפה היא הגיעה.'];
      let n = 0; goat.onclick = () => { $('title-quip').textContent = '💭 ' + lines[n++ % lines.length]; goat.classList.add('poked'); setTimeout(() => goat.classList.remove('poked'), 400); api.onGoatPoke && api.onGoatPoke(); };
      const art = $('title-art'); art.onpointerenter = () => { const s = art.querySelector('svg'); s.classList.add('anim-laugh', 'anim-glint'); setTimeout(() => s.classList.remove('anim-laugh', 'anim-glint'), 1400); };
    },

    // ---------------- HUD ----------------
    updateHUD(st, band, chapterChecks) {
      const s = st.s;
      const key = band.expr + ':' + s.disguise;
      if (key !== lastFace) { lastFace = key; $('hud-face-svg').innerHTML = tuviaSVG({ expression: band.expr, crop: 'head', size: 64, disguise: s.disguise, id: 'hud' }); }
      $('mood-fill').style.width = Math.min(100, s.mood / s.moodCap * 100) + '%';
      $('mood-label').textContent = (s.mood > 100 ? UI.moodDrunk + ' · ' : '') + band.emoji + ' ' + band.label;
      $('pages-n').textContent = s.pages;
      const ing = $('hud-ing');
      if (ing.childElementCount !== INGREDIENTS.length) { ing.innerHTML = ''; for (const i of INGREDIENTS) { const sp = el('span', '', ''); sp.dataset.id = i.id; ing.appendChild(sp); } }
      INGREDIENTS.forEach((i, k) => { const sp = ing.children[k]; const got = s.ingredients.includes(i.id); sp.className = i.locked ? 'locked' : got ? 'got' : 'empty'; sp.textContent = ({ pot: '🍲', barley: '🌾', beans: '🫘', kishke: '🌭', baharat: '🧂', fire: '🔥', potato: '🥔' })[i.id]; sp.title = i.locked ? i.name + ' (בקרוב)' : got ? i.name + ' ✓' : i.name + ' — ' + i.from; });
      const ck = $('hud-check');
      ck.innerHTML = ''; if (chapterChecks) { for (const [k, v] of Object.entries(chapterChecks)) { const sp = el('span', v.done ? 'done' : '', v.icon + ' ' + v.label); ck.appendChild(sp); } }
      $('cola-n').textContent = s.inventory.cola; $('rug-n').textContent = s.inventory.rugelach;
      $('btn-cola').disabled = !s.inventory.cola; $('btn-rug').disabled = !s.inventory.rugelach;
      $('disguise-tag').textContent = '🎭 ' + DISGUISES.find((d) => d.id === s.disguise).label;
    },
    bumpFace() { const f = $('hud-face-svg'); f.classList.remove('bump'); void f.offsetWidth; f.classList.add('bump'); },
    pulsePhone(on) { $('btn-phone').classList.toggle('pulse', !!on); $('btn-phone').disabled = false; },

    // ---------------- asides / toasts / prompt ----------------
    aside(text, ms = 4600) {
      const a = $('aside');
      clearTimeout(asideTimer);
      a.hidden = false; a.classList.remove('fade'); a.innerHTML = bidi(text);
      asideTimer = setTimeout(() => { a.classList.add('fade'); asideTimer = setTimeout(() => { a.hidden = true; }, 500); }, ms);
    },
    toast(text, cls = '') { const box = $('toasts'); while (box.children.length >= 3) box.firstChild.remove(); const t = el('div', 'toast ' + cls, bidi(text)); box.appendChild(t); setTimeout(() => t.remove(), 2800); },
    foodToast(food, delta, iconURL) {
      const t = el('div', 'toast food ' + (food.kind === 'bad' ? 'bad' : ''));
      t.innerHTML = `${iconURL ? `<img src="${iconURL}" alt="">` : ''}<span class="fname">${bidi(food.name)} <span class="fdelta ${delta >= 0 ? 'up' : 'down'}">${delta >= 0 ? '+' : ''}${delta}</span></span><span class="fverdict">${bidi(food.verdict)}</span>`;
      const box = $('toasts'); for (const old of [...box.querySelectorAll('.toast.food')].slice(0, -1)) old.remove(); while (box.children.length >= 3) box.firstChild.remove(); box.appendChild(t); setTimeout(() => t.remove(), 4300);
    },
    prompt(html) { const p = $('prompt'); if (!html) { p.hidden = true; return; } p.hidden = false; p.innerHTML = html; },
    rushTimer(text) { const r = $('rush'); if (text == null) { r.hidden = true; return; } r.hidden = false; r.textContent = text; },

    // ---------------- modals ----------------
    openModal(id) { $(id).hidden = false; document.body.classList.add('modal-open'); },
    closeModals() { for (const m of document.querySelectorAll('.modal')) m.hidden = true; document.body.classList.remove('modal-open'); },
    anyModal() { return [...document.querySelectorAll('.modal')].some((m) => !m.hidden); },
    confirm(title, text, yes, no) {
      return new Promise((res) => {
        $('confirm-title').textContent = title; $('confirm-text').innerHTML = bidi(text);
        $('confirm-yes').textContent = yes; $('confirm-no').textContent = no;
        $('confirm-yes').onclick = () => { api.closeModals(); res(true); };
        $('confirm-no').onclick = () => { api.closeModals(); res(false); };
        api.openModal('modal-confirm');
      });
    },

    notebook(st, chapterTitles) {
      const s = st.s; $('nb-title').textContent = UI.notebookTitle;
      $('nb-stats').innerHTML = `<span>📖 ${s.pages} עמודים (יעד: 100)</span><span>🥄 ${s.ingredients.length}/3 מרכיבים</span><span>🐐 ${s.goatFound.length}/3 עזים</span><span>📱 ${s.isiCalled.length}/3 שיחות</span><span>🥗 ${s.badEaten} "בריא" · 🍲 ${s.goodEaten} טוב</span>`;
      const box = $('nb-pages'); box.innerHTML = '';
      if (!s.notebook.length) box.appendChild(el('div', 'nb-empty', bidi(UI.notebookEmpty)));
      let last = null;
      for (const q of s.notebook) {
        if (q.chapter !== last) { last = q.chapter; box.appendChild(el('div', 'nb-chapter', q.chapter ? (chapterTitles[q.chapter] || q.chapter) : 'במונית של משה')); }
        const row = el('div', 'nb-q');
        row.innerHTML = `<div><span class="quote">${bidi(q.quote)}</span><span class="who">${q.who ? bidi(q.who) + ' · ' : ''}<span class="pg">📖 +${q.pages}</span></span></div><div class="margin ${q.pencil ? 'pencil' : ''}">${bidi(q.margin)}${q.pencil ? ' <small>(בעיפרון)</small>' : ''}</div>`;
        box.appendChild(row);
      }
      if (s.goatFound.length >= 3) { const sec = el('div', 'nb-secret', `<b>🐐 ${GOAT_PAGE_TITLE}</b><br>${bidi(GOAT_PAGE)}`); box.appendChild(sec); }
      api.openModal('modal-notebook');
    },

    phone(lines, onDone) {
      const chat = $('phone-chat'); chat.innerHTML = ''; let i = 0;
      const btn = $('phone-next');
      const step = () => {
        if (i >= lines.length) { api.closeModals(); btn.onclick = null; onDone && onDone(); return; }
        const raw = lines[i++];
        const kind = raw.startsWith('I:') ? 'isi' : raw.startsWith('T:') ? 'tuvia' : 'aside';
        const text = raw.replace(/^(I:|T:|~)\s*/, '');
        chat.appendChild(el('div', 'msg ' + kind, (kind === 'aside' ? '💭 ' : '') + bidi(text)));
        chat.scrollTop = chat.scrollHeight;
        btn.textContent = i >= lines.length ? UI.close : UI.cont;
      };
      btn.onclick = step; api.openModal('modal-phone'); step();
    },

    settings(meta, onChange, onClearSave) {
      const b = $('settings-body'); b.innerHTML = '';
      const sp = el('div'); sp.innerHTML = `<div>${UI.settingsText}</div>`; const seg = el('div', 'seg');
      for (const [id, label] of UI.speeds) { const bt = el('button', meta.textSpeed === id ? 'on' : '', label); bt.onclick = () => { onChange({ textSpeed: id }); [...seg.children].forEach((c) => c.classList.remove('on')); bt.classList.add('on'); }; seg.appendChild(bt); }
      sp.appendChild(seg); b.appendChild(sp);
      const mute = el('label'); mute.innerHTML = `<input type="checkbox" ${meta.muted ? 'checked' : ''}> ${UI.settingsMute} <kbd>M</kbd>`; mute.querySelector('input').onchange = (e) => onChange({ muted: e.target.checked }); b.appendChild(mute);
      const con = el('label'); con.innerHTML = `<input type="checkbox" ${meta.contrast ? 'checked' : ''}> ${UI.settingsContrast}`; con.querySelector('input').onchange = (e) => onChange({ contrast: e.target.checked }); b.appendChild(con);
      b.appendChild(el('div', 'help', UI.controls + '<br>' + UI.controlsMobile));
      const clr = el('button', 'btn', '🗑 מחק שמירה'); clr.onclick = () => { onClearSave(); clr.textContent = 'נמחק. גם הקוגל.'; }; b.appendChild(clr);
      api.openModal('modal-settings');
    },

    endingsGallery(seen) {
      const g = $('endings-grid'); g.innerHTML = '';
      for (const e of ENDINGS) { const ok = seen.includes(e.id); g.appendChild(el('div', 'ecard' + (ok ? '' : ' locked'), `<div class="ee">${e.emoji}</div><div><b>${ok ? e.name : '???'}</b><small>${ok ? bidi(e.cond) : bidi(e.hint)}</small></div>`)); }
      api.openModal('modal-endings');
    },

    disguisePicker(current, onPick) {
      const g = $('disguise-grid'); g.innerHTML = '';
      DISGUISES.forEach((d, i) => {
        const c = el('button', 'dcard' + (d.id === current ? ' on' : ''));
        c.innerHTML = `${tuviaSVG({ disguise: d.id, crop: 'head', size: 60, id: 'dp' + i })}<div><b>${d.icon} ${d.label}</b><small>${bidi(d.line)}</small></div>`;
        c.onclick = () => { api.closeModals(); onPick(d.id); };
        g.appendChild(c);
      });
      api.openModal('modal-disguise');
    },

    // ---------------- chapter card ----------------
    chapterCard({ n, title, subtitle, shot, aside, onGo }) {
      $('card-n').textContent = n; $('card-title').textContent = title; $('card-sub').textContent = subtitle;
      const box = $('card-shot'); box.innerHTML = ''; if (shot) box.appendChild(shot);
      $('card-aside').innerHTML = bidi(aside);
      $('card-go').onclick = onGo;
      api.show('card');
    },

    // ---------------- taxi ----------------
    taxi(meter) {
      $('taxi-meter').innerHTML = 'המונה: <bdi>' + meter + ' ₪</bdi>';
      $('taxi-art').innerHTML = `<svg viewBox="0 0 420 200" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="210" cy="178" rx="190" ry="14" fill="rgba(0,0,0,.25)"/>
        <path d="M40 150 L60 95 Q70 78 100 76 L270 76 Q300 78 330 108 L390 120 Q405 126 404 150 Z" fill="#F2C230" stroke="#2B1D14" stroke-width="4" stroke-linejoin="round"/>
        <path d="M110 82 L120 60 Q125 50 140 50 L250 50 Q268 50 280 62 L300 82 Z" fill="#F2C230" stroke="#2B1D14" stroke-width="4" stroke-linejoin="round"/>
        <path d="M130 80 L138 60 L195 60 L195 80 Z M205 80 L205 60 L252 60 Q262 62 268 70 L278 80 Z" fill="#B7D4E8" stroke="#2B1D14" stroke-width="3"/>
        <rect x="160" y="34" width="80" height="18" rx="5" fill="#fff" stroke="#2B1D14" stroke-width="3"/><text x="200" y="48" font-family="Rubik" font-size="13" font-weight="700" text-anchor="middle" fill="#2B1D14">מונית</text>
        <rect x="40" y="128" width="364" height="10" fill="#1F1A16" opacity=".25"/>
        <g><circle cx="110" cy="152" r="26" fill="#1F1A16"/><circle cx="110" cy="152" r="13" fill="#9AA0AA"/><circle cx="320" cy="152" r="26" fill="#1F1A16"/><circle cx="320" cy="152" r="13" fill="#9AA0AA"/></g>
        <g transform="translate(150 78)"><circle cx="0" cy="-10" r="13" fill="#E3AE88" stroke="#2B1D14" stroke-width="3"/><path d="M-8 -14 q8 -12 16 0" fill="#E3AE88"/><path d="M-6 -4 q6 -4 12 0" stroke="#2B1D14" stroke-width="3" fill="none"/><circle cx="-4" cy="-12" r="1.6" fill="#2B1D14"/><circle cx="4" cy="-12" r="1.6" fill="#2B1D14"/>
          <path d="M-14 2 Q-30 10 -42 28" stroke="#2B1D14" stroke-width="12" stroke-linecap="round" fill="none"/><path d="M-14 2 Q-30 10 -42 28" stroke="#E8B923" stroke-width="7" stroke-linecap="round" fill="none"/><circle cx="-43" cy="30" r="6" fill="#E3AE88" stroke="#2B1D14" stroke-width="2"/></g>
        <g transform="translate(236 78)"><circle cx="0" cy="-10" r="12" fill="#F7CFAE" stroke="#2B1D14" stroke-width="3"/><path d="M-9 -16 q9 -10 18 0" fill="#D9C48A"/><circle cx="-4" cy="-10" r="4.5" fill="none" stroke="#C0262D" stroke-width="2.5"/><circle cx="5" cy="-10" r="4.5" fill="none" stroke="#C0262D" stroke-width="2.5"/><path d="M-3 -3 q4 3 8 -1" stroke="#2B1D14" stroke-width="2" fill="none"/></g>
      </svg>`;
      api.show('taxi');
    },

    // ---------------- world map ----------------
    worldMap({ visited, finaleReady, onPick }) {
      $('world-title').textContent = UI.worldTitle; $('world-hint').textContent = UI.worldHint;
      const m = $('world-map'); m.innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs><pattern id="sea" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 3 q1.5 -1.5 3 0 t3 0" stroke="rgba(255,255,255,.35)" fill="none" stroke-width=".5"/></pattern></defs>
        <rect width="100" height="100" fill="#B7D4E8"/><rect width="100" height="100" fill="url(#sea)"/>
        <path d="M30 8 Q50 4 82 12 L96 40 Q88 70 76 92 L56 98 Q46 82 42 60 Q34 50 31 44 Q27 30 30 8 Z" fill="#DCCB98" stroke="#A9744B" stroke-width="1"/>
        <path d="M44 44 Q60 36 74 40 Q80 54 66 70 Q50 68 44 44 Z" fill="#C9B98A" opacity=".8"/>
        <path d="M31 44 Q37 48 42 60" stroke="#8DB7D8" stroke-width="3" fill="none"/>
        <ellipse cx="60" cy="76" rx="5" ry="8" fill="#8DB7D8"/>
        <text x="20" y="60" font-size="4" fill="#2B3A67" opacity=".7" font-family="Rubik">הים</text>
        <text x="4" y="32" font-size="3.4" fill="#2B3A67" opacity=".7" font-family="Rubik">↖ אירופה (רחוק)</text>
      </svg>`;
      for (const w of WORLD) {
        const b = el('button', 'pin' + (w.locked ? ' locked' : '') + (visited.includes(w.id) ? ' done' : '') + (w.finale ? ' finale' + (finaleReady ? '' : ' locked') : ''));
        b.style.left = w.x + '%'; b.style.top = w.y + '%';
        b.innerHTML = `<div class="pe"><span>${w.emoji}</span></div><div class="pl">${w.label}</div>`;
        b.onclick = () => onPick(w);
        m.appendChild(b);
      }
      $('world-line').textContent = '';
      api.show('world');
    },
    worldLine(t) { $('world-line').innerHTML = bidi(t); },

    // ---------------- ending ----------------
    endingScreen(e, { onTitle, onAgain }) {
      const sc = $('screen-ending'); sc.classList.toggle('horror', !!e.horror);
      $('ending-title').textContent = e.emoji + ' ' + e.name;
      $('ending-art').innerHTML = tuviaSVG({ expression: e.expr, pose: e.id === 'healthy' ? 'stand' : 'listen', size: 220, id: 'end' });
      $('ending-book').innerHTML = `<small>הספר:</small>${bidi(e.book)}`;
      $('ending-cond').textContent = e.cond;
      $('ending-buttons').hidden = true;
      $('ending-title-btn').onclick = onTitle; $('ending-again').onclick = onAgain;
      api.show('ending');
    },
    endingButtons() { $('ending-buttons').hidden = false; },

    // ---------------- joystick ----------------
    joystick(onMove) {
      const j = $('joystick'), k = j.querySelector('.knob'); let id = null; const R = 44;
      const set = (dx, dy) => { k.style.transform = `translate(${dx}px, ${dy}px)`; onMove(dx / R, dy / R); };
      j.addEventListener('pointerdown', (e) => { id = e.pointerId; j.setPointerCapture(id); move(e); });
      const move = (e) => { if (e.pointerId !== id) return; const r = j.getBoundingClientRect(); let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2); const d = Math.hypot(dx, dy); if (d > R) { dx = dx / d * R; dy = dy / d * R; } set(dx, dy); };
      j.addEventListener('pointermove', move);
      const end = (e) => { if (e.pointerId !== id) return; id = null; set(0, 0); };
      j.addEventListener('pointerup', end); j.addEventListener('pointercancel', end);
    },
  };
  for (const b of document.querySelectorAll('[data-close]')) b.addEventListener('click', () => api.closeModals());
  for (const m of document.querySelectorAll('.modal')) m.addEventListener('click', (e) => { if (e.target === m && m.id !== 'modal-confirm' && m.id !== 'modal-phone') api.closeModals(); });
  return api;
}
