# Textual syntax T4a-1: implement the annotations' grammar part (continues P-2026-11-02-0846)

Prompt-ID: P-2026-11-02-0955
Chat: C-2026-11-01-1713
Front: codegen
Status: da eseguire
Lane: full, Phase 2 (the design is in `~/.jjodel-lanes/P-2026-11-02-0846/handoff.md`)
Depends: P-2026-11-02-0846 (hard-stop at the ceiling after the design, RC-51; nothing written); decisions R-TXT-16..27
Worktree: ~/jjodel-w-textt4, branch textual-t4 (the same tree, at the commit that adds this prompt)
Request: https://claude.ai/code/session_01DQt9R64MscerxeR4VTUREe · Alfonso, 2026-11-02 09:52 «Ok alle raccomandazioni» (R-TXT-27)

Before anything else run `pwd`, `git branch --show-current` and `git status --short`; if the answer is not
`~/jjodel-w-textt4` on `textual-t4` with a clean tree (this prompt aside), stop with `Outcome: blocked`. Every reply
opens with `[P-2026-11-02-0955 · session <id>]`. No subagents, no background tasks. Read only the handoff of 0846,
`docs/decisions.md` R-TXT-21..27 and the files the handoff names. Keep context low: print only what a step needs.

## COSA

Implement the handoff's design for T4a-1, as scoped in the GO of 0846: the annotations as data and their application
in the derivation, printer and parser, with the LL(1) check of the annotated grammar in the style check. The binary
operator is stored and validated, not applied. `blankBeforeContainment` is an optional field of `NotationStyle`. Two
decisions of R-TXT-27 apply: the acceptance fixture declares `Instruction.mnemonic` mandatory (the prototype's metamodel
will be changed to `[1..1]` outside Jjodel); a one-line or positional class whose name attribute is not mandatory makes
the annotation an error. Acceptance read-only: the 16 models in `~/Downloads/micron-proto/out/brief/json/` print as their
`.brief` files (the two comment lines excepted, R-TXT-21 (9)); copy nothing into the repo; report the result. No storage
in `_state`, no wiring, no label (T4a-2), no UI.

## Lane discipline

At most 7 files, all inside `frontend/src/codegen/textual/` and its tests; if more are needed, stop with
`Outcome: question`. `git add <specific files>` only. Commit `feat(codegen): textual syntax annotations, grammar part
(P-2026-11-02-0846)`. Gates: `npx tsc --noEmit`, `npx vitest run src/codegen`, `npm run build`, `npm run check:docs`,
`npm run check:codegen-lazy` (both modes). Visual check not applicable. Log entry in `docs/log-inbox/codegen.md` and
the `Status:` flips of 0846 (`eseguito 2026-11-02 · design, hard-stop, implemented by P-2026-11-02-0955`) and of this
prompt, in one docs-only commit. No push, no merge. End with «Decisions taken (unattended)», «Decisions awaiting
Alfonso», `Outcome: done | hard-stop | question | blocked`.
