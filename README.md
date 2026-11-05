# טוביה אוכל את הארץ · הראיונות (`novel`)

The **visual-novel** prototype of the Tuvia Tenenbom fan game (SPEC §9.1). Hebrew, RTL, mobile-first,
plain HTML + CSS + ES modules, no build step. The game lives at this branch's root: open `index.html`
over http (e.g. `python3 -m http.server 8101`) or play it at `https://<user>.github.io/Tuviagame/novel/`.

**Core loop:** location scene → interview with choices (regular / 😇 innocent question / 🎭 disguise-specific)
→ food offered (eat / "תודה, טעים מאוד" / refuse, with consequences and Tuvia's verdict line) → notebook entry
→ next encounter. Tuvia sits bottom-right with live expressions; 💭 asides float in a cloud in his handwriting.

## What is in the slice (SPEC §9.5)

| | |
|---|---|
| Title | endings gallery (silhouettes + hints for locked endings), המשך, פרקים, פנקס, הגדרות, the goat, `← חזרה לתפריט` |
| Chapter 1 · נמל התעופה בן גוריון | tutorial asides; **Shira** (disguise reactions, the side room, 3 hours, the pot, cake from her mother); **Moshe**'s taxi (1948 → 1967 → Abraham, rugelach + a crate of Coke Zero). Ingredient: הסיר, only when Tuvia is himself and tells her the truth |
| Chapter 3 · גבעה בשומרון | Moshe continues (Exodus); **Elyashiv** (the pita confession, the yeshiva offer for "טוביה מבני ברק", the coat at night); **Tzofia**'s kitchen (quinoa, kale, chia, sprouts, spelt, the gluten-free cholent event with screen shake, the shakshuka with white bread from the village); **Neria**'s guitar geopolitics. Ingredient: השעועית, only after a full plate of quinoa eaten "politely" while the bubble screams |
| Chapter 4 · בני ברק | Moshe (Turks, baklava); the **gabbai** who counts nine; **Yanky** and the pen; **Reb Shmerel**'s Kiddush (herring + vodka, army/Torah, the kosher phone that rings TikTok, the circular phone economy, gefilte with chrein); **Rebbetzin Gittel** ("איזה טננבוים?", "אתה רזה", the Isi interrogation, the 3-question quiz on Haredi life, cholent, she remembers his mother). Ingredient: הקישקע via the Bnei Brak disguise or 3/3 quiz |
| Finale · שולחן שבת | Moshe reaches 2025 ("2025 זה 1948, רק עם ווייז") and refuses the fare; the **seating puzzle** (tap a guest, tap a seat, or let the goat decide): all 36 pairings have a written line; fights earn pages, peace earns mood, no perfect solution; the cholent lid lift (golden light + choir at 3/3, "מרק עם כוונות" otherwise); ending |
| Endings | 🥤 חזרה לניו יורק בכעס · 🥗 טוביה הבריא · 📘 רב-מכר · 📗 ספר בינוני · 📕 אין ספר · 💌 הסוף הסודי: הצ'ולנט של איזי. Each: a scene, dialogue, a book cover with the book title, stats, "שחק שוב" |

Chapters 2, 5, 6, 7 show as "בקרוב" on the chapters screen with a Tuvia one-liner each.

## Deliberate slice adaptations of SPEC §3 / §7

- **Ingredients: 3** (הסיר, השעועית, הקישקע). The HUD shows all 7 slots; the other four are greyed "בקרוב".
- **Book target: 100 pages** (one third of 300). Quote values in `js/content/*` are written at the SPEC's full-game
  scale (sample quotes are +8…+15); `SLICE.pageScale = 0.4` in `js/state.js` scales them so a chapter yields ~30–60
  pages and a full-jackpot run lands around 170–200. The mood multiplier (×0.5 under 20, ×1.5 at 80+) applies on top.
- **Endings** use the slice thresholds: 🥤 mood 0 with no Coke Zero (a can auto-rescues once, +20) · 🥗 ≥5 bad foods eaten
  "politely" · 💌 Isi called in all 3 chapters + goat found in all 3 + 3/3 ingredients · 📘 ≥100 pages + 3/3 + mood ≥40 ·
  📗 ≥100 pages, <3 ingredients · 📕 <100 pages. Checked in that order (secret before bestseller).
- Eating bad food "politely" costs 60% of its mood hit (he half believes his own "טעים מאוד"); the gluten-free cholent
  costs the full −30. The healthy ending is therefore reachable without dying of quinoa first.
- Mood drifts −2 per encounter with no food. In Bnei Brak mood can reach 120 ("שיכור מקוגל").
- Moshe's taxi scenes link chapters 1 → 3 → 4 → finale; his explanation of the Middle East continues across them.

## Controls

Tap / click / `Enter` / `Space`: complete the line, then advance. `1`–`9`: pick a choice. `N`: notebook. `F`: fast-forward
(skips lines already read, ⏩). 📜 opens the dialogue log. 📱 calls Isi (once per chapter, a real hint). The goat hides
in one scene per chapter: tap her. 🥤 / 🥐 in the HUD are snacks. Settings: text speed, mute (persisted), volume,
high-contrast dialogue box, back to menu, wipe save.

## Files

```
index.html            shell: title, chapters, game (HUD / stage / dialogue), notebook, settings, overlays
css/style.css
js/main.js            screens, the script runner, HUD, food, disguises, phone, seating, endings, window.__tuvia
js/state.js           meters, inventory, notebook, save/load (localStorage in try/catch), ending decision
js/content/cast.js    names, colors, disguises, ingredients, mood bands
js/content/foods.js   SPEC §4 catalog with verdict lines, polite screams
js/content/ch1.js ch3.js ch4.js finale.js   scripts (data), seating pair lines
js/content/isi.js endings.js misc.js        Isi calls, ending scripts, chapter list, idle asides, taxi links
js/art/tuvia.js       shared caricature (unchanged)   js/art/npcs.js  NPC caricatures   js/art/scenes.js  backgrounds
js/audio.js           shared procedural music/SFX engine (unchanged)
preview/              dev previews for the art and audio
```

Script notation is documented at the top of `js/content/ch1.js`. All player-facing text is in the content files.

### Audio files (SPEC §8.4)

The engine can replace any procedural theme or SFX with `audio/<name>.mp3`. The probe is off by default so a static
deploy logs no 404s: flip `USE_AUDIO_FILES` in `js/main.js` once recordings exist.

## `window.__tuvia` (automation / testing)

| member | |
|---|---|
| `state` | the live state object (mood, pages, ingredients, notebook, flags, isiCalled, goatFound, endingsSeen…) |
| `goto(chapterId, encounter=0)` | start a chapter: `ch1`, `ch3`, `ch4`, `finale` |
| `newGame()` · `title()` | restart / abort to the title |
| `setMood(n)` · `addPages(n)` · `giveIngredient(id)` · `setFlag(k, v)` · `callIsi()` · `findGoat()` | steer the meters |
| `skip()` | instant text + fast-forward |
| `waiting()` | `'tap' \| 'card' \| 'choice' \| 'food' \| 'disguise' \| 'seating' \| 'none'` |
| `tap()` · `choices()` · `choose(i)` · `pickDisguise(id)` · `seatRandom()` · `openPhone()` · `phoneNext()` | drive the UI |
| `ending(id)` · `decideEnding()` | play an ending screen / see which one the state earns |
| `save()` · `load()` · `reset()` · `audio` · `log` | |

A Playwright driver that plays the whole slice to all six endings with these hooks lives outside the repo (the
verification scripts in the session scratchpad); it asserts zero console/page errors and that save → reload → continue works.
