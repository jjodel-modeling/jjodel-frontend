# Textual syntax, step C lanes C2c and C2a: the false «the app named», the Syntax form's pure module, `{"v":1}` as no record

Prompt-ID: P-2026-11-05-0010
Chat: C-2026-11-03-1037
Front: codegen
Status: da eseguire
Lane: full (write path to a model, textual layer)
Depends: P-2026-11-04-2342 (C2 discovery report, 5c459d039), R-TXT-47 (provisional, trunk)
Worktree: ~/jjodel-w-textc2, branch textual-c2-syntax-form (the same tree)
Request: none (unattended run; R-TXT-47 D3, D4, D10)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No CLAUDE.md 3.2 critical-zone file, no core, no executor, no new dependency. Every reply opens with [P-2026-11-05-0010 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call. Each numbered item: test red first, its own commit as soon as it is green (RC-51). Read the discovery report docs/discovery/discovery_2026-11-05_textual_c2_syntax_form.md §2.2, §3.1, §3.2 and §4 once, then write code; no reading tour.

## COSA

(1) **C2c, D4**: the false «the app named» (report §3.2): at textDiff.ts:559 a removed name still enters `named`; after the application keep only the objects the model actually named (read the model after the run), so `namedReprint` (TextualTab.tsx:1132) reprints only for a real app name. Test red first in __tests__/textualEdit.test.ts: remove a name from a text that differs from the print only by a trailing newline; the status has no «named» sentence and the tab keeps the typed text; the C1e case where the core still names an object keeps the reprint.

(2) **C2a, D3**: in syntaxRecord.ts `syntaxPatch` (:121-124) treat a stored `{"v":1}` as equal to no record, so switching the style back to C-like writes nothing when nothing else differs; keep the contract of :8-9 (an emptied record is written `{"v":1}`, never removed). Test red first in its test file.

(3) **C2a, the pure module of the form**: new frontend/src/codegen/textual/syntaxForm.ts (grep the name first) with the draft model of the report §2.2: the field table by element kind with the Basic and Advanced split of D2, reading the current values from a record, applying a field change to a draft, the de-duplicated `checkStyle` findings mapped to fields (D9: one message per fault at its field), the three Save gates of D1 as a pure function, D7 (annotations of deleted elements dropped with one notice), and the preview (EBNF and the open model's print) computed from a draft. No UI, no React. Tests in __tests__/syntaxForm.test.ts, each red first; a mutation bench on the gates and the de-duplication, red counts in the commit body. The preview at 1,000 objects measured by operation counts or as a median over 15 runs, reported, not asserted as a time bound.

(4) **Gates**, one tool call each, from frontend/: npm run typecheck; full npx vitest run (3 files red at import are the baseline; a harness test that times out under load is rerun alone); npm run build; npm run check:docs; npm run check:codegen-lazy in both modes.

(5) **App check of (1)** only, on a free port, with the port corpus as in ~/.jjodel-lanes/P-2026-11-04-2255/ (copy its probe): remove a name with a trailing newline in the text, the status shows no «named» sentence, one Undo restores; two crops in ~/.jjodel-lanes/P-2026-11-05-0010/, light theme, scale 1, banner suppressed. Stop the server.

(6) **Docs**: log entry in docs/log-inbox/codegen.md (Notes under 500 characters; Corregge `2026-11-04 22:55`; Causa (c)) and the Status flip of this prompt, left uncommitted (RC-17). No push, no merge. Public repo: name no partner company. Final message: what was verified and how, Decisions taken (unattended), Decisions awaiting Alfonso, then the Outcome.

## DOVE

frontend/src/codegen/textual/textDiff.ts, ui/TextualTab.tsx (only the named list of (1)), syntaxRecord.ts, syntaxForm.ts (new), __tests__/textualEdit.test.ts, __tests__/syntaxRecord.test.ts, __tests__/syntaxForm.test.ts (new). No SyntaxForm.tsx in this lane (C2b).

## RIFERIMENTI

docs/discovery/discovery_2026-11-05_textual_c2_syntax_form.md; docs/decisions.md R-TXT-44..47; docs/discovery/discovery_2026-11-04_textual_step_c.md §3.
