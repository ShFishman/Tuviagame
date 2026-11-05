// js/art/npcs.js — NPC caricatures as SVG strings. Same 240×320 box as Tuvia so they stand together.
// Drawn from the SPEC §6.3 silhouette hooks and colors. NPCs NEVER share Tuvia's props:
// no red round glasses, no mint suspenders, no blue pinstripes. Everyone gets one human line in the writing,
// and one hook in the drawing (Shira's sunglasses, Moshe's cab window, Elyashiv's beard, Tzofia's ladle, ...).
//
//   npcSVG(id, { size, crop: 'full'|'bust'|'head', mood: 'neutral'|'talk'|'happy'|'narrow'|'sad' })

const L = '#3B2A21';
const SKIN = { a: '#F3CBA6', b: '#E8B88E', c: '#D9A47A', d: '#F7D6B5' };
let uid = 0;

function face(cx, cy, r, skin, { eyes = 'open', mouth = 'flat', browDy = 0, browTilt = 0, blush = .3, mood = 'neutral' } = {}) {
  let s = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${skin}" stroke="${L}" stroke-width="3.5"/>`;
  const ex = r * .38, ey = cy - r * .08;
  // eyes
  const eyeOne = (x) => {
    if (mood === 'narrow' || eyes === 'narrow') return `<path d="M ${x - 8} ${ey} L ${x + 8} ${ey - 1}" stroke="${L}" stroke-width="3" stroke-linecap="round"/><circle cx="${x}" cy="${ey + 2}" r="2.5" fill="${L}"/>`;
    if (mood === 'happy' || eyes === 'closedHappy') return `<path d="M ${x - 8} ${ey + 2} Q ${x} ${ey - 7} ${x + 8} ${ey + 2}" fill="none" stroke="${L}" stroke-width="3" stroke-linecap="round"/>`;
    if (eyes === 'big') return `<circle cx="${x}" cy="${ey}" r="9" fill="#fff" stroke="${L}" stroke-width="2"/><circle cx="${x}" cy="${ey + 1}" r="4.5" fill="#2A1A12"/><circle cx="${x - 1.5}" cy="${ey - 1}" r="1.5" fill="#fff"/>`;
    if (eyes === 'tired') return `<ellipse cx="${x}" cy="${ey}" rx="8" ry="5" fill="#fff" stroke="${L}" stroke-width="2"/><circle cx="${x}" cy="${ey + 1}" r="3.5" fill="#2A1A12"/><path d="M ${x - 8} ${ey - 2} Q ${x} ${ey - 5} ${x + 8} ${ey - 2}" fill="${skin}" stroke="${L}" stroke-width="2"/>`;
    return `<ellipse cx="${x}" cy="${ey}" rx="8" ry="6.5" fill="#fff" stroke="${L}" stroke-width="2"/><circle cx="${x}" cy="${ey + 1}" r="3.5" fill="#2A1A12"/><circle cx="${x - 1.2}" cy="${ey - .5}" r="1.2" fill="#fff"/>`;
  };
  s += eyeOne(cx - ex) + eyeOne(cx + ex);
  // brows
  const by = ey - 13 + browDy;
  s += `<path d="M ${cx - ex - 9} ${by + browTilt} Q ${cx - ex} ${by - 4} ${cx - ex + 9} ${by - browTilt}" fill="none" stroke="${L}" stroke-width="3.5" stroke-linecap="round"/>`;
  s += `<path d="M ${cx + ex - 9} ${by - browTilt} Q ${cx + ex} ${by - 4} ${cx + ex + 9} ${by + browTilt}" fill="none" stroke="${L}" stroke-width="3.5" stroke-linecap="round"/>`;
  // nose
  s += `<path d="M ${cx - 2} ${cy + 2} q -5 9 4 10" fill="none" stroke="${L}" stroke-width="2.5" stroke-linecap="round"/>`;
  // mouth
  const my = cy + r * .5;
  const m = mood === 'talk' ? 'open' : (mood === 'happy' ? 'smile' : (mood === 'sad' ? 'frown' : mouth));
  if (m === 'open') s += `<ellipse cx="${cx}" cy="${my}" rx="8" ry="6" fill="#7A2730" stroke="${L}" stroke-width="2.5"/>`;
  else if (m === 'smile') s += `<path d="M ${cx - 12} ${my - 3} Q ${cx} ${my + 10} ${cx + 12} ${my - 3}" fill="none" stroke="${L}" stroke-width="3" stroke-linecap="round"/>`;
  else if (m === 'frown') s += `<path d="M ${cx - 10} ${my + 3} Q ${cx} ${my - 6} ${cx + 10} ${my + 3}" fill="none" stroke="${L}" stroke-width="3" stroke-linecap="round"/>`;
  else if (m === 'smirk') s += `<path d="M ${cx - 10} ${my} Q ${cx} ${my + 6} ${cx + 12} ${my - 4}" fill="none" stroke="${L}" stroke-width="3" stroke-linecap="round"/>`;
  else s += `<path d="M ${cx - 10} ${my} L ${cx + 10} ${my}" stroke="${L}" stroke-width="3" stroke-linecap="round"/>`;
  if (blush) s += `<circle cx="${cx - r * .62}" cy="${cy + r * .3}" r="${r * .18}" fill="#F29C9C" opacity="${blush}"/><circle cx="${cx + r * .62}" cy="${cy + r * .3}" r="${r * .18}" fill="#F29C9C" opacity="${blush}"/>`;
  return s;
}

const limb = (x1, y1, x2, y2, w, fill) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${L}" stroke-width="${w + 5}" stroke-linecap="round"/><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${fill}" stroke-width="${w}" stroke-linecap="round"/>`;
const hand = (x, y, skin, r = 10) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${skin}" stroke="${L}" stroke-width="3"/>`;
const beard = (cx, cy, w, h, color, wild = false) =>
  `<path d="M ${cx - w / 2} ${cy} C ${cx - w / 2 - (wild ? 14 : 4)} ${cy + h * .5} ${cx - w * .3} ${cy + h} ${cx} ${cy + h} C ${cx + w * .3} ${cy + h} ${cx + w / 2 + (wild ? 14 : 4)} ${cy + h * .5} ${cx + w / 2} ${cy} Z" fill="${color}" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>` +
  (wild ? `<path d="M ${cx - w * .3} ${cy + h * .35} q 6 10 0 20 M ${cx} ${cy + h * .4} q 5 12 0 24 M ${cx + w * .3} ${cy + h * .35} q -6 10 0 20" fill="none" stroke="${L}" stroke-width="1.5" opacity=".5"/>` : '');
const hat = (cx, cy, brimW, crownW, crownH, color = '#17181C') =>
  `<rect x="${cx - crownW / 2}" y="${cy - crownH}" width="${crownW}" height="${crownH}" rx="7" fill="${color}" stroke="${L}" stroke-width="3"/>` +
  `<rect x="${cx - crownW / 2}" y="${cy - 9}" width="${crownW}" height="6" fill="#2E3038"/>` +
  `<ellipse cx="${cx}" cy="${cy}" rx="${brimW / 2}" ry="7" fill="${color}" stroke="${L}" stroke-width="3"/>`;
const kippah = (cx, cy, r, color, pattern) =>
  `<path d="M ${cx - r} ${cy} A ${r} ${r * .55} 0 0 1 ${cx + r} ${cy} Z" fill="${color}" stroke="${L}" stroke-width="2.5"/>` +
  (pattern ? `<path d="M ${cx - r * .8} ${cy - 3} q ${r * .4} -6 ${r * .8} 0 t ${r * .8} 0" fill="none" stroke="${pattern}" stroke-width="2.5"/>` : '');
const peyot = (x, y, len, color, side) =>
  `<path d="M ${x} ${y} q ${side * 8} ${len * .3} 0 ${len * .55} q ${side * -8} ${len * .25} ${side * 4} ${len}" fill="none" stroke="${L}" stroke-width="8" stroke-linecap="round"/><path d="M ${x} ${y} q ${side * 8} ${len * .3} 0 ${len * .55} q ${side * -8} ${len * .25} ${side * 4} ${len}" fill="none" stroke="${color}" stroke-width="4.5" stroke-linecap="round"/>`;
const body = (cx, top, w, h, color, extra = '') =>
  `<path d="M ${cx - w * .42} ${top} Q ${cx} ${top - 14} ${cx + w * .42} ${top} C ${cx + w * .55} ${top + h * .4} ${cx + w * .52} ${top + h * .8} ${cx + w * .45} ${top + h} L ${cx - w * .45} ${top + h} C ${cx - w * .52} ${top + h * .8} ${cx - w * .55} ${top + h * .4} ${cx - w * .42} ${top} Z" fill="${color}" stroke="${L}" stroke-width="3.5"/>${extra}`;
const legs = (cx, top, color, gap = 16, w = 24) =>
  `<rect x="${cx - gap - w}" y="${top}" width="${w}" height="${320 - top - 8}" rx="6" fill="${color}" stroke="${L}" stroke-width="3"/><rect x="${cx + gap}" y="${top}" width="${w}" height="${320 - top - 8}" rx="6" fill="${color}" stroke="${L}" stroke-width="3"/>`;
const shoes = (cx, color = L, gap = 16) =>
  `<ellipse cx="${cx - gap - 12}" cy="312" rx="20" ry="7" fill="${color}" stroke="${L}" stroke-width="2.5"/><ellipse cx="${cx + gap + 12}" cy="312" rx="20" ry="7" fill="${color}" stroke="${L}" stroke-width="2.5"/>`;
const sandals = (cx, skin, gap = 16) =>
  `<ellipse cx="${cx - gap - 12}" cy="312" rx="20" ry="7" fill="${skin}" stroke="${L}" stroke-width="2.5"/><ellipse cx="${cx + gap + 12}" cy="312" rx="20" ry="7" fill="${skin}" stroke="${L}" stroke-width="2.5"/><path d="M ${cx - gap - 24} 308 l 24 0 M ${cx + gap} 308 l 24 0" stroke="#6E4A2A" stroke-width="4"/>`;

const CHARS = {
  // שירה: ponytail, big sunglasses, navy uniform, lanyard + badge. Deadpan.
  shira(m) {
    const skin = SKIN.a, hair = '#3B2314', navy = '#2B3A67';
    let s = '';
    s += legs(120, 232, '#1F2C52'); s += shoes(120);
    s += body(120, 170, 120, 70, navy,
      `<path d="M 72 172 l 22 -6 l 6 10 l -24 4 Z M 168 172 l -22 -6 l -6 10 l 24 4 Z" fill="#8FA3D9" stroke="${L}" stroke-width="2"/>` +   // epaulettes
      `<path d="M 104 168 L 120 200 L 136 168" fill="none" stroke="#1F2C52" stroke-width="5"/>` +
      `<path d="M 106 172 C 100 200 110 210 112 222" fill="none" stroke="#E5B632" stroke-width="3"/><rect x="104" y="218" width="22" height="16" rx="2" fill="#fff" stroke="${L}" stroke-width="2"/><rect x="108" y="222" width="8" height="8" fill="#8FA3D9"/>`);
    s += limb(74, 182, 48, 240, 24, navy); s += hand(46, 246, skin); s += limb(166, 182, 192, 240, 24, navy); s += hand(194, 246, skin);
    // ponytail behind
    s += `<path d="M 160 70 C 200 60 204 110 182 140 C 190 110 176 92 150 90 Z" fill="${hair}" stroke="${L}" stroke-width="3"/>`;
    s += `<rect x="100" y="140" width="40" height="30" fill="${skin}" stroke="${L}" stroke-width="3"/>`;
    s += face(120, 96, 52, skin, { mouth: 'flat', mood: m === 'happy' ? 'neutral' : m, blush: .15 });
    s += `<path d="M 68 92 C 72 44 110 34 128 40 C 160 42 174 70 172 92 C 160 70 150 62 120 60 C 96 62 82 72 68 92 Z" fill="${hair}" stroke="${L}" stroke-width="3"/>`;
    s += `<circle cx="158" cy="52" r="9" fill="#E5B632" stroke="${L}" stroke-width="2"/>`; // hair tie
    // big sunglasses (square-ish, black, NOT round red)
    s += `<g><rect x="80" y="80" width="34" height="24" rx="8" fill="#111" stroke="${L}" stroke-width="3"/><rect x="126" y="80" width="34" height="24" rx="8" fill="#111" stroke="${L}" stroke-width="3"/><path d="M 114 90 h 12" stroke="${L}" stroke-width="4"/><path d="M 86 86 q 8 -4 16 -2 M 132 86 q 8 -4 16 -2" stroke="#fff" stroke-width="2" opacity=".6"/></g>`;
    s += `<text x="120" y="252" font-size="9" font-family="Rubik,Arial" font-weight="700" fill="#fff" text-anchor="middle">ביטחון</text>`;
    return s;
  },

  // משה: head and arm out of a yellow cab window, flat cap, grey mustache, toothpick.
  moshe(m) {
    const skin = SKIN.b, yellow = '#F2C230';
    let s = '';
    s += `<rect x="20" y="120" width="200" height="190" rx="18" fill="${yellow}" stroke="${L}" stroke-width="4"/>`;
    s += `<rect x="36" y="134" width="168" height="96" rx="10" fill="#BFE3F2" stroke="${L}" stroke-width="3"/>`;
    s += `<rect x="20" y="236" width="200" height="8" fill="#17181C"/><rect x="150" y="254" width="40" height="10" rx="4" fill="#17181C"/>`;
    s += `<circle cx="60" cy="300" r="22" fill="#17181C" stroke="${L}" stroke-width="3"/><circle cx="60" cy="300" r="9" fill="#9AA0AA"/><circle cx="180" cy="300" r="22" fill="#17181C" stroke="${L}" stroke-width="3"/><circle cx="180" cy="300" r="9" fill="#9AA0AA"/>`;
    s += `<rect x="86" y="100" width="68" height="22" rx="4" fill="#fff" stroke="${L}" stroke-width="2.5"/><text x="120" y="116" font-size="13" font-family="Rubik,Arial" font-weight="700" fill="${L}" text-anchor="middle">TAXI</text>`;
    // arm out of the window
    s += limb(60, 190, 20, 250, 26, '#fff'); s += hand(18, 258, skin, 12);
    s += `<rect x="100" y="156" width="40" height="40" fill="${skin}" stroke="${L}" stroke-width="3"/>`;
    s += `<path d="M 70 180 Q 120 160 170 180 L 170 232 L 70 232 Z" fill="#fff" stroke="${L}" stroke-width="3"/>`;
    s += `<path d="M 104 180 L 120 206 L 136 180" fill="none" stroke="#9AA0AA" stroke-width="4"/>`;
    s += `<path d="M 60 120 L 60 236" stroke="${L}" stroke-width="3" opacity=".3"/>`;
    s += face(120, 110, 48, skin, { mood: m, eyes: 'tired', blush: .4 });
    // mustache
    s += `<path d="M 98 130 q 10 -8 22 0 q 12 -8 22 0 q -10 8 -22 2 q -12 6 -22 -2 Z" fill="#9AA0AA" stroke="${L}" stroke-width="2"/>`;
    // flat cap
    s += `<path d="M 70 86 C 76 50 164 50 170 86 L 180 90 L 60 90 Z" fill="#5B4636" stroke="${L}" stroke-width="3" stroke-linejoin="round"/><path d="M 62 90 L 178 90" stroke="#3B2A21" stroke-width="4"/>`;
    // sunglasses on the cap
    s += `<path d="M 82 72 h 24 M 134 72 h 24" stroke="#17181C" stroke-width="10" stroke-linecap="round"/>`;
    // toothpick
    s += `<path d="M 142 134 l 22 6" stroke="#E5B632" stroke-width="3" stroke-linecap="round"/>`;
    return s;
  },

  // אלישיב: huge beard, knit kippah, white shirt untucked, tzitzit, sandals, arms open for a hug.
  elyashiv(m) {
    const skin = SKIN.b, hair = '#6B4A2B';
    let s = '';
    s += legs(120, 236, '#9C8C6E'); s += sandals(120, skin);
    s += body(120, 168, 128, 72, '#FAF7EE', `<path d="M 70 230 l -6 34 M 80 234 l -4 34 M 160 234 l 4 34 M 170 230 l 6 34" stroke="#fff" stroke-width="3"/><path d="M 70 230 l -6 34 M 80 234 l -4 34 M 160 234 l 4 34 M 170 230 l 6 34" stroke="${L}" stroke-width="1" opacity=".5"/>`);
    s += `<path d="M 70 170 L 70 240 L 98 240 L 98 176 Z M 170 170 L 170 240 L 142 240 L 142 176 Z" fill="#6B7A2E" stroke="${L}" stroke-width="3"/>`; // olive vest
    s += limb(74, 184, 24, 150, 26, '#FAF7EE'); s += hand(20, 142, skin, 12);
    s += limb(166, 184, 216, 150, 26, '#FAF7EE'); s += hand(220, 142, skin, 12);
    s += `<rect x="102" y="134" width="36" height="36" fill="${skin}" stroke="${L}" stroke-width="3"/>`;
    s += face(120, 90, 50, skin, { mood: m, eyes: m === 'happy' ? 'closedHappy' : 'big', blush: .5, browDy: -3 });
    s += beard(120, 108, 92, 110, hair, true);
    if (m === 'talk') s += `<ellipse cx="120" cy="122" rx="9" ry="6" fill="#7A2730" stroke="${L}" stroke-width="2"/>`;
    s += `<path d="M 104 124 q 16 10 32 0" fill="none" stroke="${L}" stroke-width="2.5" stroke-linecap="round"/>`; // the smile inside the beard
    s += `<path d="M 72 86 C 76 56 100 44 120 44 C 140 44 164 56 168 86" fill="${hair}" stroke="${L}" stroke-width="3"/>`;
    s += kippah(120, 48, 34, '#E07B22', '#2B3A67');
    s += `<path d="M 60 86 q -14 20 -6 44 M 180 86 q 14 20 6 44" fill="none" stroke="${L}" stroke-width="7" stroke-linecap="round"/><path d="M 60 86 q -14 20 -6 44 M 180 86 q 14 20 6 44" fill="none" stroke="${hair}" stroke-width="4" stroke-linecap="round"/>`; // peyot curls
    return s;
  },

  // צופיה: mustard head scarf, long dress, apron, baby carrier, ladle.
  tzofia(m) {
    const skin = SKIN.a, scarf = '#C99A12', dress = '#6B7A2E';
    let s = '';
    s += `<path d="M 62 190 L 48 312 L 192 312 L 178 190 Z" fill="${dress}" stroke="${L}" stroke-width="3.5"/>`; // long dress
    s += `<path d="M 82 200 L 76 300 L 164 300 L 158 200 Z" fill="#F3E6B8" stroke="${L}" stroke-width="2.5"/>`; // apron
    s += `<path d="M 86 212 q 34 10 68 0" fill="none" stroke="${L}" stroke-width="1.5" opacity=".4"/>`;
    s += body(120, 166, 118, 50, dress);
    // baby in a carrier on the chest
    s += `<path d="M 92 180 Q 120 176 148 180 L 150 230 Q 120 246 90 230 Z" fill="#B8860B" stroke="${L}" stroke-width="3"/>`;
    s += `<circle cx="120" cy="196" r="17" fill="${SKIN.d}" stroke="${L}" stroke-width="3"/><path d="M 108 190 q 12 -12 24 0" fill="#D9C48A" stroke="${L}" stroke-width="2"/><circle cx="114" cy="196" r="2" fill="${L}"/><circle cx="126" cy="196" r="2" fill="${L}"/><path d="M 115 204 q 5 4 10 0" fill="none" stroke="${L}" stroke-width="2"/>`;
    s += limb(74, 180, 44, 236, 22, dress); s += hand(42, 244, skin);
    s += limb(166, 180, 198, 234, 22, dress); s += hand(200, 242, skin);
    // ladle
    s += `<path d="M 206 236 L 232 170" stroke="${L}" stroke-width="7" stroke-linecap="round"/><path d="M 206 236 L 232 170" stroke="#9AA0AA" stroke-width="4" stroke-linecap="round"/><ellipse cx="232" cy="162" rx="12" ry="9" fill="#9AA0AA" stroke="${L}" stroke-width="3"/>`;
    s += `<rect x="104" y="136" width="32" height="36" fill="${skin}" stroke="${L}" stroke-width="3"/>`;
    s += face(120, 92, 48, skin, { mood: m === 'neutral' ? 'happy' : m, blush: .5, mouth: 'smile' });
    // scarf
    s += `<path d="M 66 96 C 66 40 174 40 174 96 C 160 78 140 68 120 68 C 100 68 80 78 66 96 Z" fill="${scarf}" stroke="${L}" stroke-width="3"/>`;
    s += `<path d="M 72 64 q 48 -16 96 0" fill="none" stroke="#fff" stroke-width="2" opacity=".5"/>`;
    s += `<path d="M 170 96 C 190 100 192 130 180 150 C 186 128 178 112 166 110 Z" fill="${scarf}" stroke="${L}" stroke-width="3"/>`; // scarf tail
    return s;
  },

  // נריה: peyot to the shoulders, big knit kippah, orange shirt, guitar across the body.
  neria(m) {
    const skin = SKIN.d, hair = '#3B2314';
    let s = '';
    s += legs(120, 238, '#D9C48A'); s += sandals(120, skin);
    s += body(120, 172, 104, 68, '#E07B22');
    s += `<rect x="106" y="140" width="28" height="36" fill="${skin}" stroke="${L}" stroke-width="3"/>`;
    // guitar
    s += `<g transform="rotate(-25 120 230)"><path d="M 60 238 h 120" stroke="${L}" stroke-width="10" stroke-linecap="round"/><path d="M 60 238 h 120" stroke="#A9744B" stroke-width="6" stroke-linecap="round"/>` +
      `<path d="M 150 212 C 190 196 206 226 192 244 C 208 262 190 290 160 276 C 140 290 126 262 136 246 C 122 232 128 212 150 212 Z" fill="#C58F5F" stroke="${L}" stroke-width="3.5"/><circle cx="164" cy="246" r="13" fill="#3B2A21"/><path d="M 100 230 h 60 M 100 234 h 60 M 100 238 h 60 M 100 242 h 60" stroke="#fff" stroke-width="1" opacity=".7"/><rect x="40" y="226" width="26" height="22" rx="4" fill="#3B2A21" stroke="${L}" stroke-width="2"/></g>`;
    s += limb(78, 186, 60, 240, 20, '#E07B22'); s += hand(62, 248, skin, 9);
    s += limb(162, 186, 186, 228, 20, '#E07B22'); s += hand(190, 236, skin, 9);
    s += face(120, 96, 46, skin, { mood: m, eyes: 'big', blush: .4, mouth: 'smirk' });
    s += `<path d="M 76 92 C 78 56 100 46 120 46 C 140 46 162 56 164 92 C 150 76 134 70 120 70 C 106 70 90 76 76 92 Z" fill="${hair}" stroke="${L}" stroke-width="3"/>`;
    s += kippah(120, 52, 40, '#FAF7EE', '#E07B22');
    s += peyot(78, 92, 70, hair, -1) + peyot(162, 92, 70, hair, 1);
    return s;
  },

  // הרבנית גיטל: tiny (drawn lower), brown wig bob, burgundy dress with a white collar, small rectangular
  // glasses, narrowed eyes, holding a giant pot in front.
  gittel(m) {
    const skin = SKIN.d, wig = '#5B3A24', dress = '#7A1F3D';
    let s = '';
    s += `<path d="M 76 236 L 68 312 L 172 312 L 164 236 Z" fill="${dress}" stroke="${L}" stroke-width="3.5"/>`;
    s += body(120, 214, 96, 40, dress);
    s += `<path d="M 102 212 L 120 232 L 138 212 Z" fill="#fff" stroke="${L}" stroke-width="2.5"/>`;
    s += `<rect x="108" y="190" width="24" height="28" fill="${skin}" stroke="${L}" stroke-width="3"/>`;
    // giant pot
    s += `<rect x="54" y="250" width="132" height="58" rx="8" fill="#9AA0AA" stroke="${L}" stroke-width="3.5"/><rect x="48" y="244" width="144" height="12" rx="5" fill="#DDE2E9" stroke="${L}" stroke-width="3"/><rect x="100" y="232" width="40" height="12" rx="5" fill="#DDE2E9" stroke="${L}" stroke-width="3"/>` +
      `<path d="M 44 272 q -16 0 -16 12 q 0 12 16 12 M 196 272 q 16 0 16 12 q 0 12 -16 12" fill="none" stroke="${L}" stroke-width="7"/><path d="M 44 272 q -16 0 -16 12 q 0 12 16 12 M 196 272 q 16 0 16 12 q 0 12 -16 12" fill="none" stroke="#DDE2E9" stroke-width="4"/>` +
      `<text x="120" y="288" font-size="16" font-family="Rubik,Arial" font-weight="700" fill="#2B2B2B" text-anchor="middle" opacity=".55">צ׳ולנט</text>` +
      `<g fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"><path d="M 84 236 c -6 -8 6 -12 0 -20"/><path d="M 160 234 c -6 -8 6 -12 0 -20"/></g>`;
    s += limb(84, 226, 50, 276, 20, dress); s += hand(44, 282, skin, 9);
    s += limb(156, 226, 190, 276, 20, dress); s += hand(196, 282, skin, 9);
    s += face(120, 160, 40, skin, { mood: m === 'talk' ? 'talk' : 'narrow', eyes: 'narrow', browDy: 4, browTilt: 4, blush: .35 });
    // small rectangular glasses (not round, not red)
    s += `<rect x="92" y="148" width="22" height="14" rx="3" fill="none" stroke="#5B4636" stroke-width="2.5"/><rect x="126" y="148" width="22" height="14" rx="3" fill="none" stroke="#5B4636" stroke-width="2.5"/><path d="M 114 154 h 12" stroke="#5B4636" stroke-width="2.5"/>`;
    // wig bob
    s += `<path d="M 78 166 C 72 118 100 108 120 108 C 140 108 168 118 162 166 C 160 140 146 132 120 132 C 94 132 80 140 78 166 Z" fill="${wig}" stroke="${L}" stroke-width="3"/>`;
    s += `<path d="M 86 120 q 34 -14 68 0" fill="none" stroke="#8E6540" stroke-width="3" opacity=".7"/>`;
    s += `<circle cx="84" cy="182" r="4" fill="#E5B632"/><circle cx="156" cy="182" r="4" fill="#E5B632"/>`; // earrings
    return s;
  },

  // ר' שמערל: big belly, black suit, gold watch chain, grey beard, wide black hat, vodka bottle, two phones.
  shmerel(m) {
    const skin = SKIN.b, hair = '#9AA0AA';
    let s = '';
    s += legs(120, 262, '#17181C', 18, 26); s += shoes(120, L, 18);
    s += `<path d="M 50 176 Q 120 150 190 176 C 220 220 222 258 198 284 L 42 284 C 18 258 20 220 50 176 Z" fill="#fff" stroke="${L}" stroke-width="3.5"/>`;
    s += `<path d="M 50 176 L 96 176 L 96 284 L 42 284 C 18 258 20 220 50 176 Z M 190 176 L 144 176 L 144 284 L 198 284 C 222 258 220 220 190 176 Z" fill="#17181C" stroke="${L}" stroke-width="3"/>`;
    s += `<path d="M 96 180 L 76 212 L 96 206 Z M 144 180 L 164 212 L 144 206 Z" fill="#2E3038" stroke="${L}" stroke-width="2.5"/>`;
    s += `<path d="M 100 236 C 110 252 130 252 140 236" fill="none" stroke="#E5B632" stroke-width="3" stroke-dasharray="3 2"/><circle cx="140" cy="236" r="5" fill="#E5B632" stroke="${L}" stroke-width="1.5"/>`; // watch chain
    s += `<rect x="150" y="196" width="14" height="22" rx="2" fill="#2B2B2B" stroke="${L}" stroke-width="2"/><rect x="166" y="200" width="12" height="20" rx="2" fill="#4B4B6B" stroke="${L}" stroke-width="2"/>`; // two phones peeking
    s += limb(56, 190, 28, 250, 26, '#17181C'); s += hand(24, 258, skin, 12);
    // vodka bottle
    s += `<rect x="10" y="212" width="26" height="54" rx="5" fill="#DDE2E9" stroke="${L}" stroke-width="2.5" opacity=".9"/><rect x="17" y="196" width="12" height="20" rx="3" fill="#DDE2E9" stroke="${L}" stroke-width="2.5"/><rect x="12" y="228" width="22" height="18" fill="#C0262D"/><text x="23" y="241" font-size="7" font-family="Arial" font-weight="700" fill="#fff" text-anchor="middle">VODKA</text>`;
    s += limb(184, 190, 214, 250, 26, '#17181C'); s += hand(218, 258, skin, 12);
    s += `<path d="M 206 238 l 18 -30" stroke="${L}" stroke-width="2"/><path d="M 212 212 l 16 -4 l 2 10 l -14 6 Z" fill="#DDE2E9" stroke="${L}" stroke-width="2"/>`; // shot glass
    s += `<rect x="104" y="140" width="32" height="40" fill="${skin}" stroke="${L}" stroke-width="3"/>`;
    s += face(120, 100, 50, skin, { mood: m === 'neutral' ? 'happy' : m, blush: .8, mouth: 'smile' });
    s += beard(120, 120, 80, 70, hair);
    if (m === 'talk') s += `<ellipse cx="120" cy="130" rx="9" ry="6" fill="#7A2730" stroke="${L}" stroke-width="2"/>`;
    s += hat(120, 60, 150, 84, 40);
    s += `<path d="M 72 70 q -10 26 0 44 M 168 70 q 10 26 0 44" fill="none" stroke="${L}" stroke-width="7" stroke-linecap="round"/><path d="M 72 70 q -10 26 0 44 M 168 70 q 10 26 0 44" fill="none" stroke="${hair}" stroke-width="4" stroke-linecap="round"/>`;
    return s;
  },

  // יענקי: thin, oversized grey suit (sleeves past the hands), hat too big, thin peyot, big shy eyes, a sefer.
  yanky(m) {
    const skin = SKIN.d, suit = '#6E7480';
    let s = '';
    s += legs(120, 250, '#4B4F5A', 8, 18); s += shoes(120, L, 8);
    s += `<path d="M 80 170 Q 120 158 160 170 L 168 262 L 72 262 Z" fill="#fff" stroke="${L}" stroke-width="3"/>`;
    s += `<path d="M 80 170 L 108 170 L 112 262 L 72 262 Z M 160 170 L 132 170 L 128 262 L 168 262 Z" fill="${suit}" stroke="${L}" stroke-width="3"/>`;
    s += `<path d="M 108 172 L 96 198 L 110 194 Z M 132 172 L 144 198 L 130 194 Z" fill="#8A8F9C" stroke="${L}" stroke-width="2"/>`;
    s += limb(84, 184, 60, 256, 24, suit); s += `<circle cx="58" cy="262" r="12" fill="${suit}" stroke="${L}" stroke-width="3"/>`; // sleeve over the hand
    s += limb(156, 184, 180, 256, 24, suit); s += `<circle cx="182" cy="262" r="12" fill="${suit}" stroke="${L}" stroke-width="3"/>`;
    s += `<rect x="150" y="236" width="44" height="34" rx="3" fill="#6B4A2B" stroke="${L}" stroke-width="2.5"/><rect x="154" y="240" width="36" height="26" fill="#F8F2E2"/><text x="172" y="258" font-size="9" font-family="Rubik,Arial" fill="${L}" text-anchor="middle">גמרא</text>`;
    s += `<rect x="110" y="140" width="20" height="36" fill="${skin}" stroke="${L}" stroke-width="3"/>`;
    s += face(120, 104, 40, skin, { mood: m, eyes: 'big', blush: .5, mouth: m === 'happy' ? 'smile' : 'smirk' });
    s += hat(120, 72, 120, 72, 36);
    s += `<path d="M 86 92 q -6 18 2 30 M 154 92 q 6 18 -2 30" fill="none" stroke="${L}" stroke-width="5" stroke-linecap="round"/><path d="M 86 92 q -6 18 2 30 M 154 92 q 6 18 -2 30" fill="none" stroke="#3B2314" stroke-width="2.5" stroke-linecap="round"/>`;
    return s;
  },

  // הגבאי: old, white beard, tallit over the head and shoulders, counting on his fingers, round-rim-less glasses.
  gabbai(m) {
    const skin = SKIN.c, hair = '#EFEEE9';
    let s = '';
    s += legs(120, 250, '#17181C', 12, 22); s += shoes(120, L, 12);
    s += body(120, 170, 110, 80, '#17181C');
    s += `<path d="M 70 166 L 58 262 L 90 262 L 96 170 Z M 170 166 L 182 262 L 150 262 L 144 170 Z" fill="#FAF7EE" stroke="${L}" stroke-width="3"/><path d="M 62 240 h 26 M 64 250 h 24 M 152 240 h 26 M 154 250 h 24" stroke="#2B3A67" stroke-width="3"/>`; // tallit stripes
    s += limb(78, 186, 44, 236, 22, '#17181C'); s += hand(42, 244, skin);
    s += limb(162, 186, 196, 150, 22, '#17181C');
    // the counting hand: fingers up
    s += `<circle cx="200" cy="140" r="13" fill="${skin}" stroke="${L}" stroke-width="3"/><path d="M 190 130 l -2 -18 M 198 128 l 0 -20 M 206 129 l 3 -18 M 213 134 l 6 -12" stroke="${L}" stroke-width="7" stroke-linecap="round"/><path d="M 190 130 l -2 -18 M 198 128 l 0 -20 M 206 129 l 3 -18 M 213 134 l 6 -12" stroke="${skin}" stroke-width="4" stroke-linecap="round"/>`;
    s += `<text x="226" y="110" font-size="22" font-family="'Secular One',Rubik,Arial" fill="#C0262D">9</text>`;
    s += `<rect x="106" y="140" width="28" height="36" fill="${skin}" stroke="${L}" stroke-width="3"/>`;
    s += face(120, 100, 46, skin, { mood: m, eyes: 'tired', browDy: 2, blush: .2 });
    s += beard(120, 118, 70, 72, hair);
    if (m === 'talk') s += `<ellipse cx="120" cy="128" rx="8" ry="5" fill="#7A2730" stroke="${L}" stroke-width="2"/>`;
    // tallit over the head
    s += `<path d="M 60 110 C 60 30 180 30 180 110 L 168 100 C 160 60 80 60 72 100 Z" fill="#FAF7EE" stroke="${L}" stroke-width="3"/><path d="M 80 60 q 40 -12 80 0" fill="none" stroke="#2B3A67" stroke-width="3"/>`;
    s += `<circle cx="102" cy="92" r="10" fill="none" stroke="#5B4636" stroke-width="2"/><circle cx="138" cy="92" r="10" fill="none" stroke="#5B4636" stroke-width="2"/><path d="M 112 92 h 16" stroke="#5B4636" stroke-width="2"/>`;
    return s;
  },

  // איזי: a portrait for the phone. Dark bob, earrings, one raised eyebrow. Unimpressed. Loves him.
  isi(m) {
    const skin = SKIN.a, hair = '#2A1A12';
    let s = '';
    s += body(120, 176, 120, 70, '#7A3B8F');
    s += `<rect x="104" y="140" width="32" height="40" fill="${skin}" stroke="${L}" stroke-width="3"/>`;
    s += `<path d="M 60 110 C 56 40 184 40 180 110 L 184 150 L 56 150 Z" fill="${hair}" stroke="${L}" stroke-width="3"/>`;
    s += face(120, 100, 50, skin, { mood: m, mouth: 'smirk', browDy: 0, browTilt: -6, blush: .3 });
    s += `<path d="M 72 90 C 76 54 110 44 136 50 C 160 56 170 74 168 90 C 150 70 120 62 100 72 C 86 78 78 84 72 90 Z" fill="${hair}" stroke="${L}" stroke-width="3"/>`;
    s += `<circle cx="72" cy="124" r="5" fill="#E5B632" stroke="${L}" stroke-width="1.5"/><circle cx="168" cy="124" r="5" fill="#E5B632" stroke="${L}" stroke-width="1.5"/>`;
    s += `<path d="M 150 80 q 10 -8 20 -2" fill="none" stroke="${L}" stroke-width="4" stroke-linecap="round"/>`; // the raised brow
    return s;
  },

  // המו"ל: a voice on the phone, drawn as a phone with a nervous face.
  publisher(m) {
    let s = '';
    s += `<rect x="70" y="60" width="100" height="200" rx="16" fill="#2B2B2B" stroke="${L}" stroke-width="4"/><rect x="80" y="76" width="80" height="150" rx="6" fill="#DDE2E9"/>`;
    s += face(120, 150, 32, SKIN.a, { mood: m === 'neutral' ? 'sad' : m, eyes: 'tired', browDy: 2, browTilt: 6, blush: 0 });
    s += `<path d="M 92 128 C 96 104 144 104 148 128" fill="#9AA0AA" stroke="${L}" stroke-width="2.5"/>`;
    s += `<text x="120" y="216" font-size="12" font-family="Rubik,Arial" font-weight="700" fill="${L}" text-anchor="middle">המו"ל</text>`;
    s += `<circle cx="120" cy="244" r="7" fill="#9AA0AA"/>`;
    return s;
  },
};

const CROPS = { full: '0 0 240 320', bust: '0 0 240 250', head: '50 20 140 150' };
const HEAD_CROPS = { gittel: '60 100 120 120', moshe: '50 50 140 130', publisher: '60 100 120 110', shmerel: '40 20 160 160', yanky: '50 40 140 130' };

export function npcSVG(id, opts = {}) {
  const { size = 240, crop = 'full', mood = 'neutral', className = '' } = opts;
  const fn = CHARS[id];
  if (!fn) return '';
  const vb = crop === 'head' ? (HEAD_CROPS[id] || CROPS.head) : (CROPS[crop] || CROPS.full);
  const [, , vw, vh] = vb.split(' ').map(Number);
  const h = Math.round(size * vh / vw);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${size}" height="${h}" class="npc npc-${id} npc-${mood} ${className}" role="img" aria-label="${id}">${fn(mood)}</svg>`;
}

export const NPC_IDS = Object.keys(CHARS);
