/* js/content/foods.js — the food catalog (SPEC §4). Verdict lines are exact. */

export const FOODS = {
  // 🟢 Ashkenazi heaven
  cholent:      { id: 'cholent',      name: 'צ\'ולנט',                 icon: '🍲', mood: +25, sfx: 'slurp',  verdict: 'זה לא אוכל. זה זיכרון.' },
  kugelY:       { id: 'kugelY',       name: 'קוגל ירושלמי',            icon: '🟫', mood: +20, sfx: 'burp',   verdict: 'מתוק. חריף. דביק. כמו המדינה הזאת.' },
  kugelP:       { id: 'kugelP',       name: 'קוגל תפוחי אדמה',         icon: '🥔', mood: +15, sfx: 'burp',   verdict: 'אני לא צריך פסיכולוג. אני צריך עוד חתיכה.' },
  gefilte:      { id: 'gefilte',      name: 'גפילטע פיש עם חריין',     icon: '🐟', mood: +18, sfx: 'burp',   verdict: 'הדג הזה לא שחה אף פעם. וזה בסדר.' },
  kishke:       { id: 'kishke',       name: 'קישקע',                   icon: '🌭', mood: +18, sfx: 'burp',   verdict: 'אל תשאלו מה יש בפנים. אני עיתונאי, ואפילו אני לא שואל.' },
  herring:      { id: 'herring',      name: 'הערינג עם וודקה',         icon: '🐟', mood: +12, sfx: 'burp',   verdict: 'דג מלוח עם וודקה בקידוש של עשר בבוקר. ככה בונים אומה.' },
  ptcha:        { id: 'ptcha',        name: 'פיטשה',                   icon: '🟨', mood: +5,  sfx: 'slurp',  verdict: 'רק מי שגדל בבני ברק מבין את הג\'לי הזה. אני מבין.', bneibrakMood: +20 },
  kreplach:     { id: 'kreplach',     name: 'קרעפלאך',                 icon: '🥟', mood: +12, sfx: 'burp',   verdict: 'כיסונים. אבל עם נשמה.' },
  liver:        { id: 'liver',        name: 'כבד קצוץ',                icon: '🟤', mood: +14, sfx: 'burp',   verdict: 'מה אני, כבד קצוץ? כן. היום אני כבד קצוץ.' },
  rugelach:     { id: 'rugelach',     name: 'רוגעלך',                  icon: '🥐', mood: +8,  sfx: 'crunch', verdict: 'שוקולד. בצק. זהו. מה עוד צריך.' },
  babka:        { id: 'babka',        name: 'בבקה',                    icon: '🍞', mood: +12, sfx: 'burp',   verdict: 'בבקה זה כמו פוליטיקה ישראלית: שכבות על שכבות, הכל דביק, ובסוף אתה רוצה עוד.' },
  lokshen:      { id: 'lokshen',      name: 'לוקשן קוגל',              icon: '🍝', mood: +14, sfx: 'burp',   verdict: 'אטריות מתוקות. רק יהודים חשבו על זה. ובצדק.' },
  schnitzel:    { id: 'schnitzel',    name: 'שניצל',                   icon: '🍗', mood: +10, sfx: 'crunch', verdict: 'גם השניצל פה עבר בקריאה ראשונה, שנייה ושלישית.' },
  cola:         { id: 'cola',         name: 'קולה זירו',               icon: '🥤', mood: +10, sfx: 'fizz',   verdict: 'זירו. אפס. בדיוק כמו הסיכוי לשלום. אבל טעים.' },
  coffeeCake:   { id: 'coffeeCake',   name: 'קפה ועוגה',               icon: '☕', mood: +10, sfx: 'burp',   verdict: 'קפה ועוגה. התנאי היחיד שלי לראיון.' },
  // 🔴 the health-food nightmare
  quinoa:       { id: 'quinoa',       name: 'קינואה',                  icon: '🥣', mood: -15, bad: true, sfx: 'sigh',   verdict: 'קינואה. גרגירים קטנים של חרטה.' },
  kale:         { id: 'kale',         name: 'סלט קייל',                icon: '🥬', mood: -18, bad: true, sfx: 'crunch', verdict: 'זה לא סלט. זה גדר.' },
  spelt:        { id: 'spelt',        name: 'לחם כוסמין',              icon: '🍞', mood: -10, bad: true, sfx: 'crunch', verdict: 'לחם שעושה לך טובה שהוא קיים.' },
  goatYogurt:   { id: 'goatYogurt',   name: 'יוגורט עיזים',            icon: '🐐', mood: -10, bad: true, sfx: 'sigh',   verdict: 'פגשתי את העז. היא נראתה מאוכזבת. גם אני.' },
  herbalTea:    { id: 'herbalTea',    name: 'חליטת צמחים',             icon: '🍵', mood: -8,  bad: true, sfx: 'sigh',   verdict: 'מים חמים עם עלה. בניו יורק זה עולה תשעה דולר. פה זה חינם. גם זה יותר מדי.' },
  chia:         { id: 'chia',         name: 'פודינג צ\'יה',            icon: '🫧', mood: -12, bad: true, sfx: 'sigh',   verdict: 'זה מסתכל עליי.' },
  tofu:         { id: 'tofu',         name: 'טופו',                    icon: '⬜', mood: -14, bad: true, sfx: 'sigh',   verdict: 'טופו זה כמו נציג של האו״ם: אין לו טעם משלו, והוא לוקח את הטעם של מי שמממן אותו.' },
  oatLatte:     { id: 'oatLatte',     name: 'לאטה חלב שיבולת שועל',    icon: '🥛', mood: -8,  bad: true, sfx: 'sigh',   verdict: 'סוס היה שמח. אני לא סוס.' },
  sprouts:      { id: 'sprouts',      name: 'נבטי עדשים',              icon: '🌱', mood: -12, bad: true, sfx: 'crunch', verdict: 'הם עדיין חיים. אני רואה אותם זזים.' },
  smoothieBowl: { id: 'smoothieBowl', name: 'סמוּתי בול',              icon: '🥣', mood: -10, bad: true, sfx: 'sigh',   verdict: 'קערה. בתוכה: סמוּתי. למה. למה בקערה.' },
  gfCholent:    { id: 'gfCholent',    name: 'צ\'ולנט ללא גלוטן',       icon: '🫙', mood: -30, bad: true, sfx: 'gasp',   verdict: 'יש גבול. יש. גבול.', shock: true },
  // 🟡 twists
  shakshuka:    { id: 'shakshuka',    name: 'שקשוקה של הגבעה',         icon: '🍳', mood: +12, sfx: 'slurp',  verdict: 'סוף סוף. משהו שלא צמח על שיח.' },
  airline:      { id: 'airline',      name: 'ארוחת מטוס',              icon: '✈️', mood: -5,  bad: true, sfx: 'sigh',   verdict: 'עוף. או דג. או משהו שלישי. לא שאלתי.' },
};

export const DISGUISES = {
  none:     { id: 'none',     name: 'טוביה, עיתונאי מניו יורק', short: 'טוביה',          icon: '🧑‍💼', desc: 'ישראלים חושדים ב"עיתונאי האמריקאי". וגם מאכילים אותו.' },
  tobi:     { id: 'tobi',     name: 'טובי הגרמני',             short: 'טובי',           icon: '🎩', desc: 'כובע טירולי, "Ja". מתנחלים וחרדים נלחצים. אבל מאכילים.' },
  bneibrak: { id: 'bneibrak', name: 'טוביה מבני ברק',          short: 'מבני ברק',       icon: '🎩', desc: 'כובע קטן מדי. חרדים נותנים מנה כפולה ושואלים מי אבא שלך.' },
  guest:    { id: 'guest',    name: 'אורח פשוט',               short: 'אורח',           icon: '🍴', desc: 'מפית בצווארון. כולם מנומסים. מנומסים מדי. פחות ציטוטים.' },
};
