# Release 3.1: the What's new screen for 3.1, with a recall of 3.0

Prompt-ID: P-2026-10-17-0040 · prompt `docs/prompts/claude_2026-10-17_0040_prompt_rel31_welcome_modal.md`
Session: 3a1719a3-aa04-4e41-ada7-45a73a2ab9b8 · tree `~/jjodel-w-welcome31`, branch `rel31-welcome`,
started at `972bd17c3`, code commit `17486a557` · executor: Claude Opus 5.5 (`claude-opus-5-5`).

This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it downstream
rereads the real files. Measures are from runs in this session on `17486a557` (the tree of the code
commit), dev server of this tree on port 3171, Chromium through Playwright, deviceScaleFactor 2.

## 0. Answer in brief

- The modal is the 3.1 screen (`WelcomeModal.tsx`, `WelcomeModal.scss`, commit `17486a557`): title
  «Jjodel 3.1», featured Simulation block with a static three-place Petri net, three «Also new» cards,
  a quieter «New in 3.0» strip, key `jjodel_welcome_3_1_seen`. The 3.0 key is neither read nor deleted.
- Fit (measured): 1280×800, modal 760×740, body scrollHeight 518 = clientHeight 518, no scroll.
  1024×768, modal 760×728, body scrollHeight 518 vs clientHeight 506: the body scrolls by 12 px, the
  bottom of the 3.0 strip is cut until scrolled.
- **Smoke RED, at the top on purpose (P8).** `npm run smoke` on 3171: 0 passed, 3 failed, every state
  `NOT REACHED`, `<div class="wm-backdrop">… intercepts pointer events`. Cause: the harness seeds only
  the 3.0 key, `frontend/scripts/smoke/states.ts:186`, outside this lane's scope. A disposable copy of the
  smoke that also seeds the 3.1 key is GREEN, 12 passed, 0 failed, 3 skipped, quiescent, one boot per
  state. Once this branch merges, every lane's smoke on the trunk is RED until the seed learns the key.
- Other gates: typecheck exit 0, 0 `error TS`; build exit 0 (only the chunk-size warning); no vitest
  file for the component (search and control in §5); `check:docs` in §5.
- Layout departures from the 3.0 numbers, all in the component's stylesheet: modal 680 → 760 px wide,
  max-height 92vh → `calc(100vh - 40px)`, backdrop z-index 1000 → 10001 (above the minimized Jodie
  button, z-index 10000, which painted over the 3.0 modal too).
- Decisions taken unattended: §8, eight items. Decisions awaiting Alfonso: none from the RC-26 list;
  the visual GO is his (P8, RC-23).

Questions:

1. The smoke seed (`states.ts:186`, and `scripts/smoke/README.md:115`) must also set
   `jjodel_welcome_3_1_seen` before or with the merge of this branch; which lane carries it?
   Recommended: a fast lane on this branch, two lines in `states.ts` and its README, merged together with this one.
2. The modal shows once per session, and forever only with «Don't show again» ticked (unchanged
   behaviour, §4 H4); the prompt describes it as once per browser. Keep it?
   Recommended: keep the committed behaviour; it is what 3.0 shipped and the key change alone already re-shows 3.1 to everyone.

## 1. Objective

Turn the 3.0 What's new modal into the 3.1 screen, keeping structure, class names and visual language;
featured Simulation with a markup and CSS illustration, three cards, a secondary 3.0 strip, a new key;
fit without scrolling at 1280×800, usable at 1024×768. Prompt §COSA items 1 to 7.

## 2. Files read (full paths)

- `/Users/alfonso/jjodel-w-welcome31/frontend/src/components/WelcomeModal/WelcomeModal.tsx` (whole, 231 lines at `972bd17c3`)
- `/Users/alfonso/jjodel-w-welcome31/frontend/src/components/WelcomeModal/WelcomeModal.scss` (whole, 419 lines at `972bd17c3`)
- `/Users/alfonso/jjodel-w-welcome31/frontend/src/components/WelcomeModal/index.ts`
- `/Users/alfonso/jjodel-w-welcome31/frontend/src/App.tsx:59`, `:184` (mount point)
- `/Users/alfonso/jjodel-w-welcome31/CHANGELOG.md`, section `[3.1.0]` (whole)
- `/Users/alfonso/jjodel-w-welcome31/frontend/scripts/smoke/states.ts:55-110`, `:170-200`; `README.md` (smoke) `:1-60`, `:105-125`; `README-probes.md:1-140`
- `/Users/alfonso/jjodel-w-welcome31/frontend/src/components/Jodie/JodieWindow.css:845-861`
- `/Users/alfonso/jjodel-w-welcome31/frontend/src/styles/CLAUDE.md` (§7), `docs/PROTOCOL.md` P1-P9, P13-P16, `docs/decisions.md` (whole), `docs/claude-code-log.md:1-80`

## 3. Copy as shipped

Read from the DOM of the running modal (`probe-final.log`, `text` block), equal to the source.

- Hero: label «What's new» (unchanged); title «Jjodel 3.1»; sub «Simulation, derived viewpoints, containers and validation.»
- Featured: tags «Simulation», «New»; title «Run your models»; text «Automata, Petri nets, Moore and Mealy
  machines and statecharts run step by step, with events, guards and actions. Step back, replay a run as a
  scenario, see coverage on the canvas, and drive the model from an I/O board with buttons, LEDs and a clock.»
- Illustration: places `ready` (2 tokens), `busy` (0), `done` (1); transitions `start` (enabled, green),
  `finish` (not enabled); state «Running · step 2». `aria-label` «A Petri net at step 2 of a run: place ready
  holds two tokens, busy none, done one; transition start is enabled.» The marking is reachable: 3 tokens in
  `ready`, one `start` and one `finish` fired.
- Pills: «Step / Play», «Scenarios», «Coverage», «I/O board».
- «Also new»:
  - tag «Viewpoints», «Derive viewpoint»: «A full viewpoint from a metamodel in one click, in your notation: statechart, Petri net, flowchart, UML activity, ER (Chen) and more.»
  - tag «Canvas», «Containers and Auto layout»: «Containers drawn as frames and partitions. Auto layout in the toolbar arranges the whole graph.»
  - tag «Rules», «Validation»: «Your own rules, the Validate command, and violation dots on the instances.»
- «New in 3.0»: «JjTL model-to-model transformations», «Transformation Editor», «Jj-languages: JjTL, JjEL, JjScript, JjModal», «Documentation generation».
- Footer unchanged: «Don't show again», «Close», «Explore what's new →» (opens `https://jjodel.io/whats-new/`).

Copy rules, measured over the 36 strings of the DOM: no `!`, no em dash (`—`); `command grep -c '—'` on the
TSX returns 0, control on `CLAUDE.md` returns 70. «generat» occurs only in «Documentation generation»;
`command grep -n "code generator\|codegen"` on the TSX exits 1. No marketing adjective by reading.

## 4. Hypotheses and verdicts

- **H1. The specified content fits at 1280×800 in the 3.0 visual language.** Partly. At the 3.0 width
  (680 px) the first measured build overflowed the body by 80 px at 1280×800 (scrollHeight 594, clientHeight
  514, `probe-size-1.log`): «Derive viewpoint» ran to 6 lines and the 3.0 strip wrapped. Holds after three
  layout changes (§8 D3-D5) and one copy edit (D6): body 518 = 518 (measured, `probe-final.log`).
- **H2. The 3.0 key is left untouched.** Holds, measured: with `jjodel_welcome_3_seen = "1"` seeded the 3.1
  modal shows; after Close and a reload the old key still reads `"1"`, the new one `null` in localStorage and
  `"1"` in sessionStorage. Source: `WelcomeModal.tsx:6` `const STORAGE_KEY = 'jjodel_welcome_3_1_seen';`, the
  only key the component reads or writes (`:23`, `:24`, `:30`, `:31`).
- **H3. Nothing outside the component depends on the key.** Falsified. `frontend/scripts/smoke/states.ts:186`
  `localStorage.setItem('jjodel_welcome_3_seen', '1');` under the comment `:184-185` «WelcomeModal renders a
  full-screen backdrop that swallows clicks»; `scripts/smoke/README.md:115` lists the same key. Measured: smoke
  RED (§0). Read: `frontend/scripts/benchmarks/bench_baseline.mjs:39` closes the modal by its «Close» / «✕»
  buttons, both unchanged, so it is not affected.
- **H4. The modal shows once per browser (the prompt's description).** Falsified, read and measured.
  `WelcomeModal.tsx:30-31` (unchanged): `sessionStorage.setItem(STORAGE_KEY, '1');` and
  `if (dontShow) localStorage.setItem(STORAGE_KEY, '1');`. Measured: after Close without the tick a new tab of
  the same browser shows the modal again (`newTabNoTick.shown: true`); after ticking «Don't show again» a
  new tab does not (`newTabAfterTick.shown: false`). Question 2.
- **H5. The docs site has pages for the 3.1 features.** Falsified for Simulation, read: `sitemap-0.xml` of
  docs.jjodel.io lists 43 URLs; a filter on `simul|viewpoint|valid|layout|contain|deriv|notation|board|petri`
  returns 5, none on simulation (`user-guide/validation/`, `user-guide/viewpoints/`, and three others).
  Control: the same list holds `user-guide/dashboard/`, which the app already links. Whether the validation
  and viewpoints pages describe the 3.1 features was not read (the fetch was refused). Hence D2.
- **H6. No component test exists.** Holds: `command grep -rln "WelcomeModal" src --include='*.test.*'` from
  `frontend/` exits 1; control, the same command for `describe(` lists 350 files.

## 5. Gates (on `17486a557`)

| Gate | Result |
|---|---|
| `npm run typecheck` | exit 0, 0 `error TS` (baseline 0) |
| vitest | not run: no test file for the component (H6) |
| `npm run build` | exit 0; one chunk-size warning, 43 Sass `@import` deprecation lines, none naming WelcomeModal |
| `SMOKE_URL=http://localhost:3171 npm run smoke` | **RED**, 0 passed / 3 failed, all states NOT REACHED, backdrop intercepts clicks; quiescent, boots 1/1/1 |
| same smoke, copy seeding the 3.1 key (`_tmp_wm31_run.ts`) | GREEN, 12 passed / 0 failed / 3 skipped, quiescent, one boot per state |
| `npm run check:docs` | run after this report and the inbox entry; result in the closing message |

Logs in `~/.jjodel-lanes/P-2026-10-17-0040/`: `typecheck-final.log`, `build-final.log`, `smoke-final.log`,
`smoke-control-final.log`, `probe-final.log` (the earlier `probe-size-*.log` are the tuning runs).

## 6. Measures

| | 1280×800 | 1024×768 |
|---|---|---|
| modal (w × h, top) | 760 × 740, 30 | 760 × 728, 20 |
| hero / body / footer | 153 / 518 / 69 | 153 / 506 / 69 |
| body scrollHeight vs clientHeight | 518 vs 518 | 518 vs 506 |
| featured / illustration / grid / 3.0 strip | 235 / 52 / 151 / 49 | same |
| lines: featured text, cards | 3; 4, 3, 3 | same |
| 3.0 chips on one line, right edge vs container | yes, 969 vs 992 | yes, 841 vs 864 |
| element painted over the modal (hit test) | none | none |

Before D5 the hit test at (290, 680) at 1280×800 returned `I.bi bi-robot`, inside
`BUTTON.jodie-minimized` `position: fixed; z-index: 10000` (`JodieWindow.css:847-854`), above the backdrop's
1000. It covered the «New in 3.0» label and the first chip. Links in the body: 0.

## 7. Crops (`~/.jjodel-lanes/P-2026-10-17-0040/crops/`, from the final probe run)

- `01_modal_1280x800.png`: the whole modal at 1280×800, hero to footer.
- `01b_viewport_1280x800.png`: the viewport at 1280×800 with the modal over the projects page.
- `01_modal_1024x768.png`: the whole modal at 1024×768, body at scroll 0.
- `01b_viewport_1024x768.png`: the viewport at 1024×768 with the modal.
- `02_featured_closeup.png`: the featured Simulation block, tags to pills.
- `03_petri_closeup.png`: the Petri-net illustration strip with the run state on the right.
- `04_recall_3_0_closeup.png`: the «New in 3.0» strip.
- `05_after_dismiss_reload_1280x800.png`: the projects page after Close and a reload, no modal.

## 8. Decisions taken (unattended)

- **D1.** Show logic unchanged (once per session, forever with the tick); only the key changed. Question 2.
- **D2.** The featured block and the three cards are static (`wm-featured--static`, new; `wm-card--static`,
  existing), no arrow and no link: no docs page found for Simulation (H5). The footer button still opens
  `https://jjodel.io/whats-new/`.
- **D3.** Modal 680 → 760 px wide (`WelcomeModal.scss:21`): at 680 «Derive viewpoint» needs 6 lines and the
  3.0 chips wrap. Fits the 1024 viewport with the 20 px backdrop padding.
- **D4.** Max height 92vh → `calc(100vh - 40px)` (`:29`), the box the backdrop padding leaves.
- **D5.** Backdrop z-index 1000 → 10001 (`:9`), above the minimized Jodie button. While the modal is open
  that button cannot be clicked; Close or a click on the backdrop dismisses the modal as before.
- **D6.** Copy: «in your notation» instead of «in the notation you pick» (4 lines instead of 5); hero sub
  rewritten to one line (the 3.0 sub was 3.0 copy); 3.0 item «Jj-languages: JjTL, JjEL, JjScript, JjModal».
- **D7.** Illustration: the Petri net, not the I/O board; reused `.wm-code-wrap` / `.wm-code-body` as its frame;
  places drawn with an inset ring so the place and transition labels share one baseline.
- **D8.** The scroll-sync effect and the two refs of the removed code block are deleted with it (they served
  only that block); the now unused SCSS rules stay, marked `// TODO: cleanup` (`:213`, `:449`), rule 9.
  Also unused and left unmarked: `.wm-tag--jjtl`, `.wm-card-tag--slate`, `.wm-featured-arrow`, `.wm-card-arrow`.

## 9. Decisions awaiting Alfonso

None from the RC-26 list. The visual GO on the crops is his (P8, RC-23). Question 1 asks for a file outside
this lane's DOVE list, so it is not adopted here.

## 10. Risks and residue

- The smoke stays RED on any tree carrying `17486a557` until `states.ts:186` seeds the 3.1 key (question 1).
- Font metrics: the 3.0 strip has 23 px of slack on one line in Inter; a wider fallback font wraps it
  (`flex-wrap`), costing about 22 px of height.
- Left in the tree, gitignored: `frontend/scripts/smoke/_tmp_wm31_probe.ts`, `_tmp_wm31_copy.ts`,
  `_tmp_wm31_robot.ts`, `_tmp_wm31_run.ts`, `_tmp_wm31_states.ts`. The dev server on 3171 is left running
  for the chat's visual check (`vite-3171.log`).
