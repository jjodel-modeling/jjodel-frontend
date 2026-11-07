# Textual syntax, step E (T10 and synced selection), discovery

Prompt-ID: P-2026-11-06-2337
Chat: C-2026-11-03-1037
Front: codegen
Status: eseguito 2026-11-06 · lane full · discovery, no code · report docs/discovery/discovery_2026-11-06_textual_e_sync.md (a5283f565..f0a90f80f) · hard stop, E1-E10 to ratify
Lane: full (discovery, read only)
Depends: step D under way (D1, D2a-c, C2e merged), docs/sessioni/sessione_2026-11-03_textual_ide_plan.md (step E), R-TXT-34
Worktree: ~/jjodel-w-texte, branch textual-e-sync, from 8049bf81b (own node_modules)
Request: https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH (Alfonso 2026-11-06 23:31, «Procedi con E e poi F con /lane auto»)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit on top of 8049bf81b and the tree is clean, otherwise stop with Outcome: blocked. Read only: no source file changes; you write the discovery report and throwaway probes in the lane folder ~/.jjodel-lanes/P-2026-11-06-2337/. Every reply opens with [P-2026-11-06-2337 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD. Write the report section by section, committing after each (RC-51).

## COSA

Step E of the plan: «T10 and synced selection. Scenario 2 and selection synced between text and canvas, both ways, checked with a real canvas gesture. If it enters the critical zone: Layer Impact Report and Alfonso's go-ahead.»

(1) **T10 and scenario 2.** Find what T10 and its scenario 2 are (docs/decisions.md, earlier discovery reports and session files under docs/sessioni/, the textual plan before T7) and state them in the report with their sources; if they cannot be found, say so and list what the textual layer would need for the most likely reading.
(2) **Text to canvas.** What the Text tab knows at the cursor (the tracked spans of objects, `referencesAt`, the outline that follows the cursor) and how the app selects an object on the canvas today (the selection state, who writes it, which events or actions; the D-layer/L-layer path). The smallest way for a cursor move in the text to select the object on the canvas, without a model write.
(3) **Canvas to text.** How the Text tab can follow a canvas selection: where it is read (store subscription, custom DOM event, CLAUDE.md patterns), mapping an object to its span (the tracked spans), reveal and highlight in Monaco (TEXTUAL_REVEAL_COMMAND exists).
(4) **Loops and timing.** Avoiding ping-pong (text selects canvas selects text), the pause-apply cycle (a selection during an unapplied edit), objects without a span (nameless, created on the canvas since the last print).
(5) **Critical zone.** For every file each piece would touch, the CLAUDE.md 3.1 table and 3.2 triggers: say exactly which pieces are outside and which inside, and for the inside ones draft the Layer Impact Report's content.
(6) **Verification.** How a real canvas gesture can be driven in a probe (the existing probes that click on the canvas), and the crops each lane needs.
(7) **Lane plan**: lanes in order, each at five files or fewer, with files, visual yes/no, critical zone yes/no. Decisions E1..En with one recommendation each.

Discovery report, mandatory: docs/discovery/discovery_2026-11-06_textual_e_sync.md (objective, files read with full paths, findings, risks, open questions), committed on the branch, plus the Status flip of this prompt left uncommitted (RC-17). Hard stop after the report. No push, no merge. Public repo: name no partner company. Final message: findings in short, E1..En with recommendations, then the Outcome.

## DOVE

Read: frontend/src/codegen/textual/ (ui/TextualTab.tsx, ui/textualMonaco.ts, languageService.ts, textDiff.ts), the canvas selection code under frontend/src/components/editor-v2/ and the store, CLAUDE.md 3.1, 3.2, 3.12. Write: the report and the lane folder.

## RIFERIMENTI

docs/sessioni/sessione_2026-11-03_textual_ide_plan.md; docs/decisions.md R-TXT-*; docs/discovery/discovery_2026-11-06_textual_d_writing_aids.md (format of the lane plan).
