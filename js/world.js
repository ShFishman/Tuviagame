/* js/world.js — the top-down engine: tile map, entities, collision, chasing NPCs, camera, render.
 * Cheap on purpose: the map is pre-rendered once per zoom level; each frame draws one map region,
 * a few sprites (pre-rendered), bubbles and the minimap. Integer-ish tile math, no allocations in the loop.
 */
import { createArt, isSolid, SPRITE_W, SPRITE_H, FEET_Y } from './art/sprites.js';
import { NPCS } from './content/npcs.js';
import { FOODS, INGREDIENTS } from './content/foods.js';

const TILE = 32;
const TUVIA_SPEED = 3.9;     // tiles / s
const WANDER_SPEED = 1.4;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function createWorld({ canvas, hooks = {} }) {
  const ctx = canvas.getContext('2d', { alpha: false });
  let art = null, u = 1, dpr = 1, zoom = 1, W = 0, H = 0;
  let map = null, mapCanvas = null, miniCanvas = null, miniPx = 3;
  let tuvia = null, npcs = [], items = [], goat = null, landmarks = [];
  let input = { dx: 0, dy: 0 }, camX = 0, camY = 0, time = 0, idle = 0, shakeT = 0;
  let bubbles = [];        // { ent, text, until }
  let plates = [];         // finale rush plates { x, y, food, until }
  let exitArmed = true, paused = false, frozen = false, rush = null;
  let nearNPC = null, nearGoat = false, disguise = 'none';
  let shimmer = 0;

  // ---------------------------------------------------------------- helpers
  const tileAt = (x, y) => (map && map.rows[y] && map.rows[y][x]) || '#';
  const solidAt = (x, y) => isSolid(tileAt(Math.floor(x), Math.floor(y)));
  function blocked(x, y, hw = 0.3, hh = 0.38) {
    return solidAt(x - hw, y - hh) || solidAt(x + hw, y - hh) || solidAt(x - hw, y - 0.02) || solidAt(x + hw, y - 0.02);
  }
  function tryMove(e, dx, dy) {
    if (dx) { const nx = e.x + dx; if (!blocked(nx, e.y)) e.x = nx; else e.x = dx > 0 ? Math.floor(e.x + 0.3) + 0.7 - 1e-3 : Math.ceil(e.x - 0.3) - 0.7 + 1e-3; }
    if (dy) { const ny = e.y + dy; if (!blocked(e.x, ny)) e.y = ny; else e.y = dy > 0 ? Math.floor(e.y) + 0.98 : Math.ceil(e.y - 0.38) + 0.38 + 1e-3; }
    e.x = clamp(e.x, 0.35, map.rows[0].length - 0.35); e.y = clamp(e.y, 0.4, map.rows.length - 0.02);
  }
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const dirOf = (dx, dy, cur) => (Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy ? (dy > 0 ? 'down' : 'up') : cur);
  function walkable(x, y) { return !isSolid(tileAt(x, y)); }
  function randomWalkableTile() {
    for (let i = 0; i < 60; i++) { const x = 1 + Math.floor(Math.random() * (map.rows[0].length - 2)), y = 1 + Math.floor(Math.random() * (map.rows.length - 2)); if (walkable(x, y) && tileAt(x, y) !== 'E') return [x, y]; }
    return null;
  }

  // ---------------------------------------------------------------- sizing
  function resize() {
    const cssW = canvas.clientWidth || 360, cssH = canvas.clientHeight || 480;
    dpr = Math.min(3, window.devicePixelRatio || 1);
    zoom = clamp(Math.min(cssW / (13 * TILE), cssH / (9 * TILE)), 0.9, 2.0);
    if (map) zoom = clamp(Math.max(zoom, 0.8 * cssH / (map.rows.length * TILE)), 0.9, 2.0);
    const nu = zoom * dpr;
    W = Math.round(cssW * dpr); H = Math.round(cssH * dpr);
    if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
    if (Math.abs(nu - u) > 1e-3 || !art) { u = nu; art = createArt(u); mapCanvas = map ? art.renderMap(map) : null; }
    miniPx = Math.max(2, Math.round(3 * dpr));
    if (map) miniCanvas = art.renderMinimap(map, miniPx);
  }

  // ---------------------------------------------------------------- loading
  function load(m, opts = {}) {
    map = m; time = 0; idle = 0; bubbles = []; plates = []; rush = null; exitArmed = false; paused = false; frozen = false;
    const [sx, sy] = opts.pos || m.start;
    tuvia = { x: sx + 0.5, y: sy + 0.98, dir: 'down', frame: 0, anim: 0, moving: false };
    npcs = m.npcs.map((n) => {
      const def = NPCS[n.id];
      return { id: n.id, def, look: def.look, x: n.at[0] + 0.5, y: n.at[1] + 0.98, home: [(n.home || n.at)[0] + 0.5, (n.home || n.at)[1] + 0.98], dir: n.face || 'down', frame: 0, anim: 0,
        wander: n.wander || 0, seat: !!n.seat, mode: 'idle', t: 1 + Math.random() * 2, target: null, cooldown: 0, chaseBoost: 1, finaleFeeder: n.finaleFeeder || null, moving: false, stuck: 0 };
    });
    items = m.items.map((it, i) => ({ ...it, i, x: it.at[0] + 0.5, y: it.at[1] + 0.98, taken: false, icon: it.food ? FOODS[it.food].icon : it.item === 'cola' ? 'can' : it.ingredient ? (INGREDIENTS.find((g) => g.id === it.ingredient) || {}).icon : 'star' }));
    if (opts.takenItems) for (const i of opts.takenItems) if (items[i]) items[i].taken = true;
    goat = m.goat ? { x: m.goat.at[0] + 0.5, y: m.goat.at[1] + 0.98, r: m.goat.r || 2, dir: 'left', frame: 0, anim: 0, found: !!opts.goatFound } : null;
    landmarks = (m.landmarks || []).map((l) => ({ ...l, fired: false, away: 99 }));
    mapCanvas = null; resize();
    if (!mapCanvas) { mapCanvas = art.renderMap(map); miniCanvas = art.renderMinimap(map, miniPx); }
    updateCamera(true);
  }

  // ---------------------------------------------------------------- update
  function updateCamera(snap) {
    const mw = map.rows[0].length * TILE * u, mh = map.rows.length * TILE * u;
    let tx = mw <= W ? -(W - mw) / 2 : clamp(tuvia.x * TILE * u - W / 2, 0, mw - W);
    let ty = mh <= H ? -(H - mh) / 2 : clamp((tuvia.y - 0.6) * TILE * u - H / 2, 0, mh - H);
    if (snap) { camX = tx; camY = ty; } else { camX += (tx - camX) * 0.18; camY += (ty - camY) * 0.18; }
  }

  function stepAnim(e, dt, moving) {
    if (moving) { e.anim += dt * 9; e.frame = 1 + (Math.floor(e.anim) % 2); } else { e.frame = 0; e.anim = 0; }
    e.moving = moving;
  }

  function updateTuvia(dt) {
    let { dx, dy } = input;
    const len = Math.hypot(dx, dy);
    if (len > 1) { dx /= len; dy /= len; }
    const moving = len > 0.08 && !frozen;
    if (moving) {
      tuvia.dir = dirOf(dx, dy, tuvia.dir);
      tryMove(tuvia, dx * TUVIA_SPEED * dt, dy * TUVIA_SPEED * dt);
      idle = 0;
    } else idle += dt;
    stepAnim(tuvia, dt, moving);
    // soft collision with NPCs: he does not walk through people (he walks around them, like at a kiddush)
    for (const n of npcs) {
      const d = dist(tuvia, n); const minD = 0.62;
      if (d < minD && d > 1e-4) { const k = (minD - d) / d; const px = (tuvia.x - n.x) * k, py = (tuvia.y - n.y) * k; if (!blocked(tuvia.x + px, tuvia.y + py)) { tuvia.x += px; tuvia.y += py; } if (n.seat && rush) bumpGuest(n); }
    }
  }

  let lastBump = {};
  function bumpGuest(n) {
    const now = time; if ((lastBump[n.id] || -9) + 4 > now) return; lastBump[n.id] = now;
    hooks.onBumpGuest && hooks.onBumpGuest(n.id, n);
  }

  function moveToward(e, tx, ty, speed, dt) {
    const dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy);
    if (d < 0.05) return true;
    const sx = (dx / d) * speed * dt, sy = (dy / d) * speed * dt;
    const ox = e.x, oy = e.y;
    tryMove(e, sx, sy);
    e.dir = dirOf(dx, dy, e.dir);
    // naive unsticking: slide along the other axis when blocked
    if (Math.abs(e.x - ox) < Math.abs(sx) * 0.3 && Math.abs(e.y - oy) < Math.abs(sy) * 0.3) {
      e.stuck += dt; if (e.stuck > 0.3) { tryMove(e, sy !== 0 ? (Math.random() < 0.5 ? 1 : -1) * speed * dt : 0, sx !== 0 ? (Math.random() < 0.5 ? 1 : -1) * speed * dt : 0); }
    } else e.stuck = 0;
    return false;
  }

  function updateNPC(n, dt) {
    if (n.cooldown > 0) n.cooldown -= dt;
    const cfg = n.def.chase;
    const d = dist(n, tuvia);
    let moving = false;
    const canChase = cfg && !paused && !frozen && n.cooldown <= 0 && (rush ? true : true);
    if (n.seat) { n.dir = tuvia.y < n.y - 0.5 ? 'up' : tuvia.x < n.x ? 'left' : tuvia.x > n.x + 0.5 ? 'right' : 'down'; stepAnim(n, dt, false); return; }
    if (canChase && d < cfg.radius * (rush ? 2 : 1) && n.mode !== 'return') n.mode = 'chase';
    if (n.mode === 'chase') {
      if (!canChase || d > cfg.radius * 1.6) { n.mode = 'return'; }
      else {
        const sp = TUVIA_SPEED * (cfg.speed || 0.85) * n.chaseBoost * (rush ? 0.95 : 1);
        moveToward(n, tuvia.x, tuvia.y, sp, dt); moving = true;
        if (d < 0.9) { n.cooldown = cfg.cooldown || 6; n.mode = 'return'; n.chaseBoost = 1; hooks.onCatch && hooks.onCatch(n.id, n); }
      }
    } else if (n.mode === 'return') {
      if (moveToward(n, n.home[0], n.home[1], WANDER_SPEED * 1.4, dt)) n.mode = 'idle'; else moving = true;
    } else if (n.wander > 0) {
      n.t -= dt;
      if (n.target) { if (moveToward(n, n.target[0], n.target[1], WANDER_SPEED, dt)) n.target = null; else moving = true; }
      else if (n.t <= 0) {
        n.t = 1.5 + Math.random() * 3;
        const tx = n.home[0] + (Math.random() * 2 - 1) * n.wander, ty = n.home[1] + (Math.random() * 2 - 1) * n.wander;
        if (!blocked(tx, ty)) n.target = [tx, ty];
      } else if (Math.random() < dt * 0.4) n.dir = tuvia.x < n.x ? 'left' : 'right';
    } else if (!moving && d < 2.2) { n.dir = dirOf(tuvia.x - n.x, tuvia.y - n.y, n.dir); }
    stepAnim(n, dt, moving);
  }

  function updateItems() {
    for (const it of items) {
      if (it.taken) continue;
      if (it.needs && !(hooks.flag && hooks.flag(it.needs))) continue;
      if (dist(it, tuvia) < 0.6) { it.taken = true; hooks.onPickup && hooks.onPickup(it); }
    }
    if (goat && !goat.found && dist(goat, tuvia) < goat.r) { goat.found = true; hooks.onGoatFound && hooks.onGoatFound(); }
    for (const l of landmarks) {
      const d = Math.hypot(l.at[0] + 0.5 - tuvia.x, l.at[1] + 0.98 - tuvia.y);
      if (d < l.r) { if (!l.fired && l.away > 20) { l.fired = true; l.away = 0; hooks.onLandmark && hooks.onLandmark(l); } }
      else { if (l.fired && !l.once) l.away += 1 / 60; if (l.away > 20) l.fired = false; }
    }
    // exit
    const onExit = tileAt(Math.floor(tuvia.x), Math.floor(tuvia.y - 0.2)) === 'E';
    if (onExit && exitArmed) { exitArmed = false; hooks.onExit && hooks.onExit(); } else if (!onExit) exitArmed = true;
    // nearest talkable
    let best = null, bd = 1.75;
    for (const n of npcs) { const d = dist(n, tuvia); if (d < bd && !(n.seat && rush)) { bd = d; best = n; } }
    nearNPC = best; nearGoat = !!goat && dist(goat, tuvia) < 1.9;
    // rush plates
    if (rush) {
      for (const p of plates) { if (!p.taken && dist(p, tuvia) < 0.6) { p.taken = true; hooks.onPlate && hooks.onPlate(p); } }
      plates = plates.filter((p) => !p.taken && p.until > time);
    }
  }

  function update(dt) {
    if (!map) return;
    dt = Math.min(0.05, dt); time += dt;
    if (shakeT > 0) shakeT -= dt;
    for (const b of bubbles) if (b.until < time) b.dead = true; bubbles = bubbles.filter((b) => !b.dead);
    if (paused) { updateCamera(false); return; }
    updateTuvia(dt);
    for (const n of npcs) updateNPC(n, dt);
    if (goat) { goat.anim += dt; goat.frame = Math.floor(goat.anim * 2) % 2; goat.dir = tuvia.x < goat.x ? 'left' : 'right'; }
    updateItems();
    if (rush) { rush.spawnT -= dt; if (rush.spawnT <= 0) { rush.spawnT = rush.cfg.spawnEvery; spawnPlate(); } }
    shimmer += dt;
    updateCamera(false);
  }

  function spawnPlate() {
    const t = randomWalkableTile(); if (!t) return;
    const bad = Math.random() < 0.42;
    const pool = bad ? rush.cfg.bad : rush.cfg.good;
    const food = pool[Math.floor(Math.random() * pool.length)];
    plates.push({ x: t[0] + 0.5, y: t[1] + 0.98, food, bad, until: time + 7, born: time });
  }

  // ---------------------------------------------------------------- render
  function drawEntity(e, sprite) {
    const px = Math.round(e.x * TILE * u - (SPRITE_W / 2) * u - camX), py = Math.round(e.y * TILE * u - FEET_Y * u - camY);
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(px + (SPRITE_W / 2) * u, py + (FEET_Y + 1) * u, 9 * u, 3.2 * u, 0, 0, Math.PI * 2); ctx.fill();
    ctx.drawImage(sprite, px, py);
    return { px, py };
  }

  function bubble(x, y, text, big) {
    const fs = (big ? 11 : 9) * u;
    ctx.font = `${big ? 700 : 500} ${fs}px Rubik, system-ui, sans-serif`;
    ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const pad = 5 * u, tw = Math.min(ctx.measureText(text).width, 7 * TILE * u), bw = tw + pad * 2, bh = fs + pad * 1.6;
    const bx = clamp(x - bw / 2, 2, W - bw - 2), by = y - bh - 6 * u;
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#3B2A21'; ctx.lineWidth = 1.2 * u;
    ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 5 * u); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 3 * u, by + bh); ctx.lineTo(x, by + bh + 5 * u); ctx.lineTo(x + 3 * u, by + bh); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill();
    ctx.strokeStyle = '#3B2A21'; ctx.beginPath(); ctx.moveTo(x - 3 * u, by + bh); ctx.lineTo(x, by + bh + 5 * u); ctx.lineTo(x + 3 * u, by + bh); ctx.stroke();
    ctx.fillStyle = big ? '#C0262D' : '#2B1D14'; ctx.fillText(text, bx + bw / 2, by + bh / 2 + 0.5 * u, tw);
  }

  function render() {
    if (!map || !mapCanvas) return;
    const sx = shakeT > 0 ? (Math.random() - 0.5) * 10 * u : 0, sy = shakeT > 0 ? (Math.random() - 0.5) * 8 * u : 0;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = map.palette.outside || '#1F1A16'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(sx, sy);
    // map region
    const cx = Math.round(camX), cy = Math.round(camY);
    const dx = cx < 0 ? -cx : 0, dy = cy < 0 ? -cy : 0;
    const sw = Math.min(W - dx, mapCanvas.width - Math.max(0, cx)), sh = Math.min(H - dy, mapCanvas.height - Math.max(0, cy));
    if (sw > 0 && sh > 0) ctx.drawImage(mapCanvas, Math.max(0, cx), Math.max(0, cy), sw, sh, dx, dy, sw, sh);
    // items (on the floor, under feet)
    const t = shimmer;
    for (const it of items) {
      if (it.taken) continue;
      if (it.needs && !(hooks.flag && hooks.flag(it.needs))) continue;
      const px = it.x * TILE * u - camX, py = it.y * TILE * u - camY;
      const bad = it.food && FOODS[it.food].kind === 'bad';
      ctx.beginPath(); ctx.ellipse(px, py - 8 * u, 11 * u, 5 * u, 0, 0, Math.PI * 2);
      ctx.fillStyle = it.ingredient ? `rgba(242,194,48,${0.35 + 0.25 * Math.sin(t * 5)})` : bad ? 'rgba(90,160,70,.28)' : 'rgba(255,220,120,.28)'; ctx.fill();
      const bob = Math.sin(t * 3 + it.i) * 1.5 * u;
      ctx.drawImage(art.food(it.icon, !it.item), Math.round(px - 16 * u), Math.round(py - FEET_Y * u + bob));
      if (it.ingredient) { ctx.fillStyle = '#F2C230'; ctx.font = `${10 * u}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('✦', px + 10 * u, py - 30 * u + Math.sin(t * 4) * 3 * u); }
    }
    for (const p of plates) {
      const px = p.x * TILE * u - camX, py = p.y * TILE * u - camY;
      const left = p.until - time; const a = left < 1.5 ? 0.3 + 0.7 * Math.abs(Math.sin(left * 8)) : 1;
      ctx.globalAlpha = a;
      ctx.beginPath(); ctx.ellipse(px, py - 8 * u, 11 * u, 5 * u, 0, 0, Math.PI * 2); ctx.fillStyle = p.bad ? 'rgba(90,160,70,.35)' : 'rgba(255,200,80,.4)'; ctx.fill();
      ctx.drawImage(art.food(FOODS[p.food].icon, true), Math.round(px - 16 * u), Math.round(py - FEET_Y * u));
      ctx.globalAlpha = 1;
    }
    // entities sorted by feet y
    const ents = [];
    for (const n of npcs) ents.push(n);
    if (goat) ents.push(goat);
    ents.push(tuvia);
    ents.sort((a, b) => a.y - b.y);
    for (const e of ents) {
      if (e === tuvia) drawEntity(e, art.tuvia(disguise, e.dir, e.frame));
      else if (e === goat) drawEntity(e, art.goat(e.dir, e.frame));
      else drawEntity(e, art.npc(e.id, e.look, e.dir, e.frame));
    }
    // "!" over the nearest talkable NPC / goat, chase marker over chasers
    for (const n of npcs) {
      const px = n.x * TILE * u - camX, py = n.y * TILE * u - camY - (FEET_Y - 2) * u * (n.look.scale || 1);
      if (n === nearNPC) bubble(px, py, '!', true);
      else if (n.mode === 'chase') { ctx.font = `${12 * u}px sans-serif`; ctx.textAlign = 'center'; ctx.fillStyle = n.def.chase.hazard ? '#3F7A3A' : '#C0262D'; ctx.fillText(n.def.chase.hazard ? '🥗' : '🍲', px, py - 4 * u + Math.sin(t * 10) * 2 * u); }
    }
    if (goat && nearGoat) bubble(goat.x * TILE * u - camX, goat.y * TILE * u - camY - 34 * u, '!', true);
    for (const b of bubbles) { const e = b.ent; bubble(e.x * TILE * u - camX, e.y * TILE * u - camY - (FEET_Y - 2) * u * (e.look && e.look.scale || 1), b.text, false); }
    // exit label
    for (let y = 0; y < map.rows.length; y++) { const x = map.rows[y].indexOf('E'); if (x >= 0 && map.rows[y][x + 1] === 'E') { const px = (x + 1) * TILE * u - camX, py = y * TILE * u - camY; ctx.font = `700 ${9 * u}px Rubik, sans-serif`; ctx.textAlign = 'center'; ctx.direction = 'rtl'; ctx.fillStyle = '#2B1D14'; ctx.fillText('🚕 למונית', px, py - 4 * u); } }
    ctx.restore();
    // minimap (top-left corner, LTR corner away from the HUD buttons)
    if (miniCanvas && !rush) {
      const mx = 6 * dpr, my = 6 * dpr;
      ctx.globalAlpha = 0.85; ctx.fillStyle = '#1F1A16'; ctx.fillRect(mx - 2 * dpr, my - 2 * dpr, miniCanvas.width + 4 * dpr, miniCanvas.height + 4 * dpr);
      ctx.drawImage(miniCanvas, mx, my); ctx.globalAlpha = 1;
      const dot = (e, col, r) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(mx + (e.x) * miniPx, my + (e.y - 0.5) * miniPx, r * dpr, 0, Math.PI * 2); ctx.fill(); };
      for (const n of npcs) dot(n, n.def.chase ? (n.def.chase.hazard ? '#6B9E3A' : '#E07A1F') : '#fff', 1.6);
      for (const it of items) if (!it.taken && it.ingredient && (!it.needs || (hooks.flag && hooks.flag(it.needs)))) dot(it, '#F2C230', 1.8);
      dot(tuvia, '#C0262D', 2.2);
    }
  }

  // ---------------------------------------------------------------- API
  return {
    load, update, render, resize,
    setInput(dx, dy) { input.dx = dx; input.dy = dy; },
    setDisguise(d) { disguise = d; },
    setPaused(p) { paused = p; if (p) { input.dx = 0; input.dy = 0; } },
    setFrozen(f) { frozen = f; },
    shake(sec = 0.6) { shakeT = sec; },
    say(npcId, text, sec = 2.6) { const e = npcId === 'tuvia' ? tuvia : npcs.find((n) => n.id === npcId); if (e) bubbles.push({ ent: e, text, until: time + sec }); },
    boostChase(npcId, k) { const n = npcs.find((x) => x.id === npcId); if (n) { n.chaseBoost = k; n.cooldown = 0; n.mode = 'chase'; } },
    npc(id) { return npcs.find((n) => n.id === id); },
    nearNPC() { return nearNPC; }, nearGoat() { return nearGoat; },
    tuvia() { return tuvia; }, idleTime() { return idle; }, time() { return time; },
    map() { return map; },
    takenItems() { return items.filter((i) => i.taken).map((i) => i.i); },
    goatFound() { return !!(goat && goat.found); },
    teleport(x, y) { tuvia.x = x + 0.5; tuvia.y = y + 0.98; updateCamera(true); },
    startRush(cfg) { rush = { cfg, spawnT: 0.3 }; plates = []; },
    stopRush() { rush = null; plates = []; },
    isRush() { return !!rush; },
    facePlayerAt(npcId) { const n = npcs.find((x) => x.id === npcId); if (n) { n.dir = dirOf(tuvia.x - n.x, tuvia.y - n.y, n.dir); tuvia.dir = dirOf(n.x - tuvia.x, n.y - tuvia.y, tuvia.dir); } },
    stopNPC(npcId) { const n = npcs.find((x) => x.id === npcId); if (n) { n.mode = 'return'; n.cooldown = Math.max(n.cooldown, n.def.chase ? n.def.chase.cooldown : 3); } },
    /** Snapshot of the whole map for the establishing shot. */
    snapshot(w, h) {
      if (!mapCanvas) return null;
      const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
      const s = Math.min(w / mapCanvas.width, h / mapCanvas.height); const dw = mapCanvas.width * s, dh = mapCanvas.height * s;
      x.fillStyle = '#1F1A16'; x.fillRect(0, 0, w, h);
      x.drawImage(mapCanvas, (w - dw) / 2, (h - dh) / 2, dw, dh);
      for (const n of npcs) { const sp = art.npc(n.id, n.look, n.dir, 0); x.drawImage(sp, (w - dw) / 2 + (n.x * TILE * u - 16 * u) * s, (h - dh) / 2 + (n.y * TILE * u - FEET_Y * u) * s, sp.width * s, sp.height * s); }
      const tv = art.tuvia(disguise, 'down', 0); x.drawImage(tv, (w - dw) / 2 + (tuvia.x * TILE * u - 16 * u) * s, (h - dh) / 2 + (tuvia.y * TILE * u - FEET_Y * u) * s, tv.width * s, tv.height * s);
      return c;
    },
    art() { return art; },
  };
}
