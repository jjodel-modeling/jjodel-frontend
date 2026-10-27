# Log inbox — release 3.1, What's new screen

Entries for the release 3.1 welcome-screen lane (front `release-3-2`, P-2026-10-17-0040), kept out of the active
`docs/claude-code-log.md` while parallel lanes are running (P9). To be merged into the active log by whoever rotates it.

---

## 2026-10-17 — feat(welcome): 3.1 what's new screen with a recall of 3.0 (P-2026-10-17-0040)
**Prompt**: `claude_2026-10-17_0040_prompt_rel31_welcome_modal.md`, full lane: the WelcomeModal becomes the 3.1 screen (title, featured Simulation with a markup and CSS illustration, three cards, a secondary 3.0 strip, key `jjodel_welcome_3_1_seen`), fit at 1280×800 and usable at 1024×768, report, crops for Alfonso's visual GO.
**Files touched**: code `17486a557`: `frontend/src/components/WelcomeModal/WelcomeModal.tsx`, `frontend/src/components/WelcomeModal/WelcomeModal.scss`. Docs `1fdbde38d`: `docs/discovery/discovery_2026-10-17_rel31_welcome_modal.md`. This entry: `docs/log-inbox/release-3-1-welcome.md` (new).
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: (a)
**Regressions**: yes — `npm run smoke` is RED on this tree: the harness seeds only the 3.0 key (`frontend/scripts/smoke/states.ts:186`), so the 3.1 backdrop swallows its clicks; the app itself is not regressed (a copy seeding the 3.1 key is GREEN 12/0/3).
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: fallito (`npm run smoke` on 3171 RED 0/3, every state NOT REACHED, backdrop intercepts clicks; control copy seeding the 3.1 key GREEN 12 passed, 0 failed, 3 skipped; visual GO pending on the crops in `~/.jjodel-lanes/P-2026-10-17-0040/crops/`)
**Notes**: Gates: typecheck 0 errors, build exit 0, no component test. Fit measured: 1280×800 body 518/518, no scroll; 1024×768 body scrolls 12 px. Layout in the component's stylesheet: width 760, max-height `calc(100vh - 40px)`, backdrop z-index 10001 over the minimized Jodie button. Show logic unchanged (once per session, forever with the tick). Decisions and two questions in the report, §8 and §0.
**Prompt document name**: 2026-10-17 00:40

## 2026-10-17 — ticket: the smoke seeds only the 3.0 welcome key, so the 3.1 modal blocks every smoke state
**Ticket**: `frontend/scripts/smoke/states.ts:186` seeds `localStorage.setItem('jjodel_welcome_3_seen', '1')` to keep the WelcomeModal backdrop from swallowing clicks (`scripts/smoke/README.md:115` lists the key). From `17486a557` the modal reads `jjodel_welcome_3_1_seen`, so `npm run smoke` stops at `createProject` with `<div class="wm-backdrop">… intercepts pointer events`: 0/3 states reached, RED. A copy of `run.ts` and `states.ts` seeding the 3.1 key too is GREEN, 12 passed, 0 failed, 3 skipped. Needed before or with the merge of `rel31-welcome`: one line in `states.ts`, one in the README.
**Priority**: high
**Found in**: P-2026-10-17-0040
**Detail**: docs/discovery/discovery_2026-10-17_rel31_welcome_modal.md
