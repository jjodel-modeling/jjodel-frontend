# Defaults: L-layer accessors for `defaultValueLiteral`, decimals refused on integers; lazy gate off mode (R-TXT-25 (8), (9), (10))

Prompt-ID: P-2026-11-02-0653
Chat: C-2026-11-01-1713
Front: codegen
Status: eseguito 2026-11-02 · lane defaults-layer-gate · ffcb21052 · parziale: lazy off red (unguarded imports, ticket)
Lane: fast (inline discovery reported in the log entry)
Depends: P-2026-11-01-2350 and 2351 merged; R-TXT-25
Worktree: ~/jjodel-w-defaultslayer, branch defaults-layer-gate (from the trunk commit that adds this prompt)
Request: https://claude.ai/code/session_01DQt9R64MscerxeR4VTUREe · Alfonso, 2026-11-02 06:43, «Ok alle raccomandazioni»

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-defaultslayer` on
`defaults-layer-gate`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-02-0653 · session <id>]`.
No subagents, no background tasks. Keep context low.

## COSA

1. Restore the L-layer `get_defaultValueLiteral`/`set_defaultValueLiteral` commented out in
   `frontend/src/model/.../LModelElement.tsx` (about `:2326-2331`; find the file), following the neighbouring accessors;
   then make the Ecore export (`EcoreService.ts`) read `attr.defaultValueLiteral` instead of `attr.__raw`.
2. A decimal default literal on an integer-typed attribute (`"2.5"` on EInt, ELong, EShort, EByte) is rejected: JjEL's
   unset read treats it as no declared default and a notice is recorded where the existing code records such notices
   (find it; if none exists, a console warning is enough, say which).
3. `npm run check:codegen-lazy` in «off» mode must not depend on `.env.production`: the gate sets the flag off
   explicitly for that run (`frontend/scripts/gates/check-codegen-lazy.ts`). The production build is not changed.

## DOVE

Inline discovery first. Files: `LModelElement.tsx`, `EcoreService.ts`, `frontend/src/jjscript/executor/commands/eval.ts`,
the gate script, tests next to the existing ones. If more than 5 files or the critical zone, stop with
`Outcome: question`. No interface change beyond restoring the commented accessors.

## Lane discipline

`git add <specific files>` only. Commit `fix(model): defaultValueLiteral accessors, integer defaults, lazy gate off mode
(P-2026-11-02-0653)`. Gates: `npx tsc --noEmit`, vitest on `src/jjscript`, `src/codegen` and the export tests,
`npm run build`, `npm run check:docs`, `npm run check:codegen-lazy` (both modes now green). Visual check not
applicable. Log entry in `docs/log-inbox/codegen.md` (closes the lazy-gate ticket) and the `Status:` flip (edit the
line) in one docs-only commit. No push, no merge. End with «Decisions taken (unattended)», «Decisions awaiting
Alfonso», `Outcome: done | hard-stop | question | blocked`.
