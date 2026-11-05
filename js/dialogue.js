/* js/dialogue.js — the dialogue runner (typewriter box, choices, asides). Reads the DSL in js/content/npcs.js.
 *
 *   const dlg = createDialogue({ box, nameEl, textEl, choicesEl, portraitEl, hintEl, applyFx, textSpeed });
 *   dlg.start({ name, nodes, entry, ctx, portrait }, onDone)
 *   dlg.advance()  (tap / E / Enter)   dlg.choose(i)   dlg.isOpen()
 */

const SPEED_MS = { slow: 42, normal: 22, fast: 9, instant: 0 };

/** 'N: text' | 'T: text' | '~ text' | '* text' | 'I: text' | 'שם: text' → { who, kind, text } */
export function parseLine(raw, npcName) {
  if (raw.startsWith('~')) return { kind: 'aside', who: '💭 טוביה', text: raw.slice(1).trim() };
  if (raw.startsWith('*')) return { kind: 'stage', who: '', text: raw.slice(1).trim() };
  const m = raw.match(/^([^:]{1,24}):\s(.*)$/s);
  if (m) {
    const p = m[1];
    if (p === 'N') return { kind: 'npc', who: npcName, text: m[2] };
    if (p === 'T') return { kind: 'tuvia', who: 'טוביה', text: m[2] };
    if (p === 'I') return { kind: 'isi', who: 'איזי', text: m[2] };
    return { kind: p === 'טוביה' ? 'tuvia' : 'npc', who: p, text: m[2] };
  }
  return { kind: 'npc', who: npcName, text: raw };
}

/** Wrap Latin letters / digits in <bdi> so RTL punctuation stays sane (SPEC §10.1). */
export function bidi(text) {
  const esc = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return esc.replace(/([A-Za-z0-9][A-Za-z0-9 .,'₪$%-]*[A-Za-z0-9]|[A-Za-z0-9])/g, '<bdi>$1</bdi>');
}

export function createDialogue(opts) {
  const { box, nameEl, textEl, choicesEl, portraitEl, hintEl } = opts;
  let applyFx = opts.applyFx || (() => {});
  let textSpeed = opts.textSpeed || 'normal';
  let open = false, queue = [], qi = 0, typing = null, typed = '', current = null, onDone = null, conv = null, choicesShown = false, pendingChoices = null;
  let rnd = Math.random;

  function expandLine(item, ctx) {
    if (typeof item === 'string') return [item];
    if (item.pick) return [item.pick[Math.floor(rnd() * item.pick.length)]];
    if (item.pickFlag) { const [flag, yes, no] = item.pickFlag; const v = ctx.flags[flag] ? yes : no; return v == null ? [] : [v]; }
    return [item];
  }

  function loadNode(id) {
    const node = conv.nodes[id];
    if (!node) { finish(); return; }
    current = { id, node };
    queue = []; for (const l of node.lines || []) queue.push(...expandLine(l, conv.ctx));
    qi = 0; choicesShown = false; pendingChoices = node.choices || null;
    if (node.fx) applyFx(node.fx, conv);
    next();
  }

  function next() {
    if (typing) { completeTyping(); return; }
    while (qi < queue.length && queue[qi] && typeof queue[qi] === 'object') { const it = queue[qi++]; if (it.fx) applyFx(it.fx, conv); }
    if (qi < queue.length) { showLine(queue[qi++]); return; }
    if (pendingChoices && !choicesShown) { showChoices(); return; }
    if (current.node.next) { loadNode(current.node.next); return; }
    finish();
  }

  function showLine(raw) {
    const line = parseLine(raw, conv.name);
    box.dataset.kind = line.kind;
    nameEl.textContent = line.who;
    nameEl.style.display = line.who ? '' : 'none';
    if (portraitEl) { portraitEl.dataset.kind = line.kind; portraitEl.innerHTML = conv.portrait ? conv.portrait(line) : ''; }
    choicesEl.innerHTML = ''; choicesEl.hidden = true;
    const html = bidi(line.text);
    const ms = SPEED_MS[textSpeed] ?? 22;
    textEl.innerHTML = '';
    if (!ms) { textEl.innerHTML = html; typing = null; if (hintEl) hintEl.hidden = false; return; }
    // typewriter: reveal characters of the text, keeping bdi tags intact by typing plain text and re-rendering
    const plain = line.text; let i = 0;
    if (hintEl) hintEl.hidden = true;
    const tick = () => {
      i += ms < 15 ? 2 : 1;
      textEl.innerHTML = bidi(plain.slice(0, i));
      if (i >= plain.length) { typing = null; if (hintEl) hintEl.hidden = false; opts.onTyped && opts.onTyped(line); return; }
      typing = setTimeout(tick, ms);
    };
    typed = plain;
    typing = setTimeout(tick, ms);
    opts.onLine && opts.onLine(line);
  }

  function completeTyping() { clearTimeout(typing); typing = null; textEl.innerHTML = bidi(typed); if (hintEl) hintEl.hidden = false; }

  function showChoices() {
    choicesShown = true;
    const vis = pendingChoices.filter((c) => !(c.hideIf && conv.ctx.flags[c.hideIf]));
    if (!vis.length) { pendingChoices = null; next(); return; }
    choicesEl.innerHTML = ''; choicesEl.hidden = false;
    if (hintEl) hintEl.hidden = true;
    vis.forEach((c, i) => {
      const b = document.createElement('button');
      b.className = 'choice' + (c.kind ? ' choice-' + c.kind : '');
      const icon = c.kind === 'innocent' ? '😇' : c.kind === 'disguise' ? '🎭' : c.kind === 'eat' ? '🍽️' : c.kind === 'polite' ? '😬' : '💬';
      b.innerHTML = `<span class="ci">${icon}</span><span class="ct">${bidi(c.t)}</span>`;
      b.addEventListener('click', (e) => { e.stopPropagation(); pick(c); });
      choicesEl.appendChild(b);
    });
    choicesEl.dataset.count = vis.length;
    api._visible = vis;
  }

  function pick(c) {
    choicesEl.hidden = true; pendingChoices = null;
    opts.onChoice && opts.onChoice(c);
    if (c.fx) applyFx(c.fx, conv);
    if (c.next) loadNode(c.next); else finish();
  }

  function finish() {
    open = false; box.hidden = true; box.classList.remove('open');
    const cb = onDone; onDone = null; conv = null;
    cb && cb();
  }

  const api = {
    start(c, done) {
      conv = Object.assign({ ctx: { flags: {} } }, c);
      onDone = done || null; open = true;
      box.hidden = false; box.classList.add('open');
      const entry = typeof conv.entry === 'function' ? conv.entry(conv.ctx) : (conv.entry || 'start');
      loadNode(entry);
    },
    advance() { if (!open) return false; if (!choicesEl.hidden) return true; next(); return true; },
    choose(i) { if (!open || choicesEl.hidden) return false; const c = api._visible && api._visible[i]; if (c) pick(c); return !!c; },
    isOpen() { return open; },
    hasChoices() { return open && !choicesEl.hidden; },
    abort() { clearTimeout(typing); typing = null; if (open) finish(); },
    setSpeed(sp) { textSpeed = sp; },
    setApplyFx(fn) { applyFx = fn; },
    currentNode() { return current && current.id; },
  };
  return api;
}
