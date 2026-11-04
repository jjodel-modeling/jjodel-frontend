# Textual syntax, step C lane C2, discovery: the Syntax mode of the Text tab (T4b), plus three follow-ups

Prompt-ID: P-2026-11-04-2342
Chat: C-2026-11-03-1037
Front: codegen
Status: da eseguire
Lane: full (discovery, read only)
Depends: P-2026-11-04-2321 (core nameless merged, c7cd7e479)
Worktree: ~/jjodel-w-textc2, branch textual-c2-syntax-form, from c09e8f22f
Request: none (R-TXT-40 order and R-TXT-41 D6, Alfonso 2026-11-04 06:52; unattended run, Alfonso asleep since 23:09, «prosegui in autonomia»)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit on top of c09e8f22f and the tree is clean, otherwise stop with Outcome: blocked. Read only: no source file changes; you write the discovery report, throwaway probes in the lane folder, and nothing else. Every reply opens with [P-2026-11-04-2342 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD. Write the report section by section as you go, committing it after each section (RC-51: a ceiling stop keeps what is written).

## COSA

Read once: docs/discovery/discovery_2026-11-04_textual_step_c.md §3 (T4b: F11-F14, §3.2 recommended design) and §8 D6; docs/decisions.md R-TXT-16, R-TXT-23, R-TXT-27, R-TXT-40, R-TXT-41, R-TXT-44..46; frontend/src/codegen/textual/ui/TextualTab.tsx, ui/openTextualTab.tsx (writeTextualSyntax), annotations.ts, styleCheck.ts, syntaxRecord.ts, style.ts.

(1) **The Syntax mode**: a third mode next to Text and EBNF for the metamodel of the open model. For each element kind (class, feature, enumeration, language) the fields the record supports today after C1 and C1d (keyword, layout block/line/positional/call, operator symbol/precedence/assoc/call word, feature keyword identifier or punctuation, per-item keyword, inline, groups of literals, style), their current values read from the record, and which `checkStyle` rule (`StyleRule` and `where`) maps to which field (F12: one fault comes back once per rule; deduplicate). Propose the component tree (ui/SyntaxForm.tsx new) and its state: a draft record, live preview of the EBNF and of the open model's print on every change (F13 measured 3.6 ms at 1,000 objects; re-measure on the current code), Save through writeTextualSyntax as one set_state and one undo step, Save disabled while an error finding exists. Respect the design system of the project (slate #334155, cyan #0ea5e9 accents, 11px secondary labels, 8px grid, Bootstrap Icons only, no layout shifts, progressive disclosure Basic/Advanced): say which fields are Basic and which Advanced, aiming at the lowest cognitive load for a first-time author (R-TXT-44 goal).

(2) **The leftover `{"v":1}`**: switching the style picker back to C-like stores `{"v":1}` instead of removing the key (C3a open point). Root cause with file:line, minimal fix proposal.

(3) **False «the app named»**: after removing a name, when the typed text differs from the print only in layout, the tab reprints and says «the app named 1 object» although the object is nameless (P-2026-11-04-2255, 8b). Root cause in textDiff.ts / TextualTab.tsx with file:line, fix proposal.

(4) **A reference to a nameless target on v2-flow** shows `—`, like an empty slot (P-2026-11-04-2255 crop sD4). Where the chip label is computed (file:line), proposal: label `: <Class>` for a nameless target, as the node header already shows. Say whether this file is a CLAUDE.md §3.1 critical-zone file; if yes, say so and stop that item at the proposal.

(5) **Lane plan**: the implementation lanes (files per lane, order, which produce visual changes and need crops), the decisions the report recommends, numbered D1..Dn with a recommendation each.

Discovery report, mandatory: docs/discovery/discovery_2026-11-05_textual_c2_syntax_form.md (objective, files read with full paths, findings, risks, open questions), committed on the branch, plus the Status flip of this prompt left uncommitted (RC-17). Hard stop after the report. No push, no merge. Public repo: name no partner company. Final message: the findings in short, Decisions D1..Dn with recommendations, then the Outcome.

## DOVE

Read: frontend/src/codegen/textual/ (ui/, annotations.ts, styleCheck.ts, syntaxRecord.ts, style.ts, textDiff.ts), frontend/src/components/editor-v2/ (the chip label of a reference), the project's SCSS design tokens. Write: the report and the lane folder.

## RIFERIMENTI

docs/discovery/discovery_2026-11-04_textual_step_c.md §3, §5, §8; docs/decisions.md R-TXT-40, R-TXT-41, R-TXT-44..46; docs/log-inbox/codegen.md entries of P-2026-11-04-0345/0412 (C3a, the {"v":1} open point) and P-2026-11-04-2321.
