# C2g: one label for unnamed reference targets, `Class (unnamed)` everywhere

Prompt-ID: P-2026-11-08-1239
Chat: C-2026-11-03-1037
Front: codegen
Status: eseguito 2026-11-08 · lane full · 05dadce29 · gates green (typecheck 0, build, check:docs, vitest 15344 passed with the 3 baseline import reds, smoke GREEN) · probe 18/18 on 3548, crops in ~/.jjodel-lanes/P-2026-11-08-1239/ · verifica visiva: GO di Alfonso in attesa
Lane: full, critical zone (viewpoint/ir/IRFormField.tsx), go-ahead by Alfonso 2026-11-08 12:26
Depends: C2f (P-2026-11-08-0843, merged 29fcd307f), R-TXT-47 D5 and D6
Worktree: ~/jjodel-w-textc2g, branch textual-c2g-align (from trunk 3d0cc984d, own node_modules)
Request: Alfonso 2026-11-08 12:26: «allinea tutto su `Port (unnamed)` con una lane separata.»

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. Critical zone allowed only for the one line of IRFormField.tsx named below; no other CLAUDE.md 3.1 file, no core, no new dependency. Every reply opens with [P-2026-11-08-1239 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call; never cat a whole probe or gate log, grep its summary lines. Each item: test red first, its own commit (RC-51, code first). If you near the context ceiling, write ~/.jjodel-lanes/P-2026-11-08-1239/handoff.md first.

## COSA

After C2f the IR reference widgets read `Port (unnamed)` (unnamedTargetLabels), while namelessTargetLabel still returns `: Port` for the default view (jjomTransformers.ts:379, R-TXT-47 D5) and the IR chip (IRFormField.tsx:155, D6). One form can show both. Alfonso chose `Port (unnamed)` everywhere.

(0) **Decision row**: add to docs/decisions.md, right after the R-TXT-58 row and touching no other line, a row R-TXT-59 (grep first that the id is free; if taken, use the next free one and say so): «R-TXT-59 (2026-11-08, Alfonso 12:26 «allinea tutto su `Port (unnamed)` con una lane separata», evidence: measured in C2f, reversible: branch). Amends R-TXT-47 D5 and D6: a nameless reference target reads `<Class> (unnamed)` on the default view, the IR chip, the IR reference field, list and picker; an index `<Class> (unnamed) 2`, ... only where two would read the same in one list (C2f). Replaces `: <Class>`.» Keep the wording in English, and the style of the rows around it. Commit it first, with the LIR of (1).

(1) **Layer Impact Report** in docs/discovery/lir_2026-11-08_c2g_unnamed_label_align.md, short: the two call sites, what each renders, who reads the string (grep for `: ` label consumers, tests, probes, snapshots, JjEL or export code that may parse it), and the risk.

(2) **Code**: namelessTargetLabel returns `<Class> (unnamed)` instead of `: <Class>`; check whether unnamedTargetLabels can then reuse it so the two cannot drift (no rename of exports). The call sites at jjomTransformers.ts:379 and IRFormField.tsx:155 are unchanged if the function's contract (string or undefined) holds; touch them only if needed and say why. Update the committed tests that pin `: Port` to the new label, red first.

(3) **Gates**, one tool call each, from frontend/: npm run typecheck; full npx vitest run (the 3 import reds are the baseline; load reds rerun alone and named); npm run build; npm run check:docs; npm run smoke if the script exists.

(4) **App check** with crops in ~/.jjodel-lanes/P-2026-11-08-1239/, reusing the C2f probe of ~/.jjodel-lanes/P-2026-11-08-0843/ (copy it and what it imports) on its own port: 1-chip (the IR chip of an unnamed target reads `Port (unnamed)`), 2-default-view (the default view's reference label reads `Port (unnamed)`), 3-same-form (chips and widgets in one form read the same). Measure from the DOM.

(5) **Docs**: log entry in docs/log-inbox/codegen.md via the log-entry skill (Notes under 500 characters, Corregge and Causa the dash, Layer Impact Report the LIR path), Status flip; both left uncommitted (RC-17). Edit only your new entry's lines. No push, no merge. Final message: what was verified and how, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/components/editor-v2/utils/namelessTargetLabel.ts and its tests; the tests that pin `: <Class>` (grep); frontend/src/components/editor-v2/viewpoint/ir/IRFormField.tsx:155 and jjomTransformers.ts:379 only if needed; docs/decisions.md (the new row only); the LIR. Nothing else; ask first.

## RIFERIMENTI

docs/decisions.md R-TXT-47; docs/discovery/lir_2026-11-08_nameless_reference_labels.md (C2f); the C2f entries in docs/log-inbox/codegen.md; ~/.jjodel-lanes/P-2026-11-08-0843/handoff.md.
