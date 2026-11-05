# Plan: Write SPEC.md for "טוביה אוכל" (the Tuvia Tenenbom fan game)

## Context
The user wants a funny, sharp but warm browser game for Tuvia Tenenbom fans, written in his voice. Tuvia travels, meets people and gets fed. Settler health food makes him suffer; Haredi Ashkenazi food (cholent, kugel yerushalmi, gefilte fish, cola zero) makes him happy. This task produces **only SPEC.md**, the backbone document. Building the 4 prototypes comes later, when the user asks.

Decisions from the interview:
- Platform: web browser (HTML/JS), Hebrew RTL, 20–40 min per playthrough.
- Build **4 fully independent prototypes**, one per branch, all playable from one GitHub Pages site:
  1. `novel`: visual-novel interviews
  2. `walker`: top-down walk & meet
  3. `catcher`: arcade food-catcher
  4. `mix`: story + minigames
- All of Tuvia's traits present all the time: innocent provocateur, food obsession, fake identities ("Tobi the German", etc.), grumpy inner monologue.
- Locations: Bnei Brak/Mea Shearim, a hilltop settlement, Tel Aviv cafes, Europe/Germany, Ramallah, the Knesset. Each one gets enough playtime to feel its atmosphere.
- Satire: sharp and critical about hypocrisy, always funny and sympathetic. Nobody is a villain.
- Goal: write the next book (collect quotes/stories). Mood meter works as health. The perfect cholent is the final reward.
- Multiple endings.
- Art: SVG/CSS caricatures. Tuvia is drawn from a reference photo the user will provide.
- Music: original Web Audio tunes in each location's style.
- Cast: Isi, invented archetypes, and parodied public figures.
- Repo: I create it with `gh`.

## Deliverable
Create the git repo at `/home/sfish/Tuviagame` with a single file, **`SPEC.md`**, on `main`. Nothing is pushed until the user approves the spec. Then `gh repo create` (public, needed for free Pages).

## SPEC.md outline
1. **Vision & tone.** Tuvia's voice rules: short sentences, mock-naive questions, asides to the reader, self-irony, food as the moral compass. Sharp but affectionate: every group gets roasted, and every character also gets a human, likeable moment. All dialogue is original, with no long passages copied from his books.
2. **Tuvia the character.**
   - Four traits, each with a mechanic:
     - Provocation: "innocent question" dialogue choices.
     - Food: mood meter.
     - Disguises: identity switcher that changes NPC reactions.
     - Monologue: sarcastic asides in a different bubble style.
   - Visual spec is TBD until the photo arrives. The caricature keeps fixed props and an on-screen name tag so he can't be mistaken for anyone else.
   - The photo stays out of the public repo (`.gitignore` `reference/`).
3. **Core systems, shared by design but implemented separately per branch.**
   - **Mood (0–100):** Ashkenazi food raises it. Health food, oat milk and hummus-with-a-lecture lower it.
   - **Book pages:** quotes collected from interviews.
   - **Cholent clues:** gathered toward the perfect cholent.
   - **Disguise system.**
4. **Food catalog.** A table of name, emoji/SVG and mood effect, with a Tuvia one-liner for each.
   - Good food: cholent, kugel yerushalmi, potato kugel, gefilte fish with chrein, kishke, p'tcha, herring, rugelach, babka, Coke Zero, etc.
   - Bad food: quinoa, kale, spelt bread, goat yogurt, herbal tea, chia, tofu, oat-milk latte, EU-funded vegan canapés.
   - Location twists: Ramallah hospitality food, German Bratwurst/Kuchen.
5. **Chapters and locations, each 4–7 minutes with 2–4 encounters.** Ordered: Ben Gurion arrival → Tel Aviv → hilltop settlement → Bnei Brak/Mea Shearim → Ramallah → Knesset → Europe (Berlin/Brussels) → Shabbat finale. Each chapter specifies:
   - setting
   - NPCs
   - foods
   - satire target
   - music style
   - sample dialogue in Hebrew
6. **Cast.**
   - Isi appears by phone, with dry comments on his diet.
   - Invented archetypes: Rebbetzin Gittel, Reb Shmerel, Elyashiv & Tzofia (settlers), Noa (NGO), Hans the EU official, a Ramallah host, a foreign journalist.
   - Public-figure parodies use slightly altered names. They are mocked for public positions and habits only, with no invented crimes and nothing degrading.
7. **Endings.**
   - Bestseller: good mood + perfect cholent.
   - "Back to New York in a huff": mood hits 0.
   - Quinoa horror ending: he became healthy.
   - Optional secret ending.
8. **Audio direction.** Original Web Audio procedural tunes:
   - klezmer for Haredi scenes
   - Balkan brass for the settlement
   - German oom-pah/folk for Europe
   - Arabic maqam-style for Ramallah
   - lounge/electro for Tel Aviv
   - pompous march for the Knesset
   - SFX: burp, "nu?", crunch, sigh
9. **Prototype specs, one per branch.** Core loop, controls (keyboard + touch), how the 3 meters appear, scope for a first playable version, and what "done" means.
10. **Tech & repo.**
    - Static HTML/JS/CSS with no build step. Hebrew RTL (`dir="rtl"`) and a Hebrew Google Font (e.g. Rubik / Secular One).
    - `main` holds SPEC.md and a landing page with links to the 4 games.
    - A GitHub Action on `main` checks out all 4 branches into `/novel/`, `/walker/`, `/catcher/` and `/mix/`, then deploys to Pages. It reruns on pushes to any of those branches.
11. **Open items.**
    - Tuvia's photo, to define the visual spec.
    - User review of the sample dialogue and of the public-figure list.

## Approach & model use
- SPEC.md is creative writing in Tuvia's voice, so I (Opus) write it myself in full depth: rich Hebrew sample dialogue for every chapter, a full food catalog with one-liners, detailed NPCs, and a detailed design for each of the 4 prototypes. Length is not a concern; fun and Tuvia-authenticity come first.
- The SPEC also records model guidance for the later build:
  - **Opus:** all dialogue/humor writing, game design, and the core engine of each prototype.
  - **Sonnet agents:** parallel, mechanical work such as the Pages workflow, landing page, SVG asset variants, and audio-pattern tables.
  - **Haiku:** quick read-only checks.

## Verification
- After writing, show the user the SPEC's key sections and confirm the Hebrew renders correctly in RTL.
- `git log` shows one commit on `main`. The repo is created and pushed only with the user's go-ahead.
