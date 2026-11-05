// js/content/cast.js — who is who. Names, colors (SPEC §6.3), and the disguises (SPEC §2.4).
export const CAST = {
  tuvia:    { name: 'טוביה',          color: '#C0262D' },
  aside:    { name: '💭',             color: '#6B6B6B' },
  book:     { name: 'מתוך הספר',      color: '#6B4A2B' },
  isi:      { name: 'איזי',           color: '#7A3B8F' },
  publisher:{ name: 'המו"ל',          color: '#555' },
  shira:    { name: 'שירה',           color: '#2B3A67', title: 'קצינת ביטחון, בת 22' },
  moshe:    { name: 'משה',            color: '#C99A12', title: 'נהג מונית, מסביר את המזרח התיכון' },
  elyashiv: { name: 'אלישיב',         color: '#6B7A2E', title: 'חקלאי אורגני, מחבק' },
  tzofia:   { name: 'צופיה',          color: '#B8860B', title: 'תשעה ילדים ופודקאסט' },
  neria:    { name: 'נריה',           color: '#E07B22', title: 'נוער גבעות, גיטרה' },
  goat:     { name: 'העז',            color: '#777',    title: 'מאוכזבת מכולם' },
  gittel:   { name: 'הרבנית גיטל',    color: '#7A1F3D', title: 'בת 80, קטנה, מפחידה' },
  shmerel:  { name: "ר' שמערל",       color: '#1B1B1B', title: 'שבעה בקבוקים, שני טלפונים' },
  yanky:    { name: 'יענקי',          color: '#6E7480', title: 'בן ישיבה, בן 19' },
  gabbai:   { name: 'הגבאי',          color: '#4B4B6B', title: 'סופר מניין. תמיד תשע' },
  narrator: { name: '',               color: '#555' },
};

export const DISGUISES = {
  none:     { label: 'טוביה, עיתונאי מניו יורק', short: 'טוביה',          motto: 'אני רק עיתונאי פשוט. פשוט.' },
  tobi:     { label: 'טובי הגרמני',              short: 'טובי הגרמני',    motto: '<bdi>Ja. Ja. Wo ist der Kuchen?</bdi>' },
  bneibrak: { label: 'טוביה מבני ברק',           short: 'טוביה מבני ברק', motto: 'הכובע קטן. השלייקעס מציצות. אף אחד לא ישים לב.' },
  guest:    { label: 'אורח פשוט',                short: 'אורח פשוט',      motto: 'מפית בצווארון. מזלג ביד. שאלות אחר כך.' },
};

export const INGREDIENTS = [
  { id: 'pot',      ch: 1, name: 'הסיר',          emoji: '🍲', from: 'שירה',          line: 'הם חשבו שזה פצצה. הם צדקו. זה פצצת קלוריות.' },
  { id: 'barley',   ch: 2, name: 'הגריסים',       emoji: '🌾', from: 'נועה',          soon: true },
  { id: 'beans',    ch: 3, name: 'השעועית',       emoji: '🫘', from: 'הגינה של צופיה', line: 'אורגני. נו, שוין. גם שעועית צריכה אידיאולוגיה.' },
  { id: 'kishke',   ch: 4, name: 'הקישקע',        emoji: '🌭', from: 'הרבנית גיטל',   line: 'היא שאלה אותי על אבא שלי. ואז נתנה לי קישקע. זה המשפט העברי.' },
  { id: 'baharat',  ch: 5, name: 'הבהרט',         emoji: '🧂', from: 'אבו סמיר',      soon: true },
  { id: 'fire',     ch: 6, name: 'האש הקטנה',     emoji: '🔥', from: 'הכנסת',         soon: true },
  { id: 'potatoes', ch: 7, name: 'תפוחי האדמה',   emoji: '🥔', from: 'סבתא של הנס',   soon: true },
];

export const MOOD_BANDS = [
  { min: 0,  face: 'angry',      label: 'אני הולך הביתה.' },
  { min: 20, face: 'suspicious', label: "מישהו פה מכיר את המושג 'בשר'?" },
  { min: 40, face: 'neutral',    label: 'נו.' },
  { min: 60, face: 'smirk',      label: 'מעניין.' },
  { min: 80, face: 'delighted',  label: 'אני אוהב את המדינה הזאת.' },
  { min: 101, face: 'delighted', label: 'שיכור מקוגל.' },
];
