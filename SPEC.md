# SPEC — "טוביה אוכל את הארץ"
### A fan game about Tuvia Tenenbom: one journalist, one notebook, a lot of cholent

> "I came to the Holy Land to understand the conflict. Instead I understood the cholent."
> — Tuvia (game version)

This document is the backbone of the project. It defines the tone, the character, the systems, the content and the four prototypes. Every prototype branch follows it. If code and SPEC disagree, either the SPEC wins or the SPEC gets updated deliberately.

---

## 0. Quick facts

| | |
|---|---|
| **Working title** | טוביה אוכל את הארץ (alternatives: "טוביה, תאכל משהו!", "הצ'ולנט המושלם") |
| **Audience** | Tuvia Tenenbom fans: Israeli readers of *תפוס את היהודי*, *ישנתי בחדר של היטלר*, *השקרים שהם מספרים* and others |
| **Platform** | Web browser, desktop + mobile. Static files on GitHub Pages |
| **Language** | Hebrew, RTL. Yiddish, English and German sprinkles where Tuvia would use them |
| **Length** | 20–40 minutes per playthrough. Replayable (disguises, endings) |
| **Tone** | Sharp, critical and very funny. Everyone gets roasted, and everyone gets a human moment |
| **Prototypes** | 4 independent branches: `novel`, `walker`, `catcher`, `mix` |

---

## 1. Vision & Tone

### 1.1 The pitch
Tuvia lands in Israel with a notebook, red glasses, green suspenders and a deadline. His publisher wants a new book. Tuvia wants a good cholent. He travels from Tel Aviv to a hilltop, to Bnei Brak, to Ramallah, to the Knesset and to Berlin. He asks everyone innocent questions that are not innocent at all. People pour out their souls, and they also pour out their food. **The food tells Tuvia the truth that the people don't.**

### 1.2 The comedic engine
1. **The innocent question.** Tuvia asks something a child would ask ("ומי זה הפלסטינים?", "למה יש פה כל כך הרבה דגלים של האיחוד האירופי?"). The NPC answers at length and reveals more than they meant to. Tuvia writes it down.
2. **The food verdict.** Ideology is measured in calories. A settler with a heart of gold who serves quinoa still loses points. A cynical politician with a good schnitzel gets forgiven. Tuvia is shamelessly bribable.
3. **The inner monologue.** Tuvia constantly talks to the reader (the player) behind the NPC's back: "הוא מדבר כבר עשרים דקות. הקינואה התקררה. גם אני."
4. **The disguise.** Tuvia isn't always Tuvia. As "טובי הגרמני" he hears things nobody would say to a Jew. As "טוביה מבני ברק" he gets an extra portion of kugel.

### 1.3 Satire rules (sharp, but with a heart)
- **Punch at hypocrisy, not at identity.** Mock what people *do* and *say*: European-funded activists who've never visited the place they're "saving", politicians who shout and do nothing, settlers who preach about gluten and the Land of Israel in the same breath, Haredim with a smartphone hidden inside a "kosher" phone case. Never mock what people *are*.
- **Every NPC gets one "human moment"**: a line or gesture that makes the player like them. Noa from the NGO really cares. Elyashiv the settler gives his coat to a stranger. Hans the German official is ashamed of his grandfather and doesn't know what to do with it. The Ramallah host feeds Tuvia like a mother.
- **Tuvia is roasted too.** He is gluttonous, grumpy, vain about his books and terrified of kale. The joke is on him at least as often as on others.
- **Original text only.** Every line is written fresh "in his style". No passages copied from his books. Short nods and references for fans are welcome (Tobi the German, the red glasses, Isi, "I'm just a simple journalist").
- **Public-figure parodies:** slightly altered names. Mocked only for public positions, speeches and habits (a politician who never stops talking, a minister who poses for cameras). No invented crimes, nothing sexual, nothing degrading about bodies or family. Full list in §6.4, subject to user approval.

### 1.4 Tuvia's voice: writing rules for every line he says
- **Short sentences. Very short.** "אני עייף. אני רעב. אני רוצה עוגה."
- **Mock-naive tone.** He presents himself as a simple person who doesn't understand: "אני לא מבין בפוליטיקה. אני רק עיתונאי פשוט."
- **Repetition for comic effect**: "הוא אומר שזה טבעוני. הוא אומר שזה אורגני. הוא אומר שזה בריא. אני אומר שזה עשב."
- **Direct address to the reader**: "תגידו לי אתם, קוראים יקרים: מי אוכל טופו בשבת?"
- **Food in every paragraph.** Even in the deepest political conversation, the camera cuts to the plate.
- **Sudden one-word verdicts**: "מעניין." / "אני אוהב את האיש הזה." / "לא." / "נו."
- **Yiddish when emotional**: "אוי, מאמע'לה, קוגל!" / "א שאנד" / "נו, שוין."
- **German when undercover**: "Ja, ja. Sehr gut. Wo ist der Kuchen?"

---

## 2. Tuvia — the character

### 2.1 Bio (game version, based on the real persona)
- Grew up **Haredi in Bnei Brak**, son of a rabbi, left for New York. Runs a theater there. Married to **Isi**.
- Writes books where he travels and talks to everyone, from right-wing to left-wing, Jews and Arabs, Germans and Brits, and reports what they said (and ate).
- To him, Bnei Brak food is **childhood**. That is the emotional core of the "Haredi food = good" rule. It's not politics. It's his mother's kitchen.

### 2.2 The four traits → four mechanics

| Trait | Mechanic | Where it appears |
|---|---|---|
| **Innocent provocateur** | 🎤 **"שאלה תמימה"**: dialogue options marked with a halo icon 😇. They look innocent and blow up the conversation, earning 📖 book pages | Every conversation |
| **Food-obsessed** | 🍲 **Mood meter**: every food changes it, and every food gets a Tuvia verdict | Every encounter |
| **Fake identities** | 🎭 **Disguises**: choose an identity before an encounter, and NPCs react differently | From chapter 2 onward |
| **Grumpy inner monologue** | 💭 **Aside bubbles**: thought bubbles in a different style (grey, cloud-shaped, handwritten font) that only the player sees | Constantly, including during gameplay in the arcade prototypes |

### 2.3 Visual spec (caricature)
> Based on the user's reference photo, **`reference/tuvia.png`** (committed to the repo at the user's request). **Every session, local or cloud, should open the photo before drawing Tuvia.** It is a drawing reference only: the game shows the SVG caricature and never embeds the photo itself.

**The look (from the photo):**

| Feature | Spec | Caricature exaggeration |
|---|---|---|
| **Head/face** | Big, round, clean-shaven face, full cheeks with a rosy flush, small double chin | Head ≈ 40% of body height, a near-perfect circle, pink cheek blush circles |
| **Hair** | Short, light sandy-blond / straw-colored, combed up and back, slightly tousled, a little thin on top | A soft blond tuft swept up and back like a small wave. Color `#D9C48A` with lighter highlights |
| **Glasses ★** | **Round frames, bold red / red-tortoise rims** (dark inner edge) | **The #1 identifier.** Oversized perfect circles, thick bright red rim `#C0262D` with a dark-brown inner line. Never removed, not even in disguise |
| **Expression** | Gentle, knowing half-smile, one side of the mouth slightly up, eyes amused and slightly narrowed | Default face = the "I know something you don't" smirk |
| **Shirt** | Blue-and-white **vertical pinstripe** button-down, collar open with a navy collar band, **sleeves rolled up** to the elbow | Bold navy/white stripes (`#2B3A67` on white), rolled cuffs as two puffy rings |
| **Suspenders ★** | **Mint / sage-green elastic suspenders** with silver metal clips | **The #2 identifier.** Wide mint straps `#7FBF9F` with shiny silver clips, always visible |
| **Trousers** | Dark navy/black | Short and simple |
| **Build** | Stocky, round belly, broad shoulders | Pear/egg-shaped torso, the suspenders curving around the belly |
| **Accessories** | Gold wedding ring, brown leather strap watch (left wrist), thin gold chain bracelet (right wrist) | Ring and watch visible in the "thinking" pose. The ring is a nod to Isi: it glints when she calls |
| **Signature pose** | **Chin resting on fist, elbow on the table**, leaning in, listening | **The default "interview" pose.** Used whenever an NPC speaks: Tuvia listens with chin on fist, smirking. This *is* the innocent-provocateur trait in one image |

**Rules:**
- **Caricature, drawn as SVG** (inline or `.svg` files), built from simple shapes: big round head, stocky egg-shaped body, expressive eyebrows above the red glasses.
- **Fixed signature props**, always on screen: **red round glasses + mint suspenders + pinstripe shirt**. Add **a small notebook + pen** in hand (or in the shirt pocket) and often a **can of cola zero**.
- **No hat.** Tuvia is bare-headed, with blond hair. Hats appear only as **disguise props** (see §2.4), and that is part of the joke.
- **Name tag**: Tuvia's name is shown on screen consistently (HUD title "טוביה", speaker label in dialogues).
- **NPCs never share his silhouette.** No other character has red round glasses, mint suspenders or a blue pinstripe shirt. The combination is reserved for Tuvia.
- **Expression set** (minimum 8):
  - smirk (default, chin on fist) 😏
  - suspicious 🤨 (one eyebrow over the red rim)
  - delighted 🤤 (food; glasses fog up with steam)
  - disgusted 🤢 (kale; cheeks turn green)
  - shocked 😱 (glasses jump off the nose)
  - writing ✍️ (looks down at the notebook)
  - sleepy 😴
  - disguised 🎭 (one variant per disguise)
- **Animation ideas:** suspenders "snap" when he gets excited about food, belly bounces when he laughs, glasses glint on a jackpot quote.

### 2.4 Disguises (🎭)

| Disguise | Hebrew label | Look | Effect |
|---|---|---|---|
| **Tuvia** (himself) | טוביה, עיתונאי מניו יורק | Default | Neutral. Israelis are suspicious of "the American journalist" |
| **Tobi the German** | טובי הגרמני | + green Tyrolean hat with a feather on top of the blond hair, lederhosen straps clipped over his own suspenders, says "Ja" | Europeans, NGO staff and some Ramallah officials open up completely ("finally someone who understands"). Settlers and Haredim get nervous, but feed him anyway |
| **The boy from Bnei Brak** | טוביה מבני ברק | + a black velvet kippah and a black hat that's too small for his head, a black jacket over the pinstripes (the mint suspenders peek out: "you're not fooling anyone") | Haredim give a double portion and ask who his father is. Tel Aviv activists get very worried |
| **Just a guest** | אורח פשוט | Napkin tucked into the collar, fork in hand | Hospitality boost everywhere, but fewer revealing quotes (people are polite to guests) |

Rules:
- Disguise is chosen at each encounter start (novel/mix) or by a quick-swap key (walker/catcher).
- **The wrong disguise in the wrong place is a joke, not a punishment**: "טובי הגרמני" at a Knesset session gets mistaken for an EU delegation and is served the VIP vegan buffet. Mood −15, book pages +3.
- Each NPC has 1–2 lines per disguise. At least one of them is a "jackpot" quote worth a lot of book pages.

---

## 3. Core systems

All prototypes implement these three meters, each in its own way.

### 3.1 🍲 Mood (מצב רוח), 0–100
- Starts at **60** ("עייף מהטיסה, אבל עם תקווה").
- **0 → ending "חזרה לניו יורק בכעס"**, unless an emergency cola zero can is in inventory (one-time save).
- Visual: Tuvia's face in the HUD changes across 5 bands:
  - 0–19: 😫 "אני הולך הביתה."
  - 20–39: 😒 "מישהו פה מכיר את המושג 'בשר'?"
  - 40–59: 😐 "נו."
  - 60–79: 🙂 "מעניין."
  - 80–100: 🤤 "אני אוהב את המדינה הזאת."
- Mood also **multiplies book pages**: a happy Tuvia writes better. Pages earned × (0.5 at mood <20, 1 normally, 1.5 at mood ≥80).
- **Mood drifts down slowly** over time ("רעב"), about −1 per 20 sec in arcade modes, and −2 per dialogue scene with no food offered.

### 3.2 📖 Book pages (עמודים לספר)
- Earned from quotes. Every innocent-question jackpot, disguise jackpot or revealing confession = pages.
- Each quote is saved to the **Notebook** (פנקס), a screen where the player can read all collected quotes with Tuvia's handwritten margin comments. **This is the collectible gallery and the main replay hook.**
- Target: **300 pages = a book.** At 300+ the publisher calls: "טוביה, זה רב-מכר!"
- Typical chapter yields 30–60 pages.

### 3.3 🥄 Cholent clues (רמזים לצ'ולנט המושלם)
Tuvia's secret quest: his mother's legendary cholent. Every chapter hides **one ingredient**, and every ingredient comes from someone you'd never expect. This is the sympathetic heart of the game: **the perfect cholent needs everybody.**

| # | Chapter | Ingredient | From whom | Tuvia's reaction |
|---|---|---|---|---|
| 1 | Ben Gurion | **The pot** (הסיר) | The security officer who confiscated it | "הוא חשב שזה פצצה. הוא צדק. זה פצצת קלוריות." |
| 2 | Tel Aviv | **The barley** (גריסים) | Noa's grandmother's recipe card, hidden in Noa's vegan cookbook | "גם לשמאל יש סבתא. מעניין." |
| 3 | Settlement | **The beans** (שעועית), organic, unfortunately | Tzofia's garden | "אורגני. נו, שוין. גם שעועית צריכה אידיאולוגיה." |
| 4 | Bnei Brak | **The kishke** (קישקע) | Rebbetzin Gittel, after 3 rounds of questioning about his father | "היא שאלה אותי על אבא שלי. ואז נתנה לי קישקע. זה המשפט העברי." |
| 5 | Ramallah | **The spice** (בהרט) | Abu Samir, the host | "הסוד של הצ'ולנט היהודי המושלם נמצא ברמאללה. אל תספרו לאף אחד." |
| 6 | Knesset | **The slow fire** (האש הקטנה) | The Knesset itself: "פה שום דבר לא נגמר. הכל מתבשל לאט." | "סוף סוף, משהו שהכנסת יודעת לעשות." |
| 7 | Berlin | **The potatoes** (תפוחי אדמה) | Hans's grandmother's farm | "תפוחי אדמה גרמניים. בצ'ולנט יהודי. זה תיקון עולם." |

- Ingredients are **missable**. Each needs either a correct disguise, a correct innocent question, or eating the NPC's (bad) food without complaining. *Sometimes Tuvia must suffer quinoa for the greater cholent.*
- 7/7 ingredients → perfect cholent at the finale.

### 3.4 Inventory (small)
- 🥤 **Coke Zero cans**: emergency mood +20 (max 3). Haredim give them out freely.
- 🍬 **Rugelach**: +8, quick snack.
- 📱 **Isi's phone call**: once per chapter. Isi gives a hint (which disguise to use here) and a dry comment. Calling her in every chapter is part of the secret ending.

### 3.5 Save
`localStorage` (wrapped in try/catch): current chapter, meters, notebook quotes, ingredients, endings seen. Endings-seen gallery on the title screen.

---

## 4. Food catalog

Effect = mood change. Every food has a **Tuvia verdict line**, shown when eaten. Prototypes may add foods but must keep these.

### 4.1 🟢 Good food: Ashkenazi heaven

| Food | Hebrew | Emoji/art | Mood | Tuvia's verdict |
|---|---|---|---|---|
| Cholent | צ'ולנט | 🍲 | +25 | "זה לא אוכל. זה זיכרון." |
| Kugel Yerushalmi | קוגל ירושלמי | 🟫 (caramel-brown wedge, peppery) | +20 | "מתוק. חריף. דביק. כמו המדינה הזאת." |
| Potato kugel | קוגל תפוחי אדמה | 🥔 | +15 | "אני לא צריך פסיכולוג. אני צריך עוד חתיכה." |
| Gefilte fish + chrein | גפילטע פיש עם חריין | 🐟 + 🟣 | +18 | "הדג הזה לא שחה אף פעם. וזה בסדר." |
| Kishke | קישקע | 🌭 (orange) | +18 | "אל תשאלו מה יש בפנים. אני עיתונאי, ואפילו אני לא שואל." |
| Herring | הערינג | 🐟 (silver) | +12 | "דג מלוח עם וודקה בקידוש של עשר בבוקר. ככה בונים אומה." |
| P'tcha | פיטשה | 🟨 (jiggly) | +5 (+20 for "the boy from Bnei Brak") | "רק מי שגדל בבני ברק מבין את הג'לי הזה. אני מבין." |
| Kreplach | קרעפלאך | 🥟 | +12 | "כיסונים. אבל עם נשמה." |
| Chopped liver | כבד קצוץ | 🟤 | +14 | "מה אני, כבד קצוץ? כן. היום אני כבד קצוץ." |
| Rugelach | רוגעלך | 🥐 | +8 | "שוקולד. בצק. זהו. מה עוד צריך." |
| Babka | בבקה | 🍫🍞 | +12 | "בבקה זה כמו פוליטיקה ישראלית: שכבות על שכבות, הכל דביק, ובסוף אתה רוצה עוד." |
| Lokshen kugel | לוקשן קוגל | 🍝 | +14 | "אטריות מתוקות. רק יהודים חשבו על זה. ובצדק." |
| Schnitzel (Knesset cafeteria) | שניצל | 🍗 | +10 | "גם השניצל פה עבר בקריאה ראשונה, שנייה ושלישית." |
| **Coke Zero** | קולה זירו | 🥤 | +10 | "זירו. אפס. בדיוק כמו הסיכוי לשלום. אבל טעים." |
| Black coffee + cake (anywhere) | קפה ועוגה | ☕🍰 | +10 | "קפה ועוגה. התנאי היחיד שלי לראיון." |

### 4.2 🔴 Bad food: the health-food nightmare

| Food | Hebrew | Mood | Tuvia's verdict |
|---|---|---|---|
| Quinoa | קינואה | −15 | "קינואה. גרגירים קטנים של חרטה." |
| Kale salad | סלט קייל | −18 | "זה לא סלט. זה גדר." |
| Spelt bread | לחם כוסמין | −10 | "לחם שעושה לך טובה שהוא קיים." |
| Goat yogurt | יוגורט עיזים | −10 | "פגשתי את העז. היא נראתה מאוכזבת. גם אני." |
| Herbal tea | חליטת צמחים | −8 | "מים חמים עם עלה. בניו יורק זה עולה תשעה דולר. פה זה חינם. גם זה יותר מדי." |
| Chia pudding | פודינג צ'יה | −12 | "זה מסתכל עליי." |
| Tofu | טופו | −14 | "טופו זה כמו נציג של האו״ם: אין לו טעם משלו, והוא לוקח את הטעם של מי שמממן אותו." |
| Oat-milk latte | לאטה חלב שיבולת שועל | −8 | "סוס היה שמח. אני לא סוס." |
| Sprouted lentils | נבטי עדשים | −12 | "הם עדיין חיים. אני רואה אותם זזים." |
| EU vegan canapés | קנאפה טבעונית של האיחוד האירופי | −15 | "ממומן על ידי האיחוד האירופי. בטעם של מסמך עמדה." |
| Smoothie bowl | סמוּתי בול | −10 | "קערה. בתוכה: סמוּתי. למה. למה בקערה." |
| Gluten-free cholent (the cursed item) | צ'ולנט ללא גלוטן | −30 | "יש גבול. יש. גבול." *(triggers a special shocked animation)* |

### 4.3 🟡 Location twists: neither Ashkenazi nor health food
| Food | Where | Mood | Verdict |
|---|---|---|---|
| Knafeh | Ramallah | +18 | "אם הייתי ראש ממשלה, הייתי חותם על הסכם רק בשביל הכנאפה." |
| Maqluba | Ramallah | +20 | "הם הופכים את הסיר על השולחן. דרמה. אוכל. אני אוהב את זה." |
| Cardamom coffee | Ramallah | +10 | "הקפה פה חזק יותר מכל הצהרה של האו״ם." |
| Hummus with a lecture | Tel Aviv | +5 / −10 | "החומוס היה טוב. ההרצאה על החומוס פחות." |
| Bratwurst | Berlin | ⚠️ Not kosher → special choice | "טובי הגרמני היה אוכל את זה. טוביה מבני ברק... לא." *(choice: eat as Tobi, mood +5 and pages +5, then Isi calls: "טוביה. ראיתי."; or decline, mood −5 and a Hans quote)* |
| Kaffee und Kuchen | Berlin | +15 | "בדבר אחד הגרמנים צודקים: בארבע אחר הצהריים צריך עוגה." |
| Apfelstrudel | Berlin | +16 | "סבתא של הנס. גם לה יש סבתא. כולם עם סבתא." |
| Settlement shakshuka | Settlement | +12 | "סוף סוף. משהו שלא צמח על שיח." *(the settlers' one redemption)* |

---

## 5. Chapters & encounters

**Structure:** 8 chapters, ~4–7 minutes each, 2–4 encounters per chapter, so ~30 minutes total. Every chapter has: a **title card** in Tuvia's handwriting, an **establishing shot** with location music, an **Isi call** slot, at least **one innocent-question jackpot**, **one disguise jackpot**, **one ingredient** and **one human moment**.

Order (the walker/mix prototypes may let players choose the order of chapters 2–7, but the finale is always last):

### Chapter 1 — נמל התעופה בן גוריון: "סיבת ביקור?"
- **Setting:** arrivals hall, security booth, a duty-free full of chocolate.
- **Music:** neutral airport muzak that turns into klezmer when Tuvia smells a bakery.
- **NPCs:**
  - **שירה, the security officer.** 22 years old, deadpan, has seen everything.
  - **A taxi driver, Moshe**, who explains the entire Middle East in 40 minutes and charges for 70.
- **Tutorial:** introduces meters, innocent questions and the notebook.
- **Sample dialogue:**
  > **שירה:** סיבת הביקור?
  > 😇 **טוביה (שאלה תמימה):** אני כותב ספר על מי צודק במזרח התיכון.
  > **שירה:** *(מסתכלת עליו דקה שלמה)* ...תעבור לחדר הצדדי.
  > 💭 *טוביה:* שלוש שעות בחדר הצדדי. הם לקחו לי את הסיר. אני לא כועס. הם עושים את העבודה שלהם. אבל הסיר.
- **Taxi (Moshe):**
  > **משה:** תקשיב לי, אני אסביר לך את כל הבעיה. הכל התחיל ב-1948. לא, 1967. לא, רגע, אברהם אבינו.
  > 💭 *טוביה:* המונה מראה 200 שקל. אנחנו עוד באברהם אבינו.
- **Ingredient:** the pot. Shira gives it back at the end ("קח. זה מריח כמו של סבתא שלי.") if Tuvia answers honestly instead of using a disguise. **Human moment.**

### Chapter 2 — תל אביב: "קפה עם שיבולת שועל ותודעה"
- **Setting:** Rothschild Boulevard cafe, an NGO office decorated with EU flags, a beach.
- **Music:** chill lounge/electro beat with a pretentious saxophone.
- **NPCs:**
  - **נועה**, coordinator at an NGO "for human rights and something". Sincere, overcommitted, funded by four European governments, has never been east of Kfar Saba. **Human moment:** her grandmother's lokshen kugel recipe card, tucked in a vegan cookbook. She never throws it away.
  - **Jonathan Wright**, a **foreign correspondent** who arrived yesterday and has already written the story. He's just looking for a quote to fit.
  - **A Tel Aviv barista** who judges Tuvia for ordering "regular milk".
- **Satire targets:** foreign funding, the activist bubble, journalists who decide the story in advance, Tel Aviv food pretension.
- **Foods:** oat-milk latte, smoothie bowl, tofu, hummus with a lecture, *and, hidden*, Noa's grandmother's kugel.
- **Sample dialogue:**
  > **נועה:** אנחנו עובדים על פרויקט שמעצים קולות מושתקים בשטחים.
  > 😇 **טוביה:** יפה מאוד. מתי היית שם לאחרונה?
  > **נועה:** אה... לא הייתי בדיוק *שם*. אבל עשינו זום.
  > 💭 *טוביה:* זום. הכיבוש בזום. אני רושם.
  > 📖 +12 עמודים
- **Disguise jackpot (Tobi the German):**
  > **נועה:** אוי, מגרמניה! אתם המממנים שלנו! רוצה לראות את הדוח השנתי? הוא מודפס על נייר ממוחזר.
  > 💭 *טוביה:* היא נתנה לי שמונה עשרה עמודים. בגרמנית. גם המממן לא קורא את זה.
- **Jonathan Wright:**
  > **ג'ונתן:** I just need one Israeli to say something terrible. Then I can go back to the hotel.
  > 😇 **טוביה:** אתה רוצה שאני אגיד משהו נורא?
  > **ג'ונתן:** Would you? That'd be great.
  > **טוביה:** הלאטה פה נוראי.
  > **ג'ונתן:** *(writing)* "Local man describes situation as terrible."
- **Ingredient:** barley, from the recipe card. Requires asking Noa "מה סבתא שלך הייתה מבשלת?" instead of arguing.

### Chapter 3 — גבעה בשומרון: "גלוטן, גאולה וגדר"
- **Setting:** a hilltop settlement. Caravans, a breathtaking view, goats, a yoga deck, an organic farm and a hand-painted sign: "ברוכים הבאים! (בלי גלוטן)".
- **Music:** **Balkan brass**, fast 7/8 rhythm, joyful and slightly chaotic (the hilltop people dance).
- **NPCs:**
  - **אלישיב**, a long-bearded idealist and organic farmer. Hugs everyone, talks about the Redemption and about fermentation with equal passion. **Human moment:** gives his own coat to Tuvia when it gets cold at night, and to an Arab shepherd passing by, without making a speech about it.
  - **צופיה**, Elyashiv's wife. Runs a goat-cheese and spelt bakery, has 9 children and a podcast. Feeds everyone. Everything she serves is extremely healthy. Tuvia suffers most here.
  - **The goat (העז)**, a recurring silent character who appears disappointed in everyone.
  - **A teenage hilltop youth, נריה**, who explains geopolitics using a guitar.
- **Satire targets:** wellness-messianism, lecturing guests, the contradiction between "simple life" and an expensive organic lifestyle, the media ignoring them and them ignoring the media.
- **Foods:** quinoa, kale, spelt bread, goat yogurt, chia, sprouted lentils, herbal tea; **the one redemption is the shakshuka.**
- **Sample dialogue:**
  > **צופיה:** טוביה, תאכל! זה קינואה מהגבעה, נבטים מהגינה, וגבינה מהעז שאתה רואה שם.
  > 💭 *טוביה:* העז מסתכלת עליי. אני מסתכל על העז. שנינו יודעים את האמת.
  > 😇 **טוביה:** ומה אוכלים פה בשבת? צ'ולנט?
  > **צופיה:** בטח! צ'ולנט קינואה ללא גלוטן, עם עדשים מונבטות!
  > 💥 **[GLUTEN-FREE CHOLENT event]** → Mood −30. Tuvia freezes. Screen shakes.
  > 💭 *טוביה:* קוראים יקרים. ראיתי דברים בחיים. ראיתי את ברלין. ראיתי את הקונגרס האמריקאי. אבל זה. זה.
- **Innocent-question jackpot:**
  > 😇 **טוביה:** ומה עם הערבים מהכפר ממול? גם הם אוכלים בלי גלוטן?
  > **אלישיב:** *(long silence)* ...אתה יודע מה, פעם הם הביאו לנו פיתות. היו מעולות. עם גלוטן.
  > 💭 *טוביה:* פעם ראשונה שמישהו פה אמר משהו טוב על גלוטן. אני רושם.
  > 📖 +15
- **Disguise jackpot (the boy from Bnei Brak):** Elyashiv tries to recruit him to "build a yeshiva on the next hill" and offers a caravan. Tuvia: "יש שם צ'ולנט?" "...נבנה."
- **Ingredient:** organic beans from Tzofia's garden. Requires eating one full plate of quinoa without complaining (the player chooses "תודה, טעים מאוד" while the 💭 bubble screams).

### Chapter 4 — בני ברק / מאה שערים: "הביתה"
- **Setting:** narrow streets, wall posters (pashkevilim), a shtiebel, a Kiddush in a packed apartment, a bakery at 2 AM.
- **Music:** **klezmer.** Clarinet in freygish mode, a fiddle, accelerating dance tempo. This is Tuvia's emotional home; music swells when he smells food.
- **NPCs:**
  - **הרבנית גיטל**, 80 years old, small, terrifying, the best cook in the city. Interrogates Tuvia about his father, his yichus and why he's not married to a nice girl from here ("I'm married, to Isi." "Isi? Is she from a good family?"). **Human moment:** she remembers Tuvia's mother. She says nothing about it, just puts another piece of kugel on his plate.
  - **ר' שמערל**, a Kiddush regular with seven bottles of vodka and an opinion on everything. Sells kosher cell phones and owns a secret iPhone.
  - **יענקי**, 19, yeshiva student, asks Tuvia shyly what New York is like. Wants to see the world.
  - **The gabbai** who counts the minyan and always gets 9.
- **Satire targets:** draft avoidance, kosher-phone hypocrisy, the poster wars between sects, gossip as a governing system, poverty with 12 kids, community control. **But also** warmth, generosity and the happiest people in the game.
- **Foods:** EVERYTHING good. Cholent, kugel yerushalmi, gefilte fish, kishke, herring + vodka, p'tcha, rugelach, Coke Zero by the crate. Mood can exceed 100 here (cap 120 temporarily, "שיכור מקוגל").
- **Sample dialogue:**
  > **הרבנית גיטל:** אתה הבן של מי?
  > **טוביה:** של הרב טננבוים.
  > **הרבנית גיטל:** *(מצמצמת עיניים)* ...איזה טננבוים?
  > 💭 *טוביה:* אני בן שישים ומשהו. כתבתי ספרים שתורגמו לעשר שפות. ואני עדיין צריך להוכיח מי אבא שלי.
  > **הרבנית גיטל:** תאכל קוגל. אתה רזה.
  > 💭 *טוביה:* אף אחד בעולם לא אמר לי שאני רזה כבר ארבעים שנה. אני אוהב את האישה הזאת.
- **Innocent-question jackpot (army):**
  > 😇 **טוביה:** ר' שמערל, למה הבחורים פה לא הולכים לצבא?
  > **ר' שמערל:** אנחנו מגינים על המדינה בדרך שלנו! בתורה!
  > 😇 **טוביה:** ומי מגן על התורה?
  > **ר' שמערל:** *(מוזג וודקה)* לחיים!
  > 💭 *טוביה:* זו לא תשובה. אבל זו וודקה טובה.
  > 📖 +14
- **Kosher phone joke:**
  > **ר' שמערל:** זה טלפון כשר! אין אינטרנט, אין כלום!
  > *(the phone rings with a TikTok sound)*
  > **ר' שמערל:** ...זה הטלפון של אשתי.
- **Human moment (Yanky):**
  > **יענקי:** בניו יורק... יש שם הרבה ספריות?
  > 💭 *טוביה:* פעם הייתי הוא. בדיוק הוא. אני לא אומר לו כלום. אני רק נותן לו את העט שלי.
- **Ingredient:** kishke from Rebbetzin Gittel. Requires the "boy from Bnei Brak" disguise or answering her interrogation 3 times correctly (a mini-quiz on Haredi life the fans will enjoy).

### Chapter 5 — רמאללה: "הכנסת אורחים ממומנת"
- **Setting:** Ramallah streets, a fancy new cafe, a PA ministry office with an EU plaque, the home of Abu Samir.
- **Music:** **maqam hijaz**, oud-like plucked synth, darbuka rhythm (maqsum).
- **NPCs:**
  - **אבו סמיר**, the host. Big man, enormous heart, feeds Tuvia like a mother, refuses to let him leave without three more plates. **Human moment:** shows photos of his grandchildren and says "I just want them to have a normal life."
  - **ד"ר עמאר**, a PA official with an EU-funded office and an Italian espresso machine. Speaks in press-release sentences.
  - **Sophie from Brussels**, a European volunteer who is "more Palestinian than the Palestinians", wears a keffiyeh she bought online and corrects Abu Samir's opinions about his own life.
- **Satire targets:** the European aid industry, officials who live off the conflict, Western activists who speak *for* people instead of listening, Tuvia's own fear (he arrives terrified and leaves overfed).
- **Foods:** maqluba, knafeh, cardamom coffee, endless plates. Mood soars. Tuvia is confused because the food rules don't apply here: "זה לא אשכנזי. זה לא בריא. זה... פשוט טוב. אני צריך לחשוב על זה."
- **Disguise jackpot (Tobi the German):**
  > **ד"ר עמאר:** אה, גרמניה! חברים יקרים! רוצה לראות את בית הספר שבניתם? זה פה. וגם שם. ובעצם זה אותו בית ספר, צילמנו אותו פעמיים.
  > 💭 *טוביה:* בית ספר אחד. שני דוחות. אני רושם.
  > 📖 +16
- **Sophie scene:**
  > **סופי:** אבו סמיר, אתה בעצם מתכוון לומר שאתה מדוכא.
  > **אבו סמיר:** אני מתכוון לומר שהכנאפה מתקררת.
  > 💭 *טוביה:* אני בצד של אבו סמיר. ושל הכנאפה.
- **Ingredient:** baharat from Abu Samir. Requires accepting a third plate ("אני לא יכול לסרב. זה יהיה גס רוח. זה הכל בשביל הספר.").
- **Sensitivity note:** Ramallah characters get the same treatment as everyone: the officials and foreign activists are satirized, the regular people are warm and human. No jokes about violence or terror victims, anywhere.

### Chapter 6 — הכנסת: "ישיבה שלא נגמרת"
- **Setting:** the plenum, a committee room, **the Knesset cafeteria**, the hallway where MKs chase cameras.
- **Music:** **pompous march.** Brass, timpani and a trombone that occasionally slides off key (fart-trombone moments when someone says "בשם העם").
- **NPCs:** parody MKs (see §6.4), **the cafeteria lady אסתר** who has seen 15 governments fall and has the best schnitzel in Jerusalem, and **an MK's spokesperson** who answers every question with "נבדוק ונחזור אליך".
- **Satire targets:** everyone shouting and nobody listening, coalition crises, MKs who live for the camera, endless meetings, all sides equally.
- **Gameplay twist:** in the plenum, every NPC's line is interrupted by another NPC. The player must "catch" a full sentence (a timed tap in arcade modes; a "wait…" option in novel mode) to collect quotes.
- **Sample:**
  > **ח"כ א':** אדוני היושב ראש, אני רוצה לומר—
  > **ח"כ ב':** בושה! בושה!
  > **ח"כ א':** —שהעם—
  > **ח"כ ג':** קריאת ביניים!
  > 💭 *טוביה:* אני פה שלוש שעות. שמעתי חצי משפט. גם הוא היה "בושה".
  > **אסתר (קפיטריה):** שניצל, חמוד?
  > 💭 *טוביה:* הדבר היחיד שעבר פה פה אחד.
- **Ingredient:** "the slow fire". After Tuvia observes 3 ridiculous delays, Esther explains: "פה שום דבר לא נגמר, מאמי. הכל מתבשל לאט. כמו צ'ולנט." **Human moment:** she's quietly been feeding the cleaning staff for free for 20 years.

### Chapter 7 — ברלין / בריסל: "טובי חוזר הביתה"
- **Setting:** Berlin Christmas-market-style square (or a beer garden in summer), an EU office in Brussels with 400 flags, a "Jewish culture" event with no Jews in it.
- **Music:** **German oom-pah / folk.** Tuba, accordion, 3/4 Ländler or 2/4 polka. It speeds up and gets silly as Tuvia drinks more Kaffee.
- **NPCs:**
  - **הנס**, an EU official, sincere and anxious, an expert on Israel who has never been there. Knows everything about "the Jewish people" from seminars. **Human moment:** his grandfather. He doesn't know how to say it. Tuvia doesn't make him. They eat Apfelstrudel in silence.
  - **Frau Müller**, a pensioner at a "Jewish culture week" who keeps telling Tuvia how much she loves Jews, and asks him to say something in Yiddish "like in the movies".
  - **A Klezmer band of Germans** with no Jews in it, playing at the event. Tuvia: "הם מנגנים את המוזיקה של סבא שלי. יותר טוב מסבא שלי. אני לא יודע מה להרגיש."
- **Satire targets:** European obsession with Israel, "loving dead Jews" vs. living ones, EU bureaucracy, guilt and sanctimony together.
- **Foods:** Kaffee und Kuchen (good), Apfelstrudel (good), **bratwurst dilemma** (see §4.3), EU vegan canapés (bad).
- **Disguise:** Tobi the German is native here. Everyone opens up. As himself, Tuvia gets lectured about Israel for 20 minutes by people who have never been.
- **Sample:**
  > **הנס:** Herr Tenenbom, we in the EU are very balanced. We criticize Israel on Monday, Tuesday, Wednesday, Thursday and Friday.
  > 😇 **טוביה:** ובשבת?
  > **הנס:** On Saturday we rest. We are not monsters.
  > 📖 +13
- **Ingredient:** potatoes from Hans's grandmother's farm, after the strudel scene, and only if Tuvia **doesn't** press him with a "gotcha" question (the player must *choose kindness over a quote*: a deliberate choice, fewer pages, more heart).

### Chapter 8 — הפינאלה: "שולחן שבת"
- **Setting:** a giant Shabbat table in Jerusalem. Everyone Tuvia met is invited, everyone shows up, and everyone is uncomfortable.
- **Music:** a **medley.** Each guest's theme fades in as they arrive, then all themes merge into one big klezmer-Balkan-oom-pah-maqam mashup. This is a showcase moment for the audio system.
- **Gameplay:**
  - Seating chart puzzle (novel/mix): place guests so nobody fights. Elyashiv next to Noa → fight. Hans next to Rebbetzin Gittel → she interrogates him about his father. Abu Samir next to anyone → he feeds them and peace breaks out. *There is no perfect solution; the funniest one is valid.*
  - Catcher/walker: final "Shabbat rush" level (see §9).
- **The cholent reveal:** if 7/7 ingredients, Tuvia lifts the lid. Golden light. Choir. Everyone tastes. Silence.
  > **אלישיב:** ...זה לא אורגני.
  > **נועה:** ...זה לא טבעוני.
  > **הנס:** ...זה לא מאוזן.
  > **אבו סמיר:** ...צריך עוד בהרט.
  > **הרבנית גיטל:** ...זה כמו של אמא שלך.
  > 💭 *טוביה:* כולם התלוננו. כולם לקחו עוד צלחת. זה הספר. זה כל הספר.

---

## 6. Cast

### 6.1 Isi (איזי)
- Tuvia's wife, in New York. Appears **only via phone calls** (a phone UI slides in) and in the endings.
- Personality: dry, smart, unimpressed, loves him. Comments mostly on his diet and his ego.
- Sample calls:
  - "טוביה. אכלת ירקות היום?" / "...קישקע זה ירק?" / "לא." / "אז לא."
  - "קראתי את הטיוטה. יותר מדי קוגל, פחות מדי ציונות." / "זה אותו דבר."
  - (Berlin) "תזהר. כשאתה טובי הגרמני אתה נהיה נחמד מדי."
  - (Settlement) "הם הגישו לך קינואה? אני יודעת. שמעתי את האנחה שלך מניו יורק."
- Each call gives one gameplay hint (which disguise works here, where an ingredient is).

### 6.2 Recurring characters
- **העז (the goat):** appears in every chapter in the background, silently disappointed. Even in Berlin. Even in the Knesset. A running gag and an easter egg ("find the goat": 8/8 → secret notebook page).
- **Moshe the taxi driver:** drives Tuvia between chapters. His Middle East explanation continues across all 8 chapters and finally reaches 2025 in the finale.

### 6.3 Character sheet (for the art and writing teams)

| Character | Chapter | Silhouette hook | Color | Music motif | Human moment |
|---|---|---|---|---|---|
| שירה | 1 | Ponytail, big sunglasses | Navy | Airport chime | Returns the pot |
| משה | all | Cab + one arm out the window | Yellow | Car horn honk-rhythm | Refuses to take money at the end |
| נועה | 2 | Tote bag, giant glasses, EU pin | Teal | Lounge sax | Grandmother's kugel card |
| ג'ונתן רייט | 2 | Khaki vest, press badge | Beige | Typewriter | (none, the one NPC who never gets one; it's his joke) |
| אלישיב | 3 | Huge beard, knit kippah, sandals | Olive | Balkan trumpet | Gives away his coat |
| צופיה | 3 | Head scarf, baby, ladle | Mustard | Accordion | Insists Tuvia take food for the road |
| נריה | 3 | Guitar, peyot to the shoulders | Orange | Off-key guitar | Wants to be a musician, not a prophet |
| הרבנית גיטל | 4 | Tiny, wig, giant pot | Burgundy | Clarinet trill | Remembers Tuvia's mother |
| ר' שמערל | 4 | Big belly, vodka, two phones | Black/gold | Fiddle | Hosts 40 people every Shabbat |
| יענקי | 4 | Thin, oversized suit | Grey | Soft clarinet | Gets Tuvia's pen |
| אבו סמיר | 5 | Huge, apron, tray | Warm red | Oud | Grandchildren photos |
| ד"ר עמאר | 5 | Suit, EU-flag mug | Blue | Synth jingle | (sincerely loves his espresso machine) |
| סופי | 5 | Keffiyeh, laptop with stickers | Lavender | Ukulele | Admits she misses her mom |
| אסתר | 6 | Hairnet, tongs | Pink | Cafeteria bell | Feeds the cleaners |
| הנס | 7 | Lanyard, briefcase, sad mustache | Grey-blue | Tuba | His grandfather |
| פראו מילר | 7 | Fur hat, Star of David brooch (bought at museum shop) | Lilac | Music box | Lit a candle every year at a synagogue that no longer exists |

### 6.4 Public-figure parodies (Knesset & media). ⚠️ User to approve
Altered names, recognizable but clearly parody. Mocked only for public style and positions. All sides of the political map get the same treatment. Proposed:
- **"ראש הממשלה בּוּבּי"**: speaks only in English-language TV clips, holds a diagram of a bomb for every topic, including the cafeteria menu.
- **"ח"כ בן-גבירול"**: arrives with 30 cameras to "storm" the Knesset cafeteria.
- **"ח"כ יאיר לפידות"**: speaks in long philosophical Facebook posts out loud, ends each with a dramatic pause.
- **"ח"כ גפני-גפן"**: a Haredi MK who negotiates the cafeteria budget in exchange for kugel funding.
- **"ח"כ ההיא מהאופוזיציה"**: an opposition MK who interrupts everyone. Her catchphrase: "בושה!"
- **"גדעון לוי-לוי"**: a journalist who writes the same column every week. Tuvia notices it's literally the same text.
- **"מר טראמפלבוים"**: a cameo on TV in the Knesset cafeteria, saying "the greatest cholent, everybody says so".

Rule: if the user prefers lower risk, swap all of these for invented MKs (ח"כ א', ב', ג') with the same jokes. The jokes don't depend on the names.

---

## 7. Endings

Checked in this order at the finale (or immediately for the huff ending):

| # | Ending | Condition | Content |
|---|---|---|---|
| 1 | **🥤 חזרה לניו יורק בכעס** | Mood hits 0 at any point (no Coke Zero left) | Tuvia on a plane, angry, eating airline food (also bad). Isi at JFK: "נו?" Tuvia: "קינואה." Isi: "בוא הביתה. הכנתי צ'ולנט." **The funniest failure screen.** Book title: *"ארץ בלי שומן"* |
| 2 | **🥗 סוף האימה: טוביה הבריא** | Reached the finale having eaten ≥8 bad foods "without complaining" (too polite) | Horror-movie parody. Thunder. Tuvia in yoga pants, drinking green smoothie, smiling with dead eyes. "אני מרגיש... קל." Isi screams. The goat smiles for the first time. Book title: *"נבטים: מסע רוחני"*. A dark-red vignette effect |
| 3 | **📘 רב-מכר** | ≥300 pages + 7/7 ingredients + mood ≥40 | The cholent reveal (§5 ch.8). Book launch in Tel Aviv: every character attends and complains about how they were portrayed. Each of them bought 10 copies. Book title: *"צ'ולנט: איך הבנתי את המזרח התיכון דרך הקיבה"* |
| 4 | **📗 ספר בינוני** | ≥300 pages but <7 ingredients | Good book, sad cholent. "הספר הצליח. הצ'ולנט לא. אני לא יודע מה יותר חשוב. אני כן יודע." |
| 5 | **📕 אין ספר** | <300 pages | Publisher calls: "טוביה, יש לך 40 עמודים ו-30 מהם על קוגל." Tuvia: "אלה ה-30 הטובים." |
| ★ | **💌 סוף סודי: הצ'ולנט של איזי** | Called Isi in all 8 chapters + found the goat 8/8 + 7/7 ingredients | Twist: Tuvia flies home. Isi had his mother's real recipe all along. She learned it from his mother decades ago. "למה לא אמרת לי?" "לא שאלת. אתה עיתונאי. אתה שואל את כולם חוץ ממני." Tuvia writes the dedication in his book: "לאיזי. שתמיד ידעה." **The emotional payoff.** |

The endings-seen gallery on the title screen shows locked endings as silhouettes, with a hint ("😶 משהו עם עז...").

---

## 8. Audio direction

**All music and SFX are original and generated in code (Web Audio API).** No samples, no copyrighted tunes. Each style is defined by a scale + rhythm pattern + instrument synth, driven by a tiny step sequencer.

### 8.1 Location themes

| Location | Style | Scale/mode | Rhythm | "Instruments" (synth) | Tempo |
|---|---|---|---|---|---|
| Ben Gurion | Airport muzak → klezmer tease | Major → freygish | 4/4 slow | Soft sine pad, chime | 80 |
| Tel Aviv | Lounge / chill electro | Dorian | 4/4 with a lazy swing | Rhodes-ish FM, soft kick, pretentious sax (filtered saw) | 95 |
| Settlement | **Balkan brass** | Phrygian dominant / minor | **7/8 (2+2+3)** | Bright brass (square + filter env), tapan-like drum | 140 |
| Bnei Brak | **Klezmer** | **Freygish** (Ahava Rabbah): D E♭ F♯ G A B♭ C | 2/4 freylekhs, accelerando | Clarinet (triangle + vibrato + pitch bends "krekhts"), fiddle (saw + vibrato), oom-chuck bass | 120 → 160 |
| Ramallah | Arabic maqam | **Hijaz** (D E♭ F♯ G A B♭ C, played with maqam phrasing; Rast optional with ~quarter-tone detune on E/B) | Maqsum (DUM-tek-tek-DUM-tek) | Oud-like plucked (Karplus-Strong), darbuka (noise + pitched thump), ney-ish breathy sine | 100 |
| Knesset | Pompous march | Major, brassy | 4/4 or 2/4 march | Brass stabs, timpani, snare rolls, **a detuned trombone slide** on cue | 112 |
| Berlin | **German oom-pah / Ländler** | Major | 3/4 (Ländler) or 2/4 (polka) | Tuba (low square), accordion (detuned saws + tremolo), glockenspiel | 120 |
| Finale | Medley → mashup | All, modulating | Switches each 8 bars, then all together | Everything | escalating |

### 8.2 Adaptive music
- Music layer **tilts with mood**: high mood adds instruments; low mood drops to a single sad clarinet / sad tuba / sad oud.
- When Tuvia eats good food: a short **"ta-da" sting** in the local style.
- When he eats bad food: the music **detunes / slows** for 2 seconds (pitch-bend down), then recovers.

### 8.3 SFX list (procedural)
| SFX | Description |
|---|---|
| `burp` | Low noise burst with a pitch-dropping formant. Plays after a good meal |
| `nu` | Synthesized two-formant "nu?" (or a placeholder bleep + bubble text if speech synth sounds bad) |
| `sigh` | Filtered noise swell down. Bad food |
| `crunch` | Short noise bursts. Kale / spelt |
| `slurp` | Cholent |
| `fizz` | Coke Zero can open (noise + high-pass) |
| `scribble` | Pen on paper (filtered noise ticks) when pages are earned |
| `phone` | Old phone ring for Isi |
| `goat` | "Meh", a vibrato square |
| `gasp` | Gluten-free cholent event |
| `page` | Page flip |

### 8.4 Hook for real recordings
All sounds go through `playSfx(name)` / `playMusic(location)`. If a file `audio/<name>.mp3` exists, play it; otherwise use the procedural version. This lets the user drop in voice recordings later.

---

## 9. The four prototypes

All four implement §3 (mood, pages, ingredients), the §4 foods, the §5 chapters (scope per prototype below), Isi calls, disguises, endings and procedural music. **Each branch is fully independent code** (no shared library), so each can take its genre's natural shape.

### 9.1 `novel`: visual-novel interviews
- **Core loop:** location scene (background + characters) → dialogue with choices (regular / 😇 innocent / 🎭 disguise-specific) → food offered (eat / politely eat / refuse, with consequences) → notebook entry → next encounter.
- **Screen layout (mobile-first, RTL):**
  - Top HUD: mood face + bar, 📖 page counter, 🥄 ingredients (7 slots), 📱 Isi.
  - Middle: scene art (SVG characters), Tuvia always bottom-right with live expression changes.
  - Bottom: dialogue box with speaker name tag + typewriter text. Choices as big buttons. 💭 asides appear as floating cloud bubbles beside Tuvia.
- **Unique features:**
  - **Notebook screen** with handwritten font, a quote gallery and Tuvia's margin comments.
  - **Seating chart puzzle** in the finale.
  - Fast-forward / skip read lines (replay value).
- **Content scope:** **all 8 chapters**, full dialogue trees. This prototype is the richest in writing, and the others can borrow its text later if they win.
- **Done =** you can play start → any of the 5+1 endings, all chapters reachable, all meters working, music per location.

### 9.2 `walker`: top-down walk & meet
- **Core loop:** walk Tuvia around a small top-down map of each location → bump into NPCs (speech bubble "!") → short dialogue (2–4 exchanges, same tone) → food items lie around or get offered → find the hidden ingredient and the goat → exit to Moshe's taxi → **world map** to choose the next chapter (2–7 in any order).
- **Maps** (tile-based, drawn with SVG/canvas, about 20×15 tiles each):
  - Tel Aviv: boulevard + cafe + NGO office + beach.
  - Settlement: caravans + goat pen + yoga deck + organic garden + view point.
  - Bnei Brak: alleys + poster walls + shtiebel + Gittel's kitchen + 2 AM bakery.
  - Ramallah: street + cafe + ministry + Abu Samir's house.
  - Knesset: plenum + corridor (dodge MKs chasing cameras) + cafeteria.
  - Berlin: market square + EU office + culture event hall.
- **Controls:** arrow keys / WASD; on mobile, a virtual joystick (bottom-left in LTR terms, i.e. the corner away from the dialogue) + action button. `E`/tap to talk. `Q`/button to swap disguise.
- **Unique features:**
  - NPCs **chase** Tuvia to feed him: settlers with quinoa trays (avoid!), the Rebbetzin with kugel (seek!).
  - Mood drains while walking ("רעב").
  - Ambient 💭 asides trigger when walking past landmarks ("הנוף פה יפה. הייתי מחליף אותו בקוגל.").
- **Content scope:** 7 maps + finale scene; shorter dialogues than `novel`.
- **Done =** walk all maps, meet all NPCs, collect ingredients, reach endings.

### 9.3 `catcher`: arcade food-catcher
- **Core loop:** each chapter = one **arcade level** (~3–4 min) between short comic-strip intro/outro panels with dialogue. Food falls (or is thrown by NPCs at the top of the screen). Tuvia moves left/right holding his plate. **Catch good food, dodge bad food.**
- **Mechanics:**
  - **Catch** good → mood up + combo. **Catch** bad → mood down + Tuvia's 💭 complaint pops up.
  - **Quote bubbles** fall too: catch them for 📖 pages. Some are "😇 jackpots": golden and fast.
  - **Ingredient** appears once per level as a glowing special item, only if a condition is met (e.g. "caught 5 quinoa without complaint" in the settlement, where the level *requires* catching some bad food: politeness meter!).
  - **Disguise swap** (key/button) changes which NPCs throw and what they throw. In Berlin as Tobi, Hans throws strudel; as Tuvia, Hans throws pamphlets.
  - **Level-specific twists:**
    - Tel Aviv: oat lattes zigzag. Jonathan Wright drops "fake quotes" (catching one = −pages).
    - Settlement: Tzofia throws in **7/8 rhythm** with the Balkan music. The goat headbutts the plate.
    - Bnei Brak: **food avalanche**, everything good, mood overflow mode. Coke Zero rain.
    - Ramallah: Abu Samir **refuses to stop**. Overeating risk: a "stomach" meter fills, and if it's full Tuvia becomes slow.
    - Knesset: MKs throw **interruptions** ("בושה!" word blocks) that knock quotes away.
    - Berlin: the bratwurst falls. Catch it or not? (Disguise-dependent consequence.)
    - Finale: **Shabbat rush**. Every character throws their food at once, the music mashup plays, and the perfect cholent descends in slow motion.
- **Controls:** ←/→ or A/D; mobile: drag finger / tilt optional; space or button for disguise.
- **Content scope:** 8 levels + comic panels. Short dialogue, maximum Tuvia asides during play.
- **Done =** all levels playable, difficulty curve, endings via the same meters.

### 9.4 `mix`: story + minigames
- **Core loop:** `novel`-style dialogue scenes (shorter) + **one or two signature minigames per chapter** that come out of the story.
- **Minigames (each 30–90 sec):**

| Chapter | Minigame | Description |
|---|---|---|
| 1 | **"בדיקה ביטחונית"** | Pack Tuvia's suitcase so the X-ray doesn't flag the cholent pot (a Tetris-like puzzle) |
| 1 | **"מונה המונית"** | Moshe's meter runs. Tap to interrupt his history lecture at the right words |
| 2 | **"להזמין קפה בתל אביב"** | Barista order builder. Dodge 14 milk alternatives to get "regular coffee" |
| 2 | **"ציטוט מומצא"** | Spot which of Jonathan's quotes are fake (true/false swipe) |
| 3 | **"לבלוע קינואה"** | Rhythm game in 7/8 with Balkan music: chew on the beat, fake smile on the off-beat |
| 3 | **"עז מול טוביה"** | Staring contest with the goat |
| 4 | **"מבחן הרבנית"** | Haredi-life quiz; Gittel's eyes narrow with each wrong answer |
| 4 | **"קידוש ספיד"** | Eat as much kugel as possible before the gabbai counts to 10 (button mash) |
| 5 | **"צלחת שלישית"** | Politely refuse food. It is impossible. Every refusal adds food (comedic unwinnable game; "winning" = accepting) |
| 6 | **"משפט שלם"** | Catch a complete sentence in the plenum before the interruptions (timing) |
| 6 | **"נבדוק ונחזור אליך"** | Ask the spokesperson questions; each answer is the same. Find the exact question that breaks him |
| 7 | **"טובי או לא טובי"** | Keep the German accent: answer fast in "German" (pick Ja/Nein/Kuchen) without slipping into Yiddish |
| 7 | **"שתיקה עם הנס"** | Don't press the button. The hardest minigame: kindness = waiting |
| 8 | **"סידור הושבה"** | Seating chart puzzle + the final cholent lid lift |

- **Content scope:** all 8 chapters, trimmed dialogue + 14 minigames.
- **Done =** full playthrough, all minigames playable on mobile, endings.

### 9.5 First-playable milestone (applies to all prototypes)
To compare fairly before the user picks a winner, each branch first ships a **vertical slice**: title screen + chapter 1 (tutorial) + **chapter 3 (settlement) + chapter 4 (Bnei Brak)**, the starkest food contrast, + one ending. Then the remaining chapters are filled in. The user plays the four slices on Pages and decides.

---

## 10. Tech & repo

### 10.1 Stack
- **Plain static HTML + CSS + vanilla JavaScript (ES modules).** No build step, no npm required. Open `index.html` and it works.
- Allowed CDN libraries if a prototype needs them (pinned versions only): e.g. Phaser 3 for `walker`/`catcher` if the engine helps, or none at all. A prototype may stay library-free.
- **RTL:** `<html lang="he" dir="rtl">`. Canvas text drawn with `ctx.direction = 'rtl'`. Numbers and English inside Hebrew lines wrapped with `<bdi>`.
- **Fonts (Google Fonts):** `Rubik` (UI), `Secular One` (titles), `Gveret Levin` or `Amatic SC` Hebrew-capable handwritten font for 💭 asides and the notebook (verify Hebrew support).
- **Mobile:** responsive, touch controls, portrait-first for `novel`/`mix`, landscape-friendly for `walker`/`catcher`. No horizontal scroll. Works at 360px width.
- **Accessibility:** text speed setting, mute toggle, high-contrast dialogue box.
- **Persistence:** `localStorage` behind try/catch (§3.5).

### 10.2 Suggested file layout (per branch, adaptable)
```
index.html
css/style.css
js/main.js          # boot, scene manager
js/state.js         # meters, inventory, save/load, endings
js/content/         # chapters, dialogue, foods (data, not code)
js/audio.js         # Web Audio sequencer + SFX
js/art/             # SVG character builders (Tuvia + NPCs + expressions)
assets/             # optional static SVGs
```
Dialogue lives in data files (JS/JSON objects) so text can be rewritten without touching logic.

### 10.3 Branches & GitHub Pages
- Repo created by Claude via `gh repo create` (public, required for free Pages).
- **`main`**: `SPEC.md`, `README.md`, the **landing page** (`index.html`: four big cards with a caricature, a description and a "שחק" button per prototype), and the Pages workflow.
- **`novel`, `walker`, `catcher`, `mix`**: one prototype each, independent code. Each branch has its game at its root.
- **Deployment:** a GitHub Actions workflow (`.github/workflows/pages.yml` on `main`):
  - Triggers: push to `main`, `novel`, `walker`, `catcher`, `mix`, plus manual dispatch.
  - Checks out `main` to `/`, and each prototype branch into `/novel/`, `/walker/`, `/catcher/`, `/mix/` (skipping branches that don't exist yet).
  - Uploads the combined folder with `actions/upload-pages-artifact` and deploys with `actions/deploy-pages`.
  - Note: the workflow file must exist on `main`. For pushes to prototype branches to trigger it, each prototype branch also carries a tiny copy of the workflow, or `main`'s workflow is triggered via `workflow_dispatch` / `repository_dispatch` from them. The implementer picks the simplest working approach and documents it in README.
- URLs: `https://<user>.github.io/<repo>/` (menu), `/novel/`, `/walker/`, `/catcher/`, `/mix/`.
- Each game has a small "← חזרה לתפריט" link back to the landing page.

### 10.4 Model use during the build
- **Opus:** all dialogue and humor writing, game design decisions, and the core engine of each prototype. Quality of Tuvia's voice comes first.
- **Sonnet subagents (in parallel, isolated worktrees):** mechanical or parallelizable work such as the Pages workflow, landing page, SVG NPC variations, music pattern tables, minigame scaffolds, mobile-control polish.
- **Haiku:** quick read-only checks (lint-style scans, missing-string checks).
- Prototypes can be built in parallel (one agent per branch), each given this SPEC as its brief.

---

## 11. Open items
1. **📸 Tuvia's reference photo.** The user will provide it. ✅ Done. §2.3 was finalized from the photo, `reference/tuvia.png`.
2. **Public-figure list (§6.4).** User approves, edits or swaps for invented MKs.
3. **Dialogue review.** User reviews sample lines for Tuvia-authenticity after the vertical slices.
4. **Title.** Pick the final game name.
5. **Pick the winner** after playing the four vertical slices, then expand that branch to the full game.

---

*"כתבתי את המסמך הזה. אני עייף. מישהו פה יש לו קוגל?"*
