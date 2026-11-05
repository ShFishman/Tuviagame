/* js/game/comic.js — comic-strip panels with speech balloons, 💭 clouds and caption cards.
 *   runComic(container, panels, { speed, onDone, extraButtons, chapterClass }) → { skip, destroy }
 * Panels accumulate as a strip; tap / "המשך" reveals the next one; the text types itself. */
import { tuviaSVG } from '../art/tuvia.js';
import { npcSVG } from '../art/npcs.js';
import { CAST } from '../content/chapters.js';

const TUVIA_EXPR_FOR = { halo: 'smirk', default: 'smirk' };

export function runComic(container, panels, opts = {}) {
  const speed = opts.speed || 1;
  container.innerHTML = '';
  const strip = document.createElement('div'); strip.className = 'strip'; container.appendChild(strip);
  const bar = document.createElement('div'); bar.className = 'strip-bar';
  const next = document.createElement('button'); next.className = 'btn primary'; next.textContent = 'המשך ›';
  const skip = document.createElement('button'); skip.className = 'btn ghost'; skip.textContent = '⏩ דלג';
  bar.appendChild(next);
  (opts.extraButtons || []).forEach((b) => bar.appendChild(b));
  bar.appendChild(skip);
  container.appendChild(bar);

  let i = 0, typing = null, done = false, destroyed = false;
  function panelEl(p, idx) {
    const d = document.createElement('div');
    d.style.animationDelay = '0s';
    if (p.card) { d.className = 'panel card'; d.innerHTML = `<div class="card-text"></div>`; return d; }
    if (p.aside) { d.className = 'panel aside'; d.innerHTML = `<div class="panel-art">${tuviaSVG({ pose: 'listen', expression: p.expr || 'suspicious', crop: 'bust', size: 120, table: false, id: 'cm' + idx })}</div><div class="cloud">💭 <span class="txt"></span></div>`; return d; }
    const who = p.who;
    const isTuvia = who === 'tuvia';
    const name = isTuvia ? 'טוביה' : (CAST[who] ? CAST[who].name : who);
    const role = !isTuvia && CAST[who] && CAST[who].role ? `<small>${CAST[who].role}</small>` : '';
    const art = isTuvia
      ? tuviaSVG({ pose: p.halo ? 'listen' : 'stand', expression: p.expr || (p.halo ? 'smirk' : 'neutral'), disguise: p.disguise || 'none', crop: 'bust', size: 120, table: false, id: 'cm' + idx })
      : npcSVG(CAST[who] ? who : 'generic', { size: 120, mouth: 'open' });
    d.className = `panel ${isTuvia ? 'tuvia' : 'npc'} who-${who}`;
    d.innerHTML = `<div class="panel-art" style="--c:${(CAST[who] && CAST[who].color) || '#9AA0AA'}">${art}</div><div class="balloon ${p.halo ? 'halo' : ''}"><b class="name">${p.halo ? '😇 ' : ''}${name}${p.halo ? ' <small>(שאלה תמימה)</small>' : role}</b><p class="txt"></p></div>`;
    return d;
  }
  function typeText(el, text, cb) {
    const chars = [...text]; let k = 0; el.textContent = '';
    if (speed >= 3) { el.textContent = text; cb && cb(); return; }
    const per = 22 / speed;
    const id = setInterval(() => { k += 1; el.textContent = chars.slice(0, k).join(''); if (k >= chars.length) { clearInterval(id); typing = null; cb && cb(); } }, per);
    typing = { id, el, text, cb };
  }
  function reveal() {
    if (destroyed) return;
    if (typing) { const tp = typing; clearInterval(tp.id); typing = null; tp.el.textContent = tp.text; tp.cb && tp.cb(); return; }
    if (i >= panels.length) { finish(); return; }
    const p = panels[i++];
    const d = panelEl(p, i);
    strip.appendChild(d);
    strip.querySelectorAll('.panel').forEach((x) => x.classList.remove('latest'));
    d.classList.add('latest');
    const txt = d.querySelector('.txt, .card-text');
    typeText(txt, p.card || p.aside || p.text, () => { if (i >= panels.length) { next.textContent = opts.doneLabel || 'הלאה ›'; next.classList.add('pulse'); } });
    requestAnimationFrame(() => { d.scrollIntoView({ block: 'end', behavior: 'smooth' }); });
  }
  function finish() { if (done) return; done = true; opts.onDone && opts.onDone(); }
  next.addEventListener('click', reveal);
  strip.addEventListener('click', (e) => { if (e.target.closest('button')) return; reveal(); });
  skip.addEventListener('click', () => { if (typing) { clearInterval(typing.id); typing = null; } finish(); });
  const onKey = (e) => { if (e.key === 'Enter' || e.key === ' ') { if (document.activeElement && document.activeElement.tagName === 'BUTTON' && document.activeElement !== next) return; e.preventDefault(); reveal(); } };
  window.addEventListener('keydown', onKey);
  reveal();
  return {
    skip: () => { if (typing) { clearInterval(typing.id); typing = null; } finish(); },
    destroy: () => { destroyed = true; if (typing) clearInterval(typing.id); window.removeEventListener('keydown', onKey); },
  };
}

/** Isi's phone call: a phone UI that slides in. Returns a promise resolved when hung up. */
export function isiCall(root, isi, opts = {}) {
  return new Promise((resolve) => {
    const d = document.createElement('div'); d.className = 'phone-wrap';
    const lines = [
      { who: 'isi', text: isi.line },
      isi.reply ? { who: 'tuvia', text: isi.reply } : null,
      isi.reply2 || null,
      isi.reply3 ? { who: 'tuvia', text: isi.reply3 } : null,
      { who: 'isi', text: isi.hint, hint: true },
    ].filter(Boolean);
    d.innerHTML = `<div class="phone"><div class="phone-top"><span class="ring">📱</span> איזי · ניו יורק</div>
      <div class="phone-art">${npcSVG('isi', { size: 110, mouth: 'open' })}</div>
      <div class="phone-lines"></div>
      <div class="phone-bar"><button class="btn primary phone-next">…</button><button class="btn ghost phone-hang">לנתק 📴</button></div></div>`;
    root.appendChild(d);
    const box = d.querySelector('.phone-lines'); const nextB = d.querySelector('.phone-next'); const hang = d.querySelector('.phone-hang');
    let k = 0;
    const step = () => {
      if (k >= lines.length) { close(); return; }
      const l = lines[k++];
      const row = document.createElement('div'); row.className = `pl ${l.who} ${l.hint ? 'hint' : ''}`;
      row.innerHTML = `<b>${l.who === 'isi' ? 'איזי' : 'טוביה'}:</b> ${l.hint ? '💡 ' : ''}${l.text}`;
      box.appendChild(row); row.scrollIntoView({ block: 'end' });
      nextB.textContent = k >= lines.length ? 'ביי, איזי' : '…';
    };
    const close = () => { d.classList.add('out'); setTimeout(() => { d.remove(); resolve(); }, 320); };
    nextB.addEventListener('click', step); hang.addEventListener('click', close);
    requestAnimationFrame(() => d.classList.add('in'));
    step();
  });
}
