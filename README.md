# טוביה אוכל את הארץ — Tuviagame

A funny Hebrew (RTL) browser fan game about Tuvia Tenenbom: one journalist, one notebook, a lot of cholent.
**[SPEC.md](SPEC.md)** is the full game design and the source of truth.

## Play

The site is deployed with GitHub Pages: `https://<user>.github.io/Tuviagame/`

| Path | Branch | Prototype |
|---|---|---|
| `/` | `main` | Landing page (this branch) |
| `/novel/` | `novel` | Visual-novel interviews |
| `/walker/` | `walker` | Top-down walk & meet |
| `/catcher/` | `catcher` | Arcade food-catcher |
| `/mix/` | `mix` | Story + minigames |

Each prototype is **fully independent code** on its own branch, with the game at the branch root
(`index.html`). All four currently ship the *vertical slice* from SPEC §9.5: title screen, chapter 1
(Ben Gurion), chapter 3 (the settlement), chapter 4 (Bnei Brak), a slice finale and the endings.

## Run locally

No build step. Any static server works, for example from a branch root:

```bash
python3 -m http.server 8000
```

then open `http://localhost:8000/`. (ES modules need http://, not file://.)

## Deployment

`.github/workflows/pages.yml` builds one site from five branches: it checks out `main` for the root
and `git archive`s each existing prototype branch into its sub-folder, then uploads with
`actions/upload-pages-artifact` and deploys with `actions/deploy-pages`.

GitHub runs the workflow file from the branch that was pushed, so **the same workflow file is
committed on every branch**. A push to any of `main`, `novel`, `walker`, `catcher`, `mix` rebuilds
the whole site. The build strips `SPEC.md`, `PLAN.md`, `reference/` and `preview/` from the published
site, so the reference photo is never published.

First-time setup: the workflow calls `actions/configure-pages` with `enablement: true`, which turns
Pages on with the "GitHub Actions" source. If the repository settings block that, enable it once by
hand: *Settings → Pages → Build and deployment → Source: GitHub Actions*.

## Shared starting assets on `main`

- `js/art/tuvia.js`: the Tuvia caricature (SVG string builder: 10 expressions, 3 poses, 4 disguises)
  and the goat. Drawn from SPEC §2.3 and `reference/tuvia.png`. Each prototype branch carries its own
  copy and may change it.
- `js/audio.js`: the procedural Web Audio music and SFX engine from SPEC §8 (location themes, adaptive
  mood layers, stings, SFX, mp3 hook). Same deal: copied per branch.
- `preview/`: dev-only preview pages for the art and the audio (not deployed).

## Content rules

- Tuvia's reference photo is a drawing reference only. It is never embedded in a game.
- Public figures appear only as renamed parodies, mocked for public positions and habits only.
- All text is original, written in Tuvia's voice (SPEC §1.4).
