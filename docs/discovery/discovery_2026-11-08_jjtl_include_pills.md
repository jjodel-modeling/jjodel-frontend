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

Decisions awaiting Alfonso: whether those two readings are what was meant.

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
