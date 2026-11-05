// js/art/scenes.js — scene backgrounds as SVG strings (800×500, cover-cropped by CSS).
// Flat shapes, warm paper palette, a few Hebrew signs. Each scene may hold a goat anchor
// <g data-goat="x y scale"> where the chapter's hidden goat is injected by main.js.

const sky = (a, b) => `<defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="800" height="500" fill="url(#sk)"/>`;
const txt = (x, y, t, size = 18, fill = '#2B1D14', extra = '') => `<text x="${x}" y="${y}" font-size="${size}" font-family="Rubik,Arial,sans-serif" font-weight="700" fill="${fill}" text-anchor="middle" direction="rtl" ${extra}>${t}</text>`;
const hand = (x, y, t, size = 22, fill = '#2B1D14', rot = 0) => `<text x="${x}" y="${y}" font-size="${size}" font-family="'Gveret Levin AlefAlefAlef',Rubik,sans-serif" fill="${fill}" text-anchor="middle" direction="rtl" transform="rotate(${rot} ${x} ${y})">${t}</text>`;
const floor = (color, y = 380) => `<rect x="0" y="${y}" width="800" height="${500 - y}" fill="${color}"/>`;
const window_ = (x, y, w, h, fill = '#BFE3F2') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${fill}" stroke="#3B2A21" stroke-width="3"/><path d="M ${x + w / 2} ${y} v ${h} M ${x} ${y + h / 2} h ${w}" stroke="#3B2A21" stroke-width="2"/>`;
const hill = (x, y, w, h, fill) => `<path d="M ${x} ${y + h} Q ${x + w / 2} ${y - h * .2} ${x + w} ${y + h} Z" fill="${fill}"/>`;
const caravan = (x, y, w, color) => `<rect x="${x}" y="${y}" width="${w}" height="${w * .5}" rx="8" fill="${color}" stroke="#3B2A21" stroke-width="3"/><rect x="${x + 10}" y="${y + 10}" width="${w * .25}" height="${w * .22}" fill="#BFE3F2" stroke="#3B2A21" stroke-width="2"/><rect x="${x + w - w * .3}" y="${y + 12}" width="${w * .2}" height="${w * .38}" fill="#6E4A2A" stroke="#3B2A21" stroke-width="2"/><circle cx="${x + 20}" cy="${y + w * .5 + 8}" r="10" fill="#17181C"/><circle cx="${x + w - 20}" cy="${y + w * .5 + 8}" r="10" fill="#17181C"/>`;
const poster = (x, y, w, h, line1, line2, rot = 0) => `<g transform="rotate(${rot} ${x + w / 2} ${y + h / 2})"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#FAF7EE" stroke="#3B2A21" stroke-width="2"/><rect x="${x + 4}" y="${y + 4}" width="${w - 8}" height="${h * .3}" fill="#17181C"/>${txt(x + w / 2, y + h * .3 - 6, line1, 12, '#fff')}${txt(x + w / 2, y + h * .62, line2, 10, '#2B1D14')}<path d="M ${x + 8} ${y + h * .78} h ${w - 16} M ${x + 8} ${y + h * .88} h ${w - 30}" stroke="#9AA0AA" stroke-width="2"/></g>`;
const laundry = (x, y, w) => `<path d="M ${x} ${y} q ${w / 2} 14 ${w} 0" fill="none" stroke="#3B2A21" stroke-width="2"/>` + [0, 1, 2, 3, 4].map(i => { const px = x + 12 + i * (w - 24) / 4; const c = ['#fff', '#17181C', '#fff', '#fff', '#2B3A67'][i]; return `<rect x="${px - 8}" y="${y + 4 + Math.sin(i) * 3}" width="16" height="${22 + (i % 2) * 8}" rx="2" fill="${c}" stroke="#3B2A21" stroke-width="1.5"/>`; }).join('');
const tableTop = (y, color = '#A9744B') => `<rect x="0" y="${y}" width="800" height="${500 - y}" fill="${color}"/><rect x="0" y="${y}" width="800" height="10" fill="#C58F5F"/><rect x="0" y="${y}" width="800" height="3" fill="#3B2A21" opacity=".5"/>`;
const cloud = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})" fill="#fff" opacity=".9"><ellipse cx="0" cy="0" rx="40" ry="18"/><ellipse cx="-24" cy="6" rx="26" ry="14"/><ellipse cx="26" cy="6" rx="30" ry="15"/></g>`;
const bulb = (x, y) => `<circle cx="${x}" cy="${y}" r="7" fill="#FFE8A0" stroke="#3B2A21" stroke-width="2"/><path d="M ${x} ${y - 7} v -24" stroke="#3B2A21" stroke-width="2"/>`;
const bottle = (x, y, c = '#DDE2E9') => `<rect x="${x}" y="${y}" width="14" height="36" rx="3" fill="${c}" stroke="#3B2A21" stroke-width="2"/><rect x="${x + 4}" y="${y - 10}" width="6" height="12" fill="${c}" stroke="#3B2A21" stroke-width="2"/>`;
const plate = (x, y, food = '#C58F5F') => `<ellipse cx="${x}" cy="${y}" rx="30" ry="10" fill="#fff" stroke="#3B2A21" stroke-width="2"/><ellipse cx="${x}" cy="${y - 2}" rx="20" ry="6" fill="${food}"/>`;

export const SCENES = {
  title: () => sky('#F6EBD6', '#EFE0C3') +
    `<circle cx="640" cy="120" r="60" fill="#F2C230" opacity=".5"/>` + cloud(140, 90, 1.2) + cloud(520, 60, .8) +
    hill(-100, 300, 500, 160, '#D9C48A') + hill(300, 320, 600, 140, '#C9B27A') + floor('#B99C58', 420),

  airport: () => sky('#E8F1F7', '#D7E3EA') +
    `<rect x="0" y="40" width="800" height="18" fill="#9AA0AA"/>` + [80, 240, 400, 560, 720].map(x => bulb(x, 90)).join('') +
    `<rect x="250" y="106" width="300" height="60" rx="8" fill="#2B3A67"/>` + txt(400, 146, 'ברוכים הבאים · WELCOME', 20, '#fff') +
    `<rect x="560" y="120" width="220" height="50" rx="8" fill="#C0262D"/>` + txt(670, 152, 'פטור ממכס', 18, '#fff') +
    `<rect x="470" y="180" width="290" height="150" fill="#FAF7EE" stroke="#3B2A21" stroke-width="3"/>` +
    [0, 1, 2, 3, 4, 5].map(i => `<rect x="${486 + i * 46}" y="${204 + (i % 2) * 50}" width="34" height="40" rx="3" fill="${['#6B4A2B', '#C0262D', '#E5B632', '#2B3A67', '#7A3B8F', '#6B4A2B'][i]}" stroke="#3B2A21" stroke-width="2"/>`).join('') +
    `<rect x="40" y="190" width="340" height="120" rx="10" fill="#2E3038" stroke="#3B2A21" stroke-width="3"/>` +
    `<rect x="60" y="210" width="300" height="80" rx="40" fill="#4B4F5A" stroke="#3B2A21" stroke-width="2"/>` + [90, 150, 210, 270, 330].map(x => `<rect x="${x - 16}" y="215" width="32" height="26" rx="4" fill="${['#C0262D', '#2B3A67', '#E5B632', '#6B4A2B', '#7A3B8F'][(x / 60) | 0]}" stroke="#3B2A21" stroke-width="2"/>`).join('') +
    txt(210, 190, 'מסוע 3', 14, '#3B2A21') +
    `<g data-goat="300 106 .5"></g>` +
    floor('#D9D3C7', 340) + `<path d="M 0 340 h 800" stroke="#3B2A21" stroke-width="3"/>` +
    `<rect x="0" y="340" width="800" height="160" fill="url(#tiles)"/><defs><pattern id="tiles" width="60" height="60" patternUnits="userSpaceOnUse"><rect width="60" height="60" fill="#D9D3C7"/><rect width="58" height="58" fill="#E6E1D6"/></pattern></defs>`,

  sideroom: () => sky('#CFD6DE', '#B8C2CC') +
    `<rect x="0" y="0" width="800" height="24" fill="#9AA0AA"/>` + `<rect x="300" y="24" width="200" height="40" rx="6" fill="#DDE2E9" stroke="#3B2A21" stroke-width="2"/><path d="M 320 44 h 160" stroke="#9AA0AA" stroke-width="3"/>` +
    `<g stroke="#BFE3F2" stroke-width="3" opacity=".8"><path d="M 360 70 q 10 14 0 28 q -10 14 0 28"/><path d="M 400 70 q 10 14 0 28 q -10 14 0 28"/><path d="M 440 70 q 10 14 0 28 q -10 14 0 28"/></g>` +
    hand(400, 200, '❄ 16°', 28, '#2B3A67') +
    `<rect x="300" y="90" width="200" height="70" rx="6" fill="#FAF7EE" stroke="#3B2A21" stroke-width="3"/>` + txt(400, 120, 'חדר צדדי', 20) + txt(400, 146, 'אין יציאה. יש מזגן.', 13, '#C0262D') +
    `<rect x="600" y="100" width="150" height="110" rx="4" fill="#2E3038" stroke="#3B2A21" stroke-width="3"/><circle cx="675" cy="155" r="30" fill="#4B4F5A"/><rect x="640" y="150" width="70" height="36" rx="6" fill="#9AA0AA" stroke="#3B2A21" stroke-width="2"/>` + txt(675, 230, 'שיקוף', 14) +
    `<rect x="440" y="240" width="80" height="50" rx="10" fill="#9AA0AA" stroke="#3B2A21" stroke-width="3"/><rect x="432" y="234" width="96" height="10" rx="4" fill="#DDE2E9" stroke="#3B2A21" stroke-width="2"/><rect x="470" y="224" width="20" height="10" rx="3" fill="#DDE2E9" stroke="#3B2A21" stroke-width="2"/>` + hand(480, 320, 'הסיר. מוחרם.', 22, '#C0262D', -6) +
    floor('#8E99A6', 340) + tableTop(360, '#9AA0AA'),

  taxi: () => sky('#9ED0F0', '#E9F3FA') +
    `<circle cx="120" cy="80" r="44" fill="#F2C230"/>` + cloud(600, 80, 1) + cloud(300, 50, .7) +
    hill(-100, 220, 500, 120, '#C9B27A') + hill(250, 240, 500, 100, '#D9C48A') + hill(600, 230, 400, 120, '#B99C58') +
    `<rect x="0" y="300" width="800" height="200" fill="#4B4F5A"/><path d="M 0 400 h 800" stroke="#F2C230" stroke-width="6" stroke-dasharray="40 30"/>` +
    `<rect x="250" y="120" width="140" height="60" rx="6" fill="#2F6B3A" stroke="#fff" stroke-width="3"/>` + txt(320, 145, 'גבעה ← 10 דק׳', 14, '#fff') + txt(320, 168, '(תמיד)', 12, '#fff') +
    `<rect x="420" y="110" width="150" height="60" rx="8" fill="#17181C"/>` + txt(495, 136, 'מונה', 13, '#9AA0AA') + txt(495, 162, '₪ 200→400', 20, '#F2C230') +
    `<rect x="0" y="0" width="800" height="18" fill="#17181C"/><rect x="0" y="18" width="800" height="6" fill="#4B4F5A"/>`,

  hilltop: () => sky('#8FC7F0', '#E9F3FA') +
    `<circle cx="660" cy="90" r="46" fill="#F2C230"/>` + cloud(200, 70, 1) + cloud(480, 110, .7) +
    hill(-200, 260, 600, 160, '#C9B27A') + hill(250, 280, 500, 120, '#B99C58') + hill(500, 250, 500, 160, '#A89050') +
    `<rect x="470" y="256" width="110" height="46" rx="3" fill="#FAF7EE" stroke="#3B2A21" stroke-width="2" opacity=".9"/>` + txt(525, 274, 'הכפר ממול', 11) + txt(525, 292, '(עם גלוטן)', 10, '#6B7A2E') +
    caravan(60, 300, 180, '#FAF7EE') + caravan(300, 320, 140, '#DDE2E9') +
    `<rect x="560" y="330" width="140" height="10" fill="#A9744B"/><rect x="570" y="340" width="8" height="30" fill="#6E4A2A"/><rect x="682" y="340" width="8" height="30" fill="#6E4A2A"/>` + hand(630, 322, 'יוגה', 18, '#6B7A2E') +
    `<rect x="470" y="306" width="80" height="60" fill="none" stroke="#6E4A2A" stroke-width="3"/><path d="M 470 326 h 80 M 470 346 h 80 M 490 306 v 60 M 510 306 v 60 M 530 306 v 60" stroke="#6E4A2A" stroke-width="2"/>` +
    `<g data-goat="400 262 .5"></g>` +
    `<path d="M 430 300 l 0 -100" stroke="#6E4A2A" stroke-width="6"/><rect x="340" y="190" width="180" height="56" rx="6" fill="#FAF7EE" stroke="#3B2A21" stroke-width="3" transform="rotate(-3 430 218)"/>` + hand(430, 214, 'ברוכים הבאים!', 22, '#C0262D', -3) + hand(430, 238, '(בלי גלוטן)', 18, '#6B7A2E', -3) +
    floor('#B99C58', 380) + `<path d="M 0 380 q 200 -14 400 0 t 400 0" fill="#C9B27A"/>`,

  hilltopNight: () => sky('#1B2034', '#2B3A67') +
    `<circle cx="660" cy="90" r="34" fill="#F3E6B8"/>` + [60, 160, 300, 420, 540, 720, 100, 480, 640].map((x, i) => `<circle cx="${x}" cy="${30 + (i * 37) % 120}" r="${1.5 + (i % 3)}" fill="#fff"/>`).join('') +
    hill(-200, 260, 600, 160, '#2E3A4A') + hill(250, 280, 500, 120, '#26303D') + hill(500, 250, 500, 160, '#1F2833') +
    [500, 560, 620].map(x => `<rect x="${x}" y="276" width="6" height="6" fill="#FFE8A0"/>`).join('') +
    caravan(60, 300, 180, '#8A8F9C') + `<rect x="70" y="310" width="45" height="40" fill="#FFE8A0"/>` +
    `<circle cx="420" cy="400" r="22" fill="#E07B22"/><circle cx="420" cy="396" r="12" fill="#FFE8A0"/><path d="M 395 420 l 50 -2 M 400 426 l 40 2" stroke="#6E4A2A" stroke-width="5"/>` +
    `<rect x="470" y="306" width="80" height="60" fill="none" stroke="#4B4F5A" stroke-width="3"/>` +
    `<g data-goat="400 262 .5"></g>` +
    floor('#3B3A3A', 380) + `<path d="M 0 380 q 200 -14 400 0 t 400 0" fill="#4B4F5A"/>`,

  kitchen: () => sky('#FAF7EE', '#F3E6B8') +
    window_(520, 60, 220, 150, '#8FC7F0') + hill(520, 160, 220, 50, '#C9B27A') +
    `<rect x="40" y="60" width="400" height="30" fill="#6E4A2A"/>` + [0, 1, 2, 3, 4, 5].map(i => `<rect x="${60 + i * 62}" y="${26}" width="34" height="34" rx="4" fill="#F3E6B8" stroke="#3B2A21" stroke-width="2"/>` + txt(77 + i * 62, 49, ['קינואה', 'צ׳יה', 'כוסמין', 'נבטים', 'קייל', 'אמונה'][i], 8, '#6B7A2E')).join('') +
    `<rect x="40" y="200" width="400" height="30" fill="#6E4A2A"/>` + [0, 1, 2, 3].map(i => `<rect x="${70 + i * 90}" y="166" width="30" height="34" rx="4" fill="#C9E4C5" stroke="#3B2A21" stroke-width="2"/>`).join('') +
    `<rect x="40" y="96" width="400" height="104" fill="#F3E6B8" stroke="#3B2A21" stroke-width="0"/>` + hand(330, 150, '"הכל מהגינה" (חוץ מהמלח)', 20, '#6B7A2E', -2) +
    `<rect x="460" y="300" width="300" height="90" rx="8" fill="#9AA0AA" stroke="#3B2A21" stroke-width="3"/><circle cx="520" cy="330" r="22" fill="#17181C"/><circle cx="600" cy="330" r="22" fill="#17181C"/><circle cx="680" cy="330" r="22" fill="#17181C"/>` +
    `<rect x="580" y="286" width="40" height="30" rx="4" fill="#DDE2E9" stroke="#3B2A21" stroke-width="2"/>` +
    `<g data-goat="650 170 .35"></g>` +
    floor('#C9B27A', 390) + tableTop(400, '#A9744B') + plate(300, 440, '#F3E6B8') + plate(520, 450, '#A8D18C'),

  bneibrak: () => sky('#1B2034', '#2B3A67') +
    `<rect x="0" y="40" width="330" height="340" fill="#D9C48A" stroke="#3B2A21" stroke-width="3"/><rect x="470" y="20" width="330" height="360" fill="#E3D4AE" stroke="#3B2A21" stroke-width="3"/>` +
    [0, 1, 2].map(i => window_(30 + i * 100, 70, 60, 70, '#FFE8A0')).join('') + [0, 1, 2].map(i => window_(500 + i * 100, 60, 60, 70, i === 1 ? '#FFE8A0' : '#2E3038')).join('') +
    `<rect x="20" y="180" width="290" height="14" fill="#9AA0AA" stroke="#3B2A21" stroke-width="2"/><path d="M 20 150 h 290" stroke="#3B2A21" stroke-width="3"/>` + [0, 1, 2, 3, 4, 5, 6].map(i => `<rect x="${24 + i * 42}" y="150" width="4" height="30" fill="#3B2A21"/>`).join('') +
    laundry(40, 150, 250) +
     +
    `<rect x="500" y="170" width="280" height="14" fill="#9AA0AA" stroke="#3B2A21" stroke-width="2"/>` + laundry(560, 140, 220) +
    `<g data-goat="530 168 .42"></g>` +
    poster(40, 220, 90, 110, 'אזהרה!', 'נגד הטלפונים', -2) + poster(140, 230, 90, 110, 'קול קורא', 'נגד הפשקוויל', 3) + poster(230, 222, 80, 110, 'דעת תורה', 'נגד מי שתלה', -1) +
    poster(520, 230, 90, 110, 'חיזוק', 'קוגל בחצות', 2) + poster(640, 222, 110, 120, 'מודעה', 'שיעור ב-2:00', -2) +
    `<rect x="330" y="200" width="140" height="180" fill="#17181C"/><rect x="350" y="230" width="100" height="150" fill="#FFE8A0" opacity=".9"/>` + txt(400, 260, 'מאפייה', 16) + txt(400, 282, 'פתוח 24/7', 11, '#C0262D') + txt(400, 330, '🥐🥐🥐', 22) +
    `<g fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6"><path d="M 380 220 c -6 -8 6 -12 0 -20"/><path d="M 410 214 c -6 -8 6 -12 0 -20"/></g>` +
    floor('#4B4F5A', 380) + `<path d="M 0 440 h 800" stroke="#6E6E6E" stroke-width="2"/>`,

  shtiebel: () => sky('#F3E6B8', '#E3D4AE') +
    `<rect x="40" y="40" width="720" height="24" fill="#6E4A2A"/>` + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => `<rect x="${50 + i * 59}" y="0" width="48" height="40" fill="${['#6B4A2B', '#7A1F3D', '#2B3A67', '#17181C'][i % 4]}" stroke="#3B2A21" stroke-width="2"/>`).join('') +
    `<rect x="40" y="70" width="720" height="24" fill="#6E4A2A"/>` + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => `<rect x="${52 + i * 59}" y="38" width="44" height="32" fill="${['#2B3A67', '#17181C', '#6B4A2B', '#7A1F3D'][i % 4]}"/>`).join('') +
    `<rect x="300" y="120" width="200" height="200" rx="8" fill="#7A1F3D" stroke="#3B2A21" stroke-width="3"/><path d="M 320 140 h 160 v 160 h -160 Z" fill="none" stroke="#E5B632" stroke-width="3"/>` + txt(400, 200, 'ארון קודש', 16, '#E5B632') + txt(400, 240, '✡', 36, '#E5B632') +
    `<rect x="60" y="240" width="200" height="60" rx="4" fill="#A9744B" stroke="#3B2A21" stroke-width="3"/><rect x="540" y="240" width="200" height="60" rx="4" fill="#A9744B" stroke="#3B2A21" stroke-width="3"/>` +
    [0, 1, 2, 3].map(i => `<rect x="${70 + i * 48}" y="222" width="34" height="20" fill="#F8F2E2" stroke="#3B2A21" stroke-width="2"/>`).join('') +
    `<rect x="560" y="200" width="70" height="40" rx="4" fill="#C0262D" stroke="#3B2A21" stroke-width="2"/>` + txt(595, 226, 'ZERO', 14, '#fff') + txt(640, 190, 'ארגז', 12) +
    poster(60, 110, 110, 100, 'מניין', 'חסר אחד. תמיד.', -2) +
    floor('#C58F5F', 330) + `<path d="M 0 330 h 800" stroke="#3B2A21" stroke-width="3"/>`,

  kiddush: () => sky('#F3E6B8', '#E3D4AE') +
    `<rect x="0" y="0" width="800" height="60" fill="#7A1F3D"/>` + [0, 1, 2, 3, 4, 5, 6, 7].map(i => `<rect x="${20 + i * 98}" y="70" width="80" height="120" fill="#6B4A2B" stroke="#3B2A21" stroke-width="2"/>` + [0, 1, 2, 3].map(j => `<rect x="${24 + i * 98 + j * 19}" y="80" width="14" height="100" fill="${['#2B3A67', '#17181C', '#7A1F3D', '#6B7A2E'][(i + j) % 4]}"/>`).join('')).join('') +
    `<rect x="0" y="190" width="800" height="12" fill="#6E4A2A"/>` +
    [60, 200, 340, 480, 620, 740].map((x, i) => `<circle cx="${x}" cy="250" r="22" fill="${['#F3CBA6', '#E8B88E', '#F7D6B5', '#F3CBA6', '#E8B88E', '#F7D6B5'][i]}" stroke="#3B2A21" stroke-width="2"/><rect x="${x - 30}" y="210" width="60" height="24" rx="6" fill="#17181C" stroke="#3B2A21" stroke-width="2"/><ellipse cx="${x}" cy="234" rx="38" ry="6" fill="#17181C"/>` + (i % 2 ? `<path d="M ${x - 14} 262 q 14 24 28 0 Z" fill="#9AA0AA" stroke="#3B2A21" stroke-width="1.5"/>` : '')).join('') +
    hand(400, 130, 'ארבעים אורחים. שלושה חדרים. שבעה בקבוקים.', 20, '#fff', 0) +
    tableTop(300, '#FAF7EE') + `<rect x="0" y="300" width="800" height="200" fill="#FAF7EE"/><path d="M 0 300 h 800" stroke="#3B2A21" stroke-width="3"/>` +
    bottle(80, 330) + bottle(120, 336) + bottle(640, 330) + bottle(690, 334) + bottle(730, 340, '#C0262D') +
    plate(300, 360, '#9AA0AA') + plate(480, 350, '#F3E6B8') + plate(200, 390, '#C58F5F') + plate(600, 400, '#E8B88E') +
    `<rect x="360" y="330" width="90" height="30" rx="4" fill="#E5B632" stroke="#3B2A21" stroke-width="2"/>` + txt(405, 350, 'קוגל', 12),

  gittel: () => sky('#F3E6B8', '#EFE0C3') +
    window_(560, 50, 190, 130, '#1B2034') + `<circle cx="700" cy="90" r="16" fill="#F3E6B8"/>` +
    `<rect x="40" y="60" width="440" height="26" fill="#6E4A2A"/>` + [0, 1, 2, 3, 4].map(i => `<rect x="${60 + i * 84}" y="24" width="56" height="36" rx="4" fill="#DDE2E9" stroke="#3B2A21" stroke-width="2"/>`).join('') +
    `<rect x="40" y="140" width="440" height="20" fill="#6E4A2A"/>` + [0, 1, 2, 3, 4, 5, 6].map(i => `<rect x="${56 + i * 60}" y="104" width="44" height="36" rx="3" fill="${['#F3E6B8', '#C58F5F', '#F3E6B8', '#9AA0AA', '#F3E6B8', '#C58F5F', '#7A1F3D'][i]}" stroke="#3B2A21" stroke-width="2"/>`).join('') +
    `<rect x="300" y="186" width="200" height="56" rx="4" fill="#FAF7EE" stroke="#3B2A21" stroke-width="2"/>` + hand(400, 222, 'אתה רזה. תאכל.', 22, '#7A1F3D', -2) +
    `<rect x="300" y="250" width="440" height="120" rx="8" fill="#DDE2E9" stroke="#3B2A21" stroke-width="3"/>` + [0, 1, 2, 3].map(i => `<circle cx="${360 + i * 100}" cy="280" r="20" fill="#17181C"/>`).join('') +
    `<rect x="320" y="236" width="400" height="14" fill="#2E3038"/>` + txt(520, 330, 'פלטה. דולקת מערב שבת.', 13, '#3B2A21') +
    `<rect x="560" y="170" width="120" height="70" rx="8" fill="#9AA0AA" stroke="#3B2A21" stroke-width="3"/><rect x="550" y="164" width="140" height="12" rx="5" fill="#DDE2E9" stroke="#3B2A21" stroke-width="2"/>` +
    `<g fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"><path d="M 590 158 c -6 -8 6 -12 0 -20"/><path d="M 620 152 c -6 -8 6 -12 0 -20"/><path d="M 650 158 c -6 -8 6 -12 0 -20"/></g>` +
    floor('#C58F5F', 380) + tableTop(400, '#FAF7EE') + plate(240, 440, '#C58F5F') + plate(560, 450, '#E07B22'),

  shabbat: () => sky('#1B2034', '#2B3A67') +
    `<circle cx="120" cy="80" r="30" fill="#F3E6B8"/>` + [60, 230, 400, 560, 720, 300, 660].map((x, i) => `<circle cx="${x}" cy="${20 + (i * 41) % 100}" r="${1.5 + i % 2}" fill="#fff"/>`).join('') +
    `<path d="M 0 180 L 0 120 L 100 90 L 200 120 L 300 80 L 400 120 L 500 70 L 600 120 L 700 90 L 800 120 L 800 180 Z" fill="#D9C48A" opacity=".9"/>` + [100, 300, 500, 700].map(x => `<rect x="${x - 6}" y="${100}" width="12" height="20" fill="#FFE8A0"/>`).join('') +
    hand(400, 60, 'ירושלים. שולחן שבת. כולם באו.', 22, '#F3E6B8') +
    `<rect x="0" y="180" width="800" height="200" fill="#4B4F5A"/>` +
    [40, 200, 360, 520, 680].map(x => bulb(x, 170)).join('') +
    tableTop(260, '#FAF7EE') + `<path d="M 0 260 h 800" stroke="#3B2A21" stroke-width="3"/>` +
    `<rect x="340" y="200" width="120" height="70" rx="8" fill="#9AA0AA" stroke="#3B2A21" stroke-width="3"/><rect x="330" y="194" width="140" height="12" rx="5" fill="#DDE2E9" stroke="#3B2A21" stroke-width="2"/><rect x="384" y="182" width="32" height="12" rx="5" fill="#DDE2E9" stroke="#3B2A21" stroke-width="2"/>` +
    `<rect x="560" y="214" width="12" height="46" fill="#FAF7EE" stroke="#3B2A21" stroke-width="2"/><rect x="590" y="214" width="12" height="46" fill="#FAF7EE" stroke="#3B2A21" stroke-width="2"/><path d="M 566 212 q -6 -10 0 -16 q 6 6 0 16 M 596 212 q -6 -10 0 -16 q 6 6 0 16" fill="#F2C230" stroke="#E07B22" stroke-width="1.5"/>` +
    `<rect x="160" y="226" width="130" height="40" rx="20" fill="#C58F5F" stroke="#3B2A21" stroke-width="2.5"/><path d="M 170 246 q 20 -10 40 0 t 40 0 t 40 0" fill="none" stroke="#E5B632" stroke-width="3"/>` +
    plate(100, 300, '#9AA0AA') + plate(300, 320, '#F3E6B8') + plate(500, 310, '#E07B22') + plate(700, 320, '#C58F5F') + bottle(640, 290) + bottle(80, 350, '#C0262D'),

  plane: () => sky('#E8F1F7', '#DDE2E9') +
    `<rect x="0" y="0" width="800" height="500" fill="#DDE2E9"/>` + [0, 1, 2].map(i => `<ellipse cx="${140 + i * 260}" cy="120" rx="60" ry="70" fill="#8FC7F0" stroke="#3B2A21" stroke-width="4"/>` + cloud(140 + i * 260, 140, .5)).join('') +
    `<rect x="0" y="200" width="800" height="40" fill="#9AA0AA"/>` + [60, 320, 580].map(x => `<rect x="${x}" y="250" width="200" height="130" rx="12" fill="#2B3A67" stroke="#3B2A21" stroke-width="3"/><rect x="${x + 20}" y="270" width="160" height="30" rx="6" fill="#4B5A8A"/>`).join('') +
    `<rect x="340" y="200" width="120" height="30" fill="#F3E6B8" stroke="#3B2A21" stroke-width="2"/>` + plate(400, 216, '#9AA0AA') + hand(400, 190, 'עוף. לא עוף.', 18, '#C0262D') +
    floor('#4B4F5A', 380),

  jfk: () => sky('#2E3038', '#4B4F5A') +
    `<rect x="100" y="60" width="600" height="60" rx="8" fill="#17181C"/>` + txt(400, 100, 'JFK · ARRIVALS · ברוכים השבים', 22, '#F2C230') +
    [0, 1, 2, 3, 4].map(i => `<rect x="${60 + i * 150}" y="140" width="120" height="180" rx="4" fill="#8FC7F0" opacity=".5" stroke="#3B2A21" stroke-width="2"/>`).join('') +
    `<rect x="300" y="320" width="200" height="60" rx="30" fill="#9AA0AA" stroke="#3B2A21" stroke-width="3"/>` + `<rect x="330" y="262" width="80" height="60" rx="10" fill="#9AA0AA" stroke="#3B2A21" stroke-width="3"/><rect x="322" y="256" width="96" height="12" rx="5" fill="#DDE2E9" stroke="#3B2A21" stroke-width="2"/>` +
    `<g fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"><path d="M 350 250 c -6 -8 6 -12 0 -20"/><path d="M 380 244 c -6 -8 6 -12 0 -20"/></g>` +
    hand(370, 236, 'צ׳ולנט.', 22, '#F3E6B8') +
    floor('#6E6E6E', 380),

  yoga: () => sky('#2A1A2E', '#3B2A21') +
    `<path d="M 300 0 L 320 90 L 290 100 L 330 190" fill="none" stroke="#FFE8A0" stroke-width="4"/><path d="M 600 0 L 580 60 L 610 70 L 570 150" fill="none" stroke="#FFE8A0" stroke-width="3" opacity=".7"/>` +
    hill(-200, 260, 600, 160, '#26303D') + hill(250, 280, 500, 120, '#1F2833') + hill(500, 250, 500, 160, '#1A222B') +
    `<rect x="100" y="330" width="300" height="12" fill="#6B7A2E"/><rect x="110" y="342" width="8" height="30" fill="#4B5A2E"/><rect x="382" y="342" width="8" height="30" fill="#4B5A2E"/>` + hand(250, 322, 'דק יוגה', 18, '#A8D18C') +
    `<rect x="540" y="280" width="60" height="80" rx="30" fill="#A8D18C" stroke="#3B2A21" stroke-width="3"/>` + txt(570, 330, 'סמוּתי', 11, '#2A1A12') +
    `<g data-goat="520 330 .6"></g>` +
    floor('#1F1F1F', 380),

  launch: () => sky('#FAF7EE', '#F3E6B8') +
    `<rect x="100" y="40" width="600" height="90" rx="10" fill="#C0262D"/>` + txt(400, 78, 'השקת ספר · תל אביב', 24, '#fff') + txt(400, 112, 'כולם הוזמנו. כולם באו. כולם קנו עשרה.', 15, '#F3E6B8') +
    [0, 1, 2, 3, 4, 5, 6, 7].map(i => `<rect x="${60 + i * 88}" y="170" width="64" height="90" rx="4" fill="${['#2B3A67', '#C0262D', '#6B7A2E', '#7A1F3D'][i % 4]}" stroke="#3B2A21" stroke-width="2"/>` + txt(92 + i * 88, 222, 'צ׳ולנט', 10, '#fff')).join('') +
    `<rect x="40" y="260" width="720" height="16" fill="#6E4A2A"/>` +
    `<rect x="300" y="290" width="200" height="40" rx="6" fill="#F3E6B8" stroke="#3B2A21" stroke-width="2"/>` + hand(400, 318, 'רב-מכר!', 22, '#C0262D', -2) +
    [120, 680].map(x => `<rect x="${x - 30}" y="300" width="60" height="60" rx="30" fill="#A8D18C" stroke="#3B2A21" stroke-width="2"/>` + txt(x, 336, 'לאטה', 10)).join('') +
    floor('#C9B27A', 380),

  publisher: () => sky('#DDE2E9', '#CFD6DE') +
    `<rect x="60" y="60" width="680" height="260" rx="10" fill="#FAF7EE" stroke="#3B2A21" stroke-width="3"/>` +
    [0, 1, 2, 3].map(i => `<path d="M 100 ${110 + i * 46} h 600" stroke="#BFC7D2" stroke-width="2"/>`).join('') +
    hand(400, 150, 'טיוטה. עמוד 1: קוגל.', 24, '#2B3A67') + hand(400, 196, 'עמוד 2: קוגל (המשך).', 22, '#2B3A67') + hand(400, 242, 'עמוד 3: גיטל אמרה שאני רזה.', 22, '#2B3A67') + hand(400, 288, 'עמוד 4: ...', 22, '#2B3A67') +
    `<rect x="600" y="80" width="110" height="50" rx="6" fill="#C0262D" transform="rotate(12 655 105)"/>` + txt(655, 112, 'נדחה', 20, '#fff', 'transform="rotate(12 655 105)"') +
    floor('#9AA0AA', 380),

  nykitchen: () => sky('#F3E6B8', '#EFE0C3') +
    window_(520, 50, 230, 150, '#2B3A67') + [0, 1, 2, 3, 4].map(i => `<rect x="${540 + i * 44}" y="${90 + (i % 2) * 20}" width="24" height="${110 - (i % 2) * 20}" fill="#1B2034"/>` + `<rect x="${548 + i * 44}" y="${110}" width="6" height="6" fill="#FFE8A0"/>`).join('') + txt(635, 196, 'NYC', 14, '#F3E6B8') +
    `<rect x="40" y="60" width="420" height="26" fill="#6E4A2A"/>` + [0, 1, 2, 3].map(i => `<rect x="${60 + i * 100}" y="24" width="70" height="36" rx="4" fill="#DDE2E9" stroke="#3B2A21" stroke-width="2"/>`).join('') +
    `<rect x="300" y="110" width="200" height="90" rx="6" fill="#FAF7EE" stroke="#3B2A21" stroke-width="2" transform="rotate(-3 400 155)"/>` + hand(400, 145, 'המתכון של אמא', 20, '#C0262D', -3) + hand(400, 180, '(איזי ידעה)', 18, '#7A3B8F', -3) +
    `<rect x="300" y="260" width="440" height="110" rx="8" fill="#DDE2E9" stroke="#3B2A21" stroke-width="3"/>` +
    `<rect x="580" y="180" width="140" height="80" rx="8" fill="#9AA0AA" stroke="#3B2A21" stroke-width="3"/><rect x="570" y="174" width="160" height="12" rx="5" fill="#DDE2E9" stroke="#3B2A21" stroke-width="2"/>` +
    `<g fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"><path d="M 610 168 c -6 -8 6 -12 0 -20"/><path d="M 650 162 c -6 -8 6 -12 0 -20"/><path d="M 690 168 c -6 -8 6 -12 0 -20"/></g>` +
    floor('#C58F5F', 380) + tableTop(400, '#FAF7EE'),
};

export function sceneSVG(key) {
  const fn = SCENES[key] || SCENES.title;
  // unique def ids per scene so two scenes in the DOM (title + game) never share a gradient
  const inner = fn().replace(/id="(sk|tiles)"/g, `id="$1-${key}"`).replace(/url\(#(sk|tiles)\)/g, `url(#$1-${key})`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" preserveAspectRatio="xMidYMax slice" class="scene-svg scene-${key}" aria-hidden="true">${inner}</svg>`;
}
