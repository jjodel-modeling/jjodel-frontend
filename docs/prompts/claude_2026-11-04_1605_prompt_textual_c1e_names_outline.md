# Textual syntax, step C lane C1e: nameless objects stay nameless, removing a name applies, one outline group per per-item feature (R-TXT-44)

Prompt-ID: P-2026-11-04-1605
Chat: C-2026-11-03-1037
Front: codegen
Status: da eseguire
Lane: full (write path to a model)
Depends: P-2026-11-04-1542 (C1 merged on the trunk, fe6eed263), R-TXT-44 (e38500ec9)
Worktree: ~/jjodel-w-textc1e, branch textual-c1e-names, from e38500ec9
Request: https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH (Alfonso 2026-11-04 15:53, «decidi tu», recorded as R-TXT-44)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit on top of e38500ec9 and the tree is clean, otherwise stop with Outcome: blocked. Do not touch any CLAUDE.md 3.2 file, docs/decisions.md, the core (frontend/src/model/ and what frontend/src/model/CLAUDE.md protects) or the JjScript executor; no new dependency. Every reply opens with [P-2026-11-04-1605 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. No subagents, no background tasks except the foreground probe server. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call, a probe result is valid only if its mtime follows the run. Each numbered item gets its test red first and its own commit as soon as it is green (RC-51: a lane that dies at the ceiling leaves committed items and a handoff.md in its lane folder). Write code from your first tool calls after the reading below; no reading tour.

Read first, once: docs/decisions.md R-TXT-44; the ticket paragraph of the C1d entry in docs/log-inbox/codegen.md (P-2026-11-04-1447); frontend/src/model/CLAUDE.md §3.12 (identity slot and instance name); ~/.jjodel-lanes/P-2026-11-04-1447/probe.mjs (the probe to copy).

## COSA

(1) **Measure, then decide inside R-TXT-44 (1).** In a unit test or a read-only probe step: create from the text a nameless Port and a nameless Ref of the port corpus (`__tests__/portCorpus.ts`), and record which name the app gives them, where it is assigned (file and line, read only), and whether a JjScript `set X.name = ""` (or the unset form the executor has) in the same application leaves the object nameless and survives §3.12. Write the figures in the lane folder as `names-measure.md`.

(2) **Nameless stays nameless** (R-TXT-44 (1)). If (1) shows the clear works: the textual diff appends the clearing line after each create of an object whose text gives no name and whose class has an optional name, in the same application and undo step; a test red first (the stuck sequence of the 1447 ticket: apply, then a second edit, must apply, not refuse with `an update of Conj_3.ops after an object is created in it is not applied yet`). If (1) shows the core refuses or reassigns an empty name: implement the fallback instead, the tab reprints once with the assigned names after the application and the status line says why in one sentence; then the second edit applies on the reprinted text. Either way the tab never keeps a text that differs from the model's print. If neither works without touching the core or the executor, stop with Outcome: question and the figures.

(3) **Removing a name applies** (R-TXT-44 (2)): `output result :` to `output :` clears the name in one application, one Undo restores it, in both styles; `No change` is never the result of an edit that changes the parse. Find why the diff sees no change today (probably the name-absent side is skipped in the comparison of optional attributes), test red first.

(4) **Outline groups** (R-TXT-44 (3)): `textOutline` in languageService.ts shows one group per containment feature, labelled by its per-item keyword, with the item count, as for feature groups today: the port corpus gives `input 2`, `output 1`, not `input 1`, `input 1`, `output 1`. Test in `outline.test.ts`, red first. Breadcrumb unchanged unless the test shows it reads the same groups.

(5) **Mutation bench** on (2), (3), (4), one mutation per new branch, red counts in the commit body; a survivor gets a test.

(6) **Gates**, one tool call each, from frontend/: npx tsc --noEmit; full npx vitest run (3 files red at import are the baseline); npm run build; npm run check:docs; npm run check:codegen-lazy in both modes.

(7) **In the app**, on a free port, with the port corpus imported as the 1447 probe does (direct write for the setup, real keystrokes for the edits): from the nameless text, apply, then change a width, then add a port line, then remove a port's name, in C-like and Pascal/Ada; each applies with one Undo, the tab text always equals the model's print after each application (compare in the probe), never `No change` for a changed parse. One crop of the outline with the merged groups. Crops in ~/.jjodel-lanes/P-2026-11-04-1605/, light theme, scale 1, banner suppressed. Stop the probe server.

(8) **Docs**: log entry in docs/log-inbox/codegen.md (Notes under 500 characters; Corregge `2026-11-04 14:47`, Causa (c)) and the Status flip of this prompt, left uncommitted (RC-17). No push, no merge. Public repo: name no partner company. Final message: what was verified and how (direct model write is not a canvas gesture; a unit test is not the app check), Decisions taken (unattended), Decisions awaiting Alfonso, then the Outcome.

## DOVE

frontend/src/codegen/textual/textDiff.ts, textMatch.ts, textApply.ts, languageService.ts, ui/TextualTab.tsx (only for the fallback of (2): reprint and status line), __tests__/ (nestedDiff, textDiff, textualEdit, outline tests, portCorpus.ts). Not the core, not the executor, not docs/decisions.md.

## RIFERIMENTI

docs/decisions.md R-TXT-44, R-TXT-22 (identity), R-TXT-35 (references), R-TXT-39 (outline); frontend/src/model/CLAUDE.md §3.12; docs/log-inbox/codegen.md entries of P-2026-11-04-1447 and P-2026-11-04-1542; ~/.jjodel-lanes/P-2026-11-04-1447/ (probe, crops, run2-stuck.log).
