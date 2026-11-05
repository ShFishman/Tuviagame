/* js/art/npcs.js — the cast as simple SVG caricatures (SPEC §6.3 silhouette hooks + colors).
 * npcSVG(name, { mood, size }) → <svg> string, viewBox 0 0 200 260 (bust-to-waist, feet for the full-body ones).
 * Nobody here has red round glasses, mint suspenders or a pinstripe shirt: that silhouette belongs to Tuvia.
 * Moods: neutral | happy | smile | soft | flat | angry | shy | sweat | narrow1 | narrow2 | narrow3 (Gittel's eyes)
 */
import { goatSVG } from './tuvia.js';

const L = '#3B2A21';
const SKIN = { light: '#F7CFAE', tan: '#E8B98F', olive: '#D9A878', rosy: '#F4C6B0' };

let uid = 0;

function eyes(mood, cx1, cx2, cy, opts = {}) {
  const r = opts.r || 7;
  const pupil = (cx, dy = 0, pr = 3.2) => `<circle cx="${cx}" cy="${cy + dy}" r="${pr}" fill="#2A1A12"/><circle cx="${cx - 1}" cy="${cy + dy - 1}" r="1" fill="#fff"/>`;
  const open = (cx, ry) => `<ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${ry}" fill="#fff" stroke="${L}" stroke-width="2"/>`;
  switch (mood) {
    case 'happy':
      return [cx1, cx2].map((cx) => `<path d="M ${cx - r} ${cy + 1} Q ${cx} ${cy - 9} ${cx + r} ${cy + 1}" fill="none" stroke="${L}" stroke-width="3" stroke-linecap="round"/>`).join('');
    case 'shy':
      return [cx1, cx2].map((cx) => open(cx, r) + pupil(cx, 3)).join('');
    case 'narrow1':
      return [cx1, cx2].map((cx) => open(cx, r * .62) + pupil(cx, 0, 2.8)).join('');
    case 'narrow2':
      return [cx1, cx2].map((cx) => open(cx, r * .38) + pupil(cx, 0, 2.2)).join('');
    case 'narrow3':
      return [cx1, cx2].map((cx) => `<path d="M ${cx - r} ${cy} L ${cx + r} ${cy}" stroke="${L}" stroke-width="3.2" stroke-linecap="round"/>`).join('');
    case 'flat':
      return [cx1, cx2].map((cx) => open(cx, r) + pupil(cx) + `<path d="M ${cx - r - 1} ${cy - 3} L ${cx + r + 1} ${cy - 3}" stroke="${L}" stroke-width="2.6"/>` + `<rect x="${cx - r - 1}" y="${cy - r - 2}" width="${2 * r + 2}" height="${r - 1}" fill="${opts.skin || SKIN.light}"/>`).join('');
    case 'angry':
      return [cx1, cx2].map((cx) => open(cx, r * .8) + pupil(cx, 0, 2.8)).join('');
    default:
      return [cx1, cx2].map((cx) => open(cx, r) + pupil(cx)).join('');
  }
}

function brows(mood, cx1, cx2, cy, color = L) {
  const y = cy - 13;
  const one = (cx, s) => {
    if (mood === 'angry') return `<path d="M ${cx - 8} ${y - 2 * s} L ${cx + 8} ${y + 3 * s}" stroke="${color}" stroke-width="3.5" stroke-linecap="round"/>`;
    if (mood === 'narrow1' || mood === 'narrow2' || mood === 'narrow3') return `<path d="M ${cx - 8} ${y + 1} Q ${cx} ${y + 4 - (mood === 'narrow3' ? 0 : 2)} ${cx + 8} ${y + 2 * s}" stroke="${color}" stroke-width="3.5" stroke-linecap="round" fill="none"/>`;
    if (mood === 'happy' || mood === 'soft' || mood === 'smile') return `<path d="M ${cx - 8} ${y} Q ${cx} ${y - 5} ${cx + 8} ${y}" stroke="${color}" stroke-width="3" stroke-linecap="round" fill="none"/>`;
    if (mood === 'sweat' || mood === 'shy') return `<path d="M ${cx - 8} ${y - 3 * s} Q ${cx} ${y - 6} ${cx + 8} ${y - 1}" stroke="${color}" stroke-width="3" stroke-linecap="round" fill="none"/>`;
    return `<path d="M ${cx - 8} ${y} Q ${cx} ${y - 3} ${cx + 8} ${y}" stroke="${color}" stroke-width="3" stroke-linecap="round" fill="none"/>`;
  };
  return one(cx1, 1) + one(cx2, -1);
}

function mouthOf(mood, cx, cy) {
  switch (mood) {
    case 'happy': return `<path d="M ${cx - 14} ${cy} Q ${cx} ${cy + 18} ${cx + 14} ${cy} Z" fill="#7A2730" stroke="${L}" stroke-width="2.5"/><path d="M ${cx - 9} ${cy + 2} Q ${cx} ${cy + 6} ${cx + 9} ${cy + 2}" fill="#FFF8E6"/>`;
    case 'smile': case 'soft': return `<path d="M ${cx - 11} ${cy} Q ${cx} ${cy + 10} ${cx + 11} ${cy}" fill="none" stroke="${L}" stroke-width="2.8" stroke-linecap="round"/>`;
    case 'flat': return `<path d="M ${cx - 11} ${cy + 2} L ${cx + 11} ${cy + 2}" stroke="${L}" stroke-width="2.8" stroke-linecap="round"/>`;
    case 'angry': case 'narrow3': return `<path d="M ${cx - 11} ${cy + 5} Q ${cx} ${cy - 4} ${cx + 11} ${cy + 5}" fill="none" stroke="${L}" stroke-width="2.8" stroke-linecap="round"/>`;
    case 'narrow1': case 'narrow2': return `<path d="M ${cx - 10} ${cy + 3} Q ${cx} ${cy + 1} ${cx + 10} ${cy + 3}" fill="none" stroke="${L}" stroke-width="2.8" stroke-linecap="round"/>`;
    case 'shy': return `<circle cx="${cx}" cy="${cy + 3}" r="4" fill="#7A2730" stroke="${L}" stroke-width="2"/>`;
    case 'sweat': return `<path d="M ${cx - 11} ${cy + 3} q 5 -5 11 0 t 11 0" fill="none" stroke="${L}" stroke-width="2.8" stroke-linecap="round"/>`;
    default: return `<path d="M ${cx - 9} ${cy + 2} Q ${cx} ${cy + 6} ${cx + 9} ${cy + 2}" fill="none" stroke="${L}" stroke-width="2.6" stroke-linecap="round"/>`;
  }
}

const sweatDrop = (x, y) => `<path d="M ${x} ${y} q 7 12 0 16 q -7 -4 0 -16 Z" fill="#8EC9F0" stroke="${L}" stroke-width="1.5"/>`;

// A generic head: round-ish face at (100, 90), r ≈ 42.
function head({ skin = SKIN.light, mood = 'neutral', hair = '', beard = '', front = '', shape = 'round', blush = true, cheekColor = '#F29C9C', eyeOpts = {} }) {
  const face = shape === 'long'
    ? `<ellipse cx="100" cy="92" rx="36" ry="44" fill="${skin}" stroke="${L}" stroke-width="3"/>`
    : shape === 'wide'
      ? `<ellipse cx="100" cy="92" rx="46" ry="40" fill="${skin}" stroke="${L}" stroke-width="3"/>`
      : `<circle cx="100" cy="92" r="42" fill="${skin}" stroke="${L}" stroke-width="3"/>`;
  const ears = `<circle cx="58" cy="94" r="8" fill="${skin}" stroke="${L}" stroke-width="2.5"/><circle cx="142" cy="94" r="8" fill="${skin}" stroke="${L}" stroke-width="2.5"/>`;
  const cheeks = blush ? `<circle cx="74" cy="106" r="8" fill="${cheekColor}" opacity=".5"/><circle cx="126" cy="106" r="8" fill="${cheekColor}" opacity=".5"/>` : '';
  const nose = `<path d="M 98 90 C 94 100 98 106 108 101" fill="none" stroke="${L}" stroke-width="2.4" stroke-linecap="round"/>`;
  return ears + face + hair + cheeks + beard + nose + eyes(mood, 84, 116, 90, { ...eyeOpts, skin }) + brows(mood, 84, 116, 90, eyeOpts.browColor) + mouthOf(mood, 100, 115) + (mood === 'sweat' ? sweatDrop(140, 60) : '') + front;
}

const torso = (color, extra = '') => `<path d="M 50 150 Q 100 128 150 150 L 166 260 L 34 260 Z" fill="${color}" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>${extra}`;
const neck = (skin) => `<rect x="86" y="126" width="28" height="28" fill="${skin}" stroke="${L}" stroke-width="2.5"/>`;

// ---------------------------------------------------------------- the cast
const CAST = {
  shira(mood) {
    const skin = SKIN.tan;
    const hair = `<path d="M 58 80 C 60 46 140 46 142 80 L 142 92 C 130 70 70 70 58 92 Z" fill="#3B2314" stroke="${L}" stroke-width="2.5"/>` +
      `<path d="M 138 70 C 170 60 176 110 160 150 C 166 110 150 92 136 88 Z" fill="#3B2314" stroke="${L}" stroke-width="2.5"/>`; // ponytail
    const glasses = `<g><rect x="62" y="76" width="34" height="24" rx="10" fill="#1E2430" stroke="${L}" stroke-width="2.5"/><rect x="104" y="76" width="34" height="24" rx="10" fill="#1E2430" stroke="${L}" stroke-width="2.5"/>` +
      `<path d="M 96 86 L 104 86" stroke="${L}" stroke-width="3"/><path d="M 68 80 q 8 -2 14 2 M 110 80 q 8 -2 14 2" stroke="#fff" stroke-width="2" opacity=".5" fill="none"/></g>`;
    const uniform = torso('#1F2C52', `<path d="M 100 150 L 100 260" stroke="#0F1733" stroke-width="2"/><path d="M 60 160 L 86 152 L 100 176 L 114 152 L 140 160" fill="none" stroke="#E9EEF5" stroke-width="3"/>` +
      `<rect x="112" y="178" width="26" height="14" rx="2" fill="#E9EEF5" stroke="${L}" stroke-width="1.5"/><text x="125" y="188" font-size="8" text-anchor="middle" font-family="Rubik,Arial" fill="${L}">שירה</text>` +
      `<circle cx="70" cy="190" r="5" fill="#E5B632" stroke="${L}" stroke-width="1.5"/>`);
    return uniform + neck(skin) + head({ skin, mood, hair, front: glasses, eyeOpts: { browColor: '#2A1A12' } });
  },
  moshe(mood) {
    const skin = SKIN.olive;
    const cab = `<rect x="0" y="130" width="200" height="130" fill="#F2C230" stroke="${L}" stroke-width="3"/><rect x="0" y="130" width="200" height="12" fill="#1B2034"/>` +
      `<rect x="30" y="150" width="140" height="22" rx="4" fill="#2B3A67" stroke="${L}" stroke-width="2"/><text x="100" y="166" font-size="12" text-anchor="middle" font-family="Rubik,Arial" fill="#fff">מונית · TAXI</text>`;
    const hair = `<path d="M 60 72 C 70 40 130 40 140 72 L 136 80 C 120 64 80 64 64 80 Z" fill="#4A4A52" stroke="${L}" stroke-width="2.5"/>` +
      `<path d="M 52 60 L 148 60 L 142 74 L 58 74 Z" fill="#1B2034" stroke="${L}" stroke-width="2.5"/><path d="M 56 60 Q 100 40 144 60 Z" fill="#1B2034" stroke="${L}" stroke-width="2.5"/>`; // flat cap
    const mustache = `<path d="M 80 110 Q 100 102 120 110 Q 110 118 100 112 Q 90 118 80 110 Z" fill="#4A4A52" stroke="${L}" stroke-width="2"/>`;
    const arm = `<path d="M 24 200 C 10 190 6 170 24 160 L 40 164 C 30 176 32 188 40 196 Z" fill="${skin}" stroke="${L}" stroke-width="2.5"/><rect x="36" y="150" width="30" height="18" rx="6" fill="#DDE0E5" stroke="${L}" stroke-width="2"/>`;
    const shirt = `<path d="M 60 150 Q 100 134 140 150 L 150 200 L 50 200 Z" fill="#DDE0E5" stroke="${L}" stroke-width="2.5"/><path d="M 60 150 L 90 200 M 140 150 L 110 200" stroke="#B4B9C2" stroke-width="2"/>`;
    return shirt + neck(skin) + head({ skin, mood, hair, beard: mustache, shape: 'wide' }) + cab + arm;
  },
  elyashiv(mood) {
    const skin = SKIN.rosy;
    const beard = `<path d="M 58 100 C 50 150 70 200 100 206 C 130 200 150 150 142 100 C 130 120 70 120 58 100 Z" fill="#5A3A1C" stroke="${L}" stroke-width="2.5"/>` +
      `<path d="M 80 130 q 20 10 40 0 M 76 160 q 24 14 48 0" fill="none" stroke="#3E2812" stroke-width="2" opacity=".6"/>`;
    const hair = `<path d="M 56 84 C 54 50 146 50 144 84 L 140 90 C 120 66 80 66 60 90 Z" fill="#5A3A1C" stroke="${L}" stroke-width="2.5"/>` +
      `<ellipse cx="100" cy="52" rx="34" ry="12" fill="#D9E6C3" stroke="${L}" stroke-width="2.5"/><path d="M 72 52 q 28 -4 56 0 M 80 46 q 20 -3 40 0" fill="none" stroke="#3F8C6B" stroke-width="2"/>`; // knitted kippah, big
    const shirt = torso('#6B7A3A', `<path d="M 60 200 L 140 200" stroke="#4E5A2A" stroke-width="2"/><path d="M 80 150 L 100 180 L 120 150" fill="none" stroke="#4E5A2A" stroke-width="3"/>`);
    const hug = mood === 'happy' ? `<path d="M 34 180 C 10 150 20 120 48 118 M 166 180 C 190 150 180 120 152 118" fill="none" stroke="${skin}" stroke-width="18" stroke-linecap="round"/><path d="M 34 180 C 10 150 20 120 48 118 M 166 180 C 190 150 180 120 152 118" fill="none" stroke="${L}" stroke-width="2.5"/>` : '';
    return shirt + neck(skin) + head({ skin, mood, hair, beard, shape: 'long' }) + hug;
  },
  tzofia(mood) {
    const skin = SKIN.light;
    const scarf = `<path d="M 50 92 C 46 40 154 40 150 92 L 158 150 L 42 150 Z" fill="#D9A520" stroke="${L}" stroke-width="2.5"/><path d="M 64 92 C 70 60 130 60 136 92" fill="none" stroke="#B58612" stroke-width="3"/>` +
      `<path d="M 56 70 q 44 -14 88 0" fill="none" stroke="#F2C94C" stroke-width="3"/>`;
    const dress = torso('#C98D1A', `<path d="M 40 250 Q 100 236 160 250" fill="none" stroke="#8A5F0C" stroke-width="2"/>`);
    // baby on the shoulder (left), ladle in the right hand
    const baby = `<g transform="translate(150 150)"><ellipse cx="0" cy="24" rx="20" ry="26" fill="#EDE3F7" stroke="${L}" stroke-width="2.5"/><circle cx="0" cy="-4" r="16" fill="${SKIN.rosy}" stroke="${L}" stroke-width="2.5"/><path d="M -6 -2 q 3 3 6 0 M 0 -2 q 3 3 6 0" fill="none" stroke="${L}" stroke-width="2"/><path d="M -5 4 q 5 4 10 0" fill="none" stroke="${L}" stroke-width="2"/><path d="M -10 -16 q 10 -8 20 0" fill="none" stroke="#8A6B4A" stroke-width="3"/></g>`;
    const ladle = `<g transform="translate(40 200) rotate(-30)"><line x1="0" y1="0" x2="0" y2="-70" stroke="#8E8E94" stroke-width="6" stroke-linecap="round"/><line x1="0" y1="0" x2="0" y2="-70" stroke="${L}" stroke-width="1.5"/><ellipse cx="0" cy="6" rx="14" ry="9" fill="#8E8E94" stroke="${L}" stroke-width="2"/></g>`;
    return dress + neck(skin) + scarf + head({ skin, mood, hair: '', shape: 'round' }) + baby + ladle;
  },
  neria(mood) {
    const skin = SKIN.tan;
    const hair = `<path d="M 60 78 C 62 46 138 46 140 78 L 136 84 C 120 66 80 66 64 84 Z" fill="#2A1A12" stroke="${L}" stroke-width="2.5"/>` +
      `<ellipse cx="100" cy="52" rx="22" ry="8" fill="#2B3A67" stroke="${L}" stroke-width="2"/>` + // small kippah
      `<path d="M 60 84 C 52 110 56 140 62 160 M 140 84 C 148 110 144 140 138 160" fill="none" stroke="#2A1A12" stroke-width="7" stroke-linecap="round"/>` + // peyot to the shoulders
      `<path d="M 60 84 C 52 110 56 140 62 160 M 140 84 C 148 110 144 140 138 160" fill="none" stroke="#5A3A1C" stroke-width="2" stroke-dasharray="4 6"/>`;
    const shirt = torso('#E8722A', `<path d="M 80 150 L 100 172 L 120 150" fill="none" stroke="#B4541A" stroke-width="3"/>`);
    const guitar = `<g transform="translate(100 215) rotate(-25)"><path d="M -36 0 c 0 -18 14 -24 24 -16 c 10 -8 28 -4 28 14 c 0 14 -14 22 -28 16 c -10 10 -24 2 -24 -14 Z" fill="#B8732E" stroke="${L}" stroke-width="2.5"/><circle cx="-2" cy="0" r="7" fill="#3B2A21"/><rect x="14" y="-4" width="70" height="8" rx="2" fill="#5A3A1C" stroke="${L}" stroke-width="2"/><path d="M -20 -2 L 80 -2 M -20 2 L 80 2" stroke="#F2E6C8" stroke-width="1"/></g>`;
    return shirt + neck(skin) + head({ skin, mood, hair, shape: 'long', blush: false }) + guitar;
  },
  gittel(mood) {
    const skin = SKIN.rosy;
    // tiny: everything scaled down and lowered; a giant pot in front
    const wig = `<path d="M 52 96 C 46 40 154 40 148 96 L 148 120 C 140 90 130 76 100 72 C 70 76 60 90 52 120 Z" fill="#5A3A1C" stroke="${L}" stroke-width="2.5"/><path d="M 62 70 q 38 -16 76 0" fill="none" stroke="#7A5230" stroke-width="3"/>`;
    const dress = torso('#7A1F2E', `<path d="M 62 160 q 38 12 76 0" fill="none" stroke="#F2E6C8" stroke-width="3"/><circle cx="100" cy="190" r="4" fill="#E5B632" stroke="${L}" stroke-width="1.5"/>`);
    const apron = `<path d="M 66 196 L 134 196 L 140 260 L 60 260 Z" fill="#F2E6C8" stroke="${L}" stroke-width="2"/>`;
    const pot = `<g transform="translate(100 236)"><ellipse cx="0" cy="-26" rx="78" ry="12" fill="#6E6E74" stroke="${L}" stroke-width="2.5"/><rect x="-78" y="-26" width="156" height="50" fill="#8E8E94" stroke="${L}" stroke-width="2.5"/><rect x="-82" y="-32" width="164" height="10" rx="4" fill="#B5B5BB" stroke="${L}" stroke-width="2"/><circle cx="0" cy="-36" r="6" fill="#B5B5BB" stroke="${L}" stroke-width="2"/>` +
      `<g fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8" class="steam"><path d="M -30 -40 c -6 -8 6 -12 0 -20"/><path d="M 0 -46 c -6 -8 6 -12 0 -20"/><path d="M 30 -40 c -6 -8 6 -12 0 -20"/></g></g>`;
    const inner = dress + apron + neck(skin) + wig + head({ skin, mood, hair: '', shape: 'round', eyeOpts: { r: 6 } });
    return `<g transform="translate(100 260) scale(.82) translate(-100 -260)">${inner}</g>` + pot;
  },
  shmerel(mood) {
    const skin = SKIN.rosy;
    const hat = `<rect x="56" y="22" width="88" height="34" rx="6" fill="#17181C" stroke="${L}" stroke-width="2.5"/><ellipse cx="100" cy="58" rx="60" ry="10" fill="#17181C" stroke="${L}" stroke-width="2.5"/>`;
    const beard = `<path d="M 56 98 C 48 140 66 180 100 186 C 134 180 152 140 144 98 C 130 118 70 118 56 98 Z" fill="#9AA0AA" stroke="${L}" stroke-width="2.5"/><path d="M 78 130 q 22 10 44 0" fill="none" stroke="#6E737C" stroke-width="2"/>`;
    const coat = `<path d="M 40 150 Q 100 124 160 150 C 190 190 190 240 170 260 L 30 260 C 10 240 10 190 40 150 Z" fill="#17181C" stroke="${L}" stroke-width="3"/>` +
      `<path d="M 100 160 L 100 260" stroke="#3A3D46" stroke-width="2"/><path d="M 84 150 L 100 176 L 116 150 L 118 240 L 82 240 Z" fill="#E5B632" stroke="${L}" stroke-width="2"/>` + // gold vest
      `<path d="M 160 200 C 184 196 186 230 176 250" fill="none" stroke="#17181C" stroke-width="2"/>`;
    const bottle = `<g transform="translate(160 206) rotate(10)"><rect x="-9" y="-30" width="18" height="52" rx="4" fill="#DDEAF5" stroke="${L}" stroke-width="2"/><rect x="-5" y="-44" width="10" height="16" fill="#DDEAF5" stroke="${L}" stroke-width="2"/><rect x="-7" y="-14" width="14" height="18" fill="#C0262D"/><text x="0" y="0" font-size="7" text-anchor="middle" font-family="Arial" fill="#fff">לחיים</text></g>`;
    const phones = `<rect x="40" y="200" width="16" height="26" rx="3" fill="#2E3038" stroke="${L}" stroke-width="2"/><rect x="58" y="206" width="16" height="26" rx="3" fill="#2E3038" stroke="${L}" stroke-width="2"/><circle cx="66" cy="214" r="2" fill="#E9707C"/>`;
    const sweat = mood === 'sweat' ? sweatDrop(146, 64) : '';
    return coat + neck(skin) + head({ skin, mood, hair: hat, beard, shape: 'wide' }) + bottle + phones + sweat;
  },
  yanky(mood) {
    const skin = SKIN.light;
    const hat = `<rect x="66" y="26" width="68" height="30" rx="6" fill="#17181C" stroke="${L}" stroke-width="2.5"/><ellipse cx="100" cy="58" rx="50" ry="9" fill="#17181C" stroke="${L}" stroke-width="2.5"/>`;
    const fuzz = `<path d="M 70 112 C 72 134 128 134 130 112" fill="none" stroke="#5A3A1C" stroke-width="3" stroke-dasharray="2 4"/>`;
    const peyot = `<path d="M 64 90 C 56 100 60 120 64 128 M 136 90 C 144 100 140 120 136 128" fill="none" stroke="#2A1A12" stroke-width="5" stroke-linecap="round"/>`;
    // oversized grey suit: shoulders way wider than the thin neck
    const suit = `<path d="M 30 156 Q 100 126 170 156 L 178 260 L 22 260 Z" fill="#6E737C" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>` +
      `<path d="M 86 150 L 100 184 L 114 150 L 112 260 L 88 260 Z" fill="#fff" stroke="${L}" stroke-width="2"/><path d="M 100 184 L 100 250" stroke="#17181C" stroke-width="6"/>` +
      `<path d="M 30 156 L 26 240 M 170 156 L 174 240" stroke="#4E535B" stroke-width="2"/>`;
    const book = `<g transform="translate(150 230) rotate(-12)"><rect x="-16" y="-20" width="32" height="40" rx="2" fill="#2B3A67" stroke="${L}" stroke-width="2"/><rect x="-12" y="-16" width="24" height="32" fill="#F8F2E2"/></g>`;
    return suit + `<rect x="92" y="126" width="16" height="30" fill="${skin}" stroke="${L}" stroke-width="2.5"/>` + head({ skin, mood, hair: hat + peyot, beard: fuzz, shape: 'long', eyeOpts: { r: 8 } }) + book;
  },
  gabbai(mood) {
    const skin = SKIN.tan;
    const hat = `<rect x="62" y="26" width="76" height="30" rx="6" fill="#17181C" stroke="${L}" stroke-width="2.5"/><ellipse cx="100" cy="58" rx="54" ry="9" fill="#17181C" stroke="${L}" stroke-width="2.5"/>`;
    const beard = `<path d="M 60 100 C 56 136 72 164 100 168 C 128 164 144 136 140 100 C 128 118 72 118 60 100 Z" fill="#DDE0E5" stroke="${L}" stroke-width="2.5"/>`;
    const tallit = torso('#F4F1E8', `<path d="M 50 170 L 150 170 M 50 180 L 150 180 M 50 230 L 150 230 M 50 240 L 150 240" stroke="#2B3A67" stroke-width="3"/><path d="M 100 150 L 100 260" stroke="#D8D4C8" stroke-width="2"/>`);
    const hand = `<g transform="translate(152 200)"><circle r="16" fill="${skin}" stroke="${L}" stroke-width="2.5"/><path d="M -10 -12 L -12 -30 M -2 -14 L -2 -34 M 6 -14 L 8 -32 M 12 -8 L 20 -24" stroke="${skin}" stroke-width="7" stroke-linecap="round"/><path d="M -10 -12 L -12 -30 M -2 -14 L -2 -34 M 6 -14 L 8 -32 M 12 -8 L 20 -24" stroke="${L}" stroke-width="2" stroke-linecap="round" fill="none"/></g>`;
    return tallit + neck(skin) + head({ skin, mood, hair: hat, beard, shape: 'round' }) + hand;
  },
  dana(mood) {
    const skin = SKIN.tan;
    const hair = `<path d="M 58 84 C 58 44 142 44 142 84 L 140 96 C 128 72 72 72 60 96 Z" fill="#C98D1A" stroke="${L}" stroke-width="2.5"/><path d="M 136 72 C 160 70 164 110 152 140 C 156 110 146 92 134 88 Z" fill="#C98D1A" stroke="${L}" stroke-width="2.5"/>`;
    const vest = torso('#C0262D', `<path d="M 80 150 L 100 180 L 120 150" fill="none" stroke="#fff" stroke-width="3"/><rect x="112" y="186" width="30" height="14" rx="2" fill="#fff" stroke="${L}" stroke-width="1.5"/><text x="127" y="196" font-size="8" text-anchor="middle" font-family="Rubik,Arial" fill="${L}">דנה</text>`);
    const choc = `<g transform="translate(46 212) rotate(-10)"><rect x="-22" y="-14" width="44" height="28" rx="3" fill="#5A3A1C" stroke="${L}" stroke-width="2"/><path d="M -22 -4 h 44 M -22 5 h 44 M -8 -14 v 28 M 8 -14 v 28" stroke="#3B2A21" stroke-width="1.5"/></g>`;
    return vest + neck(skin) + head({ skin, mood, hair, shape: 'round' }) + choc;
  },
  isi(mood) {
    const skin = SKIN.light;
    const hair = `<path d="M 54 92 C 50 40 150 40 146 92 L 146 112 C 140 84 128 72 100 70 C 72 72 60 84 54 112 Z" fill="#2A1A12" stroke="${L}" stroke-width="2.5"/><path d="M 64 68 q 36 -12 72 0" fill="none" stroke="#4A3024" stroke-width="3"/>`;
    const earrings = `<circle cx="58" cy="108" r="4" fill="#E5B632" stroke="${L}" stroke-width="1.5"/><circle cx="142" cy="108" r="4" fill="#E5B632" stroke="${L}" stroke-width="1.5"/>`;
    const top = torso('#3F8C6B', `<path d="M 86 150 Q 100 166 114 150" fill="none" stroke="#2A5E48" stroke-width="3"/>`);
    const mug = `<g transform="translate(150 214)"><rect x="-16" y="-18" width="32" height="36" rx="4" fill="#fff" stroke="${L}" stroke-width="2"/><path d="M 16 -8 a 10 10 0 0 1 0 20" fill="none" stroke="${L}" stroke-width="2.5"/><text x="0" y="4" font-size="9" text-anchor="middle" font-family="Arial" fill="${L}">NYC</text></g>`;
    return top + neck(skin) + hair + head({ skin, mood, hair: '', shape: 'round' }) + earrings + mug;
  },
};

export const NPC_NAMES = {
  shira: 'שירה', moshe: 'משה', elyashiv: 'אלישיב', tzofia: 'צופיה', neria: 'נריה', gittel: 'הרבנית גיטל',
  shmerel: 'ר\' שמערל', yanky: 'יענקי', gabbai: 'הגבאי', dana: 'דנה', isi: 'איזי', goat: 'העז', tuvia: 'טוביה', narr: '',
};

export function npcSVG(name, opts = {}) {
  const { mood = 'neutral', size = 200, className = '' } = opts;
  if (name === 'goat') {
    const m = mood === 'happy' || mood === 'smiling' ? 'smiling' : mood === 'shocked' ? 'shocked' : 'disappointed';
    return goatSVG({ size, mood: m, className: 'npc npc-goat ' + className });
  }
  const fn = CAST[name];
  if (!fn) return '';
  const id = 'npc' + (++uid).toString(36);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 260" width="${size}" height="${Math.round(size * 1.3)}" class="npc npc-${name} npc-m-${mood} ${className}" role="img" aria-label="${NPC_NAMES[name] || name}" data-id="${id}">${fn(mood)}</svg>`;
}

/** Gittel for the quiz: `narrow` 0..3 maps to neutral/narrow1/narrow2/narrow3. */
export function gittelNarrow(level, size) {
  return npcSVG('gittel', { mood: level <= 0 ? 'neutral' : 'narrow' + Math.min(3, level), size });
}
