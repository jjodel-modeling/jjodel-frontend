# Codegen: an index hole gets the model origin of its last read (R-TXT-13)

Prompt-ID: P-2026-11-01-2015
Chat: C-2026-11-01-1713
Front: codegen
Status: da eseguire
Lane: fast (one engine change plus tests)
Depends: P-2026-11-01-1945 (merged 9e19ecbab); decisions R-TXT-13 (7b1ac5abf)
Worktree: ~/jjodel-w-indexhole, branch index-hole-origin (from the trunk commit that adds this prompt)
Request: https://claude.ai/code/session_01DQt9R64MscerxeR4VTUREe · Alfonso, «ok alle raccomandazioni», 2026-11-01 20:12, question 1

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-indexhole` on
`index-hole-origin`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-01-2015 · session <id>]`.
No subagents, no background tasks. Commit as soon as the gates are green.

## COSA

R-TXT-13: a template hole whose expression is an index read (`${o[f.name]}`, `${o["title"]}`) gets the model origin of
the last read recorded for that hole, when that read's value equals the hole's value; otherwise it stays unlinked, as
today. Today only member reads give a fragment its origin: `readName` (`frontend/src/codegen/engine/origin.ts:199`)
returns `null` for an `IndexAccess`, and only fragments with an origin get `data-origin-id`
(`frontend/src/codegen/ui/GeneratorPane.tsx:594`). Since P-2026-11-01-1945 the evaluator reports index reads with a
string key to `readObserver`, so the read is already in the hole's list of reads; what is missing is using it.

## DOVE

`frontend/src/codegen/engine/origin.ts` only. Tests in `frontend/src/codegen/engine/__tests__/origin.test.ts` (the
test of 1945 that pins the unlinked fragment changes to the new expectation). `GeneratorPane.tsx` should need no
change: if it does, stop with `Outcome: question`.

## COME

Tests first, red before the change: (1) `${s["title"]}` and `${s[f]}` with `f = "title"` give the same origin as
`${s.title}`; (2) an index hole whose last read's value differs from the hole's value (`${s["title"] + "x"}`, or a
transformed value) stays unlinked; (3) a numeric index on an array stays unlinked; (4) the default text generator
(`frontend/src/examples/codegen/default-text.generator.json`) run on a small fixture yields fragments with origins for
attribute values; (5) the existing origin and textMode tests stay green. Mirror the member-read path: same origin
shape, same attribution rules.

## Lane discipline

`git add <specific files>` only. Commit `feat(codegen): index holes take the origin of their last read
(P-2026-11-01-2015)`. Gates: `npx tsc --noEmit` (baseline, no new errors), `npx vitest run src/codegen src/jjel`,
`npm run build`, `npm run check:docs`. Visual check: on a probe port (30xx, not 3000/3001/3003), import the default text
generator, run it, Alt+click a value and save one crop showing the selected model element, under the lane folder. Log
entry in `docs/log-inbox/codegen.md` and the `Status:` flip of this prompt (edit the line directly) in one docs-only
commit. No push, no merge. End with «Decisions taken (unattended)», «Decisions awaiting Alfonso»,
`Outcome: done | hard-stop | question | blocked`.
