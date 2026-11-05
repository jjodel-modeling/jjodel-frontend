# Textual syntax, editable EBNF literals, lane L1b, continuation 2: finding crops, gates, commit, docs (continues P-2026-11-05-0945, which died in the bridge outage)

Prompt-ID: P-2026-11-05-1415
Chat: C-2026-11-03-1037
Front: codegen
Status: eseguito 2026-11-05 · lane full · c637ebf5f · app probe 23 checks pass; verifica visiva della chat passata 2026-11-05 (RC-23), lane auto (crops l1b-1..11 in ~/.jjodel-lanes/P-2026-11-05-1415/)
Lane: full (continuation; item 1 at a44ff8319, item 2 uncommitted in the tree)
Depends: P-2026-11-05-0945 (died in the bridge outage 10:06-13:55; crops l1b-1..11 in its lane folder), P-2026-11-05-0921 (handoff)
Worktree: ~/jjodel-w-ebnflit, branch textual-ebnf-literals (the same tree)
Request: none (RC-51 continuation; lane auto)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit on top of 5b15dd1f7 and the tree holds only item 2's uncommitted files (ui/SyntaxForm.tsx, ui/TextualTab.scss, ui/TextualTab.tsx, __tests__/ebnfIslands.test.ts); otherwise stop with Outcome: blocked. Same rules as P-2026-11-05-0921. Every reply opens with [P-2026-11-05-1415 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Read ~/.jjodel-lanes/P-2026-11-05-0921/handoff.md (Remaining checks) once; check ~/.jjodel-lanes/P-2026-11-05-0945/ for what that run left (probe output, logs) and do not redo what passed there.

## COSA

(1) Rerun the probe once on a free port so that l1b-6 and l1b-6b show the finding at a literal (wavy marker under the literal, hover with the message); all probe checks pass; crops into ~/.jjodel-lanes/P-2026-11-05-1415/, light theme, scale 1; stop the server. (2) Gates, one tool call each, from frontend/: npm run typecheck; full npx vitest run (3 files red at import are the baseline; harness or order-dependent reds rerun alone); npm run build; npm run check:docs; npm run check:codegen-lazy in both modes. (3) Commit item 2 (the four files) with its red-first evidence in the body. (4) Log entry for 0921, 0945 and this prompt (Notes under 500 characters; Corregge and Causa the dash), Status flips of the three, left uncommitted (RC-17). No push, no merge. Final message: what was verified and how, Decisions taken (unattended), then the Outcome.

## DOVE

As P-2026-11-05-0921.

## RIFERIMENTI

docs/prompts/claude_2026-11-05_0921_prompt_textual_ebnf_literals_l1b.md; ~/.jjodel-lanes/P-2026-11-05-0921/handoff.md.
