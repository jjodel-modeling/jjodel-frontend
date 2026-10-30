# Discovery: refactoring operations that migrate instance data (extract superclass, pull up, move, rename)

Prompt-ID: P-2026-10-24-2321
Chat: C-2026-10-24-0020
Front: jjodie-ui
Lane: discovery (read-only, hard stop)
Depends: none
Status: eseguito 2026-10-24 · lane jjodie-ui-rfb · report docs/discovery/discovery_2026-10-24_refactoring_operations.md · docs only · hard stop
Corregge: none
Request: Alfonso, 2026-10-24 ~23:15 («proceedi con una /lane auto», on mockup B of the refactoring page)
Model: claude-opus-5-5
Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-jjp-rfb`, branch `jjp-rfb`, cut from the trunk at the commit that adds this prompt. Before anything else: `pwd`, branch, `git log -1`, `git status --short`. Otherwise stop.

Design reference: canvas https://claude.ai/artifact/TMWZRPpqBHrVhidqjnSTLJ, board «Refactoring B · Refactoring operations that keep instance data».

## Lane discipline

Every reply opens with `[P-2026-10-24-2321 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`. Read-only: no source file changes, no dev server needed. Time limit: 45 minutes. No subagents, no background tasks. Context discipline: grep-found ranges only, outputs through `tail` or `grep`; if the context passes about 140k, write the report with what you have and stop.

## COSA

Today a metamodel refactoring is a sequence of JjScript editing commands (`delete attribute`, `create abstract class`, `X extends Y`); deleting an attribute drops the slot values of every conforming model, and re-adding it on a superclass does not restore them. The mockup proposes one-line refactoring operations that change M2 and migrate M1 together:

```
extract abstract superclass NamedElement from Person, Role pull name
pull up name from Person, Role
move attribute a from A to B via r
rename Person to Employee
push down a from S to A
inline class C into A
set multiplicity of a in A to 0..1
```

Answer, with file:line and a positive control for every absence:

1. Co-evolution today: what happens to M1 slot values when an M2 attribute or reference is deleted, renamed, moved to a superclass, or its owner gets a new superclass (D-layer, L-layer, the existing co-evolution code and the OrphanStore). Which of these already preserve values.
2. JjScript: where a new command family would go (parser, AST, executor dispatcher, the M2 effects planner), and whether one command can carry an M2 change and an M1 migration in a single TRANSACTION without touching the critical zone (rule 12 of CLAUDE.md).
3. For each operation above: the M2 change, the M1 migration, the cases that can lose data (push down, multiplicity narrowing, type change), and what the planner must report before Apply.
4. Undo: whether R-JJD-6's undo group covers an M2 change plus its M1 migration as one step.
5. A slice plan: operations ordered by value and risk, files per slice, which slices can run in parallel, and the decisions Alfonso has to take (proposed R- rows with a recommendation each).

Write the report to `docs/discovery/discovery_2026-10-24_refactoring_operations.md` and commit it (docs-only). Close it with «Decisions taken (unattended)» and «Decisions awaiting Alfonso». Log entry in `docs/log-inbox/jjodie-ui-rfb.md`, Status of this prompt, in the same docs commit.

## HARD STOP

After the report: `Outcome: hard-stop`.

## NON FARE

No source change. No merge, no push.
