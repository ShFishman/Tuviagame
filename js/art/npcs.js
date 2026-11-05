/* js/art/npcs.js — NPC caricatures as SVG strings (SPEC §6.3 silhouette hooks). Zero dependencies.
 *   npcSVG(id, { size, mouth: flat|smile|open|frown, flip })
 * viewBox 0 0 200 200: a bust, shoulders at the bottom. None of them wear Tuvia's red round glasses,
 * mint suspenders or pinstripes (the combination is reserved for him). */

const L = '#3B2A21';
const SK = { pale: '#F7D9BE', warm: '#F2C7A0', olive: '#E8B98C', deep: '#C98B62' };

function eyes(cx, cy, kind = 'open', gap = 20) {
  const one = (x) => {
    if (kind === 'closed') return `<path d="M ${x - 7} ${cy} q 7 6 14 0" fill="none" stroke="${L}" stroke-width="2.5" stroke-linecap="round"/>`;
    if (kind === 'narrow') return `<ellipse cx="${x}" cy="${cy}" rx="7" ry="3" fill="#fff" stroke="${L}" stroke-width="2"/><circle cx="${x}" cy="${cy}" r="2.3" fill="#2A1A12"/>`;
    if (kind === 'big') return `<circle cx="${x}" cy="${cy}" r="9" fill="#fff" stroke="${L}" stroke-width="2"/><circle cx="${x}" cy="${cy + 1}" r="4.5" fill="#2A1A12"/><circle cx="${x - 2}" cy="${cy - 1}" r="1.5" fill="#fff"/>`;
    return `<ellipse cx="${x}" cy="${cy}" rx="7" ry="6" fill="#fff" stroke="${L}" stroke-width="2"/><circle cx="${x}" cy="${cy + 1}" r="3" fill="#2A1A12"/><circle cx="${x - 1.3}" cy="${cy - .5}" r="1" fill="#fff"/>`;
  };
  return one(cx - gap) + one(cx + gap);
}
function brows(cx, cy, tilt = 0, dy = 0, gap = 20) {
  return `<path d="M ${cx - gap - 9} ${cy + dy + tilt} Q ${cx - gap} ${cy + dy - 4} ${cx - gap + 9} ${cy + dy - tilt}" fill="none" stroke="${L}" stroke-width="3.5" stroke-linecap="round"/>` +
    `<path d="M ${cx + gap - 9} ${cy + dy - tilt} Q ${cx + gap} ${cy + dy - 4} ${cx + gap + 9} ${cy + dy + tilt}" fill="none" stroke="${L}" stroke-width="3.5" stroke-linecap="round"/>`;
}
function mouthOf(kind, cx, cy) {
  switch (kind) {
    case 'smile': return `<path d="M ${cx - 14} ${cy} Q ${cx} ${cy + 14} ${cx + 14} ${cy}" fill="none" stroke="${L}" stroke-width="3" stroke-linecap="round"/>`;
    case 'open': return `<ellipse cx="${cx}" cy="${cy + 4}" rx="9" ry="7" fill="#7A2730" stroke="${L}" stroke-width="2.5"/>`;
    case 'frown': return `<path d="M ${cx - 12} ${cy + 6} Q ${cx} ${cy - 6} ${cx + 12} ${cy + 6}" fill="none" stroke="${L}" stroke-width="3" stroke-linecap="round"/>`;
    case 'grin': return `<path d="M ${cx - 16} ${cy - 2} Q ${cx} ${cy + 20} ${cx + 16} ${cy - 2} Z" fill="#7A2730" stroke="${L}" stroke-width="2.5"/><path d="M ${cx - 11} ${cy} q 11 4 22 0 l 0 4 q -11 4 -22 0 Z" fill="#FFF8E6"/>`;
    default: return `<path d="M ${cx - 11} ${cy + 2} L ${cx + 11} ${cy + 1}" fill="none" stroke="${L}" stroke-width="3" stroke-linecap="round"/>`;
  }
}
const nose = (cx, cy) => `<path d="M ${cx - 3} ${cy - 6} q -4 10 4 8" fill="none" stroke="${L}" stroke-width="2.2" stroke-linecap="round"/>`;
const head = (cx, cy, r, skin, rx = r, ry = r) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${skin}" stroke="${L}" stroke-width="3"/>`;
const ears = (cx, cy, r, skin) => `<circle cx="${cx - r}" cy="${cy + 4}" r="8" fill="${skin}" stroke="${L}" stroke-width="2.5"/><circle cx="${cx + r}" cy="${cy + 4}" r="8" fill="${skin}" stroke="${L}" stroke-width="2.5"/>`;
const shoulders = (color, y = 150, w = 92) => `<path d="M ${100 - w} 200 C ${100 - w} ${y} ${100 - w / 2} ${y - 10} 100 ${y - 10} C ${100 + w / 2} ${y - 10} ${100 + w} ${y} ${100 + w} 200 Z" fill="${color}" stroke="${L}" stroke-width="3"/>`;
const neck = (cx, y, skin) => `<rect x="${cx - 13}" y="${y}" width="26" height="30" fill="${skin}" stroke="${L}" stroke-width="2.5"/>`;
const blackHat = (cx, top, w = 56, brim = 44) =>
  `<rect x="${cx - w / 2}" y="${top}" width="${w}" height="30" rx="7" fill="#17181C" stroke="${L}" stroke-width="3"/>` +
  `<rect x="${cx - w / 2}" y="${top + 20}" width="${w}" height="6" fill="#2E3038"/>` +
  `<ellipse cx="${cx}" cy="${top + 30}" rx="${brim}" ry="8" fill="#17181C" stroke="${L}" stroke-width="3"/>`;
const beard = (cx, y, w, h, color, extra = '') =>
  `<path d="M ${cx - w} ${y} Q ${cx - w - 6} ${y + h * .6} ${cx} ${y + h} Q ${cx + w + 6} ${y + h * .6} ${cx + w} ${y} Q ${cx} ${y + 14} ${cx - w} ${y} Z" fill="${color}" stroke="${L}" stroke-width="2.5" stroke-linejoin="round"/>${extra}`;

const CHARS = {
  shira(m) {
    const s = SK.warm;
    return shoulders('#2B3A67', 150) +
      `<rect x="36" y="150" width="30" height="10" rx="3" fill="#E5B632" stroke="${L}" stroke-width="2"/>` + // epaulette
      `<path d="M 86 142 L 100 168 L 114 142" fill="none" stroke="#1F2C52" stroke-width="6" stroke-linecap="round"/>` +
      neck(100, 120, s) +
      `<path d="M 140 70 C 170 60 176 110 150 150 C 162 112 150 86 140 92 Z" fill="#3B2A21" stroke="${L}" stroke-width="2.5"/>` + // ponytail
      head(100, 92, 46, s) + ears(100, 92, 46, s) +
      `<path d="M 54 92 C 50 40 150 40 146 92 C 136 66 110 56 100 70 C 90 56 64 66 54 92 Z" fill="#3B2A21" stroke="${L}" stroke-width="2.5"/>` +
      `<rect x="56" y="82" width="38" height="24" rx="8" fill="#17181C" stroke="${L}" stroke-width="2.5"/><rect x="106" y="82" width="38" height="24" rx="8" fill="#17181C" stroke="${L}" stroke-width="2.5"/>` +
      `<path d="M 94 90 L 106 90" stroke="${L}" stroke-width="3"/><path d="M 60 86 l 10 0 M 110 86 l 10 0" stroke="#fff" stroke-width="2.5" opacity=".5"/>` +
      nose(100, 110) + mouthOf(m === 'smile' ? 'smile' : m === 'open' ? 'open' : 'flat', 100, 124) +
      `<rect x="120" y="156" width="40" height="26" rx="3" fill="#fff" stroke="${L}" stroke-width="2"/><text x="140" y="173" font-size="11" font-family="Rubik,Arial" text-anchor="middle" fill="${L}">ביטחון</text>`;
  },
  moshe(m) {
    const s = SK.olive;
    return `<rect x="0" y="40" width="200" height="160" rx="18" fill="#F2C230" stroke="${L}" stroke-width="4"/>` +
      `<rect x="14" y="56" width="172" height="100" rx="8" fill="#BFE3F7" stroke="${L}" stroke-width="3"/>` +
      `<rect x="80" y="12" width="40" height="30" rx="4" fill="#17181C" stroke="${L}" stroke-width="2.5"/><text x="100" y="33" font-size="13" font-family="Rubik,Arial" font-weight="700" text-anchor="middle" fill="#F2C230">מונית</text>` +
      shoulders('#DDE2E9', 150, 70).replace('200 Z', '156 Z') +
      neck(100, 118, s) + head(100, 92, 44, s) + ears(100, 92, 44, s) +
      `<rect x="50" y="44" width="100" height="22" rx="10" fill="#2E3038" stroke="${L}" stroke-width="2.5"/><path d="M 48 62 L 152 62 L 160 70 L 40 70 Z" fill="#17181C" stroke="${L}" stroke-width="2"/>` + // cap
      `<rect x="60" y="80" width="34" height="18" rx="6" fill="#17181C" stroke="${L}" stroke-width="2"/><rect x="106" y="80" width="34" height="18" rx="6" fill="#17181C" stroke="${L}" stroke-width="2"/><path d="M 94 88 L 106 88" stroke="${L}" stroke-width="3"/>` +
      nose(100, 108) + `<path d="M 80 118 q 20 -10 40 0 q -20 2 -40 0 Z" fill="#3B2A21" stroke="${L}" stroke-width="1.5"/>` +
      mouthOf(m === 'open' ? 'open' : 'smile', 100, 128) +
      `<path d="M 14 150 L 60 150 L 60 170 Q 36 182 14 170 Z" fill="${s}" stroke="${L}" stroke-width="2.5"/>` + // arm out the window
      `<rect x="0" y="156" width="200" height="12" fill="#17181C"/><rect x="10" y="160" width="60" height="4" fill="#F2C230"/><rect x="130" y="160" width="60" height="4" fill="#F2C230"/>`;
  },
  elyashiv(m) {
    const s = SK.warm;
    return shoulders('#6B7A2B', 150) + neck(100, 120, s) + head(100, 92, 46, s) + ears(100, 92, 46, s) +
      `<path d="M 58 92 C 62 60 138 60 142 92 C 132 78 108 72 100 84 C 92 72 68 78 58 92 Z" fill="#6E4A2A" stroke="${L}" stroke-width="2.5"/>` +
      `<path d="M 70 58 C 80 36 120 36 130 58 Q 100 50 70 58 Z" fill="#fff" stroke="${L}" stroke-width="2.5"/><path d="M 76 52 l 10 -8 M 90 46 l 8 -8 M 104 44 l 8 6 M 118 50 l 6 6" stroke="#2B7BBF" stroke-width="2.5"/><path d="M 82 54 l 36 0" stroke="#C0262D" stroke-width="2.5"/>` + // knit kippah
      beard(100, 112, 42, 90, '#6E4A2A', `<path d="M 72 130 q 28 24 56 0 M 68 150 q 32 30 64 0" fill="none" stroke="#4A2C16" stroke-width="2" opacity=".6"/>`) +
      eyes(100, 92, 'big', 18) + brows(100, 78, -2, 0, 18) + nose(100, 106) +
      mouthOf(m === 'open' ? 'open' : 'grin', 100, 118) +
      `<circle cx="162" cy="172" r="12" fill="#A8D18C" stroke="${L}" stroke-width="2.5"/><path d="M 162 160 q 0 -12 8 -16" fill="none" stroke="#4A6B2A" stroke-width="3"/>`; // a sprout
  },
  tzofia(m) {
    const s = SK.pale;
    return shoulders('#D4A017', 150) + neck(100, 120, s) +
      `<path d="M 50 92 C 46 36 154 36 150 92 L 158 150 L 42 150 Z" fill="#B88A1E" stroke="${L}" stroke-width="3"/><path d="M 60 60 q 40 -20 80 0" fill="none" stroke="#E6C058" stroke-width="5"/>` + // head scarf
      head(100, 96, 42, s) + eyes(100, 94, 'open', 17) + brows(100, 80, 0, 0, 17) + nose(100, 108) +
      mouthOf(m === 'open' ? 'open' : 'smile', 100, 120) +
      `<g transform="translate(150 168)"><circle r="16" fill="${SK.pale}" stroke="${L}" stroke-width="2.5"/><path d="M -10 -8 q 10 -12 20 0" fill="none" stroke="#6E4A2A" stroke-width="3"/><circle cx="-5" cy="0" r="2" fill="${L}"/><circle cx="5" cy="0" r="2" fill="${L}"/><path d="M -4 7 q 4 3 8 0" fill="none" stroke="${L}" stroke-width="1.5"/></g>` + // the baby
      `<path d="M 36 196 L 50 150" stroke="#DDE2E9" stroke-width="7" stroke-linecap="round"/><path d="M 36 196 L 50 150" stroke="${L}" stroke-width="1.5"/><ellipse cx="52" cy="146" rx="14" ry="9" fill="#DDE2E9" stroke="${L}" stroke-width="2.5"/>`; // ladle
  },
  neria(m) {
    const s = SK.warm;
    return shoulders('#E07A2B', 150) +
      `<path d="M 60 196 L 150 120" stroke="#6E4A2A" stroke-width="12" stroke-linecap="round"/><path d="M 60 196 L 150 120" stroke="#F2C230" stroke-width="1.5" stroke-dasharray="3 5"/>` +
      `<ellipse cx="46" cy="190" rx="28" ry="22" fill="#A9744B" stroke="${L}" stroke-width="3"/><circle cx="50" cy="188" r="7" fill="#3B2A21"/>` + // guitar
      neck(100, 120, s) + head(100, 92, 44, s) + ears(100, 92, 44, s) +
      `<path d="M 58 90 C 62 50 138 50 142 90 Q 100 70 58 90 Z" fill="#3B2A21" stroke="${L}" stroke-width="2.5"/>` +
      `<path d="M 66 50 Q 100 30 134 50 Q 100 46 66 50 Z" fill="#fff" stroke="${L}" stroke-width="2.5"/>` + // big white kippah
      `<path d="M 56 96 C 46 120 50 150 44 164 M 144 96 C 154 120 150 150 156 164" fill="none" stroke="#3B2A21" stroke-width="7" stroke-linecap="round"/>` + // peyot to the shoulders
      eyes(100, 92, 'open', 17) + brows(100, 78, 2, 0, 17) + nose(100, 106) + mouthOf(m === 'open' ? 'open' : 'smile', 100, 118) +
      `<path d="M 86 128 q 14 10 28 0" fill="none" stroke="#6E4A2A" stroke-width="2" opacity=".5"/>`;
  },
  gittel(m) {
    const s = SK.pale;
    // tiny: drawn at 0.8 scale, with a giant pot in front
    return `<g transform="translate(20 36) scale(.8)">` + shoulders('#7A1F3D', 150) + neck(100, 120, s) +
      `<path d="M 50 100 C 44 30 156 30 150 100 L 150 120 L 50 120 Z" fill="#6E4A2A" stroke="${L}" stroke-width="3"/>` + // the wig
      head(100, 96, 42, s) + `<path d="M 56 92 C 60 56 140 56 144 92 Q 100 76 56 92 Z" fill="#6E4A2A"/>` +
      `<circle cx="82" cy="96" r="12" fill="none" stroke="#B6861A" stroke-width="3"/><circle cx="118" cy="96" r="12" fill="none" stroke="#B6861A" stroke-width="3"/><path d="M 94 96 l 12 0" stroke="#B6861A" stroke-width="3"/>` +
      eyes(100, 96, m === 'narrow' ? 'narrow' : 'narrow', 18) + brows(100, 84, 3, 0, 18) + nose(100, 108) +
      mouthOf(m === 'open' ? 'open' : m === 'smile' ? 'smile' : 'flat', 100, 122) +
      `<path d="M 72 118 q 28 20 56 0" fill="none" stroke="${L}" stroke-width="1.5" opacity=".4"/>` + `</g>` +
      `<g><path d="M 40 170 Q 40 150 60 150 L 140 150 Q 160 150 160 170 L 156 200 L 44 200 Z" fill="#8E8E96" stroke="${L}" stroke-width="3"/>` +
      `<rect x="34" y="146" width="132" height="10" rx="4" fill="#4A4A52" stroke="${L}" stroke-width="2.5"/><circle cx="100" cy="146" r="8" fill="#E5B632" stroke="${L}" stroke-width="2.5"/>` +
      `<path d="M 70 140 c -6 -8 6 -12 0 -20 M 100 138 c -6 -8 6 -12 0 -20 M 130 140 c -6 -8 6 -12 0 -20" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/></g>`;
  },
  shmerel(m) {
    const s = SK.warm;
    return `<ellipse cx="100" cy="200" rx="104" ry="70" fill="#17181C" stroke="${L}" stroke-width="3"/>` + // the belly
      `<path d="M 84 134 L 100 200 L 116 134" fill="#fff" stroke="${L}" stroke-width="2.5"/><rect x="92" y="140" width="16" height="50" fill="#17181C"/>` +
      neck(100, 112, s) + head(100, 86, 44, s) + ears(100, 86, 44, s) +
      beard(100, 104, 40, 70, '#9AA0AA', `<path d="M 74 120 q 26 18 52 0" fill="none" stroke="#DDE2E9" stroke-width="2" opacity=".7"/>`) +
      blackHat(100, 18, 70, 54) +
      eyes(100, 86, 'open', 18) + brows(100, 72, -3, 0, 18) + nose(100, 100) + mouthOf(m === 'open' ? 'open' : 'grin', 100, 112) +
      `<g transform="translate(156 150) rotate(12)"><rect x="-8" y="-28" width="16" height="48" rx="4" fill="#E8F4FF" stroke="${L}" stroke-width="2.5"/><rect x="-5" y="-38" width="10" height="12" fill="#2B3A67" stroke="${L}" stroke-width="2"/><rect x="-6" y="-8" width="12" height="14" fill="#2B3A67"/></g>` + // vodka
      `<rect x="30" y="150" width="20" height="34" rx="4" fill="#2E3038" stroke="${L}" stroke-width="2.5"/><rect x="44" y="156" width="18" height="30" rx="4" fill="#6EE7B7" stroke="${L}" stroke-width="2.5"/>`; // two phones
  },
  yanky(m) {
    const s = SK.pale;
    return `<path d="M 2 200 C 2 150 40 136 100 136 C 160 136 198 150 198 200 Z" fill="#6E7C87" stroke="${L}" stroke-width="3"/>` + // oversized suit
      `<path d="M 86 136 L 100 170 L 114 136" fill="#fff" stroke="${L}" stroke-width="2.5"/><path d="M 60 140 L 86 136 L 90 160 Z M 140 140 L 114 136 L 110 160 Z" fill="#4A5560" stroke="${L}" stroke-width="2"/>` +
      neck(100, 112, s) + head(100, 86, 36, s, 32, 40) + ears(100, 86, 32, s) +
      blackHat(100, 14, 56, 44) +
      `<path d="M 68 92 C 62 110 64 124 60 134 M 132 92 C 138 110 136 124 140 134" fill="none" stroke="#3B2A21" stroke-width="5" stroke-linecap="round"/>` +
      eyes(100, 86, 'big', 15) + brows(100, 72, 2, 2, 15) + nose(100, 100) + mouthOf(m === 'open' ? 'open' : m === 'smile' ? 'smile' : 'flat', 100, 114) +
      `<circle cx="80" cy="104" r="5" fill="#F29C9C" opacity=".6"/><circle cx="120" cy="104" r="5" fill="#F29C9C" opacity=".6"/>`;
  },
  gabbai(m) {
    const s = SK.warm;
    return shoulders('#17181C', 150) + neck(100, 118, s) + head(100, 90, 42, s) + ears(100, 90, 42, s) +
      beard(100, 108, 36, 56, '#DDE2E9') + blackHat(100, 24, 60, 48) +
      eyes(100, 90, 'narrow', 17) + brows(100, 76, 4, 0, 17) + nose(100, 104) + mouthOf(m === 'open' ? 'open' : 'flat', 100, 116) +
      `<rect x="134" y="140" width="46" height="34" rx="4" fill="#F8F2E2" stroke="${L}" stroke-width="2.5"/><text x="157" y="165" font-size="22" font-family="Rubik,Arial" font-weight="700" text-anchor="middle" fill="${L}">9</text>` +
      `<path d="M 30 196 L 40 150" stroke="${s}" stroke-width="12" stroke-linecap="round"/><path d="M 30 196 L 40 150" stroke="${L}" stroke-width="1.5" fill="none"/>`;
  },
  isi(m) {
    const s = SK.pale;
    return shoulders('#B04A8A', 150) + neck(100, 120, s) +
      `<path d="M 50 110 C 44 40 156 40 150 110 L 150 130 L 50 130 Z" fill="#17181C" stroke="${L}" stroke-width="3"/>` +
      head(100, 94, 42, s) + `<path d="M 58 90 C 64 50 136 50 142 90 Q 100 70 58 90 Z" fill="#17181C"/>` +
      `<circle cx="58" cy="118" r="5" fill="#E5B632" stroke="${L}" stroke-width="1.5"/><circle cx="142" cy="118" r="5" fill="#E5B632" stroke="${L}" stroke-width="1.5"/>` +
      eyes(100, 94, 'open', 17) + brows(100, 80, 0, 0, 17).replace('Q 117 76', 'Q 117 70') + nose(100, 106) +
      `<path d="M 86 120 Q 100 130 114 120 Q 100 124 86 120 Z" fill="#C0262D" stroke="${L}" stroke-width="2"/>` +
      `<rect x="134" y="86" width="26" height="54" rx="6" fill="#17181C" stroke="${L}" stroke-width="2.5" transform="rotate(-10 147 113)"/><rect x="140" y="92" width="14" height="36" rx="2" fill="#6EE7B7" opacity=".8" transform="rotate(-10 147 113)"/>`;
  },
  dutyfree(m) {
    const s = SK.warm;
    return `<rect x="0" y="130" width="200" height="70" fill="#F2C230" stroke="${L}" stroke-width="3"/><rect x="0" y="130" width="200" height="12" fill="#C0262D"/>` +
      `<text x="100" y="188" font-size="22" font-family="Rubik,Arial" font-weight="700" text-anchor="middle" fill="${L}" direction="ltr">DUTY FREE</text>` +
      shoulders('#C0262D', 150, 60).replace('200 Z', '134 Z') + neck(100, 114, s) + head(100, 88, 40, s) + ears(100, 88, 40, s) +
      `<path d="M 60 86 C 66 50 134 50 140 86 Q 100 68 60 86 Z" fill="#E5B632" stroke="${L}" stroke-width="2.5"/>` +
      eyes(100, 88, 'open', 16) + brows(100, 74, 0, 0, 16) + nose(100, 100) + mouthOf('smile', 100, 112) +
      `<g transform="translate(20 100) rotate(-20)"><rect x="-14" y="-10" width="28" height="20" rx="3" fill="#F2C230" stroke="${L}" stroke-width="2"/><path d="M -14 0 l 28 0" stroke="#5A3212" stroke-width="3"/></g>` +
      `<g transform="translate(176 96) rotate(16)"><rect x="-14" y="-10" width="28" height="20" rx="3" fill="#C0262D" stroke="${L}" stroke-width="2"/><path d="M -14 0 l 28 0" stroke="#5A3212" stroke-width="3"/></g>`;
  },
  publisher(m) {
    const s = SK.pale;
    return shoulders('#5A3212', 150) + `<path d="M 86 140 L 100 176 L 114 140" fill="#fff" stroke="${L}" stroke-width="2.5"/><path d="M 96 144 L 100 172 L 104 144 Z" fill="#C0262D"/>` +
      neck(100, 118, s) + head(100, 90, 42, s) + ears(100, 90, 42, s) +
      `<path d="M 60 84 C 66 56 134 56 140 84 Q 100 72 60 84 Z" fill="#9AA0AA" stroke="${L}" stroke-width="2.5"/>` +
      `<rect x="64" y="82" width="30" height="20" rx="4" fill="none" stroke="${L}" stroke-width="3"/><rect x="106" y="82" width="30" height="20" rx="4" fill="none" stroke="${L}" stroke-width="3"/><path d="M 94 90 l 12 0" stroke="${L}" stroke-width="3"/>` +
      eyes(100, 92, 'open', 20) + nose(100, 106) + mouthOf(m === 'open' ? 'open' : 'frown', 100, 118) +
      `<rect x="130" y="150" width="50" height="40" rx="3" fill="#2B3A67" stroke="${L}" stroke-width="2.5"/><rect x="136" y="156" width="38" height="28" fill="#F8F2E2"/>`;
  },
  everyone(m) {
    return `<g transform="translate(-30 20) scale(.6)">${CHARS.elyashiv(m)}</g><g transform="translate(90 20) scale(.6)">${CHARS.gittel(m)}</g><g transform="translate(30 70) scale(.6)">${CHARS.shira(m)}</g>`;
  },
  generic(m) {
    const s = SK.warm;
    return shoulders('#9AA0AA', 150) + neck(100, 118, s) + head(100, 90, 42, s) + eyes(100, 90, 'open', 17) + nose(100, 104) + mouthOf(m === 'open' ? 'open' : 'flat', 100, 116);
  },
};

export const NPC_IDS = Object.keys(CHARS);

export function npcSVG(id, opts = {}) {
  const { size = 120, mouth = 'flat', flip = false, className = '' } = opts;
  const fn = CHARS[id] || CHARS.generic;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="${size}" height="${size}" class="npc npc-${id} ${className}" role="img" aria-label="${id}">` +
    `<g transform="${flip ? 'translate(200 0) scale(-1 1)' : ''}">${fn(mouth)}</g></svg>`;
}

/** Yellow taxi for the Moshe transition. */
export function taxiSVG({ size = 320 } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 160" width="${size}" height="${size / 2}" class="taxi" role="img" aria-label="מונית">` +
    `<path d="M 20 110 L 40 60 Q 60 30 110 30 L 210 30 Q 250 30 270 60 L 300 110 Z" fill="#F2C230" stroke="${L}" stroke-width="4" stroke-linejoin="round"/>` +
    `<rect x="10" y="100" width="300" height="34" rx="10" fill="#F2C230" stroke="${L}" stroke-width="4"/>` +
    `<path d="M 60 62 Q 72 42 110 42 L 150 42 L 150 96 L 46 96 Z M 166 42 L 206 42 Q 240 42 252 62 L 270 96 L 166 96 Z" fill="#BFE3F7" stroke="${L}" stroke-width="3"/>` +
    `<rect x="130" y="8" width="60" height="22" rx="4" fill="#17181C" stroke="${L}" stroke-width="3"/><text x="160" y="25" font-size="14" font-family="Rubik,Arial" font-weight="700" text-anchor="middle" fill="#F2C230">מונית</text>` +
    `<rect x="40" y="104" width="240" height="8" fill="#17181C"/><rect x="60" y="106" width="50" height="4" fill="#F2C230"/><rect x="210" y="106" width="50" height="4" fill="#F2C230"/>` +
    `<circle cx="80" cy="130" r="22" fill="#17181C" stroke="${L}" stroke-width="3"/><circle cx="80" cy="130" r="9" fill="#DDE2E9"/>` +
    `<circle cx="240" cy="130" r="22" fill="#17181C" stroke="${L}" stroke-width="3"/><circle cx="240" cy="130" r="9" fill="#DDE2E9"/>` +
    `<path d="M 46 96 L 10 96 L 10 110" fill="none" stroke="${L}" stroke-width="3"/><path d="M 30 90 l -14 0" stroke="${SK.olive}" stroke-width="12" stroke-linecap="round"/>` + // Moshe's arm out the window
    `<rect x="300" y="112" width="12" height="10" fill="#C0262D"/><rect x="8" y="112" width="12" height="10" fill="#fff"/>` +
    `</svg>`;
}
