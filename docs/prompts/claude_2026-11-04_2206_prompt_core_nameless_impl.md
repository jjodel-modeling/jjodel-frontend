# Core: an object can be nameless (R-TXT-45, R-TXT-46), implementation, variant B and its dependent changes

Prompt-ID: P-2026-11-04-2206
Chat: C-2026-11-03-1037
Front: codegen
Status: eseguito 2026-11-04 · lane full · 8bd59bf94 · items 1-8; smoke run 2, gates and docs completed by P-2026-11-04-2255 after the context ceiling (unattended)
Lane: full (core read path, L-layer; Layer Impact Report in the discovery report §5)
Depends: P-2026-11-04-1632 (discovery and LIR, 6cd4a8b27), the merge of textual-c1e-names (P-2026-11-04-2113), R-TXT-46
Worktree: ~/jjodel-w-nameless, branch core-nameless-identity (it took the trunk after the C1e merge)
Request: https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH (Alfonso 2026-11-04 21:15, «sì» to D1-D10 and the file list, recorded as R-TXT-46)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. Read CLAUDE.md §3.1, §3.2, frontend/src/model/CLAUDE.md §3.12, and the discovery report docs/discovery/discovery_2026-11-04_core_nameless_identity.md §4-§9 once; no other reading tour, code from the next tool calls. No CLAUDE.md 3.2 critical-zone file (useJjomSync.ts, syncState.ts, canvasToJjom.ts, portDistribution.ts, useM1ReferenceEdges.ts, VersionFixer.tsx) and no D-layer write path; if one turns out to be needed, stop with Outcome: question and the Layer Impact Report. No new dependency. Every reply opens with [P-2026-11-04-2206 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call. Each numbered item gets its test red first and its own commit as soon as it is green (RC-51: committed items and a handoff.md survive a ceiling stop).

## COSA

The file list Alfonso confirmed (rule 19): LModelElement.tsx, nameUniqueness.ts, ConformanceValidator.ts, jjomTransformers.ts, IRFormField.tsx, ui/TextualTab.tsx (codegen textual), and their tests. Any other file: stop and ask.

(1) **Variant B (D1)** at the two read sites of the report §4: `LValue.get_values` (EString identity case, about :7786) and `LObject.get_name` (about :6218): a raw first value `''` on the identity slot yields only to `data.name`, never to `initialName`; `[]`, a hole and `null` keep today's fallback (D9). Update the comment at about :6213-6215. (2) **D10**: `set_name('')` on a never-written `[]` slot writes `['']` (about :6527-6533), so a clear from the canvas is nameless too; §3.12 holds (name to slot through the existing write path). (3) **D2**: `checkNameUniqueness` and `detectDuplicateNames` never count `''` as a collision. (4) **D3**: CHECK 12 drops `missing_name` for a nameless object. (5) **D4**: the v2-flow reference resolution (`jjomTransformers.ts:367`, `IRFormField.tsx:147-160`) tests the target's presence, not a truthy name. (6) **D6**: `TextualTab.tsx:180` maps `''` to an unset name, so the Text tab never prints `Port ""`; the C1e reprint stays silent when print equals typed. Land (1)-(6) in this order inside the lane; the gates of item (8) run only on the full set (report §7, partial landing).

(7) **Tests pinning today's fallback** (report §4 and part 4): the ones that turn red on purpose get updated with a line in the commit body saying why; no other test changes. D5 (XMI import echo) and D8 (no migration) are out of this lane.

(8) **Gates**, one tool call each, from frontend/: npm run typecheck (0 errors, §17 baseline); full npx vitest run (3 files red at import are the baseline; a harness test red on a port in use is rerun alone); npm run build; npm run check:docs; npm run check:codegen-lazy in both modes.

(9) **Smoke in the app**, on a free port, the nine scenarios of the report §6 with the port corpus of the codegen tests or a metamodel of the lane's own (no partner metamodel): canvas v2-flow, canvas classic, JjEL, XMI and JSON export, save and reopen with the decompressed state compared, undo and redo, rename after the clear (canvas and JjScript), Text tab in C-like and Pascal/Ada, the never-written control. State for each what was a direct model write and what was a real gesture. Crops in ~/.jjodel-lanes/P-2026-11-04-2206/, light theme, scale 1, banner suppressed. Stop the probe server.

(10) **Docs**: log entries in docs/log-inbox/codegen.md for P-2026-11-04-1632 (the discovery, from its handoff: Outcome partial, ceiling stop after the report; Corregge —; Causa —) and for this lane (Notes under 500 characters; Layer Impact Report: produced, report §5), and the Status flip of this prompt, left uncommitted (RC-17). No push, no merge. Public repo: name no partner company. Final message: what was verified and how, the Layer Impact Report as it held in practice, Decisions taken (unattended), Decisions awaiting Alfonso, then the Outcome.

## DOVE

frontend/src/model/logicWrapper/LModelElement.tsx (the three sites above only); nameUniqueness.ts; ConformanceValidator.ts; frontend/src/components/editor-v2/ jjomTransformers.ts and IRFormField.tsx (the lines above); frontend/src/codegen/textual/ui/TextualTab.tsx (:180); their tests.

## RIFERIMENTI

docs/decisions.md R-TXT-44, R-TXT-45, R-TXT-46; docs/discovery/discovery_2026-11-04_core_nameless_identity.md; CLAUDE.md §3.1, §3.2; frontend/src/model/CLAUDE.md §3.12; ~/.jjodel-lanes/P-2026-11-04-1632/handoff.md.
