# טוביה אוכל את הארץ — `catcher` (arcade food-catcher)

Branch `catcher` of the Tuvia Tenenbom fan game. One of four independent prototypes (SPEC §9.3).
Plain static HTML + CSS + ES modules, no build step. Serve the branch root with any static server
(`python3 -m http.server 8103`) or let the Pages workflow publish it at `/catcher/`.

**Core loop:** each chapter is a comic strip (intro) → a ~2.5-minute arcade level → a comic strip (outro)
→ Moshe's taxi (his Middle East lecture scrolls past as a marquee) → the next chapter. Food falls or is
thrown by the NPCs at the top of the screen; Tuvia runs left/right with a plate. Catch good food (mood up,
combo), dodge bad food (mood down, a 💭 complaint), catch 📖 quote bubbles for pages, 😇 golden jackpots
are fast, 🎭 purple jackpots appear only after a disguise swap, 🥤 Coke Zero restores and stocks an
emergency can, and the chapter's ingredient descends glowing once its condition is met.

## The slice (SPEC §9.5)

| Chapter | Level twist | Ingredient rule |
|---|---|---|
| 1 · Ben Gurion (tutorial) | Shira throws the confiscated items back; the duty-free rains chocolate; the airplane meal falls too | **Honesty**: the pot descends at the end only if you never swapped disguise during the level. Swapping gets Shira's 🎭 jackpot quote instead. |
| 3 · The hilltop | Tzofia throws in **7/8** on the Balkan theme (`audio.onStep`, 2+2+3 pulse dots top-left); the goat runs across and headbutts the plate (it shrinks for a second); the **politeness phase**: catch 4 quinoa without pressing 🗯 להתלונן; the gluten-free cholent is the cursed item (−30, shake, gasp); shakshuka is the redemption | **Politeness**: 4 quinoa eaten in silence → the beans. Complaining (relief: +4) sends the beans back to the garden. |
| 4 · Bnei Brak | Everything is good; the avalanche phase; mood overflow to 120 ("שיכור מקוגל"); Coke Zero rain; Shmerel's kosher phone falls with a TikTok jingle; Gittel's "איזה טננבוים?" quiz as three falling answer bubbles | **Quiz**: catch the right answer (it's the street, not the title) → the kishke. |
| 8 · Shabbat table (slice finale) | All guests throw at once over the finale medley → mashup; Tzofia brings quinoa to the table (second politeness phase); Moshe finally reaches 2025 | With 3/3 ingredients the perfect cholent descends in slow motion. |

Chapters 2, 5, 6, 7 are listed as "בקרוב" (locked) with a Tuvia one-liner.

Every chapter has: a handwritten title card + establishing shot, the Isi call (📱 once per chapter, in the
intro strip or the pause menu: a real hint + a dry line), ≥1 😇 innocent-question jackpot, ≥1 🎭 disguise
jackpot per disguise, the ingredient, a human moment (a warm flash + aside), the hidden goat (tap it in the
level backdrop) and foods with the exact SPEC §4 verdict lines.

## Slice scaling (deliberate adaptations of SPEC §3 / §7)

- **Ingredients:** 3 in the slice (הסיר from Shira, השעועית from Tzofia's garden, הקישקע from Rebbetzin
  Gittel). The HUD shows 7 slots; 4 are dashed "בקרוב".
- **Book target:** 100 pages (1/3 of 300). Chapters yield roughly 30–50 pages each when played well.
- **Food mood values** in the arcade are SPEC × 0.6 (many items fall per level). The cursed gluten-free
  cholent (−30), the ingredients and the final cholent (+25) are not scaled. Pages are multiplied by mood
  (×0.5 under 20, ×1.5 at 80+), mood drifts −1 per 20 s, and the emergency Coke Zero can saves you once at 0.
- **Endings** (checked in SPEC §7 order, slice thresholds):
  🥤 חזרה לניו יורק בכעס (mood 0, no can — immediate), 🥗 טוביה הבריא (≥5 bad foods eaten politely, i.e.
  in silence during a politeness phase; 4 are needed for the beans, so one polite quinoa at the Shabbat table
  tips you over — Isi and the 💭 warn you), 💌 סוף סודי (Isi called in all 3 chapters + goat found in all 3
  + 3/3 ingredients), 📘 רב-מכר (≥100 pages + 3/3 ingredients + mood ≥40), 📗 ספר בינוני (≥100 pages),
  📕 אין ספר. The title screen shows seen endings and silhouettes with hints for the rest.
- **Disguises** are swapped during play with Space / the 🎭 button: Tuvia → טובי הגרמני → טוביה מבני ברק
  → אורח פשוט. Each NPC reacts, some add their own items to the mix, "the boy from Bnei Brak" gets double
  portions in Bnei Brak and p'tcha is worth four times as much. The wrong disguise is a joke, never a loss,
  except at the airport where honesty is the ingredient rule.

## Controls

←/→ or A/D (also ש/ג on a Hebrew layout) to move, Space or 🎭 to swap disguise, C/ב or 🗯 to complain,
Esc/P to pause. On touch: drag anywhere on the stage, Tuvia follows your finger; big buttons below.
The HUD buttons 🥤 and 🥐 use a stored can (+20) or rugelach (+5).

## Files

```
index.html            screens: title, chapters, title card, comic, level (HUD + canvas), taxi, notebook, settings, ending
css/style.css
js/main.js            boot, screen flow, HUD, endings, notebook, settings, window.__tuvia
js/state.js           meters, inventory, notebook, save/load (localStorage, try/catch), decideEnding
js/game/level.js      the arcade engine (canvas): throwers, spawning, rhythm, catching, goats, quiz, overlays
js/game/comic.js      comic-strip panels (typewriter) + Isi's phone UI
js/content/foods.js   SPEC §4 catalog with verdicts (+ airport / Bnei Brak extras), ingredients
js/content/chapters.js chapters: panels, Isi calls, level scripts, quotes, jackpots, disguise reactions, taxi
js/content/asides.js  💭 complaints per food, delights, combos, misses, idling, ambient, overflow, locked lines
js/content/endings.js the six ending scripts
js/audio.js           shared procedural Web Audio engine (+ a `tiktok` SFX on this branch)
js/art/tuvia.js       shared caricature (+ the `plate` pose on this branch)
js/art/npcs.js        NPC busts (Shira, Moshe, Elyashiv, Tzofia, Neria, Gittel, Shmerel, Yanky, the gabbai, Isi…) + the taxi
js/art/food.js        canvas drawers for every falling item
```

Audio: `createAudio({ checkFiles: false })` in `js/main.js` keeps the console free of 404s; set it to
`true` to let `audio/<name>.mp3` recordings replace the procedural sounds (SPEC §8.4).

## `window.__tuvia` (automation / debugging)

| call | effect |
|---|---|
| `state`, `settings`, `S` | live state object, persisted settings, the state module |
| `screen()` | current screen name: title, chapters, titlecard, comic, level, taxi, notebook, settings, ending |
| `goto(id)` | start chapter `ch1`, `ch3`, `ch4` or `finale` |
| `skip()` | skip the title card / the current comic strip / the rest of the level |
| `seek(sec)` | jump the level clock forward (phases and events fire) |
| `auto(mode)` | Tuvia plays himself: `true`, `'polite'` (also eats the quinoa in the politeness phase), `'glutton'` (eats everything), `false` |
| `setMood(n)`, `addPages(n)`, `giveIngredient(id)` | steer the meters (`pot`, `beans`, `kishke`) |
| `setDisguise(d)`, `complain()`, `findGoat()`, `callIsi()` | in-level actions |
| `level()` | the running level; `.debug()` returns phase, counters and results |
| `decideEnding()`, `ending(id)` | compute / show an ending (`huff`, `healthy`, `secret`, `bestseller`, `mediocre`, `nobook`) |
| `save()`, `load()`, `reset()`, `title()` | persistence and navigation |

## Testing

Playwright scripts (not committed) drive the full slice: title → ch1 → save/reload/continue → ch3 → ch4 →
finale → endings, with zero console/page errors, at 390×844 and 1280×800, from the root and from a
`/catcher/` sub-folder.
