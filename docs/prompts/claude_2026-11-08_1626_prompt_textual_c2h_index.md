# C2h: an index on unnamed homonym labels on IR chips and the default view, and the stale comments

Prompt-ID: P-2026-11-08-1626
Chat: C-2026-11-03-1037
Front: codegen
Status: da eseguire
Lane: full, critical zone (viewpoint/ir/IRFormField.tsx), go-ahead by Alfonso 2026-11-08 16:23 «procedi in lane auto» on the candidate tickets listed to him, this one included
Depends: C2f (29fcd307f), C2g (ae7a149aa), R-TXT-59
Worktree: ~/jjodel-w-textc2h, branch textual-c2h-index (from trunk f081ad4f2, own node_modules)
Request: as above

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. Critical zone allowed only in frontend/src/components/editor-v2/viewpoint/ir/IRFormField.tsx around :150-160 (the chip label and its comment); no other CLAUDE.md 3.1 file, no core, no new dependency. Every reply opens with [P-2026-11-08-1626 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call; never cat a whole log. Each item: test red first, its own commit (RC-51, code first). If you near the context ceiling, write ~/.jjodel-lanes/P-2026-11-08-1626/handoff.md first.

## COSA

After C2g, the IR reference list numbers unnamed homonyms (Port (unnamed), Port (unnamed) 2), but the IR chips (IRFormField.tsx:155) and the default view labels (jjomTransformers.ts:379) call namelessTargetLabel one target at a time, so two different unnamed Ports both read Port (unnamed). R-TXT-59 says the index appears where two would read the same in one list.

(0) **Layer Impact Report** in docs/discovery/lir_2026-11-08_c2h_unnamed_index.md, short, committed first: what one list means at each site (the chips of one reference field; the reference labels of one default-view node, or of one edge set: read and decide, say which), who reads the strings, risk.

(1) **Chips**: the chips of one multi-valued reference field use unnamedTargetLabels (the C2g helper) over the field's values, so homonyms get 2, 3 in value order. Single chips unchanged.

(2) **Default view**: the same for the labels jjomTransformers.ts:379 builds, over the values of one reference of one object. If the unit of a list there is not clear from the code, stop this item with Outcome: question and a Recommended line, and finish the others.

(3) **Stale comments**: jjomTransformers.ts:369 and IRFormField.tsx:153-154 still describe the label as `: <Class>`; update them to `<Class> (unnamed)` (English, one line each).

(4) **Tests**, red first: two unnamed Ports in one field read 1 and 2 on chips and default view; one unnamed target reads without index; named targets unchanged.

(5) **Gates**, one tool call each, from frontend/: npm run typecheck; full npx vitest run (3 import reds baseline; load reds rerun alone and named); npm run build; npm run check:docs; npm run smoke if the script exists.

(6) **App check** with crops in ~/.jjodel-lanes/P-2026-11-08-1626/, reusing the C2g probe of ~/.jjodel-lanes/P-2026-11-08-1239/ (copied) on its own port: 1-chips (two unnamed Ports on the chips of one field read Port (unnamed) and Port (unnamed) 2), 2-default-view (the same on the default view). Measure from the DOM.

(7) **Docs**: log entry in docs/log-inbox/codegen.md via the log-entry skill (Notes under 500 characters, Corregge and Causa the dash, Layer Impact Report the LIR path), Status flip; both left uncommitted (RC-17). Edit only your new entry's lines. No push, no merge. Final message: what was verified and how, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/components/editor-v2/viewpoint/ir/IRFormField.tsx (around :150-160 only), frontend/src/components/editor-v2/utils/jjomTransformers.ts (around :369-385 only), editor-v2/utils/namelessTargetLabel.ts only if a helper is missing, their tests; the LIR. Nothing else; ask first.

## RIFERIMENTI

docs/decisions.md R-TXT-47, R-TXT-59; docs/discovery/lir_2026-11-08_c2g_unnamed_label_align.md; the C2f and C2g entries in docs/log-inbox/codegen.md.
