# טוביה אוכל את הארץ — `walker` (top-down walk & meet)

The **walker** prototype of the Tuvia Tenenbom fan game (SPEC §9.2): walk a top-down Tuvia around small
tile maps, bump into people, get fed, get quotes, find the hidden ingredient and the goat, take Moshe's taxi
to the next chapter. Hebrew, RTL, mobile-first, plain static files, no build step.

**[SPEC.md](SPEC.md)** is the source of truth. This README documents the walker's deliberate adaptations.

## Play

```bash
python3 -m http.server 8000
# open http://localhost:8000/   (ES modules need http://, not file://)
```

Deployed under a sub-folder by the shared Pages workflow (`/walker/`); every path in the game is relative.

**Controls.** Arrows / WASD walk · `E` / Enter / Space talk or advance · `1–4` pick a choice · `Q` swap
disguise · `N` notebook · `P` call Isi · `M` mute · Esc settings. On touch devices: a virtual joystick in the
bottom-left corner (away from the dialogue) and a big action button bottom-right; tap the dialogue box to advance.

## The slice (SPEC §9.5), scaled

| | |
|---|---|
| Chapters | 1 בן גוריון → (3 הגבעה, 4 בני ברק in any order) → finale שולחן שבת. Chapters 2, 5, 6, 7 appear on the world map as locked pins with a Tuvia one-liner ("בקרוב"). |
| Ingredients | **3**: הסיר (Shira, only when Tuvia answers honestly as himself), השעועית (Tzofia's garden, after one plate of quinoa eaten politely), הקישקע (Rebbetzin Gittel: the 3-question quiz, or the Bnei Brak disguise). The HUD shows all 7 slots; 4 are greyed "בקרוב". |
| Book | **100 pages** = a book (1/3 of SPEC's 300). Chapters yield roughly 35–60 pages each. |
| Mood | 0–100, starts at 60, 5 face bands from `tuviaSVG` head crops, drifts −1 per 20 s of walking ("רעב"), −2 for a scene without food. Pages are multiplied ×0.5 under 20 and ×1.5 at 80+. Bnei Brak lifts the cap to 120 ("שיכור מקוגל"). Mood 0 with no Coke Zero = the huff ending; a can in the pocket saves him once (+20). |
| Endings | 🥤 חזרה לניו יורק בכעס (mood 0) · 🥗 טוביה הבריא (≥5 bad foods eaten) · 📘 רב-מכר (≥100 pages, 3/3, mood ≥40) · 📗 ספר בינוני (≥100 pages, <3) · 📕 אין ספר (<100) · 💌 סוף סודי (Isi called in all 3 chapters + goat found in all 3 + 3/3 ingredients). The title screen shows the endings gallery with silhouettes and hints. |

Every chapter has a handwriting title card with an establishing shot (a snapshot of the map), one Isi call
(hint + dry line), innocent-question 😇 jackpots, disguise 🎭 jackpots, an ingredient, human moments, a hidden
goat and the SPEC §4 foods with their exact verdict lines.

### Walker-specific features
- **NPCs chase to feed you.** Tzofia roams the hilltop with a quinoa tray (avoid; a catch = a choice: eat politely
  or refuse). Rebbetzin Gittel chases with kugel (seek; every catch is +mood). Both return in the finale rush.
- **Ambient 💭 asides** fire when walking past landmarks (every map has 9–11), when idling, when hunger ticks,
  when swapping disguise.
- **"!" bubbles** over the nearest NPC, a minimap in the corner, a dashed yellow taxi tile as the exit.
- **Floor food** is eaten on contact: good plates glow warm, health food glows green (hazards), the ingredient sparkles.
- **Finale "Shabbat rush"**: 45 seconds between the tables; plates spawn, guests heckle when bumped, Tzofia and
  Gittel chase; then the cholent reveal (full or partial) and the ending.
- Moshe's taxi links chapters; his Middle East lecture continues ride by ride (Abraham → 1948 → 1967 → 2025, free ride).

## Files (SPEC §10.2)

```
index.html            screens + HUD + dialogue box + modals
css/style.css
js/main.js            boot, screen flow, game loop, input, effects, window.__tuvia
js/state.js           meters, inventory, notebook, flags, save/load, endings
js/world.js           tile engine: collision, NPC AI (wander / chase / seat), camera, render, minimap, rush
js/dialogue.js        dialogue runner (typewriter, choices, 💭 asides, <bdi> wrapping)
js/ui.js              DOM: HUD, asides, toasts, notebook, phone, settings, gallery, world map, taxi, endings
js/audio.js           shared procedural Web Audio engine (SPEC §8), used for themes, stings, SFX
js/art/tuvia.js       shared caricature (HUD face, title, portraits, endings)
js/art/sprites.js     procedural canvas art: top-down Tuvia (4 directions × 3 frames × 4 disguises),
                      NPC factory with the §6.3 silhouette hooks, the goat, food icons, the tile set
js/content/foods.js   food catalog + ingredients        js/content/maps.js   tile maps, items, landmarks, world pins
js/content/npcs.js    the cast and all dialogue (DSL)   js/content/text.js   UI strings, asides, Isi, taxi, endings
```

All player-facing text lives under `js/content/`. Dialogue DSL: `'N: …'` NPC, `'T: …'` Tuvia, `'~ …'` 💭 aside,
`'* …'` stage direction, `{ fx: {…} }` effects (mood, pages, food, politeFood, item, ingredient, flag, shake,
sfx, sting, chase…), `{ pick: […] }` random line, `{ pickFlag: [flag, ifTrue, ifFalse] }`, choices with
`kind: innocent | disguise | eat | polite` and `hideIf`. Each NPC's `entry(ctx)` picks the opening node by
disguise, flags and how many times Tuvia has talked to them.

Save: `localStorage` (`tuvia-walker-save-v1`, `tuvia-walker-meta-v1`) behind try/catch. Autosave every 10 s
while walking, on every dialogue end and between chapters; "המשך" on the title screen.

## `window.__tuvia` (automated testing)

```js
__tuvia.state            // the state API (.s is the raw state object)
__tuvia.goto('settlement' | 'bneibrak' | 'airport' | 'finale' | 'world', { resume, pos })
__tuvia.setMood(n)  __tuvia.addPages(n)  __tuvia.giveIngredient('pot'|'beans'|'kishke')
__tuvia.talk(npcId, nodeId?)  __tuvia.advance()  __tuvia.choose(i)  __tuvia.skip()
__tuvia.teleport(tileX, tileY)  __tuvia.disguise('none'|'tobi'|'bneibrak'|'guest')  __tuvia.callIsi()
__tuvia.markIsi()  __tuvia.markGoat()  __tuvia.leave()  __tuvia.toWorld()  __tuvia.endRush()
__tuvia.endGame(endingId?)  __tuvia.autosave()  __tuvia.boot()
__tuvia.world  __tuvia.dialogue  __tuvia.ui  __tuvia.audio  __tuvia.MAPS  __tuvia.NPCS  __tuvia.FOODS
```

## Content rules
- The reference photo is a drawing reference only; it is never embedded. Tuvia is the SVG/canvas caricature.
- All text is original, in Tuvia's voice (SPEC §1.4). Everyone gets roasted and everyone gets a human moment.
- No public figures are needed in the slice.
