/* js/art/tuvia.js — Tuvia Tenenbom caricature + the goat, as SVG strings. Zero dependencies.
 *
 * Drawn from SPEC.md §2.3 and the reference photo (reference/tuvia.png, never embedded):
 * big round face, blond tuft swept up and back, OVERSIZED ROUND RED GLASSES, blue/white
 * pinstripe shirt with rolled sleeves, MINT SUSPENDERS with silver clips, stocky egg body,
 * chin resting on his fist, knowing half-smile.
 *
 *   tuviaSVG({ expression, pose, disguise, crop, size, id, className, table })
 *     expression: smirk (default) | suspicious | delighted | disgusted | shocked | writing |
 *                 sleepy | happy | angry | neutral
 *     pose:       listen (chin on fist, at a table) | stand (notebook + cola zero) | write
 *     disguise:   none | tobi (Tyrolean hat + lederhosen straps) | bneibrak (tiny black hat,
 *                 kippah, black jacket) | guest (napkin + fork)
 *     crop:       full | bust | head
 *   goatSVG({ size, mood })   mood: disappointed (default) | smiling | shocked
 *   TUVIA_CSS                 optional keyframes for the .tv-* hooks (belly bounce, suspender
 *                             snap, glasses glint, steam, zzz)
 *
 * The returned string is an <svg> element; drop it into innerHTML. Each call gets unique
 * def ids (pass `id` to make them deterministic).
 */

export const C = {
  line: '#3B2A21',
  skin: '#F7CFAE', skinDark: '#E3AE88', blush: '#F29C9C', green: '#A8D18C',
  hair: '#D9C48A', hairLite: '#F3E6B8', hairDark: '#B99C58', brow: '#A3853F',
  red: '#C0262D', redInner: '#5B2A1A', lens: '#D7ECF7',
  white: '#FFFFFF', navy: '#2B3A67', collar: '#1F2C52',
  mint: '#7FBF9F', mintEdge: '#4C9476', silver: '#DDE2E9', silverEdge: '#7E8795',
  pants: '#1B2034', wood: '#A9744B', woodLite: '#C58F5F', woodDark: '#7E5434',
  gold: '#E5B632', goldDark: '#B6861A', leather: '#6E4A2A', leatherLite: '#8E6540',
  tyrol: '#2F6B3A', tyrolDark: '#1E4726', feather: '#F2F2EE',
  black: '#17181C', blackLite: '#2E3038', grey: '#9AA0AA',
  mouth: '#7A2730', tongue: '#E9707C', teeth: '#FFF8E6',
  can: '#1E1E22', canRed: '#D9262C', paper: '#F8F2E2', book: '#6B4A2B', pen: '#F2C230',
  sweat: '#8EC9F0'
};

let uid = 0;

// ---------- small helpers ----------
const limb = (x1, y1, x2, y2, w, fill, cls = '') =>
  `<line class="${cls}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${C.line}" stroke-width="${w + 5}" stroke-linecap="round"/>` +
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${fill}" stroke-width="${w}" stroke-linecap="round"/>`;

const cuff = (x, y, pid) =>
  `<circle cx="${x}" cy="${y}" r="19" fill="${C.white}" stroke="${C.line}" stroke-width="3"/>` +
  `<circle cx="${x}" cy="${y}" r="13" fill="url(#${pid})" stroke="${C.line}" stroke-width="2"/>`;

const hand = (x, y, r = 12) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${C.skin}" stroke="${C.line}" stroke-width="3"/>`;

function watch(x1, y1, x2, y2, t = 0.5) {
  const x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t;
  const ang = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI + 90;
  return `<g transform="translate(${x} ${y}) rotate(${ang})">` +
    `<rect x="-16" y="-5" width="32" height="10" rx="3" fill="${C.leather}" stroke="${C.line}" stroke-width="2"/>` +
    `<circle r="7" fill="${C.gold}" stroke="${C.line}" stroke-width="2"/>` +
    `<circle r="4" fill="${C.paper}"/><line x1="0" y1="0" x2="0" y2="-3" stroke="${C.line}" stroke-width="1"/>` +
    `</g>`;
}

const colaCan = (x, y, rot = -8) =>
  `<g transform="translate(${x} ${y}) rotate(${rot})">` +
  `<rect x="-9" y="-16" width="18" height="32" rx="4" fill="${C.can}" stroke="${C.line}" stroke-width="2.5"/>` +
  `<rect x="-9" y="-6" width="18" height="10" fill="${C.canRed}"/>` +
  `<text x="0" y="2" font-size="6" font-family="Arial,sans-serif" font-weight="700" fill="#fff" text-anchor="middle">ZERO</text>` +
  `<ellipse cx="0" cy="-16" rx="9" ry="3" fill="${C.silver}" stroke="${C.line}" stroke-width="2"/>` +
  `</g>`;

const notebook = (x, y, rot = 10) =>
  `<g transform="translate(${x} ${y}) rotate(${rot})">` +
  `<rect x="-14" y="-18" width="28" height="36" rx="3" fill="${C.book}" stroke="${C.line}" stroke-width="2.5"/>` +
  `<rect x="-10" y="-14" width="22" height="28" rx="2" fill="${C.paper}"/>` +
  `<path d="M -6 -8 h 14 M -6 -2 h 14 M -6 4 h 10" stroke="${C.grey}" stroke-width="1.5"/>` +
  `<line x1="8" y1="-22" x2="2" y2="14" stroke="${C.pen}" stroke-width="4" stroke-linecap="round"/>` +
  `<line x1="8" y1="-22" x2="2" y2="14" stroke="${C.line}" stroke-width="1"/>` +
  `</g>`;

const fork = (x, y, rot = -20) =>
  `<g transform="translate(${x} ${y}) rotate(${rot})">` +
  `<line x1="0" y1="18" x2="0" y2="-6" stroke="${C.silver}" stroke-width="5" stroke-linecap="round"/>` +
  `<line x1="0" y1="18" x2="0" y2="-6" stroke="${C.line}" stroke-width="1.5"/>` +
  `<path d="M -7 -6 h 14 v -14 M -3 -6 v -14 M 3 -6 v -14" fill="none" stroke="${C.silverEdge}" stroke-width="3"/>` +
  `</g>`;

// ---------- the face table ----------
// browL/browR = [dy (negative = raised), innerTilt (positive = inner end pulled down, i.e. furrowed)]
const FACES = {
  smirk:      { eyes: 'amused',      browL: [0, 0],    browR: [-2, -2], mouth: 'smirk',     cheeks: 1 },
  suspicious: { eyes: 'suspicious',  browL: [3, 4],    browR: [-11, -7], mouth: 'flat',     cheeks: .6 },
  delighted:  { eyes: 'closedHappy', browL: [-5, 0],   browR: [-5, 0],  mouth: 'openSmile', cheeks: 1.4, fog: true, steam: true },
  disgusted:  { eyes: 'squint',      browL: [-1, 7],   browR: [-1, 7],  mouth: 'wavy',      cheeks: 0, green: true, tongue: true, sweat: true },
  shocked:    { eyes: 'wide',        browL: [-16, -2], browR: [-16, -2], mouth: 'o',        cheeks: .5, glassesJump: true, sweat: true },
  writing:    { eyes: 'down',        browL: [2, 1],    browR: [2, 1],   mouth: 'focus',     cheeks: .7 },
  sleepy:     { eyes: 'closedFlat',  browL: [4, 0],    browR: [4, 0],   mouth: 'smallO',    cheeks: .5, zzz: true },
  happy:      { eyes: 'closedHappy', browL: [-7, 0],   browR: [-7, 0],  mouth: 'bigSmile',  cheeks: 1.5 },
  angry:      { eyes: 'squint',      browL: [-3, 12],  browR: [-3, 12], mouth: 'frown',     cheeks: 1.3, redFace: true, puff: true },
  neutral:    { eyes: 'open',        browL: [0, 0],    browR: [0, 0],   mouth: 'flat',      cheeks: .8 }
};

function eye(kind, cx, cy, side) {
  const L = C.line;
  const pupil = (dx = 0, dy = 0, r = 4.5) =>
    `<circle cx="${cx + dx}" cy="${cy + dy}" r="${r}" fill="#2A1A12"/><circle cx="${cx + dx - 1.5}" cy="${cy + dy - 1.5}" r="1.4" fill="#fff"/>`;
  const look = side === 'L' ? 2 : -2; // pupils drift toward the nose: he's looking at you
  switch (kind) {
    case 'open':
      return `<ellipse cx="${cx}" cy="${cy}" rx="11" ry="8" fill="#fff" stroke="${L}" stroke-width="2"/>${pupil(look, 0)}`;
    case 'amused':
      return `<ellipse cx="${cx}" cy="${cy + 1}" rx="11" ry="6" fill="#fff" stroke="${L}" stroke-width="2"/>${pupil(look, 1, 4)}` +
        `<path d="M ${cx - 12} ${cy - 1} Q ${cx} ${cy - 9} ${cx + 12} ${cy - 1}" fill="${C.skin}" stroke="${L}" stroke-width="2.5"/>`;
    case 'suspicious':
      return side === 'L'
        ? `<ellipse cx="${cx}" cy="${cy + 2}" rx="11" ry="4" fill="#fff" stroke="${L}" stroke-width="2"/>${pupil(look, 2, 3.2)}` +
          `<path d="M ${cx - 12} ${cy - 1} L ${cx + 12} ${cy - 2}" stroke="${L}" stroke-width="3" stroke-linecap="round"/>`
        : `<ellipse cx="${cx}" cy="${cy}" rx="11" ry="9" fill="#fff" stroke="${L}" stroke-width="2"/>${pupil(look, 0, 4.5)}`;
    case 'closedHappy':
      return `<path d="M ${cx - 11} ${cy + 1} Q ${cx} ${cy - 10} ${cx + 11} ${cy + 1}" fill="none" stroke="${L}" stroke-width="3.5" stroke-linecap="round"/>`;
    case 'closedFlat':
      return `<path d="M ${cx - 11} ${cy} Q ${cx} ${cy + 7} ${cx + 11} ${cy}" fill="none" stroke="${L}" stroke-width="3" stroke-linecap="round"/>`;
    case 'squint':
      return `<ellipse cx="${cx}" cy="${cy + 1}" rx="11" ry="4.5" fill="#fff" stroke="${L}" stroke-width="2"/>${pupil(look, 1, 3.2)}` +
        `<path d="M ${cx - 12} ${cy - 2} Q ${cx} ${cy + 2} ${cx + 12} ${cy - 2}" fill="${C.skin}" stroke="${L}" stroke-width="2.5"/>`;
    case 'wide':
      return `<circle cx="${cx}" cy="${cy}" r="11" fill="#fff" stroke="${L}" stroke-width="2"/>${pupil(0, 0, 3)}`;
    case 'down':
      return `<ellipse cx="${cx}" cy="${cy + 2}" rx="11" ry="6" fill="#fff" stroke="${L}" stroke-width="2"/>${pupil(look, 4, 4)}` +
        `<path d="M ${cx - 12} ${cy} Q ${cx} ${cy - 4} ${cx + 12} ${cy}" fill="${C.skin}" stroke="${L}" stroke-width="2.5"/>`;
  }
  return '';
}

function brow(side, [dy, tilt]) {
  // left brow: outer x 72 → inner x 112 ; right brow mirrored
  const ox = side === 'L' ? 70 : 170, ix = side === 'L' ? 112 : 128, mx = side === 'L' ? 91 : 149;
  const oy = 80 + dy, iy = 77 + dy + tilt, my = 68 + dy + tilt * .5;
  return `<path d="M ${ox} ${oy} Q ${mx} ${my} ${ix} ${iy}" fill="none" stroke="${C.brow}" stroke-width="5.5" stroke-linecap="round"/>`;
}

function mouth(kind) {
  const L = C.line;
  switch (kind) {
    case 'smirk':
      return `<path d="M 94 142 Q 118 154 146 138" fill="none" stroke="${L}" stroke-width="3.2" stroke-linecap="round"/>` +
        `<path d="M 146 138 q 5 -3 3 -8" fill="none" stroke="${L}" stroke-width="2.5" stroke-linecap="round"/>` +
        `<path d="M 94 142 q -3 -2 -2 -5" fill="none" stroke="${L}" stroke-width="2" stroke-linecap="round" opacity=".6"/>`;
    case 'flat':
      return `<path d="M 98 144 L 142 141" fill="none" stroke="${L}" stroke-width="3.2" stroke-linecap="round"/>`;
    case 'focus':
      return `<path d="M 108 145 Q 120 149 132 145" fill="none" stroke="${L}" stroke-width="3" stroke-linecap="round"/>`;
    case 'openSmile':
      return `<path d="M 92 136 Q 120 170 148 136 Q 120 146 92 136 Z" fill="${C.mouth}" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>` +
        `<path d="M 100 139 Q 120 144 140 139 L 139 143 Q 120 148 101 143 Z" fill="${C.teeth}"/>` +
        `<ellipse cx="122" cy="156" rx="11" ry="6" fill="${C.tongue}"/>`;
    case 'bigSmile':
      return `<path d="M 88 134 Q 120 176 152 134 Q 120 150 88 134 Z" fill="${C.mouth}" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>` +
        `<path d="M 96 137 Q 120 143 144 137 L 143 142 Q 120 148 97 142 Z" fill="${C.teeth}"/>`;
    case 'wavy':
      return `<path d="M 94 146 q 7 -7 14 0 t 14 0 t 14 0 t 12 0" fill="none" stroke="${L}" stroke-width="3.2" stroke-linecap="round"/>` +
        `<path d="M 112 147 q 8 14 16 0" fill="${C.tongue}" stroke="${L}" stroke-width="2"/>`;
    case 'o':
      return `<ellipse cx="120" cy="148" rx="11" ry="15" fill="${C.mouth}" stroke="${L}" stroke-width="3"/>` +
        `<ellipse cx="120" cy="156" rx="6" ry="4" fill="${C.tongue}"/>`;
    case 'smallO':
      return `<circle cx="120" cy="147" r="5" fill="${C.mouth}" stroke="${L}" stroke-width="2.5"/>`;
    case 'frown':
      return `<path d="M 96 150 Q 120 134 144 150" fill="none" stroke="${L}" stroke-width="3.4" stroke-linecap="round"/>`;
  }
  return '';
}

// ---------- head ----------
function head(face, disguise, id, pose) {
  const L = C.line;
  const blushColor = face.green ? C.green : C.blush;
  const blushOp = face.green ? .85 : Math.min(1, .55 * face.cheeks);
  const faceFill = face.redFace ? '#F5B8A0' : C.skin;
  const gj = face.glassesJump ? 'transform="translate(0 -16) rotate(-6 120 104)"' : '';

  let s = '';
  // ears
  s += `<circle cx="57" cy="106" r="11" fill="${C.skin}" stroke="${L}" stroke-width="3"/><circle cx="183" cy="106" r="11" fill="${C.skin}" stroke="${L}" stroke-width="3"/>`;
  s += `<path d="M 54 104 q 3 4 2 8 M 186 104 q -3 4 -2 8" fill="none" stroke="${C.skinDark}" stroke-width="2"/>`;
  // double chin (behind the head)
  s += `<path d="M 86 152 Q 120 182 154 152" fill="${C.skin}" stroke="${L}" stroke-width="3"/>`;
  // head
  s += `<circle cx="120" cy="100" r="64" fill="${faceFill}" stroke="${L}" stroke-width="3.5"/>`;
  // hair: cap clipped to the head + a tuft swept up & back
  s += `<g clip-path="url(#${id}-headclip)">` +
    `<path d="M 40 110 L 40 20 L 200 20 L 200 110 C 192 92 182 70 170 76 C 160 60 146 58 136 70 C 126 54 110 56 102 72 C 92 60 78 66 72 82 C 64 88 54 100 40 110 Z" fill="${C.hair}" stroke="${C.line}" stroke-width="2.5"/>` +
    `<path d="M 60 70 C 80 40 120 30 160 44" fill="none" stroke="${C.hairLite}" stroke-width="5" stroke-linecap="round" opacity=".8"/>` +
    `<path d="M 150 50 C 168 60 180 78 184 96" fill="none" stroke="${C.hairDark}" stroke-width="3" stroke-linecap="round" opacity=".5"/>` +
    `</g>`;
  s += `<path d="M 88 46 C 94 22 128 12 152 26 C 166 34 170 44 168 50 C 156 38 134 32 118 40 C 108 44 100 50 94 60 Z" fill="${C.hair}" stroke="${L}" stroke-width="2.5" stroke-linejoin="round"/>`;
  s += `<path d="M 100 44 C 114 30 134 26 152 32" fill="none" stroke="${C.hairLite}" stroke-width="4" stroke-linecap="round"/>`;
  // cheeks
  s += `<circle class="tv-cheek" cx="78" cy="130" r="12" fill="${blushColor}" opacity="${blushOp}"/><circle class="tv-cheek" cx="162" cy="130" r="12" fill="${blushColor}" opacity="${blushOp}"/>`;
  // nose
  s += `<path d="M 113 108 C 109 120 115 128 128 121" fill="none" stroke="${L}" stroke-width="2.8" stroke-linecap="round"/>`;
  // eyes
  s += eye(face.eyes, 94, 106, 'L') + eye(face.eyes, 146, 106, 'R');
  // brows
  s += brow('L', face.browL) + brow('R', face.browR);
  // mouth
  s += mouth(face.mouth);
  // glasses (the #1 identifier)
  const lensFill = face.fog ? `fill="#fff" fill-opacity=".78"` : `fill="${C.lens}" fill-opacity=".16"`;
  s += `<g class="tv-glasses" ${gj}>` +
    `<circle cx="94" cy="104" r="25" ${lensFill}/><circle cx="146" cy="104" r="25" ${lensFill}/>` +
    `<circle cx="94" cy="104" r="25" fill="none" stroke="${C.red}" stroke-width="7"/><circle cx="146" cy="104" r="25" fill="none" stroke="${C.red}" stroke-width="7"/>` +
    `<circle cx="94" cy="104" r="21.5" fill="none" stroke="${C.redInner}" stroke-width="1.6"/><circle cx="146" cy="104" r="21.5" fill="none" stroke="${C.redInner}" stroke-width="1.6"/>` +
    `<path d="M 118 101 Q 120 94 122 101" fill="none" stroke="${C.red}" stroke-width="5" stroke-linecap="round"/>` +
    `<path d="M 69 101 L 58 97 M 171 101 L 182 97" fill="none" stroke="${C.red}" stroke-width="4.5" stroke-linecap="round"/>` +
    `<path class="tv-glint" d="M 80 92 q 6 -7 13 -5 M 132 92 q 6 -7 13 -5" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".55"/>` +
    `</g>`;
  // disguise headwear
  if (disguise === 'tobi') {
    s += `<g class="tv-hat">` +
      `<path d="M 80 50 L 88 16 Q 120 2 152 16 L 160 50 Z" fill="${C.tyrol}" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>` +
      `<path d="M 82 42 Q 120 34 158 42" fill="none" stroke="${C.tyrolDark}" stroke-width="7"/>` +
      `<ellipse cx="120" cy="50" rx="62" ry="11" fill="${C.tyrol}" stroke="${L}" stroke-width="3"/>` +
      `<path d="M 148 32 C 158 10 176 0 186 6 C 176 10 166 22 158 36" fill="${C.feather}" stroke="${L}" stroke-width="2" stroke-linejoin="round"/>` +
      `<path d="M 150 32 C 160 16 172 6 184 7" fill="none" stroke="${C.grey}" stroke-width="1.5"/>` +
      `<circle cx="146" cy="40" r="4" fill="${C.canRed}" stroke="${L}" stroke-width="1.5"/>` +
      `</g>`;
  } else if (disguise === 'bneibrak') {
    s += `<g class="tv-hat">` +
      `<ellipse cx="150" cy="54" rx="26" ry="9" fill="${C.black}" stroke="${L}" stroke-width="2.5"/>` + // velvet kippah peeking at the back
      `<path d="M 92 30 Q 120 14 148 30 L 150 34 Q 120 22 90 34 Z" fill="${C.blackLite}"/>` +
      `<rect x="92" y="2" width="56" height="30" rx="8" fill="${C.black}" stroke="${L}" stroke-width="3"/>` +
      `<rect x="92" y="22" width="56" height="7" fill="${C.blackLite}"/>` +
      `<ellipse cx="120" cy="32" rx="44" ry="8" fill="${C.black}" stroke="${L}" stroke-width="3"/>` +
      `</g>`;
  }
  // extras
  if (face.steam) {
    s += `<g class="tv-steam" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".85">` +
      `<path d="M 84 74 c -6 -8 6 -12 0 -20 c -4 -6 4 -10 0 -16"/><path d="M 150 72 c -6 -8 6 -12 0 -20 c -4 -6 4 -10 0 -16"/><path d="M 118 66 c -6 -8 6 -12 0 -20"/>` +
      `</g>`;
  }
  if (face.sweat) s += `<path class="tv-sweat" d="M 176 76 q 8 14 0 18 q -8 -4 0 -18 Z" fill="${C.sweat}" stroke="${L}" stroke-width="1.5"/>`;
  if (face.zzz) s += `<g class="tv-zzz" font-family="Arial,sans-serif" font-weight="700" fill="${C.navy}"><text x="172" y="60" font-size="16">z</text><text x="184" y="44" font-size="20">Z</text><text x="200" y="26" font-size="26">Z</text></g>`;
  if (face.puff) s += `<g class="tv-puff" fill="#fff" stroke="${L}" stroke-width="2" opacity=".9"><circle cx="52" cy="66" r="7"/><circle cx="42" cy="54" r="9"/><circle cx="190" cy="66" r="7"/><circle cx="200" cy="54" r="9"/></g>`;
  if (face.tongue && face.mouth !== 'wavy') s += '';

  const tilt = pose === 'listen' ? 'rotate(6 120 160)' : '';
  return `<g class="tv-head" transform="${tilt}">${s}</g>`;
}

// ---------- torso ----------
function torso(disguise, id, pose) {
  const L = C.line;
  const egg = 'M 52 184 Q 120 150 188 184 C 214 222 214 262 192 284 L 48 284 C 26 262 26 222 52 184 Z';
  let s = '';
  s += `<rect x="100" y="140" width="40" height="44" fill="${C.skin}" stroke="${L}" stroke-width="3"/>`; // neck
  s += `<g class="tv-belly">`;
  s += `<path d="${egg}" fill="url(#${id}-stripes)" stroke="${L}" stroke-width="3.5"/>`;
  // open collar showing a bit of chest
  s += `<path d="M 102 172 L 120 196 L 138 172 Z" fill="${C.skin}" stroke="${L}" stroke-width="2.5" stroke-linejoin="round"/>`;
  s += `<path d="M 96 166 L 120 196 L 144 166" fill="none" stroke="${C.collar}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`;
  s += `<path d="M 96 166 L 120 196 L 144 166" fill="none" stroke="${L}" stroke-width="1.5" stroke-linejoin="round"/>`;
  // buttons
  s += `<circle cx="120" cy="212" r="2.5" fill="${C.white}" stroke="${L}" stroke-width="1.2"/><circle cx="121" cy="236" r="2.5" fill="${C.white}" stroke="${L}" stroke-width="1.2"/><circle cx="121" cy="260" r="2.5" fill="${C.white}" stroke="${L}" stroke-width="1.2"/>`;
  // shirt pocket with a pen
  s += `<rect x="66" y="206" width="22" height="22" rx="2" fill="url(#${id}-stripes)" stroke="${L}" stroke-width="2"/>`;
  s += `<line x1="80" y1="196" x2="80" y2="214" stroke="${C.pen}" stroke-width="4" stroke-linecap="round"/><line x1="80" y1="196" x2="80" y2="214" stroke="${L}" stroke-width="1"/>`;
  // black jacket (bnei brak) under the suspenders? No: jacket goes OVER the shirt, suspenders peek through the gap.
  if (disguise === 'bneibrak') {
    s += `<g class="tv-jacket">` +
      `<path d="${egg}" fill="${C.black}" clip-path="url(#${id}-jl)"/><path d="${egg}" fill="${C.black}" clip-path="url(#${id}-jr)"/>` +
      `<path d="M 86 176 L 86 284 M 154 176 L 154 284" fill="none" stroke="${L}" stroke-width="3"/>` +
      `<path d="M 86 178 L 66 210 L 86 206 Z M 154 178 L 174 210 L 154 206 Z" fill="${C.blackLite}" stroke="${L}" stroke-width="2.5" stroke-linejoin="round"/>` +
      `</g>`;
  }
  // SUSPENDERS (the #2 identifier)
  const sl = 'M 92 174 C 70 212 64 246 76 284', sr = 'M 148 174 C 170 212 176 246 164 284';
  s += `<g class="tv-susp">` +
    `<path class="tv-susp-l" d="${sl}" fill="none" stroke="${C.mintEdge}" stroke-width="16"/><path d="${sl}" fill="none" stroke="${C.mint}" stroke-width="11"/>` +
    `<path class="tv-susp-r" d="${sr}" fill="none" stroke="${C.mintEdge}" stroke-width="16"/><path d="${sr}" fill="none" stroke="${C.mint}" stroke-width="11"/>`;
  if (disguise === 'tobi') {
    // lederhosen straps clipped over his own suspenders (narrower, so the mint peeks out)
    s += `<path d="${sl}" fill="none" stroke="${C.leather}" stroke-width="7"/><path d="${sr}" fill="none" stroke="${C.leather}" stroke-width="7"/>` +
      `<path d="M 72 222 L 168 222" stroke="${C.leather}" stroke-width="9"/><path d="M 72 222 L 168 222" stroke="${C.leatherLite}" stroke-width="3"/>` +
      `<g transform="translate(120 222)"><circle r="9" fill="${C.leatherLite}" stroke="${L}" stroke-width="2"/>` +
      `<g fill="#fff"><circle cx="0" cy="-5" r="2.6"/><circle cx="4.8" cy="-1.5" r="2.6"/><circle cx="3" cy="4" r="2.6"/><circle cx="-3" cy="4" r="2.6"/><circle cx="-4.8" cy="-1.5" r="2.6"/></g><circle r="2.2" fill="${C.gold}"/></g>`;
  }
  // silver clips
  for (const [cx, cy, rot] of [[76, 276, -8], [164, 276, 8]]) {
    s += `<g transform="translate(${cx} ${cy}) rotate(${rot})"><rect x="-11" y="-8" width="22" height="16" rx="3" fill="${C.silver}" stroke="${C.silverEdge}" stroke-width="2"/><rect x="-7" y="-3" width="14" height="4" rx="1" fill="${C.silverEdge}"/></g>`;
  }
  s += `</g>`;
  if (disguise === 'guest') {
    s += `<path d="M 98 180 L 120 226 L 142 180 Z" fill="url(#${id}-gingham)" stroke="${L}" stroke-width="2.5" stroke-linejoin="round"/>`;
  }
  s += `</g>`;
  return s;
}

const trousers = () =>
  `<path d="M 48 274 Q 120 262 192 274 L 192 320 L 48 320 Z" fill="${C.pants}" stroke="${C.line}" stroke-width="3"/>` +
  `<path d="M 120 280 L 120 320" stroke="#0E1120" stroke-width="2"/>` +
  `<path d="M 50 276 Q 120 266 190 276" fill="none" stroke="#0E1120" stroke-width="5"/>`;

const table = (y = 238) =>
  `<g class="tv-table"><rect x="0" y="${y}" width="240" height="90" fill="${C.wood}"/><rect x="0" y="${y}" width="240" height="8" fill="${C.woodLite}"/>` +
  `<path d="M 0 ${y + 30} q 60 -4 120 0 t 120 0 M 0 ${y + 56} q 70 4 140 0 t 100 0" fill="none" stroke="${C.woodDark}" stroke-width="2" opacity=".5"/>` +
  `<rect x="0" y="${y}" width="240" height="3" fill="${C.line}" opacity=".5"/></g>`;

// ---------- poses ----------
function armsBack(pose, id, disguise) {
  // parts drawn BEFORE the head
  const P = `${id}-stripes`;
  let s = '';
  if (pose === 'listen') {
    // viewer-left arm: sleeve down to the table, forearm resting on it
    s += limb(64, 194, 46, 236, 30, `url(#${P})`);
    s += cuff(46, 240, P);
    s += limb(46, 240, 104, 236, 22, C.skin);
    s += `<path d="M 86 227 q 2 6 -1 16" fill="none" stroke="${C.gold}" stroke-width="3" stroke-dasharray="2 2"/>`;
    s += hand(110, 236);
    if (disguise === 'guest') s += fork(130, 236, -90);
    // viewer-right arm: upper sleeve to the elbow on the table
    s += limb(178, 194, 204, 240, 30, `url(#${P})`);
    s += cuff(206, 244, P);
  } else if (pose === 'stand') {
    s += limb(62, 194, 44, 236, 30, `url(#${P})`); s += cuff(44, 238, P);
    s += limb(44, 238, 40, 272, 22, C.skin); s += `<path d="M 30 262 q 10 -2 20 0" fill="none" stroke="${C.gold}" stroke-width="3" stroke-dasharray="2 2"/>`;
    s += hand(40, 278); s += disguise === 'guest' ? fork(40, 268, -15) : colaCan(38, 270);
    s += limb(178, 194, 196, 236, 30, `url(#${P})`); s += cuff(196, 238, P);
    s += limb(196, 238, 192, 272, 22, C.skin); s += watch(196, 238, 192, 272, .55);
    s += hand(192, 278, 12); s += notebook(188, 270, -12);
  } else if (pose === 'write') {
    s += limb(178, 194, 202, 232, 30, `url(#${P})`); s += cuff(204, 234, P);
    s += limb(204, 234, 156, 240, 22, C.skin); s += watch(204, 234, 156, 240, .5);
    s += hand(152, 242, 12);
    s += `<g transform="translate(120 240) rotate(-4)"><rect x="-32" y="-18" width="64" height="38" rx="3" fill="${C.paper}" stroke="${C.line}" stroke-width="2.5"/><line x1="0" y1="-18" x2="0" y2="20" stroke="${C.grey}" stroke-width="1.5"/>` +
      `<path d="M -26 -10 h 20 M -26 -3 h 20 M -26 4 h 14 M 6 -10 h 20 M 6 -3 h 12" stroke="${C.grey}" stroke-width="1.5"/></g>`;
    s += limb(62, 194, 48, 232, 30, `url(#${P})`); s += cuff(48, 234, P);
    s += limb(48, 234, 92, 236, 22, C.skin); s += hand(98, 236, 12);
    s += `<line x1="104" y1="228" x2="120" y2="244" stroke="${C.pen}" stroke-width="5" stroke-linecap="round"/><line x1="104" y1="228" x2="120" y2="244" stroke="${C.line}" stroke-width="1.2"/>`;
  }
  return s;
}

function armsFront(pose, id) {
  // parts drawn AFTER the head (the fist under the chin)
  let s = '';
  if (pose === 'listen') {
    s += limb(206, 244, 164, 164, 24, C.skin);
    s += watch(206, 244, 164, 164, .5);
    s += `<circle cx="162" cy="160" r="16" fill="${C.skin}" stroke="${C.line}" stroke-width="3"/>`;
    s += `<path d="M 150 154 q 4 -6 8 -2 M 156 150 q 4 -6 8 -2" fill="none" stroke="${C.line}" stroke-width="2" stroke-linecap="round" opacity=".7"/>`;
    s += `<path d="M 164 174 q 5 -3 9 0" fill="none" stroke="${C.gold}" stroke-width="3.5" stroke-linecap="round"/>`; // the ring (for Isi)
  }
  return s;
}

const CROPS = { full: '0 0 240 320', bust: '0 0 240 232', head: '40 0 160 176' };

export function tuviaSVG(opts = {}) {
  const {
    expression = 'smirk', pose = 'listen', disguise = 'none', crop = 'full',
    size = 240, className = '', table: showTable = null
  } = opts;
  const id = opts.id || ('tv' + (++uid).toString(36));
  const face = FACES[expression] || FACES.smirk;
  const vb = CROPS[crop] || CROPS.full;
  const [, , vw, vh] = vb.split(' ').map(Number);
  const h = Math.round(size * vh / vw);
  const withTable = showTable ?? (pose === 'listen');

  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${size}" height="${h}" class="tuvia tv-${expression} tv-pose-${pose} tv-dis-${disguise} ${className}" role="img" aria-label="טוביה">`;
  s += `<defs>` +
    `<pattern id="${id}-stripes" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="${C.white}"/><rect width="3" height="8" fill="${C.navy}"/></pattern>` +
    `<pattern id="${id}-gingham" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#fff"/><rect width="4" height="8" fill="${C.canRed}" opacity=".45"/><rect width="8" height="4" fill="${C.canRed}" opacity=".45"/></pattern>` +
    `<clipPath id="${id}-headclip"><circle cx="120" cy="100" r="62"/></clipPath>` +
    `<clipPath id="${id}-jl"><rect x="0" y="0" width="86" height="320"/></clipPath>` +
    `<clipPath id="${id}-jr"><rect x="154" y="0" width="100" height="320"/></clipPath>` +
    `</defs>`;
  if (crop !== 'head') {
    if (!withTable) s += trousers();
    s += torso(disguise, id, pose);
    if (withTable) s += table();
    s += armsBack(pose, id, disguise);
  } else {
    s += `<rect x="100" y="140" width="40" height="40" fill="${C.skin}" stroke="${C.line}" stroke-width="3"/>`;
  }
  s += head(face, disguise, id, crop === 'head' ? 'stand' : pose);
  if (crop !== 'head') s += armsFront(pose, id);
  s += `</svg>`;
  return s;
}

// ---------- the goat (העז): silently disappointed in everyone ----------
export function goatSVG(opts = {}) {
  const { size = 120, mood = 'disappointed', className = '', flip = false } = opts;
  const L = C.line, fur = '#EFEEE9', furShade = '#CFCCC2';
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120" width="${size}" height="${Math.round(size * .75)}" class="goat goat-${mood} ${className}" role="img" aria-label="העז">`;
  s += `<g transform="${flip ? 'translate(160 0) scale(-1 1)' : ''}">`;
  // legs
  for (const x of [62, 80, 108, 126]) s += `<rect x="${x}" y="84" width="10" height="30" rx="4" fill="${furShade}" stroke="${L}" stroke-width="2.5"/><rect x="${x - 1}" y="108" width="12" height="7" rx="2" fill="${L}"/>`;
  // tail
  s += `<path d="M 138 62 q 14 -14 10 -24" fill="none" stroke="${L}" stroke-width="7" stroke-linecap="round"/><path d="M 138 62 q 14 -14 10 -24" fill="none" stroke="${fur}" stroke-width="3.5" stroke-linecap="round"/>`;
  // body
  s += `<ellipse cx="96" cy="68" rx="46" ry="27" fill="${fur}" stroke="${L}" stroke-width="3"/>`;
  s += `<path d="M 64 80 q 30 14 64 0" fill="none" stroke="${furShade}" stroke-width="4" opacity=".7"/>`;
  // neck + head
  s += `<path d="M 60 60 L 44 40 L 60 36 Z" fill="${fur}" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>`;
  s += `<ellipse cx="40" cy="42" rx="22" ry="17" fill="${fur}" stroke="${L}" stroke-width="3"/>`;
  s += `<rect x="6" y="40" width="34" height="22" rx="10" fill="${fur}" stroke="${L}" stroke-width="3"/>`;
  s += `<circle cx="12" cy="52" r="2.2" fill="${L}"/>`; // nostril
  // horns
  s += `<path d="M 32 28 C 30 14 36 6 44 4 M 48 26 C 48 14 54 8 62 8" fill="none" stroke="${C.leatherLite}" stroke-width="6" stroke-linecap="round"/><path d="M 32 28 C 30 14 36 6 44 4 M 48 26 C 48 14 54 8 62 8" fill="none" stroke="${L}" stroke-width="1.5" stroke-linecap="round"/>`;
  // ear
  s += `<path d="M 58 34 C 72 30 80 40 72 48 C 66 46 60 42 58 34 Z" fill="${fur}" stroke="${L}" stroke-width="2.5"/>`;
  // beard
  s += `<path d="M 22 62 L 26 76 L 32 62 Z" fill="${furShade}" stroke="${L}" stroke-width="2"/>`;
  // bell
  s += `<path d="M 52 54 q 8 6 14 2" fill="none" stroke="${C.canRed}" stroke-width="3"/><circle cx="60" cy="60" r="5" fill="${C.gold}" stroke="${L}" stroke-width="1.5"/>`;
  // eye: horizontal pupil (goats!)
  s += `<ellipse cx="34" cy="40" rx="8" ry="7" fill="#fff" stroke="${L}" stroke-width="2"/><rect x="28" y="38.5" width="12" height="3.5" rx="1.5" fill="#2A1A12"/>`;
  if (mood === 'disappointed') {
    s += `<path d="M 24 30 L 42 35" stroke="${L}" stroke-width="3" stroke-linecap="round"/>`;        // brow down toward the eye
    s += `<path d="M 10 57 q 6 -3 12 0" fill="none" stroke="${L}" stroke-width="2.2" stroke-linecap="round"/>`; // flat unimpressed mouth
  } else if (mood === 'smiling') {
    s += `<path d="M 26 31 q 8 -6 16 0" fill="none" stroke="${L}" stroke-width="3" stroke-linecap="round"/>`;
    s += `<path d="M 8 55 q 8 8 16 0" fill="none" stroke="${L}" stroke-width="2.5" stroke-linecap="round"/>`;
  } else {
    s += `<path d="M 24 26 q 10 -8 18 2" fill="none" stroke="${L}" stroke-width="3" stroke-linecap="round"/>`;
    s += `<ellipse cx="16" cy="57" rx="4" ry="5" fill="${C.mouth}" stroke="${L}" stroke-width="2"/>`;
  }
  s += `</g></svg>`;
  return s;
}

export const TUVIA_CSS = `
@keyframes tv-bounce { 0%,100% { transform: translateY(0) scaleY(1) } 30% { transform: translateY(4px) scaleY(.94) } 60% { transform: translateY(-3px) scaleY(1.03) } }
@keyframes tv-snap { 0%,100% { transform: scaleX(1) } 25% { transform: scaleX(1.12) } 55% { transform: scaleX(.96) } }
@keyframes tv-glint { 0%,100% { opacity:.55 } 50% { opacity:1; stroke-width:4 } }
@keyframes tv-steam { 0% { transform: translateY(0); opacity:.9 } 100% { transform: translateY(-14px); opacity:0 } }
@keyframes tv-zzz { 0% { transform: translate(0,0); opacity:0 } 30% { opacity:1 } 100% { transform: translate(8px,-18px); opacity:0 } }
@keyframes tv-shake { 0%,100% { transform: translate(0,0) } 20% { transform: translate(-4px,2px) } 40% { transform: translate(4px,-2px) } 60% { transform: translate(-3px,-1px) } 80% { transform: translate(3px,1px) } }
.tuvia .tv-belly, .tuvia .tv-susp, .tuvia .tv-head { transform-box: fill-box; transform-origin: center bottom; }
.tuvia.anim-laugh .tv-belly { animation: tv-bounce .55s ease-in-out 2; }
.tuvia.anim-snap .tv-susp { animation: tv-snap .45s ease-out 1; transform-origin: center center; }
.tuvia.anim-glint .tv-glint { animation: tv-glint .7s ease-in-out 2; }
.tuvia .tv-steam path { animation: tv-steam 1.6s ease-out infinite; }
.tuvia .tv-steam path:nth-child(2) { animation-delay: .5s } .tuvia .tv-steam path:nth-child(3) { animation-delay: 1s }
.tuvia .tv-zzz text { animation: tv-zzz 2.4s ease-out infinite; }
.tuvia .tv-zzz text:nth-child(2) { animation-delay: .8s } .tuvia .tv-zzz text:nth-child(3) { animation-delay: 1.6s }
.tuvia.anim-shake { animation: tv-shake .4s linear 2; }
`;
