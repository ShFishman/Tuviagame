/* js/art/food.js — canvas drawers for falling items. drawItem(ctx, item, r): centered at (0,0), r ≈ half size.
 * Every food in js/content/foods.js names a `shape` here and three colours c[0..2]. */

const L = '#3B2A21';
function outline(ctx, w = 2.5) { ctx.lineWidth = w; ctx.strokeStyle = L; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; }
function ell(ctx, x, y, rx, ry, fill, w = 2.5) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); if (w) { outline(ctx, w); ctx.stroke(); } }
function rr(ctx, x, y, w, h, r, fill, lw = 2.5) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); if (lw) { outline(ctx, lw); ctx.stroke(); } }
function steam(ctx, x, y, s = 1) {
  ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2.5 * s; ctx.lineCap = 'round';
  for (const dx of [-8, 0, 8]) { ctx.beginPath(); ctx.moveTo(x + dx * s, y); ctx.bezierCurveTo(x + dx * s - 5 * s, y - 6 * s, x + dx * s + 5 * s, y - 10 * s, x + dx * s, y - 16 * s); ctx.stroke(); }
  ctx.restore();
}
function bowl(ctx, r, c, top) {
  ell(ctx, 0, -r * .15, r * .95, r * .35, c[0]);           // contents
  top(ctx);
  ctx.beginPath(); ctx.moveTo(-r * .95, -r * .15); ctx.quadraticCurveTo(-r * .9, r * .9, 0, r * .9); ctx.quadraticCurveTo(r * .9, r * .9, r * .95, -r * .15);
  ctx.closePath(); ctx.fillStyle = '#F8F2E2'; ctx.fill(); outline(ctx); ctx.stroke();
  ell(ctx, 0, -r * .15, r * .95, r * .35, 'rgba(0,0,0,0)', 2.5);
}
function pot(ctx, r, c, lidColor) {
  rr(ctx, -r, -r * .35, 2 * r, r * 1.3, r * .25, c[0]);
  rr(ctx, -r * 1.1, -r * .5, 2.2 * r, r * .3, r * .1, c[1]);
  ell(ctx, 0, -r * .5, r * .22, r * .14, lidColor);
  rr(ctx, -r * 1.3, -r * .1, r * .35, r * .25, 4, c[1], 2); rr(ctx, r * .95, -r * .1, r * .35, r * .25, 4, c[1], 2);
  ctx.save(); ctx.strokeStyle = c[2]; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-r * .6, r * .4); ctx.quadraticCurveTo(0, r * .8, r * .6, r * .4); ctx.stroke(); ctx.restore();
  steam(ctx, 0, -r * .6);
}
const SHAPES = {
  pot(ctx, r, c) { pot(ctx, r, c, c[2]); },
  gfpot(ctx, r, c) {
    pot(ctx, r, c, '#A4C77A');
    ctx.save(); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#C0262D'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(r * .7, -r * .7, r * .45, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(r * .4, -r * .4); ctx.lineTo(r, -r); ctx.stroke();
    ctx.fillStyle = '#C0262D'; ctx.font = `700 ${r * .42}px Rubik, Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('G', r * .7, -r * .68);
    ctx.restore();
  },
  potIng(ctx, r, c) { pot(ctx, r * 1.1, c, c[2]); },
  wedge(ctx, r, c) {
    ctx.beginPath(); ctx.moveTo(-r, r * .5); ctx.lineTo(r * .9, -r * .3); ctx.lineTo(r, r * .2); ctx.lineTo(-r * .8, r * .95); ctx.closePath(); ctx.fillStyle = c[1]; ctx.fill(); outline(ctx); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-r, r * .5); ctx.lineTo(r * .9, -r * .3); ctx.lineTo(r * .5, -r * .9); ctx.lineTo(-r * .9, -r * .1); ctx.closePath(); ctx.fillStyle = c[0]; ctx.fill(); outline(ctx); ctx.stroke();
    ctx.fillStyle = c[2]; for (const [x, y] of [[-r * .4, 0], [r * .1, -r * .4], [r * .3, -r * .1]]) { ctx.beginPath(); ctx.arc(x, y, r * .1, 0, 7); ctx.fill(); }
    steam(ctx, 0, -r * .8, .8);
  },
  fish(ctx, r, c) {
    ell(ctx, -r * .1, 0, r * .8, r * .45, c[0]);
    ctx.beginPath(); ctx.moveTo(r * .6, 0); ctx.lineTo(r * 1.05, -r * .5); ctx.lineTo(r * 1.05, r * .5); ctx.closePath(); ctx.fillStyle = c[0]; ctx.fill(); outline(ctx); ctx.stroke();
    ctx.fillStyle = L; ctx.beginPath(); ctx.arc(-r * .55, -r * .1, r * .07, 0, 7); ctx.fill();
    ctx.save(); ctx.strokeStyle = c[1]; ctx.lineWidth = 2; for (const x of [-.3, 0, .3]) { ctx.beginPath(); ctx.arc(x * r, 0, r * .22, -1.2, 1.2); ctx.stroke(); } ctx.restore();
    ell(ctx, -r * .7, r * .5, r * .28, r * .2, c[2]);
  },
  sausage(ctx, r, c) {
    ctx.save(); ctx.lineCap = 'round'; ctx.lineWidth = r * .75 + 5; ctx.strokeStyle = L; ctx.beginPath(); ctx.moveTo(-r * .75, r * .2); ctx.quadraticCurveTo(0, -r * .5, r * .75, r * .2); ctx.stroke();
    ctx.lineWidth = r * .75; ctx.strokeStyle = c[0]; ctx.stroke();
    ctx.lineWidth = 3; ctx.strokeStyle = c[1]; for (const t of [.3, .5, .7]) { const x = -r * .75 + 1.5 * r * t, y = r * .2 - (1 - Math.abs(t - .5) * 2) * r * .3; ctx.beginPath(); ctx.moveTo(x, y - r * .3); ctx.lineTo(x, y + r * .3); ctx.stroke(); }
    ctx.lineWidth = 3; ctx.strokeStyle = L; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * r * .75, r * .2); ctx.lineTo(s * r * .95, r * .1); ctx.stroke(); }
    ctx.restore();
  },
  kishkeIng(ctx, r, c) { SHAPES.sausage(ctx, r * 1.15, c); },
  jelly(ctx, r, c) {
    ctx.save(); ctx.globalAlpha = .92; rr(ctx, -r * .9, -r * .5, r * 1.8, r * 1.1, r * .3, c[0]); ctx.restore();
    ell(ctx, -r * .3, -r * .2, r * .2, r * .1, c[2], 0); ell(ctx, r * .3, r * .1, r * .15, r * .08, c[2], 0);
    ctx.fillStyle = c[1]; ctx.beginPath(); ctx.arc(r * .2, -r * .2, r * .12, 0, 7); ctx.fill();
  },
  dumpling(ctx, r, c) {
    ctx.beginPath(); ctx.moveTo(-r, r * .3); ctx.quadraticCurveTo(0, -r * 1.1, r, r * .3); ctx.quadraticCurveTo(0, r * .8, -r, r * .3); ctx.closePath(); ctx.fillStyle = c[0]; ctx.fill(); outline(ctx); ctx.stroke();
    ctx.save(); ctx.strokeStyle = c[1]; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-r * .7, r * .05); ctx.quadraticCurveTo(0, r * .35, r * .7, r * .05); ctx.stroke();
    for (const x of [-.5, -.25, 0, .25, .5]) { ctx.beginPath(); ctx.moveTo(x * r, r * .25); ctx.lineTo(x * r, r * .05); ctx.stroke(); } ctx.restore();
  },
  blob(ctx, r, c) {
    ctx.beginPath(); ctx.moveTo(-r, r * .3); ctx.bezierCurveTo(-r * 1.1, -r * .6, -r * .2, -r, r * .3, -r * .7); ctx.bezierCurveTo(r * 1.1, -r * .6, r, r * .6, r * .2, r * .7); ctx.bezierCurveTo(-r * .4, r * .9, -r, r * .8, -r, r * .3); ctx.closePath(); ctx.fillStyle = c[0]; ctx.fill(); outline(ctx); ctx.stroke();
    ctx.fillStyle = c[2]; for (const [x, y] of [[-r * .3, 0], [r * .3, -r * .2], [0, r * .4]]) { ctx.beginPath(); ctx.arc(x, y, r * .1, 0, 7); ctx.fill(); }
    ell(ctx, 0, -r * .9, r * .3, r * .12, '#8FC48F', 1.5);
  },
  croissant(ctx, r, c) {
    ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = L; ctx.lineWidth = r * .7 + 5; ctx.beginPath(); ctx.arc(0, r * .2, r * .65, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    ctx.strokeStyle = c[0]; ctx.lineWidth = r * .7; ctx.stroke();
    ctx.strokeStyle = c[1]; ctx.lineWidth = 3; for (const a of [1.3, 1.5, 1.7]) { const x = Math.cos(Math.PI * a) * r * .65, y = r * .2 + Math.sin(Math.PI * a) * r * .65; ctx.beginPath(); ctx.moveTo(x - r * .15, y - r * .25); ctx.lineTo(x + r * .15, y + r * .25); ctx.stroke(); }
    ctx.restore();
    ctx.fillStyle = c[2]; for (const [x, y] of [[-r * .35, -r * .3], [r * .3, -r * .35], [0, -r * .5]]) { ctx.beginPath(); ctx.arc(x, y, r * .08, 0, 7); ctx.fill(); }
  },
  loaf(ctx, r, c) {
    rr(ctx, -r, -r * .35, 2 * r, r * 1.1, r * .35, c[0]);
    ctx.save(); ctx.strokeStyle = c[1]; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; for (const x of [-.5, -.1, .3]) { ctx.beginPath(); ctx.moveTo(x * r, -r * .25); ctx.lineTo((x + .25) * r, r * .1); ctx.stroke(); } ctx.restore();
    ctx.fillStyle = c[2]; ctx.beginPath(); ctx.arc(r * .6, r * .4, r * .12, 0, 7); ctx.fill();
  },
  noodles(ctx, r, c) {
    rr(ctx, -r, -r * .4, 2 * r, r * 1.1, r * .2, c[0]);
    ctx.save(); ctx.strokeStyle = c[1]; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-r * .85, -r * .2 + i * r * .17); for (let x = -r * .85; x <= r * .85; x += r * .2) ctx.quadraticCurveTo(x + r * .1, -r * .2 + i * r * .17 + (i % 2 ? 4 : -4), x + r * .2, -r * .2 + i * r * .17); ctx.stroke(); }
    ctx.restore(); ctx.fillStyle = c[2]; for (const [x, y] of [[-r * .4, -r * .1], [r * .4, r * .3]]) { ctx.beginPath(); ctx.arc(x, y, r * .1, 0, 7); ctx.fill(); }
  },
  schnitzel(ctx, r, c) {
    ctx.beginPath(); ctx.moveTo(-r, 0); ctx.bezierCurveTo(-r, -r, r * .4, -r * .9, r, -r * .3); ctx.bezierCurveTo(r * 1.1, r * .4, r * .3, r * .9, -r * .3, r * .7); ctx.bezierCurveTo(-r * .9, r * .6, -r * 1.05, r * .4, -r, 0); ctx.closePath(); ctx.fillStyle = c[0]; ctx.fill(); outline(ctx); ctx.stroke();
    ctx.fillStyle = c[1]; for (let i = 0; i < 14; i++) { const a = i * 2.4, d = (i % 3 + 1) * r * .22; ctx.beginPath(); ctx.arc(Math.cos(a) * d, Math.sin(a) * d * .6, 2, 0, 7); ctx.fill(); }
    ell(ctx, r * .7, r * .5, r * .22, r * .18, '#F2C230', 2);
  },
  can(ctx, r, c) {
    rr(ctx, -r * .5, -r * .9, r, r * 1.8, r * .18, c[0]);
    ctx.fillStyle = c[1]; ctx.fillRect(-r * .5, -r * .25, r, r * .5);
    ctx.fillStyle = '#fff'; ctx.font = `700 ${r * .32}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.save(); ctx.direction = 'ltr'; ctx.fillText('ZERO', 0, 0); ctx.restore();
    ell(ctx, 0, -r * .9, r * .5, r * .16, c[2]);
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-r * .3, -r * .7); ctx.lineTo(-r * .3, r * .6); ctx.stroke(); ctx.restore();
  },
  cup(ctx, r, c) {
    ctx.beginPath(); ctx.moveTo(-r * .8, -r * .4); ctx.lineTo(-r * .55, r * .8); ctx.lineTo(r * .55, r * .8); ctx.lineTo(r * .8, -r * .4); ctx.closePath(); ctx.fillStyle = c[0]; ctx.fill(); outline(ctx); ctx.stroke();
    ctx.save(); ctx.strokeStyle = L; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(r * .95, 0, r * .3, -1.3, 1.3); ctx.stroke(); ctx.restore();
    ell(ctx, 0, -r * .4, r * .8, r * .25, c[1]);
    if (c[2] === '#6E8B3D' || c[2] === '#8A6A3A') { ell(ctx, r * .15, -r * .45, r * .25, r * .12, c[2], 1.5); }
    else { rr(ctx, -r * 1.4, r * .1, r * .6, r * .55, 4, c[2]); ctx.fillStyle = '#fff'; ctx.fillRect(-r * 1.4, r * .3, r * .6, r * .1); }
    steam(ctx, 0, -r * .7, .7);
  },
  bowl(ctx, r, c) {
    bowl(ctx, r, c, (cx) => { cx.fillStyle = c[1]; for (let i = 0; i < 12; i++) { const a = i * 1.7, d = (i % 4) * r * .2; cx.beginPath(); cx.arc(Math.cos(a) * d, -r * .15 + Math.sin(a) * d * .3, r * .06, 0, 7); cx.fill(); } });
  },
  leaf(ctx, r, c) {
    for (const [x, y, a] of [[-r * .4, r * .1, -.6], [r * .4, 0, .5], [0, -r * .3, 0]]) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      ctx.beginPath(); ctx.moveTo(0, r * .6); for (let i = 0; i <= 10; i++) { const t = i / 10, ang = Math.PI * (1 + t), rr2 = r * .55 * (1 + .25 * Math.sin(i * 3)); ctx.lineTo(Math.cos(ang) * rr2 * .9, r * .1 + Math.sin(ang) * rr2); } ctx.closePath();
      ctx.fillStyle = c[0]; ctx.fill(); outline(ctx, 2); ctx.stroke();
      ctx.strokeStyle = c[1]; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, r * .6); ctx.lineTo(0, -r * .4); ctx.stroke(); ctx.restore();
    }
  },
  yogurt(ctx, r, c) {
    ctx.beginPath(); ctx.moveTo(-r * .7, -r * .6); ctx.lineTo(-r * .55, r * .8); ctx.lineTo(r * .55, r * .8); ctx.lineTo(r * .7, -r * .6); ctx.closePath(); ctx.fillStyle = c[0]; ctx.fill(); outline(ctx); ctx.stroke();
    ell(ctx, 0, -r * .6, r * .7, r * .22, c[1]);
    ctx.fillStyle = L; ctx.font = `${r * .34}px Rubik, Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('עז', 0, r * .2);
    ctx.save(); ctx.translate(r * .8, -r * .9); ctx.scale(.55, .55); ctx.strokeStyle = L; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-10, 8); ctx.lineTo(0, -8); ctx.lineTo(10, 8); ctx.stroke(); ctx.restore();
  },
  cube(ctx, r, c) {
    rr(ctx, -r * .7, -r * .4, r * 1.4, r * 1.1, 3, c[0]);
    ctx.beginPath(); ctx.moveTo(-r * .7, -r * .4); ctx.lineTo(-r * .4, -r * .8); ctx.lineTo(r, -r * .8); ctx.lineTo(r * .7, -r * .4); ctx.closePath(); ctx.fillStyle = c[2]; ctx.fill(); outline(ctx); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(r * .7, -r * .4); ctx.lineTo(r, -r * .8); ctx.lineTo(r, r * .3); ctx.lineTo(r * .7, r * .7); ctx.closePath(); ctx.fillStyle = c[1]; ctx.fill(); outline(ctx); ctx.stroke();
  },
  sprouts(ctx, r, c) {
    bowl(ctx, r, c, (cx) => { cx.strokeStyle = c[1]; cx.lineWidth = 2.5; cx.lineCap = 'round'; for (let i = -4; i <= 4; i++) { cx.beginPath(); cx.moveTo(i * r * .18, -r * .1); cx.quadraticCurveTo(i * r * .18 + 6, -r * .5, i * r * .18 + (i % 2 ? 10 : -8), -r * .75); cx.stroke(); cx.fillStyle = c[2]; cx.beginPath(); cx.arc(i * r * .18 + (i % 2 ? 10 : -8), -r * .78, 3, 0, 7); cx.fill(); } });
  },
  canape(ctx, r, c) {
    rr(ctx, -r * .9, -r * .1, r * 1.8, r * .5, 4, '#E9D9B4');
    ell(ctx, 0, -r * .15, r * .75, r * .28, c[2]);
    ctx.save(); ctx.translate(0, -r * .5); ctx.beginPath(); ctx.moveTo(-r * .5, 0); ctx.lineTo(0, -r * .5); ctx.lineTo(r * .5, 0); ctx.closePath(); ctx.fillStyle = c[0]; ctx.fill(); outline(ctx, 2); ctx.stroke();
    ctx.fillStyle = c[1]; for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; ctx.beginPath(); ctx.arc(Math.cos(a) * r * .18, -r * .2 + Math.sin(a) * r * .18, 1.8, 0, 7); ctx.fill(); } ctx.restore();
  },
  pan(ctx, r, c) {
    ctx.save(); ctx.strokeStyle = L; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(r * .8, 0); ctx.lineTo(r * 1.5, -r * .2); ctx.stroke(); ctx.strokeStyle = '#2E3038'; ctx.lineWidth = 5; ctx.stroke(); ctx.restore();
    ell(ctx, 0, 0, r * .95, r * .6, '#2E3038'); ell(ctx, 0, 0, r * .8, r * .45, c[0], 0);
    for (const [x, y] of [[-r * .3, -r * .05], [r * .3, r * .05]]) { ell(ctx, x, y, r * .22, r * .16, '#fff', 1.5); ell(ctx, x, y, r * .1, r * .08, '#F2C230', 1); }
    ctx.fillStyle = c[1]; for (const [x, y] of [[0, r * .25], [-r * .5, r * .2], [r * .5, -r * .25]]) { ctx.beginPath(); ctx.arc(x, y, 2.5, 0, 7); ctx.fill(); }
    steam(ctx, 0, -r * .6, .7);
  },
  chocolate(ctx, r, c) {
    ctx.save(); ctx.rotate(-.3); rr(ctx, -r, -r * .45, 2 * r, r * .9, 3, c[0]); ctx.fillStyle = c[2]; ctx.fillRect(-r * .25, -r * .45, r * .5, r * .9); ctx.fillStyle = c[1]; for (const x of [-.8, -.5]) ctx.fillRect(x * r, -r * .3, r * .22, r * .6); ctx.fillStyle = '#fff'; ctx.font = `700 ${r * .28}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr'; ctx.fillText('CH', r * .55, 0); ctx.restore();
  },
  tray(ctx, r, c) {
    rr(ctx, -r, -r * .5, 2 * r, r, 4, c[0]); rr(ctx, -r * .85, -r * .35, r * .8, r * .7, 3, c[2], 2); rr(ctx, r * .1, -r * .35, r * .7, r * .3, 3, '#A4C77A', 2); rr(ctx, r * .1, r * .05, r * .7, r * .3, 3, '#fff', 2);
    ctx.save(); ctx.strokeStyle = c[1]; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-r * .45, -r * .2); ctx.lineTo(-r * .45, r * .2); ctx.stroke(); ctx.restore();
  },
  tube(ctx, r, c) {
    ctx.save(); ctx.rotate(.5); rr(ctx, -r, -r * .3, r * 1.6, r * .6, r * .1, c[0]); ctx.fillStyle = c[1]; ctx.fillRect(-r * .8, -r * .15, r * 1.2, r * .3); rr(ctx, r * .6, -r * .22, r * .4, r * .44, 3, c[2]); ctx.restore();
  },
  scissors(ctx, r, c) {
    ctx.save(); ctx.rotate(-.6); ctx.strokeStyle = L; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-r * .2, 0); ctx.lineTo(r, -r * .3); ctx.moveTo(-r * .2, 0); ctx.lineTo(r, r * .3); ctx.stroke(); ctx.strokeStyle = c[0]; ctx.lineWidth = 4; ctx.stroke();
    for (const y of [-.4, .4]) { ell(ctx, -r * .6, r * y, r * .3, r * .22, c[2]); ell(ctx, -r * .6, r * y, r * .12, r * .08, '#fff', 1.5); } ctx.restore();
  },
  bottle(ctx, r, c) {
    rr(ctx, -r * .45, -r * .4, r * .9, r * 1.3, r * .18, c[0]); rr(ctx, -r * .2, -r * .95, r * .4, r * .6, 3, c[0]); rr(ctx, -r * .25, -r * 1.05, r * .5, r * .2, 3, c[1]);
    rr(ctx, -r * .45, -r * .05, r * .9, r * .5, 2, c[1], 2); ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-r * .25, -r * .2); ctx.lineTo(-r * .25, r * .7); ctx.stroke(); ctx.restore();
  },
  jar(ctx, r, c) {
    rr(ctx, -r * .7, -r * .5, r * 1.4, r * 1.3, r * .2, c[0]); rr(ctx, -r * .75, -r * .8, r * 1.5, r * .35, 4, c[2]);
    ctx.fillStyle = L; ctx.font = `${r * .32}px Rubik, Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('חומוס', 0, r * .15);
    ctx.save(); ctx.strokeStyle = c[1]; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-r * .5, r * .55); ctx.lineTo(r * .5, r * .55); ctx.stroke(); ctx.restore();
  },
  phone(ctx, r, c) {
    rr(ctx, -r * .5, -r * .9, r, r * 1.8, r * .15, c[0]); rr(ctx, -r * .4, -r * .75, r * .8, r * 1.3, 3, c[2], 1.5);
    ctx.fillStyle = L; ctx.font = `700 ${r * .3}px Rubik, Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('כשר', 0, -r * .2);
    ctx.fillStyle = '#C0262D'; ctx.font = `${r * .3}px Arial`; ctx.fillText('♪', r * .2, r * .25);
    ctx.beginPath(); ctx.arc(0, r * .72, r * .08, 0, 7); ctx.fillStyle = c[1]; ctx.fill();
  },
  scroll(ctx, r, c) {
    rr(ctx, -r * .75, -r * .95, r * 1.5, r * 1.9, 3, c[0]);
    ctx.save(); ctx.strokeStyle = c[1]; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(r * .55, -r * .65 + i * r * .25); ctx.lineTo(-r * .55 + (i % 3) * r * .15, -r * .65 + i * r * .25); ctx.stroke(); } ctx.restore();
    ctx.fillStyle = c[2]; ctx.font = `700 ${r * .3}px Rubik, Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(c[2] === '#C0262D' ? 'אסור!' : 'בלה', 0, r * .55);
  },
  beans(ctx, r, c) {
    rr(ctx, -r * .8, -r * .7, r * 1.6, r * 1.6, r * .15, c[1]);
    ctx.fillStyle = c[2]; ctx.font = `700 ${r * .28}px Rubik, Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('אורגני', 0, r * .55);
    for (let i = 0; i < 9; i++) { ctx.save(); ctx.translate(-r * .5 + (i % 3) * r * .5, -r * .45 + Math.floor(i / 3) * r * .35); ctx.rotate(i * .7); ell(ctx, 0, 0, r * .2, r * .12, c[0], 1.5); ctx.restore(); }
  },
  bubble(ctx, r, c) {
    ctx.beginPath(); ctx.roundRect(-r * 1.25, -r * .8, r * 2.5, r * 1.5, r * .5); ctx.fillStyle = c[0]; ctx.fill(); outline(ctx, 3); ctx.strokeStyle = c[1]; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(r * .5, r * .66); ctx.lineTo(r * .75, r * 1.15); ctx.lineTo(r * .95, r * .66); ctx.closePath(); ctx.fillStyle = c[0]; ctx.fill(); ctx.strokeStyle = c[1]; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(r * .55, r * .62); ctx.lineTo(r * .92, r * .62); ctx.strokeStyle = c[0]; ctx.lineWidth = 5; ctx.stroke();
  },
};

export function drawShape(ctx, shape, r, c) { (SHAPES[shape] || SHAPES.blob)(ctx, r, c); }
export const SHAPE_NAMES = Object.keys(SHAPES);
