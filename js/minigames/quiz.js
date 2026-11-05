/* js/minigames/quiz.js — "מבחן הרבנית": 4 questions on Haredi life. Gittel's eyes narrow with each wrong answer. */
import { el, frame, say, think, keys, shuffle } from './common.js';
import { gittelNarrow } from '../art/npcs.js';

export const id = 'quiz';

export function run(host, ctx) {
  const C = ctx.content;
  const f = frame(host, { cls: 'mg-quiz' });
  return new Promise((resolve) => {
    let finished = false;
    const bb = ctx.state.disguise === 'bneibrak';
    const needed = bb ? C.needed - 1 : C.needed;
    const qs = shuffle(C.pool).slice(0, C.count).map((q) => ({ ...q, options: shuffle(q.a.map((t, i) => ({ t, ok: i === 0 }))) }));
    let i = 0, correct = 0, wrong = 0, locked = false;

    f.status.innerHTML = `<span class="mg-title">${C.icon} ${C.title}</span><span class="qz-score">שאלה <bdi>1</bdi>/<bdi>${C.count}</bdi> · נכון: <bdi>0</bdi></span>`;
    const scoreEl = f.status.querySelector('.qz-score');
    const portrait = el('div', 'qz-gittel', gittelNarrow(0, 150));
    const card = el('div', 'qz-card');
    f.main.append(portrait, card);
    say(f.npc, bb ? 'אתה מבני ברק? נראה. גם בני ברק שוכחים.' : 'נראה אם אתה מפה או מהטלוויזיה.', 'gittel');
    think(f.aside, 'ארבע שאלות. קישקע אחד. הימור בטוח: אני יודע את התשובות. ידעתי. פעם.');

    function render() {
      const q = qs[i];
      card.innerHTML = `<div class="qz-q">${q.q}</div>`;
      const opts = el('div', 'qz-opts');
      q.options.forEach((o, k) => {
        const b = el('button', 'btn qz-opt', `<span class="qz-n"><bdi>${k + 1}</bdi></span><span>${o.t}</span>`);
        b.type = 'button';
        b.addEventListener('click', () => answer(k));
        opts.appendChild(b);
      });
      card.appendChild(opts);
      locked = false;
    }
    function answer(k) {
      if (locked || finished) return;
      locked = true;
      const q = qs[i], o = q.options[k];
      const btns = card.querySelectorAll('.qz-opt');
      btns.forEach((b, j) => { b.disabled = true; if (q.options[j].ok) b.classList.add('right'); if (j === k && !o.ok) b.classList.add('wrong'); });
      if (o.ok) { correct++; ctx.audio.playSfx('ding'); say(f.npc, q.right, 'gittel'); }
      else { wrong++; ctx.audio.playSfx('boo'); say(f.npc, q.wrong, 'gittel'); portrait.innerHTML = gittelNarrow(wrong, 150); portrait.classList.add('narrowing'); setTimeout(() => portrait.classList.remove('narrowing'), 500); }
      scoreEl.innerHTML = `שאלה <bdi>${Math.min(i + 2, C.count)}</bdi>/<bdi>${C.count}</bdi> · נכון: <bdi>${correct}</bdi>`;
      setTimeout(() => { i++; if (i >= qs.length) finish(); else render(); }, 1700);
    }
    const unbind = keys({ 1: () => answer(0), 2: () => answer(1), 3: () => answer(2) });

    function finish(forced) {
      if (finished) return;
      finished = true; unbind();
      if (forced != null) { correct = forced ? C.count : 0; wrong = forced ? 0 : C.count; }
      const win = correct >= needed;
      portrait.innerHTML = gittelNarrow(win ? 0 : 3, 150);
      say(f.npc, win ? (bb && correct < C.needed ? C.gittel.passBB : C.gittel.pass) : C.gittel.fail, 'gittel');
      ctx.audio.playSfx(win ? 'tada' : 'sigh');
      setTimeout(() => resolve({ win, correct, wrong, needed }), 1300);
    }
    render();
    ctx.control({ finish: (win) => finish(!!win) });
  });
}
