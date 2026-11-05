# Tuviagame

Funny Hebrew (RTL) browser game for Tuvia Tenenbom fans. Read SPEC.md first: it is the full game design. PLAN.md holds the original interview decisions.

Workflow:
1. SPEC.md is DONE and approved. It is the source of truth: read it fully and build from it. Don't rewrite it; only extend it deliberately. Open `reference/tuvia.png` before drawing Tuvia.
2. Then build 4 fully independent prototypes on branches `novel`, `walker`, `catcher` and `mix`.
3. Add a landing page plus a GitHub Action on `main` that deploys all 4 branches to GitHub Pages.

Rules:
- Tuvia's reference photo is at `reference/tuvia.png` (committed at the user's request). Base his caricature on it and on SPEC.md §2.3. Use it only as a drawing reference: never embed the photo itself in the game.
- Public figures appear only as renamed parodies, mocked for public positions and habits only.
