# Textual syntax, lane D5 continuation: the undo after Format, crops, docs

Prompt-ID: P-2026-11-07-0841
Chat: C-2026-11-03-1037
Front: codegen
Status: da eseguire
Lane: full (diagnostic, possible fix in the D5 files; docs)
Depends: P-2026-11-07-0747 (D5, stopped at the soft ceiling; code 65eda512f, afb9d681b), R-TXT-53
Worktree: ~/jjodel-w-textd5, branch textual-d5-format
Request: none (lane auto, «Procedi con E e poi F»)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No CLAUDE.md 3.1 critical-zone file, no core outside frontend/src/codegen/textual/, no new dependency. Every reply opens with [P-2026-11-07-0841 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call.

## COSA

Finish D5 from its handoff, ~/.jjodel-lanes/P-2026-11-07-0747/handoff.md (read it whole first; its decisions stand).

(1) **The undo after Format.** Run the ready diagnostic (diag-undo.mjs, copied into ~/.jjodel-lanes/P-2026-11-07-0841/ with what it needs; server on a free port) and read its MEAS lines: a typed character then Cmd+Z (control) against Format then Cmd+Z, redo, and after the pause. If the control also undoes to an empty buffer, it is the probe's setup: say so, and set the probe up the way a user does (open the text in the tab, then edit) and confirm one Cmd+Z after Format brings back the unformatted text. If Format alone causes it, find the cause in the D5 files, fix it red first in its own commit, and re-measure. If the fix needs a file outside DOVE, stop with Outcome: question.

(2) **Gates** only if (1) changed code: typecheck, full vitest (baseline 3 import reds; load reds rerun alone and named), build, check:codegen-lazy. Always: npm run check:docs after the log entry.

(3) **Crops.** View 1-before .. 4-broken in ~/.jjodel-lanes/P-2026-11-07-0747/ and say what each shows; add 5-undo (the text after one Cmd+Z following a Format) in this lane's folder.

(4) **Docs**: one log entry in docs/log-inbox/codegen.md via the log-entry skill covering 0747 and this continuation (Notes under 500 characters, Corregge and Causa the dash, Layer Impact Report not-required; the surviving parentheses mutant and the finding about the Indentation style, if the handoff names one). Status flip of both prompt files. Leave all of it uncommitted (RC-17). No push, no merge. Final message: what was verified and how, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/codegen/textual/format.ts, __tests__/format.test.ts, ui/textualMonaco.ts; docs as above. ui/TextualTab.tsx is not touched. Nothing else; ask first.

## RIFERIMENTI

~/.jjodel-lanes/P-2026-11-07-0747/handoff.md, handoff.diff, diag-undo.mjs, probe-d5.out; docs/discovery/discovery_2026-11-06_textual_d_writing_aids.md (§6, §8 D5); docs/decisions.md R-TXT-53.
