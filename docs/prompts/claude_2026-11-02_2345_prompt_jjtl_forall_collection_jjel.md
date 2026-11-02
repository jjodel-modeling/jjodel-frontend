# JjTL: the collection of a `forall` is parsed by JjEL

Prompt-ID: P-2026-11-02-2345
Chat: C-2026-11-02-1319
Front: maintenance
Status: eseguito 2026-11-02 · lane fast · jjtl-forall-collection-jjel · 9c0ac6c3d · verifica visiva non applicabile
Lane: fast (one parser rule; the discovery is inline)
Depends: none
Worktree: ~/jjodel-w-jjtlcoll, branch jjtl-forall-collection-jjel (from the trunk tip)
Request: https://claude.ai/code/session_01DQt9R4VAKm7quiJen8TK1D · Alfonso, 2026-11-02 14:21 and 23:42, see request.md of this lane

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-jjtlcoll` on
`jjtl-forall-collection-jjel`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-02-2345 · session <id>]`.
No subagents, no background tasks, no load generators. Commit as soon as the gates are green.

## COSA

Written directly as a forall's collection, this fails with `Expected expression`, because the collection goes through the
old expression parser, which has no object literal (`frontend/src/jjtl/parser/parser.ts` about 497 and 1341), while it works
when bound with `let`:

```
forall pr in requesters.flatMap(q => requesters.filter(r => r.priority > q.priority).map(r => { hi: q, lo: r })) -> Neg { ... }
```

Required: when the parser has the source text, a forall's collection is parsed by JjEL (`parseJjEL` is already imported at
line 51), as far as the forall's own stop tokens (`such`, `->`, and the comma that continues the bindings, R-FA-5). Expressions
that parse today give the same result at run time: pin it with the existing tests, and `git diff` of no test expectation.
Without the source text, the old path stays. Check also `useJjtlParser`, if it parses on its own path. The same limit in other
expression positions is out of scope: list them in the report.

Acceptance, tests in `frontend/src/jjtl/`: the form above gives the same pairs as the `let` form (a test of P-2026-11-02-1331
has the `let` form); a filter and a multi-variable `forall` after a JjEL collection; a parse error keeps a useful position; the
existing JjTL tests unchanged.

## DOVE

`frontend/src/jjtl/parser/parser.ts`, its tests, `frontend/src/jjtl/SPEC.md` one line. Out of scope: `frontend/src/jjel/`, the
executor unless a test shows a need (then one line in the report).

## Lane discipline

`git add <specific files>` only. Commit in English, one line, suffix `(P-2026-11-02-2345)`. Gates from `frontend/` through
`node scripts/run-quiet.mjs`: `npx tsc --noEmit`, `npx vitest run src/jjtl src/jjel`, `npm run build`, `npm run check:docs`.
Verifica visiva non applicabile. Log entry in `docs/log-inbox/maintenance.md`, Status flip in the same docs-only commit. No
push, no merge. Report closes with «Decisions taken (unattended)» and «Decisions awaiting Alfonso», then
`Outcome: done | hard-stop | question | blocked`.
