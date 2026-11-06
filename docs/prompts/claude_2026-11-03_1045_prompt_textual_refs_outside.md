# Textual syntax, Step 1: references outside the text

Prompt-ID: P-2026-11-03-1045
Chat: C-2026-11-03-1037
Front: codegen
Status: eseguito 2026-11-03 · lane fast · 5a9ce5ec4 · hard-stop at the context ceiling (RC-51), closed by P-2026-11-03-1141 · verifica visiva passata 2026-11-03 (chat, RC-23, crops in ~/.jjodel-lanes/P-2026-11-03-1141/; R-TXT-32 ratified by Alfonso)
Lane: full (printer and parser grammar, design choice before the code)
Depends: none
Worktree: ~/jjodel-w-textrefs, branch textual-refs-outside
Request: none (handover plan given by Alfonso in chat C-2026-11-03-1037; decision in R-TXT-31)

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply.

Before anything else run pwd, git branch --show-current, git log -1, git status --short: the tree is clean on the stated branch, otherwise stop with Outcome: blocked. Do not touch any CLAUDE.md 3.2 file (useJjomSync.ts and the others); if the fix needs one, stop with Outcome: question.

## Lane discipline
Every reply opens with [P-2026-11-03-1045 · session <id>]. Every final message ends with one line: Outcome: done | hard-stop | question | blocked. A question with a recommendation carries one line: Recommended: <one line>. No subagents, no background tasks. Never cat a probe or gate log: grep only its summary lines, through node scripts/run-quiet.mjs LABEL -- CMD. Commit as soon as a step is green. One probe run per tool call. If you approach the context ceiling, commit and write a handoff in the lane folder.

## Context (do not redo this analysis)
Code: frontend/src/codegen/textual/. Decisions: docs/decisions.md section R-TXT, in particular R-TXT-4 (a reference prints the target name when unique among the instances of the reference type, else its containment path), R-TXT-19, R-TXT-22, R-TXT-26, R-TXT-30, R-TXT-31. Editable Text tab landed with T6b (merge of P-2026-11-03-0543).

The defect, measured: a single-valued reference to an object outside the text (an object the printed text does not contain, for example in another model) prints no value, so the text does not parse and that model cannot be edited from text. The model stays untouched. Alfonso's closure criterion for the notation is that an existing model can be edited from the text; this is the main hole in it. R-TXT-4 does not say what such a reference prints.

## COSA

### Phase 1, design (stop here)
Reproduce the defect with a failing test on a non-hardware metamodel (a library or family-style fixture), and commit nothing but the test only if it is marked expected-fail; otherwise leave it for Phase 2. Read how the printer resolves the target, how the parser and the diff/apply path resolve references, and what happens to a multi-valued reference with mixed inner and outer targets. Then write the report docs/discovery/discovery_2026-11-03_textual_refs_outside_text.md (objective, files read with paths, findings with file:line and verbatim quotes, risks, open questions, Decisions taken (unattended), Decisions awaiting Alfonso), commit it, and stop with Outcome: question.

The report recommends ONE syntax for the outer reference, with rejected alternatives and why. The syntax must: be read back by the parser; pass the LL(1) and style checks of every style, present and future (Pascal/Ada, indentation); leave the reference unchanged when an edit elsewhere in the text is applied; never be a silent re-resolution by name to a different object; stay valid if the target disappears (a reported issue, no write); not presuppose the model-to-model reference work (references between models are a later front of JjTL and codegen) and not break when that arrives. State what the user may do to such a value in the text in this slice: at minimum keep it verbatim, and say what happens on deleting or retyping it. Say which R- row the choice would add, and whether it amends any.

### Phase 2 (only after the chat resumes this session with the answer)
Tests first, then printer, parser and apply. Mutation bench on the write path. Gates, one tool call each, from frontend/: npx tsc --noEmit; full npx vitest run (9 files red at import are the known baseline, ticketed); npm run build; npm run check:docs; npm run check:codegen-lazy in both modes. Acceptance in the app, on a dev server you start in the foreground only for the probe, on a free port: such a model opens, its Text tab parses, an attribute edit applies, the reference is intact, one Undo restores both. A direct model write in a probe is not a canvas gesture, and a unit test is not a check in the app: say exactly which you did. Crops of the Text tab, light theme, saved in the lane folder. Code commit(s) with named paths, docs apart. Log entry in docs/log-inbox/codegen.md and Status flip left uncommitted until the visual check (RC-17). The repo is public: name no partner company. Stop with Outcome: hard-stop.

## NON FARE
No push, no merge, no references between models, no T7, no change to R-TXT-4's behaviour for targets inside the text. RISC-V Briefs stay as a read-only regression check.

## RIFERIMENTI
docs/discovery/discovery_2026-11-01_textual_viewpoint.md (A.5, A.6, A.7); docs/sessioni/sessione_2026-11-01_default-textual-notation.md, last section.
