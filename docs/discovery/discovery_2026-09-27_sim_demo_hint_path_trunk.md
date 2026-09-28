# Discovery — the demo script's `Add attribute` hint path, measured on the trunk (ESM preset)

- Prompt-ID: `P-2026-09-27-1500` (chat `C-2026-09-27-1428`)
- Prompt file: `docs/prompts/claude_2026-09-27_1500_prompt_sim_demo_hint_path_probe_trunk.md`
- Session: `7564313d-ab1b-4343-9772-9d516a367fa8`
- Tree: `~/jjodel-icons`, branch `sim-hint-path-probe`, HEAD `49b195a02` (the prompt's docs commit on `86520a8f3`).
  `git status` was empty at the start.
- Executor: Opus 5.5 (session banner)
- Probe lane, fast. No source file was edited. The report is a set of hypotheses with evidence, not a reference:
  whoever uses it downstream re-reads the real files.

---

## 0. Answer in brief

The hint path works on the trunk, and every value the script quotes holds. Two steps diverge in the gestures they
need, not in what the panel shows.

| Script step (`6fd1da38f`) | Verdict |
|---|---|
| 1 (lines 194-195): hint click, groups unfold with Data open, focus on the table's `Add attribute`, in view | confirmed |
| 2 (lines 196-197): row 1 `coins`, `range`, maximum `3`, initial `0` | diverges: the cells are prefilled, and the row's third line is below the fold |
| 3 (line 198, comment 199-200): row 2 `paid`, `derived`, equation | diverges: the second `Add attribute` is below the fold, and so is the row's second line |
| 4 (line 201): the declarations line is gone | confirmed, from the first `Add attribute` click on |
| Run (lines 207-210, and the ten-row table after them) | confirmed, identical in the three variants |

Recommended: the script changes, before the freeze (§6). No code change is needed for the demo.

---

## 1. Hypotheses under test

1. **H1.** On the trunk, the hint's `Add attribute` unfolds the groups with Data open and puts the focus on the
   table's own `Add attribute`, in view, as lane R2 measured on its branch (`86401f845`).
   **Holds** [M]: the same numbers as R2, `{"addTop":926,"bodyBottom":950,"inView":true}` (§4, step 1).
2. **H2.** The two rows typed as the script says give the same declarations as the Configure… path.
   **Holds** [M]: `simStateAttributes` is byte-identical to the `DECLARED` raw of readiness-2's ESM log
   (`/tmp/demo2_scratch/esm.log:17`), in all three variants.
3. **H3.** Steps 2 and 3 can be performed as written, with no gesture the script does not name.
   **Falsified** [M]: new cells hold `x1`, `false` and `1`, and a click leaves the caret after the text. Three
   targets are below the fold when the script reaches them (§4, steps 2 and 3).
4. **H4.** After the hint path the run reads as the script's Run section.
   **Holds** [M]: the `Run interrupted` line, the Reset line and the ten rows, verbatim.
5. **H5** (the prompt's order). Apply after the rows yields the proposal list and the marking line.
   **Partly** [M]. In the script's order, Apply has already run: after the rows it is disabled, with no
   proposals. In the prompt's order, where the hint comes before Apply, Apply works: ten proposals, then
   `Checkable`, and the declarations are kept (§4, row 5).

---

## 2. Objective

The demo script `docs/demo/models_2026_simulator_demo.md` (on `simulation-engine`, commit `6fd1da38f`) flags its
declarations step as the one path never run on the trunk (readiness-2 §7 risk 4). This lane runs that path on the
trunk before the 2026-10-01 freeze and confirms or amends each step.

---

## 3. Setup

- **Code measured.** HEAD `49b195a02`; `frontend/src` equals `86520a8f3` (`git diff --stat 86520a8f3 HEAD --
  frontend/src` is empty). That tree contains R2 `86401f845`, R3 `766b9643c`, polish `5739b950f` and C2 `53c24b1fc`
  (`git merge-base --is-ancestor`, each true).
- **Trunk moved during the lane** [R]. `alfonso-frontend-jjtl` is now at `2e7f966de`, the simulation-engine merge.
  Under `frontend/src` it differs from the measured code in two files only: `simProfiles.ts` adds
  `derivedFromOff` to `validateProfile`, and a test file covers it.
  - `git grep -n validateProfile alfonso-frontend-jjtl -- frontend/src` finds no caller outside the tests. The same
    grep finds the definition at `simProfiles.ts:219`, which is its positive control.
  - So the delta does not reach the panel. This is read, not measured on `2e7f966de`.
- **Probes** (gitignored). The files are `frontend/scripts/smoke/_tmp_hint_common.ts`, `_tmp_hint_scenario.js` and
  `_tmp_hint_vite.config.ts`:
  - each is a copy of the `~/jjodel-sim` `_tmp_demo2_*` file, made by `sed` with port 3011 → 3013, scratch
    `/tmp/hint_scratch`, and `fs.allow` pointing at this tree;
  - apart from their first line, `diff` shows only the port.

  `_tmp_hint_esm.ts` is new. It reuses `_tmp_demo2_esm.ts` but drives the hint path, and has two settings:
  - `VARIANT=script`: profile, Apply, the script's optional Reset on `demoESM`, back to `DemoESM`, the hint, the
    rows, Apply, Reset, the ten inputs;
  - `VARIANT=direct`: the same without the optional Reset;
  - `VARIANT=prompt`: profile, the hint, the rows, Apply, Reset, the ten inputs;
  - `INPUT=fill`: Playwright's `fill`, the table path readiness-2 measured;
  - `INPUT=presenter`: a hand's gesture, then the keys, read before Enter (double-click, click + `Meta+a` on the
    first name, or click on the empty equation).
- **Runs.** Each run was
  `node scripts/lane-run.mjs probe ~/jjodel-icons scripts/smoke/_tmp_hint_esm.ts --port 3013 --config
  scripts/smoke/_tmp_hint_vite.config.ts --id P-2026-09-27-1500`, from `frontend/`, with headless Chromium at
  1600×1000 in light theme (the script's §1 screen).

  | Run | Variant | Input | Exit | Log |
  |---|---|---|---|---|
  | 1 | script | fill | 0 | `/tmp/hint_scratch/script.log` |
  | 2 | direct | presenter | 0 | `/tmp/hint_scratch/direct.log` |
  | 3 | script | fill | 0 | `/tmp/hint_scratch/script2.log`, run 1 plus readers of row geometry and scroll |
  | 4 | prompt | fill | 0 | `/tmp/hint_scratch/prompt.log` |

  - The lane log `~/.jjodel-lanes/P-2026-09-27-1500/probe-_tmp_hint_esm.log` holds all four runs: four `EXIT=0`.
  - Port 3013 was free before the first run (`lsof` exit 1). It was free again after the last one (exit 1).
  - Each run logged one console error, `failed to get project {project: null}`, the known C1 ticket.

---

## 4. Readings, step by step against the script

The canonical run is 3 (`script2.log`). Runs 2 and 4 read the same numbers unless a row says otherwise.

| # | Script says | Trunk reads [M] | Verdict |
|---|---|---|---|
| A (183-184, context) | Apply: `Extended state machine · Checkable`; the declarations line stays, its `Add attribute` in view; groups fold, 198.5 px at 752.5 | status `Extended state machine · Checkable`; `declare {"top":896,"bodyTop":791,"bodyBottom":950,"inView":true}`; geometry `top 752.5, height 198.5`; proposals `[]`, Apply disabled | confirmed |
| 1 (194-195) | Click `Add attribute` in the summary line. Groups unfold with Data open; focus on the table's `Add attribute`, in view | groups `General:true, Control flow:true, Petri net:false, Events:true, Data:true`, Configure… `true`. `document.activeElement` is `BUTTON.sim-panel__decl-add`, the table's control. Its box is 926 to 950 against a body of 105 to 950, `scrollTop 66`, `inView:true`. The panel grows to 884 px at 67. The hint line is still shown, at top 144. Crop `hint_1_after_hint_click_panel.png` | confirmed |
| 2 (196-197) | `Add attribute`. Row 1: name `coins`, Enter; domain `range`; maximum `3`, Enter (the minimum stays 0); initial `0`, Enter | **Values:** `coins`, `Global`, `stored`, `0`, `semantic`, `range`, min `0`, max `3`. **Cells before typing:** name `x1`, initial `false`; after `range`, max `1`. A click leaves the caret after the text: `{"value":"x1","selStart":2,"selEnd":2}`, `{"value":"1","selStart":1,"selEnd":1}`. **Fold:** right after the click, at `scrollTop 66`, lines 1 and 2 (name, metaclass; stored or derived, initial) are in view at 889-913 and 917-941. Line 3 (space, domain) is at 945-969 against a bottom of 950. The domain select shows 5 of its 24 px. The max cell appears on that line. Playwright's own gesture scrolled the body from 66 to 85. Crop `hint_2_row1_panel.png`, after that scroll | diverges: values confirmed; the presenter must select the prefilled text and scroll the body |
| 3 (198; comment 199-200) | `Add attribute`. Row 2: name `paid`, Enter; `derived`; equation `model.[coins] >= 2`, Enter. The comment says: *not measured: the position of the second Add attribute on the hint path … scroll the panel body* | **Values:** `paid`, `Global`, `derived`, `model.[coins] >= 2`, `semantic`, `boolean`. **Fold:** before the click, the second `Add attribute` is at 954-978 against a bottom of 950, `scrollTop 85`, `inView:false`. That is the comment's hypothesis, now measured. After the click, the body is at `scrollTop 125`: row 2 line 1 is at 918-942, in view; line 2 (stored or derived, equation) is at 946-970, below the fold. The new name is `x1` again. Crop `hint_3_declared_panel.png` | diverges: values confirmed; two scrolls and one text selection the script does not name |
| 4 (201) | The declarations line is gone | `declare:null`, `lines:[]`, already in the reading right after the **first** `Add attribute` of step 2, with row 1 still `x1`. Cause: the hint shows only while the rows are empty, `simRoleStatus.ts:349-350` | confirmed (it goes earlier than the step order suggests) |
| 5 (the prompt's Apply after the rows) | not a script step | **Script order:** Apply is `{"disabled":true}` with `proposals:[]` and status `Checkable`: the rows leave nothing pending. **Prompt order:** before Apply the hint sits at top 416, in view, under the ten proposals. After the rows the status is still `… Checkable after Apply` with the ten proposals. Apply then gives `Checkable`, `proposals:[]`, folded groups and no declarations line, and keeps `simStateAttributes`. Crop `prompt/hint_4_after_apply_panel.png` | both orders work; the script's order stays valid |
| 6 (207-210) | After the optional Reset: `Run interrupted: the model changed. Reset to run again.`; Reset: `Marking: locked · coins = 0, paid = false`, `Last step: Reset` | verbatim, both lines (script variant). Run state `attrs {coins:0}`, `derived {paid:false}`, no net defect. Crop `hint_5_marking_panel.png` | confirmed |
| 7 (the ten-row run table) | push … coin, with the halt after step 10 | all ten `Marking:` and `Last step:` lines verbatim. After step 5: `coin(off)`, `push`, `stop(off)`. After step 10: `Halted: coins of demoESM would be 4, outside its domain.` with every event off. The `STEP` lines of runs 2 and 4 are identical to run 3's (`diff`, exit 0), and run 1's equal run 3's | confirmed |

**Presenter input** (run 2, `INPUT=presenter`, read before Enter).

- Click then `Meta+a` then `coins`: the cell reads `coins`.
- Double-click then the value: `3`, `0` and `paid`.
- Click on the empty equation then the value: `model.[coins] >= 2`.
- All five are `ok:true`. This is an automation reading (RC-8).
- The C1 ticket, "keyboard select-all … appends", was seen by the chat in the built-in browser. It is not reproduced
  here, and it stands.
- Double-click is the gesture to script. It replaced the text in all three cells that were double-clicked, and the
  ticket does not name it.

**Focus after Enter** [M]. Every Enter blurs the cell (`SimulationPanel.tsx:309`): the focus goes to `BODY`. The
second `Add attribute` is therefore a click, not a key press.

---

## 5. Code behind the readings [R]

- `frontend/src/components/editor-v2/sim/SimulationPanel.tsx:321-322`, a new row is prefilled:
  `const add = (): void => {` / `commit([...rows, { name: freshName(rows), metaclass: null, space: 'semantic',
  domain: { kind: 'boolean' }, initial: 'false' }]);`
- `SimulationPanel.tsx:223-224`, the name: `function freshName(rows: readonly StateAttributeRecord[]): string {` /
  `for (let n = 1; ; n++) if (!rows.some(r => r.name === \`x${n}\`)) return \`x${n}\`;`
- `SimulationPanel.tsx:274`, `range` sets the maximum to 1: `domain: typed === 'range' ? { kind: 'range', min: 0,
  max: 1 }`
- `SimulationPanel.tsx:309`, Enter blurs the cell: `if (e.key === 'Enter') e.currentTarget.blur();`
- `SimulationPanel.tsx:803-805`, the hint's handler: `setConfigureOpen(true);` / `setOpenGroups(g => ({ ...g, data:
  true }));` / `setFocusAdd(true);`
- `SimulationPanel.tsx:474-475`, only the hint scrolls and focuses: `add?.scrollIntoView({ block: 'nearest' });` /
  `add?.focus();`. The table's own `Add attribute` (`:420`, `onClick={add}`) scrolls nothing. Each new row therefore
  starts where the button was, at the bottom edge of the body, and its lower lines fall below the fold.
- `frontend/src/components/editor-v2/sim/simRoleStatus.ts:349-350`, the hint:
  `declareHint: ACTION_KEYS.some(k => isSetKey(after, k))` / `&& stateAttributeRows(…).rows.length === 0,`

---

## 6. Divergences and recommendation

**Recommended: the script changes, before the freeze.** Nothing here breaks the demo once the script names the
gestures. The code change that would remove the scrolls, scrolling the new row into view on the table's add,
belongs after MODELS.

Proposed wording for the script's owner. It is not applied here: the script is out of this lane's scope.

- **Step 2.** "`Add attribute`. Scroll the panel body to its end: the new row's third line is below the fold [M
  945-969, body bottom 950]. The row reads `x1` and `false`; double-click a cell before typing, since a click leaves
  the caret after the text [M]. Row 1: name `coins`, Enter; domain `range`, then the maximum reads `1`;
  double-click it, `3`, Enter (the minimum stays 0 [M]); double-click the initial value, `0`, Enter."
- **Step 3.** "Scroll the panel body to its end: the second `Add attribute` is below the fold [M 954-978 > 950].
  `Add attribute`, then scroll again: `stored` is below the fold [M 946-970 > 950]. Row 2: double-click the name,
  `paid`, Enter; `derived`; equation `model.[coins] >= 2`, Enter." The HTML comment at 199-200 is replaced by these
  numbers.
- **Step 4.** "The declarations line is gone from the first `Add attribute` on [M]."
- **The sentence at 203.** "10 interactions" still holds for clicks and entries: 1 hint, 2 add, 7 cells. On the
  hint path add "plus three scrolls", and each of the four prefilled cells (name 1, max 1, initial 1, name 2) is
  entered by a double-click instead of a click.

---

## 7. Risks

1. **Headless geometry.** The fold numbers come from headless Chromium at 1600×1000. A real browser with a visible
   scrollbar or other fonts can move them by a few px. The chat's visual check (RC-23) on the demo browser settles
   it. The margins are small, from 19 to 28 px past the fold, so it could go either way.
2. **Cmd+A.** The C1 ticket says select-all appends in the built-in browser; this run does not reproduce it
   headless. The script should say double-click, not Cmd+A.
3. **Trunk at `2e7f966de`.** Measured on `86520a8f3`. The delta is read as not reaching the panel (§3); not re-run.

---

## 8. Questions

1. Does the script take the wording of §6 as is, or does the chat prefer a single "scroll the panel body to its end
   before every table gesture" line?
2. After MODELS, a lane for the table's add, scrolling the new row into view and selecting a prefilled cell on
   focus: open a ticket now, or leave it to the digest?
3. Should the demo browser's run (RC-23) re-read the three fold numbers of §4 before the freeze, given risk 1?

---

## 9. Files and artefacts

**Read.** Full paths under `/Users/alfonso/`.

- `jjodel-sim/docs/demo/models_2026_simulator_demo.md` at `6fd1da38f`: lines 1-40 and 150-230. The working copy
  there is at `a13e3257c` and the file is unchanged since `6fd1da38f` (`git diff --stat`, empty).
- `jjodel-sim/docs/discovery/discovery_2026-09-27_sim_demo_readiness_2.md`: §3 (74-105), §4.4 (219-259), §7-§8
  (333-379), §12 (415-470). It is not in this tree; commit `a41e63496`.
- `jjodel-sim/frontend/scripts/smoke/_tmp_demo2_esm.ts`, `_tmp_demo2_common.ts` and `_tmp_demo2_vite.config.ts`,
  whole. `_tmp_demo2_scenario.js`, header (1-30).
- `jjodel-sim/frontend/scripts/smoke/_tmp_demo2_*` and `/tmp/demo2_scratch/esm.log` were only read: `grep DECLARED`,
  line 17.
- `jjodel-icons/frontend/src/components/editor-v2/sim/SimulationPanel.tsx`: 223-480 and 795-845.
- `jjodel-icons/frontend/src/components/editor-v2/sim/simRoleStatus.ts`: 335-390.
- `jjodel-icons/frontend/scripts/lane-run.mjs`: 40-70 and 459-610.
- `jjodel-icons/docs/log-inbox/simulation.md`: whole.
- `jjodel-icons/docs/claude-code-log.md`: the head.
- `jjodel-icons/docs/decisions.md`: RC-3 to RC-14, RC-16, RC-17, RC-23 and RC-25.

**Probes.** `frontend/scripts/smoke/_tmp_hint_{esm.ts,common.ts,scenario.js,vite.config.ts}`, gitignored
(`.gitignore:68`), kept on disk.

**Logs.** The four logs in `/tmp/hint_scratch/`, as listed in §3, and the lane folder
`~/.jjodel-lanes/P-2026-09-27-1500/` (`probe-_tmp_hint_esm.log`, `vite-3013.log`).

**Crops.** `~/.jjodel-lanes/shots_hint/<variant>/`, where `<variant>` is `script` (run 3), `direct` or `prompt`.
Each variant holds five moments, each saved as `.png` (page) and `_panel.png` (the panel crop):

- `hint_1_after_hint_click`;
- `hint_2_row1`;
- `hint_3_declared`;
- `hint_4_after_apply`;
- `hint_5_marking`.
