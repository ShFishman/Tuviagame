/* js/content/foods.js — the food catalog (SPEC §4). Data only.
 * mood: mood change. verdict: Tuvia's exact line when eaten. kind: good | bad | twist.
 * icon: a drawing key for js/art/sprites.js (procedural, no image files).
 * polite: for bad foods, the line Tuvia says OUT LOUD while 💭 screams.
 */
export const FOODS = {
  // ---- 🟢 good: Ashkenazi heaven ----
  cholent:      { name: 'צ\'ולנט', kind: 'good', mood: 25, icon: 'pot', verdict: 'זה לא אוכל. זה זיכרון.', sfx: 'slurp', expr: 'delighted' },
  kugelY:       { name: 'קוגל ירושלמי', kind: 'good', mood: 20, icon: 'wedge', verdict: 'מתוק. חריף. דביק. כמו המדינה הזאת.', sfx: 'burp', expr: 'delighted' },
  kugelP:       { name: 'קוגל תפוחי אדמה', kind: 'good', mood: 15, icon: 'potato', verdict: 'אני לא צריך פסיכולוג. אני צריך עוד חתיכה.', sfx: 'burp', expr: 'delighted' },
  gefilte:      { name: 'גפילטע פיש עם חריין', kind: 'good', mood: 18, icon: 'fish', verdict: 'הדג הזה לא שחה אף פעם. וזה בסדר.', sfx: 'burp', expr: 'happy' },
  kishke:       { name: 'קישקע', kind: 'good', mood: 18, icon: 'kishke', verdict: 'אל תשאלו מה יש בפנים. אני עיתונאי, ואפילו אני לא שואל.', sfx: 'burp', expr: 'delighted' },
  herring:      { name: 'הערינג', kind: 'good', mood: 12, icon: 'herring', verdict: 'דג מלוח עם וודקה בקידוש של עשר בבוקר. ככה בונים אומה.', sfx: 'burp', expr: 'happy' },
  ptcha:        { name: 'פיטשה', kind: 'good', mood: 5, moodBneibrak: 20, icon: 'jelly', verdict: 'רק מי שגדל בבני ברק מבין את הג\'לי הזה. אני מבין.', sfx: 'slurp', expr: 'happy' },
  kreplach:     { name: 'קרעפלאך', kind: 'good', mood: 12, icon: 'dumpling', verdict: 'כיסונים. אבל עם נשמה.', sfx: 'burp', expr: 'delighted' },
  liver:        { name: 'כבד קצוץ', kind: 'good', mood: 14, icon: 'liver', verdict: 'מה אני, כבד קצוץ? כן. היום אני כבד קצוץ.', sfx: 'burp', expr: 'happy' },
  rugelach:     { name: 'רוגעלך', kind: 'good', mood: 8, icon: 'rugelach', verdict: 'שוקולד. בצק. זהו. מה עוד צריך.', sfx: 'crunch', expr: 'happy' },
  babka:        { name: 'בבקה', kind: 'good', mood: 12, icon: 'babka', verdict: 'בבקה זה כמו פוליטיקה ישראלית: שכבות על שכבות, הכל דביק, ובסוף אתה רוצה עוד.', sfx: 'burp', expr: 'delighted' },
  lokshen:      { name: 'לוקשן קוגל', kind: 'good', mood: 14, icon: 'noodles', verdict: 'אטריות מתוקות. רק יהודים חשבו על זה. ובצדק.', sfx: 'burp', expr: 'delighted' },
  schnitzel:    { name: 'שניצל', kind: 'good', mood: 10, icon: 'schnitzel', verdict: 'גם השניצל פה עבר בקריאה ראשונה, שנייה ושלישית.', sfx: 'crunch', expr: 'happy' },
  cola:         { name: 'קולה זירו', kind: 'good', mood: 10, icon: 'can', verdict: 'זירו. אפס. בדיוק כמו הסיכוי לשלום. אבל טעים.', sfx: 'fizz', expr: 'happy' },
  coffeeCake:   { name: 'קפה ועוגה', kind: 'good', mood: 10, icon: 'coffee', verdict: 'קפה ועוגה. התנאי היחיד שלי לראיון.', sfx: 'slurp', expr: 'happy' },
  // ---- 🔴 bad: the health-food nightmare ----
  quinoa:       { name: 'קינואה', kind: 'bad', mood: -15, icon: 'quinoa', verdict: 'קינואה. גרגירים קטנים של חרטה.', sfx: 'sigh', expr: 'disgusted', polite: 'תודה. טעים מאוד.' },
  kale:         { name: 'סלט קייל', kind: 'bad', mood: -18, icon: 'kale', verdict: 'זה לא סלט. זה גדר.', sfx: 'crunch', expr: 'disgusted', polite: 'מרענן.' },
  spelt:        { name: 'לחם כוסמין', kind: 'bad', mood: -10, icon: 'bread', verdict: 'לחם שעושה לך טובה שהוא קיים.', sfx: 'crunch', expr: 'disgusted', polite: 'יש לזה... אופי.' },
  goatYogurt:   { name: 'יוגורט עיזים', kind: 'bad', mood: -10, icon: 'yogurt', verdict: 'פגשתי את העז. היא נראתה מאוכזבת. גם אני.', sfx: 'sigh', expr: 'disgusted', polite: 'מהעז? ממש. מהעז.' },
  herbalTea:    { name: 'חליטת צמחים', kind: 'bad', mood: -8, icon: 'tea', verdict: 'מים חמים עם עלה. בניו יורק זה עולה תשעה דולר. פה זה חינם. גם זה יותר מדי.', sfx: 'sigh', expr: 'disgusted', polite: 'מרגיע.' },
  chia:         { name: 'פודינג צ\'יה', kind: 'bad', mood: -12, icon: 'chia', verdict: 'זה מסתכל עליי.', sfx: 'sigh', expr: 'disgusted', polite: 'מעניין המרקם.' },
  tofu:         { name: 'טופו', kind: 'bad', mood: -14, icon: 'tofu', verdict: 'טופו זה כמו נציג של האו״ם: אין לו טעם משלו, והוא לוקח את הטעם של מי שמממן אותו.', sfx: 'sigh', expr: 'disgusted', polite: 'ממש... לבן.' },
  oatLatte:     { name: 'לאטה חלב שיבולת שועל', kind: 'bad', mood: -8, icon: 'latte', verdict: 'סוס היה שמח. אני לא סוס.', sfx: 'sigh', expr: 'disgusted', polite: 'קרמי.' },
  sprouts:      { name: 'נבטי עדשים', kind: 'bad', mood: -12, icon: 'sprouts', verdict: 'הם עדיין חיים. אני רואה אותם זזים.', sfx: 'crunch', expr: 'disgusted', polite: 'חי. ממש חי.' },
  euCanapes:    { name: 'קנאפה טבעונית של האיחוד האירופי', kind: 'bad', mood: -15, icon: 'canape', verdict: 'ממומן על ידי האיחוד האירופי. בטעם של מסמך עמדה.', sfx: 'sigh', expr: 'disgusted', polite: 'מאוזן.' },
  smoothieBowl: { name: 'סמוּתי בול', kind: 'bad', mood: -10, icon: 'bowl', verdict: 'קערה. בתוכה: סמוּתי. למה. למה בקערה.', sfx: 'sigh', expr: 'disgusted', polite: 'צבעוני.' },
  gfCholent:    { name: 'צ\'ולנט ללא גלוטן', kind: 'bad', mood: -30, icon: 'gfpot', verdict: 'יש גבול. יש. גבול.', sfx: 'gasp', expr: 'shocked', shake: true, polite: '...' },
  // ---- 🟡 twists ----
  shakshuka:    { name: 'שקשוקה של הגבעה', kind: 'twist', mood: 12, icon: 'shakshuka', verdict: 'סוף סוף. משהו שלא צמח על שיח.', sfx: 'slurp', expr: 'delighted' },
  airlineMeal:  { name: 'ארוחת מטוס', kind: 'bad', mood: -5, icon: 'tray', verdict: 'עוף או פסטה. שניהם אותו דבר. שניהם לא.', sfx: 'sigh', expr: 'disgusted', polite: 'תודה.' },
};

/** The slice's three cholent ingredients + the four "בקרוב" slots (SPEC §3.3). */
export const INGREDIENTS = [
  { id: 'pot',     chapter: 'airport',    name: 'הסיר', icon: 'pot', from: 'שירה, הקצינה', line: 'הוא חשב שזה פצצה. הוא צדק. זה פצצת קלוריות.' },
  { id: 'barley',  chapter: 'telaviv',    name: 'גריסים', icon: 'barley', locked: true, from: 'סבתא של נועה' },
  { id: 'beans',   chapter: 'settlement', name: 'השעועית', icon: 'beans', from: 'הגינה של צופיה', line: 'אורגני. נו, שוין. גם שעועית צריכה אידיאולוגיה.' },
  { id: 'kishke',  chapter: 'bneibrak',   name: 'הקישקע', icon: 'kishke', from: 'הרבנית גיטל', line: 'היא שאלה אותי על אבא שלי. ואז נתנה לי קישקע. זה המשפט העברי.' },
  { id: 'baharat', chapter: 'ramallah',   name: 'בהרט', icon: 'spice', locked: true, from: 'אבו סמיר' },
  { id: 'fire',    chapter: 'knesset',    name: 'האש הקטנה', icon: 'fire', locked: true, from: 'הכנסת' },
  { id: 'potato',  chapter: 'berlin',     name: 'תפוחי אדמה', icon: 'potato', locked: true, from: 'סבתא של הנס' },
];
