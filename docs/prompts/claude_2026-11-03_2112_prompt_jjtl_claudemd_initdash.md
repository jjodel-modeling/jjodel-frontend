# JjTL housekeeping: CLAUDE.md files, init_dash, the data idiom, two tickets

Prompt-ID: P-2026-11-03-2112
Chat: C-2026-11-03-1020
Front: hw-notation
Status: da eseguire
Lane: fast (small and disjoint; Alfonso's ok of 2026-11-03 21:07)
Depends: none
Worktree: ~/jjodel-w-jjtldocs, branch jjtl-claudemd-initdash (at the commit that adds this prompt)
Request: none (Alfonso's ok of 2026-11-03 21:07; words in request.md of this lane)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-jjtldocs` on
`jjtl-claudemd-initdash`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-03-2112 · session <id>]`.
No subagents, no background tasks. Commit each item.

## COSA

1. Root `CLAUDE.md` section 17: 3 known import failures now (`context-binding`, `ai-prompt-sanitization`, `UDComparator`), not 9. `frontend/src/jjtl/CLAUDE.md` Known limitations: remove `.forAll`, the 7 import-failing files, the `{classes, instances}` duplicate. Only what is measured today. Alfonso's yes covers these two governance edits.
2. Remove `console.error('init_dash')` at `frontend/src/redux/store.tsx:240`, and its entry in `frontend/scripts/smoke/console-baseline.json`. Nothing else in the file.
3. `frontend/src/jjtl/SPEC.md`: document the `data` search as the idiom for all instances of a type, with a short example; note on #519 that `allInstances` is not added for now.
4. Two tickets with `lane-run ticket --front hw-notation --found P-2026-11-03-2112`, a separate call each: re-opening a transformation already open seems to leave its tab button unfindable and its pane hidden (seen by a probe of P-2026-11-03-1315, not diagnosed, medium; `DockManager.updateTab` is a guess); drawing the same reference twice on a non-unique feature adds a second value while the canvas shows one edge, and this must be refused (`syncCreateReferenceLink` does not check for an existing entry; that file is in the critical zone, so ticket only, medium).

## DOVE

The files named above, `docs/log-inbox/hw-notation.md`, the `Status:` line.

## COME

Named paths. Gates: `tsc`, full vitest, build, `check:docs`, and the smoke baseline check if one covers it. Do not merge. Close with «Decisions taken (unattended)», «Decisions awaiting Alfonso» and the `Outcome:` line.
