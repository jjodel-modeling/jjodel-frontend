# JjTL: included models as pills, unbound envLookup stops the run

Prompt: P-2026-11-08-1200, `docs/prompts/claude_2026-11-08_1200_prompt_jjtl_include_pills.md`. Session
c6e9c48c-650b-4083-ac80-7733fdc331c6. Tree: the worktree of `jjtl-include-pills`, HEAD `09784b7e6`. Executor: Anthropic
Claude Opus 5.5. This report is a set of hypotheses with evidence, not a reference: whoever uses it rereads the files.
Each claim is marked measured (a run in this phase, on `09784b7e6`) or read.

## 0. Answer in brief

No stop condition holds, so phase 2 goes on. The dialog's include row can be replaced inside its own folder, and the
executor change is one branch of one builtin.

- **Combobox (read).** The `execute-include-*` classes are used only by the dialog and its `.scss` (measured, §2 H1),
  so they can go. Removing the primary from the included models already happens (H2). The restored selection of D1 needs
  no change (H3). D2 and D3 are superseded by the prompt: the field is always present, disabled when there is no candidate.
- **envLookup (read).** Throw the message of `envValue` where `envLookup` returns `null` today (H5).
- **Stop condition on `.jjtl` (measured).** The tree holds 0 `.jjtl` files (H4). The kernel transformation, held outside
  this repo, names `envLookup` once, in a comment. The embedded JjTL of the tests is settled by the full suite in phase 2.
- **Regression (measured).** `tools/kernel/regress.sh` is not in this tree and cannot run from it; the two SHA prefixes
  come from a different probe, and that probe reproduces both at `09784b7e6` (H6).

Two citations of the prompt do not match the register, and I resolve both by what the prompt describes (H7):

1. Prompt: «exactly like an unbound `envValue` (R-JTG-26)». R-JTG-26 is the several-models decision; the `envValue` error is
   R-FA-11 and R-FA-13. The new rows cite those.
2. Prompt: «Amend the row of R-JTG-28». R-JTG-28 is matching on supertypes; the dialog's row is R-JTG-27. The note goes on
   R-JTG-27, and R-JTG-28 stays untouched.

Decisions awaiting Alfonso: whether those two readings are what was meant. Answered by the chat in P-2026-11-08-1230: yes
to both (§6).

## 1. Files read

`frontend/src/jjtl/components/ExecuteTransformationDialog.tsx`, `frontend/src/jjtl/components/execute-transformation-dialog.scss`,
`frontend/src/jjtl/components/sourceSelection.ts`, `frontend/src/components/CreateProjectDialog/create-project-dialog.scss:140-284`,
`frontend/src/jjtl/executor/executor.ts:3335-3404`, `frontend/src/jjtl/executor/__tests__/env-value.test.ts:1-60`,
`frontend/src/jjtl/SPEC.md:720-740` and `:1086-1089`, `docs/discovery/discovery_2026-11-08_jjtl_multi_source_app.md`,
`docs/decisions.md:7526-7550`, `frontend/scripts/lane-run.mjs:262-285` and `:3439-3500`.

## 2. Hypotheses

**H1. The old classes have no consumer outside the dialog. Holds (measured).** `git grep -n "execute-include" -- frontend`,
with the dialog and its `.scss` filtered out, prints nothing, exit of the listing 0. Positive control through the same tool:
`git grep -c "execute-include" -- frontend/src/jjtl/components/execute-transformation-dialog.scss` prints 8.

**H2. Changing the primary already removes it from the included. Holds (read).** `ExecuteTransformationDialog.tsx:291`:
"setIncludedIds(ids => ids.filter(id => id !== e.target.value));". And `:170`
"const effectiveIncludedIds = orderIncludedIds(compatibleModels.map(m => m.id), includedIds, sourceModelId);" filters
it again at the source of the run.

**H3. D1 needs no change. Holds (read).** `:115` "const restored = restoredSources(getLastRun?.(), compatibleModels.map(m => m.id));"
sets the two states the new field reads.

**H4. No `.jjtl` of the tree reads `envLookup` on a key unbound on purpose. Holds, vacuously (measured).** `git ls-files '*.jjtl'` counts 0
and `find . -name '*.jjtl' -not -path '*/node_modules/*'` counts 0. Positive control of the same `find`: 89 `.ts` files under
`frontend/src/jjtl`. `git grep -l envLookup` in `frontend/` lists only `executor.ts`, `SPEC.md` and three test files. The
guarded form in those tests is `if envHas(v.name) then envLookup(v.name) else mkRef(v)`
(`called-lazy-rules.test.ts:245`). The kernel transformation outside the repo has 1 hit, line 17, a comment:
"-- (envLookup) yields demands, not values, so it cannot feed a name or an integer."

**H5. The executor change is local. Holds (read).** `executor.ts:3365`:
"return (closure ? this.makeDemand({ kind: 'closure', name, closure }) : null) as JjelValue;" against `:3370`:
"if (!closure) throw new Error(`'${name}' is not bound in the environment; envHas tests it`);". The builtin wrapper
adds the rule and the source element to the message, as `SPEC.md:1086` records for `envValue`.

**H6. The regression runs from the tree. Falsified (measured).** `ls tools` gives `acc-shadow`, `harness-capture`,
`harness-observer`, `lane-monitor-app`, no `kernel`; `git ls-files | grep -c regress.sh` counts 0, while `git grep -l regress.sh`
finds the prompt, so the search reaches its subject. The script is held with the kernel inputs outside the repo, takes this tree
as `JJODEL`, and prints `REGRESSION OK` or `FAILED`, not a hash. The two prefixes are SHA-256 of the output of the node probe
of `discovery_2026-11-08_jjtl_kernel_gaps.md` §2. That probe, copied in and removed, gives on `09784b7e6`: arbiter
`5c0d9731c4bb9632`, core `2a34b97ab348ce64`, both `success true`. So phase 2 runs the probe for the prefixes and the script
from where it lives for the 21 Briefs.

**H7. The decision ids of the prompt name what the prompt describes. Falsified twice (read).** `docs/decisions.md:7529`:
"matching on supertypes follows R-JTG-3"; `:7526-7527`, R-JTG-27: "the run dialog keeps a primary source model plus an «also
include» list". For `envValue`, `SPEC.md:1086`: "**Error**, as a failing builtin (R-FA-11, R-FA-13)".

**H8. The dropdown can open downward inside the dialog. Open until the probe.** `.dialog-body` sets `overflow-y: auto`
(`create-project-dialog.scss:146`), so a list that passes the bottom of the body would be clipped or scroll it. Below the field
come the output field and the preview, so a list capped at 136px is expected to fit. Measured in phase 2.

**H9. The ticket closes with `lane-run ticket`. Partly (read and measured).** #758 is on the board's repo, not the code's
(measured with `gh issue view`), card key `2c116557`. The only closing path is `ticket --backfill --plan`, and
`lane-run.mjs:3486` "const step = plan.get(r.key) || { action: 'backlog', front: null };" sends every key the plan omits
to Backlog with `close: false`. So the plan must name every other key as `skip`.

## 3. Constraints on the design

- Vitest runs under `environment: 'node'` with no jsdom and no testing library (measured on `frontend/vitest.config.ts` and
  `package.json`). The key handling and the pill fit go in pure exported functions; the markup is tested with
  `renderToStaticMarkup`; the rest is the probe.
- The `.form-group input` and `.form-group label` rules reach the new input, as they reached the checkbox (D7 evidence).
- The dialog closes on Escape from a `window` listener (`ExecuteTransformationDialog.tsx:135`), so Esc with the dropdown open
  must stop there.

## 4. Scope, above five files (rule 19, RC-11)

All named by the DOVE of the prompt: the dialog and its `.scss`, `IncludedModelsCombobox.tsx` and its test (new), `executor.ts` and
`demand-as-value.test.ts`, `SPEC.md`, `docs/decisions.md`, this report, `docs/log-inbox/hw-notation.md`, the prompt's `Status:` line.
The gates need `frontend/node_modules`: a temporary symlink to the shared one, removed at the end (P14).

## 5. Layer impact

No file of `CLAUDE.md` §3.2 is touched. A run that used to continue past an unbound `envLookup` now stops; no persisted format changes.

## 6. Phase 2, closed by P-2026-11-08-1230

Session 692e140f-6900-4a99-9c3b-9066c62a9914, continuing P-2026-11-08-1200 after its context ceiling. Commits: `ac9ee73cf`
(envLookup), `e92b7d2cc` (combobox), `d4c331168` (the two fixes of the probe). Each figure is measured unless marked read.

**Citations (H7).** The chat confirmed both corrections: the prompt was wrong on both. R-JTG-33 cites R-FA-11 and R-FA-13, not
R-JTG-26; the note on the multi-value select sits on R-JTG-27, not R-JTG-28. Read: R-FA-11 is at `docs/decisions.md:7452`, though the
injected lookup answered «not found» for it. Its header reads `**R-FA-11 (2026-11-03), ...**`, with the date inside the bold.

**H8 holds.** With four options the list spans y 519 to 621 under a field ending at 515, the primary select ends at 415, and the
list sits inside the dialog body. Before and after opening, the rects of the output field, preview, footer and dialog and the body's
scroll and client heights are identical. Background `rgb(255, 255, 255)`, shadow present, on top by `elementFromPoint`, five points of
the primary select still its own.

**The probe found two defects the unit file cannot reach, both fixed in `d4c331168`.**

1. The field measured 36px under a primary select of 38px. The select takes Bootstrap's `.form-select` (padding 6px, line height
   24px, border 1px, auto height), not `--form-input-height`. The field now sets 38px.
2. Adding the last candidate left `isOpen` true with nothing to show, so removing a pill brought the list back. `add` now closes it
   when nothing is left. This path lives in component state, and the unit file runs without a DOM, so the probe is its only cover.

**Probe.** Run on the real dialog: 53 passed and these 3 failed before the fix, 56 of 56 after it. Covered: disabled field with its
placeholder, one-row height, `+N` with shown + N = total and a `title` of exactly the hidden names, a 40-character name truncated,
Esc closing only the list and the next Esc the dialog, click outside, Enter never submitting (list closed, no match, adding), Backspace, x
not opening the list, primary changed to an included model, the run flows, reopening (D1), an older record, an error run naming the key.
Six screenshots viewed: the five crops the prompt lists and one of the `+N` state.

**Kernel, the two SHA prefixes hold.** Arbiter `5c0d9731c4bb9632`, core `2a34b97ab348ce64`, on the probe of H6.

**Kernel, `regress.sh` printed `REGRESSION FAILED`, at its print stage.** The script is not in this tree (H6) and prints a verdict,
not a hash. Under the default `python3` (Homebrew 3.14.6) all 21 Briefs stop before any JjTL runs: `pyexpat` does not load, symbol
`_XML_SetAllocTrackerActivationThreshold` not found in the system `libexpat`. With the system Python 3.9.6 first on `PATH` for that run, all
21 Briefs compare OK object by object with their references, and then the byte comparison of the printed files gives
`printed: 0 identical, 42 different`. The cause of those 42 is not established: a rerun meant to keep the printed files was denied at
the permission prompt, so no printed file was diffed. What is known: this lane changes no file under `frontend/src/codegen`
(`git diff --name-only 09784b7e6 HEAD`, 0 files against 6 for `frontend/src`), and the outcome is the same across all 42 files. Whether
the base commit prints the same way was not run.

**Full suite.** See the log entry for the closing run. One run also reported `irCollapsedRender.test.ts`, a Chromium `afterAll` hook
timing out at 10000ms under the parallel load, with no test failing; alone the file gives 13 of 13.
