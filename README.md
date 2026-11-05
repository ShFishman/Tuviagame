# טוביה אוכל את הארץ — אב-טיפוס `mix` ("הקוקטייל")

Story + minigames prototype (SPEC §9.4): short visual-novel scenes in Tuvia's voice, and a signature
minigame (or two) per chapter that grows out of the story. Plain static HTML/CSS/ES modules, no build step.

Open `index.html` over any static server (ES modules need http). Deployed at `/mix/` by the Pages workflow;
every path in the game is relative, so it works from any sub-folder.

## The vertical slice (SPEC §9.5)

Title → **Chapter 1** Ben Gurion (tutorial) → Moshe's taxi → **Chapter 3** the hilltop → taxi → **Chapter 4** Bnei Brak
→ taxi → **Finale** "שולחן שבת" → one of six endings. Chapters 2, 5, 6, 7 appear on the map as "בקרוב" with a Tuvia one-liner.

| Chapter | Encounters | Minigames |
|---|---|---|
| 1 נתב"ג | Shira at passport control (disguise reactions, 😇 "מי צודק"), the side room, Dana at the duty free (😇 jackpot), Moshe's taxi. Hidden goat by the luggage carts. | **בדיקה ביטחונית** (pack the suitcase so the X-ray doesn't flag the pot; Tetris-like, Shira comments), **מונה המונית** (tap on "1948 / 1967 / אברהם אבינו / בקיצור" to interrupt Moshe; misses cost shekels) |
| 3 הגבעה | Elyashiv (hug, pita confession 😇, yeshiva offer 🎭, "Europe wrote a letter to the chicken coop" 🎭), Tzofia (goat yogurt, quinoa, the gluten-free cholent event with screen shake, herbal tea, chia), Neria and his guitar, the coat at night, shakshuka at dawn. | **לבלוע קינואה** (7/8 rhythm synced to the Balkan theme via `audio.getBeat()`: chew on the 2+2+3 downbeats, hold a fake smile on the tail; 💭 screams the whole time), **עז מול טוביה** (staring contest: don't tap during the fly / Neria / chia / Isi; tap only on the blink = the chapter's goat) |
| 4 בני ברק | The cola-crate kid, Rebbetzin Gittel ("איזה טננבוים?", "תאכל קוגל. אתה רזה.", she remembers his mother), Shmerel (army/vodka 😇, the kosher phone TikTok, 40 guests), the gabbai, Yanky and the pen, the 2 AM bakery. Goat on a pashkevil. | **מבחן הרבנית** (4 of 10 Haredi-life questions; Gittel's eyes narrow per wrong answer; pass = kishke; the Bnei Brak disguise forgives one), **קידוש ספיד** (mash the kugel before the gabbai reaches ten; Shmerel's vodka steals pieces; the count restarts at nine when the minyan is short) |
| Finale | All eight guests arrive with their lines, the lid lift (golden light + choir at 3/3, or a "בסדר" cholent), Moshe refuses payment. | **סידור הושבה** (8 seats, 28 written pair reactions, score bands; no perfect solution) |

Every minigame has an instruction card in Tuvia's voice, a result card with a verdict line and mood/pages consequences, and "🔁 שוב".
Each chapter has: a handwriting title card, an establishing shot, the 📱 Isi call (hint + a dry line, once per chapter),
innocent-question 😇 and disguise 🎭 jackpots, the ingredient, a human moment, the hidden goat and foods with the exact SPEC §4 verdicts.

## Slice scaling (deliberate adaptation of SPEC §3 / §7)

- **Ingredients:** 3 in the slice (הסיר from Shira when Tuvia is honest and packs the suitcase; השעועית from Tzofia after eating the whole quinoa plate politely; הקישקע from Gittel after the quiz). The HUD shows all 7 slots; 4 are locked "בקרוב".
- **Book target:** 100 pages (= 1/3 of 300). Chapters yield roughly 25–50 pages each; mood multiplies pages (×0.5 under 20, ×1.5 at 80+).
- **Endings** (checked in SPEC §7 order, `decideEnding()` in `js/state.js`):
  🥤 mood 0 with no Coke Zero (a can rescues once, automatically) · 🥗 ≥5 bad foods eaten "politely" · 💌 Isi called in all 3 chapters + goat found in all 3 + 3/3 ingredients ·
  📘 ≥100 pages + 3/3 + mood ≥40 · 📗 ≥100 pages · 📕 otherwise. The title screen shows the endings gallery with hints for locked ones.
- Mood can exceed 100 in Bnei Brak (cap 120, "שיכור מקוגל"); it resets to 100 when the chapter ends. Mood drifts −2 on food-less scenes.
- Save is written at every node boundary to `localStorage` (`tuvia-mix-save-v1`); settings + endings seen in `tuvia-mix-meta-v1`. Both behind try/catch.

## Layout

```
index.html               shell: title, map, game (HUD / stage / dialog / minigame panel), overlays
css/style.css
js/main.js               screens, HUD, step interpreter, minigame runner, Isi phone, notebook, endings, window.__tuvia
js/dialogue.js           presentation: scene / NPC / Tuvia, typewriter, 💭 asides, choices, cards, bidi() helper
js/state.js              meters, inventory, notebook, save/load, endings
js/audio.js              shared procedural Web Audio engine (unchanged; checkFiles:false so no audio/*.mp3 probes)
js/art/tuvia.js          shared Tuvia caricature + goat (unchanged)
js/art/npcs.js           NPC caricatures (Shira, Moshe, Elyashiv, Tzofia, Neria, Gittel incl. eye-narrowing, Shmerel, Yanky, gabbai, Dana, Isi)
js/art/scenes.js         scene backgrounds with the hidden-goat slot
js/content/common.js     title, chapter list, idle lines, Isi calls, Moshe's taxi rides, ending scenes
js/content/foods.js      SPEC §4 catalog + disguises
js/content/ch1.js ch3.js ch4.js finale.js   chapter scripts (data; step format documented at the top of js/dialogue.js)
js/content/minigames.js  all minigame text: instructions, NPC commentary, the taxi lecture, the quiz pool, screams, seating reactions
js/minigames/*.js        suitcase, taxi, quinoa, goat, quiz, kiddush, seating (+ common.js helpers)
```

Controls: tap/click to advance, number keys for choices and cards, Space/Enter to advance. Minigames: touch + keyboard
(arrows/Enter/R/Tab/1–7 in the suitcase; Space to interrupt / chew / tap / eat; 1–3 in the quiz; Enter to serve).
Settings: text speed, mute (persisted), high-contrast dialogue box, wipe save.

## `window.__tuvia` (test API)

| Member | Does |
|---|---|
| `state`, `screen`, `chapter` | live state object, current screen (`title`/`map`/`game`), current chapter id |
| `goto(id, node?)` | jump to a chapter (`ch1`, `ch3`, `ch4`, `finale`), optionally to a node |
| `newGame()`, `title()`, `map()` | start over / go to title / go to map |
| `setMood(n)`, `addPages(n)`, `giveIngredient(id)`, `setDisguise(d)` | steer the meters (`pot`, `beans`, `kishke`; `none`, `tobi`, `bneibrak`, `guest`) |
| `skip()` | finish the typewriter / advance the current line |
| `choose(i)`, `card(idOrIndex)` | press a dialogue choice / a card button (`'eat'`, `'polite'`, `'refuse'`, `'next'`, `'again'`, a disguise id…) |
| `mg`, `winMinigame()`, `loseMinigame()` | the running minigame controller; force a result |
| `callIsi()`, `phoneNext()`, `findGoat()` | the chapter's Isi call / advance the phone / find the chapter's goat |
| `save()`, `load()`, `reset()`, `decideEnding()`, `playEnding(id)` | persistence and endings |
| `openNotebook()`, `closeNotebook()`, `busy()` | notebook overlay; whether something is waiting for input |
| `audio`, `ui`, `S`, `CHAPTERS`, `MG`, `FOODS`, `ENDINGS` | the engines and the data |

## Verification

Played end to end with Playwright (title → ch1 → ch3 → ch4 → finale → six endings; save → reload → המשך; notebook;
served from `/` and from a `/mix/` sub-folder; 360 / 390 / 1280 px wide): zero console errors, zero page errors.
