# Textual syntax, step C lane C2b: the Syntax mode of the Text tab, the form UI

Prompt-ID: P-2026-11-05-0118
Chat: C-2026-11-03-1037
Front: codegen
Status: eseguito 2026-11-05 · lane full · 0d49db028, f243a8152 (stopped at the ceiling, closed by P-2026-11-05-0145, RC-51) · app probe 19 checks pass; verifica visiva in attesa del GO di Alfonso (crops c2b-0..10 in ~/.jjodel-lanes/P-2026-11-05-0118/)
Lane: full (UI of the textual layer, write path through writeTextualSyntax)
Depends: P-2026-11-05-0103 (C2c and C2a merged, a0817b92e), R-TXT-47 (provisional)
Worktree: ~/jjodel-w-textc2, branch textual-c2-syntax-form, at 04ada9f61 (the trunk tip)
Request: none (unattended run; R-TXT-47 D1, D2, D7, D8, D9; Alfonso's GO on the crops is needed before any merge)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit on top of 04ada9f61 and the tree is clean, otherwise stop with Outcome: blocked. No CLAUDE.md 3.2 critical-zone file, no core, no executor, no new dependency. Every reply opens with [P-2026-11-05-0118 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call. Each numbered item: test red first where a test can show it, its own commit as soon as it is green (RC-51: a ceiling stop keeps committed items and a handoff.md). Read docs/discovery/discovery_2026-11-05_textual_c2_syntax_form.md §2.2 and the head of frontend/src/codegen/textual/syntaxForm.ts once, then write code; no reading tour. Before introducing any class name, CSS variable, event name or export, grep frontend/src for it.

## COSA

(1) **The ticket of P-2026-11-05-0036**: a name-keyword collision is shown only at the feature's keyword field, never at the class's name keyword field (styleCheck.ts:103 lists only real features). Make the finding's location include the name keyword field, with the smallest change in styleCheck.ts or in syntaxForm.ts's mapping; test red first.

(2) **The mode**: `TextualMode` gains `'syntax'` (TextualTab.tsx:816), a third entry in `MODES` («Syntax», `bi-sliders`, title «The syntax annotations of the notation»), present only when `writeSyntax` is given; the Text layer stays mounted under it as under EBNF, so a pending edit survives.

(3) **The form**, new ui/SyntaxForm.tsx and ui/SyntaxForm.scss, per the report §2.2: form bar («Unsaved changes» or «Saved», Discard, Save with `bi-check2`, finding count), element list (Language, Classes, Enumerations; filter; a dot in the tab's accent token when annotated, a red mark when a finding maps there), element editor (LanguageFields, ClassFields with one FeatureRow per own feature, EnumFields; each field with an 11 px label, its input, and a fixed 16 px finding line), preview (Text or EBNF, read-only, from `useDeferredValue(draft)`). All logic from syntaxForm.ts; the component holds only state and wiring. Basic and Advanced follow the app's global mode (D2), with «N advanced settings» in Basic when the stored record carries some. Colours only from the tab's existing tokens (`--color-canvas-accent`, `--color-text-tertiary`, `--color-error-text`, the `--space-*` grid), Bootstrap Icons only, no layout shift. Save gates of D1 with their titles; the stored-record-changed bar with Reload, as the Text tab's stale pattern.

(4) **Write and undo**: Save calls writeTextualSyntax (openTextualTab.tsx:55) once, one set_state, one undo step; nothing when the draft equals the stored record; after Save the Text layer reprints through onModelPrint. D9: the tab's bar also shows the de-duplicated `checkStyle` errors of the stored record. Unit tests where the logic sits outside syntaxForm.ts.

(5) **Gates**, one tool call each, from frontend/: npm run typecheck; full npx vitest run (3 files red at import are the baseline; a harness test that times out under load is rerun alone); npm run build; npm run check:docs; npm run check:codegen-lazy in both modes.

(6) **In the app**, on a free port, with the port corpus (copy the probe of ~/.jjodel-lanes/P-2026-11-05-0036/, which suppresses the banner and the What's new 3.1 modal through jjodel_welcome_3_1_1_seen): open the Syntax mode by a real click; in Basic change the Port feature keyword `input` and watch the preview change; switch to Advanced (the global mode, real gesture) and see the Advanced fields; create a fault (two classes with one keyword) and see Save disabled with its title and the finding at the field; Save a valid change, the Text mode prints with it, one Undo restores the record and the print; Discard. Crops of each step in ~/.jjodel-lanes/P-2026-11-05-0118/ (light theme, scale 1), plus one of Text and one of EBNF to show the three-mode bar. Stop the server.

(7) **Docs**: log entry in docs/log-inbox/codegen.md (Notes under 500 characters; Corregge and Causa the dash) and the Status flip of this prompt, left uncommitted (RC-17). No push, no merge. Public repo: name no partner company. Final message: what was verified and how (direct model write is not a gesture; a unit test is not the app check), Decisions taken (unattended), Decisions awaiting Alfonso, then the Outcome.

## DOVE

frontend/src/codegen/textual/ui/SyntaxForm.tsx (new), ui/SyntaxForm.scss (new), ui/TextualTab.tsx, ui/openTextualTab.tsx, syntaxForm.ts, styleCheck.ts (item 1 only), __tests__/ (syntaxForm, styleCheck, textualTab tests). Nothing else; ask first.

## RIFERIMENTI

docs/discovery/discovery_2026-11-05_textual_c2_syntax_form.md §2; docs/decisions.md R-TXT-23, R-TXT-40, R-TXT-41, R-TXT-47; CLAUDE.md design rules (rule 28 on CSS variables); docs/log-inbox/codegen.md entry of P-2026-11-05-0036 (the ticket).
