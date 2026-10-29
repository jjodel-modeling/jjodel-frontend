# Library seal: the pure predicate «is this element sealed» (slice S3)

Prompt-ID: P-2026-10-18-1801
Chat: C-2026-10-18-0110
Front: notation-library
Lane: fast (one new module and its tests, no caller)
Status: da eseguire
Request: Alfonso, 2026-10-18 17:28, «adesso procedi in autonomia fino all'implementazione», on R-LIB-2
Depends: P-2026-10-18-1735 (discovery, `docs/discovery/discovery_2026-10-18_notation_library.md`)
Corregge: —

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-seal`, branch `library-seal`, created by the chat from the local `alfonso-frontend-jjtl` at the docs commit that added this prompt, with `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1` and `git status` match; otherwise stop with `Outcome: blocked`. Runs in parallel with P-2026-10-18-1800 (RC-22), which does not touch `frontend/src/model/`.

Model and tier: standard, Opus 5.5 as pinned (RC-16), effort `high`.

## Lane discipline
Every reply of this session opens with `[P-2026-10-18-1801 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Unattended (RC-21, RC-25): take the recommended answer outside the RC-26 list and record it. Time limit 60 minutes. The discovery report is the discovery (§2.4, §3.4, §9 row S3, «Decisions taken (unattended)» 1 and 4); append a section «Seal predicate S3 (P-2026-10-18-1801)» to it.

## COSA
A pure module `frontend/src/model/librarySeal.ts`, with no React, no Redux, no runtime import from `joiner/` (types only), in the style of `nameLookup.ts`:
- The persisted names (R-B9, permanent once saved): `_state.libraryNotation` and `_state.libraryNotationVersion` on the DProject; `_state.librarySeal` (`true`) on each sealed root (a metamodel, a viewpoint, and any other M2 component root the discovery lists). Export them as constants.
- `isSealedProject(project)`, `isSealedRoot(element)`, and `isSealedTarget(id, lookup)`: walks `father` up to a root and answers whether a write to that element touches a sealed root. The lookup is a function argument (id to plain D-object), so the module runs in node.
- `isAllowedSealedField(field)`: the allowlist of bookkeeping fields M1 work writes on M2 (`pointedBy`, `instances`, per discovery §3.4), plus any the discovery names.
- `sealDecision(action-like {targetId, field}, lookup)`: `allow | refuse` with a reason string, for the future reducer guard (S6) and the UI gates (S5). No caller in this lane.

## Checks
Vitest unit tests next to the module: sealed and unsealed projects, M1 vs M2 targets, nested elements walking to a sealed root, viewpoint children, allowlisted fields, an unknown id, a cycle guard on `father`. A small mutation bench (as done for `nameLookup.ts`) that flips each branch and shows a test fails. Typecheck passes.

## Commits (P13), explicit pathspecs
1. `feat(library): pure seal predicate (S3, P-2026-10-18-1801)` with the module and its tests.
2. Report section, log entry in `docs/log-inbox/notation-library.md` and Status flip in one docs commit (no visual check: this lane has no UI).

No push, no merge (RC-19). `Outcome: done` at the end.

## NON FARE
No caller of the module anywhere. No change to `reducer.ts`, `joiner/`, `consumerMode.ts` or any existing file under `src/`.
