# Textual syntax, Step 2 (T7): moves between containers and reorder of ordered features

Prompt-ID: P-2026-11-03-1225
Chat: C-2026-11-03-1037
Front: codegen
Status: eseguito 2026-11-03 · lane full · ee2f4ccc6 (discovery cbec3d1bf) · verifica visiva passata 2026-11-03 (chat, RC-23, crops of P-2026-11-03-1321)
Lane: full (write path to a model, JjScript planner outside codegen)
Depends: P-2026-11-03-1207 (merged)
Worktree: ~/jjodel-w-textt7, branch textual-t7
Request: none (handover plan given by Alfonso in chat C-2026-11-03-1037, Step 2; R-TXT-31 (3); line marker agreed 2026-11-03 12:06)

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply.

Before anything else run pwd, git branch --show-current, git log -1, git status --short: the tree is clean on the stated branch, otherwise stop with Outcome: blocked. Do not touch any CLAUDE.md 3.2 file; if the work needs one, stop with Outcome: question.

## Lane discipline
Every reply opens with [P-2026-11-03-1225 · session <id>]. Every final message ends with one line: Outcome: done | hard-stop | question | blocked. A question with a recommendation carries one line: Recommended: <one line>. No subagents, no background tasks. Never cat a probe or gate log: grep only its summary lines, through node scripts/run-quiet.mjs LABEL -- CMD. Commit after each green step. One probe run per tool call; a probe result is valid only if its mtime follows the run. Near the context ceiling, commit and write a handoff in the lane folder.

## Context
Code: frontend/src/codegen/textual/ (textDiff.ts, textMatch.ts, textApply.ts, metamodel.ts, ui/TextualTab.tsx). Decisions: docs/decisions.md section R-TXT, in particular R-TXT-19 (applying a text is a minimal diff with moves), R-TXT-22 (identity: a moved object keeps its id, a pasted copy is new), R-TXT-26, R-TXT-31 (3), R-TXT-32 (a reference outside the text is refused when it changes owner or feature). Today moves and reorder are refused with a reason. The acceptance uses non-hardware metamodels; the RISC-V Briefs stay a read-only regression check.

## COSA

### Phase 1, short discovery (same lane, no stop unless a condition below fires)
Read the JjScript planner for M1 move, frontend/src/jjscript/. Write docs/discovery/discovery_2026-11-03_textual_t7_moves.md (objective, files read, findings with file:line, risks, Decisions taken, Decisions awaiting Alfonso) and commit it. Say where the textual layer can read whether a feature is ordered: local, or from the metamodel's data. Stop with Outcome: question, and write nothing else, if the planner change goes beyond the planner's own files, if `ordered` needs a change to the metamodel's data or an exported interface breaking outside this lane, or if the choice amends a ratified R- row. Otherwise continue.

### Phase 2
Tests first, red before the fix. (1) M1 move support in the planner. (2) textDiff and textMatch yield a move when an object leaves one container and appears in another with the same matched identity: cut and paste keeps the id and every incoming reference; a pasted copy, with the original still there, is a new object. An uncertain match follows R-TXT-18 and R-TXT-22: never a silent guess. (3) The `ordered` flag where the textual layer reads the metamodel; a feature not declared ordered never yields a reorder; an ordered feature yields a minimal reorder. (4) One undo step per application. (5) A refused outer id, R-TXT-32 code `outer`, also gets a marker on its line in the Text tab, not only the status bar line. Small item, only if it falls inside these files: a quoted string on an enum attribute is not checked against the literals; otherwise leave it, and list it in the report.

Mutation bench on the write path. Gates, one tool call each, from frontend/: npx tsc --noEmit; full npx vitest run (9 files red at import are the known baseline, #199); npm run build; npm run check:docs; npm run check:codegen-lazy in both modes.

Acceptance in the app, on a dev server you start in the foreground only for the probe, on a free port: cut and paste an object to another container, id and incoming references intact; reorder an ordered feature; a feature not declared ordered keeps the model order; the outer marker shows; one Undo per application. Keystrokes in the Text tab are a real gesture; any direct model write in the setup is not, so say which you did. Crops of the Text tab, light theme, device scale 1, in the lane folder: before and after the move, before and after the reorder, after Undo, the marker. Code commits with named paths, docs apart. Log entry in docs/log-inbox/codegen.md and Status flip written and left uncommitted until the visual check (RC-17). The repo is public: name no partner company. Stop with Outcome: hard-stop.

## NON FARE
No push, no merge, no references between models, no T4b or later steps, no change to R-TXT-4 or R-TXT-32. Do not touch docs/decisions.md: the chat writes the rows.

## RIFERIMENTI
docs/discovery/discovery_2026-11-01_textual_viewpoint.md (A.5, A.6, A.7); docs/discovery/discovery_2026-11-03_textual_refs_outside_text.md.
