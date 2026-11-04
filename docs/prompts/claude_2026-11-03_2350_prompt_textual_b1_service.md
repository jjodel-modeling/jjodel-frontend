# Textual syntax, step B1: the language service and the Monaco providers

Prompt-ID: P-2026-11-03-2350
Chat: C-2026-11-03-1037
Front: codegen
Status: eseguito 2026-11-04 · lane full · 7cadcae54, 3423b9f1f, fad04693b, 52154bc57 (written by its continuations 0020 and 0046, RC-51) · verifica visiva della chat passata 2026-11-04 (RC-23, crops of P-2026-11-04-0046); GO di Alfonso sulle crop in attesa per il merge
Lane: full (new language service, Monaco adapter, Text tab)
Depends: P-2026-11-03-2300 (design, R-TXT-38), P-2026-11-03-2326 (paste-back fix)
Worktree: ~/jjodel-w-textb, branch textual-b-navigation (the same tree)
Request: none (R-TXT-34 step B, R-TXT-38; EBNF highlighting asked by Alfonso 2026-11-03 14:10)

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply.

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit on top of 92b0ff5ff and the tree is clean, otherwise stop with Outcome: blocked. Do not touch any CLAUDE.md 3.2 file, docs/decisions.md or the core; no new dependency; if the work needs one, stop with Outcome: question. Every reply opens with [P-2026-11-03-2350 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. A question with a recommendation carries one line: Recommended: <one line>. No subagents, no background tasks. Never cat a gate or probe log: summary lines only, through node scripts/run-quiet.mjs LABEL -- CMD. One probe run per tool call; a probe result is valid only if its mtime follows the run. Commit after each numbered item is green, tests red first. Near the context ceiling, commit and write a handoff in the lane folder.

## COSA
Follow the recommended design of docs/discovery/discovery_2026-11-03_textual_language_service.md and R-TXT-38; do not repeat the discovery. This lane is the service and the providers; the outline and breadcrumb components come in the next lane (B2), do not write them.

(i) frontend/src/codegen/textual/languageService.ts, no Monaco import: one analysis per text version from the parser's tree and displayMatch where the text is broken (display only, R-TXT-21 (8)); queries for semantic tokens with roles (keyword, type, name, value, literal, resolved reference, unresolved reference, comment), document symbols with full range and name range, nesting, recovered and unclosed flags, and the `unknown container` group for a broken root; folding ranges from block and list nodes; definition and references from reference leaves and the inverse index; hover with metaclass, feature, multiplicity bounds and documentation. Tests per query on the non-hardware corpus (__tests__/tolerantCorpus.ts), including a broken text. Measured tests: analysis at 1,000 objects under the 50 ms budget together with a parse, figures at 6,000.
(ii) Hover documentation: measure whether the Ecore import keeps the GenModel `documentation` annotation and where it lands; add optional fields to the textual metamodel for documentation and bounds, filled where the data has them, and report with figures what the import drops. No change to the import in this lane.
(iii) frontend/src/codegen/textual/ui/textualMonaco.ts: registers the language `jjodel-textual`, the six providers on the service, a Monarch tokenizer for the EBNF tab, and one theme (light only, D-UI-15) that also carries the JjScript rules, since a Monaco theme is global; wire it in TextualTab.tsx, keeping every existing behaviour; semantic highlighting of the text and syntax highlighting of the EBNF tab. Colours from the design tokens (slate base, cyan accents); no metamodel-specific code anywhere.
(iv) planEdit takes an optional parsed text, and the typing pause reuses the providers' parse.

Mutation bench on the service queries. Gates, one tool call each, from frontend/: npx tsc --noEmit; full npx vitest run (3 files red at import are the baseline; the timing test of tolerant.test.ts (viii) is ticketed as flaky, #205: if it alone fails, rerun it alone and report both figures); npm run build; npm run check:docs; npm run check:codegen-lazy in both modes. In the app, on a free port, keystrokes in the Text tab on demoESM and on a second non-hardware model: highlighting of every role, an unresolved reference shown as such, folding, go to definition (F12), find references (Shift+F12), hover on a class, a feature and a reference, the EBNF tab highlighted, a broken text still highlighted; a JjScript editor open beside the tab keeps its colours. Say which steps are keystrokes and which setup is a direct write. Crops of every visible change, light theme, device scale 1, in ~/.jjodel-lanes/P-2026-11-03-2350/; they go to Alfonso. RISC-V Briefs, read-only: the service answers on them. Log entry in docs/log-inbox/codegen.md (Notes under 500 characters) and Status flip written and left uncommitted until the visual check (RC-17). Stop the probe server.

## NON FARE
No outline or breadcrumb (B2), no completion, quick fixes, rename or formatting (step D), no synced selection (step E), no displayMatch on every keystroke (#203). No push, no merge. The repo is public: name no partner company. Final message: what was verified and how, Decisions taken (unattended), Decisions awaiting Alfonso, then Outcome: hard-stop, or a handoff if the ceiling comes first.
