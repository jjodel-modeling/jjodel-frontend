# JjScript: `forall` body by element id, Phase 2 (continues P-2026-11-02-2105 after the context ceiling)

Prompt-ID: P-2026-11-02-2140
Chat: C-2026-11-02-1319
Front: maintenance
Status: da eseguire
Lane: full (implementation; Phase 1 is the report of 2105)
Depends: P-2026-11-02-2105 (hard-stop at the ceiling, RC-51; report 4d28b4868)
Worktree: ~/jjodel-w-jjsforallid, branch jjscript-forall-by-id (the same tree)
Request: https://claude.ai/code/session_01DQt9R4VAKm7quiJen8TK1D · RC-51; Alfonso 2026-11-02 20:48 «Decidi tu»

Before anything else run `pwd`, `git branch --show-current`, `git status --short`; if the tree is not
`~/jjodel-w-jjsforallid` on `jjscript-forall-by-id`, clean, with this prompt at HEAD, stop with `Outcome: blocked`. Every
reply opens with `[P-2026-11-02-2140 · session <id>]`. No subagents, no background tasks. Commit as soon as the gates are
green.

## COSA

Read `docs/discovery/discovery_2026-11-02_jjscript_forall_element_by_id.md` and
`~/.jjodel-lanes/P-2026-11-02-2105/handoff.md`; do what the handoff owes for 2105 (its docs entry and Status), in this
lane's closing commit. Then implement the report's Phase 2 with the chat's answers to its four questions (R-FA-10, written
on the trunk by the chat, do not add it here):

1. M2 elements get an `id` field in `commands/eval.ts`, as M1 instances already do. Accepted consequence: `c.id` is visible
   to JjEL, and `==` between two same-shaped distinct elements becomes false. Report every test and consumer this
   changes; a change in generated code output or in codegen is a stop with `Outcome: question`.
2. `commands/instance.ts` and `commands/eval.ts` join the DOVE; seven files is approved.
3. Fix `c.attr` as a target through a forall variable.
4. Identity on targets only, as a string `elementId` on `QualifiedName`; values (`set p.ref = o`) unchanged.

Acceptance: the tests of P-2026-11-02-2105's COSA, on real resolvers where the report's probe did so, plus:

```
forall a, b in classes such that a != b and a.name == b.name do rename b to b.name + "_dup"
forall a, b in classes such that a.name == b.name and a.id < b.id do rename b to b.name + "_dup"
```

The second renames exactly one element of a pair, identical empty twins included. The first matches both orders: state what
it does, with a test. An `id` must not be persisted or written back: test it.

## Lane discipline

`git add <specific files>` only. Commit messages in English, one line, suffix `(P-2026-11-02-2140)`. Gates from `frontend/`
through `node scripts/run-quiet.mjs`: `npx tsc --noEmit`, `npx vitest run src/jjscript src/jjel src/codegen
src/model/validation`, `npm run build`, `npm run check:docs`. Never paste a long log. Log entries in
`docs/log-inbox/maintenance.md`; Status flips of 2105 and of this prompt in the same docs-only commit. No push, no merge.
Report closes with «Decisions taken (unattended)» and «Decisions awaiting Alfonso», then
`Outcome: done | hard-stop | question | blocked`.
