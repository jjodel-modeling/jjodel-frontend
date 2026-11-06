# JjEL: an index read with a string key is traced like a member read (R-TXT-6)

Prompt-ID: P-2026-11-01-1945
Chat: C-2026-11-01-1713
Front: codegen
Status: eseguito 2026-11-01 · lane index-read-origin · edcbad03e · partial: observer done, model origin for o["f"] needs origin.ts (awaiting Alfonso) · verifica visiva non applicabile
Lane: fast (one evaluator change plus tests)
Depends: P-2026-11-01-1709 (merged 5b069a615); decisions R-TXT-1..10 (404452168)
Worktree: ~/jjodel-w-indexorigin, branch index-read-origin (from the trunk commit that adds this prompt, on top of 71aee8fde)
Request: https://claude.ai/code/session_01DQt9R64MscerxeR4VTUREe · Alfonso, «ok alle raccomandazioni», 2026-11-01 19:39, question 6 of the report

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-indexorigin` on
`index-read-origin`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-01-1945 · session <id>]`.
No subagents, no background tasks. Commit as soon as the gates are green.

## COSA

R-TXT-6: `o["f"]` with a string key on a model object notifies `ctx.readObserver` exactly as the member read `o.f`
does, so text printed by reflection keeps its model origin. Today the member read calls
`ctx.readObserver?.(obj, property, value)` (`frontend/src/jjel/evaluator/evaluator.ts:677`) and `evaluateIndexAccess`
(`:1163-1176`) does not (report `docs/discovery/discovery_2026-11-01_default_textual_notation.md` §1.2, the `ORIG`
probe: the dot read carries three spans, the index read one opaque fragment).

Rules: only a string key on an object that the member path would observe; same arguments, same value; a numeric
index on an array, a computed key that is not a string, a missing feature (`o["nosuch"]`) behave as today. Values
returned are unchanged.

## DOVE

`frontend/src/jjel/evaluator/evaluator.ts` (`evaluateIndexAccess` only). Tests next to the existing readObserver or
origin tests (find them with grep; likely `frontend/src/codegen/engine/__tests__/origin.test.ts` and the JjEL
evaluator tests). No other file.

## COME

Read the member-read branch around `:660-680` first and mirror its guard, so both paths decide alike which reads are
observed. Tests, written first and red before the change: (1) `o["width"]` and `o.width` give the same observer call
and, through a template, the same origin span; (2) `o["wid" + "th"]` is observed too; (3) `xs[0]` on an array and
`o["nosuch"]` make no new observer call; (4) the existing origin and textMode tests stay green.

## Lane discipline

R-GEN-10: a JjEL change; it touches no exported interface. `git add <specific files>` only. Commit
`feat(jjel): trace index reads with a string key (P-2026-11-01-1945)`. Gates: `npx tsc --noEmit` (baseline, no new
errors), `npx vitest run src/jjel src/codegen`, `npm run build`, `npm run check:docs`. Log entry in
`docs/log-inbox/codegen.md` and the `Status:` flip of this prompt (edit the line directly) in one docs-only commit.
No push, no merge. Visual check not applicable unless Alt+click on reflective output is easy to show; say which. End
with «Decisions taken (unattended)», «Decisions awaiting Alfonso», `Outcome: done | hard-stop | question | blocked`.
