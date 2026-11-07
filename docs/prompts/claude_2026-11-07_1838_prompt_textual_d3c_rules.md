# Textual syntax, lane D3c: user validation-rule problems as markers in the Text tab

Prompt-ID: P-2026-11-07-1838
Chat: C-2026-11-03-1037
Front: codegen
Status: da eseguire
Lane: full (pure mapping in conformanceMarks, subscription in the Text tab, tests; app check with crops after a validation run)
Depends: D3b (conformance markers, merged), E2b (merged), R-TXT-53 (D9)
Worktree: ~/jjodel-w-textd3c, branch textual-d3c-rules (from trunk f5fc80aaf, own node_modules)
Request: none (lane auto, «Procedi con E e poi F»)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No core outside frontend/src/codegen/, no new dependency. Critical-zone note (CLAUDE.md §3.1, Rule 20): this lane IMPORTS frontend/src/components/editor-v2/problems/registry.ts (its read side, `subscribe` and `getNodeProblemsSnapshot`) READ ONLY; it must not edit any file under components/editor-v2/problems/ or model/conformance/. If a change there seems needed, stop with Outcome: question and a Recommended line. Every reply opens with [P-2026-11-07-1838 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call; never cat a whole probe or gate log, grep its summary lines. Each item: test red first, its own commit (RC-51, code first). If you near the context ceiling, write ~/.jjodel-lanes/P-2026-11-07-1838/handoff.md (what is committed, what is left, the next command) before anything else.

## COSA

Row D3c of docs/discovery/discovery_2026-11-06_textual_d_writing_aids.md §8, decision D9 (and D8 for the marker shape), designed in §4.1 and §4.2.

(1) **Mapping**, pure, in `conformanceMarks.ts` (D3b's module; extend it, do not fork it): user validation-rule problems of the registry for this tab's model (by `ownerModelId`) to markers on the carried spans, the same way D3b maps conformance violations (object span, or the feature's item node when the problem names a feature). Read first what a validation problem carries (`problems/validationToProblems.ts`, `registry.ts:88-128`) and say in your final message which field gives the object id and whether it is the id the spans carry (measure it, R3 of §9). Tests in `__tests__/conformanceMarks.test.ts`: a rule problem on an object, on a feature, one for an object with no span (nothing), one for another model (nothing).

(2) **In the Text tab** (`ui/TextualTab.tsx`): subscribe to the registry's read side; markers with their own owner (grep the name first), severity warning, source naming the rule's viewpoint or `validation`, never consulted by the apply path (D8). They appear only after the user runs validation (D9: the producer is not reactive) and follow typing through the carried spans; a new run replaces them. Touch only what this needs in that file.

(3) **Gates**, one tool call each, from frontend/: npm run typecheck; full npx vitest run (the 3 import reds are the baseline; load reds rerun alone and named); npm run build; npm run check:docs; npm run check:codegen-lazy.

(4) **App check** with crops in ~/.jjodel-lanes/P-2026-11-07-1838/, reusing the probe of ~/.jjodel-lanes/P-2026-11-07-1736/ (copy it and what it imports) on its own port, on a model with one user validation rule that fails on one object: 1-before-run (no rule marker), 2-after-run (warning on the failing object, hover shows the rule message), 3-after-typing (the marker follows the object after lines are inserted above it), 4-apply (applying the text is not blocked). Measure from Monaco's markers and the DOM, not from the screenshot. If no model in the existing fixtures has a user validation rule and creating one needs more than the app's own gestures, stop with Outcome: question and a Recommended line.

(5) **Docs**: log entry in docs/log-inbox/codegen.md via the log-entry skill (Notes under 500 characters, Corregge and Causa the dash, Layer Impact Report not-required since nothing in §3.1 is edited), Status flip; both left uncommitted (RC-17). Edit only your new entry's lines, never the file as a whole. No push, no merge. Final message: what was verified and how, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/codegen/textual/ui/TextualTab.tsx, conformanceMarks.ts, __tests__/conformanceMarks.test.ts. Read only: frontend/src/components/editor-v2/problems/registry.ts, problems/validationToProblems.ts. Nothing else; ask first. Before a new identifier, grep the codebase for it.

## RIFERIMENTI

docs/discovery/discovery_2026-11-06_textual_d_writing_aids.md (§4.1, §4.2, §8 D8 and D9, §9 R3, R6); docs/decisions.md R-TXT-53; the D3b log entry in docs/log-inbox/codegen.md.
