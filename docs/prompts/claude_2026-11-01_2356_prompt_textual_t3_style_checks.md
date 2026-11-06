# Textual syntax T3: style checks (R-TXT-16, R-TXT-21 (1) and (10))

Prompt-ID: P-2026-11-01-2356
Chat: C-2026-11-01-1713
Front: codegen
Status: eseguito 2026-11-02 · lane textual-t3 · 7731968ab · verifica visiva non applicabile (nessuna UI)
Lane: fast (new code inside `frontend/src/codegen/textual/` only, no UI)
Depends: T1 (P-2026-11-01-2320, merged by P-2026-11-01-2349); addendum §A.2 (conditions), §A.7 (step T3)
Worktree: ~/jjodel-w-textt3, branch textual-t3 (from the trunk commit that adds this prompt)
Request: https://claude.ai/code/session_01DQt9R64MscerxeR4VTUREe · Alfonso, 2026-11-01 23:50 «ok», /lane auto

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-textt3` on
`textual-t3`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-01-2356 · session <id>]`.
No subagents, no background tasks. Commit as soon as the gates are green.

## COSA

A check that a style applied to a metamodel's base grammar yields an unambiguous concrete grammar (R-TXT-16: a style
is shown unambiguous once, here checked mechanically per metamodel as a guard):
1. the conditions of addendum §A.2 (i) and (ii), as stated there, evaluated on the concrete grammar;
2. case injectivity: a style's keyword case must not merge two keywords or two literals; when it would, the R-TXT-21
   (10) fallback that T1 implemented applies and the check reports the notice;
3. a test oracle with nearley (already a dependency, test code only): on samples generated from the concrete grammar
   of each corpus metamodel, nearley finds exactly one parse (R-TXT-21 (1)).
The check returns a list of findings (`ok`, `notice`, `error` with the rule that failed and where), not a boolean.

## DOVE

New files in `frontend/src/codegen/textual/` (check names with a global search) and tests in its `__tests__/`. nearley
only in tests. No other file; if one must change, stop with `Outcome: question`.

## COME

Tests first: the C-like style on T1's corpus passes; a deliberately broken style (block opener equal to a keyword, two
keywords folding to the same case, a separator equal to a terminator) yields the expected errors; the FAST/Fast
metamodel yields the notice. The sample generator covers every rule of the concrete grammar at least once.

## Lane discipline

`git add <specific files>` only. Commit `feat(codegen): textual style checks (P-2026-11-01-2356)`. Gates:
`npx tsc --noEmit` (baseline), `npx vitest run src/codegen`, `npm run build`, `npm run check:docs`. Visual check not
applicable; say so. Log entry in `docs/log-inbox/codegen.md` and the `Status:` flip of this prompt (edit the line
directly) in one docs-only commit. No push, no merge. End with «Decisions taken (unattended)», «Decisions awaiting
Alfonso», `Outcome: done | hard-stop | question | blocked`.
