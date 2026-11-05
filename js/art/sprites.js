/* js/art/sprites.js — procedural canvas art for the walker: the top-down Tuvia sprite, the
 * NPC figure factory (SPEC §6.3 silhouette hooks), the goat, food icons and the tile set.
 * Everything is pre-rendered once per zoom level into small offscreen canvases, so the
 * per-frame cost of the render loop is a handful of drawImage calls.
 *
 * Sprite cell: 32 × 48 world units, feet at (16, 44); the tile the character stands on
 * spans y 12..44, so heads overhang the tile above (classic ¾ top-down look).
 */

import { C } from './tuvia.js';

const DIRS = ['down', 'up', 'left', 'right'];
export const SPRITE_W = 32, SPRITE_H = 48, FEET_Y = 44;

const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function circ(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); }
function ell(ctx, x, y, rx, ry) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); }
function stroke(ctx, color, w) { ctx.strokeStyle = color; ctx.lineWidth = w; ctx.stroke(); }
function fill(ctx, color) { ctx.fillStyle = color; ctx.fill(); }
function line(ctx, x1, y1, x2, y2, color, w, cap = 'round') { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineCap = cap; stroke(ctx, color, w); }

// ---------------------------------------------------------------------------
// Shared body parts (used by Tuvia and the NPC factory)
// ---------------------------------------------------------------------------
function legs(ctx, frame, color, opts = {}) {
  // frame 0 idle, 1 left leg up, 2 right leg up
  const lw = opts.thin ? 4 : 5, gap = opts.belly ? 2 : 1;
  const lx = 16 - gap - lw, rx = 16 + gap;
  const lh = frame === 1 ? 5 : 8, rh = frame === 2 ? 5 : 8;
  rr(ctx, lx, 36, lw, lh, 1.5); fill(ctx, color); stroke(ctx, C.line, 1);
  rr(ctx, rx, 36, lw, rh, 1.5); fill(ctx, color); stroke(ctx, C.line, 1);
  if (opts.sandals) { line(ctx, lx + 1, 36 + lh - 1.5, lx + lw - 1, 36 + lh - 1.5, '#8E6540', 1.2); line(ctx, rx + 1, 36 + rh - 1.5, rx + lw - 1, 36 + rh - 1.5, '#8E6540', 1.2); }
}

function torsoPath(ctx, wide = 0) {
  ctx.beginPath();
  ctx.moveTo(6 - wide, 23);
  ctx.quadraticCurveTo(16, 18, 26 + wide, 23);
  ctx.quadraticCurveTo(29 + wide, 30, 25 + wide, 37);
  ctx.lineTo(7 - wide, 37);
  ctx.quadraticCurveTo(3 - wide, 30, 6 - wide, 23);
  ctx.closePath();
}

function arms(ctx, dir, frame, skin, sleeve, opts = {}) {
  const sw = frame === 1 ? 2 : frame === 2 ? -2 : 0;
  const wide = opts.belly ? 2 : opts.thin ? -1 : 0;
  if (dir === 'down' || dir === 'up') {
    for (const [x, s] of [[4 - wide, sw], [28 + wide, -sw]]) {
      circ(ctx, x, 29 + s, 3); fill(ctx, sleeve); stroke(ctx, C.line, 1);
      circ(ctx, x, 33 + s, 2.3); fill(ctx, skin); stroke(ctx, C.line, 1);
    }
  } else {
    const x = dir === 'left' ? 12 : 20;
    circ(ctx, x, 29 + sw, 3); fill(ctx, sleeve); stroke(ctx, C.line, 1);
    circ(ctx, x + (dir === 'left' ? -1 : 1), 33 + sw, 2.3); fill(ctx, skin); stroke(ctx, C.line, 1);
  }
}

function headBase(ctx, dir, skin, r = 10) {
  // ears
  if (dir !== 'left') { circ(ctx, 26, 14, 2.2); fill(ctx, skin); stroke(ctx, C.line, 1); }
  if (dir !== 'right') { circ(ctx, 6, 14, 2.2); fill(ctx, skin); stroke(ctx, C.line, 1); }
  circ(ctx, 16, 13, r); fill(ctx, skin); stroke(ctx, C.line, 1.2);
}

function hairCap(ctx, dir, color, style, r = 10) {
  ctx.save();
  circ(ctx, 16, 13, r - 0.4); ctx.clip();
  ctx.fillStyle = color;
  if (dir === 'up') { ctx.fillRect(0, 0, 32, 24); }
  else if (dir === 'down') { ctx.beginPath(); ctx.moveTo(4, 14); ctx.quadraticCurveTo(8, 4, 16, 3); ctx.quadraticCurveTo(24, 4, 28, 14); ctx.lineTo(28, 0); ctx.lineTo(4, 0); ctx.closePath(); ctx.fill(); }
  else {
    const f = dir === 'left' ? 1 : -1;
    ctx.beginPath(); ctx.moveTo(16 - 12 * f, 0); ctx.lineTo(16 + 12 * f, 0); ctx.lineTo(16 + 12 * f, 24);
    ctx.quadraticCurveTo(16 + 2 * f, 20, 16 - 2 * f, 8); ctx.quadraticCurveTo(16 - 6 * f, 4, 16 - 12 * f, 6); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  if (style === 'ponytail') { ell(ctx, dir === 'left' ? 25 : dir === 'right' ? 7 : 16, dir === 'down' ? 6 : 20, 2.5, 6); fill(ctx, color); stroke(ctx, C.line, 1); }
  if (style === 'bun') { circ(ctx, 16, 4, 3.2); fill(ctx, color); stroke(ctx, C.line, 1); }
  if (style === 'wig') { // a bob that covers the ears
    ctx.beginPath(); ctx.moveTo(5, 12); ctx.quadraticCurveTo(5, 1, 16, 2); ctx.quadraticCurveTo(27, 1, 27, 12); ctx.lineTo(27, 19); ctx.quadraticCurveTo(24, 16, 23, 10); ctx.quadraticCurveTo(16, 8, 9, 10); ctx.quadraticCurveTo(8, 16, 5, 19); ctx.closePath();
    fill(ctx, color); stroke(ctx, C.line, 1);
  }
}

function faceSimple(ctx, dir, opts = {}) {
  if (dir === 'up') return;
  const eye = (x) => { circ(ctx, x, 14, 1.2); fill(ctx, '#2A1A12'); };
  if (dir === 'down') {
    if (opts.sunglasses) { rr(ctx, 8.5, 11.5, 6, 4.5, 1.5); fill(ctx, '#1b1b22'); rr(ctx, 17.5, 11.5, 6, 4.5, 1.5); fill(ctx, '#1b1b22'); line(ctx, 14.5, 13, 17.5, 13, '#1b1b22', 1.2); }
    else { eye(12); eye(20); }
    if (opts.mustache) { ctx.beginPath(); ctx.moveTo(11, 19); ctx.quadraticCurveTo(16, 16.5, 21, 19); ctx.quadraticCurveTo(16, 19.5, 11, 19); fill(ctx, '#3B2A21'); }
    ctx.beginPath(); ctx.moveTo(13, 20); ctx.quadraticCurveTo(16, 22.5, 19, 20); stroke(ctx, C.line, 1);
  } else {
    const x = dir === 'left' ? 11 : 21;
    if (opts.sunglasses) { rr(ctx, x - 3, 11.5, 6, 4.5, 1.5); fill(ctx, '#1b1b22'); } else eye(x);
    const nx = dir === 'left' ? 6.5 : 25.5; // nose
    ctx.beginPath(); ctx.moveTo(nx + (dir === 'left' ? 1 : -1), 14); ctx.quadraticCurveTo(nx - (dir === 'left' ? 1.5 : -1.5), 16.5, nx + (dir === 'left' ? 1.5 : -1.5), 18); stroke(ctx, C.line, 1);
    line(ctx, x - 2, 20.5, x + 2, 20.5, C.line, 1);
  }
}

// ---------------------------------------------------------------------------
// TUVIA (top-down caricature: big head, blond tuft, RED ROUND GLASSES, pinstripes, MINT SUSPENDERS)
// ---------------------------------------------------------------------------
function stripesFill(ctx, path, wide = 0) {
  ctx.save(); path(ctx, wide); ctx.clip();
  ctx.fillStyle = C.white; ctx.fillRect(0, 16, 32, 24);
  ctx.fillStyle = C.navy;
  for (let x = 4; x < 30; x += 3) ctx.fillRect(x, 16, 1.1, 24);
  ctx.restore();
  path(ctx, wide); stroke(ctx, C.line, 1.2);
}

function drawTuvia(ctx, dir, frame, disguise) {
  const u = 1;
  // legs + trousers
  legs(ctx, frame, C.pants);
  rr(ctx, 7, 33, 18, 5, 2); fill(ctx, C.pants); stroke(ctx, C.line, 1);
  // torso (pinstripes), slightly wider: the belly
  stripesFill(ctx, torsoPath, 1);
  // black jacket (bnei brak): over the sides, the stripes and suspenders peek through the gap
  if (disguise === 'bneibrak' && dir !== 'up') {
    ctx.save(); torsoPath(ctx, 1); ctx.clip();
    ctx.fillStyle = C.black; ctx.fillRect(0, 16, 10.5, 24); ctx.fillRect(21.5, 16, 12, 24);
    ctx.restore();
    line(ctx, 10.5, 22, 10.5, 37, C.line, 0.8, 'butt'); line(ctx, 21.5, 22, 21.5, 37, C.line, 0.8, 'butt');
  } else if (disguise === 'bneibrak') { ctx.save(); torsoPath(ctx, 1); ctx.clip(); ctx.fillStyle = C.black; ctx.fillRect(0, 16, 32, 24); ctx.restore(); }
  // collar
  if (dir === 'down') { ctx.beginPath(); ctx.moveTo(12, 22); ctx.lineTo(16, 27); ctx.lineTo(20, 22); stroke(ctx, C.collar, 2); }
  // SUSPENDERS
  const mint = (x1, y1, x2, y2, cx) => {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(cx, (y1 + y2) / 2, x2, y2); stroke(ctx, C.mintEdge, 3.6);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(cx, (y1 + y2) / 2, x2, y2); stroke(ctx, C.mint, 2.4);
  };
  if (dir === 'down') { mint(11.5, 21.5, 10.5, 35, 9); mint(20.5, 21.5, 21.5, 35, 23); }
  else if (dir === 'up') { mint(11, 21, 21, 35, 16); mint(21, 21, 11, 35, 16); }
  else { mint(16, 21, 16, 35, dir === 'left' ? 14 : 18); }
  if (disguise === 'tobi') { // lederhosen straps clipped over his own
    const leather = (x1, x2) => { ctx.beginPath(); ctx.moveTo(x1, 22); ctx.lineTo(x2, 35); stroke(ctx, C.leather, 1.6); };
    if (dir === 'down') { leather(11.5, 10.5); leather(20.5, 21.5); line(ctx, 10, 29, 22, 29, C.leather, 2); circ(ctx, 16, 29, 1.6); fill(ctx, C.leatherLite); }
    else if (dir === 'up') { leather(11, 21); leather(21, 11); } else leather(16, 16);
  }
  // clips
  if (dir !== 'up') for (const x of (dir === 'down' ? [10.5, 21.5] : [16])) { rr(ctx, x - 1.8, 33.5, 3.6, 2.6, 0.6); fill(ctx, C.silver); stroke(ctx, C.silverEdge, 0.7); }
  // arms with rolled white/navy cuffs
  arms(ctx, dir, frame, C.skin, '#ffffff', { belly: true });
  if (disguise === 'guest' && dir !== 'up') { // the fork
    const fx = dir === 'left' ? 9 : dir === 'right' ? 23 : 29;
    line(ctx, fx, 36, fx, 29, C.silver, 1.6); for (const d of [-1.3, 0, 1.3]) line(ctx, fx + d, 29.5, fx + d, 27, C.silverEdge, 0.8, 'butt');
  }
  // head
  headBase(ctx, dir, C.skin, 10.5);
  // blond hair, swept up and back, with a tuft
  hairCap(ctx, dir, C.hair, null, 10.5);
  if (dir !== 'up') {
    ctx.beginPath();
    if (dir === 'down') { ctx.moveTo(9, 5); ctx.quadraticCurveTo(14, -1, 23, 2); ctx.quadraticCurveTo(26, 3, 25, 6); ctx.quadraticCurveTo(20, 2.5, 13, 5.5); }
    else if (dir === 'left') { ctx.moveTo(9, 6); ctx.quadraticCurveTo(13, -1, 22, 2); ctx.quadraticCurveTo(26, 4, 26, 8); ctx.quadraticCurveTo(21, 3, 12, 6); }
    else { ctx.moveTo(23, 6); ctx.quadraticCurveTo(19, -1, 10, 2); ctx.quadraticCurveTo(6, 4, 6, 8); ctx.quadraticCurveTo(11, 3, 20, 6); }
    ctx.closePath(); fill(ctx, C.hair); stroke(ctx, C.line, 1);
    line(ctx, 12, 4, 20, 2.5, C.hairLite, 1.2);
  } else { line(ctx, 10, 6, 16, 3, C.hairLite, 1.2); line(ctx, 16, 3, 22, 6, C.hairLite, 1.2); }
  // cheeks + face
  if (dir === 'down') { for (const x of [8.5, 23.5]) { circ(ctx, x, 17.5, 2); ctx.globalAlpha = 0.5; fill(ctx, C.blush); ctx.globalAlpha = 1; } }
  else if (dir !== 'up') { circ(ctx, dir === 'left' ? 9 : 23, 17.5, 2); ctx.globalAlpha = 0.5; fill(ctx, C.blush); ctx.globalAlpha = 1; }
  // THE RED GLASSES
  const lens = (x) => { circ(ctx, x, 14.5, 4.2); ctx.globalAlpha = 0.25; fill(ctx, C.lens); ctx.globalAlpha = 1; stroke(ctx, C.red, 1.7); circ(ctx, x, 14.5, 3.2); stroke(ctx, C.redInner, 0.5); };
  if (dir === 'down') {
    lens(11.8); lens(20.2); line(ctx, 15.6, 14, 16.4, 14, C.red, 1.6); line(ctx, 7.6, 13.5, 6, 13, C.red, 1.2); line(ctx, 24.4, 13.5, 26, 13, C.red, 1.2);
    for (const [x, d] of [[12.5, 1], [19.5, -1]]) { circ(ctx, x, 15, 1.3); fill(ctx, '#2A1A12'); circ(ctx, x - 0.4, 14.5, 0.4); fill(ctx, '#fff'); line(ctx, x - 3 * d - d, 9.5, x + 2 * d, 10.5 - (d < 0 ? 1 : 0), C.brow, 1.3); }
    ctx.beginPath(); ctx.moveTo(12, 20.5); ctx.quadraticCurveTo(16, 23.5, 20.5, 20); stroke(ctx, C.line, 1.1); // the smirk
  } else if (dir === 'up') {
    line(ctx, 5.5, 14, 8, 13.5, C.red, 1.4); line(ctx, 26.5, 14, 24, 13.5, C.red, 1.4);
  } else {
    const x = dir === 'left' ? 11 : 21, f = dir === 'left' ? 1 : -1;
    circ(ctx, x, 15, 1.3); fill(ctx, '#2A1A12');
    lens(x); line(ctx, x + 4 * f, 14, x + 7 * f, 13.5, C.red, 1.3);
    const nx = dir === 'left' ? 5.5 : 26.5;
    ctx.beginPath(); ctx.moveTo(nx + 1.5 * f, 15); ctx.quadraticCurveTo(nx - 0.5 * f, 17.5, nx + 2 * f, 18.5); stroke(ctx, C.line, 1);
    ctx.beginPath(); ctx.moveTo(x - 1 * f, 20.8); ctx.quadraticCurveTo(x + 2 * f, 22, x + 4 * f, 20); stroke(ctx, C.line, 1);
  }
  // disguise headwear
  if (disguise === 'tobi') {
    ell(ctx, 16, 6, 12, 2.6); fill(ctx, C.tyrol); stroke(ctx, C.line, 1);
    ctx.beginPath(); ctx.moveTo(9, 6); ctx.lineTo(10.5, -1); ctx.quadraticCurveTo(16, -3.5, 21.5, -1); ctx.lineTo(23, 6); ctx.closePath(); fill(ctx, C.tyrol); stroke(ctx, C.line, 1);
    line(ctx, 9.5, 4, 22.5, 4, C.tyrolDark, 1.8, 'butt');
    ctx.beginPath(); ctx.moveTo(21, 1); ctx.quadraticCurveTo(25, -5, 29, -4); ctx.quadraticCurveTo(25, -3, 22.5, 2); ctx.closePath(); fill(ctx, C.feather); stroke(ctx, C.line, 0.8);
    circ(ctx, 20.5, 2.5, 1); fill(ctx, C.canRed);
  } else if (disguise === 'bneibrak') {
    circ(ctx, 16, 5, 7); fill(ctx, C.black); // the velvet kippah under a too-small hat
    ell(ctx, 16, 3, 9, 2.4); fill(ctx, C.black); stroke(ctx, C.line, 1);
    rr(ctx, 10.5, -5, 11, 8.5, 2.5); fill(ctx, C.black); stroke(ctx, C.line, 1);
    line(ctx, 11, 1.5, 21, 1.5, C.blackLite, 1.2, 'butt');
  } else if (disguise === 'guest' && dir !== 'up') {
    ctx.beginPath(); ctx.moveTo(11.5, 22.5); ctx.lineTo(20.5, 22.5); ctx.lineTo(16, 31); ctx.closePath(); fill(ctx, '#fff'); stroke(ctx, C.line, 0.9);
    ctx.save(); ctx.beginPath(); ctx.moveTo(11.5, 22.5); ctx.lineTo(20.5, 22.5); ctx.lineTo(16, 31); ctx.closePath(); ctx.clip();
    ctx.globalAlpha = 0.45; ctx.strokeStyle = C.canRed; ctx.lineWidth = 0.8; for (let i = 10; i < 22; i += 3) { ctx.beginPath(); ctx.moveTo(i, 20); ctx.lineTo(i, 32); ctx.stroke(); ctx.beginPath(); ctx.moveTo(8, i + 12); ctx.lineTo(24, i + 12); ctx.stroke(); }
    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// NPC factory: draws a figure from a `look` object (see js/content/npcs.js)
// ---------------------------------------------------------------------------
function drawNPC(ctx, dir, frame, look) {
  const skin = look.skin || C.skin, body = look.body || '#777';
  const sc = look.scale || 1;
  ctx.translate(16, FEET_Y); ctx.scale(sc, sc); ctx.translate(-16, -FEET_Y);
  const wide = look.belly ? 2 : look.thin ? -2 : 0;
  // guitar on the back
  if (look.guitar && dir === 'up') { ell(ctx, 16, 28, 6, 8); fill(ctx, '#A9744B'); stroke(ctx, C.line, 1); line(ctx, 16, 20, 22, 6, '#5B3A21', 2.4); }
  legs(ctx, frame, look.legs || (look.sandals ? '#C9B98A' : '#1B2034'), { thin: look.thin, belly: look.belly, sandals: look.sandals });
  torsoPath(ctx, wide); fill(ctx, body); stroke(ctx, C.line, 1.2);
  if (look.apron && dir !== 'up') { ctx.beginPath(); ctx.moveTo(10, 24); ctx.lineTo(22, 24); ctx.lineTo(23, 37); ctx.lineTo(9, 37); ctx.closePath(); fill(ctx, '#fff'); stroke(ctx, C.line, 0.8); }
  if (look.badge && dir === 'down') { rr(ctx, 9, 25, 4, 2.6, 0.5); fill(ctx, '#F2C230'); stroke(ctx, C.line, 0.6); }
  if (look.gold && dir === 'down') { ctx.beginPath(); ctx.moveTo(11, 23); ctx.quadraticCurveTo(16, 28, 21, 23); stroke(ctx, C.gold, 1); }
  if (look.flour) { ctx.fillStyle = 'rgba(255,255,255,.8)'; for (const [x, y] of [[9, 28], [14, 34], [21, 30], [18, 26], [24, 35]]) { circ(ctx, x, y, 0.9); ctx.fill(); } }
  arms(ctx, dir, frame, skin, body, { belly: look.belly, thin: look.thin });
  // held things
  if (dir !== 'up') {
    if (look.ladle) { const x = dir === 'left' ? 8 : 27; line(ctx, x, 36, x + 1, 24, '#8E6540', 1.6); circ(ctx, x + 1.2, 23, 2.2); fill(ctx, C.silver); stroke(ctx, C.silverEdge, 0.8); }
    if (look.tray) { rr(ctx, 5, 30, 22, 5, 1.5); fill(ctx, '#B9B3A3'); stroke(ctx, C.line, 0.9); ell(ctx, 11, 30.5, 4, 2.2); fill(ctx, '#D9C48A'); ell(ctx, 20, 30.5, 4.5, 2.2); fill(ctx, '#6B9E3A'); }
    if (look.pot) { rr(ctx, 5, 26, 22, 12, 3); fill(ctx, '#6E7681'); stroke(ctx, C.line, 1.2); rr(ctx, 4, 25, 24, 3, 1); fill(ctx, '#9AA3AE'); stroke(ctx, C.line, 0.8); ell(ctx, 16, 26.5, 9, 1.6); fill(ctx, '#8B5A2B'); line(ctx, 2, 30, 5, 30, C.line, 2); line(ctx, 27, 30, 30, 30, C.line, 2); }
    if (look.phones) { for (const x of [5, 27]) { rr(ctx, x - 2, 30, 4, 6, 0.8); fill(ctx, '#111'); stroke(ctx, C.line, 0.6); rr(ctx, x - 1.3, 31, 2.6, 4, 0.3); fill(ctx, x < 16 ? '#6CC' : '#F9C'); } }
    if (look.guitar && dir === 'down') { ctx.save(); ctx.translate(16, 30); ctx.rotate(-0.6); ell(ctx, 0, 0, 7, 5); fill(ctx, '#A9744B'); stroke(ctx, C.line, 1); circ(ctx, 1, 0, 1.8); fill(ctx, C.line); line(ctx, 5, -1, 15, -4, '#5B3A21', 2.2); ctx.restore(); }
    if (look.sign && dir === 'down') { rr(ctx, 6, 24, 20, 9, 1); fill(ctx, '#fff'); stroke(ctx, C.line, 1); for (const [x1, x2, y] of [[9, 23, 27.5], [11, 21, 30]]) line(ctx, x1, y, x2, y, C.line, 1.4); }
    if (look.fingers && dir === 'down') { circ(ctx, 28, 24, 3); fill(ctx, skin); stroke(ctx, C.line, 1); for (const d of [-2, 0, 2]) line(ctx, 28 + d, 22, 28 + d, 18, skin, 1.6); for (const d of [-2, 0, 2]) line(ctx, 28 + d, 22, 28 + d, 18, C.line, 0.4); }
  }
  // head
  headBase(ctx, dir, skin, 9.5);
  if (look.hair && !look.scarf) hairCap(ctx, dir, look.hair, look.hairStyle, 9.5);
  if (look.bald) { circ(ctx, 13, 8, 1.4); ctx.globalAlpha = .5; fill(ctx, '#fff'); ctx.globalAlpha = 1; if (dir !== 'up') { line(ctx, 7, 11, 9, 7, '#555', 1); line(ctx, 25, 11, 23, 7, '#555', 1); } }
  if (look.scarf) { // head scarf: covers hair and the sides, face shows
    ctx.beginPath(); ctx.moveTo(6, 15); ctx.quadraticCurveTo(6, 2, 16, 2.5); ctx.quadraticCurveTo(26, 2, 26, 15); ctx.lineTo(27, 24); ctx.quadraticCurveTo(22, 19, 22, 11); ctx.quadraticCurveTo(16, 8, 10, 11); ctx.quadraticCurveTo(10, 19, 5, 24); ctx.closePath();
    fill(ctx, look.scarf); stroke(ctx, C.line, 1);
    if (dir === 'up') { circ(ctx, 16, 12, 9); fill(ctx, look.scarf); }
  }
  faceSimple(ctx, dir, { sunglasses: look.sunglasses, mustache: look.mustache });
  if (look.peyot && dir !== 'up') { for (const x of (dir === 'down' ? [6.5, 25.5] : dir === 'left' ? [8] : [24])) { ctx.beginPath(); ctx.moveTo(x, 13); ctx.quadraticCurveTo(x - 1.5, 17, x + 1, 20); ctx.quadraticCurveTo(x - 1.5, 23, x + 0.5, 26); stroke(ctx, look.hair || '#2A1A12', 1.6); } }
  if (look.beard && dir !== 'up') {
    const col = look.beard === 'grey' ? '#B8B8B0' : look.beard === 'short' ? '#777' : '#5A3A1E';
    ctx.beginPath();
    if (look.beard === 'huge') { ctx.moveTo(7, 15); ctx.quadraticCurveTo(7, 34, 16, 36); ctx.quadraticCurveTo(25, 34, 25, 15); ctx.quadraticCurveTo(16, 24, 7, 15); }
    else if (look.beard === 'grey') { ctx.moveTo(8, 16); ctx.quadraticCurveTo(9, 28, 16, 29); ctx.quadraticCurveTo(23, 28, 24, 16); ctx.quadraticCurveTo(16, 23, 8, 16); }
    else { ctx.moveTo(9, 17); ctx.quadraticCurveTo(10, 23, 16, 23.5); ctx.quadraticCurveTo(22, 23, 23, 17); ctx.quadraticCurveTo(16, 22, 9, 17); }
    ctx.closePath(); fill(ctx, col); stroke(ctx, C.line, 1);
    if (dir === 'down' && look.beard !== 'short') { ctx.beginPath(); ctx.moveTo(13.5, 20.5); ctx.quadraticCurveTo(16, 22, 18.5, 20.5); stroke(ctx, '#2A1A12', 0.9); }
  }
  if (look.kippah) { const col = look.kippah === 'knit' ? '#4C9476' : '#111'; ell(ctx, 16, dir === 'down' ? 4.5 : 6, 5.5, 2.4); fill(ctx, col); stroke(ctx, C.line, 0.8); if (look.kippah === 'knit') { ctx.strokeStyle = '#E5B632'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.ellipse(16, dir === 'down' ? 4.5 : 6, 3.5, 1.4, 0, 0, Math.PI * 2); ctx.stroke(); } }
  if (look.hat === 'black') {
    ell(ctx, 16, 5, 13, 3.2); fill(ctx, C.black); stroke(ctx, C.line, 1);
    rr(ctx, 8, -4, 16, 9.5, 3); fill(ctx, C.black); stroke(ctx, C.line, 1);
    line(ctx, 8.5, 2.5, 23.5, 2.5, C.blackLite, 1.4, 'butt');
  }
}

// ---------------------------------------------------------------------------
// The goat (העז), silently disappointed, 2 frames (tail flick)
// ---------------------------------------------------------------------------
function drawGoat(ctx, dir, frame) {
  const fur = '#EFEEE9', shade = '#CFCCC2';
  const flip = dir === 'right';
  if (flip) { ctx.translate(32, 0); ctx.scale(-1, 1); }
  for (const x of [9, 13, 20, 24]) { rr(ctx, x, 34, 3.2, 9 + (frame && (x === 9 || x === 20) ? -2 : 0), 1); fill(ctx, shade); stroke(ctx, C.line, 0.9); }
  ctx.beginPath(); ctx.moveTo(26, 26); ctx.quadraticCurveTo(31, 22 - frame * 3, 29, 19); stroke(ctx, C.line, 2.6); ctx.beginPath(); ctx.moveTo(26, 26); ctx.quadraticCurveTo(31, 22 - frame * 3, 29, 19); stroke(ctx, fur, 1.4);
  ell(ctx, 17, 29, 11, 7); fill(ctx, fur); stroke(ctx, C.line, 1.2);
  ctx.beginPath(); ctx.moveTo(8, 27); ctx.lineTo(5, 20); ctx.lineTo(10, 19); ctx.closePath(); fill(ctx, fur); stroke(ctx, C.line, 1);
  ell(ctx, 6, 20, 5.5, 4.5); fill(ctx, fur); stroke(ctx, C.line, 1.1);
  rr(ctx, -1, 19.5, 8, 5.5, 2.4); fill(ctx, fur); stroke(ctx, C.line, 1);
  circ(ctx, 0.6, 22.5, 0.6); fill(ctx, C.line);
  for (const [x1, x2] of [[4, 5], [8, 10]]) { ctx.beginPath(); ctx.moveTo(x1, 16.5); ctx.quadraticCurveTo(x1 - 0.5, 12, x2, 10.5); stroke(ctx, C.leatherLite, 1.6); }
  ctx.beginPath(); ctx.moveTo(10, 18); ctx.quadraticCurveTo(14, 16, 13, 20.5); ctx.closePath(); fill(ctx, fur); stroke(ctx, C.line, 0.8); // ear
  ctx.beginPath(); ctx.moveTo(3, 25); ctx.lineTo(4, 28.5); ctx.lineTo(5.5, 25); ctx.closePath(); fill(ctx, shade); stroke(ctx, C.line, 0.7); // beard
  circ(ctx, 7.5, 22, 1.1); fill(ctx, C.gold); // bell
  ell(ctx, 4.5, 20, 2, 1.6); fill(ctx, '#fff'); stroke(ctx, C.line, 0.6); rr(ctx, 3.2, 19.6, 2.6, 0.9, 0.4); fill(ctx, '#2A1A12');
  line(ctx, 2.5, 17.5, 6.5, 18.5, C.line, 0.9); // the disappointed brow
}

// ---------------------------------------------------------------------------
// Food icons (16 × 16 local units), drawn on a plate when `plate` is true
// ---------------------------------------------------------------------------
const FOOD_DRAW = {
  pot(ctx) { rr(ctx, 2, 5, 12, 9, 2); fill(ctx, '#6E7681'); stroke(ctx, C.line, 1); rr(ctx, 1, 4, 14, 2.5, 1); fill(ctx, '#9AA3AE'); stroke(ctx, C.line, .8); ell(ctx, 8, 3.5, 5, 1.5); fill(ctx, '#C9C9C9'); stroke(ctx, C.line, .8); line(ctx, 0, 8, 2, 8, C.line, 1.5); line(ctx, 14, 8, 16, 8, C.line, 1.5); },
  gfpot(ctx) { FOOD_DRAW.pot(ctx); circ(ctx, 8, 9.5, 3); fill(ctx, '#9DB06A'); ctx.fillStyle = '#fff'; ctx.font = 'bold 3.5px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('GF', 8, 10.8); },
  wedge(ctx) { ctx.beginPath(); ctx.moveTo(2, 13); ctx.lineTo(14, 13); ctx.lineTo(8, 3); ctx.closePath(); fill(ctx, '#8B4A1A'); stroke(ctx, C.line, 1); line(ctx, 5, 11, 11, 11, '#C27A3A', 1); ctx.fillStyle = '#2A1A12'; for (const [x, y] of [[6, 9], [9, 7], [8, 11]]) { circ(ctx, x, y, .5); ctx.fill(); } },
  potato(ctx) { ell(ctx, 8, 9, 6.5, 4.5); fill(ctx, '#C58F5F'); stroke(ctx, C.line, 1); line(ctx, 4, 7, 12, 7, '#E7B57A', 1.2); },
  fish(ctx) { ell(ctx, 7, 9, 6, 3.5); fill(ctx, '#D8D4C8'); stroke(ctx, C.line, 1); ctx.beginPath(); ctx.moveTo(13, 9); ctx.lineTo(16, 6); ctx.lineTo(16, 12); ctx.closePath(); fill(ctx, '#D8D4C8'); stroke(ctx, C.line, 1); circ(ctx, 3, 8, .7); fill(ctx, C.line); circ(ctx, 7, 4, 2.5); fill(ctx, '#8E3B8E'); },
  herring(ctx) { ell(ctx, 7, 9, 6.5, 3); fill(ctx, '#A9B4C4'); stroke(ctx, C.line, 1); ctx.beginPath(); ctx.moveTo(13, 9); ctx.lineTo(16, 6.5); ctx.lineTo(16, 11.5); ctx.closePath(); fill(ctx, '#A9B4C4'); stroke(ctx, C.line, 1); circ(ctx, 3, 8.5, .7); fill(ctx, C.line); },
  kishke(ctx) { rr(ctx, 1, 6, 14, 6, 3); fill(ctx, '#D9742C'); stroke(ctx, C.line, 1); line(ctx, 4, 7.5, 12, 7.5, '#F0A05C', 1); },
  jelly(ctx) { rr(ctx, 2, 5, 12, 9, 3); fill(ctx, '#F2D16B'); ctx.globalAlpha = .9; stroke(ctx, C.line, 1); ctx.globalAlpha = 1; circ(ctx, 6, 9, 1.4); fill(ctx, '#E39B4B'); circ(ctx, 10, 10, 1); fill(ctx, '#fff'); },
  dumpling(ctx) { ctx.beginPath(); ctx.moveTo(2, 11); ctx.quadraticCurveTo(8, -1, 14, 11); ctx.closePath(); fill(ctx, '#EBD7B0'); stroke(ctx, C.line, 1); line(ctx, 4, 10, 12, 10, '#C9A86E', 1); },
  liver(ctx) { ell(ctx, 8, 9, 6, 4); fill(ctx, '#7A4A2A'); stroke(ctx, C.line, 1); circ(ctx, 5, 8, 1); fill(ctx, '#F2EBDD'); circ(ctx, 10, 10, 1); fill(ctx, '#F2EBDD'); },
  rugelach(ctx) { ctx.beginPath(); ctx.moveTo(3, 12); ctx.quadraticCurveTo(2, 4, 9, 4); ctx.quadraticCurveTo(14, 4, 13, 10); ctx.quadraticCurveTo(12, 13, 8, 12); ctx.closePath(); fill(ctx, '#A9744B'); stroke(ctx, C.line, 1); ctx.beginPath(); ctx.moveTo(6, 10); ctx.quadraticCurveTo(7, 6, 11, 7); stroke(ctx, '#4A2A14', 1.2); },
  babka(ctx) { rr(ctx, 2, 5, 12, 9, 2.5); fill(ctx, '#B07A45'); stroke(ctx, C.line, 1); for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(3 + i * 4, 6); ctx.quadraticCurveTo(5 + i * 4, 9, 3 + i * 4, 13); stroke(ctx, '#4A2A14', 1.1); } },
  noodles(ctx) { ell(ctx, 8, 10, 7, 4); fill(ctx, '#F2D16B'); stroke(ctx, C.line, 1); for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(3, 8 + i * 1.5); ctx.quadraticCurveTo(8, 6 + i * 1.5, 13, 8 + i * 1.5); stroke(ctx, '#C9A227', .8); } },
  schnitzel(ctx) { ell(ctx, 8, 9, 7, 4.5); fill(ctx, '#D9A441'); stroke(ctx, C.line, 1); ctx.fillStyle = '#A9742B'; for (const [x, y] of [[5, 8], [9, 7], [11, 10], [7, 11]]) { circ(ctx, x, y, .6); ctx.fill(); } },
  can(ctx) { rr(ctx, 5, 2, 6, 12, 1.5); fill(ctx, '#1E1E22'); stroke(ctx, C.line, 1); rr(ctx, 5, 6, 6, 3, 0); fill(ctx, '#D9262C'); ell(ctx, 8, 2, 3, 1); fill(ctx, C.silver); },
  coffee(ctx) { rr(ctx, 2, 6, 8, 7, 1.5); fill(ctx, '#fff'); stroke(ctx, C.line, 1); ell(ctx, 6, 7, 3.2, 1); fill(ctx, '#4A2A14'); circ(ctx, 11, 9.5, 2); stroke(ctx, C.line, 1); ctx.beginPath(); ctx.moveTo(11, 14); ctx.lineTo(16, 14); ctx.lineTo(14.5, 9); ctx.closePath(); fill(ctx, '#C58F5F'); stroke(ctx, C.line, .8); },
  quinoa(ctx) { ell(ctx, 8, 10, 7, 4); fill(ctx, '#EAD9B0'); stroke(ctx, C.line, 1); ctx.fillStyle = '#B99C58'; for (let i = 0; i < 9; i++) { circ(ctx, 3 + (i * 37) % 11, 8 + (i * 13) % 4, .55); ctx.fill(); } },
  kale(ctx) { for (const [x, y] of [[5, 8], [10, 7], [8, 11], [12, 11], [4, 12]]) { ctx.beginPath(); ctx.moveTo(x, y); for (let a = 0; a < Math.PI * 2; a += 1) ctx.quadraticCurveTo(x + Math.cos(a + .5) * 3.6, y + Math.sin(a + .5) * 3.6, x + Math.cos(a + 1) * 2.4, y + Math.sin(a + 1) * 2.4); fill(ctx, '#3F7A3A'); stroke(ctx, '#1F4A1F', .6); } },
  bread(ctx) { rr(ctx, 2, 6, 12, 7, 3); fill(ctx, '#8E6540'); stroke(ctx, C.line, 1); line(ctx, 5, 7.5, 7, 10, '#C9A86E', 1); line(ctx, 9, 7.5, 11, 10, '#C9A86E', 1); },
  yogurt(ctx) { ctx.beginPath(); ctx.moveTo(4, 4); ctx.lineTo(12, 4); ctx.lineTo(11, 14); ctx.lineTo(5, 14); ctx.closePath(); fill(ctx, '#fff'); stroke(ctx, C.line, 1); rr(ctx, 3.5, 3, 9, 2, .5); fill(ctx, '#CFCCC2'); circ(ctx, 8, 9, 2); fill(ctx, '#EFEEE9'); line(ctx, 6.5, 8, 9.5, 8, C.line, .6); },
  tea(ctx) { rr(ctx, 4, 4, 8, 10, 1); ctx.globalAlpha = .9; fill(ctx, '#D8B36A'); ctx.globalAlpha = 1; stroke(ctx, C.line, 1); ell(ctx, 8, 8, 2.4, 1.2); fill(ctx, '#3F7A3A'); line(ctx, 8, 2, 8, 6, '#3F7A3A', .8); },
  chia(ctx) { ell(ctx, 8, 10, 7, 4); fill(ctx, '#B8B5AE'); stroke(ctx, C.line, 1); ctx.fillStyle = '#2A2A2A'; for (let i = 0; i < 12; i++) { circ(ctx, 3 + (i * 29) % 11, 8 + (i * 7) % 4, .5); ctx.fill(); } circ(ctx, 8, 10, 1.2); fill(ctx, '#fff'); circ(ctx, 8, 10, .5); fill(ctx, '#000'); },
  tofu(ctx) { rr(ctx, 3, 5, 10, 8, 1); fill(ctx, '#F7F5EE'); stroke(ctx, C.line, 1); line(ctx, 3, 9, 13, 9, '#D8D4C8', .8); },
  latte(ctx) { rr(ctx, 3, 4, 9, 10, 1.5); fill(ctx, '#EAD9B0'); stroke(ctx, C.line, 1); ell(ctx, 7.5, 5, 4, 1.3); fill(ctx, '#fff'); circ(ctx, 13.5, 9, 2); stroke(ctx, C.line, 1); },
  sprouts(ctx) { for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(3 + i * 2, 14); ctx.quadraticCurveTo(2 + i * 2.2, 8, 5 + i * 1.8, 4); stroke(ctx, '#7FBF5F', 1.1); circ(ctx, 5 + i * 1.8, 4, .8); fill(ctx, '#C9B98A'); } },
  canape(ctx) { rr(ctx, 3, 7, 10, 6, 1); fill(ctx, '#EAD9B0'); stroke(ctx, C.line, 1); circ(ctx, 8, 7, 2.5); fill(ctx, '#3F6AA9'); ctx.fillStyle = '#F2C230'; for (let i = 0; i < 6; i++) { circ(ctx, 8 + Math.cos(i) * 1.6, 7 + Math.sin(i) * 1.6, .35); ctx.fill(); } },
  bowl(ctx) { ell(ctx, 8, 10, 7, 4); fill(ctx, '#E39BB8'); stroke(ctx, C.line, 1); circ(ctx, 6, 9, 1); fill(ctx, '#3F7A3A'); circ(ctx, 10, 9.5, 1); fill(ctx, '#F2C230'); },
  shakshuka(ctx) { circ(ctx, 7, 9, 6); fill(ctx, '#C0262D'); stroke(ctx, C.line, 1); circ(ctx, 6, 8, 2.2); fill(ctx, '#fff'); circ(ctx, 6, 8, 1); fill(ctx, '#F2C230'); line(ctx, 13, 9, 16, 9, C.line, 1.5); },
  tray(ctx) { rr(ctx, 1, 5, 14, 8, 1); fill(ctx, '#B9B3A3'); stroke(ctx, C.line, 1); rr(ctx, 2.5, 6.5, 5, 5, .5); fill(ctx, '#D9C48A'); rr(ctx, 8.5, 6.5, 5, 5, .5); fill(ctx, '#8E6540'); },
  beans(ctx) { ctx.beginPath(); ctx.moveTo(3, 14); ctx.lineTo(4, 5); ctx.quadraticCurveTo(8, 2, 12, 5); ctx.lineTo(13, 14); ctx.closePath(); fill(ctx, '#C9B98A'); stroke(ctx, C.line, 1); ctx.fillStyle = '#7A4A2A'; for (const [x, y] of [[6, 8], [9, 7], [8, 11], [11, 10], [5, 12]]) { ell(ctx, x, y, 1.3, .8); ctx.fill(); } },
  barley(ctx) { for (let i = 0; i < 3; i++) { line(ctx, 5 + i * 3, 14, 5 + i * 3, 5, '#C9A227', 1); for (let j = 0; j < 3; j++) { ell(ctx, 5 + i * 3, 5 + j * 2.5, 1.2, .9); fill(ctx, '#E5B632'); } } },
  spice(ctx) { rr(ctx, 4, 4, 8, 10, 1.5); fill(ctx, '#B5452B'); stroke(ctx, C.line, 1); rr(ctx, 5, 1.5, 6, 3, .5); fill(ctx, '#333'); },
  fire(ctx) { ctx.beginPath(); ctx.moveTo(8, 2); ctx.quadraticCurveTo(14, 8, 10, 14); ctx.quadraticCurveTo(6, 14, 4, 10); ctx.quadraticCurveTo(3, 7, 8, 2); fill(ctx, '#E8722B'); stroke(ctx, C.line, 1); ctx.beginPath(); ctx.moveTo(8, 7); ctx.quadraticCurveTo(11, 10, 8.5, 13); ctx.quadraticCurveTo(6, 12, 8, 7); fill(ctx, '#F2C230'); },
  star(ctx) { ctx.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 2.6 : 6.5, a = -Math.PI / 2 + i * Math.PI / 5; ctx.lineTo(8 + Math.cos(a) * r, 8 + Math.sin(a) * r); } ctx.closePath(); fill(ctx, '#F2C230'); stroke(ctx, C.line, 1); },
};

// ---------------------------------------------------------------------------
// Tiles (32 × 32 local units). `n` = neighbours { up, down, left, right } chars.
// ---------------------------------------------------------------------------
const SOLID = new Set(['#', '=', 'T', 'h', 'b', 'f', 'S', 'X', 'L', 'O', 'P', 'g', 'r', 'k', 's', 'V', 't', '~', 'Q']);
export const isSolid = (ch) => SOLID.has(ch);

function hash(x, y) { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >> 13)) * 1274126177; return ((h ^ (h >> 16)) >>> 0) / 4294967295; }

function floorTile(ctx, x, y, pal, alt) {
  ctx.fillStyle = alt ? pal.floor2 : pal.floor; ctx.fillRect(0, 0, 32, 32);
  const h = hash(x, y);
  if (pal.grass && alt) { // settlement ground: dirt with grass tufts
    ctx.fillStyle = pal.grass; ctx.globalAlpha = .9;
    for (let i = 0; i < 3; i++) { const gx = 4 + ((h * 97 + i * 31) % 24), gy = 4 + ((h * 53 + i * 17) % 24); ctx.beginPath(); ctx.moveTo(gx, gy + 3); ctx.lineTo(gx + 1.5, gy - 2); ctx.lineTo(gx + 3, gy + 3); ctx.closePath(); ctx.fill(); }
    ctx.globalAlpha = 1;
  } else {
    ctx.strokeStyle = 'rgba(0,0,0,.06)'; ctx.lineWidth = 1; ctx.strokeRect(.5, .5, 31, 31);
    if (h > .7) { ctx.fillStyle = 'rgba(0,0,0,.05)'; ctx.fillRect(6 + h * 10, 6 + h * 8, 6, 3); }
  }
}

function drawTile(ctx, ch, x, y, pal, n) {
  const alt = ch === ',';
  if (ch === 'b' || ch === 'f' || ch === 'g' || ch === 's' || ch === 'r' || ch === 'k' || ch === 'm' || ch === 'E' || ch === 'd') floorTile(ctx, x, y, pal, pal.grass ? true : alt);
  else if (ch !== '#' && ch !== 'P' && ch !== 'S') floorTile(ctx, x, y, pal, alt);
  switch (ch) {
    case '#': case 'P': case 'S': {
      const front = n.down !== '#' && n.down !== 'P' && n.down !== 'S';
      ctx.fillStyle = pal.wallTop; ctx.fillRect(0, 0, 32, 32);
      ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 1; ctx.strokeRect(.5, .5, 31, 31);
      if (front) { ctx.fillStyle = pal.wall; ctx.fillRect(0, 18, 32, 14); ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(0, 18, 32, 2); }
      if (ch === 'P' && front) { // pashkevilim: white posters with black "text" lines, overlapping
        for (let i = 0; i < 2; i++) { const px = 2 + i * 15 + hash(x + i, y) * 4, py = 20 + hash(x, y + i) * 2; ctx.fillStyle = i ? '#F2EBDD' : '#FFF8E6'; ctx.fillRect(px, py, 12, 10); ctx.fillStyle = '#222'; ctx.fillRect(px + 2, py + 2, 8, 1.6); ctx.fillRect(px + 2, py + 5, 7, 1); ctx.fillRect(px + 2, py + 7.5, 8, 1); }
      }
      if (ch === 'S') { // duty-free shelf (top-down: boxes on a shelf surface)
        ctx.fillStyle = '#5A4A3A'; ctx.fillRect(2, 2, 28, 28);
        const cols = ['#C0262D', '#F2C230', '#2B3A67', '#7FBF9F', '#E07A1F', '#6B3FA0'];
        for (let i = 0; i < 6; i++) { ctx.fillStyle = cols[(i + x + y) % 6]; ctx.fillRect(4 + (i % 3) * 9, 4 + Math.floor(i / 3) * 13, 7, 11); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(5 + (i % 3) * 9, 5 + Math.floor(i / 3) * 13, 5, 3); }
      }
      break;
    }
    case '=': { ctx.fillStyle = '#A9744B'; ctx.fillRect(0, 4, 32, 24); ctx.fillStyle = '#C58F5F'; ctx.fillRect(0, 4, 32, 16); ctx.fillStyle = '#7E5434'; ctx.fillRect(0, 20, 32, 8); ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.strokeRect(.5, 4.5, 31, 23); break; }
    case 'T': { ctx.fillStyle = '#7E5434'; for (const [lx, ly] of [[3, 24], [25, 24]]) ctx.fillRect(lx, ly, 4, 6); ctx.fillStyle = '#C58F5F'; rr(ctx, 1, 4, 30, 22, 3); ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.stroke(); ctx.strokeStyle = 'rgba(0,0,0,.15)'; for (let i = 8; i < 26; i += 6) { ctx.beginPath(); ctx.moveTo(3, i); ctx.lineTo(29, i); ctx.stroke(); } break; }
    case 'h': { ctx.fillStyle = '#7E5434'; ctx.fillRect(3, 22, 4, 6); ctx.fillRect(25, 22, 4, 6); ctx.fillStyle = '#A9744B'; rr(ctx, 1, 10, 30, 14, 2); ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.stroke(); ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.moveTo(2, 17); ctx.lineTo(30, 17); ctx.stroke(); break; }
    case 'b': { const h = hash(x, y); ctx.fillStyle = 'rgba(0,0,0,.15)'; ell(ctx, 16, 26, 12, 4); ctx.fill(); ctx.fillStyle = '#4F7F3A'; circ(ctx, 16, 16, 12); ctx.fill(); ctx.strokeStyle = '#2F5A24'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.fillStyle = '#6B9E4A'; circ(ctx, 11 + h * 4, 11 + h * 3, 5); ctx.fill(); circ(ctx, 19, 17, 4); ctx.fill(); if (h > .6) { ctx.fillStyle = '#C0262D'; circ(ctx, 20, 10, 1.5); ctx.fill(); } break; }
    case 'f': { ctx.strokeStyle = '#8E6540'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 12); ctx.lineTo(32, 12); ctx.moveTo(0, 20); ctx.lineTo(32, 20); ctx.stroke(); ctx.fillStyle = '#6E4A2A'; ctx.fillRect(13, 4, 6, 24); ctx.strokeStyle = C.line; ctx.lineWidth = .8; ctx.strokeRect(13.5, 4.5, 5, 23); break; }
    case 'X': { ctx.fillStyle = '#6E7681'; rr(ctx, 1, 3, 30, 26, 3); ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.stroke(); ctx.fillStyle = '#1F2430'; ctx.fillRect(6, 8, 20, 16); ctx.fillStyle = '#39C2FF'; ctx.globalAlpha = .55; ctx.fillRect(8, 10, 16, 2); ctx.globalAlpha = 1; ctx.fillStyle = '#2B3A67'; ctx.fillRect(1, 26, 30, 3); break; }
    case 'L': { ctx.fillStyle = '#8A9199'; ctx.fillRect(0, 2, 32, 28); ctx.strokeStyle = '#4A5260'; ctx.lineWidth = 1.5; for (let i = 4; i < 32; i += 8) { ctx.beginPath(); ctx.moveTo(i, 2); ctx.lineTo(i, 30); ctx.stroke(); } ctx.fillStyle = '#2E3038'; ctx.fillRect(0, 2, 32, 3); ctx.fillRect(0, 27, 32, 3); if (hash(x, y) > .55) { ctx.fillStyle = ['#C0262D', '#2B3A67', '#4A2A14'][Math.floor(hash(y, x) * 3)]; rr(ctx, 8, 9, 16, 12, 2); ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.stroke(); ctx.fillStyle = C.line; ctx.fillRect(13, 6, 6, 3); } break; }
    case 'O': { ctx.fillStyle = '#3B3B40'; rr(ctx, 1, 2, 30, 28, 2); ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.stroke(); ctx.fillStyle = '#E8722B'; rr(ctx, 6, 8, 20, 14, 2); ctx.fill(); ctx.fillStyle = '#F2C230'; rr(ctx, 9, 11, 14, 8, 2); ctx.fill(); ctx.fillStyle = '#6E7681'; ctx.fillRect(4, 25, 24, 3); break; }
    case 'm': { ctx.fillStyle = '#7A5AA8'; rr(ctx, 2, 2, 28, 28, 3); ctx.fill(); ctx.strokeStyle = '#4A3A78'; ctx.lineWidth = 1; ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.moveTo(6, 6); ctx.lineTo(26, 26); ctx.stroke(); break; }
    case 'g': { ctx.fillStyle = '#5B3A21'; rr(ctx, 1, 1, 30, 30, 2); ctx.fill(); ctx.strokeStyle = '#3B2A21'; ctx.lineWidth = 1; ctx.stroke(); ctx.strokeStyle = '#7FBF5F'; ctx.lineWidth = 1.4; for (let i = 0; i < 4; i++) { const gx = 6 + (i % 2) * 14 + hash(x + i, y) * 4, gy = 8 + Math.floor(i / 2) * 13; ctx.beginPath(); ctx.moveTo(gx, gy + 5); ctx.quadraticCurveTo(gx - 3, gy, gx - 1, gy - 3); ctx.moveTo(gx, gy + 5); ctx.quadraticCurveTo(gx + 3, gy, gx + 2, gy - 3); ctx.stroke(); } break; }
    case 'r': { const sky = ctx.createLinearGradient(0, 0, 32, 0); sky.addColorStop(0, '#B7D4E8'); sky.addColorStop(1, '#8DB7D8'); ctx.fillStyle = sky; ctx.fillRect(10, 0, 22, 32); ctx.fillStyle = '#C9B98A'; ctx.fillRect(0, 0, 10, 32); ctx.fillStyle = '#8E6540'; ctx.fillRect(8, 0, 4, 32); ctx.fillStyle = '#6E4A2A'; ctx.fillRect(6, 10, 8, 4); ctx.fillRect(6, 22, 8, 4); ctx.fillStyle = 'rgba(255,255,255,.5)'; ell(ctx, 22, 8 + hash(x, y) * 10, 6, 2.5); ctx.fill(); break; }
    case 'k': { ctx.fillStyle = '#EAE4D6'; ctx.fillRect(0, 0, 32, 32); ctx.strokeStyle = '#9A9285'; ctx.lineWidth = 1; ctx.strokeRect(.5, .5, 31, 31); if (n.down !== 'k' && n.down !== 'd') { ctx.fillStyle = '#C9C2B2'; ctx.fillRect(0, 22, 32, 10); ctx.fillStyle = '#6FA8D6'; ctx.fillRect(6, 24, 9, 6); ctx.fillRect(18, 24, 9, 6); } if (n.up !== 'k') { ctx.fillStyle = '#D8D1C0'; ctx.fillRect(0, 0, 32, 6); } break; }
    case 'd': { ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(2, 0, 28, 32); ctx.fillStyle = '#7E5434'; ctx.fillRect(2, 0, 3, 32); ctx.fillRect(27, 0, 3, 32); break; }
    case 's': { ctx.fillStyle = '#6E4A2A'; ctx.fillRect(14, 12, 4, 18); ctx.fillStyle = '#F2EBDD'; rr(ctx, 2, 2, 28, 14, 2); ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.stroke(); ctx.fillStyle = '#C0262D'; ctx.fillRect(5, 5, 14, 2.5); ctx.fillStyle = '#3F7A3A'; ctx.fillRect(5, 10, 20, 2); break; }
    case 'E': { ctx.fillStyle = '#F2C230'; ctx.globalAlpha = .35; ctx.fillRect(0, 0, 32, 32); ctx.globalAlpha = 1; ctx.strokeStyle = '#F2C230'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]); ctx.strokeRect(2, 2, 28, 28); ctx.setLineDash([]); break; }
    case 'V': { ctx.fillStyle = '#C0262D'; rr(ctx, 2, 4, 28, 26, 2); ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.stroke(); for (let i = 0; i < 6; i++) { circ(ctx, 7 + (i % 3) * 9, 11 + Math.floor(i / 3) * 11, 3.5); ctx.fillStyle = '#1E1E22'; ctx.fill(); ctx.fillStyle = '#D9262C'; circ(ctx, 7 + (i % 3) * 9, 11 + Math.floor(i / 3) * 11, 1.5); ctx.fill(); } break; }
    case 't': { ctx.fillStyle = pal.cloth || '#F6EBD6'; ctx.fillRect(0, 0, 32, 32); ctx.strokeStyle = 'rgba(0,0,0,.08)'; ctx.lineWidth = 1; ctx.strokeRect(.5, .5, 31, 31); const h = hash(x, y); if (h < .3) { circ(ctx, 16, 16, 8); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#2B3A67'; ctx.lineWidth = 1.2; ctx.stroke(); circ(ctx, 16, 16, 5); ctx.strokeStyle = '#7FBF9F'; ctx.lineWidth = .8; ctx.stroke(); } else if (h < .45) { ctx.fillStyle = '#F2EBDD'; ctx.fillRect(13, 6, 6, 16); ctx.fillStyle = '#F2C230'; circ(ctx, 16, 4, 2.5); ctx.fill(); ctx.fillStyle = '#E8722B'; circ(ctx, 16, 4, 1.2); ctx.fill(); } else if (h < .6) { rr(ctx, 7, 11, 18, 10, 3); ctx.fillStyle = '#A9744B'; ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.stroke(); ctx.fillStyle = '#C58F5F'; ctx.fillRect(9, 13, 14, 2); } else if (h < .7) { rr(ctx, 10, 6, 12, 20, 2); ctx.fillStyle = '#C9A227'; ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.stroke(); } break; }
    case '~': { ctx.fillStyle = '#8DB7D8'; ctx.fillRect(0, 0, 32, 32); break; }
    default: break;
  }
}

// ---------------------------------------------------------------------------
// The sprite cache
// ---------------------------------------------------------------------------
export function createArt(u) {
  const sprites = new Map();
  function renderSprite(key, fn) {
    if (sprites.has(key)) return sprites.get(key);
    const c = mk(SPRITE_W * u, SPRITE_H * u); const ctx = c.getContext('2d');
    ctx.scale(u, u); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    fn(ctx);
    sprites.set(key, c); return c;
  }
  const api = {
    u,
    tuvia(disguise, dir, frame) { return renderSprite(`tv:${disguise}:${dir}:${frame}`, (ctx) => drawTuvia(ctx, dir, frame, disguise)); },
    npc(id, look, dir, frame) { return renderSprite(`npc:${id}:${dir}:${frame}`, (ctx) => drawNPC(ctx, dir, frame, look)); },
    goat(dir, frame) { return renderSprite(`goat:${dir}:${frame}`, (ctx) => drawGoat(ctx, dir, frame)); },
    food(icon, plate = true) {
      return renderSprite(`food:${icon}:${plate}`, (ctx) => {
        ctx.translate(8, 24); ctx.scale(1, 1);
        if (plate) { ell(ctx, 8, 11, 9.5, 5); fill(ctx, '#fff'); stroke(ctx, C.line, .9); }
        (FOOD_DRAW[icon] || FOOD_DRAW.pot)(ctx);
      });
    },
    /** Pre-render a whole map into one canvas (world units × u). */
    renderMap(map) {
      const w = map.rows[0].length, h = map.rows.length;
      const c = mk(w * 32 * u, h * 32 * u); const ctx = c.getContext('2d');
      ctx.scale(u, u);
      const at = (x, y) => (map.rows[y] && map.rows[y][x]) || '#';
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        ctx.save(); ctx.translate(x * 32, y * 32);
        drawTile(ctx, at(x, y), x, y, map.palette, { up: at(x, y - 1), down: at(x, y + 1), left: at(x - 1, y), right: at(x + 1, y) });
        ctx.restore();
      }
      return c;
    },
    /** Tiny minimap (3 px per tile, CSS pixels × dpr handled by caller). */
    renderMinimap(map, px) {
      const w = map.rows[0].length, h = map.rows.length;
      const c = mk(w * px, h * px); const ctx = c.getContext('2d');
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const ch = map.rows[y][x];
        ctx.fillStyle = ch === '#' || ch === 'P' || ch === 'S' ? map.palette.wall : ch === 'E' ? '#F2C230' : ch === 'b' ? '#4F7F3A' : ch === 'r' ? '#8DB7D8' : isSolid(ch) ? '#8E6540' : map.palette.floor;
        ctx.fillRect(x * px, y * px, px, px);
      }
      return c;
    },
    /** Standalone icon canvas for the DOM (HUD, notebook). */
    iconDataURL(icon, size = 32) {
      const c = mk(size, size); const ctx = c.getContext('2d'); ctx.scale(size / 16, size / 16);
      (FOOD_DRAW[icon] || FOOD_DRAW.pot)(ctx); return c.toDataURL();
    },
  };
  return api;
}

export { DIRS };
