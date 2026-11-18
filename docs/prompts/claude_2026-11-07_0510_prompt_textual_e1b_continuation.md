# Textual syntax, lane E1b continuation: the agreement on a comment-only edit, gates, app check of scenario 2

Prompt-ID: P-2026-11-07-0510
Chat: C-2026-11-03-1037
Front: codegen
Status: eseguito 2026-11-07 · lane full · 40b7be107 (code, bench 3/3 killed) · gates green · app check 11/11 PASS, crops in ~/.jjodel-lanes/P-2026-11-07-0510/, checked by the chat · log entry in docs/log-inbox/codegen.md
Lane: full (Text tab and its test; app check)
Depends: P-2026-11-07-0346 (E1b, stopped at the soft ceiling; code commit 0be037a6f), R-TXT-54
Worktree: ~/jjodel-w-texte1, branch textual-e1-reprint
Request: none (lane auto, «Procedi con E e poi F»)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No CLAUDE.md 3.1 critical-zone file, no core outside frontend/src/codegen/textual/, no new dependency. Every reply opens with [P-2026-11-07-0510 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call. Test red first, its own commit (RC-51, code first).

## COSA

Finish E1b from its handoff, ~/.jjodel-lanes/P-2026-11-07-0346/handoff.md (read it whole first; its decisions 1 to 4 stand).

(1) **Decision 4, approved by the chat.** Apply ~/.jjodel-lanes/P-2026-11-07-0346/handoff.diff (`git apply`): the 2 tests for `unchangedAgreement`, which must fail first. Then implement the pure `unchangedAgreement(d, text, print, base)` before `EditEvidence` in TextualTab.tsx, and the `readEdit` lines exactly as the handoff gives them. Targeted test green; a mutation bench (no agreement on `unchanged`; every decision agrees) with mutants killed listed in the commit body; typecheck; a commit of its own. The undo change (after a comment-only edit Cmd+Z becomes the app's undo, as after an application) is accepted: report it in the log entry.

(2) **Gates** on the tip, one tool call each, from frontend/: npm run typecheck; full npx vitest run (the 3 files red at import are the baseline; harness, timing or order-dependent reds rerun alone and are named); npm run build; npm run check:docs; npm run check:codegen-lazy.

(3) **App check**, scenario 2 by canvas gestures. Reuse ~/.jjodel-lanes/P-2026-11-07-0346/{common.mjs,probe.mjs}, copied into ~/.jjodel-lanes/P-2026-11-07-0510/. Fix the object count with `LPointerTargetable.fromPointer(m1).allSubObjects.length`. The probe-only CSS rule that shows the docked Text panel stays in the probe; no product change for it (lane E3 owns the placement). Expected: every check passes; after the rename T2 equals T1 with push replaced by press; after the delete the `// to the end` block and the ts Transition are gone and both other comments are kept. Crops, light theme, scale 1, in ~/.jjodel-lanes/P-2026-11-07-0510/: 1-before, 2-row-in-edit, 3-after-rename, 4-after-delete. First stop any server left on port 3546 (`lsof -ti tcp:3546 | xargs kill`); stop your own server at the end.

(4) **Docs**: one log entry in docs/log-inbox/codegen.md via the log-entry skill covering E1b (P-2026-11-07-0346) and this continuation: Notes under 500 characters, Corregge and Causa the dash, Layer Impact Report not-required; mention the probe-only CSS and the undo change. Flip the Status of both prompt files (0346 and this one). Leave all of it uncommitted (RC-17). No push, no merge. Final message: what was verified and how, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/codegen/textual/ui/TextualTab.tsx, frontend/src/codegen/textual/__tests__/textReprint.test.ts. textReprint.ts stays untouched. Nothing else; ask first. Before a new identifier, grep the codebase for it.

## COME

Follow the handoff's decisions and code shapes; no redesign. If a needed change falls outside DOVE, stop with Outcome: question.

## RIFERIMENTI

~/.jjodel-lanes/P-2026-11-07-0346/handoff.md and handoff.diff; docs/discovery/discovery_2026-11-06_textual_e_sync.md (E1b row, scenario 2, T10); docs/decisions.md R-TXT-54.
