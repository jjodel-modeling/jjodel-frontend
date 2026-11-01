# Codegen: check R-TXT-5 and R-TXT-12 on real JjEL reads, fix the default text generator if they fail

Prompt-ID: P-2026-11-01-2016
Chat: C-2026-11-01-1713
Front: codegen
Status: da eseguire
Lane: fast (a probe in the app, then at most a change to the generator file and its test)
Depends: P-2026-11-01-1946 (merged 0e5d9152d); decisions R-TXT-5, R-TXT-12 (7b1ac5abf)
Worktree: ~/jjodel-w-textreads, branch default-text-real-reads (from the trunk commit that adds this prompt)
Request: https://claude.ai/code/session_01DQt9R64MscerxeR4VTUREe · Alfonso, «ok alle raccomandazioni», 2026-11-01 20:12, questions 4 and 5

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-textreads` on
`default-text-real-reads`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-01-2016 · session <id>]`.
No subagents, no background tasks.

## COSA

The unit test of the default text generator (`frontend/src/codegen/engine/__tests__/defaultText.test.ts`, lines
about 42-66) builds mock handles whose unset slots read `null`. Real JjEL handles do not: a mandatory or defaulted
attribute reads its default when unset (report `docs/discovery/discovery_2026-11-01_default_textual_notation.md`
§1.4, `:786-795`). R-TXT-5 says those always print. Check it on real reads, and check R-TXT-12 (feature order on a
multiple-inheritance shape that is not a diamond: for example C extends B1, B2 where B1 extends A and B2 has no
supertype).

1. In the app on a probe port (30xx, not 3000/3001/3003), build a metamodel with: an optional attribute without
   default, a mandatory integer, a boolean with no default, an attribute with a declared default, a multi-valued
   attribute, and the inheritance shape above. Create one object setting none of them. Import
   `frontend/src/examples/codegen/default-text.generator.json` and run it. Record the output and, with a small
   JjEL hole, what each attribute reads.
2. Compare with R-TXT-5 and R-TXT-12. If both hold, add no code: record the output in the log entry.
3. If either fails, fix the generator file, and change the mock in `defaultText.test.ts` so that unset slots read as
   real handles do (default of the type, declared default, `null`, empty list), with a test for each case and one for
   the non-diamond shape. Do not change any R-TXT rule; if a rule cannot be met, stop with `Outcome: question`.

## Lane discipline

Files: the generator file and its test only. `git add <specific files>` only. Commit, if any,
`fix(codegen): default text generator on real reads (P-2026-11-01-2016)`. Gates: `npx tsc --noEmit` (baseline),
`npx vitest run src/codegen`, `npm run build`, `npm run check:docs`. One crop of the output under the lane folder. Log
entry in `docs/log-inbox/codegen.md` (with the probe output) and the `Status:` flip of this prompt (edit the line
directly) in one docs-only commit. No push, no merge. End with «Decisions taken (unattended)», «Decisions awaiting
Alfonso», `Outcome: done | hard-stop | question | blocked`.
