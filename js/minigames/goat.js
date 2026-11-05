/* js/minigames/goat.js — "עז מול טוביה": a staring contest. Don't tap during distractions.
 * Tap only when the goat blinks (a short window). Winning = finding the goat for this chapter.
 */
import { el, frame, say, think, keys, pick, rand, shuffle } from './common.js';
import { goatSVG } from '../art/tuvia.js';

export const id = 'goat';

export function run(host, ctx) {
  const C = ctx.content;
  const f = frame(host, { cls: 'mg-goat' });
  return new Promise((resolve) => {
    let finished = false;
    f.status.innerHTML = `<span class="mg-title">${C.icon} ${C.title}</span>`;
    const clock = el('div', 'gt-clock', '<bdi>0.0</bdi> שנ׳');
    f.status.appendChild(clock);
    say(f.npc, '...', 'goat');

    const arena = el('div', 'gt-arena');
    const goatWrap = el('div', 'gt-goat');
    let svg = goatSVG({ size: 260, mood: 'disappointed' });
    // add an eyelid we can close (eye at 34,40 in goat coordinates)
    svg = svg.replace('</g></svg>', `<g class="gt-lid" style="opacity:0"><ellipse cx="34" cy="40" rx="10" ry="9" fill="#EFEEE9" stroke="#3B2A21" stroke-width="2"/><path d="M 26 41 q 8 4 16 0" fill="none" stroke="#3B2A21" stroke-width="2.5" stroke-linecap="round"/></g></g></svg>`);
    goatWrap.innerHTML = svg;
    const lid = goatWrap.querySelector('.gt-lid');
    const face = el('div', 'gt-face', ctx.tuviaHead('suspicious', 90));
    const distractLayer = el('div', 'gt-distract');
    const cue = el('div', 'gt-cue');
    arena.append(goatWrap, face, distractLayer, cue);
    f.main.append(arena);
    const btn = el('button', 'btn btn-big gt-btn', '👁 היא מצמצה!');
    btn.type = 'button';
    f.controls.append(btn);
    think(f.aside, C.tuvia.start);

    const total = rand(C.minSeconds, C.maxSeconds);
    const t0 = performance.now();
    const elapsed = () => (performance.now() - t0) / 1000;
    // distractions: 4–6, spread over [2, total-2.5], none within 1.6 s of the blink
    const ds = shuffle(C.distractions).slice(0, 4 + Math.floor(Math.random() * 3));
    const slots = [];
    const span = total - 4.5;
    ds.forEach((d, i) => { slots.push({ d, at: 2 + (i + Math.random() * .6) * (span / ds.length) }); });
    let blinkAt = total, blinking = false, blinkOver = false, said = { mid: false, late: false };
    const timers = [];
    for (const s of slots) timers.push(setTimeout(() => showDistraction(s.d), s.at * 1000));
    timers.push(setTimeout(blink, blinkAt * 1000));

    function showDistraction(d) {
      if (finished) return;
      const node = el('div', 'gt-d gt-d-' + d.kind, `<span class="gt-d-icon">${{ fly: '🪰', guitar: '🎸', chia: '🥣', kid: '🧒', phone: '📱', wind: '💨' }[d.kind] || '❗'}</span><span class="gt-d-text">${d.text}</span>`);
      distractLayer.appendChild(node);
      ctx.audio.playSfx(d.kind === 'phone' ? 'phone' : d.kind === 'guitar' ? 'nu' : d.kind === 'fly' ? 'zzz' : 'pop');
      if (d.kind === 'fly') node.classList.add('fly-anim');
      setTimeout(() => node.remove(), d.dur);
    }
    function blink() {
      if (finished) return;
      blinking = true; lid.style.opacity = '1'; cue.textContent = C.blinkText; cue.classList.add('on');
      ctx.audio.playSfx('goat');
      timers.push(setTimeout(() => { blinking = false; blinkOver = true; lid.style.opacity = '0'; cue.classList.remove('on'); if (!finished) finish(false, 'missedBlink'); }, C.blinkWindowMs));
    }
    function tap() {
      if (finished) return;
      if (blinking) finish(true, 'caught');
      else finish(false, blinkOver ? 'late' : 'blinked');
    }
    btn.addEventListener('click', tap);
    arena.addEventListener('click', tap);
    const unbind = keys({ ' ': tap, Enter: tap, ArrowUp: tap });
    let raf = 0;
    function loop() {
      if (finished) return;
      const e = elapsed();
      clock.innerHTML = `<bdi>${e.toFixed(1)}</bdi> שנ׳`;
      if (e > 7 && !said.mid) { said.mid = true; think(f.aside, C.tuvia.mid); }
      if (e > 15 && !said.late) { said.late = true; think(f.aside, C.tuvia.late); }
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    function finish(win, why) {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(raf); timers.forEach(clearTimeout); unbind();
      lid.style.opacity = win ? '1' : '0';
      face.innerHTML = ctx.tuviaHead(win ? 'happy' : why === 'blinked' ? 'shocked' : 'angry', 90);
      if (!win) goatWrap.innerHTML = goatSVG({ size: 260, mood: 'disappointed' });
      else goatWrap.innerHTML = goatSVG({ size: 260, mood: 'shocked' });
      say(f.npc, win ? '...מעניין.' : why === 'blinked' ? '(העז מרימה גבה. אתה מצמצת.)' : '(העז מצמצה. לא ראית. היא ראתה שלא ראית.)', 'goat');
      cue.classList.remove('on');
      ctx.audio.playSfx(win ? 'tada' : 'goat');
      setTimeout(() => resolve({ win, why, seconds: Math.round(elapsed()) }), 1100);
    }
    ctx.control({ finish: (win) => finish(!!win, 'forced') });
  });
}
