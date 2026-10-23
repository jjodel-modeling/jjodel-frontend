# graphVertex F2 and F3: finish Phase 2 in a fresh session (continuation of P-2026-10-21-1950)

Prompt-ID: P-2026-10-22-1325
Chat: C-2026-10-22-1050
Front: graphvertex
Lane: full (continuation; reducer.ts core already committed in 4da12da92, F3 in EditorV2.tsx and PalettePanel.tsx uncommitted)
Depends: P-2026-10-21-1950
Status: da eseguire
Corregge: none
Request: Alfonso, 2026-10-22 13:12, in the project chat: «andiamo avanti» on finishing the 3.2 work; the chat put graphVertex F2/F3 in the release

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 is done (P-2026-10-21-1926 discovery and the 1950 handoff). P8 replaced: the chat runs the visual check after the merge (RC-23).

Worktree: `~/jjodel-w-gvf2`, branch `gv-f2-f3`, at `4da12da92` plus the commit that adds this prompt. Expected `git status --short`: `EditorV2.tsx` and `PalettePanel.tsx` modified, `frontend/src/components/editor-v2/utils/canvasCentre.ts` untracked, the `frontend/node_modules` symlink. Anything else: stop and say so.

Model and tier: as `lane-run start` assigns.

## Lane discipline
Every reply opens with `[P-2026-10-22-1325 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 60 minutes. No subagents, no background tasks. Commit as soon as the gates are green. One probe run per tool call. Read only what the steps below need: the previous two sessions ended on the context ceiling.

## Read first, and only this
`~/.jjodel-lanes/P-2026-10-21-1950/handoff.md` (task, scope, the four unattended decisions to record, evidence, BEFORE probe numbers, the remaining checks in order and the acceptance numbers per probe scene). The diff of the uncommitted F3 work is in `~/.jjodel-lanes/P-2026-10-21-1950/handoff.diff`; compare it with the working tree before you build on it. The original prompt `docs/prompts/claude_2026-10-21_1950_*.md` only for the COSA list and the gates, not its context section.

## COSA
1. Typecheck the F3 edits and fix only what F3 broke.
2. Run the remaining checks in the order the handoff gives, with its acceptance numbers: unit tests of the two new modules, the probe AFTER scenes (card, url, main, bpmn, hull, demo), vitest of the touched folders, build.
3. Commit F3 as `fix(F3)` with the measured numbers in the body.
4. Crops of the AFTER scenes under the lane folder for the chat's visual check.
5. One docs commit: the log entry in `docs/log-inbox/graphvertex.md` with the four unattended decisions of the handoff, the `Status:` lines of P-2026-10-21-1950 and of this prompt, and a ticket line for «the M1 palette does not offer reference-membership children (Task into a BPMN lane)».

## DOVE
The files the handoff lists under Scope, `docs/log-inbox/graphvertex.md`, the 1950 prompt file, this prompt file.

## NON FARE
No change outside the handoff scope; nothing in the critical zone; `reducer.ts` only if a gate shows the committed guard is wrong (then stop with `Outcome: question`). No push, no merge.
