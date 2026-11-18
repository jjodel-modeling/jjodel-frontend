# Textual syntax T6a, closure (continues P-2026-11-02-2327 after the context ceiling)

Prompt-ID: P-2026-11-02-2355
Chat: C-2026-11-02-1814
Front: codegen
Status: eseguito 2026-11-03 · lane fast · be4a90587 · closure of P-2026-11-02-2327 · verifica visiva non applicabile (no UI) · apply and undo probe in ~/.jjodel-lanes/P-2026-11-02-2355/
Lane: fast (closure of work already written)
Depends: P-2026-11-02-2327 (hard-stop at the ceiling, RC-51; uncommitted work in the tree, handoff in its lane folder)
Worktree: ~/jjodel-w-textt6a, branch textual-t6a (the same tree)
Request: none (RC-51 continuation, no new words from Alfonso)

Before anything else run pwd, git branch --show-current and git status --short; if 2327's changes are not in place (modelLines.ts modified, textMatch.ts, textDiff.ts, textApply.ts, __tests__/textDiff.test.ts untracked), stop with Outcome: blocked. Every reply opens with [P-2026-11-02-2355 · session <id>]. No subagents, no background tasks. Never cat a gate log.

## COSA

Read ~/.jjodel-lanes/P-2026-11-02-2327/handoff.md only; scope and decisions are 2327's prompt and handoff. Do not extend them. In order, committing as soon as a step allows:

1. Fix the test issues of the handoff. Do not weaken a test to make it pass: a wrong expectation is changed only with the reason in the commit body.
2. Mark the printer defect case (single-valued reference to an object outside the text) as an expected refusal: the text does not parse, so the model is not touched. Check that this is what happens, and do not touch printer.ts. Ticket it, citing the one of P-2026-11-02-1942.
3. Gates, one tool call each, from frontend/, through node scripts/run-quiet.mjs LABEL -- CMD: npx tsc --noEmit; npx vitest run src/codegen; npm run build; npm run check:docs; npm run check:codegen-lazy (both modes). Commit feat(codegen): diff an edited text against its model (P-2026-11-02-2327), trailer Model:, staging by name.
4. Mutation bench, stated in a follow-up commit body if it comes after the commit: order-insensitive compare removed; refusal on uncertain removed; default counted as a change; preserved hidden feature cleared; no undo group.
5. The apply on a real project state, undo once, compare the state with the one before, in a test or one probe.

Log entry in docs/log-inbox/codegen.md and the Status: flips of 2327 and this prompt, one docs-only commit. No push, no merge. Final message: Decisions taken (unattended), Decisions awaiting Alfonso, then Outcome:.
