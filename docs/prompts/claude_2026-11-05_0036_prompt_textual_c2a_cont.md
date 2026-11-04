# Textual syntax, step C lane C2a, continuation: syntaxForm.ts, gates, app check, docs (continues P-2026-11-05-0010 after the context ceiling)

Prompt-ID: P-2026-11-05-0036
Chat: C-2026-11-03-1037
Front: codegen
Status: da eseguire
Lane: full (continuation; 90720f022 and 6c1a22241 committed, syntaxForm.ts and its test untracked in the tree)
Depends: P-2026-11-05-0010 (hard-stop at the ceiling during item 3; handoff in its lane folder)
Worktree: ~/jjodel-w-textc2, branch textual-c2-syntax-form (the same tree)
Request: none (RC-51 continuation; unattended run)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit on top of 6c1a22241 and the tree holds only the two untracked files frontend/src/codegen/textual/syntaxForm.ts and __tests__/syntaxForm.test.ts (if they are missing, restore them from ~/.jjodel-lanes/P-2026-11-05-0010/handoff.diff); otherwise stop with Outcome: blocked. Same rules as P-2026-11-05-0010. Every reply opens with [P-2026-11-05-0036 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Read ~/.jjodel-lanes/P-2026-11-05-0010/handoff.md once, then act; do not reread the discovery report.

## COSA

Finish items (3) to (6) of P-2026-11-05-0010, in this order, committing each as soon as it is green: (3a) typecheck and the syntaxForm suite after the last edit; replace the weak test «two different faults at one field stay two» with a real case found by a probe, red first against a mutation that merges them; commit syntaxForm.ts and its test. (3b) mutation bench on the Save gates and the de-duplication, red counts in the commit body. (3c) the preview at 1,000 objects, median of 15, reported in the commit body, not asserted. (4) gates, one tool call each, from frontend/: npm run typecheck; full npx vitest run (3 files red at import are the baseline; a harness test that times out under load is rerun alone); npm run build; npm run check:docs; npm run check:codegen-lazy in both modes. (5) app check of the C2c fix (90720f022): remove a name with a trailing newline in the text on the port corpus, copying the probe of ~/.jjodel-lanes/P-2026-11-04-2255/; no «named» sentence, one Undo restores; two crops in ~/.jjodel-lanes/P-2026-11-05-0036/, light theme, scale 1, banner suppressed; stop the server. (6) log entry in docs/log-inbox/codegen.md for P-2026-11-05-0010 and this prompt (Notes under 500 characters; Corregge `2026-11-04 22:55`; Causa (c)), the Status flips of 0010 and this prompt, left uncommitted (RC-17). No push, no merge. Final message: what was verified and how, Decisions taken (unattended), then the Outcome.

## DOVE

As P-2026-11-05-0010: syntaxForm.ts and its test; the probe and crops in the lane folder; docs/log-inbox/codegen.md; the two Status lines.

## RIFERIMENTI

docs/prompts/claude_2026-11-05_0010_prompt_textual_c2c_c2a.md; ~/.jjodel-lanes/P-2026-11-05-0010/handoff.md; docs/decisions.md R-TXT-47.
