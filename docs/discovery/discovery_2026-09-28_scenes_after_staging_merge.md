# Discovery: four demo scenes on the trunk after the staging merge

- Prompt-ID: `P-2026-09-28-1025`. Prompt file:
  `docs/prompts/claude_2026-09-28_1025_prompt_scenes_after_staging_merge.md`. Chat: `C-2026-09-27-1437`.
  Session: `55877500-9190-46f6-95a0-61d6ee6cef2e`.
- Tree: `~/jjodel-w-scenes`, branch `scenes-base`, HEAD `583f2efdf` (the prompt's own docs commit on top of
  `447e4239b`; `git show --stat 583f2efdf` touches only the prompt file, so every measurement below is of the
  trunk's `frontend/` at `447e4239b`). Dev server on 3029 only. Executor model: Sonnet 5.
- Measured 2026-09-28 10:25 to 10:33, headless Chromium (Playwright), 1600x1000, one fresh browser context per
  scene, DPR 2.
- This report is a set of hypotheses with evidence, not a reference. Whoever uses it downstream re-reads the files.

## 0. Verdict

**Identical on all four scenes.** SM, Petri (Bound 4), ESM and Flow B all read exactly as the known-good
measurement at trunk `888ea9a9d`. The Simulation panel docks at the bottom of the editor on both the metamodel and
the model tab, for all four scenes, with no thrown error from the dock-tab or chip lookup. Console carries only the
known `failed to get project {project: null}` line, once per scene, matching the declared baseline. No bisect was
needed.

One factual correction to the prompt's background, not affecting the verdict: §1.

## 1. Objective and hypotheses

Objective: measure whether the merge of `staging` by another author (`447e4239b`, ticket #157) changed any of the
four demo scenes, against the previous known-good measurement at trunk `888ea9a9d`.

Read first: `git log --oneline 888ea9a9d..447e4239b -- frontend/src` and `git diff --name-only 888ea9a9d 447e4239b
-- frontend/src`. Measured: 20 files under `frontend/src` changed (matches the prompt), 16 commits touch
`frontend/src` in the range, of which 14 are non-merge and all 14 carry `(#157)` in the subject — the prompt states
"12 feature commits of ticket #157"; the measured count is **14**, not 12. Does not change what follows: the
measurement below is behavioral (what the scenes render and how they terminate), not a commit count, and the file
list the prompt names for the docking check (`Dock.tsx`, `DockManager.tsx`, `MyRcDock.tsx`, `Navbar.tsx`,
`LeftBar.tsx`, `joiner/classes.ts`, `joiner/index.ts`) all resolve to real paths in this tree (`git log` confirms
each under `frontend/src/components/abstract/`, `frontend/src/components/dock/`, `frontend/src/pages/components/`,
`frontend/src/model/joiner/` respectively — read via `find`, not assumed from the prompt's names alone).

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | SM: 10 steps, Terminated | **Holds** |
| H2 | Petri, Bound 4: 4 steps, Deadlock, reason `· ε: t2 false` | **Holds** |
| H3 | ESM: 10 steps, halt line whole on two rows | **Holds** |
| H4 | Flow B: 6 steps, Terminated, `fin · count = 2` | **Holds** |
| H5 | Simulation panel docks at the bottom of the editor on both tabs, all four scenes, `Simulation` chip present | **Holds** |
| H6 | Console shows only the known error kind | **Holds** |

## 2. Method

Harness: `frontend/scripts/smoke/_tmp_p1025_{walk.ts,common.ts,scenario.js,vite.config.ts}`, copied read-only from
`/Users/alfonso/jjodel-release/frontend/scripts/smoke/_tmp_m0209_*` — the same probe lineage used for every
`888ea9a9d`-era four-scene measurement of the night (`_tmp_m0023` through `_tmp_m0209`, each a read-only copy of the
one before, per the header comments in those files). Adjusted only for path/port scope, behavior otherwise
untouched:

- `_tmp_p1025_vite.config.ts`: `SCRATCH` renamed to `/tmp/p1025_scratch`; `fs.allow` first entry changed from
  `/Users/alfonso/jjodel-release` to `/Users/alfonso/jjodel-w-scenes`; `node_modules` allow entry and port `3029`
  unchanged.
- `_tmp_p1025_walk.ts`: import path changed to `./_tmp_p1025_common.ts`; the `start()` call's scenario filename
  changed to `_tmp_p1025_scenario.js`; `SHOTS` changed to `/Users/alfonso/.jjodel-lanes/shots_scenes_after_staging`.
- `_tmp_p1025_common.ts`, `_tmp_p1025_scenario.js`: byte-identical to the `_tmp_m0209_*` originals (only the header
  comment differs, itself unchanged copy text).

Pre-flight, all confirmed before any run: `pwd` and `git branch --show-current` gave `/Users/alfonso/jjodel-w-scenes`
on `scenes-base`; `git status --porcelain` empty; `lsof -i :3029` empty (port free); `frontend/node_modules` is a
symlink to `/Users/alfonso/jjodel/frontend/node_modules` (`ls -la`, target unchanged); ports 3000/3001/3003 confirmed
in use by other worktrees' own vite processes (`ps aux`), none touched.

Dev server: `npx vite --config scripts/smoke/_tmp_p1025_vite.config.ts` from `frontend/`, backgrounded, log at
`~/.jjodel-lanes/shots_scenes_after_staging/logs/p1025_vite.log` — `VITE v7.3.2 ready in 234 ms`,
`Local: http://localhost:3029/`. Verified alive throughout via `ps aux` (pid 53094).

Probe: one foreground run per scene, `DEMO_SCENE=<sm|petri|esm|flowB> npx tsx scripts/smoke/_tmp_p1025_walk.ts`,
each exit 0. Raw output preserved at `~/.jjodel-lanes/shots_scenes_after_staging/logs/p1025_{sm,petri,esm,flowB}.log`
(not committed, per DOVE). Screenshots at `~/.jjodel-lanes/shots_scenes_after_staging/*.png`, 1600x1000, per-scene
crops as the walk script produces them (dialog, panel-after-apply, panel-final, and for Petri the canvas/overlay
crops); none embedded in this report, per the prompt's own "cropped at most 600 px wide for the report" — no crop
was needed in the report body since every finding is a text readout, not a visual difference.

## 3. Table by scene

| Scene | Steps | Terminal status | Extra | Docking (both tabs) | Console | Verdict |
|---|---|---|---|---|---|---|
| SM | 10 | Terminated | marking `off` | ok | 1x known | identical |
| Petri (Bound 4) | 4 | Deadlock | `· ε: t2 false` | ok | 1x known | identical |
| ESM | 10 | Halted | halt line whole, 2 rows | ok | 1x known | identical |
| Flow B | 6 | Terminated | `fin · count = 2` | ok | 1x known | identical |

## 4. Measured text, verbatim

All quotes below are the `FINAL` line of each run's log (the walk script's own end-of-run reader), file:line into the
preserved logs.

- SM — `p1025_sm.log:44`: `"FINAL",{"steps":10,"status":"Terminated","reason":null,"reasonTitle":null,"marking":"Marking: off","lastStep":"Last step: stop: t5 (locked → off) fired","halt":null,"haltFit":null,"stepDisabled":true,"events":["coin(off)","push(off)","stop(off)"]}` [M]
- Petri — `p1025_petri.log:38`: `"FINAL",{"steps":4,"status":"Deadlock","reason":"· ε: t2 false","reasonTitle":"ε: t2 (p2 ×2 → p3) false [p3.[tokens] < 1]","marking":"Marking: p2 ×2, p3","lastStep":"Last step: ε: t1 (p1 → p2 ×2) fired","halt":null,"haltFit":null,"stepDisabled":true,"events":[]}` [M]. Combined status+reason reads `Deadlock · ε: t2 false`, matching the expected reading verbatim.
- ESM — `p1025_esm.log:81`: `"FINAL",{"steps":10,"status":"Halted","reason":null,"reasonTitle":null,"marking":"Marking: locked · coins = 3, paid = true","lastStep":"Last step: coin: tc (locked → locked) halted the run","halt":"Halted: coins of demoESM would be 4, outside its domain.","haltFit":{"text":"Halted: coins of demoESM would be 4, outside its domain.","rows":2,"slotRows":2,"height":41,"client":41,"scroll":41,"whole":true},"stepDisabled":true,"events":["coin(off)","push(off)","stop(off)"]}` [M]. `haltFit.whole: true`, `rows: 2` — the halt line sits whole on two rows, not clamped (`scroll <= client`, 41 = 41).
- Flow B — `p1025_flowB.log:60`: `"FINAL",{"steps":6,"status":"Terminated","reason":null,"reasonTitle":null,"marking":"Marking: fin · count = 2","lastStep":"Last step: ε: jn (left, right → fin) fired","halt":null,"haltFit":null,"stepDisabled":true,"events":[]}` [M]

## 5. Docking

`openModel()` (`_tmp_p1025_common.ts:46-61`) activates the model's dock tab by id, then clicks the first visible
`.sim-panel--closed .sim-panel__chip`, then asserts `.dock-tabpane-active` includes the target model id — it
**throws** if the tab or the chip is not found or the pane never activates. Every scene calls it at least twice
(metamodel tab to configure, model tab to run; ESM/Flow B call it three times, once more to declare data). All 16
calls across the four runs (`grep -c openModel` per log, cross-checked against zero thrown-error lines) completed
without exception, and every subsequent `readM2`/`readM1`/`geometry` call in the same run returned non-null
`top`/`headerTop`/`editorTop` — i.e. the panel was open, docked and measurable, not absent. `geometry()` reads the
panel's own bounding box against its parent editor (`_tmp_p1025_common.ts:63-75`); no run reads a null panel after
`openModel` returns. This is the same functional proof the freeze-readiness report used for its M2/M1 face reads
(`docs/discovery/discovery_2026-09-27_freeze_readiness.md` §3.1) — the panel not docking or the chip not existing
would have thrown before any of the FINAL lines in §4 could be produced.

Positive control for this claim of absence-of-failure: `grep -n "no tab\|Error:\|TypeError\|throw"
p1025_{sm,petri,esm,flowB}.log` (all four, `/tmp` originals, same command reachable on the preserved copies) returns
nothing, and the search itself is proven live by every log containing dozens of other matched lines when grepped for
`FINAL` or `RUN` (§4) — the silence is not a broken search.

## 6. Console

`ERROR KINDS` line, one per scene: `{"console: failed to get project {project: null}":1}` — SM
(`p1025_sm.log:49`), Petri (`p1025_petri.log:52`), ESM (`p1025_esm.log:84`), Flow B (`p1025_flowB.log:63`). This
is the kind the prompt names as known. `ERRORS` count is 1 in every run, so no `pageerror` and no second console
error kind appeared.

## 7. Files read

- `docs/prompts/claude_2026-09-28_1025_prompt_scenes_after_staging_merge.md` (this task's own prompt)
- `docs/demo/models_2026_simulator_demo.md`, `docs/discovery/discovery_2026-09-27_freeze_readiness.md`,
  `docs/log-inbox/simulation.md`, `frontend/scripts/smoke/README-probes.md` (RIFERIMENTI)
- `frontend/scripts/smoke/_tmp_m0209_{walk.ts,common.ts,scenario.js,vite.config.ts}` (source of the copies, read on
  `/Users/alfonso/jjodel-release`)
- `frontend/scripts/smoke/_tmp_p1025_{walk.ts,common.ts,vite.config.ts}` (the copies, after edits, this tree)
- `frontend/package.json` (dev script name, `"start": "vite"`)
- `docs/prompts/claude_2026-09-28_0209_prompt_merge_sim-bridge-off-else.md` (checked for a prior report of this
  exact measurement pattern; it is a merge prompt, not a discovery report, so not reused as a template)
- `docs/discovery/lir_2026-09-27_sim_checker_gap.md` (checked for header format; not a measurement report, not
  used as the template)

## 8. Risks and open questions

1. The 12-vs-14 commit-count discrepancy (§1) is unexplained — worth a one-line correction in whatever document
   originated the "12" figure, but out of this task's scope (docs-only, files not listed in DOVE).
2. This measurement covers the four scripted scenes and the docking check only. It does not repeat the broader
   everyday-editor sweep of `discovery_2026-09-27_freeze_readiness.md` §3.2 (undo, redo, persistence) against
   `447e4239b` — that tree has since moved further per this report's own commit range, and was out of scope here.
3. Screenshots were produced but not visually diffed pixel-by-pixel against the `888ea9a9d` baseline's own
   screenshots (which this report did not locate a saved copy of); the verdict rests on the text/DOM readouts in
   §4-§6, which is what the four acceptance readings in the prompt are stated in terms of.
