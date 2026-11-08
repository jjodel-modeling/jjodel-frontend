# Run dialog: included models as pills in a multi-value select; unbound envLookup stops the run

Prompt-ID: P-2026-11-08-1200
Chat: C-2026-11-03-1202
Front: hw-notation
Status: eseguito 2026-11-08 · lane full · c7b2df61a (report), ac9ee73cf (envLookup); combobox and closure in P-2026-11-08-1230
Lane: full (unattended, Alfonso delegated the open choices to the chat on 2026-11-08 11:55)
Depends: P-2026-11-08-1120 (merged on trunk as 1828934f1)
Worktree: ~/jjodel-w-includepills, branch jjtl-include-pills (fresh from alfonso-frontend-jjtl)
Request: Alfonso, 2026-11-08 11:55: the open list over the primary select is not acceptable; the included models must be a value list where each selected model appears as a pill with an x to remove it, inside the select itself.

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-includepills` on `jjtl-include-pills`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-08-1200 · session <id>]`. Read CLAUDE.md and the last entries of `docs/claude-code-log.md`. No subagents, no background tasks. One probe run per tool call. Print only summary lines of suites and probes. Commit as soon as each item's gates are green. The repo is public: name no partner company and no path outside this tree in anything committed.

## COSA

Phase 1, discovery (short, read-only): read `ExecuteTransformationDialog.tsx`, its `.scss`, `sourceSelection.ts`, the report `docs/discovery/discovery_2026-11-08_jjtl_multi_source_app.md` (D1 to D7), the executor code of `envLookup` and `envValue`, and grep every `.jjtl` file of the tree for `envLookup`. Save the report as `docs/discovery/discovery_2026-11-08_jjtl_include_pills.md` (English, `## 0. Answer in brief` first, each figure marked measured or read). No hard stop after it: go on to phase 2 unless a stop condition below holds.

1. Replace the «Also include» collapsible list with a multi-value select (combobox) in the same row, below the primary Source Model select, with the label «Also include». Behaviour:
   - each included model appears as a pill inside the field, its name and an x button that removes it (accessible name «Remove <model>»); Backspace in the empty field removes the last pill;
   - clicking the field or typing opens a dropdown of the not-yet-included candidates (same candidate rule as today: same metamodel, not the primary), filtered by the typed text; Enter or click adds, Esc or click outside closes;
   - the dropdown opens below the field as an overlay, like any select, opaque, with shadow, above the next field; it never covers the primary select;
   - the field has the height of one input row and does not grow: pills that do not fit collapse into a «+N» pill whose tooltip lists the hidden names. No layout shift of the form when pills are added or removed;
   - with no candidate the field is disabled with placeholder «No other instance of <metamodel>»;
   - changing the primary removes it from the included pills if present (keep today's rule if it already does this);
   - the Execution Preview input shows the primary and the included models, as today.
   Use new class names only; do not rename or remove existing classes that other code uses (grep before removing the old `execute-include-*` rules; dead rules of this dialog may go only if no other file uses them). No new dependency: write the combobox in the dialog's folder with the project's tokens (slate #334155, cyan #0ea5e9, 11px secondary text, 8px grid, Bootstrap Icons `bi-x` for the pill button).
2. Keep D1 (reopening the dialog restores the last included selection). No re-run command.
3. Unbound `envLookup(key)` stops the run with an error, exactly like an unbound `envValue` (R-JTG-26): same error shape and message pattern, naming the key and the rule. `envHas` stays the way to test. This closes ticket #758: add the reproduction of #758 as a test that now fails the run, close the ticket with `lane-run ticket` (or the harness command for closing) pointing to the commit. Stop with `Outcome: question` if any `.jjtl` file of the tree reads `envLookup` on a key that can be unbound on purpose (a guarded read without `envHas`).
4. Register two decision rows next to R-JTG-31/32, in the same header format, `decided by chat under Alfonso's delegation 2026-11-08 11:55, registered by P-2026-11-08-1200, evidence: …, verified: …, reversible: trunk`: R-JTG-33 unbound `envLookup` stops the run; R-JTG-34 the dialog restores the last included selection on reopen, no re-run command. Amend the row of R-JTG-28 only by a note that «Also include» is a multi-value select with pills (D7 of P-2026-11-08-1120 superseded).
5. Probe: rerun the dialog probe, replace the crops, and add crops `4_pills_two_selected.png` (two included models as pills, dropdown closed) and `5_pills_dropdown_open.png` (dropdown open, primary select fully visible). View each crop yourself before committing. Crops go in `~/.jjodel-lanes/P-2026-11-08-1200/crops/`.
6. SPEC §9 and the log entry; the `Status:` line of this prompt.
7. Gates: typecheck, the FULL vitest suite (not only `jjtl/`), build, `check:docs`. Then regression of the kernel transformations: `JJODEL=~/jjodel-w-includepills tools/kernel/regress.sh` must keep the two baseline SHA prefixes (arbiter `5c0d9731c4bb9632`, core `2a34b97ab348ce64`); if it cannot run from the tree, say so and report the exact reason.

## DOVE

`frontend/src/jjtl/components/ExecuteTransformationDialog.tsx`, its `.scss`, a new combobox component file in the same folder with its test, `sourceSelection.ts` and its test if needed, the executor file of `envLookup` and its tests, `frontend/src/jjtl/SPEC.md`, the decisions file holding R-JTG-31, the report, the log. Stop with `Outcome: question` for a critical-zone file (`useJjomSync.ts`, `portDistribution.ts`) or a renamed CSS class.

## COME

Atomic commits, named paths (`git add <files>`, never `git add .`), docs and code never in one commit, conventional messages in English. Do not merge. Close with «Decisions taken (unattended)», «Decisions awaiting Alfonso» and the `Outcome:` line. Context ceiling: write `handoff.md` and stop with `Outcome: hard-stop`.
