# Session 2026-11-02: JjTL abstraction for one generic transformation (chat C-2026-11-02-1541)

## State

Trunk `alfonso-frontend-jjtl` at `91d93fdb1` plus this checkpoint, 20 commits ahead of origin before it. No lane of this chat
running. Slice A0 landed: merge `8f14055bf`, rollback tag `pre-merge-jjtl-a0-2026-11-02`. Worktree `~/jjodel-w-jjtlgeneric`
and its branch are merged and not yet retired.

## Decisions

R-JTG-1..7 in `docs/decisions.md`. Report: `docs/discovery/discovery_2026-11-02_jjtl_generic_transformation.md`.

## Prompts

P-2026-11-02-1425 discovery (context ceiling, handoff), 1612 report, 1742 A0 (one question at the inventory, one ceiling), 1838
rulings and write-back probe, 1905 merge.

## Open

1. Slice A, then B including the write-back change at `ProjectEditor.tsx:1809`: each on its own GO.
2. Q4: whether an M1 model can declare another M1 as a dependency. Q6: who owns a textual notation for template and library models.
3. Nested creation on a class without a declared `name` attribute drops the name (seen in the 1838 probe, cause inferred, not confirmed).
4. Re-running a transformation in the same tab executed a stale AST (`JjtlDevelopmentEnv`, seen in the 1838 probe, not investigated).
5. `init_dash` page error in the 1838 probe, not traced.
6. Two tests failing under a mocked `joiner`, ticketed in `docs/log-inbox/hw-notation.md`.
7. Status of P-2026-11-02-1905 reads «verifica visiva passata»: what was verified is HTTP 200 on 3001 and the probe on the branch tip, not a hand run on the trunk.

## Lessons

Discovery and implementation on this front hit the context ceiling within minutes: split early. A double quote inside a heredoc breaks the osascript call before anything runs.
