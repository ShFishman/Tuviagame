/* js/art/scenes.js — establishing shots / backgrounds as SVG strings (viewBox 0 0 400 240).
 * sceneSVG(name, { goat: 'hidden' | 'found' | null }) — when a chapter hides the goat in this scene,
 * it is drawn as a clickable <g class="goat-hit"> (SPEC §6.2 "find the goat").
 */
import { goatSVG } from './tuvia.js';

const L = '#3B2A21';
let uid = 0;

const sky = (id, top, bottom) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs><rect width="400" height="240" fill="url(#${id})"/>`;
const txt = (x, y, s, size = 11, fill = L, extra = '') => `<text x="${x}" y="${y}" font-size="${size}" font-family="Rubik,Arial,sans-serif" text-anchor="middle" fill="${fill}" direction="rtl" ${extra}>${s}</text>`;
const goatAt = (x, y, scale, state, flip = false) => {
  if (!state) return '';
  const g = goatSVG({ size: 160, mood: state === 'found' ? 'shocked' : 'disappointed', flip });
  const inner = g.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  const cls = state === 'hidden' ? 'goat-hit' : state === 'found' ? 'goat-found' : 'goat-deco';
  return `<g class="${cls}" transform="translate(${x} ${y}) scale(${scale})" data-goat="${state}">` +
    `<rect x="-6" y="-6" width="172" height="130" fill="transparent"/>${inner}</g>`;
};
const star = (x, y, r = 1.4) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity=".8"/>`;
const posters = (x, y, n, colors) => {
  let s = '';
  for (let i = 0; i < n; i++) {
    const c = colors[i % colors.length];
    s += `<g transform="translate(${x + i * 46} ${y}) rotate(${(i % 3) - 1})"><rect width="40" height="56" fill="${c}" stroke="${L}" stroke-width="1.5"/><rect x="4" y="6" width="32" height="6" fill="${L}" opacity=".8"/><rect x="6" y="16" width="28" height="3" fill="${L}" opacity=".5"/><rect x="6" y="22" width="28" height="3" fill="${L}" opacity=".5"/><rect x="6" y="28" width="20" height="3" fill="${L}" opacity=".5"/><rect x="4" y="40" width="32" height="10" fill="${L}" opacity=".8"/></g>`;
  }
  return s;
};

const SCENES = {
  airportHall(o, id) {
    return sky(id, '#DCE9F5', '#F1F3F6') +
      `<rect y="170" width="400" height="70" fill="#C9CFD8"/><path d="M 0 170 L 400 170" stroke="#AAB2BE" stroke-width="2"/>` +
      `<g opacity=".9"><rect x="20" y="30" width="360" height="120" fill="#BFD8EE" stroke="#8FA5BC" stroke-width="3"/><path d="M 110 30 V 150 M 200 30 V 150 M 290 30 V 150" stroke="#8FA5BC" stroke-width="3"/>` +
      `<g transform="translate(250 80)"><path d="M -40 0 L 30 -4 L 44 -12 L 48 -8 L 36 0 L 48 8 L 44 12 L 30 4 Z" fill="#fff" stroke="#6E7E92" stroke-width="2"/><path d="M -6 -2 L -16 -18 L -8 -18 L 6 -2 Z" fill="#fff" stroke="#6E7E92" stroke-width="2"/></g></g>` +
      `<rect x="120" y="8" width="160" height="26" rx="6" fill="#2B3A67" stroke="${L}" stroke-width="2"/>${txt(200, 26, 'ברוכים הבאים · WELCOME', 12, '#fff')}` +
      `<g transform="translate(300 150)"><rect x="0" y="0" width="70" height="40" rx="4" fill="#8E8E94" stroke="${L}" stroke-width="2"/><rect x="6" y="-28" width="26" height="30" rx="3" fill="#C0262D" stroke="${L}" stroke-width="2"/><rect x="36" y="-18" width="30" height="20" rx="3" fill="#2B3A67" stroke="${L}" stroke-width="2"/><circle cx="12" cy="44" r="6" fill="${L}"/><circle cx="58" cy="44" r="6" fill="${L}"/></g>` +
      `<g transform="translate(30 150)"><rect x="0" y="0" width="60" height="40" rx="4" fill="#8E8E94" stroke="${L}" stroke-width="2"/><rect x="4" y="-24" width="52" height="26" rx="3" fill="#6B4A2B" stroke="${L}" stroke-width="2"/><circle cx="10" cy="44" r="6" fill="${L}"/><circle cx="50" cy="44" r="6" fill="${L}"/></g>` +
      goatAt(84, 160, .34, o.goat, true);
  },
  security(o, id) {
    return sky(id, '#E6ECF2', '#F4F4F2') +
      `<rect y="176" width="400" height="64" fill="#C9CFD8"/>` +
      `<rect x="40" y="40" width="320" height="140" fill="#DDE4EC" stroke="#8FA5BC" stroke-width="3"/><rect x="56" y="56" width="288" height="90" fill="#BFD8EE" opacity=".6" stroke="#8FA5BC" stroke-width="2"/>` +
      `<rect x="40" y="146" width="320" height="34" fill="#2B3A67"/>${txt(200, 168, 'ביקורת גבולות · PASSPORT CONTROL', 12, '#fff')}` +
      `<g transform="translate(330 20)"><rect width="50" height="34" fill="#fff" stroke="${L}" stroke-width="1.5"/><rect y="6" width="50" height="5" fill="#2B5EA8"/><rect y="23" width="50" height="5" fill="#2B5EA8"/><path d="M 25 9 L 32 21 L 18 21 Z M 25 25 L 18 13 L 32 13 Z" fill="none" stroke="#2B5EA8" stroke-width="1.5"/></g>` +
      `<rect x="150" y="186" width="100" height="6" rx="3" fill="#E5B632"/>`;
  },
  xray(o, id) {
    return sky(id, '#ECEEF2', '#F6F6F4') +
      `<rect y="170" width="400" height="70" fill="#B8BEC8"/>` +
      `<rect x="30" y="120" width="340" height="50" rx="6" fill="#6E737C" stroke="${L}" stroke-width="2"/><path d="M 40 145 H 360" stroke="#3A3D46" stroke-width="2" stroke-dasharray="10 8"/>` +
      `<rect x="150" y="50" width="130" height="120" rx="8" fill="#8E8E94" stroke="${L}" stroke-width="2.5"/><rect x="164" y="64" width="102" height="60" rx="4" fill="#0F2A3D" stroke="${L}" stroke-width="2"/>` +
      `<g fill="none" stroke="#7FE0FF" stroke-width="2"><rect x="178" y="76" width="74" height="38" rx="3"/><ellipse cx="215" cy="96" rx="20" ry="11"/><path d="M 184 82 h 20 M 184 88 h 20 M 232 80 h 14 M 232 104 h 14"/></g>` +
      `<text x="215" y="140" font-size="10" font-family="Arial" text-anchor="middle" fill="#7FE0FF">X-RAY</text>` +
      `<g transform="translate(60 92)"><rect width="56" height="38" rx="4" fill="#6B4A2B" stroke="${L}" stroke-width="2"/><rect x="18" y="-10" width="20" height="12" rx="3" fill="${L}"/></g>` +
      `<rect x="300" y="40" width="70" height="40" rx="4" fill="#fff" stroke="${L}" stroke-width="1.5"/>${txt(335, 56, 'חדר צדדי', 10)}${txt(335, 70, 'נא להמתין', 9, '#6E737C')}`;
  },
  dutyfree(o, id) {
    let shelves = '';
    const cols = ['#5A3A1C', '#C0262D', '#E5B632', '#2B3A67', '#7A1F2E', '#D9A520'];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 9; c++) shelves += `<rect x="${24 + c * 38}" y="${58 + r * 40}" width="30" height="22" rx="2" fill="${cols[(r + c) % cols.length]}" stroke="${L}" stroke-width="1.2"/>`;
    return sky(id, '#FBE9CF', '#FFF7EA') +
      `<rect y="180" width="400" height="60" fill="#E8D6B8"/>` +
      `<rect x="14" y="44" width="372" height="134" fill="#FFF3DC" stroke="#C9A97A" stroke-width="2"/><path d="M 14 86 H 386 M 14 126 H 386 M 14 166 H 386" stroke="#C9A97A" stroke-width="3"/>${shelves}` +
      `<rect x="130" y="8" width="140" height="28" rx="6" fill="#C0262D"/>${txt(200, 27, 'DUTY FREE · שוקולד', 13, '#fff')}` +
      `<g transform="translate(300 10)"><rect width="90" height="26" rx="5" fill="#E5B632" stroke="${L}" stroke-width="1.5"/>${txt(45, 18, 'מאפייה ♨', 11)}</g>`;
  },
  taxi(o, id) {
    return sky(id, '#9ECBEF', '#E8F1F7') +
      `<path d="M 0 150 L 400 150 L 400 240 L 0 240 Z" fill="#8E8E94"/><path d="M 0 150 Q 200 130 400 150" fill="#7A7A80"/>` +
      `<path d="M 200 240 L 200 150" stroke="#F2C230" stroke-width="4" stroke-dasharray="14 12"/>` +
      `<path d="M 0 150 Q 100 100 200 120 T 400 150" fill="#C9B88A" opacity=".8"/>` +
      `<rect x="0" y="0" width="400" height="24" fill="#1B2034"/><rect x="0" y="200" width="400" height="40" fill="#1B2034"/>` +
      `<rect x="150" y="196" width="100" height="30" rx="4" fill="#2E3038" stroke="${L}" stroke-width="2"/>` +
      `<rect x="158" y="202" width="84" height="18" rx="2" fill="#0F0F12"/><text class="taxi-meter" x="200" y="216" font-size="12" font-family="monospace" text-anchor="middle" fill="#FF5A36">₪ 120</text>` +
      `<g transform="translate(330 60)"><rect x="-26" y="-18" width="52" height="36" rx="4" fill="#fff" stroke="${L}" stroke-width="2"/>${txt(0, 4, 'ת"א ↑', 11)}</g>` +
      `<g transform="translate(60 40)"><circle r="14" fill="#E5B632"/></g>`;
  },
  hilltop(o, id) {
    return sky(id, '#8EC3F0', '#F2E6C8') +
      `<path d="M 0 150 C 80 100 140 120 200 110 C 260 100 320 130 400 100 L 400 240 L 0 240 Z" fill="#B8C77E"/>` +
      `<path d="M 0 180 C 100 150 200 170 400 150 L 400 240 L 0 240 Z" fill="#8FAF5A"/>` +
      `<path d="M 0 200 Q 200 186 400 200 L 400 240 L 0 240 Z" fill="#6E8C3A"/>` +
      `<g transform="translate(250 112)"><rect width="80" height="40" rx="4" fill="#F6EBD6" stroke="${L}" stroke-width="2"/><rect x="-4" y="-8" width="88" height="10" fill="#C0262D" stroke="${L}" stroke-width="2"/><rect x="10" y="12" width="16" height="14" fill="#8EC3F0" stroke="${L}" stroke-width="1.5"/><rect x="50" y="12" width="14" height="28" fill="#6B4A2B" stroke="${L}" stroke-width="1.5"/></g>` +
      `<g transform="translate(130 124)"><rect width="66" height="34" rx="4" fill="#F6EBD6" stroke="${L}" stroke-width="2"/><rect x="-3" y="-7" width="72" height="9" fill="#2B3A67" stroke="${L}" stroke-width="2"/><rect x="8" y="10" width="14" height="12" fill="#8EC3F0" stroke="${L}" stroke-width="1.5"/></g>` +
      `<g transform="translate(40 150)"><rect x="-3" y="0" width="6" height="60" fill="#6B4A2B"/><rect x="-46" y="-30" width="92" height="40" rx="4" fill="#fff" stroke="${L}" stroke-width="2" transform="rotate(-4)"/>${txt(0, -14, 'ברוכים הבאים!', 12, '#C0262D', 'transform="rotate(-4)" font-weight="700"')}${txt(0, 2, '(בלי גלוטן)', 10, L, 'transform="rotate(-4)"')}</g>` +
      `<g transform="translate(320 170)"><rect x="-30" y="0" width="60" height="26" fill="none" stroke="#6B4A2B" stroke-width="3"/><path d="M -30 8 H 30 M -30 18 H 30" stroke="#6B4A2B" stroke-width="2"/></g>` +
      `<rect x="200" y="196" width="70" height="8" rx="2" fill="#9B6BB5" opacity=".9"/>` +
      goatAt(286, 158, .3, o.goat === undefined ? 'deco' : o.goat);
  },
  hilltopTable(o, id) {
    return sky(id, '#9FCDF2', '#F2E6C8') +
      `<path d="M 0 140 C 100 100 300 120 400 100 L 400 240 L 0 240 Z" fill="#A7BE6A"/>` +
      `<rect x="10" y="150" width="380" height="90" fill="#8FAF5A"/>` +
      `<rect x="40" y="130" width="320" height="30" rx="4" fill="#A9744B" stroke="${L}" stroke-width="2.5"/><rect x="60" y="160" width="14" height="80" fill="#7E5434"/><rect x="326" y="160" width="14" height="80" fill="#7E5434"/>` +
      `<g><ellipse cx="110" cy="128" rx="30" ry="9" fill="#fff" stroke="${L}" stroke-width="2"/><ellipse cx="110" cy="126" rx="22" ry="6" fill="#E6D39A"/><ellipse cx="200" cy="128" rx="26" ry="8" fill="#fff" stroke="${L}" stroke-width="2"/><ellipse cx="200" cy="126" rx="18" ry="5" fill="#9BC46A"/><ellipse cx="290" cy="128" rx="28" ry="8" fill="#fff" stroke="${L}" stroke-width="2"/><ellipse cx="290" cy="126" rx="20" ry="5" fill="#F4F1E8"/></g>` +
      `<g transform="translate(330 40)"><rect x="-40" y="-14" width="80" height="28" rx="6" fill="#fff" stroke="${L}" stroke-width="1.5"/>${txt(0, 4, '🎙 פודקאסט חי', 10)}</g>` +
      goatAt(300, 150, .3, 'deco');
  },
  hilltopNight(o, id) {
    let stars = '';
    for (let i = 0; i < 40; i++) stars += star((i * 97) % 400, (i * 53) % 120, (i % 3) * .4 + .8);
    return sky(id, '#0F1733', '#2B3A67') + stars +
      `<circle cx="340" cy="40" r="16" fill="#F2E6C8"/><circle cx="334" cy="36" r="4" fill="#E0D2B0"/>` +
      `<path d="M 0 150 C 80 110 140 130 200 120 C 260 110 320 140 400 110 L 400 240 L 0 240 Z" fill="#1F2E1A"/>` +
      `<path d="M 0 190 Q 200 170 400 190 L 400 240 L 0 240 Z" fill="#17230F"/>` +
      `<g transform="translate(200 196)"><path d="M -30 10 L 30 6 M -26 14 L 26 12" stroke="#6B4A2B" stroke-width="6" stroke-linecap="round"/><path class="fire" d="M -16 6 C -24 -14 -6 -24 0 -44 C 6 -24 24 -14 16 6 Z" fill="#F2A33A"/><path d="M -8 6 C -12 -6 -2 -12 0 -24 C 2 -12 12 -6 8 6 Z" fill="#FFE27A"/></g>` +
      `<circle cx="200" cy="190" r="70" fill="#F2A33A" opacity=".12"/>`;
  },
  bneibrak(o, id) {
    return sky(id, '#D8CBB0', '#EAE0CB') +
      `<rect x="0" y="0" width="400" height="190" fill="#D6C5A0"/><rect x="0" y="0" width="400" height="190" fill="url(#${id})" opacity=".2"/>` +
      `<rect y="190" width="400" height="50" fill="#9A8E78"/>` +
      `<g><rect x="0" y="0" width="24" height="190" fill="#B8A484"/><rect x="376" y="0" width="24" height="190" fill="#B8A484"/></g>` +
      `<g transform="translate(40 40)"><rect width="110" height="50" fill="#B8A484" stroke="${L}" stroke-width="2"/><rect x="10" y="12" width="90" height="4" fill="#4E535B"/><rect x="10" y="30" width="90" height="4" fill="#4E535B"/><rect x="20" y="20" width="14" height="30" fill="#E5B632" opacity=".7"/><rect x="70" y="20" width="14" height="30" fill="#E5B632" opacity=".7"/></g>` +
      `<path d="M 40 100 L 150 100 L 150 108 L 40 108 Z" fill="#8E8E94"/><path d="M 40 100 v 30 M 150 100 v 30 M 60 100 v 30 M 80 100 v 30 M 100 100 v 30 M 120 100 v 30 M 140 100 v 30" stroke="#4E535B" stroke-width="2"/>` +
      `<g transform="translate(60 190)"><path d="M 0 0 L 300 0" stroke="#4E535B" stroke-width="2" stroke-dasharray="3 5" opacity=".4"/></g>` +
      `<g>${posters(170, 90, 4, ['#F8F2E2', '#F2E6C8', '#FFF3DC', '#F8F2E2'])}` +
      `<g transform="translate(262 90) rotate(-1)"><rect width="40" height="56" fill="#F8F2E2" stroke="${L}" stroke-width="1.5"/>${txt(20, 12, 'אסיפה', 7, L, 'font-weight="700"')}${txt(20, 21, 'גדולה!', 7, L, 'font-weight="700"')}${txt(20, 52, 'בהשתתפות:', 5)}` +
      goatAt(4, 22, .2, o.goat === 'hidden' ? 'hidden' : o.goat === 'found' ? 'found' : 'deco') + `</g></g>` +
      `<g transform="translate(330 150)"><rect x="-26" y="0" width="52" height="40" rx="3" fill="#C0262D" stroke="${L}" stroke-width="2"/><rect x="-20" y="6" width="40" height="28" fill="#fff"/><text x="0" y="24" font-size="9" font-family="Rubik,Arial" text-anchor="middle" fill="#C0262D" direction="rtl">קולה זירו</text></g>`;
  },
  kitchen(o, id) {
    let tiles = '';
    for (let r = 0; r < 4; r++) for (let c = 0; c < 10; c++) tiles += `<rect x="${c * 40}" y="${r * 40}" width="40" height="40" fill="${(r + c) % 2 ? '#F4F1E8' : '#E6E0CF'}" stroke="#D8D2C0"/>`;
    return `<rect width="400" height="240" fill="#F4F1E8"/>${tiles}` +
      `<rect y="160" width="400" height="80" fill="#8E7C62"/>` +
      `<rect x="40" y="120" width="320" height="40" rx="3" fill="#B5B5BB" stroke="${L}" stroke-width="2"/><rect x="40" y="160" width="320" height="60" fill="#DDE0E5" stroke="${L}" stroke-width="2"/>` +
      `<g><circle cx="110" cy="128" r="14" fill="#2E3038"/><circle cx="110" cy="128" r="6" fill="#3A3D46" stroke="#F2A33A"/><circle cx="290" cy="128" r="14" fill="#2E3038"/></g>` +
      `<g transform="translate(200 120)"><rect x="-60" y="-50" width="120" height="50" fill="#8E8E94" stroke="${L}" stroke-width="2.5"/><rect x="-66" y="-56" width="132" height="10" rx="4" fill="#B5B5BB" stroke="${L}" stroke-width="2"/><circle cx="0" cy="-60" r="6" fill="#B5B5BB" stroke="${L}" stroke-width="2"/>` +
      `<g fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".85"><path d="M -30 -66 c -6 -8 6 -12 0 -20"/><path d="M 0 -70 c -6 -8 6 -12 0 -20"/><path d="M 30 -66 c -6 -8 6 -12 0 -20"/></g></g>` +
      `<g transform="translate(330 40)"><rect x="-40" y="-14" width="80" height="40" rx="3" fill="#fff" stroke="${L}" stroke-width="1.5"/>${txt(0, 4, 'ברכת הבית', 10)}${txt(0, 18, '(ותאכל)', 9, '#6E737C')}</g>`;
  },
  shtiebel(o, id) {
    let books = '';
    const cols = ['#5A3A1C', '#7A1F2E', '#2B3A67', '#3F8C6B', '#17181C'];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 22; c++) books += `<rect x="${12 + c * 17}" y="${20 + r * 40}" width="14" height="32" fill="${cols[(r * 7 + c) % cols.length]}" stroke="${L}" stroke-width="1"/>`;
    return `<rect width="400" height="240" fill="#E8DCC0"/>` +
      `<rect x="6" y="10" width="388" height="128" fill="#6B4A2B" stroke="${L}" stroke-width="2"/>${books}<path d="M 6 56 H 394 M 6 96 H 394" stroke="${L}" stroke-width="3"/>` +
      `<rect y="150" width="400" height="90" fill="#A9744B"/><rect y="150" width="400" height="8" fill="#C58F5F"/>` +
      `<rect x="20" y="140" width="360" height="20" rx="3" fill="#fff" stroke="${L}" stroke-width="2"/>` +
      `<g><rect x="60" y="112" width="12" height="32" rx="3" fill="#DDEAF5" stroke="${L}" stroke-width="1.5"/><rect x="78" y="112" width="12" height="32" rx="3" fill="#DDEAF5" stroke="${L}" stroke-width="1.5"/><rect x="96" y="112" width="12" height="32" rx="3" fill="#DDEAF5" stroke="${L}" stroke-width="1.5"/>` +
      `<ellipse cx="200" cy="144" rx="40" ry="10" fill="#B8732E" stroke="${L}" stroke-width="2"/><path d="M 170 140 q 30 -16 60 0" fill="#D9A520" stroke="${L}" stroke-width="1.5"/>` +
      `<ellipse cx="300" cy="144" rx="30" ry="9" fill="#DDE0E5" stroke="${L}" stroke-width="2"/><path d="M 280 142 q 20 -8 40 0" fill="#8EA3B8"/></g>` +
      `<g transform="translate(330 60)"><rect x="-34" y="-12" width="68" height="24" rx="4" fill="#F8F2E2" stroke="${L}" stroke-width="1.5"/>${txt(0, 4, 'מניין: 9', 11, '#C0262D', 'font-weight="700"')}</g>`;
  },
  bakery(o, id) {
    return sky(id, '#0F1733', '#1B2034') +
      `<rect y="190" width="400" height="50" fill="#2E3038"/>` +
      `<rect x="40" y="30" width="320" height="160" fill="#2B2420" stroke="${L}" stroke-width="2"/><rect x="60" y="60" width="280" height="130" fill="#F2A33A" opacity=".25"/>` +
      `<rect x="80" y="36" width="240" height="22" rx="6" fill="#F2C94C" class="neon"/><text x="200" y="52" font-size="12" font-family="Rubik,Arial" text-anchor="middle" fill="#2B2420" direction="rtl">מאפיית ברוך · פתוח 24 שעות · רוגעלך חם</text>` +
      `<g><rect x="70" y="110" width="260" height="10" fill="#8E8E94"/><rect x="70" y="150" width="260" height="10" fill="#8E8E94"/>` +
      `${[0, 1, 2, 3, 4, 5, 6].map((i) => `<path d="M ${90 + i * 36} 108 q 10 -16 20 0 Z" fill="#B8732E" stroke="${L}" stroke-width="1.5"/><path d="M ${90 + i * 36} 148 q 10 -16 20 0 Z" fill="#B8732E" stroke="${L}" stroke-width="1.5"/>`).join('')}</g>` +
      `<text x="200" y="22" font-size="10" font-family="Rubik,Arial" text-anchor="middle" fill="#9AA0AA" direction="rtl">02:00</text>`;
  },
  shabbat(o, id) {
    const gold = o.gold;
    let s = sky(id, gold ? '#F2D27A' : '#2B3A67', gold ? '#FFF3C4' : '#4A3A6E');
    s += `<rect x="30" y="20" width="110" height="80" rx="40" fill="${gold ? '#FFE9A8' : '#8EC3F0'}" stroke="${L}" stroke-width="2"/><path d="M 30 60 H 140 M 85 20 V 100" stroke="${L}" stroke-width="2"/>`;
    s += `<rect x="260" y="20" width="110" height="80" rx="40" fill="${gold ? '#FFE9A8' : '#8EC3F0'}" stroke="${L}" stroke-width="2"/><path d="M 260 60 H 370 M 315 20 V 100" stroke="${L}" stroke-width="2"/>`;
    s += `<rect y="150" width="400" height="90" fill="#A9744B"/><rect x="0" y="130" width="400" height="30" fill="#fff" stroke="${L}" stroke-width="2"/><path d="M 0 160 Q 200 172 400 160 L 400 240 L 0 240 Z" fill="#F4F1E8" opacity=".9"/>`;
    for (const x of [120, 280]) s += `<rect x="${x - 3}" y="100" width="6" height="30" fill="#F4F1E8" stroke="${L}" stroke-width="1.5"/><path class="fire" d="M ${x} 100 c -6 -8 0 -14 0 -20 c 0 6 6 12 0 20 Z" fill="#F2A33A"/><rect x="${x - 10}" y="128" width="20" height="4" fill="#E5B632"/>`;
    s += `<g transform="translate(200 128)"><rect x="-44" y="-30" width="88" height="34" fill="#8E8E94" stroke="${L}" stroke-width="2.5"/><rect x="-48" y="-36" width="96" height="8" rx="3" fill="#B5B5BB" stroke="${L}" stroke-width="2"/><circle cy="-40" r="5" fill="#B5B5BB" stroke="${L}" stroke-width="2"/>`;
    if (gold) s += `<g fill="none" stroke="#FFE27A" stroke-width="3" stroke-linecap="round"><path d="M -30 -48 l -10 -16 M 0 -52 l 0 -20 M 30 -48 l 10 -16 M -50 -30 l -16 -8 M 50 -30 l 16 -8"/></g><circle r="60" cy="-30" fill="#FFE27A" opacity=".25"/>`;
    s += `</g>`;
    s += `<g><ellipse cx="60" cy="146" rx="22" ry="7" fill="#fff" stroke="${L}" stroke-width="1.5"/><ellipse cx="340" cy="146" rx="22" ry="7" fill="#fff" stroke="${L}" stroke-width="1.5"/><path d="M 300 120 q 8 -20 16 0 q 8 -20 16 0" fill="#D9A520" stroke="${L}" stroke-width="1.5"/></g>`;
    s += goatAt(230, 170, .26, o.goat);
    return s;
  },
  shabbatGold(o, id) { return SCENES.shabbat({ ...o, gold: true }, id); },
  plane(o, id) {
    return `<rect width="400" height="240" fill="#DDE0E5"/><path d="M 0 0 H 400 V 60 Q 200 90 0 60 Z" fill="#B8BEC8"/>` +
      `${[40, 120, 200, 280, 360].map((x) => `<rect x="${x - 18}" y="70" width="36" height="46" rx="18" fill="#8EC3F0" stroke="${L}" stroke-width="2"/>`).join('')}` +
      `<rect y="140" width="400" height="100" fill="#2B3A67"/>${[0, 1, 2, 3].map((i) => `<rect x="${20 + i * 100}" y="128" width="70" height="80" rx="8" fill="#3F4C7E" stroke="${L}" stroke-width="2"/>`).join('')}` +
      `<g transform="translate(200 206)"><rect x="-40" y="-10" width="80" height="20" rx="2" fill="#F4F1E8" stroke="${L}" stroke-width="1.5"/><rect x="-32" y="-7" width="26" height="14" fill="#B8B4A4"/><rect x="0" y="-7" width="28" height="14" fill="#C9C0A0"/></g>` +
      `<text x="200" y="40" font-size="10" font-family="Arial" text-anchor="middle" fill="#fff">FASTEN SEATBELT · 34E</text>`;
  },
  horror(o, id) {
    return SCENES.hilltopNight(o, id) + `<rect width="400" height="240" fill="#4A0A0A" opacity=".45"/><path class="lightning" d="M 300 0 L 280 60 L 300 60 L 270 130" fill="none" stroke="#fff" stroke-width="3" opacity=".9"/>` +
      `<rect x="100" y="196" width="60" height="8" rx="2" fill="#9B6BB5"/><text x="130" y="190" font-size="9" font-family="Rubik,Arial" text-anchor="middle" fill="#fff" direction="rtl">יוגה</text>`;
  },
  launch(o, id) {
    let stacks = '';
    for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) stacks += `<rect x="${30 + i * 58}" y="${150 - j * 12}" width="46" height="11" fill="${j % 2 ? '#C0262D' : '#F8F2E2'}" stroke="${L}" stroke-width="1.2"/>`;
    return sky(id, '#F6EBD6', '#EFE0C3') +
      `<rect y="160" width="400" height="80" fill="#A9744B"/>` + stacks +
      `<rect x="90" y="20" width="220" height="48" rx="8" fill="#fff" stroke="${L}" stroke-width="2"/>${txt(200, 40, 'השקת ספר', 14, '#C0262D', 'font-weight="700"')}${txt(200, 58, 'צ\'ולנט: איך הבנתי את המזרח התיכון דרך הקיבה', 8)}` +
      `<g transform="translate(350 110)"><rect x="-30" y="-10" width="60" height="20" rx="4" fill="#E5B632" stroke="${L}" stroke-width="1.5"/>${txt(0, 4, '10 עותקים', 9)}</g>`;
  },
  nyc(o, id) {
    let b = '';
    const hs = [90, 140, 70, 160, 110, 130, 80, 150, 100];
    hs.forEach((h, i) => { b += `<rect x="${i * 46}" y="${200 - h}" width="40" height="${h}" fill="${i % 2 ? '#2B3A67' : '#3F4C7E'}" stroke="${L}" stroke-width="1.5"/>`; for (let w = 0; w < h / 18; w++) b += `<rect x="${i * 46 + 8}" y="${206 - h + w * 18}" width="8" height="8" fill="#F2C94C" opacity="${(i + w) % 3 ? .9 : .2}"/><rect x="${i * 46 + 24}" y="${206 - h + w * 18}" width="8" height="8" fill="#F2C94C" opacity="${(i + w) % 2 ? .9 : .2}"/>`; });
    return sky(id, '#0F1733', '#3F4C7E') + b +
      `<rect y="200" width="400" height="40" fill="#1B2034"/>` +
      `<g transform="translate(200 200)"><rect x="-60" y="-60" width="120" height="60" fill="#8E8E94" stroke="${L}" stroke-width="2"/><rect x="-50" y="-70" width="100" height="36" fill="#6E6E74" stroke="${L}" stroke-width="2.5"/><rect x="-54" y="-74" width="108" height="8" rx="3" fill="#B5B5BB" stroke="${L}" stroke-width="2"/><g fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".85"><path d="M -24 -82 c -6 -8 6 -12 0 -20"/><path d="M 4 -86 c -6 -8 6 -12 0 -20"/><path d="M 30 -82 c -6 -8 6 -12 0 -20"/></g></g>`;
  },
};

export function sceneSVG(name, opts = {}) {
  const fn = SCENES[name] || SCENES.airportHall;
  const id = 'sc' + (++uid).toString(36);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" preserveAspectRatio="xMidYMax slice" class="scene scene-${name}" aria-hidden="true">${fn(opts, id)}</svg>`;
}

export const SCENE_NAMES = Object.keys(SCENES);
