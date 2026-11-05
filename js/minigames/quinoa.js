/* js/minigames/quinoa.js — "לבלוע קינואה": a rhythm game in 7/8 (2+2+3) synced to the Balkan theme.
 * Chew (tap) on the group downbeats (eighths 1, 3, 5); fake-smile (hold) across the last two eighths (6–7).
 * Notes fall to a hit line. Clock: the audio engine's beat when the settlement theme is really running,
 * otherwise an internal 140 bpm clock (so the game also works muted / without Web Audio).
 */
import { el, frame, say, think, keys, pick, clamp } from './common.js';

export const id = 'quinoa';

const EIGHTH = 60 / 140 / 2;      // seconds: bpm 140, 16th steps → eighth = 2 steps
const BAR = EIGHTH * 7;
const HIT_WIN = 0.16;             // ±s for a chew
const HOLD_WIN = 0.22;            // start tolerance for a smile

export function run(host, ctx) {
  const C = ctx.content;
  const f = frame(host, { cls: 'mg-quinoa' });
  return new Promise((resolve) => {
    let finished = false;
    const audio = ctx.audio;
    const useAudio = () => { try { const b = audio.getBeat(); return b.playing && b.location === 'settlement' && audio.context && audio.context.state === 'running'; } catch (e) { return false; } };
    let audioClock = useAudio();
    const perfNow = () => performance.now() / 1000;
    const now = () => (audioClock ? audio.now() : perfNow());

    // Bar start aligned to the music if possible.
    let t0;
    if (audioClock) { const b = audio.getBeat(); t0 = b.time - b.step * b.stepDuration + (b.stepsPerBar - b.step) * b.stepDuration + BAR; }
    else t0 = perfNow() + 1.6;

    const notes = [];
    for (let bar = 0; bar < C.bars; bar++) {
      const bt = t0 + bar * BAR;
      for (const e of [0, 2, 4]) notes.push({ kind: 'chew', t: bt + e * EIGHTH, bar, state: 'wait' });
      notes.push({ kind: 'smile', t: bt + 5 * EIGHTH, dur: 2 * EIGHTH, bar, state: 'wait' });
    }
    const endTime = t0 + C.bars * BAR + 0.6;

    f.status.innerHTML = `<span class="mg-title">${C.icon} ${C.title}</span>`;
    const plate = el('div', 'qn-plate', `<div class="qn-plate-fill"></div><span>🥣</span>`);
    const acc = el('div', 'qn-acc', `דיוק: <bdi>—</bdi>`);
    f.status.append(plate, acc);
    say(f.npc, 'תאכל! זה מהגבעה! בקצב, בקצב!', 'tzofia');

    const lane = el('div', 'qn-lane');
    const hitLine = el('div', 'qn-hitline');
    const face = el('div', 'qn-face', ctx.tuviaHead('neutral', 70));
    lane.append(hitLine, face);
    const beatDots = el('div', 'qn-beats', [0, 1, 2, 3, 4, 5, 6].map((i) => `<i class="${[0, 2, 4].includes(i) ? 'chew' : i >= 5 ? 'smile' : ''}"></i>`).join(''));
    f.main.append(lane, beatDots);
    const btn = el('button', 'btn btn-big qn-btn', `<span class="qn-btn-chew">🍴 ${C.tapLabel}</span><span class="qn-btn-smile">😁 ${C.holdLabel} (להחזיק)</span>`);
    btn.type = 'button';
    f.controls.append(btn);

    let hits = 0, judged = 0, screamIdx = 0, holding = null;
    const screams = C.screams.slice();
    think(f.aside, screams[0]);
    const screamTimer = setInterval(() => { screamIdx = (screamIdx + 1) % screams.length; think(f.aside, screams[screamIdx]); }, 2800);

    function flash(expr) { face.innerHTML = ctx.tuviaHead(expr, 70); }
    function judge(n, ok) {
      if (n.state !== 'wait' && n.state !== 'holding') return;
      n.state = ok ? 'hit' : 'miss'; judged++; if (ok) hits++;
      if (n.el) n.el.classList.add(ok ? 'hit' : 'miss');
      acc.innerHTML = `דיוק: <bdi>${Math.round(hits / Math.max(1, judged) * 100)}%</bdi>`;
      if (ok) { flash(n.kind === 'smile' ? 'happy' : 'delighted'); audio.playSfx(n.kind === 'smile' ? 'pop' : 'crunch'); if (Math.random() < .25) say(f.npc, pick(C.tzofia.good), 'tzofia'); }
      else { flash('disgusted'); audio.playSfx('boo'); if (Math.random() < .4) say(f.npc, pick(C.tzofia.bad), 'tzofia'); }
    }
    function press() {
      if (finished) return;
      const t = now();
      let best = null, bd = 1e9;
      for (const n of notes) {
        if (n.state !== 'wait') continue;
        const d = Math.abs(n.t - t);
        const win = n.kind === 'chew' ? HIT_WIN : HOLD_WIN;
        if (d <= win && d < bd) { best = n; bd = d; }
      }
      if (!best) { judged++; acc.innerHTML = `דיוק: <bdi>${Math.round(hits / Math.max(1, judged) * 100)}%</bdi>`; flash('suspicious'); audio.playSfx('click'); return; }
      if (best.kind === 'chew') judge(best, true);
      else { best.state = 'holding'; holding = { n: best, from: t }; btn.classList.add('holding'); if (best.el) best.el.classList.add('holding'); flash('happy'); }
    }
    function release() {
      btn.classList.remove('holding');
      if (!holding) return;
      const held = now() - holding.from;
      judge(holding.n, held >= holding.n.dur * 0.6);
      holding = null;
    }
    btn.addEventListener('pointerdown', (e) => { e.preventDefault(); btn.setPointerCapture && btn.setPointerCapture(e.pointerId); press(); });
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointercancel', release);
    lane.addEventListener('pointerdown', (e) => { e.preventDefault(); press(); });
    lane.addEventListener('pointerup', release);
    let keyDown = false;
    const unbind = keys({ ' ': () => { if (!keyDown) { keyDown = true; press(); } }, Enter: () => { if (!keyDown) { keyDown = true; press(); } }, ArrowUp: () => { if (!keyDown) { keyDown = true; press(); } } });
    const keyUp = (e) => { if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowUp') { keyDown = false; release(); } };
    window.addEventListener('keyup', keyUp);

    const SPEED = 170; // px per second
    let raf = 0;
    function frameLoop() {
      if (finished) return;
      const t = now();
      const laneH = lane.clientHeight || 260;
      const hitY = laneH - 44;
      for (const n of notes) {
        const dt = n.t - t;
        if (dt > 3) continue;
        if (!n.el) {
          n.el = el('div', 'qn-note ' + n.kind, n.kind === 'chew' ? '🍴' : '😁');
          if (n.kind === 'smile') n.el.style.height = (n.dur * SPEED) + 'px';
          lane.appendChild(n.el);
        }
        const y = hitY - dt * SPEED;
        n.el.style.transform = `translate(-50%, ${n.kind === 'smile' ? y - n.dur * SPEED : y - 28}px)`;
        if (n.state === 'wait' && dt < -(n.kind === 'chew' ? HIT_WIN : HOLD_WIN)) judge(n, false);
        if (n.state === 'holding' && t > n.t + n.dur + 0.05) { release(); }
        if (dt < -1.2 && n.el.parentNode) { n.el.remove(); }
      }
      // beat indicator + plate drain
      const barPos = ((t - t0) % BAR + BAR) % BAR;
      const eighth = Math.floor(barPos / EIGHTH);
      beatDots.querySelectorAll('i').forEach((d, i) => d.classList.toggle('on', i === eighth && t >= t0));
      const progress = clamp((t - t0) / (C.bars * BAR), 0, 1);
      plate.querySelector('.qn-plate-fill').style.height = (100 - progress * 100) + '%';
      if (t >= endTime) { finish(); return; }
      raf = requestAnimationFrame(frameLoop);
    }
    raf = requestAnimationFrame(frameLoop);

    function finish(forced) {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(raf); clearInterval(screamTimer); unbind(); window.removeEventListener('keyup', keyUp);
      const total = notes.length;
      const ratio = forced != null ? (forced ? 1 : 0) : hits / Math.max(1, Math.max(judged, total));
      const win = ratio >= C.passRatio;
      say(f.npc, win ? 'צלחת ריקה! ידעתי שתאהב!' : 'אתה עושה פרצופים. ראיתי. גם העז ראתה.', 'tzofia');
      flash(win ? 'happy' : 'disgusted');
      audio.playSfx(win ? 'tada' : 'sigh');
      setTimeout(() => resolve({ win, ratio: Math.round(ratio * 100), hits, total }), 1000);
    }
    ctx.control({ finish: (win) => finish(!!win) });
  });
}
