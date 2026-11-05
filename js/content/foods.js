/* js/content/foods.js — the food catalog (SPEC §4) as DATA. No logic here.
 *
 * mood      SPEC value. The arcade applies ARCADE_SCALE to ordinary foods (README: slice scaling),
 *           never to the cursed gluten-free cholent, the ingredients or the final cholent.
 * kind      good | bad | twist | drink | snack | junk | special
 * shape     key of the canvas drawer in js/art/food.js
 * verdict   Tuvia's exact line from SPEC §4 (shown when caught)
 * sfx       procedural SFX name (js/audio.js)
 */
export const ARCADE_SCALE = 0.6;

export const FOODS = {
  // ---------- 🟢 good: Ashkenazi heaven ----------
  cholent:     { name: "צ'ולנט", kind: 'good', mood: 25, shape: 'pot', c: ['#7A4A1E', '#5A3212', '#C98B4A'], verdict: 'זה לא אוכל. זה זיכרון.', sfx: 'slurp' },
  kugelY:      { name: 'קוגל ירושלמי', kind: 'good', mood: 20, shape: 'wedge', c: ['#B5651D', '#8A4512', '#E0A060'], verdict: 'מתוק. חריף. דביק. כמו המדינה הזאת.', sfx: 'burp' },
  kugelP:      { name: 'קוגל תפוחי אדמה', kind: 'good', mood: 15, shape: 'wedge', c: ['#E2B85E', '#B8862E', '#F7DB9A'], verdict: 'אני לא צריך פסיכולוג. אני צריך עוד חתיכה.', sfx: 'burp' },
  gefilte:     { name: 'גפילטע פיש עם חריין', kind: 'good', mood: 18, shape: 'fish', c: ['#E8DCC0', '#A8906A', '#8E3B8E'], verdict: 'הדג הזה לא שחה אף פעם. וזה בסדר.', sfx: 'burp' },
  kishke:      { name: 'קישקע', kind: 'good', mood: 18, shape: 'sausage', c: ['#D97A2B', '#9A4E12', '#F2A861'], verdict: 'אל תשאלו מה יש בפנים. אני עיתונאי, ואפילו אני לא שואל.', sfx: 'burp' },
  herring:     { name: 'הערינג', kind: 'good', mood: 12, shape: 'fish', c: ['#B9C4CC', '#6E7C87', '#D9262C'], verdict: 'דג מלוח עם וודקה בקידוש של עשר בבוקר. ככה בונים אומה.', sfx: 'burp' },
  ptcha:       { name: 'פיטשה', kind: 'good', mood: 5, shape: 'jelly', c: ['#EFD27A', '#C9A64A', '#FFF1B8'], verdict: "רק מי שגדל בבני ברק מבין את הג'לי הזה. אני מבין.", sfx: 'slurp', bneibrakMood: 20 },
  kreplach:    { name: 'קרעפלאך', kind: 'good', mood: 12, shape: 'dumpling', c: ['#F3E3B8', '#C9A86A', '#8A5A2B'], verdict: 'כיסונים. אבל עם נשמה.', sfx: 'burp' },
  liver:       { name: 'כבד קצוץ', kind: 'good', mood: 14, shape: 'blob', c: ['#8A5A3B', '#5E3A22', '#F7E3B0'], verdict: 'מה אני, כבד קצוץ? כן. היום אני כבד קצוץ.', sfx: 'burp' },
  rugelach:    { name: 'רוגעלך', kind: 'snack', mood: 8, shape: 'croissant', c: ['#C98B4A', '#7A4A1E', '#3B2A21'], verdict: 'שוקולד. בצק. זהו. מה עוד צריך.', sfx: 'crunch' },
  babka:       { name: 'בבקה', kind: 'good', mood: 12, shape: 'loaf', c: ['#B07B45', '#4A2C16', '#E6C58A'], verdict: 'בבקה זה כמו פוליטיקה ישראלית: שכבות על שכבות, הכל דביק, ובסוף אתה רוצה עוד.', sfx: 'burp' },
  lokshen:     { name: 'לוקשן קוגל', kind: 'good', mood: 14, shape: 'noodles', c: ['#F2C55C', '#C58F2A', '#FFE8A8'], verdict: 'אטריות מתוקות. רק יהודים חשבו על זה. ובצדק.', sfx: 'burp' },
  schnitzel:   { name: 'שניצל', kind: 'good', mood: 10, shape: 'schnitzel', c: ['#D9A441', '#9A6A1E', '#F6DFA0'], verdict: 'גם השניצל פה עבר בקריאה ראשונה, שנייה ושלישית.', sfx: 'crunch' },
  coke:        { name: 'קולה זירו', kind: 'drink', mood: 10, shape: 'can', c: ['#1E1E22', '#D9262C', '#DDE2E9'], verdict: 'זירו. אפס. בדיוק כמו הסיכוי לשלום. אבל טעים.', sfx: 'fizz' },
  coffeeCake:  { name: 'קפה ועוגה', kind: 'good', mood: 10, shape: 'cup', c: ['#F8F2E2', '#5A3212', '#E58AA0'], verdict: 'קפה ועוגה. התנאי היחיד שלי לראיון.', sfx: 'burp' },

  // ---------- 🔴 bad: the health-food nightmare ----------
  quinoa:      { name: 'קינואה', kind: 'bad', mood: -15, shape: 'bowl', c: ['#E9D9B4', '#B9A47A', '#F7F0DC'], verdict: 'קינואה. גרגירים קטנים של חרטה.', sfx: 'sigh' },
  kale:        { name: 'סלט קייל', kind: 'bad', mood: -18, shape: 'leaf', c: ['#3E7A3E', '#1F4D22', '#8FC48F'], verdict: 'זה לא סלט. זה גדר.', sfx: 'crunch' },
  spelt:       { name: 'לחם כוסמין', kind: 'bad', mood: -10, shape: 'loaf', c: ['#8E7352', '#5A452C', '#C5AA86'], verdict: 'לחם שעושה לך טובה שהוא קיים.', sfx: 'crunch' },
  goatYogurt:  { name: 'יוגורט עיזים', kind: 'bad', mood: -10, shape: 'yogurt', c: ['#FFFFFF', '#CFCCC2', '#3B2A21'], verdict: 'פגשתי את העז. היא נראתה מאוכזבת. גם אני.', sfx: 'sigh' },
  herbalTea:   { name: 'חליטת צמחים', kind: 'bad', mood: -8, shape: 'cup', c: ['#F8F2E2', '#A4C77A', '#6E8B3D'], verdict: 'מים חמים עם עלה. בניו יורק זה עולה תשעה דולר. פה זה חינם. גם זה יותר מדי.', sfx: 'sigh' },
  chia:        { name: "פודינג צ'יה", kind: 'bad', mood: -12, shape: 'bowl', c: ['#C9C2D6', '#6E6680', '#2A2434'], verdict: 'זה מסתכל עליי.', sfx: 'sigh' },
  tofu:        { name: 'טופו', kind: 'bad', mood: -14, shape: 'cube', c: ['#F6F1E3', '#C9C0A8', '#E3DAC2'], verdict: 'טופו זה כמו נציג של האו״ם: אין לו טעם משלו, והוא לוקח את הטעם של מי שמממן אותו.', sfx: 'sigh' },
  oatLatte:    { name: 'לאטה חלב שיבולת שועל', kind: 'bad', mood: -8, shape: 'cup', c: ['#FFFFFF', '#C8A878', '#8A6A3A'], verdict: 'סוס היה שמח. אני לא סוס.', sfx: 'sigh' },
  sprouts:     { name: 'נבטי עדשים', kind: 'bad', mood: -12, shape: 'sprouts', c: ['#D9C9A0', '#7FA85A', '#4A6B2A'], verdict: 'הם עדיין חיים. אני רואה אותם זזים.', sfx: 'crunch' },
  euCanape:    { name: 'קנאפה טבעונית של האיחוד האירופי', kind: 'bad', mood: -15, shape: 'canape', c: ['#2B3A9C', '#F2C230', '#9AC48F'], verdict: 'ממומן על ידי האיחוד האירופי. בטעם של מסמך עמדה.', sfx: 'sigh' },
  smoothie:    { name: 'סמוּתי בול', kind: 'bad', mood: -10, shape: 'bowl', c: ['#B04A8A', '#6E2A55', '#F2C2E0'], verdict: 'קערה. בתוכה: סמוּתי. למה. למה בקערה.', sfx: 'sigh' },
  gfCholent:   { name: "צ'ולנט ללא גלוטן", kind: 'bad', mood: -30, shape: 'gfpot', c: ['#C9C2A8', '#7E7A66', '#E9E4CF'], verdict: 'יש גבול. יש. גבול.', sfx: 'gasp', cursed: true, unscaled: true },

  // ---------- 🟡 twists ----------
  shakshuka:   { name: 'שקשוקה של הגבעה', kind: 'twist', mood: 12, shape: 'pan', c: ['#C8321E', '#8A1E10', '#F7E3B0'], verdict: 'סוף סוף. משהו שלא צמח על שיח.', sfx: 'slurp' },

  // ---------- airport extras (ch1) ----------
  chocolate:   { name: 'שוקולד מהדיוטי פרי', kind: 'good', mood: 8, shape: 'chocolate', c: ['#F2C230', '#5A3212', '#C0262D'], verdict: 'שוקולד שווייצרי. ניטרלי. כמו שווייץ. טעים. לא כמו שווייץ.', sfx: 'crunch' },
  airplaneMeal:{ name: 'ארוחת מטוס', kind: 'junk', mood: -6, shape: 'tray', c: ['#C9CED6', '#7E8795', '#E9B86A'], verdict: 'עוף או פסטה? לא. זו לא השאלה. השאלה היא למה.', sfx: 'sigh' },
  toothpaste:  { name: 'משחת שיניים (מוחרמת)', kind: 'junk', mood: -4, shape: 'tube', c: ['#FFFFFF', '#2B7BBF', '#C0262D'], verdict: 'היא החרימה לי משחת שיניים. עכשיו היא זורקת אותה בחזרה. אני לא מבין את המדינה הזאת.', sfx: 'thud' },
  scissors:    { name: 'מספריים לציפורניים', kind: 'junk', mood: -4, shape: 'scissors', c: ['#DDE2E9', '#7E8795', '#C0262D'], verdict: 'מספריים. לציפורניים. עם זה אני אמור לחטוף מטוס? עם זה אני בקושי חותך קוגל.', sfx: 'thud' },
  waterBottle: { name: 'בקבוק מים (מעל מאה מ"ל)', kind: 'junk', mood: -3, shape: 'bottle', c: ['#BFE3F7', '#2B7BBF', '#FFFFFF'], verdict: 'מאה ואחד מיליליטר. מסוכן. בניו יורק זה היה מכונת ייצור פצצות.', sfx: 'thud' },
  hummusJar:   { name: 'חומוס (מוחרם, נוזלי)', kind: 'junk', mood: -2, shape: 'jar', c: ['#E9D9B4', '#B9A47A', '#C0262D'], verdict: 'החומוס נוזל, אז הוא מוחרם. ככה אמרו. אז מה אני, גז?', sfx: 'thud' },

  // ---------- Bnei Brak extras (ch4) ----------
  vodka:       { name: "וודקה של ר' שמערל", kind: 'good', mood: 6, shape: 'bottle', c: ['#E8F4FF', '#2B3A67', '#DDE2E9'], verdict: 'לחיים. זו לא תשובה. אבל זו וודקה טובה.', sfx: 'fizz' },
  kosherPhone: { name: 'טלפון כשר', kind: 'special', mood: 0, shape: 'phone', c: ['#17181C', '#2E3038', '#6EE7B7'], verdict: 'צלצל בטיקטוק. "זה של אשתי", הוא אמר. אני רושם.', sfx: 'pop', pages: 8 },
  lecture:     { name: 'הרצאה (ללא אוכל)', kind: 'junk', mood: -5, shape: 'scroll', c: ['#F8F2E2', '#9AA0AA', '#3B2A21'], verdict: 'עשרים דקות. בלי צלחת. זה לא ראיון. זה חטיפה.', sfx: 'sigh' },
  pamphlet:    { name: 'פשקוויל', kind: 'junk', mood: -3, shape: 'scroll', c: ['#FFFFFF', '#17181C', '#C0262D'], verdict: 'פשקוויל נגד הפשקוויל של אתמול. הדפוס פה עובד יותר קשה מהכנסת.', sfx: 'thud' },
};

/** The three ingredients of the slice + the final cholent. Unscaled, glowing. */
export const INGREDIENTS = {
  pot:    { id: 'pot',    name: 'הסיר', chapter: 'ch1', who: 'שירה', shape: 'potIng', c: ['#8E8E96', '#4A4A52', '#E5B632'],
            reaction: 'הוא חשב שזה פצצה. הוא צדק. זה פצצת קלוריות.' },
  beans:  { id: 'beans',  name: 'השעועית', chapter: 'ch3', who: 'צופיה', shape: 'beans', c: ['#8A5A3B', '#F7E3B0', '#5A8A3A'],
            reaction: 'אורגני. נו, שוין. גם שעועית צריכה אידיאולוגיה.' },
  kishke: { id: 'kishke', name: 'הקישקע', chapter: 'ch4', who: 'הרבנית גיטל', shape: 'kishkeIng', c: ['#D97A2B', '#9A4E12', '#E5B632'],
            reaction: 'היא שאלה אותי על אבא שלי. ואז נתנה לי קישקע. זה המשפט העברי.' },
  // the four that are "בקרוב" in the slice (HUD shows 7 slots)
  barley:  { id: 'barley',  name: 'הגריסים', chapter: 'ch2', soon: true },
  baharat: { id: 'baharat', name: 'הבהרט', chapter: 'ch5', soon: true },
  fire:    { id: 'fire',    name: 'האש הקטנה', chapter: 'ch6', soon: true },
  potato:  { id: 'potato',  name: 'תפוחי האדמה', chapter: 'ch7', soon: true },
};
export const INGREDIENT_ORDER = ['pot', 'barley', 'beans', 'kishke', 'baharat', 'fire', 'potato'];

/** Effective mood change of a food in the arcade. */
export function foodMood(food, disguise) {
  let m = food.mood;
  if (food.bneibrakMood != null && disguise === 'bneibrak') m = food.bneibrakMood;
  if (food.unscaled) return m;
  const s = Math.round(m * ARCADE_SCALE);
  return s === 0 ? Math.sign(m) : s;
}
