# Textual syntax: Cmd+Z after a no-change edit undoes the model (regression of E1b decision 4)

Prompt-ID: P-2026-11-07-0912
Chat: C-2026-11-03-1037
Front: codegen
Status: eseguito 2026-11-07 · lane full · 41c2916de (red), 0272658db · gates green · undo probe B-E PASS, scenario 2 11/11; verifica visiva in attesa del GO (crops 1-3 in ~/.jjodel-lanes/P-2026-11-07-0912/)
Lane: full (Text tab undo routing and tests; app check)
Depends: P-2026-11-07-0510 (E1b, `unchangedAgreement`), P-2026-11-07-0841 (D5 diagnostic that found it), R-TXT-26, R-TXT-54
Worktree: ~/jjodel-w-textundo, branch textual-undo-agreement (from textual-e2a-select e08c85271, so E2a is in; merges after E2a)
Request: none (lane auto; a regression the chat approved unattended in E1b)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No CLAUDE.md 3.1 critical-zone file, no new dependency. Every reply opens with [P-2026-11-07-0912 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call. Test red first, its own commit (RC-51, code first).

## COSA

**The bug** (measured by P-2026-11-07-0841, ~/.jjodel-lanes/P-2026-11-07-0841/diag-undo.mjs and its output; read its log entry in docs/log-inbox/codegen.md on branch textual-d5-format, the `**Ticket**` paragraph): after any edit that changes no meaning (a Format, two typed spaces, a comment), once the pause reads «No change», `unchangedAgreement` (ui/TextualTab.tsx, E1b decision 4) makes that text the agreed text; with the editor on the agreed text the R-TXT-26 key binding sends Cmd+Z to the app's undo, which reverts the previous model change (in the probe, the model creation: the buffer empties, the Ports go from 4 to 0, Redo brings nothing back). Before the pause the editor's undo works.

**Expected**: Cmd+Z after a no-change edit undoes that text edit in the editor (the unformatted text, the spaces removed), whether pressed before or after the pause; the model is untouched. Cmd+Z after a real application still goes to the app's undo (R-TXT-26 unchanged). The E1b scenario 2 must still hold: after a comment-only edit, a canvas rename or delete splices the text and keeps the comments (T10).

(1) **Root cause confirmation**, read-only, in a short paragraph of your final message: the lines of `unchangedAgreement`, `agree`, `updateUndoKey` and the key binding involved.

(2) **The fix**, the smallest one. Recommended direction (take another only with a reason): keep the no-change agreement for T10 (sync.text and printed), but do not hand the undo key to the app for it: the undo key goes to the app only when the agreed text came from an application or a reprint, and stays with the editor after a no-change agreement until the next application or reprint. Tests first, red on HEAD: a no-change agreement leaves the undo routing on the editor; an application still routes to the app; scenario 2's splice still happens after a comment-only edit. Mutation bench on the routing predicate.

(3) **Gates**, one tool call each, from frontend/: npm run typecheck; full npx vitest run (the 3 files red at import are the baseline; harness, timing or order-dependent reds rerun alone and are named); npm run build; npm run check:docs; npm run check:codegen-lazy.

(4) **App check** with real gestures: rerun ~/.jjodel-lanes/P-2026-11-07-0841/diag-undo.mjs (copied into ~/.jjodel-lanes/P-2026-11-07-0912/) for cases A to D; B and C must now bring back the previous text with the Ports intact. Then rerun scenario 2 of ~/.jjodel-lanes/P-2026-11-07-0510/probe.mjs (comment typed, canvas rename, canvas delete; comments kept). Crops, light theme, scale 1: 1-format-undo-after-pause (the unformatted text back, Ports intact), 2-spaces-undo-after-pause, 3-scenario2-after-rename. Stop your server.

(5) **Docs**: log entry in docs/log-inbox/codegen.md via the log-entry skill (Notes under 500 characters, Corregge: the E1b decision 4 undo hand-over, Causa: `unchangedAgreement` + `updateUndoKey` routing Cmd+Z to the app after a no-change edit, Layer Impact Report not-required), Status flip, both left uncommitted (RC-17). No push, no merge. Final message: what was verified and how, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/codegen/textual/ui/TextualTab.tsx, the existing test file that covers `unchangedAgreement` (frontend/src/codegen/textual/__tests__/textReprint.test.ts) or one new test file next to it. Nothing else; ask first.

## RIFERIMENTI

docs/decisions.md R-TXT-26, R-TXT-54; the E1b log entry (P-2026-11-07-0346/0510) and its undo note; ~/.jjodel-lanes/P-2026-11-07-0841/ (diag-undo.mjs, its output, 5-undo.png); ~/.jjodel-lanes/P-2026-11-07-0510/ (probe.mjs, common.mjs).
