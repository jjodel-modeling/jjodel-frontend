# Textual syntax: write the name slot of an object created from text (option A)

Prompt-ID: P-2026-11-07-0344
Chat: C-2026-11-03-1037
Front: codegen
Status: da eseguire
Lane: full (textual layer; tests)
Depends: P-2026-11-07-0253 (discovery docs/discovery/discovery_2026-11-07_textual_name_slot.md, option A, §8), R-TXT-56 (provisional)
Worktree: ~/jjodel-w-textns, branch textual-name-slot
Request: https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH (lane auto, Alfonso 2026-11-06 23:31)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No CLAUDE.md 3.1 critical-zone file; instance.ts and the core are not touched. Every reply opens with [P-2026-11-07-0344 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call. Each item: test red first, its own commit (RC-51, code first).

## COSA

Option A of the report: the textual layer writes the name slot explicitly.
(1) textDiff.ts:549: when an object is created and its handle equals its name, still emit the `set <h>.name = "<name>"` line after the create (today skipped by `name !== h`). Tests in __tests__/textDiff.test.ts red first: a created Module, Port and Ref get their slot written; the five tests that pin the exact script lines are updated to the new lines (say which in the commit body).
(2) modelLines.ts:141 («New model from text»): the same, tests in __tests__/modelLines.test.ts red first.
(3) No migration of objects already created with an empty slot (N3: a rename heals them).
(4) Gates, one tool call each, from frontend/: npm run typecheck; full npx vitest run (3 baseline import reds; the timing tests of languageService and outline rerun alone if red under load); npm run build; npm run check:docs; npm run check:codegen-lazy.
(5) App check on the port corpus (the discovery's probe in ~/.jjodel-lanes/P-2026-11-07-0253/ as the base): create from text, the raw slot of `cpu`, `result`, `ready` holds the name, conformance has no warning on `cpu`, and the XMI export has the names. Crop of the Text tab with no warning on `cpu`, light theme, scale 1, in ~/.jjodel-lanes/P-2026-11-07-0344/. Stop the server.
(6) Log entry in docs/log-inbox/codegen.md via the log-entry skill (Notes under 500 characters; Corregge: the prompt that introduced the skip if the report names it, else the dash; Causa from the report), Status flip, uncommitted (RC-17). No push, no merge.

## DOVE

frontend/src/codegen/textual/textDiff.ts, the file holding modelLines.ts (path as in the report), __tests__/textDiff.test.ts, __tests__/modelLines.test.ts. Nothing else; ask first.

## RIFERIMENTI

docs/discovery/discovery_2026-11-07_textual_name_slot.md; docs/decisions.md R-TXT-45, R-TXT-56.
