/* js/minigames/kiddush.js — "קידוש ספיד": eat as much kugel as possible before the gabbai counts to ten.
 * Button mash. Shmerel pours vodka (don't tap it). The count sometimes restarts at nine: the minyan is short.
 */
import { el, frame, say, think, keys, pick, rand } from './common.js';

export const id = 'kiddush';

export function run(host, ctx) {
  const C = ctx.content;
  const f = frame(host, { cls: 'mg-kiddush' });
  return new Promise((resolve) => {
    let finished = false, pieces = 0, count = 0, restarts = 0, stunned = false;
    const saidAt = new Set();
    f.status.innerHTML = `<span class="mg-title">${C.icon} ${C.title}</span>`;
    const countEl = el('div', 'kd-count', '<b>הגבאי:</b> <span class="kd-num">—</span>');
    const piecesEl = el('div', 'kd-pieces', 'קוגל: <bdi>0</bdi>');
    f.status.append(countEl, piecesEl);
    say(f.npc, 'רבותי! יש מניין? סופרים!', 'gabbai');
    think(f.aside, 'הגבאי סופר. אני אוכל. מי שמהיר יותר, צודק.');

    const arena = el('div', 'kd-arena');
    const kugel = el('button', 'kd-kugel', `<span class="kd-kugel-art">🟫</span><span class="kd-kugel-label">קוגל!</span>`);
    kugel.type = 'button';
    const crumbs = el('div', 'kd-crumbs');
    arena.append(kugel, crumbs);
    f.main.append(arena);

    function eat(e) {
      if (finished || stunned) return;
      if (e && e.pointerType === 'mouse' && e.button !== 0) return;
      pieces++;
      piecesEl.innerHTML = `קוגל: <bdi>${pieces}</bdi>`;
      kugel.classList.remove('bite'); void kugel.offsetWidth; kugel.classList.add('bite');
      const c = el('span', 'kd-crumb', '🟫'); c.style.left = rand(10, 90) + '%'; c.style.top = rand(20, 80) + '%'; crumbs.appendChild(c); setTimeout(() => c.remove(), 600);
      if (pieces % 3 === 0) ctx.audio.playSfx(pieces % 9 === 0 ? 'burp' : 'crunch');
      for (const a of C.tuvia) if (pieces >= a.at && !saidAt.has(a.at)) { saidAt.add(a.at); think(f.aside, a.t); }
    }
    kugel.addEventListener('pointerdown', (e) => { e.preventDefault(); eat(e); });
    const unbind = keys({ ' ': () => eat(), Enter: () => eat(), ArrowUp: () => eat() });

    // vodka glasses
    let vodkaTimer = 0;
    function vodka() {
      if (finished) return;
      const g = el('button', 'kd-vodka', '🥃');
      g.type = 'button';
      g.style.left = rand(8, 80) + '%'; g.style.top = rand(10, 70) + '%';
      g.addEventListener('pointerdown', (e) => {
        e.preventDefault(); e.stopPropagation();
        if (finished) return;
        pieces = Math.max(0, pieces - 2); piecesEl.innerHTML = `קוגל: <bdi>${pieces}</bdi>`;
        stunned = true; kugel.classList.add('stunned'); setTimeout(() => { stunned = false; kugel.classList.remove('stunned'); }, 500);
        say(f.npc, pick(C.shmerel), 'shmerel'); think(f.aside, C.vodkaHit); ctx.audio.playSfx('fizz');
        g.remove();
      });
      arena.appendChild(g);
      setTimeout(() => g.remove(), 1000);
      vodkaTimer = setTimeout(vodka, rand(1200, 2600));
    }
    vodkaTimer = setTimeout(vodka, 1500);

    // the gabbai
    let countTimer = 0;
    function tick() {
      if (finished) return;
      if (count === 9 && restarts < 2 && Math.random() < C.restartChance) {
        restarts++; count = 0;
        say(f.npc, pick(C.restart), 'gabbai'); ctx.audio.playSfx('nu');
        countEl.innerHTML = `<b>הגבאי:</b> <span class="kd-num restart">9 → 1</span>`;
        countTimer = setTimeout(tick, C.countMs * 1.3);
        return;
      }
      count++;
      countEl.innerHTML = `<b>הגבאי:</b> <span class="kd-num">${C.gabbai[count - 1]}</span>`;
      ctx.audio.playSfx(count === 10 ? 'cheer' : 'click');
      if (count >= 10) { finish(); return; }
      countTimer = setTimeout(tick, C.countMs);
    }
    countTimer = setTimeout(tick, 900);

    function finish(forced) {
      if (finished) return;
      finished = true;
      clearTimeout(countTimer); clearTimeout(vodkaTimer); unbind();
      arena.querySelectorAll('.kd-vodka').forEach((g) => g.remove());
      if (forced != null) pieces = forced ? Math.max(pieces, C.target + 5) : Math.min(pieces, 3);
      const win = pieces >= C.target;
      say(f.npc, 'עשרה! יש מניין! קידוש!', 'gabbai');
      think(f.aside, win ? 'הגבאי הגיע לעשר. אני הגעתי ל-' + pieces + '. ניצחתי.' : 'הגבאי ניצח. הגבאי תמיד מנצח. זאת העבודה שלו.');
      ctx.audio.playSfx(win ? 'tada' : 'sigh');
      const mood = Math.min(C.moodMax, pieces * C.moodPerPiece);
      setTimeout(() => resolve({ win, pieces, restarts, mood }), 1200);
    }
    ctx.control({ finish: (win) => finish(!!win) });
  });
}
