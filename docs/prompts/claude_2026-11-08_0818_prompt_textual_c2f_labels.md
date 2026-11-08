# Textual syntax, ticket C2f: unnamed targets in the Syntax form's reference fields

Prompt-ID: P-2026-11-08-0818
Chat: C-2026-11-03-1037
Front: codegen
Status: da eseguire
Lane: fast (Syntax form reference field labels; crops)
Worktree: ~/jjodel-w-textc2f, branch textual-c2f-labels (from trunk f4dc218c3, own node_modules)
Request: Alfonso 2026-11-08 07:36 «Procedi con tutto in lane auto»

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No CLAUDE.md 3.1 critical-zone file, no core outside frontend/src/codegen/, no new dependency. Every reply opens with [P-2026-11-08-0818 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD.

## COSA

Ticket C2f (found in step C, lane C2e, 2026-11-06): in the Syntax form, an editable reference field whose target has no name shows an empty label, and its dropdown lists the target by its internal id. First reproduce and measure it from the DOM (the field's label text and the option texts for one unnamed target), and find where the label is computed (read docs/discovery/discovery_2026-11-05_textual_c2_syntax_form.md and the C2e log entry). Fix: an unnamed target reads the same way the Text tab names unnamed objects (for example its class plus (unnamed), as the confirm panel does), with an index only if two unnamed targets of one class would read the same; never the raw id. Add a unit test where the label function is pure, else say why. Acceptance: no empty label and no raw id in the field or the list, measured. Crops in ~/.jjodel-lanes/P-2026-11-08-0818/: 1-before, 2-after (same field, list open), reusing a probe of the Syntax form if one exists in ~/.jjodel-lanes (grep for C2e), else the probe of ~/.jjodel-lanes/P-2026-11-08-0739/, on its own port. Gates: npm run typecheck, npm run build, npm run check:docs, npx vitest run src/codegen. Log entry in docs/log-inbox/codegen.md via the log-entry skill (Notes under 500 characters), Status flip, both uncommitted (RC-17); edit only your entry's lines. No push, no merge.

## DOVE

The Syntax form's reference field component and, if separate, the pure label function, under frontend/src/codegen/. Name the files in your first reply; ask before touching anything else. Grep before any new identifier.

## RIFERIMENTI

docs/discovery/discovery_2026-11-05_textual_c2_syntax_form.md; the C2e log entry in docs/log-inbox/codegen.md.
