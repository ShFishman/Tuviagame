// js/content/foods.js — the food catalog with Tuvia's verdict lines (SPEC §4). Data only.
// good: true → Ashkenazi heaven / location twist. good: false → the health-food nightmare.
export const FOODS = {
  cholent:     { name: "צ'ולנט",                     emoji: '🍲', mood: +25, good: true,  sfx: 'slurp',  verdict: 'זה לא אוכל. זה זיכרון.' },
  kugelY:      { name: 'קוגל ירושלמי',               emoji: '🟫', mood: +20, good: true,  sfx: 'burp',   verdict: 'מתוק. חריף. דביק. כמו המדינה הזאת.' },
  kugelP:      { name: 'קוגל תפוחי אדמה',            emoji: '🥔', mood: +15, good: true,  sfx: 'burp',   verdict: 'אני לא צריך פסיכולוג. אני צריך עוד חתיכה.' },
  gefilte:     { name: 'גפילטע פיש עם חריין',        emoji: '🐟', mood: +18, good: true,  sfx: 'burp',   verdict: 'הדג הזה לא שחה אף פעם. וזה בסדר.' },
  kishke:      { name: 'קישקע',                      emoji: '🌭', mood: +18, good: true,  sfx: 'burp',   verdict: 'אל תשאלו מה יש בפנים. אני עיתונאי, ואפילו אני לא שואל.' },
  herring:     { name: 'הערינג עם וודקה',            emoji: '🐟', mood: +12, good: true,  sfx: 'burp',   verdict: 'דג מלוח עם וודקה בקידוש של עשר בבוקר. ככה בונים אומה.' },
  ptcha:       { name: 'פיטשה',                      emoji: '🟨', mood: +5,  good: true,  sfx: 'slurp',  verdict: "רק מי שגדל בבני ברק מבין את הג'לי הזה. אני מבין.", bneibrakMood: +20 },
  kreplach:    { name: 'קרעפלאך',                    emoji: '🥟', mood: +12, good: true,  sfx: 'burp',   verdict: 'כיסונים. אבל עם נשמה.' },
  liver:       { name: 'כבד קצוץ',                   emoji: '🟤', mood: +14, good: true,  sfx: 'burp',   verdict: 'מה אני, כבד קצוץ? כן. היום אני כבד קצוץ.' },
  rugelach:    { name: 'רוגעלך',                     emoji: '🥐', mood: +8,  good: true,  sfx: 'crunch', verdict: 'שוקולד. בצק. זהו. מה עוד צריך.' },
  babka:       { name: 'בבקה',                       emoji: '🍞', mood: +12, good: true,  sfx: 'burp',   verdict: 'בבקה זה כמו פוליטיקה ישראלית: שכבות על שכבות, הכל דביק, ובסוף אתה רוצה עוד.' },
  lokshen:     { name: 'לוקשן קוגל',                 emoji: '🍝', mood: +14, good: true,  sfx: 'burp',   verdict: 'אטריות מתוקות. רק יהודים חשבו על זה. ובצדק.' },
  schnitzel:   { name: 'שניצל',                      emoji: '🍗', mood: +10, good: true,  sfx: 'crunch', verdict: 'גם השניצל פה עבר בקריאה ראשונה, שנייה ושלישית.' },
  cola:        { name: 'קולה זירו',                  emoji: '🥤', mood: +10, good: true,  sfx: 'fizz',   verdict: 'זירו. אפס. בדיוק כמו הסיכוי לשלום. אבל טעים.' },
  coffeeCake:  { name: 'קפה שחור ועוגה',             emoji: '☕', mood: +10, good: true,  sfx: 'burp',   verdict: 'קפה ועוגה. התנאי היחיד שלי לראיון.' },
  shakshuka:   { name: 'שקשוקה של הגבעה',            emoji: '🍳', mood: +12, good: true,  sfx: 'slurp',  verdict: 'סוף סוף. משהו שלא צמח על שיח.' },

  quinoa:      { name: 'קינואה מהגבעה',              emoji: '🥣', mood: -15, good: false, sfx: 'sigh',   verdict: 'קינואה. גרגירים קטנים של חרטה.' },
  kale:        { name: 'סלט קייל',                   emoji: '🥬', mood: -18, good: false, sfx: 'crunch', verdict: 'זה לא סלט. זה גדר.' },
  spelt:       { name: 'לחם כוסמין',                 emoji: '🍞', mood: -10, good: false, sfx: 'crunch', verdict: 'לחם שעושה לך טובה שהוא קיים.' },
  goatYogurt:  { name: 'יוגורט עיזים',               emoji: '🥛', mood: -10, good: false, sfx: 'sigh',   verdict: 'פגשתי את העז. היא נראתה מאוכזבת. גם אני.' },
  herbalTea:   { name: 'חליטת צמחים',                emoji: '🍵', mood: -8,  good: false, sfx: 'sigh',   verdict: 'מים חמים עם עלה. בניו יורק זה עולה תשעה דולר. פה זה חינם. גם זה יותר מדי.' },
  chia:        { name: "פודינג צ'יה",                emoji: '🫙', mood: -12, good: false, sfx: 'sigh',   verdict: 'זה מסתכל עליי.' },
  tofu:        { name: 'טופו',                       emoji: '⬜', mood: -14, good: false, sfx: 'sigh',   verdict: 'טופו זה כמו נציג של האו״ם: אין לו טעם משלו, והוא לוקח את הטעם של מי שמממן אותו.' },
  oatLatte:    { name: 'לאטה חלב שיבולת שועל',       emoji: '🥛', mood: -8,  good: false, sfx: 'sigh',   verdict: 'סוס היה שמח. אני לא סוס.' },
  sprouts:     { name: 'נבטי עדשים',                 emoji: '🌱', mood: -12, good: false, sfx: 'crunch', verdict: 'הם עדיין חיים. אני רואה אותם זזים.' },
  euCanape:    { name: 'קנאפה טבעונית של האיחוד האירופי', emoji: '🥪', mood: -15, good: false, sfx: 'sigh', verdict: 'ממומן על ידי האיחוד האירופי. בטעם של מסמך עמדה.' },
  smoothie:    { name: 'סמוּתי בול',                 emoji: '🥣', mood: -10, good: false, sfx: 'sigh',   verdict: 'קערה. בתוכה: סמוּתי. למה. למה בקערה.' },
  gfCholent:   { name: "צ'ולנט ללא גלוטן",           emoji: '☠️', mood: -30, good: false, sfx: 'gasp',   verdict: 'יש גבול. יש. גבול.', cursed: true },
};

/** The polite line Tuvia says out loud while the 💭 bubble screams (SPEC ch.3). */
export const POLITE_LINE = 'תודה, טעים מאוד.';

/** What the bubble screams when he eats bad food "politely". One per food, with a generic fallback. */
export const POLITE_SCREAMS = {
  quinoa:     'זה לא אוכל. זה חול עם שאיפות. אני בולע. אני מחייך. אני גיבור.',
  kale:       'אני לועס גדר. גדר ירוקה. בשביל הספר. בשביל הצ\'ולנט. בשביל כלום.',
  spelt:      'הלחם הזה מרגיש שהוא עושה לי טובה. אני מרגיש שאני עושה לו טובה. שנינו טועים.',
  goatYogurt: 'העז מסתכלת. אני בולע. היא יודעת. אני יודע. חיוך.',
  herbalTea:  'עלה. במים. אני שותה עלה במים ואומר תודה. בניו יורק היו מפטרים אותי.',
  chia:       'זה זז. אני בטוח שזה זז. אני בולע לפני שזה יברח.',
  sprouts:    'חיים. הם חיים ואני אוכל אותם ואומר תודה. אני מפלצת. מפלצת מנומסת.',
  gfCholent:  'קוראים יקרים. אם אתם קוראים את זה, אכלתי צ\'ולנט בלי גלוטן. תגידו לאיזי שאהבתי אותה.',
  _:          'אני בולע. אני מחייך. בפנים אני צורח. זה העיתונאות.',
};

/** The 😤 line Tuvia says when he eats bad food honestly (complains). Falls back to the verdict. */
export const HONEST_GRUMBLES = {
  quinoa:     '...גרגירים.',
  kale:       'יש לכם משהו שלא היה פעם שיח?',
  gfCholent:  'לא. לא. לא. לא.',
  _:          'נו.',
};

/** What happens when Tuvia tries to refuse GOOD food: he cannot. */
export const CANNOT_REFUSE = ['לא. אני לא מסוגל.', 'הידיים לא מסכימות.', 'סירבתי. הפה לא.', 'ניסיתי. באמת ניסיתי.'];
