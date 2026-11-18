# Textual syntax, lane E3: the Text tab opens beside the model's canvas

Prompt-ID: P-2026-11-07-1208
Chat: C-2026-11-03-1037
Front: codegen
Status: eseguito 2026-11-07 · lane full · 5dcf50283 · gates green · app check ALL PASS (15/15), crops in ~/.jjodel-lanes/P-2026-11-07-1208/, checked by the session · log entry in docs/log-inbox/codegen.md
Lane: full (open placement, test; app check)
Depends: E1a/E1b, E2a (merged), R-TXT-54 (E9)
Worktree: ~/jjodel-w-texte3, branch textual-e3-beside (from trunk e31ec1d02)
Request: none (lane auto, «Procedi con E e poi F»)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No CLAUDE.md 3.1 critical-zone file, no new dependency. Every reply opens with [P-2026-11-07-1208 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call. Test red first, its own commit (RC-51, code first).

## COSA

Row E3 of docs/discovery/discovery_2026-11-06_textual_e_sync.md §9.1, decision E9 of §9.2 / R-TXT-54, and §6.4 (the canvas must be on screen).

(1) **Placement.** When the Text tab is opened for a model whose canvas is shown, it opens beside that canvas (`dockBeside` / `shownCanvas` from codegen/ui/canvasSelection.ts, read only), so text and canvas are both visible; when no canvas of that model is shown, it opens where it opens today. If the rule can be pure, put it in a small function with a test (red first); otherwise test what can be tested and say why.

(2) **The docked panel is visible.** Lanes E1b, E2a, D4 and #687's probes needed a probe-only CSS rule because PinnableDock hides a panel without a pinnable header, and only generator panels are exempt (TemplateEditorTab.scss:14, per the P-2026-11-07-0346 handoff). Make the Text tab panel visible when docked beside the canvas without that rule. If the fix needs a file outside DOVE (a SCSS file or the dock), name it and stop with Outcome: question before touching it.

(3) **Gates**, one tool call each, from frontend/: npm run typecheck; full npx vitest run (the 3 import reds are the baseline; load reds rerun alone and named); npm run build; npm run check:docs; npm run check:codegen-lazy.

(4) **App check**, real gestures (the picker or the menu that opens the Text tab, a click on the canvas tab), no probe-only CSS: crops light theme scale 1 in ~/.jjodel-lanes/P-2026-11-07-1208/: 1-opened-beside (text and canvas side by side), 2-no-canvas (opened with no canvas shown: today's place), 3-caret-selects (a caret click in the text rings its node: E2a still works in this placement). Stop your server.

(5) **Docs**: log entry in docs/log-inbox/codegen.md via the log-entry skill (Notes under 500 characters, Corregge and Causa the dash, Layer Impact Report not-required), Status flip, both left uncommitted (RC-17). Edit only your new entry's lines. No push, no merge. Final message: what was verified and how, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/codegen/textual/ui/openTextualTab.tsx, one test next to it if the rule is pure. ui/TextualTab.tsx is not touched (another lane holds it). Nothing else; ask first.

## RIFERIMENTI

docs/discovery/discovery_2026-11-06_textual_e_sync.md (§6.4, §7.1 «Open beside the canvas (E9)», §8.3, §9); docs/decisions.md R-TXT-54; ~/.jjodel-lanes/P-2026-11-07-0346/handoff.md (the PinnableDock note); ~/.jjodel-lanes/P-2026-11-07-0510/common.mjs (the probe-only rule, to drop).
