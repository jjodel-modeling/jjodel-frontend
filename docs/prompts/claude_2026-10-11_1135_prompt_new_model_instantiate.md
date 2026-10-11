# New project: metaclasses cannot be instantiated (discovery and fix)

Prompt-ID: P-2026-10-11-1135
Chat: C-2026-10-10-0057
Request: Alfonso, 2026-10-11 11:33: «ho testato graphvertex in http://localhost:3080/ .. ho creato un nuovo modello ma non riesco ad instanziare le metaclassi»
Front: maintenance
Lane: full (Phase 1 discovery with a probe, hard stop; Phase 2 on the chat's GO)
Depends: none
Status: da eseguire

Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-newinst`, branch `new-model-instantiate`, created from the trunk commit that adds this file, `frontend/node_modules` symlinked. Before anything else check `pwd`, the branch and a clean `git status`. Otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply opens with `[P-2026-10-11-1135 · session <id>]`. Every final message ends with `Outcome: done | hard-stop | question | blocked`. Every question with a recommendation carries `Recommended: <one line>`. Do not touch the `Status` line.

## What Alfonso saw

On the dev server of `ir-graphvertex` (port 3080, tip `8f94261cc`, the same app code as the trunk after `eb5600dbb`), in a project he had just created, he created a model and could not instantiate the metaclasses of its metamodel. He did not say how he tried. Related findings already on record, read them first:

- graphVertex S4 (P-2026-10-10-1156, inbox `docs/log-inbox/ir-graphvertex-s4.md`): «in a new project every view reads read-only (`reducer.ts:1109`), Kind selector disabled for all kinds».
- An older ticket: `Pointer_ViewPointDefault` missing in new projects.

## Phase 1 (read-only on sources, short)

1. Reproduce with a probe `frontend/scripts/probe/new-model-instantiate.ts`, run by `lane-run probe` on a port of your own (not 3000, 3001, 3003, 3080): a fresh project, a small metamodel with two concrete classes (create it the way a user does, or import a small `.ecore`), a model conforming to it, then every instantiation path a user has: the palette (drag and click), the tree «+» / context menu, Jjodie or JjScript `create` if available. Record for each path: created or not, the console errors, the Redux action trail.
2. Regression or not: run the same probe on the trunk tip and on the tag `pre-ir-graphvertex` (before graphVertex merged) and, if both fail, on the tag `pre-relayout-on-open` or the oldest tag of 2026-10-09. Say from which commit it fails (bisect with the probe if cheap).
3. Root cause with `file:line` and verbatim quotes. Check the read-only views (`reducer.ts:1109`) and the default viewpoint pointer as candidates, not conclusions.
4. Write `docs/discovery/discovery_2026-10-11_new_model_instantiate.md` (P4, `## 0. Answer in brief` first) with a fix proposal, the files it touches, and whether any is a CLAUDE.md §3.2 file (then a draft LIR). Commit probe and report with explicit pathspec and the `Model:` trailer, then stop with `Outcome: hard-stop`.

## NON FARE

- No edit under `frontend/src/` in Phase 1.
- No `git stash`, no `git add .`, no push. Do not touch the `Status` line.
