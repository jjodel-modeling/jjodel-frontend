# Include pills: close the lane after its context ceiling

Prompt-ID: P-2026-11-08-1230
Chat: C-2026-11-03-1202
Front: hw-notation
Status: eseguito 2026-11-08 · lane full · e92b7d2cc (combobox), d4c331168 (probe fixes), 08384ff6e (SPEC), a7b5a12a2 (decisions), 6d99cd048 (report)
Lane: full (continues P-2026-11-08-1200 after its context ceiling; unattended)
Depends: P-2026-11-08-1200
Worktree: ~/jjodel-w-includepills, branch jjtl-include-pills (the same tree, with its uncommitted combobox)
Request: none (continuation of P-2026-11-08-1200)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-includepills` on `jjtl-include-pills`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-08-1230 · session <id>]`. No subagents, no background tasks. One probe run per tool call. Print only summary lines of suites and probes. Commit as soon as each item's gates are green. The repo is public: name no partner company and no path outside this tree in anything committed.

## COSA

Read only `~/.jjodel-lanes/P-2026-11-08-1200/handoff.md`, `git status` and the prompt of P-2026-11-08-1200 (items 1 to 7 there stay the spec). Do not redo the design or the `envLookup` fix.

Answers of the chat to the two open points of P-2026-11-08-1200: the new row on unbound `envLookup` cites R-FA-11 and R-FA-13, not R-JTG-26; the note that «Also include» is a multi-value select with pills goes on R-JTG-27 (the dialog's row), not R-JTG-28. The prompt was wrong on both citations; say so in the report.

1. Typecheck and build with the combobox, then commit it with its tests (code commit).
2. Run the probe in the browser and check what the unit tests could not: pills fit in one row and collapse into «+N» with a tooltip; the dropdown opens below the field and the primary select stays fully visible; Esc and click outside close it; Enter never submits; reopening the dialog restores the last included selection (D1). Fix what fails in the dialog's own files, new class names only. Write the crops listed in item 5 of P-2026-11-08-1200 into `~/.jjodel-lanes/P-2026-11-08-1230/crops/`, including `4_pills_two_selected.png` and `5_pills_dropdown_open.png`, and view each of them yourself before committing.
3. Decision rows R-JTG-33 and R-JTG-34 and the note on R-JTG-27, as specified in P-2026-11-08-1200 item 4 with the corrected citations; SPEC §9; the rest of the report `docs/discovery/discovery_2026-11-08_jjtl_include_pills.md`; the log entry; the `Status:` lines of this prompt and of P-2026-11-08-1200.
4. Close ticket #758 pointing to `ac9ee73cf`, with the plan that lists every other ticket as `skip`, as the handoff says.
5. Gates: typecheck, the FULL vitest suite, build, `check:docs`. Remove the temporary `frontend/node_modules` symlink at the end and say so.

## DOVE

The files of the handoff's scope. Stop with `Outcome: question` for a critical-zone file (`useJjomSync.ts`, `portDistribution.ts`) or a renamed CSS class.

## COME

Atomic commits, named paths, docs and code never in one commit. Do not merge. Close with «Decisions taken (unattended)», «Decisions awaiting Alfonso» and the `Outcome:` line. Context ceiling: write `handoff.md` and stop with `Outcome: hard-stop`.
