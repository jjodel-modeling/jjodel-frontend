# Textual syntax, step F (embedded JjEL and tracing), discovery

Prompt-ID: P-2026-11-06-2357
Chat: C-2026-11-03-1037
Front: codegen
Status: da eseguire
Lane: full (discovery, read only)
Depends: docs/sessioni/sessione_2026-11-03_textual_ide_plan.md (step F), R-TXT-34; steps D and E under way
Worktree: ~/jjodel-w-textf, branch textual-f-jjel-tracing, from 65852b291 (own node_modules)
Request: https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH (Alfonso 2026-11-06 23:31, «Procedi con E e poi F con /lane auto»)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit on top of 65852b291 and the tree is clean, otherwise stop with Outcome: blocked. Read only: no source file changes; you write the discovery report and throwaway probes in the lane folder ~/.jjodel-lanes/P-2026-11-06-2357/. Every reply opens with [P-2026-11-06-2357 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD. Write the report section by section, committing after each (RC-51).

## COSA

Step F of the plan: «Embedded JjEL and tracing. JjEL strings with highlighting and checking; from a generated line to the model line. Then T8.»

(1) **Where JjEL appears in a textual model.** Which metamodel features hold JjEL (derived attributes, constraints, viewpoint expressions, defaults), how the textual layer prints them today (plain strings?), and the JjEL parser and checker that exist in the codebase (find them, with paths and their public API).
(2) **Highlighting and checking inside the Text tab.** How Monaco can colour a JjEL island inside a string token (semantic tokens on a sub-range, or an embedded language), how JjEL errors become markers at the right offsets inside the string, and how completion inside JjEL could reuse what exists. What the textual parser must expose (the string's span and its raw content).
(3) **Tracing from a generated line to the model line.** The codegen pipeline (generators as viewpoints, R-GEN rows): does it keep any origin per output line today? What a trace needs (model element id per output range), where it would be recorded, and how a click on a generated line reveals the object in the Text tab (and on the canvas, via step E's SELECT_NODE).
(4) **T8.** Find what T8 is (docs/decisions.md, earlier textual plans and discovery reports, session files under docs/sessioni/), with sources; if it cannot be found, say so.
(5) **Critical zone.** For every file each piece would touch, the CLAUDE.md 3.1 table and 3.2 triggers; draft the Layer Impact Report's content for any piece inside.
(6) **Lane plan**: lanes in order, each at five files or fewer, with files, visual yes/no, critical zone yes/no. Decisions F1..Fn with one recommendation each.

Discovery report, mandatory: docs/discovery/discovery_2026-11-07_textual_f_jjel_tracing.md (objective, files read with full paths, findings, risks, open questions), committed on the branch, plus the Status flip of this prompt left uncommitted (RC-17). Hard stop after the report. No push, no merge. Public repo: name no partner company. Final message: findings in short, F1..Fn with recommendations, then the Outcome.

## DOVE

Read: frontend/src/codegen/ (textual/ and the generators), the JjEL parser and checker wherever they live, CLAUDE.md 3.1, 3.2. Write: the report and the lane folder.

## RIFERIMENTI

docs/sessioni/sessione_2026-11-03_textual_ide_plan.md; docs/decisions.md R-TXT-*, R-GEN-*; docs/discovery/discovery_2026-11-06_textual_e_sync.md and discovery_2026-11-06_textual_d_writing_aids.md (format of the lane plan).
