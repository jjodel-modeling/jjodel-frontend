# Notices and tips, Phase 2 closure (continuation of P-2026-11-08-2340)

Prompt-ID: P-2026-11-09-0036
Chat: C-2026-11-08-2220
Front: maintenance
Request: https://claude.ai/code/session_01DQt9R57EjNuookGRd8rukw (continuation after the context ceiling of P-2026-11-08-2340)
Lane: full (continuation; gates and closure only)
Status: eseguito 2026-11-09 · lane notices · 45d3b1794 · verifica visiva passata 2026-11-09 (chat crops; GO Alfonso 09:27)

Protocollo: docs/PROTOCOL.md: clausole P1..P16 applicabili.

Worktree: `~/jjodel-w-notices`, branch `notices-discovery`, HEAD is the commit that adds this file, parent
`633351f8f`. Check `pwd`, branch, `git log -2`, `git status` first; otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply opens with `[P-2026-11-09-0036 · session <id>]`; every final message ends with `Outcome: ...`; every
question with a recommendation carries `Recommended: <one line>`. Context discipline: never `cat` a log or a test
output; grep the summary and failure lines only. Run gates in the foreground.

## Contesto (non rifare l'analisi)

Read `~/.jjodel-lanes/P-2026-11-08-2340/handoff.md` (grep its headings first). Items 1-7 of
`docs/prompts/claude_2026-11-08_2340_prompt_notices_tips_phase2.md` are committed (`dbc981491`..`e0ecdfffa`, fix
`633351f8f`); the visual probe passed 70 of 70; typecheck 0, build ok. Vitest after the change: 6 failed files against
3 at baseline. The three new ones: `src/codegen/textual/__tests__/languageService.test.ts` (a "measured, 1,000
objects" timing test), `src/components/editor-v2/nodes/__tests__/irCollapsedRender.test.ts`,
`src/components/editor-v2/nodes/__tests__/irSelectionRing.test.ts`. The load average was above 60 during that run.

## COSA

1. **Explain the three failures.** Run each file alone, then each twice more; record pass or fail and the failing
   assertion line. If a file fails alone, check whether it fails on `4e200c093` too (a temporary `git worktree add`
   in `/tmp`, removed after; no edits there). A failure that also exists before this lane, or passes alone, is not
   this lane's: say which, with the evidence. A failure caused by this lane is fixed here, with a test.
2. **Smoke and docs gate.** `npm run smoke`, then `npm run check:docs`.
3. **Stale probe.** `frontend/scripts/probe/library-gallery-clone.ts:120-121` closes the old `.is-tip` card: point it
   at the new tips card close control. Scripts commit alone.
4. **Tickets** with `lane-run ticket --front maintenance --priority low`: (a) the donation banner ignores the right
   rail and covers it in the editor; (b) `.notification-header` is global and also styles
   `.jjscript-success-notification .notification-header`; (c) in the editor the Properties overlay covers the Help menu
   below y=91, so its items cannot be clicked while the right panel is open (found by P-2026-11-08-2340).
5. **Closing entry** for P-2026-11-08-2340 and this lane in `docs/log-inbox/notices.md` (P9), `Smoke visivo` pending
   until the chat's crop check, and the `Status` flip of both prompts (RC-17 rules for a pending visual check). Docs
   commit alone. Delete the two gitignored `_tmp_` probe files.

## HARD STOP

After item 5: `Outcome: hard-stop` with the gate table. No merge, no push.

## RIFERIMENTI

`docs/prompts/claude_2026-11-08_2340_prompt_notices_tips_phase2.md`; `~/.jjodel-lanes/P-2026-11-08-2340/handoff.md`;
`docs/PROTOCOL.md` P8, P9, P13, P16.
