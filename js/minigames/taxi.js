/* js/minigames/taxi.js — "מונה המונית": Moshe's lecture streams word by word while the meter climbs.
 * Tap (anywhere / Space) exactly while a keyword is lit to interrupt him and save shekels.
 */
import { el, frame, say, think, keys, pick, clamp } from './common.js';

export const id = 'taxi';

export function run(host, ctx) {
  const C = ctx.content;
  const f = frame(host, { cls: 'mg-taxi' });
  return new Promise((resolve) => {
    let finished = false;
    let fare = C.startFare, hits = 0, misses = 0, falses = 0;
    // Tokenize: *keyword* parts become single key tokens; a dangling prefix like "ב-" sticks to the
    // keyword, and leading punctuation sticks to the previous token.
    const tokens = [];
    for (const seg of C.lecture.split(/(\*[^*]+\*)/)) {
      if (!seg) continue;
      if (seg.startsWith('*')) { tokens.push({ text: seg.replace(/\*/g, ''), key: true }); continue; }
      const parts = seg.split(/(\s+)/);
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        if (!p || /^\s+$/.test(p)) continue;
        const prev = tokens[tokens.length - 1];
        const attachPrev = i === 0 && !/^\s/.test(seg) && prev;          // "1948." → the "." joins 1948
        const attachNext = i === parts.length - 1 && !/\s$/.test(seg);   // "ב-" → joins the next keyword
        if (attachPrev) prev.text += p;
        else if (attachNext) tokens.push({ text: p, key: false, prefix: true });
        else tokens.push({ text: p, key: false });
      }
    }
    for (let i = tokens.length - 1; i > 0; i--) if (tokens[i - 1].prefix && tokens[i].key) { tokens[i].text = tokens[i - 1].text + tokens[i].text; tokens.splice(i - 1, 1); }
    const totalKeys = tokens.filter((t) => t.key).length;

    f.status.innerHTML = `<span class="mg-title">${C.icon} ${C.title}</span>`;
    const meter = el('div', 'tx-meter', `<span class="tx-meter-label">המונה</span><span class="tx-meter-val">₪ <bdi>${fare}</bdi></span>`);
    f.status.appendChild(meter);
    const meterVal = meter.querySelector('bdi');
    const scoreEl = el('div', 'tx-score', `קטיעות: <bdi>0</bdi>/<bdi>${totalKeys}</bdi>`);
    f.status.appendChild(scoreEl);

    const road = el('div', 'tx-road');
    const lecture = el('div', 'tx-lecture');
    const lectureInner = el('div', 'tx-lecture-inner');
    lecture.appendChild(lectureInner);
    const btn = el('button', 'btn btn-big tx-btn', '✋ לקטוע!');
    btn.type = 'button';
    f.main.append(road, lecture);
    f.controls.append(btn);
    say(f.npc, 'תקשיב לי, אני אסביר לך את כל הבעיה...', 'moshe');

    let idx = -1, active = null, activeTimer = 0, streamTimer = 0, tickTimer = 0;
    let saidAt = new Set();
    const WORD_MS = 420, KEY_MS = 900;

    function setFare(v) {
      fare = Math.max(0, Math.round(v));
      meterVal.textContent = fare;
      meter.classList.add('bump'); setTimeout(() => meter.classList.remove('bump'), 200);
      for (const a of C.tuvia) if (fare >= a.at && !saidAt.has(a.at)) { saidAt.add(a.at); think(f.aside, a.t); }
    }
    tickTimer = setInterval(() => { if (!finished) setFare(fare + C.perTick); }, C.tickMs);

    function stream() {
      if (finished) return;
      idx++;
      if (idx >= tokens.length) { finish(); return; }
      const t = tokens[idx];
      const span = el('span', 'tx-word' + (t.key ? ' key' : ''), t.text);
      lectureInner.appendChild(span);
      lectureInner.querySelectorAll('.tx-word').forEach((w, i) => { if (i < idx - 14) w.remove(); });
      if (t.key) {
        active = { token: t, span, done: false };
        span.classList.add('lit');
        ctx.audio.playSfx('ding');
        activeTimer = setTimeout(() => {
          if (active && !active.done) { // missed
            active.done = true; span.classList.remove('lit'); span.classList.add('missed');
            misses++; setFare(fare + C.missCost); ctx.audio.playSfx('cash');
            say(f.npc, pick(C.moshe.miss), 'moshe');
          }
          active = null;
          streamTimer = setTimeout(stream, WORD_MS);
        }, KEY_MS);
      } else {
        streamTimer = setTimeout(stream, WORD_MS * (t.text.length > 6 ? 1.15 : 1));
      }
    }
    function tap() {
      if (finished) return;
      if (active && !active.done) {
        active.done = true;
        active.span.classList.remove('lit'); active.span.classList.add('hit');
        hits++;
        scoreEl.innerHTML = `קטיעות: <bdi>${hits}</bdi>/<bdi>${totalKeys}</bdi>`;
        setFare(fare - C.hitSave);
        ctx.audio.cue('honk');
        lectureInner.appendChild(el('span', 'tx-word tuvia', `— ${pick(C.interrupts)}`));
        say(f.npc, pick(C.moshe.hit), 'moshe');
        clearTimeout(activeTimer); active = null;
        streamTimer = setTimeout(stream, WORD_MS);
      } else {
        falses++; setFare(fare + C.falseCost); ctx.audio.playSfx('boo');
        say(f.npc, pick(C.moshe.false), 'moshe');
        road.classList.add('swerve'); setTimeout(() => road.classList.remove('swerve'), 400);
      }
    }
    btn.addEventListener('click', tap);
    lecture.addEventListener('click', tap);
    const unbind = keys({ ' ': tap, Enter: tap, ArrowUp: tap });

    function finish(forced) {
      if (finished) return;
      finished = true;
      clearInterval(tickTimer); clearTimeout(streamTimer); clearTimeout(activeTimer); unbind();
      const win = fare <= C.winFare;
      say(f.npc, win ? 'הגענו. המונה... נו, בסדר. בשבילך.' : `הגענו. ₪${fare}. זה ההסבר. ההסבר עולה.`, 'moshe');
      ctx.audio.playSfx(win ? 'tada' : 'cash');
      const mood = clamp(Math.round((C.winFare - fare) / 10), -12, 6);
      setTimeout(() => resolve({ win, fare, hits, misses, falses, mood, pages: hits, text: C.rewardText(fare, hits) }), 1000);
    }
    ctx.control({ finish: (win) => { if (win) { fare = Math.min(fare, C.winFare - 40); hits = Math.max(hits, 4); } else fare = Math.max(fare, C.winFare + 60); finish(true); } });
    setTimeout(stream, 600);
  });
}
